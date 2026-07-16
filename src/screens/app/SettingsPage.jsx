"use client";

import { Children, cloneElement, isValidElement, useEffect, useId, useState } from "react";
import { Plus, Trash2, Search, AlertTriangle } from "lucide-react";
import { H1 } from "../../components/ui/Typography.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { ImageUpload } from "../../components/ui/ImageUpload.jsx";
import { useSettingsStore } from "../../stores/settings.store.js";
import { useAuth } from "../../hooks/useAuth.js";
import { usePermission } from "../../hooks/usePermission.js";
import { PERMISSIONS } from "../../config/roles.js";

const FIELD =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10";
const LABEL = "block text-sm font-medium text-gray-700 mb-1.5";

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {description && <p className="mt-1 mb-5 text-sm text-gray-500">{description}</p>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  // htmlFor/id links the label to its control (previously a bare sibling
  // <label> with no association, so assistive tech announced an unlabelled
  // field and `page.getByLabel(...)` couldn't find it in tests).
  const id = useId();
  // Most callers pass a single input/textarea, but "Default description"
  // passes the textarea plus a trailing character-count <p> — two children,
  // so `children` is an array there. Only the first (the actual control)
  // gets the generated id; any extra nodes render through untouched.
  const [control, ...rest] = Children.toArray(children);
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {isValidElement(control) ? cloneElement(control, { id }) : control}
      {rest}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const status = useSettingsStore((s) => s.status);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const saveSettings = useSettingsStore((s) => s.saveSettings);
  const { user, updateName } = useAuth();
  const { can } = usePermission();
  const { addToast } = useToast();

  const [form, setForm] = useState(settings);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Re-sync once the real settings land, but not while the user is mid-edit.
  useEffect(() => {
    if (status === "ready") setForm(settings);
  }, [status, settings]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setSocial = (i, key, value) =>
    setForm((f) => ({
      ...f,
      socials: f.socials.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));

  const addSocial = () =>
    setForm((f) => ({ ...f, socials: [...(f.socials ?? []), { label: "", href: "" }] }));

  const removeSocial = (i) =>
    setForm((f) => ({ ...f, socials: f.socials.filter((_, idx) => idx !== i) }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({
        ...form,
        socials: (form.socials ?? []).filter((s) => s.label && s.href),
      });
      if (name && name !== user?.name) await updateName(name);
      addToast({ message: "Settings saved.", type: "success" });
    } catch (err) {
      addToast({ message: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const readOnly = !can(PERMISSIONS.SETTINGS_WRITE);

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6 pb-12">
      <div>
        <H1>Settings</H1>
        <p className="mt-1 text-sm text-gray-500">
          Contact details, social links, and search-engine settings for the public site.
        </p>
      </div>

      <Section title="Your account">
        <Field label="Your name">
          <input
            className={FIELD}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field label="Email" hint="Contact an admin to change the email on your account.">
          <input className={`${FIELD} bg-gray-50`} value={user?.email ?? ""} disabled />
        </Field>
      </Section>

      <Section
        title="Search engines"
        description="Master switch for how this site appears in Google."
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
          <input
            type="checkbox"
            checked={form.seoIndexable ?? false}
            onChange={(e) => set("seoIndexable", e.target.checked)}
            disabled={readOnly}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500"
          />
          <span>
            <span className="block text-sm font-medium text-gray-900">
              Allow search engines to index this site
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              Turn this on only once the site is live on its real domain. While it is off,
              every page tells Google to stay away and robots.txt blocks all crawlers.
            </span>
          </span>
        </label>

        {!form.seoIndexable && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              This site is currently hidden from Google. That is the right setting before
              launch — indexing a temporary domain splits your ranking between it and the
              real one, and it is awkward to undo.
            </span>
          </div>
        )}

        <Field
          label="Site URL"
          hint="The public address, e.g. https://brainfoodrecovery.com. Used for canonical links and the sitemap."
        >
          <input
            className={FIELD}
            value={form.siteUrl ?? ""}
            onChange={(e) => set("siteUrl", e.target.value)}
            placeholder="https://…"
            disabled={readOnly}
          />
        </Field>

        <Field
          label="Google Search Console verification"
          hint="The content value from Google's meta tag. Optional."
        >
          <input
            className={FIELD}
            value={form.gscVerification ?? ""}
            onChange={(e) => set("gscVerification", e.target.value)}
            disabled={readOnly}
          />
        </Field>

        <Field label="Google Analytics measurement ID" hint="Looks like G-XXXXXXXXXX. Optional.">
          <input
            className={FIELD}
            value={form.gaMeasurementId ?? ""}
            onChange={(e) => set("gaMeasurementId", e.target.value)}
            placeholder="G-…"
            disabled={readOnly}
          />
        </Field>
      </Section>

      <Section
        title="Search result appearance"
        description="What Google and social apps show when someone shares a link."
      >
        <Field label="Default page title">
          <input
            className={FIELD}
            value={form.defaultTitle ?? ""}
            onChange={(e) => set("defaultTitle", e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field
          label="Title template"
          hint="%s is replaced by the page name — e.g. “About | Brain Food”."
        >
          <input
            className={FIELD}
            value={form.titleTemplate ?? ""}
            onChange={(e) => set("titleTemplate", e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field
          label="Default description"
          hint="Aim for 150–160 characters. This is the grey text under your link in Google."
        >
          <textarea
            className={`${FIELD} resize-none`}
            rows={3}
            value={form.defaultDesc ?? ""}
            onChange={(e) => set("defaultDesc", e.target.value)}
            disabled={readOnly}
          />
          <p className="mt-1 text-xs text-gray-400">
            {(form.defaultDesc ?? "").length} characters
          </p>
        </Field>
        <ImageUpload
          label="Share image"
          value={form.ogImage ?? ""}
          onChange={(url) => set("ogImage", url)}
        />
        <p className="-mt-1 text-xs text-gray-400">
          Shown when the site is shared on Facebook, LinkedIn, or iMessage. 1200×630 works best.
        </p>
      </Section>

      <Section title="Business details" description="Used in the footer and in structured data.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business name">
            <input
              className={FIELD}
              value={form.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              disabled={readOnly}
            />
          </Field>
          <Field label="Short name">
            <input
              className={FIELD}
              value={form.shortName ?? ""}
              onChange={(e) => set("shortName", e.target.value)}
              disabled={readOnly}
            />
          </Field>
        </div>
        <Field label="Tagline">
          <input
            className={FIELD}
            value={form.tagline ?? ""}
            onChange={(e) => set("tagline", e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={`${FIELD} resize-none`}
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            disabled={readOnly}
          />
        </Field>
      </Section>

      <Section
        title="Contact"
        description="Leave a field blank rather than filling it with a placeholder — blank fields are omitted from your Google business listing, but a WRONG phone number actively hurts local search ranking."
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input
              className={FIELD}
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(512) 555-0192 is NOT a real number"
              disabled={readOnly}
            />
          </Field>
          <Field label="Email">
            <input
              className={FIELD}
              type="email"
              value={form.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              disabled={readOnly}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              className={FIELD}
              value={form.city ?? ""}
              onChange={(e) => set("city", e.target.value)}
              disabled={readOnly}
            />
          </Field>
          <Field label="State">
            <input
              className={FIELD}
              value={form.state ?? ""}
              onChange={(e) => set("state", e.target.value)}
              disabled={readOnly}
            />
          </Field>
        </div>
        <Field label="Street address" hint="Optional. Only add it if you take visitors there.">
          <input
            className={FIELD}
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field label="Hours">
          <input
            className={FIELD}
            value={form.hours ?? ""}
            onChange={(e) => set("hours", e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field label="Google review link" hint="Where the “leave us a review” button points.">
          <input
            className={FIELD}
            value={form.googleReview ?? ""}
            onChange={(e) => set("googleReview", e.target.value)}
            disabled={readOnly}
          />
        </Field>
      </Section>

      <Section
        title="Social links"
        description="These also tell Google which social accounts belong to this business."
      >
        {(form.socials ?? []).map((social, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-40">
              <label className={LABEL}>Name</label>
              <input
                className={FIELD}
                value={social.label}
                onChange={(e) => setSocial(i, "label", e.target.value)}
                placeholder="Instagram"
                disabled={readOnly}
              />
            </div>
            <div className="flex-1">
              <label className={LABEL}>URL</label>
              <input
                className={FIELD}
                value={social.href}
                onChange={(e) => setSocial(i, "href", e.target.value)}
                placeholder="https://…"
                disabled={readOnly}
              />
            </div>
            <button
              type="button"
              onClick={() => removeSocial(i)}
              disabled={readOnly}
              className="mb-1 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSocial}
          disabled={readOnly}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
        >
          <Plus size={14} />
          Add a social link
        </button>
      </Section>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/90 py-4 backdrop-blur">
        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <Search size={12} />
          Saving refreshes the public pages within seconds.
        </p>
        <button
          type="submit"
          disabled={saving || readOnly}
          className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
