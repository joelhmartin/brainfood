import { getPosts, getEvents, getSettings } from "../src/lib/content.server.js";
import { buildRoutes } from "../src/config/routes.js";
import { absoluteUrl } from "../src/lib/seo.js";

/**
 * XML sitemap (served at /sitemap.xml).
 *
 * The route list is NOT maintained here — it comes from src/config/routes.js,
 * shared with the HTML sitemap at /sitemap and guarded against drift by
 * src/config/routes.test.js. This file's only jobs are the publish guard, the
 * content fetch, and turning registry entries into Next's sitemap shape.
 */
export default async function sitemap() {
  const settings = await getSettings();

  // Skip the sitemap entirely if the site is noindexed OR siteUrl is unset.
  // Advertising relative/empty-origin URLs to crawlers is invalid; advertising
  // URLs we are simultaneously noindexing is contradictory. Both guards run
  // before any content fetch — work for a sitemap we would discard anyway.
  if (!settings.seoIndexable || !settings.siteUrl) return [];

  const [posts, events] = await Promise.all([getPosts(), getEvents()]);

  return buildRoutes({ posts, events }).map((route) => {
    const entry = {
      url: absoluteUrl(route.path, settings.siteUrl),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };

    // Only emit lastModified when the content actually carries a date, and only
    // when it parses. A bogus <lastmod> is worse than none: crawlers use it to
    // decide what to re-fetch, so an Invalid Date teaches them to distrust the
    // whole file.
    if (route.lastModified) {
      const date = new Date(route.lastModified);
      if (!Number.isNaN(date.getTime())) entry.lastModified = date;
    }

    return entry;
  });
}
