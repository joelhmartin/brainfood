"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SITE } from "../../config/site.js";
import { AUSTIN } from "../../config/images.js";
import { contactPageSchema, CONTACT_INQUIRY_OPTIONS } from "../../config/schemas.js";
import { RECAPTCHA_ACTIONS } from "../../config/recaptcha.js";
import { useFormSubmit } from "../../hooks/useFormSubmit.js";
import { useRecaptcha } from "../../hooks/useRecaptcha.js";

/* ── Scroll reveal helper ── */
function useScrollReveal(ref, selector, animProps) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y: animProps.y ?? 24 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: animProps.duration ?? 0.8,
            stagger: animProps.stagger ?? 0.08,
            ease: animProps.ease ?? "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
}

/* ─── HERO ─── */
function ContactHero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-chero]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.3,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[45dvh] min-h-[350px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={AUSTIN.streetCrossing}
          alt="Austin, Texas"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
      </div>
      <div className="relative z-10 content-container pb-12 md:pb-16">
        <span
          data-chero
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 text-xs font-mono tracking-wider"
        >
          Contact Us
        </span>
        <h1 data-chero className="mt-5">
          <span className="block font-heading font-bold text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[0.95] text-white">
            Let&apos;s start the
          </span>
          <span className="block font-drama italic text-4xl sm:text-5xl md:text-8xl tracking-tight leading-[0.9] text-brand-400">
            conversation.
          </span>
        </h1>
      </div>
    </section>
  );
}

/* ─── CONTACT FORM ─── */

// The floating label sits on top of the control, so the control carries the
// padding that keeps the two from colliding. Error state only swaps the border
// and ring colours — the geometry stays identical so nothing shifts when a
// message appears.
const CONTROL_BASE =
  "w-full pt-6 pb-2 px-4 rounded-2xl bg-surface-100 border text-navy text-sm focus:outline-none focus:ring-2 transition-all duration-300";

function controlClass(hasError, extra = "") {
  const state = hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
    : "border-surface-300/50 focus:border-brand-500 focus:ring-brand-500/10";
  return `${CONTROL_BASE} ${state} ${extra}`.trim();
}

/** One inline error message, wired to its control by `aria-describedby`. */
function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 px-4 text-xs font-medium text-red-600">
      {error.message}
    </p>
  );
}

