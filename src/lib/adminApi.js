import { supabase } from "./supabase.js";

/**
 * Calls the /api functions with the caller's Supabase JWT attached.
 *
 * Replaces the old axios client and its hand-rolled refresh-token interceptor —
 * supabase-js already keeps the session fresh, so re-implementing that was both
 * redundant and a place for bugs to hide.
 */
async function call(method, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("You are not signed in.");

  const response = await fetch("/api/users", {
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
    // A non-JSON body means the request never reached the function — most likely
    // the SPA rewrite swallowed /api/* (see vercel.json) or `vercel dev` isn't running.
    throw new Error(
      response.status === 404
        ? "The /api/users function is not running. In local dev, use `npm run dev:full`."
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
