import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CONTENT, eventUrl } from "../../config/site.js";
import { CalendarDays, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useEventsStore } from "../../stores/events.store.js";
import { useSettingsStore } from "../../stores/settings.store.js";
import { ContentSidebar } from "../../components/marketing/ContentSidebar.jsx";
import { CtaBanner } from "../../components/marketing/CtaBanner.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { NotFoundPage } from "./NotFound.jsx";
import { useSeo, eventSchema, breadcrumbSchema } from "../../lib/seo.js";

function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Minimal markdown-ish renderer: ##, ###, -, ** */
function RenderBody({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2 my-4">
          {listBuffer.map((li, i) => (
            <li key={i} className="flex items-start gap-2 text-navy/65 text-base leading-relaxed">
              <span className="text-brand-500 mt-1.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(li) }} />
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const boldify = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold text-navy/80'>$1</strong>");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={i} className="font-heading font-bold text-lg text-navy mt-8 mb-3">
          {line.slice(4)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={i} className="font-heading font-bold text-xl md:text-2xl text-navy mt-10 mb-4">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      elements.push(
        <p
          key={i}
          className="text-navy/65 text-base leading-relaxed my-3"
          dangerouslySetInnerHTML={{ __html: boldify(line) }}
        />
      );
    }
  }

  flushList();
  return <>{elements}</>;
}

export function EventDetailPage() {
  const { slug } = useParams();
  const event = useEventsStore((s) => s.events.find((e) => e.slug === slug));
  const status = useEventsStore((s) => s.status);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useSeo({
    title: event?.title,
    description: event?.excerpt,
    path: event ? eventUrl(event.slug) : undefined,
    image: event?.image,
    type: "article",
    noindex: !event,
    schemas: event
      ? [
          eventSchema(event, settings),
          breadcrumbSchema(
            [
              { name: "Home", path: "/" },
              { name: CONTENT.events.label, path: CONTENT.events.listPath },
              { name: event.title, path: eventUrl(event.slug) },
            ],
            settings,
          ),
        ]
      : [],
  });

  // The old code redirected to /events whenever `event` was falsy. With the data now
  // arriving asynchronously, that fired on the very first render — before the fetch
  // resolved — so every event page bounced to the list. Wait for the fetch to settle,
  // then show a real 404 if the slug genuinely does not exist.
  if (status === "idle" || status === "loading") {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!event) return <NotFoundPage />;

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
            to={CONTENT.events.listPath}
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
              <RenderBody text={event.body} />
            </article>

            {/* Back link */}
            <div className="mt-8">
              <Link
                to={CONTENT.events.listPath}
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
