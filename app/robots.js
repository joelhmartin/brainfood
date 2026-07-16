import { getSettings } from "../src/lib/content.server.js";
import { absoluteUrl } from "../src/lib/seo.js";

export default async function robots() {
  const settings = await getSettings();

  if (!settings.seoIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  const result = {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/auth/", "/api/"] }],
  };

  // Include sitemap URL only if siteUrl is set; skip if unset to avoid advertising
  // a malformed (relative/empty-origin) sitemap URL, matching the old prerender behavior.
  if (settings.siteUrl) {
    result.sitemap = absoluteUrl("/sitemap.xml", settings.siteUrl);
  }

  return result;
}
