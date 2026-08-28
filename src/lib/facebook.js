/**
 * Pure helpers for shaping Facebook Graph API responses.
 *
 * Kept separate from facebook.server.js (which holds the token and does the
 * fetching) so the selection and formatting rules — the parts with actual
 * decisions in them — are unit-testable without mocking a network call. Same
 * pattern as `paginateEvents` and `safeRedirectPath`.
 */

// Facebook's own auto-generated copy for a post with no author text. These are
// real entries in the feed and they carry no message, no photo, and nothing
// worth putting on a homepage.
const STORY_ONLY_PATTERN = /updated their (status|cover photo|profile picture)/i;

const MAX_EXCERPT = 170;

/** Collapses runs of whitespace and newlines into single spaces. */
function collapseWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Drops URLs from the end of a message.
 *
 * Page posts routinely end with a bare link ("Thanks for having us …
 * http://example.com"). In the post itself Facebook renders that as a preview
 * card; as plain text in an excerpt it is just noise.
 */
export function stripTrailingUrls(value) {
  return collapseWhitespace(value).replace(/(\s*https?:\/\/\S+)+$/i, "").trim();
}

/**
 * Shortens to `limit` characters on a word boundary, adding an ellipsis only
 * when something was actually removed.
 */
export function truncateAtWord(value, limit = MAX_EXCERPT) {
  const text = collapseWhitespace(value);
  if (text.length <= limit) return text;

  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(" ");
  // A single word longer than the limit has no space to break on; cut it flat
  // rather than returning an empty string.
  const base = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;
  // Trailing whitespace or punctuation immediately before an ellipsis reads as
  // a typo ("the fox ,…"), so strip both.
  return `${base.replace(/[\s.,;:!?—-]+$/, "")}…`;
}

/**
 * True if a raw post is worth showing.
 *
 * Requires real author text. A photo is preferred but not required — a
 * well-written text post still reads, whereas a post with neither says nothing.
 */
export function isDisplayablePost(raw) {
  if (!raw || typeof raw !== "object") return false;
  const message = stripTrailingUrls(raw.message);
  if (!message) return false;
  if (STORY_ONLY_PATTERN.test(message)) return false;
  return Boolean(raw.permalink_url);
}

/** Graph API shape → the shape the component renders. */
export function normalizePost(raw) {
  const message = stripTrailingUrls(raw.message);
  return {
    id: raw.id,
    message,
    excerpt: truncateAtWord(message),
    createdAt: raw.created_time ?? null,
    // `full_picture` is absent on text-only posts, and its URL carries a
    // signed expiry — see the revalidation note in facebook.server.js.
    image: raw.full_picture ?? null,
    permalink: raw.permalink_url,
  };
}

/**
 * Picks the posts that reach the page: displayable ones, newest first, capped.
 *
 * Photo posts sort ahead of text-only ones within the cap, because the section
 * is a visual wall and a lone text card in a row of photos reads as a gap. Date
 * order is preserved inside each group.
 */
export function selectPosts(rawPosts, limit) {
  const displayable = (Array.isArray(rawPosts) ? rawPosts : [])
    .filter(isDisplayablePost)
    .map(normalizePost);

  const withPhoto = displayable.filter((post) => post.image);
  const withoutPhoto = displayable.filter((post) => !post.image);

  return [...withPhoto, ...withoutPhoto].slice(0, limit);
}

/**
 * "16 Aug 2026" — short, unambiguous, and stable regardless of the reader's
 * locale, which matters because this string is rendered on a statically cached
 * page and must not differ between the server and the browser.
 */
export function formatPostDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "726 followers" with thousands separated; empty when the count is unknown. */
export function formatFollowers(count) {
  if (typeof count !== "number" || !Number.isFinite(count) || count < 0) return "";
  return `${new Intl.NumberFormat("en-US").format(count)} follower${count === 1 ? "" : "s"}`;
}
