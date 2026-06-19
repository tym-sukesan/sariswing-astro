# Staging shell schedule site_slug row picker exception lifecycle cleanup (G-9g3h2b)

**Phase:** `G-9g3h2b-row-picker-exception-lifecycle-cleanup`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g3h1d post-execution hardening — commit `a01fbf4`  
**Type:** registry refactor + lifecycle retirement — **no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md](./staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md)
- [staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md](./staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md)
- [staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md](./staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md)

**Do not re-click G-9g3h1a smoke Save or G-9g3h1c restore Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugRowPickerExceptionLifecycleCleanupComplete: true
markerRemainsInStagingDb: false
g9g3h1aRestoreExceptionLifecycle: completed
g9g3g4RestoreExceptionLifecycle: completed
activeRestoreExceptionsCount: 0
readyForG9g3h3CmsKitGeneralizationNotes: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g3h3-cms-kit-generalization-notes`

---

## 1. Why cleanup was needed

G-9g3h1b1 added `isG9g3h1aSmokeMarkerRestoreTargetRow` as a **temporary** narrow exception so the G-9g3h1a smoke marker row could be selected for G-9g3h1c restore. G-9g3g4 had a similar prior exception (`isG9G3g4OperationalRestoreTargetRow`).

After G-9g3h1c:

- G-9g3h1a smoke marker **removed** from staging DB
- `markerRemainsInStagingDb: false`
- Live target row `888c58f2-f152-4563-a3cf-a20d7c2456c1` has original description
- Phase-specific exception functions no longer match live data

**Risk if left as-is:** phase-specific exception functions accumulate in `row-picker-utils.ts`, UI, and guards — each future smoke/restore cycle adds another bespoke function. Audit bypass logic becomes harder to reason about.

---

## 2. Chosen option

**Option B — centralized restore exception registry** (lifecycle-aware)

| Option | Decision |
| --- | --- |
| A — delete active exception, docs only | Rejected — does not address G-9g3g4 parallel pattern or future growth |
| **B — registry with lifecycle status** | **Chosen** — consolidates G-9g3g4 + G-9g3h1a; `completed` entries do not affect live UI/guards |
| C — keep code + docs only | Rejected — exception proliferation risk remains |

**Why not over-engineered:** single registry file, two `completed` entries, thin re-exports. No DB, no new env arms, no UI clicks.

---

## 3. Behavior before cleanup

| Layer | G-9g3h1a exception (pre-G-9g3h2b) |
| --- | --- |
| `isG9g3h1aSmokeMarkerRestoreTargetRow` | standalone function in `row-picker-utils.ts` |
| `isPocAuditScheduleRow` | hard-coded bypass via `isG9g3h1aSmokeMarkerRestoreTargetRow(row)` |
| `assertOperationalNotPocAuditRow` | hard-coded bypass via `isG9g3h1aSmokeMarkerRestoreTargetRow(row)` |
| Row picker UI | G-9g3h1a-specific label / badge / CSS class |
| Live match after G-9g3h1c | **no** (marker removed) — dead code path |

G-9g3g4 exception followed the same scattered pattern (also `completed` after G-9g3g5c restore).

---

## 4. Behavior after cleanup

### Registry

New file: `src/lib/admin/staging-data/staging-schedule-site-slug-restore-exception-registry.ts`

```txt
STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY
  ├── g9g3g4-operational-restore   status: completed
  └── g9g3h1a-smoke-marker-restore status: completed
