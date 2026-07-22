-- =============================================================================
-- CMS Core v2 + YouTube site_embeds — MIGRATION TEMPLATE (DO NOT EXECUTE)
-- Phase 2 local draft only. Operator applies on staging after explicit approval.
-- Target project: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta)
-- STOP: production ref vsbvndwuajjhnzpohghh
-- service_role: not used by Kit write path
-- Security: DEFINER helpers use auth.uid() only — no client-supplied uid args
-- Fail-closed: Core tables REVOKE ALL from PUBLIC/anon/authenticated at end of this file
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
  updated_at timestamptz not null default now(),
  -- Composite unique target for site_embeds (site_id, site_slug) FK
  constraint sites_id_site_slug_key unique (id, site_slug)
);

comment on table public.sites is
  'CMS Core v2 tenant registry. site_id is FK SoT; site_slug is operator key. status=suspended is NOT enforced by is_platform_admin/is_site_member/can_write_site in Phase 2 (Edge may still reject suspended).';

comment on column public.sites.status is
  'active|suspended. Phase 2 authz helpers ignore this column; Edge gosaki-youtube path checks active.';

create table if not exists public.site_members (
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

comment on table public.site_members is
  'Per-site membership. owner|editor only in Core v2. ON DELETE CASCADE from sites.';

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
-- site_id + site_slug must match sites via composite FK; site DELETE = RESTRICT
-- ---------------------------------------------------------------------------
create table if not exists public.site_embeds (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
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
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (site_id, provider, legacy_item_id),
  constraint site_embeds_site_id_slug_fkey
    foreign key (site_id, site_slug)
    references public.sites (id, site_slug)
    on delete restrict
    on update cascade
);

comment on table public.site_embeds is
  'CMS Core v2 embeds. Phase 2 uses provider=youtube. Composite FK enforces site_id↔site_slug sync. ON DELETE RESTRICT on sites.';

comment on column public.site_embeds.legacy_item_id is
  'Stable admin/JSON item id (e.g. yt-placeholder-01).';

comment on column public.site_embeds.site_slug is
  'Denormalized; must equal sites.site_slug for site_id (enforced by site_embeds_site_id_slug_fkey).';

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

-- Audit actors from JWT only (clients must NOT INSERT/UPDATE created_by/updated_by)
-- Aligns with column-level GRANTs in RLS template + Edge Save path.
create or replace function public.tg_site_embeds_set_audit_actors()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    return new;
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := auth.uid();
    -- Belt-and-suspenders: identity columns stay immutable even if grants widen later
    new.id := old.id;
    new.site_id := old.site_id;
    new.site_slug := old.site_slug;
    new.provider := old.provider;
    new.legacy_item_id := old.legacy_item_id;
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists site_embeds_set_audit_actors on public.site_embeds;
create trigger site_embeds_set_audit_actors
  before insert or update on public.site_embeds
  for each row
  execute function public.tg_site_embeds_set_audit_actors();

comment on function public.tg_site_embeds_set_audit_actors() is
  'Sets created_by/updated_by from auth.uid() only. Client column GRANTs exclude these columns.';

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
-- Note: sites.status (suspended) is NOT checked here in Phase 2.
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
  'CMS Core v2: true iff auth.uid() is an active platform_admin. No uid arg. Ignores sites.status.';
comment on function public.is_site_member(uuid) is
  'CMS Core v2: true iff auth.uid() is owner|editor of p_site_id. No uid arg. Ignores sites.status.';
comment on function public.can_write_site(uuid) is
  'CMS Core v2: platform_admin or site member for p_site_id. Uses auth.uid() only. Does not check sites.status=suspended (Phase 2).';

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

-- ---------------------------------------------------------------------------
-- Fail-closed table privileges (migration complete → zero client table access)
-- RLS template re-GRANTs the minimal SELECT/INSERT/UPDATE set after policies exist
-- ---------------------------------------------------------------------------
revoke all on table public.sites from public;
revoke all on table public.sites from anon;
revoke all on table public.sites from authenticated;

revoke all on table public.site_members from public;
revoke all on table public.site_members from anon;
revoke all on table public.site_members from authenticated;

revoke all on table public.platform_admins from public;
revoke all on table public.platform_admins from anon;
revoke all on table public.platform_admins from authenticated;

revoke all on table public.site_embeds from public;
revoke all on table public.site_embeds from anon;
revoke all on table public.site_embeds from authenticated;

commit;

-- READ-ONLY verify (operator):
-- select tablename from pg_tables where schemaname='public'
--   and tablename in ('sites','site_members','platform_admins','site_embeds');
-- select p.proname, pg_get_function_identity_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname in ('is_platform_admin','is_site_member','can_write_site');
-- select conname, pg_get_constraintdef(oid) from pg_constraint
-- where conrelid = 'public.site_embeds'::regclass and contype = 'f';
