-- instagram_posts に表示順カラムを追加
-- Supabase SQL Editor で実行してください。

alter table public.instagram_posts
  add column if not exists sort_order integer;

comment on column public.instagram_posts.sort_order is
  '表示順（小さいほど上）。未設定時は created_at の新しい順で並ぶ。';

-- 既存行: created_at の新しい順に 10, 20, 30... を付与（sort_order 未設定のみ）
with ranked as (
  select
    id,
    row_number() over (
      order by created_at desc nulls last, id desc
    ) as rn
  from public.instagram_posts
)
update public.instagram_posts as p
set sort_order = ranked.rn * 10
from ranked
where p.id = ranked.id
  and p.sort_order is null;

create index if not exists instagram_posts_sort_order_idx
  on public.instagram_posts (sort_order);
