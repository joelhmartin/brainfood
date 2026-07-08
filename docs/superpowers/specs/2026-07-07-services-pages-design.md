# Services Pages — Design Spec

**Date:** 2026-07-07
**Status:** Implemented
**Site:** Brain Food Recovery Services (`brainfood-web`, Vite + React + React Router + Tailwind + GSAP)

## Goal

Build out the individual service detail pages and a `/services` index (landing)
page. All 5 services currently route to the shared `ComingSoonPage`; replace
those stubs with real, data-driven pages that match the existing marketing
design system. Use the stock (Pexels) images already defined in
`src/config/images.js`. Copy is draft, on-brand, for later review.

## Non-Goals (YAGNI)

- No CMS or backend content source.
- No new npm dependencies.
- No per-service bespoke page layouts — one shared template.
- No SEO/meta/OG work beyond what already exists.
- No changes to the `ComingSoonPage` component itself (only stop routing the 5
  services to it).
- No invented credentials, licenses, certifications, or outcome/efficacy claims
  in copy.

## The 5 Services (fixed — slugs already routed and in navbar)

| Slug             | Nav label                              | Image key (images.js `SERVICES`) |
| ---------------- | -------------------------------------- | -------------------------------- |
| `coaching`       | Recovery & Mental Health Coaching      | `coaching`                       |
| `sober-companion`| Sober Companion Services               | `soberCompanion`                 |
| `experiential`   | Experiential Integration               | `hiking`                         |
| `family`         | Family Coaching & Support              | `family`                         |
| `collaborative`  | Collaborative Care                     | `collaborative`                  |

## Architecture

Data-driven, matching the codebase's config-driven style (`site.js`,
`images.js`).

### 1. `src/config/services.js` — content model

Ordered array `SERVICES_CONTENT`, one object per service:

```js
{
  slug: "coaching",
  navLabel: "Recovery & Mental Health Coaching",
  title: "…",          // hero headline; may include an italic accent span
  accent: "…",         // the font-drama italic accent word/phrase for the headline
  tagline: "…",        // one line under the hero headline
  intro: ["…", "…"],   // 2–3 paragraphs
  lookLike: ["…", …],  // 4–6 bullets: "what this looks like"
  whoFor: ["…", …],    // 3–4 bullets: "who it's for"
  cardBlurb: "…",      // one-liner used on the /services index card
  image: SERVICES.coaching,  // imported from images.js
  icon: SomeLucideIcon,      // lucide-react icon component
}
```

Helper: `getService(slug)` returns the matching object or `undefined`.

All 5 slugs must exactly match the existing routes in `App.jsx` and the
`children` `to` paths in `Navbar.jsx`.

### 2. `src/pages/marketing/ServiceDetail.jsx` — reusable template

- Reads `:slug` via `useParams`, looks up the service with `getService`.
- If not found → `<Navigate to="/services" replace />`.
- Scrolls to top on mount (mirror About.jsx behavior).
- Section stack, reusing About.jsx styling verbatim (hero image + navy gradient
  overlays + noise overlay, `section-pad`, GSAP + IntersectionObserver
  scroll-reveal helper, brand pill badges, `rounded-3xl` cards, `font-heading` /
  `font-drama` type):
  1. **Hero** — full-bleed service image, navy gradient, "Our Services" badge,
     headline (heading + drama accent), tagline.
  2. **Intro** — 2-column: intro paragraphs + supporting image.
  3. **What this looks like** — bulleted/icon card grid from `lookLike`.
  4. **Who it's for** — list on a `surface-100` band from `whoFor`.
  5. **Other services** — strip linking the other 4 detail pages.
  6. **CTA** — reuse About's "Ready to start your journey?" → `/contact`.

The local `useScrollReveal` + `NoiseOverlay` helpers from About.jsx are
duplicated (small, self-contained) rather than prematurely extracted; a shared
extraction is out of scope for this change.

### 3. `src/pages/marketing/Services.jsx` — index/landing page

- **Hero** — matches detail-page hero language (generic services headline).
- **Intro line** — one short paragraph.
- **Service cards grid** — 5 cards (image, icon, `navLabel`, `cardBlurb`,
  "Learn more →" linking to `/services/{slug}`). Same visual language as About's
  Values grid.
- **CTA** — → `/contact`.

### 4. Routing (`src/App.jsx`)

- Import `ServiceDetail` and `Services`.
- Add `<Route path="/services" element={<Services />} />`.
- Replace the 5 `ComingSoonPage` service stubs with a single dynamic route:
  `<Route path="/services/:slug" element={<ServiceDetail />} />`
  (the fixed non-service coming-soon routes for `/about/team` and
  `/resources/videos` stay as they are).

### 5. Navbar (`src/components/marketing/Navbar.jsx`)

- Make the "Services" dropdown parent label also navigate to `/services` while
  keeping the hover dropdown. Add an optional `to` on the parent nav item and
  update `NavItem` so a parent with both `to` and `children` renders a clickable
  `Link` (to `/services`) that still shows the dropdown on hover.
- Mobile overlay: the "Services" group already expands children on tap; add a
  link to `/services` (e.g. an "All Services" / overview entry) so mobile users
  can reach the index.

## Copy & Imagery

- Draft copy for all 5 services written in the site voice (empathetic + direct,
  lived-experience, action-oriented) — consistent with About.jsx.
- Images: existing Pexels URLs in `images.js` (`experiential` maps to the
  `hiking` key). No new images downloaded.
- Copy is explicitly draft, for the user's later review/replacement.

## Testing / Verification

- `npm run dev` already running; verify each of the 6 new routes renders:
  `/services`, `/services/coaching`, `/services/sober-companion`,
  `/services/experiential`, `/services/family`, `/services/collaborative`.
- Unknown slug (e.g. `/services/nope`) redirects to `/services`.
- Nav "Services" label navigates to `/services`; dropdown still works; mobile
  overlay reaches the index and all 5 detail pages.
- `npm run build` succeeds (no broken imports).
- No console errors on any new page.

## Files Touched

| File                                      | Change            |
| ----------------------------------------- | ----------------- |
| `src/config/services.js`                  | new               |
| `src/pages/marketing/ServiceDetail.jsx`   | new               |
| `src/pages/marketing/Services.jsx`        | new               |
| `src/App.jsx`                             | routing edits     |
| `src/components/marketing/Navbar.jsx`     | clickable Services parent + mobile index link |
