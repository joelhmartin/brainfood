# HTML Editor + Snippet Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare-textarea post/event body fields with an HTML code editor plus a dropdown of pre-written component snippets, rendered with the site's existing article typography.

**Architecture:** Body content becomes HTML in the existing `body` column — no schema change. A shared `<ArticleBody>` server component sanitizes and renders it inside a `.article-body` wrapper whose scoped CSS reproduces the current brand typography. Legacy markdown-lite content converts on the fly, so nothing can render broken.

**Tech Stack:** Next.js 15 App Router, React 18.3.1, JavaScript (`.jsx`/`.js`, **not** TypeScript), Tailwind, Supabase, Vitest, Playwright. **No new dependencies.**

## Global Constraints

- **Language stays JavaScript** (`.jsx`/`.js`). Do not introduce TypeScript.
- **No new dependencies.** No editor framework, no sanitizer library, no `@tailwindcss/typography`.
- **Rendering parity is the top risk.** Published posts must look the same afterward. The `.article-body` CSS must reproduce the current `RenderBody` typography exactly.
- **No schema change.** `body` stays `text`.
- **Legacy content must never render as raw `## Heading` text.** The on-the-fly fallback is load-bearing — do not remove it.
- **Do NOT flip `seoIndexable`** (currently `false` by design until the site is on its real domain).
- Do not modify `src/lib/api/auth.js`, `requirePermission`, `safeRedirectPath`, `src/lib/email/*`, or `app/api/contact/route.js`.
- **The RLS suite (`tests/rls.test.js`) is destructive** and is pinned to local Supabase via `.env.test.local`. Never point it at the hosted DB.
- **Do not touch the human's in-flight work:** `src/config/images.js` (modified) and `public/images/candid/` (untracked). Never `git add -A` / `git add .`; never `git stash`.
- Ports 3000/3001 are occupied on this machine and `localhost` resolves `::1` first — use `127.0.0.1` with an explicit port, and check `lsof -ti :<port>` for stale servers before diagnosing config bugs.

## File Structure

**Created**
- `src/lib/content/legacyToHtml.js` + test — markdown-lite → HTML
- `src/lib/content/sanitizeHtml.js` + test — strip `<script>` and `on*=`
- `src/config/snippets.js` — the snippet library
- `src/components/marketing/ArticleBody.jsx` — shared renderer
- `src/components/editor/HtmlEditor.jsx` — textarea + snippet dropdown

**Modified**
- `app/globals.css` — `.article-body` scoped typography
- `src/screens/marketing/BlogPost.jsx`, `src/screens/marketing/EventDetail.jsx`
- `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx`
- `src/lib/mappers.js` — strip tags before counting words

---

### Task 1: Legacy converter + sanitizer

**Files:**
- Create: `src/lib/content/legacyToHtml.js`, `src/lib/content/legacyToHtml.test.js`, `src/lib/content/sanitizeHtml.js`, `src/lib/content/sanitizeHtml.test.js`

**Interfaces:**
- Produces: `legacyToHtml(text)` → HTML string; `looksLikeHtml(text)` → boolean; `sanitizeHtml(html)` → HTML string.

**Context:** **Read both existing parsers first** — `src/screens/marketing/BlogPost.jsx:26-88` and `src/screens/marketing/EventDetail.jsx:20-80` — and match their rules exactly. The dialect is:

- `## ` → `<h2>`
- `### ` → `<h3>`
- `- ` → `<li>`, consecutive lines grouped into one `<ul>`
- `**bold**` → `<strong>`, may appear mid-sentence
- blank line → flush the current list
- anything else → `<p>`

`looksLikeHtml()` decides whether a stored body is already HTML — markdown-lite contains no `<` tags, so that is the signal.

Sanitizing happens at **render**, not save, so already-stored content is covered.

- [ ] **Step 1: Write the failing tests**

`src/lib/content/legacyToHtml.test.js`:

```js
import { describe, it, expect } from "vitest";
import { legacyToHtml, looksLikeHtml } from "./legacyToHtml.js";

describe("legacyToHtml", () => {
  it("returns empty string for empty input", () => {
    expect(legacyToHtml("")).toBe("");
    expect(legacyToHtml(null)).toBe("");
  });

  it("converts ## and ### to h2 and h3", () => {
    expect(legacyToHtml("## Big")).toContain("<h2>Big</h2>");
    expect(legacyToHtml("### Small")).toContain("<h3>Small</h3>");
  });

  it("groups consecutive dash lines into ONE ul", () => {
    const html = legacyToHtml("- one\n- two\n- three");
    expect(html.match(/<ul>/g)).toHaveLength(1);
    expect(html.match(/<li>/g)).toHaveLength(3);
  });

  it("starts a new list after a blank line", () => {
    expect(legacyToHtml("- a\n\n- b").match(/<ul>/g)).toHaveLength(2);
  });

  it("converts **bold** mid-sentence and leaves no asterisks", () => {
    const html = legacyToHtml("Some **strong** words");
    expect(html).toContain("<strong>strong</strong>");
    expect(html).not.toContain("**");
  });

  it("wraps other lines in paragraphs", () => {
    expect(legacyToHtml("Just a line")).toContain("<p>Just a line</p>");
  });

  it("escapes stray angle brackets in legacy text", () => {
    expect(legacyToHtml("5 < 10")).not.toContain("< 10");
  });
});

describe("looksLikeHtml", () => {
  it("detects HTML", () => {
    expect(looksLikeHtml("<p>hi</p>")).toBe(true);
  });
  it("treats markdown-lite as not HTML", () => {
    expect(looksLikeHtml("## Title\n- item")).toBe(false);
  });
  it("handles empty input", () => {
    expect(looksLikeHtml("")).toBe(false);
    expect(looksLikeHtml(null)).toBe(false);
  });
});
```

`src/lib/content/sanitizeHtml.test.js`:

```js
import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitizeHtml.js";

describe("sanitizeHtml", () => {
  it("removes script tags and their contents", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips inline event handlers", () => {
    const out = sanitizeHtml('<img src="a.jpg" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
    expect(out).toContain('src="a.jpg"');
  });

  it("strips javascript: urls", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("leaves legitimate markup and attributes intact", () => {
    const html = '<h2>Title</h2><p class="lead">Text <a href="/about">link</a></p><details><summary>Q</summary><p>A</p></details>';
    const out = sanitizeHtml(html);
    for (const frag of ["<h2>Title</h2>", 'class="lead"', 'href="/about"', "<details>", "<summary>Q</summary>"]) {
      expect(out).toContain(frag);
    }
  });

  it("handles empty input", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml(null)).toBe("");
  });
});
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run src/lib/content/`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement both**

Mirror the existing parsers' control flow for `legacyToHtml` (line loop, list buffer, flush on blank). `sanitizeHtml` is regex-based — that is sufficient here because the input is admin-authored, not untrusted user input; note that in a comment so a future reader does not mistake it for a general-purpose sanitizer.

- [ ] **Step 4: Run and confirm green**

Run: `npx vitest run src/lib/content/`

- [ ] **Step 5: Verify against real content**

Convert the 3 seeded post bodies from `supabase/seed-data.js` (do not invent fixtures) and confirm no text is lost. Report before/after word counts.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/
git commit -m "feat: add legacy markdown-lite to HTML conversion and sanitizing"
```

---

### Task 2: Article typography + shared renderer

**Files:**
- Create: `src/components/marketing/ArticleBody.jsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `sanitizeHtml`, `legacyToHtml`, `looksLikeHtml`.
- Produces: `<ArticleBody html={string} />` — a Server Component.

**Context — this is the highest-risk task. Published posts must look the same afterward.**

Read both `RenderBody` implementations completely (`src/screens/marketing/BlogPost.jsx:26-88`, `src/screens/marketing/EventDetail.jsx:20-80`) and transcribe their Tailwind classes into equivalent CSS under `.article-body`. Every element the old renderer styled needs a rule:

| Element | Current styling (transcribe exactly) |
| --- | --- |
| `h2` (was `## `) | `font-heading font-bold text-2xl md:text-3xl text-navy mt-14 mb-4 tracking-tight` |
| `h3` (was `### `) | `font-heading font-bold text-xl text-navy mt-10 mb-3 tracking-tight` |
| `p` | `text-navy/65 text-[17px] leading-[1.8] my-4` |
| `ul` | `space-y-2.5 my-5 ml-1` |
| `li` | `text-navy/65 text-[17px] leading-relaxed` + the brand bullet |
| `strong` | `font-semibold text-navy` |

**The two copies differ:** `boldify` emits `text-navy` in `BlogPost` and `text-navy/80` in `EventDetail`. Pick `text-navy` (the blog post is the primary article surface) and note the change in your report — this intentionally unifies a drift rather than preserving two definitions.

Also style elements the old renderer never supported, consistent with the design system: `ol`, `a`, `blockquote`, `img`, `hr`, `details`/`summary`.

The old bullet was a brand-colored dot rendered as a `<span>`; reproduce it with `li::before` or a `list-style` treatment.

`ArticleBody` must be **server-renderable** — no hooks, no browser APIs.

- [ ] **Step 1: Add the `.article-body` block to `app/globals.css`**

Use `@apply` with the existing Tailwind tokens where possible so the values stay tied to the design system rather than being hardcoded hex.

- [ ] **Step 2: Build `ArticleBody.jsx`**

```jsx
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
```

- [ ] **Step 3: Verify parity against the real site**

Run `npm run build && npm start` on a free port. Render a seeded post through `ArticleBody` and compare against the same post on production (`https://brainfood-1eusag13u-joelhmartins-projects.vercel.app/blog/what-is-recovery-coaching`), which still uses the old renderer. Screenshot both with Playwright and compare.

