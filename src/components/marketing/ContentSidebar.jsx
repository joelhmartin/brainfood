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
import { SITE, SOCIALS, LOGOS, BUSINESS } from "../../config/site.js";
import LogoFull from "../../images/logoFull.jsx";
import { useFormSubmit } from "../../hooks/useFormSubmit.js";

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
function MiniForm() {
  const { submit, state: formState, error, reset } = useFormSubmit({
    endpoint: "/api/contact",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    submit({
      name: data.get("name") || "",
      email: data.get("email") || "",
      phone: data.get("phone") || "",
      message: data.get("message") || "",
      company: data.get("company") || "",
      source: "Sidebar",
    });
  };

  useEffect(() => {
    if (formState !== "success") return;
    const timer = setTimeout(() => reset(), 3500);
    return () => clearTimeout(timer);
  }, [formState, reset]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Honeypot: hidden from real users, bots fill every field they find. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
      />
      <input
        type="email"
        name="email"
        placeholder="Email address"
        required
        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone (optional)"
        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
      />
      <textarea
        name="message"
        rows={3}
        placeholder="How can we help?"
        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-300/50 text-navy text-sm placeholder:text-navy/30 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all resize-none"
      />
      {formState === "error" && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={formState === "sending" || formState === "success"}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
          formState === "success"
            ? "bg-emerald-500 text-white"
            : "bg-brand-500 text-white hover:bg-brand-600"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {formState === "idle" && (
            <>Send Message <Send size={13} /></>
          )}
          {formState === "sending" && (
            <>Sending <Loader2 size={13} className="animate-spin" /></>
          )}
          {formState === "success" && (
            <>Sent! <CheckCircle size={13} /></>
          )}
          {formState === "error" && (
            <>Try Again <Send size={13} /></>
          )}
        </span>
      </button>
      <p className="text-navy/30 text-[11px] text-center">
        All inquiries are confidential.
      </p>
    </form>
  );
}
