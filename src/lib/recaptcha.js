import "server-only";

import { RECAPTCHA_PROJECT_ID, RECAPTCHA_SITE_KEY } from "../config/recaptcha.js";

/**
 * reCAPTCHA token verification.
 *
 * Holds a credential, so this module is server-only — `import "server-only"`
 * turns an accidental client import into a build error rather than a leaked
 * secret. (Vitest aliases the package to a no-op stub; see vitest.config.js.)
 *
 * The browser calls `grecaptcha.enterprise.execute()` and posts the resulting
 * token with the form. That token proves nothing on its own: it is scored by
 * Google, and only a server-side verification call reveals the score. Verifying
 * in the browser would be meaningless, since a bot posting JSON straight at
 * /api/contact never runs our JavaScript at all.
 *
 * TWO BACKENDS, because Google has two and a key belongs to exactly one of them:
 *
 *   classic  — POST to /recaptcha/api/siteverify with a 40-character SECRET
 *              key ("6Lf…"), issued alongside the site key in the reCAPTCHA
 *              admin console. This is what this site is configured with.
 *              https://developers.google.com/recaptcha/docs/verify
 *
 *   enterprise — POST an assessment to the Cloud API with a Google Cloud API
 *              key ("AIza…") and a project ID. There is no secret key in
 *              Enterprise; the API key is a separate Cloud credential.
 *              https://cloud.google.com/recaptcha/docs/create-assessment-website
 *
 * Enterprise wins when RECAPTCHA_API_KEY is set, because it is the richer
 * backend; otherwise the classic secret is used. Both return a v3-style score
 * and an action, so everything downstream of `assess()` is shared.
 */

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const ASSESSMENT_HOST = "https://recaptchaenterprise.googleapis.com/v1/projects";

// Google's guidance for a v3-style score: 1.0 is very likely human, 0.0 very
// likely a bot. 0.5 is the documented starting point; tune with real traffic in
// the reCAPTCHA console rather than by guessing.
const DEFAULT_MIN_SCORE = 0.5;

// Env is read per-call, not at module load, so tests can vary configuration and
// so a Vercel env change takes effect on the next warm invocation.
function config() {
  const parsedScore = Number.parseFloat(process.env.RECAPTCHA_MIN_SCORE ?? "");
  return {
    projectId: process.env.RECAPTCHA_PROJECT_ID || RECAPTCHA_PROJECT_ID,
    apiKey: process.env.RECAPTCHA_API_KEY,
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
    siteKey: RECAPTCHA_SITE_KEY,
    minScore: Number.isFinite(parsedScore) ? parsedScore : DEFAULT_MIN_SCORE,
  };
}

/**
 * True only when a token can actually be verified: a site key (so the browser
 * can mint one) plus either backend's credential.
 *
 * Mirrors `isMailConfigured()`: the route asks first, so an environment with no
 * credential (local dev, a preview deploy without secrets) degrades to the
 * honeypot and rate limiter instead of rejecting every submission.
 */
export function isRecaptchaConfigured() {
  const { apiKey, secretKey, siteKey } = config();
  return Boolean(siteKey && (apiKey || secretKey));
}

/**
 * Normalised verification result, shared by both backends.
 * @typedef {{ valid: boolean, reason: string|null, action: string|null, score: number|null }} Assessment
 */

/** @returns {Promise<Assessment|null>} null when the call itself could not be made. */
async function assessClassic({ token, secretKey }) {
  // siteverify takes form encoding, not JSON.
  const body = new URLSearchParams({ secret: secretKey, response: token });

  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    console.error(`[recaptcha] siteverify failed with HTTP ${response.status}`);
    return null;
  }

  const payload = await response.json();
  return {
    valid: payload?.success === true,
    reason: payload?.["error-codes"]?.join(",") || null,
    action: payload?.action ?? null,
    // v3 keys return a score; a v2 key does not, and `success` alone is its
    // verdict. `assess()`'s caller treats a null score as "already decided".
    score: typeof payload?.score === "number" ? payload.score : null,
  };
}

/** @returns {Promise<Assessment|null>} null when the call itself could not be made. */
async function assessEnterprise({ token, expectedAction, projectId, apiKey, siteKey }) {
  const url = `${ASSESSMENT_HOST}/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: { token, expectedAction, siteKey } }),
  });

  if (!response.ok) {
    // Never log the response body: it echoes the token, and the URL carries
    // the API key.
    console.error(`[recaptcha] assessment failed with HTTP ${response.status}`);
    return null;
  }

  const payload = await response.json();
  const properties = payload?.tokenProperties ?? {};
  return {
    // `valid: false` covers an expired, malformed, already-consumed, or
    // wrong-site-key token. `invalidReason` says which.
    valid: properties.valid === true,
    reason: properties.invalidReason || null,
    action: properties.action ?? null,
    score: typeof payload?.riskAnalysis?.score === "number" ? payload.riskAnalysis.score : null,
  };
}

/**
 * Verifies a token against whichever backend is configured.
 *
 * @returns {Promise<{ ok: boolean, reason: string, score: number|null }>}
 *
 * The fail-open / fail-closed split is the security decision in this file:
 *
 *   fail CLOSED — the token is missing, invalid, replayed, raised for a
 *   different action, or scores below the threshold. These are the signals
 *   reCAPTCHA exists to act on; honouring them is the entire point.
 *
 *   fail OPEN — reCAPTCHA is not configured, or Google itself is unreachable or
 *   returns an error. A Google outage must not silently swallow leads for a
 *   business whose enquiries are the product; the honeypot and rate limit still
 *   apply, and the failure is logged so it is visible.
 */
export async function verifyRecaptcha({ token, expectedAction }) {
  const { projectId, apiKey, secretKey, siteKey, minScore } = config();

  if (!isRecaptchaConfigured()) {
    return { ok: true, reason: "not-configured", score: null };
  }

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, reason: "missing-token", score: null };
  }

  let assessment;
  try {
    assessment = apiKey
      ? await assessEnterprise({ token, expectedAction, projectId, apiKey, siteKey })
      : await assessClassic({ token, secretKey });
  } catch (err) {
    console.error("[recaptcha] verification request failed:", err.message);
    return { ok: true, reason: "verification-unavailable", score: null };
  }

  if (!assessment) {
    return { ok: true, reason: "verification-unavailable", score: null };
  }

  if (!assessment.valid) {
    return { ok: false, reason: assessment.reason || "invalid-token", score: null };
  }

  // Without this check a token minted on any other action — a page-view ping,
  // a different form — would be accepted here. Skipped when the backend does
  // not report an action (a v2 classic key never does).
  if (expectedAction && assessment.action && assessment.action !== expectedAction) {
    return { ok: false, reason: "action-mismatch", score: assessment.score };
  }

  // No score means there is nothing further to weigh: either this is a v2 key
  // whose `success` was already the verdict, or the backend omitted it. Either
  // way the token itself verified, so let it through.
  if (assessment.score === null) {
    return { ok: true, reason: "no-score", score: null };
  }

  if (assessment.score < minScore) {
    return { ok: false, reason: "low-score", score: assessment.score };
  }

  return { ok: true, reason: "ok", score: assessment.score };
}
