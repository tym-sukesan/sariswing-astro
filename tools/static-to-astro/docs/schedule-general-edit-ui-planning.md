# Schedule general edit UI planning (G-6-g)

Last updated: 2026-06-14  
Phase: `G-6-g-schedule-general-edit-ui-planning`  
Type: **planning only** — no DB write, no Supabase SQL, no Run click, no Save execution, no implementation

## Purpose

Before `G-6-g1-schedule-title-non-dry-run-slice`, design a product-grade Schedule general edit UI on the staging shell that reuses G-6-f2 read binding, G-6-f3/f4 dry-run scaffolds, and G-6-f10 optimistic lock wiring — while keeping G-6-e5 / G-6-f6 PoC paths frozen and separate.

**This phase performed:** design, docs, AI context updates.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, non-dry-run execution, Run/Save click, `/admin` changes, `service_role`.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-f2 | `ScheduleAdminUi` + live Supabase SELECT |
| G-6-f3 / G-6-f4 | Description + safe-fields dry-run prototypes |
| G-6-f10 | `buildScheduleLockedWriteRequest`, dry-run stale check |
| G-6-f8 | `updated_at` trigger on staging |

```txt
optimisticLockWiredInProductPath: true
nonDryRunSaveUiExposed: false
executeScheduleGeneralUpdateWrite: implemented, not UI-connected
```

---

## 1. Current staging shell layout (audit)

### 1.1 Route stack

```txt
/__admin-staging-shell/musician-basic/
  → staging-shell-wrapper.astro
  → musician-basic-admin-prototype.astro
```

### 1.2 Schedule-related sections today

| Location | Component | Role | Product path? |
| --- | --- | --- | --- |
| `#schedule-dry-run-poc-shell-section` | `AdminStagingScheduleDryRunPocSection` | G-6-e2 dry-run scaffold | Dev reference |
| Same | `AdminStagingScheduleNonDryRunPocTriggerSection` | **G-6-e5 hidden PoC** | **Frozen PoC** |
| `#schedule` | `ScheduleAdminUi` | Read-only list (G-6-f2 live SELECT) | **Read layer for general UI** |
| `#schedule` | `AdminStagingScheduleSafeFieldsDryRunSection` | G-6-f4 dry-run | **Reuse → general edit** |
| `#schedule` | `AdminStagingScheduleSafeFieldsNonDryRunPocSection` | **G-6-f6 PoC** | **Frozen PoC** |
| (not mounted) | `AdminStagingScheduleDescriptionDryRunSection` | G-6-f3 dry-run | Merge into general edit |

**Gap:** No unified general edit section. G-6-f3 description dry-run exists in repo but is **not** mounted in `musician-basic-admin-prototype.astro`.

### 1.3 Code paths (must not mix)

| Path | Entry | Lock | Approval IDs |
| --- | --- | --- | --- |
| **PoC** | `executeScheduleNonDryRunPoc`, `executeG6F6SafeFieldsNonDryRunPoc` | No | G-6-e5, G-6-f6 only |
| **Product** | `executeScheduleGeneralUpdateWrite` | Yes (`expectedBeforeUpdatedAt`) | **G-6-g\*** (new) |
| **Dry-run** | `buildSchedule*DryRunResult`, stale SELECT | Preview only | G-6-f3/f4 prototype IDs |

---

## 2. General edit UI placement (recommended)

### 2.1 New section in `#schedule`

Add **`AdminStagingScheduleGeneralEditSection`** immediately below `ScheduleAdminUi` and **above** legacy G-6-f4 / G-6-f6 blocks during transition.

```txt
#schedule
  ScheduleAdminUi                    ← read list (unchanged)
  AdminStagingScheduleGeneralEditSection   ← NEW (G-6-g implementation)
  [optional transition] AdminStagingScheduleSafeFieldsDryRunSection
  [optional transition] AdminStagingScheduleSafeFieldsNonDryRunPocSection (frozen)
```

### 2.2 PoC isolation (UI + code)

