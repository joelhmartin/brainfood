# Mailgun Form Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site's two legitimate contact forms actually send email through Mailgun, behind one reusable hook and one single-source-of-truth template layer — and delete the orphaned dental case-submission page.

**Architecture:** Both forms call a shared `useFormSubmit()` hook, which POSTs to `app/api/contact/route.js`. The route validates with Zod, then sends a branded admin notification and an optional auto-reply through a server-only Mailgun transport. All email presentation lives in one `templates.js` built on a shared layout, so a brand change is edited once.

**Tech Stack:** Next.js 15 (App Router), React 18, JavaScript (`.jsx`/`.js`, **not** TypeScript), Zod, Mailgun (`mailgun.js` + `form-data`), Vitest, Playwright.

## Global Constraints

- **Language stays JavaScript** (`.jsx`/`.js`). Do not introduce TypeScript.
- **No fake success, ever.** The bug being fixed is a UI that claims delivery that did not happen. The success state must be driven by a real server response.
- **`MAILGUN_API_KEY` and all mail config are server-only.** Never `NEXT_PUBLIC_`. The transport module carries `import "server-only";`.
- **Templates are edited in exactly one place** (`src/lib/email/templates.js`), built from one shared layout. No brand value, business name, or contact detail may be hardcoded where `src/config/site.js` / `src/config/brand.js` already defines it.
- **From is the business; the visitor goes in Reply-To.** Sending "from" a visitor's address fails SPF and destroys deliverability.
- **Every email sends a plain-text alternative** alongside the HTML.
- **Submitted values must be HTML-escaped** in rendered email.
- **Do not wire `/submit-case` to email** — it collects PHI. It is deleted in Task 6.
- **Do NOT flip `seoIndexable`** (currently `false` by design until the site is on its production domain).
- Do not weaken `requirePermission` or `safeRedirectPath`; do not modify `src/lib/api/auth.js`.
- **Do not touch the human's in-flight work:** `src/config/images.js` (modified) and `public/images/candid/` (untracked). Never `git add -A` / `git add .`; never `git stash`.
- Work on branch `nextjs-migration` (or a branch off it) — the Next.js route handlers this depends on live there.

## File Structure

**Created**
- `src/lib/email/mailgun.js` — Mailgun transport. Server-only. One responsibility: send a message.
- `src/lib/email/templates.js` — the ONE place email presentation is edited. Shared layout + two templates.
- `src/lib/email/templates.test.js`
- `src/hooks/useFormSubmit.js` — shared client submit hook.
- `app/api/contact/route.js` — POST handler.
- `app/api/contact/route.test.js`

**Modified**
- `src/config/schemas.js` — add `contactSchema`.
- `src/screens/marketing/Contact.jsx` — real submit.
- `src/components/marketing/ContentSidebar.jsx` — real submit.
- `app/sitemap.js`, `app/sitemap.test.js`, `scripts/verify-routes.mjs` — drop `/submit-case`.
- `.env.example`
- `package.json`

**Deleted**
- `app/(marketing)/submit-case/page.jsx`, `src/screens/marketing/CaseSubmission.jsx`

---

### Task 1: Contact schema

**Files:**
- Modify: `src/config/schemas.js`
- Test: `src/config/schemas.test.js` (create if absent)

**Interfaces:**
- Consumes: `zod` (already a dependency).
- Produces: `contactSchema` — Zod object with `name`, `email`, `phone` (optional), `message`, and `company` (honeypot, must be empty). Exported from `src/config/schemas.js`.

**Context:** `src/config/schemas.js` already holds the app's Zod schemas (`loginSchema`, `inviteSchema`, …). Follow its existing style exactly — read it first.

The `company` field is a honeypot: a hidden input real users never fill. Bots fill every field, so a non-empty `company` means "bot". Naming it something plausible is the point.

- [ ] **Step 1: Write the failing test**

Create/extend `src/config/schemas.test.js`:

