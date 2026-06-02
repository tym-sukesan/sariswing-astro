-- =============================================================================
-- news — RLS（anon は公開済みのみ SELECT）
-- =============================================================================
-- 前提:
--   - 管理 CRUD は admin-news Edge Function（Supabase Auth JWT + service_role）
--   - 公開サイトは astro build 時に anon で SELECT（is_published = true）
--
-- 適用タイミング:
--   1. admin-news をデプロイ済み
--   2. /admin/login/ でログインし、NEWS 管理の CRUD が Edge 経由で動作確認済み
--   3. 本 SQL を Supabase SQL Editor で実行
--   4. npm run build で /news/ ・トップ NEWS が表示されることを確認
--
-- 再実行: DROP / CREATE のため同じ SQL を再適用可
-- =============================================================================

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_anon_all" ON public.news;
DROP POLICY IF EXISTS "news_public_select" ON public.news;
DROP POLICY IF EXISTS "news_anon_select" ON public.news;
DROP POLICY IF EXISTS "news_anon_select_published" ON public.news;

CREATE POLICY "news_anon_select_published"
  ON public.news
  FOR SELECT
  TO anon
  USING (is_published = true AND deleted_at IS NULL);

-- INSERT / UPDATE / DELETE 用ポリシーは意図的に作成しない（anon は拒否）
