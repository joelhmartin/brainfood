import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/content.server.js", () => ({
  getSettings: vi.fn(),
  getPosts: vi.fn(),
  getEvents: vi.fn(),
}));

import { getSettings, getPosts, getEvents } from "../src/lib/content.server.js";
import sitemap from "./sitemap.js";
import { buildRoutes } from "../src/config/routes.js";
import { SERVICE_SLUGS } from "../src/config/services.js";

beforeEach(() => vi.resetAllMocks());

const indexable = { seoIndexable: true, siteUrl: "https://example.com" };

describe("sitemap", () => {
  it("returns an empty array while the site is noindexed (matches old writeSeoFiles behavior)", async () => {
    getSettings.mockResolvedValue({ seoIndexable: false, siteUrl: "https://example.com" });
    // If these were called, that would be wasted work for a sitemap we're
    // about to discard anyway — but more importantly, prove the noindex
    // short-circuit happens before any content fetch.
    getPosts.mockResolvedValue([{ slug: "should-not-appear" }]);
    getEvents.mockResolvedValue([{ slug: "should-not-appear" }]);

    const result = await sitemap();

    expect(result).toEqual([]);
    expect(getPosts).not.toHaveBeenCalled();
    expect(getEvents).not.toHaveBeenCalled();
  });

  it("returns an empty array when siteUrl is unset, even if indexable (matches old writeSeoFiles guard)", async () => {
    getSettings.mockResolvedValue({ seoIndexable: true, siteUrl: "" });
    getPosts.mockResolvedValue([{ slug: "should-not-appear" }]);
    getEvents.mockResolvedValue([{ slug: "should-not-appear" }]);

    const result = await sitemap();

    expect(result).toEqual([]);
    expect(getPosts).not.toHaveBeenCalled();
    expect(getEvents).not.toHaveBeenCalled();
  });

  it("emits exactly the routes the shared registry declares, and nothing else", async () => {
    getSettings.mockResolvedValue(indexable);
    const posts = [{ slug: "hello-world", title: "Hello", updatedAt: "2026-01-15T00:00:00.000Z" }];
    const events = [{ slug: "spring-social", title: "Spring", updatedAt: "2026-02-01T00:00:00.000Z" }];
    getPosts.mockResolvedValue(posts);
    getEvents.mockResolvedValue(events);

    const result = await sitemap();

    // The registry is the single source of truth; the sitemap must not add to
    // or subtract from it. This is what keeps /sitemap.xml and the HTML
    // /sitemap page describing the same site.
    const expected = buildRoutes({ posts, events }).map((r) =>
      r.path === "/" ? "https://example.com" : `https://example.com${r.path}`,
    );
    expect(result.map((e) => e.url).sort()).toEqual(expected.sort());
  });

  it("includes static pages, every service, content detail URLs, and the HTML sitemap", async () => {
    getSettings.mockResolvedValue(indexable);
    getPosts.mockResolvedValue([{ slug: "hello-world", title: "Hello" }]);
    getEvents.mockResolvedValue([{ slug: "spring-social", title: "Spring" }]);

    const urls = (await sitemap()).map((e) => e.url);

    for (const route of ["/about", "/services", "/contact", "/events", "/blog", "/sitemap"]) {
      expect(urls).toContain(`https://example.com${route}`);
    }
    expect(urls).toContain("https://example.com");

    for (const slug of SERVICE_SLUGS) {
      expect(urls).toContain(`https://example.com/services/${slug}`);
    }

    expect(urls).toContain("https://example.com/blog/hello-world");
    expect(urls).toContain("https://example.com/events/spring-social");
  });

  it("never advertises the deleted Diamond-era routes", async () => {
    getSettings.mockResolvedValue(indexable);
    getPosts.mockResolvedValue([]);
    getEvents.mockResolvedValue([]);

    const urls = (await sitemap()).map((e) => e.url);

    // These pages were leftovers from another project's build and have been
    // deleted. The old hand-written STATIC_ROUTES kept advertising /products
    // to crawlers long after it stopped being a real page.
    for (const dead of ["/products", "/about/team", "/resources/videos", "/resources"]) {
      expect(urls).not.toContain(`https://example.com${dead}`);
    }
  });

  it("includes paginated list URLs from page 2 up, but never /page/1", async () => {
    getSettings.mockResolvedValue(indexable);
    // 8 posts at 6/page = 2 pages; 11 events at 9/page = 2 pages.
    getPosts.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) => ({ slug: `p${i}`, title: `P${i}` })),
    );
    getEvents.mockResolvedValue(
      Array.from({ length: 11 }, (_, i) => ({ slug: `e${i}`, title: `E${i}` })),
    );

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain("https://example.com/blog/page/2");
    expect(urls).toContain("https://example.com/events/page/2");
    expect(urls).not.toContain("https://example.com/blog/page/1");
    expect(urls).not.toContain("https://example.com/events/page/1");
  });

  it("sets lastModified from updatedAt, and omits it entirely when absent or unparseable", async () => {
    getSettings.mockResolvedValue(indexable);
    getPosts.mockResolvedValue([
      { slug: "hello-world", title: "Hello", updatedAt: "2026-01-15T00:00:00.000Z" },
      { slug: "no-update-date", title: "None", updatedAt: null, date: null },
      // A bogus <lastmod> is worse than none — crawlers use it to decide what
      // to re-fetch, so an Invalid Date discredits the whole file.
      { slug: "garbage-date", title: "Garbage", updatedAt: "not a date" },
    ]);
    getEvents.mockResolvedValue([
      { slug: "spring-social", title: "Spring", updatedAt: "2026-02-01T00:00:00.000Z" },
    ]);

    const result = await sitemap();
    const find = (url) => result.find((e) => e.url === url);

    expect(find("https://example.com/blog/hello-world").lastModified).toEqual(
      new Date("2026-01-15T00:00:00.000Z"),
    );
    expect(find("https://example.com/events/spring-social").lastModified).toEqual(
      new Date("2026-02-01T00:00:00.000Z"),
    );
    expect(find("https://example.com/blog/no-update-date").lastModified).toBeUndefined();
    expect(find("https://example.com/blog/garbage-date").lastModified).toBeUndefined();
  });

  it("gives every entry an absolute URL, a changeFrequency, and a valid priority", async () => {
    getSettings.mockResolvedValue(indexable);
    getPosts.mockResolvedValue([{ slug: "hello-world", title: "Hello" }]);
    getEvents.mockResolvedValue([{ slug: "spring-social", title: "Spring" }]);

    const validFrequencies = [
      "always", "hourly", "daily", "weekly", "monthly", "yearly", "never",
    ];

    for (const entry of await sitemap()) {
      expect(entry.url.startsWith("https://example.com")).toBe(true);
      expect(validFrequencies).toContain(entry.changeFrequency);
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it("strips a trailing slash on siteUrl instead of emitting doubled slashes", async () => {
    getSettings.mockResolvedValue({ seoIndexable: true, siteUrl: "https://example.com/" });
    getPosts.mockResolvedValue([{ slug: "hello-world", title: "Hello" }]);
    getEvents.mockResolvedValue([]);

    for (const entry of await sitemap()) {
      expect(entry.url).not.toMatch(/([^:])\/\//);
    }
  });
});
