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
const requestsByIp = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
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

  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  if (!isMailConfigured()) {
    console.error("[contact] rejected: Mailgun is not configured.");
    return Response.json({ error: "Unable to send your message right now." }, { status: 500 });
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
