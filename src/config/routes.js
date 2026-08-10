/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROUTE REGISTRY — the single source of truth for every public URL.
 *
 * Three things consume this and MUST agree, or the site advertises URLs it
 * does not serve (or serves URLs it never advertises):
 *
 *   • app/sitemap.js            → the XML sitemap crawlers read
 *   • app/(marketing)/sitemap   → the HTML sitemap humans read
 *   • scripts/verify-routes.mjs → the smoke test that every route serves HTML
 *
 * Before this file existed, each of those kept its own hand-written array and
 * they silently drifted: the XML sitemap still advertised `/products` (a
 * leftover product catalog from another project) and had never heard of the
 * paginated `/blog/page/N` URLs that generateStaticParams actually builds.
 *
 * ── Why a declared registry and not a filesystem scan ──────────────────────
 *
 * Scanning `app/` at runtime is the obvious "automatic" answer and it does not
 * work: Next traces only the modules a route imports into the serverless
 * bundle, so the `app/` *source tree* is not present on Vercel at request time.
 * A scan would silently return an empty sitemap in production while looking
 * perfect in dev — the worst possible failure mode for SEO.
 *
 * Instead the registry is declared here, and `src/config/routes.test.js` walks
 * the real `app/` directory and fails if the two disagree. Adding a route
 * without registering it breaks the build, so drift is caught at CI time
 * rather than discovered months later in Search Console.
 *
 * `priority` and `changeFrequency` are hints, not commands — Google has said
 * it largely ignores them. They are cheap and other crawlers still read them,
 * so they are set honestly rather than gamed (nothing but the homepage is 1.0).
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { CONTENT, blogPageUrl, eventPageUrl } from "./site.js";
import { SERVICES_CONTENT } from "./services.js";

/**
 * ── Private route constants ────────────────────────────────────────────────
 *
 * Named paths for the dashboard and auth flows, imported by RequireAuth, the
 * login/password forms, the sidebar, and the topbar. These are the routes that
 * must NEVER appear in a sitemap — every path here falls under one of the
 * NON_PUBLIC_PREFIXES below, and `routes.test.js` asserts that stays true.
 *
 * No REGISTER route: sign-up is disabled and admins arrive by invitation.
 */
export const ROUTES = {
  // Auth
  LOGIN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  ACCEPT_INVITE: "/auth/accept-invite",

  // Dashboard
  DASHBOARD: "/app",
  EVENTS: "/app/events",
  POSTS: "/app/posts",
  MEMBERS: "/app/members",
  SETTINGS: "/app/settings",
};

/**
 * Sections group the HTML sitemap and order it. `key` is referenced by every
 * route below; changing one means changing both.
 */
export const ROUTE_SECTIONS = [
  { key: "main", title: "Main pages", blurb: "The core of the site." },
  {
    key: "services",
    title: "Services",
    blurb: "What we offer, and who each service is for.",
  },
  {
    key: "blog",
    title: CONTENT.blog.label,
    blurb: "Writing on recovery, habits, and supporting a loved one.",
  },
  {
    key: "events",
    title: CONTENT.events.label,
    blurb: "Workshops, community events, and sober socials.",
  },
];

/**
 * Routes with a fixed path. `label` is what the HTML sitemap prints, so it is
 * written for a reader ("Home"), not derived from the slug ("home").
 */
export const STATIC_ROUTES = [
  { path: "/", label: "Home", section: "main", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", label: "About", section: "main", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", label: "Contact", section: "main", priority: 0.8, changeFrequency: "yearly" },
  {
    path: "/sitemap",
    label: "Sitemap",
    section: "main",
    priority: 0.2,
    changeFrequency: "weekly",
  },
  {
    path: "/services",
    label: "All services",
    section: "services",
    priority: 0.9,
    changeFrequency: "monthly",
  },
  {
    path: CONTENT.blog.listPath,
    label: `${CONTENT.blog.label} index`,
    section: "blog",
    priority: 0.7,
    changeFrequency: "weekly",
  },
  {
    path: CONTENT.events.listPath,
    label: `${CONTENT.events.label} index`,
    section: "events",
    priority: 0.7,
    changeFrequency: "weekly",
  },
];

