# Schedule safe-fields non-dry-run preflight (G-6-f5)

Last updated: 2026-06-14  
Phase: `G-6-f5-schedule-safe-fields-non-dry-run-preflight`  
Type: **preflight / planning only** — no DB write, no non-dry-run execution, no Run click

## Purpose

Prepare for the first **safe-fields** non-dry-run prototype after G-6-f4 dry-run UI. Document target row, fields, payload, rollback, beforeSnapshot SQL, approval ID, `updated_at` policy, and phased execution plan.

**This phase performed:** docs + SQL templates only.  
**This phase did not:** UPDATE / INSERT / DELETE, non-dry-run execution, hidden PoC re-click, rollback execution, `service_role`, `/admin` changes.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-e5 | `description` non-dry-run PoC success on staging row; `service_role` unused; `schedule_months` untouched |
| G-6-f1 | Hidden PoC trigger disarmed; `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN` required to re-arm |
| G-6-f2 | ScheduleAdminUi SSR read binding (SELECT) |
| G-6-f3 | Description dry-run edit UI (client-only) |
| G-6-f4 | Safe-fields dry-run UI (client-only); fields: title, venue, open_time, start_time, price, description |

## 1. Non-dry-run field candidates

### Safe-field candidates (from G-6-f4)

```txt
title
venue
open_time
start_time
price
description
```

### Still excluded (do not include in payload)

```txt
id, legacy_id, date, year, month
image_url, home_image_url, source_file, source_route
show_on_home, home_order, published, sort_order
created_at, updated_at
```

Especially **not** in first safe-fields non-dry-run: `date`, `year`, `month`, `published`, `show_on_home`, `sort_order`.

### Option comparison (A / B / C)

| Option | Scope | Risk | Recommendation |
| --- | --- | --- | --- |
| **A** | `description` + 1–2 other safe fields | Low–medium | **Recommended** |
| **B** | All 6 safe fields at once | High blast radius | **Not for first run** |
| **C** | Single empty field (e.g. `venue`) | Lowest | Acceptable minimal first run |

### Recommendation: **Option A (narrowed)**

First non-dry-run execution should change **two fields only**:

1. **`venue`** — currently empty on target row; fills a clearly staging-labelled value.
2. **`description`** — append a new staging marker; preserve existing G-6-e5 PoC text for traceability.

Do **not** change `title`, `open_time`, `start_time`, or `price` on the first G-6-f6 execution.

**Rationale:**

- G-6-e5 proved write path for `description` only; extending by one additional empty field (`venue`) is the smallest step beyond PoC.
- Option B (all 6) makes rollback and changedFields verification harder and increases display/legacy data risk (`title` is `<>`).
- Option C (venue only) is acceptable if the team refuses any further `description` change; Option A is preferred because a visible staging suffix confirms end-to-end multi-field payload handling.

**Follow-up milestones (after first success):** title, then open_time / start_time / price — each with its own approval slice or sub-phase, not bundled into first click.

## 2. Target row selection

### G-6-e5 row (recommended)

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
```

### Expected current state (after G-6-e5; verify with beforeSnapshot SQL)

| Field | Expected value |
| --- | --- |
| `title` | `<>` |
| `venue` | empty / null |
| `description` | `出演： [G-6-e5 non-dry-run PoC]` |
| `published` | `true` |
| `show_on_home` | `false` |
| `sort_order` | `10` |
| `updated_at` | `2026-06-05 17:39:44.140168+00` (may not change on UPDATE — see §7) |

### Comparison: reuse G-6-e5 row vs new row

| Criterion | Reuse G-6-e5 row | New staging row |
| --- | --- | --- |
| RLS / `admin_users` path proven | Yes (G-6-e5 success) | Unknown until tested |
| Live-display risk | Low (`show_on_home=false`, placeholder title) | Depends on row |
| Rollback familiarity | High (docs + SQL pattern exist) | New SQL needed |
| `description` state | Already PoC-marked | May be cleaner |
| INSERT required | No | Would require INSERT approval (out of scope) |

**Recommendation:** **Reuse G-6-e5 row** with a **new beforeSnapshot** reflecting post-G-6-e5 values (not the pre-G-6-e5 `出演：` snapshot).

### SELECT only — verify target row

```sql
-- G-6-f5 preflight: read-only verification
select
  id,
  legacy_id,
  date,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  home_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### SELECT only — list alternative low-risk rows (if G-6-e5 row diverges)

