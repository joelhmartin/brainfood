import { createServerClient } from "./supabase.server.js";
import { eventFromRow, postFromRow, settingsFromRow } from "./mappers.js";
import { FALLBACK_SETTINGS } from "../config/site.js";

/**
 * Content reads for Server Components. A missing Supabase config is a valid
 * state, not an error: the site renders with no content rather than failing the
 * build — matching how the old prerender script behaved.
 */

/**
 * getSettings() is called from generateMetadata (root layout + route) and again
 * from the page body, so every request pays 2-3x for an identical query. The
 * textbook fix is React's `cache()`, which memoizes a function per-request for
 * the lifetime of a single render — but `cache()` is a React 19 API, and this
 * project is pinned to react@18.3 (verified: `import { cache } from "react"`
 * resolves to `undefined` here, and wrapping getSettings with it throws
 * "cache is not a function" immediately on import, breaking both Vitest and the
 * Next dev server). Bumping React to 19 to unlock it is a cross-cutting change
 * well outside this fix's scope, so instead this uses a manual "single-flight"
 * in-flight-promise cache: concurrent callers within the same tick share one
 * underlying Supabase call, and the slot clears the instant it settles.
 *
 * This is safe (not just a perf hack) because site_settings is identical for
 * every caller — there is no per-request/per-user data here, so coalescing two
 * callers that happen to overlap, whether from the same request or two
 * different concurrent requests, can never serve the wrong data. It is a
 * narrower guarantee than cache()'s true one-call-per-request semantics (it
 * only dedupes calls that are actually in flight at the same time, not calls
 * that happen to be sequential), but it is a real, verifiable improvement with
 * no correctness downside, and it keeps this file working under React 18.
 * Revisit with real cache() once the project moves to React 19.
 */
let inFlightSettings = null;

export async function getSettings() {
  if (inFlightSettings) return inFlightSettings;

  inFlightSettings = (async () => {
    const supabase = createServerClient();
    if (!supabase) return FALLBACK_SETTINGS;

    // A missing config (handled above) and a failed query (here) both degrade
    // to FALLBACK_SETTINGS. getSettings() is called from the root layout's
    // generateMetadata, so an uncaught rejection here would take down every
    // page and fail `next build` — the exact failure mode FALLBACK_SETTINGS
    // exists to prevent. `error` covers a resolved-with-error result; the
    // try/catch covers the query promise itself rejecting (e.g. network drop).
    try {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) {
        console.warn("[content] getSettings query returned an error, falling back to defaults:", error?.message ?? error);
        return FALLBACK_SETTINGS;
      }
      return data ? { ...FALLBACK_SETTINGS, ...settingsFromRow(data) } : FALLBACK_SETTINGS;
    } catch (err) {
      console.warn("[content] getSettings query threw, falling back to defaults:", err?.message ?? err);
      return FALLBACK_SETTINGS;
    }
  })();

  try {
    return await inFlightSettings;
  } finally {
    inFlightSettings = null;
  }
}

export async function getPosts() {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });

    if (error || !data) return [];
    return data.map(postFromRow);
  } catch (err) {
    console.warn("[content] getPosts() query threw, returning empty results:", err?.message ?? err);
    return [];
  }
}

export async function getPostBySlug(slug) {
  const supabase = createServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return postFromRow(data);
  } catch (err) {
    console.warn(`[content] getPostBySlug("${slug}") query threw, returning null:`, err?.message ?? err);
    return null;
  }
}

export async function getEvents() {
  const supabase = createServerClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });

    if (error || !data) return [];
    return data.map(eventFromRow);
  } catch (err) {
    console.warn("[content] getEvents() query threw, returning empty results:", err?.message ?? err);
    return [];
  }
}

export async function getEventBySlug(slug) {
  const supabase = createServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("published", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return eventFromRow(data);
  } catch (err) {
    console.warn(`[content] getEventBySlug("${slug}") query threw, returning null:`, err?.message ?? err);
    return null;
  }
}
