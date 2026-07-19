# Block Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare-textarea post/event editors with a TipTap block editor storing ProseMirror JSON, rendered server-side through an allowlisted node map, including an FAQ accordion block and a real authoring UX.

**Architecture:** `body_json jsonb` becomes the source of truth; `body text` is kept as a derived plaintext mirror and legacy fallback. The admin loads TipTap (client-only); the public site walks the JSON in a Server Component and maps nodes to brand-styled JSX — no TipTap in the public bundle, and no `dangerouslySetInnerHTML` in the article path.

**Tech Stack:** Next.js 15 App Router, React 18.3.1, JavaScript (`.jsx`/`.js`, **not** TypeScript), TipTap 3.28.0 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, `@tiptap/extension-link`, `@tiptap/extension-image`), Tailwind, Supabase, Vitest, Playwright.

## Global Constraints

- **Language stays JavaScript** (`.jsx`/`.js`). Do not introduce TypeScript.
- **Rendering parity is the top risk.** Published posts must look *identical* after this change. Port typography verbatim from the existing `RenderBody` implementations.
- **TipTap must never enter the public bundle.** Editor code is admin-only and dynamically imported. Verify the public route bundle does not grow.
- **The public renderer runs server-side** and must not use `dangerouslySetInnerHTML`. Unknown node types render nothing.
- **Migration is non-destructive.** Never overwrite or clear `body`. Rows without `body_json` must keep rendering via the legacy path.
- **Autosave must never publish.** `published` stays under explicit user control.
- **Do NOT flip `seoIndexable`** (currently `false` by design until the site is on its real domain).
- Do not modify `src/lib/api/auth.js`, `requirePermission`, `safeRedirectPath`, `src/lib/email/*`, or `app/api/contact/route.js`.
- **The RLS suite (`tests/rls.test.js`) is destructive** and is pinned to local Supabase via `.env.test.local`. Never point it at the hosted DB.
- **Do not touch the human's in-flight work:** `src/config/images.js` (modified) and `public/images/candid/` (untracked). Never `git add -A` / `git add .`; never `git stash`.
- Port numbers: 3000/3001 are occupied on this machine and `localhost` resolves `::1` first — use `127.0.0.1` with an explicit port, and check `lsof -ti :<port>` for stale servers before diagnosing config bugs.

## File Structure

**Created**
- `src/lib/content/documentToText.js` — JSON → plain text
- `src/lib/content/legacyToDocument.js` — markdown-lite → TipTap JSON
- `src/lib/content/renderDocument.jsx` — server-side JSON → JSX (allowlisted)
- `src/components/marketing/FaqAccordion.jsx` — net-new component
- `src/components/editor/BlockEditor.jsx` — editor shell (client)
- `src/components/editor/EditorTabs.jsx` — visual/source tab control
- `src/components/editor/extensions/faqAccordion.js`
- `src/components/editor/extensions/ctaCard.js`
- `supabase/migrations/<timestamp>_body_json.sql`
- `scripts/backfill-body-json.mjs`
- Tests alongside each pure module

**Modified**
- `src/lib/mappers.js`, `src/stores/posts.store.js`, `src/stores/events.store.js`
- `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx`
- `src/screens/marketing/BlogPost.jsx`, `src/screens/marketing/EventDetail.jsx`

---

### Task 1: Schema — `body_json` column

**Files:**
- Create: `supabase/migrations/<timestamp>_body_json.sql`
- Modify: `src/lib/mappers.js`
- Test: `src/lib/mappers.test.js` (exists — extend it)

**Interfaces:**
- Consumes: nothing.
- Produces: `posts.body_json jsonb null`, `events.body_json jsonb null`. `postFromRow`/`eventFromRow` expose `bodyJson`; `postToRow`/`eventToRow` persist it.

**Context:** `body_json` is nullable **on purpose** — a null means "legacy row, render from `body`". Read `src/lib/mappers.js` first and match its existing style exactly.

- [ ] **Step 1: Write the failing test**

Extend `src/lib/mappers.test.js`:

