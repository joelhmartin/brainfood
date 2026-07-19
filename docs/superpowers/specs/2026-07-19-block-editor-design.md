# Block Editor for Posts & Events — Design

**Date:** 2026-07-19
**Status:** Approved for planning

## Why

The post and event editors are bare `<textarea rows={12}>` fields
(`src/screens/app/PostsAdminPage.jsx:161`, `src/screens/app/EventsAdminPage.jsx:136`). There is
no formatting UI at all. Authors have to know an undocumented markup dialect by heart.

That dialect is a hand-rolled "markdown-lite" parser, **duplicated** in
`src/screens/marketing/BlogPost.jsx:25` and `src/screens/marketing/EventDetail.jsx:20`, with
subtly different styling between the two copies (`boldify` emits `text-navy` in one and
`text-navy/80` in the other). It supports only `## `, `### `, `- `, and `**bold**`. Anything
else — a link, an image, a quote, emphasis — is impossible.

It also renders through `dangerouslySetInnerHTML`.

Separately, the user wants article content to **reuse real site components** (an FAQ accordion
was the named example). A plain string body cannot express that.

## Scope

Replace the textareas with a block editor storing structured JSON, add a source view, render it
server-side through an allowlisted node map, and improve the surrounding authoring experience.

### In scope

1. **Block editor** (TipTap/ProseMirror) for post and event bodies.
2. **Source tab** — view and edit the underlying document, tabbing between visual and source.
3. **Component blocks** — an FAQ accordion (net-new component) and a CTA card, alongside
   image and standard text blocks.
4. **Shared server-side renderer** replacing both copies of `RenderBody`.
5. **Editing UX:** live preview, image insert/upload, autosave, SEO fields.
6. **Migration** of the existing 3 posts and 3 events, with legacy fallback.

### Out of scope

- AI assist (draft/rewrite/SEO generation). Still queued in
  `BACKLOG-ai-admin-and-email.md`; this spec deliberately picks a storage format that suits it.
- Mailgun DNS cutover, the `/products` orphan page, and public-site redesign.

## Storage

TipTap emits a ProseMirror JSON document. Storage decision:

- **Add `body_json jsonb`** to `posts` and `events`. This becomes the source of truth.
- **Keep `body text`** as a derived plain-text mirror, written on every save.

Keeping `body` matters for three existing consumers: `estimateReadTime()`
(`src/lib/mappers.js`), excerpt/search text, and — critically — **legacy fallback**. A row with
`body_json = null` renders through the old markdown-lite path, so nothing breaks mid-migration
and old drafts never become unreadable.

`jsonb` rather than stuffing JSON into the existing text column: it is queryable, validated by
Postgres, and self-documenting. RLS policies on both tables already gate by `published`, and
adding a column does not change them.

## Architecture

```
ADMIN (client)                         PUBLIC (server)
──────────────                         ───────────────
BlockEditor (TipTap)                   renderDocument(body_json)
  ├─ toolbar                             ├─ allowlisted node map → JSX
  ├─ Visual │ Source tabs                ├─ paragraph/heading/list → brand typography
  ├─ image upload → Supabase media       ├─ faqAccordion → <FaqAccordion/>
  ├─ FAQ / CTA block inserts             └─ ctaCard      → <CtaCard/>
  └─ autosave                            (no TipTap in the public bundle)
        │
        └── body_json (jsonb) + body (derived plaintext)
```

### Files

**Created**
- `src/components/editor/BlockEditor.jsx` — the editor shell: toolbar, tabs, autosave wiring.
- `src/components/editor/extensions/faqAccordion.js` — custom TipTap node.
- `src/components/editor/extensions/ctaCard.js` — custom TipTap node.
- `src/lib/content/renderDocument.jsx` — **server-side** JSON → JSX renderer.
- `src/lib/content/documentToText.js` — JSON → plain text (for `body`, read-time, excerpts).
- `src/lib/content/legacyToDocument.js` — markdown-lite → TipTap JSON, for migration.
- `src/components/marketing/FaqAccordion.jsx` — net-new; no accordion exists in the codebase.
- `supabase/migrations/<ts>_body_json.sql`
- Tests for the renderer, the text extractor, and the legacy converter.

