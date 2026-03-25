import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import {
  ArrowRight,
  Heart,
  Users,
  Shield,
  Compass,
} from "lucide-react";
import { AUSTIN, TEAM } from "../../config/images.js";

/* ── Scroll reveal helper (IntersectionObserver, no ScrollTrigger) ── */
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

/* ─── NOISE OVERLAY ─── */
function NoiseOverlay() {
  return (
    <svg className="noise-overlay" width="100%" height="100%">
      <filter id="noise-about">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise-about)" />
    </svg>
  );
}

/* ─── HERO — Austin skyline ─── */
function AboutHero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-about-hero]", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.3,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[70dvh] min-h-[500px] flex items-end overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={AUSTIN.ladyBirdSunset}
          alt="Austin, Texas — Lady Bird Lake at golden hour"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
        <NoiseOverlay />
      </div>

      <div className="relative z-10 section-pad pb-16 md:pb-24 max-w-4xl">
        <span
          data-about-hero
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 text-xs font-mono tracking-wider"
        >
          Based in Austin, Texas
        </span>
        <h1 data-about-hero className="mt-6">
          <span className="block font-heading font-bold text-4xl sm:text-5xl md:text-7xl tracking-tight leading-[0.95] text-white">
            Compassionate truth,
          </span>
          <span className="block font-drama italic text-5xl sm:text-6xl md:text-8xl tracking-tight leading-[0.9] text-brand-400">
            delivered with care.
          </span>
        </h1>
        <p
          data-about-hero
          className="mt-6 text-white/50 text-base md:text-lg max-w-xl leading-relaxed"
        >
          We believe in meeting people with empathy—and telling the truth with
          respect. Our work is deeply personal, grounded in lived experience,
          and built for real life.
        </p>
      </div>
    </section>
  );
}

/* ─── OUR STORY ─── */
function OurStory() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-story]", { y: 30, duration: 0.8, stagger: 0.1 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        {/* Photo */}
        <div data-story>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl shadow-navy/10">
            <img
              src={TEAM.charlesJustin1}
              alt="Brain Food Recovery Services co-founders"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Text */}
        <div>
          <div
            data-story
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide"
          >
            Our Story
          </div>

          <h2
            data-story
            className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight mb-6"
          >
            We work in the{" "}
            <span className="font-drama italic text-brand-500">
              real world
            </span>
            —side by side with our clients.
          </h2>

          <p data-story className="text-navy/60 text-base leading-relaxed mb-5">
            At Brain Food Recovery Services, we provide personalized recovery
            coaching, mental health coaching, and sober companion services for
            individuals and families navigating substance use disorder and mental
            health challenges.
          </p>
          <p data-story className="text-navy/60 text-base leading-relaxed mb-5">
            We work in the real world—side by side with our clients—helping them
            build stability, confidence, and a life with meaning. Our approach is
            compassionate, honest, and action-oriented, grounded in lived
            experience and supported by collaboration with clinical and
            professional partners.
          </p>
          <p data-story className="text-navy/60 text-base leading-relaxed">
            As a mom-and-pop organization, our work is deeply personal. We are
            passionate about helping people develop a blueprint for living a
            meaningful, stable life.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── MISSION ─── */
function Mission() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-mission]", { y: 30, duration: 0.8, stagger: 0.1 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32 bg-surface-100">
      <div className="max-w-4xl mx-auto text-center">
        <div
          data-mission
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-6 tracking-wide"
        >
          Our Mission
        </div>
        <blockquote data-mission>
          <p className="font-drama italic text-3xl sm:text-4xl md:text-5xl text-navy leading-[1.15] tracking-tight">
            To help individuals and families create lives rooted in{" "}
            <span className="text-brand-500">
              stability, accountability, connection, and purpose.
            </span>
          </p>
        </blockquote>
        <p
          data-mission
          className="mt-8 text-navy/55 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Using our own lived experience with substance use disorder and mental
          health challenges, we deliver coaching that is both compassionate and
          direct. We believe sustainable recovery is built through practical
          skills, supportive relationships, and consistent real-world
          application—not just insight alone.
        </p>
        <div
          data-mission
          className="mt-8 flex items-center justify-center gap-3 text-navy/30 text-sm"
        >
          <div className="h-px w-12 bg-navy/10" />
          <span className="font-mono text-xs">
            Stability · Accountability · Connection · Purpose
          </span>
          <div className="h-px w-12 bg-navy/10" />
        </div>
      </div>
    </section>
  );
}

