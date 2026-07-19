import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/content.server.js", () => ({
  getSettings: vi.fn(),
  getPosts: vi.fn(),
  getEvents: vi.fn(),
}));

import { getSettings, getPosts, getEvents } from "../src/lib/content.server.js";
import sitemap from "./sitemap.js";
import { SERVICE_SLUGS } from "../src/config/services.js";

beforeEach(() => vi.resetAllMocks());

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
    // If these were called, that would be wasted work for a sitemap we're
    // about to discard anyway, and absoluteUrl would emit relative URLs.
    getPosts.mockResolvedValue([{ slug: "should-not-appear" }]);
    getEvents.mockResolvedValue([{ slug: "should-not-appear" }]);

    const result = await sitemap();

    expect(result).toEqual([]);
    expect(getPosts).not.toHaveBeenCalled();
    expect(getEvents).not.toHaveBeenCalled();
  });

  it("includes all static routes, service slugs, and content URLs with absolute URLs and lastModified when indexable", async () => {
    getSettings.mockResolvedValue({ seoIndexable: true, siteUrl: "https://example.com" });
    getPosts.mockResolvedValue([
      { slug: "hello-world", updatedAt: "2026-01-15T00:00:00.000Z" },
      { slug: "no-update-date", updatedAt: null },
    ]);
    getEvents.mockResolvedValue([{ slug: "spring-social", updatedAt: "2026-02-01T00:00:00.000Z" }]);

    const result = await sitemap();
    const urls = result.map((e) => e.url);

    // Static routes, all absolute.
    for (const route of ["/", "/about", "/services", "/products", "/contact", "/events", "/blog"]) {
      const expected = route === "/" ? "https://example.com" : `https://example.com${route}`;
      expect(urls).toContain(expected);
    }

    // Every service slug gets its own detail URL.
    for (const slug of SERVICE_SLUGS) {
      expect(urls).toContain(`https://example.com/services/${slug}`);
    }

    // Content URLs.
    expect(urls).toContain("https://example.com/blog/hello-world");
    expect(urls).toContain("https://example.com/events/spring-social");

    // lastModified is a real Date built from updatedAt when present...
    const post = result.find((e) => e.url === "https://example.com/blog/hello-world");
    expect(post.lastModified).toEqual(new Date("2026-01-15T00:00:00.000Z"));
    const event = result.find((e) => e.url === "https://example.com/events/spring-social");
    expect(event.lastModified).toEqual(new Date("2026-02-01T00:00:00.000Z"));

    // ...and undefined (not a bogus date) when updatedAt is missing.
    const postWithoutDate = result.find((e) => e.url === "https://example.com/blog/no-update-date");
    expect(postWithoutDate.lastModified).toBeUndefined();

    // Every URL must be absolute (contains the site origin), never a bare path.
    for (const url of urls) {
      expect(url.startsWith("https://example.com")).toBe(true);
    }
  });
});
