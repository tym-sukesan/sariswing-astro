# Schedule optimistic lock enablement planning (G-6-f9)

Last updated: 2026-06-14  
Phase: `G-6-f9-schedule-optimistic-lock-enablement-planning`  
Type: **planning only** — no DB write, no Supabase SQL execution, no Run click, no migration apply

## Purpose

G-6-f8 succeeded: staging `public.schedules` has an active `BEFORE UPDATE` trigger (`schedules_set_updated_at`) that advances `updated_at` on every UPDATE. Design how to enable optimistic locking in the Schedule write flow via the existing `expectedBeforeUpdatedAt` adapter hook, and define prerequisites for general Schedule edit UI and the next field slices (`title`, `open_time`, `start_time`, `price`).

**This phase performed:** code audit, design, docs, AI context updates.  
**This phase did not:** UPDATE / INSERT / DELETE, Supabase SQL, non-dry-run execution, Run click, `/admin` changes, `service_role`.

## Prerequisites (completed)

| Phase | Outcome |
| --- | --- |
| G-6-f7 | Hardening design; recommend DB trigger + adapter lock |
| G-6-f8 preflight + execution | Trigger active on staging; `updated_at` verified advancing |
| G-6-e5 / G-6-f6 | Non-dry-run UPDATE proven without lock (historical; frozen) |

**Staging trigger state (post G-6-f8):**

```txt
function: public.tg_schedules_set_updated_at()
trigger: schedules_set_updated_at (BEFORE UPDATE FOR EACH ROW on public.schedules)
target row updated_at: 2026-06-14 06:49:42.240919+00 (after no-op verification UPDATE)
schedule_months: no trigger; read-only / derived
```

---

## 1. Code audit — `expectedBeforeUpdatedAt` presence

### 1.1 Write adapter (`schedule-write-adapter.ts`)

**Present and fully implemented** in `updateScheduleWrite`:

```txt
Input: expectedBeforeUpdatedAt?: string | null
When set (non-null, non-empty):
  1. SELECT current row by beforeSnapshot.id
  2. Compare currentRow.updated_at === expectedBeforeUpdatedAt (strict string equality)
  3. On SELECT error → errorCode optimistic_lock_select_failed, actualWrite: false
  4. On mismatch → errorCode optimistic_lock_failed, actualWrite: false
  5. On match → proceed to UPDATE (trigger bumps updated_at in afterSnapshot)
When omitted: skip lock check; proceed directly to UPDATE (current PoC behavior)
```

Payload never includes `updated_at` on normal saves — trigger is source of truth after G-6-f8.

### 1.2 Write types (`schedule-write-types.ts`)

| Symbol | `expectedBeforeUpdatedAt` |
| --- | --- |
| `ScheduleUpdateWriteInput` | `optional string \| null` |
| `updateScheduleWrite` input param | same (inline type, not alias) |
| `ScheduleWriteResult` / failure types | not on result; conflict via `errorCode` |

`ScheduleUpdateWritePayload` allows `updated_at` key in type/guards but **must not** be sent from UI or general triggers — only trigger sets it.

### 1.3 Write guards (`schedule-write-guards.ts`)

**No `expectedBeforeUpdatedAt` handling.** Guards cover:

- approval ID allowlist (G-6-e5 + G-6-f6 only today)
- target ID / beforeSnapshot id match
- payload allowlist / forbidden keys (`id`, `legacy_id`, `year`, `month`, images, `created_at`, etc.)
- G-6-f6 slice guard (`assertG6F6SafeFieldsPayloadOnly`)

Optimistic lock stays in adapter only — no guard duplication recommended.

### 1.4 PoC triggers

| Trigger | Passes `expectedBeforeUpdatedAt`? | `updated_at` handling |
| --- | --- | --- |
| G-6-e5 `schedule-non-dry-run-poc-trigger.ts` | **No** | Warns if `updated_at` ≠ hard-coded `2026-06-05…`; proceeds without lock |
| G-6-f6 `schedule-safe-fields-non-dry-run-poc-trigger.ts` | **No** | No `updated_at` check |

