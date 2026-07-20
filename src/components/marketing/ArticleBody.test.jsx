import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ArticleBody } from "./ArticleBody.jsx";

/**
 * ArticleBody is the render path for every post/event body (Task 5 wired it
 * into BlogPost.jsx / EventDetail.jsx in place of two duplicated inline
 * renderers). These tests cover the two shapes it must handle forever:
 * legacy markdown-lite rows (converted on the fly) and HTML rows authored
 * with the new editor (passed through, minus anything sanitizeHtml strips).
 */
describe("ArticleBody", () => {
  it("renders null for empty content", () => {
    expect(renderToStaticMarkup(<ArticleBody html="" />)).toBe("");
    expect(renderToStaticMarkup(<ArticleBody html={null} />)).toBe("");
  });

  it("converts legacy markdown-lite input into real HTML elements", () => {
    const legacy = "## Heading\n\nSome **bold** text.\n\n- one\n- two";
    const markup = renderToStaticMarkup(<ArticleBody html={legacy} />);

    expect(markup).toContain('class="article-body"');
    expect(markup).toContain("<h2>Heading</h2>");
    expect(markup).toContain("<strong>bold</strong>");
    expect(markup).toContain("<ul>");
    expect(markup.match(/<li>/g)).toHaveLength(2);
    // No leftover markdown-lite syntax.
    expect(markup).not.toContain("##");
    expect(markup).not.toContain("**");
  });

  it("passes already-authored HTML through untouched (aside from sanitizing)", () => {
    const html = "<p>Hello <strong>world</strong></p><ul><li>item</li></ul>";
    const markup = renderToStaticMarkup(<ArticleBody html={html} />);

    expect(markup).toContain("<p>Hello <strong>world</strong></p>");
    expect(markup).toContain("<ul><li>item</li></ul>");
  });

  it("strips dangerous content from HTML input at render time", () => {
    const html = '<p onclick="steal()">click</p><script>alert(1)</script>';
    const markup = renderToStaticMarkup(<ArticleBody html={html} />);

    expect(markup).not.toContain("onclick");
    expect(markup).not.toContain("<script>");
  });
});
