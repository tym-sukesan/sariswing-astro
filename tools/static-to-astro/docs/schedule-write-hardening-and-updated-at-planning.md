# Schedule write hardening and updated_at planning (G-6-f7)

Last updated: 2026-06-14  
Phase: `G-6-f7-schedule-write-hardening-and-updated-at-planning`  
Type: **planning / hardening design only** — no DB write, no SQL execution, no Run click

## Purpose

Before building a general Schedule edit UI, consolidate lessons from G-6-e5 and G-6-f6, and design hardening for `updated_at`, optimistic locking, rollback/recovery, approval IDs, and PoC vs product boundaries.

**This phase performed:** docs and design only.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL execution, non-dry-run execution, Run click, rollback execution, `/admin` changes, `service_role`.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-e5 | `description` non-dry-run success; `updated_at` unchanged |
| G-6-f1 | G-6-e5 hidden trigger isolated; dry-run default |
| G-6-f2 | ScheduleAdminUi SSR read binding |
| G-6-f3 / G-6-f4 | Description + safe-fields dry-run UI |
| G-6-f5–f6 | `venue + description` non-dry-run success; `updated_at` unchanged |

## 1. G-6-e5 / G-6-f6 success summary

| Aspect | G-6-e5 | G-6-f6 |
| --- | --- | --- |
| Approval ID | `G-6-e5-schedule-non-dry-run-poc` | `G-6-f6-schedule-safe-fields-non-dry-run-poc` |
| UI | Hidden Danger Zone | Visible G-6-f6 section |
| Arm env | `PUBLIC_ADMIN_NON_DRY_RUN_POC_*` | `PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED` |
| Payload | `description` only | `venue`, `description` |
| changedFields | `["description"]` | `["venue", "description"]` |
| actualWrite | `true` | `true` |
| rowsAffected | `1` | `1` |
| serviceRoleUsed | `false` | `false` |
| scheduleMonthsTouched | `false` | `false` |
| updated_at after | `2026-06-05 17:39:44.140168+00` (unchanged) | same |
| Run click | User manual once | User manual once |
| Cursor / Playwright | No | No |

Both succeeded on the same row (`aa440e29-5be8-402e-9190-0d81c48434c0`) via authenticated anon client + RLS + `admin_users`. Not PoC failures.

## 2. Current write flow

### 2.1 End-to-end path (proven)

```txt
Browser (staging shell)
  → staging Supabase Auth session (signed-in admin)
  → getStagingSupabaseClient (anon key + user JWT)
  → PoC trigger (G-6-e5 or G-6-f6)
      → SELECT beforeSnapshot (schedules by id)
      → validate beforeSnapshot (PoC-specific)
      → assertG6F6SafeFieldsPayloadOnly (G-6-f6 only)
  → updateScheduleWrite (schedule-write-adapter.ts)
      → assertScheduleWriteApprovalId
      → assertScheduleWriteTargetId
      → assertBeforeSnapshotMatchesTarget
      → assertScheduleUpdatePayloadAllowed
      → optional expectedBeforeUpdatedAt optimistic lock (unused in PoCs)
      → client.from("schedules").update(payload).eq("id", …).select().single()
  → result panel: beforeSnapshot / afterSnapshot / changedFields / safety flags
```

### 2.2 Layer responsibilities

| Layer | Responsibility |
| --- | --- |
| **Auth** | Supabase Auth session; `admin_users` + RLS `is_admin()` — not mock allowlist |
| **Write adapter** | Single UPDATE path; compute `changedFields`; `rollbackHint`; safety metadata |
| **Write guards** | Approval ID allowlist; payload allowlist / forbidden keys; G-6-f6 slice guard |
| **PoC trigger** | Env gates; fixed payload; beforeSnapshot validation; calls adapter |
| **PoC UI** | Manual confirm (type approval ID); host/project display; result panel |
| **Dry-run stack** | Separate adapter; `actualWrite: false` always; preview only |

### 2.3 Safety invariants (proven)

```txt
service_role: never used
schedule_months: never written
productionBlocked: true in safety metadata
stagingOnly: true
deleteEnabled: false
publishTriggered: false
INSERT / DELETE: not implemented in adapter
```

### 2.4 G-6-e5 vs G-6-f6 differences

