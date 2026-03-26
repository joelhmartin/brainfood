import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowRight,
  Heart,
  Users,
  GitBranch,
  Wrench,
  Scale,
  MapPin,
  UserCheck,
  Brain,
  Home,
  Stethoscope,
  Compass,
} from "lucide-react";
import Lottie from "lottie-react";
import { Tabs } from "../../components/ui/Tabs.jsx";
import { AUSTIN, SERVICES, TEAM } from "../../config/images.js";
import { Responsive } from "../../hooks/useBreakpoint.jsx";

/* ── Scroll reveal helper ─────────────────────
   Uses IntersectionObserver instead of GSAP
   ScrollTrigger to avoid layout-shift issues
   with externally loaded images.
──────────────────────────────────────────── */
function useScrollReveal(ref, selector, animProps) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;

    // Keep targets invisible until observer fires
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

/* ─────────────────────────────────────────────
   NOISE OVERLAY
───────────────────────────────────────────── */
function NoiseOverlay() {
  return (
    <svg className="noise-overlay" width="100%" height="100%">
      <filter id="noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   HERO
───────────────────────────────────────────── */
function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hero-anim]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.3,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[100dvh] min-h-[640px] flex items-end overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">

        <Responsive>{(bp) =>
          <img
            src={bp.isMobile ? TEAM.heroMobile : TEAM.heroMain}
            alt="Brain Food Recovery Services team"
            className="w-full h-full object-cover object-center"
          />
        }</Responsive>
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <NoiseOverlay />
      </div>

      {/* Content */}
      <div className="relative z-10 section-pad pt-24 pb-16 md:pb-28 max-w-6xl">
        {/* Eyebrow */}
        <div data-hero-anim className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-xs font-mono tracking-wider">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-400" />
            </span>
            Recovery Coaching &nbsp;•&nbsp; Mental Health Coaching &nbsp;•&nbsp; Sober Companion Services
          </span>
        </div>

        {/* Headline */}
        <h1 data-hero-anim>
          <span className="block font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[0.95] text-white">
            Practical Support.
          </span>
          <span className="block font-drama italic text-5xl sm:text-6xl md:text-7xl lg:text-[8rem] tracking-tight leading-[0.85] text-brand-400">
            Real Connection.
          </span>
          <span className="block font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[1] text-white mt-1">
            Lasting Change.
          </span>
        </h1>

        {/* Sub */}
        <p
          data-hero-anim
          className="mt-7 text-white/60 text-base md:text-lg max-w-xl leading-relaxed"
        >
          We provide personalized recovery and mental health coaching for
          individuals and families navigating substance use disorder and mental
          health challenges—working side by side in the real world.
        </p>

        {/* CTAs */}
        <div data-hero-anim className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/contact"
            className="btn-magnetic group px-7 py-3.5 rounded-full bg-brand-500 text-white font-semibold text-sm"
          >
            <span className="btn-bg bg-brand-600 rounded-full" />
            <span className="relative z-10 flex items-center gap-2">
              Start Your Journey
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </span>
          </Link>
          <a
            href="#services"
            className="px-7 py-3.5 rounded-full border border-white/20 text-white/80 font-medium text-sm hover:bg-white/10 transition-colors duration-300"
          >
            Our Services
          </a>
        </div>

        {/* Values strip */}
        <div
          data-hero-anim
          className="mt-12 flex items-center flex-wrap gap-x-8 gap-y-2 text-white/35 text-xs font-mono"
        >
          {["Stability", "Accountability", "Connection", "Purpose"].map(
            (v, i, arr) => (
              <span key={v} className="flex items-center gap-8">
                {v}
                {i < arr.length - 1 && (
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                )}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MISSION
───────────────────────────────────────────── */
function Mission() {
  const ref = useRef(null);
  const [winkData, setWinkData] = useState(null);
  useScrollReveal(ref, "[data-mission-anim]", { y: 32, duration: 0.9, stagger: 0.12 });

  useEffect(() => {
    fetch("/lottie/BRAINFOOD WINK.json")
      .then((r) => r.json())
      .then(setWinkData)
      .catch(() => {});
  }, []);

  return (
    <section ref={ref} className="relative section-pad py-24 md:py-32">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Photo */}
        <div data-mission-anim className="relative order-2 lg:order-1">
          <div className="relative rounded-3xl overflow-hidden aspect-[4/4]">
            <img
              src={TEAM.teamIsoBg}
              alt="Brain Food Recovery Services team"
              className="w-full h-full object-contain object-center"
            />
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-5 -right-5 md:right-6 bg-white rounded-2xl px-6 py-4 shadow-xl border border-surface-200/80">
            <p className="font-heading font-bold text-3xl text-brand-500 leading-none">
              Real World Support
            </p>
            <p className="text-navy/50 text-sm mt-0.5">World Support</p>
          </div>
        </div>

        {/* Text */}
        <div className="order-1 lg:order-2">
          <div data-mission-anim className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
            Our Mission
          </div>

          <h2
            data-mission-anim
            className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight mb-6"
          >
            We work in the real world—
            <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
              {" "}side by side{" "}
            </span>
            with our clients.
          </h2>

          <p data-mission-anim className="text-navy/60 text-base leading-relaxed mb-5">
            Our mission is to help individuals and families create lives rooted
            in stability, accountability, connection, and purpose.
          </p>
          <p data-mission-anim className="text-navy/60 text-base leading-relaxed mb-8">
            Using our own lived experience with substance use disorder and
            mental health challenges, we deliver coaching that is both
            compassionate and direct. We believe sustainable recovery is built
            through practical skills, supportive relationships, and consistent
            real-world application—not just insight alone.
          </p>

          <div data-mission-anim>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-brand-500 font-semibold text-sm hover:gap-3 transition-all duration-300"
            >
              Learn More About Us
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   SERVICES TABS
   Pexels images are linked below — verify and
   download after approval.
───────────────────────────────────────────── */
const SERVICE_TABS = [
  {
    id: "coaching",
    label: "Recovery Coaching",
    subtitle: "Recovery & Mental Health Coaching",
    title: "Weekly In-Person Coaching for Stability and Forward Momentum",
    description:
      "Our core service is weekly, in-person recovery and mental health coaching. This work is structured, consistent, and highly individualized—designed to help clients translate insight into action and build lasting stability.",
    items: [
      "Short-term, achievable goal setting",
      "Daily structure, routine, and accountability",
      "Physical health, wellness, and self-care practices",
      "Financial awareness, budgeting, and responsibility",
      "Time management and effective use of resources",
      "Development of practical life skills",
      "Reconnection to community, purpose, and identity",
    ],
    image: SERVICES.coaching,
    imageAlt: "Recovery coaching session",
  },
  {
    id: "sober-companion",
    label: "Sober Companion",
    subtitle: "Sober Companion Services",
    title: "24/7 Transitional Support When It Matters Most",
    description:
      "Our Sober Companion Services offer round-the-clock support for individuals who need an elevated level of care during critical or high-risk transitions. Our companions provide calm, consistent presence—helping clients make healthy decisions while reinforcing structure, safety, and self-awareness.",
    items: [
      "Traveling with a client who requires additional structure",
      "Temporarily living with a client during transition",
      "Supporting clients following treatment or hospitalization",
      "Assisting through high-risk situations in real time",
      "Strengthening routines and coping strategies",
      "Increasing confidence and self-trust",
      "Reducing risk during vulnerable periods",
    ],
    image: SERVICES.soberCompanion,
    imageAlt: "Sober companion walking with client",
  },
  {
    id: "experiential",
    label: "Experiential Integration",
    subtitle: "Experiential Integration",
    title: "Building a Life That Supports Recovery",
    description:
      "Recovery is not just about avoiding substances—it's about actively creating a life that feels engaging, meaningful, and sustainable. Our Experiential Integration services help clients reconnect with themselves and the world through intentional real-life experiences.",
    items: [
      "Hiking and outdoor experiences",
      "Fitness and physical wellness activities",
      "Attending concerts, events, and community gatherings",
      "Exploring hobbies, creativity, and personal interests",
      "Rebuilding social confidence and connection",
      "Identifying passions that bring meaning to daily life",
    ],
    // Austin's Lady Bird Lake aerial — locally relevant outdoor experience
    image: AUSTIN.ladyBirdAerial,
    imageAlt: "Lady Bird Lake, Austin TX — outdoor experiential integration",
  },
  {
    id: "family",
    label: "Family Coaching",
    subtitle: "Family Coaching & Support",
    title: "Educated Families Create Stronger Recovery Systems",
    description:
      "Substance use and mental health challenges affect the entire family system. We provide coaching and support to help families move from confusion and fear to clarity and confidence.",
    items: [
      "Understanding substance use disorder and mental health",
      "Healthy communication and boundary setting",
      "Reducing burnout, fear, and emotional overwhelm",
      "Learning how to support recovery without enabling",
    ],
    image: SERVICES.family,
    imageAlt: "Family coaching session",
  },
  {
    id: "collaborative",
    label: "Collaborative Care",
    icon: Stethoscope,
    subtitle: "Collaborative Care & Advocacy",
    title: "Working Alongside Your Support Network",
    description:
      "We actively collaborate with therapists, psychologists, medical providers, attorneys, and case managers to create realistic, integrated life plans that support recovery outside of institutional settings and within everyday life.",
    items: [
      "Therapists and psychologists",
      "Medical and mental health providers",
      "Attorneys and legal professionals",
      "Case managers and extended support networks",
    ],
    image: SERVICES.collaborative,
    imageAlt: "Collaborative care team meeting",
  },
];

function Services() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-services-hdr]", { y: 28, duration: 0.9, stagger: 0.1 });

  return (
    <section id="services" ref={ref} className="section-pad py-24 md:py-32 bg-surface-100">
      <div data-services-hdr className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
        Our Services
      </div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
        <h2
          data-services-hdr
          className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight max-w-xl"
        >
          Comprehensive, Real-World Support for{" "}
          <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">
            Recovery & Mental Wellness
          </span>
        </h2>
        <p
          data-services-hdr
          className="text-navy/50 text-sm max-w-xs leading-relaxed"
        >
          We tailor our work to the individual—not the diagnosis. Recovery is
          not one-size-fits-all.
        </p>
      </div>

      <Tabs tabs={SERVICE_TABS} />
    </section>
  );
}

/* ─────────────────────────────────────────────
   WHO WE SERVE
───────────────────────────────────────────── */
const WHO_WE_SERVE = [
  {
    icon: Brain,
    title: "Substance Use Disorder",
    desc: "Individuals navigating recovery from addiction and substance dependence.",
  },
  {
    icon: Heart,
    title: "Mental Health Challenges",
    desc: "Individuals managing anxiety, depression, trauma, and co-occurring conditions.",
  },
  {
    icon: UserCheck,
    title: "Abstinence-Based Recovery",
    desc: "Clients seeking full abstinence as their recovery pathway.",
  },
  {
    icon: GitBranch,
    title: "Harm Reduction Pathways",
    desc: "Clients utilizing harm reduction or alternative, individualized recovery approaches.",
  },
  {
    icon: Home,
    title: "Transitioning from Treatment",
    desc: "Individuals stepping down from treatment centers, hospitals, or institutional settings.",
  },
  {
    icon: Users,
    title: "Families Seeking Support",
    desc: "Families seeking education, guidance, and support for their loved ones.",
  },
];

function WhoWeServe() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-who-card]", { y: 24, duration: 0.8, stagger: 0.08 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
          Who We Serve
        </div>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight">
          Recovery is{" "}
          <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">not linear</span>
          —and it's not one-size-fits-all.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {WHO_WE_SERVE.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            data-who-card
            className="bg-white rounded-3xl p-7 border border-surface-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center mb-4">
              <Icon size={18} className="text-brand-500" />
            </div>
            <h3 className="font-heading font-bold text-base text-navy mb-2">
              {title}
            </h3>
            <p className="text-navy/55 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   WHY BRAIN FOOD
───────────────────────────────────────────── */
const WHY_ITEMS = [
  {
    icon: Heart,
    title: "Lived Experience + Professional Collaboration",
    desc: "Grounded in firsthand experience with substance use disorder and mental health, supported by clinical and professional partners.",
  },
  {
    icon: MapPin,
    title: "Hands-On, Real-World Support",
    desc: "We show up—in person, in daily life—where recovery actually happens. Not just in an office.",
  },
  {
    icon: GitBranch,
    title: "Multiple Recovery Pathways",
    desc: "Abstinence-based, harm reduction, and individualized approaches—all respected with professionalism and dignity.",
  },
  {
    icon: Wrench,
    title: "Practical Life Skills",
    desc: "Emotional growth matters, but so does budgeting, scheduling, and building daily structure. We work on both.",
  },
  {
    icon: Scale,
    title: "Honest Accountability, Compassionate Delivery",
    desc: "We tell the truth with care—helping clients recognize blind spots and build insight without shame or judgment.",
  },
  {
    icon: Compass,
    title: "Care That Fits Real Life",
    desc: "As a mom-and-pop organization, our work is deeply personal. We help people build a blueprint for a meaningful, stable life.",
  },
];

function WhyBrainFood() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-why-card]", { y: 24, duration: 0.8, stagger: 0.08 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32 bg-navy relative overflow-hidden">
      {/* Austin skyline bg — subtle atmospheric layer */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={AUSTIN.skylineDusk}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-bottom opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
      </div>

      <div className="text-center max-w-2xl mx-auto mb-14 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium mb-5 tracking-wide">
          Our Approach
        </div>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
          Why{" "}
          <span className="font-drama italic text-brand-400 text-4xl md:text-5xl">
            Brain Food Recovery Services
          </span>
        </h2>
        <p className="mt-4 text-white/50 text-base leading-relaxed">
          We don't believe in perfection. We believe in progress, connection, and momentum.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative">
        {WHY_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            data-why-card
            className="rounded-3xl p-7 border border-white/8 bg-white/4 hover:bg-white/7 transition-colors duration-300"
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-500/15 flex items-center justify-center mb-4">
              <Icon size={18} className="text-brand-400" />
            </div>
            <h3 className="font-heading font-bold text-base text-white mb-2">
              {title}
            </h3>
            <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MEET THE TEAM — 4 coaches with links to bios
───────────────────────────────────────────── */
const COACHES = [
  { id: "charlie",  name: "Charlie Moffet",          role: "Recovery Coach & Co-Founder", photo: TEAM.charles1 },
  { id: "justin",   name: "Justin Yoken",            role: "Recovery Coach & Co-Founder", photo: TEAM.justin1 },
  { id: "matthew",  name: "Matthew Harvey-Parrish",  role: "Recovery Coach",              photo: TEAM.matthew1 },
  { id: "damian",   name: "Damian Vickers",           role: "Recovery Coach",              photo: TEAM.damian1 },
];

function Team() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-team-card]", { y: 30, duration: 0.8, stagger: 0.12 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32 bg-surface-100">
      <div className="text-center max-w-xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
          Meet the Team
        </div>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight">
          A{" "}
          <span className="font-drama italic text-brand-500 text-4xl md:text-5xl">personal</span>{" "}
          organization, deeply committed to your growth.
        </h2>
        <p className="mt-4 text-navy/55 text-base leading-relaxed">
          As a mom-and-pop organization, our work is personal. We bring lived
          experience, compassionate honesty, and hands-on dedication to every
          client relationship.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {COACHES.map((coach) => (
          <Link
            key={coach.id}
            to={`/about#${coach.id}`}
            data-team-card
            className="group block"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] shadow-md group-hover:shadow-xl transition-shadow duration-300">
              <img
                src={coach.photo}
                alt={coach.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-heading font-bold text-lg text-white leading-tight">
                  {coach.name}
                </h3>
                <p className="text-white/60 text-sm mt-0.5">{coach.role}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          to="/about#charlie"
          className="inline-flex items-center gap-2 text-brand-500 font-semibold text-sm hover:gap-3 transition-all duration-300"
        >
          Read Full Bios
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   CTA
───────────────────────────────────────────── */
function CTA() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-cta-anim]", { y: 28, duration: 0.9, stagger: 0.12 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="bg-brand-500 rounded-4xl md:rounded-5xl p-10 md:p-16 text-center relative overflow-hidden">
        {/* Noise texture */}
        <NoiseOverlay />

        <div className="relative z-10">
          <div data-cta-anim className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/80 text-xs font-medium mb-6 tracking-wide">
            Take the Next Step
          </div>
          <h2
            data-cta-anim
            className="font-heading font-bold text-3xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl mx-auto"
          >
            Ready to start your recovery{" "}
            <span className="font-drama italic text-4xl md:text-6xl">journey?</span>
          </h2>
          <p
            data-cta-anim
            className="mt-5 text-white/70 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
          >
            We work with individuals and families at every stage of the recovery
            process. Reach out today for a confidential conversation.
          </p>
          <div data-cta-anim className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/contact"
              className="px-8 py-3.5 rounded-full bg-white text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors duration-300 shadow-lg"
            >
              Get in Touch
            </Link>
            <Link
              to="/about"
              className="px-8 py-3.5 rounded-full border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-colors duration-300"
            >
              Learn About Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────── */
export function HomePage() {
  return (
    <>
      <Hero />
      <Mission />
      <Services />
      <WhoWeServe />
      <WhyBrainFood />
      <Team />
      <CTA />
    </>
  );
}
