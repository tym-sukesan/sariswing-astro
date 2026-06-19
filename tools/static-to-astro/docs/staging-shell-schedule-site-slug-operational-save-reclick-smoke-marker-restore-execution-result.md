# Staging shell schedule site_slug operational Save re-click smoke marker restore execution result (G-9g3h1c)

**Phase:** `G-9g3h1c-smoke-marker-restore-execution`
**Status:** **operator pending**
**Date:** 2026-06-19
**Prior:** G-9g3h1b restore preflight — uncommitted
**Type:** operator manual restore Save — **one UPDATE on staging `public.schedules` allowed in execution phase only**

| Check | Status |
| --- | --- |
| Save clicked | **no** (not yet — operator execution pending) |
| Preview clicked (Cursor/AI) | **no** |
| Preview clicked (operator) | **not yet** |
| DB write executed | **no** |
| SQL mutation executed (Cursor/AI) | **no** |
| Restore executed | **no** |
| Rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-preflight.md](./staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-preflight.md)
- [staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md](./staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5c restore Save.** **Do not re-click G-9g3h1a smoke Save.** **Cursor / AI must not click Save or Preview.**

---

## Gates (pending — fill after operator restore)

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreExecutionComplete: false
markerRemainsInStagingDb: true
markerRemoved: false
restoreExecuted: false
operatorPending: true
cursorClickedSave: false
cursorClickedPreview: false
dbWriteExecuted: false
rollbackSqlExecuted: false
rollbackNeeded: false
serviceRoleUsed: false
productionUntouched: true
readyForAnyDbWrite: false
```

After successful restore Save: set `markerRemainsInStagingDb: false`, `markerRemoved: true`, `restoreExecuted: true`.

---

## 1. Restore context

| Field | Value |
| --- | --- |
| Restore path | Option A — G-9g3g general operational |
| Target id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| changedFields | `description` only |
| lock baseline | `2026-06-19T01:18:46.3938+00:00` |

### Current marker (expected loaded baseline)

```txt
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker
```

### Restore target

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

---

## 2. Exact UI controls

| Control | Value |
| --- | --- |
| Preview button | `#site-slug-edit-dry-run-preview-btn` |
| Preview result | `#site-slug-edit-dry-run-result` |
| Save button | `#site-slug-edit-g9g3g-operational-save-btn` |
| Save result | `#site-slug-edit-g9g3g-operational-save-result` |
| Gate panel | `#site-slug-edit-save-gate-panel` |

Runbook: see G-9g3h1b preflight §5 Steps A–I.

---

## 3. Operator pass record (fill after execution)

| Field | Value |
| --- | --- |
| Operator | |
| Date | |
| Preview clicked | |
| Save clicked | |
| actualWrite | |
| rowsAffected | |
| marker removed confirmed | |
| re-click blocked confirmed | |
| Notes | |

---

## 4. Git

```txt
G-9g3h1b restore preflight: uncommitted
G-9g3h1c restore execution: operator pending (uncommitted)
```
