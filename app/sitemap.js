import { getPosts, getEvents, getSettings } from "../src/lib/content.server.js";
import { SERVICE_SLUGS } from "../src/config/services.js";
import { absoluteUrl } from "../src/lib/seo.js";

const STATIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/products",
  "/contact",
  "/submit-case",
  "/events",
  "/blog",
];

export default async function sitemap() {
  const settings = await getSettings();

  // Matches the old prerender behavior: no sitemap at all while the site is
  // noindexed. Advertising URLs we are simultaneously telling crawlers to ignore
  // is contradictory.
  if (!settings.seoIndexable) return [];

  const [posts, events] = await Promise.all([getPosts(), getEvents()]);

  return [
    ...STATIC_ROUTES.map((route) => ({ url: absoluteUrl(route, settings.siteUrl) })),
    ...SERVICE_SLUGS.map((slug) => ({ url: absoluteUrl(`/services/${slug}`, settings.siteUrl) })),
    ...events.map((e) => ({
      url: absoluteUrl(`/events/${e.slug}`, settings.siteUrl),
      lastModified: e.updatedAt ? new Date(e.updatedAt) : undefined,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`, settings.siteUrl),
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    })),
  ];
}
