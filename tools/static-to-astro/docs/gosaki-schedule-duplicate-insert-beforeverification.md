# G-22d3a — Gosaki Schedule duplicate INSERT beforeVerification

**Phase:** `G-22d3a-gosaki-schedule-duplicate-insert-beforeverification`  
**Status:** ready for operator manual execution (SELECT only)  
**Date:** 2026-07-02  
**Base commit:** `07202b3`  
**Prior:** [gosaki-schedule-duplicate-insert-final-preflight.md](./gosaki-schedule-duplicate-insert-final-preflight.md) (G-22d2)

| Check | Status |
| --- | --- |
| Supabase project | **`static-to-astro-cms-staging`** (`kmjqppxjdnwwrtaeqjta.supabase.co`) only |
| SQL type | **SELECT only** |
| Save / INSERT executed | **no** |

---

## Operator steps

1. Open Supabase Dashboard → project **`static-to-astro-cms-staging`**
2. Confirm URL host is **`kmjqppxjdnwwrtaeqjta.supabase.co`** (never `vsbvndwuajjhnzpohghh`)
3. SQL Editor → New query
4. Paste **entire block below** → Run
5. Review **Result 1** (check summary): every row must show `pass = true`
6. Review **Result 2** (source row): exactly **1 row**, fields match §Expected results
7. Review **Result 3** (march inventory): **13 rows**, `schedule-2026-03-001` … `013`, **no** `014`
8. If all PASS → proceed to **G-22d3b** (dev arm + Save). If any FAIL → **STOP**

---

## beforeVerification SQL (paste entire block)

```sql
-- =============================================================================
-- G-22d3a beforeVerification — Gosaki Schedule duplicate INSERT (SELECT only)
-- Project: static-to-astro-cms-staging (kmjqppxjdnwwrtaeqjta.supabase.co)
-- Source id: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
-- Planned insert legacy_id: schedule-2026-03-014
-- DO NOT INSERT / UPDATE / DELETE
-- =============================================================================

-- Result 1: automated check summary (all pass must be true)
with
  source as (
    select *
    from public.schedules
    where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69'
  ),
  march as (
    select *
    from public.schedules
    where site_slug = 'gosaki-piano'
      and month = '2026-03'
  ),
  planned as (
    select count(*)::int as cnt
    from public.schedules
    where site_slug = 'gosaki-piano'
      and legacy_id = 'schedule-2026-03-014'
  ),
  march_stats as (
    select
      count(*)::int as march_count,
      max(sort_order)::int as max_sort_order
    from march
  ),
  march_legacy as (
    select
      count(*)::int as march_legacy_count,
      count(*) filter (
        where legacy_id ~ '^schedule-2026-03-0(0[1-9]|1[0-3])$'
      )::int as legacy_001_013_count,
      count(*) filter (
        where legacy_id = 'schedule-2026-03-014'
      )::int as legacy_014_count
    from march
  ),
  expected_description as (
    select
      '出演：【第一部Live】MAREE ARAKY vo,pf 後藤沙紀pianica,pf 【第二部Session】ホスト 後藤沙紀pf' || E'\n' ||
      '会場website: https://www.coffeebigaku.com/' as text
  )
select
  check_name,
  pass,
  detail
from (
  select
    '01_source_row_exists'::text as check_name,
    (select count(*) from source) = 1 as pass,
    'expected exactly 1 source row'::text as detail
  union all
  select
    '02_source_legacy_id',
    coalesce((select legacy_id from source limit 1) = 'schedule-2026-03-003', false),
    coalesce((select legacy_id from source limit 1), '<missing>')
  union all
  select
    '03_source_title',
    coalesce((select title from source limit 1) = '<Live & Session>', false),
    coalesce((select title from source limit 1), '<missing>')
  union all
  select
    '04_source_site_slug',
    coalesce((select site_slug from source limit 1) = 'gosaki-piano', false),
    coalesce((select site_slug from source limit 1), '<missing>')
  union all
  select
    '05_planned_legacy_absent',
    (select cnt from planned) = 0,
    'schedule-2026-03-014 count = ' || (select cnt from planned)::text
  union all
  select
    '06_march_count_13',
    (select march_count from march_stats) = 13,
    'march_count = ' || (select march_count from march_stats)::text
  union all
  select
    '07_march_max_sort_order_130',
    (select max_sort_order from march_stats) = 130,
    'max_sort_order = ' || coalesce((select max_sort_order from march_stats)::text, '<null>')
  union all
  select
    '08_march_legacy_001_013_only',
    (select legacy_001_013_count from march_legacy) = 13
      and (select legacy_014_count from march_legacy) = 0
      and (select march_legacy_count from march_legacy) = 13,
    '001-013 count = ' || (select legacy_001_013_count from march_legacy)::text
      || ', 014 count = ' || (select legacy_014_count from march_legacy)::text
  union all
  select
    '09_payload_date',
    coalesce((select date::text from source limit 1) = '2026-03-08', false),
    coalesce((select date::text from source limit 1), '<missing>')
  union all
  select
    '10_payload_venue',
    coalesce((select venue from source limit 1) = '学芸大学 珈琲美学', false),
    coalesce((select venue from source limit 1), '<missing>')
  union all
  select
    '11_payload_open_time',
    coalesce((select open_time from source limit 1) = '11:30', false),
    coalesce((select open_time from source limit 1), '<missing>')
  union all
  select
    '12_payload_start_time',
    coalesce((select start_time from source limit 1) = '12:30', false),
    coalesce((select start_time from source limit 1), '<missing>')
  union all
  select
    '13_payload_price',
    coalesce((select price from source limit 1) = '3,850円(税込)', false),
    coalesce((select price from source limit 1), '<missing>')
  union all
  select
    '14_payload_source_file',
    coalesce((select source_file from source limit 1) = '2026-03.html', false),
    coalesce((select source_file from source limit 1), '<missing>')
  union all
  select
    '15_payload_source_route',
    coalesce((select source_route from source limit 1) = '/schedule/2026-03/', false),
    coalesce((select source_route from source limit 1), '<missing>')
  union all
  select
    '16_payload_description',
    coalesce((select description from source limit 1) = (select text from expected_description), false),
    case
      when (select description from source limit 1) is null then '<null>'
      else left((select description from source limit 1), 60) || '…'
    end
) checks
order by check_name;

-- Result 2: source row snapshot (human review)
select
  id,
  legacy_id,
  site_slug,
  date,
  year,
  month,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  image_url,
  source_file,
  source_route,
  show_on_home,
  home_order,
  published,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69';

-- Result 3: 2026-03 legacy_id inventory (human review)
select
  legacy_id,
  date,
  title,
  sort_order,
  published
from public.schedules
where site_slug = 'gosaki-piano'
  and month = '2026-03'
order by legacy_id asc;
```

