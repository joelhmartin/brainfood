import { contactSchema } from "../../../src/config/schemas.js";
import { adminNotification, autoReply } from "../../../src/lib/email/templates.js";
import { sendEmail, isMailConfigured } from "../../../src/lib/email/mailgun.js";

/**
 * Public, unauthenticated endpoint that sends real email — used by every public
 * contact form (the /contact page and the sidebar MiniForm). Unlike the other
 * /api routes, there is no auth to gate abuse here, so this file IS the security
 * boundary: honeypot + validation before any send, then a per-IP rate limit
 * before we let a submission through to Mailgun.
 */

const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "brainfoodrs@gmail.com";

// ── Rate limiting ────────────────────────────────────────────────────────────
//
// In-memory per-IP limiter. NOTE: serverless function instances do not share
// memory — each cold start (and each concurrently-running instance) gets its
// own empty Map, so a determined abuser spread across instances is not
// actually capped at 5/hour. This is a speed bump against casual/naive abuse,
// not a guarantee. If real abuse shows up, replace this with a durable store
// (e.g. Redis/Upstash) keyed the same way.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
// Hard ceiling on distinct tracked keys, and how often we sweep the whole Map
// for entries that have gone fully stale. See the eviction comment inside
// isRateLimited for why both are needed.
const MAX_TRACKED_IPS = 5000;
const SWEEP_EVERY = 100;
const requestsByIp = new Map();
let requestsSinceSweep = 0;

function isRateLimited(ip) {
  const now = Date.now();

  // Periodically drop any key whose entire timestamp list has aged out of the
  // window. Without this, an entry created for an IP that never comes back
  // (e.g. it hit the form once) is never removed — the Map only ever grows
  // for the life of the warm instance. Amortized via a counter instead of a
  // scan on every call so the common case stays O(1).
  requestsSinceSweep += 1;
  if (requestsSinceSweep >= SWEEP_EVERY) {
    requestsSinceSweep = 0;
    for (const [key, timestamps] of requestsByIp) {
      const stillRecent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (stillRecent.length === 0) {
        requestsByIp.delete(key);
      } else if (stillRecent.length !== timestamps.length) {
        requestsByIp.set(key, stillRecent);
      }
    }
  }

  // Backstop: entries created within the current window (i.e. not yet stale)
  // survive the sweep above, so a flood of distinct IPs arriving faster than
  // the sweep interval could still grow the Map without bound. If that
  // happens, drop everything rather than let memory grow unboundedly — this
  // costs existing visitors their remaining quota, an acceptable trade-off
  // against unbounded growth.
  if (requestsByIp.size >= MAX_TRACKED_IPS && !requestsByIp.has(ip)) {
    requestsByIp.clear();
  }

  const recent = (requestsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// Test-only hook: the Map above is module-level state shared by every test in
// route.test.js, so a suite that doesn't reset it can pass or fail depending
// on test order/count rather than on what each test actually verifies.
export function resetRateLimiterForTests() {
  requestsByIp.clear();
  requestsSinceSweep = 0;
}

// Vercel's edge network sets these headers itself from the TCP connection it
// observed; by default it overwrites `x-forwarded-for`/`x-vercel-forwarded-for`
// and does not forward externally-supplied values ("This restriction is in
// place to prevent IP spoofing" — https://vercel.com/docs/headers/request-headers,
// verified 2026-07-19). `x-vercel-forwarded-for` is preferred over
// `x-forwarded-for` because it stays authoritative even if something in front
// of Vercel (a customer-added reverse proxy, or the Enterprise "Trusted Proxy"
// feature) causes `x-forwarded-for` to be overwritten by that layer instead;
// `x-real-ip` is documented as an equivalent platform-set alias and is used as
// the fallback. Neither header exists in local dev (no proxy in front of
// `next dev`), so an absent header falls back to a fixed placeholder rather
// than trusting anything client-supplied.
function clientIp(request) {
  const header =
    request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-real-ip");
  if (!header) return "unknown";
  // Defensive only: neither header is documented to ever carry a chain, but
  // if one does, the rightmost entry is the value the nearest trusted hop
  // itself observed — the leftmost end of an X-Forwarded-For-style chain is
  // the end a client can influence.
  const parts = header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || "unknown";
}

// ── Source sanitization ──────────────────────────────────────────────────────
//
// `source` (which form this came from, e.g. "Contact page") is emailed
// straight into the admin notification's subject line ("New submission from
// {source}"). A raw newline there would let a submitter smuggle extra email
// headers (subject/header injection), so client-supplied text can never reach
// that interpolation unsanitized.
//
// We strip newlines/control characters and cap the length rather than
// whitelist a fixed list of strings: the schema (Task 1) doesn't enumerate
// `source` at all, and the other forms that will feed this route aren't wired
// up yet, so a whitelist would need to be revisited every time a new form is
// added. Stripping control characters closes the actual injection vector (a
// raw CR/LF reaching the subject) regardless of what the label says.
const DEFAULT_SOURCE = "Contact form";
const MAX_SOURCE_LENGTH = 100;

function sanitizeSource(value) {
  if (typeof value !== "string") return DEFAULT_SOURCE;
  const cleaned = value.replace(/[\r\n]+/g, " ").trim();
  return cleaned.slice(0, MAX_SOURCE_LENGTH) || DEFAULT_SOURCE;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  // Honeypot: a hidden field no human sees or fills. Checked on the raw field
  // (ahead of schema validation, which would otherwise reject a filled
  // honeypot as an ordinary 400) so a bot always gets a quiet 200 instead of
  // a signal to adapt. Nothing is sent.
  if (body?.company) {
    return Response.json({ ok: true });
  }

  const result = contactSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid submission.";
    return Response.json({ error: message }, { status: 400 });
  }

  // Check mail configuration before the rate limit so an outage doesn't burn
  // visitors' quota against a route that can only 500 anyway — only requests
  // that could actually reach a send should count toward the limit.
  if (!isMailConfigured()) {
    console.error("[contact] rejected: Mailgun is not configured.");
    return Response.json({ error: "Unable to send your message right now." }, { status: 500 });
  }

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const { name, email, phone, message } = result.data;
  const submission = { name, email, phone, message, source: sanitizeSource(body?.source) };

  try {
    const { subject, html, text } = adminNotification(submission);
    await sendEmail({ to: CONTACT_RECIPIENT, subject, html, text, replyTo: email });
  } catch (err) {
    // Never echo the API key or the full submission — just enough to locate
    // the failure in logs.
    console.error("[contact] admin notification failed:", err.message);
    return Response.json({ error: "Unable to send your message right now." }, { status: 500 });
  }

  // The business already has the lead once the admin notification is sent, so
  // a failed auto-reply must not turn this into a failed request.
  try {
    const { subject, html, text } = autoReply(submission);
    await sendEmail({ to: email, subject, html, text });
  } catch (err) {
    console.error("[contact] auto-reply failed:", err.message);
  }

  return Response.json({ ok: true });
}
