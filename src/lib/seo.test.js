import { describe, it, expect } from "vitest";
import {
  pruneEmpty,
  formatTitle,
  absoluteUrl,
  organizationSchema,
  eventSchema,
  blogPostingSchema,
  breadcrumbSchema,
} from "./seo.js";

const SETTINGS = {
  name: "Brain Food Recovery Services",
  description: "Recovery coaching.",
  siteUrl: "https://brainfoodrecovery.com",
  titleTemplate: "%s | Brain Food",
  defaultTitle: "Brain Food Recovery Services",
  city: "Austin",
  state: "Texas",
  phone: "",
  address: "",
  socials: [{ label: "Instagram", href: "https://instagram.com/brainfoodrecovery" }],
};

describe("pruneEmpty", () => {
  it("drops empty strings, null, and undefined", () => {
    expect(pruneEmpty({ a: "x", b: "", c: null, d: undefined })).toEqual({ a: "x" });
  });

  it("drops objects that end up empty", () => {
    expect(pruneEmpty({ outer: { inner: "" } })).toBeUndefined();
  });

  it("keeps falsy values that are real data", () => {
    expect(pruneEmpty({ count: 0, flag: false })).toEqual({ count: 0, flag: false });
  });
});

describe("formatTitle", () => {
  it("applies the template", () => {
    expect(formatTitle("Events", SETTINGS)).toBe("Events | Brain Food");
  });

  it("falls back to the default title when no page title is given", () => {
    expect(formatTitle(undefined, SETTINGS)).toBe("Brain Food Recovery Services");
  });
});

describe("absoluteUrl", () => {
  it("joins the site URL and path", () => {
    expect(absoluteUrl("/blog/x", "https://example.com")).toBe("https://example.com/blog/x");
  });

  it("does not double the slash", () => {
    expect(absoluteUrl("/blog", "https://example.com/")).toBe("https://example.com/blog");
  });
});

describe("organizationSchema", () => {
  /**
   * The point of pruning. A 555 phone number in LocalBusiness structured data is worse
   * than none: search engines cross-check name/address/phone against other listings,
   * and a mismatch damages local ranking.
   */
  it("omits a blank phone rather than publishing an empty one", () => {
    const schema = organizationSchema(SETTINGS);
    expect(schema).not.toHaveProperty("telephone");
  });

  it("includes a phone once it is set", () => {
    const schema = organizationSchema({ ...SETTINGS, phone: "(512) 123-4567" });
    expect(schema.telephone).toBe("(512) 123-4567");
  });

  it("omits streetAddress but keeps the city when no street is set", () => {
    const schema = organizationSchema(SETTINGS);
    expect(schema.address).not.toHaveProperty("streetAddress");
    expect(schema.address.addressLocality).toBe("Austin");
  });

  it("lists socials as sameAs", () => {
    expect(organizationSchema(SETTINGS).sameAs).toEqual([
      "https://instagram.com/brainfoodrecovery",
    ]);
  });
});

describe("eventSchema", () => {
  it("emits a schema.org Event with an absolute url", () => {
    const schema = eventSchema(
      {
        slug: "recovery-run",
        title: "Recovery Run",
        excerpt: "A run.",
        date: "2026-04-12",
        location: "Zilker Park",
        image: "https://cdn/i.jpg",
      },
      SETTINGS,
    );

    expect(schema["@type"]).toBe("Event");
    expect(schema.startDate).toBe("2026-04-12");
    expect(schema.url).toBe("https://brainfoodrecovery.com/events/recovery-run");
    expect(schema.location.name).toBe("Zilker Park");
  });

  it("omits location entirely when there is none", () => {
    const schema = eventSchema(
      { slug: "x", title: "X", excerpt: "", date: "2026-01-01", location: "" },
      SETTINGS,
    );
    expect(schema).not.toHaveProperty("location");
  });
});

describe("blogPostingSchema", () => {
  it("emits a BlogPosting with keywords from tags", () => {
    const schema = blogPostingSchema(
      {
        slug: "habits",
        title: "5 Daily Habits",
        excerpt: "Habits.",
        date: "2026-03-18",
        tags: ["routine", "self-care"],
        category: "Wellness",
      },
      SETTINGS,
    );

    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.keywords).toBe("routine, self-care");
    expect(schema.mainEntityOfPage).toBe("https://brainfoodrecovery.com/blog/habits");
    // No dateModified in the source → falls back to the publish date.
    expect(schema.dateModified).toBe("2026-03-18");
  });
});

describe("breadcrumbSchema", () => {
  it("numbers items from 1", () => {
    const schema = breadcrumbSchema(
      [
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ],
      SETTINGS,
    );
    expect(schema.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(schema.itemListElement[1].item).toBe("https://brainfoodrecovery.com/blog");
  });

  it("returns undefined for an empty trail", () => {
    expect(breadcrumbSchema([], SETTINGS)).toBeUndefined();
  });
});