Both call `updateScheduleWrite` without the optional field. **Do not change** in enablement — PoCs are frozen historical artifacts.

### 1.5 Dry-run stack

| Module | Optimistic lock |
| --- | --- |
| `schedule-dry-run-adapter.ts` | None — pure preview, no Supabase |
| `schedule-safe-fields-dry-run.ts` | None — `beforeSnapshot` has safe fields only, no `updated_at` |
| `schedule-description-dry-run.ts` | None |

`loadSchedulesForDryRunUi` **does** SELECT `updated_at` — data is available for future stale preview.

### 1.6 UI / error mapping

| UI module | Conflict handling |
| --- | --- |
| G-6-f6 `staging-schedule-safe-fields-non-dry-run-poc-ui.ts` | Shows `errorCode` / `errorMessage` from adapter; `mapSafeFieldsAdapterErrorCode` passes through `optimistic_lock_*` unchanged |
| G-6-e5 `staging-schedule-non-dry-run-poc-ui.ts` | Same pattern via `mapAdapterErrorCode` |
| Safe-fields dry-run / description dry-run | No conflict UX |
| `AdminStagingScheduleSafeFieldsNonDryRunPocSection.astro` | Static `<dd>optimistic lock</dd><dd>false</dd>` |

No dedicated conflict message, reload action, or `updated_at` display in edit forms yet.

---

## 2. Current optimistic lock status (summary)

```txt
Adapter logic:     IMPLEMENTED (G-6-e4)
Types:             IMPLEMENTED
Guards:            N/A (by design)
PoC wiring:        NOT USED (intentional)
General UI wiring: NOT BUILT
Dry-run stale sim: NOT BUILT
UI conflict UX:    NOT BUILT
Timestamp normalize: PARTIAL (G-6-e5 normalizeUpdatedAt in PoC trigger only; adapter uses strict ===)
```

**Gate:**

```txt
readyForOptimisticLockEnablement: true   (trigger active — G-6-f8)
optimisticLockWiredInProductPath: false  (no caller passes expectedBeforeUpdatedAt)
```

---

## 3. Recommended enablement architecture

### 3.1 Version token

```txt
Token: beforeSnapshot.updated_at (timestamptz as string from Supabase SELECT)
Storage: client-side per open edit session (form state / row context)
Not editable: never expose updated_at in form fields or payload
Not in payload: trigger sets after UPDATE; adapter must not send updated_at on normal saves
```

### 3.2 New shared write trigger helper (implementation phase — not G-6-f9)

Introduce a **general** browser trigger (separate from G-6-e5/G-6-f6 PoCs), e.g. `executeScheduleGeneralUpdateWrite`:

```txt
1. Auth + staging gates (reuse PoC auth patterns)
2. SELECT beforeSnapshot (full row incl. updated_at) — or accept preloaded snapshot
3. Validate payload + approval ID (new G-6-g IDs in guards)
4. updateScheduleWrite({
     …,
     expectedBeforeUpdatedAt: beforeSnapshot.updated_at ?? null,
   })
5. Return result to general result panel
```

**Mandatory for general UI and all new non-dry-run field slices.**  
**Optional env gate for rollout:** `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true` (default `true` when general Save ships).

### 3.3 Timestamp comparison hardening

G-6-e5 has `normalizeUpdatedAt()` for display warnings; adapter uses strict `===`.

| Approach | Recommendation |
| --- | --- |
| Strict string match | Keep as default — Supabase JS returns consistent ISO strings per session |
| Shared `normalizeScheduleUpdatedAt()` | Extract to `schedule-write-utils.ts`; use in adapter compare **and** UI stale checks |
| Millisecond truncation | Normalize both sides (G-6-e5 pattern) if staging proves format drift |

**Implementation phase:** add unit-level compare helper; use in adapter before widening to general UI.

### 3.4 Stale UI overwrite prevention

