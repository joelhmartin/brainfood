# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Brain Food Recovery Services — a marketing site plus an admin dashboard. Next.js 15 App Router, React 18, JavaScript (not TypeScript), Tailwind, Supabase, deployed on Vercel.

---

## ⛔ THE SITE IS LIVE AND INDEXED — READ BEFORE CHANGING URLS OR SEO SETTINGS

**Cutover is done.** This section used to describe a pre-launch site wired to temporary
sandbox values; that is no longer true, and treating it as true leads to exactly the wrong
call (assuming nothing is indexed yet, so URL churn is free). Verified live on 2026-08-10:

| Thing | Live value |
| --- | --- |
| `siteUrl` (`site_settings`) | `https://www.bfrecovery.com` |
| `seoIndexable` | **`true`** — pages serve `index, follow, max-image-preview:large` |
| `/sitemap.xml` | populated (not `[]`) |
| `MAILGUN_DOMAIN` | `mg.bfrecovery.com` (real, DNS-verified — not the old sandbox) |
| `CONTACT_RECIPIENT` | `webforms@bfrecovery.com` |

Check the live values rather than trusting this table if something looks off — they live in
the `site_settings` row and in Vercel's per-environment env, not in code. `.env.local` and
Vercel are separate: updating one does not update the other.

What this means for day-to-day work:

- **URLs are load-bearing for real now.** Changing or deleting a public path forfeits accrued
  ranking and produces live 404s. Treat it as a product decision, not a refactor.
- **`seoIndexable` is the master switch and it is ON.** Turning it off blanks the sitemap,
  emits `noindex, nofollow` sitewide, and suppresses all JSON-LD. Never flip it as a side
  effect of other work.
- **`siteUrl` must stay set.** `app/sitemap.js` skips the sitemap when either it or
  `seoIndexable` is missing, so a half-configured site never publishes empty-origin URLs.
- **Supabase Auth redirect URLs** must keep including the live domain, or password-reset and
  invite links point at the wrong host.
- Mail: `From` is always the business, with the visitor in `Reply-To` — a visitor address in
  `From` fails SPF and lands in spam.

`README-ADMIN.md` has the longer-form runbook; parts of it describe the same pre-launch state
this section used to and are stale in the same way.

### Public routes come from a registry, not from hand-written lists

`src/config/routes.js` is the single source of truth for every public URL. Three things
consume it and must agree: `app/sitemap.js` (XML), `app/(marketing)/sitemap` (the HTML
sitemap), and `scripts/verify-routes.mjs`. `src/config/routes.test.js` walks the real `app/`
directory and **fails the build if the registry and the filesystem disagree in either
direction** — an unregistered route, or a registered route with no page.

So: **adding a public route means adding it to `src/config/routes.js`.** The test will tell
you if you forget. Do not weaken that assertion to make a build pass. (The same file also
holds the `ROUTES` constants for the private dashboard/auth paths — those are asserted to
stay *out* of the public set.)

A filesystem scan at runtime is not an option and was rejected deliberately: Next traces only
the modules a route imports into the serverless bundle, so `app/` source is absent in
production. A scan would return an empty sitemap on Vercel while looking correct in dev.

---

## Commands

```bash
npm run dev              # Next dev server
npm run build            # production build
npm start                # serve the production build
npm test                 # Vitest, whole suite
npm run verify:routes    # asserts every route serves real HTML (needs a running server)
npm run db:start         # local Supabase
npm run db:reset         # reset local DB + reseed
npm run seed             # seed content into whatever .env.local points at
npm run create-admin -- <email> [password]   # mints the first admin; prints the password once
```

Single test file / single test:

```bash
npx vitest run src/lib/content.server.test.js
npx vitest run src/lib/seo.test.js -t "omits a blank phone"
```

**Port note for this machine:** 3000/3001 are usually occupied by other projects, and
`localhost` resolves to `::1` first. Use `127.0.0.1` with an explicit port (`PORT=3057 npm run dev`).
Before diagnosing a "stale config" bug, check for **more than one server bound to the port**
(`lsof -ti :3057`) — a leftover server serving old env has caused real confusion here.

---

## Architecture

### Rendering — why this project exists in its current form

