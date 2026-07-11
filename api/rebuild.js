import { requirePermission, sendError, HttpError } from "./_auth.js";
import { PERMISSIONS } from "../src/config/roles.js";

/**
 * Triggers a Vercel rebuild so newly published content gets prerendered into the
 * static HTML that crawlers and social scrapers read.
 *
 * The deploy hook URL is a secret — anyone holding it can burn build minutes at will
 * — so it stays in an env var here and is never sent to the browser. The client asks;
 * the server decides.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      throw new HttpError(405, "Method not allowed.");
    }

    await requirePermission(req, PERMISSIONS.CONTENT_PUBLISH);

    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;

    // Not configured is a valid state, not an error: content still appears on the
    // live site because the app also fetches at runtime. Only the prerendered HTML
    // waits for the next deploy.
    if (!hook) {
      return res.status(200).json({ ok: true, triggered: false, reason: "no deploy hook set" });
    }

    const response = await fetch(hook, { method: "POST" });
    if (!response.ok) throw new Error(`Deploy hook returned ${response.status}`);

    return res.status(200).json({ ok: true, triggered: true });
  } catch (err) {
    return sendError(res, err);
  }
}
