# G-22e3 — Gosaki Schedule new event INSERT implementation

**Phase:** `G-22e3-gosaki-schedule-new-event-insert-implementation`  
**Status:** **complete** — adapter / guards / UI gate only; **no Save / DB write**  
**Date:** 2026-07-02  
**Base commit:** `c6e48e5`  
**Prior:** [gosaki-schedule-new-event-insert-planning.md](./gosaki-schedule-new-event-insert-planning.md) (G-22e2)

| Check | Status |
| --- | --- |
| New event INSERT adapter implemented | **yes** |
| Guards / config implemented | **yes** |
| UI Save gate wired | **yes** |
| Default Save disabled | **yes** |
| Save / INSERT executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleNewEventInsertImplementationComplete: true
phase: G-22e3-gosaki-schedule-new-event-insert-implementation
approvalId: G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
readyForG22e4ScheduleNewEventInsertFinalPreflight: true
readyForG22e5ScheduleNewEventInsertOperatorExecution: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
grantRevokeExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** Sariswing production.

**approvalId:** `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`  
**env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED` (default **false**)

---

## 1. Implementation summary

G-22e new event dry-run UI に、G-22e2 planning で設計した **non-dry-run INSERT** 経路を追加。G-22d duplicate INSERT / G-9k UPDATE とは分離。

| Layer | Module |
| --- | --- |
| Config / env arm | `gosaki-schedule-new-event-insert-config.ts` |
| Guards / payload / allocation | `gosaki-schedule-new-event-insert-guards.ts` |
| INSERT adapter | `schedule-insert-write-adapter.ts` (`insertNewEventScheduleWrite`, `operation=new-event-insert`) |
| Save orchestration | `gosaki-schedule-new-event-insert-save.ts` (`executeG22eScheduleNewEventInsertSave`) |
| UI gate | `gosaki-staging-schedule-operator-ui.ts` |

G-22e dry-run (`executeG22eScheduleNewEventDryRun`) は **変更なし**（`actualWrite=false`, dry-run `saveAllowed=false`）。

---

## 2. approvalId

```txt
G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
```

Registered in:

- `G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID`
- `ScheduleG22eNewEventInsertNonDryRunSliceApprovalId`
- `SCHEDULE_WRITE_APPROVAL_IDS`

Dry-run approval (`G-22e-gosaki-schedule-new-event-dry-run`) remains separate.

---

## 3. Env gate (G-22e5 execution only)

All required:

```txt
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=true
```

Must be off:

```txt
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false
# plus other Schedule / Discography non-dry-run arms
```

Default routine dev:

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false
```

---

## 4. UI gate

Save enabled only when **all** true:

| Gate | Required |
| --- | --- |
| Draft mode | `editDraftMode === "new"` |
| Dry-run | latest `operation === "new"`, no blocking validation errors |
| Date / title | valid date, non-empty title |
| Site | `site_slug === "gosaki-piano"` |
| Published flags | `published=false`, `show_on_home=false`, `home_order=null` |
| Existing id | absent |
| Duplicate sourceId | absent |
| Env | §3 fully armed |
| Auth | staging admin signed in |

Default: Save **disabled**, label `保存（現在は無効）`, `data-gosaki-save-allowed=false`.  
When armed + dry-run ok: label `新規追加を保存`, `data-gosaki-save-allowed=true`.

---

## 5. Payload builder / assertion

- `buildG22eNewEventInsertPayload` — computes `legacy_id`, `sort_order`, `source_route`, `source_file` at save time from live month rows
- `assertG22eNewEventInsertPayloadOnly` — keys, site_slug, date/year/month, legacy_id format, fixed flags, no `id`
- `collectG22eNewEventInsertGuardFailures` — mode / env / dry-run / approvalId
- `evaluateG22eNewEventInsertUiGate` — UI Save enablement

Fixed INSERT values:

| Field | Value |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| `published` | `false` |
| `show_on_home` | `false` |
| `home_order` | `null` |
| `image_url` | `null` |
| `id` | DB default (not in payload) |

---

## 6. legacy_id allocation

Format: `schedule-YYYY-MM-NNN`

Algorithm (`computeNextLegacyIdFromRows`):

1. Filter rows for target month
2. Parse max 3-digit suffix from `legacy_id LIKE schedule-{month}-%`
3. Candidate = max + 1, zero-padded to 3 digits

G-22e3 does **not** execute INSERT. G-22e4 final preflight fixes target `legacy_id`.

Protected row (non-touch): `schedule-2026-03-014` (G-22d duplicate INSERT).

---

## 7. sort_order allocation

Algorithm (`computeSortOrderFromRows`):

- Target month `max(sort_order) + 10`
- Empty month → `10`

G-22e4 final preflight verifies live max before execution.

---

## 8. source_route / source_file

Derived from event date month:

```txt
source_route = /schedule/YYYY-MM/
source_file = schedule-YYYY-MM.html
```

Functions: `deriveG22eSourceRoute`, `deriveG22eSourceFile`.

---

## 9. Save default disabled

- `getG22eNewEventInsertConfig()` → `saveEnabled=false`, `saveAllowed=false` under routine dev env
- UI `updateSaveButtonState` uses `evaluateG22eNewEventInsertUiGate` — disabled unless fully armed
- G-22e3 phase: **Cursor did not click Save**; **no Supabase mutation**

---

## 10. Non-destructive verification

| Path | Status |
| --- | --- |
| G-9k existing UPDATE | **unchanged** — existing / duplicate / new branches are separate in `updateSaveButtonState` / `runEditSave` |
| G-22d duplicate INSERT | **unchanged** — mutual exclusion env checks added both directions |
| G-22e new event dry-run | **unchanged** |
| Delete button | **disabled** — no delete path added |

---

## 11. Handoff

| Phase | Action |
| --- | --- |
| **G-22e4** | Final preflight — fix operator-selected payload, `legacy_id`, `sort_order`, SQL templates |
| **G-22e5** | Operator manual Save once with G-22e env stack |
| **G-22e6** | Execution result record |
| **G-22e7** | Chain closure |

---

## 12. Not done in G-22e3

- Save execution
- Supabase mutation / SQL INSERT / UPDATE / DELETE / UPSERT
- GRANT / REVOKE
- rollback SQL execution
- package regen / production build
- FTP / upload / deploy / workflow_dispatch
- secrets / env file changes
- commit / push
- Target event concrete values fixed (deferred to G-22e4)
