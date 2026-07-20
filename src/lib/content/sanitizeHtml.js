/**
 * NOTE: This is a regex-based sanitizer, NOT a general-purpose HTML sanitizer
 * (no HTML parser, no allowlist/tag-tree walking). That is acceptable here
 * only because post/event body HTML is admin-authored — there is a single
 * `admin` role and public sign-up is disabled, so this is not untrusted
 * user input. Do not reuse this for anything that accepts content from the
 * public or from lower-trust roles; use a real sanitizer (e.g. DOMPurify)
 * for that.
 *
 * Applied at render time (not at save time) so it also covers content that
 * was already stored before this existed.
 *
 * Strips:
 *   - <script>...</script> blocks (and any stray unclosed <script> tag)
 *   - inline event handler attributes (onclick=, onerror=, etc.)
 *   - javascript: URLs in href/src attributes
 *
 * Leaves everything else alone, including <details>, <summary>, class,
 * href, src, alt — later tasks' snippets depend on those surviving.
 */
export function sanitizeHtml(html) {
  if (!html) return "";

  let out = html;

  // <script>...</script> blocks, plus any unclosed/self-closing <script> tag.
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<script\b[^>]*>/gi, "");

  // Inline event handlers: on click/error/load/etc., any quote style.
  out = out.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");
  out = out.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, "");

  // javascript: URLs in href/src — neutralize rather than strip the attribute.
  out = out.replace(/(href|src)(\s*=\s*)"\s*javascript:[^"]*"/gi, '$1$2"#"');
  out = out.replace(/(href|src)(\s*=\s*)'\s*javascript:[^']*'/gi, "$1$2'#'");

  return out;
}