| Topic | G-6-e5 | G-6-f6 |
| --- | --- | --- |
| Visibility | Hidden; `EXPLICIT_RERUN` to re-arm | Visible section; separate arm env |
| Approval | One-off; must not reuse | PoC slice; must not reuse for general UI |
| Payload guard | Adapter allowlist only | + `assertG6F6SafeFieldsPayloadOnly` |
| beforeSnapshot | description exact match | id, legacy_id, description, venue empty |
| Retire? | Yes — keep code, disarm default | Yes — keep code, disarm default |

### 2.5 Reusable for general UI

```txt
updateScheduleWrite + schedule-write-guards (extend approval IDs)
beforeSnapshot SELECT pattern
changedFields computation
result panel structure (actualWrite, safety, rollbackHint)
staging-only + expected Supabase host checks
manual confirm for non-dry-run
dry-run-first UX (G-6-f3/f4 sections)
ScheduleAdminUi read binding (G-6-f2)
Profile PoC pattern: visible form + Save + approval ID per milestone
```

### 2.6 PoC-only — retire from product path

```txt
G-6-e5 hidden Danger Zone + EXPLICIT_RERUN gate
G-6-f6 armed non-dry-run section (historical; do not re-click)
Fixed single-row target IDs in PoC config
Hard-coded PoC payloads
SCHEDULE_WRITE_APPROVAL_ID union limited to G-6-e5 + G-6-f6
```

General UI needs new approval ID namespace (e.g. `G-6-g-schedule-edit-*`).

## 3. updated_at problem

### 3.1 Observation

```txt
G-6-e5: description UPDATE succeeded; updated_at unchanged
G-6-f6: venue + description UPDATE succeeded; updated_at unchanged
Value: 2026-06-05 17:39:44.140168+00 (same as created_at on target row)
```

Implication: no working `BEFORE UPDATE` trigger (or trigger absent) on `public.schedules` in staging. Adapter supports `expectedBeforeUpdatedAt` but PoCs did not use it (G-6-e5 warned and proceeded).

### 3.2 Impact

| Area | Impact while static |
| --- | --- |
| Audit / “last edited” | Misleading — column does not reflect edits |
| Optimistic lock | **Cannot use `updated_at`** as version token |
| Stale overwrite | Two editors can overwrite without conflict detection |
| Customer UX | “Saved at …” display would be wrong if bound to `updated_at` |

Not a PoC failure; hardening required before general UI.

## 4. updated_at policy options

### Option A — DB trigger (recommended primary)

```sql
-- Illustration only — NOT executed in G-6-f7
-- create or replace function public.set_schedules_updated_at()
-- returns trigger as $$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $$ language plpgsql;
--
-- create trigger schedules_set_updated_at
--   before update on public.schedules
--   for each row execute function public.set_schedules_updated_at();
```

| Pros | Cons |
| --- | --- |
| DB source of truth; server clock | Requires migration on staging (later production) |
| Works for all clients (admin, shell, future API) | Must verify RLS still allows UPDATE |
| Enables real optimistic lock | Existing rows unchanged until next UPDATE |
| No UI exposure of `updated_at` in payload | Migration workflow must be documented |

**schedule_months:** derived/read-only — trigger on `schedules` only; no direct write to `schedule_months`.

**Staging first:** apply and verify on `static-to-astro-cms-staging` in a dedicated migration phase before production Sariswing or customer projects.

### Option B — Application layer sets `updated_at`

Adapter adds `updated_at: new Date().toISOString()` (or DB `now()` via RPC) before UPDATE.

| Pros | Cons |
| --- | --- |
| No immediate DB migration | Client/server clock skew if browser-generated |
| Adapter already allows key in allowlist | Malicious client could set old timestamp if RLS allows column write |
| Faster to prototype | Duplicated logic if multiple write paths |

**If used:** set only inside adapter/trigger layer — never from UI form fields. Prefer server time (trigger or Supabase RPC) over client clock.

### Option C — Defer (interim only)

Keep static `updated_at`; use field-equality checks only.

| Pros | Cons |
| --- | --- |
| Zero schema/app change now | Weak audit |
| PoC-safe | Optimistic lock blocked |
| | Unacceptable for production CMS long-term |

### 4.1 Recommendation

**Primary: Option A (DB trigger on staging first)** in phase `G-6-f8-schedule-updated-at-staging-migration-preflight` → approved migration → verify with read-only SELECT after a test UPDATE slice.

**Secondary fallback:** Option B inside `updateScheduleWrite` only if migration is blocked — use server-side timestamp, not UI payload.

