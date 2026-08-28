import { describe, it, expect } from "vitest";
import {
  isDisplayablePost,
  normalizePost,
  selectPosts,
  stripTrailingUrls,
  truncateAtWord,
  formatPostDate,
  formatFollowers,
} from "./facebook.js";

const photoPost = {
  id: "1",
  message: "Here's some of our recent brain food adventures with the family.",
  created_time: "2026-07-14T16:20:00+0000",
  full_picture: "https://scontent.example/photo.jpg",
  permalink_url: "https://www.facebook.com/1",
};

const textPost = {
  id: "2",
  message: "A quick note about tonight's meeting.",
  created_time: "2026-07-02T10:00:00+0000",
  permalink_url: "https://www.facebook.com/2",
};

// Real shape from the live feed: Facebook's auto-generated story, no author text.
const statusPost = {
  id: "3",
  message: "",
  story: "Brain Food Recovery Services updated their status.",
  created_time: "2026-07-02T09:00:00+0000",
  permalink_url: "https://www.facebook.com/3",
};

describe("stripTrailingUrls", () => {
  it("removes a trailing link", () => {
    expect(stripTrailingUrls("Thanks for having us. http://www.example.com")).toBe(
      "Thanks for having us.",
    );
  });

  it("removes several trailing links", () => {
    expect(stripTrailingUrls("See you there https://a.com https://b.com")).toBe("See you there");
  });

  it("keeps a link that is mid-sentence", () => {
    expect(stripTrailingUrls("Read https://a.com before Friday")).toBe(
      "Read https://a.com before Friday",
    );
  });

  it("collapses newlines and repeated spaces", () => {
    expect(stripTrailingUrls("Line one\n\nLine  two")).toBe("Line one Line two");
  });
});

describe("truncateAtWord", () => {
  it("leaves short text alone", () => {
    expect(truncateAtWord("Short and sweet", 40)).toBe("Short and sweet");
  });

  it("breaks on a word boundary and appends an ellipsis", () => {
    const result = truncateAtWord("the quick brown fox jumps over the lazy dog", 20);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
    expect(result).not.toMatch(/\s…$/);
  });

  it("strips dangling punctuation before the ellipsis", () => {
    expect(truncateAtWord("a".repeat(45) + " end, more words here", 50)).not.toContain(",…");
  });

  it("hard-cuts a single word longer than the limit", () => {
    const result = truncateAtWord("x".repeat(80), 20);
    expect(result).toBe(`${"x".repeat(20)}…`);
  });
});

describe("isDisplayablePost", () => {
  it("accepts a post with a message and a permalink", () => {
    expect(isDisplayablePost(photoPost)).toBe(true);
    expect(isDisplayablePost(textPost)).toBe(true);
  });

  // The junk that makes up much of a real page feed.
  it("rejects an auto-generated status story", () => {
    expect(isDisplayablePost(statusPost)).toBe(false);
    expect(
      isDisplayablePost({ ...textPost, message: "Brain Food Recovery Services updated their status." }),
    ).toBe(false);
  });

  it("rejects a post whose message is only a link", () => {
    expect(isDisplayablePost({ ...textPost, message: "https://example.com" })).toBe(false);
  });

  it("rejects a post with no message", () => {
    expect(isDisplayablePost({ ...textPost, message: "   " })).toBe(false);
    expect(isDisplayablePost({ ...textPost, message: undefined })).toBe(false);
  });

  it("rejects a post with no permalink", () => {
    expect(isDisplayablePost({ ...textPost, permalink_url: undefined })).toBe(false);
  });

  it("rejects junk input without throwing", () => {
    expect(isDisplayablePost(null)).toBe(false);
    expect(isDisplayablePost("nope")).toBe(false);
  });
});

describe("normalizePost", () => {
  it("maps Graph fields onto the render shape", () => {
    expect(normalizePost(photoPost)).toEqual({
      id: "1",
      message: photoPost.message,
      excerpt: photoPost.message,
      createdAt: photoPost.created_time,
      image: photoPost.full_picture,
      permalink: photoPost.permalink_url,
    });
  });

  it("nulls a missing image rather than leaving it undefined", () => {
    expect(normalizePost(textPost).image).toBeNull();
  });
});

describe("selectPosts", () => {
  it("filters junk and caps the result", () => {
    const result = selectPosts([photoPost, statusPost, textPost], 3);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("sorts photo posts ahead of text-only ones", () => {
    const result = selectPosts([textPost, photoPost], 2);
    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("respects the limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...photoPost, id: String(i) }));
    expect(selectPosts(many, 3)).toHaveLength(3);
  });

  it("returns an empty array for junk input", () => {
    expect(selectPosts(null, 3)).toEqual([]);
    expect(selectPosts(undefined, 3)).toEqual([]);
    expect(selectPosts([statusPost], 3)).toEqual([]);
  });
});

describe("formatPostDate", () => {
  // Rendered into a statically cached page, so it must not depend on the
  // reader's locale or timezone.
  it("formats an ISO timestamp consistently", () => {
    expect(formatPostDate("2026-08-16T12:00:00+0000")).toBe("16 Aug 2026");
  });

  it("returns an empty string for missing or invalid input", () => {
    expect(formatPostDate(null)).toBe("");
    expect(formatPostDate("not a date")).toBe("");
  });
});

describe("formatFollowers", () => {
  it("separates thousands", () => {
    expect(formatFollowers(726)).toBe("726 followers");
    expect(formatFollowers(12500)).toBe("12,500 followers");
  });

  it("singularises one", () => {
    expect(formatFollowers(1)).toBe("1 follower");
  });

  it("returns an empty string when the count is unknown", () => {
    expect(formatFollowers(null)).toBe("");
    expect(formatFollowers(undefined)).toBe("");
    expect(formatFollowers(-1)).toBe("");
  });
});