| Rule | Action |
| --- | --- |
| G-6-e5 | Stays in `#schedule-dry-run-poc-shell-section`; never import general edit trigger |
| G-6-f6 | Stays visible as historical; default **not armed**; no shared Save button |
| General edit | New root id `schedule-general-edit-root`; new TS module `staging-schedule-general-edit-ui.ts` |
| Approval IDs | `SCHEDULE_WRITE_APPROVAL_IDS` extended only for `G-6-g*` — never G-6-e5/f6 |

**After G-6-g1+ stable:** collapse G-6-f4 into general edit; move G-6-f6 to collapsed “Historical PoC” or separate doc-only anchor.

### 2.3 Profile PoC pattern (reference)

Profile uses visible form + env-gated Save + result panel (`staging-profile-update-ui.ts`, `getStagingWriteConfig`). Schedule general edit should mirror:

- Visible edit fields (per active slice)
- Dry-run preview first
- Save behind env + approval ID + manual confirm
- Result panel with snapshots + safety flags

---

## 3. Row selection and session baseline

### 3.1 Picker

Reuse G-6-f4 pattern:

- `loadSchedulesForDryRunUi` → picker list (same as safe-fields dry-run)
- `readSource === "supabase"` required for meaningful stale check and non-dry-run

### 3.2 G-6-g1 title slice — recommended first target row

**Reuse** proven low-risk row from G-6-e5 / G-6-f6 / G-6-f8:

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
title: <>                    ← G-6-g1 test value
show_on_home: false
published: true
```

| Approach | G-6-g1 preflight | General UI (later) |
| --- | --- | --- |
| **Single row only** | Recommended first execution | Optional env `PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID` |
| **Any row from picker** | Defer to post-g1 | Default product behavior |

Rationale: same row reduces rollback surprise; `title` `<>` is staging-only placeholder; row already used for write hardening proofs.

### 3.3 Session state (client)

```typescript
type ScheduleGeneralEditSession = {
  scheduleId: string;
  beforeSnapshot: ScheduleDryRunSource;  // full row at select/reload
  baselineUpdatedAt: string | null;        // lock token
  loadedAt: string;
  lastDryRunPreview?: {
    payload: ScheduleUpdateWritePayload;
    changedFields: string[];
    previewedAt: string;
    optimisticLock?: ScheduleOptimisticLockDryRunState;
  };
  dryRunPreviewValid: boolean;             // required for Save enable
};
```

**On row select / Reload rows:**

1. SELECT via list loader (or `loadScheduleBeforeSnapshot` before Save)
2. Set `beforeSnapshot` + `baselineUpdatedAt = beforeSnapshot.updated_at`
3. Clear `lastDryRunPreview`; `dryRunPreviewValid = false`
4. Hide stale banner

**After successful non-dry-run Save:**

1. `afterSnapshot` from adapter result
2. Update `beforeSnapshot` ← `afterSnapshot`
3. `baselineUpdatedAt` ← `afterSnapshot.updated_at`
4. Reset dry-run preview state

**On stale detected (dry-run or pre-save):**

- Do **not** update baseline automatically
- Show reload CTA; user must click **Reload rows** to refresh session

---

## 4. Dry-run first UX

### 4.1 Policy

| Rule | Value |
| --- | --- |
| Dry-run before Save | **Required** for non-dry-run slice execution |
| `actualWrite` | Always `false` in dry-run |
| Write adapter | Not called in dry-run preview |
| Stale check | SELECT `updated_at` on preview (G-6-f10 pattern) |

### 4.2 Preview result panel (general edit)

Display per preview:

| Field | Source |
| --- | --- |
| before value | `beforeSnapshot` field (slice-specific) |
| edited value | form input |
| changedFields | computed |
| baselineUpdatedAt | session |
| currentUpdatedAt | stale check SELECT (if supabase) |
| staleDetected | optimistic lock dry-run state |
| stale message | JA warning if stale |
| actualWrite | `false` |
| wouldWrite | `changedFields.length > 0` |
| approvalId | slice dry-run ID (e.g. `G-6-g-schedule-edit-dry-run`) |
| readSource | supabase / mock |

### 4.3 Stale → block non-dry-run

```txt
if optimisticLock.staleDetected:
  Save button: disabled
  show: 「別の編集が入った可能性があります。再読み込みしてから保存してください。」
  do not call executeScheduleGeneralUpdateWrite
