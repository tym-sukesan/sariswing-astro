# Gosaki existing schedule rows manual SQL execution checklist (G-9c2b)

**Phase:** `G-9c2b-gosaki-existing-schedule-rows-manual-sql-execution-checklist`  
**Date:** 2026-06-16  
**Prior:** G-9c2a replanning (`d24376e`)  
**Type:** **operator execution checklist** — Cursor / AI does **not** execute SQL

---

## Approach

**UPDATE / correction** — adopt existing 60 `schedule-2026-*` rows as Gosaki seed. **No 60 INSERT.**

| Superseded | Use instead |
| --- | --- |
| `gosaki-schedule-seed-operator-manual-sql-execution-checklist.md` (60 INSERT) | **this checklist** |

**Replan reference:** `gosaki-existing-schedule-rows-migration-replanning.md`

---

## Who executes what

| Actor | Action |
| --- | --- |
| **Operator** | Supabase SQL Editor on `static-to-astro-cms-staging` only |
| **Cursor / AI / CI** | **No** SQL execution, **no** DB connection |

### SQL template files

| Step | Template |
| ---: | --- |
| 2 | `scripts/supabase/gosaki-site-slug-migration.template.sql` |
| 4 | `scripts/supabase/gosaki-existing-schedules-site-slug-backfill.template.sql` |
| 5 | `scripts/supabase/gosaki-existing-schedules-source-route-update.template.sql` |
| 6 | `scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql` |
| 1 / 7 / 8 | `scripts/supabase/gosaki-existing-schedules-migration-preflight.template.sql` |

---

## Operator approval (required before Steps 2, 4, 5, 6)

Record **once** in your execution log before any write SQL:

```txt
承認します。static-to-astro-cms-staging に対して、G-9c2b の既存60行 migration SQL をこの順番で1回だけ手動実行します。
```

### Rollback approval (separate — only if rollback needed)

```txt
承認します。この rollback 操作を1回だけ実行してください。
```

---

## Global stop conditions

**Stop immediately. Do not auto-retry** if any of the following occur:

| # | Condition |
| ---: | --- |
| 1 | Supabase project cannot be confirmed as `static-to-astro-cms-staging` |
| 2 | `schedule_2026_rows` ≠ **60** |
| 3 | `legacy_id` duplicates ≥ **1** |
| 4 | Month counts ≠ **13 / 10 / 12 / 11 / 14** |
| 5 | `site_slug` column already exists **and** `site_slug = 'gosaki-piano'` ≥ **1** row (partial prior migration) |
| 6 | Step 4 UPDATE affects ≠ **60** rows |
| 7 | Step 5 UPDATE affects ≠ **60** rows |
| 8 | Step 6 UPDATE affects ≠ **1** row |
| 9 | After Step 7: `site_slug = 'gosaki-piano'` count ≠ **60** |
| 10 | After Step 7: any `source_route` is not `/schedule/YYYY-MM/` |
| 11 | After Step 7: `schedule-2026-07-010` restored values do not match expectations |

---

## Execution overview

| Step | Action | SQL type | Write? |
| ---: | --- | --- | :---: |
| **0** | Supabase project confirmation | checklist | — |
| **1** | Before SELECT + snapshot | SELECT | — |
| **2** | `site_slug` column + indexes | DDL | ✓ |
| **3** | Column / index verification | SELECT | — |
| **4** | Backfill `site_slug = 'gosaki-piano'` | UPDATE | ✓ |
| **5** | Canonicalize `source_route` | UPDATE | ✓ |
| **6** | Restore `schedule-2026-07-010` PoC fields | UPDATE | ✓ |
| **7** | After verification SELECT | SELECT | — |
| **8** | Rollback SQL storage | reference | — |

---

## Step 0 — Supabase project confirmation

### Operator executes

**No SQL.** Dashboard checklist only.

```txt
□ Project name: static-to-astro-cms-staging
□ NOT Sariswing production Supabase
□ NOT gosaki-piano.com production backend
□ SQL Editor URL shows staging project identifier
□ Human SQL Editor access (not service_role in tooling)
```

Optional host (verify in dashboard):

```txt
kmjqppxjdnwwrtaeqjta.supabase.co
```

### Pre-execution checks

- Confirm project in a fresh dashboard tab before opening SQL Editor.
- Close other Supabase project tabs.

### Expected result

- All checklist items **yes**.

### Stop if

- Project identity uncertain.

### Proceed when

