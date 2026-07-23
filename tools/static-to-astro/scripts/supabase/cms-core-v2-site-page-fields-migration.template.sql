-- =============================================================================
-- CMS Core v2 site_page_fields — MIGRATION TEMPLATE (DO NOT EXECUTE)
-- About Supabase vertical slice preflight draft only.
-- Operator applies on staging after explicit approval + SELECT-only readiness PASS.
-- Target: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta)
-- STOP: production ref vsbvndwuajjhnzpohghh
-- Prerequisite: public.sites (+ sites_id_site_slug_key) and can_write_site() already exist
-- Does NOT create tenancy tables / authz helpers / site_embeds
-- service_role: not used
-- Fail-closed: REVOKE ALL on site_page_fields at end (RLS template re-GRANTs)
-- =============================================================================

begin;

-- Refuse if tenancy / composite unique missing
do $$
begin
  if to_regclass('public.sites') is null then
    raise exception 'STOP: public.sites missing — apply YouTube Core tenancy first';
  end if;
  if not exists (
    select 1
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname = 'sites'
      and c.conname = 'sites_id_site_slug_key'
  ) then
    raise exception 'STOP: sites_id_site_slug_key missing — cannot composite-FK site_page_fields';
  end if;
end $$;

create table if not exists public.site_page_fields (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null,
  site_slug text not null,
  page_key text not null,
  field_key text not null,
  value_text text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  constraint site_page_fields_page_key_nonempty check (length(trim(page_key)) > 0),
  constraint site_page_fields_field_key_nonempty check (length(trim(field_key)) > 0),
  unique (site_id, page_key, field_key),
  constraint site_page_fields_site_id_slug_fkey
    foreign key (site_id, site_slug)
    references public.sites (id, site_slug)
    on delete restrict
    on update cascade
);

comment on table public.site_page_fields is
  'CMS Core v2 keyed page scalars (not opaque HTML). Slice 1: page_key=about field_key=profile.lede. Composite FK enforces site_id↔site_slug. ON DELETE RESTRICT on sites.';

comment on column public.site_page_fields.page_key is
  'Logical page id (e.g. about). Not a URL path.';

comment on column public.site_page_fields.field_key is
  'Structured field id within page (e.g. profile.lede). value_text is plain text.';

comment on column public.site_page_fields.value_text is
  'Plain-text scalar SoT. Do not store full HTML blocks as the primary model.';

comment on column public.site_page_fields.site_slug is
  'Denormalized; must equal sites.site_slug for site_id (enforced by site_page_fields_site_id_slug_fkey).';

create index if not exists site_page_fields_site_page_sort_idx
  on public.site_page_fields (site_id, page_key, sort_order);

create index if not exists site_page_fields_site_slug_page_idx
  on public.site_page_fields (site_slug, page_key, sort_order);

-- updated_at trigger (optimistic lock prerequisite)
create or replace function public.tg_site_page_fields_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_page_fields_set_updated_at on public.site_page_fields;
create trigger site_page_fields_set_updated_at
  before update on public.site_page_fields
  for each row
  execute function public.tg_site_page_fields_set_updated_at();

-- Audit actors from JWT only (clients must NOT INSERT/UPDATE created_by/updated_by)
create or replace function public.tg_site_page_fields_set_audit_actors()
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
    new.id := old.id;
    new.site_id := old.site_id;
    new.site_slug := old.site_slug;
    new.page_key := old.page_key;
    new.field_key := old.field_key;
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists site_page_fields_set_audit_actors on public.site_page_fields;
create trigger site_page_fields_set_audit_actors
  before insert or update on public.site_page_fields
  for each row
  execute function public.tg_site_page_fields_set_audit_actors();

-- Fail-closed table privileges until RLS template re-GRANTs
revoke all on table public.site_page_fields from public;
revoke all on table public.site_page_fields from anon;
revoke all on table public.site_page_fields from authenticated;

commit;

-- Verify (SELECT only):
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema='public' and table_name='site_page_fields'
-- order by ordinal_position;
