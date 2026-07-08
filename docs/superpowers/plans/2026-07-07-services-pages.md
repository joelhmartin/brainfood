# Services Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5 `ComingSoonPage` service-route stubs with real, data-driven service detail pages plus a `/services` index page, matching the existing marketing design system.

**Architecture:** One content config (`services.js`) drives one reusable `ServiceDetail` template (rendered by a dynamic `/services/:slug` route) and one `Services` index page. Styling, scroll-reveal, and layout patterns are copied from the existing `About.jsx`. Nav "Services" becomes clickable to the index while keeping its dropdown.

**Tech Stack:** React 18, React Router 7, Tailwind CSS 3, GSAP 3, lucide-react, Vite 6, vitest 2.

## Global Constraints

- **No new npm dependencies.** Use only what is already in `package.json`.
- **No new claims:** copy must not invent credentials, licenses, certifications, or outcome/efficacy statistics. Voice = empathetic + direct + lived-experience, matching `src/pages/marketing/About.jsx`.
- **Slugs are fixed** and must match existing routes/nav exactly: `coaching`, `sober-companion`, `experiential`, `family`, `collaborative`.
- **Reuse the existing design system** classes: `navy`, `brand-100/300/400/500/600`, `surface-100/200/300`, `font-heading`, `font-drama`, `font-mono`, `section-pad`, `rounded-3xl`, brand pill badges, `btn-magnetic`.
- **Images** come from `SERVICES` in `src/config/images.js` — no new image files. `experiential` uses the `hiking` key.
- Copy is **draft** for later review.

---

### Task 1: Services content model + `getService` helper (TDD)

**Files:**
- Create: `src/config/services.js`
- Test: `src/config/services.test.js`

**Interfaces:**
- Consumes: `SERVICES` from `src/config/images.js` (string URLs); icon components from `lucide-react`.
- Produces:
  - `SERVICES_CONTENT` — ordered `Array<Service>` where
    `Service = { slug: string, navLabel: string, title: string, accent: string, tagline: string, intro: string[], lookLike: string[], whoFor: string[], cardBlurb: string, image: string, icon: React.ComponentType }`.
  - `getService(slug: string): Service | undefined`.
  - `SERVICE_SLUGS: string[]` — the slugs in order.

- [ ] **Step 1: Write the failing test**

Create `src/config/services.test.js`:

```js
import { describe, it, expect } from "vitest";
import { SERVICES_CONTENT, SERVICE_SLUGS, getService } from "./services.js";

const EXPECTED_SLUGS = [
  "coaching",
  "sober-companion",
  "experiential",
  "family",
  "collaborative",
];

describe("services config", () => {
  it("exposes exactly the 5 expected slugs in order", () => {
    expect(SERVICE_SLUGS).toEqual(EXPECTED_SLUGS);
    expect(SERVICES_CONTENT.map((s) => s.slug)).toEqual(EXPECTED_SLUGS);
  });

  it("every service has all required fields populated", () => {
    for (const s of SERVICES_CONTENT) {
      expect(typeof s.slug).toBe("string");
      expect(s.navLabel).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.accent).toBeTruthy();
      expect(s.tagline).toBeTruthy();
      expect(Array.isArray(s.intro) && s.intro.length >= 2).toBe(true);
      expect(Array.isArray(s.lookLike) && s.lookLike.length >= 4).toBe(true);
      expect(Array.isArray(s.whoFor) && s.whoFor.length >= 3).toBe(true);
      expect(s.cardBlurb).toBeTruthy();
      expect(typeof s.image).toBe("string");
      expect(s.image.length).toBeGreaterThan(0);
      expect(s.icon).toBeTruthy();
    }
  });

  it("getService returns the matching service or undefined", () => {
    expect(getService("coaching")?.navLabel).toBe(
      "Recovery & Mental Health Coaching"
    );
    expect(getService("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/config/services.test.js`
Expected: FAIL — cannot resolve `./services.js` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/config/services.js`:

```js
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVICES CONTENT — single source of truth for the service pages.
 *
 * Drives /services (index) and /services/:slug (detail template).
 * Copy is DRAFT — written in the Brain Food voice for later review.
 * Slugs MUST match the routes in App.jsx and the nav dropdown in Navbar.jsx.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import {
  MessageCircleHeart,
  Footprints,
  Mountain,
  Users,
  HeartHandshake,
} from "lucide-react";
import { SERVICES } from "./images.js";

