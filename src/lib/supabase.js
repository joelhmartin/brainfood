import { createClient } from "@supabase/supabase-js";

/**
 * The anon key is PUBLIC by design and safe to ship in the bundle. It grants
 * nothing on its own — Row Level Security in Postgres decides what any given
 * caller may read or write. The service-role key, which does bypass RLS, is
 * never imported here; it lives only in the server-side route handlers.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && process.env.NODE_ENV === "development") {
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local — see README-ADMIN.md.",
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
