# G-22h3 — Gosaki Schedule republish dry-run UI implementation

**Phase:** `G-22h3-gosaki-schedule-republish-dry-run-ui-implementation`  
**Status:** **complete** — republish draft mode + dry-run preview wired; **Save disabled / no DB write**  
**Date:** 2026-07-07  
**Base commit:** `541d0dd`  
**Prior:** [gosaki-schedule-republish-dry-run-ui-planning.md](./gosaki-schedule-republish-dry-run-ui-planning.md) (G-22h2)

| Check | Status |
| --- | --- |
| Republish dry-run module | **yes** |
| Republish draft UI wired | **yes** |
| Save / UPDATE enabled | **no** — alert-only stub |
| actualWrite in dry-run | **false** only |
| Physical DELETE | **not implemented** |
| DB write / SQL mutation | **no** |
| GRANT / REVOKE / RLS | **no** |
| package regen / FTP / public reflection | **no** |

---

## Gates

```txt
gosakiScheduleRepublishDryRunUiImplementationComplete: true
phase: G-22h3-gosaki-schedule-republish-dry-run-ui-implementation
dryRunApprovalId: G-22h-gosaki-schedule-republish-dry-run
nonDryRunApprovalId: G-22h-gosaki-schedule-republish-update-non-dry-run-slice
envArm: PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED
readyForG22h4RepublishDryRunReadOnlyQa: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
grantRevokeExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
physicalDeleteImplemented: false
```

**Supabase:** `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Implement Gosaki Schedule **republish** dry-run / preview UI: `published=false → published=true` preview without DB write. Save remains **disabled until G-22h6**.

---

## 2. Dry-run module

| Item | Location |
| --- | --- |
| Module | `src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts` |
| Executor | `executeG22hScheduleRepublishDryRun()` |
| Adapter | `buildScheduleRepublishDryRunResult()` in `schedule-dry-run-adapter.ts` |
| Config stub | `gosaki-schedule-republish-update-config.ts` — `saveEnabled: false` always |
| Guards | `gosaki-schedule-republish-update-guards.ts` |

**Dry-run output:**

```txt
operation: republish
saveOperation: republish-update
approvalId: G-22h-gosaki-schedule-republish-dry-run
before.published: false
after.published: true
payload: { published: true }
actualWrite: false
physicalDelete: false
contentFieldsChanged: false
publicReflectionPending: true
```

---

## 3. UI flow

| Step | Control | DB effect |
| --- | --- | --- |
| 1 | Select `published=false` row | none |
| 2 | **再公開案を作成** (`#gosaki-schedule-republish-btn`) | none — `editDraftMode=republish` |
| 3 | **変更を確認** | none — dry-run preview |
| 4 | **再公開を保存（準備中）** | **alert-only** — no DB write |

Procedure hint card: `data-gosaki-procedure-hint="republish"`

---

## 4. Save disabled / alert-only stub

- `runEditSave()` republish branch: **alert only** — no write adapter call
- `evaluateG22hRepublishUpdateUiGate()` always returns `enabled: false`
- `getG22hRepublishUpdateConfig().saveEnabled` is **`false`** even if env arm is true
- No `gosaki-schedule-republish-update-save.ts` (deferred to G-22h6)
- No Supabase `.update()` in G-22h3 code path

---

## 5. Target candidates (dry-run QA)

| legacy_id | Notes |
| --- | --- |
| `schedule-2026-07-008` | G-22f unpublish row — recommended first Save in G-22h6 |
| `schedule-2026-03-014` | duplicate test row |
| `schedule-2026-09-001` | new event test row |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h3-gosaki-schedule-republish-dry-run-implementation.mjs
```

---

## 7. Safety — this phase

| Item | Status |
| --- | --- |
| Save executed | **false** |
| DB write | **false** |
| SQL mutation | **false** |
| RLS / GRANT / service_role | **unchanged** |
| package / FTP / public reflection | **not executed** |

---

## 8. Next phases

1. **G-22h4** — read-only / dry-run QA
2. **G-22h5** — target selection / preflight
3. **G-22h6** — actual republish UPDATE (enable Save once)
