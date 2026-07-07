# G-22h4b — Gosaki Schedule republish UI wording cleanup

**Phase:** `G-22h4b-gosaki-schedule-republish-ui-wording-cleanup`  
**Status:** **complete** — operator-facing Japanese copy only; **no Save / DB / deploy**  
**Date:** 2026-07-07  
**Base commit:** `4e45f90`  
**Prior:** [gosaki-schedule-republish-dry-run-readonly-qa.md](./gosaki-schedule-republish-dry-run-readonly-qa.md) (G-22h4)

| Check | Status |
| --- | --- |
| English residual replaced | **yes** |
| Japanese operator copy | **yes** |
| Save disabled / alert-only stub | **unchanged** |
| Save / 保存 clicked | **no** |
| DB write | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleRepublishUiWordingCleanupComplete: true
phase: G-22h4b-gosaki-schedule-republish-ui-wording-cleanup
qaBlockingIssuesFound: false
englishResidualRemovedFromSource: true
japaneseSaveDisabledCopyPresent: true
saveDisabledBehaviorUnchanged: true
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
writeArmedDevServerUsed: false
port4321ListenAfterSmoke: false
readyForG22h5RepublishTargetPreflight: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

Replace G-22h4 residual English operator copy in republish Save gate with natural Japanese. **UI wording cleanup only** — Save remains disabled until G-22h6; no behavior change.

---

## 2. Wording changes

| Location | Before | After |
| --- | --- | --- |
| `evaluateG22hRepublishUpdateUiGate` (dry-run pending) | `Republish dry-run preview must succeed before Save (G-22h6).` | `再公開の保存はG-22h6以降で有効化します。現在は保存できません。` |
| `G22H_REPUBLISH_UPDATE_SAVE_DISABLED_G22H3_REASON` (default disabled) | `G-22h3 republish UPDATE Save disabled — …` | `再公開の保存は現在無効です。G-22h6以降で、戸山が確認してから有効化します。` |

**File:** `src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts`

---

## 3. Behavior unchanged

| Item | Status |
| --- | --- |
| `saveEnabled: false` | **unchanged** |
| `saveAllowed: false` | **unchanged** |
| `evaluateG22hRepublishUpdateUiGate` → `enabled: false` | **unchanged** |
| Save button label `再公開を保存（準備中）` | **unchanged** |
| `runEditSave()` republish branch alert-only | **unchanged** |
| `.update({ published: true })` | **not added** |
| `actualWrite: true` | **not added** |

---

## 4. Grep / residual check

| Pattern | Source code (`src/`) | Notes |
| --- | --- | --- |
| `Republish dry-run preview must succeed before Save (G-22h6).` | **absent** | removed |
| `再公開の保存はG-22h6以降` | **present** | gate reason |
| `現在は保存できません` | **present** | gate reason |
| G-22h4 QA doc historical mention | present in `gosaki-schedule-republish-dry-run-readonly-qa.md` only | QA record at time of G-22h4 |

Other republish gate reasons (`Republish draft mode required.` etc.) remain English — edge-case dev/gate paths; out of G-22h4b scope (same pattern as G-22f unpublish config).

---

## 5. Read-only HTTP smoke (optional)

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| `ENABLE_ADMIN_STAGING_WRITE` | **false** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | **true** |
| G-22d/e/f/h arms | **all false** |
| HTTP status | **200** |
| Transform error | **none** |
| `#gosaki-schedule-republish-btn` | **present** (SSR) |
| English residual in SSR HTML | **absent** |
| Save clicked | **no** |
| Dev server after smoke | **stopped** — port **4321 LISTEN none** |

---

## 6. Save / DB write — not executed

| Operation | Executed |
| --- | --- |
| Save / 再公開保存 click | **no** |
| SQL INSERT / UPDATE / DELETE | **no** |
| GRANT / REVOKE / RLS change | **no** |
| `service_role` | **not used** |
| package regen / FTP / public reflection | **no** |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h4b-gosaki-schedule-republish-ui-wording-cleanup.mjs
```

---

## 8. Next phase

**G-22h5** — republish target selection / preflight (before G-22h6 actual UPDATE).

---

## 9. Fix required?

**No.** Operator-facing republish Save disabled copy is now Japanese. Save disabled / alert-only behavior unchanged.
