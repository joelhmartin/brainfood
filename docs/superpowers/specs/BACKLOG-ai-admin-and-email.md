# Backlog — AI-assisted admin + transactional email

**Captured:** 2026-07-16, mid Next.js migration. **Not yet specced.** Needs its own
brainstorm → spec → plan cycle once the migration lands.

**Sequencing:** after the Next.js migration (Tasks 4–16), before the production deploy
(Task 17). Both features need server-side API routes to keep API keys out of the browser —
building them on the Vite stack first would mean writing them twice.

## 1. Transactional email (Mailgun)

- Mailgun API key has been added by the user (verify which env var name, and that it is
  server-only — it must never be `NEXT_PUBLIC_`).
- Contact form submissions email **brainfoodrs@gmail.com**.
- **Outgoing emails must be styled nicely** — branded HTML email, not plain text.
  Reuse brand colors/logo from `src/config/brand.js` + `src/config/site.js`.
- Open questions: does `/submit-case` (CaseSubmission) also send? Different recipient?
  Autoresponder to the submitter? Does the contact form currently persist to Supabase,
  send nothing, or something else? (Investigate `src/pages/marketing/Contact.jsx` and
  `src/pages/marketing/CaseSubmission.jsx`.)

## 2. AI-assisted content admin

**Scope signal from the user:** audit the existing admin (`/app/posts`, `/app/events` —
`PostsAdminPage`, `EventsAdminPage`) for upgrades; it is not a from-scratch rebuild.

**AI capabilities requested (all four):**
- Draft a post/event from a prompt
- Rewrite / improve a selection
- Generate SEO metadata (title, excerpt, meta description, tags, image alt text)
- Tone / brand consistency checking

**AI must be brand- and code-aware:**
- Brand awareness: voice, tone, palette — `src/config/brand.js`, `src/config/site.js`
  (`BUSINESS.tagline`, `description`). Tone matters here: this is a recovery-services site.
- "CSS and JavaScript awareness" — the AI should know the site's existing component
  library (`src/components/ui/*`, `src/components/marketing/*`) and Tailwind brand tokens.
- **Content should reuse existing site components.** Named example: add an FAQ that
  reuses components already on the site (an accordion), rather than emitting raw HTML.

## The architectural decision this forces

Post bodies today are a **plain `body` string** (`postFromRow`, `src/lib/mappers.js`).
For AI to emit a real FAQ accordion built from existing components, the content model must
support components. Options to weigh during the brainstorm:

- **MDX** — markdown plus real React components. Natural fit for "reuse our components";
  needs an MDX pipeline and a safe component allowlist.
- **Block/JSON schema** (portable-text style) — structured blocks the renderer maps to
  components. Safer and more constrained; more plumbing; editor must be block-aware.
- **Shortcodes** — lightest change to the existing string `body`; least expressive, and
  a parser to maintain.

This choice drives the editor, the AI's output format, the renderer, and the DB schema.
It should not be made implicitly.

## Other open questions

- Which model/provider for AI assist? (Default to Claude via the Anthropic API; confirm.)
  Cost expectations? Where does the key live (server-only route handler)?
- Does AI assist gate behind an existing permission in `src/config/roles.js`?
- Does AI-generated content need a review/approval state before publish?