**Modified**
- `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx` — editor + UX.
- `src/screens/marketing/BlogPost.jsx`, `src/screens/marketing/EventDetail.jsx` — both
  `RenderBody` copies deleted, replaced by the shared renderer.
- `src/lib/mappers.js` — map `body_json`.
- `src/stores/posts.store.js`, `src/stores/events.store.js` — persist `body_json`.

### Rendering, and a security improvement

The public renderer walks the JSON and maps each node type to JSX through an **allowlist**.
An unknown node type renders nothing rather than falling through to raw output.

This **removes `dangerouslySetInnerHTML` from the article path entirely** — today's parser
injects HTML built by regex. Node-to-component mapping is structurally safer.

The renderer runs in a **Server Component**. TipTap must never enter the public bundle; only the
admin loads the editor. Typography is ported verbatim from the current `RenderBody` so published
posts look identical.

## Blocks

**Text:** paragraph, H2, H3, bullet list, ordered list, bold, italic, link, blockquote.
Ordered lists, links, italics and quotes are all new capability — the old dialect had none.

**Image:** reuses the existing Supabase `media` bucket and its admin-only storage RLS
(`src/components/ui/ImageUpload.jsx`), so no new upload path or policy is introduced.

**FAQ accordion:** the user's named example. A new `FaqAccordion` marketing component plus a
TipTap node holding a list of question/answer pairs. Must be accessible — real
`<button>` triggers, `aria-expanded`, keyboard operable — and server-rendered so the Q&A text is
in the HTML for crawlers. This is a content type search engines surface well, so the answer text
must not be JS-gated.

**CTA card:** heading, body, button label, href — styled from the existing `CtaBanner`.

## Source tab

Visual and Source tabs over the same document. Source shows formatted JSON, is editable, and
round-trips back to the visual editor on valid input. Invalid JSON shows an inline error and
**blocks the tab switch** rather than silently discarding work.

The existing `src/components/ui/Tabs.jsx` is a sticky marketing layout component and is not
suitable; the editor needs a small, plain tab control.

## Editing UX

- **Live preview** — renders through the same `renderDocument` the public site uses, so preview
  and published output cannot drift.
- **Image upload** — drag/drop and toolbar insert via the existing `media` bucket.
- **Autosave** — debounced draft saves with a visible "saving/saved" indicator. Autosave must
  **never publish**; `published` stays under explicit control.
- **SEO fields** — meta description, OG image, slug, surfaced in the editor. These already feed
  `generateMetadata` and JSON-LD; today they are not editable per post.

## Migration

`legacyToDocument()` converts the markdown-lite dialect (`## `, `### `, `- `, `**bold**`) to
TipTap JSON. A one-off script backfills the 3 posts and 3 events.

The migration is **non-destructive**: `body` is left intact, and rows without `body_json` keep
rendering through the legacy path. Backfill can be re-run safely.

## Error handling

- Malformed or missing `body_json` → fall back to legacy `body`; never a blank article.
- Unknown node type → skipped, with a server-side warning.
- Autosave failure → surfaced, non-destructive; the editor keeps the unsaved buffer.
- Image upload failure → inline error; the document is not mutated.

## Testing

- **Renderer:** each node type produces the expected element and brand classes; unknown nodes are
  skipped; malformed input falls back rather than throwing.
- **Legacy converter:** every construct of the old dialect round-trips; the existing 3 posts
  convert without content loss.
- **Text extractor:** plain text matches what read-time estimation expects.
- **FAQ accordion:** answer text present in server-rendered HTML (crawlability), and keyboard
  operable.
- **E2E:** create a post with mixed blocks, save, publish, confirm it renders on the public page.
- The repo has no React Testing Library; follow the established
  extract-a-pure-function-and-test-it pattern.

## Risks

- **Biggest: rendering parity.** Published posts must look unchanged. Typography is ported
  verbatim and verified by comparing rendered output for the existing posts before and after.
- **Bundle size.** TipTap is heavy; it must be admin-only and code-split. The public route
  bundle should not grow.
- **Autosave vs. publish.** An autosave that writes to a published row would edit live content
  silently. Drafts and published state must stay distinct.
- **Scope.** This is the largest feature since the migration. It is decomposed so the editor,
  the renderer, and the UX layer land independently.
- **`revalidatePath` on publish** already exists and must keep working — the publish path is
  unchanged, only the payload shape differs.
