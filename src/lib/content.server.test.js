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
