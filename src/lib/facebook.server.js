import "server-only";

import { FACEBOOK } from "../config/facebook.js";
import { selectPosts } from "./facebook.js";

/**
 * Reads the business's Facebook page through the Graph API.
 *
 * Holds a page access token, so this module is server-only — `import
 * "server-only"` turns an accidental client import into a build error rather
 * than a token shipped in the browser bundle. (Vitest aliases the package to a
 * no-op stub; see vitest.config.js.)
 *
 * Every function here degrades to `null` rather than throwing, matching
 * content.server.js: Facebook being down, rate-limited, or misconfigured must
 * render a homepage without this section, never a failed build or a 500.
 *
 * ── Why the caller must set `revalidate` ────────────────────────────────────
 * Two things go stale. The feed itself, obviously; but also the image URLs —
 * `full_picture` points at scontent.*.fbcdn.net with a signed `oe=` expiry
 * baked into the query string. A page cached indefinitely would keep serving
 * those URLs long after Facebook stopped honouring them, and every photo would
 * silently turn into a broken image. `export const revalidate` on the route is
 * what keeps them fresh.
 */

const GRAPH_HOST = "https://graph.facebook.com";

// Long enough that a slow Graph response cannot stall a page render, short
// enough that an ISR regeneration does not hang on it.
const TIMEOUT_MS = 5000;

function token() {
  return process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
}

export function isFacebookConfigured() {
  return Boolean(token() && FACEBOOK.pageId);
}

async function graphGet(path, params, revalidate) {
  const url = new URL(`${GRAPH_HOST}/${FACEBOOK.graphVersion}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token());

  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Ties this request to the route's ISR window instead of Next's default
    // full-route cache, so a regeneration actually re-hits Facebook.
    next: { revalidate },
  });

  if (!response.ok) {
    // The URL carries the access token, so it must never reach a log line.
    throw new Error(`Graph API responded ${response.status} for ${path}`);
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(`Graph API error: ${payload.error.message ?? "unknown"}`);
  }
  return payload;
}

/**
 * @param {{ revalidate?: number }} [options]
 * @returns {Promise<{
 *   page: { name: string, url: string, avatar: string|null, followers: number|null },
 *   posts: Array<object>,
 * }|null>} null whenever the section should not render at all.
 */
export async function getFacebookFeed({ revalidate = 3600 } = {}) {
  if (!isFacebookConfigured()) return null;

  try {
    const [profile, feed] = await Promise.all([
      graphGet(
        FACEBOOK.pageId,
        { fields: "name,link,followers_count,picture.width(160).height(160)" },
        revalidate,
      ),
      graphGet(
        `${FACEBOOK.pageId}/posts`,
        {
          fields: "id,message,created_time,full_picture,permalink_url",
          limit: String(FACEBOOK.fetchCount),
        },
        revalidate,
      ),
    ]);

    const posts = selectPosts(feed?.data, FACEBOOK.postCount);

    // A header with no posts under it is worse than no section: it advertises
    // an active page and then shows nothing.
    if (posts.length === 0) return null;

    return {
      page: {
        name: profile?.name ?? "Brain Food Recovery Services",
        url: profile?.link ?? FACEBOOK.pageUrl,
        avatar: profile?.picture?.data?.url ?? null,
        followers:
          typeof profile?.followers_count === "number" ? profile.followers_count : null,
      },
      posts,
    };
  } catch (err) {
    console.error("[facebook] feed unavailable:", err.message);
    return null;
  }
}
