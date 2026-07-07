# G-22h4 — Gosaki Schedule republish dry-run read-only QA

**Phase:** `G-22h4-gosaki-schedule-republish-dry-run-readonly-qa`  
**Status:** **complete** — operator manual login read-only QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-07  
**Base commit:** `646f680`  
**Prior:** [gosaki-schedule-republish-dry-run-implementation.md](./gosaki-schedule-republish-dry-run-implementation.md) (G-22h3)

| Check | Status |
| --- | --- |
| Read-only / dry-run QA executed | **yes** |
| Operator manual login | **yes** |
| Republish dry-run preview verified | **yes** |
| `schedule-2026-07-008` target | **yes** |
| Save / 再公開保存 clicked | **no** |
| DB write | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleRepublishDryRunReadonlyQaComplete: true
phase: G-22h4-gosaki-schedule-republish-dry-run-readonly-qa
qaBlockingIssuesFound: false
operatorManualLoginQaPass: true
republishDryRunPreviewPass: true
schedule202607008TargetPass: true
publishedFalseToTruePreviewPass: true
actualWriteFalseDisplayed: true
publicReflectionPendingTrueDisplayed: true
expectedBeforeUpdatedAtDisplayed: true
republishSaveDisabledPass: true
saveExecuted: false
updateButtonClicked: false
republishSaveClicked: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
credentialsRecorded: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
writeArmedDevServerUsed: false
writeArmedDevServerStopped: true
port4321ListenAfterQa: false
residualEnglishWordingNoted: true
residualEnglishWordingBlocking: false
readyForG22h4bUiWordingCleanup: true
readyForG22h5RepublishTargetPreflight: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.  
**Credentials:** operator manual login — **not recorded** in this doc.

---

## 1. Purpose

Verify on a live read-only dev page that G-22h3 **republish dry-run UI** shows a correct `published=false → published=true` preview for an unpublished row, with `actualWrite=false`, `publicReflectionPending=true`, and Save **disabled**. Operator performs manual staging admin login; Cursor does **not** login, Save, or write to DB.

---

## 2. Read-only / dry-run QA scope

| In scope | Out of scope |
| --- | --- |
| Republish draft UI (`再公開案を作成`) | Save / UPDATE execution |
| Dry-run preview (`変更を確認`) | SQL INSERT / UPDATE / DELETE |
| Save target panel fields | package regen / FTP / public reflection |
| Save disabled / alert-only stub | write-armed dev server |
| Operator manual login observation | credentials recording |

---

## 3. Dry-run / read-only dev environment

### Dev command (started for QA prep, stopped after operator QA)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status (Cursor prep) | **200** |
| Transform error (Cursor prep) | **none** |
| `ENABLE_ADMIN_STAGING_WRITE` | **false** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | **true** |
| G-22d/e/f/h non-dry-run arms | **all false** |
| QA method | Cursor SSR marker prep + **operator manual login** browser QA |
| Save / 保存 | **not clicked** |
| Dev server after QA | **stopped** — port **4321 LISTEN none** |

---

## 4. Operator manual login QA — **PASS**

| Item | Value |
| --- | --- |
| URL | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| Login | **operator manual** — staging admin (credentials **not recorded**) |
| Read source banner | **Supabase admin read（authenticated）** |
| Save / 更新 / 複製保存 / 非公開化保存 / 再公開保存 / 削除 | **not executed** |
| DB write | **no** |

---

## 5. Target row — `schedule-2026-07-008`

### Filter / selection

| Step | Result |
| --- | --- |
| Published filter | **非公開のみ** |
| keyword search | `schedule-2026-07-008` |
| Row selected | **yes** — 1件 |

### Target row (operator confirmed)

| Field | Value | Match |
| --- | --- | --- |
| `legacy_id` | `schedule-2026-07-008` | **PASS** |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | **PASS** |
| `date` | `2026-07-17` | **PASS** |
| `title` | `<>` | **PASS** |
| `published` (before) | `false` | **PASS** |
| `expectedBeforeUpdatedAt` | `2026-07-06T13:58:41.425402+00:00` | **PASS** |

---

## 6. Republish draft flow — **PASS**

