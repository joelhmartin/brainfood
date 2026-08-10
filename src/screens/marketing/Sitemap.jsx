import Link from "next/link";

/**
 * Human-readable sitemap.
 *
 * Deliberately a Server Component with no "use client", no GSAP, and no
 * IntersectionObserver — unlike the other marketing screens. A sitemap's whole
 * job is to be a flat, crawlable list of links; scroll-reveal animation would
 * ship JavaScript to hide the very content the page exists to expose, and
 * anything that starts at `opacity: 0` is a bad bet on a page whose audience is
 * half crawlers.
 *
 * Sections come from src/config/routes.js — the same registry that builds
 * /sitemap.xml — so this page cannot fall out of sync with the XML one.
 */
function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SitemapPage({ sections, totalCount }) {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-navy via-navy-light to-surface-100 pt-32 pb-24">
        <div className="section-pad">
          <div className="content-container">
            <span className="font-mono text-xs text-white/40 uppercase tracking-widest">
              Sitemap
            </span>
            <h1 className="mt-4 font-heading font-bold text-3xl md:text-5xl text-white tracking-tight max-w-2xl">
              Every page on this site.
            </h1>
            <p className="mt-4 text-white/50 text-sm md:text-base max-w-lg leading-relaxed">
              {totalCount} {totalCount === 1 ? "page" : "pages"}, updated automatically as we
              publish. Looking for the machine-readable version?{" "}
              <a
                href="/sitemap.xml"
                className="text-white/80 underline underline-offset-4 hover:text-white transition-colors"
              >
                sitemap.xml
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="relative z-10 section-pad -mt-10 pb-24">
        <div className="content-container">
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <div
                key={section.key}
                className="bg-white card-radius p-8 md:p-10 border border-surface-300/50 shadow-xl shadow-navy/5"
              >
                <h2 className="font-heading font-bold text-xl text-navy tracking-tight">
                  {section.title}
                </h2>
                {section.blurb && (
                  <p className="mt-1.5 text-navy/40 text-sm leading-relaxed">{section.blurb}</p>
                )}

                <ul className="mt-6 space-y-1">
                  {section.routes.map((route) => {
                    const updated = formatDate(route.lastModified);
                    return (
                      <li key={route.path}>
                        <Link
                          href={route.path}
                          className="group flex items-baseline justify-between gap-4 py-2 border-b border-surface-200 last:border-0"
                        >
                          <span
                            className={`text-sm transition-colors group-hover:text-brand-500 ${
                              route.paginated ? "text-navy/45" : "text-navy/80"
                            }`}
                          >
                            {route.label}
                          </span>
                          {updated && (
                            <span className="font-mono text-[10px] text-navy/30 uppercase tracking-wider whitespace-nowrap shrink-0">
                              {updated}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
