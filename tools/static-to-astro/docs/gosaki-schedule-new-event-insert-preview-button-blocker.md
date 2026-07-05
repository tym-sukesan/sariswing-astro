# Gosaki Schedule — New event draft「変更を確認」button missing (G-22e5 blocker)

Phase: `G-22e5-blocker-new-event-preview-button-missing-investigation`

Base commit at investigation start: `d068566` (HEAD = origin/main)

## 1. Symptom (operator report)

During the pre-flight for `G-22e5` (operator single INSERT execution), the operator entered
new-event draft mode via **「新規追加案を作成」** but reported that the **「変更を確認」**
(dry-run preview) button was **not visible**. Without it, the dry-run preview cannot be run,
so Save / INSERT cannot proceed. Investigation was requested as a blocker.

## 2. Environment during the report

The operator was running the **write-armed** dev server for `G-22e5`:

- `ENABLE_ADMIN_STAGING_WRITE=true`
- `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED=true`

That server was **stopped** at the start of this investigation (port 4321, pid 50788).
All investigation below was performed in a **dry-run safe** env (write off, dry-run on,
both G-22e / G-22d arms `false`).

## 3. Root cause

The **「変更を確認」button is NOT missing from the DOM.** It exists in the SSR HTML and the
client JS wires and reveals it correctly.

- Button markup: `#gosaki-schedule-edit-dry-run-btn` (text: 変更を確認),
  `data-gosaki-dry-run-only`, in
  `AdminGosakiStagingScheduleOperatorPage.astro`.
- It lives **inside** `#gosaki-schedule-edit-form`, which is `hidden` by default and is
  revealed by JS (`renderEditForm()` sets `formEl.hidden = false`) when a row is selected
  or a new/duplicate draft is created.
- SSR HTML confirmed: 1 × `gosaki-schedule-edit-dry-run-btn`, 7 × `変更を確認`.
- Client module `gosaki-staging-schedule-operator-ui.ts` compiles and loads cleanly
  (HTTP 200, `initGosakiStagingScheduleOperatorUi` + `DOMContentLoaded` present, no Vite
  transform errors).

The real problem is **discoverability / scroll**, caused by the **two-form layout**:

1. The **top** card 「新規公演の追加」 (`#gosaki-schedule-add-form`, `#gosaki-add-*` fields)
   has **no 「変更を確認」 button** — only the 「新規追加案を作成」 button.
2. Clicking 「新規追加案を作成」 reads the top form as a seed, enters new-event draft mode,
   and renders the draft into the **bottom** edit panel (`#gosaki-schedule-operator-edit`,
   below the schedule list) — which **does** contain 「変更を確認」.
3. The post-entry scroll used `scrollIntoView({ block: "nearest" })` on the edit panel.
   Because the 「変更を確認」 button sits lower inside a tall form at the bottom of a
   two-column workspace, `block: "nearest"` did **not** reliably bring the button into view.
   The operator, still looking near the top add form, perceived the button as "missing".

This is **not a functional defect**; no write/gate logic is involved in button visibility.

## 4. Fix

Minimal, scroll-only UX fix in `gosaki-staging-schedule-operator-ui.ts`
(`enterNewEventDraftMode`):

```ts
function scrollNewEventDraftIntoView(): void {
  const editPanel = document.getElementById("gosaki-schedule-operator-edit");
  editPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  const dryRunBtn = document.getElementById("gosaki-schedule-edit-dry-run-btn");
  if (dryRunBtn) {
    window.setTimeout(() => {
      dryRunBtn.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }
}
```

- First scrolls the edit panel to `block: "start"` (draft banner + form top in reading order),
  then after the smooth scroll settles (350 ms) centers the 「変更を確認」 button so it is
  guaranteed visible.
- No change to any gate, guard, payload, env, or write path.
- Duplicate-draft path (`enterDuplicateDraftFromSelectedRow`) still uses `block: "nearest"`;
  it was not part of this blocker and is left unchanged (same pattern; can be aligned later if
  needed).

## 5. Verification (dry-run safe env)

- Dev started with dry-run safe env (write off, dry-run on, G-22e / G-22d arms `false`).
- `/__admin-staging-shell/musician-basic/admin/schedule/` → HTTP 200.
- SSR HTML: 「変更を確認」 button present inside the (default-hidden) edit form.
- After the fix, HMR served the updated module (HTTP 200); `scrollNewEventDraftIntoView`
  and `block: "start"` present; no transform errors.
- No lint errors in the edited file.

## 6. Safety confirmation

- Save button: **not clicked**.
- DB write / INSERT / UPDATE / DELETE / UPSERT: **not executed**.
- GRANT / REVOKE: **not executed**.
- rollback SQL: **not executed**.
- package regen / FTP / upload / deploy: **not performed**.
- commit / push: **not performed** (pending operator instruction).
- Write-armed dev server: **stopped**; investigation done only in dry-run safe env.

## 7. Status / next

- `gosakiScheduleNewEventInsertPreviewButtonBlockerResolved: true`
- `previewButtonMissingFromDom: false` (button was always present)
- `fixType: scroll-discoverability-only`
- `readyToResumeG22e5AfterOperatorReupload: true` — the operator can re-verify in the
  dry-run safe env (「新規追加案を作成」 → the edit panel + 「変更を確認」 now scroll into view),
  then re-arm the write-armed env for the actual single INSERT.
