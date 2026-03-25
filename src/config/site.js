/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SITE CONFIG — Single source of truth for all site-wide data.
 *
 * Every component that needs business info, logos, contact details,
 * or social links should import from here. When spinning up a new
 * site from this codebase, this is the primary file to update.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { Facebook, Instagram } from "lucide-react";

// ── Business ─────────────────────────────────────────────────────────────────

export const BUSINESS = {
  name:        "Brain Food Recovery Services",
  shortName:   "Brain Food",
  tagline:     "Practical Support. Real Connection. Lasting Change.",
  description: "Personalized recovery coaching, mental health coaching, and sober companion services for individuals and families navigating substance use disorder and mental health challenges.",
  city:        "Austin",
  state:       "Texas",
  location:    "Austin, Texas",
  address:     "Austin, TX",
  founded:     2023,
};

// ── Contact ──────────────────────────────────────────────────────────────────

export const CONTACT = {
  phone:       "(512) 555-0192",
  phoneHref:   "tel:+15125550192",
  email:       "info@brainfoodrecovery.com",
  emailHref:   "mailto:info@brainfoodrecovery.com",
  hours:       "Mon–Fri, 9:00 AM – 5:00 PM CST",
};

// ── Links ────────────────────────────────────────────────────────────────────

export const LINKS = {
  googleMaps:      "https://maps.google.com/?q=Austin+TX",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d220984.56911695788!2d-97.89379635!3d30.307182!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8644b599a0cc032f%3A0x5d9b464bd469d57a!2sAustin%2C%20TX!5e0!3m2!1sen!2sus!4v1",
  googleReview:    "#", // TODO: Add Google review link
};

// ── Social ───────────────────────────────────────────────────────────────────

export const SOCIALS = [
  {
    label: "Facebook",
    icon:  Facebook,
    href:  "https://www.facebook.com/p/Brain-Food-Recovery-Services-100089801555087/",
  },
  {
    label: "Instagram",
    icon:  Instagram,
    href:  "https://www.instagram.com/brainfoodrecovery/",
  },
];

// ── Logos ─────────────────────────────────────────────────────────────────────
// All paths relative to /public. Add stacked variants here when available.

export const LOGOS = {
  icon:              "/images/logo/BRAINFOOD ICON.svg",

  // Horizontal
  horizontalBlack:   "/images/logo/BRAINFOOD HORIZONTAL LOGO BLACK.svg",
  horizontalWhite:   "/images/logo/BRAINFOOD HORIZONTAL LOGO WHITE.svg",

  // Stacked (add files to /public/images/logo/ when ready)
  stackedBlack:      null,
  stackedWhite:      null,
};

// ── Content Types & URL Structure ─────────────────────────────────────────────
// Controls URL prefixes, pagination, and per-page counts for all content types.
// When migrating from WordPress or another CMS, update these to match the
// existing URL structure so you don't lose SEO weight or create orphaned pages.
//
// Examples:
//   WordPress default:    prefix: "/blog",   pagination: "/page"
//   WordPress custom:     prefix: "",         pagination: "/page"    (posts at root)
//   Custom slug:          prefix: "/articles", pagination: "/page"
//   WP-style single:     prefix: "/post"     (single posts at /post/my-slug)

export const CONTENT = {
  blog: {
    // List page path — the main blog index
    listPath:       "/blog",
    // Single post prefix — posts will be at {prefix}/{slug}
    // Change to "/post" or "" to match an existing WordPress structure
    prefix:         "/blog",
    // Pagination URL segment — appended to listPath: /blog/page/2
    paginationSlug: "/page",
    // Items per page (set to 0 or Infinity to disable pagination)
    perPage:        6,
    // Label used in nav/breadcrumbs
    label:          "Blog",
  },
  events: {
    listPath:       "/events",
    prefix:         "/events",
    paginationSlug: "/page",
    perPage:        9,
    label:          "Events",
  },
};

// Helper: build a post URL from slug
export const blogUrl   = (slug) => `${CONTENT.blog.prefix}/${slug}`;
export const eventUrl  = (slug) => `${CONTENT.events.prefix}/${slug}`;
// Helper: build a pagination URL
export const blogPageUrl  = (num) => num <= 1 ? CONTENT.blog.listPath : `${CONTENT.blog.listPath}${CONTENT.blog.paginationSlug}/${num}`;
export const eventPageUrl = (num) => num <= 1 ? CONTENT.events.listPath : `${CONTENT.events.listPath}${CONTENT.events.paginationSlug}/${num}`;

// ── SEO Defaults ─────────────────────────────────────────────────────────────

export const SEO = {
  titleTemplate: "%s | Brain Food Recovery Services",
  defaultTitle:  "Brain Food Recovery Services — Recovery Coaching in Austin, TX",
  defaultDesc:   BUSINESS.description,
  url:           "https://brainfoodrecovery.com",
  ogImage:       null, // TODO: Add OG image path
};

// ── Legacy compat — flat SITE export used by older components ────────────────

export const SITE = {
  ...BUSINESS,
  ...CONTACT,
  ...LINKS,
  socials: SOCIALS,
  logos: LOGOS,
};
