import { adminClient, requirePermission, sendError, HttpError } from "./_auth.js";
import { PERMISSIONS, ROLES } from "../src/config/roles.js";

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
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case "GET":
        return await listUsers(req, res);
      case "POST":
        return await inviteUser(req, res);
      case "DELETE":
        return await removeUser(req, res);
      default:
        res.setHeader("Allow", "GET, POST, DELETE");
        throw new HttpError(405, "Method not allowed.");
    }
  } catch (err) {
    return sendError(res, err);
  }
}

async function listUsers(req, res) {
  await requirePermission(req, PERMISSIONS.USERS_READ);

  const { data, error } = await adminClient()
    .from("profiles")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return res.status(200).json({ users: data });
}

async function inviteUser(req, res) {
  await requirePermission(req, PERMISSIONS.USERS_INVITE);

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }

  const origin = req.headers.origin ?? `https://${req.headers.host}`;

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

  return res.status(200).json({ ok: true, email });
}

async function removeUser(req, res) {
  const caller = await requirePermission(req, PERMISSIONS.USERS_REMOVE);

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
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

  return res.status(200).json({ ok: true });
}
