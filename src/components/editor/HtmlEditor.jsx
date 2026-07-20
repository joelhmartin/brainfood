"use client";

import { useCallback, useRef } from "react";
import { SNIPPETS } from "../../config/snippets.js";

const FIELD =
  "w-full px-4 py-3 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10";

/**
 * Groups snippets by their `group` field for the <optgroup> dropdown,
 * preserving the order groups first appear in SNIPPETS (Text, Media,
 * Components).
 */
function groupSnippets(snippets) {
  const groups = new Map();
  for (const snippet of snippets) {
    if (!groups.has(snippet.group)) groups.set(snippet.group, []);
    groups.get(snippet.group).push(snippet);
  }
  return groups;
}

const GROUPED_SNIPPETS = groupSnippets(SNIPPETS);

/**
 * A deliberately simple HTML code editor for post/event bodies: a monospace
 * textarea plus a snippet dropdown. No WYSIWYG, no syntax highlighting — the
 * user asked for exactly this ("just have it able to tab in between, no
 * need to make it an in-depth editor").
 *
 * Accessibility note on Tab: this field captures Tab to insert two spaces
 * (the user explicitly asked to be able to "tab in between" inside the
 * snippet), which means Tab does not move focus to the next field while
 * the textarea is focused. Escape blurs the textarea (returning focus to
 * <body>) so Tab is no longer captured — the documented way out is Escape
 * then Tab, stated in the hint text below the textarea so keyboard users
 * are not stuck. Note this does not guarantee landing on the very next
 * form field (browsers resume tab order from the top of the document once
 * nothing is focused); it guarantees the field is escapable, which is the
 * property that matters here.
 */
export function HtmlEditor({ value, onChange, id }) {
  const textareaRef = useRef(null);

  /**
   * Inserts `text` at the current cursor position (replacing any existing
   * selection) and restores focus with the cursor placed right after the
   * inserted text. Deferred to the next animation frame so it runs after
   * React has committed the new `value` to the DOM.
   */
  const insertAtCursor = useCallback(
    (text) => {
      const el = textareaRef.current;
      const current = value ?? "";
      const start = el ? (el.selectionStart ?? current.length) : current.length;
      const end = el ? (el.selectionEnd ?? current.length) : current.length;
      const next = current.slice(0, start) + text + current.slice(end);
      onChange(next);

      const cursor = start + text.length;
      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursor, cursor);
      });
    },
    [value, onChange],
  );

  const handleSnippetSelect = (e) => {
    const snippetId = e.target.value;
    if (!snippetId) return;
    const snippet = SNIPPETS.find((s) => s.id === snippetId);
    if (snippet) insertAtCursor(snippet.html);
    // Reset the (uncontrolled) dropdown so the same snippet can be chosen again.
    e.target.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  };

  return (
    <div>
      <select
        onChange={handleSnippetSelect}
        defaultValue=""
        aria-label="Insert HTML snippet"
        className={`${FIELD} mb-2`}
      >
        <option value="" disabled>
          Insert a snippet…
        </option>
        {[...GROUPED_SNIPPETS.entries()].map(([group, snippets]) => (
          <optgroup key={group} label={group}>
            {snippets.map((snippet) => (
              <option key={snippet.id} value={snippet.id}>
                {snippet.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        rows={20}
        className={`${FIELD} font-mono resize-none`}
      />

      <p className="mt-1 text-xs text-navy/30">
        Tab inserts two spaces instead of moving focus. Press Esc first to
        leave this field, then Tab normally.
      </p>
    </div>
  );
}
