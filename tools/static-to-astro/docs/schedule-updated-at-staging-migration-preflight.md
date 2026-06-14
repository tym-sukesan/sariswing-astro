# Schedule updated_at staging migration preflight (G-6-f8)

Last updated: 2026-06-14  
Phase: `G-6-f8-schedule-updated-at-staging-migration-preflight`  
Type: **preflight / planning only** — no Supabase SQL execution, no migration apply, no DB write, no Run click

## Purpose

Prepare a safe staging-only migration to add a `BEFORE UPDATE` trigger on `public.schedules` so `updated_at` advances on every UPDATE. Enable future optimistic locking via `expectedBeforeUpdatedAt` in the write adapter.

**This phase performed:** docs, SQL templates, impact analysis, rollback plan, verification plan.  
**This phase did not:** execute SQL, apply migration, UPDATE/INSERT/DELETE, non-dry-run PoC re-run, Run click, rollback execution, `/admin` changes, `service_role`.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-e5 / G-6-f6 | UPDATE success; `updated_at` static at `2026-06-05 17:39:44.140168+00` |
| G-6-f7 | Recommend Option A — DB trigger on staging first |

## 1. Why updated_at trigger is needed

```txt
G-6-e5: description changed; updated_at unchanged
G-6-f6: venue + description changed; updated_at unchanged
```

Without a working `updated_at`:

- Audit / “last saved” display is wrong
- `expectedBeforeUpdatedAt` in `schedule-write-adapter.ts` cannot detect conflicts
- General Schedule edit UI would allow silent overwrites

Trigger on `public.schedules` only. **`public.schedule_months` is not a trigger target** (derived / read-only).

## 2. Migration management in this repository

### 2.1 What exists today

| Location | Role |
| --- | --- |
| `scripts/supabase/*.sql` | **Primary pattern** — documented SQL applied manually in Supabase SQL Editor |
| `supabase/config.toml` | Local Supabase CLI config; Edge Functions |
| `supabase/functions/*` | Sariswing production admin Edge Functions — **not** Kit staging write path |
| `supabase/migrations/` | **Does not exist** in this repo |

Historical Kit / Sariswing schema changes (RLS, soft delete, etc.) live under `scripts/supabase/` with header comments describing manual apply steps.

### 2.2 Staging CMS Kit practice (proven)

```txt
1. Author SQL in repo (scripts/ or docs/)
2. Operator confirms Supabase project = static-to-astro-cms-staging (Dashboard UI)
3. Run in SQL Editor (manual)
4. Verify with SELECT-only SQL
5. Record result in docs / AI context
```

No automated `supabase db push` for Kit staging PoCs in current workflow.

### 2.3 Recommendation for this trigger

| Approach | G-6-f8 preflight | G-6-f8 execution (next) |
| --- | --- | --- |
| **Docs + SQL templates** | **Yes** — this doc | Operator runs from doc in SQL Editor |
| **`scripts/supabase/schedules-updated-at-trigger.sql`** | Optional add in execution phase | Recommended when execution is approved — matches repo convention |
| **`supabase/migrations/`** | **Not yet** | Introduce only if team adopts Supabase CLI migrations for customer onboarding |

**Customer projects:** ship the same SQL as a Kit template under `tools/static-to-astro/templates/` or `scripts/supabase/` with “apply on customer staging first, production later” playbook. Do not apply to Sariswing production in Kit phases.

## 3. Trigger SQL proposal (NOT executed in G-6-f8)

### 3.1 Design decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Schema | `public` | Matches `public.schedules` |
| Function name | `public.tg_schedules_set_updated_at()` | Schedules-specific; rollback drop does not affect other tables |
| Trigger name | `schedules_set_updated_at` | Clear ownership |
| Timing | `BEFORE UPDATE FOR EACH ROW` | Standard pattern |
| `SECURITY DEFINER` | **Not used** | Trigger runs as invoking user; RLS unchanged |
| `search_path` | Fixed in function | Reduces search_path hijack risk |
| `created_at` | **Not touched** | Only `NEW.updated_at` |
| Payload `updated_at` | Adapter/UI must **not** send it on normal saves | Trigger is source of truth after migration |

### 3.2 Proposed migration SQL (staging)

```sql
-- G-6-f8 schedules updated_at trigger — STAGING ONLY (static-to-astro-cms-staging)
-- NOT executed in preflight phase. Run only in G-6-f8 execution after pre-checks PASS.
-- Project: confirm Dashboard shows static-to-astro-cms-staging before running.

create or replace function public.tg_schedules_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.tg_schedules_set_updated_at() is
  'BEFORE UPDATE trigger helper: sets schedules.updated_at to now(). CMS Kit G-6-f8.';

drop trigger if exists schedules_set_updated_at on public.schedules;

create trigger schedules_set_updated_at
  before update on public.schedules
  for each row
  execute function public.tg_schedules_set_updated_at();
```

### 3.3 Alternative considered (generic function)

```sql
-- public.set_updated_at() — reusable across tables
```

