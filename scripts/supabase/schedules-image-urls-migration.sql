-- =============================================================================
-- schedules.image_urls (jsonb) 追加
-- =============================================================================
-- 目的:
--   スケジュール画像を複数枚管理するため、URL配列を保持する image_urls を追加する。
--
-- 方針:
--   - image_urls が存在する場合は image_urls を優先
--   - image_urls が空/NULL の場合は既存 image_url をフォールバック利用
--   - 互換維持のため image_url は先頭画像と同期して運用
--
-- 注意:
--   - 本番実行はまだ行わないこと
--   - 実行後に admin-schedule Edge Function / フロントを再デプロイ
-- =============================================================================

ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS image_urls jsonb;

COMMENT ON COLUMN public.schedules.image_urls IS
  'スケジュール画像URL配列。例: ["https://.../front.webp","https://.../back.webp"]';

ALTER TABLE public.schedules
  DROP CONSTRAINT IF EXISTS schedules_image_urls_is_array;

ALTER TABLE public.schedules
  ADD CONSTRAINT schedules_image_urls_is_array
  CHECK (image_urls IS NULL OR jsonb_typeof(image_urls) = 'array');

-- 既存 image_url から image_urls へ移行（既に image_urls がある行は上書きしない）
UPDATE public.schedules
SET image_urls = jsonb_build_array(image_url)
WHERE (image_urls IS NULL OR image_urls = '[]'::jsonb)
  AND image_url IS NOT NULL
  AND btrim(image_url) <> '';

-- 参考: 先頭画像を image_url に同期したい場合（運用時に必要なら）
-- UPDATE public.schedules
-- SET image_url = CASE
--   WHEN image_urls IS NOT NULL
--    AND jsonb_typeof(image_urls) = 'array'
--    AND jsonb_array_length(image_urls) > 0
--   THEN image_urls->>0
--   ELSE NULL
-- END;
