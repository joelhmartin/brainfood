/**
 * Converter for the legacy "markdown-lite" dialect that post/event bodies
 * used before the HTML code editor (Task 2+) took over. Content is stored
 * as plain text in the same `body` column either way; this function is a
 * render-time fallback so old rows keep rendering correctly forever,
 * without a one-time data migration.
 *
 * Mirrors the control flow (and rule set) of the two duplicated inline
 * renderers this replaces:
 *   - src/screens/marketing/BlogPost.jsx (RenderBody, lines 26-88)
 *   - src/screens/marketing/EventDetail.jsx (RenderBody, lines 20-80)
 *
 * Rules:
 *   "## "  -> <h2>
 *   "### " -> <h3>
 *   "- "   -> <li>, consecutive lines grouped into one <ul>
 *   "**bold**" -> <strong>, may appear mid-sentence
 *   blank line -> flush the current list
 *   anything else -> <p>
 *
 * The `pretty` option produces the same markup with block-level newlines and
 * indented <li>s. Render-time conversion does not need it (the browser does not
 * care), but `scripts/migrate-legacy-bodies.mjs` writes its output back into the
 * `body` column, where a human then edits it in a monospace textarea — one
 * 2,000-character line would be unusable there.
 */

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function boldify(str) {
  return str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function legacyToHtml(text, { pretty = false } = {}) {
  if (!text) return "";

  const lines = text.split("\n");
  const htmlParts = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      const items = listBuffer.map((li) => `<li>${boldify(li)}</li>`);
      htmlParts.push(
        pretty
          ? `<ul>\n${items.map((li) => `  ${li}`).join("\n")}\n</ul>`
          : `<ul>${items.join("")}</ul>`,
      );
      listBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = escapeHtml(rawLine.trim());

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      htmlParts.push(`<h3>${boldify(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushList();
      htmlParts.push(`<h2>${boldify(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      htmlParts.push(`<p>${boldify(line)}</p>`);
    }
  }

  flushList();

  return htmlParts.join(pretty ? "\n\n" : "");
}

/**
 * Decides whether a stored body is already HTML (new editor) vs. the legacy
 * markdown-lite dialect. Markdown-lite never contains angle-bracket tags, so
 * the presence of one is the signal.
 */
export function looksLikeHtml(text) {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}
