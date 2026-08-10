/**
 * Verifies every route serves populated HTML with a real <title>, with no
 * JavaScript executed — exactly what a social scraper or LLM crawler sees.
 *
 * Run against a production server: npm run build && npm start
 *
 * ── Where the route list comes from ────────────────────────────────────────
 *
 * It is NOT hardcoded here any more. Two sources are unioned:
 *
 *   1. src/config/routes.js — the shared registry, expanded with no content.
 *      Covers the fixed pages and every service, no database needed.
 *   2. The live /sitemap page, scraped for internal links. That page renders
 *      from the real database, so blog and event slugs come from whatever the
 *      server is actually serving rather than a list that goes stale.
 *
 * Source 2 means a post published this morning is verified this afternoon
 * without anyone editing this file. Source 1 is the floor: if the sitemap page
 * ever renders empty, the registry routes are still checked and the missing
 * links are reported as a failure rather than silently shrinking the suite.
 *
 * ── The robots assertion ───────────────────────────────────────────────────
 *
 * The site ships `noindex` until it moves to its production domain
 * (FALLBACK_SETTINGS.seoIndexable === false — a deliberate go-live switch, not
 * a bug). Rather than hardcode which state is correct, this reads the homepage's
 * robots directive and then asserts every other route AGREES with it. A site
 * half-indexable is the actual bug worth catching, and this catches it in both
 * directions.
 */
import { buildRoutes } from "../src/config/routes.js";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3057";

const get = async (route) => {
  const res = await fetch(`${BASE}${route}`);
  return { status: res.status, html: await res.text() };
};

const robotsOf = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";

// ── Build the route list ────────────────────────────────────────────────────

const registryRoutes = buildRoutes().map((r) => r.path);

let discovered = [];
try {
  const { status, html } = await get("/sitemap");
  if (status === 200) {
    // Internal page links only. The raw href list also contains the framework's
    // own asset tags — /_next/static chunks, the favicon, the footer logo — and
    // those are not pages: they have no <title> and no robots meta, so feeding
    // them to the page checks below produces pure noise.
    const isPageLink = (href) =>
      href.startsWith("/") &&
      !href.startsWith("//") &&
      !href.startsWith("/_next/") &&
      // A dot in the final segment means a file (icon.png, styles.css,
      // sitemap.xml), not a route. No route on this site has one.
      !href.split("?")[0].split("/").pop().includes(".");

    discovered = [...new Set(
      [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]).filter(isPageLink),
    )];
  } else {
    console.error(`  ! /sitemap returned ${status} — falling back to registry routes only.`);
  }
} catch (err) {
  console.error(`  ! could not scrape /sitemap (${err.message}) — registry routes only.`);
}

const ROUTES = [...new Set([...registryRoutes, ...discovered])].sort();

// The sitemap page must link every registry route; if it doesn't, it is not
// doing its job and neither is this script's discovery half.
const missingFromSitemapPage = registryRoutes.filter((r) => !discovered.includes(r));

// ── Check every route ───────────────────────────────────────────────────────

const { html: homeHtml } = await get("/");
const expectedRobots = robotsOf(homeHtml);
const expectIndexable = !/noindex/.test(expectedRobots);

console.log(
  `Checking ${ROUTES.length} routes at ${BASE} — expecting robots "${expectedRobots || "(none)"}"\n`,
);

let failed = 0;

for (const route of ROUTES) {
  const { status, html } = await get(route);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const hasOgTitle = /<meta property="og:title"/.test(html);
  const robots = robotsOf(html);
  const bodyLength = html.replace(/<[^>]+>/g, "").trim().length;

  const problems = [];
  if (status !== 200) problems.push(`status ${status}`);
  if (!title) problems.push("empty <title>");
  if (!hasOgTitle) problems.push("no og:title");
  if (bodyLength < 200)
    problems.push(`body too short (${bodyLength} chars) — looks like an empty shell`);
  if (robots !== expectedRobots)
    problems.push(`robots "${robots}" disagrees with the homepage's "${expectedRobots}"`);

  if (problems.length) {
    failed += 1;
    console.error(`  ✗ ${route}: ${problems.join(", ")}`);
  } else {
    console.log(`  ✓ ${route} — "${title}"`);
  }
}

// ── Sitemap coverage ────────────────────────────────────────────────────────

if (missingFromSitemapPage.length) {
  failed += 1;
  console.error(`\n  ✗ /sitemap does not link: ${missingFromSitemapPage.join(", ")}`);
}

// Only meaningful once indexing is on — while noindexed, an empty sitemap.xml
// is the correct, deliberate behavior.
if (expectIndexable) {
  const { html: xml } = await get("/sitemap.xml");
  const urlCount = [...xml.matchAll(/<loc>/g)].length;
  if (urlCount < registryRoutes.length) {
    failed += 1;
    console.error(
      `\n  ✗ /sitemap.xml lists ${urlCount} URLs but the registry declares at least ${registryRoutes.length}`,
    );
  } else {
    console.log(`\n  ✓ /sitemap.xml lists ${urlCount} URLs`);
  }
}

console.log(failed ? `\n${failed} check(s) failed.` : `\nAll ${ROUTES.length} routes serve real HTML.`);
process.exit(failed ? 1 : 0);
