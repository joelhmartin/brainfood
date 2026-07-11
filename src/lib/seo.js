/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SEO — <head> management and structured data.
 *
 * No react-helmet: this app has a single render root and one page at a time, so
 * direct DOM writes are simpler and, critically, they survive prerendering. The
 * prerender script snapshots document.documentElement AFTER React has run, so
 * whatever these functions write to <head> lands in the static HTML that crawlers
 * and social scrapers receive.
 *
 * Every tag written here is marked data-seo, so the next route can clear exactly
 * what the previous one added without touching the tags in index.html.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { useEffect } from "react";
import { useSettingsStore } from "../stores/settings.store.js";

const MANAGED = "data-seo";

/**
 * Tags this module owns exclusively. Everything matching is cleared before a route
 * writes its own, including tags it did not create — index.html ships a static
 * <meta name="description">, and leaving it in place produced TWO description tags on
 * every page. Duplicate descriptions and canonicals are a real defect: crawlers pick
 * one arbitrarily, and prerendering would bake the duplicate into the static HTML.
 */
const OWNED = [
  "[data-seo]",
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[name="google-site-verification"]',
  'meta[name^="twitter:"]',
  'meta[property^="og:"]',
  'link[rel="canonical"]',
  'script[type="application/ld+json"]',
].join(",");

function clearManaged() {
  document.head.querySelectorAll(OWNED).forEach((el) => el.remove());
}

function setMeta(attr, key, content) {
  if (!content) return;
  const el = document.createElement("meta");
  el.setAttribute(attr, key);
  el.setAttribute("content", content);
  el.setAttribute(MANAGED, "");
  document.head.appendChild(el);
}

function setLink(rel, href) {
  if (!href) return;
  const el = document.createElement("link");
  el.setAttribute("rel", rel);
  el.setAttribute("href", href);
  el.setAttribute(MANAGED, "");
  document.head.appendChild(el);
}

function setJsonLd(data) {
  if (!data) return;
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.setAttribute(MANAGED, "");
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

/** Absolute URL for canonical/OG tags. Falls back to the runtime origin. */
export function absoluteUrl(path, siteUrl) {
  const base = (siteUrl || (typeof window !== "undefined" ? window.location.origin : "")).replace(
    /\/$/,
    "",
  );
  if (!path || path === "/") return base || "/";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function formatTitle(title, settings) {
  if (!title) return settings.defaultTitle || settings.name || "";
  const template = settings.titleTemplate || "%s";
  return template.includes("%s") ? template.replace("%s", title) : title;
}

/**
 * Drops null/undefined/empty values so structured data never advertises a field
 * we do not actually have. An empty `telephone` in LocalBusiness is worse than no
 * `telephone` at all — and a WRONG one (a 555 placeholder) is worse still, because
 * search engines cross-check name/address/phone against other listings.
 */
export function pruneEmpty(obj) {
  if (Array.isArray(obj)) {
    const arr = obj.map(pruneEmpty).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const pruned = pruneEmpty(v);
      if (pruned !== undefined) out[k] = pruned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (obj === null || obj === undefined || obj === "") return undefined;
  return obj;
}

// ── JSON-LD builders ────────────────────────────────────────────────────────

export function organizationSchema(settings) {
  return pruneEmpty({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings.name,
    description: settings.description,
    url: settings.siteUrl || undefined,
    telephone: settings.phone || undefined,
    email: settings.email || undefined,
    image: settings.ogImage || undefined,
    foundingDate: settings.founded ? String(settings.founded) : undefined,
    address: pruneEmpty({
      "@type": "PostalAddress",
      streetAddress: settings.address || undefined,
      addressLocality: settings.city || undefined,
      addressRegion: settings.state || undefined,
      addressCountry: settings.city || settings.state ? "US" : undefined,
    }),
    sameAs: (settings.socials ?? []).map((s) => s.href).filter(Boolean),
    areaServed: settings.city || undefined,
  });
}

export function eventSchema(event, settings) {
  return pruneEmpty({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.excerpt,
    startDate: event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.image || undefined,
    url: absoluteUrl(`/events/${event.slug}`, settings.siteUrl),
    location: event.location
      ? { "@type": "Place", name: event.location, address: event.location }
      : undefined,
    organizer: pruneEmpty({
      "@type": "Organization",
      name: settings.name,
      url: settings.siteUrl || undefined,
    }),
  });
}

export function blogPostingSchema(post, settings) {
  return pruneEmpty({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.updatedAt ? String(post.updatedAt).slice(0, 10) : post.date,
    image: post.image || undefined,
    keywords: (post.tags ?? []).join(", ") || undefined,
    articleSection: post.category || undefined,
    author: pruneEmpty({ "@type": "Organization", name: settings.name }),
    publisher: pruneEmpty({ "@type": "Organization", name: settings.name }),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`, settings.siteUrl),
  });
}

export function breadcrumbSchema(trail, settings) {
  const items = (trail ?? []).filter((c) => c.name && c.path);
  if (!items.length) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path, settings.siteUrl),
    })),
  };
}

// ── the hook ────────────────────────────────────────────────────────────────

/**
 * Sets the page's title, meta, canonical, and structured data.
 *
 * @param {object}   opts
 * @param {string}   opts.title        Page title, run through the title template.
 * @param {string}   opts.description  Meta description; falls back to the site default.
 * @param {string}   opts.path         Route path, for the canonical URL.
 * @param {string}   opts.image        OG image; falls back to the site's OG image.
 * @param {string}   opts.type         OG type ("website" | "article").
 * @param {boolean}  opts.noindex      Force noindex for this page (e.g. 404).
 * @param {object[]} opts.schemas      JSON-LD objects to embed.
 */
export function useSeo({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  schemas = [],
} = {}) {
  const settings = useSettingsStore((s) => s.settings);

  // Serialized so the effect re-runs on content change, not on every render.
  const schemaKey = JSON.stringify(schemas);

  useEffect(() => {
    const fullTitle = formatTitle(title, settings);
    const desc = description || settings.defaultDesc;
    const canonical = absoluteUrl(path, settings.siteUrl);
    const ogImage = image || settings.ogImage;

    document.title = fullTitle;
    clearManaged();

    // The master switch. Until the site is on its production domain, every page
    // tells crawlers to stay out — indexing a staging domain splits ranking
    // signals between it and the eventual real one, and is a pain to unwind.
    const blocked = noindex || !settings.seoIndexable;
    setMeta(
      "name",
      "robots",
      blocked ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );

    setMeta("name", "description", desc);
    if (!blocked) setLink("canonical", canonical);

    setMeta("property", "og:type", type);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:site_name", settings.name);
    setMeta("property", "og:image", ogImage);

    setMeta("name", "twitter:card", ogImage ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", ogImage);

    if (settings.gscVerification) {
      setMeta("name", "google-site-verification", settings.gscVerification);
    }

    // Structured data is suppressed while noindexed: it would be describing a
    // staging URL as if it were the real business listing.
    if (!blocked) schemas.filter(Boolean).forEach(setJsonLd);

    return clearManaged;
  }, [title, description, path, image, type, noindex, schemaKey, settings]);
}
