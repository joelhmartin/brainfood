import { getSettings } from "../src/lib/content.server.js";
import { absoluteUrl } from "../src/lib/seo.js";

export default async function robots() {
  const settings = await getSettings();

  if (!settings.seoIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/auth/", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml", settings.siteUrl),
  };
}
