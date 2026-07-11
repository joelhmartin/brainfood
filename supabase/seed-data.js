/**
 * Seed content — the events, posts, and site settings that previously lived
 * hardcoded in src/stores/*.store.js and src/config/site.js.
 *
 * Consumed by scripts/seed-content.mjs, which upserts by slug and is therefore
 * safe to re-run. Editing content here does NOT change the live site once it is
 * in the database — use the dashboard for that. This file exists to bootstrap a
 * fresh database (local dev, or the production project on first deploy).
 */

export const EVENTS = [
  {
    slug: "recovery-run-zilker-park",
    title: "Recovery Run — Zilker Park",
    date: "2026-04-12",
    time: "8:00 AM",
    location: "Zilker Park, Austin TX",
    image_url:
      "https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1",
    excerpt:
      "Join us for a community recovery run through Zilker Park. All paces welcome — walk, jog, or run. Followed by coffee and connection.",
    category: "Community",
    published: true,
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
  },
  {
    slug: "family-workshop-boundaries",
    title: "Family Workshop: Healthy Boundaries",
    date: "2026-04-19",
    time: "10:00 AM – 12:00 PM",
    location: "Brain Food Office, Austin TX",
    image_url:
      "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1",
    excerpt:
      "A hands-on workshop for families navigating recovery. Learn practical tools for communication, boundary-setting, and self-care.",
    category: "Workshop",
    published: true,
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
  },
  {
    slug: "live-music-recovery-night",
    title: "Live Music & Recovery Night",
    date: "2026-05-03",
    time: "7:00 PM",
    location: "The Mohawk, Austin TX",
    image_url:
      "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800&dpr=1",
    excerpt:
      "An evening of live music, connection, and sober fun. Proving that recovery can be exciting, social, and full of life.",
    category: "Social",
    published: true,
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
  },
];

