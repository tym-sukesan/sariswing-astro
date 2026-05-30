-- 固定ページ用テーブル（About / Contact など HTML 編集ページ向け）
-- Supabase SQL Editor で実行してください。

create table if not exists public.site_pages (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  html_content text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists site_pages_slug_idx on public.site_pages (slug);

comment on table public.site_pages is '固定ページの HTML コンテンツ（管理画面から編集）';
comment on column public.site_pages.slug is 'URL スラッグ（例: about → /about/）';
comment on column public.site_pages.html_content is 'main 要素内に挿入する HTML（管理者のみ編集）';
