# Staging shell schedule site_slug operational Save re-click smoke marker restore row picker exception (G-9g3h1b1)

**Phase:** `G-9g3h1b1-smoke-marker-restore-row-picker-exception`
**Status:** **implementation complete**
**Date:** 2026-06-19
**Prior:** G-9g3h1b restore preflight — commit `f868435`; G-9g3h1c paused before Preview/Save
**Type:** narrow row-picker + write-guard exception — **no Save, no Preview by Cursor, no DB write**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| Preview clicked (operator) | **no** (G-9g3h1c paused) |
| DB write executed (this phase) | **no** |
| Restore executed | **no** |
| service_role used | **no** |

**Do not re-click G-9g3h1a smoke Save.** **Cursor / AI must not click Save or Preview.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreRowPickerExceptionComplete: true
readyForG9g3h1cSmokeMarkerRestoreExecution: true
g9g3h1cExecutionPausedBeforePreviewSave: true
markerRemainsInStagingDb: true
cursorClickedSave: false
cursorClickedPreview: false
dbWriteExecuted: false
```

**Next:** `G-9g3h1c-smoke-marker-restore-execution` (retry after this fix is deployed)

---

## 1. Problem (operator-observed)

G-9g3h1c restore execution was started but **stopped before Preview / Save**.

Target row `888c58f2-f152-4563-a3cf-a20d7c2456c1` appeared under **PoC audit rows (read-only — not selectable)** because `description` contains the G-9g3h1a smoke marker (`[CMS Kit staging] …`).

Generic `isPocAuditScheduleRow` / `POC_AUDIT_STAGING_MARKER` exclusion blocked selection.

---

## 2. Root cause

| Layer | Behavior |
| --- | --- |
| `rowContainsPocAuditMarker` | Any field containing `[CMS Kit staging]` → audit |
| `splitSelectableAndAuditRows` | Audit rows not in selectable list |
| `selectRowById` | Blocks `isPocAuditScheduleRow` |
| `validateRowForHydrate` | Blocks edit binding |
| `assertOperationalNotPocAuditRow` | Would block general operational Save on marker `beforeSnapshot` |

G-9g3g4 had a prior narrow exception (`isG9G3g4OperationalRestoreTargetRow`) but G-9g3h1a uses a **different marker string**.

---

## 3. Minimal fix (implemented)

### Narrow exception function

`isG9g3h1aSmokeMarkerRestoreTargetRow(row)` — **all** must be true:

| Check | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| description | includes `[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker` |
| updated_at | `2026-06-19T01:18:46.3938+00:00` |

### Code touchpoints

| File | Change |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g3h1a restore constants + UI labels |
| `staging-schedule-site-slug-row-picker-utils.ts` | `isG9g3h1aSmokeMarkerRestoreTargetRow`; exclude from `isPocAuditScheduleRow` |
| `staging-schedule-site-slug-row-picker-ui.ts` | Restore badge + `Select (restore)` label |
| `AdminStagingScheduleSiteSlugRowPickerSection.astro` | SSR restore row styling + audit banner note |
| `schedule-write-guards.ts` | `assertOperationalNotPocAuditRow` allows G-9g3h1a restore target |

### Preserved protections

- G-6 pilot row `aa440e29-…` remains audit-only
- Generic `[CMS Kit staging]` rows remain audit-only
- G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC rows remain audit-only
- Rows failing id / legacy / site_slug / marker / `updated_at` checks stay in audit panel

### UI labeling

Selectable restore row shows:

- Badge: **G-9g3h1a restore target — restore only**
- Button: **Select (restore)**
- Status: `temporary selectable for smoke marker restore — restore only — operator manual only`

---

## 4. Operator guidance (G-9g3h1c)

1. If row still appears only under PoC audit panel with no **Select (restore)** → **STOP** (exception criteria not met; re-check `updated_at` / marker).
2. If row appears in selectable list with **G-9g3h1a restore target** badge → proceed to Preview (Option A path).
3. Do not use G-9g3g5 restore mode or legacy / PoC buttons.

---

## 5. Git

```txt
G-9g3h1b preflight: f868435 (pushed)
G-9g3h1b1 row-picker exception: uncommitted
```
