import { supabase } from "./supabase.js";

/**
 * Calls the /api functions with the caller's Supabase JWT attached.
 *
 * Replaces the old axios client and its hand-rolled refresh-token interceptor —
 * supabase-js already keeps the session fresh, so re-implementing that was both
 * redundant and a place for bugs to hide.
 */
async function call(method, body, path = "/api/users") {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("You are not signed in.");

  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    // A non-JSON body means the request never reached the route handler. There's no
    // SPA rewrite to blame anymore — /api/* is served by this same Next app (see
    // app/api/*/route.js) — so a 404 here means the route itself is missing or
    // `npm run dev` / `npm start` isn't running.
    throw new Error(
      response.status === 404
        ? `The ${path} route is not running. Make sure \`npm run dev\` (or \`npm start\`) is running.`
        : "The server returned an unexpected response.",
    );
  }

  if (!response.ok) throw new Error(payload.error ?? "Request failed.");
  return payload;
}

export const adminApi = {
  listUsers: () => call("GET").then((r) => r.users),
  inviteUser: (email) => call("POST", { email }),
  removeUser: (userId) => call("DELETE", { userId }),
};

/**
 * Asks the server to refresh the static HTML for one item. Fire-and-forget:
 * a failed revalidate must not fail the save that just succeeded — the content is
 * already in the database, and the page will refresh on its own within the hour.
 * Replaces the old triggerRebuild() deploy-hook call (see src/lib/rebuild.js, now
 * deleted) which fired a full Vercel cloud build.
 */
export async function revalidateContent(type, slug) {
  try {
    await call("POST", { type, slug }, "/api/revalidate");
  } catch (err) {
    console.warn("[revalidate] failed:", err);
  }
}
