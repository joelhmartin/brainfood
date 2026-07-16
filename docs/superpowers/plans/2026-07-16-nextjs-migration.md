# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Vite SPA + hand-rolled Playwright prerender with a single Next.js App Router app that renders marketing pages server-side natively.

**Architecture:** One Next.js app. Route group `(marketing)` holds server-rendered public pages using ISR; `(auth)` and `/app` stay client-rendered exactly as today. Supabase content is fetched in Server Components with the anon key (RLS still governs). The `useSeo` DOM-writing hook is replaced by Next's Metadata API, while `seo.js`'s pure JSON-LD builders port unchanged.

**Tech Stack:** Next.js 15 (App Router), React 18, JavaScript (`.jsx`, not TypeScript), Tailwind CSS 3, Supabase (`@supabase/supabase-js`), Zustand, GSAP, Three.js, Vitest, Playwright (tests only).

## Global Constraints

- **URLs must not change.** Every path in the current route table resolves identically after migration. Changing them forfeits accrued SEO value.
- **Strict parity plus known-issue fixes.** Same design, animations, copy. No redesign, no new features.
- **Language stays JavaScript.** `.jsx`/`.js` files. Do not introduce TypeScript.
- **Playwright stays in the repo** as a dev/test dependency for `e2e/admin.spec.js` and verification. It is only removed from the *build*.
- **Auth stays client-side.** No `@supabase/ssr`, no cookie auth, no middleware.
- **The service-role key never reaches the browser.** It stays in server-only route handlers.
- **`seoIndexable: false` is preserved.** The site currently emits `noindex` sitewide by design until it is on the production domain (`FALLBACK_SETTINGS.seoIndexable`, `src/config/site.js`). Do not flip it as part of this migration.
- **Env var rename:** `VITE_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server-only `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are unchanged.
- **Work on branch `nextjs-migration`.** Do not commit to `main`.

## File Structure

**Created:**
- `next.config.mjs` — Next config (replaces `vite.config.js`)
- `jsconfig.json` — `@/*` path alias
- `app/layout.jsx` — root layout: html/body, global CSS, client providers
- `app/providers.jsx` — `"use client"` wrapper: BreakpointProvider + ToastProvider
- `app/globals.css` — moved from `src/index.css`
- `app/(marketing)/layout.jsx` — Navbar + Footer shell
- `app/(marketing)/**/page.jsx` — 16 marketing routes
- `app/(marketing)/not-found.jsx` — real 404
- `app/(auth)/**/page.jsx` — 4 auth routes
- `app/app/**/page.jsx` — 5 dashboard routes + guarded layout
- `app/api/users/route.js`, `app/api/revalidate/route.js` — route handlers
- `app/sitemap.js`, `app/robots.js` — native SEO files
- `app/error.jsx` — root error boundary
- `src/lib/content.server.js` — server-side Supabase reads (one responsibility: fetch content for Server Components)
- `src/lib/metadata.js` — builds Next `Metadata` objects (replaces the `useSeo` hook)
- `src/lib/supabase.server.js` — server-side anon Supabase client
- `src/lib/api/auth.js` — ported from `api/_auth.js`

**Modified:**
- `src/lib/seo.js` — delete `useSeo` + DOM helpers; keep pure builders
- `src/lib/supabase.js` — `import.meta.env` → `process.env.NEXT_PUBLIC_*`
- `tailwind.config.js` — content globs
- `package.json` — scripts + deps
- `vercel.json` — remove SPA rewrite
- All 4 Zustand stores — publish triggers revalidate instead of rebuild

**Deleted:**
- `scripts/prerender.mjs`, `scripts/dev-api.mjs`
- `api/rebuild.js`, `api/_auth.js`, `api/users.js`, `src/lib/rebuild.js`
- `src/App.jsx` (routes become the filesystem), `src/main.jsx`, `index.html`
- `vite.config.js`
- `PrerenderSignal` (inside `App.jsx`)

---

### Task 1: Branch, install Next.js, and scaffold config

**Files:**
- Create: `next.config.mjs`, `jsconfig.json`
- Modify: `package.json`, `tailwind.config.js`, `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a Next.js app that builds and serves an empty root route; `@/*` alias resolving to repo root.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b nextjs-migration
```

- [ ] **Step 2: Install Next.js, remove Vite build deps**

```bash
npm install next@15
npm uninstall vite @vitejs/plugin-react sirv
```

Keep `vitest` (unit tests) and `@playwright/test` (e2e) — both stay.

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Create `jsconfig.json`**

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 5: Update `tailwind.config.js` content globs**

Change the `content` array (line 3) to:

```js
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
```

Leave `theme.extend` (the brand palette) untouched.

- [ ] **Step 6: Replace the scripts block in `package.json`**

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset && npm run seed",
    "seed": "node scripts/seed-content.mjs",
    "create-admin": "node scripts/create-admin.mjs"
  },
```

This deletes `build:spa`, `prerender`, `deploy`, `deploy:prod`, `dev:api`, `dev:full`, and `preview` — every script that existed to work around the prerender.

- [ ] **Step 7: Add `.next` to `.gitignore`**

Append to `.gitignore`:

```
.next/
next-env.d.ts
```

- [ ] **Step 8: Verify the install**

Run: `npx next --version`
Expected: prints a `15.x` version.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json next.config.mjs jsconfig.json tailwind.config.js .gitignore
git commit -m "chore: install Next.js and scaffold config"
```

---

### Task 2: Port env vars and Supabase clients

**Files:**
- Modify: `src/lib/supabase.js`, `.env.local`, `.env.example`
- Create: `src/lib/supabase.server.js`

**Interfaces:**
- Consumes: nothing
- Produces: `supabase` (browser client, unchanged export name), `isSupabaseConfigured` from `src/lib/supabase.js`; `createServerClient()` returning a `SupabaseClient | null` from `src/lib/supabase.server.js`.

- [ ] **Step 1: Rename env vars in `.env.local` and `.env.example`**

In both files, rename the two client-side keys (leave server-only keys alone):

```
NEXT_PUBLIC_SUPABASE_URL=<existing VITE_SUPABASE_URL value>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<existing VITE_SUPABASE_ANON_KEY value>
SUPABASE_URL=<unchanged>
SUPABASE_SERVICE_ROLE_KEY=<unchanged>
```

- [ ] **Step 2: Update `src/lib/supabase.js` to read `process.env`**

Replace lines 9-10 and the DEV warning guard. The file becomes:

```js
import { createClient } from "@supabase/supabase-js";

/**
 * The anon key is PUBLIC by design and safe to ship in the bundle. It grants
 * nothing on its own — Row Level Security in Postgres decides what any given
 * caller may read or write. The service-role key, which does bypass RLS, is
 * never imported here; it lives only in the server-side route handlers.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && process.env.NODE_ENV === "development") {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local — see README-ADMIN.md.",
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
```

- [ ] **Step 3: Create `src/lib/supabase.server.js`**

```js
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side reads use the ANON key on purpose — the same view an anonymous
 * visitor gets. Row Level Security therefore guarantees drafts cannot leak into
 * server-rendered HTML or the sitemap, even if a query here had a bug. This is
 * the same guarantee the old prerender script relied on.
 *
 * Sessions are never persisted: there is no browser here to persist them to.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: Verify no `import.meta.env` remains**

Run: `grep -rn "import.meta.env" src/ app/ 2>/dev/null | grep -v node_modules`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.js src/lib/supabase.server.js .env.example
git commit -m "feat: port Supabase clients to Next.js env vars"
```

---

### Task 3: Server-side content fetching

**Files:**
- Create: `src/lib/content.server.js`
- Test: `src/lib/content.server.test.js`

**Interfaces:**
- Consumes: `createServerClient()` from `src/lib/supabase.server.js`; `eventFromRow`, `postFromRow` from `src/lib/mappers.js`; `FALLBACK_SETTINGS` from `src/config/site.js`.
- Produces: `getSettings()`, `getPosts()`, `getPostBySlug(slug)`, `getEvents()`, `getEventBySlug(slug)`. All async. `getPosts`/`getEvents` return arrays (empty when Supabase is unconfigured). `getPostBySlug`/`getEventBySlug` return an object or `null`. `getSettings()` always returns a settings object, falling back to `FALLBACK_SETTINGS`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/content.server.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase.server.js", () => ({ createServerClient: vi.fn() }));

import { createServerClient } from "./supabase.server.js";
import { getPosts, getPostBySlug, getSettings } from "./content.server.js";
import { FALLBACK_SETTINGS } from "../config/site.js";

beforeEach(() => vi.resetAllMocks());

describe("getPosts", () => {
  it("returns an empty array when Supabase is not configured", async () => {
    createServerClient.mockReturnValue(null);
    expect(await getPosts()).toEqual([]);
  });

  it("maps rows through postFromRow", async () => {
    createServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({
              data: [{ id: 1, slug: "a", title: "A", image_url: "/i.jpg", published: true }],
              error: null,
            }),
          }),
        }),
      }),
    });
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].image).toBe("/i.jpg");
  });
});

describe("getPostBySlug", () => {
  it("returns null when the post does not exist", async () => {
    createServerClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });
    expect(await getPostBySlug("nope")).toBeNull();
  });
});

describe("getSettings", () => {
  it("falls back to FALLBACK_SETTINGS when unconfigured", async () => {
    createServerClient.mockReturnValue(null);
    expect(await getSettings()).toEqual(FALLBACK_SETTINGS);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/content.server.test.js`
Expected: FAIL — cannot resolve `./content.server.js`.

- [ ] **Step 3: Create `src/lib/content.server.js`**

```js
import { createServerClient } from "./supabase.server.js";
import { eventFromRow, postFromRow } from "./mappers.js";
import { FALLBACK_SETTINGS } from "../config/site.js";

/**
 * Content reads for Server Components. A missing Supabase config is a valid
 * state, not an error: the site renders with no content rather than failing the
 * build — matching how the old prerender script behaved.
 */

