-- 固定ページ HTML の履歴（バックアップ）テーブル
-- About 以外の page_slug（company, contact など）にも流用可能
-- Supabase SQL Editor で実行してください。

create table if not exists public.site_page_revisions (
  id bigint generated always as identity primary key,
  page_slug text not null,
  html_content text not null,
  created_at timestamptz not null default now()
);

create index if not exists site_page_revisions_page_slug_created_at_idx
  on public.site_page_revisions (page_slug, created_at desc);

comment on table public.site_page_revisions is '固定ページ HTML の保存前スナップショット（管理画面バックアップ）';
comment on column public.site_page_revisions.page_slug is '対象ページの slug（site_pages.slug と対応）';
comment on column public.site_page_revisions.html_content is '保存直前の html_content';