```js
import { describe, it, expect } from "vitest";
import { contactSchema } from "./schemas.js";

const valid = { name: "Jane Doe", email: "jane@example.com", phone: "", message: "I need help.", company: "" };

describe("contactSchema", () => {
  it("accepts a valid submission", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a missing optional phone", () => {
    const { phone, ...noPhone } = valid;
    expect(contactSchema.safeParse(noPhone).success).toBe(true);
  });

  it("rejects a malformed email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects an over-length message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, company: "Acme" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/config/schemas.test.js`
Expected: FAIL — `contactSchema` is not exported.

- [ ] **Step 3: Add the schema**

Append to `src/config/schemas.js`, matching the file's existing style:

```js
/**
 * Public contact form. Used by both the /contact page and the sidebar MiniForm.
 *
 * `company` is a honeypot: a hidden field no human sees or fills. Bots fill every
 * input they find, so a non-empty value here means the submission is automated.
 * It is rejected server-side rather than in the browser, where a bot would simply
 * skip the check.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Enter a message.").max(5000, "Message is too long."),
  company: z.literal("").optional(),
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/config/schemas.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/schemas.js src/config/schemas.test.js
git commit -m "feat: add contact form schema with honeypot"
```

---

### Task 2: Email templates (the single source of truth)

**Files:**
- Create: `src/lib/email/templates.js`, `src/lib/email/templates.test.js`

**Interfaces:**
- Consumes: `BUSINESS`, `CONTACT`, `SEO` from `src/config/site.js`; brand palette from `src/config/brand.js`.
- Produces: `adminNotification(submission)` and `autoReply(submission)`, each returning `{ subject, html, text }`. Also exports `escapeHtml(value)`.

**Context:** This file is the ONLY place email presentation is edited — that is the user's explicit requirement. Both templates must be built from one shared layout function so a brand change is made once.

HTML email cannot use Tailwind or modern CSS: use table-based layout and inline styles. Read `src/config/site.js` and `src/config/brand.js` first and pull real values (`BUSINESS.name`, `CONTACT.email`, brand colors) — hardcoding anything that already lives in config defeats the purpose.

- [ ] **Step 1: Write the failing test**

Create `src/lib/email/templates.test.js`:

```js
import { describe, it, expect } from "vitest";
import { adminNotification, autoReply, escapeHtml } from "./templates.js";
import { BUSINESS } from "../../config/site.js";

const submission = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  message: "I need help for my brother.",
  source: "Contact page",
};

describe("escapeHtml", () => {
  it("escapes characters that would inject markup", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).not.toContain("<script>");
  });

  it("escapes ampersands and quotes", () => {
    expect(escapeHtml(`Tom & "Jerry"`)).toBe("Tom &amp; &quot;Jerry&quot;");
  });
});

describe("adminNotification", () => {
  it("includes every submitted value", () => {
    const { html, text } = adminNotification(submission);
    for (const value of [submission.name, submission.email, submission.phone, submission.message]) {
      expect(html).toContain(value);
      expect(text).toContain(value);
    }
  });

  it("names the source so the recipient knows which form was used", () => {
    expect(adminNotification(submission).html).toContain("Contact page");
  });

  it("escapes submitted HTML rather than rendering it", () => {
    const evil = { ...submission, message: `<img src=x onerror="alert(1)">` };
    expect(adminNotification(evil).html).not.toContain("onerror=");
  });

  it("returns a subject, html, and text", () => {
    const out = adminNotification(submission);
    expect(out.subject).toBeTruthy();
    expect(out.html).toBeTruthy();
    expect(out.text).toBeTruthy();
  });
});

describe("autoReply", () => {
  it("greets the submitter by name", () => {
    expect(autoReply(submission).html).toContain("Jane Doe");
  });

  it("is branded with the business name from config", () => {
    expect(autoReply(submission).html).toContain(BUSINESS.name);
  });

  it("returns a subject, html, and text", () => {
    const out = autoReply(submission);
    expect(out.subject).toBeTruthy();
    expect(out.html).toBeTruthy();
    expect(out.text).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/email/templates.test.js`
Expected: FAIL — cannot resolve `./templates.js`.

- [ ] **Step 3: Implement the templates**

Create `src/lib/email/templates.js`. Structure it as: `escapeHtml` → a shared `layout({ heading, bodyHtml })` → the two templates built on that layout. Pull the business name, contact email, and brand color from config — do not hardcode them.

