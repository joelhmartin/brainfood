import { adminClient, requirePermission, errorResponse, HttpError } from "../../../src/lib/api/auth.js";
import { PERMISSIONS, ROLES } from "../../../src/config/roles.js";

/**
 * Admin user management.
 *
 * This is the only server code the app needs. Creating and deleting auth users
 * requires the service-role key, which cannot be exposed to the browser — everything
 * else (content, settings) goes straight from the browser to Postgres under RLS.
 *
 *   GET    → list admins
 *   POST   → invite an admin by email
 *   DELETE → remove an admin
 */

export async function GET(request) {
  try {
    return await listUsers(request);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request) {
  try {
    return await inviteUser(request);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request) {
  try {
    return await removeUser(request);
  } catch (err) {
    return errorResponse(err);
  }
}

async function listUsers(request) {
  await requirePermission(request, PERMISSIONS.USERS_READ);

  const { data, error } = await adminClient()
    .from("profiles")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return Response.json({ users: data }, { status: 200 });
}

async function inviteUser(request) {
  await requirePermission(request, PERMISSIONS.USERS_INVITE);

  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }

  const origin = request.headers.get("origin") ?? `https://${request.headers.get("host")}`;

  const { error } = await adminClient().auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/accept-invite`,
    // The on_auth_user_created trigger reads these to build the profile row.
    data: { name: email.split("@")[0], role: ROLES.ADMIN },
  });

  if (error) {
    // Supabase says "already been registered" — make it actionable.
    if (/already/i.test(error.message)) {
      throw new HttpError(409, "That email already has an account.");
    }
    throw new Error(error.message);
  }

  return Response.json({ ok: true, email }, { status: 200 });
}

async function removeUser(request) {
  const caller = await requirePermission(request, PERMISSIONS.USERS_REMOVE);

  const body = await request.json().catch(() => ({}));
  const userId = String(body.userId ?? "");

  if (!userId) throw new HttpError(400, "userId is required.");

  // Locking yourself out of your own dashboard is not a recoverable mistake.
  if (userId === caller.id) {
    throw new HttpError(400, "You cannot remove your own account.");
  }

  const admin = adminClient();

  // Refuse to remove the last admin — otherwise nobody can ever sign in again,
  // and sign-up is disabled, so there would be no way back in without the CLI.
  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", ROLES.ADMIN);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) <= 1) throw new HttpError(400, "Cannot remove the last admin.");

  // The profiles row is removed by ON DELETE CASCADE from auth.users.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  return Response.json({ ok: true }, { status: 200 });
}
