-- ═══════════════════════════════════════════════════════════════════════════
-- Brain Food — initial schema
--
-- profiles       one row per admin, mirrors auth.users
-- events         community events shown on /events
-- posts          blog posts shown on /blog
-- site_settings  singleton row holding contact info, socials, SEO defaults
--
-- `role` is a text column validated in application code (src/config/roles.js)
-- rather than a native Postgres enum, so adding a role later needs no migration.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────────────────────

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '',
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'Validated in application code (src/config/roles.js). Currently only "admin".';

-- ── events ──────────────────────────────────────────────────────────────────

create table public.events (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  date       date not null,
  time       text not null default '',
  location   text not null default '',
  image_url  text,
  excerpt    text not null default '',
  body       text not null default '',
  category   text not null default 'Community',
  published  boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_published_date_idx on public.events (published, date);

-- ── posts ───────────────────────────────────────────────────────────────────

create table public.posts (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  date       date not null,
  author     text not null default '',
  category   text not null default '',
  tags       text[] not null default '{}',
  image_url  text,
  excerpt    text not null default '',
  body       text not null default '',
  read_time  integer not null default 1,
  published  boolean not null default false,
  featured   boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_published_date_idx on public.posts (published, date desc);

-- ── site_settings ───────────────────────────────────────────────────────────
-- Singleton: the `id = 1` check guarantees exactly one row can ever exist.

create table public.site_settings (
  id                integer primary key default 1 check (id = 1),

  -- business
  name              text not null default '',
  short_name        text not null default '',
  tagline           text not null default '',
  description       text not null default '',
  city              text not null default '',
  state             text not null default '',
  address           text not null default '',
  founded           integer,

  -- contact
  phone             text not null default '',
  email             text not null default '',
  hours             text not null default '',

  -- links
  google_maps       text not null default '',
  google_review     text not null default '',

  -- socials: [{ "label": "Facebook", "href": "https://..." }]
  socials           jsonb not null default '[]'::jsonb,

  -- seo
  site_url          text not null default '',
  title_template    text not null default '%s',
  default_title     text not null default '',
  default_desc      text not null default '',
  og_image_url      text,

  -- analytics
  ga_measurement_id text not null default '',
  gsc_verification  text not null default '',

  -- Master switch for search engine indexing. Ships OFF: the site is not on its
  -- production domain yet, and indexing a staging domain splits ranking signals.
  seo_indexable     boolean not null default false,

  updated_at        timestamptz not null default now()
);

-- ── updated_at maintenance ──────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ── profile provisioning ────────────────────────────────────────────────────
-- Every auth user gets a profile automatically. Invites (auth.admin.inviteUserByEmail)
-- create the auth.users row immediately, so the profile exists before the invitee
-- ever clicks the emailed link.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'admin')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