Requirements the tests enforce:
- `escapeHtml` handles `& < > " '`.
- Both templates return `{ subject, html, text }`.
- `adminNotification` shows name, email, phone, message, and which form the submission came from; every interpolated value passes through `escapeHtml`.
- `autoReply` greets the submitter and carries the business name.
- One `layout()` used by both — a brand change is edited once.

Use table-based HTML with inline styles. Keep the layout simple and readable; this file will be hand-edited later.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/email/templates.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/templates.js src/lib/email/templates.test.js
git commit -m "feat: add branded email templates with one shared layout"
```

---

### Task 3: Mailgun transport

**Files:**
- Create: `src/lib/email/mailgun.js`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Consumes: `mailgun.js`, `form-data` (new dependencies); env `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, `MAILGUN_REGION` (optional), `CONTACT_RECIPIENT`.
- Produces: `sendEmail({ to, subject, html, text, replyTo })` → resolves on success, throws on failure. `isMailConfigured()` → boolean.

**Context:** This module holds the API key. It must be server-only, exactly like `src/lib/api/auth.js` — read that file to match the established pattern (`import "server-only";` on line 1).

Mailgun's EU region uses a different API base URL than the US default. Support a `MAILGUN_REGION` env var rather than assuming US.

- [ ] **Step 1: Install the SDK**

```bash
npm install mailgun.js form-data
```

- [ ] **Step 2: Create the transport**

Create `src/lib/email/mailgun.js`:

```js
import "server-only";

import formData from "form-data";
import Mailgun from "mailgun.js";

/**
 * Mailgun transport. Holds MAILGUN_API_KEY, so this module is server-only —
 * `import "server-only"` turns any accidental client import into a build error
 * rather than a silently shipped credential.
 */

const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;
const FROM = process.env.MAILGUN_FROM;

// Mailgun's EU region is a different host; assuming the US default silently fails
// for EU accounts.
const BASE_URL =
  process.env.MAILGUN_REGION?.toLowerCase() === "eu"
    ? "https://api.eu.mailgun.net"
    : "https://api.mailgun.net";

export function isMailConfigured() {
  return Boolean(API_KEY && DOMAIN && FROM);
}

export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!isMailConfigured()) {
    throw new Error("Mailgun is not configured.");
  }

  const mailgun = new Mailgun(formData);
  const client = mailgun.client({ username: "api", key: API_KEY, url: BASE_URL });

  const message = { from: FROM, to, subject, html, text };
  // The visitor's address goes in Reply-To, never From: sending "from" an address
  // we don't control fails SPF and lands the mail in spam.
  if (replyTo) message["h:Reply-To"] = replyTo;

  return client.messages.create(DOMAIN, message);
}
```

- [ ] **Step 3: Document the env vars**

Add to `.env.example`, in the server-only section (note its existing warning about not prefixing with `NEXT_PUBLIC_`):

```
# ── Mailgun (server-only — powers the public contact forms) ──
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_FROM="Brain Food Recovery Services <noreply@example.com>"
# Set to "eu" only if your Mailgun account is in the EU region.
MAILGUN_REGION=
# Where form submissions are delivered.
CONTACT_RECIPIENT=brainfoodrs@gmail.com
```

- [ ] **Step 4: Verify server-only actually protects the module**

Confirm the guard is real, the way Task 14 of the migration did: temporarily add `import "../src/lib/email/mailgun.js";` to a client component (any file starting with `"use client"`), run `npm run build`, and confirm it FAILS with Next's server-only error. **Then remove the temporary import** and confirm the build passes again.

