import { createClient } from "@supabase/supabase-js";

/**
 * Server-side reads use the ANON key on purpose — the same view an anonymous
 * visitor gets. Row Level Security therefore guarantees drafts cannot leak into
 * server-rendered HTML or the sitemap, even if a query here had a bug. This is
 * the same guarantee the old prerender script relied on.
 *
 * Sessions are never persisted: there is no browser here to persist them to.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
