import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/lib/content.server.js", () => ({
  getSettings: vi.fn(),
}));

import { getSettings } from "../src/lib/content.server.js";
import robots from "./robots.js";

beforeEach(() => vi.resetAllMocks());

describe("robots", () => {
  it("disallows everything while the site is noindexed (matches old writeSeoFiles behavior)", async () => {
    getSettings.mockResolvedValue({ seoIndexable: false, siteUrl: "https://example.com" });

    const result = await robots();

    expect(result).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
    expect(result.sitemap).toBeUndefined();
  });

  it("allows crawling and points to the sitemap when indexable", async () => {
    getSettings.mockResolvedValue({ seoIndexable: true, siteUrl: "https://example.com" });

    const result = await robots();

    expect(result.rules).toEqual([
      { userAgent: "*", allow: "/", disallow: ["/app/", "/auth/", "/api/"] },
    ]);
    expect(result.sitemap).toBe("https://example.com/sitemap.xml");
  });
});
