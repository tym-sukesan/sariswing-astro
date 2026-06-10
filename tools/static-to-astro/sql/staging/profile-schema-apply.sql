-- =============================================================================
-- MANUAL STAGING SQL ONLY.
-- DO NOT RUN FROM CURSOR.
-- Intended project: static-to-astro-cms-staging
-- Never run on production.
-- Review before execution.
-- =============================================================================
-- G-6-d-schema-apply-prep — Apply in Supabase SQL Editor (staging only).
-- Order: create table → trigger → seed → RLS → policies → verification (below).
-- admin_users confirmed columns: user_id, email, role, created_at (no is_active).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- Run only in Supabase SQL Editor for static-to-astro-cms-staging after user approval.
-- 1. Create public.profile table
-- -----------------------------------------------------------------------------
create table if not exists public.profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  bio text not null default '',
  catchphrase text not null default '',
  website_url text not null default '',
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id)
);

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- 2. updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profile_updated_at on public.profile;

create trigger set_profile_updated_at
before update on public.profile
for each row
execute function public.set_profile_updated_at();

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- 3. Seed row (idempotent, demo-safe, one row)
-- -----------------------------------------------------------------------------
insert into public.profile (name, bio, catchphrase, website_url, social_links)
select
  'Demo Artist',
  'Demo biography for staging CMS verification.',
  '',
  '',
  '{}'::jsonb
where not exists (select 1 from public.profile);

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- 4. Enable RLS
-- -----------------------------------------------------------------------------
alter table public.profile enable row level security;

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- 5. Read policy — Option B (anon + authenticated) for staging shell / future public read.
--    Use Option A (authenticated only) if site must not expose profile to anon.
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read profile" on public.profile;
create policy "Public can read profile"
on public.profile
for select
to anon, authenticated
using (true);

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- 6. Update policy — admin/editor only via admin_users (no is_active column)
-- -----------------------------------------------------------------------------
drop policy if exists "Admins and editors can update profile" on public.profile;
create policy "Admins and editors can update profile"
on public.profile
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and role in ('admin', 'editor')
  )
);

-- No insert policy for G-6-d.
-- No delete policy for G-6-d.
-- No publish policy for G-6-d.

-- -----------------------------------------------------------------------------
-- MANUAL STAGING SQL. DO NOT RUN FROM CURSOR.
-- 7. Verification queries (run after apply; read-only checks)
-- -----------------------------------------------------------------------------
-- select table_schema, table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name = 'profile';

-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'profile'
-- order by ordinal_position;

-- select id, name, bio, updated_at, updated_by
-- from public.profile
-- limit 5;

-- select schemaname, tablename, policyname, permissive, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'profile'
-- order by policyname;
