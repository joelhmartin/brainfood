/**
 * Translation layer between Postgres (snake_case, `image_url`, `read_time`) and
 * the shapes the existing components already consume (`image`, `readTime`).
 *
 * Keeping this in one place means the marketing pages and admin forms did not
 * have to be rewritten around new field names.
 */

export function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** ~200 words per minute, floor of 1. */
export function estimateReadTime(body) {
  const words = String(body ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ── events ──────────────────────────────────────────────────────────────────

export function eventFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    time: row.time ?? "",
    location: row.location ?? "",
    image: row.image_url ?? "",
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category ?? "Community",
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function eventToRow(event) {
  const row = {
    slug: event.slug?.trim() ? slugify(event.slug) : slugify(event.title ?? ""),
    title: event.title ?? "",
    date: event.date || null,
    time: event.time ?? "",
    location: event.location ?? "",
    image_url: event.image || null,
    excerpt: event.excerpt ?? "",
    body: event.body ?? "",
    category: event.category ?? "Community",
    published: event.published ?? false,
  };
  if (event.id) row.id = event.id;
  return row;
}

// ── posts ───────────────────────────────────────────────────────────────────

export function postFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    author: row.author ?? "",
    category: row.category ?? "",
    tags: row.tags ?? [],
    image: row.image_url ?? "",
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    readTime: row.read_time ?? 1,
    published: row.published,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function postToRow(post) {
  const row = {
    slug: post.slug?.trim() ? slugify(post.slug) : slugify(post.title ?? ""),
    title: post.title ?? "",
    date: post.date || null,
    author: post.author ?? "",
    category: post.category ?? "",
    tags: normalizeTags(post.tags),
    image_url: post.image || null,
    excerpt: post.excerpt ?? "",
    body: post.body ?? "",
    read_time: post.readTime || estimateReadTime(post.body),
    published: post.published ?? false,
    featured: post.featured ?? false,
  };
  if (post.id) row.id = post.id;
  return row;
}

/** Admin form supplies tags as a comma-separated string; the DB wants text[]. */
export function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

// ── site settings ───────────────────────────────────────────────────────────

export function settingsFromRow(row) {
  return {
    name: row.name ?? "",
    shortName: row.short_name ?? "",
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    address: row.address ?? "",
    founded: row.founded ?? null,

    phone: row.phone ?? "",
    email: row.email ?? "",
    hours: row.hours ?? "",

    googleMaps: row.google_maps ?? "",
    googleReview: row.google_review ?? "",

    socials: Array.isArray(row.socials) ? row.socials : [],

    siteUrl: row.site_url ?? "",
    titleTemplate: row.title_template || "%s",
    defaultTitle: row.default_title ?? "",
    defaultDesc: row.default_desc ?? "",
    ogImage: row.og_image_url ?? null,

    gaMeasurementId: row.ga_measurement_id ?? "",
    gscVerification: row.gsc_verification ?? "",

    seoIndexable: Boolean(row.seo_indexable),
  };
}

export function settingsToRow(settings) {
  return {
    id: 1,
    name: settings.name ?? "",
    short_name: settings.shortName ?? "",
    tagline: settings.tagline ?? "",
    description: settings.description ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    address: settings.address ?? "",
    founded: settings.founded ? Number(settings.founded) : null,

    phone: settings.phone ?? "",
    email: settings.email ?? "",
    hours: settings.hours ?? "",

    google_maps: settings.googleMaps ?? "",
    google_review: settings.googleReview ?? "",

    socials: Array.isArray(settings.socials) ? settings.socials : [],

    site_url: settings.siteUrl ?? "",
    title_template: settings.titleTemplate || "%s",
    default_title: settings.defaultTitle ?? "",
    default_desc: settings.defaultDesc ?? "",
    og_image_url: settings.ogImage || null,

    ga_measurement_id: settings.gaMeasurementId ?? "",
    gsc_verification: settings.gscVerification ?? "",

    seo_indexable: Boolean(settings.seoIndexable),
  };
}
