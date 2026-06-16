# Gosaki existing schedule rows migration replanning (G-9c2a)

**Phase:** `G-9c2a-gosaki-existing-schedule-rows-migration-replanning`  
**Date:** 2026-06-16  
**Prior:** G-9c2 checklist (`b969418`) — **60 INSERT approach aborted in operator execution**  
**Type:** **planning + SQL templates only** — no DB write, no SQL execution from Cursor / AI

---

## 1. Discovered DB state (operator SELECT on `static-to-astro-cms-staging`)

During G-9c2 Step 1, operator confirmed:

| Check | Observed |
| --- | --- |
| `schedule-2026-*` rows | **60** |
| `legacy_id` duplicates | **0** |
| `site_slug` column | **does not exist** |
| Month counts | 2026-03=**13**, 2026-04=**10**, 2026-05=**12**, 2026-06=**11**, 2026-07=**14** |
| `source_route` format | `/schedule-2026-03/` … `/schedule-2026-07/` (**legacy** — missing `/` after `schedule`) |

### `schedule-2026-07-010` (G-6 PoC row — same `id` as Gosaki event)

| Field | Current (PoC-altered) | Gosaki seed target |
| --- | --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` | unchanged |
| `legacy_id` | `schedule-2026-07-010` | unchanged (**no rename**) |
| `title` | `[CMS Kit staging] G-6-g1 title PoC` | `<>` |
| `venue` | `[CMS Kit staging] G-6-f6 venue PoC` | `NULL` |
| `open_time` | `[CMS Kit staging] G-6-g2 open PoC` | `NULL` |
| `start_time` | `[CMS Kit staging] G-6-g2 start PoC` | `NULL` |
| `price` | (unchanged from pre-PoC or NULL) | `NULL` |
| `description` | G-6 PoC追記あり | `出演：` |
| `source_route` | `/schedule-2026-07/` | `/schedule/2026-07/` |
| `site_slug` | column absent → implicit NULL | `gosaki-piano` (after backfill) |
| `date` | `2026-07-19` | unchanged |
| `month` | `2026-07` | unchanged |
| `source_file` | `2026-07.html` (expected) | unchanged |
| `published` | `true` (expected) | unchanged |
| `show_on_home` | `false` (expected) | unchanged |
| `sort_order` | `100` (expected) | unchanged |

**Conclusion:** The 60 existing rows **are** the Gosaki Wix schedule data (counts + `legacy_id` pattern match extractor). They were loaded earlier without `site_slug` and with pre-canonical `source_route`. The G-6 PoC row is **one of the 60**, not a separate collision.

---

## 2. Why G-9c2 60 INSERT is aborted

| Reason | Detail |
| --- | --- |
| Rows already exist | 60 `schedule-2026-*` rows present |
| UNIQUE violation | 60 INSERT would hit `legacy_id` UNIQUE on every row |
| PoC rename unnecessary | `schedule-2026-07-010` **is** the Gosaki row — rename would break adoption |
| Lower risk path | UPDATE / correction preserves existing `id` values and row history |

### Deprecated / superseded artifacts

| Artifact | Status |
| --- | --- |
| `gosaki-schedule-seed-operator-manual-sql-execution-checklist.md` (60 INSERT path) | **Deprecated** — retain for history; do not follow Steps 4–6 INSERT |
| `gosaki-schedule-seed-operator-manual-sql-execution-preflight.md` (PoC rename + INSERT) | **Superseded** for execution — planning reference only |
| `gosaki-schedules-seed.template.sql` (60 INSERT) | **Not for execution** — use as **field-value reference** (especially `schedule-2026-07-010`) |
| G-9c2 approval text referencing “G-9c1 SQL 60 INSERT” | **Superseded** — new approval in G-9c2b checklist |

---

## 3. Option comparison

### Option A — Adopt existing 60 rows + UPDATE correction (**recommended**)

| | |
| --- | --- |
| **Actions** | Add `site_slug` → backfill `gosaki-piano` → fix `source_route` → restore PoC-altered fields on `schedule-2026-07-010` |
| **Pros** | No DELETE; preserves `id`; minimal writes; PoC row becomes correct Gosaki row naturally; matches discovered DB reality |
| **Cons** | Requires careful WHERE + row-count gates; operator must snapshot PoC row before restore for rollback |
| **Risk** | Low — scoped UPDATEs with pre/post SELECT |

### Option B — DELETE 60 rows + re-INSERT from seed template

| | |
| --- | --- |
| **Actions** | Delete all `schedule-2026-*` → run 60 INSERT from `gosaki-schedules-seed.template.sql` |
| **Pros** | Exact match to generated seed SQL |
| **Cons** | Destructive DELETE; new UUIDs; loses G-6 PoC `id` history; higher blast radius; still needs `site_slug` DDL first |
| **Risk** | **High** — not recommended |

### Option C — PoC rename + adopt 59 + INSERT 1

| | |
| --- | --- |
| **Actions** | Rename PoC `legacy_id` → `-poc`; tag 59 rows; INSERT missing `schedule-2026-07-010` |
| **Pros** | Preserves PoC row as artifact |
| **Cons** | Wrong model — PoC row **is** Gosaki event 2026-07-19; leaves orphan PoC row; unnecessary INSERT |
| **Risk** | Medium — complexity without benefit |

### Recommendation

**Option A** — adopt existing 60 rows as Gosaki seed via UPDATE / correction.

---

## 4. Migration sequence (G-9c2b target)

| Step | Action | SQL type |
| ---: | --- | --- |
| **0** | Confirm `static-to-astro-cms-staging` | checklist |
| **1** | Before SELECT + snapshot `schedule-2026-07-010` | SELECT |
| **2** | Add `site_slug` column + indexes | DDL |
| **3** | Verify column / indexes | SELECT |
| **4** | Backfill `site_slug = 'gosaki-piano'` on 60 rows | UPDATE |
| **5** | Canonicalize `source_route` → `/schedule/YYYY-MM/` | UPDATE |
| **6** | Restore `schedule-2026-07-010` Gosaki fields | UPDATE (1 row) |
| **7** | After verification SELECT | SELECT |
| **8** | Store rollback SQL (do not run) | reference |

**Stop immediately** if any step’s row count or expectations fail. No auto-retry.

### Operator approval (G-9c2b)

```txt
承認します。static-to-astro-cms-staging に対して、G-9c2a の既存60行 migration SQLをこの順番で1回だけ手動実行します。
```

---

## 5. Policy details

### 5.1 `site_slug` column

Same DDL as G-9c1 Step 2 — see `scripts/supabase/gosaki-site-slug-migration.template.sql`.

- Additive, nullable column
- Indexes: `schedules_site_slug_date_idx`, `schedules_site_slug_month_idx`
- **No rollback** of column drop (leave in place after migration)

### 5.2 `site_slug` backfill

```txt
Target: legacy_id LIKE 'schedule-2026-%' AND site_slug IS NULL
Expect: exactly 60 rows updated
Value:  'gosaki-piano'
```

**Precondition:** `select count(*) … where legacy_id like 'schedule-2026-%'` = **60** before backfill.

**Stop if:**

- Count ≠ 60 before UPDATE
- UPDATE affects ≠ 60 rows
- Any row outside `schedule-2026-%` would receive `gosaki-piano`

### 5.3 `source_route` canonicalization

```txt
From: /schedule-2026-03/  (legacy crawl format)
To:   /schedule/2026-03/  (canonical)
```

```sql
set source_route = '/schedule/' || month || '/'
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%'
  and source_route is distinct from ('/schedule/' || month || '/');
