import { sanitizeHtml } from "../../lib/content/sanitizeHtml.js";
import { legacyToHtml, looksLikeHtml } from "../../lib/content/legacyToHtml.js";

/**
 * Renders an article body. Content authored before the HTML editor is stored in a
 * markdown-lite dialect, so anything that is not already HTML is converted on the fly —
 * that fallback is why no post can render as raw "## Heading" text.
 *
 * Typography lives in the .article-body block in globals.css, so snippets stay clean
 * HTML and hand-typed markup is styled the same way.
 *
 * `variant` distinguishes the two callers' original, deliberately different typography:
 * BlogPost's long-form copy ("post", the default) vs. EventDetail's shorter, tighter
 * supporting copy ("event"). Passing "event" adds the `article-body--event` modifier
 * class, which globals.css uses to scope overrides — the default stays exactly
 * `class="article-body"` so blog post rendering (already pixel-verified) is untouched.
 */
export function ArticleBody({ html, variant = "post" }) {
  if (!html) return null;
  const source = looksLikeHtml(html) ? html : legacyToHtml(html);
  const className = variant === "event" ? "article-body article-body--event" : "article-body";
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(source) }}
    />
  );
}
