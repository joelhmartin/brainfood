import { describe, it, expect } from "vitest";
import { legacyToHtml, looksLikeHtml } from "./legacyToHtml.js";

describe("legacyToHtml", () => {
  it("returns empty string for empty input", () => {
    expect(legacyToHtml("")).toBe("");
    expect(legacyToHtml(null)).toBe("");
  });

  it("converts ## and ### to h2 and h3", () => {
    expect(legacyToHtml("## Big")).toContain("<h2>Big</h2>");
    expect(legacyToHtml("### Small")).toContain("<h3>Small</h3>");
  });

  it("groups consecutive dash lines into ONE ul", () => {
    const html = legacyToHtml("- one\n- two\n- three");
    expect(html.match(/<ul>/g)).toHaveLength(1);
    expect(html.match(/<li>/g)).toHaveLength(3);
  });

  it("starts a new list after a blank line", () => {
    expect(legacyToHtml("- a\n\n- b").match(/<ul>/g)).toHaveLength(2);
  });

  it("converts **bold** mid-sentence and leaves no asterisks", () => {
    const html = legacyToHtml("Some **strong** words");
    expect(html).toContain("<strong>strong</strong>");
    expect(html).not.toContain("**");
  });

  it("wraps other lines in paragraphs", () => {
    expect(legacyToHtml("Just a line")).toContain("<p>Just a line</p>");
  });

  it("escapes stray angle brackets in legacy text", () => {
    expect(legacyToHtml("5 < 10")).not.toContain("< 10");
  });
});

describe("legacyToHtml pretty mode", () => {
  it("separates blocks with a blank line and indents list items", () => {
    expect(legacyToHtml("## Title\n\n- a\n- b", { pretty: true })).toBe(
      "<h2>Title</h2>\n\n<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>",
    );
  });

  it("produces the same markup as compact mode once whitespace is collapsed", () => {
    const source = "## Title\n\nA **bold** line.\n\n- one\n- two\n\n### Sub\n\nTail.";
    const collapse = (html) => html.replace(/>\s+</g, "><").trim();
    expect(collapse(legacyToHtml(source, { pretty: true }))).toBe(
      collapse(legacyToHtml(source)),
    );
  });

  it("still reads as HTML to the render-time detector", () => {
    expect(looksLikeHtml(legacyToHtml("## Title", { pretty: true }))).toBe(true);
  });
});

describe("looksLikeHtml", () => {
  it("detects HTML", () => {
    expect(looksLikeHtml("<p>hi</p>")).toBe(true);
  });
  it("treats markdown-lite as not HTML", () => {
    expect(looksLikeHtml("## Title\n- item")).toBe(false);
  });
  it("handles empty input", () => {
    expect(looksLikeHtml("")).toBe(false);
    expect(looksLikeHtml(null)).toBe(false);
  });
});
