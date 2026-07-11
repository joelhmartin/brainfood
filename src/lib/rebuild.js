import { supabase } from "./supabase.js";

/**
 * Asks the server to rebuild the site.
 *
 * Pages are prerendered to static HTML at build time (scripts/prerender.mjs), which
 * is what gives crawlers and social scrapers real HTML instead of an empty div.
 * The trade-off is that newly published content is not in those static files until
 * the next build — so publishing triggers one.
 *
 * The Vercel deploy hook URL is a secret: anyone holding it can spend build minutes.
 * It stays server-side in /api/rebuild; the browser only asks, it never holds the URL.
 *
 * Failure here is deliberately non-fatal. The content IS saved in the database and
 * visitors will see it on the live site (the SPA fetches at runtime); only the
 * prerendered HTML lags. Blocking a "save" on a deploy hook would be worse.
 */
let pending = null;

export function requestRebuild() {
  // Coalesce bursts — publishing three posts in a row should not queue three builds.
  if (pending) return pending;

  pending = (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/rebuild", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch (err) {
      console.warn("[rebuild] deploy hook not fired:", err?.message ?? err);
    } finally {
      // Short window: enough to collapse a burst of saves, short enough that a
      // deliberate second publish a minute later still rebuilds.
      setTimeout(() => {
        pending = null;
      }, 10_000);
    }
  })();

  return pending;
}
