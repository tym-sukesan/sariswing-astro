# Gosaki schedule seed operator manual SQL execution checklist (G-9c2)

**Phase:** `G-9c2-gosaki-schedule-seed-operator-manual-sql-execution`  
**Date:** 2026-06-16  
**Prior:** G-9c1 preflight (`6c0cb68`)  
**Type:** **operator execution checklist** — Cursor / AI does **not** execute SQL

---

## Who executes what

| Actor | Action |
| --- | --- |
| **Operator** | Supabase SQL Editor on `static-to-astro-cms-staging` only |
| **Cursor / AI / CI** | **No** SQL execution, **no** DB connection |

**Reference docs / templates:**

| File | Use |
| --- | --- |
| `docs/gosaki-schedule-seed-operator-manual-sql-execution-preflight.md` | Full preflight rationale |
| `scripts/supabase/gosaki-site-slug-migration.template.sql` | Step 2 source |
| `scripts/supabase/gosaki-schedules-seed.template.sql` | Step 6 source (60 INSERT) |
| `scripts/supabase/gosaki-schedules-seed-preflight.template.sql` | Step 1 / 7 / rollback reference |

**Seed policy:**

```txt
site_slug:    gosaki-piano
source_route: /schedule/YYYY-MM/   (canonical — NOT legacy /YYYY-MM/)
rows:         60 plain INSERT, begin/commit, no ON CONFLICT
```

---

## Operator approval (required before Steps 2–6)

Type or paste this **once** before any write SQL (Steps 2, 4, 6). Save in your execution log.

```txt
承認します。static-to-astro-cms-staging に対して、G-9c2 のSQLをこの順番で1回だけ手動実行します。
```

**Do not proceed** without this approval and without Step 0 project confirmation.

---

## Global stop conditions

**Stop immediately** (do not retry automatically) if any of the following occur:

| # | Condition |
| ---: | --- |
| 1 | Supabase project cannot be confirmed as `static-to-astro-cms-staging` |
| 2 | `site_slug = 'gosaki-piano'` already has **1 or more** rows **before** Step 6 |
| 3 | Row with `legacy_id = 'schedule-2026-07-010'` does **not** match expected PoC `id` |
| 4 | Step 4 UPDATE affects **not exactly 1** row |
| 5 | After Step 4, `legacy_id = 'schedule-2026-07-010'` still exists on the **PoC row** (`id = aa440e29-…`) |
| 6 | Step 6 INSERT fails partway through the transaction |
| 7 | After Step 7, Gosaki row count is **not 60** |
| 8 | After Step 7, month counts are **not** 13 / 10 / 12 / 11 / 14 |
| 9 | After Step 7, any `source_route` uses legacy `/2026-XX/` (not `/schedule/2026-XX/`) |

On stop: record error message, save query results, consult rollback SQL (Step 8). **Do not** auto-retry.

---

## Execution overview

| Step | Action | SQL type | Skip condition |
| ---: | --- | --- | --- |
| **0** | Supabase project confirmation | checklist | — |
| **1** | Before SELECT | SELECT only | — |
| **2** | `site_slug` migration | DDL | column already exists |
| **3** | Column / index verification | SELECT only | — |
| **4** | G-6 PoC `legacy_id` rename | UPDATE (1 row) | — |
| **5** | Collision resolution check | SELECT only | — |
| **6** | Gosaki 60 seed INSERT | INSERT (transaction) | — |
| **7** | After verification SELECT | SELECT only | — |
| **8** | Rollback SQL storage | reference only | — |

---

## Step 0 — Supabase project confirmation

### Operator executes

**No SQL.** Dashboard / URL checklist only.

```txt
□ Supabase project name: static-to-astro-cms-staging
□ NOT Sariswing production Supabase project
□ NOT gosaki-piano.com production backend
□ SQL Editor URL / dashboard shows staging project identifier
□ Operator has staging SQL Editor access (human login — not service_role in tooling)
```

Optional host check (verify in Supabase dashboard):

```txt
kmjqppxjdnwwrtaeqjta.supabase.co
```

### Pre-execution checks

- Open Supabase dashboard in a fresh tab; confirm project name before SQL Editor.
- Close any other Supabase project tabs to avoid paste-into-wrong-project mistakes.

### Expected result

- All checklist items confirmed **yes**.

### Stop if

- Project identity is **uncertain** or any checklist item is **no**.

### Proceed to Step 1 when

- Project is **confirmed** `static-to-astro-cms-staging`.

