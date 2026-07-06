# G-22f1 — Gosaki Schedule unpublish dry-run local QA

**Phase:** `G-22f1-gosaki-schedule-unpublish-dry-run-local-qa`  
**Status:** **complete** — local dev QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-06  
**Base commit:** `9f495b4`  
**Prior:** [gosaki-schedule-unpublish-dry-run-ui-implementation.md](./gosaki-schedule-unpublish-dry-run-ui-implementation.md) (G-22f)

| Check | Status |
| --- | --- |
| Local dev QA executed | **yes** (HTTP 200 + markup + module smoke) |
| Unpublish draft UI verified | **yes** (static HTML + code-path) |
| Unpublish dry-run preview verified | **yes** (module mirror of UI path) |
| published=false exclusion verified | **yes** (module validation; test rows not in selectableRows) |
| Save / 保存ボタン clicked | **no** |
| DB write | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleUnpublishDryRunLocalQaComplete: true
phase: G-22f1-gosaki-schedule-unpublish-dry-run-local-qa
qaBlockingIssuesFound: false
saveExecuted: false
updateButtonClicked: false
dbWriteExecuted: false
dryRunPreviewModuleVerified: true
cursorDbWriteExecuted: false
physicalDeleteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
readyForG22f2ScheduleUnpublishUpdatePlanning: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean at QA start) |
| `HEAD` | `9f495b4` |
| `origin/main` | `9f495b4` |

QA phase makes no source changes — only doc / verifier / AI context added.

---

## 2. Local dev / QA execution

### Dev command

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status | **200** |
| `data-read-source` | **supabase** (live staging read) |
| Selectable rows (`data-selectable-rows`) | **59** events (all `published=true`) |
| QA method | HTTP fetch + HTML marker analysis + G-22f module dry-run mirror |
| Save / 保存 | **not clicked** |
| ENABLE_ADMIN_STAGING_WRITE | **false** |
| G-22e new event insert arm | **false** |
| G-22d duplicate insert arm | **false** |

---

## 3. Schedule operator page — static HTML QA

### Unpublish controls — **PASS**

| Check | Result |
| --- | --- |
| `#gosaki-schedule-unpublish-btn` | present; SSR **disabled** until row selected (expected) |
| Unpublish button label | **非公開化案を作成** |
| `#gosaki-schedule-unpublish-draft-banner` | present (initially `hidden`) |
| Banner title (source) | **非公開化案** |
| Banner body (source) | **まだ保存されていません。保存は戸山が確認して反映します。** |
| Banner hint (source) | **公開サイトから外す予定です。データベースからは削除しません。保存は現在無効です。** |
| Save note | **非公開化案の作成と「変更を確認」ができます** |

### Safety / disabled actions — **PASS**

| Check | Result |
| --- | --- |
| `#gosaki-schedule-delete-btn` | **disabled** (`data-gosaki-schedule-action-disabled disabled`) |
| Delete button label | **削除（準備中）** |
| `#gosaki-schedule-update-btn` | default SSR **disabled** (`data-gosaki-save-allowed="false"`) |
| Sariswing prod ref `vsbvndwuajjhnzpohghh` | **absent** (0 occurrences) |

### Regression markup — existing / duplicate / new modes intact — **PASS**

| Element | Result |
| --- | --- |
| `#gosaki-schedule-add-btn` | present — **新規追加案を作成** |
| `#gosaki-schedule-duplicate-btn` | present — **複製案を作成** |
| `#gosaki-schedule-new-event-draft-banner` | present |
| `#gosaki-schedule-duplicate-draft-banner` | present |

---

## 4. Unpublish draft creation — code-path QA

Verified against `gosaki-staging-schedule-operator-ui.ts` + G-22f module.

| Check | Result |
| --- | --- |
| Select `published=true` row | `updateUnpublishButtonState()` enables `#gosaki-schedule-unpublish-btn` |
| Click **非公開化案を作成** | `enterUnpublishDraftFromSelectedRow()` sets `editDraftMode = "unpublish"` |
| Edit panel title | **非公開化案を確認** |
| Banner visible | `updateUnpublishDraftBanner()` sets `data-draft-mode="unpublish"` |
| Form fields | **read-only** (`setEditFormFieldsReadOnly(true)`) |
| Save button in unpublish mode | label → **非公開化を保存（現在は無効）**; **always disabled** |
| `runEditSave()` in unpublish mode | **blocked** with alert「非公開化の保存はまだ無効です」 (no adapter/update call) |

