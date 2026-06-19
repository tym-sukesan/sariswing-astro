# Staging shell schedule venue-only operational restore preflight (G-9g4a1c)

**Phase:** `G-9g4a1c-venue-only-operational-restore-preflight`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a1b1 manual execution result — commit `11368be`  
**Type:** restore preflight / rollback planning / operator checklist only — **no Save, no Preview click by Cursor, no DB write, no SQL execution**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Restore executed (this phase) | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
| `.env` / `.env.local` arm write | **no** |

Prior docs:

- [staging-shell-schedule-venue-only-operational-expansion-manual-execution-result.md](./staging-shell-schedule-venue-only-operational-expansion-manual-execution-result.md)
- [staging-shell-schedule-venue-only-operational-expansion-execution-runbook.md](./staging-shell-schedule-venue-only-operational-expansion-execution-runbook.md)

**Staging DB currently has venue smoke marker.** Restore removes marker via G-9g4a1 venue-only UI path — **not executed in this phase.**

**Do not re-click G-9g4a1b1 smoke Save.** **Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not use G-9g3g5 restore path for this row.**

---

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalRestorePreflightComplete: true
readyForG9g4a1dVenueOnlyOperationalRestoreManualExecution: true
markerRemainsInStagingDb: true
restoreTargetRowId: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
rollbackSqlExecuted: false
```

**Recommended next:** `G-9g4a1d-venue-only-operational-restore-manual-execution`

---

## 1. Route and hosts

```txt
URL:  http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
site_slug: gosaki-piano
staging host:  kmjqppxjdnwwrtaeqjta.supabase.co
production host (blocked): vsbvndwuajjhnzpohghh.supabase.co
```

Staging shell only — **not** Sariswing production `/admin`.

---

## 2. Approval ID / env arm

```txt
G-9g4a1-schedule-site-slug-venue-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
```

Restore uses **same G-9g4a1 venue-only path** as smoke — not G-9g3g5 operational restore.

---

## 3. Restore target row

```txt
id:           eb1f1898-5107-4deb-a6d5-a792e0ec3f69
legacy_id:    schedule-2026-03-003
site_slug:    gosaki-piano
title:        <Live & Session>
date:         2026-03-08
source_route: /schedule/2026-03/
published:    true
```

Operator must load this row in row picker before restore Preview.

---

## 4. Current DB state (post G-9g4a1b1 smoke)

```txt
venue:                    学芸大学 珈琲美学 [G-9g4a1 venue smoke]
updated_at:               2026-06-19T05:12:41.853845+00:00
markerRemainsInStagingDb: true
```

### Preflight verification (operator at G-9g4a1d)

| Field | Expected |
| --- | --- |
| id | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| legacy_id | `schedule-2026-03-003` |
| site_slug | `gosaki-piano` |
| current venue | `学芸大学 珈琲美学 [G-9g4a1 venue smoke]` |
| restore venue | `学芸大学 珈琲美学` |
| expectedBeforeUpdatedAt | `2026-06-19T05:12:41.853845+00:00` |

---

## 5. Restore payload

```json
{
  "venue": "学芸大学 珈琲美学"
}
```

### Expected changedFields

```txt
["venue"]
```

### Unchanged fields (must not differ at Preview)

title, description, date, year, month, source_route, open_time, start_time, price, published, show_on_home, sort_order, home_order, image_url, home_image_url, legacy_id, site_slug, id

---

## 6. beforeSnapshot (restore — current smoke state)

```txt
id: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
legacy_id: schedule-2026-03-003
site_slug: gosaki-piano
title: <Live & Session>
venue: 学芸大学 珈琲美学 [G-9g4a1 venue smoke]
updated_at: 2026-06-19T05:12:41.853845+00:00
```

### afterSnapshot (expected after restore Save)

```txt
venue: 学芸大学 珈琲美学
updated_at: <new timestamp from DB trigger — operator records at Save result>
```

---

## 7. Env stack / arm plan

### Routine dev (default — **this preflight and daily work**)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

### Restore execution-only stack (G-9g4a1d — operator inline env only)

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g4a1-schedule-site-slug-venue-only-non-dry-run
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
PUBLIC_SUPABASE_URL=https://kmjqppxjdnwwrtaeqjta.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<staging anon key — never commit>
```

### Arm mutual exclusion (mandatory)

**G-9g4a1 arm only on** during restore execution — G-9g3g and G-9g3g5 arms must stay off.

| Arm | G-9g4a1d restore execution |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` | **on** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **off** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | **off** |
| `service_role` | **forbidden** |
| Production host | **blocked** |

**This preflight:** do **not** write arms to `.env` / `.env.local`; do **not** start dev server with execution stack.

---

## 8. UI targets (G-9g4a1 venue-only path only)

| Element | id |
| --- | --- |
| Venue-only Preview button | `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` |
| Preview result | `#site-slug-edit-g9g4a1-venue-only-dry-run-result` |
| Save gate panel | `#site-slug-edit-g9g4a1-venue-only-save-gate-panel` |
| Venue-only Save button | `#site-slug-edit-g9g4a1-venue-only-save-btn` |
| Save result | `#site-slug-edit-g9g4a1-venue-only-save-result` |

### Do **not** use

| Forbidden | Reason |
| --- | --- |
| G-9g3g general Save button | description path — wrong slice |
| G-9g3g5 restore button | separate restore arm — wrong path for G-9g4a1 venue restore |
| Legacy G-6 buttons | frozen PoC |
| `/admin` | production admin blocked |
| Production host | blocked |

