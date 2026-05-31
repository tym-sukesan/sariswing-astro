-- =============================================================================
-- schedules — RLS（anon は公開済みのみ SELECT）
-- =============================================================================
-- 前提:
--   - 管理 CRUD は admin-schedule Edge Function（Supabase Auth JWT + service_role）
--   - 公開サイトは astro build 時に anon で SELECT（is_published = true）
--   - venues は別途 venues-rls.sql（anon SELECT のみ）
--
-- 適用タイミング:
--   1. admin-schedule をデプロイ済み
--   2. /admin/login/ でログインし、Schedule 管理の CRUD が Edge 経由で動作確認済み
--   3. 本 SQL を Supabase SQL Editor で実行
--   4. npm run build で /live-schedule/ が表示されることを確認
--
-- 再実行: DROP / CREATE のため同じ SQL を再適用可
-- =============================================================================

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_anon_all" ON public.schedules;
DROP POLICY IF EXISTS "schedules_public_select" ON public.schedules;
DROP POLICY IF EXISTS "schedules_anon_select" ON public.schedules;
DROP POLICY IF EXISTS "schedules_anon_select_published" ON public.schedules;

CREATE POLICY "schedules_anon_select_published"
  ON public.schedules
  FOR SELECT
  TO anon
  USING (is_published = true);

-- INSERT / UPDATE / DELETE 用ポリシーは意図的に作成しない（anon は拒否）
