import { create } from "zustand";

/**
 * Events store — local state with seed data.
 * Swap the methods for API calls when backend is ready.
 */

const SEED_EVENTS = [
  {
    id: "1",
    slug: "recovery-run-zilker-park",
    title: "Recovery Run — Zilker Park",
    date: "2026-04-12",
    time: "8:00 AM",
    location: "Zilker Park, Austin TX",
    image: "https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1",
    excerpt: "Join us for a community recovery run through Zilker Park. All paces welcome — walk, jog, or run. Followed by coffee and connection.",
    body: `## About This Event

Join Brain Food Recovery Services for a community recovery run through one of Austin's most beautiful parks. Whether you walk, jog, or run — everyone is welcome.

### What to Expect

- **8:00 AM** — Meet at the Zilker Park trailhead (near Barton Springs Rd entrance)
- **8:15 AM** — Group warm-up and introductions
- **8:30 AM** — Run/walk begins (3-mile loop, go at your own pace)
- **9:30 AM** — Post-run coffee, snacks, and connection at the pavilion

### Who Should Attend

This event is open to anyone in recovery, anyone supporting someone in recovery, or anyone curious about the recovery community. No experience necessary — just show up.

### What to Bring

- Comfortable shoes and clothes
- Water bottle
- A friend (optional but encouraged)

This event is free and open to the public. No registration required.`,
    category: "Community",
    published: true,
  },
  {
    id: "2",
    slug: "family-workshop-boundaries",
    title: "Family Workshop: Healthy Boundaries",
    date: "2026-04-19",
    time: "10:00 AM – 12:00 PM",
    location: "Brain Food Office, Austin TX",
    image: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1",
    excerpt: "A hands-on workshop for families navigating recovery. Learn practical tools for communication, boundary-setting, and self-care.",
    body: `## About This Event

Substance use and mental health challenges affect the entire family system. This workshop is designed to help families move from confusion and fear to clarity and confidence.

### Topics Covered

- Understanding substance use disorder and mental health
- Healthy communication patterns
- Setting boundaries without guilt
- Reducing burnout and emotional overwhelm
- How to support recovery without enabling

### Format

This is an interactive, small-group workshop led by the Brain Food coaching team. We keep groups small so everyone has space to ask questions and share.

### Details

- **Date:** April 19, 2026
- **Time:** 10:00 AM – 12:00 PM
- **Location:** Brain Food Office, Austin TX
- **Cost:** Free
- **RSVP:** Email info@brainfoodrecovery.com to reserve your spot (limited to 15 families)`,
    category: "Workshop",
    published: true,
  },
  {
    id: "3",
    slug: "live-music-recovery-night",
    title: "Live Music & Recovery Night",
    date: "2026-05-03",
    time: "7:00 PM",
    location: "The Mohawk, Austin TX",
    image: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1",
    excerpt: "An evening of live music, connection, and sober fun. Proving that recovery can be exciting, social, and full of life.",
    body: `## About This Event

Recovery is about building a life worth living — and that includes having fun. Join us for an evening of live local music at one of Austin's most iconic venues.

### Why This Matters

One of the biggest challenges in early recovery is learning how to enjoy social events without substances. This event is a chance to practice exactly that — in a supportive, judgment-free environment.

### Details

- **Date:** May 3, 2026
- **Doors:** 7:00 PM
- **Music:** 8:00 PM – 10:30 PM
- **Location:** The Mohawk, Austin TX
- **Cost:** Free for Brain Food clients, $10 suggested donation for others

### What to Expect

- Live performances from local Austin artists
- Non-alcoholic drinks available
- Brain Food team members present for support
- A genuinely good time

Open to anyone in recovery or supportive of recovery. Bring friends.`,
    category: "Social",
    published: true,
  },
];

let nextId = 4;

export const useEventsStore = create((set, get) => ({
  events: SEED_EVENTS,

  getPublishedEvents: () =>
    get()
      .events.filter((e) => e.published)
      .sort((a, b) => new Date(a.date) - new Date(b.date)),

  getEventBySlug: (slug) => get().events.find((e) => e.slug === slug),

  getEventById: (id) => get().events.find((e) => e.id === id),

  createEvent: (data) => {
    const id = String(nextId++);
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const event = { ...data, id, slug, published: data.published ?? false };
    set((s) => ({ events: [...s.events, event] }));
    return event;
  },

  updateEvent: (id, data) => {
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
  },

  deleteEvent: (id) => {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));
