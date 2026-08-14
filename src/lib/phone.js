/**
 * Phone-number validation and display formatting.
 *
 * Pure functions, per this repo's established pattern for testable logic (see
 * `paginateEvents` and `safeRedirectPath`): the rules live here rather than
 * inline in the Zod schema so that validation and the notification email agree
 * on what counts as a real number.
 *
 * The bug this closes: `phone` was only length-capped, so "785" validated and
 * a submission arrived with an unusable number.
 */

/** Every digit in the value, with punctuation and spacing stripped. */
export function phoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

// Characters that legitimately appear in a typed phone number. Letters, "@", or
// anything else means this is not a phone number at all, and rejecting on the
// raw string catches that before the digit count ever gets a chance to pass.
const ALLOWED_CHARS = /^[+()\-.\s\d]+$/;

// North American Numbering Plan: neither the area code nor the central-office
// code may begin with 0 or 1. This is what rejects filler like "111-111-1111"
// and "000-000-0000", which a bare 10-digit length check happily accepts.
const NANP = /^[2-9]\d{2}[2-9]\d{6}$/;

// E.164 caps a full international number at 15 digits. The floor is a sanity
// bound — no reachable subscriber number is shorter than 8 digits with a
// country code attached.
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;

/**
 * True if `value` is a plausible, dialable phone number.
 *
 * A leading "+" is treated as an explicit international number: the country
 * code is trusted and only the overall length is bounded, because encoding
 * per-country numbering rules here would be a maintenance burden with no
 * benefit to a US-based practice. Everything else is assumed North American
 * and held to NANP rules.
 */
export function isValidPhone(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  if (!ALLOWED_CHARS.test(raw)) return false;

  const digits = phoneDigits(raw);

  if (raw.startsWith("+")) {
    if (digits.length < E164_MIN_DIGITS || digits.length > E164_MAX_DIGITS) return false;
    // "+1" is still North American and still has to obey NANP rules — otherwise
    // "+1 111 111 1111" would slip through the international branch.
    return digits.startsWith("1") ? NANP.test(digits.slice(1)) : true;
  }

  if (digits.length === 11) return digits.startsWith("1") && NANP.test(digits.slice(1));
  return digits.length === 10 && NANP.test(digits);
}

/**
 * Formats a North American number as "(512) 555-0100" for the notification
 * email. Anything international passes through untouched — reformatting a
 * number whose national conventions we do not model would only corrupt it.
 */
export function formatPhone(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.startsWith("+")) return raw;

  const digits = phoneDigits(raw);
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return raw;

  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}
