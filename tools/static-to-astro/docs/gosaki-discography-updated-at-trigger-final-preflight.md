# G-15b-f8 — Gosaki Discography updated_at trigger final preflight

**Phase:** `G-15b-f8-gosaki-discography-updated-at-trigger-final-preflight`  
**Status:** **complete** — template reviewed; schedules parity confirmed; apply/verify SQL documented; **no SQL executed in this phase**  
**Date:** 2026-06-28  
**Base commit:** `c06162b`  
**Prior:** G-15b-retry (`gosaki-discography-save-retry-result-and-updated-at-investigation.md`) — committed

| Check | Status |
| --- | --- |
| Template SQL reviewed | **yes** |
| Schedules G-6-f8 parity | **yes** |
| Apply scope limited to function + trigger | **yes** |
| Forbidden SQL absent | **yes** |
| Apply block documented | **yes** |
| Pre/post verify SELECT documented | **yes** |
| Cursor SQL execution | **no** |

---

## Gates

```txt
gosakiDiscographyUpdatedAtTriggerFinalPreflightComplete: true
phase: G-15b-f8-gosaki-discography-updated-at-trigger-final-preflight
readyForG15bF8DiscographyUpdatedAtTriggerExecution: true
readyForAnyDbMigrationOrTriggerApply: false
cursorTriggerSqlExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
```

**Next:** `G-15b-f8-execution` — operator runs apply block once in SQL Editor (separate explicit approval).

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: c06162b
origin/main: c06162b
branch: main...origin/main
```

---

## 2. Purpose

Prepare safe staging-only application of a `BEFORE UPDATE` trigger on `public.discography` so `updated_at` advances on every UPDATE — mirroring Schedule G-6-f8 (`schedules_set_updated_at`).

**Background (G-15b-retry):**

```txt
legacy_id: discography-002
field: purchase_url
before: https://gosaakiii.base.shop/
after: https://gosakirikako.base.shop/
updated_at before/after Save: 2026-06-05T17:39:44.201802+00:00 (unchanged)
```

**Root cause:** no `discography_set_updated_at` trigger on staging.

**This phase:** preflight only — docs + verifier. **No SQL execution by Cursor.**

---

## 3. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Target table: public.discography only
Out of scope: discography_tracks, schedules, schedule_months, RLS, GRANT
service_role: not used (Kit write path unchanged)
/admin: not modified
production / Sariswing: not touched
```

**STOP** if Dashboard project is not `static-to-astro-cms-staging`.

---

## 4. Template SQL review

**Source file:** `tools/static-to-astro/scripts/supabase/gosaki-discography-updated-at-trigger.template.sql`

| Item | Value |
| --- | --- |
| Function | `public.tg_discography_set_updated_at()` |
| Trigger | `discography_set_updated_at` |
| Timing | `BEFORE UPDATE FOR EACH ROW` |
| Action | `NEW.updated_at = now()` |
| `SECURITY DEFINER` | **not used** |
| `search_path` | fixed `public` on function |
| Idempotent | `CREATE OR REPLACE` + `DROP TRIGGER IF EXISTS` |
| `created_at` | **not touched** |

**Review result:** **PASS** — safe to apply on staging `public.discography` only.

---

## 5. Comparison with schedules (G-6-f8)

**Reference:** `scripts/supabase/schedules-updated-at-trigger.sql`

| Aspect | `schedules` (G-6-f8) | `discography` (G-15b-f8) |
| --- | --- | --- |
| Function | `tg_schedules_set_updated_at()` | `tg_discography_set_updated_at()` |
| Trigger name | `schedules_set_updated_at` | `discography_set_updated_at` |
| Target table | `public.schedules` | `public.discography` |
| Trigger body | `new.updated_at = now()` | **identical logic** |
| Language / timing | plpgsql, BEFORE UPDATE, FOR EACH ROW | **same** |
| Excluded tables | `schedule_months` | `discography_tracks` |
| RLS impact | none (trigger only) | none (trigger only) |
| Staging applied | **yes** (G-6-f8 execution) | **pending** (this preflight) |

**Conclusion:** Discography template is a **table-scoped parallel** of the proven schedules implementation. No shared generic function — rollback drops do not cross tables.

---

## 6. SQL apply scope (allowed statements only)

The apply block contains **only**:

```txt
CREATE OR REPLACE FUNCTION public.tg_discography_set_updated_at()
COMMENT ON FUNCTION public.tg_discography_set_updated_at()
DROP TRIGGER IF EXISTS discography_set_updated_at ON public.discography
CREATE TRIGGER discography_set_updated_at ... ON public.discography
```

**Does not contain:**

```txt
UPDATE public.discography (data DML)
INSERT / DELETE on discography rows
DROP TABLE / TRUNCATE
ALTER TABLE (schema change)
GRANT / REVOKE
CREATE POLICY / DROP POLICY
service_role usage
```