```

### Active path (live UI + guards)

| Function | Behavior |
| --- | --- |
| `getActiveRestoreExceptionForRow(row)` | returns entry only when `status === "active"` **and** `matchesRow(row)` |
| `isActiveRestoreExceptionRow(row)` | used by `isPocAuditScheduleRow` and `assertOperationalNotPocAuditRow` |
| Row picker UI / Astro SSR | restore badge via `getActiveRestoreExceptionForRow` — **no badge when no active match** |

### Historical matchers (verifiers / docs)

| Function | Purpose |
| --- | --- |
| `isG9G3g4OperationalRestoreTargetRow` | historical matcher — G-9g3g4 marker row |
| `isG9g3h1aSmokeMarkerRestoreTargetRow` | historical matcher — G-9g3h1a smoke marker row |

Re-exported from `staging-schedule-site-slug-row-picker-utils.ts` for backward-compatible verifier references.

### Live target row `888c58f2-…` (post-G-9g3h1c)

```txt
markerRemainsInStagingDb: false
updated_at: 2026-06-19T02:05:42.615781+00:00
description: original (no [CMS Kit staging] marker)
row picker: normal selectable content row
restore badge: not shown
activeRestoreExceptionsCount: 0
```

---

## 5. G-9g3h1a exception lifecycle

| Stage | Phase | Status |
| --- | --- | --- |
| Problem | G-9g3h1c paused — row under PoC audit panel | — |
| Exception added | G-9g3h1b1 (`863fdff`) | `active` (implicit) |
| Restore executed | G-9g3h1c (`e6b3ece`) | marker removed |
| Post-hardening | G-9g3h1d (`a01fbf4`) | documented no live match |
| **Lifecycle cleanup** | **G-9g3h2b (this)** | registry entry `status: completed` |

G-9g3h1b1 historical record preserved in [staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md](./staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md).

Removed smoke marker (historical):

```txt
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker
```

**Future restore smokes:** add registry entry with `status: active` + explicit matcher; set `completed` after successful restore — do not add new phase-specific bypass functions.

---

## 6. Audit protections preserved

| Protection | Status |
| --- | --- |
| Generic `[CMS Kit staging]` → `rowContainsPocAuditMarker` → audit-only | **preserved** |
| G-6 pilot row `aa440e29-5be8-402e-9190-0d81c48434c0` | **audit-only** (`G9G1_TARGET_ROW_ID`) |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC audit rows | **audit-only** |
| `assertOperationalNotPocAuditRow` blocks `[CMS Kit staging]` marker rows | **preserved** |
| Active restore exception bypass | only when registry entry `status: active` **and** matcher passes |
| Production / `/admin` | **untouched** |

---

## 7. Code touchpoints

| File | Change |
| --- | --- |
| `staging-schedule-site-slug-restore-exception-registry.ts` | **new** — registry + lifecycle |
| `staging-schedule-site-slug-row-picker-utils.ts` | `isPocAuditScheduleRow` uses `isActiveRestoreExceptionRow`; re-exports |
| `staging-schedule-site-slug-row-picker-ui.ts` | generic restore badge via `getActiveRestoreExceptionForRow` |
| `schedule-write-guards.ts` | `assertOperationalNotPocAuditRow` uses `isActiveRestoreExceptionRow` |
| `AdminStagingScheduleSiteSlugRowPickerSection.astro` | generic restore UI; audit banner text |

Config constants (`G9G3H1A_*`, `G9G3G4_*`) retained as historical guard references.

---

## 8. CMS Kit generalization notes

| Pattern | G-9g3h2b outcome |
| --- | --- |
| Restore-only row-picker exceptions | central registry, not per-phase functions |
| Lifecycle | `active` → operator restore → `completed` |
| Audit bypass | only for **active** registry entries |
| Historical verification | matchers + docs + verifiers keep phase audit trail |
| UI labels | registry `uiLabel` / `selectableHint` — shared restore badge component |

**Do not** add new `isG9g3h*` / `isG9g3g*` one-off bypass functions. Extend `STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY` instead.

---

## 9. Remaining backlog

| Item | Notes |
| --- | --- |
| Audit marker vocabulary redesign | distinguish test markers from PoC audit without over-broad `[CMS Kit staging]` |
| `G9G3G5_RESTORE_CURRENT_MARKER_DESCRIPTION` config comment | stale comment (“includes marker”) — optional config doc fix |
| G-9g3g5 restore UI in `edit-ui.ts` | still uses historical `isG9G3g4OperationalRestoreTargetRow` — returns false on live data; migrate to registry lookup in future UX phase |
| Auto-expire `completed` entries | optional pruning from registry after N phases (docs-only archive) |

---

## 10. Next phase recommendation

**Recommended:** `G-9g3h3-cms-kit-generalization-notes`

**Reason:** G-9g3h1 round-trip + G-9g3h2b registry pattern are ready to consolidate into onboarding-ready CMS Kit safety documentation before field expansion (`G-9g4`).

| Alternative | When |
| --- | --- |
| `G-9g4-schedule-editor-usability-and-field-expansion-planning` | after generalization notes |
| `G-9g3h2-operational-editor-usability-hardening` | broader UX pass |

---

## 11. Safety flags (this phase)

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "markerRemainsInStagingDb": false
}
```

| Item | G-9g3h2b |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL mutation executed | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
