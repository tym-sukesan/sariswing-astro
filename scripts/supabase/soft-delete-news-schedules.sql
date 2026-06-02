-- =============================================================================
-- news / schedules — 論理削除（deleted_at）
-- =============================================================================
-- 目的:
--   管理画面の「削除」を物理削除から論理削除に変更し、復元可能にする。
--
-- 前提:
--   - 管理 CRUD は admin-news / admin-schedule Edge Function（service_role）
--   - 公開サイトは astro build 時に anon SELECT
--
-- 適用手順:
--   1. Supabase SQL Editor で本ファイルを実行
--   2. admin-news / admin-schedule Edge Function を再デプロイ
--   3. npm run build で公開サイト・sitemap を確認
--   4. 管理画面で削除 → 削除済み一覧 → 復元を確認
--
-- 再実行: ADD COLUMN IF NOT EXISTS / DROP POLICY + CREATE のため再適用可
-- =============================================================================

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

COMMENT ON COLUMN public.news.deleted_at IS '論理削除日時。NULL の行のみ通常一覧・公開対象。';
COMMENT ON COLUMN public.schedules.deleted_at IS '論理削除日時。NULL の行のみ通常一覧・公開対象。';

CREATE INDEX IF NOT EXISTS news_deleted_at_idx
  ON public.news (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS schedules_deleted_at_idx
  ON public.schedules (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- anon 公開 SELECT: 公開済みかつ未削除のみ
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_anon_select_published" ON public.news;
CREATE POLICY "news_anon_select_published"
  ON public.news
  FOR SELECT
  TO anon
  USING (is_published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "schedules_anon_select_published" ON public.schedules;
CREATE POLICY "schedules_anon_select_published"
  ON public.schedules
  FOR SELECT
  TO anon
  USING (is_published = true AND deleted_at IS NULL);