```

**Expect:** 60 rows with only `/schedule/2026-03/` … `/schedule/2026-07/` after Step 7.

**Stop if:** any `source_route` matches legacy `/schedule-YYYY-MM/` or root `/YYYY-MM/` pattern after Step 5.

### 5.4 `schedule-2026-07-010` PoC restore — **no `legacy_id` rename**

The G-6 PoC row **is** the Gosaki event. Restore content fields from seed template; keep `id` + `legacy_id`.

**WHERE must include both:**

```sql
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
```

**Expect:** exactly **1** row updated.

Template: `scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql`

---

## 6. Before SELECT (Step 1)

```sql
-- G-9c2a before — SELECT only; static-to-astro-cms-staging only

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

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name = 'site_slug';

-- SAVE FULL SNAPSHOT for rollback (especially schedule-2026-07-010)
select *
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

select id, legacy_id, date, title, venue, open_time, start_time, price,
       description, source_route, source_file, published, show_on_home, sort_order
from public.schedules
where legacy_id = 'schedule-2026-07-010';
```

### Expected before state

| Check | Expected |
| --- | --- |
| `schedule_2026_rows` | **60** |
| `legacy_id_duplicates` | **0** |
| Month counts | 13 / 10 / 12 / 11 / 14 |
| `site_slug` column | **0 rows** (migration needed) |
| `schedule-2026-07-010` `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |

---

## 7. UPDATE SQL templates

Full templates (operator copy-paste):

| File | Step |
| --- | --- |
| `scripts/supabase/gosaki-site-slug-migration.template.sql` | 2 |
| `scripts/supabase/gosaki-existing-schedules-site-slug-backfill.template.sql` | 4 |
| `scripts/supabase/gosaki-existing-schedules-source-route-update.template.sql` | 5 |
| `scripts/supabase/gosaki-schedule-2026-07-010-restore.template.sql` | 6 |

### Step 4 — site_slug backfill (summary)

