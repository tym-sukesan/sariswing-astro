# G-22c — Gosaki Schedule duplicate dry-run local QA

**Phase:** `G-22c-gosaki-schedule-duplicate-dry-run-local-qa`  
**Status:** **complete** — local dev QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-02  
**Base commit:** `266491e`  
**Prior:** [gosaki-schedule-duplicate-dry-run-ui-implementation.md](./gosaki-schedule-duplicate-dry-run-ui-implementation.md) (G-22b)

| Check | Status |
| --- | --- |
| Local QA executed | **yes** |
| G-22b duplicate draft UI verified | **yes** |
| Duplicate dry-run preview verified | **yes** (module mirror of UI path) |
| Save / 更新する clicked | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleDuplicateDryRunLocalQaComplete: true
phase: G-22c-gosaki-schedule-duplicate-dry-run-local-qa
qaBlockingIssuesFound: false
saveExecuted: false
updateButtonClicked: false
dryRunPreviewModuleVerified: true
cursorDbWriteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
readyForG22dScheduleDuplicateNonDryRunInsertPlanning: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean) |
| `HEAD` | `266491e` |
| `origin/main` | `266491e` |

---

## 2. Local dev / QA execution

### Dev command (existing session reused)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=false \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED=false \
PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status | **200** |
| QA method | HTTP fetch + HTML marker analysis + G-22b module dry-run mirror |
| Save / 更新する | **not clicked** |
| 変更を確認 (browser) | **not clicked** (module mirror used; see §5) |

---

## 3. Schedule operator page — static HTML QA

### List / disabled actions — **PASS**

| Check | Result |
| --- | --- |
| Selectable rows present | **yes** — `data-select-row-id` buttons in table + card list (30 events × 2 views) |
| `#gosaki-schedule-add-btn` | **disabled** (`data-gosaki-schedule-action-disabled`) |
| `#gosaki-schedule-delete-btn` | **disabled** (`data-gosaki-schedule-action-disabled`) |
| `#gosaki-schedule-duplicate-btn` | **enabled** (no `disabled` attribute) |
| Label | **複製案を作成** |
| Operator note | 「複製案の作成はできます。保存・削除は戸山が確認して反映します。」 |

### Duplicate draft shell markup — **PASS**

| Element | Result |
| --- | --- |
| `#gosaki-schedule-duplicate-draft-banner` | present (initially `hidden`) |
| Banner title | **複製案** |
| Banner body | **まだ保存されていません。保存は戸山が確認して反映します。** |
| `#gosaki-edit-legacy-id-value` | present (populated client-side in duplicate mode) |
| `#gosaki-schedule-edit-dry-run-btn` | present (`data-gosaki-dry-run-only`) |
| `#gosaki-schedule-update-btn` | **disabled** in default SSR (`更新する（準備中）`, `data-gosaki-save-allowed="false"`) |

### G-22b CSS / dev preview styles — **PASS**

Duplicate banner + dev `<details>` styles present in served HTML (`gosaki-schedule-duplicate-draft-banner`, `gosaki-schedule-duplicate-dry-run-dev`).

---

## 4. Duplicate draft creation — code-path QA

Verified against `gosaki-staging-schedule-operator-ui.ts` + module smoke (fixture row mirroring staging `schedule-2026-03-007` shape).

| Check | Result |
| --- | --- |
| Select row → 複製案を作成 | `enterDuplicateDraftFromSelectedRow()` sets `editDraftMode = "duplicate"` |
| Edit panel title | **複製案を編集** |
| Banner visible | `updateDuplicateDraftBanner()` sets `data-draft-mode="duplicate"` |
| Title suffix | `<Duo>` → `<Duo>（コピー）` **PASS** |
| `legacy_id` display | **（未保存・採番予定）** via `GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL` |
| `updated_at` display | **（未保存）** in duplicate mode |
| 更新する in duplicate mode | **always disabled**; label → `更新する（複製案）` |
| `runEditSave()` in duplicate mode | **blocked** with alert (no adapter call) |

---

## 5. Duplicate dry-run preview — module mirror QA

`executeG22bScheduleDuplicateDryRun()` is the same function invoked by `runEditDryRunPreview()` in duplicate mode. Module smoke (staging ref `kmjqppxjdnwwrtaeqjta`):

| Field | Value |
| --- | --- |
| `operation` | `duplicate` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `saveAllowed` | `false` |
| `wouldInsert` | `true` |
| `wouldWrite` | `true` |
| `ok` | `true` |
| `payload.site_slug` | `gosaki-piano` |
| `safety.supabaseWriteCalled` | `false` |

UI preview panel (when rendered) shows:

- Title: **複製案の確認結果**
- Operation chip: `duplicate`（新規追加の予定）
- Safety line: `dryRun=true`, `actualWrite=false`, `wouldInsert=true`, `saveAllowed=false`
- Dev `<details>` with `approvalId: G-22b-gosaki-schedule-duplicate-dry-run`

**Note:** Browser click of 「変更を確認」 was **not** performed in this phase (no Playwright in repo; G-20ui3-QA precedent: HTTP + module mirror). Operator may spot-check interactively; module path is identical to UI handler.

---

## 6. Save / DB write — not executed

| Operation | Executed |
| --- | --- |
| 更新する / Save click | **no** |
| `executeG9kExistingEventSaveButtonSave` | **not invoked** |
| `executeG22bScheduleDuplicateDryRun` `.insert()` | **no** (adapter dry-run only) |
| SQL INSERT / UPDATE / DELETE | **no** |
| package regen / FTP | **no** |

`git diff` on `gosaki-schedule-existing-event-save-button-save.ts` and `schedule-write-adapter.ts`: **empty** (unchanged since G-22b).

---

## 7. Existing UPDATE mode — regression check

| Check | Result |
| --- | --- |
| G-9k dry-run path in `existing` mode | **unchanged** (`runEditDryRunPreview` branches on `isDuplicateDraftMode()`) |
| Select different row from duplicate draft | `resetDuplicateDraftMode()` after confirm; `renderEditForm(row)` restores **選択中の公演を編集** |
| G-9k Save gates / env arm | **unchanged** (G-22b verifier 43/43 PASS) |
| Default 更新する label (existing mode) | `更新する（準備中）` when Save not armed |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22c-gosaki-schedule-duplicate-dry-run-local-qa.mjs
```

---

## 9. Next phase

**G-22d** — duplicate non-dry-run INSERT planning / implementation (separate approval ID; not in G-22c scope).

---

## 10. Fix required?

**No.** G-22b duplicate dry-run UI behaves as specified on local dev. Ready for operator interactive spot-check; no code changes required from G-22c QA.
