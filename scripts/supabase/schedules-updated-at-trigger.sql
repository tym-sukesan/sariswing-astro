-- =============================================================================
-- schedules — updated_at auto-update trigger (G-6-f8)
-- =============================================================================
-- 目的:
--   public.schedules の UPDATE 時に updated_at を now() で自動更新する。
--   optimistic lock (expectedBeforeUpdatedAt) の前提。schedule_months は対象外。
--
-- 前提:
--   - 対象 project: static-to-astro-cms-staging のみ（Kit フェーズ）
--   - CMS Kit staging write: authenticated session + RLS（service_role 不使用）
--   - public.schedule_months は derived / read-only — 本 trigger の対象外
--
-- 適用手順:
--   1. Supabase Dashboard で project = static-to-astro-cms-staging を確認
--   2. pre-check SQL を実行（docs/schedule-updated-at-staging-migration-preflight.md）
--   3. 本ファイルを SQL Editor で実行
--   4. post-check + low-risk verification UPDATE（docs/schedule-updated-at-staging-migration-execution-result.md）
--
-- 再実行: CREATE OR REPLACE FUNCTION + DROP TRIGGER IF EXISTS のため idempotent
-- Rollback: docs/schedule-updated-at-staging-migration-execution-result.md § rollback
-- =============================================================================

create or replace function public.tg_schedules_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.tg_schedules_set_updated_at() is
  'BEFORE UPDATE trigger helper: sets schedules.updated_at to now(). CMS Kit G-6-f8.';

drop trigger if exists schedules_set_updated_at on public.schedules;

create trigger schedules_set_updated_at
  before update on public.schedules
  for each row
  execute function public.tg_schedules_set_updated_at();
