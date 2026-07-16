import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase.server.js", () => ({ createServerClient: vi.fn() }));

import { createServerClient } from "./supabase.server.js";
import { getPosts, getPostBySlug, getEvents, getEventBySlug, getSettings } from "./content.server.js";
import { FALLBACK_SETTINGS } from "../config/site.js";
import { settingsFromRow } from "./mappers.js";

beforeEach(() => vi.resetAllMocks());

/**
 * Builds a fake Supabase query chain that CAPTURES every `.eq()` call, so tests
 * can assert the published filter is actually applied to the query — not just
 * that some eq-shaped method exists on the mock. A mock that ignores its
 * arguments (`eq: () => ({ order: () => ... })`) would pass even if the real
 * `.eq("published", true)` call were deleted from the implementation, which
 * defeats the point of testing the single most important behavior in this
 * module: unpublished drafts must never reach server-rendered HTML.
 */
function createSupabaseMock(result) {
  const eqCalls = [];
  const chain = {
    eq: vi.fn((...args) => {
      eqCalls.push(args);
      return chain;
    }),
    order: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  const client = {
    from: vi.fn(() => ({ select: vi.fn(() => chain) })),
  };
  return { client, eqCalls };
}

describe("getPosts", () => {
  it("returns an empty array when Supabase is not configured", async () => {
    createServerClient.mockReturnValue(null);
    expect(await getPosts()).toEqual([]);
  });

  it("maps rows through postFromRow", async () => {
    const { client } = createSupabaseMock({
      data: [{ id: 1, slug: "a", title: "A", image_url: "/i.jpg", published: true }],
      error: null,
    });
    createServerClient.mockReturnValue(client);
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].image).toBe("/i.jpg");
  });

  it("filters to published rows only", async () => {
    const { client, eqCalls } = createSupabaseMock({ data: [], error: null });
    createServerClient.mockReturnValue(client);
    await getPosts();
    expect(eqCalls).toContainEqual(["published", true]);
  });
});

describe("getPostBySlug", () => {
  it("returns null when the post does not exist", async () => {
    const { client } = createSupabaseMock({ data: null, error: null });
    createServerClient.mockReturnValue(client);
    expect(await getPostBySlug("nope")).toBeNull();
  });

  it("filters to published rows only", async () => {
    const { client, eqCalls } = createSupabaseMock({ data: null, error: null });
    createServerClient.mockReturnValue(client);
    await getPostBySlug("some-slug");
    expect(eqCalls).toContainEqual(["published", true]);
    expect(eqCalls).toContainEqual(["slug", "some-slug"]);
  });
});

describe("getEvents", () => {
  it("returns an empty array when Supabase is not configured", async () => {
    createServerClient.mockReturnValue(null);
    expect(await getEvents()).toEqual([]);
  });

  it("maps rows through eventFromRow", async () => {
    const { client } = createSupabaseMock({
      data: [{ id: 1, slug: "e", title: "E", image_url: "/e.jpg", published: true }],
      error: null,
    });
    createServerClient.mockReturnValue(client);
    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0].image).toBe("/e.jpg");
  });

  it("filters to published rows only", async () => {
    const { client, eqCalls } = createSupabaseMock({ data: [], error: null });
    createServerClient.mockReturnValue(client);
    await getEvents();
    expect(eqCalls).toContainEqual(["published", true]);
  });
});

describe("getEventBySlug", () => {
  it("returns null when the event does not exist", async () => {
    const { client } = createSupabaseMock({ data: null, error: null });
    createServerClient.mockReturnValue(client);
    expect(await getEventBySlug("nope")).toBeNull();
  });

  it("returns a mapped event when present", async () => {
    const { client } = createSupabaseMock({
      data: { id: 2, slug: "party", title: "Party", image_url: "/p.jpg", published: true },
      error: null,
    });
    createServerClient.mockReturnValue(client);
    const event = await getEventBySlug("party");
    expect(event).not.toBeNull();
    expect(event.image).toBe("/p.jpg");
  });

  it("filters to published rows only", async () => {
    const { client, eqCalls } = createSupabaseMock({ data: null, error: null });
    createServerClient.mockReturnValue(client);
    await getEventBySlug("some-slug");
    expect(eqCalls).toContainEqual(["published", true]);
    expect(eqCalls).toContainEqual(["slug", "some-slug"]);
  });
});

describe("getSettings", () => {
  it("falls back to FALLBACK_SETTINGS when unconfigured", async () => {
    createServerClient.mockReturnValue(null);
    expect(await getSettings()).toEqual(FALLBACK_SETTINGS);
  });

  it("maps a DB row's snake_case values over FALLBACK_SETTINGS", async () => {
    // A close-to-real row: every column `settingsFromRow` knows about, populated
    // with values that differ from FALLBACK_SETTINGS so the test can prove the
    // DB actually wins the merge, not just that FALLBACK_SETTINGS survives.
    const row = {
      id: 1,
      name: "Custom Name",
      short_name: "Custom Short",
      tagline: "Custom tagline",
      description: "Custom desc",
      city: "Dallas",
      state: "TX",
      address: "123 Main St",
      founded: 2020,
      phone: "555-1234",
      email: "admin@example.com",
      hours: "24/7",
      google_maps: "https://maps.example.com",
      google_review: "https://review.example.com",
      socials: [{ label: "X", href: "https://x.com" }],
      site_url: "https://realsite.com",
      title_template: "%s | Custom",
      default_title: "Custom Title",
      default_desc: "Custom Description",
      og_image_url: "/og.png",
      ga_measurement_id: "G-XXXX",
      gsc_verification: "verify123",
      seo_indexable: true,
    };
    const { client } = createSupabaseMock({ data: row, error: null });
    createServerClient.mockReturnValue(client);

    const settings = await getSettings();

    // The bug this guards against: `{...FALLBACK_SETTINGS, ...data}` never maps
    // snake_case -> camelCase, so admin-configured values (including the
    // seoIndexable flag that gates noindex/sitemap behavior) never surface.
    expect(settings.seoIndexable).toBe(true);
    expect(settings.siteUrl).toBe("https://realsite.com");
    expect(settings.shortName).toBe("Custom Short");
    expect(settings).toEqual(settingsFromRow(row));
  });
});
