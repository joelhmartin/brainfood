/**
 * Form validation schemas.
 *
 * Replaces the `@my-app/shared` stub, which was a leftover from a monorepo this
 * app no longer lives in. Roles moved to ./roles.js; the MFA, magic-link, and
 * registration schemas went with the mock features that used them.
 *
 * These validate the FORM. They are not a security boundary — the database is
 * (see supabase/migrations/*_rls_policies.sql).
 */
import { z } from "zod";
import { isValidPhone } from "../lib/phone.js";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

/**
 * The choices in the /contact page's "I'm reaching out about…" select.
 *
 * Exported so the markup and the schema cannot drift: the form renders this
 * list, and the schema validates against the same one. A free-text value here
 * would otherwise be interpolated into a notification email unchecked.
 */
export const CONTACT_INQUIRY_OPTIONS = [
  "Recovery Coaching for Myself",
  "Recovery Coaching for a Loved One",
  "Sober Companion Services",
  "Family Coaching & Support",
  "General Question",
];

// Long enough to be an actual enquiry rather than a bot's "test", short enough
// not to turn a nervous first message into a chore.
const MIN_MESSAGE_LENGTH = 10;

/**
 * Public contact form. Used by both the /contact page and the sidebar MiniForm.
 *
 * This is the SERVER contract and the shared base — every rule here is enforced
 * in `POST /api/contact` regardless of what the browser did, because client-side
 * validation is a courtesy to humans and no obstacle at all to a script posting
 * JSON directly.
 *
 * `company` is a honeypot: a hidden field no human sees or fills. Bots fill every
 * input they find, so a non-empty value here means the submission is automated.
 * It is rejected server-side rather than in the browser, where a bot would simply
 * skip the check.
 *
 * `inquiry` is optional here because the sidebar MiniForm has no such field. The
 * /contact page requires it — see `contactPageSchema`.
 */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(200, "That name is too long.")
    // A name has to contain at least one letter. Without this, "123" and "..."
    // both satisfy a bare min-length check.
    .regex(/\p{L}/u, "Enter your full name."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address.")
    // RFC 5321's cap on a full address. Stops a multi-kilobyte string from
    // reaching the mail transport.
    .max(254, "That email address is too long.")
    .email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .max(30, "That phone number is too long.")
    // Optional, but validated when present — an empty string still passes, a
    // half-typed one does not.
    .refine((value) => value === "" || isValidPhone(value), {
      message: "Enter a valid phone number, e.g. (512) 555-0100.",
    })
    .optional(),
  inquiry: z
    .enum(CONTACT_INQUIRY_OPTIONS, { message: "Choose what you're reaching out about." })
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(MIN_MESSAGE_LENGTH, "Tell us a little more — at least 10 characters.")
    .max(5000, "Message is too long."),
  company: z.literal("").optional(),
  // Supplied by grecaptcha.enterprise.execute(). Optional in the shape because
  // the route decides whether a missing token is fatal (it is, whenever
  // reCAPTCHA is configured) — a schema rejection here would report it to the
  // visitor as an ordinary field error, which it is not.
  recaptchaToken: z.string().max(4096).optional().or(z.literal("")),
});

/**
 * The /contact page's form: the shared contract plus a required inquiry.
 *
 * The select was previously decorative — it rendered, but `handleSubmit` never
 * read it, so the answer never reached the notification email.
 */
export const contactPageSchema = contactSchema.extend({
  inquiry: z.enum(CONTACT_INQUIRY_OPTIONS, {
    message: "Choose what you're reaching out about.",
  }),
});
