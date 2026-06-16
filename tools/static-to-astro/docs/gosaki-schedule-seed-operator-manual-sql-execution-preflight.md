# Gosaki schedule seed operator manual SQL execution preflight (G-9c1)

**Phase:** `G-9c1-gosaki-schedule-seed-operator-manual-sql-execution-preflight`  
**Date:** 2026-06-16  
**Prior:** G-9c0c route-aware seed SQL (`d19149c`)  
**Type:** **preflight only** — no DB write, no Supabase SQL execution, no Cursor/CI execution

---

## 1. Purpose

Document the **final operator procedure** for seeding 60 Gosaki schedule rows into `static-to-astro-cms-staging` via Supabase SQL Editor.

**This phase:** documentation + verification scripts only.  
**Next phase (G-9c2):** operator runs SQL manually after explicit approval — **Cursor / AI does not execute SQL.**

### Artifacts (committed in G-9c0c)

| File | Role |
| --- | --- |
| `scripts/supabase/gosaki-site-slug-migration.template.sql` | Step 2 — `site_slug` column + indexes |
| `scripts/supabase/gosaki-schedules-seed.template.sql` | Step 6 — 60 plain INSERT |
| `scripts/supabase/gosaki-schedules-seed-preflight.template.sql` | Step 1 / 7 SELECT templates |
| `docs/gosaki-schedule-seed-sql-planning.md` | Planning reference |

### Seed policy (canonical routes)

```txt
source_route: /schedule/YYYY-MM/   (NOT legacy /YYYY-MM/)
site_slug:    gosaki-piano
INSERT:       60 plain INSERT, begin/commit, no ON CONFLICT
```

---

## 2. Execution sequence

| Step | Action | Who | SQL type |
| ---: | --- | --- | --- |
| **0** | Confirm Supabase project | Operator | checklist |
| **1** | Before SELECT verification | Operator | SELECT only |
| **2** | `site_slug` migration | Operator | DDL (if column missing) |
| **3** | `site_slug` column / index verification | Operator | SELECT only |
| **4** | G-6 PoC `legacy_id` rename | Operator | UPDATE (1 row) |
| **5** | Collision resolution verification | Operator | SELECT only |
| **6** | Gosaki 60 seed INSERT | Operator | INSERT (transaction) |
| **7** | After verification SELECT | Operator | SELECT only |
| **8** | Store rollback SQL (do not run) | Operator | reference only |

**Stop immediately** if any step fails or row counts do not match expectations. Do not retry automatically.

---

## 3. Step 0 — Supabase project confirmation

Before opening SQL Editor, operator must confirm:

```txt
✓ Supabase project name: static-to-astro-cms-staging
✓ NOT Sariswing production Supabase project
✓ NOT any production / gosaki-piano.com backend project
✓ SQL Editor URL / dashboard shows staging project identifier
✓ Operator has staging SQL Editor access (not service_role in tooling)
```

**Abort** if project identity is uncertain.

Optional host check (staging — verify in Supabase dashboard):

```txt
kmjqppxjdnwwrtaeqjta.supabase.co
```

---

## 4. Step 1 — Before SELECT verification

**Read-only.** Run in SQL Editor. Save results (screenshot or copy).

```sql
-- G-9c1 before — SELECT only; static-to-astro-cms-staging only

-- Total schedules count (baseline)
select count(*) as total_schedules from public.schedules;

-- Gosaki seed must not exist yet
select count(*) as gosaki_rows_before
from public.schedules
where site_slug = 'gosaki-piano';
-- EXPECT: 0

-- site_slug column status (0 rows = migration needed; 1 row = already migrated)
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

-- G-6 PoC row — must exist before rename
select id, legacy_id, date, title, venue, description, site_slug, updated_at
from public.schedules
where legacy_id = 'schedule-2026-07-010';

-- Confirm PoC row by id (narrow target for Step 4)
select id, legacy_id, date, title, site_slug
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### Expected before state

| Check | Expected |
| --- | --- |
| `gosaki_rows_before` | **0** |
| G-6 PoC `legacy_id` | `schedule-2026-07-010` |
| G-6 PoC `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| G-6 PoC `site_slug` | `NULL` |
| `site_slug` column | may or may not exist — determines Step 2 |

**Note:** PoC row fields (`title`, `venue`, `description`, times) may reflect G-6 write PoC history (G-6-f6, G-6-g1, G-6-g2). Only `id` + `legacy_id` are required for collision resolution.