export const POSTS = [
  {
    slug: "what-is-recovery-coaching",
    title: "What Is Recovery Coaching? A Practical Guide",
    date: "2026-03-10",
    author: "charlie",
    category: "Recovery",
    tags: ["recovery coaching", "mental health", "getting started"],
    image_url:
      "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    excerpt:
      "Recovery coaching is a hands-on, real-world approach to building stability after treatment. Here's what it looks like, who it's for, and why it works.",
    read_time: 4,
    published: true,
    featured: true,
    body: `## What Is Recovery Coaching?

Recovery coaching is a structured, relationship-based support service designed to help individuals build and sustain recovery from substance use disorder and mental health challenges. Unlike therapy, which focuses primarily on clinical diagnosis and treatment, recovery coaching focuses on practical application — translating insight into daily action.

### How It's Different from Therapy

Therapy and recovery coaching serve different but complementary roles:

- **Therapy** addresses clinical diagnosis, trauma processing, and psychological treatment
- **Recovery coaching** focuses on daily structure, accountability, goal-setting, and real-world skill building
- **Together** they create a comprehensive support system that covers both the clinical and practical sides of recovery

### What Does a Recovery Coaching Session Look Like?

A typical session might include:

- Reviewing the past week — wins, challenges, and patterns
- Setting short-term, achievable goals for the coming week
- Working through specific life skills — budgeting, time management, job searching
- Processing real-life situations and developing healthier responses
- Building daily routines that support stability

### Who Is Recovery Coaching For?

Recovery coaching works well for:

- Individuals transitioning out of treatment or institutional settings
- People in early recovery who need structure and accountability
- Anyone navigating substance use disorder or mental health challenges who wants hands-on, real-world support
- Families who want guidance on how to support their loved one

### The Brain Food Approach

At Brain Food Recovery Services, our coaching is grounded in lived experience. Our coaches have walked this path themselves, which allows them to connect authentically and deliver support that is both compassionate and honest.

We believe recovery is built through practical skills, supportive relationships, and consistent real-world application — not just insight alone.`,
  },
  {
    slug: "5-daily-habits-that-support-recovery",
    title: "5 Daily Habits That Actually Support Long-Term Recovery",
    date: "2026-03-18",
    author: "justin",
    category: "Wellness",
    tags: ["daily habits", "routine", "self-care", "practical tips"],
    image_url:
      "https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    excerpt:
      "Recovery isn't just about avoiding substances — it's about building a life that supports sobriety every single day. These five habits make a real difference.",
    read_time: 5,
    published: true,
    featured: false,
    body: `## Why Daily Habits Matter in Recovery

Recovery is built in the small moments — the morning routine, the afternoon walk, the evening reflection. The big decisions matter, but it's the daily habits that create the foundation everything else stands on.

Here are five habits that we see make a real, measurable difference in our clients' lives.

### 1. Move Your Body Every Day

This doesn't mean you need to train for a marathon. A 20-minute walk, a trip to the gym, or even stretching in your living room counts. Physical movement:

- Reduces anxiety and depression symptoms
- Improves sleep quality
- Builds confidence and self-esteem
- Provides healthy dopamine

The key is consistency, not intensity.

### 2. Build a Morning Routine

How you start your day sets the tone for everything that follows. A simple morning routine might include:

- Waking up at the same time each day
- Making your bed
- Eating breakfast
- 10 minutes of reading, journaling, or meditation
- Reviewing your goals for the day

The routine itself matters less than the consistency. Structure creates safety.

### 3. Stay Connected to Your Support Network

Isolation is one of the biggest risk factors in recovery. Make it a daily practice to connect with at least one person in your support network — a coach, a sponsor, a friend in recovery, or a family member.

This doesn't have to be a deep conversation. A text, a phone call, or a quick coffee counts.

### 4. Practice Financial Awareness

Money stress is a major trigger. Even simple financial habits make a difference:

- Check your bank balance daily
- Track your spending (even roughly)
- Avoid impulsive purchases — give yourself a 24-hour rule
- Build a small emergency fund, even if it's $5 at a time

Financial stability creates emotional stability.

### 5. End Your Day with Reflection

Before bed, take five minutes to reflect:

- What went well today?
- What was challenging?
- What am I grateful for?
- What's one thing I want to do differently tomorrow?

This isn't about being perfect. It's about building awareness and momentum.

## The Bigger Picture

None of these habits are complicated. But done consistently, they create the kind of structure and stability that makes long-term recovery possible. Start with one. Build from there.`,
  },
  {
    slug: "supporting-a-loved-one-in-recovery",
    title: "How to Support a Loved One in Recovery Without Enabling",
    date: "2026-03-24",
    author: "charlie",
    category: "Family",
    tags: ["family support", "boundaries", "enabling", "communication"],
    image_url:
      "https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    excerpt:
      "Loving someone in recovery is complicated. You want to help — but how do you support without enabling? Here's a framework that actually works.",
    read_time: 5,
    published: true,
    featured: false,
    body: `## The Support vs. Enabling Question

This is the question every family member asks: "Am I helping, or am I making it worse?"

The truth is, the line between support and enabling isn't always obvious. But there are clear principles that can guide you.

### What Enabling Looks Like

Enabling is any action that protects someone from the natural consequences of their choices. Common examples:

- Paying bills they should be paying themselves
- Making excuses for their behavior to others
- Avoiding difficult conversations to "keep the peace"
- Repeatedly bailing them out of situations they created
- Walking on eggshells around their emotions

Enabling comes from love. But it prevents growth.

### What Healthy Support Looks Like

Healthy support respects both your boundaries and their autonomy:

- Being honest about what you see — with compassion, not judgment
- Letting them experience natural consequences (while staying emotionally available)
- Setting clear boundaries and following through consistently
- Educating yourself about substance use disorder and mental health
- Taking care of your own mental health and wellbeing

### Practical Steps for Families

**Start with yourself.** You cannot pour from an empty cup. Get your own support — whether that's therapy, a family support group, or working with a family coach.

**Set boundaries in advance.** Don't wait for a crisis. Decide what you will and won't accept, communicate it clearly, and stick to it.

**Separate the person from the disease.** Your loved one is not their addiction. Holding that distinction helps you stay connected without condoning harmful behavior.

**Celebrate progress, not perfection.** Recovery is not linear. Acknowledge the steps forward, even when they're small.

**Ask for help.** You don't have to figure this out alone. Family coaching exists specifically to help you navigate these situations with confidence.

## You're Not Alone

At Brain Food Recovery Services, we work with families every day. The confusion, the fear, the guilt — we understand it. And we can help you move from reactive to proactive, from overwhelmed to empowered.

Reach out anytime. The conversation is always confidential.`,
  },
];

/**
 * NOTE: `phone` and `google_review` below are placeholders carried over from
 * src/config/site.js. (512) 555-0192 is not a real number — 555 numbers are
 * reserved for fiction. Structured data omits blank fields, so these are left
 * EMPTY rather than seeded with fake values: publishing a fake phone number in
 * LocalBusiness schema creates NAP inconsistency and hurts local search ranking.
 * Fill them in from the dashboard Settings page.
 */
export const SITE_SETTINGS = {
  id: 1,
  name: "Brain Food Recovery Services",
  short_name: "Brain Food",
  tagline: "Practical Support. Real Connection. Lasting Change.",
  description:
    "Personalized recovery coaching, mental health coaching, and sober companion services for individuals and families navigating substance use disorder and mental health challenges.",
  city: "Austin",
  state: "Texas",
  address: "",
  founded: 2023,

  phone: "",
  email: "info@brainfoodrecovery.com",
  hours: "Mon–Fri, 9:00 AM – 5:00 PM CST",

  google_maps: "https://maps.google.com/?q=Austin+TX",
  google_review: "",

  socials: [
    {
      label: "Facebook",
      href: "https://www.facebook.com/p/Brain-Food-Recovery-Services-100089801555087/",
    },
    { label: "Instagram", href: "https://www.instagram.com/brainfoodrecovery/" },
  ],

  site_url: "",
  title_template: "%s | Brain Food Recovery Services",
  default_title: "Brain Food Recovery Services — Recovery Coaching in Austin, TX",
  default_desc:
    "Personalized recovery coaching, mental health coaching, and sober companion services. Practical support. Real connection. Lasting change.",
  og_image_url: null,

  ga_measurement_id: "",
  gsc_verification: "",

  // OFF until the site lives on its production domain.
  seo_indexable: false,
};
