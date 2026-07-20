import { describe, it, expect } from "vitest";
import {
  slugify,
  estimateReadTime,
  normalizeTags,
  eventToRow,
  eventFromRow,
  postToRow,
  postFromRow,
} from "./mappers.js";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Recovery Run — Zilker Park")).toBe("recovery-run-zilker-park");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  !!Hello World!!  ")).toBe("hello-world");
  });

  it("collapses runs of separators", () => {
    expect(slugify("a---b___c")).toBe("a-b-c");
  });
});

describe("estimateReadTime", () => {
  it("floors at 1 minute", () => {
    expect(estimateReadTime("")).toBe(1);
    expect(estimateReadTime("three little words")).toBe(1);
  });

  it("counts roughly 200 words per minute", () => {
    expect(estimateReadTime(Array(600).fill("word").join(" "))).toBe(3);
  });

  it("ignores HTML tags when estimating read time", () => {
    const plain = "word ".repeat(200);
    const html = "<p>" + "word ".repeat(200) + "</p>";
    expect(estimateReadTime(html)).toBe(estimateReadTime(plain));
  });
});

describe("normalizeTags", () => {
  it("splits the comma-separated string the form produces", () => {
    expect(normalizeTags("recovery, boundaries , family")).toEqual([
      "recovery",
      "boundaries",
      "family",
    ]);
  });

  it("drops empty entries from trailing commas", () => {
    expect(normalizeTags("a,,b,")).toEqual(["a", "b"]);
  });

  it("passes arrays through", () => {
    expect(normalizeTags(["a", "b"])).toEqual(["a", "b"]);
  });

  it("returns an empty array for nullish input", () => {
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags(null)).toEqual([]);
  });
});

describe("event mapping", () => {
  it("derives a slug from the title when none is given", () => {
    expect(eventToRow({ title: "Family Workshop: Boundaries" }).slug).toBe(
      "family-workshop-boundaries",
    );
  });

  it("prefers an explicit slug", () => {
    expect(eventToRow({ title: "Anything", slug: "custom-slug" }).slug).toBe("custom-slug");
  });

  it("sends an empty date as null, not an empty string", () => {
    // Postgres rejects "" for a date column; null is the correct absence value.
    expect(eventToRow({ title: "x", date: "" }).date).toBeNull();
  });

  it("round-trips image ↔ image_url", () => {
    const row = eventToRow({ title: "x", image: "https://cdn/i.jpg" });
    expect(row.image_url).toBe("https://cdn/i.jpg");
    expect(eventFromRow({ ...row, id: "1", published: true }).image).toBe("https://cdn/i.jpg");
  });

  it("omits id when creating", () => {
    expect(eventToRow({ title: "x" })).not.toHaveProperty("id");
  });
});

describe("post mapping", () => {
  it("computes read time from the body when not supplied", () => {
    const row = postToRow({ title: "x", body: Array(400).fill("word").join(" ") });
    expect(row.read_time).toBe(2);
  });

  it("round-trips readTime ↔ read_time", () => {
    expect(postFromRow({ read_time: 7, tags: [], published: true, featured: false }).readTime).toBe(
      7,
    );
  });

  it("converts the form's comma string into a tags array", () => {
    expect(postToRow({ title: "x", tags: "one, two" }).tags).toEqual(["one", "two"]);
  });
});
