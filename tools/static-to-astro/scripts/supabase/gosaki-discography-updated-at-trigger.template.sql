-- =============================================================================
-- discography — updated_at auto-update trigger (G-15b-f8 template — DO NOT RUN without operator approval)
-- =============================================================================
-- 目的:
--   public.discography の UPDATE 時に updated_at を now() で自動更新する。
--   optimistic lock (expectedBeforeUpdatedAt) の前提。discography_tracks は対象外。
--
-- 背景 (G-15b-retry):
--   purchase_url Save succeeded but updated_at remained unchanged — no trigger on discography.
--   schedules には G-6-f8 で schedules_set_updated_at が適用済み。
--
-- 前提:
--   - 対象 project: static-to-astro-cms-staging のみ（kmjqppxjdnwwrtaeqjta）
--   - CMS Kit staging write: authenticated session + RLS（service_role 不使用）
--   - public.discography_tracks は本 trigger の対象外
--
-- 適用手順 (separate approval phase):
--   1. Supabase Dashboard で project = static-to-astro-cms-staging を確認
--   2. pre-check SQL（doc: gosaki-discography-save-retry-result-and-updated-at-investigation.md §8）
--   3. 本ファイルを SQL Editor で実行
--   4. post-check: low-risk verification UPDATE on staging test row or re-read discography-002 after harmless touch
--
-- 再実行: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS のため idempotent
-- Rollback: DROP TRIGGER + DROP FUNCTION（doc-only — separate phase）
-- =============================================================================

create or replace function public.tg_discography_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.tg_discography_set_updated_at() is
  'BEFORE UPDATE trigger helper: sets discography.updated_at to now(). CMS Kit G-15b-f8.';

drop trigger if exists discography_set_updated_at on public.discography;

create trigger discography_set_updated_at
  before update on public.discography
  for each row
  execute function public.tg_discography_set_updated_at();

-- ---------------------------------------------------------------------------
-- READ-ONLY pre-check (run before apply — do not run trigger section until approved)
-- ---------------------------------------------------------------------------
-- select tgname, tgenabled, pg_get_triggerdef(oid)
-- from pg_trigger
-- where tgrelid = 'public.discography'::regclass and not tgisinternal;
--
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'discography'
--   and column_name in ('updated_at', 'created_at');

-- ---------------------------------------------------------------------------
-- READ-ONLY post-check (after apply)
-- ---------------------------------------------------------------------------
-- select tgname from pg_trigger
-- where tgrelid = 'public.discography'::regclass
--   and tgname = 'discography_set_updated_at';