Report both outputs. A guard you did not watch fire is not a verified guard.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/mailgun.js package.json package-lock.json .env.example
git commit -m "feat: add server-only Mailgun transport"
```

---

### Task 4: Contact API route

**Files:**
- Create: `app/api/contact/route.js`, `app/api/contact/route.test.js`

**Interfaces:**
- Consumes: `contactSchema` (Task 1); `adminNotification`, `autoReply` (Task 2); `sendEmail`, `isMailConfigured` (Task 3).
- Produces: `POST` handler at `/api/contact`. 200 `{ ok: true }` on success; 400 `{ error }` on validation failure; 500 `{ error }` on send failure; 429 on rate limit.

**Context:** This is a **public, unauthenticated endpoint that sends email** — the spec names abuse as the top risk. Without a control it can flood the inbox, and the auto-reply makes the site a tool for sending mail to arbitrary third parties.

Two defenses:
1. **Honeypot** — reject when `company` is non-empty (Task 1's schema already does this). Return 200, not 400: telling a bot it failed just teaches it to adapt.
2. **Rate limit** — a simple in-memory per-IP limit (e.g. 5/hour). Note in a comment that serverless instances do not share memory, so this is a speed bump rather than a guarantee; a durable limiter is the follow-up if abuse appears.

Read `app/api/revalidate/route.js` first and match its established shape (Web `Request`/`Response`, `Response.json(...)`, `request.json().catch(() => ({}))` — the migration specifically fixed malformed bodies turning into 500s).

- [ ] **Step 1: Write the failing test**

Create `app/api/contact/route.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/email/mailgun.js", () => ({
  sendEmail: vi.fn(() => Promise.resolve({ id: "test" })),
  isMailConfigured: vi.fn(() => true),
}));

import { sendEmail, isMailConfigured } from "../../../src/lib/email/mailgun.js";
import { POST } from "./route.js";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "555-0100",
  message: "I need help.",
  company: "",
  source: "Contact page",
};

function req(body) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isMailConfigured.mockReturnValue(true);
});