```

Dry-run preview itself remains allowed (informational).

### 4.4 Implementation reuse

| Existing | General edit use |
| --- | --- |
| `runDryRunStaleCheck` | Preview button |
| `renderOptimisticLockDryRunHtml` | Result panel block |
| `buildScheduleSafeFieldsDryRunResult` | Evolve to slice-aware `buildScheduleGeneralEditDryRunResult` |
| Reload button | Same as G-6-f4 |

---

## 5. Non-dry-run Save UI (design only — G-6-g1+)

Not implemented in G-6-g planning. Design for next implementation phase.

### 5.1 Env gates (stack with existing write gates)

```bash
# Default dev (unchanged)
PUBLIC_ADMIN_WRITE_DRY_RUN=true
ENABLE_ADMIN_STAGING_WRITE=false

# Non-dry-run slice arm (example G-6-g1 title)
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-g1-schedule-title-non-dry-run-slice
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_SLICE_ARMED=true   # slice-specific arm
# Optional first execution:
PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID=aa440e29-5be8-402e-9190-0d81c48434c0
```

| Env | Purpose |
| --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | Master staging write flag (existing) |
| `PUBLIC_ADMIN_WRITE_*` | Provider / module / approval / dry-run (PoC pattern) |
| `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_SLICE_ARMED` | Slice-specific arm — default off |
| `PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID` | Optional single-row lock for first execution |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | Lock token (default true) |

### 5.2 Save button disabled when

```txt
- !DEV or !ENABLE_ADMIN_STAGING_SHELL
- !sliceArmed (e.g. G6G1_TITLE_SLICE_ARMED)
- !ENABLE_ADMIN_STAGING_WRITE
- PUBLIC_ADMIN_WRITE_DRY_RUN !== false
- approval ID env mismatch
- !authenticated session (signed-in admin)
- !dryRunPreviewValid for current form payload
- optimisticLock.staleDetected
- changedFields empty (no-op)
- executionInFlight
- manual confirm text !== approval ID
- optional: readSource !== supabase
```

### 5.3 Manual confirmation

**Yes** — type exact approval ID (G-6-f6 / Profile PoC pattern).

```txt
Label: Type exactly: G-6-g1-schedule-title-non-dry-run-slice
Input: schedule-general-edit-confirm-input
```

### 5.4 Save execution flow

```mermaid
sequenceDiagram
  participant UI as General Edit UI
  participant Trigger as executeScheduleGeneralUpdateWrite
  participant Adapter as updateScheduleWrite

  UI->>UI: User Preview dry-run (required)
  UI->>UI: User types approval ID + clicks Save once
  UI->>Trigger: payload title only, beforeSnapshot from session
  Trigger->>Adapter: expectedBeforeUpdatedAt = baselineUpdatedAt
  alt optimistic_lock_failed
    UI-->>UI: Conflict panel + Reload; no retry
  else success
    UI-->>UI: afterSnapshot, new baselineUpdatedAt, rollbackHint
  end
