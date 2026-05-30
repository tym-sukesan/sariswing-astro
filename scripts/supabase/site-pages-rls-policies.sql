-- =============================================================================
-- site_pages / site_page_revisions — RLS ポリシー（SQL Editor で実行）
-- =============================================================================
-- 運用方針: news / schedules / instagram_posts と同様
--   - フロント・管理画面は Supabase anon key
--   - /admin/ はロリポップ Basic 認証で保護（RLS とは別レイヤー）
--   - anon に SELECT / INSERT / UPDATE / DELETE を許可
--
-- 公開サイト:
--   - site_pages … ビルド時（astro build）に anon で SELECT（全 slug）
--   - site_page_revisions … 管理画面専用だが、操作は anon（Basic 認証前提）
--
-- 再実行: 既存ポリシーを DROP してから CREATE するため、同じ SQL を再適用可
--
-- 将来 Supabase Auth を導入する場合:
--   1. 書き込み（INSERT / UPDATE / DELETE）は authenticated（または service_role）のみに限定する
--   2. site_pages の公開 SELECT は anon のまま、または CI のみ service_role に移す
--   3. site_page_revisions は authenticated のみ（anon から SELECT も外す）
--   4. 管理画面を Auth セッション付きクライアントに切り替え、anon key を管理操作から外す
--   5. 本番 anon key が漏れても改ざんできないよう、段階的にポリシーを絞る
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RLS 有効化
-- -----------------------------------------------------------------------------
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_revisions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- site_pages — 既存ポリシーを削除（名前は環境により異なる場合あり）
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "site_pages_public_select" ON public.site_pages;
DROP POLICY IF EXISTS "site_pages_anon_all" ON public.site_pages;

CREATE POLICY "site_pages_anon_all"
  ON public.site_pages
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- site_page_revisions — 管理画面バックアップ（anon で CRUD）
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "site_page_revisions_anon_all" ON public.site_page_revisions;

CREATE POLICY "site_page_revisions_anon_all"
  ON public.site_page_revisions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