describe("POST /api/contact", () => {
  it("sends the admin notification for a valid submission", async () => {
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalled();
  });

  it("puts the submitter's address in replyTo, never in from", async () => {
    await POST(req(valid));
    const call = sendEmail.mock.calls[0][0];
    expect(call.replyTo).toBe(valid.email);
    expect(call.from).toBeUndefined();
  });

  it("rejects an invalid submission with 400 and sends nothing", async () => {
    const res = await POST(req({ ...valid, email: "nope" }));
    expect(res.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("tolerates a malformed body with 400, not 500", async () => {
    const res = await POST(
      new Request("http://localhost/api/contact", { method: "POST", body: "not json" }),
    );
    expect(res.status).toBe(400);
  });

  it("silently accepts a filled honeypot without sending", async () => {
    const res = await POST(req({ ...valid, company: "Acme" }));
    expect(res.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports an error when the transport fails — never a false success", async () => {
    sendEmail.mockRejectedValueOnce(new Error("mailgun down"));
    const res = await POST(req(valid));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });

  it("still succeeds when only the auto-reply fails", async () => {
    sendEmail.mockResolvedValueOnce({ id: "admin" }).mockRejectedValueOnce(new Error("bounce"));
    const res = await POST(req(valid));
    expect(res.status).toBe(200);
  });

  it("returns an error when Mailgun is not configured", async () => {
    isMailConfigured.mockReturnValue(false);
    const res = await POST(req(valid));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/api/contact/route.test.js`
Expected: FAIL — cannot resolve `./route.js`.

- [ ] **Step 3: Implement the route**

Create `app/api/contact/route.js`. It must:
- parse with `await request.json().catch(() => ({}))`
- validate with `contactSchema`; on failure return 400 with the first field message
- on a filled honeypot, return **200 without sending**
- rate-limit per IP (read `x-forwarded-for`), returning 429 when exceeded
- send the admin notification to `CONTACT_RECIPIENT` (default `brainfoodrs@gmail.com`) with `replyTo` set to the submitter
- then attempt the auto-reply; **an auto-reply failure must not fail the request** — the business already has the lead
- return 500 if the admin send fails or mail is unconfigured, never a false success
- log errors server-side without echoing the API key or the full payload

Order matters: honeypot and validation before any send.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run app/api/contact/route.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add app/api/contact/
git commit -m "feat: add contact API route with honeypot and rate limiting"
```

---

### Task 5: Shared submit hook + wire both forms

**Files:**
- Create: `src/hooks/useFormSubmit.js`
- Modify: `src/screens/marketing/Contact.jsx`, `src/components/marketing/ContentSidebar.jsx`

**Interfaces:**
- Consumes: `POST /api/contact`.
- Produces: `useFormSubmit({ endpoint })` → `{ submit, state, error, reset }`, where `state` is `"idle" | "sending" | "success" | "error"`.

**Context:** This is the user's "reusable hook" requirement — both forms share one implementation; no duplicated fetch/state logic.

The two fake handlers being replaced:
- `src/screens/marketing/Contact.jsx:104` — `setTimeout(() => setFormState("success"), 1500)`
- `src/components/marketing/ContentSidebar.jsx:114` — `setTimeout(() => setFormState("success"), 1200)`

**Strict parity on appearance:** keep each form's existing markup, classes, and visual sending/success states. Only the mechanism changes. Both already track a `formState` string with the same four values the hook exposes — the swap should be close to drop-in.

Each form passes a `source` ("Contact page" / "Sidebar") so the recipient knows which form was used.

- [ ] **Step 1: Create the hook**

Create `src/hooks/useFormSubmit.js`:

```js
"use client";

import { useCallback, useState } from "react";

/**
 * Submits a public form to an API route.
 *
 * Both the contact page and the sidebar MiniForm use this — before, each faked a
 * success with setTimeout and discarded the submission entirely. The success state
 * here is driven only by a real 2xx from the server.
 */
export function useFormSubmit({ endpoint }) {
  const [state, setState] = useState("idle");
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  const submit = useCallback(
    async (values) => {
      setState("sending");
      setError(null);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(payload.error || "Something went wrong. Please try again.");
          setState("error");
          return false;
        }

        setState("success");
        return true;
      } catch {
        setError("Could not reach the server. Please try again.");
        setState("error");
        return false;
      }
    },
    [endpoint],
  );

  return { submit, state, error, reset };
}
```

- [ ] **Step 2: Wire the contact form**

In `src/screens/marketing/Contact.jsx`, replace the fake `handleSubmit` with the hook. Read the component first — it renders `fields` and tracks `formState`. Requirements:
- collect the form values (the existing inputs are uncontrolled; `new FormData(e.currentTarget)` is the least invasive read)
- add a **hidden honeypot input** named `company` — visually hidden, `tabIndex={-1}`, `autoComplete="off"`
- pass `source: "Contact page"`
- render `error` when `state === "error"`; keep the existing success UI for `state === "success"`
- keep every existing class and animation

- [ ] **Step 3: Wire the sidebar MiniForm**

Do the same in `src/components/marketing/ContentSidebar.jsx`'s `MiniForm`, with `source: "Sidebar"`. This form appears on `/blog`, `/events`, and every post and event page — it is likely the highest-volume capture on the site. Same honeypot, same error rendering, same markup.

- [ ] **Step 4: Verify both forms live**

Run `npm run build && npm start` on an explicit free port (ports 3000/3001 are often occupied on this machine and `localhost` resolves `::1` first — use `127.0.0.1` with e.g. `PORT=3057`).

With Mailgun unconfigured locally, a real submit should surface a visible **error**, not a success — that alone proves the fake success is gone. Confirm on both `/contact` and a blog post page. Report what you observed.

- [ ] **Step 5: Run the suite**

Run: `npm test`
Expected: green, plus the new tests.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useFormSubmit.js src/screens/marketing/Contact.jsx src/components/marketing/ContentSidebar.jsx
git commit -m "feat: wire both contact forms to real email via a shared hook"
```

---

### Task 6: Remove the orphaned case-submission page

**Files:**
- Delete: `app/(marketing)/submit-case/page.jsx`, `src/screens/marketing/CaseSubmission.jsx`
- Modify: `app/sitemap.js`, `app/sitemap.test.js`, `scripts/verify-routes.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `/submit-case` returns 404; route count drops 19 → 18.

**Context:** `CaseSubmission.jsx` is orphaned dental-template content — a sleep-apnea appliance order form collecting `patientFirst`, `patientLast`, `dob`, `gender`, `ahiScore`, `diagnosis`, plus `scanFiles`/`photos`/`prescription`/`sleepStudy` uploads. It has nothing to do with recovery services (same leftover as `/products`), and emailing those fields to a Gmail inbox would be an unencrypted PHI transmission. Deleting it removes the liability.

**Nothing links to it.** Verified references are only the route, the component, `app/sitemap.js`, `app/sitemap.test.js`, and `scripts/verify-routes.mjs` — no nav entry, no in-content link.

- [ ] **Step 1: Re-verify nothing links to it**

```bash
grep -rn "submit-case\|CaseSubmission" src app e2e scripts docs 2>/dev/null | grep -v node_modules
```

Expected: only the five known references (plus docs, which are historical records — leave those). **If a navigation link has appeared since this plan was written, STOP and report it** rather than leaving a dead link in the nav.

- [ ] **Step 2: Delete the page and its route**

```bash
git rm -r "app/(marketing)/submit-case" src/screens/marketing/CaseSubmission.jsx
```

- [ ] **Step 3: Remove it from the sitemap**

Delete the `"/submit-case"` entry from `STATIC_ROUTES` in `app/sitemap.js`, and remove it from the expected-routes array in `app/sitemap.test.js`.

- [ ] **Step 4: Remove it from route verification**

Delete `"/submit-case"` from the `ROUTES` array in `scripts/verify-routes.mjs`. The script now covers 18 routes.

- [ ] **Step 5: Verify**

```bash
npm test
npm run build
npm run verify:routes   # requires npm start on a free port; expect 18/18
```

Also curl `/submit-case` against the running server and confirm a **404**.

Report the real output for each.

- [ ] **Step 6: Commit**

```bash
git add "app/(marketing)" app/sitemap.js app/sitemap.test.js scripts/verify-routes.mjs src/screens/marketing/
git commit -m "chore: remove orphaned dental case-submission page"
```

---

### Task 7: End-to-end verification and deploy config

**Files:**
- Modify: `e2e/admin.spec.js` or a new `e2e/contact.spec.js`

**Interfaces:**
- Consumes: everything above.
- Produces: proof the forms work, and Mailgun configured in Vercel.

- [ ] **Step 1: Add an e2e test for the contact form**

Add a Playwright test that fills `/contact` and asserts a real outcome driven by the endpoint (with Mailgun unconfigured in test, that is a visible error state — the point is that the UI reflects the server, never a timer).

Follow the conventions in `e2e/admin.spec.js`. Do not weaken existing tests.

- [ ] **Step 2: Full suite**

```bash
npm test
npm run test:e2e
npm run build
npm run verify:routes
```

All must pass. Report real output.

- [ ] **Step 3: Add the Mailgun env vars to Vercel**

```bash
vercel env add MAILGUN_API_KEY production
vercel env add MAILGUN_DOMAIN production
vercel env add MAILGUN_FROM production
vercel env add CONTACT_RECIPIENT production
```

Repeat for `preview`. `MAILGUN_API_KEY` already exists in `.env.local`.

**Do not add `CREDIT_CARD_NUMBER`, `EXPIRATION_DATE`, `CVV`, or `Zip`** — those are in `.env.local` but are not application config, and storing a CVV is prohibited under PCI-DSS.

- [ ] **Step 4: Deploy a preview and verify live**

```bash
vercel
```

Then submit the real form on the preview URL and confirm the email arrives at `brainfoodrs@gmail.com`.

**This step needs the human** — it requires inbox access. Report the preview URL and ask them to confirm delivery, inbox rendering, and that it did not land in spam.

- [ ] **Step 5: DNS check (report, do not change)**

Mailgun needs SPF and DKIM records on the sending domain or mail lands in spam. Check whether the domain is verified in Mailgun and report what is missing. **Do not modify DNS** — that is the user's call.

---

## Notes for the implementer

- **The bug being fixed is fake success.** Any code path that reports success without a confirmed send reintroduces it. When in doubt, surface the error.
- **Never put the visitor's address in `From`.** It fails SPF and wrecks deliverability. Reply-To only.
- **The templates file is meant to be hand-edited later.** Keep it readable and keep the shared layout genuinely shared — that is the whole requirement.
- **Rate limiting is in-memory and therefore per-instance.** Serverless instances don't share it. It is a speed bump; if abuse appears, a durable store is the fix.
- Persisting submissions to Supabase was deliberately deferred. It is the natural follow-up: if Mailgun is down, a lead is currently lost — which is a milder version of today's bug.
