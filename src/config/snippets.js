/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SNIPPET LIBRARY — pre-stored HTML blocks for the post/event body editor.
 *
 * Each snippet is deliberately CLEAN HTML with no utility classes — the
 * `.article-body` block in app/globals.css already styles bare tags
 * (h2, h3, p, ul, ol, li, a, strong, blockquote, img, hr, details, summary),
 * so a snippet stays short and readable, and stays easy to hand-edit after
 * an author drops it into the editor. The two exceptions below (`cta-card`,
 * `cta-button`) are a small, explicitly-scoped addition to that same CSS
 * block — see the comment above the CTA card entry.
 *
 * `group` drives the dropdown's optgroups: "Text" / "Media" / "Components".
 * Placeholder copy is written in the Brain Food voice so it reads naturally
 * even before an author replaces it.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const SNIPPETS = [
  // ── Text ─────────────────────────────────────────────────────────────────

  {
    id:    "heading",
    label: "Heading (H2)",
    group: "Text",
    html:  `<h2>Replace This With Your Heading</h2>`,
  },
  {
    id:    "subheading",
    label: "Subheading (H3)",
    group: "Text",
    html:  `<h3>Replace This With Your Subheading</h3>`,
  },
  {
    id:    "paragraph",
    label: "Paragraph",
    group: "Text",
    html:  `<p>Replace this paragraph with your own copy. Keep sentences short, lead with the reader's situation, and end with a clear next step—this is the tone that carries across the rest of the site.</p>`,
  },
  {
    id:    "bullet-list",
    label: "Bullet List",
    group: "Text",
    html:  `<ul>
  <li>Replace this with your first point</li>
  <li>Add as many list items as you need</li>
  <li>Keep each point short and specific</li>
</ul>`,
  },
  {
    id:    "numbered-list",
    label: "Numbered List",
    group: "Text",
    html:  `<ol>
  <li>Replace this with the first step</li>
  <li>Replace this with the second step</li>
  <li>Replace this with the third step</li>
</ol>`,
  },
  {
    id:    "link",
    label: "Link",
    group: "Text",
    html:  `<p>Ready to take the next step? <a href="/contact">Reach out to our team</a> to set up a conversation.</p>`,
  },
  {
    id:    "pull-quote",
    label: "Pull Quote",
    group: "Text",
    html:  `<blockquote>Replace this with a meaningful quote from a client, clinician, or team member.</blockquote>`,
  },
  {
    id:    "divider",
    label: "Divider",
    group: "Text",
    html:  `<hr>`,
  },

  // ── Media ────────────────────────────────────────────────────────────────

  {
    id:    "image",
    label: "Image",
    group: "Media",
    // `alt` is included (not omitted) so an author has to fill it in rather
    // than skip it entirely — see the task brief's accessibility note.
    html:  `<img src="/images/your-image.jpg" alt="Replace with a description of this image">`,
  },

  // ── Components ───────────────────────────────────────────────────────────

  {
    id:    "faq-accordion",
    label: "FAQ Accordion",
    group: "Components",
    // Native <details>/<summary>: no JavaScript, server-renders, keyboard and
    // screen-reader accessible for free, and the answer text sits in the HTML
    // where crawlers read it. Two pairs shown so the copy/paste pattern for
    // adding a third is obvious.
    html:  `<details>
  <summary>Replace this with your first question</summary>
  <p>Replace this with the answer to the first question. Keep it clear and specific.</p>
</details>
<details>
  <summary>Replace this with your second question</summary>
  <p>Replace this with the answer to the second question. Copy either block to add more.</p>
</details>`,
  },
  {
    id:    "cta-card",
    label: "CTA Card",
    group: "Components",
    // .cta-card / .cta-button are the one deliberate exception to "no utility
    // classes": .article-body has nothing that renders a card container or a
    // button-styled link, and this needs both to match CtaBanner.jsx's visual
    // language (solid brand-500 card, white heading/body, white pill button).
    // See the small ".article-body .cta-card ..." block added to
    // app/globals.css right after the existing details/summary rules.
    html:  `<div class="cta-card">
  <h3>Ready to talk about next steps?</h3>
  <p>Reach out today to set up a free, no-pressure conversation about coaching, companion support, or family services.</p>
  <a class="cta-button" href="/contact">Schedule a Consultation</a>
</div>`,
  },
];

export function getSnippet(id) {
  return SNIPPETS.find((s) => s.id === id);
}
