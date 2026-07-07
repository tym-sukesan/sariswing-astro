# G-22h6b retry2 blocker — Gosaki Schedule republish Save still disabled

**Phase:** `G-22h6b-retry2-blocker-gosaki-schedule-republish-save-still-disabled`  
**Status:** **blocked** — G-22h6b operator Save once **not executed** (retry2)  
**Date:** 2026-07-07  
**Base commit:** `3d5f8b0`  
**Prior:** [gosaki-schedule-republish-save-disabled-blocker.md](./gosaki-schedule-republish-save-disabled-blocker.md) (G-22h6b blocker — session sync)

| Check | Status |
| --- | --- |
| G-22h6b retry2 actual UPDATE | **no** |
| Republish dry-run preview | **operator PASS** |
| env arm displayed | **true** |
| Save button enabled | **no** |
| Button label | `再公開を保存（現在は無効）` |
| Bottom note (misleading) | `再公開の保存はG-22h6以降で有効化します。現在は保存できません。` |
| actualWrite | **false** |
| DB write | **no** |
| write-armed dev server | **stopped** (Cursor) |
| port 4321 LISTEN | **none** |
| Fix applied (dry-run preservation) | **yes** (this phase — not re-tested with Save) |

---

## Gates

```txt
gosakiScheduleRepublishSaveStillDisabledBlockerDocumented: true
phase: G-22h6b-retry2-blocker-gosaki-schedule-republish-save-still-disabled
g22h6bRepublishUpdateOperatorSaveOnceExecuted: false
g22h6bRetry2Blocked: true
saveExecuted: false
actualWrite: false
dbWriteExecuted: false
envArmDisplayedTrueButSaveDisabled: true
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
readyForG22h6bRetry3AfterDryRunPreservationFix: true
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Operator report (retry2)

After G-22h6b blocker fix (session sync) + write-armed dev:

| Confirmed on screen | Value |
| --- | --- |
| legacy_id | `schedule-2026-07-008` |
| id | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| published | `false → true` |
| expectedBeforeUpdatedAt | `2026-07-06T13:58:41.425402+00:00` |
| preflight baseline | `2026-07-06T13:58:41.425402+00:00` |
| G-22h env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED=true` |
| actualWrite | `false` |
| publicReflectionPending | `true` |
| Save button | **disabled** |
| Button label | `再公開を保存（現在は無効）` |

Operator did **not** click Save. **No DB write.**

---

## 2. Root cause (code investigation)

### 2.1 Not session gate (retry2)

Bottom note was **not** `Staging admin session required.` — session sync fix from retry1 addressed that class of failure.

### 2.2 Not env arm / config.saveEnabled (retry2)

Save target panel showed `G-22h env arm=true` from `getG22hRepublishUpdateConfig().armed`.  
`config.saveEnabled` was **true** under write-armed env.

### 2.3 Actual failure: dry-run state cleared after preview (primary)

`evaluateG22hRepublishUpdateUiGate()` failed at:

```txt
if (!input.republishDryRunResult?.ok) → enabled=false
```

**Misleading reason (G-22h6a legacy copy):**  
`再公開の保存はG-22h6以降で有効化します。現在は保存できません。`

This string was shown when `lastRepublishDryRunResult` was **null** or **!ok**, even with env arm true.

**Why preview looked OK but Save gate saw no dry-run:**

| Step | What happened |
| --- | --- |
| 1 | Operator clicks「変更を確認」→ `lastRepublishDryRunResult = result (ok)` |
| 2 | Dry-run panel renders success |
| 3 | `runAuthenticatedAdminReadRefetch()` (auth/token refresh) calls `renderEditForm(selectedRowSnapshot)` **without** `clearDryRun: false` |
| 4 | `renderEditForm` default → `clearDryRunResult()` → **`lastRepublishDryRunResult = null`** |
| 5 | `updateSaveButtonState()` runs with null dry-run → Save **disabled** + misleading G-22h6 note |
| 6 | `updateSaveTargetPanel()` still shows env arm=true (independent of dry-run cache) |

**Gate chain at failure:**

| Gate | Result |
| --- | --- |
| `republishMode` | pass |
| `config.saveEnabled` | pass (env armed) |
| `signedIn` | pass (after retry1 fix) |
| target / expectedBeforeUpdatedAt | pass (operator confirmed) |
| **`republishDryRunResult?.ok`** | **fail** (cleared to null) |
| button.disabled | `true` (`!gate.enabled`) |

### 2.4 UI disconnect

- **Panel** showed `updateConfig.armed` only — not `dry-run ok` or Save gate reason.
- **Button** used full `evaluateG22hRepublishUpdateUiGate()` including dry-run cache.

---

## 3. Fix applied (this phase — no Save re-test)

| Fix | File |
| --- | --- |
| Preserve dry-run in draft modes on `renderEditForm` | `gosaki-staging-schedule-operator-ui.ts` |
| `shouldClearDryRunOnEditFormRender()` / `isDraftModePreservingDryRun()` | same |
| Auth refetch: `renderEditForm(..., { clearDryRun: false })` in draft modes | same |
| Recompute `updateSaveButtonState()` after draft `renderEditForm` | same |
| Save target panel: `saveEnabled`, `dry-run ok`, `Save gate` reason | same |
| Replace misleading G-22h6 dry-run-pending message | `gosaki-schedule-republish-update-config.ts` |

**Cursor did not re-run write-armed Save.**

---

## 4. Safety

| Item | Status |
| --- | --- |
| Save / DB write | **no** |
| SQL mutation / rollback / GRANT / RLS | **no** |
| package / FTP | **no** |
| dev server | **stopped** |
| commit / push | **no** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h6b-retry2-gosaki-schedule-republish-save-still-disabled-blocker.mjs
```

---

## 6. Next: G-22h6b retry3 operator procedure

1. Pull / use working tree with dry-run preservation fix.
2. write-armed dev start (same env as G-22h6b retry).
3. Hard refresh → login → republish draft →「変更を確認」.
4. Confirm save target panel: **`dry-run ok: true`** and **`Save gate: true`** (or enabled reason).
5. Confirm button **`再公開を保存`** (not「現在は無効」).
6. Save **once** → paste result → afterVerification SELECT only → G-22h7 closure.
