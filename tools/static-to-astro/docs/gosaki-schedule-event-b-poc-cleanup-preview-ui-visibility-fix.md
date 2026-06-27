# G-13c2d2b — Gosaki Event B PoC cleanup Preview UI visibility fix

**Phase:** `G-13c2d2b-gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix`  
**Status:** fix complete — **no Preview / Save / DB write in this phase**  
**Base commit:** `9e03b40`  
**Prior:** G-13c2d2 local dry-run Preview preflight  
**Reported by:** operator local dev (戸山)

## Summary

Operator could find `G-13c2 変更を確認（dry-run）` via Chrome in-page search (1/1) but could not see or click the Preview button. Only `Event B cleanup 保存（無効）` was partially visible near the right edit form.

**Root cause:** G-13c1 and G-13c2 sections were rendered **inside** `.gosaki-schedule-admin-workspace` (2-column grid). On desktop (≥960px), G-13c2 landed in grid column 2 row 2 — below/overlapped by the **sticky** edit panel — so the Preview button was clipped while the Save button at the section bottom peeked through.

**Fix:** Move both PoC cleanup panels **outside** the workspace grid into a full-width stack below list + editor.

**No Preview / Save / DB write / commit in this phase.**

---

## 1. Git state (verified at start)

```txt
git status --short: (empty)
HEAD: 9e03b40
origin/main: 9e03b40
```

---

## 2. Root cause

| Factor | Effect |
|--------|--------|
| `.gosaki-schedule-admin-workspace` | 2-column CSS grid @ ≥960px |
| `.admin-gosaki-schedule-edit-card` | `position: sticky` in column 2 |
| G-13c2 DOM position | 4th grid child → column 2, row 2 |
| G-13c2 section order | Preview → Save (Save lower in DOM) |

Operator saw G-13c1 Preview (left column, row 2 — page scroll) and G-13c2 Save peek (right column, bottom of obscured section). G-13c2 Preview was above Save but hidden behind sticky editor viewport.

---

## 3. Fix

### Markup (`AdminGosakiStagingScheduleOperatorPage.astro`)

1. Close `.gosaki-schedule-admin-workspace` after list + edit panels only.
2. Add wrapper `.gosaki-schedule-operator-poc-cleanup-panels` below workspace.
3. Move G-13c1 and G-13c2 sections into wrapper.
4. Add `admin-card admin-gosaki-card` for visible card chrome.

### CSS (`admin.css`)

```css
.gosaki-schedule-operator-poc-cleanup-panels { full-width stack below workspace }
.admin-gosaki-schedule-g13c1/g13c2 { position: static; overflow: visible }
.admin-gosaki-section-title { visible heading styles }
```

Save buttons remain `disabled`. No JS logic changes.

---

## 4. Expected operator UI (after fix)

Page scroll **below** the list/editor workspace:

```txt
┌─────────────────────────────────────────────┐
│ G-13c1 — Event A PoC 文言クリーンアップ      │
│ [G-13c1 変更を確認（dry-run）]              │
│ [Event A cleanup 保存（無効）]              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ G-13c2 — Event B PoC 文言クリーンアップ      │
│ [G-13c2 変更を確認（dry-run）]  ← visible   │
│ [Event B cleanup 保存（無効）]              │
└─────────────────────────────────────────────┘
```

Both sections full-width — not inside sticky editor column.

---

## 5. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventBPocCleanupPreviewUiVisibilityFixComplete` | **true** |
| `readyForG13c2d2OperatorLocalDryRunPreview` | **true** (retry) |
| `cursorPreviewButtonClicked` | **false** |
| `cursorSaveExecuted` | **false** |
| `eventATouched` | **false** (layout only; G-13c1 moved with G-13c2) |
| `marchReuploadTriggered` | **false** |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13c2d2b-gosaki-schedule-event-b-poc-cleanup-preview-ui-visibility-fix.mjs
```

---

## 7. Next

Operator retries G-13c2d2 Preview procedure (`gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.md` section 8).

---

## 8. References

- [gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.md](./gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.md)
- [gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md](./gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md) (workspace grid context)
