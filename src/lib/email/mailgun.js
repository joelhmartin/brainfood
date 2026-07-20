import "server-only";

import formData from "form-data";
import Mailgun from "mailgun.js";

/**
 * Mailgun transport. Holds a Mailgun credential, so this module is server-only —
 * `import "server-only"` turns any accidental client import into a build error
 * rather than a silently shipped credential.
 *
 * Prefers MAILGUN_SENDING_KEY over MAILGUN_API_KEY. Mailgun issues a dedicated
 * sending key alongside the account API key; using it here means the sending
 * credential can be rotated without disturbing anything that talks to the admin
 * API, and it is the key Mailgun intends for this job. MAILGUN_API_KEY remains a
 * fallback so an existing setup keeps working.
 */

const API_KEY = process.env.MAILGUN_SENDING_KEY || process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_DOMAIN;
const FROM = process.env.MAILGUN_FROM;

// Mailgun's EU region is a different host; assuming the US default silently fails
// for EU accounts.
const BASE_URL =
  process.env.MAILGUN_REGION?.trim().toLowerCase() === "eu"
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
