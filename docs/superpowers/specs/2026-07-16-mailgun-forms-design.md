# Transactional Email (Mailgun) — Design

**Date:** 2026-07-16
**Status:** Approved for planning
**Depends on:** the Next.js migration (branch `nextjs-migration`), which provides the API route handlers this needs.

## Why

**Every public form on this site is fake.** Each fakes a success message on a timer and
discards the submission:

- `src/screens/marketing/Contact.jsx:104` — `setTimeout(() => setFormState("success"), 1500)`
- `src/components/marketing/ContentSidebar.jsx:114` — `setTimeout(() => setFormState("success"), 1200)`
- `src/screens/marketing/CaseSubmission.jsx:727` — `setTimeout(() => setSubmitted(true), 2000)`

Anyone who has filled one out was told "we'll be in touch" and their message went nowhere.
This is not a new feature; it is repairing a silently broken one. For a recovery-services
business, a dropped inquiry may be someone asking for help.

The sidebar `MiniForm` is the most consequential: it renders on `/blog`, `/events`, and every
individual post and event page, so it is likely the highest-volume capture point on the site.

## Scope

Wire the two legitimate forms to real email through Mailgun, behind one reusable hook and one
shared template layer. Remove the third.

### In scope

1. **Contact form** (`/contact`) — name, email, phone, message.
2. **Sidebar MiniForm** (`ContentSidebar`) — name, email, phone (optional), message. Appears on
   blog and events list + detail pages.
3. **Reusable send hook** — one client-side hook both forms use. No duplicated fetch/state logic.
4. **Auto-responder** — optional per-send confirmation email to the person who submitted.
5. **Templates** — branded HTML for both the admin notification and the customer auto-reply.
   **Editable in exactly one place.** No visual builder.
6. **Remove `/submit-case`** — see below.

### Out of scope

- The AI admin work (`BACKLOG-ai-admin-and-email.md`) — separate.
- Persisting submissions to Supabase. Considered and deferred; see Risks.
- `/products`, the other orphaned dental-template page. Same root cause, tracked separately.

## Removing `/submit-case`

`CaseSubmission.jsx` is orphaned dental-template content — a sleep-apnea appliance order form
collecting `patientFirst`, `patientLast`, `dob`, `gender`, `ahiScore`, `diagnosis`,
`jointSymptoms`, plus `scanFiles`, `photos`, `prescription`, and `sleepStudy` uploads. It has
nothing to do with recovery services, and it is the same leftover as `/products`.

**It must not be wired to email.** Those fields are Protected Health Information. Sending them
to a Gmail inbox would be an unencrypted PHI transmission; Gmail is not HIPAA-eligible without
a BAA, and Mailgun requires an enterprise HIPAA plan to carry PHI at all. Deleting the page
removes the liability rather than deferring it.

**Nothing links to it.** Verified references are only: the route (`app/(marketing)/submit-case/`),
the page component, `app/sitemap.js`, `app/sitemap.test.js`, and `scripts/verify-routes.mjs`.
No navigation entry, no in-content link.

Removal covers: the route directory, `src/screens/marketing/CaseSubmission.jsx`, the sitemap
entry and its test expectation, and the `verify-routes` entry (19 routes → 18).

## Architecture

```
Client                      Server                        Mailgun
──────                      ──────                        ───────
ContactForm ─┐
             ├─ useFormSubmit() ─→ POST /api/contact ─┬─→ admin notification
MiniForm ────┘   (shared hook)      (route handler)   └─→ auto-reply (optional)
                                          │
                                    src/lib/email/
                                      ├─ mailgun.js    transport
                                      ├─ templates.js  ONE source of truth
                                      └─ ...
```

### Files

**Created**
- `app/api/contact/route.js` — POST handler: validate, send admin email, optionally auto-reply.
- `src/lib/email/mailgun.js` — the Mailgun transport. **Server-only** (`import "server-only"`).
- `src/lib/email/templates.js` — the single place templates are edited.
- `src/hooks/useFormSubmit.js` — shared client hook: `{ submit, state, error }`.
- Tests for validation, template rendering, and the route handler.

