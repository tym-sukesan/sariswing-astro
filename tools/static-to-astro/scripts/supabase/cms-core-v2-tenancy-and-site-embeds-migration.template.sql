-- =============================================================================
-- CMS Core v2 + YouTube site_embeds — MIGRATION TEMPLATE (DO NOT EXECUTE)
-- Phase 2 local draft only. Operator applies on staging after explicit approval.
-- Target project: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta)
-- STOP: production ref vsbvndwuajjhnzpohghh
-- service_role: not used by Kit write path
-- Security: DEFINER helpers use auth.uid() only — no client-supplied uid args
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null unique,
  display_name text not null,
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sites is
  'CMS Core v2 tenant registry. site_id is FK SoT; site_slug is operator key.';

create table if not exists public.site_members (
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

comment on table public.site_members is
  'Per-site membership. owner|editor only in Core v2.';

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  active boolean not null default true
);

comment on table public.platform_admins is
  'Kit operators (cross-site). SoT for platform_admin authz — not JWT claims. active=false immediately removes all-site assist rights.';

comment on column public.platform_admins.active is
  'When false, is_platform_admin() returns false on next call — immediate revoke without JWT refresh.';

create index if not exists site_members_user_id_idx on public.site_members (user_id);
create index if not exists platform_admins_active_idx
  on public.platform_admins (user_id) where active = true;

-- ---------------------------------------------------------------------------
-- Content: site_embeds (YouTube vertical slice; provider-ready)
-- ---------------------------------------------------------------------------
create table if not exists public.site_embeds (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  site_slug text not null,
  provider text not null check (provider in ('youtube', 'instagram')),
  legacy_item_id text not null,
  title text,
  source_url text not null,
  embed_url text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  unique (site_id, provider, legacy_item_id)
);

comment on table public.site_embeds is
  'CMS Core v2 embeds. Phase 2 uses provider=youtube. site_id + denormalized site_slug.';

comment on column public.site_embeds.legacy_item_id is
  'Stable admin/JSON item id (e.g. yt-placeholder-01).';

create index if not exists site_embeds_site_provider_sort_idx
  on public.site_embeds (site_id, provider, sort_order);

create index if not exists site_embeds_site_slug_provider_idx
  on public.site_embeds (site_slug, provider, sort_order);

-- updated_at trigger (optimistic lock prerequisite)
create or replace function public.tg_site_embeds_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_embeds_set_updated_at on public.site_embeds;
create trigger site_embeds_set_updated_at
  before update on public.site_embeds
  for each row
  execute function public.tg_site_embeds_set_updated_at();

-- ---------------------------------------------------------------------------
-- Drop unsafe legacy signatures (client-supplied uid) if present from earlier drafts
-- ---------------------------------------------------------------------------
drop function if exists public.is_platform_admin(uuid);
drop function if exists public.is_site_member(uuid, uuid);
drop function if exists public.can_write_site(uuid, uuid);

-- Authz helpers (SECURITY DEFINER · auth.uid() only · no service_role)
-- Final signatures:
--   is_platform_admin()
--   is_site_member(p_site_id uuid)
--   can_write_site(p_site_id uuid)
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins as pa
    where pa.user_id = auth.uid()
      and pa.active = true
  );
$$;

create or replace function public.is_site_member(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_members as sm
    where sm.site_id = p_site_id
      and sm.user_id = auth.uid()
      and sm.role in ('owner', 'editor')
  );
$$;

create or replace function public.can_write_site(p_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin() or public.is_site_member(p_site_id);
$$;

comment on function public.is_platform_admin() is
  'CMS Core v2: true iff auth.uid() is an active platform_admin. No uid arg.';
comment on function public.is_site_member(uuid) is
  'CMS Core v2: true iff auth.uid() is owner|editor of p_site_id. No uid arg.';
comment on function public.can_write_site(uuid) is
  'CMS Core v2: platform_admin or site member for p_site_id. Uses auth.uid() only.';

-- EXECUTE: deny PUBLIC/anon; allow authenticated only (minimal)
revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_platform_admin() from anon;
revoke all on function public.is_site_member(uuid) from public;
revoke all on function public.is_site_member(uuid) from anon;
revoke all on function public.can_write_site(uuid) from public;
revoke all on function public.can_write_site(uuid) from anon;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_site_member(uuid) to authenticated;
grant execute on function public.can_write_site(uuid) to authenticated;

commit;

-- READ-ONLY verify (operator):
-- select tablename from pg_tables where schemaname='public'
--   and tablename in ('sites','site_members','platform_admins','site_embeds');
-- select p.proname, pg_get_function_identity_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname in ('is_platform_admin','is_site_member','can_write_site');