**Rejected for first staging apply:** generic function name may already exist elsewhere; dropping on rollback could break other objects. Revisit when multiple Kit tables need the same helper in one migration file.

## 4. Impact analysis

### 4.1 Direct

| Target | Impact |
| --- | --- |
| **`public.schedules`** | Every successful UPDATE sets `updated_at = now()` |
| **`public.schedule_months`** | **None** — separate table; not written by CMS Kit; no trigger added |
| **`created_at`** | Unchanged |

### 4.2 Auth / RLS / grants

| Area | Impact |
| --- | --- |
| **RLS policies** | Unchanged — trigger runs inside same UPDATE the policy already allows |
| **`admin_users` / `is_admin()`** | Unchanged — same authenticated UPDATE path as G-6-e5/f6 |
| **`service_role`** | Not used by Kit staging writes; trigger does not require it |
| **anon** | SELECT only — no trigger involvement |
| **authenticated** | UPDATE on `schedules` (admin) — trigger fires on allowed updates |

Trigger does **not** bypass RLS. Failed RLS UPDATE → no row change → trigger does not commit a change.

### 4.3 Application layers

| Layer | Impact |
| --- | --- |
| G-6-e5 / G-6-f6 PoC | Retired from ops; if re-run, `updated_at` would change post-migration |
| Dry-run UI | No DB writes — no change |
| `updateScheduleWrite` | After migration, `afterSnapshot.updated_at` should differ from `beforeSnapshot` when row changes |
| `expectedBeforeUpdatedAt` | Becomes **meaningful** after migration |
| Sitemap / static build | Reads schedules at build time — data unchanged unless row edited; `updated_at` not exposed on public site typically |
| Sariswing production | **Out of scope** — do not apply in Kit phases |
| Future customer projects | Apply same SQL on their staging Supabase before general edit UI |

### 4.4 Rollback SQL on data rows

Row-level rollback SQL (restore venue/description) remains valid. After trigger exists, rollback UPDATE will also bump `updated_at` — expected and desirable.

## 5. Pre-migration check SQL (execution phase — NOT run in G-6-f8)

Run in Supabase SQL Editor after confirming project **`static-to-astro-cms-staging`**.

### 5.1 Column exists

```sql
-- G-6-f8 pre-migration: schedules.updated_at column
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'schedules'
  and column_name in ('updated_at', 'created_at')
order by column_name;
```

### 5.2 Existing triggers on schedules

```sql
-- G-6-f8 pre-migration: triggers on public.schedules
select
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'schedules'
order by trigger_name;
```

### 5.3 Existing function (name collision check)

```sql
-- G-6-f8 pre-migration: function exists?
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('tg_schedules_set_updated_at', 'set_updated_at')
order by p.proname;
```

### 5.4 Target row baseline (G-6-f6 PoC row)

```sql
-- G-6-f8 pre-migration: target row baseline
select
  id,
  legacy_id,
  title,
  venue,
  description,
  published,
  show_on_home,
  sort_order,
  created_at,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Expected (post G-6-f6):**

```txt
venue: [CMS Kit staging] G-6-f6 venue PoC
description: 出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]
updated_at: 2026-06-05 17:39:44.140168+00
row count: 1
```

### 5.5 Abort pre-migration apply if

```txt
- Wrong Supabase project (not static-to-astro-cms-staging)
- updated_at column missing
- Unexpected schedules_set_updated_at trigger already exists with different function (investigate first)
- Target row missing or diverged unexpectedly
```

## 6. Post-migration verification SQL (execution phase — NOT run in G-6-f8)

### 6.1 Object existence

```sql
-- G-6-f8 post-migration: trigger + function present
select trigger_name
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'schedules'
  and trigger_name = 'schedules_set_updated_at';

select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'tg_schedules_set_updated_at';
```

### 6.2 Trigger behavior — important note on “no-op” UPDATE

In PostgreSQL, `UPDATE ... SET col = col` still fires `BEFORE UPDATE`. The trigger will set `updated_at = now()` even when no business field semantically changed.

**Options for staging verification:**

| Option | Pros | Cons |
| --- | --- | --- |
| **A. Same-value UPDATE** (e.g. `SET title = title`) | Proves trigger fires; no semantic data change | `updated_at` changes without content change — audit noise |
| **B. Reversible micro-change** on low-risk row | Proves trigger + real write path | Requires brief data change + rollback SQL |
| **C. Dedicated test row** (`show_on_home = false`) | Isolated from PoC row | May need INSERT approval later |

**Recommendation for execution phase:** **Option A first** on PoC row `aa440e29-...` — record `updated_at` before/after with `SET description = description` (or `title = title`). Accept audit timestamp bump only. Then optional Option B in a separate approved slice if full write path retest is needed.

**Do not** use G-6-e5/G-6-f6 Run buttons for trigger verification unless in a documented re-test phase.

### 6.3 Verification query template (after controlled UPDATE)

```sql
-- G-6-f8 post-migration: compare timestamps (run after controlled staging UPDATE)
select
  id,
  legacy_id,
  created_at,
  updated_at,
  created_at = updated_at as created_eq_updated,
  venue,
  description
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Success criteria:**

