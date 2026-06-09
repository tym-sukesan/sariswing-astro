-- Staging Supabase only: create public bucket `site-assets` for CMS images.
-- Run in Supabase Dashboard → SQL Editor on the **staging** project.
-- Do NOT run on production / Sariswing production Supabase.

-- 1. Create bucket (public read for anon GET)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Public read policy (anon + authenticated SELECT)
DROP POLICY IF EXISTS "site-assets public read" ON storage.objects;
CREATE POLICY "site-assets public read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'site-assets');

-- 3. Service role / admin write is implicit via service_role key (bypasses RLS).
-- Verify:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'site-assets';
