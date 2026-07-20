import { sanitizeHtml } from "../../lib/content/sanitizeHtml.js";
import { legacyToHtml, looksLikeHtml } from "../../lib/content/legacyToHtml.js";

/**
 * Renders an article body. Content authored before the HTML editor is stored in a
 * markdown-lite dialect, so anything that is not already HTML is converted on the fly —
 * that fallback is why no post can render as raw "## Heading" text.
 *
 * Typography lives in the .article-body block in globals.css, so snippets stay clean
 * HTML and hand-typed markup is styled the same way.
 */
export function ArticleBody({ html }) {
  if (!html) return null;
  const source = looksLikeHtml(html) ? html : legacyToHtml(html);
  return (
    <div
      className="article-body"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(source) }}
    />
  );
}
