import { createServerClient } from "./supabase.server.js";
import { eventFromRow, postFromRow } from "./mappers.js";
import { FALLBACK_SETTINGS } from "../config/site.js";

/**
 * Content reads for Server Components. A missing Supabase config is a valid
 * state, not an error: the site renders with no content rather than failing the
 * build — matching how the old prerender script behaved.
 */

export async function getSettings() {
  const supabase = createServerClient();
  if (!supabase) return FALLBACK_SETTINGS;

  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return data ? { ...FALLBACK_SETTINGS, ...data } : FALLBACK_SETTINGS;
}

export async function getPosts() {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map(postFromRow);
}

export async function getPostBySlug(slug) {
  const supabase = createServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return postFromRow(data);
}

export async function getEvents() {
  const supabase = createServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map(eventFromRow);
}

export async function getEventBySlug(slug) {
  const supabase = createServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return eventFromRow(data);
}
