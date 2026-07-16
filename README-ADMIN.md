# Admin dashboard — setup & operations

The dashboard lives at `/app`. Admins sign in at `/auth/login`.

There is **no sign-up page**, on purpose: every account is an admin account, so an open
sign-up endpoint would let a stranger create themselves a dashboard login. New admins are
invited from **Members**.

---

## What runs where

| Thing | Where it lives |
|---|---|
| Events, blog posts, admins, site settings | Supabase Postgres |
| Login, invites, password resets | Supabase Auth |
| Uploaded images | Supabase Storage (`media` bucket) |
| Inviting / removing admins | `/api/users` (Vercel function — needs the secret key) |
| Refresh pages after publishing | `/api/revalidate` (Vercel function, calls Next's `revalidatePath`) |
| Everything else | Straight from the browser to Postgres, under Row Level Security |

**Security is enforced in the database, not in React.** The policies in
`supabase/migrations/*_rls_policies.sql` mean the public can only ever read *published*
content and can never write anything — even if someone ignores the site entirely and calls
the API directly. `tests/rls.test.js` proves this against a real Postgres.

---

## Local development

```bash
npm install
npm run db:start          # local Supabase in Docker
npm run db:reset          # apply migrations + seed content
npm run create-admin you@example.com     # prints a generated password once
npm run dev                # Next dev server on :3000, API routes included
```

`npm run db:start` prints an `anon key` and a `service_role key`. Copy `.env.example` to
`.env.local` and paste them in.

Emails (invites, password resets) do **not** leave your machine locally — they land in
Mailpit at <http://127.0.0.1:54324>.

### Tests

```bash
npm test          # unit tests + RLS security tests (needs db:start)
npm run test:e2e  # Playwright: sign in → create → publish → verify → delete
```

---

## Going live

### 1. Create the hosted Supabase project

<https://supabase.com> → new project. Then push the schema:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

### 2. Turn OFF public sign-up

Supabase dashboard → **Authentication → Sign In / Providers → Email** → disable
*Allow new users to sign up*.

This is not optional. Every new user gets the `admin` role, so leaving sign-up on lets
anyone register straight into your dashboard.

### 3. Set the redirect URLs

Supabase → **Authentication → URL Configuration**:

- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/accept-invite`,
  `https://yourdomain.com/auth/reset-password`

Invite and reset links will not work without these.

### 4. Set the environment variables in Vercel

| Variable | Value | Exposed to the browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Yes — safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key | Yes — safe by design; RLS is what protects the data |
| `SUPABASE_URL` | Same project URL | No |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | **No. Never prefix this with `NEXT_PUBLIC_`** — that would publish a key that bypasses all security |

### 5. Seed and create the first admin

```bash
# with .env.local pointed at the PRODUCTION project
npm run seed
npm run create-admin you@yourdomain.com
```

Then sign in and change the password from **Settings**.

### 6. Configure real email

Supabase's built-in email sender is rate-limited and not meant for production. Add SMTP
under **Authentication → Emails → SMTP Settings** (Resend, Postmark, or similar), or
invites and password resets will silently stop arriving.

---

## Search engines: currently OFF

**The site is deliberately hidden from Google.** `robots.txt` disallows everything and
every page carries `noindex`. This is correct before launch — letting a temporary domain
get indexed splits your ranking signals with the real domain and is awkward to undo.

When you are live on the real domain:

1. **Settings → Site URL** → your real address (needed for canonical links and the sitemap).
2. **Settings → Allow search engines to index this site** → on.
3. Save. That triggers a rebuild, and `robots.txt` + `sitemap.xml` regenerate automatically.

### Fill these in before you flip the switch

- **Phone.** `(512) 555-0192` in the old code was a placeholder — 555 numbers are reserved
  for fiction. It is currently **blank**, which is the safe state: structured data omits
  blank fields, and a *wrong* phone number in your business listing actively damages local
  search ranking through name/address/phone mismatch. Put the real one in Settings.
- **Share image.** Settings → Share image (1200×630). Without it, links shared on Facebook
  or LinkedIn show no picture.
- **Google review link.** Settings → Google review link.

### After launch

- Verify the site in [Google Search Console](https://search.google.com/search-console) and
  paste the verification string into **Settings → Google Search Console verification**.
- Submit `https://yourdomain.com/sitemap.xml` there.
- Create a Google Business Profile — for a local service business this drives more traffic
  than anything on the site itself. Keep the name, address, and phone identical to Settings.

---

## How publishing works

Pages are rendered **server-side by Next.js** on request, so Facebook, LinkedIn, iMessage,
and Slack always see fully-formed HTML when someone shares a link — no headless browser or
build-time snapshot step is involved.

Server-rendered pages are cached. Saving or publishing content calls `/api/revalidate`,
which uses Next's `revalidatePath` to refresh just the affected pages (the listing plus the
single item) in seconds — there is no full-site rebuild.
