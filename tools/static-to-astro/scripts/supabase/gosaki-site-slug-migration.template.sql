-- G-9c0c — site_slug column migration template (Gosaki multi-site staging)
-- TEMPLATE ONLY — DO NOT EXECUTE IN G-9c0c
-- Project: static-to-astro-cms-staging
-- Operator: run once in Supabase SQL Editor after explicit approval (G-9c-execution phase)

begin;

alter table public.schedules
  add column if not exists site_slug text;

comment on column public.schedules.site_slug is
  'CMS Kit site identifier, e.g. gosaki-piano. NULL = legacy Kit / PoC rows.';

create index if not exists schedules_site_slug_date_idx
  on public.schedules (site_slug, date);

create index if not exists schedules_site_slug_month_idx
  on public.schedules (site_slug, month);

-- Existing G-6 PoC rows remain site_slug NULL in this phase — no UPDATE here.
-- Optional (NOT in G-9c0c): tag PoC rows in a separate approved step only.

commit;

-- Post-migration verification (SELECT only)
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'schedules' and column_name = 'site_slug';