```txt
Layer 1 (required): expectedBeforeUpdatedAt pre-UPDATE SELECT in adapter
Layer 2 (recommended): store rowUpdatedAt when user opens edit; refresh only via explicit reload or successful save
Layer 3 (optional): on visibilitychange / focus, soft-check updated_at vs live SELECT; banner if stale (no auto-write)
Layer 4 (PoC-style): field-equality beforeSnapshot checks per slice — keep for high-risk fields, not replacement for lock
```

**Never:** silent overwrite on conflict; auto-retry write; include `updated_at` in user payload.

### 3.5 Conflict flow (non-dry-run)

```mermaid
sequenceDiagram
  participant UI as Edit UI
  participant Trigger as General write trigger
  participant Adapter as updateScheduleWrite
  participant DB as public.schedules

  UI->>UI: Load row; store updated_at
  UI->>UI: User edits fields
  UI->>Trigger: Save (approval ID + payload)
  Trigger->>DB: SELECT beforeSnapshot
  Trigger->>Adapter: expectedBeforeUpdatedAt = snapshot.updated_at
  Adapter->>DB: SELECT current updated_at
  alt mismatch
    Adapter-->>UI: optimistic_lock_failed
    UI-->>UI: Show conflict; offer Reload
  else match
    Adapter->>DB: UPDATE payload
    DB-->>Adapter: afterSnapshot (updated_at bumped)
    Adapter-->>UI: success + afterSnapshot
    UI->>UI: Refresh form baseline + updated_at
  end
```

---

## 4. Error codes, result panel, UI messages

### 4.1 Adapter error codes (existing)

| errorCode | actualWrite | Meaning |
| --- | --- | --- |
| `optimistic_lock_select_failed` | false | Pre-UPDATE SELECT failed (RLS, network, row deleted) |
| `optimistic_lock_failed` | false | `updated_at` mismatch — another writer or stale tab |
| `guard_failed` | false | Approval / payload / snapshot guard |
| `update_failed` | false | UPDATE rejected |
| `after_select_failed` | true | UPDATE may have succeeded; verify manually |

### 4.2 Recommended UI copy (Japanese — product path)

| Code | User message | Action |
| --- | --- | --- |
| `optimistic_lock_failed` | 別の端末または別のタブで更新されました。内容を再読み込みしてから、もう一度保存してください。 | **再読み込み** button → re-SELECT row, reset form |
| `optimistic_lock_select_failed` | 保存前の確認に失敗しました。接続とログイン状態を確認し、再読み込みしてください。 | Reload + retry Save |
| `update_failed` | 保存に失敗しました。しばらくしてから再度お試しください。 | Show `errorMessage` detail in dev panel |

Dev / staging result panel: keep `errorCode`, `errorMessage`, full JSON (PoC parity).

### 4.3 Result panel fields to add (general UI)

```txt
beforeUpdatedAt: from beforeSnapshot.updated_at
afterUpdatedAt: from afterSnapshot.updated_at (success only)
optimisticLockEnabled: true/false
conflictDetected: true when optimistic_lock_failed
rollbackHint: unchanged semantics (see §6)
```

Extend `mapGeneralScheduleAdapterErrorCode` (new) — do not retrofit G-6-f6 PoC mapper unless PoC is explicitly re-opened (not recommended).

---

## 5. Dry-run vs non-dry-run

| Mode | Optimistic lock behavior |
| --- | --- |
| **Non-dry-run (general / new slices)** | **Required:** pass `expectedBeforeUpdatedAt` via general write trigger |
| **Non-dry-run (G-6-e5 / G-6-f6 PoC)** | **Unchanged:** no lock; frozen; do not re-click |
| **Dry-run (preview)** | No DB write; lock N/A at adapter |
| **Dry-run (enhanced preview — optional G-6-f10+)** | Optional live SELECT: if `formBaselineUpdatedAt !== live.updated_at`, add validation warning: 「他の更新がある可能性があります（プレビューのみ）」 |
| **Dry-run default dev** | `PUBLIC_ADMIN_WRITE_DRY_RUN=true` — no change |