```sql
-- G-6-f5 preflight: read-only — candidates with show_on_home = false
select
  id,
  legacy_id,
  date,
  title,
  venue,
  description,
  published,
  show_on_home,
  sort_order,
  updated_at
from public.schedules
where show_on_home = false
order by date asc
limit 20;
```

## 3. Recommended payload (G-6-f6 execution — not executed in G-6-f5)

Approval ID for execution: `G-6-f6-schedule-safe-fields-non-dry-run-poc` (see §6).

### Primary payload (Option A narrowed)

```json
{
  "venue": "[CMS Kit staging] G-6-f6 venue PoC",
  "description": "出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]"
}
```

Strings are explicitly staging / PoC labelled to avoid confusion with real live copy.

### Minimal alternative (Option C)

```json
{
  "venue": "[CMS Kit staging] G-6-f6 venue PoC"
}
```

### Not approved for first execution

```json
{
  "title": "...",
  "open_time": "...",
  "start_time": "...",
  "price": "...",
  "published": true,
  "sort_order": 10
}
```

## 4. Rollback SQL (template — **do not execute in G-6-f5**)

Restore **only** fields planned to change in the primary payload. Adjust values if beforeSnapshot SQL shows different current state.

### After Option A payload (venue + description)

```sql
-- G-6-f6 rollback template — staging only; run manually if needed after G-6-f6 execution
-- NOT executed in G-6-f5 preflight
update public.schedules
set
  venue = null,
  description = '出演： [G-6-e5 non-dry-run PoC]'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

If `venue` was empty string instead of `null`, use `venue = ''` per beforeSnapshot.

### After Option C payload (venue only)

```sql
update public.schedules
set venue = null
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

### G-6-e5 description-only rollback (reference — already superseded if further description edits occur)

```sql
update public.schedules
set description = '出演：'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

## 5. beforeSnapshot SQL (run at start of G-6-f6 final preflight / execution)

```sql
-- G-6-f6 beforeSnapshot — run before manual non-dry-run click; SELECT only in G-6-f5
select
  id,
  legacy_id,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  published,
  show_on_home,
  sort_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

**Abort execution if:**

- `id` or `legacy_id` mismatch
- `description` differs from expected post-G-6-e5 value (unless a documented rollback/restore occurred)
- Row missing

Record exact `updated_at` for verification; do not assume it will change after UPDATE.

### After verification SQL (G-6-f6 execution phase)

```sql
select
  id,
  legacy_id,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  description = '出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]' as description_match,
  venue = '[CMS Kit staging] G-6-f6 venue PoC' as venue_match,
  published,
  show_on_home,
  sort_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

Adjust literals if Option C payload is used.

## 6. Approval ID

| ID | Use |
| --- | --- |
| `G-6-e5-schedule-non-dry-run-poc` | **One-off hidden PoC — do not reuse** |
| `G-6-f4-schedule-safe-fields-dry-run-prototype` | Dry-run UI only |
| **`G-6-f6-schedule-safe-fields-non-dry-run-poc`** | **Proposed for next non-dry-run execution** |

G-6-f5 is preflight; implementation/execution approval attaches to **G-6-f6** series.

New UI must wire `updateScheduleWrite` with the new approval constant (extend `schedule-write-types` or parallel type) — **not** `SCHEDULE_WRITE_APPROVAL_ID`.

## 7. `updated_at` policy

### Observed in G-6-e5

- `description` UPDATE succeeded but `updated_at` remained `2026-06-05 17:39:44.140168+00`.
- Implies **no automatic `updated_at` trigger** on `public.schedules` (or trigger not firing for this path).

### G-6-e5 code behavior

- `updateScheduleWrite` supports optional `expectedBeforeUpdatedAt` optimistic lock.
- G-6-e5 trigger passed **without** optimistic lock when `updated_at` differed (warning only).

### Recommendations for G-6-f6 first execution

| Question | Recommendation |
| --- | --- |
| Include `updated_at` in payload? | **No** — not in safe-fields scope; excluded field |
| Use optimistic lock? | **No** on first run — lock would be unreliable if column does not auto-update |
| Record `updated_at` in beforeSnapshot? | **Yes** — for audit; verify whether it changes after write |
| Touch `updated_at` in UI payload? | **No** |
| Future design | G-6-f6+ hardening: DB trigger or explicit `updated_at` in adapter after policy review |

**Verification:** Compare `updated_at` in after SQL; document `updated_atChanged: true/false` in result doc regardless of payload.

## 8. RLS / `admin_users` / `service_role`

| Rule | Status |
| --- | --- |
| Staging project only | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta.supabase.co` |
| Authenticated Supabase session | Required (same as G-6-e5 / Profile PoC) |
| RLS | `schedules_admin_all` via `is_admin()` — proven G-6-e5 |
| `admin_users` row | Required for signed-in staging admin user |
| `service_role` | **Forbidden** |
| Mock allowlist UI | Informational only; does not gate write (G-6-e5 fix) |
| Anon client writes | **Forbidden** |