---

## Step 1 — Before SELECT

### Operator executes

Paste and run **all** queries below. Save results (screenshot or copy).

```sql
-- G-9c2 Step 1 — before SELECT; static-to-astro-cms-staging only

-- Total schedules count (baseline)
select count(*) as total_schedules from public.schedules;

-- Gosaki seed must not exist yet
select count(*) as gosaki_rows_before
from public.schedules
where site_slug = 'gosaki-piano';

-- site_slug column status (0 rows = migration needed in Step 2; 1 row = skip Step 2)
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';

-- Existing schedule-2026-* rows (review for collisions)
select legacy_id, id, date, title, venue, site_slug, source_route
from public.schedules
where legacy_id like 'schedule-2026-%'
order by legacy_id;

-- G-6 PoC row — must exist before rename (Step 4)
select id, legacy_id, date, title, venue, description, site_slug, updated_at
from public.schedules
where legacy_id = 'schedule-2026-07-010';

-- Confirm PoC row by id (narrow target for Step 4)
select id, legacy_id, date, title, site_slug
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Pre-execution checks

- Step 0 passed.
- **Do not** run write SQL yet (approval + Steps 2–6 come later).

### Expected result

| Check | Expected |
| --- | --- |
| `gosaki_rows_before` | **0** |
| G-6 PoC `legacy_id` | `schedule-2026-07-010` |
| G-6 PoC `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| G-6 PoC `site_slug` | `NULL` |
| `site_slug` column | 0 or 1 row in `information_schema` (determines Step 2 skip) |

**Note:** PoC `title` / `venue` / `description` / times may reflect G-6 write history (G-6-f6, G-6-g1, G-6-g2). Only `id` + `legacy_id` matter for collision resolution.

### Stop if

- `gosaki_rows_before` ≥ **1**
- PoC query returns **0 rows** or **more than 1 row** for `legacy_id = 'schedule-2026-07-010'`
- PoC `id` is **not** `aa440e29-5be8-402e-9190-0d81c48434c0`
- `id = aa440e29-…` row has `legacy_id` **other than** `schedule-2026-07-010`

### Proceed to Step 2 when

- `gosaki_rows_before = 0`
- PoC row matches expected `id` + `legacy_id`
- (If `site_slug` column already exists → skip Step 2 DDL, go to Step 3)

---

## Step 2 — `site_slug` migration

### Operator executes

**Skip entirely** if Step 1 already shows `site_slug` column exists (1 row in `information_schema`).

Otherwise paste and run:

```sql
-- G-9c2 Step 2 — site_slug migration; static-to-astro-cms-staging ONLY

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

Source file: `scripts/supabase/gosaki-site-slug-migration.template.sql`

### Pre-execution checks

- Step 0 + Step 1 passed.
- Operator approval text recorded (see top of this doc).
- Confirm project **still** `static-to-astro-cms-staging` before Run.

### Expected result

- Query completes without error.
- `commit` succeeds.
- **No UPDATE** on existing rows (PoC remains `site_slug NULL`).

### Stop if

- Any DDL error.
- Wrong Supabase project suspected.

### Proceed to Step 3 when

- Migration succeeded **or** Step 2 was skipped (column pre-existed).

---

## Step 3 — `site_slug` column / index verification

### Operator executes

```sql
-- G-9c2 Step 3 — post-migration verify; SELECT only

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
| Indexes | **2 rows**: `schedules_site_slug_date_idx`, `schedules_site_slug_month_idx` |

### Stop if

- `site_slug` column missing.
- Either index missing (after Step 2 was run).

### Proceed to Step 4 when

- Column + both indexes confirmed.

---

## Step 4 — G-6 PoC `legacy_id` rename

### Operator executes

```sql
-- G-9c2 Step 4 — PoC legacy_id rename; static-to-astro-cms-staging ONLY
-- EXPECT: exactly 1 row updated

begin;

update public.schedules
set legacy_id = 'schedule-2026-07-010-poc'
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

commit;
```

### Pre-execution checks

- Steps 0–3 passed.
- Operator approval on record.
- **WHERE includes `id`** — never rename by `legacy_id` alone.
- Do **not** change `site_slug`, `title`, `venue`, or other PoC fields.

### Expected result

- **Exactly 1 row** updated (`rowsAffected = 1` in SQL Editor).
- PoC `id` unchanged: `aa440e29-5be8-402e-9190-0d81c48434c0`.
- `updated_at` may advance (trigger `schedules_set_updated_at`) — acceptable.

