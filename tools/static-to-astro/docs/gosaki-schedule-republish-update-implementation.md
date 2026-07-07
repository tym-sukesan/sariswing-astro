# G-22h6a — Gosaki Schedule republish UPDATE implementation

**Phase:** `G-22h6a-gosaki-schedule-republish-update-implementation`  
**Status:** **complete** — config / guards / save / UI gate only; **no Save / DB write**  
**Date:** 2026-07-07  
**Base commit:** `fabfd2f`  
**Prior:** [gosaki-schedule-republish-target-preflight.md](./gosaki-schedule-republish-target-preflight.md) (G-22h5)

| Check | Status |
| --- | --- |
| Republish UPDATE config implemented | **yes** |
| Guards / payload assertion implemented | **yes** |
| Save orchestration implemented | **yes** |
| UI Save gate wired | **yes** |
| Default Save disabled (env arm off) | **yes** |
| Save / UPDATE executed | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleRepublishUpdateImplementationComplete: true
phase: G-22h6a-gosaki-schedule-republish-update-implementation
approvalId: G-22h-gosaki-schedule-republish-update-non-dry-run-slice
selectedTargetLegacyId: schedule-2026-07-008
selectedTargetId: 3e572f02-4f35-460e-80a1-3a7d15ca3fd9
expectedBeforeUpdatedAtG22h6: 2026-07-06T13:58:41.425402+00:00
readyForG22h6bRepublishUpdateOperatorSaveOnce: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
physicalDeleteImplemented: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

**approvalId:** `G-22h-gosaki-schedule-republish-update-non-dry-run-slice`  
**env arm:** `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED` (default **false**)

---

## 1. Purpose

G-22h3 republish dry-run UI に、G-22h5 preflight で固定した **non-dry-run UPDATE** 経路を追加。G-22f unpublish / G-22d INSERT / G-22e INSERT とは分離。

**G-22h6a = implementation only.** actual UPDATE は **G-22h6b** operator Save once のみ。

---

## 2. Selected target (G-22h5 preflight)

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-07-008` |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-07-17` |
| `title` | `<>` |
| `published` (before) | `false` |
| `expectedBeforeUpdatedAt` | `2026-07-06T13:58:41.425402+00:00` |

**Reference rows (non-target):** `schedule-2026-03-014` · `schedule-2026-09-001`

---

## 3. Implementation summary

| Layer | Module |
| --- | --- |
| Config | `gosaki-schedule-republish-update-config.ts` — `getG22hRepublishUpdateConfig`, `evaluateG22hRepublishUpdateUiGate` |
| Guards | `gosaki-schedule-republish-update-guards.ts` — fixed target 008 only; `{ published: true }` only |
| Save | `gosaki-schedule-republish-update-save.ts` — `executeG22hScheduleRepublishUpdateSave` |
| UI | `gosaki-staging-schedule-operator-ui.ts` — republish Save wired; default disabled |

---

## 4. Guard conditions

| Guard | Requirement |
| --- | --- |
| Target id | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` only |
| Target legacy_id | `schedule-2026-07-008` only |
| site_slug | `gosaki-piano` |
| before published | `false` |
| after published | `true` |
| Payload | `{ published: true }` only |
| Optimistic lock | `expectedBeforeUpdatedAt` must match row `updated_at` at Save |
| approvalId | `G-22h-gosaki-schedule-republish-update-non-dry-run-slice` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true` + full write stack |
| Mutual exclusion | G-22d/e/f arms off |
| physicalDelete | **false** |
| contentFieldsChanged | **false** |
| publicReflectionPending | **true** |
| Rollback | **document only** — no auto rollback |

---

## 5. Save behavior

| State | UI |
| --- | --- |
| env arm **false** (routine dev) | **再公開を保存（現在は無効）** — `saveEnabled=false` |
| env arm **true** + dry-run OK + target 008 | **再公開を保存** enabled (G-22h6b only) |
| actualWrite | **true** only on successful Save in G-22h6b |

**G-22h6a:** Save **not executed**. `executeG22hScheduleRepublishUpdateSave` exists but was **not invoked** with write-armed env.

---

## 6. Public reflection / FTP

| Gate | Status |
| --- | --- |
| Public reflection | **not executed** — separate phase after G-22h6b if approved |
| package regen | **not executed** |
| FTP / upload | **not executed** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h6a-gosaki-schedule-republish-update-implementation.mjs
```

---

## 8. Next phases

| Phase | Scope |
| --- | --- |
| **G-22h6b** | Operator Save once on `schedule-2026-07-008` |
| **G-22h7** | Result closure |
| **Separate gate** | Public reflection / package / FTP |

---

## 9. Fix required?

**No.** Republish UPDATE path implemented; default Save disabled until G-22h6b write-armed execution.