## 9. Hidden PoC trigger policy

- **Do not** re-click G-6-e5 hidden PoC Run button.
- **Do not** set `PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN=true` for G-6-f6 safe-fields work.
- **Do not** reuse G-6-e5 approval ID or fixed G-6-e5 payload.
- G-6-f6 should use **new visible or gated UI** (e.g. extend safe-fields dry-run section with explicit non-dry-run Save gate + new approval ID), separate from Danger Zone.

## 10. Write adapter notes (for G-6-f6 implementation)

Existing `schedule-write-adapter.ts` + `schedule-write-guards.ts`:

- Allowlist already includes safe fields + forbidden keys align with this preflight.
- Must extend `ScheduleWriteApprovalId` type for `G-6-f6-schedule-safe-fields-non-dry-run-poc`.
- `assertScheduleWriteApprovalId` currently accepts only G-6-e5 ID — implementation phase must generalize or add parallel entry point.
- `schedule_months` remains untouched by adapter (`scheduleMonthsTouched: false`).

## 11. Phased next steps (recommended)

Do **not** jump from this preflight directly to a single hidden Run click.

| Order | Phase | Scope |
| --- | --- | --- |
| 1 | **G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation** | New approval ID, wire `updateScheduleWrite` to safe-fields UI; dry-run default; no auto-execution |
| 2 | **G-6-f6-schedule-safe-fields-non-dry-run-final-preflight** | Run beforeSnapshot SQL; confirm payload + rollback; auth session check |
| 3 | **G-6-f6-schedule-safe-fields-non-dry-run-execution** | User manual single Save/Run; Option A or C payload; result doc |
| 4 | **G-6-f6-schedule-safe-fields-write-ui-hardening** (optional) | `updated_at` policy, optimistic lock, error panel parity |

Defer: title / time / price non-dry-run until venue (+ optional description) success is recorded.

## 12. Risks / open questions

| Risk | Mitigation |
| --- | --- |
| Reusing G-6-e5 row with further `description` edits | beforeSnapshot abort if unexpected description |
| `title` `<>` legacy display | Do not change title on first run |
| `updated_at` static | Do not rely on optimistic lock; document observation |
| Approval ID type coupling | Implementation must extend types, not reuse G-6-e5 |
| Accidental hidden PoC re-arm | Separate UI; no EXPLICIT_RERUN |
| All-fields payload (Option B) | Explicitly rejected for first execution |
| New row requires INSERT | Stay on existing row for G-6-f6 |

## 13. G-6-f5 phase safety statement

```txt
DB write: none
non-dry-run execution: none
Supabase SELECT: SQL templates only (not run by Cursor in this phase unless operator runs manually)
Run button click: none
hidden PoC re-arm: none
G-6-e5 approval ID reuse: none
rollback SQL executed: none
service_role: not used
/admin: not modified
schedule_months: not touched
```