---

## 5. Step 2 — `site_slug` migration

**Staging only.** Skip if Step 1 shows `site_slug` column already exists.

Source: `scripts/supabase/gosaki-site-slug-migration.template.sql`

```sql
-- G-9c1 site_slug migration — static-to-astro-cms-staging ONLY
-- TEMPLATE ONLY until operator explicit approval in G-9c2

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

### Policy

- Run on **staging only** — never on production
- **No UPDATE** on existing rows in this step
- G-6 PoC row remains `site_slug NULL`
- Idempotent: safe to re-run (`IF NOT EXISTS`)

---

## 6. Step 3 — `site_slug` column / index verification

```sql
-- G-9c1 post-migration verify — SELECT only

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';
-- EXPECT: 1 row

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'schedules'
  and indexname in (
    'schedules_site_slug_date_idx',
    'schedules_site_slug_month_idx'
  );
-- EXPECT: 2 rows (after migration)
```

---

## 7. Step 4 — G-6 PoC `legacy_id` rename

Resolves `legacy_id` collision before Gosaki seed INSERT.

```sql
-- G-9c1 PoC legacy_id rename — static-to-astro-cms-staging ONLY
-- TEMPLATE ONLY until operator explicit approval in G-9c2
-- EXPECT: exactly 1 row updated

begin;

update public.schedules
set legacy_id = 'schedule-2026-07-010-poc'
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

commit;
```

### Safety notes

- **WHERE must include `id`** — never rename by `legacy_id` alone
- Expect **`rowsAffected = 1`**. If 0 or >1, **stop** — do not proceed to seed INSERT
- Trigger `schedules_set_updated_at` may advance `updated_at` on this UPDATE
- **Do not** change `site_slug`, `title`, `venue`, or other PoC fields in this step

### PoC rename rollback (separate approval only)

```sql
-- DESTRUCTIVE ROLLBACK B — staging only, explicit approval required
begin;

update public.schedules
set legacy_id = 'schedule-2026-07-010'
where legacy_id = 'schedule-2026-07-010-poc'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

commit;
```

---

## 8. Step 5 — Collision resolution verification

```sql
-- G-9c1 collision resolved — SELECT only

-- PoC row renamed
select id, legacy_id, site_slug
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
-- EXPECT: legacy_id = schedule-2026-07-010-poc, site_slug NULL

-- Old legacy_id must not exist
select count(*) as poc_legacy_id_still_present
from public.schedules
where legacy_id = 'schedule-2026-07-010';
-- EXPECT: 0

-- Gosaki legacy_id not yet inserted
select count(*) as gosaki_010_not_yet_present
from public.schedules
where legacy_id = 'schedule-2026-07-010'
  and site_slug = 'gosaki-piano';
-- EXPECT: 0 (before Step 6)
```

Proceed to Step 6 only when all expectations match.

---

## 9. Step 6 — Gosaki 60 seed INSERT

### Preconditions (all required)

```txt
✓ Step 5 passed — no legacy_id schedule-2026-07-010 on PoC row
✓ gosaki_rows_before was 0
✓ site_slug column exists
✓ Operator has explicit G-9c2 approval (see §12)
```

### Procedure

1. Open `scripts/supabase/gosaki-schedules-seed.template.sql` from commit `d19149c`
2. Copy the **entire file** (header + `begin` + 60 INSERT + `commit`)
3. Paste into Supabase SQL Editor (staging project)
4. Review: 60 `insert into public.schedules` lines, no `ON CONFLICT`
5. Execute **once**

### Seed properties

| Property | Value |
| --- | --- |
| Rows | 60 |
| `site_slug` | `gosaki-piano` on all rows |
| `source_route` | `/schedule/2026-03/` … `/schedule/2026-07/` |
| `source_file` | `2026-XX.html` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `published` | `true` |
| `ON CONFLICT` | **none** |

### On failure

- **Stop immediately** — do not auto-retry
- Note error message (likely UNIQUE violation if collision not resolved)
- Assess whether partial INSERT occurred (`select count(*) … where site_slug = 'gosaki-piano'`)
- Use rollback plan §11 if cleanup needed (separate approval)

---

## 10. Step 7 — After verification SELECT

```sql
-- G-9c1 after verification — SELECT only

-- Total Gosaki rows
select site_slug, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by site_slug;
-- EXPECT: gosaki-piano = 60

