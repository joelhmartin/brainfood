"use client";

import { useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SITE, SOCIALS, LOGOS, BUSINESS } from "../../config/site.js";
import { contactSchema } from "../../config/schemas.js";
import { RECAPTCHA_ACTIONS } from "../../config/recaptcha.js";
import LogoFull from "../../images/logoFull.jsx";
import { useFormSubmit } from "../../hooks/useFormSubmit.js";
import { useRecaptcha } from "../../hooks/useRecaptcha.js";

/**
 * Reusable sidebar for content pages (blog, events).
 *
 * @param {string}  title    — sidebar heading (e.g. "Get in Touch")
 * @param {string}  subtitle — short blurb below heading
 * @param {boolean} showForm — show the mini contact form (default true)
 */
export function ContentSidebar({
  title = "Get in Touch",
  subtitle = "We're here to help. Reach out anytime — all conversations are confidential.",
  showForm = true,
}) {
  return (
    <aside className="space-y-6">
      {/* Logo + brand */}
      <div className="bg-white rounded-3xl border border-surface-200/60 p-6">
        <LogoFull className="h-8 w-auto mb-4" dark />
        <p className="text-navy/50 text-sm leading-relaxed">
          {BUSINESS.description}
        </p>

        {/* Socials */}
        <div className="mt-5 flex items-center gap-2">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-surface-100 border border-surface-300/50 flex items-center justify-center text-navy/40 hover:text-brand-500 hover:border-brand-300 transition-all duration-300"
              aria-label={s.label}
            >
              <s.icon size={14} />
            </a>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-3xl border border-surface-200/60 p-6">
        <h3 className="font-heading font-bold text-lg text-navy tracking-tight mb-1">
          {title}
        </h3>
        <p className="text-navy/45 text-sm leading-relaxed mb-5">
          {subtitle}
        </p>

        <ContactDetails />

        {showForm && (
          <>
            <div className="h-px bg-surface-300/40 my-5" />
            <MiniForm />
          </>
        )}
      </div>
    </aside>
  );
}

/* ─── Contact details ─── */
function ContactDetails() {
  const items = [
    { icon: Phone,  label: "Phone",    value: SITE.phone,    href: SITE.phoneHref },
    { icon: Mail,   label: "Email",    value: SITE.email,    href: SITE.emailHref },
    { icon: MapPin, label: "Location", value: SITE.location },
    { icon: Clock,  label: "Hours",    value: SITE.hours },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <item.icon size={13} className="text-brand-500" />
          </div>
          <div className="min-w-0">
            {item.href ? (
              <a
                href={item.href}
                className="block text-sm text-navy/70 hover:text-brand-500 transition-colors truncate"
              >
                {item.value}
              </a>
            ) : (
              <p className="text-sm text-navy/70 truncate">{item.value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Mini contact form ─── */

// Same geometry in both states so an appearing error never shifts the layout.
const MINI_CONTROL_BASE =
  "w-full px-4 py-2.5 rounded-xl bg-surface-100 border text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:ring-2 transition-all";

function miniControlClass(hasError, extra = "") {
  const state = hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
    : "border-surface-300/50 focus:border-brand-500 focus:ring-brand-500/10";
  return `${MINI_CONTROL_BASE} ${state} ${extra}`.trim();
}

function MiniForm() {
  const {
    submit,
    state: formState,
    error,
    reset: resetStatus,
  } = useFormSubmit({ endpoint: "/api/contact" });
  const getRecaptchaToken = useRecaptcha(RECAPTCHA_ACTIONS.sidebar);

  const {
    register,
    handleSubmit,
    reset: resetFields,
    formState: { errors, isSubmitting },
  } = useForm({
    // The shared base schema, not contactPageSchema: this form has no
    // "reaching out about" select, and inquiry is optional in the base.
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", email: "", phone: "", message: "", company: "" },
  });

  const busy = isSubmitting || formState === "sending";

  const onSubmit = async (data) => {
    const recaptchaToken = await getRecaptchaToken();
    const ok = await submit({ ...data, recaptchaToken, source: "Sidebar" });
    if (ok) resetFields();
  };

  useEffect(() => {
    if (formState !== "success") return;
    const timer = setTimeout(() => resetStatus(), 3500);
    return () => clearTimeout(timer);
  }, [formState, resetStatus]);

  const fields = [
    { name: "name", type: "text", placeholder: "Your name", autoComplete: "name" },
    { name: "email", type: "email", placeholder: "Email address", autoComplete: "email" },
    { name: "phone", type: "tel", placeholder: "Phone (optional)", autoComplete: "tel" },
  ];

  return (
    // `noValidate`: Zod owns validation, so the browser's native bubbles must
    // not fire alongside our inline messages.
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {/* Honeypot: hidden from real users, bots fill every field they find. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        {...register("company")}
      />

      {fields.map((field) => (
        <div key={field.name}>
          <input
            type={field.type}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            aria-label={field.placeholder}
            aria-invalid={errors[field.name] ? "true" : undefined}
            aria-describedby={errors[field.name] ? `mini-${field.name}-error` : undefined}
            className={miniControlClass(Boolean(errors[field.name]))}
            {...register(field.name)}
          />
          {errors[field.name] && (
            <p
              id={`mini-${field.name}-error`}
              role="alert"
              className="mt-1 px-1 text-[11px] font-medium text-red-600"
            >
              {errors[field.name].message}
            </p>
          )}
        </div>
      ))}

      <div>
        <textarea
          rows={3}
          placeholder="How can we help?"
          aria-label="How can we help?"
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? "mini-message-error" : undefined}
          className={miniControlClass(Boolean(errors.message), "resize-none")}
          {...register("message")}
        />
        {errors.message && (
          <p
            id="mini-message-error"
            role="alert"
            className="mt-1 px-1 text-[11px] font-medium text-red-600"
          >
            {errors.message.message}
          </p>
        )}
      </div>

      {formState === "error" && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || formState === "success"}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-80 ${
          formState === "success"
            ? "bg-emerald-500 text-white"
            : "bg-brand-500 text-white hover:bg-brand-600"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {busy ? (
            <>Sending <Loader2 size={13} className="animate-spin" /></>
          ) : formState === "success" ? (
            <>Sent! <CheckCircle size={13} /></>
          ) : formState === "error" ? (
            <>Try Again <Send size={13} /></>
          ) : (
            <>Send Message <Send size={13} /></>
          )}
        </span>
      </button>
      <p className="text-navy/30 text-[11px] text-center">
        All inquiries are confidential.
      </p>
      {/* Google's terms require the badge or this disclosure wherever the
          widget runs. */}
      <p className="text-navy/25 text-[10px] leading-relaxed text-center">
        Protected by reCAPTCHA —{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-500 transition-colors"
        >
          Privacy
        </a>{" "}
        &amp;{" "}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-500 transition-colors"
        >
          Terms
        </a>
        .
      </p>
    </form>
  );
}
