# Admin Dashboard, Real Auth, and SEO Foundation — Design

**Date:** 2026-07-11
**Status:** Approved (user granted blanket approval to proceed through implementation)

## Problem

The site has a fully-built admin UI that is connected to nothing.

- `src/stores/auth.store.js` compares a typed password against a hardcoded string
  (`brainfoodrs@gmail.com` / `123changeMe!`). That string ships in the public JS bundle.
  The `/app` guard is client-side only — no server verifies anything.
- `src/stores/events.store.js` and `posts.store.js` hold content in in-memory Zustand
  arrays seeded from source. Creating an event in the dashboard affects only the author's
  browser tab; a refresh discards it and no visitor ever sees it. Publishing content today
  means editing source and redeploying.
- There is no backend at all. `src/config/api.js` is a complete axios client pointed at
  `/api/v1/*`, but `vercel.json` rewrites every path to `index.html`, so those calls would
  return HTML.
- `usePermission` is broken: it passes a permissions *array* into `hasPermission(role, ...)`,
  which expects a *role* string, so `can()` always returns `false`. The Sidebar also checks
  for permissions (`users:read`, `settings:read`) that do not exist in the roles table
  (`manage_members`, `view_dashboard`). `InviteMemberModal` calls `ROLES.filter(...)` on an
  object literal, which would throw.
- Marketing pages are client-rendered only. Social crawlers (Facebook, LinkedIn, Slack) do
  not execute JavaScript, so link previews are broken today. There is no sitemap, no
  structured data, no per-page metadata, and `*` redirects to `/` instead of returning a 404.

## Goals

1. Real authentication, enforced server-side.
2. Events and blog posts persisted in a database, editable from the existing dashboard.
3. Image uploads from the admin's computer.
4. Invite other people as admins by email.
5. Site-wide settings (contact info, socials, SEO defaults) editable in the dashboard.
6. A complete SEO foundation, switched off until the site moves to its real domain.

## Non-Goals

- Migrating to Next.js. Server rendering is the strongest SEO lever, but porting every
  marketing page is a large, risky rewrite of work that was just polished. Prerendering
  (below) captures most of the value. Next.js remains a clean future migration.
- Managing services, team bios, or instructional videos as content. They stay in code.
- MFA, OAuth, and multi-tenant accounts. The scaffolding for these is mock-only and gets deleted.
- Public self-registration. It is a security hole given every user is an admin.

## Architecture

Supabase provides Postgres, Auth, Storage, and transactional email. The React SPA talks to
it directly via `supabase-js`. Security is enforced by Row Level Security in the database,
not by React.

```
Browser (Vite SPA)
  │
  ├─ supabase-js ──→ Postgres   events, posts, profiles, site_settings
  │                → Auth       login, invites, password resets
  │                → Storage    image uploads (bucket: media)
  │
  └─ /api/users ──→ one Vercel function (service-role key, server-only)
                    invite / list / remove admins
```

Anything requiring the Supabase **service-role key** (creating and deleting users) must run
server-side. That is the sole reason a serverless function exists. Everything else goes
straight from browser to Supabase under RLS.

### Why RLS matters here

Policies live in Postgres, so they hold even if someone bypasses the frontend entirely and
calls the API directly with the public key. This is precisely what today's client-side check
cannot do.

- **Public (anonymous):** `SELECT` on `events` and `posts` **only where `published = true`**.
  `SELECT` on `site_settings`. No writes, ever.
- **Authenticated admin:** full read (including drafts) and full write on all content tables.
- **`profiles`:** authenticated users may read all rows. Role changes and deletions go
  through the serverless function only.

## Data Model

```
profiles                 events                      posts
────────                 ──────                      ─────
id       → auth.users    id                          id
email                    slug          (unique)      slug         (unique)
name                     title                       title
role     → text enum     date, time, location        date, author
created_at               image_url                   category, tags[]
                         excerpt, body (markdown)    image_url
                         category                    excerpt, body (markdown)
                         published     (bool)        read_time    (auto)
                         created_at, updated_at      published    (bool)
                         created_by → profiles       featured     (bool)
                                                     created_at, updated_at
                                                     created_by → profiles

site_settings  (singleton row, id = 1)
─────────────
business:  name, short_name, tagline, description, city, state, address, founded
contact:   phone, email, hours
links:     google_maps, google_review
socials:   jsonb [{label, href}]
seo:       title_template, default_title, default_desc, og_image_url, site_url
analytics: ga_measurement_id, gsc_verification
flags:     seo_indexable (bool, default false)
```

Column names are snake_case in Postgres and mapped to the camelCase shapes the existing
components already expect, so the admin forms and marketing pages keep their current field
names (`image`, `readTime`, …).

### Roles

One role ships: `admin`, holding every permission. A single source-of-truth module replaces
the broken `src/shared` role helpers:

```js
export const ROLES = { ADMIN: "admin" };
export const PERMISSIONS = {
  [ROLES.ADMIN]: ["content:read", "content:write", "content:publish", "content:delete",
                  "users:read", "users:invite", "users:remove", "settings:read", "settings:write"],
};
```

`role` is a **text column validated in code**, not a native Postgres enum — adding `editor`
later is a code change plus a permission-map entry, with no schema migration. `usePermission`
is fixed to read the role from the signed-in user's profile.

### Invite-only, enforced

Public sign-up is disabled in Supabase config, and `/auth/register` is deleted. Because every
new user is an admin, leaving sign-up open would let a stranger register into the dashboard.

## Auth Flows

- **Login** — `supabase.auth.signInWithPassword`. Sessions and refresh are handled by
  `supabase-js`; the hand-rolled axios refresh interceptor in `src/config/api.js` is deleted.
