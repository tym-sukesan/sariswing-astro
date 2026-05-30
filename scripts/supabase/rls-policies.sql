-- =============================================================================
-- RLS ポリシー案（本番適用前のドラフト）
-- =============================================================================
-- 現状: RLS は未適用。このファイルは Supabase SQL Editor での実行用メモです。
-- 適用前にステージングで admin（全件 SELECT）と公開ページの動作を確認してください。
--
-- 前提:
--   - anon key はフロントに埋め込まれる（公開前提）
--   - service_role key はサーバー・CI のみ。フロントに置かない
--   - /admin/ は Basic 認証などで保護する（RLS とは別レイヤー）
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RLS を有効化（適用時にコメントを外す）
-- -----------------------------------------------------------------------------
-- ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.site_page_revisions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. schedules — 公開済みのみ anon で SELECT
-- -----------------------------------------------------------------------------
-- CREATE POLICY "schedules_public_select"
--   ON public.schedules
--   FOR SELECT
--   TO anon, authenticated
--   USING (is_published = true);

-- admin 用の全件読み取りは、将来 Supabase Auth の authenticated ロールか
-- サーバー側（service_role）経由で実装する想定。

-- -----------------------------------------------------------------------------
-- 3. news — 公開済みのみ anon で SELECT
-- -----------------------------------------------------------------------------
-- CREATE POLICY "news_public_select"
--   ON public.news
--   FOR SELECT
--   TO anon, authenticated
--   USING (is_published = true);

-- -----------------------------------------------------------------------------
-- 4. instagram_posts — 公開済みのみ anon で SELECT
-- -----------------------------------------------------------------------------
-- CREATE POLICY "instagram_posts_public_select"
--   ON public.instagram_posts
--   FOR SELECT
--   TO anon, authenticated
--   USING (is_published = true);

-- -----------------------------------------------------------------------------
-- 5. venues — 会場マスタは公開読み取り可（全行）
-- -----------------------------------------------------------------------------
-- CREATE POLICY "venues_public_select"
--   ON public.venues
--   FOR SELECT
--   TO anon, authenticated
--   USING (true);

-- -----------------------------------------------------------------------------
-- 6. site_pages / site_page_revisions — 管理画面 + ビルド時 SELECT
-- -----------------------------------------------------------------------------
-- 実行用 SQL（RLS 有効化済みで upsert が拒否される場合）:
--   scripts/supabase/site-pages-rls-policies.sql
--
-- 方針: news / schedules / instagram_posts と同様、anon に FOR ALL（Basic 認証前提）
-- 公開ビルド: site_pages を anon SELECT（全行）
-- バックアップ: site_page_revisions も anon CRUD（/admin/about/ のみ利用想定）

-- -----------------------------------------------------------------------------
-- 7. （旧）site_page_revisions — 上記ファイルを参照
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 8. 書き込み（INSERT / UPDATE / DELETE）
-- -----------------------------------------------------------------------------
-- anon には書き込みポリシーを付けない（デフォルトで拒否）。
-- 管理画面からの更新は、Auth 付きポリシーまたは API + service_role に移行する。
