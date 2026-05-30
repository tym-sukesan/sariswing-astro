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
-- 6. site_pages — 固定ページ HTML（公開読み取り可）
-- -----------------------------------------------------------------------------
-- CREATE POLICY "site_pages_public_select"
--   ON public.site_pages
--   FOR SELECT
--   TO anon, authenticated
--   USING (true);

-- -----------------------------------------------------------------------------
-- 7. site_page_revisions — 管理画面バックアップ（公開読み取り不要）
-- -----------------------------------------------------------------------------
-- 履歴は /admin/ からのみ参照。RLS 有効化時は anon に SELECT を付けない。
-- 読み書きは authenticated または service_role 経由を想定。

-- -----------------------------------------------------------------------------
-- 8. 書き込み（INSERT / UPDATE / DELETE）
-- -----------------------------------------------------------------------------
-- anon には書き込みポリシーを付けない（デフォルトで拒否）。
-- 管理画面からの更新は、Auth 付きポリシーまたは API + service_role に移行する。