- Project confirmed `static-to-astro-cms-staging`.

---

## Step 1 — Before SELECT

### Operator executes

Paste and run **all** queries. **Save full results** — especially `schedule-2026-07-010` snapshot for rollback.

```sql
-- G-9c2b Step 1 — before SELECT; static-to-astro-cms-staging only

select count(*) as schedule_2026_rows
from public.schedules
where legacy_id like 'schedule-2026-%';

select count(*) as legacy_id_duplicates
from (
  select legacy_id, count(*) as c
  from public.schedules
  where legacy_id like 'schedule-2026-%'
  group by legacy_id
  having count(*) > 1
) d;

select month, count(*) as events
from public.schedules
where legacy_id like 'schedule-2026-%'
group by month
order by month;

select source_route, count(*) as events
from public.schedules
where legacy_id like 'schedule-2026-%'
group by source_route
order by source_route;

select count(*) as gosaki_rows_before
from public.schedules
where site_slug = 'gosaki-piano';

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';

-- REQUIRED: save for rollback Step 8C
select *
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

select id, legacy_id, date, title, venue, open_time, start_time, price,
       description, source_route, source_file, published, show_on_home, sort_order
from public.schedules
where legacy_id = 'schedule-2026-07-010';
```

### Pre-execution checks

- Step 0 passed.
- No write SQL yet.

### Expected result

| Check | Expected |
| --- | --- |
| `schedule_2026_rows` | **60** |
| `legacy_id_duplicates` | **0** |
| Month counts | 2026-03=**13**, 2026-04=**10**, 2026-05=**12**, 2026-06=**11**, 2026-07=**14** |
| `source_route` | `/schedule-2026-03/` … `/schedule-2026-07/` (legacy format) |
| `gosaki_rows_before` | **0** |
| `site_slug` column | **0 rows** (typical) or exists with 0 gosaki rows |
| `schedule-2026-07-010` `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |

### Stop if

- `schedule_2026_rows` ≠ 60
- `legacy_id_duplicates` > 0
- Month counts wrong
- `gosaki_rows_before` ≥ 1
- `site_slug` column exists **and** `gosaki_rows_before` ≥ 1
- PoC row `id` mismatch

### Proceed when

- All expectations match.
- Step 1 snapshot saved (screenshot / copy) — **mandatory for rollback C**.

---

## Step 2 — `site_slug` column + indexes migration

### Operator executes

**Skip DDL** only if Step 1 shows `site_slug` column already exists **and** indexes verified in Step 3.

Source: `scripts/supabase/gosaki-site-slug-migration.template.sql`

```sql
-- G-9c2b Step 2 — site_slug migration; static-to-astro-cms-staging ONLY

begin;

alter table public.schedules
  add column if not exists site_slug text;

comment on column public.schedules.site_slug is
  'CMS Kit site identifier, e.g. gosaki-piano. NULL = legacy Kit / PoC rows.';

create index if not exists schedules_site_slug_date_idx
  on public.schedules (site_slug, date);

create index if not exists schedules_site_slug_month_idx
  on public.schedules (site_slug, month);

commit;
```

### Pre-execution checks

- Step 0 + Step 1 passed.
- Operator approval recorded.
- Project still `static-to-astro-cms-staging`.

### Expected result

- DDL completes without error.
- **No UPDATE** on rows in this step.

### Stop if

- DDL error.
- Wrong project suspected.

### Proceed when

- Migration succeeded or Step 2 skipped (column pre-existed).

---

## Step 3 — Column / index verification

### Operator executes

```sql
-- G-9c2b Step 3 — post-migration verify; SELECT only

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedules'
  and indexname in (
    'schedules_site_slug_date_idx',
    'schedules_site_slug_month_idx'
  );
```

### Pre-execution checks

- Step 2 completed or skipped.

### Expected result

| Check | Expected |
| --- | --- |
| `site_slug` column | **1 row** |
| Indexes | **2 rows** |

### Stop if

- Column or either index missing (after Step 2 was run).

### Proceed when

- Column + both indexes confirmed.

---

## Step 4 — Existing 60 rows `site_slug` backfill

### Operator executes

**Pre-check** (SELECT only):

```sql
select count(*) as schedule_2026_rows
from public.schedules
where legacy_id like 'schedule-2026-%';

select count(*) as already_tagged
from public.schedules
where site_slug = 'gosaki-piano';
```

Then run UPDATE (source: `gosaki-existing-schedules-site-slug-backfill.template.sql`):

```sql
-- G-9c2b Step 4 — site_slug backfill; EXPECT exactly 60 rows updated