```sql
begin;

update public.schedules
set site_slug = 'gosaki-piano'
where legacy_id like 'schedule-2026-%'
  and site_slug is null;

commit;
```

**Gate:** run `select count(*) … where site_slug = 'gosaki-piano'` → **60** before Step 5.

### Step 5 — source_route update (summary)

```sql
begin;

update public.schedules
set source_route = '/schedule/' || month || '/'
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%'
  and source_route is distinct from ('/schedule/' || month || '/');

commit;
```

### Step 6 — PoC row restore (summary)

```sql
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

`updated_at` may advance (trigger) — acceptable.

---

## 8. After verification SELECT (Step 7)

```sql
-- G-9c2a after — SELECT only

select count(*) as gosaki_rows
from public.schedules
where site_slug = 'gosaki-piano';
-- EXPECT: 60

select month, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by month
order by month;
-- EXPECT: 13 / 10 / 12 / 11 / 14

select source_route, count(*) as events
from public.schedules
where site_slug = 'gosaki-piano'
group by source_route
order by source_route;
-- EXPECT: only /schedule/2026-03/ … /schedule/2026-07/

select legacy_id, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and (
    source_route ~ '^/schedule-[0-9]{4}-[0-9]{2}/$'
    or (source_route ~ '^/[0-9]{4}-[0-9]{2}/$' and source_route not like '/schedule/%')
  );
-- EXPECT: 0 rows

select id, legacy_id, title, venue, open_time, start_time, description, source_route
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
-- EXPECT: Gosaki seed values; legacy_id = schedule-2026-07-010 (NOT -poc)

select count(*) as non_gosaki_schedule_2026
from public.schedules
where legacy_id like 'schedule-2026-%'
  and (site_slug is null or site_slug <> 'gosaki-piano');
-- EXPECT: 0
```

---

## 9. Rollback plan

Store only — **do not run** without separate destructive approval:

```txt
承認します。この操作を1回だけ実行してください。
```

### A. Clear `site_slug` on Gosaki rows

```sql
begin;

update public.schedules
set site_slug = null
where site_slug = 'gosaki-piano'
  and legacy_id like 'schedule-2026-%';

commit;
```

**Expect:** 60 rows updated; `gosaki-piano` count = 0.

### B. Revert `source_route` to legacy format

Only if Step 5 was applied. Operator must confirm pre-migration routes from Step 1 snapshot.

```sql
begin;

update public.schedules
set source_route = '/schedule-' || month || '/'
where legacy_id like 'schedule-2026-%'
  and site_slug is null
  and source_route like '/schedule/%';

commit;
```

**Note:** Run **after** rollback A (site_slug cleared). Adjust predicate if migration state differs.

### C. Restore `schedule-2026-07-010` PoC fields

Use **Step 1 saved snapshot** — values are operator-specific after G-6-f6/g1/g2 history. Example structure:

```sql
begin;

update public.schedules
set
  title = '<saved>',
  venue = '<saved>',
  open_time = '<saved>',
  start_time = '<saved>',
  price = <saved>,
  description = '<saved>',
  source_route = '<saved>'
where legacy_id = 'schedule-2026-07-010'
  and id = 'aa440e29-5be8-402e-9190-0d81c48434c0';

commit;
```

### D. Drop `site_slug` column — **do not rollback**

Leave column in place (additive, nullable).

---

## 10. Existing G-9c2 checklist handling

| Document | Action |
| --- | --- |
| `gosaki-schedule-seed-operator-manual-sql-execution-checklist.md` | Mark **deprecated** at top in G-9c2b; link to this doc |
| `gosaki-schedule-seed-operator-manual-sql-execution-preflight.md` | Historical reference; INSERT path superseded |
| `gosaki-schedule-seed-sql-planning.md` | Update next-phase pointer to G-9c2a / G-9c2b in commit phase |

**Next deliverable:** `G-9c2b-gosaki-existing-rows-manual-sql-execution-checklist` (operator checklist for UPDATE path).

---

## 11. Out of scope

- SQL execution from Cursor / CI
- `schedule_months` writes
- RLS / GRANT changes
- `/admin` changes
- FTP / workflow_dispatch / production

---

## 12. Gates

```txt
gosakiExistingScheduleRowsMigrationReplanningComplete: true
gosakiScheduleInsertPlanDeprecated: true
gosakiExisting60RowsAdoptionRecommended: true
gosakiSiteSlugBackfillPlanReady: true
gosakiSourceRouteCanonicalUpdatePlanReady: true
gosakiPocRowRestorePlanReady: true
readyForG9c2bExistingRowsManualSqlExecutionChecklist: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 13. Next phase

**G-9c2b:** Operator manual SQL execution checklist for existing-rows UPDATE migration (staging only, explicit approval).
