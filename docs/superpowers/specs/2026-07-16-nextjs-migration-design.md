# Next.js Migration — Design

**Date:** 2026-07-16
**Status:** Approved for planning

## Why

The site is a Vite + React SPA (`react-router-dom`, `createRoot`). An SPA ships an empty
`<div id="root">`, so crawlers that do not execute JavaScript — Facebook, LinkedIn, Slack,
iMessage, X, and most AI/LLM crawlers — receive a blank page. Every shared link produces an
empty preview card.

To patch this, the repo hand-rolled `scripts/prerender.mjs`: it launches a real headless
Chromium via Playwright at build time, loads all 19 routes, waits for a `data-prerender-ready`
signal, and writes the rendered DOM back to disk.

That patch has now failed in three ways:

1. **Cloud builds are broken.** Vercel's build image is Amazon Linux. Playwright's Chromium
   downloads but cannot launch (`libnspr4.so: cannot open shared object file`). `--with-deps`
   cannot fix it — it uses `apt`, which Amazon Linux does not have. Deploys must be prebuilt
   locally (`vercel build && vercel deploy --prebuilt`).
2. **Publishing is broken.** `api/rebuild.js` fires a Vercel deploy hook to re-prerender after
   a post is published. That hook triggers a *cloud* build — the build that now fails. So
   publishing cannot refresh the static HTML at all.
3. **It is non-standard.** The technique (drive a browser, save the HTML) is legitimate and is
   what `react-snap` and `prerender.io` do internally. Hand-writing it with Playwright is not.
   A framework does this natively.

Next.js renders HTML on the server/at build time as a first-class feature. It removes the
prerender script, the deploy-hook rebuild, and the prebuilt-deploy workaround in one move —
and it is Vercel's own framework, so it deploys with zero configuration.

## Scope

Migrate the entire app into a single Next.js App Router application. Definition of done is
**parity plus known-issue fixes**: same design, animations, and copy; framework swapped;
already-broken things fixed; SEO/indexability improvements welcome where the migration
naturally enables them. No redesign.

Playwright is **not** removed from the repo. It stays as a dev/test dependency for
`e2e/admin.spec.js` and visual verification — its normal role. It only stops being part of the
production build.

## Architecture

```
app/
  layout.jsx                    root layout — providers, fonts, global CSS
  (marketing)/
    layout.jsx                  Navbar + Footer (was MarketingLayout)
    page.jsx                    /
    about/page.jsx              /about
    about/team/page.jsx         /about/team          (ComingSoon)
    products/page.jsx           /products
    contact/page.jsx            /contact
    submit-case/page.jsx        /submit-case
    services/page.jsx           /services
    services/[slug]/page.jsx    /services/:slug
    blog/page.jsx               /blog
    blog/page/[page]/page.jsx   /blog/page/:page     (pagination)
    blog/[slug]/page.jsx        /blog/:slug
    events/page.jsx             /events
    events/page/[page]/page.jsx /events/page/:page   (pagination)
    events/[slug]/page.jsx      /events/:slug
    resources/videos/page.jsx   /resources/videos    (ComingSoon)
    not-found.jsx               real 404 (preserves NotFound.jsx behavior)
  (auth)/
    layout.jsx                  AuthLayout
    auth/login/page.jsx
    auth/forgot-password/page.jsx
    auth/reset-password/page.jsx
    auth/accept-invite/page.jsx
  app/
    layout.jsx                  RequireAuth + AppShell (Sidebar, Topbar)
    page.jsx                    /app                 (Dashboard)
    settings/page.jsx
    members/page.jsx
    events/page.jsx
    posts/page.jsx
  api/
    users/route.js              was api/users.js
    revalidate/route.js         replaces api/rebuild.js
```

Route groups `(marketing)` and `(auth)` scope layouts without adding URL segments. All existing
URLs are preserved exactly — this is a hard requirement, since changing them would forfeit
accrued SEO value.

### Server vs client boundary

The default is a Server Component. A component becomes `"use client"` only when it needs
browser APIs, state, or effects:

- **Client:** `ModelViewer` (Three.js/WebGL — also `dynamic(..., { ssr: false })`), all GSAP
  animation components (`AnimateOnView`, `useParallax`, `useScrollReveal`, `useStaggerChildren`),
  `BreakpointProvider`, `ToastProvider`, all `/app` dashboard pages, all `(auth)` pages, and any
  form using `react-hook-form`.
- **Server:** marketing page shells, which fetch content and pass plain data down.

Interactive leaves are pushed as deep as possible so page shells can stay server-rendered.

## Data flow

**Marketing content (blog, events, settings):** fetched in Server Components with a
server-side Supabase client using the anon key, so Row Level Security still governs what is
readable and drafts cannot leak. Static params come from `generateStaticParams()`.

**ISR:** content pages export `revalidate` and are regenerated on demand. Publishing from the
dashboard calls `POST /api/revalidate`, which calls `revalidatePath()` for the affected route.
Pages refresh in seconds with no rebuild and no deploy hook.