**Modified**
- `src/screens/marketing/Contact.jsx` — real submit via the hook.
- `src/components/marketing/ContentSidebar.jsx` — same.
- `src/config/schemas.js` — add `contactSchema` (Zod; the file already holds the app's schemas).
- `app/sitemap.js`, `app/sitemap.test.js`, `scripts/verify-routes.mjs` — drop `/submit-case`.

**Deleted**
- `app/(marketing)/submit-case/`, `src/screens/marketing/CaseSubmission.jsx`.

### The single-source-of-truth requirement

The user's constraint: *"updates to the template I only want to have to edit in one place."*

`src/lib/email/templates.js` owns all email presentation. Both templates are built from one
shared branded layout — header with logo, brand-colored accent, body slot, footer with business
name and contact details — so a brand change is edited once and both emails follow.

Brand values come from the existing `src/config/site.js` and `src/config/brand.js` (`BUSINESS.name`,
`CONTACT.email`, `LOGOS`, brand palette). Templates must not hardcode colors, the business name,
or contact details that already live in config.

HTML email requires table-based layout and inline styles — Tailwind classes do not survive most
email clients. Every email sends a plain-text alternative alongside the HTML.

### The reusable hook

`useFormSubmit({ endpoint })` returns `{ submit, state, error }` where `state` is
`"idle" | "sending" | "success" | "error"`. It owns fetch, JSON encoding, error handling, and
the state machine. Both forms keep their existing markup and their existing visual
sending/success states — only the fake `setTimeout` is replaced.

### Auto-responder

Controlled per send, defaulting on for both forms. Sent to the submitter's address, from the
business, confirming receipt and setting a response-time expectation. It must never echo the
submitter's message back verbatim in a way that would let the form be used to send arbitrary
content to a third party (see Risks).

## Configuration

Server-only env vars — none may be `NEXT_PUBLIC_`:

| Var | Purpose |
| --- | --- |
| `MAILGUN_API_KEY` | already in `.env.local`; not yet in Vercel |
| `MAILGUN_DOMAIN` | the sending domain |
| `MAILGUN_FROM` | e.g. `Brain Food <noreply@…>` |
| `CONTACT_RECIPIENT` | defaults to `brainfoodrs@gmail.com` |

`MAILGUN_API_KEY` must be added to Vercel (production + preview) before deploy — the migration
found this project previously had **zero** env vars set.

Mailgun's EU region uses a different API base URL than the US default; the transport must not
assume US.

## Error handling

- A Mailgun failure returns a clear error to the user rather than a false success. Fake success
  is the exact bug being fixed — the UI must never claim delivery that did not happen.
- The admin notification is the critical send. If the auto-reply fails but the admin email
  succeeded, the submission is still a success — the business received the lead.
- Validation failures return 400 with a field-level message. Server-side validation is
  authoritative; client-side validation is UX only.
- Errors are logged server-side without echoing the API key or full submission payload.

## Testing

- **Unit:** Zod schema accepts valid input and rejects malformed email, missing name, missing
  message, over-length input. Template builders produce HTML containing the submitted values,
  correctly escaped, plus a text alternative.
- **Route handler:** valid POST sends via a mocked transport; invalid POST returns 400 and sends
  nothing; a transport failure surfaces as an error, not a success.
- **XSS:** a submission containing HTML/script must be escaped in the rendered email.
- **E2E:** submitting the contact form shows a real success state driven by the endpoint.
- **Manual (needs the user):** a real end-to-end send to `brainfoodrs@gmail.com`, checking
  inbox rendering and that it does not land in spam.

## Risks

- **Spam / abuse.** These are public unauthenticated endpoints that send email. Without a
  control, they can be used to flood the inbox, and the auto-responder makes the site usable to
  send mail to arbitrary third parties. Rate limiting is required, not optional. A honeypot
  field is the cheapest first defense; the plan should decide the specific control.
- **Deliverability.** Mailgun needs SPF/DKIM DNS records on the sending domain or mail lands in
  spam. Sending "from" the visitor's address would fail SPF — the From must be the business, with
  the visitor's address in Reply-To.
- **Lost leads on outage.** If Mailgun is down the submission is gone, since nothing is
  persisted. Persisting to Supabase was considered and deferred to keep this change small; it is
  the natural follow-up, and it matters because dropped submissions are precisely today's bug.
- **The API key is currently in a `.env.local` that also contains a credit card number, an
  expiration date, and a CVV.** Storing a CVV is prohibited under PCI-DSS. Unrelated to this
  work but flagged: those values should be deleted regardless.
