import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitizeHtml.js";

describe("sanitizeHtml", () => {
  it("removes script tags and their contents", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeHtml('<img src="a.jpg" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).toContain('src="a.jpg"');
  });

  it("strips javascript: urls", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("leaves legitimate markup and attributes intact", () => {
    const html = '<h2>Title</h2><p class="lead">Text <a href="/about">link</a></p><details><summary>Q</summary><p>A</p></details>';
    const out = sanitizeHtml(html);
    for (const frag of ["<h2>Title</h2>", 'class="lead"', 'href="/about"', "<details>", "<summary>Q</summary>"]) {
      expect(out).toContain(frag);
    }
  });

  it("handles empty input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
  });
});
