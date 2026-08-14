/**
 * reCAPTCHA Enterprise identifiers.
 *
 * Everything here is PUBLIC by design. The site key ships in the browser bundle
 * because the widget cannot work otherwise, and the Google Cloud project ID is
 * not a credential either. The only secret in this feature is the assessment
 * API key, which lives in `RECAPTCHA_API_KEY` and is read exclusively by
 * `src/lib/recaptcha.js` (server-only).
 *
 * These are compiled-in defaults with env overrides, following the same pattern
 * as FALLBACK_SETTINGS in ./site.js: the site works out of the box after a
 * deploy, and a key rotation is an env change rather than a code change.
 */

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfXlYItAAAAAAno7LBGFpHeA6Wr23PgGpc1I65H";

export const RECAPTCHA_PROJECT_ID = "brainfood-505317";

/**
 * The `action` passed to grecaptcha.enterprise.execute() and asserted again
 * server-side. Distinct per form so the reCAPTCHA console breaks scores down by
 * origin, and so a token minted for one form cannot be replayed against another.
 *
 * Google's constraint: letters, digits, slashes and underscores only.
 */
export const RECAPTCHA_ACTIONS = {
  contactPage: "contact_submit",
  sidebar: "sidebar_submit",
};
