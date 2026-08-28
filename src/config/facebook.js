/**
 * Facebook page identity.
 *
 * The page ID is public — it appears in the page's own URL. The access token is
 * the secret, and it lives only in `FACEBOOK_PAGE_ACCESS_TOKEN`, read
 * exclusively by src/lib/facebook.server.js.
 */

export const FACEBOOK = {
  pageId: process.env.FACEBOOK_PAGE_ID || "100206719692613",

  /** Fallback profile URL, used when the Graph API response omits `link`. */
  pageUrl: "https://www.facebook.com/100206719692613",

  /** Pinned so a Graph deprecation is a deliberate upgrade, not a silent break. */
  graphVersion: "v21.0",

  /**
   * How many posts reach the homepage. Three fills one row at every breakpoint
   * without wrapping into a ragged second row.
   */
  postCount: 3,

  /**
   * How many to ASK Facebook for. Larger than postCount because a good share of
   * a page's feed is "updated their status" link posts carrying no message and
   * no photo — fetching exactly three would routinely render one or two.
   */
  fetchCount: 15,
};