The site was a Vite SPA that shipped an empty `<div id="root">`, so crawlers that do not run
JavaScript (Facebook, LinkedIn, Slack, iMessage, most LLM crawlers) saw a blank page. A
hand-rolled `scripts/prerender.mjs` drove a headless Playwright Chromium at build time to
snapshot every route. **That could not run in Vercel's cloud build** (Amazon Linux; Chromium
fails on a missing `libnspr4.so`), which broke deploys and meant publishing could never refresh
the static HTML.

It was migrated to Next.js, which renders server-side natively. Consequences worth knowing:

- **No browser is involved anywhere.** Playwright has been removed from this repo entirely —
  build, tests, and tooling. If you ever see Playwright or Chromium in build output,
  something has regressed. Coverage comes from Vitest plus `npm run verify:routes`, which
  asserts every route serves populated HTML with correct per-route metadata.
- Marketing routes are Server Components using **ISR** (`export const revalidate = 3600`)
  with `generateStaticParams`.
- Publishing calls `revalidatePath` through `POST /api/revalidate` — **not** a rebuild. The
  old deploy-hook rebuild is gone.

### Route groups (`app/`)

- `(marketing)` — public, server-rendered, ISR. Home, about, services (+ `/[slug]`), contact,
  sitemap, blog + events (each with `/page/[page]` pagination and `/[slug]` detail).
  There is no `/products`, `/about/team`, or `/resources/*`: those were leftovers from a
  different project's build (a dental-orthotics catalog, wrong company name in the copy,
  referencing images and 3D models that are not in `public/`) and were deleted.
- `(auth)` — login, forgot/reset password, accept invite. Client-rendered, `noindex` set on
  the group layout.
- `app/app/*` — the dashboard. Client-rendered behind `RequireAuth`, `noindex`.
- `app/api/*` — route handlers (`contact`, `revalidate`, `users`).

Page **components** live in `src/screens/` (marketing / auth / app), and the files under
`app/` are thin Server Components that supply metadata and data. **`src/screens/` is named
that deliberately** — Next treats a `src/pages/` directory as the legacy Pages Router and
will try to route it, breaking the build. Do not rename it back.

### Data flow

- **Public pages** read via `src/lib/content.server.js` (`getSettings`, `getPosts`,
  `getPostBySlug`, `getEvents`, `getEventBySlug`) using a **server-side anon-key** client, so
  Row Level Security still governs visibility and drafts cannot leak into rendered HTML.
  Every function degrades to `FALLBACK_SETTINGS` / `[]` / `null` rather than throwing — an
  unreachable database renders an empty site instead of failing the build.
- **Dashboard** reads/writes client-side through Zustand stores (`src/stores/`). Saving
  content calls `revalidateContent()` in `src/lib/adminApi.js` (fire-and-forget — a failed
  revalidate must never fail a save that already succeeded).
- `src/lib/mappers.js` translates snake_case Postgres rows to the camelCase shapes components
  consume. **Always map rows through it** — spreading a raw row over a camelCase default
  silently drops every field.

### Article bodies

`posts.body` / `events.body` store **HTML** — what the dashboard's `HtmlEditor` edits and what
its snippet dropdown inserts. Bodies were originally authored in a "markdown-lite" dialect
(`## `, `### `, `- `, `**bold**`); every row and every seed body was converted to HTML by
`scripts/migrate-legacy-bodies.mjs`, which is idempotent and safe to re-run.

`ArticleBody` still falls back to `legacyToHtml()` when a body contains no tag, so any
markdown-lite that reappears keeps rendering. **Do not rely on that fallback for new content.**
It picks one path for the *whole* body, so a legacy body that gains a single tag — one snippet
insert — silently drops back to literal `## ` and `- ` text for everything else. Anything that
writes bodies (a seed, an import, a fixture) must write HTML.

### SEO

`src/lib/metadata.js` builds Next `Metadata` objects; `src/lib/seo.js` holds pure JSON-LD
builders (`organizationSchema`, `blogPostingSchema`, `eventSchema`, `breadcrumbSchema`).

**`<JsonLd>` does not self-suppress.** Every render site must be gated on
`settings.seoIndexable`, or structured data describes a staging URL as the real business
listing. Follow the existing pattern in `app/(marketing)/blog/[slug]/page.jsx`.

### Auth & permissions

