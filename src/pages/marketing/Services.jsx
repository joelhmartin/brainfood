import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { AUSTIN } from "../../config/images.js";
import { SERVICES_CONTENT } from "../../config/services.js";
import { BrandMotif } from "../../components/marketing/BrandMotif.jsx";
import { CtaBanner } from "../../components/marketing/CtaBanner.jsx";
import { useSeo } from "../../lib/seo.js";

/* ── Scroll reveal helper ── */
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
      <filter id="noise-services">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-services)" />
    </svg>
  );
}

/* ─── Hero ─── */
function ServicesHero() {
  const heroRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-services-hero]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.2,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[60dvh] min-h-[440px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={AUSTIN.skylineDusk}
          alt="Austin, Texas skyline at dusk"
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
          data-services-hero
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 text-xs font-mono tracking-wider"
        >
          Our Services
        </span>
        <h1 data-services-hero className="mt-6">
          <span className="block font-heading font-bold text-4xl sm:text-5xl md:text-7xl tracking-tight leading-[0.95] text-white">
            Support for every
          </span>
          <span className="block font-drama italic text-5xl sm:text-6xl md:text-8xl tracking-tight leading-[0.9] text-brand-400">
            step of recovery.
          </span>
        </h1>
        <p
          data-services-hero
          className="mt-6 text-white/50 text-base md:text-lg max-w-xl leading-relaxed"
        >
          Practical, personalized coaching and support for individuals and
          families—grounded in lived experience and built for real life.
        </p>
      </div>
    </section>
  );
}

/* ─── Cards grid ─── */
function ServicesGrid() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-svc-card]", { y: 40, duration: 0.7, stagger: 0.1 });

  return (
    <section ref={ref} className="py-24 md:py-32">
      <div className="content-container">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight">
            Five ways we{" "}
            <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
              walk alongside
            </span>{" "}
            you.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_CONTENT.map((s) => (
            <Link
              key={s.slug}
              to={`/services/${s.slug}`}
              data-svc-card
              className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-surface-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={s.image}
                  alt={s.navLabel}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
                <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center">
                  <s.icon size={18} className="text-brand-500" />
                </div>
              </div>
              <div className="flex flex-col flex-1 p-7">
                <h3 className="font-heading font-bold text-lg text-navy mb-2 leading-snug">
                  {s.navLabel}
                </h3>
                <p className="text-navy/50 text-sm leading-relaxed mb-5 flex-1">
                  {s.cardBlurb}
                </p>
                <span className="inline-flex items-center gap-1 text-brand-500 group-hover:text-brand-600 text-sm font-semibold">
                  Learn more
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page export ─── */
export function ServicesPage() {
  useSeo({
    title: "Services",
    description:
      "Recovery coaching, mental health coaching, family coaching, and sober companion services for individuals and families in Austin, Texas.",
    path: "/services",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <ServicesHero />
      <ServicesGrid />
      <CtaBanner
        eyebrow="Take the Next Step"
        title="Not sure where to"
        titleAccent="start?"
        subtitle="Reach out for a confidential conversation and we'll help you find the right fit—for you or your loved one."
        primary={{ label: "Get in Touch", to: "/contact" }}
      />
    </>
  );
}
