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
 * Public contact form. Used by both the /contact page and the sidebar MiniForm.
 *
 * `company` is a honeypot: a hidden field no human sees or fills. Bots fill every
 * input they find, so a non-empty value here means the submission is automated.
 * It is rejected server-side rather than in the browser, where a bot would simply
 * skip the check.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Enter a message.").max(5000, "Message is too long."),
  company: z.literal("").optional(),
});