export const SERVICES_CONTENT = [
  {
    slug: "coaching",
    navLabel: "Recovery & Mental Health Coaching",
    title: "One-on-one coaching for",
    accent: "real-world recovery.",
    tagline:
      "Personalized recovery and mental health coaching that turns insight into daily, livable action.",
    intro: [
      "Our coaching pairs you with someone who has walked this road and knows the terrain. We meet you where you are—no shame, no judgment—and work side by side to build the skills, structure, and support that make recovery sustainable.",
      "This is practical, action-oriented work. Together we set concrete goals, build routines that hold up under pressure, and practice the tools you need for the hard days. We tell the truth with care, helping you see blind spots and take ownership without losing your footing.",
      "Whether you are early in recovery or rebuilding a life with more meaning, coaching gives you a consistent, honest ally focused on where you want to go next.",
    ],
    lookLike: [
      "Regular one-on-one sessions built around your goals and schedule",
      "Practical skill-building: routines, boundaries, coping tools, accountability",
      "Support that meets multiple pathways—abstinence, harm reduction, or a plan that fits you",
      "Honest, compassionate feedback that helps you spot and work through blind spots",
      "Real-world practice between sessions, not just conversation in a room",
    ],
    whoFor: [
      "Individuals navigating substance use disorder or mental health challenges",
      "People who want structure and accountability alongside genuine support",
      "Anyone rebuilding stability, confidence, and a sense of purpose",
    ],
    cardBlurb:
      "Personalized one-on-one coaching that turns insight into daily action.",
    image: SERVICES.coaching,
    icon: MessageCircleHeart,
  },
  {
    slug: "sober-companion",
    navLabel: "Sober Companion Services",
    title: "A steady presence for",
    accent: "high-stakes moments.",
    tagline:
      "In-person support during transitions, travel, and the early days when connection matters most.",
    intro: [
      "A sober companion is a trusted presence by your side through the moments that feel most fragile—the first weeks home, a return to work, travel, or a major life transition. We provide structure, accountability, and real companionship when you need it most.",
      "Our companions bring lived experience and calm, practical support. We help you build a daily rhythm, navigate triggers in real time, and stay connected to the plan you have set for yourself—all while respecting your dignity and independence.",
      "This is short-term, intensive support designed to bridge you safely into a stable, self-directed life.",
    ],
    lookLike: [
      "In-person companionship during early recovery or high-risk transitions",
      "Support with daily structure, routines, and healthy habits",
      "Real-time help navigating triggers, cravings, and difficult situations",
      "Accompaniment for travel, events, or returning to work and home life",
      "A bridge to longer-term coaching and community support",
    ],
    whoFor: [
      "People in early recovery who want close, in-person support",
      "Anyone facing a high-risk transition, event, or trip",
      "Families seeking a trusted, experienced presence for a loved one",
    ],
    cardBlurb:
      "Trusted in-person support through transitions, travel, and early recovery.",
    image: SERVICES.soberCompanion,
    icon: Footprints,
  },
  {
    slug: "experiential",
    navLabel: "Experiential Integration",
    title: "Recovery that moves",
    accent: "into real life.",
    tagline:
      "Getting outside the room—building confidence and connection through shared, real-world experience.",
    intro: [
      "Lasting change is built in real life, not just in conversation. Experiential integration takes the work outdoors and into the world—hikes, activities, and shared experiences that rebuild confidence, connection, and a sense of what a meaningful sober life can feel like.",
      "We use these experiences to practice new skills where they actually matter: managing stress, staying present, working through discomfort, and rediscovering joy without substances. It is recovery you can feel in your body, not just talk about.",
      "Each experience is chosen with intention and paired with reflection, so the growth carries back into everyday life.",
    ],
    lookLike: [
      "Guided outdoor and activity-based sessions—hiking, movement, shared adventures",
      "Skill practice in real settings: stress, presence, discomfort, and connection",
      "Rediscovering purpose, play, and joy in a substance-free life",
      "Reflection that ties each experience back to your day-to-day goals",
      "Building genuine connection and confidence through shared challenge",
    ],
    whoFor: [
      "People who grow through doing, not just talking",
      "Anyone reconnecting with purpose, play, and community in recovery",
      "Clients ready to practice new skills in real-world settings",
    ],
    cardBlurb:
      "Outdoor, activity-based sessions that rebuild confidence and connection.",
    image: SERVICES.hiking,
    icon: Mountain,
  },
  {
    slug: "family",
    navLabel: "Family Coaching & Support",
    title: "Support for the",
    accent: "whole family.",
    tagline:
      "Helping families set boundaries, rebuild trust, and communicate through recovery together.",
    intro: [
      "Recovery affects the whole family, and families heal best when they have support of their own. We work with parents, partners, and loved ones to establish healthy boundaries, improve communication, and rebuild trust over time.",
      "Drawing on years of work with hundreds of families, we help you understand the dynamics of substance use disorder, respond in ways that support recovery rather than enable it, and take care of your own well-being in the process.",
      "You do not have to navigate this alone. We give families a clear, compassionate framework and a steady guide through it.",
    ],
    lookLike: [
      "Coaching for parents, partners, and loved ones—together or individually",
      "Guidance on healthy boundaries and consistent, supportive responses",
      "Tools to improve communication and rebuild trust over time",
      "Education on substance use disorder and the recovery process",
      "Support for the family's own well-being, not just the person in recovery",
    ],
    whoFor: [
      "Parents, partners, and loved ones of someone facing addiction",
      "Families wanting to set boundaries without losing connection",
      "Anyone seeking to communicate and rebuild trust through recovery",
    ],
    cardBlurb:
      "Coaching for loved ones—boundaries, communication, and rebuilding trust.",
    image: SERVICES.family,
    icon: Users,
  },
  {
    slug: "collaborative",
    navLabel: "Collaborative Care",
    title: "A team that works",
    accent: "together for you.",
    tagline:
      "Coordinating with your clinicians and professional partners so your care is aligned, not scattered.",
    intro: [
      "Recovery works best when everyone supporting you is on the same page. Collaborative care means we coordinate closely with your therapists, clinicians, treatment programs, and other professional partners so your support is aligned and consistent.",
      "We act as a connective thread across your care team—sharing observations, reinforcing your treatment goals, and making sure nothing falls through the cracks between appointments and providers.",
      "With your consent at every step, we help build a coordinated circle of support around you, so the whole system is working toward the same goal: a stable, meaningful life.",
    ],
    lookLike: [
      "Coordination with your therapists, clinicians, and treatment programs",
      "Reinforcement of your existing treatment goals between appointments",
      "Clear communication across your care team, with your consent",
      "A single connective thread so support stays aligned, not scattered",
      "Referrals and warm hand-offs to trusted professional partners",
    ],
    whoFor: [
      "Clients already working with clinical or treatment providers",
      "Families who want their loved one's support team coordinated",
      "Anyone who wants their whole circle of care aligned on one plan",
    ],
    cardBlurb:
      "Coordinated support that keeps your clinicians and care team aligned.",
    image: SERVICES.collaborative,
    icon: HeartHandshake,
  },
];

