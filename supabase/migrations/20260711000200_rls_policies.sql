-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
--
-- These policies are the real access control for the site. They live in Postgres,
-- so they hold even if someone ignores the React app entirely and calls the API
-- directly with the public anon key (which is, by design, public).
--
--   anonymous      → read PUBLISHED events/posts and site settings. No writes, ever.
--   authenticated  → admins: read everything (incl. drafts), write everything.
--   service_role   → bypasses RLS. Used only by the /api/users function.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── admin check ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER so it bypasses RLS on profiles. Without that, a policy on
-- profiles that queries profiles recurses infinitely.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin')
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.posts         enable row level security;
alter table public.site_settings enable row level security;

-- ── grants ──────────────────────────────────────────────────────────────────
-- Table privileges gate WHICH columns/operations are even reachable; RLS then
-- gates WHICH ROWS. Both are needed.

revoke all on public.profiles      from anon, authenticated;
revoke all on public.events        from anon, authenticated;
revoke all on public.posts         from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;

grant select on public.events        to anon, authenticated;
grant select on public.posts         to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

grant insert, update, delete on public.events to authenticated;
grant insert, update, delete on public.posts  to authenticated;
grant update                 on public.site_settings to authenticated;

grant select on public.profiles to authenticated;
-- Column-level grant: an admin may rename themselves but can never write `role`.
-- Role changes are only possible through the service-role key, server-side.
grant update (name) on public.profiles to authenticated;

-- service_role bypasses RLS, but RLS is not the same thing as table privileges —
-- it still needs the grants. Used by /api/users and the seed script.
grant select, insert, update, delete
  on public.profiles, public.events, public.posts, public.site_settings
  to service_role;

-- ── events ──────────────────────────────────────────────────────────────────
-- Permissive policies OR together: the public sees published rows, and an admin
-- additionally sees everything.

create policy "events are publicly readable when published"
  on public.events for select
  to anon, authenticated
  using (published = true);

create policy "admins read all events"
  on public.events for select
  to authenticated
  using (public.is_admin());

create policy "admins insert events"
  on public.events for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update events"
  on public.events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete events"
  on public.events for delete
  to authenticated
  using (public.is_admin());

-- ── posts ───────────────────────────────────────────────────────────────────

create policy "posts are publicly readable when published"
  on public.posts for select
  to anon, authenticated
  using (published = true);

create policy "admins read all posts"
  on public.posts for select
  to authenticated
  using (public.is_admin());

create policy "admins insert posts"
  on public.posts for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update posts"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete posts"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- ── profiles ────────────────────────────────────────────────────────────────
-- No client-side insert or delete policy exists, so those operations are denied
-- outright. Profiles are created by the on_auth_user_created trigger and removed
-- by cascade when the auth user is deleted server-side.

create policy "admins read all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_admin() or id = auth.uid());

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── site_settings ───────────────────────────────────────────────────────────
-- Publicly readable: the marketing site renders contact info and SEO defaults
-- from it for anonymous visitors.

create policy "site settings are publicly readable"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "admins update site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── storage: media bucket ───────────────────────────────────────────────────
-- Public read (images are served on the public site); admin-only write.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media is publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "admins upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "admins update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "admins delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());