/* ─── PHILOSOPHY — dark section with Austin bg ─── */
function Philosophy() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-philo]", { y: 40, duration: 0.8, stagger: 0.12 });

  return (
    <section
      ref={ref}
      className="relative bg-navy overflow-hidden py-24 md:py-32"
    >
      {/* Austin skyline atmospheric bg */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={AUSTIN.skylineDusk}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-bottom opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/60" />
      </div>

      <div className="relative z-10 section-pad">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <div
              data-philo
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium mb-5 tracking-wide"
            >
              Our Philosophy
            </div>
            <h2
              data-philo
              className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight"
            >
              Compassionate truth,
              <br />
              <span className="font-drama italic text-brand-400">
                delivered with care.
              </span>
            </h2>
            <p
              data-philo
              className="mt-6 text-white/55 text-base leading-relaxed"
            >
              We believe in meeting people with empathy—and telling the truth
              with respect. Everyone benefits from supportive accountability and
              honest feedback delivered in a compassionate way.
            </p>
            <p
              data-philo
              className="mt-4 text-white/55 text-base leading-relaxed"
            >
              We help clients recognize blind spots, build insight, and take
              responsibility—without shame or judgment.
            </p>
          </div>

          {/* Team photo */}
          <div data-philo className="flex justify-center lg:justify-end">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] max-w-md w-full shadow-2xl">
              <img
                src={TEAM.goofin}
                alt="Brain Food team"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── VALUES ─── */
function Values() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-value-card]", { y: 40, duration: 0.7, stagger: 0.12 });

  const values = [
    {
      icon: Heart,
      title: "Lived Experience",
      desc: "Grounded in firsthand experience with substance use disorder and mental health. We know what this journey looks like because we've walked it.",
    },
    {
      icon: Shield,
      title: "Supportive Accountability",
      desc: "We tell the truth with care. Clients grow through honest feedback delivered with compassion—never shame or judgment.",
    },
    {
      icon: Users,
      title: "Real Relationships",
      desc: "We build genuine, lasting connections with every client. As a small team, our work is deeply personal.",
    },
    {
      icon: Compass,
      title: "Multiple Pathways",
      desc: "Abstinence-based, harm reduction, and individualized approaches—all respected and supported with dignity.",
    },
  ];

  return (
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 md:mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
            Our Values
          </div>
          <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight">
            What drives{" "}
            <span className="font-drama italic text-brand-500">
              everything
            </span>{" "}
            we do.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div
              key={v.title}
              data-value-card
              className="bg-white rounded-3xl p-7 border border-surface-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center mb-5">
                <v.icon size={18} className="text-brand-500" />
              </div>
              <h3 className="font-heading font-bold text-base mb-2">
                {v.title}
              </h3>
              <p className="text-navy/50 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TEAM BIOS ─── */
const COACHES = [
  {
    id: "charlie",
    name: "Charlie Moffet",
    role: "Recovery Coach & Co-Founder",
    photo: TEAM.charles1,
    bio: `Charlie Moffet has been working in the treatment industry for over six years. After starting his own journey in recovery he quickly realized working in addiction was his path forward. Charlie worked for a non-profit all male treatment center in Wimberley, TX for five years. He did everything from being a recovery advocate to recovery specialist, meeting with guys one on one, helping the family along the way and marketing.

In 2017, Charlie decided to open an all male sober living business called, "Chuck and Joe's Sober Living." It's a staple in the Austin community and is still in business to this day! In 2022, Charlie worked for a dual diagnoses center as a "group facilitator." His duty was to teach skill groups that included DBT, CBT, attachment theory and 12 step work. Charlie decided to get an RSPS certificate in 2022 with hopes, of once again, working with guys one on one. He is currently in college to get his LMSW and one day become a clinical therapist. Charlie is also a screen writer and a passionate traveler.`,
    quote: `"Living life to the fullest is the best gift sobriety has given me and I want everyone to know anything is possible if you put your recovery first."`,
  },
  {
    id: "justin",
    name: "Justin Yoken",
    role: "Recovery Coach & Co-Founder",
    photo: TEAM.justin1,
    bio: `Justin Yoken has been working in treatment since 2016. He has worked as a Recovery Coach, Program Director, Assistant Director and eventually became the Director of an aftercare which included a coaching team and sober living houses. He got certified as a Peer Recovery Support Specialist in 2016 by the State of Texas. In addition, he has worked with hundreds of families over the past seven years assisting their journey with establishing new boundaries, communication patterns, and overall behaviors with their loved ones.

Justin got sober in 2014 and lives the recovery lifestyle himself, which allows him to transmit the behaviors more easily due to walking the same path as many of his clients. Justin enjoys working out, sports, live music, and spending time with his family and friends.`,
    quote: `"Recovery has given me more than I could ever expect and I am so grateful that I was given the opportunity to get sober and be in recovery. If I was able to do it after ten years of substance use, then so can anyone."`,
  },
  {
    id: "matthew",
    name: "Matthew Harvey-Parrish",
    role: "Recovery Coach",
    photo: TEAM.matthew1,
    bio: `Matthew, born and raised in Austin, Texas, found recovery in December of 2020. Matthew's favorite part of being in recovery is being immersed in a community that gave him a space to gain clarity, purpose, and an ability to help others find the same. Matthew enjoys working out, time with his family, live music, and sports.`,
    quote: `"My biggest blessings in recovery have been the ability to mend relationships, building a family, becoming the man I was meant to be, and getting to witness others do the same."`,
  },
  {
    id: "damian",
    name: "Damian Vickers",
    role: "Recovery Coach",
    photo: TEAM.damian1,
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas faucibus mollis interdum. Nullam id dolor id nibh ultricies vehicula ut id elit. Donec ullamcorper nulla non metus auctor fringilla. Cras mattis consectetur purus sit amet fermentum. Vestibulum id ligula porta felis euismod semper. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam porta sem malesuada magna mollis euismod. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nulla vitae elit libero, a pharetra augue.",
    quote: null,
  },
];

function TeamBios() {
  const ref = useRef(null);
  useScrollReveal(ref, "[data-bio-card]", { y: 40, duration: 0.8, stagger: 0.15 });

  return (
    <section ref={ref} className="section-pad py-24 md:py-32 bg-surface-100">
      <div className="text-center max-w-xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-5 tracking-wide">
          Meet the Team
        </div>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-navy tracking-tight leading-tight">
          A{" "}
          <span className="font-drama italic text-brand-500">small team</span>
          {" "}with a big commitment.
        </h2>
      </div>

      <div className="space-y-16">
        {COACHES.map((coach, i) => (
          <div
            key={coach.id}
            id={coach.id}
            data-bio-card
            className="scroll-mt-32"
          >
            <div
              className={`grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center ${
                i % 2 === 1 ? "lg:direction-rtl" : ""
              }`}
            >
              {/* Photo — 2 of 5 cols */}
              <div
                className={`lg:col-span-2 ${
                  i % 2 === 1 ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <div className="relative rounded-3xl overflow-hidden aspect-[3/4] shadow-xl shadow-navy/10">
                  <img
                    src={coach.photo}
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Content — 3 of 5 cols */}
              <div
                className={`lg:col-span-3 ${
                  i % 2 === 1 ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-600 text-xs font-medium mb-4 tracking-wide">
                  {coach.role}
                </div>
                <h3 className="font-heading font-bold text-2xl md:text-3xl text-navy tracking-tight mb-5">
                  {coach.name}
                </h3>
                {coach.bio.split("\n\n").map((paragraph, pi) => (
                  <p
                    key={pi}
                    className="text-navy/60 text-base leading-relaxed mb-4 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
                {coach.quote && (
                  <blockquote className="mt-6 pl-5 border-l-3 border-brand-300 text-navy/50 italic text-base leading-relaxed">
                    {coach.quote}
                  </blockquote>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function AboutCTA() {
  return (
    <section className="section-pad py-24 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-heading font-bold text-2xl md:text-4xl tracking-tight">
          Ready to start your
          <span className="font-drama italic text-brand-500"> journey?</span>
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

/* ─── PAGE EXPORT ─── */
// Also export COACHES so Home page can reference the same data
export { COACHES };

export function AboutPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const timer = setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [hash]);


  return (
    <>
      <AboutHero />
      <OurStory />
      <Mission />
      <Philosophy />
      <Values />
      <TeamBios />
      <AboutCTA />
    </>
  );
}