Dry-run **cannot** prove lock behavior without a live SELECT compare — document in slice preflights.

---

## 6. beforeSnapshot / afterSnapshot / rollbackHint

| Artifact | Role with optimistic lock |
| --- | --- |
| **beforeSnapshot** | Captured at edit open or pre-Save SELECT; `updated_at` is the lock token |
| **afterSnapshot** | Post-UPDATE `.select()`; `updated_at` must be **newer** than before when any column changed |
| **changedFields** | Computed from payload keys only (unchanged) |
| **rollbackHint (success)** | `Manual rollback required if needed…` — generate field-level SET from beforeSnapshot |
| **rollbackHint (lock failure)** | `No rollback required because actualWrite is false.` |
| **rollbackHint (verification required)** | Success hint — operator verifies row manually |

**Conflict:** no UPDATE → no rollback SQL needed → operator only reloads UI.

**Audit:** result panel JSON + execution-result.md remain the audit trail; optional `schedule_write_audit` table is a later phase (`G-6-h`).

---

## 7. Mobile / multi-device UX

```txt
- Single-column edit form (Profile PoC pattern)
- Show 最終更新: {localized updated_at} when row loaded (after G-6-f8 trigger)
- On optimistic_lock_failed: prominent banner + full-width「再読み込み」— no auto-retry
- Double-tap Save guard (existing PoC pattern)
- visibilitychange: optional soft stale banner — do not block typing
- Do not silent-merge concurrent edits
- sessionStorage result log: include beforeUpdatedAt / afterUpdatedAt for support
```

---

## 8. Prerequisites before next field slices

Before `title`, `open_time`, `start_time`, `price` non-dry-run slices:

| # | Prerequisite | Status |
| --- | --- | --- |
| 1 | G-6-f8 `updated_at` trigger on staging | **Done** |
| 2 | G-6-f9 optimistic lock planning | **This phase** |
| 3 | G-6-f10 lock **implementation** (shared trigger + compare util + conflict UI) | **Next code phase** |
| 4 | G-6-g general edit UI planning | Planned after f10 |
| 5 | Dry-run pass for target field(s) (G-6-f4 scaffold exists) | Done for safe-fields bundle |
| 6 | New approval IDs in `SCHEDULE_WRITE_APPROVAL_IDS` (e.g. `G-6-g-schedule-edit-title-non-dry-run`) | Not yet |
| 7 | Per-slice preflight + rollback SQL template | Per slice |
| 8 | `expectedBeforeUpdatedAt` wired in **new** slice trigger only | f10 |
| 9 | PoC sections remain disarmed; no G-6-e5/f6 re-click | Ongoing |

**Recommended first non-dry-run slice with lock:** `title` only on low-risk staging row (`aa440e29-…`, `show_on_home: false`).

**Field order (unchanged from G-6-f7):**

```txt
1. title
2. open_time + start_time (one slice)
3. price
4. published / show_on_home (later)
5. date (late — routing impact)
```

---

## 9. PoC vs general Schedule edit UI boundary

| Component | Optimistic lock | Action |
| --- | --- | --- |
| G-6-e5 hidden Danger Zone | false (frozen) | Keep code; disarmed; never re-arm without documented phase |
| G-6-f6 safe-fields PoC section | false (frozen) | Keep code; historical; `optimistic lock: false` in template |
| G-6-f3/f4 dry-run sections | N/A | Reuse as preview layer for general UI |
| G-6-f2 ScheduleAdminUi read | N/A | Extend with edit form + `updated_at` display |
| **Future general Schedule edit UI** | **true (required)** | New section; new approval IDs; staging shell only |
| `/admin` (Sariswing production) | — | **Do not modify** until explicit customer phase |

PoC triggers must **not** gain `expectedBeforeUpdatedAt` retroactively — would break historical replay docs and fixed beforeSnapshot expectations.

---

## 10. Audit log / rollback / recovery

