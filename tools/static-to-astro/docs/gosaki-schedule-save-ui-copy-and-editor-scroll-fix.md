# Gosaki schedule Save UI copy and editor scroll fix (G-9k7 / G-9k7b)

**Phase:** `G-9k7-gosaki-schedule-save-ui-copy-and-editor-scroll-fix` (+ `G-9k7b-gosaki-schedule-save-ui-copy-and-list-usability-fix`)  
**Status:** **complete** — operator UI copy + two-column scroll + list usability; **no DB write / Save / non-dry-run**  
**Date:** 2026-06-22  
**Prior:** G-9k6g field slice closure (commit `99ffc6c`); G-9k7 commit `44f4d62`

| Check | Status |
| --- | --- |
| Save enabled/disabled copy fixed | **yes** |
| Independent list/editor scroll (PC) | **yes** |
| Cursor / AI clicked Save / Run | **no** |
| DB write in this phase | **no** |
| `src/pages/admin` changed | **no** |

---

## Gates

```txt
gosakiScheduleSaveUiCopyAndEditorScrollFixComplete: true
gosakiScheduleSaveUiCopyAndListUsabilityFixComplete: true
phase: G-9k7b
readyForAnyDbWrite: false
cursorClickedSave: false
```

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false`.

---

## 1. UI copy fix

Operator-facing Save messages no longer contradict Save readiness.

| State | Message |
| --- | --- |
| Save **disabled** (prep) | 「変更を確認」で内容を確認できます。保存は無効です。DB UPDATE は実行されません。 |
| Save **disabled** (dry-run OK) | 保存は無効です。確認のみ完了しました。（結果パネル1箇所のみ；ボタン下は非表示） |
| Save **enabled** (ready) | 保存が有効です。内容を確認し、「更新する」を1回だけ押すとDBに反映されます。 |

**Removed:** dry-run OK panel always showing `G9K_SAVE_BUTTON_SAVE_ENABLED=false` even when Save is enabled.

**Files:** `gosaki-staging-schedule-operator-ui.ts`, `AdminGosakiStagingScheduleOperatorPage.astro`

---

## 2. Editor scroll fix

PC (≥960px): left list panel and right editor panel scroll independently.

| Panel | Class | Behavior |
| --- | --- | --- |
| List | `gosaki-schedule-admin-list-panel` | `max-height: calc(100dvh - 9.5rem)`; `overflow-y: auto` |
| Editor | `gosaki-schedule-admin-editor-panel` | same |

Grid: `minmax(320px, 420px) minmax(0, 1fr)`.

Mobile: vertical stack unchanged (no max-height lock).

**File:** `admin.css`, `AdminGosakiStagingScheduleOperatorPage.astro`

---

## 3. G-9k7b — Save copy dedup + list「編集する」visibility

### 3.1 Save disabled copy dedup (G-9k7b)

- dry-run OK + Save 無効: **結果パネル**に `保存は無効です。確認のみ完了しました。` のみ
- ボタン下 `#gosaki-schedule-update-btn-note` は **非表示**（`setSaveButtonNote(null)`）
- Save 有効時: ボタン下に `保存が有効です…` を維持；パネルは `保存準備OK。更新できます`

### 3.2 List「編集する」button visibility (G-9k7b)

PC 左パネル（≥960px）:

- テーブル横スクロール維持
- `操作` 列 `admin-gosaki-schedule-table__actions-col` を `position: sticky; right: 0`
- 背景色 + 左シャドウで重なり回避
- タイトル列は ellipsis で幅調整

G-9k7 の独立縦スクロール・2カラムは維持。

---

## 4. Next phase candidates

Operator choice (unchanged from G-9k6g):

- Staging shell schedule Save generalization
- Existing event edit next feature (create / delete / publish)
- Gosaki CMS Kit (`G-9h1` client preview feedback)
- Rollback of G-9k6 test markers on staging row