---

## Expected results

### Result 1 — check summary

**16 rows**, every row: `pass = true`

| check_name | pass | detail (when pass) |
| --- | --- | --- |
| `01_source_row_exists` | `true` | exactly 1 source row |
| `02_source_legacy_id` | `true` | `schedule-2026-03-003` |
| `03_source_title` | `true` | `<Live & Session>` |
| `04_source_site_slug` | `true` | `gosaki-piano` |
| `05_planned_legacy_absent` | `true` | `schedule-2026-03-014 count = 0` |
| `06_march_count_13` | `true` | `march_count = 13` |
| `07_march_max_sort_order_130` | `true` | `max_sort_order = 130` |
| `08_march_legacy_001_013_only` | `true` | `001-013 count = 13`, `014 count = 0` |
| `09`–`16_payload_*` | `true` | source fields match G-22d2 §5 INSERT payload (copy source) |

### Result 2 — source row (1 row)

| Field | Expected |
| --- | --- |
| `id` | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| `legacy_id` | `schedule-2026-03-003` |
| `site_slug` | `gosaki-piano` |
| `title` | `<Live & Session>` |
| `date` | `2026-03-08` |
| `venue` | `学芸大学 珈琲美学` |
| `open_time` / `start_time` | `11:30` / `12:30` |
| `price` | `3,850円(税込)` |
| `published` | `true` |
| `sort_order` | `30` |
| `source_file` / `source_route` | `2026-03.html` / `/schedule/2026-03/` |

After INSERT (G-22d3b), inserted row will use: title `<Live & Session>（コピー）`, `published=false`, `sort_order=140`, `legacy_id=schedule-2026-03-014`.

### Result 3 — march inventory (13 rows)

`schedule-2026-03-001` through `schedule-2026-03-013` — **no** `schedule-2026-03-014`.

---

## STOP conditions

**1つでも想定外なら G-22d3b に進まない。**

| STOP if | Action |
| --- | --- |
| Supabase project is not `static-to-astro-cms-staging` | Close SQL Editor; switch project |
| Any Result 1 row has `pass = false` | STOP — record failing `check_name` + `detail` |
| Result 2 returns 0 rows or ≠ 1 row | STOP — source row missing or duplicated |
| Result 3 count ≠ 13 or includes `014` | STOP — re-plan `legacy_id` / `sort_order` |
| `max_sort_order` ≠ 130 | STOP — update G-22d2 payload `sort_order` before INSERT |

---

## Forbidden (this phase)

| Operation | Executed |
| --- | --- |
| Save / 複製案を保存 | **no** |
| SQL INSERT / UPDATE / DELETE | **no** |
| Rollback SQL | **no** |
| package regen / FTP | **no** |

---

## Next phase

**G-22d3b** — dev env arm + operator single Save (after beforeVerification PASS)