---

## 9. Preview checklist (operator — G-9g4a1d)

### Before Preview

- [ ] Staging host only (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- [ ] Staging admin signed in
- [ ] Row `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` loaded in picker
- [ ] `legacy_id` = `schedule-2026-03-003`
- [ ] `site_slug` = `gosaki-piano`
- [ ] Loaded venue = `学芸大学 珈琲美学 [G-9g4a1 venue smoke]`
- [ ] Venue field edited to `学芸大学 珈琲美学` — **only venue differs**
- [ ] G-9g4a1 execution stack armed (§7)
- [ ] G-9g3g / G-9g3g5 arms **off**

### Preview action

1. Operator clicks `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` **once**.
2. Read `#site-slug-edit-g9g4a1-venue-only-dry-run-result`.

### Preview result — required fields

```txt
actualWrite: false
changedFields: ["venue"]
payload: { "venue": "学芸大学 珈琲美学" }
target.id: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
target.legacy_id: schedule-2026-03-003
target.site_slug: gosaki-piano
before.venue: 学芸大学 珈琲美学 [G-9g4a1 venue smoke]
after.venue:  学芸大学 珈琲美学
optimisticLock.expectedBeforeUpdatedAt: 2026-06-19T05:12:41.853845+00:00
optimisticLock.stale: false
hostGatePassed: true
approvalId: G-9g4a1-schedule-site-slug-venue-only-non-dry-run
serviceRoleUsed: false
productionBlocked: true
```

### Preview STOP

```txt
STOP: operator must paste Preview result to ChatGPT
STOP: operator must not click Save until ChatGPT confirms
```

---

## 10. Save checklist (operator — G-9g4a1d)

### Before Save

- [ ] ChatGPT confirmed Preview
- [ ] Save gate enabled (`preview: valid`)
- [ ] `changedFields` exactly `["venue"]`
- [ ] Payload exactly `{ "venue": "学芸大学 珈琲美学" }`
- [ ] `expectedBeforeUpdatedAt` = `2026-06-19T05:12:41.853845+00:00`
- [ ] `optimisticLock.stale=false`
- [ ] `hostGatePassed=true`
- [ ] `approvalId` = `G-9g4a1-schedule-site-slug-venue-only-non-dry-run`
- [ ] **Only** `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true`
- [ ] G-9g3g / G-9g3g5 arms **off**
- [ ] Non-venue fields unchanged
- [ ] Operator understands Save is **one-time only**

### Save execution

```txt
operator manually clicks #site-slug-edit-g9g4a1-venue-only-save-btn exactly once
Cursor / AI / Playwright / Chromium must not click
```

### Save result — required fields

```txt
actualWrite: true
rowsAffected: 1
changedFields: ["venue"]
payload: { "venue": "学芸大学 珈琲美学" }
before.venue: 学芸大学 珈琲美学 [G-9g4a1 venue smoke]
after.venue:  学芸大学 珈琲美学
serviceRoleUsed: false
productionBlocked: true
scheduleMonthsTouched: false
deleteEnabled: false
publishTriggered: false
```

### Save STOP

```txt
STOP: operator must paste Save result to ChatGPT
STOP: do not click Save again
STOP: confirm marker removed from venue field
STOP: restart dev with routine dev stack
```

---

## 11. Safety requirements

| Requirement | Detail |
| --- | --- |
| hostGatePassed | **true** required |
| optimisticLock.stale | **false** required |
| approvalId | `G-9g4a1-schedule-site-slug-venue-only-non-dry-run` |
| G-9g4a1 arm only on | G-9g3g / G-9g3g5 off |
| service_role | **forbidden** |
| production host | **blocked** |
| Restore path | G-9g4a1 venue-only UI — **not** G-9g3g5 |
| SQL rollback | document-only — **not executed** |
| Save | operator manual exactly once |
| Preview | ChatGPT gate before Save |
| Post-Save | ChatGPT gate before further action |

---

## 12. Rollback SQL (document-only — DO NOT RUN)

```sql
-- DO NOT RUN during G-9g4a1c restore preflight.
-- Document-only emergency rollback template.
-- Prefer G-9g4a1 venue-only UI restore path.

UPDATE public.schedules
SET
  venue = '学芸大学 珈琲美学',
  updated_at = '2026-06-19T05:12:41.853845+00:00'
WHERE id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69'
  AND site_slug = 'gosaki-piano'
  AND legacy_id = 'schedule-2026-03-003'
  AND venue = '学芸大学 珈琲美学 [G-9g4a1 venue smoke]';
```

**Policy:** UI restore preferred; SQL is emergency documentation only. **Cursor/AI must not execute.**

---

## 13. Forbidden operations avoided (this phase)

| Operation | Status |
| --- | --- |
| Row picker (Cursor/AI) | **no** |
| Save click (Cursor/AI) | **no** |
| Preview click (Cursor/AI) | **no** |
| DB write | **no** |
| SQL mutation / rollback execution | **no** |
| Restore execution | **no** |
| `.env` / `.env.local` arm write | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| service_role | **no** |

---

## 14. Recommended next phase

**`G-9g4a1d-venue-only-operational-restore-manual-execution`**

Operator-driven: load target row → set venue to restore value → G-9g4a1 Preview → ChatGPT gate → armed stack → one manual Save → confirm marker removed → result doc.

Follow-up: `G-9g4a1e-venue-only-operational-restore-post-execution-hardening` (after restore execution).
