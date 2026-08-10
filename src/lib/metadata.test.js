import { describe, it, expect } from "vitest";
import { buildMetadata } from "./metadata.js";

const settings = {
  name: "Brain Food",
  titleTemplate: "%s | Brain Food",
  defaultTitle: "Brain Food — Recovery Coaching",
  defaultDesc: "Default description.",
  siteUrl: "https://brainfoodrecovery.com",
  ogImage: null,
  seoIndexable: true,
  gscVerification: "",
};

describe("buildMetadata", () => {
  it("applies the title template", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.title).toBe("About | Brain Food");
  });

  it("sets a canonical absolute URL", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.alternates.canonical).toBe("https://brainfoodrecovery.com/about");
  });

  it("falls back to the default description", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.description).toBe("Default description.");
  });

  it("emits noindex when the site is not indexable", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings: { ...settings, seoIndexable: false } });
    expect(m.robots.index).toBe(false);
    expect(m.alternates).toBeUndefined();
  });

  it("emits noindex when the page asks for it, even on an indexable site", () => {
    const m = buildMetadata({ title: "404", path: "/nope", noindex: true, settings });
    expect(m.robots.index).toBe(false);
  });

  it("always requests the large twitter card", () => {
    // Every page has a 1200×630 image now: its own, or the generated fallback
    // from app/opengraph-image.js. "summary" would render that at thumbnail
    // size for no reason.
    const plain = buildMetadata({ title: "A", path: "/a", settings });
    expect(plain.twitter.card).toBe("summary_large_image");
    const withImg = buildMetadata({ title: "A", path: "/a", image: "/og.jpg", settings });
    expect(withImg.twitter.card).toBe("summary_large_image");
  });

  it("sets an explicit image when the page has one", () => {
    const m = buildMetadata({ title: "A", path: "/a", image: "/og.jpg", settings });
    expect(m.openGraph.images).toEqual(["/og.jpg"]);
    expect(m.twitter.images).toEqual(["/og.jpg"]);
  });

  it("falls back to the generated social card when the page has no image of its own", () => {
    // Without this every page but a blog post shipped with no og:image, so
    // shared links rendered as a bare text row with no preview.
    const m = buildMetadata({ title: "A", path: "/a", settings });
    expect(m.openGraph.images).toEqual(["https://brainfoodrecovery.com/opengraph-image"]);
    expect(m.twitter.images).toEqual(["https://brainfoodrecovery.com/opengraph-image"]);
  });

  it("prefers the page's own image over the generated card", () => {
    const m = buildMetadata({ title: "A", path: "/a", image: "/og.jpg", settings });
    expect(m.openGraph.images).toEqual(["/og.jpg"]);
  });

  it("omits images entirely when there is no siteUrl to build an absolute URL from", () => {
    // A relative og:image is invalid per the Open Graph spec, and siteUrl is
    // deliberately empty until go-live — better no image than an invalid one.
    const m = buildMetadata({ title: "A", path: "/a", settings: { ...settings, siteUrl: "" } });
    expect("images" in m.openGraph).toBe(false);
    expect("images" in m.twitter).toBe(false);
  });

  it("sets metadataBase from a valid siteUrl, so og:url never ships relative", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings });
    expect(m.metadataBase).toBeInstanceOf(URL);
    expect(m.metadataBase.href).toBe("https://brainfoodrecovery.com/");
  });

  it("leaves metadataBase undefined when siteUrl is empty (today's pre-launch state)", () => {
    const m = buildMetadata({ title: "About", path: "/about", settings: { ...settings, siteUrl: "" } });
    expect(m.metadataBase).toBeUndefined();
  });

  it("does not throw and falls back to undefined when siteUrl is malformed", () => {
    expect(() =>
      buildMetadata({ title: "About", path: "/about", settings: { ...settings, siteUrl: "not a url" } }),
    ).not.toThrow();
    const m = buildMetadata({ title: "About", path: "/about", settings: { ...settings, siteUrl: "not a url" } });
    expect(m.metadataBase).toBeUndefined();
  });
});