```js
describe("postFromRow / postToRow — body_json", () => {
  it("exposes body_json as bodyJson", () => {
    const doc = { type: "doc", content: [] };
    expect(postFromRow({ id: 1, slug: "a", body_json: doc }).bodyJson).toEqual(doc);
  });

  it("returns null bodyJson for a legacy row", () => {
    expect(postFromRow({ id: 1, slug: "a", body: "## Hi" }).bodyJson).toBeNull();
  });

  it("persists bodyJson back to body_json", () => {
    const doc = { type: "doc", content: [] };
    expect(postToRow({ slug: "a", bodyJson: doc }).body_json).toEqual(doc);
  });

  it("leaves body intact alongside body_json", () => {
    const row = postToRow({ slug: "a", body: "plain text", bodyJson: { type: "doc", content: [] } });
    expect(row.body).toBe("plain text");
  });
});
```

Add the equivalent block for `eventFromRow`/`eventToRow`.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/mappers.test.js`
Expected: FAIL — `bodyJson` is undefined.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/<timestamp>_body_json.sql` (timestamp format must match the existing two migration filenames):

```sql
-- Block editor: ProseMirror JSON is the source of truth for article bodies.
-- Nullable on purpose: a null body_json means "legacy row, render from body".
-- body is retained as a derived plaintext mirror (read-time, excerpts, search)
-- and as the fallback, so no row can become unreadable mid-migration.
alter table posts  add column if not exists body_json jsonb;
alter table events add column if not exists body_json jsonb;
```

No RLS change: both tables' policies gate on `published`, which is unaffected by a new column.

- [ ] **Step 4: Update the mappers**

Add `bodyJson: row.body_json ?? null` to `postFromRow` and `eventFromRow`; add `body_json: x.bodyJson ?? null` to `postToRow` and `eventToRow`. Do not alter existing field handling.

- [ ] **Step 5: Apply locally and verify**

```bash
npm run db:reset
npx vitest run src/lib/mappers.test.js
```

Expected: reset succeeds, tests pass.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations src/lib/mappers.js src/lib/mappers.test.js
git commit -m "feat: add body_json column and map it"
```

---

### Task 2: Plain-text extractor

**Files:**
- Create: `src/lib/content/documentToText.js`, `src/lib/content/documentToText.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `documentToText(doc)` → string. Returns `""` for null/malformed input.

**Context:** `estimateReadTime()` (`src/lib/mappers.js`) and excerpt/search all consume plain text. This produces the `body` mirror written on every save.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from "vitest";
import { documentToText } from "./documentToText.js";

const doc = (content) => ({ type: "doc", content });
const para = (text) => ({ type: "paragraph", content: [{ type: "text", text }] });

