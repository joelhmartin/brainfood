/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRERENDER — turns the SPA into real static HTML, one file per route.
 *
 * WHY: a Vite SPA ships an empty <div id="root">. Google will usually execute the
 * JavaScript and see the content eventually, but:
 *
 *   - Facebook, LinkedIn, iMessage, Slack, and X do NOT run JavaScript. Every link
 *     anyone shares today produces a blank preview card. This is the concrete,
 *     visible failure that prerendering fixes.
 *   - Most AI/LLM crawlers do not run JavaScript either.
 *   - JS-rendered pages are crawled more slowly and less reliably.
 *
 * HOW: build, serve dist/, drive every route with a real headless Chromium, and write
 * the resulting DOM back to disk. A real browser — not a Node-based SSG — because this
 * app uses Three.js, GSAP, and Lottie, all of which touch WebGL/window and would crash
 * or silently no-op under jsdom.
 *
 * Routes come from the database, so newly published posts appear in the next build.
 * Publishing from the dashboard triggers that build (see api/rebuild.js).
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sirv from "sirv";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = join(ROOT, "dist");
const PORT = 4173;

function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return; // On Vercel the env vars come from the project settings, not a file.
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, value = ""] = match;
    if (process.env[key] === undefined) {
      process.env[key] = value.trim().replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv(join(ROOT, ".env.local"));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

/** Routes that always exist, regardless of content. */
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

/**
 * Reads published content with the ANON key — the same view an anonymous visitor gets.
 * Row Level Security therefore guarantees drafts cannot leak into the static HTML or
 * the sitemap, even if this script had a bug.
 */
async function fetchContentRoutes() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("  ! Supabase not configured — prerendering static routes only.");
    return { events: [], posts: [], services: [] };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const [{ data: events }, { data: posts }] = await Promise.all([
    supabase.from("events").select("slug, updated_at").eq("published", true),
    supabase.from("posts").select("slug, updated_at").eq("published", true),
  ]);

  return { events: events ?? [], posts: posts ?? [] };
}

async function loadServiceSlugs() {
  const src = await readFile(join(ROOT, "src/config/services.js"), "utf8");
  return [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
}

async function snapshot(page, route) {
  await page.goto(`http://localhost:${PORT}${route}`, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });

  // Set by <PrerenderSignal> once the stores have settled. Without it we would capture
  // a loading spinner and ship THAT to crawlers.
  await page
    .waitForSelector("html[data-prerender-ready]", { timeout: 15_000 })
    .catch(() => console.warn(`  ! ${route}: no ready signal, snapshotting anyway`));

  // GSAP reveal animations start elements at opacity:0 and fade them in. A crawler
  // reading the raw HTML would find the text present but invisible, which reads as
  // hidden content. Force the end-state before snapshotting.
  await page.evaluate(() => {
    document.querySelectorAll("[style*='opacity: 0']").forEach((el) => {
      el.style.opacity = "";
      el.style.transform = "";
    });
  });

  const html = await page.content();
  const outPath = route === "/" ? join(DIST, "index.html") : join(DIST, route, "index.html");

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, html, "utf8");
}

/** robots.txt and sitemap.xml, both driven by the seo_indexable switch in Settings. */
async function writeSeoFiles(routes, settings) {
  const siteUrl = (settings?.site_url ?? "").replace(/\/$/, "");
  const indexable = Boolean(settings?.seo_indexable);

  // Blocking every crawler is the correct default before launch: letting a staging or
  // preview domain get indexed splits ranking signals with the real domain and is
  // genuinely annoying to unwind afterwards.
  const robots = indexable
    ? [
        "User-agent: *",
        "Allow: /",
        "",
        "Disallow: /app/",
        "Disallow: /auth/",
        "",
        siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : [
        "# Search engine indexing is OFF.",
        "# Turn it on in the dashboard: Settings → Allow search engines to index this site.",
        "User-agent: *",
        "Disallow: /",
      ].join("\n");

  await writeFile(join(DIST, "robots.txt"), robots + "\n", "utf8");

  // A sitemap listing a URL that says noindex is a contradiction, and pointing at
  // relative URLs is invalid. Emit one only when it can be correct.
  if (!indexable || !siteUrl) {
    console.log(
      `  · sitemap.xml skipped (${!indexable ? "indexing off" : "no site URL set in Settings"})`,
    );
    return;
  }

  const urls = routes
    .map(({ route, lastmod }) => {
      const loc = `${siteUrl}${route === "/" ? "" : route}`;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        lastmod ? `    <lastmod>${String(lastmod).slice(0, 10)}</lastmod>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  await writeFile(join(DIST, "sitemap.xml"), sitemap, "utf8");
  console.log(`  · sitemap.xml (${routes.length} urls)`);
}

async function main() {
  const { events, posts } = await fetchContentRoutes();
  const serviceSlugs = await loadServiceSlugs();

  let settings = null;
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
    settings = data;
  }

  const routes = [
    ...STATIC_ROUTES.map((route) => ({ route, lastmod: null })),
    ...serviceSlugs.map((slug) => ({ route: `/services/${slug}`, lastmod: null })),
    ...events.map((e) => ({ route: `/events/${e.slug}`, lastmod: e.updated_at })),
    ...posts.map((p) => ({ route: `/blog/${p.slug}`, lastmod: p.updated_at })),
  ];

  console.log(`\nPrerendering ${routes.length} routes…`);

  // SPA fallback: unknown paths serve index.html, exactly like vercel.json does.
  const serve = sirv(DIST, { single: true, dev: true });
  const server = createServer((req, res) => serve(req, res));
  await new Promise((resolve) => server.listen(PORT, resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const failures = [];
  for (const { route } of routes) {
    try {
      await snapshot(page, route);
      console.log(`  ✓ ${route}`);
    } catch (err) {
      failures.push({ route, message: err.message });
      console.error(`  ✗ ${route}: ${err.message}`);
    }
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  await writeSeoFiles(routes, settings);

  if (failures.length) {
    // Failing loudly matters: a silently half-prerendered site looks fine locally and
    // serves blank HTML to crawlers in production.
    console.error(`\n${failures.length} route(s) failed to prerender.`);
    process.exit(1);
  }

  console.log(`\nPrerendered ${routes.length} routes.\n`);
}

main().catch((err) => {
  console.error("Prerender failed:", err);
  process.exit(1);
});
