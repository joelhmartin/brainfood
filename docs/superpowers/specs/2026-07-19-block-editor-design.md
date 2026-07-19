# HTML Editor + Snippet Library for Posts & Events — Design

**Date:** 2026-07-19
**Status:** Approved for planning
**Supersedes:** the block-editor design previously in this file (TipTap / ProseMirror JSON).
That approach was scoped down at the user's direction: *"Just make it a code editor. Give me
pre-stored HTML snippets for different components that I can choose from a dropdown. No need to
make it an in-depth editor."*

## Why

The post and event body fields are bare `<textarea rows={12}>`
(`src/screens/app/PostsAdminPage.jsx:164`, `src/screens/app/EventsAdminPage.jsx:139`) with no
formatting help of any kind.

What they accept is a hand-rolled "markdown-lite" dialect, **duplicated** across
`src/screens/marketing/BlogPost.jsx:26` and `src/screens/marketing/EventDetail.jsx:20`, and the
two copies have already drifted (`boldify` emits `text-navy` in one, `text-navy/80` in the
other). It supports exactly four things: `## `, `### `, `- `, `**bold**`. No links, images,
quotes, ordered lists, or emphasis. Authors must know the dialect by memory.

## Scope

Turn the body field into an **HTML code editor** with a **dropdown of pre-written component
snippets**, and render that HTML with the site's existing article typography.

### In scope

1. Body content becomes **HTML**, stored in the existing `body` column.
2. A **snippet library** — a dropdown that inserts ready-made component HTML at the cursor.
3. A **code editor**: monospace, tab support, reasonable height. Not a WYSIWYG.
4. A **shared renderer** replacing both `RenderBody` copies.
5. **Scoped article typography** so any HTML renders on-brand.
6. **One-time conversion** of the 3 existing posts and 3 events, with legacy fallback.

### Explicitly not in scope

- WYSIWYG / rich-text / block editing. Rejected by the user.
- ProseMirror, TipTap, or any editor framework.
- A schema change. `body` stays `text`.
- Live preview, autosave, SEO fields. Dropped with the block-editor plan.
- AI assist — still queued in `BACKLOG-ai-admin-and-email.md`.

## Storage

**No schema change.** `body` remains `text`; its contents become HTML instead of markdown-lite.

`estimateReadTime()` (`src/lib/mappers.js`) consumes `body` and counts words — HTML tags would
inflate the count, so it needs tags stripped before counting.

## Architecture

```
ADMIN (client)                        PUBLIC (server component)
──────────────                        ─────────────────────────
HtmlEditor                            <ArticleBody html={post.body} />
  ├─ snippet dropdown ──inserts──┐      ├─ sanitize (strip script/handlers)
  └─ <textarea> monospace, tab   │      └─ dangerouslySetInnerHTML
                                 │           inside .article-body
        SNIPPETS ────────────────┘           (scoped brand typography)
     src/config/snippets.js
```

### Files

**Created**
- `src/config/snippets.js` — the snippet library. Plain data, version-controlled.
- `src/components/editor/HtmlEditor.jsx` — textarea + dropdown.
- `src/components/marketing/ArticleBody.jsx` — the shared renderer.
- `src/lib/content/sanitizeHtml.js` — strips `<script>` and event handlers.
- `src/lib/content/legacyToHtml.js` — markdown-lite → HTML, for conversion + fallback.
- Tests for the two pure modules.

**Modified**
- `app/globals.css` — the `.article-body` scoped typography block.
- `src/screens/marketing/BlogPost.jsx`, `src/screens/marketing/EventDetail.jsx` — both
  `RenderBody`/`boldify` copies deleted.
- `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx`.
- `src/lib/mappers.js` — strip tags before counting words.

### Typography via a scoped style block

The current renderer *is* the typography: it applies `text-navy/65`, `text-[17px]`,
`leading-[1.8]`, `font-heading` headings, brand-colored bullets. Rendering raw HTML would bypass
all of it and published posts would come out unstyled.

Rather than baking Tailwind classes into every snippet, `app/globals.css` gets a block scoped to
`.article-body` (`.article-body h2 { … }`, `.article-body p { … }`, …) reproducing the current
styles exactly. Consequences:

- Snippets stay clean and readable (`<h2>Title</h2>`, not a wall of utility classes).
- Hand-typed HTML is styled correctly too.
- Article typography has **one** definition instead of two drifted copies.

### Snippet library

`src/config/snippets.js` exports an array of `{ id, label, group, html }`. It sits beside the
other config files (`site.js`, `services.js`, `brand.js`) and follows their conventions.

Planned snippets: heading, subheading, paragraph, bullet list, numbered list, link, image,
pull quote, **FAQ accordion**, CTA card, button, divider.

**The FAQ accordion uses native `<details>`/`<summary>`** — a real accordion with **no
JavaScript**. It server-renders, is keyboard accessible and screen-reader friendly for free, and
its answer text is in the HTML where crawlers can read it. FAQ content is exactly what search
engines surface, so that matters.

Adding a snippet later is a one-line edit to this file.

### Sanitization

Body HTML is rendered with `dangerouslySetInnerHTML` — as it already is today, via
regex-built strings.

Only invited admins can write content (single `admin` role, public sign-up disabled), so this is
not an untrusted-input surface. Still, `sanitizeHtml()` strips `<script>` tags and inline event
handlers (`onerror=`, `onclick=`, …) on render. Cheap, and it means a pasted snippet from the
web cannot silently execute.

Sanitizing at **render** rather than save means already-stored content is covered too.

## Migration

`legacyToHtml()` converts the markdown-lite dialect to HTML (`## ` → `<h2>`, `### ` → `<h3>`,
`- ` → `<ul><li>`, `**bold**` → `<strong>`).

It serves two purposes: a one-time conversion of existing rows, and a **render-time fallback**.
Detecting legacy content is straightforward — markdown-lite has no `<` tags. Content without
them converts on the fly, so no row can render as raw `## Heading` text, even if conversion is
skipped or a row is missed.

## Error handling

- Empty or null `body` → renders nothing, never a crash.
- Legacy (non-HTML) content → converted on the fly.
- Malformed HTML → browsers are tolerant; no parse step to fail.
- `estimateReadTime` strips tags first, so word counts stay honest.

## Testing

- **`legacyToHtml`:** every construct of the old dialect; consecutive `- ` lines group into one
  `<ul>`; blank line ends a list; `**bold**` works mid-sentence; the 3 real seeded posts convert
  without text loss.
- **`sanitizeHtml`:** strips `<script>` and `on*=` handlers; leaves legitimate markup and
  attributes (`href`, `src`, `alt`, `class`) intact.
- **Read time:** a body full of tags produces the same estimate as its plain-text equivalent.
- **Rendering parity:** the seeded posts render with the same visual result as before.
- **E2E:** insert a snippet in the admin, save, publish, confirm it renders publicly.
- No React Testing Library in this repo — follow the established
  extract-a-pure-function-and-test-it pattern.

## Risks

- **Rendering parity is the main risk.** The `.article-body` block must reproduce the current
  typography exactly; verify by comparing rendered posts before and after.
- **Authors now write HTML.** That is the explicit ask, and the snippet dropdown is what keeps it
  approachable — the snippet set should cover the common cases well enough that hand-writing tags
  is rare.
- **Broken HTML is possible** (an unclosed tag can bleed into page layout). Sanitization does not
  fix malformed markup. Acceptable for a trusted single-admin site; a preview would mitigate it
  later if it becomes a nuisance.
