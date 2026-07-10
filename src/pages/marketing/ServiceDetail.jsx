import { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight, Check } from "lucide-react";
import { SERVICES_CONTENT, getService } from "../../config/services.js";
import { BrandMotif } from "../../components/marketing/BrandMotif.jsx";
import { TaglineCard } from "../../components/marketing/TaglineCard.jsx";
import { CtaBanner } from "../../components/marketing/CtaBanner.jsx";

/* ── Scroll reveal helper (IntersectionObserver) ── */
function useScrollReveal(ref, selector, animProps = {}) {
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
            opacity: 1,
            y: 0,
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

/* ─── Noise overlay ─── */
function NoiseOverlay() {
  return (
    <svg className="noise-overlay" width="100%" height="100%">
      <filter id="noise-service">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-service)" />
    </svg>
  );
}

/* ─── Hero ─── */
function ServiceHero({ service }) {
  const heroRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-svc-hero]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2,
      });
    }, heroRef);
    return () => ctx.revert();
  }, [service.slug]);

  return (
    <section
      ref={heroRef}
      className="relative h-[70dvh] min-h-[500px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={service.image}
          alt={service.navLabel}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
        <NoiseOverlay />
      </div>

      <BrandMotif
        tone="light"
        className="hidden md:block top-[-5rem] right-[-4rem] w-[26rem] opacity-[0.06] z-[1]"
      />

      <div className="relative z-10 content-container pb-16 md:pb-24">
        <span
          data-svc-hero
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 text-xs font-mono tracking-wider"
        >
          Our Services
        </span>
        <h1 data-svc-hero className="mt-6">
          <span className="block font-heading font-bold text-4xl sm:text-5xl md:text-7xl tracking-tight leading-[0.95] text-white">
            {service.title}
          </span>
          <span className="block font-drama italic text-5xl sm:text-6xl md:text-8xl tracking-tight leading-[0.9] text-brand-400">
            {service.accent}
          </span>
        </h1>
        <p
          data-svc-hero
          className="mt-6 text-white/50 text-base md:text-lg max-w-xl leading-relaxed"
        >
          {service.tagline}
        </p>
      </div>
    </section>
  );
}

/* ─── Intro (2-col text + image) ─── */
function ServiceIntro({ service }) {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-svc-intro]", { y: 30, duration: 0.8, stagger: 0.1 });

  return (
    <section ref={ref} className="py-24 md:py-32">
      <div className="content-container grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div>
          <div
            data-svc-intro
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide"
          >
            {service.navLabel}
          </div>
          <h2
            data-svc-intro
            className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight mb-6"
          >
            {service.introHeading}{" "}
            <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
              {service.introAccent}
            </span>
          </h2>
          {service.intro.map((p, i) => (
            <p
              key={i}
              data-svc-intro
              className="text-navy/60 text-base leading-relaxed mb-5 last:mb-0"
            >
              {p}
            </p>
          ))}
        </div>
        <div data-svc-intro>
          <TaglineCard tagline={service.tagline} label={service.navLabel} />
        </div>
      </div>
    </section>
  );
}

/* ─── What this looks like ─── */
function ServiceLookLike({ service }) {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-svc-look]", { y: 40, duration: 0.7, stagger: 0.1 });

  return (
    <section ref={ref} className="py-24 md:py-32 bg-surface-100">
      <div className="content-container">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
            What this looks like
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight">
            How we{" "}
            <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
              work together
            </span>
            .
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {service.lookLike.map((item, i) => (
            <div
              key={i}
              data-svc-look
              className="card-soft card-accent-top flex items-start gap-4 p-6"
            >
              <div className="w-9 h-9 rounded-2xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <Check size={16} className="text-brand-500" />
              </div>
              <p className="text-navy/70 text-base leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Who it's for ─── */
function ServiceWhoFor({ service }) {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-svc-who]", { y: 30, duration: 0.8, stagger: 0.1 });

  return (
    <section ref={ref} className="relative pt-48 md:pt-64 pb-24 md:pb-32 overflow-hidden">
      <BrandMotif
        tone="natural"
        float={false}
        fade
        className="top-0 left-1/2 -translate-x-1/2 w-[34rem] max-w-none opacity-[0.13]"
      />
      <div className="content-container relative max-w-3xl">
        <div className="text-center mb-10">
          <div
            data-svc-who
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-6 tracking-wide"
          >
            Who it's for
          </div>
          <h2
            data-svc-who
            className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight"
          >
            This may be a fit if{" "}
            <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
              you're
            </span>
            …
          </h2>
        </div>
        <div data-svc-who className="card-soft p-2 sm:p-3 divide-y divide-surface-200">
          {service.whoFor.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-4 sm:px-5 py-4"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={15} className="text-brand-500" />
              </div>
              <span className="text-navy/70 text-base md:text-lg leading-relaxed">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Other services strip ─── */
function OtherServices({ currentSlug }) {
  const others = SERVICES_CONTENT.filter((s) => s.slug !== currentSlug);
  return (
    <section className="py-20 bg-surface-100 border-t border-surface-200/60">
      <div className="content-container">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-navy tracking-tight">
            Explore other services
          </h2>
          <Link
            to="/services"
            className="text-brand-500 hover:text-brand-600 text-sm font-semibold inline-flex items-center gap-1"
          >
            All services
            <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {others.map((s) => (
            <Link
              key={s.slug}
              to={`/services/${s.slug}`}
              className="card-soft !rounded-2xl group flex items-center gap-3 p-5"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                <s.icon size={16} className="text-brand-500" />
              </div>
              <span className="text-navy/80 text-sm font-medium leading-snug group-hover:text-brand-600 transition-colors">
                {s.navLabel}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page export ─── */
export function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getService(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  return (
    <>
      <ServiceHero service={service} />
      <ServiceIntro service={service} />
      <ServiceLookLike service={service} />
      <ServiceWhoFor service={service} />
      <OtherServices currentSlug={service.slug} />
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
