import { useEffect, useRef } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight, Check } from "lucide-react";
import { AUSTIN } from "../../config/images.js";
import { SERVICES_CONTENT, getService } from "../../config/services.js";

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

      <div className="relative z-10 section-pad pb-16 md:pb-24 max-w-4xl">
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
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div>
          <div
            data-svc-intro
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide"
          >
            {service.navLabel}
          </div>
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
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl shadow-navy/10">
            <img
              src={service.image}
              alt={service.navLabel}
              className="w-full h-full object-cover object-center"
            />
          </div>
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
    <section ref={ref} className="section-pad py-24 md:py-32 bg-surface-100">
      <div className="max-w-6xl mx-auto">
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
              className="flex items-start gap-4 bg-white rounded-3xl p-6 border border-surface-200/60 shadow-sm"
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
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <div
          data-svc-who
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-6 tracking-wide"
        >
          Who it's for
        </div>
        <h2
          data-svc-who
          className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight mb-10"
        >
          This may be a fit if{" "}
          <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
            you're
          </span>
          …
        </h2>
        <ul className="space-y-4 text-left max-w-2xl mx-auto">
          {service.whoFor.map((item, i) => (
            <li
              key={i}
              data-svc-who
              className="flex items-start gap-3 text-navy/70 text-base md:text-lg leading-relaxed"
            >
              <ArrowRight
                size={18}
                className="text-brand-500 mt-1.5 flex-shrink-0"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─── Other services strip ─── */
function OtherServices({ currentSlug }) {
  const others = SERVICES_CONTENT.filter((s) => s.slug !== currentSlug);
  return (
    <section className="section-pad py-20 bg-surface-100 border-t border-surface-200/60">
      <div className="max-w-6xl mx-auto">
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
              className="group flex items-center gap-3 bg-white rounded-2xl p-5 border border-surface-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
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

/* ─── CTA ─── */
function ServiceCTA() {
  return (
    <section className="section-pad py-24 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-heading font-bold text-2xl md:text-4xl tracking-tight">
          Ready to start your
          <span className="font-drama italic text-brand-500 text-3xl md:text-5xl">
            {" "}
            journey?
          </span>
        </h2>
        <p className="mt-4 text-navy/50 text-base max-w-lg mx-auto leading-relaxed">
          We work with individuals and families at every stage of the recovery
          process. Reach out today for a confidential conversation.
        </p>
        <Link
          to="/contact"
          className="btn-magnetic group mt-8 inline-flex px-8 py-4 rounded-full bg-brand-500 text-white font-semibold"
        >
          <span className="btn-bg bg-brand-600 rounded-full" />
          <span className="relative z-10 flex items-center gap-2">
            Get in Touch
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </span>
        </Link>
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
      <ServiceCTA />
    </>
  );
}