export const SERVICE_SLUGS = SERVICES_CONTENT.map((s) => s.slug);

export function getService(slug) {
  return SERVICES_CONTENT.find((s) => s.slug === slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/config/services.test.js`
Expected: PASS — 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/config/services.js src/config/services.test.js
git commit -m "feat: add services content config + getService helper"
```

---

### Task 2: `ServiceDetail` page template

**Files:**
- Create: `src/pages/marketing/ServiceDetail.jsx`

**Interfaces:**
- Consumes: `getService`, `SERVICES_CONTENT` from `src/config/services.js`; `useParams`, `Link`, `Navigate` from `react-router-dom`; `AUSTIN` from `src/config/images.js`.
- Produces: `export function ServiceDetailPage()` — default marketing page component; reads `:slug` from the route.

- [ ] **Step 1: Write the component**

Create `src/pages/marketing/ServiceDetail.jsx`:

```jsx
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
```

- [ ] **Step 2: Verify the module builds (import/resolution gate)**

Run: `npm run build`
Expected: build completes with no errors (no unresolved imports, valid JSX). The new file is not yet routed, so this only proves it compiles.

- [ ] **Step 3: Commit**

```bash
git add src/pages/marketing/ServiceDetail.jsx
git commit -m "feat: add reusable ServiceDetail page template"
```

---

### Task 3: `Services` index page

**Files:**
- Create: `src/pages/marketing/Services.jsx`

**Interfaces:**
- Consumes: `SERVICES_CONTENT` from `src/config/services.js`; `AUSTIN` from `src/config/images.js`; `Link` from `react-router-dom`.
- Produces: `export function ServicesPage()` — marketing index page.

- [ ] **Step 1: Write the component**

Create `src/pages/marketing/Services.jsx`:

```jsx
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { AUSTIN } from "../../config/images.js";
import { SERVICES_CONTENT } from "../../config/services.js";

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
      <div className="relative z-10 section-pad pb-16 md:pb-24 max-w-4xl">
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
    <section ref={ref} className="section-pad py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
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

/* ─── CTA ─── */
function ServicesCTA() {
  return (
    <section className="section-pad py-24 md:py-32 bg-surface-100">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-heading font-bold text-2xl md:text-4xl tracking-tight">
          Not sure where to
          <span className="font-drama italic text-brand-500 text-3xl md:text-5xl">
            {" "}
            start?
          </span>
        </h2>
        <p className="mt-4 text-navy/50 text-base max-w-lg mx-auto leading-relaxed">
          Reach out for a confidential conversation and we'll help you find the
          right fit—for you or your loved one.
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
export function ServicesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <ServicesHero />
      <ServicesGrid />
      <ServicesCTA />
    </>
  );
}
```

- [ ] **Step 2: Verify the module builds**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/marketing/Services.jsx
git commit -m "feat: add Services index page"
```

---

### Task 4: Wire routes in `App.jsx`

**Files:**
- Modify: `src/App.jsx` (imports near lines 27-38; routes near lines 91-96)

**Interfaces:**
- Consumes: `ServicesPage` from `./pages/marketing/Services.jsx`; `ServiceDetailPage` from `./pages/marketing/ServiceDetail.jsx`.
- Produces: routes `/services` and `/services/:slug`.

- [ ] **Step 1: Add the imports**

In `src/App.jsx`, in the "Marketing pages" import block (after the `ComingSoonPage` import, around line 34), add:

```jsx
import { ServicesPage } from "./pages/marketing/Services.jsx";
import { ServiceDetailPage } from "./pages/marketing/ServiceDetail.jsx";
```

- [ ] **Step 2: Replace the 5 service stub routes with the index + dynamic route**

In `src/App.jsx`, replace this exact block:

```jsx
        {/* Services routes */}
        <Route path="/services/coaching"          element={<ComingSoonPage />} />
        <Route path="/services/sober-companion"   element={<ComingSoonPage />} />
        <Route path="/services/experiential"      element={<ComingSoonPage />} />
        <Route path="/services/family"            element={<ComingSoonPage />} />
        <Route path="/services/collaborative"     element={<ComingSoonPage />} />
```

with:

```jsx
        {/* Services routes */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:slug" element={<ServiceDetailPage />} />
```

(Leave the `/about/team` and `/resources/videos` `ComingSoonPage` routes below unchanged. `ComingSoonPage` is still imported and used by those, so do not remove its import.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Verify routes resolve at runtime**

The dev server is running at http://localhost:5173. Confirm these load without a blank screen or console error (visual check in the browser):
`/services`, `/services/coaching`, `/services/sober-companion`, `/services/experiential`, `/services/family`, `/services/collaborative`, and that `/services/bogus` redirects to `/services`.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: route /services and /services/:slug to new pages"
```

---

### Task 5: Make nav "Services" clickable + mobile index link

**Files:**
- Modify: `src/components/marketing/Navbar.jsx` (NAV_LINKS ~lines 8-23; `NavItem` ~lines 55-107; `MobileOverlay` children block ~lines 189-223; `isActive` ~lines 271-275)

**Interfaces:**
- Consumes: existing `NAV_LINKS`, `NavItem`, `MobileOverlay`.
- Produces: "Services" parent nav item with `to: "/services"` that still opens its dropdown on hover, and a mobile "All Services" link.

- [ ] **Step 1: Add `to` to the Services parent in NAV_LINKS**

In `src/components/marketing/Navbar.jsx`, change the Services entry so the parent has a `to`:

```jsx
  {
    label: "Services",
    to: "/services",
    children: [
      { label: "Recovery & Mental Health Coaching", to: "/services/coaching" },
      { label: "Sober Companion Services",          to: "/services/sober-companion" },
      { label: "Experiential Integration",          to: "/services/experiential" },
      { label: "Family Coaching & Support",         to: "/services/family" },
      { label: "Collaborative Care",                to: "/services/collaborative" },
    ],
  },
```

- [ ] **Step 2: Make `NavItem` render a clickable parent when it has both `to` and `children`**

In `NavItem`, replace the `<button>` trigger (the element rendering `link.label` + `ChevronDown`) so it becomes a `Link` when `link.to` exists. Replace this block:

```jsx
      <button className={`${baseClass} ${colorClass}`}>
        {link.label}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
```

with:

```jsx
      {link.to ? (
        <Link to={link.to} className={`${baseClass} ${colorClass}`}>
          {link.label}
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </Link>
      ) : (
        <button className={`${baseClass} ${colorClass}`}>
          {link.label}
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}
```

(`Link` is already imported at the top of the file. The wrapping `div` with `onMouseEnter`/`onMouseLeave` still controls the hover dropdown, so hover continues to reveal children while a click navigates to `/services`.)

- [ ] **Step 3: Add an "All Services" link at the top of the mobile Services submenu**

In `MobileOverlay`, inside the expanded children container, add an overview link before the mapped children. Replace:

```jsx
                <div className="pl-4 py-2 space-y-1">
                  {link.children.map((child) => (
```

with:

```jsx
                <div className="pl-4 py-2 space-y-1">
                  {link.to && (
                    <Link
                      to={link.to}
                      onClick={handleNavigate}
                      className="block py-2.5 text-base text-white/70 font-medium hover:text-brand-400 transition-colors"
                    >
                      All Services
                    </Link>
                  )}
                  {link.children.map((child) => (
```

- [ ] **Step 4: Include the parent path in `isActive`**

In the `Navbar` component's `isActive` helper, update so a parent with `to` highlights on its own path too. Replace:

```jsx
  const isActive = (link) => {
    if (link.to && location.pathname === link.to) return true;
    if (link.children) return link.children.some((c) => location.pathname === c.to);
    return false;
  };
```

with:

```jsx
  const isActive = (link) => {
    if (link.to && location.pathname === link.to) return true;
    if (link.to && location.pathname.startsWith(link.to + "/")) return true;
    if (link.children) return link.children.some((c) => location.pathname === c.to);
    return false;
  };
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Verify nav behavior at runtime**

At http://localhost:5173: desktop "Services" label navigates to `/services` on click and still shows the dropdown on hover; on a narrow viewport the mobile menu's "Services" group expands and shows "All Services" plus the 5 children, all navigating correctly.

- [ ] **Step 7: Commit**

```bash
git add src/components/marketing/Navbar.jsx
git commit -m "feat: make nav Services clickable + add mobile All Services link"
```

---

### Task 6: Full verification pass

**Files:**
- Modify: `docs/superpowers/specs/2026-07-07-services-pages-design.md` (status line)

- [ ] **Step 1: Run the unit tests**

Run: `npx vitest run`
Expected: PASS — the services config tests pass; no other tests break.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: build succeeds with no errors or unresolved imports.

- [ ] **Step 3: Manual route + console check**

At http://localhost:5173, load each of `/services`, `/services/coaching`, `/services/sober-companion`, `/services/experiential`, `/services/family`, `/services/collaborative`, and `/services/bogus` (should redirect to `/services`). Confirm no console errors and images load.

- [ ] **Step 4: Mark spec approved-implemented and commit**

Update the `**Status:**` line in the design spec to `Implemented`, then:

```bash
git add docs/superpowers/specs/2026-07-07-services-pages-design.md
git commit -m "docs: mark services pages spec implemented"
```

---

## Self-Review Notes

- **Spec coverage:** content model (Task 1), ServiceDetail template with all 6 sections (Task 2), Services index (Task 3), routing incl. `/services` + dynamic slug + unknown-slug redirect (Tasks 2/4), nav clickable parent + mobile index (Task 5), build/route/console verification (Task 6). All spec sections mapped.
- **Placeholders:** none — full config copy and full component source included.
- **Type consistency:** `getService`, `SERVICES_CONTENT`, `SERVICE_SLUGS`, and the `Service` field names are used identically across Tasks 1–3. Component exports: `ServiceDetailPage`, `ServicesPage` — matched in Task 4 imports.
- **Dependency constraint:** no new packages; tests run under the already-installed vitest in node env (no DOM/RTL needed for the pure-JS config test).
