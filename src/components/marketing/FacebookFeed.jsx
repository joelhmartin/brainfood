"use client";

import { useRef } from "react";
import { Facebook, ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "../../hooks/useScrollReveal.js";
import { formatPostDate, formatFollowers } from "../../lib/facebook.js";

/**
 * Recent posts from the business's Facebook page, rendered in the site's own
 * design language rather than through Facebook's iframe Page Plugin.
 *
 * The plugin was the obvious alternative and was rejected: it ignores the brand
 * entirely, ships third-party cookies onto a page whose visitors are looking up
 * addiction services, and reflows on load. Posts arrive as data from
 * facebook.server.js instead, so this is ordinary markup we control.
 *
 * The section removes itself when there is nothing to show — see the null feed
 * guard below.
 */

/** The date stamp sitting on the corner of each photo, like a printed album. */
function DateStamp({ iso }) {
  const label = formatPostDate(iso);
  if (!label) return null;
  return (
    <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-navy/70 shadow-sm backdrop-blur">
      {label}
    </span>
  );
}

function PostCard({ post }) {
  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      data-fb-anim
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      {post.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
          {/* Empty alt: the post's own text sits directly below and describes
              it better than a machine-generated summary of the photo would. */}
          <img
            src={post.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <DateStamp iso={post.createdAt} />
        </div>
      ) : (
        // Text-only post. Rather than leaving a ragged hole in the row, the
        // card leads with a brand panel — no duplicated copy, just a mark.
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700">
          <span aria-hidden="true" className="font-drama text-8xl italic leading-none text-white/25">
            &ldquo;
          </span>
          <DateStamp iso={post.createdAt} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-navy/70">{post.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-brand-500 transition-all duration-300 group-hover:gap-2.5">
          View on Facebook
          <ArrowUpRight size={14} />
        </span>
      </div>
    </a>
  );
}

/**
 * @param {{ feed: { page: object, posts: Array<object> }|null }} props
 */
export function FacebookFeed({ feed }) {
  const sectionRef = useRef(null);
  useScrollReveal(sectionRef, "[data-fb-anim]", { y: 32, duration: 0.7, stagger: 0.1 });

  // Facebook unreachable, unconfigured, or nothing worth showing. A heading
  // over an empty row would advertise an active page and then prove otherwise.
  if (!feed?.posts?.length) return null;

  const { page, posts } = feed;
  const followers = formatFollowers(page.followers);

  return (
    <section ref={sectionRef} className="bg-surface-100 py-20 md:py-28">
      <div className="content-container">
        <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div
              data-fb-anim
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium tracking-wide text-brand-600"
            >
              <Facebook size={13} />
              On Facebook
            </div>

            <h2
              data-fb-anim
              className="mb-4 font-heading text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl"
            >
              Recent moments with the{" "}
              {/* The full stop lives inside the span: as a separate JSX child it
                  picks up the surrounding newline as a space and renders "family ." */}
              <span className="font-drama text-4xl italic text-brand-500 md:text-5xl">
                Brain Food family.
              </span>
            </h2>

            <p data-fb-anim className="text-base leading-relaxed text-navy/60">
              Photos, shout-outs, and community news — posted as it happens.
            </p>
          </div>

          {/* Page identity. Carries the follower count because "726 people
              follow along" is the part that reads as proof of a real community. */}
          <div
            data-fb-anim
            className="flex items-center gap-4 rounded-2xl border border-surface-200/60 bg-white p-4 shadow-sm lg:shrink-0"
          >
            {page.avatar && (
              <img
                src={page.avatar}
                alt=""
                loading="lazy"
                className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
              />
            )}
            <div className="min-w-0">
              {/* Wraps rather than truncating: at 390px "Brain Food Recovery
                  Services" clipped to "Brain Food Rec…", which reads as broken. */}
              <p className="font-heading text-sm font-bold leading-tight text-navy">
                {page.name}
              </p>
              {followers && (
                <p className="mt-0.5 font-mono text-[11px] text-navy/40">{followers}</p>
              )}
            </div>
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Follow
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
