-- =============================================================================
-- venues — RLS ポリシー（SQL Editor で実行）
-- =============================================================================
-- 前提:
--   - 会場マスタは Schedule 管理画面のプルダウン用（SELECT のみ）
--   - フロントは PUBLIC_SUPABASE_ANON_KEY（src/lib/supabase.ts）
--   - 使用箇所: src/scripts/admin/schedule.ts（.select("*")）
--   - アプリから INSERT / UPDATE / DELETE は行わない
--
-- 効果:
--   - anon: 全会場の読み取り可（管理画面の会場選択）
--   - anon: 会場マスタの改ざん・削除を拒否（ポリシー未付与のため）
--
-- 再実行: 既存ポリシーを DROP してから CREATE するため、同じ SQL を再適用可
--
-- 注意:
--   - schedules / news 等が RLS 無効のままでも、本 SQL は venues のみに影響
--   - 会場データの追加・修正は Dashboard または service_role 経由で行う
-- =============================================================================

-- -----------------------------------------------------------------------------
-- RLS 有効化
-- -----------------------------------------------------------------------------
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- anon — SELECT のみ（全行）
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "venues_public_select" ON public.venues;
DROP POLICY IF EXISTS "venues_anon_select" ON public.venues;

CREATE POLICY "venues_anon_select"
  ON public.venues
  FOR SELECT
  TO anon
  USING (true);

-- INSERT / UPDATE / DELETE 用ポリシーは意図的に作成しない（anon は拒否される）