`api/rebuild.js` and `src/lib/rebuild.js` are **deleted**. `VERCEL_DEPLOY_HOOK_URL` becomes
unused. The `CONTENT_PUBLISH` permission check moves to the new revalidate route — the client
still asks and the server still decides.

**Dashboard:** unchanged. Zustand stores (`events`, `posts`, `settings`, `auth`) keep fetching
client-side through the existing browser Supabase client. The dashboard is private, so server
rendering buys it nothing.

## Auth

Client-side, as today. `<RequireAuth>` moves to `app/app/layout.jsx`; the session stays in
localStorage via the existing browser client (`persistSession`, `autoRefreshToken`,
`detectSessionInUrl`). No `@supabase/ssr`, no middleware, no cookie rewiring — the dashboard
accepts a brief client-side auth check on load, exactly as it does now.

The three functions in `api/` keep using the service-role key server-side only.
`api/_auth.js` (`requirePermission`, `HttpError`, `sendError`) ports to a shared module used by
the new route handlers.

## SEO

`src/lib/seo.js` writes `<head>` tags via direct DOM manipulation, specifically so the
prerender snapshot would capture them. That entire approach is replaced by Next's **Metadata
API**:

- Static pages export a `metadata` object.
- Dynamic pages (`blog/[slug]`, `events/[slug]`, `services/[slug]`) export
  `generateMetadata()`, producing per-route title, description, canonical, Open Graph, and
  Twitter tags **server-side** — in the HTML, no JS required.
- JSON-LD structured data renders as a `<script type="application/ld+json">` in the server
  component.
- `sitemap.xml` and `robots.txt` become `app/sitemap.js` and `app/robots.js` (native, generated
  from the same Supabase queries, preserving the existing indexing-off behavior).

This deletes the `OWNED`/`clearManaged` duplicate-tag machinery — a class of bug that only
existed because tags were being written imperatively at runtime. `src/lib/seo.test.js` is
rewritten against the new metadata builders; `PrerenderSignal` is deleted outright (nothing
needs to signal readiness when HTML is rendered server-side).

## Known issues fixed

- **Dead rebuild flow** — removed (see Data flow).
- **1.4 MB single JS bundle** (`gzip: 380 kB`, over Vite's 500 kB warning) — Next's per-route
  code splitting fixes this by default; Three.js loads only on the route that uses it via
  `dynamic()`.
- **Prebuilt-deploy workaround** — `npm run deploy` / `deploy:prod` scripts are removed; `git
  push` and plain `vercel` both work again.

## Config migration

- `vite.config.js` → `next.config.mjs`. The `/api` dev proxy disappears (Next serves API routes
  natively on the same port), as does the separate `scripts/dev-api.mjs` flow.
- `tailwind.config.js`: `content` globs change to `./app/**/*.{js,jsx}` and `./src/**/*.{js,jsx}`.
  The brand palette is untouched.
- **Env vars:** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`import.meta.env` → `process.env`). Server-only
  `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are unchanged. Must be updated in Vercel
  project settings and `.env.local`.
- `vercel.json`: the SPA catch-all rewrite (`/(.*) → /index.html`) is **deleted** — it would
  break Next routing. Security headers are kept; the asset cache header is dropped in favor of
  Next's defaults for `/_next/static`.
- The language stays **JavaScript** (`.jsx`), not TypeScript. Adding TS would double the diff
  and is separate work.

## Error handling

- `app/(marketing)/not-found.jsx` preserves the real-404 behavior (`NotFound.jsx`) rather than
  redirecting home.
- `error.jsx` boundaries at the root and dashboard segments.
- Server-side Supabase fetch failures render the page with empty content rather than failing the
  build, matching today's tolerance for an unconfigured Supabase.

## Testing & verification

- **Unit tests** (`roles`, `services`, `mappers` — Vitest) port unchanged. `seo.test.js` is
  rewritten against the metadata builders.
- **`tests/rls.test.js`** unchanged.
- **`e2e/admin.spec.js`** (Playwright) stays and must pass — this is Playwright's proper use.
- **Parity check:** capture screenshots of all 19 routes before and after with Playwright and
  compare, plus verify each route's server-rendered HTML contains real content and correct meta
  tags via `curl` (`view-source`) — the actual thing the prerender existed to guarantee.
- **Success criteria:** every current URL resolves; `curl` of any marketing route returns
  populated HTML with correct per-route meta tags; `git push` deploys cleanly on Vercel with no
  prebuild step; publishing updates a live page within seconds without a rebuild.

## Risks

- **Volume.** 23 routes and 58 components. Mitigated by strict parity — components move mostly
  untouched; the work is routing, data fetching, and the server/client boundary.
- **Animation regressions.** GSAP/parallax/scroll-reveal are the most likely breakage
  (hydration, `useLayoutEffect`, refs). Mitigated by the screenshot parity check.
- **Hydration mismatches.** Anything reading `window`/`localStorage` during render. Mitigated by
  keeping those in client components behind effects.
- **Env var rename** must land in Vercel settings before the first deploy or the site builds
  with no Supabase content.

## Out of scope

Redesign, new features, TypeScript, `@supabase/ssr` cookie auth, and replacing Zustand with
Server Component data fetching in the dashboard.