**Do not rely on Option C** beyond the current gap between G-6-f6 success and trigger migration. General Schedule edit UI should not ship without a real `updated_at` story.

**PoC interim rule (unchanged):** do not put `updated_at` in PoC payloads; record before/after in SQL docs.

## 5. Optimistic lock / concurrency

### 5.1 Current state

- `updateScheduleWrite` accepts `expectedBeforeUpdatedAt`.
- G-6-e5 trigger warns on mismatch and skips lock.
- Static `updated_at` makes lock useless today.

### 5.2 Recommended approach (after Option A on staging)

```txt
1. UI loads row → store beforeSnapshot including updated_at
2. On Save (non-dry-run): pass expectedBeforeUpdatedAt to adapter
3. Adapter SELECT current row → compare updated_at → abort with optimistic_lock_failed if mismatch
4. UPDATE → trigger bumps updated_at → afterSnapshot has new updated_at
5. UI shows conflict message: "Another edit occurred; reload and retry"
```

### 5.3 Interim (before trigger migration)

| Mechanism | Use |
| --- | --- |
| `updated_at` lock | **No** |
| Full beforeSnapshot field hash (safe fields only) | Optional extra guard in general UI — compare SELECT before write |
| Selected-field equality | PoC pattern (description, venue) — extend per slice |
| Last-write-wins | Accept for staging-only single-admin PoC; **not** for general UI |

### 5.4 Mobile / multi-device UX

```txt
- Prefer soft conflict: show diff, offer reload
- Do not silent overwrite published/show_on_home without confirm
- Dry-run preview before non-dry-run Save remains default
```

## 6. Rollback / recovery

### 6.1 PoC pattern (proven)

```txt
beforeSnapshot SQL → manual Run → afterVerification SQL
rollback SQL documented per phase; executed only with explicit approval
result panel + execution-result.md for audit trail
rollbackNeeded: false on G-6-e5/f6 success
```

### 6.2 General UI recommendations

| Level | Recommendation |
| --- | --- |
| **Minimum (Kit staging)** | Keep beforeSnapshot + afterSnapshot in result panel; export rollback SQL template per save (field-level SET) |
| **Medium** | Session/local result log (already partial via sessionStorage in PoC UI) |
| **Optional later** | `schedule_write_audit` table (append-only: id, user, before json, after json, approval_id, ts) — separate phase |
| **Not now** | App-level undo stack; soft delete restore (G-6-f logical-delete phase) |
| **Production customers** | Document manual rollback SQL + FTP/git redeploy playbook; audit table if SLA requires |

**schedule_months:** rollback restores `schedules` only; derived months refresh from build/publish pipeline — do not write `schedule_months` in rollback.

## 7. Approval ID / field slice policy

### 7.1 Principles

```txt
PoC approval IDs (G-6-e5, G-6-f6): frozen — do not reuse
General UI: new IDs per capability slice
Dry-run: prototype IDs (G-6-f3/f4) — no write
Non-dry-run: explicit approval ID + env gate + manual confirm
One slice per manual Run/Save click during PoC-style phases
```

### 7.2 Field risk levels

| Risk | Fields | Non-dry-run policy |
| --- | --- | --- |
| **Low** | `venue`, `description`, `price`, `open_time`, `start_time` | Slice per field group; dry-run first |
| **Medium** | `title` | Separate slice; legacy `<>` on test row |
| **Medium-high** | `published`, `show_on_home`, `home_order`, `sort_order` | Visibility slice; extra confirm |
| **High** | `date` | Affects routing, legacy paths, month grouping — late slice |
| **Forbidden early** | `year`, `month` (derived), `legacy_id`, `id` | Never in payload |
| **Deferred** | `image_url`, `home_image_url`, Storage | Storage phase |
| **Separate ops** | INSERT (create), DELETE/restore | Own approval IDs + phases |

### 7.3 Suggested approval ID naming

```txt
G-6-g-schedule-edit-safe-text-non-dry-run     (title, times, price — staged)
G-6-g-schedule-edit-visibility-non-dry-run    (published, show_on_home, orders)
G-6-g-schedule-edit-date-non-dry-run
G-6-g-schedule-create-non-dry-run
G-6-h-schedule-logical-delete-restore
```

Exact IDs assigned in each phase doc — not in this planning phase.

## 8. Next field priority (recommendation)

After G-6-f6 (`venue + description`):

