import { create } from "zustand";

/**
 * Blog posts store — local state with seed data.
 * Swap methods for API calls when backend is ready.
 */

const SEED_POSTS = [
  {
    id: "1",
    slug: "what-is-recovery-coaching",
    title: "What Is Recovery Coaching? A Practical Guide",
    date: "2026-03-10",
    author: "charlie",
    category: "Recovery",
    tags: ["recovery coaching", "mental health", "getting started"],
    image: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    excerpt: "Recovery coaching is a hands-on, real-world approach to building stability after treatment. Here's what it looks like, who it's for, and why it works.",
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
    readTime: 4,
    published: true,
    featured: true,
  },
  {
    id: "2",
    slug: "5-daily-habits-that-support-recovery",
    title: "5 Daily Habits That Actually Support Long-Term Recovery",
    date: "2026-03-18",
    author: "justin",
    category: "Wellness",
    tags: ["daily habits", "routine", "self-care", "practical tips"],
    image: "https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    excerpt: "Recovery isn't just about avoiding substances — it's about building a life that supports sobriety every single day. These five habits make a real difference.",
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
    readTime: 5,
    published: true,
    featured: false,
  },
  {
    id: "3",
    slug: "supporting-a-loved-one-in-recovery",
    title: "How to Support a Loved One in Recovery Without Enabling",
    date: "2026-03-24",
    author: "charlie",
    category: "Family",
    tags: ["family support", "boundaries", "enabling", "communication"],
    image: "https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    excerpt: "Loving someone in recovery is complicated. You want to help — but how do you support without enabling? Here's a framework that actually works.",
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
    readTime: 5,
    published: true,
    featured: false,
  },
];

let nextId = 4;

export const usePostsStore = create((set, get) => ({
  posts: SEED_POSTS,

  createPost: (data) => {
    const id = String(nextId++);
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const readTime = data.readTime || Math.max(1, Math.round((data.body || "").split(/\s+/).length / 200));
    const post = { ...data, id, slug, readTime, published: data.published ?? false, featured: data.featured ?? false };
    set((s) => ({ posts: [...s.posts, post] }));
    return post;
  },

  updatePost: (id, data) => {
    set((s) => ({
      posts: s.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
  },

  deletePost: (id) => {
    set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }));
  },
}));