### Stop if

- **0 rows** updated.
- **More than 1 row** updated.
- Any error during transaction.

### Proceed to Step 5 when

- Exactly **1** row updated successfully.

---

## Step 5 — Collision resolution verification

### Operator executes

```sql
-- G-9c2 Step 5 — collision resolved; SELECT only

-- PoC row renamed
select id, legacy_id, site_slug
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

-- Old legacy_id must not exist on PoC row
select count(*) as poc_legacy_id_still_present
from public.schedules
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

-- Gosaki seed legacy_id not yet inserted
select count(*) as gosaki_010_not_yet_present
from public.schedules
where legacy_id = 'schedule-2026-07-010'
  and site_slug = 'gosaki-piano';
```

### Pre-execution checks

- Step 4 reported exactly 1 row updated.

### Expected result

| Check | Expected |
| --- | --- |
| PoC row `legacy_id` | `schedule-2026-07-010-poc` |
| PoC row `site_slug` | `NULL` |
| `poc_legacy_id_still_present` | **0** |
| `gosaki_010_not_yet_present` | **0** (before Step 6) |

**Note:** After Step 6, `schedule-2026-07-010` will exist again as a **Gosaki** row (`site_slug = gosaki-piano`). That is expected.

### Stop if

- PoC row still has `legacy_id = 'schedule-2026-07-010'`
- `poc_legacy_id_still_present` > 0
- `gosaki_010_not_yet_present` > 0 **before** Step 6

### Proceed to Step 6 when

- All expectations above match.

---

## Step 6 — Gosaki 60 seed INSERT

### Operator executes

1. Open `scripts/supabase/gosaki-schedules-seed.template.sql` from commit `d19149c` (or current `main`).
2. Copy the **entire file**: header comments + `begin` + **60** `insert into public.schedules` lines + `commit`.
3. Paste into Supabase SQL Editor (**staging project only**).
4. Review before Run:
   - Exactly **60** INSERT statements
   - All `site_slug` values = `'gosaki-piano'`
   - All `source_route` values = `/schedule/2026-03/` … `/schedule/2026-07/`
   - **No** `ON CONFLICT` clause
   - Wrapped in `begin` / `commit`
5. Execute **once**.

**Do not** paste partial file. **Do not** re-run if Step 7 fails — assess partial state first.

### Pre-execution checks

- Steps 0–5 passed.
- Operator approval on record.
- `gosaki_rows_before` was **0** (Step 1).
- Collision resolved (Step 5).

### Expected result

- Transaction commits without error.
- **60 rows** inserted with `site_slug = 'gosaki-piano'`.

| Property | Value |
| --- | --- |
| Rows | 60 |
| `site_slug` | `gosaki-piano` on all |
| `source_route` | `/schedule/2026-03/` … `/schedule/2026-07/` |
| `published` | `true` |
| `show_on_home` | `false` |
| `ON CONFLICT` | none |

### Stop if

- INSERT fails (note error — likely UNIQUE if collision not resolved).
- Transaction rolls back partway with ambiguous state.
- Suspect wrong project.

**On failure:** run `select count(*) from public.schedules where site_slug = 'gosaki-piano';` to detect partial insert. Do **not** auto-retry. See Step 8 rollback if cleanup needed.

### Proceed to Step 7 when

- INSERT completes successfully with no error.

---

## Step 7 — After verification SELECT

### Operator executes

Paste and run **all** queries. Save results.

```sql
-- G-9c2 Step 7 — after verification; SELECT only

-- Total Gosaki rows
select site_slug, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by site_slug;

-- Per-month counts
select month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by month
order by month;

-- source_route canonical check
select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;

-- No legacy /YYYY-MM/ in source_route
select legacy_id, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and source_route ~ '^/[0-9]{4}-[0-9]{2}/$'
  and source_route not like '/schedule/%';

-- published / show_on_home
select
  count(*) filter (where published = true) as published_true,
  count(*) filter (where show_on_home = false) as show_on_home_false,
  count(*) filter (where show_on_home is not null and show_on_home = true) as show_on_home_true
from public.schedules
where site_slug = 'gosaki-piano';

-- Nullable field coverage (extractor baseline)
select
  count(*) filter (where open_time is null) as open_time_null,
  count(*) filter (where start_time is null) as start_time_null,
  count(*) filter (where price is null) as price_null,
  count(*) filter (where venue is null or venue = '') as venue_empty
from public.schedules
where site_slug = 'gosaki-piano';

-- Collision rows: Gosaki seed + PoC both present
select id, legacy_id, site_slug, date, title
from public.schedules
where legacy_id in ('schedule-2026-07-010', 'schedule-2026-07-010-poc')
order by legacy_id;
```

