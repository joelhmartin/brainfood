import { describe, it, expect } from "vitest";
import {
  pruneEmpty,
  formatTitle,
  absoluteUrl,
  organizationSchema,
  eventSchema,
  blogPostingSchema,
  breadcrumbSchema,
  serviceSchema,
  websiteSchema,
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

describe("serviceSchema", () => {
  const SERVICE = {
    slug: "coaching",
    navLabel: "Recovery & Mental Health Coaching",
    // Deliberately a sentence fragment, as the real content is — the schema must
    // not use it as the name.
    title: "One-on-one coaching for",
    tagline: "Personalized coaching that turns insight into daily action.",
    whoFor: ["People early in recovery", "Anyone rebuilding after treatment"],
    lookLike: ["Regular one-on-one sessions", "Practical skill-building"],
    image: "/images/coaching.webp",
  };

  it("names the service from navLabel, never the fragment in `title`", () => {
    const schema = serviceSchema(SERVICE, SETTINGS);
    expect(schema.name).toBe("Recovery & Mental Health Coaching");
    expect(schema.name).not.toBe(SERVICE.title);
  });

  it("uses an absolute URL for the service page", () => {
    expect(serviceSchema(SERVICE, SETTINGS).url).toBe(
      "https://brainfoodrecovery.com/services/coaching",
    );
  });

  it("nests the provider with the business name", () => {
    const schema = serviceSchema(SERVICE, SETTINGS);
    expect(schema.provider["@type"]).toBe("ProfessionalService");
    expect(schema.provider.name).toBe("Brain Food Recovery Services");
  });

  it("turns lookLike into an offer catalog", () => {
    const catalog = serviceSchema(SERVICE, SETTINGS).hasOfferCatalog;
    expect(catalog.itemListElement).toHaveLength(2);
    expect(catalog.itemListElement[0].itemOffered.name).toBe("Regular one-on-one sessions");
  });

  it("omits audience and catalog when the service has neither", () => {
    const schema = serviceSchema({ slug: "x", navLabel: "X", tagline: "t" }, SETTINGS);
    expect(schema.hasOfferCatalog).toBeUndefined();
    expect(schema.audience).toBeUndefined();
  });

  it("omits the blank phone rather than publishing an empty telephone", () => {
    // SETTINGS.phone is "" — an empty telephone in structured data is worse
    // than no telephone at all.
    expect(serviceSchema(SERVICE, SETTINGS).provider.telephone).toBeUndefined();
  });
});

describe("websiteSchema", () => {
  it("describes the site with an absolute url and publisher", () => {
    const schema = websiteSchema(SETTINGS);
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.name).toBe("Brain Food Recovery Services");
    expect(schema.url).toBe("https://brainfoodrecovery.com");
    expect(schema.publisher.name).toBe("Brain Food Recovery Services");
    expect(schema.inLanguage).toBe("en-US");
  });

  it("declares no SearchAction, because the site has no search endpoint", () => {
    // A potentialAction pointing at a URL template the site cannot serve is
    // worse than declaring none.
    expect(websiteSchema(SETTINGS).potentialAction).toBeUndefined();
  });

  it("omits url entirely when siteUrl is unset, rather than emitting an empty string", () => {
    const schema = websiteSchema({ ...SETTINGS, siteUrl: "" });
    expect(schema.url).toBeUndefined();
    expect(schema.publisher.url).toBeUndefined();
  });
});
