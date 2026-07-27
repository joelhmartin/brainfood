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
    body: `<h2>About This Event</h2>

<p>Join Brain Food Recovery Services for a community recovery run through one of Austin's most beautiful parks. Whether you walk, jog, or run — everyone is welcome.</p>

<h3>What to Expect</h3>

<ul>
  <li><strong>8:00 AM</strong> — Meet at the Zilker Park trailhead (near Barton Springs Rd entrance)</li>
  <li><strong>8:15 AM</strong> — Group warm-up and introductions</li>
  <li><strong>8:30 AM</strong> — Run/walk begins (3-mile loop, go at your own pace)</li>
  <li><strong>9:30 AM</strong> — Post-run coffee, snacks, and connection at the pavilion</li>
</ul>

<h3>Who Should Attend</h3>

<p>This event is open to anyone in recovery, anyone supporting someone in recovery, or anyone curious about the recovery community. No experience necessary — just show up.</p>

<h3>What to Bring</h3>

<ul>
  <li>Comfortable shoes and clothes</li>
  <li>Water bottle</li>
  <li>A friend (optional but encouraged)</li>
</ul>

<p>This event is free and open to the public. No registration required.</p>`,
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
    body: `<h2>About This Event</h2>

<p>Substance use and mental health challenges affect the entire family system. This workshop is designed to help families move from confusion and fear to clarity and confidence.</p>

<h3>Topics Covered</h3>

<ul>
  <li>Understanding substance use disorder and mental health</li>
  <li>Healthy communication patterns</li>
  <li>Setting boundaries without guilt</li>
  <li>Reducing burnout and emotional overwhelm</li>
  <li>How to support recovery without enabling</li>
</ul>

<h3>Format</h3>

<p>This is an interactive, small-group workshop led by the Brain Food coaching team. We keep groups small so everyone has space to ask questions and share.</p>

<h3>Details</h3>

<ul>
  <li><strong>Date:</strong> April 19, 2026</li>
  <li><strong>Time:</strong> 10:00 AM – 12:00 PM</li>
  <li><strong>Location:</strong> Brain Food Office, Austin TX</li>
  <li><strong>Cost:</strong> Free</li>
  <li><strong>RSVP:</strong> Email info@brainfoodrecovery.com to reserve your spot (limited to 15 families)</li>
</ul>`,
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
    body: `<h2>About This Event</h2>

<p>Recovery is about building a life worth living — and that includes having fun. Join us for an evening of live local music at one of Austin's most iconic venues.</p>

<h3>Why This Matters</h3>

<p>One of the biggest challenges in early recovery is learning how to enjoy social events without substances. This event is a chance to practice exactly that — in a supportive, judgment-free environment.</p>

<h3>Details</h3>

<ul>
  <li><strong>Date:</strong> May 3, 2026</li>
  <li><strong>Doors:</strong> 7:00 PM</li>
  <li><strong>Music:</strong> 8:00 PM – 10:30 PM</li>
  <li><strong>Location:</strong> The Mohawk, Austin TX</li>
  <li><strong>Cost:</strong> Free for Brain Food clients, $10 suggested donation for others</li>
</ul>

<h3>What to Expect</h3>

<ul>
  <li>Live performances from local Austin artists</li>
  <li>Non-alcoholic drinks available</li>
  <li>Brain Food team members present for support</li>
  <li>A genuinely good time</li>
</ul>

<p>Open to anyone in recovery or supportive of recovery. Bring friends.</p>`,
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
    body: `<h2>What Is Recovery Coaching?</h2>

<p>Recovery coaching is a structured, relationship-based support service designed to help individuals build and sustain recovery from substance use disorder and mental health challenges. Unlike therapy, which focuses primarily on clinical diagnosis and treatment, recovery coaching focuses on practical application — translating insight into daily action.</p>

<h3>How It's Different from Therapy</h3>

<p>Therapy and recovery coaching serve different but complementary roles:</p>

<ul>
  <li><strong>Therapy</strong> addresses clinical diagnosis, trauma processing, and psychological treatment</li>
  <li><strong>Recovery coaching</strong> focuses on daily structure, accountability, goal-setting, and real-world skill building</li>
  <li><strong>Together</strong> they create a comprehensive support system that covers both the clinical and practical sides of recovery</li>
</ul>

<h3>What Does a Recovery Coaching Session Look Like?</h3>

<p>A typical session might include:</p>

<ul>
  <li>Reviewing the past week — wins, challenges, and patterns</li>
  <li>Setting short-term, achievable goals for the coming week</li>
  <li>Working through specific life skills — budgeting, time management, job searching</li>
  <li>Processing real-life situations and developing healthier responses</li>
  <li>Building daily routines that support stability</li>
</ul>

<h3>Who Is Recovery Coaching For?</h3>

<p>Recovery coaching works well for:</p>

<ul>
  <li>Individuals transitioning out of treatment or institutional settings</li>
  <li>People in early recovery who need structure and accountability</li>
  <li>Anyone navigating substance use disorder or mental health challenges who wants hands-on, real-world support</li>
  <li>Families who want guidance on how to support their loved one</li>
</ul>

<h3>The Brain Food Approach</h3>

<p>At Brain Food Recovery Services, our coaching is grounded in lived experience. Our coaches have walked this path themselves, which allows them to connect authentically and deliver support that is both compassionate and honest.</p>

<p>We believe recovery is built through practical skills, supportive relationships, and consistent real-world application — not just insight alone.</p>`,
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
    body: `<h2>Why Daily Habits Matter in Recovery</h2>

<p>Recovery is built in the small moments — the morning routine, the afternoon walk, the evening reflection. The big decisions matter, but it's the daily habits that create the foundation everything else stands on.</p>

<p>Here are five habits that we see make a real, measurable difference in our clients' lives.</p>

<h3>1. Move Your Body Every Day</h3>

<p>This doesn't mean you need to train for a marathon. A 20-minute walk, a trip to the gym, or even stretching in your living room counts. Physical movement:</p>

<ul>
  <li>Reduces anxiety and depression symptoms</li>
  <li>Improves sleep quality</li>
  <li>Builds confidence and self-esteem</li>
  <li>Provides healthy dopamine</li>
</ul>

<p>The key is consistency, not intensity.</p>

<h3>2. Build a Morning Routine</h3>

<p>How you start your day sets the tone for everything that follows. A simple morning routine might include:</p>

<ul>
  <li>Waking up at the same time each day</li>
  <li>Making your bed</li>
  <li>Eating breakfast</li>
  <li>10 minutes of reading, journaling, or meditation</li>
  <li>Reviewing your goals for the day</li>
</ul>

<p>The routine itself matters less than the consistency. Structure creates safety.</p>

<h3>3. Stay Connected to Your Support Network</h3>

<p>Isolation is one of the biggest risk factors in recovery. Make it a daily practice to connect with at least one person in your support network — a coach, a sponsor, a friend in recovery, or a family member.</p>

<p>This doesn't have to be a deep conversation. A text, a phone call, or a quick coffee counts.</p>

<h3>4. Practice Financial Awareness</h3>

<p>Money stress is a major trigger. Even simple financial habits make a difference:</p>

<ul>
  <li>Check your bank balance daily</li>
  <li>Track your spending (even roughly)</li>
  <li>Avoid impulsive purchases — give yourself a 24-hour rule</li>
  <li>Build a small emergency fund, even if it's $5 at a time</li>
</ul>

<p>Financial stability creates emotional stability.</p>

<h3>5. End Your Day with Reflection</h3>

<p>Before bed, take five minutes to reflect:</p>

<ul>
  <li>What went well today?</li>
  <li>What was challenging?</li>
  <li>What am I grateful for?</li>
  <li>What's one thing I want to do differently tomorrow?</li>
</ul>

<p>This isn't about being perfect. It's about building awareness and momentum.</p>

<h2>The Bigger Picture</h2>

<p>None of these habits are complicated. But done consistently, they create the kind of structure and stability that makes long-term recovery possible. Start with one. Build from there.</p>`,
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
    body: `<h2>The Support vs. Enabling Question</h2>

<p>This is the question every family member asks: "Am I helping, or am I making it worse?"</p>

<p>The truth is, the line between support and enabling isn't always obvious. But there are clear principles that can guide you.</p>

<h3>What Enabling Looks Like</h3>

<p>Enabling is any action that protects someone from the natural consequences of their choices. Common examples:</p>

<ul>
  <li>Paying bills they should be paying themselves</li>
  <li>Making excuses for their behavior to others</li>
  <li>Avoiding difficult conversations to "keep the peace"</li>
  <li>Repeatedly bailing them out of situations they created</li>
  <li>Walking on eggshells around their emotions</li>
</ul>

<p>Enabling comes from love. But it prevents growth.</p>

<h3>What Healthy Support Looks Like</h3>

<p>Healthy support respects both your boundaries and their autonomy:</p>

<ul>
  <li>Being honest about what you see — with compassion, not judgment</li>
  <li>Letting them experience natural consequences (while staying emotionally available)</li>
  <li>Setting clear boundaries and following through consistently</li>
  <li>Educating yourself about substance use disorder and mental health</li>
  <li>Taking care of your own mental health and wellbeing</li>
</ul>

<h3>Practical Steps for Families</h3>

<p><strong>Start with yourself.</strong> You cannot pour from an empty cup. Get your own support — whether that's therapy, a family support group, or working with a family coach.</p>

<p><strong>Set boundaries in advance.</strong> Don't wait for a crisis. Decide what you will and won't accept, communicate it clearly, and stick to it.</p>

<p><strong>Separate the person from the disease.</strong> Your loved one is not their addiction. Holding that distinction helps you stay connected without condoning harmful behavior.</p>

<p><strong>Celebrate progress, not perfection.</strong> Recovery is not linear. Acknowledge the steps forward, even when they're small.</p>

<p><strong>Ask for help.</strong> You don't have to figure this out alone. Family coaching exists specifically to help you navigate these situations with confidence.</p>

<h2>You're Not Alone</h2>

<p>At Brain Food Recovery Services, we work with families every day. The confusion, the fear, the guilt — we understand it. And we can help you move from reactive to proactive, from overwhelmed to empowered.</p>

<p>Reach out anytime. The conversation is always confidential.</p>`,
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
