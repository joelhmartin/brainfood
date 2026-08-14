import "server-only";

import { RECAPTCHA_PROJECT_ID, RECAPTCHA_SITE_KEY } from "../config/recaptcha.js";

/**
 * reCAPTCHA Enterprise assessment.
 *
 * Holds an API key, so this module is server-only — `import "server-only"` turns
 * an accidental client import into a build error rather than a leaked credential.
 * (Vitest aliases the package to a no-op stub; see vitest.config.js.)
 *
 * The browser calls `grecaptcha.enterprise.execute()` and posts the resulting
 * token with the form. That token proves nothing on its own: it is scored by
 * Google, and only this assessment call reveals the score. Verifying in the
 * browser would be meaningless, since a bot posting JSON to /api/contact never
 * runs our JavaScript at all.
 *
 * Docs: https://cloud.google.com/recaptcha/docs/create-assessment-website
 */

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
    siteKey: RECAPTCHA_SITE_KEY,
    minScore: Number.isFinite(parsedScore) ? parsedScore : DEFAULT_MIN_SCORE,
  };
}

/**
 * True only when a token can actually be scored. The project and site key have
 * compiled-in defaults, so in practice this asks whether the secret API key is
 * present.
 *
 * Mirrors `isMailConfigured()`: the route asks first, so an environment without
 * the key (local dev, a preview deploy without secrets) degrades to the
 * honeypot and rate limiter instead of rejecting every submission.
 */
export function isRecaptchaConfigured() {
  const { projectId, apiKey, siteKey } = config();
  return Boolean(projectId && apiKey && siteKey);
}

/**
 * Scores a token.
 *
 * @returns {Promise<{ ok: boolean, reason: string, score: number|null }>}
 *
 * The fail-open / fail-closed split is deliberate and is the security decision
 * in this file:
 *
 *   fail CLOSED — the token is missing, invalid, replayed, raised for a
 *   different action, or scores below the threshold. These are the signals
 *   reCAPTCHA exists to act on; honouring them is the entire point.
 *
 *   fail OPEN — reCAPTCHA is not configured, or Google itself is unreachable or
 *   returns an error/no score. A Google outage must not silently swallow leads
 *   for a business whose enquiries are the product; the honeypot and rate limit
 *   still apply, and the failure is logged so it is visible.
 */
export async function verifyRecaptcha({ token, expectedAction }) {
  const { projectId, apiKey, siteKey, minScore } = config();

  if (!isRecaptchaConfigured()) {
    return { ok: true, reason: "not-configured", score: null };
  }

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, reason: "missing-token", score: null };
  }

  const url = `${ASSESSMENT_HOST}/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`;
  const body = { event: { token, expectedAction, siteKey } };

  let assessment;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // Never log the response body: it echoes the token, and the URL carries
      // the API key.
      console.error(`[recaptcha] assessment failed with HTTP ${response.status}`);
      return { ok: true, reason: "verification-unavailable", score: null };
    }

    assessment = await response.json();
  } catch (err) {
    console.error("[recaptcha] assessment request failed:", err.message);
    return { ok: true, reason: "verification-unavailable", score: null };
  }

  const properties = assessment?.tokenProperties ?? {};

  // `valid: false` covers an expired, malformed, already-consumed, or
  // wrong-site-key token. `invalidReason` says which.
  if (!properties.valid) {
    return { ok: false, reason: properties.invalidReason || "invalid-token", score: null };
  }

  // Without this check a token minted on any other action — a page-view ping,
  // a different form — would be accepted here.
  if (expectedAction && properties.action !== expectedAction) {
    return { ok: false, reason: "action-mismatch", score: null };
  }

  const score = assessment?.riskAnalysis?.score;
  if (typeof score !== "number") {
    console.error("[recaptcha] assessment returned no risk score");
    return { ok: true, reason: "verification-unavailable", score: null };
  }

  if (score < minScore) {
    return { ok: false, reason: "low-score", score };
  }

  return { ok: true, reason: "ok", score };
}
