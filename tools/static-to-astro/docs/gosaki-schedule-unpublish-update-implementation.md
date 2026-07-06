# G-22f3 — Gosaki Schedule unpublish UPDATE implementation

**Phase:** `G-22f3-gosaki-schedule-unpublish-update-implementation`  
**Status:** **complete** — config / guards / save / UI gate only; **no Save / DB write**  
**Date:** 2026-07-06  
**Base commit:** `56316a6`  
**Prior:** [gosaki-schedule-unpublish-update-planning.md](./gosaki-schedule-unpublish-update-planning.md) (G-22f2)

| Check | Status |
| --- | --- |
| Unpublish UPDATE config implemented | **yes** |
| Guards / payload assertion implemented | **yes** |
| Save orchestration implemented | **yes** |
| UI Save gate wired | **yes** |
| Default Save disabled | **yes** |
| Save / UPDATE executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleUnpublishUpdateImplementationComplete: true
phase: G-22f3-gosaki-schedule-unpublish-update-implementation
approvalId: G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
readyForG22f4ScheduleUnpublishUpdateFinalPreflight: true
readyForG22f5ScheduleUnpublishUpdateOperatorExecution: false
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
grantRevokeExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
physicalDeleteImplemented: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**approvalId:** `G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice`  
**env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED` (default **false**)

---

## 1. Implementation summary

G-22f unpublish dry-run UI に、G-22f2 planning で設計した **non-dry-run UPDATE** 経路を追加。G-9k existing UPDATE / G-22d INSERT / G-22e INSERT とは分離。

| Layer | Module |
| --- | --- |
| Write types | `schedule-write-types.ts` — `G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID` |
| Config / env arm | `gosaki-schedule-unpublish-update-config.ts` |
| Guards / payload | `gosaki-schedule-unpublish-update-guards.ts` |
| Save orchestration | `gosaki-schedule-unpublish-update-save.ts` (`executeG22fScheduleUnpublishUpdateSave`) |
| UPDATE adapter (reuse) | `schedule-write-adapter.ts` — `updateScheduleWrite` via `buildScheduleLockedWriteRequest` |
| UI gate | `gosaki-staging-schedule-operator-ui.ts` |

G-22f dry-run (`executeG22fScheduleUnpublishDryRun`) は **変更なし**（`actualWrite=false`, dry-run `saveAllowed=false`）。

---

## 2. approvalId

```txt
G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
```

Registered in:

- `G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID`
- `ScheduleG22fUnpublishUpdateNonDryRunSliceApprovalId`
- `SCHEDULE_WRITE_APPROVAL_IDS`

Dry-run approval (`G-22f-gosaki-schedule-unpublish-dry-run`) remains separate.

Save `operation`: **`unpublish-update`**

---

## 3. Env gate (G-22f5 execution only)

All required:

```txt
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true
```

Must be off:

```txt
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false
# plus other Schedule / Discography non-dry-run arms
```

Default routine dev:

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false
```

---

## 4. UI gate

Save enabled only when **all** true:

| Gate | Required |
| --- | --- |
| Draft mode | `editDraftMode === "unpublish"` |
| Dry-run | latest `operation === "unpublish"`, no blocking errors |
| Target | `id`, `legacy_id`, `site_slug === "gosaki-piano"`, `published === true` |
| Preview | `before.published === true`, `after.published === false` |
| Safety | `wouldUpdate === true`, `wouldDelete === false`, `physicalDelete === false` |
| Modes | not duplicate / new / existing update |
| Lock | `expectedBeforeUpdatedAt` from target `updated_at` |
| Env | §3 fully armed |
| Auth | staging admin signed in |

**Default labels:**

- disabled: **非公開化を保存（現在は無効）** — `data-gosaki-save-allowed="false"`
- armed: **非公開化を保存** — `data-gosaki-save-allowed="true"`

---

## 5. Payload builder / assertion

```txt
operation: unpublish-update
patch: { published: false }
changedFields: ["published"]
payloadKeys: ["published"]
```

`assertG22fUnpublishUpdatePayloadOnly`:

- patch keys **`published` only**
- `published === false`
- **no** `updated_at` in patch
- **no** DELETE / INSERT

Protected rows (must not touch):

- `schedule-2026-03-014` (`434e4051-86c3-473e-9ad0-39d2e5042fb8`)
- `schedule-2026-09-001` (`18b48259-9a9a-4b00-b136-6c0c4ff3b2f3`)

---

## 6. Optimistic lock / updated_at

- Reuses G-9k path: `buildScheduleLockedWriteRequest()` + `updateScheduleWrite()`
- `expectedBeforeUpdatedAt` = dry-run target `updated_at`
- `updated_at` **not** in UPDATE patch — DB trigger updates on row change
- Stale baseline blocks Save (preflight + adapter)

---

## 7. Physical DELETE — not implemented

- `#gosaki-schedule-delete-btn` remains **disabled** —「削除（準備中）」
- `wouldDelete: false`, `physicalDelete: false` in guards / save outcome
- No DELETE grant work in G-22f3

---

## 8. Regression — existing modes preserved

| Mode | Status |
| --- | --- |
| G-9k existing UPDATE dry-run / Save gate | **unchanged** |
| G-22d duplicate dry-run / INSERT gate | **unchanged** (+ G-22f arm mutual exclusion) |
| G-22e new event dry-run / INSERT gate | **unchanged** (+ G-22f arm mutual exclusion) |
| G-22f unpublish dry-run | **unchanged** |
| Closed test rows | **not modified** (guard blocks + no write in G-22f3) |

---

## 9. Next phases

| Phase | Scope |
| --- | --- |
| **G-22f4** | Final preflight — operator selects target; lock id / legacy_id / updated_at |
| **G-22f5** | Operator single unpublish Save once (manual) |
| **G-22f6** | afterVerification + result record |
| **G-22f7** | Unpublish UPDATE chain closure |
| **Future** | Physical DELETE — separate phase |

G-22f3 does **not** fix target row — G-22f4 preflight locks one `published=true` row.

---

## 10. Not executed in G-22f3

| Item | Status |
| --- | --- |
| Save click | **no** |
| DB write / Supabase mutation | **no** |
| SQL INSERT / UPDATE / DELETE | **no** |
| GRANT / REVOKE | **no** |
| Rollback SQL execution | **no** |
| package regen / FTP / deploy | **no** |
| commit / push | **no** (per operator instruction) |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f3-gosaki-schedule-unpublish-update-implementation.mjs
```

---

## 12. Fix required?

**No.** Implementation matches G-22f2 planning. Default env keeps Save disabled. No DB write in G-22f3 phase.
