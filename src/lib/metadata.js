import { createElement } from "react";
import { formatTitle, absoluteUrl } from "./seo.js";

/**
 * Builds a Next.js Metadata object. This replaces the old useSeo hook, which
 * wrote <head> tags imperatively via the DOM so a headless browser could snapshot
 * them. Next renders these tags server-side, so no browser and no snapshot are
 * involved — which also deletes the duplicate-tag problem the hook's clearManaged()
 * existed to solve.
 *
 * @param {object}  opts
 * @param {string}  opts.title        Page title, run through the title template.
 * @param {string}  opts.description  Meta description; falls back to the site default.
 * @param {string}  opts.path         Route path, for the canonical URL.
 * @param {string}  opts.image        OG image; falls back to the site's OG image.
 * @param {string}  opts.type         OG type ("website" | "article").
 * @param {boolean} opts.noindex      Force noindex for this page (e.g. 404).
 * @param {object}  opts.settings     Live site settings (see getSettings).
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  settings,
}) {
  const fullTitle = formatTitle(title, settings);
  const desc = description || settings.defaultDesc;
  const canonical = absoluteUrl(path, settings.siteUrl);
  const ogImage = image || settings.ogImage;

  // The master switch, preserved from useSeo: until the site is on its production
  // domain, every page tells crawlers to stay out. Indexing a staging domain splits
  // ranking signals between it and the eventual real one, and is a pain to unwind.
  const blocked = noindex || !settings.seoIndexable;

  const metadata = {
    title: fullTitle,
    description: desc,
    robots: blocked
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type,
      title: fullTitle,
      description: desc,
      url: canonical,
      siteName: settings.name,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: fullTitle,
      description: desc,
      images: ogImage ? [ogImage] : undefined,
    },
  };

  // A canonical pointing at a noindexed page is contradictory; omit it entirely.
  if (!blocked) metadata.alternates = { canonical };

  if (settings.gscVerification) {
    metadata.verification = { google: settings.gscVerification };
  }

  return metadata;
}

/**
 * Shared SEO contract for the 404 page. Two files render a not-found page —
 * app/not-found.jsx (catches unmatched top-level URLs) and
 * app/(marketing)/not-found.jsx (catches notFound() thrown inside the
 * marketing segment) — and both must serve identical metadata for what is
 * conceptually one page. Centralizing it here means editing one file can't
 * silently make the two 404s diverge.
 *
 * @param {object} settings Live site settings (see getSettings).
 */
export function notFoundMetadata(settings) {
  return buildMetadata({ title: "Page not found", path: "/404", noindex: true, settings });
}

/**
 * Renders JSON-LD. Structured data is suppressed while noindexed: it would be
 * describing a staging URL as if it were the real business listing.
 *
 * Written with createElement rather than JSX syntax so this file can stay a plain
 * .js module: this project's Vite/Vitest unit-test pipeline (see vitest.config.js)
 * does not run the JSX transform over .js files, only .jsx. Next.js's own SWC build
 * pipeline parses JSX in .js just fine, but createElement works identically under
 * both, so there's no reason to require the JSX transform at all here.
 */
export function JsonLd({ data }) {
  if (!data) return null;
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  });
}