export async function getSettings() {
  const supabase = createServerClient();
  if (!supabase) return FALLBACK_SETTINGS;

  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data ? { ...FALLBACK_SETTINGS, ...data } : FALLBACK_SETTINGS;
}

export async function getPosts() {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map(postFromRow);
}

export async function getPostBySlug(slug) {
  const supabase = createServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return postFromRow(data);
}

export async function getEvents() {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map(eventFromRow);
}

export async function getEventBySlug(slug) {
  const supabase = createServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return eventFromRow(data);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/content.server.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content.server.js src/lib/content.server.test.js
git commit -m "feat: add server-side content fetching for Server Components"
```

---

### Task 4: Metadata builders (replace the useSeo hook)

**Files:**
- Create: `src/lib/metadata.js`
- Test: `src/lib/metadata.test.js`
- Modify: `src/lib/seo.js` (delete `useSeo` and DOM helpers; keep pure builders)

**Interfaces:**
- Consumes: `formatTitle`, `absoluteUrl` from `src/lib/seo.js`; `getSettings()` from `src/lib/content.server.js`.
- Produces: `buildMetadata({ title, description, path, image, type, noindex, settings })` returning a Next `Metadata` object. `<JsonLd data={...} />` component from `src/lib/metadata.js`.

**Context:** `seo.js`'s builders (`pruneEmpty`, `formatTitle`, `absoluteUrl`, `organizationSchema`, `eventSchema`, `blogPostingSchema`, `breadcrumbSchema`) are pure functions that never touch the DOM. They port unchanged and their tests keep passing. Only `useSeo` (the DOM-writing hook) and its helpers (`clearManaged`, `setMeta`, `setLink`, `setJsonLd`, `MANAGED`, `OWNED`) are deleted.

- [ ] **Step 1: Write the failing test**

Create `src/lib/metadata.test.js`:

```js
import { describe, it, expect } from "vitest";
import { buildMetadata } from "./metadata.js";

const settings = {
  name: "Brain Food",
  titleTemplate: "%s | Brain Food",
  defaultTitle: "Brain Food — Recovery Coaching",
  defaultDesc: "Default description.",
  siteUrl: "https://brainfoodrecovery.com",
  ogImage: null,
  seoIndexable: true,
  gscVerification: "",
};

describe("buildMetadata", () => {
  it("applies the title template", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.title).toBe("About | Brain Food");
  });

  it("sets a canonical absolute URL", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.alternates.canonical).toBe("https://brainfoodrecovery.com/about");
  });

  it("falls back to the default description", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.description).toBe("Default description.");
  });

  it("emits noindex when the site is not indexable", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings: { ...settings, seoIndexable: false } });
    expect(m.robots.index).toBe(false);
    expect(m.alternates).toBeUndefined();
  });

  it("emits noindex when the page asks for it, even on an indexable site", () => {
    const m = buildMetadata({ title: "404", path: "/nope", noindex: true, settings });
    expect(m.robots.index).toBe(false);
  });

  it("uses summary_large_image only when an image exists", () => {
    const plain = buildMetadata({ title: "A", path: "/a", settings });
    expect(plain.twitter.card).toBe("summary");
    const withImg = buildMetadata({ title: "A", path: "/a", image: "/og.jpg", settings });
    expect(withImg.twitter.card).toBe("summary_large_image");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/metadata.test.js`
Expected: FAIL — cannot resolve `./metadata.js`.

- [ ] **Step 3: Create `src/lib/metadata.js`**

```js
import { formatTitle, absoluteUrl } from "./seo.js";

/**
 * Builds a Next.js Metadata object. This replaces the old useSeo hook, which
 * wrote <head> tags imperatively via the DOM so a headless browser could snapshot
 * them. Next renders these tags server-side, so no browser and no snapshot are
 * involved — which also deletes the duplicate-tag problem the hook's clearManaged()
 * existed to solve.
 *
 * @param {object}  opts
 * @param {string}  opts.title        Page title, run through the title template.
 * @param {string}  opts.description  Meta description; falls back to the site default.
 * @param {string}  opts.path         Route path, for the canonical URL.
 * @param {string}  opts.image        OG image; falls back to the site's OG image.
 * @param {string}  opts.type         OG type ("website" | "article").
 * @param {boolean} opts.noindex      Force noindex for this page (e.g. 404).
 * @param {object}  opts.settings     Live site settings (see getSettings).
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  settings,
}) {
  const fullTitle = formatTitle(title, settings);
  const desc = description || settings.defaultDesc;
  const canonical = absoluteUrl(path, settings.siteUrl);
  const ogImage = image || settings.ogImage;

  // The master switch, preserved from useSeo: until the site is on its production
  // domain, every page tells crawlers to stay out. Indexing a staging domain splits
  // ranking signals between it and the eventual real one, and is a pain to unwind.
  const blocked = noindex || !settings.seoIndexable;

  const metadata = {
    title: fullTitle,
    description: desc,
    robots: blocked
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type,
      title: fullTitle,
      description: desc,
      url: canonical,
      siteName: settings.name,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: fullTitle,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
    },
  };

  // A canonical pointing at a noindexed page is contradictory; omit it entirely.
  if (!blocked) metadata.alternates = { canonical };

  if (settings.gscVerification) {
    metadata.verification = { google: settings.gscVerification };
  }

  return metadata;
}

/**
 * Renders JSON-LD. Structured data is suppressed while noindexed: it would be
 * describing a staging URL as if it were the real business listing.
 */
export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/metadata.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Strip the DOM-writing code from `src/lib/seo.js`**

Delete from `src/lib/seo.js`: the `useEffect` import, the `useSettingsStore` import, `MANAGED`, `OWNED`, `clearManaged()`, `setMeta()`, `setLink()`, `setJsonLd()`, and the entire `useSeo()` hook (including its JSDoc block).

Keep: `absoluteUrl`, `formatTitle`, `pruneEmpty`, `organizationSchema`, `eventSchema`, `blogPostingSchema`, `breadcrumbSchema`.

Replace the file's header comment with:

```js
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SEO — URL helpers and structured-data builders.
 *
 * These are pure functions: they take data and return objects. Rendering them
 * into <head> is Next's job (see lib/metadata.js and each route's
 * generateMetadata), which happens server-side — so crawlers and social scrapers
 * receive the tags in the HTML itself, with no JavaScript required.
 * ═══════════════════════════════════════════════════════════════════════════
 */
```

- [ ] **Step 6: Run the existing SEO tests to confirm the builders still pass**

Run: `npx vitest run src/lib/seo.test.js`
Expected: PASS — all existing tests (`pruneEmpty`, `formatTitle`, `absoluteUrl`, `organizationSchema`, `eventSchema`, `blogPostingSchema`, `breadcrumbSchema`) still pass untouched.

- [ ] **Step 7: Commit**

```bash
git add src/lib/metadata.js src/lib/metadata.test.js src/lib/seo.js
git commit -m "feat: replace useSeo DOM hook with Next Metadata API builders"
```

---

### Task 5: Root layout and providers

**Files:**
- Create: `app/layout.jsx`, `app/providers.jsx`, `app/globals.css`, `app/error.jsx`
- Modify: none
- Reference: `src/index.css`, `index.html`, `src/App.jsx:161-171`

**Interfaces:**
- Consumes: `BreakpointProvider` from `src/hooks/useBreakpoint.jsx`; `ToastProvider` from `src/components/ui/Toast.jsx`.
- Produces: root layout wrapping all routes; `<Providers>` client boundary.

- [ ] **Step 1: Move the global stylesheet**

```bash
git mv src/index.css app/globals.css
```

- [ ] **Step 2: Create `app/providers.jsx`**

The providers use React context and effects, so they are a client boundary. Keeping them in one file lets the root layout stay a Server Component.

```jsx
"use client";

import { BreakpointProvider } from "../src/hooks/useBreakpoint.jsx";
import { ToastProvider } from "../src/components/ui/Toast.jsx";

export function Providers({ children }) {
  return (
    <BreakpointProvider>
      <ToastProvider>{children}</ToastProvider>
    </BreakpointProvider>
  );
}
```

- [ ] **Step 3: Create `app/layout.jsx`**

Port the `<html>`/`<body>` attributes and any font/meta links from `index.html`. Read `index.html` first and carry over its `<html lang>`, body classes, and any font `<link>` tags.

```jsx
import "./globals.css";
import { Providers } from "./providers.jsx";
import { getSettings } from "../src/lib/content.server.js";
import { buildMetadata } from "../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ path: "/", settings });
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create `app/error.jsx`**

```jsx
"use client";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
      <button
        onClick={reset}
        className="rounded-md bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Verify the app boots**

Run: `npm run dev` and open `http://localhost:3000`
Expected: the dev server starts with no module errors. A 404 is correct here — no pages exist yet. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add app/layout.jsx app/providers.jsx app/globals.css app/error.jsx
git rm --cached src/index.css 2>/dev/null || true
git commit -m "feat: add Next.js root layout and providers"
```

---

### Task 6: Marketing layout and static pages

**Files:**
- Create: `app/(marketing)/layout.jsx`, and `page.jsx` for `/`, `/about`, `/products`, `/contact`, `/submit-case`, `/about/team`, `/resources/videos`
- Create: `app/(marketing)/not-found.jsx`
- Reference: `src/App.jsx` (MarketingLayout), `src/pages/marketing/*.jsx`

**Interfaces:**
- Consumes: `getSettings()`, `buildMetadata()`, `JsonLd`, `organizationSchema()`; existing page components in `src/pages/marketing/`.
- Produces: 7 marketing routes + a real 404.

**Context:** Each existing page component (e.g. `Home.jsx`) currently calls `useSeo(...)` and reads content from Zustand. The page component keeps its markup and animations but becomes a client component; the new `page.jsx` is a thin Server Component that supplies metadata and (later) data.

- [ ] **Step 1: Create `app/(marketing)/layout.jsx`**

Read `MarketingLayout` in `src/App.jsx` and port its structure verbatim — Navbar, `<Outlet/>` → `{children}`, Footer, plus any wrapper classes.

```jsx
import { Navbar } from "../../src/components/marketing/Navbar.jsx";
import { Footer } from "../../src/components/marketing/Footer.jsx";

export default function MarketingLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
```

If `Navbar`/`Footer` use hooks or `react-router` `Link`, they need `"use client"` at the top of their own files and their `Link` imports swapped (Step 3).

- [ ] **Step 2: Add `"use client"` to each marketing page component**

For each of `Home.jsx`, `About.jsx`, `Product.jsx`, `Contact.jsx`, `CaseSubmission.jsx`, `ComingSoon.jsx`, `NotFound.jsx` in `src/pages/marketing/`: add `"use client";` as the first line (they use GSAP, refs, and state).

- [ ] **Step 3: Swap react-router imports for Next equivalents**

Across `src/`, replace router imports. In every file that imports from `react-router-dom`:

```js
// before
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
// after
import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
```

Then fix call sites:
- `<Link to="/x">` → `<Link href="/x">`
- `useNavigate()` → `useRouter()`; `navigate("/x")` → `router.push("/x")`
- `useLocation().pathname` → `usePathname()`

Find every file needing this:

```bash
grep -rln "react-router-dom" src/
```

- [ ] **Step 4: Remove `useSeo` calls from page components**

Delete the `useSeo({...})` call and its import from each marketing page component. Metadata now comes from the route's `generateMetadata`. Note the title/description each page passed — you need those values in Step 5.

- [ ] **Step 5: Create the seven route files**

`app/(marketing)/page.jsx` (home) — carries the organization JSON-LD that `Home.jsx` used to emit:

```jsx
import { HomePage } from "../../src/pages/marketing/Home.jsx";
import { getSettings } from "../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../src/lib/metadata.js";
import { organizationSchema } from "../../src/lib/seo.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ path: "/", settings });
}

export default async function Page() {
  const settings = await getSettings();
  const blocked = !settings.seoIndexable;
  return (
    <>
      {!blocked && <JsonLd data={organizationSchema(settings)} />}
      <HomePage />
    </>
  );
}
```

`app/(marketing)/about/page.jsx`:

```jsx
import { AboutPage } from "../../../src/pages/marketing/About.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "About", path: "/about", settings });
}

export default function Page() {
  return <AboutPage />;
}
```

Repeat the same shape for:
- `app/(marketing)/products/page.jsx` → `ProductPage`, title `"Products"`, path `/products`
- `app/(marketing)/contact/page.jsx` → `ContactPage`, title `"Contact"`, path `/contact`
- `app/(marketing)/submit-case/page.jsx` → `CaseSubmissionPage`, title `"Submit a Case"`, path `/submit-case`
- `app/(marketing)/about/team/page.jsx` → `ComingSoonPage`, title `"Team"`, path `/about/team`
- `app/(marketing)/resources/videos/page.jsx` → `ComingSoonPage`, title `"Instructional Videos"`, path `/resources/videos`

Use each page's existing `useSeo` title/description values from Step 4 rather than inventing new ones.

- [ ] **Step 6: Create `app/(marketing)/not-found.jsx`**

```jsx
import { NotFoundPage } from "../../src/pages/marketing/NotFound.jsx";
import { getSettings } from "../../src/lib/content.server.js";
import { buildMetadata } from "../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Page not found", path: "/404", noindex: true, settings });
}

export default function NotFound() {
  return <NotFoundPage />;
}
```

- [ ] **Step 7: Verify the routes render server-side**

Run `npm run dev`, then in a second terminal:

```bash
curl -s http://localhost:3000/about | grep -c "About"
```

Expected: a non-zero count — real content in the HTML, no JS executed. This is the thing the prerender script existed to guarantee.

- [ ] **Step 8: Commit**

```bash
git add app/ src/
git commit -m "feat: add marketing layout and static routes"
```

---

### Task 7: Services routes

**Files:**
- Create: `app/(marketing)/services/page.jsx`, `app/(marketing)/services/[slug]/page.jsx`
- Modify: `src/pages/marketing/Services.jsx`, `src/pages/marketing/ServiceDetail.jsx`

**Interfaces:**
- Consumes: `SERVICES` from `src/config/services.js`; `getSettings()`, `buildMetadata()`, `JsonLd`, `breadcrumbSchema()`.
- Produces: `/services` and `/services/[slug]` with `generateStaticParams`.

**Context:** Services come from a static config file, not the database — so these are fully static with no ISR needed.

- [ ] **Step 1: Add `"use client"` and strip `useSeo` from both page components**

Add `"use client";` to `Services.jsx` and `ServiceDetail.jsx`; delete their `useSeo` calls and imports. `ServiceDetail.jsx` currently reads its slug via `useParams()` from react-router — change it to accept a `slug` prop instead, since the Server Component already knows it:

```jsx
export function ServiceDetailPage({ slug }) {
  const service = SERVICES.find((s) => s.slug === slug);
  // ...existing markup unchanged
}
```

- [ ] **Step 2: Create `app/(marketing)/services/page.jsx`**

```jsx
import { ServicesPage } from "../../../src/pages/marketing/Services.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Services", path: "/services", settings });
}

export default function Page() {
  return <ServicesPage />;
}
```

- [ ] **Step 3: Create `app/(marketing)/services/[slug]/page.jsx`**

```jsx
import { notFound } from "next/navigation";
import { ServiceDetailPage } from "../../../../src/pages/marketing/ServiceDetail.jsx";
import { SERVICES } from "../../../../src/config/services.js";
import { getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../../src/lib/metadata.js";
import { breadcrumbSchema } from "../../../../src/lib/seo.js";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return {};

  const settings = await getSettings();
  return buildMetadata({
    title: service.title,
    description: service.excerpt ?? service.description,
    path: `/services/${slug}`,
    settings,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const settings = await getSettings();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.title, path: `/services/${slug}` },
  ];

  return (
    <>
      {settings.seoIndexable && <JsonLd data={breadcrumbSchema(crumbs, settings)} />}
      <ServiceDetailPage slug={slug} />
    </>
  );
}
```

If `SERVICES` uses a field other than `excerpt`/`description`/`title`, read `src/config/services.js` and use the real field names.

- [ ] **Step 4: Verify all five service routes build**

Run: `npm run build`
Expected: build output lists `/services/[slug]` as SSG with 5 generated paths (`coaching`, `sober-companion`, `experiential`, `family`, `collaborative`).

- [ ] **Step 5: Commit**

```bash
git add app/ src/pages/marketing/Services.jsx src/pages/marketing/ServiceDetail.jsx
git commit -m "feat: add services routes with static params"
```

---

### Task 8: Blog routes with ISR

**Files:**
- Create: `app/(marketing)/blog/page.jsx`, `app/(marketing)/blog/page/[page]/page.jsx`, `app/(marketing)/blog/[slug]/page.jsx`
- Modify: `src/pages/marketing/Blog.jsx`, `src/pages/marketing/BlogPost.jsx`

**Interfaces:**
- Consumes: `getPosts()`, `getPostBySlug()`, `getSettings()` from `content.server.js`; `blogPostingSchema()`, `breadcrumbSchema()`; `CONTENT` from `src/config/site.js`.
- Produces: `/blog`, `/blog/page/[page]`, `/blog/[slug]`, all ISR with `export const revalidate = 3600`.

**Context:** `Blog.jsx` reads posts from `usePostsStore` (client fetch) and paginates at `CONTENT.blog.perPage` (6). It now receives posts as a prop from the server instead. Keep the store for the dashboard; the public pages stop using it.

- [ ] **Step 1: Convert `Blog.jsx` to accept props**

Add `"use client";` at the top. Change the signature to accept server-fetched data, and delete the `usePostsStore` and `useSeo` usage:

```jsx
export function BlogPage({ posts = [], page = 1 }) {
  // delete: const posts = usePostsStore(...)
  // delete: useSeo({...})
  // delete: const { page } = useParams()
  // keep everything else — markup, GSAP scroll reveal, pagination math
}
```

Pagination math stays as-is, reading `CONTENT.blog.perPage`.

- [ ] **Step 2: Convert `BlogPost.jsx` to accept a post prop**

Add `"use client";`. Replace the `useParams()` slug lookup and store read with a `post` prop; delete `useSeo`:

```jsx
export function BlogPostPage({ post }) {
  // delete: const { slug } = useParams(); const post = usePostsStore(...)
  // delete: useSeo({...})
  // keep all markup and animations
}
```

- [ ] **Step 3: Create `app/(marketing)/blog/page.jsx`**

```jsx
import { BlogPage } from "../../../src/pages/marketing/Blog.jsx";
import { getPosts, getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Blog", path: "/blog", settings });
}

export default async function Page() {
  const posts = await getPosts();
  return <BlogPage posts={posts} page={1} />;
}
```

- [ ] **Step 4: Create `app/(marketing)/blog/page/[page]/page.jsx`**

```jsx
import { notFound } from "next/navigation";
import { BlogPage } from "../../../../../src/pages/marketing/Blog.jsx";
import { getPosts, getSettings } from "../../../../../src/lib/content.server.js";
import { buildMetadata } from "../../../../../src/lib/metadata.js";
import { CONTENT } from "../../../../../src/config/site.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  const pages = Math.ceil(posts.length / CONTENT.blog.perPage);
  // Page 1 lives at /blog, not /blog/page/1 — see blogPageUrl in config/site.js.
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const settings = await getSettings();
  return buildMetadata({ title: `Blog — Page ${page}`, path: `/blog/page/${page}`, settings });
}

export default async function Page({ params }) {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const posts = await getPosts();
  const totalPages = Math.ceil(posts.length / CONTENT.blog.perPage);
  if (pageNum > totalPages) notFound();

  return <BlogPage posts={posts} page={pageNum} />;
}
```

- [ ] **Step 5: Create `app/(marketing)/blog/[slug]/page.jsx`**

```jsx
import { notFound } from "next/navigation";
import { BlogPostPage } from "../../../../src/pages/marketing/BlogPost.jsx";
import { getPosts, getPostBySlug, getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../../src/lib/metadata.js";
import { blogPostingSchema, breadcrumbSchema } from "../../../../src/lib/seo.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const settings = await getSettings();
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.image || undefined,
    type: "article",
    settings,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const settings = await getSettings();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ];

  return (
    <>
      {settings.seoIndexable && (
        <>
          <JsonLd data={blogPostingSchema(post, settings)} />
          <JsonLd data={breadcrumbSchema(crumbs, settings)} />
        </>
      )}
      <BlogPostPage post={post} />
    </>
  );
}
```

- [ ] **Step 6: Verify a post renders real HTML with correct meta**

Run `npm run dev`, then:

```bash
curl -s http://localhost:3000/blog/what-is-recovery-coaching | grep -oE '<title>[^<]*</title>|<meta property="og:title"[^>]*>'
```

Expected: a real post title in both `<title>` and `og:title` — server-rendered, no JS.

- [ ] **Step 7: Commit**

```bash
git add app/ src/pages/marketing/Blog.jsx src/pages/marketing/BlogPost.jsx
git commit -m "feat: add blog routes with ISR and server-rendered metadata"
```

---

### Task 9: Events routes with ISR

**Files:**
- Create: `app/(marketing)/events/page.jsx`, `app/(marketing)/events/page/[page]/page.jsx`, `app/(marketing)/events/[slug]/page.jsx`
- Modify: `src/pages/marketing/Events.jsx`, `src/pages/marketing/EventDetail.jsx`

**Interfaces:**
- Consumes: `getEvents()`, `getEventBySlug()`, `getSettings()`; `eventSchema()`, `breadcrumbSchema()`; `CONTENT.events` (perPage 9).
- Produces: `/events`, `/events/page/[page]`, `/events/[slug]`, all ISR.

- [ ] **Step 1: Convert `Events.jsx` and `EventDetail.jsx` to accept props**

Same treatment as Task 8 Steps 1-2: add `"use client";`, delete `useEventsStore`, `useSeo`, and `useParams` usage; accept `{ events = [], page = 1 }` and `{ event }` props respectively. Keep all markup and animations.

- [ ] **Step 2: Create `app/(marketing)/events/page.jsx`**

```jsx
import { EventsPage } from "../../../src/pages/marketing/Events.jsx";
import { getEvents, getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Events", path: "/events", settings });
}

export default async function Page() {
  const events = await getEvents();
  return <EventsPage events={events} page={1} />;
}
```

- [ ] **Step 3: Create `app/(marketing)/events/page/[page]/page.jsx`**

```jsx
import { notFound } from "next/navigation";
import { EventsPage } from "../../../../../src/pages/marketing/Events.jsx";
import { getEvents, getSettings } from "../../../../../src/lib/content.server.js";
import { buildMetadata } from "../../../../../src/lib/metadata.js";
import { CONTENT } from "../../../../../src/config/site.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const events = await getEvents();
  const pages = Math.ceil(events.length / CONTENT.events.perPage);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const settings = await getSettings();
  return buildMetadata({ title: `Events — Page ${page}`, path: `/events/page/${page}`, settings });
}

export default async function Page({ params }) {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const events = await getEvents();
  const totalPages = Math.ceil(events.length / CONTENT.events.perPage);
  if (pageNum > totalPages) notFound();

  return <EventsPage events={events} page={pageNum} />;
}
```

- [ ] **Step 4: Create `app/(marketing)/events/[slug]/page.jsx`**

```jsx
import { notFound } from "next/navigation";
import { EventDetailPage } from "../../../../src/pages/marketing/EventDetail.jsx";
import { getEvents, getEventBySlug, getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../../src/lib/metadata.js";
import { eventSchema, breadcrumbSchema } from "../../../../src/lib/seo.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const settings = await getSettings();
  return buildMetadata({
    title: event.title,
    description: event.excerpt,
    path: `/events/${slug}`,
    image: event.image || undefined,
    type: "article",
    settings,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const settings = await getSettings();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: event.title, path: `/events/${slug}` },
  ];

  return (
    <>
      {settings.seoIndexable && (
        <>
          <JsonLd data={eventSchema(event, settings)} />
          <JsonLd data={breadcrumbSchema(crumbs, settings)} />
        </>
      )}
      <EventDetailPage event={event} />
    </>
  );
}
```

- [ ] **Step 5: Verify all event routes build**

Run: `npm run build`
Expected: `/events/[slug]` listed with 3 generated paths; no errors.

- [ ] **Step 6: Commit**

```bash
git add app/ src/pages/marketing/Events.jsx src/pages/marketing/EventDetail.jsx
git commit -m "feat: add events routes with ISR and server-rendered metadata"
```

---

### Task 10: Native sitemap and robots

**Files:**
- Create: `app/sitemap.js`, `app/robots.js`
- Reference: `scripts/prerender.mjs:writeSeoFiles` (the behavior being replaced)

**Interfaces:**
- Consumes: `getPosts()`, `getEvents()`, `getSettings()`; `SERVICES`; `absoluteUrl()`.
- Produces: `/sitemap.xml` and `/robots.txt`, generated at request/build time.

**Context:** `writeSeoFiles()` in the prerender script wrote these to disk and skipped the sitemap entirely when `seoIndexable` was false. Preserve that behavior exactly.

- [ ] **Step 1: Create `app/sitemap.js`**

```js
import { getPosts, getEvents, getSettings } from "../src/lib/content.server.js";
import { SERVICES } from "../src/config/services.js";
import { absoluteUrl } from "../src/lib/seo.js";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/products",
  "/contact",
  "/submit-case",
  "/events",
  "/blog",
];

export default async function sitemap() {
  const settings = await getSettings();

  // Matches the old prerender behavior: no sitemap at all while the site is
  // noindexed. Advertising URLs we are simultaneously telling crawlers to ignore
  // is contradictory.
  if (!settings.seoIndexable) return [];

  const [posts, events] = await Promise.all([getPosts(), getEvents()]);

  return [
    ...STATIC_ROUTES.map((route) => ({ url: absoluteUrl(route, settings.siteUrl) })),
    ...SERVICES.map((s) => ({ url: absoluteUrl(`/services/${s.slug}`, settings.siteUrl) })),
    ...events.map((e) => ({
      url: absoluteUrl(`/events/${e.slug}`, settings.siteUrl),
      lastModified: e.updatedAt ? new Date(e.updatedAt) : undefined,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`, settings.siteUrl),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    })),
  ];
}
```

- [ ] **Step 2: Create `app/robots.js`**

```js
import { getSettings } from "../src/lib/content.server.js";
import { absoluteUrl } from "../src/lib/seo.js";

export default async function robots() {
  const settings = await getSettings();

  if (!settings.seoIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/auth/", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml", settings.siteUrl),
  };
}
```

- [ ] **Step 3: Verify both render**

Run `npm run dev`, then:

```bash
curl -s http://localhost:3000/robots.txt
```

Expected (site is currently noindexed): `User-Agent: *` and `Disallow: /`.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.js app/robots.js
git commit -m "feat: add native sitemap and robots routes"
```

---

### Task 11: Auth routes

**Files:**
- Create: `app/(auth)/layout.jsx`, `app/(auth)/auth/login/page.jsx`, `app/(auth)/auth/forgot-password/page.jsx`, `app/(auth)/auth/reset-password/page.jsx`, `app/(auth)/auth/accept-invite/page.jsx`
- Modify: the 4 page components in `src/pages/auth/`

**Interfaces:**
- Consumes: `AuthLayout` from `src/components/layout/AuthLayout.jsx`; the 4 auth page components.
- Produces: `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/accept-invite`.

**Context:** Auth pages are private and client-side by design. They are noindexed and need no server rendering.

- [ ] **Step 1: Add `"use client"` to auth components**

Add `"use client";` to all four pages in `src/pages/auth/` and to `LoginForm.jsx`, `ForgotPasswordForm.jsx`, `SetPasswordForm.jsx`, `AuthLayout.jsx`. They use `react-hook-form`, Supabase auth, and router navigation.

- [ ] **Step 2: Create `app/(auth)/layout.jsx`**

```jsx
import { AuthLayout } from "../../src/components/layout/AuthLayout.jsx";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return <AuthLayout>{children}</AuthLayout>;
}
```

If `AuthLayout` does not currently accept children (it may render an `<Outlet/>`), change it to `({ children })` and render `{children}` in place of the outlet.

- [ ] **Step 3: Create the four auth route files**

`app/(auth)/auth/login/page.jsx`:

```jsx
import { LoginPage } from "../../../../src/pages/auth/LoginPage.jsx";

export const metadata = { title: "Sign in" };

export default function Page() {
  return <LoginPage />;
}
```

Repeat for:
- `app/(auth)/auth/forgot-password/page.jsx` → `ForgotPasswordPage`, title `"Forgot password"`
- `app/(auth)/auth/reset-password/page.jsx` → `ResetPasswordPage`, title `"Reset password"`
- `app/(auth)/auth/accept-invite/page.jsx` → `AcceptInvitePage`, title `"Accept invitation"`

- [ ] **Step 4: Verify the login page renders and is noindexed**

Run `npm run dev`, then:

```bash
curl -s http://localhost:3000/auth/login | grep -oE '<meta name="robots"[^>]*>'
```

Expected: a robots tag containing `noindex`.

- [ ] **Step 5: Commit**

```bash
git add app/ src/pages/auth/ src/components/auth/ src/components/layout/AuthLayout.jsx
git commit -m "feat: add auth routes"
```

---

### Task 12: Dashboard routes with client-side guard

**Files:**
- Create: `app/app/layout.jsx`, `app/app/page.jsx`, `app/app/settings/page.jsx`, `app/app/members/page.jsx`, `app/app/events/page.jsx`, `app/app/posts/page.jsx`
- Modify: `src/guards/RequireAuth.jsx`, `src/components/layout/AppShell.jsx`, the 5 pages in `src/pages/app/`

**Interfaces:**
- Consumes: `RequireAuth` from `src/guards/RequireAuth.jsx`; `AppShell` from `src/components/layout/AppShell.jsx`; the 5 dashboard page components.
- Produces: `/app`, `/app/settings`, `/app/members`, `/app/events`, `/app/posts`.

**Context:** Per the spec, auth stays client-side. `RequireAuth` keeps checking the localStorage session and redirecting to `/auth/login`.

- [ ] **Step 1: Add `"use client"` to dashboard components**

Add `"use client";` to: `RequireAuth.jsx`, `AppShell.jsx`, `Sidebar.jsx`, `Topbar.jsx`, and all five pages in `src/pages/app/`. They all use Zustand stores, effects, and navigation.

- [ ] **Step 2: Update `RequireAuth` to use Next navigation**

Swap the react-router redirect for Next's router. Replace `<Navigate to={ROUTES.LOGIN} replace />` with a router push in an effect:

```jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../config/routes.js";
// ...existing session/store imports unchanged

export function RequireAuth({ children }) {
  const router = useRouter();
  // ...existing session + loading logic unchanged

  useEffect(() => {
    if (!loading && !session) router.replace(ROUTES.LOGIN);
  }, [loading, session, router]);

  if (loading) return <Spinner />;      // keep the existing loading UI
  if (!session) return null;            // redirect is in flight
  return children;
}
```

Keep the existing session-reading and loading logic exactly as it is; only the redirect mechanism changes.

- [ ] **Step 3: Create `app/app/layout.jsx`**

```jsx
import { RequireAuth } from "../../src/guards/RequireAuth.jsx";
import { AppShell } from "../../src/components/layout/AppShell.jsx";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
```

If `AppShell` renders an `<Outlet/>`, change it to accept and render `{children}`.

- [ ] **Step 4: Create the five dashboard route files**

`app/app/page.jsx`:

```jsx
import { DashboardPage } from "../../src/pages/app/DashboardPage.jsx";

export default function Page() {
  return <DashboardPage />;
}
```

Repeat for:
- `app/app/settings/page.jsx` → `SettingsPage`
- `app/app/members/page.jsx` → `MembersPage`
- `app/app/events/page.jsx` → `EventsAdminPage`
- `app/app/posts/page.jsx` → `PostsAdminPage`

- [ ] **Step 5: Verify the guard redirects**

Run `npm run dev`, open `http://localhost:3000/app` while signed out.
Expected: redirect to `/auth/login`.

- [ ] **Step 6: Commit**

```bash
git add app/ src/guards/ src/components/layout/ src/pages/app/
git commit -m "feat: add dashboard routes with client-side auth guard"
```

---

### Task 13: API route handlers

**Files:**
- Create: `src/lib/api/auth.js`, `app/api/users/route.js`, `app/api/revalidate/route.js`
- Delete: `api/_auth.js`, `api/users.js`, `api/rebuild.js`, `src/lib/rebuild.js`
- Test: `src/lib/api/auth.test.js`

**Interfaces:**
- Consumes: `PERMISSIONS`, `roleCan(role, permission)` from `src/config/roles.js`.
- Produces: `adminClient()`, `requirePermission(request, permission)` (throws `HttpError`, returns the profile), `HttpError`, `errorResponse(err)` returning a `Response`, from `src/lib/api/auth.js`.

**Context:** Vercel functions in `api/` use `(req, res)` Express-style signatures. App Router route handlers use Web `Request`/`Response`. `_auth.js` must be ported to read headers via `request.headers.get()` and return `Response` objects. **Only the plumbing changes — the security logic is preserved verbatim.** Note the existing comment in `_auth.js`: the role is read from the `profiles` table, never from the JWT, because a token can carry whatever metadata the user last set on themselves. Preserve that.

- [ ] **Step 1: Read the current `api/_auth.js` in full**

Run: `cat api/_auth.js`

Mirror its token extraction, its `profiles` lookup (`select("id, email, name, role")`), and its `roleCan(profile.role, permission)` check exactly. Do not invent a different permission mechanism.

- [ ] **Step 2: Create `src/lib/api/auth.js`**

Port `_auth.js`, changing only the plumbing (`req` → `request`, `res` → returned `Response`):

```js
import { createClient } from "@supabase/supabase-js";
import { roleCan } from "../../config/roles.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Holds the SERVICE ROLE key, which bypasses Row Level Security. Server-side
 * only — this module must never be imported by a client component.
 */
export function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Verifies the caller's JWT and checks their role against `permission`.
 *
 * The role is read from the `profiles` table, never from the token. A JWT can carry
 * whatever metadata the user last managed to set on themselves; the profiles table is
 * the authority. The client asks; the server decides.
 */
export async function requirePermission(request, permission) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Not authenticated.");

  const supabase = adminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new HttpError(401, "Not authenticated.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) throw new HttpError(401, "Not authenticated.");
  if (!roleCan(profile.role, permission)) throw new HttpError(403, "Not allowed.");

  return profile;
}

export function errorResponse(err) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : "Server error.";
  return Response.json({ error: message }, { status });
}
```

Compare against `api/_auth.js` line by line before deleting it. If its `.eq()`/`.single()` chain or error messages differ from the above, the original wins — this port must not change behavior.

- [ ] **Step 3: Create `app/api/revalidate/route.js`**

This replaces `api/rebuild.js` entirely.

```js
import { revalidatePath } from "next/cache";
import { requirePermission, errorResponse } from "../../../src/lib/api/auth.js";
import { PERMISSIONS } from "../../../src/config/roles.js";

/**
 * Refreshes the static HTML for a published item. Replaces the old deploy-hook
 * rebuild: instead of rebuilding the whole site (~minutes, and it fired a cloud
 * build that could not even run the prerender), this regenerates one page in
 * seconds.
 */
export async function POST(request) {
  try {
    await requirePermission(request, PERMISSIONS.CONTENT_PUBLISH);

    const { type, slug } = await request.json();

    if (type === "post") {
      revalidatePath("/blog");
      if (slug) revalidatePath(`/blog/${slug}`);
    } else if (type === "event") {
      revalidatePath("/events");
      if (slug) revalidatePath(`/events/${slug}`);
    } else if (type === "settings") {
      revalidatePath("/", "layout");
    } else {
      return Response.json({ error: "Unknown type." }, { status: 400 });
    }

    revalidatePath("/sitemap.xml");
    return Response.json({ ok: true, revalidated: true });
  } catch (err) {
    return errorResponse(err);
  }
}
```

- [ ] **Step 4: Port `api/users.js` to `app/api/users/route.js`**

Read `api/users.js` and port each HTTP method to a named export (`GET`, `POST`, `PATCH`, `DELETE` — whichever it implements). Convert:
- `req.method` switch → separate named exports
- `req.body` → `await request.json()`
- `res.status(n).json(x)` → `Response.json(x, { status: n })`
- `sendError(res, err)` → `return errorResponse(err)`

Keep all permission checks and business logic identical.

- [ ] **Step 5: Delete the old function files**

```bash
git rm api/_auth.js api/users.js api/rebuild.js src/lib/rebuild.js
rmdir api 2>/dev/null || true
```

- [ ] **Step 6: Verify the revalidate endpoint rejects unauthenticated calls**

Run `npm run dev`, then:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" -d '{"type":"post","slug":"x"}'
```

Expected: `401` — the endpoint must never be open.

- [ ] **Step 7: Commit**

```bash
git add app/api/ src/lib/api/
git commit -m "feat: port API routes to App Router; replace rebuild with revalidate"
```

---

### Task 14: Wire publishing to revalidation

**Files:**
- Modify: `src/stores/posts.store.js`, `src/stores/events.store.js`, `src/stores/settings.store.js`
- Reference: `src/lib/adminApi.js`

**Interfaces:**
- Consumes: `POST /api/revalidate` with body `{ type: "post" | "event" | "settings", slug?: string }`.
- Produces: publishing a post/event refreshes its live page within seconds.

**Context:** The stores currently import `triggerRebuild` from `src/lib/rebuild.js` (deleted in Task 13). Each call site is replaced with a revalidate call.

- [ ] **Step 1: Find every rebuild call site**

Run: `grep -rn "rebuild\|triggerRebuild" src/`
Expected: hits in the stores and possibly `adminApi.js`. Every hit must be replaced.

- [ ] **Step 2: Add a revalidate helper to `src/lib/adminApi.js`**

Append (matching the file's existing auth-header pattern — read it first and reuse its token helper rather than duplicating one):

```js
/**
 * Asks the server to refresh the static HTML for one item. Fire-and-forget:
 * a failed revalidate must not fail the save that just succeeded — the content is
 * already in the database, and the page will refresh on its own within the hour.
 */
export async function revalidateContent(type, slug) {
  try {
    await authedFetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug }),
    });
  } catch (err) {
    console.warn("[revalidate] failed:", err);
  }
}
```

Use whatever the file's existing authenticated-fetch function is actually called in place of `authedFetch`.

- [ ] **Step 3: Replace the rebuild call in `src/stores/posts.store.js`**

Swap the `triggerRebuild()` import/call for:

```js
import { revalidateContent } from "../lib/adminApi.js";
// ...after a successful publish/update/delete of a post:
await revalidateContent("post", post.slug);
```

- [ ] **Step 4: Replace the rebuild call in `src/stores/events.store.js`**

```js
import { revalidateContent } from "../lib/adminApi.js";
// ...after a successful publish/update/delete of an event:
await revalidateContent("event", event.slug);
```

- [ ] **Step 5: Replace the rebuild call in `src/stores/settings.store.js`**

```js
import { revalidateContent } from "../lib/adminApi.js";
// ...after settings save:
await revalidateContent("settings");
```

- [ ] **Step 6: Verify no rebuild references remain**

Run: `grep -rn "triggerRebuild\|VERCEL_DEPLOY_HOOK_URL\|rebuild" src/ app/ | grep -v node_modules`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/stores/ src/lib/adminApi.js
git commit -m "feat: publishing revalidates the page instead of rebuilding the site"
```

---

### Task 15: Delete Vite, the prerender, and the deploy workarounds

**Files:**
- Delete: `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `scripts/prerender.mjs`, `scripts/dev-api.mjs`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: nothing
- Produces: a repo with exactly one build system.

**Context:** This is the payoff task. `App.jsx` also contains `PrerenderSignal`, which exists solely to tell the prerender script when React had settled — meaningless once HTML is rendered server-side.

- [ ] **Step 1: Confirm nothing imports the files being deleted**

Run: `grep -rn "App.jsx\|main.jsx\|PrerenderSignal" src/ app/ | grep -v node_modules`
Expected: no output. If `PrerenderSignal` still appears, remove its usage first.

- [ ] **Step 2: Delete the Vite and prerender files**

```bash
git rm vite.config.js index.html src/main.jsx src/App.jsx scripts/prerender.mjs scripts/dev-api.mjs
```

- [ ] **Step 3: Remove the SPA rewrite from `vercel.json`**

The catch-all rewrite sends every URL to `/index.html` — it would break Next routing entirely. The asset cache header is also dropped: Next fingerprints and caches `/_next/static` correctly on its own. Keep the security headers. The file becomes:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

- [ ] **Step 4: Verify Playwright is still installed for tests**

Run: `npm ls @playwright/test`
Expected: `@playwright/test@1.61.1` present. It stays — `e2e/admin.spec.js` needs it. Only its role in the *build* is gone.

- [ ] **Step 5: Confirm the build no longer launches a browser**

Run: `npm run build 2>&1 | grep -ci "chromium\|playwright"`
Expected: `0` — no browser is involved in the build. This is the entire point of the migration.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete Vite, the Playwright prerender, and deploy workarounds"
```

---

### Task 16: Full verification

**Files:**
- Create: `scripts/verify-routes.mjs`
- Reference: all routes

**Interfaces:**
- Consumes: a running production server (`npm run build && npm start`).
- Produces: proof that every route serves populated HTML with correct metadata.

- [ ] **Step 1: Run the unit tests**

Run: `npm test`
Expected: PASS — `roles`, `services`, `mappers`, `seo`, `metadata`, `content.server`. Fix any failures before continuing.

- [ ] **Step 2: Create `scripts/verify-routes.mjs`**

This asserts what the prerender script existed to guarantee — that crawlers receive real HTML — but checks it against the server instead of a snapshot on disk.

```js
/**
 * Verifies every route serves populated HTML with a real <title>, with no
 * JavaScript executed — exactly what a social scraper or LLM crawler sees.
 *
 * Run against a production server: npm run build && npm start
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const ROUTES = [
  "/", "/about", "/services", "/products", "/contact", "/submit-case",
  "/events", "/blog",
  "/services/coaching", "/services/sober-companion", "/services/experiential",
  "/services/family", "/services/collaborative",
  "/events/recovery-run-zilker-park", "/events/family-workshop-boundaries",
  "/events/live-music-recovery-night",
  "/blog/what-is-recovery-coaching", "/blog/5-daily-habits-that-support-recovery",
  "/blog/supporting-a-loved-one-in-recovery",
];

let failed = 0;

for (const route of ROUTES) {
  const res = await fetch(`${BASE}${route}`);
  const html = await res.text();

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const hasOgTitle = /<meta property="og:title"/.test(html);
  const bodyLength = html.replace(/<[^>]+>/g, "").trim().length;

  const problems = [];
  if (res.status !== 200) problems.push(`status ${res.status}`);
  if (!title) problems.push("empty <title>");
  if (!hasOgTitle) problems.push("no og:title");
  if (bodyLength < 200) problems.push(`body too short (${bodyLength} chars) — looks like an empty shell`);

  if (problems.length) {
    failed++;
    console.error(`  ✗ ${route}: ${problems.join(", ")}`);
  } else {
    console.log(`  ✓ ${route} — "${title}"`);
  }
}

console.log(failed ? `\n${failed} route(s) failed.` : `\nAll ${ROUTES.length} routes serve real HTML.`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Add the verify script to `package.json`**

Add to `scripts`:

```json
    "verify:routes": "node scripts/verify-routes.mjs",
```

- [ ] **Step 4: Run the route verification**

```bash
npm run build && npm start &
sleep 5
npm run verify:routes
kill %1
```

Expected: all 19 routes pass with real titles. If the event/blog slugs differ from those listed, update `ROUTES` to match what `generateStaticParams` actually produced during the build.

- [ ] **Step 5: Run the e2e tests**

Run: `npm run test:e2e`
Expected: PASS. If `e2e/admin.spec.js` hardcodes port 5173 (Vite's), update it to 3000 and point `webServer` at `npm start`.

- [ ] **Step 6: Capture parity screenshots**

Compare the migrated site against production. With the Next server running:

```bash
npx playwright screenshot --viewport-size=1440,900 --full-page http://localhost:3000/ /tmp/next-home.png
npx playwright screenshot --viewport-size=1440,900 --full-page https://brainfoodrecovery.com/ /tmp/prod-home.png
```

Repeat for `/about`, `/services`, `/blog`, `/events`, and one blog post. Open each pair and compare. Report any visual differences rather than silently accepting them — GSAP animations and the Three.js `ModelViewer` are the likeliest regressions.

- [ ] **Step 7: Verify the Three.js viewer still renders**

Open the page containing `ModelViewer` in a browser. Expected: the 3D model renders and orbit controls work. If it errors during SSR, wrap it in `dynamic(() => import(...), { ssr: false })` at its usage site.

- [ ] **Step 8: Commit**

```bash
git add scripts/verify-routes.mjs package.json
git commit -m "test: add route verification for server-rendered HTML"
```

---

### Task 17: Deploy

**Files:**
- Modify: Vercel project settings (env vars, framework preset)

**Interfaces:**
- Consumes: a passing Task 16.
- Produces: a live deployment built in Vercel's cloud, with no prebuild step.

- [ ] **Step 1: Add the renamed env vars in Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

Repeat for the `preview` environment. Use the same values as the old `VITE_*` vars. **This must happen before the first deploy** or the site builds with no Supabase content.

- [ ] **Step 2: Remove the dead env var**

`VERCEL_DEPLOY_HOOK_URL` is no longer read by anything (the rebuild flow is gone):

```bash
vercel env rm VERCEL_DEPLOY_HOOK_URL production
```

- [ ] **Step 3: Deploy a preview — as a normal cloud build**

```bash
vercel
```

Expected: **READY**. Note what this proves: a plain `vercel` with no `--prebuilt`, no local build, no Playwright. This is the exact command that failed at the start of this work.

- [ ] **Step 4: Verify the preview serves real HTML**

```bash
BASE_URL=<preview-url> npm run verify:routes
```

If the preview is behind Vercel Deployment Protection (it redirects to `vercel.com/sso-api`), either disable protection for the preview or run this check against production after Step 5.

- [ ] **Step 5: Ask before promoting to production**

Do not promote unilaterally. Report the preview URL and the verification results, then ask for explicit confirmation. On approval:

```bash
vercel --prod
```

- [ ] **Step 6: Merge the branch**

Use the `superpowers:finishing-a-development-branch` skill to decide how to integrate (PR vs direct merge) and clean up.

---

## Notes for the implementer

- **The framework preset** in Vercel is currently `vite`. Vercel auto-detects Next.js from `package.json`; if it does not, set the preset to `nextjs` in project settings.
- **`git push` works again** after this migration. The prebuilt-deploy workaround (`npm run deploy`) is gone because the cloud build no longer needs a browser.
- **If a component breaks with a hydration error**, it is almost always reading `window`, `localStorage`, or `document` during render. Move it into a `useEffect`, or gate it behind a mounted flag.
- **Do not flip `seoIndexable`.** The site is deliberately noindexed until it is on its production domain. Flipping it is a separate, deliberate go-live step.