**Verifier:** static scan of template — **PASS**.

---

## 7. Apply-before audit SQL (operator — read-only)

Run in **SQL Editor** on `static-to-astro-cms-staging` **before** apply. Cursor does **not** execute.

### 7.1 Existing triggers on discography

```sql
select
  tgname,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_def
from pg_trigger
where tgrelid = 'public.discography'::regclass
  and not tgisinternal
order by tgname;
```

**Expected before apply:** no `discography_set_updated_at` (or empty / unrelated only).

### 7.2 Column check (optional)

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'discography'
  and column_name in ('updated_at', 'created_at')
order by column_name;
```

**Expected:** both columns exist; `updated_at` timestamptz.

### 7.3 Schedules reference (optional compare)

```sql
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.schedules'::regclass
  and not tgisinternal
order by tgname;
```

**Expected:** `schedules_set_updated_at` present (G-6-f8 baseline).

### 7.4 Target row baseline (read-only)

```sql
select id, legacy_id, title, purchase_url, updated_at
from public.discography
where legacy_id = 'discography-002';
```

**Expected (G-15b-retry after state):**

```txt
purchase_url: https://gosakirikako.base.shop/
updated_at: 2026-06-05T17:39:44.201802+00:00
```

---

## 8. Apply SQL block (operator — execution phase only)

**Confirm project in Dashboard, then paste and run once:**

```sql
-- G-15b-f8 discography updated_at trigger — STAGING ONLY (static-to-astro-cms-staging)
-- Source: tools/static-to-astro/scripts/supabase/gosaki-discography-updated-at-trigger.template.sql

create or replace function public.tg_discography_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.tg_discography_set_updated_at() is
  'BEFORE UPDATE trigger helper: sets discography.updated_at to now(). CMS Kit G-15b-f8.';

drop trigger if exists discography_set_updated_at on public.discography;

create trigger discography_set_updated_at
  before update on public.discography
  for each row
  execute function public.tg_discography_set_updated_at();
```

**Idempotent:** safe to re-run if execution fails mid-way (after reviewing error).

---

## 9. Apply-after verify SQL (operator — read-only)

Run **after** apply block succeeds. **No data UPDATE required** for verification.

### 9.1 Trigger present

```sql
select
  tgname,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_def
from pg_trigger
where tgrelid = 'public.discography'::regclass
  and not tgisinternal
order by tgname;
```

**Expected:**

```txt
tgname: discography_set_updated_at
tgenabled: O (enabled)
trigger_def: BEFORE UPDATE ... EXECUTE FUNCTION tg_discography_set_updated_at()
```

### 9.2 Row unchanged immediately after trigger apply

```sql
select
  id,
  legacy_id,
  title,
  purchase_url,
  updated_at
from public.discography
where legacy_id = 'discography-002';
```

**Expected immediately after trigger DDL only:**

```txt
purchase_url: https://gosakirikako.base.shop/  (unchanged from G-15b-retry)
updated_at: 2026-06-05T17:39:44.201802+00:00  (unchanged — DDL does not touch rows)
```

**Important:** Creating a trigger does **not** retroactively update `updated_at`. The **next** approved `UPDATE` on any `discography` row will advance `updated_at` via `now()`.

### 9.3 Future optimistic-lock proof (separate phase — not in G-15b-f8 apply)

After trigger is live, the **next** discography CMS Save (new approval) should show `afterSnapshot.updated_at` > baseline. Do **not** re-Save `discography-002` for proof unless explicitly approved.

---

## 10. Rollback template (doc-only — do not run in preflight)

```sql
-- staging only — separate approval
drop trigger if exists discography_set_updated_at on public.discography;
drop function if exists public.tg_discography_set_updated_at();
```

Rollback does not revert `purchase_url` or past `updated_at` values.

---

## 11. Stop conditions

Stop and ask human if:

- wrong Supabase project (not `kmjqppxjdnwwrtaeqjta`)
- pre-check shows unexpected triggers that conflict
- apply errors on function/trigger creation
- post-check row `purchase_url` or `updated_at` changed **without** an approved UPDATE (should not happen from DDL alone)

---

## 12. Safety statement (this phase)

```txt
Supabase SQL executed by Cursor: none
DB write: none
Trigger apply: none
Save re-execution: none
GRANT / policy change: none
service_role: none
```

---

## Related

- [gosaki-discography-save-retry-result-and-updated-at-investigation.md](./gosaki-discography-save-retry-result-and-updated-at-investigation.md)
- [schedule-updated-at-staging-migration-preflight.md](./schedule-updated-at-staging-migration-preflight.md)
- [schedule-updated-at-staging-migration-execution-result.md](./schedule-updated-at-staging-migration-execution-result.md)
- `scripts/supabase/schedules-updated-at-trigger.sql`
- `scripts/supabase/gosaki-discography-updated-at-trigger.template.sql`
