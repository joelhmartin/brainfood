/**
 * Pexels CDN image URLs — verify each before final production use.
 * Download approved images and replace URLs with local paths.
 *
 * Pexels license: free for commercial use, no attribution required
 * (though attribution is appreciated).
 *
 * Format helper:
 *   BASE_URL + "?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
 */

const PX = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`;

const PX_WIDE = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=1`;

// ── Austin, Texas ────────────────────────────────────────────────────────────
// Source: pexels.com/search/austin+texas — visually verified

export const AUSTIN = {
  /** Congress Ave Bridge + Lady Bird Lake golden-hour reflection — by Alberto Alvarez */
  ladyBirdSunset: PX_WIDE(25003745),

  /** Austin downtown skyline, Frost Bank Tower + green tree canopy, daytime */
  skylineDay: PX_WIDE(273204),

  /** Austin high-rise towers at dusk from street level — by Trac Vu */
  skylineDusk: PX_WIDE(5281394),

  /** Pedestrians crossing Congress Ave at sunset, skyline behind */
  streetCrossing: PX(15161974),

  /** Aerial — Lady Bird Lake, Pfluger Bridge, kayakers + full skyline */
  ladyBirdAerial: PX(18583619),

  /** Texas Hill Country — Bluebonnet field in bloom */
  bluebonnets: PX(998065),
};

// ── Services / Recovery ──────────────────────────────────────────────────────
// Used in the Services tab section

export const SERVICES = {
  /** One-on-one supportive conversation — recovery coaching */
  coaching: PX(6699517),

  /** Two people walking together outdoors — sober companion */
  soberCompanion: PX(1456951),

  /** Hiking trail through forest — experiential integration */
  hiking: PX(1365425),

  /** Family in conversation — family coaching */
  family: PX(1620760),

  /** Professionals collaborating at a table — collaborative care */
  collaborative: PX(3182812),
};

// ── Team / Local ─────────────────────────────────────────────────────────────
// These are local files in /public/images/team-photos/

export const TEAM = {
  heroMain: "/images/team-photos/full team hero 2 with copy space.webp",
  heroAlt: "/images/team-photos/full team hero.webp",
  goofin: "/images/team-photos/full team goofin.webp",
  charlesJustin1: "/images/team-photos/charles-justin-1.webp",
  charlesJustin2: "/images/team-photos/charles-justin-2.webp",
  charles1: "/images/team-photos/charles1.webp",
  charles2: "/images/team-photos/charles2.webp",
  justin1: "/images/team-photos/justin1.webp",
  justin2: "/images/team-photos/justin2.webp",
  matthew1: "/images/team-photos/matthew1.webp",
  matthew2: "/images/team-photos/matthew2.webp",
  damian1: "/images/team-photos/damian.webp",
  damian2: "/images/team-photos/damian2.webp",
  teamIsoBg: "/images/team-photos/full team iso-bg.webp",
  dsc: "/images/team-photos/DSC04087.webp",
  team2: "/images/team-photos/Team 2.webp",
};