| Order | Field(s) | Rationale |
| --- | --- | --- |
| **1** | `updated_at` trigger (staging) | Unblocks lock + audit — not a “field slice” but prerequisite |
| **2** | `title` | Safe text; high editor value; test row has `<>` placeholder |
| **3** | `open_time`, `start_time` | Low-risk text; often edited together — one slice |
| **4** | `price` | Low-risk text |
| **5** | `published`, `show_on_home` | Visibility — medium risk; separate slice |
| **6** | `sort_order`, `home_order` | Ordering — medium |
| **7** | `date` | High — routing / schedule month display |
| **8** | `image_url` / Storage | Depends on Storage CMS |
| **9** | `source_route`, `source_file` | Legacy migration — low user priority |
| **10** | INSERT (create) | New row — RLS INSERT grant + approval |
| **11** | DELETE / logical restore | G-6-f write-operation-safety plan |

**Do not implement in G-6-f7** — planning only.

## 9. PoC / staging shell / general UI boundaries

| Component | Status | Action |
| --- | --- | --- |
| G-6-e5 hidden trigger | Success; disarmed | **Keep code, retire from ops** — never re-arm without documented phase |
| G-6-f6 PoC section | Success; disarmed when env off | **Keep code, retire from ops** — historical reference |
| G-6-f4 safe-fields dry-run | Active scaffold | **Reuse** as general UI preview layer |
| G-6-f3 description dry-run | Active scaffold | Merge into general edit form |
| G-6-f2 ScheduleAdminUi read | Active | **Extend** with edit form + dry-run Save |
| Future general Schedule edit UI | Not built | New section; new approval IDs; Profile-like visible Save |
| Staging shell route | `/__admin-staging-shell/musician-basic/` | **Only** Kit write dev surface |
| `/admin` (Sariswing) | Production | **Do not modify** until explicit customer phase |
| Kit template | `tools/static-to-astro/templates/admin-cms/` | Source for generated customer shells |
| Customer runtime | Generated Astro project | Inherits template + env gates |

## 10. Risks / open questions

| Risk | Mitigation |
| --- | --- |
| Static `updated_at` | Staging trigger migration (G-6-f8) |
| Re-click PoC Run | Docs + disarmed env; dry-run default |
| Approval ID sprawl | Namespace convention `G-6-g-*` |
| `title` `<>` legacy display | Staging-only test row; careful copy in general UI |
| `date` change breaks routes | Late slice; dry-run shows diff |
| No INSERT path yet | Create flow separate phase |
| schedule_months derivation | Document read-only; verify site build reads `schedules` |
| Migration tooling | Confirm how staging SQL migrations are tracked in repo |

## 11. Recommended next phases

| Order | Phase | Scope |
| --- | --- | --- |
| **1** | `G-6-f8-schedule-updated-at-staging-migration-preflight` | **DONE** — see schedule-updated-at-staging-migration-preflight.md |
| **2** | `G-6-f8-schedule-updated-at-staging-migration-execution` | Apply trigger SQL on staging; verify with controlled UPDATE |
| **3** | `G-6-g-schedule-general-edit-ui-planning` | Visible list/edit UI design; wire dry-run; Profile pattern |
| **4** | `G-6-g-schedule-title-non-dry-run-slice` | title only; new approval ID |
| **5** | `G-6-g-schedule-time-fields-non-dry-run-slice` | open_time + start_time |
| **6** | `G-6-h-schedule-write-audit-log-planning` | Optional audit table — if customer SLA needs it |

Alternative naming accepted if repo convention prefers `G-6-f8-*` for all hardening sub-phases.

## 12. G-6-f7 safety statement

```txt
DB write: none
Supabase SQL execution: none
non-dry-run execution: none
Run button click: none
G-6-e5 / G-6-f6 PoC re-click: none
rollback SQL executed: none
service_role: not used
/admin: not modified
schedule_months: read-only / derived (not touched)
PUBLIC_ADMIN_WRITE_DRY_RUN=false: not used
PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN: not used
PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED: not used
```

## Related docs

- [schedule-safe-fields-non-dry-run-execution-result.md](./schedule-safe-fields-non-dry-run-execution-result.md)
- [schedule-cms-generalization-planning.md](./schedule-cms-generalization-planning.md)
- [schedule-poc-isolation-dry-run-default.md](./schedule-poc-isolation-dry-run-default.md)
