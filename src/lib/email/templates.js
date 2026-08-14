/**
 * Email templates — the ONLY place email presentation is edited.
 *
 * Every email this app sends (admin notification + customer auto-reply, and
 * anything added later) is built from the single `layout()` function below.
 * Change the header, footer, or brand color once here and every email follows.
 *
 * HTML email cannot use Tailwind or modern CSS — Gmail and Outlook strip most
 * of it. So this file uses old-school table-based layout with inline styles,
 * unlike the rest of this codebase. Do not "modernize" this file's CSS; it
 * will break in real inboxes.
 *
 * Brand values (business name, contact email, brand color) are pulled from
 * config, not hardcoded — see src/config/site.js and src/config/brand.js.
 */
import { BUSINESS, CONTACT } from "../../config/site.js";
import { brand } from "../../config/brand.js";

// ── Escaping ─────────────────────────────────────────────────────────────────

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes the characters that would let a submitted value break out of HTML
 * markup or attributes. Every submission value interpolated into an email's
 * HTML MUST go through this first — a contact form is public input, and a
 * submitted `<script>` or `onerror="..."` must render as inert text, not
 * markup: escaping `<`, `>`, and `"` removes the tag and attribute delimiters
 * that would make it live.
 */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// ── Shared layout ────────────────────────────────────────────────────────────

const BRAND_COLOR = brand.colors.primary;
const TEXT_COLOR = "#1a1a1a";
const MUTED_COLOR = "#6b6b6b";
const BORDER_COLOR = "#e5e5e5";
const BACKGROUND_COLOR = "#f4f4f4";

/**
 * The one shared shell every email is built from: a table-based wrapper with
 * a branded header (business name) and a plain footer. `heading` is the big
 * title under the header banner; `bodyHtml` is the pre-built inner content
 * (already escaped by the caller where it comes from user input).
 *
 * A brand change — color, business name, footer copy — is made here, once,
 * and both `adminNotification` and `autoReply` pick it up automatically.
 */
function layout({ heading, bodyHtml }) {
  return `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:${BACKGROUND_COLOR}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BACKGROUND_COLOR}; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff; border:1px solid ${BORDER_COLOR}; border-radius:4px; max-width:600px; width:100%;">
            <tr>
              <td style="background-color:${BRAND_COLOR}; padding:20px 32px; border-radius:4px 4px 0 0;">
                <span style="color:#ffffff; font-size:18px; font-weight:bold;">${escapeHtml(BUSINESS.name)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:20px; color:${TEXT_COLOR};">${escapeHtml(heading)}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; border-top:1px solid ${BORDER_COLOR};">
                <p style="margin:0; font-size:12px; color:${MUTED_COLOR};">
                  ${escapeHtml(BUSINESS.name)} &middot; ${escapeHtml(CONTACT.email)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

/** Plain-text footer used by every template, so it too is defined once. */
function textFooter() {
  return `--\n${BUSINESS.name}\n${CONTACT.email}`;
}

// ── Field helper ─────────────────────────────────────────────────────────────

/** One "Label: value" HTML row, with the value escaped. */
function fieldRow(label, value) {
  return `
                <p style="margin:0 0 12px; font-size:14px; color:${TEXT_COLOR};">
                  <strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}
                </p>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

/**
 * Sent to the business when someone submits a public form. Shows every
 * submitted field plus which form it came from, so the recipient knows both
 * what was said and where to find the context (e.g. "Contact page").
 */
export function adminNotification(submission) {
  const { name, email, phone, message, inquiry, source } = submission;

  const bodyHtml = [
    fieldRow("Name", name),
    fieldRow("Email", email),
    phone ? fieldRow("Phone", phone) : "",
    inquiry ? fieldRow("Enquiry", inquiry) : "",
    fieldRow("Source", source),
    `
                <p style="margin:16px 0 0; font-size:14px; color:${TEXT_COLOR}; white-space:pre-wrap;">
                  <strong>Message:</strong><br />${escapeHtml(message)}
                </p>`,
  ].join("");

  const html = layout({
    heading: "New form submission",
    bodyHtml,
  });

  const text = [
    "New form submission",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    inquiry ? `Enquiry: ${inquiry}` : null,
    `Source: ${source}`,
    "",
    `Message:\n${message}`,
    "",
    textFooter(),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    subject: `New submission from ${source}`,
    html,
    text,
  };
}

/**
 * Sent back to the person who submitted a form, confirming their message was
 * received. Greets them by name and carries the business name/branding so
 * it reads like it came from a real business, not an automated void.
 */
export function autoReply(submission) {
  const { name } = submission;

  const bodyHtml = `
                <p style="margin:0 0 16px; font-size:14px; color:${TEXT_COLOR};">
                  Hi ${escapeHtml(name)},
                </p>
                <p style="margin:0 0 16px; font-size:14px; color:${TEXT_COLOR};">
                  Thanks for reaching out to ${escapeHtml(BUSINESS.name)}. We've received your
                  message and someone from our team will get back to you soon.
                </p>
                <p style="margin:0; font-size:14px; color:${TEXT_COLOR};">
                  If your situation is urgent, please call us at ${escapeHtml(CONTACT.phone)}.
                </p>`;

  const html = layout({
    heading: "We received your message",
    bodyHtml,
  });

  const text = [
    `Hi ${name},`,
    "",
    `Thanks for reaching out to ${BUSINESS.name}. We've received your message and someone ` +
      "from our team will get back to you soon.",
    "",
    `If your situation is urgent, please call us at ${CONTACT.phone}.`,
    "",
    textFooter(),
  ].join("\n");

  return {
    subject: `We received your message — ${BUSINESS.name}`,
    html,
    text,
  };
}