```txt
schedules_set_updated_at trigger exists
tg_schedules_set_updated_at function exists
After controlled UPDATE: updated_at > pre-migration baseline (or strictly later timestamp)
created_at unchanged
Business fields unchanged (if Option A same-value UPDATE)
```

## 7. Rollback SQL proposal (NOT executed in G-6-f8)

### 7.1 Remove trigger + function (staging)

```sql
-- G-6-f8 rollback: remove schedules updated_at trigger — STAGING ONLY
-- Execute only if migration must be reverted and no other object uses this function.

drop trigger if exists schedules_set_updated_at on public.schedules;

drop function if exists public.tg_schedules_set_updated_at();
```

### 7.2 Rollback policy

| Question | Staging | Production (future) |
| --- | --- | --- |
| Drop trigger only | N/A — function is schedules-specific | Same |
| Drop function | Safe if schedules-only name used | Document in customer runbook |
| Row data rollback | Separate SQL (G-6-f6 rollback template) | Customer decision |
| Re-apply migration | Idempotent SQL in §3.2 | After staging proof |

Rolling back the trigger does **not** restore old `updated_at` values on existing rows.

## 8. Optimistic lock connection (design only — no implementation in G-6-f8)

### 8.1 Current adapter support

`updateScheduleWrite` in `schedule-write-adapter.ts`:

```txt
optional input: expectedBeforeUpdatedAt
if set: SELECT current row → compare updated_at → errorCode optimistic_lock_failed
if mismatch: abort before UPDATE
```

PoCs omitted this because `updated_at` was static.

### 8.2 Post-trigger activation plan

| Step | Action |
| --- | --- |
| 1 | Migration execution + verification (G-6-f8 execution) |
| 2 | General UI / next write slice passes `beforeSnapshot.updated_at` as `expectedBeforeUpdatedAt` |
| 3 | On success, refresh UI snapshot from `afterSnapshot.updated_at` |
| 4 | On `optimistic_lock_failed`, show: “別の更新がありました。再読み込みしてください。” |
| 5 | Dry-run: simulate stale by comparing UI snapshot age vs live SELECT (optional later) |

### 8.3 Error codes (existing)

```txt
optimistic_lock_select_failed — pre-UPDATE SELECT failed
optimistic_lock_failed — updated_at mismatch
```

### 8.4 UX notes

```txt
Mobile: reload row on conflict; do not auto-retry write
Do not include updated_at in user-editable payload
Compare timestamps as strings from Supabase (timestamptz ISO format)
```

Separate phase `G-6-f9-schedule-optimistic-lock-enablement` may wire UI after trigger verified.

## 9. RLS / admin_users / service_role summary

```txt
service_role: forbidden for Kit staging CMS writes (unchanged)
Write path: authenticated JWT + RLS schedules_admin_all / is_admin()
Trigger: does not elevate privileges
schedule_months: read-only; no migration
/admin: not modified
```

## 10. Risks / open questions

| Risk | Mitigation |
| --- | --- |
| Wrong Supabase project | Dashboard check + host `kmjqppxjdnwwrtaeqjta.supabase.co` |
| Name collision with existing function | Pre-migration §5.3 |
| Same-value UPDATE bumps `updated_at` | Document; acceptable for staging proof |
| Sariswing production drift | Kit SQL staging-only until explicit production phase |
| No supabase/migrations CI | Manual SQL Editor + repo script file in execution phase |
| year/month derivation on date change | Out of scope for this trigger |

## 11. Recommended next phases

| Order | Phase | Scope |
| --- | --- | --- |
| **1** | `G-6-f8-schedule-updated-at-staging-migration-execution` | Run §5 pre-checks → apply §3.2 SQL → run §6 verification (controlled UPDATE) → result doc |
| **2** | `G-6-f9-schedule-optimistic-lock-enablement-planning` | Wire `expectedBeforeUpdatedAt` in general UI / next write slice |
| **3** | `G-6-g-schedule-general-edit-ui-planning` | Visible edit UI (can parallel planning after execution success) |

**Apply vs verify:** Same execution phase is acceptable if operator runs pre-check → migration → verification in one session with abort gates. Split only if team prefers separate approval for DDL apply.

Add `scripts/supabase/schedules-updated-at-trigger.sql` in execution phase (copy from §3.2) — not required in preflight.

## 12. G-6-f8 safety statement

```txt
Supabase SQL executed: none
DB migration applied: none
DB write: none
Run button click: none
G-6-e5 / G-6-f6 PoC re-click: none
rollback SQL executed: none
service_role: not used
/admin: not modified
schedule_months: not touched (no trigger on schedule_months)
```

## Related docs

- [schedule-write-hardening-and-updated-at-planning.md](./schedule-write-hardening-and-updated-at-planning.md)
- [schedule-safe-fields-non-dry-run-execution-result.md](./schedule-safe-fields-non-dry-run-execution-result.md)
