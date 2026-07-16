import "server-only";
import { createClient } from "@supabase/supabase-js";
import { roleCan } from "../../config/roles.js";

/**
 * Shared authorization for the /api route handlers.
 *
 * These handlers hold the SERVICE ROLE key, which bypasses Row Level Security
 * completely. Everything the browser does elsewhere is protected by RLS in Postgres;
 * in here, RLS is not protecting anything, so this file IS the security boundary.
 * Every handler must call requirePermission() before it touches the admin client.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function adminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Verifies the caller's JWT and checks their role against `permission`.
 *
 * The role is read from the `profiles` table, never from the token. A JWT can carry
 * whatever metadata the user last managed to set on themselves; the profiles table is
 * the authority, and clients cannot write to its `role` column (column-level grant).
 *
 * @returns the caller's profile
 */
export async function requirePermission(request, permission) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new HttpError(401, "Not signed in.");

  const admin = adminClient();

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) throw new HttpError(401, "Session is invalid or expired.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw new HttpError(403, "No profile for this account.");
  if (!roleCan(profile.role, permission)) throw new HttpError(403, "Not allowed.");

  return profile;
}

export function errorResponse(err) {
  const status = err instanceof HttpError ? err.status : 500;
  // Internal failures must not leak their message to the client — it can reveal
  // schema details or key configuration. Log it, return something generic.
  const message = status === 500 ? "Something went wrong." : err.message;
  if (status === 500) console.error("[api]", err);
  return Response.json({ error: message }, { status });
}