```

### 5.5 Success result panel

```txt
status: executed
actualWrite: true
approvalId
targetId
changedFields
beforeTitle / afterTitle (slice fields)
beforeUpdatedAt (from beforeSnapshot)
afterUpdatedAt (from afterSnapshot)
optimisticLockEnabled: true
rollbackHint
safety flags (serviceRoleUsed, scheduleMonthsTouched, …)
JSON detail (sessionStorage optional)
```

### 5.6 Conflict display

| errorCode | UI |
| --- | --- |
| `optimistic_lock_failed` | Alert + Reload button; **no auto-retry** |
| `optimistic_lock_select_failed` | Alert + Reload; show errorMessage |
| `guard_failed` | Show message; Save stays disabled until fixed |
| `update_failed` | Show adapter errorMessage |

Use `mapScheduleWriteErrorToUserMessage` from `schedule-write-utils.ts`.

---

## 6. Approval ID policy

### 6.1 Frozen (never reuse)

```txt
G-6-e5-schedule-non-dry-run-poc
G-6-f6-schedule-safe-fields-non-dry-run-poc
```

### 6.2 Dry-run prototype IDs (no write)

```txt
G-6-f3-schedule-description-edit-dry-run-prototype
G-6-f4-schedule-safe-fields-dry-run-prototype
G-6-g-schedule-general-edit-dry-run          ← new umbrella dry-run ID (optional)
```

### 6.3 Non-dry-run slice IDs (G-6-g namespace)

| Phase | Approval ID | Payload fields |
| --- | --- | --- |
| **G-6-g1** | `G-6-g1-schedule-title-non-dry-run-slice` | `title` only |
| G-6-g2 | `G-6-g2-schedule-time-fields-non-dry-run-slice` | `open_time`, `start_time` |
| G-6-g3 | `G-6-g3-schedule-price-non-dry-run-slice` | `price` |
| G-6-g4 | `G-6-g4-schedule-venue-description-non-dry-run-slice` | `venue`, `description` (new ID — not G-6-f6) |
| G-6-g5 | `G-6-g5-schedule-visibility-non-dry-run-slice` | `published`, `show_on_home` |
| G-6-g6 | `G-6-g6-schedule-ordering-non-dry-run-slice` | `sort_order`, `home_order` |
| G-6-g7 | `G-6-g7-schedule-date-non-dry-run-slice` | `date` |
| G-6-g8 | `G-6-g8-schedule-image-fields-non-dry-run-slice` | `image_url`, `home_image_url` (Storage deps) |
| G-6-g9 | `G-6-g9-schedule-create-non-dry-run-slice` | INSERT — separate phase |
| G-6-h1 | `G-6-h1-schedule-logical-delete-restore-slice` | soft delete / restore |

Register each ID in `schedule-write-types.ts` + `SCHEDULE_WRITE_APPROVAL_IDS` at implementation time only.

### 6.4 Slice payload guards

Add `assertG6G1TitlePayloadOnly` (etc.) in `schedule-write-guards.ts` per slice — same pattern as `assertG6F6SafeFieldsPayloadOnly`.

---

## 7. Optimistic lock UX (general edit)

| Moment | Display |
| --- | --- |
| Row selected | `baseline updated_at` in meta dl |
| Dry-run preview | `baselineUpdatedAt`, `currentUpdatedAt`, `staleDetected` |
| Stale banner | JA message (G-6-f10 copy) |
| Pre-save | `expectedBeforeUpdatedAt` in dev panel (optional) |
| Save conflict | `optimistic_lock_failed` message + Reload |
| Save success | `afterUpdatedAt` > `beforeUpdatedAt`; refresh baseline |

**Prohibited:**

- Auto-retry Save on conflict
- Silent overwrite when stale
- `updated_at` in form or payload
- Retrofitting lock onto G-6-e5/f6 PoC triggers

---

## 8. Rollback / recovery / audit

### 8.1 This phase — no audit table

Keep PoC-style audit trail:

- Result panel JSON
- `*-execution-result.md` per slice
- Optional `sessionStorage` snapshot

### 8.2 Result panel contract

```txt
beforeSnapshot: full row or slice fields
afterSnapshot: from adapter on success
changedFields: from adapter
rollbackHint: show on success (manual SQL guidance)
on conflict: rollbackHint = no write occurred
```

### 8.3 G-6-g1 title rollback SQL template

```sql
-- G-6-g1 rollback — staging only; execute only if explicitly approved
update public.schedules
set title = '<>'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0';
```

Adjust `beforeTitle` from pre-execution `beforeSnapshot` SQL doc.

### 8.4 schedule_months

```txt
Rollback: schedules row only
schedule_months: not written, not rolled back, not in payload
Derived months refresh via build/publish — out of slice scope
```

### 8.5 Future audit table (optional)

Phase `G-6-h-schedule-write-audit-log-planning` — append-only `schedule_write_audit` with before/after json, approval_id, user_id, ts. Not required for G-6-g1.

---

## 9. Field slice order (confirmed)

G-6-f7 order remains valid. Adjust notes:

| Order | Slice | Notes |
| --- | --- | --- |
| 1 | **title** (G-6-g1) | **Next** — `<>` on test row |
| 2 | open_time + start_time (G-6-g2) | Low-risk text |
| 3 | price (G-6-g3) | Low-risk text |
| 4 | venue + description (G-6-g4) | G-6-f6 proved write; **new approval ID** required |
| 5 | published / show_on_home (G-6-g5) | Extra confirm |
| 6 | sort_order / home_order (G-6-g6) | Ordering |
| 7 | date (G-6-g7) | Routing / month impact — late |
| 8 | image_url / home_image_url (G-6-g8) | Storage CMS dependency |
| 9 | create (G-6-g9) | INSERT + RLS grant |
| 10 | logical delete / restore (G-6-h1) | Cross-module plan |

**No change** to ordering rationale from G-6-f7.

---

## 10. G-6-g1 implementation checklist (next phase)

```txt
[ ] schedule-general-edit-config.ts — env gates for g1 slice
[ ] assertG6G1TitlePayloadOnly in schedule-write-guards.ts
[ ] G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID in schedule-write-types.ts
[ ] AdminStagingScheduleGeneralEditSection.astro — title field + preview + save (gated)
[ ] staging-schedule-general-edit-ui.ts — session, dry-run, save handler
[ ] Wire executeScheduleGeneralUpdateWrite with G-6-g1 approval ID
[ ] Preflight doc: schedule-title-non-dry-run-slice-preflight.md
[ ] beforeSnapshot SQL + rollback SQL in preflight
[ ] Manual Save once — user only; no Cursor click
```

---

## 11. Recommended implementation files (G-6-g implementation phase)

| File | Role |
| --- | --- |
| `schedule-general-edit-config.ts` | Slice + env gates |
| `schedule-general-edit-dry-run.ts` | Slice-aware dry-run builder |
| `staging-schedule-general-edit-ui.ts` | Browser UI |
| `AdminStagingScheduleGeneralEditSection.astro` | Staging shell section |
| Extend `schedule-write-types.ts` / `schedule-write-guards.ts` | G-6-g1 approval + payload guard |

**Do not modify:** `schedule-non-dry-run-poc-trigger.ts`, `schedule-safe-fields-non-dry-run-poc-trigger.ts`.

---

## 12. Gate decision

```txt
scheduleGeneralEditUiPlanningComplete: true
readyForScheduleGeneralEditUiImplementation: true
readyForG6G1ScheduleTitleNonDryRunSlicePreflight: true
nonDryRunSaveUiExposed: false
optimisticLockWiredInProductPath: true
```

---

## 13. Recommended next phases

```txt
1. G-6-g1-schedule-title-non-dry-run-slice-preflight
2. G-6-g1-schedule-title-non-dry-run-slice-implementation
3. G-6-g1-schedule-title-non-dry-run-slice-execution (user manual Save once)
4. G-6-g2-schedule-time-fields-non-dry-run-slice (after g1 success)
```

---

## 14. G-6-g safety statement

```txt
DB write: none
Supabase SQL executed: none
Run button click: none
Save button click: none
G-6-e5 / G-6-f6 PoC re-click: none
/admin: not modified
schedule_months: read-only / derived (not touched)
service_role: not used
```

## Related docs

- [schedule-optimistic-lock-enablement-implementation.md](./schedule-optimistic-lock-enablement-implementation.md)
- [schedule-optimistic-lock-enablement-planning.md](./schedule-optimistic-lock-enablement-planning.md)
- [schedule-write-hardening-and-updated-at-planning.md](./schedule-write-hardening-and-updated-at-planning.md)
- [schedule-cms-generalization-planning.md](./schedule-cms-generalization-planning.md)
- [schedule-safe-fields-dry-run-prototype.md](./schedule-safe-fields-dry-run-prototype.md)