begin;

update public.schedules
set site_slug = 'gosaki-piano'
where legacy_id like 'schedule-2026-%'
  and site_slug is null;

commit;
```

**Post-check** (SELECT only):

```sql
select count(*) as gosaki_rows
from public.schedules
where site_slug = 'gosaki-piano';
```

### Pre-execution checks

- Steps 0–3 passed.
- Operator approval on record.
- `schedule_2026_rows` = 60, `already_tagged` = 0.

### Expected result

| Check | Expected |
| --- | --- |
| SQL Editor `rowsAffected` | **60** |
| `gosaki_rows` post-check | **60** |
| `site_slug` value | `gosaki-piano` on all 60 |

### Stop if

- UPDATE affects ≠ **60** rows.
- Post-check count ≠ **60**.
- Any row outside `schedule-2026-%` tagged.

### Proceed when

- Exactly **60** rows tagged `gosaki-piano`.

---

## Step 5 — `source_route` canonical update

### Operator executes

**Pre-check** (SELECT only):

```sql
select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;
```

Then run UPDATE (source: `gosaki-existing-schedules-source-route-update.template.sql`):

```sql
-- G-9c2b Step 5 — source_route canonicalize; EXPECT exactly 60 rows updated

begin;

update public.schedules
set source_route = '/schedule/' || month || '/'
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%'
  and source_route is distinct from ('/schedule/' || month || '/');

commit;
```

**Post-check** (SELECT only):

```sql
select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;
```

### Pre-execution checks

- Step 4 passed (`gosaki_rows` = 60).
- Operator approval on record.

### Expected result

| Check | Expected |
| --- | --- |
| SQL Editor `rowsAffected` | **60** |
| `source_route` groups | `/schedule/2026-03/` = 13, `/schedule/2026-04/` = 10, `/schedule/2026-05/` = 12, `/schedule/2026-06/` = 11, `/schedule/2026-07/` = 14 |
| Legacy `/schedule-2026-XX/` | **0 rows** |

### Stop if

- UPDATE affects ≠ **60** rows.
- Post-check shows legacy `source_route` format.

### Proceed when

- All 60 rows use canonical `/schedule/YYYY-MM/`.

---

## Step 6 — `schedule-2026-07-010` PoC row restore

**No `legacy_id` rename.** Restore G-6 PoC-altered fields to Gosaki seed values.

### Operator executes

**Pre-check** — confirm current PoC values match Step 1 snapshot.

Source: `gosaki-schedule-2026-07-010-restore.template.sql`

```sql
-- G-9c2b Step 6 — PoC restore; EXPECT exactly 1 row updated
-- WHERE must include id + legacy_id

begin;

update public.schedules
set
  title = '<>',
  venue = null,
  open_time = null,
  start_time = null,
  price = null,
  description = '出演：',
  source_file = '2026-07.html',
  source_route = '/schedule/2026-07/',
  show_on_home = false,
  home_order = null,
  published = true,
  sort_order = 100
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano';

commit;
```

**Post-check** (SELECT only):

```sql
select id, legacy_id, site_slug, title, venue, open_time, start_time,
       price, description, source_route, published, show_on_home, sort_order
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Pre-execution checks

- Steps 0–5 passed.
- Operator approval on record.
- Step 1 snapshot saved.

### Expected result

| Field | Expected |
| --- | --- |
| SQL Editor `rowsAffected` | **1** |
| `legacy_id` | `schedule-2026-07-010` (unchanged) |
| `site_slug` | `gosaki-piano` |
| `title` | `<>` |
| `venue` | `NULL` |
| `open_time` | `NULL` |
| `start_time` | `NULL` |
| `price` | `NULL` |
| `description` | `出演：` |
| `source_route` | `/schedule/2026-07/` |
| `published` | `true` |
| `show_on_home` | `false` |

`updated_at` may advance (trigger) — acceptable.

### Stop if

- UPDATE affects ≠ **1** row.
- Post-check values differ from expected.

### Proceed when

- Exactly **1** row restored to Gosaki seed values.

---

## Step 7 — After verification SELECT

### Operator executes

