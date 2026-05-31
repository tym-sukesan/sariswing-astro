-- =============================================================================
-- instagram_posts — RLS（anon SELECT のみ）
-- =============================================================================
-- 前提:
--   - 管理 CRUD は admin-instagram Edge Function（Supabase Auth JWT + service_role）
--   - 公開サイトは astro build 時に anon で SELECT（InstagramFeed.astro）
--
-- 適用タイミング:
--   1. admin-instagram をデプロイ済み
--   2. /admin/login/ でログインし、Instagram 管理の CRUD が Edge 経由で動作確認済み
--   3. 本 SQL を Supabase SQL Editor で実行
--   4. npm run build でトップページの Instagram 表示を確認
--
-- 再実行: DROP / CREATE のため同じ SQL を再適用可
-- =============================================================================

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instagram_posts_anon_all" ON public.instagram_posts;
DROP POLICY IF EXISTS "instagram_posts_public_select" ON public.instagram_posts;
DROP POLICY IF EXISTS "instagram_posts_anon_select" ON public.instagram_posts;

CREATE POLICY "instagram_posts_anon_select"
  ON public.instagram_posts
  FOR SELECT
  TO anon
  USING (true);

-- INSERT / UPDATE / DELETE 用ポリシーは意図的に作成しない（anon は拒否）
