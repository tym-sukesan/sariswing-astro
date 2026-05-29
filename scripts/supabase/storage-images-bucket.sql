-- Supabase Storage: 管理画面からの画像アップロード用
-- Supabase Dashboard → SQL Editor で実行してください。
--
-- 前提:
--   - 公開サイトで画像 URL をそのまま表示するため public バケット
--   - 管理画面は Basic 認証で保護（anon key でのアップロードは運用リスクあり。将来 Auth 推奨）
--   - フロントは PUBLIC_SUPABASE_ANON_KEY を使用

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 公開読み取り（サイト表示・管理画面プレビュー）
create policy "images_public_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'images');

-- 管理画面からのアップロード（anon）
create policy "images_anon_insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'images');

-- 上書き・削除（必要に応じて。運用で使う場合のみ）
create policy "images_anon_update"
  on storage.objects
  for update
  to anon
  using (bucket_id = 'images')
  with check (bucket_id = 'images');

create policy "images_anon_delete"
  on storage.objects
  for delete
  to anon
  using (bucket_id = 'images');