### Pre-execution checks

- Step 6 completed without error.

### Expected result

| Check | Expected |
| --- | --- |
| Total Gosaki rows | **60** |
| Month counts | 2026-03=**13**, 2026-04=**10**, 2026-05=**12**, 2026-06=**11**, 2026-07=**14** |
| `source_route` groups | Only `/schedule/2026-03/` … `/schedule/2026-07/` |
| Legacy route query | **0 rows** |
| `published_true` | **60** |
| `show_on_home_false` | **60** |
| `show_on_home_true` | **0** |
| Nullable baseline | open_time_null=**10**, start_time_null=**9**, price_null=**6**, venue_empty=**3** |
| Collision pair | `schedule-2026-07-010` → `site_slug=gosaki-piano`; `schedule-2026-07-010-poc` → `site_slug=NULL` |

### Stop if

- Gosaki count ≠ **60**
- Any month count ≠ expected 13/10/12/11/14
- Any `source_route` is legacy `/2026-XX/` (not under `/schedule/`)
- Collision pair does not match expected `site_slug` split

### Proceed to Step 8 when

- All verification queries pass.

**G-9c2 execution complete** when Step 7 passes. Record completion time + result snapshots.

---

## Step 8 — Rollback SQL storage

### Operator executes

**Store only — do not run** unless a **separate** destructive approval is given.

Copy rollback SQL to your execution log / secure notes. **Do not execute** as part of G-9c2 success path.

### A. Gosaki seed delete (primary rollback)

**When:** remove all 60 Gosaki rows after failed/partial seed or bad verification.

**Separate approval required:**

```txt
承認します。この操作を1回だけ実行してください。
```

```sql
-- DESTRUCTIVE ROLLBACK A — staging only
-- Precondition: DELETE affects ONLY site_slug = 'gosaki-piano'

begin;

delete from public.schedules
where site_slug = 'gosaki-piano';

commit;
```

**Post-check (SELECT):**

```sql
select count(*) as gosaki_rows_after_rollback
from public.schedules
where site_slug = 'gosaki-piano';
-- EXPECT: 0

select id, legacy_id, site_slug
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
-- EXPECT: legacy_id = schedule-2026-07-010-poc, site_slug NULL (unchanged)
```

### B. PoC `legacy_id` rename rollback

**When:** PoC `legacy_id` must return to `schedule-2026-07-010` **after** Gosaki seed removed or never inserted.

**Separate approval required** (same destructive approval text as above).

```sql
-- DESTRUCTIVE ROLLBACK B — staging only

begin;

update public.schedules
set legacy_id = 'schedule-2026-07-010'
where legacy_id = 'schedule-2026-07-010-poc'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

commit;
```

### C. `site_slug` column / indexes — do not rollback

- Column is additive and nullable.
- Dropping column/index is higher risk than leaving them.
- Future CMS reads will use `site_slug` filter.

### Pre-execution checks (if rollback ever needed)

- Confirm project = `static-to-astro-cms-staging`
- Save before-state row counts
- Separate destructive approval recorded
- Verify `DELETE` / `UPDATE` predicates are narrow (see SQL above)

### Expected result (G-9c2 normal path)

- Rollback SQL **stored**, **not executed**.
- Execution log includes link to this section.

### Stop if

- Tempted to run rollback without separate approval — **stop and get approval first**.

### Proceed when

- Rollback SQL copied to operator log.
- G-9c2 marked complete if Step 7 passed.

---

## Post-execution gates (operator confirms)

```txt
gosakiScheduleSeedOperatorManualSqlExecutionComplete: true   (after Step 7 pass)
gosakiScheduleSeedRowsInserted: 60
gosakiScheduleSeedMonthCountsVerified: true
gosakiScheduleSeedSourceRouteCanonical: true
gosakiPocLegacyIdRenamed: true
readyForG9dAstroSupabaseScheduleRead: true
readyForAnyDbWrite: false          (Cursor/CI — unchanged)
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## Out of scope

- Cursor / AI SQL execution
- `schedule_months` writes
- RLS / GRANT changes
- `/admin` changes
- FTP / workflow_dispatch / production deploy
- `service_role` in tooling
