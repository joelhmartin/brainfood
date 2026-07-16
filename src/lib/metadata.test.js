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

  it("uses summary_large_image only when an image exists", () => {
    const plain = buildMetadata({ title: "A", path: "/a", settings });
    expect(plain.twitter.card).toBe("summary");
    const withImg = buildMetadata({ title: "A", path: "/a", image: "/og.jpg", settings });
    expect(withImg.twitter.card).toBe("summary_large_image");
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