**Note:** Browser click of row / unpublish / preview buttons was **not** performed (G-22c / G-22e1 precedent: HTTP + code-path + module mirror). Module path is identical to the UI handler (`executeG22fScheduleUnpublishDryRun`).

---

## 5. Unpublish dry-run preview — module mirror QA

`executeG22fScheduleUnpublishDryRun()` is the same function invoked by `runEditDryRunPreview()` in unpublish mode.

### Case A — `published=true` target (sample: `schedule-2026-07-001` pattern)

| Field | Value |
| --- | --- |
| `ok` | `true` |
| `operation` | `unpublish` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `saveAllowed` | `false` |
| `wouldUpdate` | **`true`** |
| `wouldDelete` | **`false`** |
| `physicalDelete` | **`false`** |
| `before.published` | **`true`** |
| `after.published` | **`false`** |
| `payload.published` | `false` |
| `approvalId` | `G-22f-gosaki-schedule-unpublish-dry-run` |
| `safety.supabaseWriteCalled` | `false` |
| `message` | 非公開予定 / DB unchanged / 行は削除しません |

### Case B — `published=false` targets (closed test rows)

Module validation with canonical row IDs (not in `selectableRows` — see §6):

| Row | `validateG22fUnpublishDryRunTarget` | `wouldUpdate` |
| --- | --- | --- |
| `schedule-2026-03-014` (`434e4051-…`) | **blocked** —「このイベントはすでに非公開です。」 | `false` |
| `schedule-2026-09-001` (`18b48259-…`) | **blocked** —「このイベントはすでに非公開です。」 | `false` |

UI code path (`updateUnpublishButtonState` / `enterUnpublishDraftFromSelectedRow`): `published !== true` → button disabled + alert「このイベントはすでに非公開です。非公開化の対象にできません。」

---

## 6. published=false rows — live dataset note

| Observation | Detail |
| --- | --- |
| `schedule-2026-03-014` in `data-selectable-rows` | **no** |
| `schedule-2026-09-001` in `data-selectable-rows` | **no** |
| All 59 selectable rows | `published=true` |

**Why test rows are absent from operator picker:**

- G-22d / G-22e test rows contain `[CMS Kit staging]` POC audit marker → routed to **`auditRows`** by `splitSelectableAndAuditRows()`, not embedded in operator `data-selectable-rows`.
- Default client filter is **公開のみ** — would further hide `published=false` rows if they were selectable.

**QA conclusion:** `published=false` exclusion is verified via **module validation + UI code-path** (G-22e1 / G-22c precedent). Closed test rows remain **non-target** for unpublish; no re-Save attempted.

---

## 7. Save / DB write — not executed

| Operation | Executed |
| --- | --- |
| 保存 / Save click | **no** |
| `executeG22fScheduleUnpublishDryRun` `.update()` / `.delete()` | **no** (module has no write calls) |
| unpublish UPDATE save module | **does not exist** |
| SQL INSERT / UPDATE / DELETE | **no** |
| package regen / FTP | **no** |

---

## 8. Physical DELETE — disabled maintained

`#gosaki-schedule-delete-btn` retains `data-gosaki-schedule-action-disabled disabled` with label **削除（準備中）** in served HTML. Dry-run `physicalDelete: false`. **PASS.**

---

## 9. Existing / duplicate / new mode — regression check

| Check | Result |
| --- | --- |
| G-9k existing UPDATE dry-run path | **unchanged** (`runEditDryRunPreview` branches: unpublish → new → duplicate → existing) |
| G-22d duplicate dry-run | **intact** (`executeG22bScheduleDuplicateDryRun`; duplicate banner served) |
| G-22e new event dry-run | **intact** (`executeG22eScheduleNewEventDryRun`; new-event banner served) |
| G-22d duplicate INSERT save module | **untouched** (no diff at QA base) |
| G-22e new event INSERT save module | **untouched** (no diff at QA base) |
| `schedule-2026-03-014` re-Save | **not attempted** (G-22d3d closure) |
| `schedule-2026-09-001` re-Save | **not attempted** (G-22e7 closure) |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22f1-gosaki-schedule-unpublish-dry-run-local-qa.mjs
```

---

## 11. Next phase

**G-22f2** — unpublish UPDATE planning (approval ID / env arm / `published=false` single-field slice; separate from physical DELETE).

---

## 12. Fix required?

**No.** G-22f unpublish dry-run UI behaves as specified on local dev. `published=true` preview yields `operation=unpublish`, `wouldUpdate=true`, `wouldDelete=false`, `saveAllowed=false`, `physicalDelete=false`. Save disabled; physical delete disabled; existing / duplicate / new modes intact. No code changes required from G-22f1 QA.