- **Invite** — Members page → `POST /api/users`. The function verifies the caller's JWT and
  confirms their profile role can `users:invite`, then calls
  `supabase.auth.admin.inviteUserByEmail(email, { redirectTo: "/auth/accept-invite" })`.
  A database trigger on `auth.users` creates the matching `profiles` row with role `admin`.
  The invitee clicks the emailed link and sets a password (`updateUser`).
- **Remove** — `DELETE /api/users` → `auth.admin.deleteUser`. Same authorization check. A user
  cannot delete themselves.
- **Password reset** — `resetPasswordForEmail` → existing `ResetPasswordPage` → `updateUser`.

## Frontend Changes

**Deleted** (mock-only, unreachable, or superseded): `src/config/api.js`, `src/hooks/useApi.js`,
`src/stores/account.store.js`, `src/hooks/useAccount.js`, `src/guards/RequireAccount.jsx`,
`src/components/account/AccountSwitcher.jsx`, `src/pages/auth/RegisterPage.jsx`,
`src/components/auth/RegisterForm.jsx`, `OAuthButtons.jsx`, `MfaSetup.jsx`, `MfaChallenge.jsx`,
`src/pages/auth/MagicLinkPage.jsx`, `src/components/auth/MagicLinkForm.jsx`, and the multi-tenant
`x-account-id` concept throughout.

**Rewritten:** `auth.store.js` becomes a thin wrapper over the Supabase session plus the user's
profile. `events.store.js` and `posts.store.js` become async, Supabase-backed stores exposing
`fetch`/`create`/`update`/`remove`.

**Async loading is the main behavioral change.** Marketing pages currently read the store
synchronously. `EventDetail` and `BlogPost` do `if (!post) return <Navigate .../>` — with async
data that would redirect on first paint, before the fetch resolves. Both gain explicit
`loading` / `not-found` states, and the not-found case renders a real 404 rather than redirecting.

**New:** `ImageUpload` component (drag-drop → Supabase Storage → returns public URL), wired into
both admin forms. A `SettingsPage` form for `site_settings`.

## SEO Foundation

Everything below is built now and gated behind the `seo_indexable` flag, which is **off** until
the site moves to its production domain.

- **Not-indexable mode (default):** `robots.txt` emits `Disallow: /` and every page carries
  `<meta name="robots" content="noindex, nofollow">`. One toggle in Settings flips this.
- **Per-page metadata:** a `useSeo` hook sets `<title>`, description, canonical, Open Graph, and
  Twitter card tags per route, driven by `site_settings` with `src/config/site.js` as fallback
  defaults (so prerendering still works if the DB is unreachable).
- **Structured data (JSON-LD):** `ProfessionalService` / `LocalBusiness` for the organization
  (with `sameAs` socials), `Event` for event pages (drives Google event rich results),
  `BlogPosting` for posts, and `BreadcrumbList` on detail pages.
- **`sitemap.xml`** generated at build from static routes plus published events and posts.
- **Real 404.** The `*` route currently redirects to `/`, which tells crawlers a bad URL is a
  valid page. It becomes a proper NotFound page.
- **Prerendering.** After `vite build`, a script serves `dist/`, drives every route with a
  headless Chromium (Playwright), and writes the fully-rendered HTML back to
  `dist/<route>/index.html`. A real browser is used specifically because Three.js, GSAP, and
  Lottie would break a Node-based SSG. Crawlers and social scrapers get real HTML; the SPA
  hydrates on top. If hydration mismatches prove unstable, the fallback is a plain client
  re-render — crawlers still get their HTML either way.
- **Rebuild on publish.** Publishing or unpublishing content calls a Vercel Deploy Hook (URL
  held server-side in the `/api/users`-style function, never in the bundle) so newly published
  content is prerendered within about a minute.

**Placeholder data warning.** `site.js` contains a fake phone number (`(512) 555-0192`), a
placeholder Google review link, and no OG image. Publishing a fake phone number inside
LocalBusiness structured data damages local SEO through NAP inconsistency. These become
editable fields in Settings, and structured data omits any field left blank.

## Error Handling

- Supabase errors surface through the existing `Toast` provider; no silent failures.
- RLS rejections on write appear as explicit permission errors rather than empty results.
- Content fetches distinguish *loading*, *empty*, and *failed* — today's pages conflate empty
  with not-yet-loaded, which is what would cause the redirect bug above.
- The `/api/users` function returns 401 for a missing or invalid JWT and 403 for an
  authenticated caller lacking `users:invite` / `users:remove`.

## Testing

- **Unit (vitest, already installed):** roles/permissions module, slug generation, read-time
  calculation, camelCase↔snake_case mappers, JSON-LD builders (including the omit-blank-fields
  rule), sitemap generation.
- **RLS (integration, against local Supabase in Docker):** anonymous cannot read drafts;
  anonymous cannot write; authenticated admin can. These assert the security boundary that is
  the whole point of the design.
- **End-to-end (Playwright):** log in → create an event → publish → confirm it appears on the
  public `/events` page → delete it. Plus: logged-out user hitting `/app` is redirected.
- Verification runs against a local Supabase stack (Docker), so none of this depends on
  provisioning the production project first.

## Rollout

Local Supabase (Docker) is used for development and verification. Going live requires creating
the hosted Supabase project and setting three environment variables in Vercel
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — both public and safe to ship —
and `SUPABASE_SERVICE_ROLE_KEY`, server-only). Existing seed content (3 events, 3 posts) is
migrated by a seed script so nothing disappears from the live site.

`vercel.json` currently rewrites *every* path to `index.html`, which would swallow `/api/*`.
It gains an exception.