Client-side by design: the Supabase session lives in localStorage and `src/guards/RequireAuth.jsx`
gates `/app`. There is no middleware and no cookie/SSR auth.

Server-side authorization lives in `src/lib/api/auth.js` (`requirePermission`, `adminClient`).
It holds the **service-role key**, so it carries `import "server-only"` — never import it from a
client component. The role is read from the `profiles` table, **never from the JWT**, because a
token carries whatever metadata the user last set on themselves. There is one role (`admin`)
holding every permission in `src/config/roles.js`.

Post-login redirects pass through `safeRedirectPath()` in `src/components/auth/LoginForm.jsx`,
which rejects absolute URLs, protocol-relative `//host`, backslash variants, and `javascript:`.
**Do not loosen it** — it closes a real open-redirect.

### Email

`src/lib/email/mailgun.js` is the transport (`server-only`). `src/lib/email/templates.js` is
the **single source of truth for all email presentation** — both the admin notification and
the customer auto-reply are built from one shared `layout()`, so a brand change is a one-place
edit. Brand values come from `src/config/site.js` / `src/config/brand.js`; do not hardcode them.
HTML email needs table-based layout and inline styles (Tailwind does not survive mail clients),
and every message ships a plain-text alternative.

`POST /api/contact` is **public and unauthenticated**. It validates with `contactSchema`,
silently 200s on a filled `company` honeypot (telling a bot it failed teaches it to adapt), and
rate-limits per IP using `x-vercel-forwarded-for` / `x-real-ip` — **never the client-supplied
end of `x-forwarded-for`**, which is spoofable and would make the limiter a no-op.

**A failed send must return 500, never a 200.** The bug this feature fixed was forms that faked
success on a timer and discarded submissions. Any code path that reports success without a
confirmed send reintroduces it.

### Configuration

`src/config/site.js` is the single source of truth for business info, contact details, socials,
content URL structure (`CONTENT.blog` / `CONTENT.events`: prefixes, pagination, per-page), SEO
defaults, and `FALLBACK_SETTINGS`. Live values are edited in the dashboard and stored in the
`site_settings` table; `FALLBACK_SETTINGS` is the compiled-in fallback used before that resolves
or when the database is unreachable.

Blank values in `FALLBACK_SETTINGS` are blank **on purpose** — the phone number is a 555
placeholder. Structured data omits empty fields, and publishing a fake phone number in
`LocalBusiness` schema creates NAP inconsistency that actively hurts local search.

---

## Testing

- **Vitest** covers `src/lib`, `src/config`, and the API route handlers.
- **`tests/rls.test.js` is destructive** — it creates and deletes users and events. It is pinned
  to local Supabase via `.env.test.local` (Vite's `loadEnv` gives `.env.test.local` priority over
  `.env.local` for `mode=test`). **Never let it run against the hosted database.** If you
  repoint `.env.local`, verify the RLS suite still targets `127.0.0.1` before running it.
- **`npm run verify:routes`** asserts every route serves populated HTML with real per-route
  metadata — the guarantee the deleted prerender script used to provide. Run it against a
  production build (`npm run build && npm start`), not dev.
  It builds its route list from the registry plus the links on the live `/sitemap` page, so
  content published since the last edit is covered without touching the script. It does not
  hardcode whether the site should be indexable: it reads the homepage's robots directive and
  asserts every other route **agrees** with it, because a half-indexable site is the actual
  bug worth catching.
- The repo has **no React Testing Library**. The established pattern for testable UI logic is to
  extract a pure function and unit-test that — see `paginateEvents` (`src/screens/marketing/Events.jsx`),
  `safeRedirectPath`, and `buildLoginRedirectUrl` (`src/guards/RequireAuth.jsx`).

---

## Conventions

- **JavaScript only** (`.js` / `.jsx`). Adding TypeScript is a deliberate, separate decision.
- Route files under `app/` stay thin Server Components; markup and animation live in
  `src/screens/`. Anything using GSAP, refs, browser APIs, or state needs `"use client"`.
- Pagination math in a screen component and the matching `generateStaticParams` in its route
  **must agree on the same total-pages basis**, or the build mints orphaned or duplicate
  paginated URLs.
- **URLs are load-bearing.** Changing a public path forfeits accrued SEO value; treat any URL
  change as a product decision, not a refactor.