```sql
-- G-9c2b Step 7 — after verification; SELECT only

select count(*) as gosaki_rows
from public.schedules
where site_slug = 'gosaki-piano';

select month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by month
order by month;

select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;

select legacy_id, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and (
    source_route ~ '^/schedule-[0-9]{4}-[0-9]{2}/$'
    or (source_route ~ '^/[0-9]{4}-[0-9]{2}/$' and source_route not like '/schedule/%')
  );

select
  count(*) filter (where published = true) as published_true,
  count(*) filter (where show_on_home = false) as show_on_home_false,
  count(*) filter (where show_on_home is not null and show_on_home = true) as show_on_home_true
from public.schedules
where site_slug = 'gosaki-piano';

select id, legacy_id, site_slug, title, venue, open_time, start_time,
       description, source_route, published, show_on_home
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

select count(*) as non_gosaki_schedule_2026
from public.schedules
where legacy_id like 'schedule-2026-%'
  and (site_slug is null or site_slug <> 'gosaki-piano');
```

### Pre-execution checks

- Steps 0–6 completed without stop.

### Expected result

| Check | Expected |
| --- | --- |
| `gosaki_rows` | **60** |
| Month counts | 13 / 10 / 12 / 11 / 14 |
| `source_route` | only `/schedule/2026-03/` … `/schedule/2026-07/` |
| Legacy route query | **0 rows** |
| `published_true` | **60** |
| `show_on_home_false` | **60** |
| `show_on_home_true` | **0** |
| `schedule-2026-07-010` | restored values per Step 6 |
| `non_gosaki_schedule_2026` | **0** |

### Stop if

- Any check fails.

### Proceed when

- All checks pass → **G-9c2c execution complete**. Record completion time + result snapshots.

---

## Step 8 — Rollback SQL storage

**Store only — do not run** on success path. Rollback C **requires Step 1 saved snapshot**.

### A. Clear `site_slug` on Gosaki rows

```sql
-- DESTRUCTIVE ROLLBACK A — staging only
-- Approval: 承認します。この rollback 操作を1回だけ実行してください。

begin;

update public.schedules
set site_slug = null
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%';

commit;
```

**Expect:** 60 rows updated; `gosaki-piano` count = 0.

### B. Revert `source_route` to legacy format

Run **after** rollback A if Step 5 was applied. Use Step 1 `source_route` snapshot to verify.

```sql
-- DESTRUCTIVE ROLLBACK B — staging only

begin;

update public.schedules
set source_route = '/schedule-' || month || '/'
where legacy_id like 'schedule-2026-%'
  and site_slug is null
  and source_route like '/schedule/%';

commit;
```

### C. Restore `schedule-2026-07-010` PoC fields

**Use Step 1 saved snapshot values** — not generic placeholders.

```sql
-- DESTRUCTIVE ROLLBACK C — staging only
-- Replace <saved> with values from Step 1 select *

begin;

update public.schedules
set
  title = '<saved>',
  venue = '<saved>',
  open_time = '<saved>',
  start_time = '<saved>',
  price = <saved>,
  description = '<saved>',
  source_route = '<saved>',
  source_file = '<saved>',
  published = <saved>,
  show_on_home = <saved>,
  sort_order = <saved>
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

commit;
```

### D. Drop `site_slug` column / indexes — **do not rollback**

Leave column in place (additive, nullable).

### Pre-execution checks (if rollback ever needed)

- Confirm project = `static-to-astro-cms-staging`
- Separate rollback approval recorded
- Step 1 snapshot available for rollback C

### Expected result (success path)

- Rollback SQL stored, **not executed**.

### Stop if

- Attempting rollback without Step 1 snapshot or separate approval.

---

## Out of scope

- Cursor / AI SQL execution
- 60 INSERT (deprecated path)
- PoC `legacy_id` rename to `-poc`
- `schedule_months` writes
- RLS / GRANT / `/admin` / FTP / workflow_dispatch / production

---

## Gates (after operator execution in G-9c2c)

```txt
gosakiExistingRowsManualSqlExecutionComplete: true        (G-9c2c — after Step 7 pass)
gosakiExistingRowsSiteSlugBackfilled: true
gosakiExistingRowsSourceRouteCanonical: true
gosakiSchedule202607010Restored: true
readyForG9dAstroSupabaseScheduleRead: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## Checklist phase gates (this document)

```txt
gosakiExistingRowsManualSqlExecutionChecklistComplete: true
gosakiDeprecatedInsertChecklistBannerAdded: true
gosakiExistingRowsMigrationSequenceDocumented: true
gosakiExistingRowsRollbackPlanDocumented: true
readyForG9c2cExistingRowsOperatorManualSqlExecution: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```