**Report any visual difference rather than accepting it.** Font size, line height, heading spacing, and bullet color are the things most likely to drift.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css src/components/marketing/ArticleBody.jsx
git commit -m "feat: add scoped article typography and a shared body renderer"
```

---

### Task 3: Snippet library

**Files:**
- Create: `src/config/snippets.js`

**Interfaces:**
- Produces: `SNIPPETS` — array of `{ id, label, group, html }`.

**Context:** This is the feature the user actually asked for. It lives beside `site.js` / `services.js` / `brand.js`; read one first and match the file conventions (header comment explaining purpose, grouped sections).

`group` lets the dropdown show optgroups (Text / Media / Components).

Snippets are **clean, readable HTML with no utility classes** — `.article-body` styles them. Keep them short enough to hand-edit after insertion, with obvious placeholder text an author will replace.

Required snippets:

**Text:** heading (`<h2>`), subheading (`<h3>`), paragraph, bullet list, numbered list, link, pull quote (`<blockquote>`), divider (`<hr>`)

**Media:** image (`<img>` with `alt` — include the attribute so authors fill it in rather than omitting it)

**Components:**
- **FAQ accordion** — native `<details>`/`<summary>`, **no JavaScript**. It server-renders, is keyboard accessible and screen-reader friendly for free, and the answer text sits in the HTML where crawlers read it. Include two Q&A pairs so the pattern for adding more is obvious.
- **CTA card** — heading, body, link styled as a button. Match `src/components/marketing/CtaBanner.jsx`'s visual language.

- [ ] **Step 1: Write the file**

- [ ] **Step 2: Verify each snippet renders correctly**

Paste each one through `ArticleBody` and confirm it renders on-brand and that `sanitizeHtml` does not strip anything legitimate (particularly `<details>`, `class`, `href`, `src`, `alt`). Report anything that gets mangled.

- [ ] **Step 3: Commit**

```bash
git add src/config/snippets.js
git commit -m "feat: add the HTML snippet library"
```

---

### Task 4: HTML editor + wire into both admin pages

**Files:**
- Create: `src/components/editor/HtmlEditor.jsx`
- Modify: `src/screens/app/PostsAdminPage.jsx`, `src/screens/app/EventsAdminPage.jsx`, `src/lib/mappers.js`

**Interfaces:**
- Consumes: `SNIPPETS`.
- Produces: `<HtmlEditor value={string} onChange={(html) => …} />`.

**Context:** Replaces the `<textarea>` at `PostsAdminPage.jsx:164` and `EventsAdminPage.jsx:139`.

**The editor is deliberately simple** — the user said "no need to make it an in-depth editor":

- A monospace `<textarea>`, taller than today (~20 rows), `spellCheck={false}`.
- A **snippet dropdown** above it. Selecting an entry inserts that snippet's HTML **at the cursor** (not appended at the end), then resets the dropdown so the same snippet can be picked twice in a row.
- **Tab inserts two spaces** instead of moving focus — the user explicitly asked to be able to tab. Preserve the cursor position after insertion. Note that trapping Tab has an accessibility cost (keyboard users cannot tab out of the field); provide Escape-then-Tab or a documented way out, and say what you chose in your report.

Match the admin's existing form styling — read the surrounding fields in `PostsAdminPage.jsx` and reuse the same label/input classes rather than inventing new ones.

**`estimateReadTime` fix:** it counts words in `body`, which now contains HTML tags that would inflate the count. Strip tags before counting. It lives in `src/lib/mappers.js`; there is an existing test file to extend.

- [ ] **Step 1: Build `HtmlEditor.jsx`**

- [ ] **Step 2: Fix `estimateReadTime`, test first**

```js
it("ignores HTML tags when estimating read time", () => {
  const plain = "word ".repeat(200);
  const html = "<p>" + "word ".repeat(200) + "</p>";
  expect(estimateReadTime(html)).toBe(estimateReadTime(plain));
});
```

- [ ] **Step 3: Swap the post editor.**
- [ ] **Step 4: Swap the event editor.**

- [ ] **Step 5: Verify in a browser**

Log into `/app/posts` (local server on 3057 points at the hosted DB; credentials are with the user). Insert a snippet, confirm it lands at the cursor, confirm Tab inserts spaces, save, and confirm the post renders correctly on the public page. Report what you observed.

- [ ] **Step 6: Run** `npm test` and `npm run build`.

- [ ] **Step 7: Commit**

```bash
git add src/components/editor/ src/screens/app/ src/lib/mappers.js src/lib/mappers.test.js
git commit -m "feat: add an HTML editor with a snippet dropdown"
```

---

### Task 5: Swap the public pages and verify

**Files:**
- Modify: `src/screens/marketing/BlogPost.jsx`, `src/screens/marketing/EventDetail.jsx`

**Context:** Delete both `RenderBody` implementations and both `boldify` helpers, replacing them with `<ArticleBody html={post.body} />`.

Existing rows still hold markdown-lite; `ArticleBody` converts on the fly, so **no database migration is required**. Legacy and HTML content coexist indefinitely.

- [ ] **Step 1: Replace in `BlogPost.jsx`** — remove `RenderBody`/`boldify`, render `<ArticleBody html={post.body} />` where `<RenderBody text={post.body} />` was (~line 205). Leave surrounding layout untouched.

- [ ] **Step 2: Replace in `EventDetail.jsx`** — same.

- [ ] **Step 3: Confirm no orphans**

Run: `grep -rn "RenderBody\|boldify" src/ app/`
Expected: no output.

- [ ] **Step 4: Full verification** — report real output for each:
- `npm test`
- `npm run build`
- `npm run verify:routes` (expect 18/18)
- `npm run test:e2e`

- [ ] **Step 5: Visual parity check**

Compare a real blog post and event detail page against production (which still runs the old renderer). Screenshot both with Playwright. **Report any difference.**

- [ ] **Step 6: Commit**

```bash
git add src/screens/marketing/
git commit -m "refactor: render article bodies through the shared renderer"
```

---

## Notes for the implementer

- **Parity matters most.** If a published post looks different afterward, that is a regression — report it rather than accepting it.
- **The legacy fallback is load-bearing.** It is what allows this to ship with no data migration; do not remove it.
- **Snippets carry no utility classes** — `.article-body` styles them. Keeping them clean is what makes them editable by hand.
- The `<details>` FAQ is deliberate: a JS accordion would hide answer text from crawlers, and FAQ content is exactly what search engines surface.
- AI assist is still queued in `BACKLOG-ai-admin-and-email.md`. HTML bodies suit it fine — models emit HTML readily.