-- Per-month counts
select month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by month
order by month;
-- EXPECT: 2026-03=13, 2026-04=10, 2026-05=12, 2026-06=11, 2026-07=14

-- source_route canonical check
select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;
-- EXPECT: only /schedule/2026-03/ … /schedule/2026-07/

-- No legacy /YYYY-MM/ in source_route
select legacy_id, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and source_route ~ '^/[0-9]{4}-[0-9]{2}/$'
  and source_route not like '/schedule/%';
-- EXPECT: 0 rows

-- published / show_on_home
select
  count(*) filter (where published = true) as published_true,
  count(*) filter (where show_on_home = false) as show_on_home_false,
  count(*) filter (where show_on_home is not null and show_on_home = true) as show_on_home_true
from public.schedules
where site_slug = 'gosaki-piano';
-- EXPECT: published_true=60, show_on_home_false=60, show_on_home_true=0

-- Nullable field coverage (extractor baseline)
select
  count(*) filter (where open_time is null) as open_time_null,
  count(*) filter (where start_time is null) as start_time_null,
  count(*) filter (where price is null) as price_null,
  count(*) filter (where venue is null or venue = '') as venue_empty
from public.schedules
where site_slug = 'gosaki-piano';
-- EXPECT: open_time_null=10, start_time_null=9, price_null=6, venue_empty=3

-- Collision rows: Gosaki seed + PoC both present
select id, legacy_id, site_slug, date, title
from public.schedules
where legacy_id in ('schedule-2026-07-010', 'schedule-2026-07-010-poc')
order by legacy_id;
-- EXPECT:
--   schedule-2026-07-010     site_slug=gosaki-piano  (Wix event 2026-07-19)
--   schedule-2026-07-010-poc site_slug=NULL          (G-6 PoC row)
```

---

## 11. Step 8 — Rollback plan

Store rollback SQL. **Do not run** unless a separate destructive approval is given.

### A. Gosaki seed delete (primary rollback)

```sql
-- DESTRUCTIVE — staging only
-- Approval: 承認します。この操作を1回だけ実行してください。
-- Precondition: confirm DELETE WHERE site_slug = 'gosaki-piano' only

begin;

delete from public.schedules
where site_slug = 'gosaki-piano';

commit;
```

**Effect:** removes all 60 Gosaki seed rows.  
**Does not affect:** G-6 PoC row (`site_slug NULL`).  
**Post-check:** `gosaki-piano` count = 0; PoC `schedule-2026-07-010-poc` unchanged.

### B. PoC `legacy_id` rename rollback

See §7 PoC rename rollback SQL.

**When to use:** only if PoC `legacy_id` must return to `schedule-2026-07-010` after Gosaki seed was removed or never inserted.

### C. `site_slug` column / indexes — do not rollback

**Reason:**

- Column is additive and nullable — existing PoC / Sariswing staging rows remain valid with `NULL`
- Dropping column/index is higher risk than leaving them
- Future CMS reads will use `site_slug` filter

---

## 12. Operator approval text

### G-9c2 execution approval (required before Steps 2–6)

```txt
承認します。static-to-astro-cms-staging に対して、G-9c1 のSQLをこの順番で1回だけ手動実行します。
```

### Destructive rollback approval (separate — if needed)

```txt
承認します。この操作を1回だけ実行してください。
```

### Who does NOT execute

```txt
✗ Cursor / AI / CI — no Supabase SQL execution
✗ service_role in tooling scripts
✗ Automatic retry on failure
```

---

## 13. Out of scope (G-9c1)

- SQL execution (any step)
- `schedule_months` writes
- RLS / GRANT changes
- `/admin` changes
- FTP / workflow_dispatch
- Production deploy

---

## 14. Gates

```txt
gosakiScheduleSeedOperatorSqlExecutionPreflightComplete: true
gosakiScheduleSeedExecutionSequenceDocumented: true
gosakiSiteSlugMigrationExecutionPlanReady: true
gosakiSeedLegacyIdCollisionResolutionPlanReady: true
gosakiScheduleSeedInsertExecutionPlanReady: true
gosakiScheduleSeedRollbackPlanReady: true
readyForG9c2OperatorManualSqlExecution: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 15. Next phase

**G-9c2:** Operator manual SQL execution on `static-to-astro-cms-staging` following this preflight, with G-9c2 approval text.