| Step | Result |
| --- | --- |
| Click **再公開案を作成** | **PASS** — republish draft mode entered |
| Republish draft banner | **PASS** — active in republish mode |
| Procedure hint | **PASS** — `data-gosaki-procedure-hint="republish"` |
| Form fields | read-only (republish mode) |
| Click **変更を確認** | **PASS** — dry-run preview succeeded |

---

## 7. Dry-run preview / save target panel — **PASS**

| Field | Operator observation | Match |
| --- | --- | --- |
| `operation` | `republish` / `republish-update` | **PASS** |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` | **PASS** |
| `legacy_id` | `schedule-2026-07-008` | **PASS** |
| `date` | `2026-07-17` | **PASS** |
| `title` | `<>` | **PASS** |
| `published` | `false → true` | **PASS** |
| `expectedBeforeUpdatedAt` | `2026-07-06T13:58:41.425402+00:00` displayed | **PASS** |
| `actualWrite` | **false** | **PASS** |
| `physicalDelete` | **false** (not physical delete) | **PASS** |
| `publicReflectionPending` | **true** | **PASS** |
| Public reflection note | **公開サイトへの反映は別フェーズ** displayed | **PASS** |
| Physical delete note | not physical delete explanation displayed | **PASS** |

---

## 8. Save disabled — **PASS**

| Check | Result |
| --- | --- |
| Save button label | **再公開を保存（準備中）** |
| Save button state | **disabled** / 保存不可 |
| Save / 更新 / 複製保存 / 非公開化保存 / 再公開保存 / 削除 | **not clicked** |
| `runEditSave()` republish branch | alert-only stub (G-22h6 deferred) |

---

## 9. Save / DB write / SQL — not executed

| Operation | Executed |
| --- | --- |
| 保存 / Save click | **no** |
| 再公開を保存（準備中）click | **no** |
| `.update({ published: true })` | **no** |
| `actualWrite: true` | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| rollback SQL | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| `service_role` | **not used** |
| package regen | **no** |
| FTP / upload / deploy / workflow_dispatch | **no** |
| public reflection | **no** |

---

## 10. Dev server stop confirmation

| Check | Result |
| --- | --- |
| Dev server stopped after QA | **yes** |
| port 4321 LISTEN | **none** (confirmed at result record time) |
| write-armed dev server | **not used** |

---

## 11. Residual issue (non-blocking)

| Issue | Severity | Notes |
| --- | --- | --- |
| English wording remains in UI | **non-blocking** | `"Republish dry-run preview must succeed before Save (G-22h6)."` (source: `gosaki-schedule-republish-update-config.ts`) |
| Recommended cleanup (G-22h4b candidate) | — | e.g. **再公開の保存はG-22h6以降で有効化します。現在は保存できません。** |

Does **not** block G-22h5 preflight or G-22h6 Save slice planning.

---

## 12. Cursor prep — SSR marker checks (pre-login)

Executed before operator manual QA (no login, no Save):

| Marker | Result |
| --- | --- |
| HTTP 200 | **PASS** |
| Transform error | **none** |
| `#gosaki-schedule-republish-btn` | **PASS** |
| `data-gosaki-procedure-hint="republish"` | **PASS** |
| 再公開案を作成 | **PASS** |
| 再公開を保存（準備中） | **PASS** |
| 公開サイトへの反映は別フェーズ | **PASS** |
| `data-g9k-staging-write-enabled="false"` | **PASS** |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h4-gosaki-schedule-republish-dry-run-readonly-qa.mjs
```

---

## 14. Next phases

| Phase | Scope |
| --- | --- |
| **G-22h4b** | UI wording cleanup (English → Japanese) |
| **G-22h5** | Republish target selection / preflight |
| **G-22h6** | Actual republish UPDATE (`published: true`) — single Save slice |
| **Separate gate** | Public reflection / package regen / FTP |

**Do not re-Save:** `schedule-2026-07-008` until G-22h6 with new approval ID.  
**Do not re-Save:** `schedule-2026-03-014` (G-22d3d), `schedule-2026-09-001` (G-22e7).

---

## 15. Fix required?

**No.** G-22h3 republish dry-run UI behaves as specified on live read-only dev with operator login. `published=false → true` preview, `actualWrite=false`, `publicReflectionPending=true`, Save disabled. Residual English wording is cosmetic only.
