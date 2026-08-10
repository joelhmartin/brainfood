/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SEO — URL helpers and structured-data builders.
 *
 * These are pure functions: they take data and return objects. Rendering them
 * into <head> is Next's job (see lib/metadata.js and each route's
 * generateMetadata), which happens server-side — so crawlers and social scrapers
 * receive the tags in the HTML itself, with no JavaScript required.
 * ═══════════════════════════════════════════════════════════════════════════
 */

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

/**
 * `Service` for a service detail page.
 *
 * `navLabel` is the name, not `title` — `title` is only half a sentence
 * ("One-on-one coaching for") that the page completes with `accent`, and a
 * fragment reads as broken in a rich result. This matches the same choice
 * already made in the route's generateMetadata.
 *
 * `provider` is intentionally a nested Organization rather than a `@id`
 * reference: the pages that render this do not also render organizationSchema
 * (only the homepage does), so there would be nothing on the page for an @id
 * to point at.
 */
export function serviceSchema(service, settings) {
  return pruneEmpty({
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.navLabel,
    description: service.tagline,
    serviceType: service.navLabel,
    url: absoluteUrl(`/services/${service.slug}`, settings.siteUrl),
    image: service.image || undefined,
    provider: pruneEmpty({
      "@type": "ProfessionalService",
      name: settings.name,
      url: settings.siteUrl || undefined,
      telephone: settings.phone || undefined,
      areaServed: settings.city || undefined,
    }),
    areaServed: settings.city || undefined,
    audience: service.whoFor?.length
      ? { "@type": "Audience", audienceType: service.whoFor.join("; ") }
      : undefined,
    // `lookLike` is the page's "what this actually looks like" list — the
    // closest thing the content has to an itemized description of the service.
    hasOfferCatalog: service.lookLike?.length
      ? {
          "@type": "OfferCatalog",
          name: `${service.navLabel} — what's included`,
          itemListElement: service.lookLike.map((item) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: item },
          })),
        }
      : undefined,
  });
}

/**
 * `WebSite` for the homepage. Small but load-bearing: it is what lets search
 * engines associate the domain with a site name (rather than guessing one from
 * the <title>), and it is where a sitelinks search box would be declared if the
 * site ever grows an internal search — it does not have one today, so no
 * potentialAction is emitted. Declaring a SearchAction that points at a URL
 * template the site cannot serve is worse than declaring none.
 */
export function websiteSchema(settings) {
  return pruneEmpty({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.name,
    alternateName: settings.shortName || undefined,
    description: settings.description,
    url: settings.siteUrl || undefined,
    inLanguage: "en-US",
    publisher: pruneEmpty({
      "@type": "Organization",
      name: settings.name,
      url: settings.siteUrl || undefined,
    }),
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