/**
 * Dynamic route patterns, in Next's own `[param]` notation. These exist so the
 * drift test can match a registry entry to a directory on disk; the actual URLs
 * are expanded by `buildRoutes()` from live content.
 */
export const DYNAMIC_ROUTE_PATTERNS = [
  "/services/[slug]",
  `${CONTENT.blog.prefix}/[slug]`,
  `${CONTENT.blog.listPath}${CONTENT.blog.paginationSlug}/[page]`,
  `${CONTENT.events.prefix}/[slug]`,
  `${CONTENT.events.listPath}${CONTENT.events.paginationSlug}/[page]`,
];

/**
 * Route patterns that exist on disk but are deliberately NOT public: they must
 * never reach a sitemap. Listed explicitly so the drift test can tell
 * "intentionally private" apart from "someone forgot to register this".
 */
export const NON_PUBLIC_PREFIXES = ["/app", "/auth", "/api"];

/** Total pages for a paginated list, given item count and a CONTENT config. */
export function pageCount(total, config) {
  const perPage = config.perPage;
  if (!perPage || perPage === Infinity || perPage <= 0) return 1;
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * Expands the registry against live content into the full public URL list.
 *
 * Returns entries shaped `{ path, label, section, priority, changeFrequency,
 * lastModified }` — a superset of what either consumer needs, so the XML and
 * HTML sitemaps can never disagree about which URLs exist.
 *
 * Page 1 of a paginated list is deliberately omitted: it lives at `/blog`, not
 * `/blog/page/1` (see blogPageUrl in site.js). Emitting both would advertise
 * two URLs for one page of results — a self-inflicted duplicate-content
 * problem, and exactly what generateStaticParams already avoids by starting at
 * page 2.
 *
 * @param {object}  content
 * @param {Array}   content.posts   Published posts (see getPosts).
 * @param {Array}   content.events  Published events (see getEvents).
 */
export function buildRoutes({ posts = [], events = [] } = {}) {
  const routes = [...STATIC_ROUTES];

  for (const service of SERVICES_CONTENT) {
    routes.push({
      path: `/services/${service.slug}`,
      label: service.navLabel,
      section: "services",
      priority: 0.8,
      changeFrequency: "monthly",
    });
  }

  for (const post of posts) {
    routes.push({
      path: `${CONTENT.blog.prefix}/${post.slug}`,
      label: post.title,
      section: "blog",
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: post.updatedAt || post.date || undefined,
    });
  }

  for (const event of events) {
    routes.push({
      path: `${CONTENT.events.prefix}/${event.slug}`,
      label: event.title,
      section: "events",
      priority: 0.6,
      changeFrequency: "monthly",
      lastModified: event.updatedAt || event.date || undefined,
    });
  }

  // Paginated list URLs, starting at page 2 — see the note above.
  for (let n = 2; n <= pageCount(posts.length, CONTENT.blog); n += 1) {
    routes.push({
      path: blogPageUrl(n),
      label: `${CONTENT.blog.label} — page ${n}`,
      section: "blog",
      priority: 0.3,
      changeFrequency: "weekly",
      paginated: true,
    });
  }

  for (let n = 2; n <= pageCount(events.length, CONTENT.events); n += 1) {
    routes.push({
      path: eventPageUrl(n),
      label: `${CONTENT.events.label} — page ${n}`,
      section: "events",
      priority: 0.3,
      changeFrequency: "weekly",
      paginated: true,
    });
  }

  return routes;
}

/**
 * Same data as buildRoutes(), grouped into ROUTE_SECTIONS order for rendering.
 * Sections with no routes are dropped so an empty blog does not render a
 * heading over nothing.
 */
export function buildRouteSections(content) {
  const routes = buildRoutes(content);
  return ROUTE_SECTIONS.map((section) => ({
    ...section,
    routes: routes.filter((route) => route.section === section.key),
  })).filter((section) => section.routes.length > 0);
}
