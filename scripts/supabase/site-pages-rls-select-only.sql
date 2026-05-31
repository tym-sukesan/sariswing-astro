-- =============================================================================
-- site_pages / site_page_revisions — RLS（anon SELECT のみ / 管理は Edge）
-- =============================================================================
-- 前提:
--   - 管理 CRUD は admin-site-page Edge Function（Auth JWT + service_role）
--   - 公開サイト /about/ は astro build 時に anon で site_pages SELECT
--
-- 適用タイミング:
--   1. admin-site-page をデプロイ済み
--   2. /admin/login/ → /admin/about/ で保存・履歴・復元が動作確認済み
--   3. 本 SQL を Supabase SQL Editor で実行
--   4. npm run build で /about/ を確認
--
-- 再実行: DROP / CREATE のため同じ SQL を再適用可
-- =============================================================================

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_revisions ENABLE ROW LEVEL SECURITY;

-- site_pages — 公開ビルド用（全 slug SELECT）
DROP POLICY IF EXISTS "site_pages_public_select" ON public.site_pages;
DROP POLICY IF EXISTS "site_pages_anon_all" ON public.site_pages;
DROP POLICY IF EXISTS "site_pages_anon_select" ON public.site_pages;

CREATE POLICY "site_pages_anon_select"
  ON public.site_pages
  FOR SELECT
  TO anon
  USING (true);

-- site_page_revisions — anon からは一切アクセス不可（ポリシーなし = 拒否）
DROP POLICY IF EXISTS "site_page_revisions_anon_all" ON public.site_page_revisions;
DROP POLICY IF EXISTS "site_page_revisions_anon_select" ON public.site_page_revisions;

-- INSERT / UPDATE / DELETE 用ポリシーは意図的に作成しない
