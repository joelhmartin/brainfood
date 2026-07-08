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
