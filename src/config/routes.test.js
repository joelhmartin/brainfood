import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

import {
  ROUTES,
  STATIC_ROUTES,
  DYNAMIC_ROUTE_PATTERNS,
  NON_PUBLIC_PREFIXES,
  ROUTE_SECTIONS,
  buildRoutes,
  buildRouteSections,
  pageCount,
} from "./routes.js";
import { CONTENT } from "./site.js";
import { SERVICES_CONTENT } from "./services.js";

const APP_DIR = fileURLToPath(new URL("../../app", import.meta.url));

/** Every `page.jsx`/`page.js` under app/, as paths relative to app/. */
function findPageFiles(dir = APP_DIR) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findPageFiles(full));
    } else if (entry.name === "page.jsx" || entry.name === "page.js") {
      found.push(relative(APP_DIR, full));
    }
  }
  return found;
}

/**
 * Converts an App Router file path to the URL it serves, applying Next's own
 * rules: the trailing `page.*` filename is not a segment, and `(group)`
 * directories are organizational only and never appear in the URL.
 */
function fileToRoutePattern(file) {
  const segments = file
    .split(/[/\\]/)
    .slice(0, -1)
    .filter((segment) => !/^\(.*\)$/.test(segment));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

const isPublic = (route) =>
  !NON_PUBLIC_PREFIXES.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));

describe("route registry ↔ app/ directory", () => {
  const onDisk = findPageFiles().map(fileToRoutePattern).filter(isPublic).sort();
  const registered = [...STATIC_ROUTES.map((r) => r.path), ...DYNAMIC_ROUTE_PATTERNS].sort();

  // This is the whole point of the registry. Both directions matter:
  //
  //   • a route on disk but not registered → it never reaches either sitemap,
  //     so crawlers never learn the page exists (the bug that hid the paginated
  //     /blog/page/N URLs).
  //   • a route registered but not on disk → both sitemaps advertise a URL that
  //     404s (the bug that kept /products in the XML sitemap long after the page
  //     stopped being real).
  //
  // If this fails, fix src/config/routes.js — do not weaken the assertion.
  it("registers exactly the public routes that exist on disk", () => {
    expect(onDisk).toEqual(registered);
  });

  it("finds the app directory at all (guards against a silently empty scan)", () => {
    expect(onDisk.length).toBeGreaterThan(5);
  });

  it("never exposes a dashboard, auth, or API route as public", () => {
    for (const route of registered) {
      expect(isPublic(route)).toBe(true);
    }
  });

  // The two halves of this file must not drift into each other: every named
  // private route has to stay behind a non-public prefix, or the drift test
  // above would start treating it as a page that belongs in the sitemap.
  it("keeps every named private route out of the public set", () => {
    for (const [name, path] of Object.entries(ROUTES)) {
      expect(isPublic(path), `${name} (${path})`).toBe(false);
      expect(registered, name).not.toContain(path);
    }
  });
});

describe("buildRoutes", () => {
  const posts = Array.from({ length: 8 }, (_, i) => ({
    slug: `post-${i}`,
    title: `Post ${i}`,
    updatedAt: "2026-03-01T00:00:00.000Z",
  }));
  const events = Array.from({ length: 11 }, (_, i) => ({
    slug: `event-${i}`,
    title: `Event ${i}`,
    date: "2026-04-01",
  }));

  it("expands every service in SERVICES_CONTENT", () => {
    const paths = buildRoutes().map((r) => r.path);
    for (const service of SERVICES_CONTENT) {
      expect(paths).toContain(`/services/${service.slug}`);
    }
  });

  it("expands posts and events into detail URLs", () => {
    const paths = buildRoutes({ posts, events }).map((r) => r.path);
    expect(paths).toContain("/blog/post-0");
    expect(paths).toContain("/events/event-0");
  });

  it("emits paginated URLs from page 2 up, never /page/1", () => {
    const paths = buildRoutes({ posts, events }).map((r) => r.path);

    // 8 posts at 6/page = 2 pages → only page 2 is a distinct URL.
    expect(paths).toContain("/blog/page/2");
    expect(paths).not.toContain("/blog/page/1");
    expect(paths).not.toContain("/blog/page/3");

    // 11 events at 9/page = 2 pages.
    expect(paths).toContain("/events/page/2");
    expect(paths).not.toContain("/events/page/1");
  });

  it("agrees with the pagination math the route's generateStaticParams uses", () => {
    // Both must derive total pages the same way, or the build mints orphaned or
    // duplicate paginated URLs.
    expect(pageCount(posts.length, CONTENT.blog)).toBe(
      Math.ceil(posts.length / CONTENT.blog.perPage),
    );
    expect(pageCount(events.length, CONTENT.events)).toBe(
      Math.ceil(events.length / CONTENT.events.perPage),
    );
  });

  it("treats an empty site as one page, not zero or NaN", () => {
    expect(pageCount(0, CONTENT.blog)).toBe(1);
    const paths = buildRoutes({ posts: [], events: [] }).map((r) => r.path);
    expect(paths.filter((p) => p.includes("/page/"))).toEqual([]);
  });

  it("carries lastModified from updatedAt, falling back to date", () => {
    const routes = buildRoutes({ posts, events });
    expect(routes.find((r) => r.path === "/blog/post-0").lastModified).toBe(
      "2026-03-01T00:00:00.000Z",
    );
    expect(routes.find((r) => r.path === "/events/event-0").lastModified).toBe("2026-04-01");
  });

  it("produces no duplicate paths", () => {
    const paths = buildRoutes({ posts, events }).map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("gives every route a label, section, and sane priority", () => {
    for (const route of buildRoutes({ posts, events })) {
      expect(route.label, route.path).toBeTruthy();
      expect(ROUTE_SECTIONS.map((s) => s.key), route.path).toContain(route.section);
      expect(route.priority, route.path).toBeGreaterThan(0);
      expect(route.priority, route.path).toBeLessThanOrEqual(1);
    }
  });

  it("reserves priority 1.0 for the homepage alone", () => {
    const top = buildRoutes({ posts, events }).filter((r) => r.priority === 1.0);
    expect(top.map((r) => r.path)).toEqual(["/"]);
  });
});

describe("buildRouteSections", () => {
  it("groups routes in ROUTE_SECTIONS order", () => {
    const sections = buildRouteSections({
      posts: [{ slug: "p", title: "P" }],
      events: [{ slug: "e", title: "E" }],
    });
    expect(sections.map((s) => s.key)).toEqual(["main", "services", "blog", "events"]);
  });

  it("drops sections that have no routes rather than rendering an empty heading", () => {
    // With no posts and no events, blog/events still have their index pages, so
    // every section survives — the drop only matters if a section's routes are
    // ALL content-derived. Assert the mechanism directly.
    const sections = buildRouteSections({ posts: [], events: [] });
    for (const section of sections) {
      expect(section.routes.length).toBeGreaterThan(0);
    }
  });

  it("accounts for every route exactly once across all sections", () => {
    const content = { posts: [{ slug: "p", title: "P" }], events: [{ slug: "e", title: "E" }] };
    const flat = buildRouteSections(content).flatMap((s) => s.routes);
    expect(flat.length).toBe(buildRoutes(content).length);
  });
});
