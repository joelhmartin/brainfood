/**
 * Verifies every route serves populated HTML with a real <title>, with no
 * JavaScript executed — exactly what a social scraper or LLM crawler sees.
 *
 * Run against a production server: npm run build && npm start
 *
 * The site is intentionally `noindex` right now (FALLBACK_SETTINGS.seoIndexable
 * === false, until it moves to its production domain), so this does NOT assert
 * `index, follow`, JSON-LD, or a populated sitemap — those only appear once the
 * indexing switch is flipped on (a deliberate future change, not a bug). What it
 * does assert — real HTML, a correct per-route <title>, and a matching og:title —
 * is exactly what the deleted Playwright prerender existed to guarantee.
 */
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3057";

const ROUTES = [
  "/", "/about", "/services", "/products", "/contact", "/submit-case",
  "/events", "/blog",
  "/services/coaching", "/services/sober-companion", "/services/experiential",
  "/services/family", "/services/collaborative",
  "/events/recovery-run-zilker-park", "/events/family-workshop-boundaries",
  "/events/live-music-recovery-night",
  "/blog/what-is-recovery-coaching", "/blog/5-daily-habits-that-support-recovery",
  "/blog/supporting-a-loved-one-in-recovery",
];

let failed = 0;

for (const route of ROUTES) {
  const res = await fetch(`${BASE}${route}`);
  const html = await res.text();

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const hasOgTitle = /<meta property="og:title"/.test(html);
  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";
  const bodyLength = html.replace(/<[^>]+>/g, "").trim().length;

  const problems = [];
  if (res.status !== 200) problems.push(`status ${res.status}`);
  if (!title) problems.push("empty <title>");
  if (!hasOgTitle) problems.push("no og:title");
  if (bodyLength < 200) problems.push(`body too short (${bodyLength} chars) — looks like an empty shell`);
  // The site is noindex-by-design right now; a route that came back indexable
  // would mean seoIndexable flipped on somewhere it shouldn't have.
  if (!/noindex/.test(robots)) problems.push(`expected noindex robots, got "${robots}"`);

  if (problems.length) {
    failed++;
    console.error(`  ✗ ${route}: ${problems.join(", ")}`);
  } else {
    console.log(`  ✓ ${route} — "${title}"`);
  }
}

console.log(failed ? `\n${failed} route(s) failed.` : `\nAll ${ROUTES.length} routes serve real HTML.`);
process.exit(failed ? 1 : 0);
