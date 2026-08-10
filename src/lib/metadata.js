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
  // Page's own art, then the dashboard's configured image, then the generated
  // card served by app/opengraph-image.js.
  //
  // That last fallback is referenced by URL rather than left to Next's
  // `opengraph-image` file convention. The convention only fills in
  // `openGraph.images` for a route whose resolved metadata did not define an
  // `openGraph` object — and buildMetadata always defines one, for og:url and
  // og:site_name. The observable result was every page except blog posts and
  // events shipping with no og:image at all, which is what a social scraper
  // uses to decide whether a shared link gets a preview.
  //
  // Requires an origin: a relative og:image is invalid per the Open Graph spec,
  // and before go-live `siteUrl` is deliberately empty. metadataBase would
  // normally absolutize it, but it is undefined in exactly that same case, so
  // the fallback is simply skipped until there is an origin to build on.
  const generatedCard = settings.siteUrl
    ? absoluteUrl("/opengraph-image", settings.siteUrl)
    : undefined;
  const ogImage = image || settings.ogImage || generatedCard;

  // Without this, Next's default is `null`, and with an empty siteUrl (today's
  // pre-launch state) every og:url ships as a bare relative path (e.g. "/about")
  // — which the Open Graph spec doesn't allow. `siteUrl` comes from a dashboard
  // text field an operator can mistype (e.g. "not a url"), so guard the URL
  // construction rather than letting a malformed value throw during render.
  let metadataBase;
  if (settings.siteUrl) {
    try {
      metadataBase = new URL(settings.siteUrl);
    } catch {
      metadataBase = undefined;
    }
  }

  // The master switch, preserved from useSeo: until the site is on its production
  // domain, every page tells crawlers to stay out. Indexing a staging domain splits
  // ranking signals between it and the eventual real one, and is a pain to unwind.
  const blocked = noindex || !settings.seoIndexable;

  const metadata = {
    metadataBase,
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
    },
    twitter: {
      // Always the large card: when this page has no image of its own, the
      // generated fallback below is 1200×630, which is the large-card size.
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };

  // The `images` keys are ADDED only when there is an image, never set to
  // undefined. This is not cosmetic: Next merges the file-convention social
  // card (app/opengraph-image.js) into metadata only when the author has not
  // specified `openGraph.images` — and a key present with the value `undefined`
  // counts as specified. Writing `images: ogImage ? [ogImage] : undefined`
  // therefore SUPPRESSED the generated card on every page without its own
  // image, which was every page except blog posts and events with cover art.
  if (ogImage) {
    metadata.openGraph.images = [ogImage];
    metadata.twitter.images = [ogImage];
  }

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
 * Next's App Router unconditionally renders its OWN hardcoded
 * `<meta name="robots" content="noindex">` whenever it catches the
 * not-found error boundary — see HTTPAccessFallbackErrorBoundary in
 * next/dist/client/components/http-access-fallback/error-boundary.js. That
 * happens as a literal JSX sibling in the framework's error boundary, not
 * through the Metadata API's merge/resolve pipeline, so it stacks on top of
 * whatever generateMetadata() returns here rather than being replaced by it —
 * there is no supported way to suppress it. Confirmed live: every notFound()
 * render (both this file's boundary and the (marketing) one) emits it,
 * while ordinary pages emit none.
 *
 * Since a second tag from Next itself is unavoidable, this deliberately
 * drops `follow` from its own robots value (plain `{ index: false }`, i.e.
 * "noindex" with no qualifier) instead of the usual `{ index: false, follow:
 * false }` ("noindex, nofollow") that buildMetadata()'s sitewide `blocked`
 * switch would otherwise produce. That makes our tag's content identical to
 * Next's forced one, so the two tags agree instead of disagreeing — a
 * crawler no longer has two different directives to arbitrate between, even
 * though two <meta> elements still exist in the markup.
 *
 * @param {object} settings Live site settings (see getSettings).
 */
export function notFoundMetadata(settings) {
  const metadata = buildMetadata({
    title: "Page not found",
    path: "/404",
    noindex: true,
    settings,
  });
  metadata.robots = { index: false };
  return metadata;
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
