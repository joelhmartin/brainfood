"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CONTENT } from "../../config/site.js";
import { CalendarDays, MapPin, Clock, ArrowLeft } from "lucide-react";
import { ContentSidebar } from "../../components/marketing/ContentSidebar.jsx";
import { CtaBanner } from "../../components/marketing/CtaBanner.jsx";
import { ArticleBody } from "../../components/marketing/ArticleBody.jsx";

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function EventDetailPage({ event }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [event.slug]);

  return (
    <>
      {/* Hero image */}
      <section className="relative h-[50dvh] min-h-[400px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
        </div>
        <div className="relative z-10 content-container max-w-4xl pb-12 md:pb-16">
          <Link
            href={CONTENT.events.listPath}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 text-xs font-medium mb-5 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={12} />
            All Events
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-semibold">
              {event.category}
            </span>
          </div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>
      </section>

      {/* Content + sidebar */}
      <section className="py-12 md:py-16">
        <div className="content-container grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 lg:gap-12">
          {/* Main content */}
          <div>
            {/* Meta bar */}
            <div className="flex flex-wrap gap-6 py-6 mb-8 border-b border-surface-300/40">
              <div className="flex items-center gap-2 text-navy/50 text-sm">
                <CalendarDays size={16} className="text-brand-500" />
                {formatDate(event.date)}
              </div>
              <div className="flex items-center gap-2 text-navy/50 text-sm">
                <Clock size={16} className="text-brand-500" />
                {event.time}
              </div>
              <div className="flex items-center gap-2 text-navy/50 text-sm">
                <MapPin size={16} className="text-brand-500" />
                {event.location}
              </div>
            </div>

            {/* Body */}
            <article className="max-w-none">
              <ArticleBody html={event.body} variant="event" />
            </article>

            {/* Back link */}
            <div className="mt-8">
              <Link
                href={CONTENT.events.listPath}
                className="inline-flex items-center gap-2 text-brand-500 text-sm font-semibold hover:gap-3 transition-all"
              >
                <ArrowLeft size={14} />
                Back to All Events
              </Link>
            </div>
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
      </section>

      <CtaBanner
        eyebrow="Take the Next Step"
        title="Ready to start your"
        titleAccent="journey?"
        subtitle="We work with individuals and families at every stage of the recovery process. Reach out today for a confidential conversation."
        primary={{ label: "Get in Touch", to: "/contact" }}
      />
    </>
  );
}
