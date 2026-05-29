-- NEWS テーブルを Supabase CMS 用に拡張
-- 既存の date / title / url がある前提で、不足カラムを追加します。

alter table public.news
  add column if not exists slug text,
  add column if not exists excerpt text,
  add column if not exists content text,
  add column if not exists image_url text,
  add column if not exists category text,
  add column if not exists is_published boolean not null default true;

create unique index if not exists news_slug_key on public.news (slug);

-- 既存行: slug 未設定かつ title がある場合は仮 slug を付与（必要に応じて管理画面で修正）
update public.news
set slug = 'news-' || id::text
where (slug is null or slug = '')
  and id is not null;
