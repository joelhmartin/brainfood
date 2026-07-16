"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { CalendarDays, MapPin, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { AUSTIN } from "../../config/images.js";
import { CONTENT, eventUrl, eventPageUrl } from "../../config/site.js";
import { ContentSidebar } from "../../components/marketing/ContentSidebar.jsx";

/* ── Scroll reveal ── */
function useScrollReveal(ref, selector, animProps) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;
    gsap.set(targets, { opacity: 0, y: animProps.y ?? 24 });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(targets, {
            opacity: 1, y: 0,
            duration: animProps.duration ?? 0.8,
            stagger: animProps.stagger ?? 0.08,
            ease: animProps.ease ?? "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const { perPage } = CONTENT.events;

/* ─── HERO ─── */
function EventsHero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-ehero]", {
        y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: "power3.out", delay: 0.3,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[45dvh] min-h-[350px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={AUSTIN.skylineDay}
          alt="Austin, Texas"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
      </div>
      <div className="relative z-10 content-container pb-12 md:pb-16">
        <span
          data-ehero
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 text-xs font-mono tracking-wider"
        >
          Community Events
        </span>
        <h1 data-ehero className="mt-5">
          <span className="block font-heading font-bold text-3xl sm:text-4xl md:text-6xl tracking-tight leading-[0.95] text-white">
            Recovery is better
          </span>
          <span className="block font-drama italic text-4xl sm:text-5xl md:text-8xl tracking-tight leading-[0.9] text-brand-400">
            together.
          </span>
        </h1>
      </div>
    </section>
  );
}

/* ─── EVENT CARD ─── */
function EventCard({ event }) {
  return (
    <Link
      href={eventUrl(event.slug)}
      className="group block bg-white rounded-3xl border border-surface-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-600 text-xs font-semibold">
            {event.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-navy/40 text-xs mb-3">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} />
            {formatDate(event.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {event.time}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-navy/40 text-xs mb-4">
          <MapPin size={12} />
          {event.location}
        </div>

        <h3 className="font-heading font-bold text-lg text-navy tracking-tight group-hover:text-brand-500 transition-colors mb-2">
          {event.title}
        </h3>
        <p className="text-navy/55 text-sm leading-relaxed line-clamp-2">
          {event.excerpt}
        </p>

        <div className="mt-4 flex items-center gap-2 text-brand-500 text-sm font-semibold">
          Learn More
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

/* ─── PAGINATION ─── */
function Pagination({ currentPage, totalPages }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-2 mt-14">
      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={eventPageUrl(currentPage - 1)}
          className="w-10 h-10 rounded-full border border-surface-300 flex items-center justify-center text-navy/50 hover:text-brand-500 hover:border-brand-300 transition-colors"
        >
          <ChevronLeft size={16} />
        </Link>
      ) : (
        <span className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center text-navy/20">
          <ChevronLeft size={16} />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((num) => (
        <Link
          key={num}
          href={eventPageUrl(num)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
            num === currentPage
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "border border-surface-300 text-navy/50 hover:text-brand-500 hover:border-brand-300"
          }`}
        >
          {num}
        </Link>
      ))}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={eventPageUrl(currentPage + 1)}
          className="w-10 h-10 rounded-full border border-surface-300 flex items-center justify-center text-navy/50 hover:text-brand-500 hover:border-brand-300 transition-colors"
        >
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span className="w-10 h-10 rounded-full border border-surface-200 flex items-center justify-center text-navy/20">
          <ChevronRight size={16} />
        </span>
      )}
    </nav>
  );
}

/* ─── PAGINATION MATH ───
 * Pulled out as a pure function (rather than inlined in the component) so it can
 * be unit-tested directly — it's the exact logic that must agree with
 * generateStaticParams in app/(marketing)/events/page/[page]/page.jsx.
 */
export function paginateEvents(events, page, perPageOverride = perPage) {
  const currentPage = Math.max(1, Number(page) || 1);
  const totalPages = perPageOverride > 0 ? Math.ceil(events.length / perPageOverride) : 1;
  const paginated = perPageOverride > 0
    ? events.slice((currentPage - 1) * perPageOverride, currentPage * perPageOverride)
    : events;
  return { currentPage, totalPages, paginated };
}

/* ─── PAGE EXPORT ─── */
export function EventsPage({ events: eventsProp = [], page = 1 }) {
  const events = eventsProp
    .filter((e) => e.published)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // totalPages is computed from the SAME basis (all published events, no featured
  // carve-out) that generateStaticParams uses in
  // app/(marketing)/events/page/[page]/page.jsx, so the two never disagree on how
  // many pages exist.
  const { currentPage, totalPages, paginated } = paginateEvents(events, page);

  const gridRef = useRef(null);
  useScrollReveal(gridRef, "[data-event-card]", { y: 30, stagger: 0.1 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <>
      <EventsHero />

      <section ref={gridRef} className="py-16 md:py-24">
        <div className="content-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-12">
            {/* Main content */}
            <div>
              {paginated.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-navy/40 text-lg">No upcoming events right now.</p>
                  <p className="text-navy/30 text-sm mt-2">Check back soon!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {paginated.map((event) => (
                    <div key={event.id} data-event-card>
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              )}

              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <ContentSidebar
                  title="Join Us at an Event"
                  subtitle="Interested in attending? Reach out and we'll save you a spot — or just show up. Everyone's welcome."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
