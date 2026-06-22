# Gosaki schedule Save UI copy and editor scroll fix (G-9k7)

**Phase:** `G-9k7-gosaki-schedule-save-ui-copy-and-editor-scroll-fix`  
**Status:** **complete** — operator UI copy + two-column scroll layout; **no DB write / Save / non-dry-run in this phase**  
**Date:** 2026-06-22  
**Prior:** G-9k6g field slice closure (commit `99ffc6c`)

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
phase: G-9k7
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
| Save **disabled** (dry-run OK) | 保存内容の確認は完了しています。保存は無効です。DB UPDATE は実行されません。 |
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

## 3. Next phase candidates

Operator choice (unchanged from G-9k6g):

- Staging shell schedule Save generalization
- Existing event edit next feature (create / delete / publish)
- Gosaki CMS Kit (`G-9h1` client preview feedback)
- Rollback of G-9k6 test markers on staging row
