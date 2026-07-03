# G-22e1 — Gosaki Schedule new event dry-run local QA

**Phase:** `G-22e1-gosaki-schedule-new-event-dry-run-local-qa`  
**Status:** **complete** — local dev QA / record only; **no Save / DB / deploy**  
**Date:** 2026-07-02  
**Base commit:** `c716891`  
**Prior:** [gosaki-schedule-new-event-dry-run-ui-implementation.md](./gosaki-schedule-new-event-dry-run-ui-implementation.md) (G-22e)

| Check | Status |
| --- | --- |
| Local dev QA executed | **yes** (HTTP 200 + markup + module smoke) |
| New event draft UI verified | **yes** |
| New event dry-run preview verified | **yes** (module mirror of UI path) |
| Save / 保存ボタン clicked | **no** |
| DB write | **no** |
| Blocking issues | **none** |

---

## Gates

```txt
gosakiScheduleNewEventDryRunLocalQaComplete: true
phase: G-22e1-gosaki-schedule-new-event-dry-run-local-qa
qaBlockingIssuesFound: false
saveExecuted: false
updateButtonClicked: false
dbWriteExecuted: false
dryRunPreviewModuleVerified: true
cursorDbWriteExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
readyForG22e2ScheduleNewEventInsertPlanning: true
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` (clean) |
| `HEAD` | `c716891` |
| `origin/main` | `c716891` |

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
PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED=false \
npm run dev -- --port 4321 --host 127.0.0.1
```

| Item | Value |
| --- | --- |
| Route | `http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/` |
| HTTP status | **200** |
| `data-read-source` | **supabase** (live staging read) |
| Selectable rows | **30** events (`data-select-row-id` × 2 views = 60 markers) |
| QA method | HTTP fetch + HTML marker analysis + G-22e module dry-run mirror |
| Save / 保存 | **not clicked** |
| ENABLE_ADMIN_STAGING_WRITE | **false** |
| G-22d duplicate insert arm | **false** |

---

## 3. Schedule operator page — static HTML QA

### Buttons / disabled actions — **PASS**

| Check | Result |
| --- | --- |
| `#gosaki-schedule-add-btn` | **enabled** — no `disabled`, no `data-gosaki-schedule-action-disabled`; title `新規追加案を作成します（保存はまだできません）` |
| Add button label | **新規追加案を作成** |
| `#gosaki-schedule-delete-btn` | **disabled** (`data-gosaki-schedule-action-disabled disabled`) |
| `#gosaki-schedule-update-btn` | default SSR **disabled** (`data-gosaki-save-allowed="false"`, disabled) |
| `#gosaki-schedule-duplicate-btn` | **enabled** — `複製案を作成` |

### New event draft shell markup — **PASS**

| Element | Result |
| --- | --- |
| `#gosaki-schedule-new-event-draft-banner` | present (initially `hidden`) |
| Banner title | **新規追加案** |
| Banner body | **まだ保存されていません。保存は戸山が確認して反映します。** |
| Banner hint | **変更を確認すると、新規追加予定の内容を確認できます。保存は現在無効です。** |
| Add card note | **保存は現在無効です** (2 occurrences: add card + banner hint) |
| Duplicate banner markup | still present (`gosaki-schedule-duplicate-draft-banner`) — duplicate mode intact |

### Safety — **PASS**

| Check | Result |
| --- | --- |
| Sariswing prod ref `vsbvndwuajjhnzpohghh` | **absent** (0 occurrences) |

---

## 4. New event draft creation — code-path QA

Verified against `gosaki-staging-schedule-operator-ui.ts` + module smoke (empty seed).

| Check | Result |
| --- | --- |
| Click 新規追加案を作成 | `enterNewEventDraftMode()` sets `editDraftMode = "new"` |
| Edit panel title | **新規追加案を編集** |
| Banner visible | `updateNewEventDraftBanner()` sets `data-draft-mode="new"` |
| `draft.id` | `__gosaki-new-event-draft-unsaved__` |
| `draft.legacy_id` | `null` → UI `（未保存・採番予定）` |
| `draft.published` | **`false`** |
| `draft.site_slug` | **`gosaki-piano`** |
| `updated_at` display | **（未保存）** |
| 保存ボタン in new mode | **always disabled**; label → `保存（現在は無効）` |
| `runEditSave()` in new mode | **blocked** with alert (no adapter/insert call) |

---

## 5. New event dry-run preview — module mirror QA

`executeG22eScheduleNewEventDryRun()` is the same function invoked by `runEditDryRunPreview()` in new mode.

### Case A — empty form (未入力)

| Field | Value |
| --- | --- |
| `ok` | `true` (preview renderable) |
| `operation` | `new` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `saveAllowed` | `false` |
| `wouldInsert` | **`false`** |
| `validation.warnings` | `["日付が未入力です","タイトルが未入力です","会場が未入力です"]` |

→ Preview shows **保存不可理由 / warning** as specified.

### Case B — valid form (date + title + venue)

| Field | Value |
| --- | --- |
| `operation` | `new` |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `saveAllowed` | `false` |
| `wouldInsert` | **`true`** |
| `payload.published` | `false` |
| `payload.site_slug` | `gosaki-piano` |
| `payload.legacy_id` | `null` |
| `payload.sort_order` | `null` |
| `derivedPreview.recalculatedMonth` | `2026-09` (from `2026-09-12`) |
| `safety.supabaseWriteCalled` | `false` |
| payload keys | `legacy_id, date, title, venue, open_time, start_time, price, description, published, show_on_home, home_order, sort_order, site_slug` |

**Note:** Browser click of 「変更を確認」 was **not** performed (no Playwright in repo; G-22c / G-20ui3-QA precedent: HTTP + module mirror). Module path is identical to the UI handler.

---

## 6. Save / DB write — not executed

| Operation | Executed |
| --- | --- |
| 保存 / Save click | **no** |
| `executeG22eScheduleNewEventDryRun` `.insert()` | **no** (adapter dry-run only; module has no `.insert(`) |
| new event INSERT save module | **does not exist** |
| SQL INSERT / UPDATE / DELETE | **no** |
| package regen / FTP | **no** |

---

## 7. Existing / duplicate mode — regression check

| Check | Result |
| --- | --- |
| G-9k existing UPDATE dry-run path | **unchanged** (`runEditDryRunPreview` branches: new → duplicate → existing) |
| Select row from new draft | confirm → `resetNewEventDraftMode()` → `renderEditForm(row)` restores existing mode |
| Duplicate mode dry-run | **intact** (`executeG22bScheduleDuplicateDryRun` path preserved; banner markup served) |
| G-22d duplicate INSERT gate | **untouched** (`gosaki-schedule-duplicate-insert-save.ts` clean) |
| `schedule-2026-03-014` re-Save | **not attempted** (G-22d3d closure respected) |

---

## 8. Delete — disabled maintained

`#gosaki-schedule-delete-btn` retains `data-gosaki-schedule-action-disabled disabled` in served HTML. **PASS.**

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22e1-gosaki-schedule-new-event-dry-run-local-qa.mjs
```

---

## 10. Next phase

**G-22e2** — new event INSERT planning (guard / approvalId / legacy_id allocation; separate from G-22d duplicate `sourceId` guard).

---

## 11. Fix required?

**No.** G-22e new event dry-run UI behaves as specified on local dev. Empty form shows warnings; valid form yields `wouldInsert=true` with `saveAllowed=false`. Save disabled; delete disabled; existing / duplicate modes intact. No code changes required from G-22e1 QA.