| Concern | Policy |
| --- | --- |
| **Per-save audit** | Result panel JSON + phase `*-execution-result.md` |
| **Rollback SQL** | Field-level UPDATE from `beforeSnapshot`; independent of lock |
| **Lock failure recovery** | User reloads row — no DB rollback |
| **after_select_failed** | Manual SELECT verification; do not auto-retry write |
| **Future audit table** | Optional `G-6-h-schedule-write-audit-log-planning` — store before/after json, approval_id, user, ts |
| **schedule_months** | Never written; derivation unchanged on rollback of `schedules` |

---

## 11. Implementation checklist (G-6-f10 — recommended next code phase)

```txt
[ ] schedule-write-utils.ts — normalizeScheduleUpdatedAt + compare helper
[ ] Optional: use compare helper in schedule-write-adapter.ts
[ ] schedule-general-update-trigger.ts — auth, SELECT, lock-enabled updateScheduleWrite
[ ] Extend SCHEDULE_WRITE_APPROVAL_IDS for first G-6-g slice ID
[ ] staging-schedule-general-edit-ui.ts — conflict banner, reload handler, updated_at display
[ ] mapGeneralScheduleAdapterErrorCode — optimistic_lock_* user messages
[ ] Dry-run optional stale warning (live SELECT compare)
[ ] Unit / manual test plan on staging (no PoC button re-click)
[ ] Docs: schedule-optimistic-lock-enablement-implementation-result.md
```

**Env (proposal):**

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true                    # default dev
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true         # default on for general path
```

---

## 12. Risks / open questions

| Risk | Mitigation |
| --- | --- |
| Timestamp format mismatch | Shared normalize helper; log both sides on conflict |
| Same-value UPDATE bumps `updated_at` | Acceptable; lock still works — user must reload after no-op save elsewhere |
| PoC re-run with new `updated_at` | Do not re-click; update docs only |
| Strict lock blocks legitimate save after long idle | Reload UX; show last updated time |
| Multiple tabs same user | Lock treats as conflict — correct behavior |
| `updated_at` in payload abuse | Guards allow key but UI/adapter must strip; prefer forbid in general trigger |
| Sariswing production no trigger | Kit staging only until explicit production migration phase |

---

## 13. Recommended next phases

| Order | Phase | Scope |
| --- | --- | --- |
| **1** | `G-6-f9-schedule-optimistic-lock-enablement-planning` | **DONE** — this doc |
| **2** | `G-6-f10-schedule-optimistic-lock-enablement-implementation` | Shared trigger, compare util, conflict UI |
| **3** | `G-6-g-schedule-general-edit-ui-planning` | Visible list/edit; Profile-like Save |
| **4** | `G-6-g1-schedule-title-non-dry-run-slice` | First slice with lock + new approval ID |
| **5** | `G-6-g2-schedule-time-fields-non-dry-run-slice` | open_time + start_time |
| **6** | `G-6-g3-schedule-price-non-dry-run-slice` | price |

---

## 14. G-6-f9 safety statement

```txt
DB write: none
Supabase SQL executed: none
Migration applied: none
Run button click: none
G-6-e5 / G-6-f6 PoC re-click: none
rollback SQL executed: none
service_role: not used
/admin: not modified
schedule_months: read-only / derived (not touched)
PUBLIC_ADMIN_WRITE_DRY_RUN: unchanged (default true for routine dev)
```

## Related docs

- [schedule-updated-at-staging-migration-execution-result.md](./schedule-updated-at-staging-migration-execution-result.md)
- [schedule-write-hardening-and-updated-at-planning.md](./schedule-write-hardening-and-updated-at-planning.md)
- [schedule-updated-at-staging-migration-preflight.md](./schedule-updated-at-staging-migration-preflight.md)
- [schedule-safe-fields-non-dry-run-execution-result.md](./schedule-safe-fields-non-dry-run-execution-result.md)
- [schedule-write-adapter-implementation.md](./schedule-write-adapter-implementation.md)