function ContactForm() {
  const [focused, setFocused] = useState({});
  const {
    submit,
    state: formState,
    error,
    reset: resetStatus,
  } = useFormSubmit({ endpoint: "/api/contact" });
  const getRecaptchaToken = useRecaptcha(RECAPTCHA_ACTIONS.contactPage);

  const {
    register,
    handleSubmit,
    watch,
    reset: resetFields,
    formState: { errors, isSubmitting },
  } = useForm({
    // The same schema the API route enforces, so the browser and the server
    // agree on what a valid submission is instead of drifting apart.
    resolver: zodResolver(contactPageSchema),
    // Validate a field when the visitor leaves it, then correct live once it
    // already has an error. Validating on every keystroke from the start would
    // flag "j" as an invalid email while someone is still typing it.
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      inquiry: "",
      message: "",
      company: "",
    },
  });

  const values = watch();
  // `isSubmitting` covers the reCAPTCHA round-trip, which happens before the
  // POST and so before useFormSubmit reports "sending".
  const busy = isSubmitting || formState === "sending";

  const onSubmit = async (data) => {
    const recaptchaToken = await getRecaptchaToken();
    const ok = await submit({ ...data, recaptchaToken, source: "Contact page" });
    if (ok) {
      resetFields();
      setFocused({});
    }
  };

  useEffect(() => {
    if (formState !== "success") return;
    const timer = setTimeout(() => resetStatus(), 4000);
    return () => clearTimeout(timer);
  }, [formState, resetStatus]);

  const fields = [
    { name: "name", label: "Full Name", type: "text", autoComplete: "name", required: true },
    { name: "email", label: "Email Address", type: "email", autoComplete: "email", required: true },
    { name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel", required: false },
  ];

  const labelClass = (floating, hasError) =>
    `absolute left-4 transition-all duration-300 pointer-events-none ${
      floating
        ? `top-2 text-[10px] font-semibold ${hasError ? "text-red-500" : "text-brand-500"}`
        : "top-4 text-sm text-navy/40"
    }`;

  return (
    // `noValidate` hands validation to Zod alone. Without it the browser's own
    // bubbles fire first, in a different voice and a different position, and
    // the visitor sees two competing error systems.
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Honeypot: hidden from real users, bots fill every field they find. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        {...register("company")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {fields.map((field) => {
          const fieldError = errors[field.name];
          const floating = focused[field.name] || Boolean(values[field.name]);
          const errorId = `${field.name}-error`;
          // Registration supplies onChange/onBlur/ref; the handlers below wrap
          // rather than replace them, or react-hook-form stops seeing the field.
          const registration = register(field.name);

          return (
            <div key={field.name} className={field.name === "name" ? "sm:col-span-2" : ""}>
              <div className="relative">
                <label htmlFor={field.name} className={labelClass(floating, Boolean(fieldError))}>
                  {field.label}
                  {!field.required && <span className="font-normal"> (optional)</span>}
                </label>
                <input
                  id={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  aria-invalid={fieldError ? "true" : undefined}
                  aria-describedby={fieldError ? errorId : undefined}
                  className={controlClass(Boolean(fieldError))}
                  {...registration}
                  onFocus={() => setFocused((prev) => ({ ...prev, [field.name]: true }))}
                  onBlur={(event) => {
                    registration.onBlur(event);
                    if (!event.target.value) {
                      setFocused((prev) => ({ ...prev, [field.name]: false }));
                    }
                  }}
                />
              </div>
              <FieldError id={errorId} error={fieldError} />
            </div>
          );
        })}
      </div>

      {(() => {
        const fieldError = errors.inquiry;
        const floating = focused.inquiry || Boolean(values.inquiry);
        const registration = register("inquiry");

        return (
          <div>
            <div className="relative">
              <label htmlFor="inquiry" className={labelClass(floating, Boolean(fieldError))}>
                I&apos;m reaching out about...
              </label>
              <select
                id="inquiry"
                aria-invalid={fieldError ? "true" : undefined}
                aria-describedby={fieldError ? "inquiry-error" : undefined}
                className={controlClass(Boolean(fieldError), "appearance-none cursor-pointer")}
                {...registration}
                onFocus={() => setFocused((prev) => ({ ...prev, inquiry: true }))}
                onBlur={(event) => {
                  registration.onBlur(event);
                  if (!event.target.value) {
                    setFocused((prev) => ({ ...prev, inquiry: false }));
                  }
                }}
              >
                <option value="" disabled></option>
                {/* Rendered from the schema's own list, so the options and the
                    values the server accepts can never drift apart. */}
                {CONTACT_INQUIRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <FieldError id="inquiry-error" error={fieldError} />
          </div>
        );
      })()}

      {(() => {
        const fieldError = errors.message;
        const floating = focused.message || Boolean(values.message);
        const registration = register("message");

        return (
          <div>
            <div className="relative">
              <label htmlFor="message" className={labelClass(floating, Boolean(fieldError))}>
                Tell us a little about your situation
              </label>
              <textarea
                id="message"
                rows={5}
                aria-invalid={fieldError ? "true" : undefined}
                aria-describedby={fieldError ? "message-error" : undefined}
                className={controlClass(Boolean(fieldError), "resize-none")}
                {...registration}
                onFocus={() => setFocused((prev) => ({ ...prev, message: true }))}
                onBlur={(event) => {
                  registration.onBlur(event);
                  if (!event.target.value) {
                    setFocused((prev) => ({ ...prev, message: false }));
                  }
                }}
              />
            </div>
            <FieldError id="message-error" error={fieldError} />
          </div>
        );
      })()}

      <p className="text-navy/35 text-xs leading-relaxed">
        All inquiries are confidential. We typically respond within 24 hours.
      </p>

      {formState === "error" && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || formState === "success"}
        className={`btn-magnetic w-full py-4 rounded-full font-semibold text-sm transition-all duration-500 disabled:opacity-80 ${
          formState === "success" ? "bg-emerald-500 text-white" : "bg-brand-500 text-white"
        }`}
      >
        <span className="btn-bg bg-brand-600 rounded-full" />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {busy ? (
            <>
              Sending <Loader2 size={16} className="animate-spin" />
            </>
          ) : formState === "success" ? (
            <>
              Message Sent <CheckCircle size={16} />
            </>
          ) : formState === "error" ? (
            <>
              Try Again <Send size={16} />
            </>
          ) : (
            <>
              Send Message <Send size={16} />
            </>
          )}
        </span>
      </button>

      <RecaptchaNotice />
    </form>
  );
}

/**
 * Google's terms require either the reCAPTCHA badge or this disclosure to be
 * visible wherever the widget runs.
 */
function RecaptchaNotice() {
  return (
    <p className="text-navy/30 text-[11px] leading-relaxed">
      Protected by reCAPTCHA. Google&apos;s{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-brand-500 transition-colors"
      >
        Privacy Policy
      </a>{" "}
      and{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-brand-500 transition-colors"
      >
        Terms of Service
      </a>{" "}
      apply.
    </p>
  );
}

/* ─── CONTACT INFO ─── */
function ContactInfo() {
  const items = [
    { icon: Phone,  label: "Phone",    value: SITE.phone,    href: SITE.phoneHref },
    { icon: Mail,   label: "Email",    value: SITE.email,    href: SITE.emailHref },
    { icon: MapPin, label: "Location", value: SITE.location },
    { icon: Clock,  label: "Hours",    value: SITE.hours },
  ];

  return (
    <div>
      <h2 className="font-heading font-bold text-2xl md:text-3xl tracking-tight">
        Get in touch.
      </h2>
      <p className="mt-3 text-navy/50 text-sm leading-relaxed max-w-sm">
        Whether you&apos;re seeking support for yourself or a loved one, we&apos;re
        here to listen. Every conversation is confidential.
      </p>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <item.icon size={16} className="text-brand-500" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-navy/30 uppercase tracking-wider">
                {item.label}
              </span>
              {item.href ? (
                <a
                  href={item.href}
                  className="block text-sm font-medium text-navy/80 hover:text-brand-500 transition-colors"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-medium text-navy/80">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Social links */}
      <div className="mt-8 pt-6 border-t border-surface-300/30">
        <span className="font-mono text-[10px] text-navy/30 uppercase tracking-wider">
          Follow Us
        </span>
        <div className="mt-3 flex items-center gap-3">
          {SITE.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl bg-surface-100 border border-surface-300/50 flex items-center justify-center text-navy/40 hover:text-brand-500 hover:border-brand-300 transition-all duration-300"
              aria-label={s.label}
            >
              <s.icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PAGE EXPORT ─── */
export function ContactPage() {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef, "[data-contact-anim]", {
    y: 40,
    duration: 0.8,
    stagger: 0.1,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={sectionRef}>
      <ContactHero />

      <section className="py-16 md:py-24">
        <div className="content-container">
          <div
            data-contact-anim
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
          >
            <ContactInfo />
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-surface-200/60 shadow-sm">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Austin ambient image */}
      <section className="pb-8">
        <div className="content-container">
          <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden">
            <img
              src={AUSTIN.ladyBirdAerial}
              alt="Lady Bird Lake, Austin TX"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-navy/30" />
          </div>
        </div>
      </section>
    </div>
  );
}