describe("documentToText", () => {
  it("returns empty string for null or malformed input", () => {
    expect(documentToText(null)).toBe("");
    expect(documentToText({})).toBe("");
    expect(documentToText({ type: "doc" })).toBe("");
  });

  it("extracts paragraph text", () => {
    expect(documentToText(doc([para("Hello world")]))).toContain("Hello world");
  });

  it("separates block-level nodes so words do not run together", () => {
    const out = documentToText(doc([para("One"), para("Two")]));
    expect(out).toMatch(/One\s+Two/);
  });

  it("extracts heading and list text", () => {
    const d = doc([
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
      { type: "bulletList", content: [
        { type: "listItem", content: [para("First")] },
        { type: "listItem", content: [para("Second")] },
      ]},
    ]);
    const out = documentToText(d);
    expect(out).toContain("Title");
    expect(out).toContain("First");
    expect(out).toContain("Second");
  });

  it("extracts text from FAQ blocks so read time reflects the real content", () => {
    const d = doc([{ type: "faqAccordion", attrs: { items: [
      { question: "How long is a session?", answer: "About an hour." },
    ]}}]);
    const out = documentToText(d);
    expect(out).toContain("How long is a session?");
    expect(out).toContain("About an hour.");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/content/documentToText.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Walk the node tree, collecting `text` from text nodes and joining block-level nodes with newlines. Handle custom node attrs (`faqAccordion` items, `ctaCard` heading/body). Return `""` on anything unexpected rather than throwing — this runs on every save.

- [ ] **Step 4: Run and confirm green**

Run: `npx vitest run src/lib/content/documentToText.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/documentToText.js src/lib/content/documentToText.test.js
git commit -m "feat: extract plain text from a document"
```

---

### Task 3: Legacy converter

**Files:**
- Create: `src/lib/content/legacyToDocument.js`, `src/lib/content/legacyToDocument.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `legacyToDocument(text)` → TipTap JSON doc.

**Context:** Converts the old dialect so existing content survives. **Read both existing parsers first** — `src/screens/marketing/BlogPost.jsx:25` and `src/screens/marketing/EventDetail.jsx:20` — and match their exact rules. The full dialect is:

- `## ` → heading level 2
- `### ` → heading level 3
- `- ` → bullet list item (consecutive lines group into one list)
- `**bold**` → bold mark (inline, may appear mid-sentence)
- blank line → flush the current list
- anything else → paragraph

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from "vitest";
import { legacyToDocument } from "./legacyToDocument.js";
import { documentToText } from "./documentToText.js";

describe("legacyToDocument", () => {
  it("returns an empty doc for empty input", () => {
    expect(legacyToDocument("")).toEqual({ type: "doc", content: [] });
  });

  it("converts ## to heading level 2 and ### to level 3", () => {
    const d = legacyToDocument("## Big\n### Small");
    expect(d.content[0]).toMatchObject({ type: "heading", attrs: { level: 2 } });
    expect(d.content[1]).toMatchObject({ type: "heading", attrs: { level: 3 } });
  });

  it("groups consecutive dash lines into ONE bullet list", () => {
    const d = legacyToDocument("- one\n- two\n- three");
    const lists = d.content.filter((n) => n.type === "bulletList");
    expect(lists).toHaveLength(1);
    expect(lists[0].content).toHaveLength(3);
  });

  it("starts a new list after a blank line", () => {
    const d = legacyToDocument("- a\n\n- b");
    expect(d.content.filter((n) => n.type === "bulletList")).toHaveLength(2);
  });

  it("converts **bold** to a bold mark, including mid-sentence", () => {
    const d = legacyToDocument("Some **strong** words");
    const marks = JSON.stringify(d);
    expect(marks).toContain("bold");
    expect(marks).not.toContain("**");
  });

  it("treats other lines as paragraphs", () => {
    const d = legacyToDocument("Just a line");
    expect(d.content[0]).toMatchObject({ type: "paragraph" });
  });

  it("preserves all text content through the conversion", () => {
    const src = "## Title\nIntro **word**\n- one\n- two";
    const out = documentToText(legacyToDocument(src));
    for (const w of ["Title", "Intro", "word", "one", "two"]) expect(out).toContain(w);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/content/legacyToDocument.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Mirror the existing parsers' control flow (line loop, list buffer, flush on blank line).

- [ ] **Step 4: Run and confirm green**

Run: `npx vitest run src/lib/content/legacyToDocument.test.js`
Expected: PASS.

- [ ] **Step 5: Verify against real content**

Convert the 3 seeded posts' bodies and confirm no text is lost. Use `npm run seed`'s source data (`supabase/seed-data.js`) — do not invent fixtures. Report the before/after word counts.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/legacyToDocument.js src/lib/content/legacyToDocument.test.js
git commit -m "feat: convert legacy markdown-lite bodies to documents"
```

---

### Task 4: FAQ accordion component

**Files:**
- Create: `src/components/marketing/FaqAccordion.jsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `<FaqAccordion items={[{ question, answer }]} />`.

**Context:** No accordion exists in this codebase — this is net-new. It is the user's named example of "reuse the components we have."

**Two hard requirements:**

1. **Answers must be in the server-rendered HTML.** FAQ content is exactly what search engines surface, so answer text must not be JS-gated. Render all answers in the markup and collapse them visually; do not conditionally render them out of the DOM.
2. **Accessible.** Real `<button>` triggers, `aria-expanded`, `aria-controls`, keyboard operable. Interactive collapse needs `"use client"`.

Match the site's visual language — read `src/components/ui/Card.jsx` and `src/components/marketing/TaglineCard.jsx` for the established styling, and use brand tokens (`brand-500`, `navy`, `surface-*`) rather than raw colors.

- [ ] **Step 1: Build the component**

Requirements: `items` array of `{ question, answer }`; first item may default open; smooth expand/collapse; renders nothing when `items` is empty or missing.

- [ ] **Step 2: Verify server-rendered answer text**

Temporarily render it on a page, run `npm run build && npm start` on a free port, and `curl` the page. **Confirm the answer text appears in the raw HTML.** Report the actual grep output, then remove the temporary usage.

- [ ] **Step 3: Verify keyboard operation**

Tab to a trigger, press Enter/Space, confirm it expands and `aria-expanded` flips. Playwright is available.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/FaqAccordion.jsx
git commit -m "feat: add an accessible FAQ accordion"
```

---

### Task 5: Server-side document renderer

**Files:**
- Create: `src/lib/content/renderDocument.jsx`, `src/lib/content/renderDocument.test.jsx`

**Interfaces:**
- Consumes: `FaqAccordion`.
- Produces: `renderDocument(doc, { variant })` → JSX. `variant` is `"post" | "event"`.

**Context — this is the highest-risk task in the plan.** It replaces both `RenderBody` copies. **Published posts must look identical afterward.**

Read both existing implementations completely first (`src/screens/marketing/BlogPost.jsx:25-88`, `src/screens/marketing/EventDetail.jsx:20-80`) and port the Tailwind classes **verbatim**. The two copies differ (`boldify` emits `text-navy` in BlogPost, `text-navy/80` in EventDetail) — that is what `variant` exists to preserve. Do not "clean up" the difference; reproduce it.

**Security:** map node types through an **allowlist** to components. Unknown types render nothing. **No `dangerouslySetInnerHTML`** — its removal from the article path is a deliberate improvement.

**Must be server-renderable:** no hooks, no browser APIs, no TipTap import.

- [ ] **Step 1: Write the failing test**

Cover: paragraph, heading 2/3, bullet list, ordered list, bold, italic, link, blockquote, image, `faqAccordion`, `ctaCard`. Plus:

```js
it("renders nothing for an unknown node type", () => {
  const html = renderToStaticMarkup(renderDocument(doc([{ type: "wat", attrs: {} }])));
  expect(html).toBe("");
});

it("does not throw on malformed input", () => {
  expect(() => renderDocument(null)).not.toThrow();
  expect(() => renderDocument({})).not.toThrow();
});

it("escapes text rather than injecting markup", () => {
  const html = renderToStaticMarkup(renderDocument(doc([para("<img src=x onerror=1>")])));
  expect(html).not.toContain("<img");
});
```

Use `react-dom/server`'s `renderToStaticMarkup` (already available via React 18) — this needs no new dependency.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/content/renderDocument.test.jsx`
Expected: FAIL — module not found.

**Note:** JSX in a `.jsx` test file is required — vitest will not parse JSX in `.js`. (This bit an earlier task; that is why the file is `.jsx`.)

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run and confirm green**

- [ ] **Step 5: Prove parity against real content**

Convert a real seeded post with `legacyToDocument`, render it through `renderDocument`, and compare the produced classes against the current `RenderBody` output for the same content. **Report any difference.** A class-level diff here is a regression in published appearance.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/renderDocument.jsx src/lib/content/renderDocument.test.jsx
git commit -m "feat: render documents server-side via an allowlisted node map"
```

---

### Task 6: Swap the public pages onto the renderer

**Files:**
- Modify: `src/screens/marketing/BlogPost.jsx`, `src/screens/marketing/EventDetail.jsx`

**Interfaces:**
- Consumes: `renderDocument`, `legacyToDocument`.
- Produces: articles rendered from `bodyJson`, falling back to legacy `body`.

**Context:** Delete both `RenderBody` implementations and both `boldify` helpers.

The fallback is what makes migration safe:

```js
const doc = post.bodyJson ?? legacyToDocument(post.body ?? "");
```

A row with no `body_json` still renders. Never blank an article.

- [ ] **Step 1: Replace in `BlogPost.jsx`**

Delete `RenderBody`/`boldify`; render `renderDocument(doc, { variant: "post" })` where `<RenderBody text={post.body} />` was (line ~205). Keep all surrounding layout untouched.

- [ ] **Step 2: Replace in `EventDetail.jsx`**

Same, with `variant: "event"`.

- [ ] **Step 3: Verify parity on the real site**

`npm run build && npm start` on a free port. Compare a real blog post and event detail page against production (`https://brainfood-1eusag13u-joelhmartins-projects.vercel.app`, which still runs the old renderer). Screenshot both with Playwright and compare. **Report any visual difference** rather than accepting it.

- [ ] **Step 4: Run the suite**

Run: `npm test` — must stay green. Then `npm run verify:routes` (expect 18/18).

- [ ] **Step 5: Commit**

```bash
git add src/screens/marketing/BlogPost.jsx src/screens/marketing/EventDetail.jsx
git commit -m "refactor: render articles from documents with legacy fallback"
```

---

### Task 7: TipTap editor shell

**Files:**
- Create: `src/components/editor/BlockEditor.jsx`, `src/components/editor/EditorTabs.jsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: TipTap 3.28.0.
- Produces: `<BlockEditor value={doc} onChange={(doc) => …} />` with Visual and Source tabs.

**Context:** TipTap 3.28.0's peer deps accept React 18 (verified). Install:

```bash
npm install @tiptap/react@3.28.0 @tiptap/starter-kit@3.28.0 @tiptap/pm@3.28.0 @tiptap/extension-link@3.28.0 @tiptap/extension-image@3.28.0
```

**Toolbar:** bold, italic, H2, H3, bullet list, ordered list, link, blockquote, image. Ordered lists, links, italics and quotes are all new capability.

**Source tab:** formatted JSON, editable, round-trips on valid input. Invalid JSON shows an inline error and **blocks the tab switch** — never silently discard the author's work.

`src/components/ui/Tabs.jsx` is a sticky marketing layout and is **not** reusable here; `EditorTabs` is a small plain control.

**Bundle discipline:** `"use client"`, and it must be imported so TipTap stays out of public route bundles.

- [ ] **Step 1: Install**

- [ ] **Step 2: Build `EditorTabs.jsx`**

- [ ] **Step 3: Build `BlockEditor.jsx`** — toolbar, TipTap instance, tab switching, `onChange` emitting the JSON doc.

- [ ] **Step 4: Verify the public bundle did not grow**

Run `npm run build` and compare the First Load JS for `/blog/[slug]` against the pre-change build (~141 kB). **Report both numbers.** If it grew, TipTap is leaking into the public bundle — fix before continuing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/editor/
git commit -m "feat: add the TipTap block editor shell"
```

---

### Task 8: FAQ and CTA blocks

**Files:**
- Create: `src/components/editor/extensions/faqAccordion.js`, `src/components/editor/extensions/ctaCard.js`
- Modify: `src/components/editor/BlockEditor.jsx`

**Interfaces:**
- Consumes: TipTap `Node` API; `FaqAccordion`.
- Produces: `faqAccordion` node (attrs: `items: [{question, answer}]`) and `ctaCard` node (attrs: `heading, body, buttonLabel, href`).

**Context:** This is what makes "reuse our components" real. Both must round-trip through `renderDocument` (Task 5 already handles them) and `documentToText` (Task 2).

- [ ] **Step 1: Build the `faqAccordion` node** — TipTap node with an editable NodeView for adding/removing/reordering Q&A pairs.

- [ ] **Step 2: Build the `ctaCard` node.**

- [ ] **Step 3: Add toolbar insert buttons.**

- [ ] **Step 4: Verify round-trip** — insert an FAQ in the editor, save the JSON, render it via `renderDocument`, confirm the questions and answers appear. Report the output.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/
git commit -m "feat: add FAQ and CTA blocks to the editor"
```

---

### Task 9: Wire the editor into the admin pages

**Files:**
- Modify: `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx`, `src/stores/posts.store.js`, `src/stores/events.store.js`

**Interfaces:**
- Consumes: `BlockEditor`, `documentToText`, `legacyToDocument`.
- Produces: both editors saving `bodyJson` plus a derived `body`.

**Context:** Replace the `<textarea>` at `PostsAdminPage.jsx:161` and `EventsAdminPage.jsx:136`.

On save: write `bodyJson` **and** `body = documentToText(bodyJson)`. Keeping `body` current is what preserves read-time, excerpts, and the fallback.

When opening a legacy row (`bodyJson` null), seed the editor with `legacyToDocument(body)` so the author sees their content.

`estimateReadTime` continues to consume `body` — unchanged.

- [ ] **Step 1: Swap the post editor.**
- [ ] **Step 2: Swap the event editor.**
- [ ] **Step 3: Update both stores** to persist `bodyJson` and the derived `body`. Preserve the existing `revalidateContent()` call and its fire-and-forget behavior.
- [ ] **Step 4: Verify end-to-end** — create a post with headings, a list, a link, and an FAQ; save; publish; confirm it renders on the public page. Report what you observed.
- [ ] **Step 5: Run** `npm test` and `npm run build`.
- [ ] **Step 6: Commit**

```bash
git add src/screens/app/ src/stores/
git commit -m "feat: use the block editor in the post and event admin"
```

---

### Task 10: Authoring UX — preview, upload, autosave, SEO

**Files:**
- Modify: `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx`, `src/components/editor/BlockEditor.jsx`

**Context:** The user asked for the editing experience, not just the editor.

- **Live preview** must render through `renderDocument` — the same function the public site uses — so preview and published output cannot drift.
- **Image upload** reuses `src/components/ui/ImageUpload.jsx` and the existing Supabase `media` bucket. No new bucket, no new storage policy.
- **Autosave:** debounced, with a visible saving/saved indicator. **It must never change `published`.** Autosaving a published row edits live content — gate it to drafts, or make the behavior explicit and obvious in the UI. State your choice in the report.
- **SEO fields:** meta description, OG image, slug. These already feed `generateMetadata` and JSON-LD but are not editable per post today.

- [ ] **Step 1: Live preview** (side-by-side or a Preview tab, matching the admin's visual language).
- [ ] **Step 2: Image insert/upload.**
- [ ] **Step 3: Autosave** — respecting the publish constraint above.
- [ ] **Step 4: SEO fields.**
- [ ] **Step 5: Verify** each in a browser; report what you observed.
- [ ] **Step 6: Commit**

```bash
git add src/screens/app/ src/components/editor/
git commit -m "feat: add preview, image upload, autosave, and SEO fields"
```

---

### Task 11: Backfill and full verification

**Files:**
- Create: `scripts/backfill-body-json.mjs`
- Modify: `package.json`

**Context:** Converts existing rows. **Non-destructive and idempotent:** only fills rows where `body_json is null`, never touches `body`, safe to re-run.

It uses the service-role key, so follow the pattern in `scripts/seed-content.mjs`/`create-admin.mjs` (they load `.env.local` themselves).

**Which database:** `.env.local` currently points at the **hosted** project. Confirm the target before running and state it explicitly in your report.

- [ ] **Step 1: Write the script** — dry-run by default, `--apply` to write, printing each row it would change.
- [ ] **Step 2: Add** `"backfill:body-json": "node scripts/backfill-body-json.mjs"` to `package.json`.
- [ ] **Step 3: Dry-run** and report the output.
- [ ] **Step 4: Apply**, then verify the public pages still render correctly.
- [ ] **Step 5: Full sweep** — `npm test`, `npm run build`, `npm run verify:routes` (18/18), `npm run test:e2e`. Report real output for each.
- [ ] **Step 6: Add an e2e test** covering create → block insert → save → publish → renders publicly.
- [ ] **Step 7: Commit**

```bash
git add scripts/backfill-body-json.mjs package.json e2e/
git commit -m "feat: backfill legacy bodies and verify the editor end to end"
```

---

## Notes for the implementer

- **Parity is the thing that matters most.** If a published post looks even slightly different afterward, that is a regression — report it rather than accepting it.
- **The legacy fallback is load-bearing.** Never remove it in this plan; it is what makes the migration safe and re-runnable.
- **Keep TipTap out of the public bundle.** Check the First Load JS number after every task that touches editor code.
- The renderer replacing `dangerouslySetInnerHTML` with an allowlisted node map is a real security improvement — do not reintroduce raw HTML injection for convenience.
- AI assist is deliberately **not** in this plan. The JSON format chosen here is what makes it tractable later; see `BACKLOG-ai-admin-and-email.md`.
