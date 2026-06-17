# Staging shell schedule site_slug title non-dry-run PoC execution result (G-9g2)

**Phase:** `G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-execution`  
**Date:** 2026-06-17  
**Prerequisites:**
- [staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md](./staging-shell-schedule-site-slug-title-non-dry-run-poc-preflight.md)
- Implementation commit `969822e`, preflight commit `29b8426`

---

## 1. Purpose

Records the successful outcome of the first G-9g2 Gosaki `site_slug` title non-dry-run write (`title` only, one staging row) via `AdminStagingScheduleSiteSlugEditSection` → `executeG9G2TitleNonDryRunSave`.

Cursor did **not** click Save.  
Cursor did **not** execute Supabase SQL.  
Playwright / Chromium auto-click was **not** used.

---

## 2. Summary

```txt
Execution: PASS
Supabase project: static-to-astro-cms-staging
Active host: kmjqppxjdnwwrtaeqjta.supabase.co
G-9g2 ARMED: true
Preview dry-run: PASS (operator-confirmed)
Save button clicked: yes (operator manual, exactly once)
DB write performed: yes (one UPDATE on public.schedules)
site_slug scoped: gosaki-piano
changedFields: ["title"] only
optimistic lock: PASS (stale=false at preview; actualWrite=true)
title changed: yes
other fields unchanged: expected (G-9c2c baseline)
service_role used: false
production touched: false
/admin touched: false
FTP / workflow_dispatch: not executed
rollback needed: false
rollback executed: false
```

---

## 3. Execution context

```txt
Route: /__admin-staging-shell/musician-basic/#schedule
Section: AdminStagingScheduleSiteSlugEditSection
Approval ID: G-9g2-schedule-site-slug-title-non-dry-run-poc
Env arm: PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=true
Target id: aa440e29-5be8-402e-9190-0d81c48434c0
Target legacy_id: schedule-2026-07-010
Target site_slug: gosaki-piano
Payload: { "title": "[CMS Kit staging] G-9g2 title PoC" }
Write path: executeG9G2TitleNonDryRunSave → updateScheduleWrite (writeScope)
UPDATE scope: id + site_slug + legacy_id + updated_at (optimistic lock)
Session: authenticated staging Supabase Auth (operator)
G-6-g1 / G-6-g2 arms: off
```

---

## 4. Before snapshot (operator-confirmed at preview)

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
site_slug: gosaki-piano
title: <>
venue: NULL
description: 出演：
source_route: /schedule/2026-07/
published: true
show_on_home: false
home_order: NULL
sort_order: 10
```

Dry-run preview:

```txt
actualWrite: false
changedFields: title
optimisticLock.stale: false
before.title: <>
after.title: [CMS Kit staging] G-9g2 title PoC
```

---

## 5. Result (operator-confirmed)

```txt
actualWrite: true
approvalId: G-9g2-schedule-site-slug-title-non-dry-run-poc
changedFields: title
title: [CMS Kit staging] G-9g2 title PoC
updated_at: 2026-06-17T06:12:13.105898+00:00
site_slug: gosaki-piano (unchanged)
legacy_id: schedule-2026-07-010 (unchanged)
```

### Payload

```json
{
  "title": "[CMS Kit staging] G-9g2 title PoC"
}
```

### Safety flags

```json
{
  "stagingOnly": true,
  "siteSlugScoped": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false,
  "ftpExecuted": false,
  "workflowDispatchTriggered": false
}
```

---

## 6. After verification (operator UI / optional SELECT)

Expected unchanged fields (G-9c2c baseline):

```txt
venue: NULL
description: 出演：
source_route: /schedule/2026-07/
published: true
show_on_home: false
home_order: NULL
sort_order: 10
```

Optional read-only SQL (staging project only — not executed by Cursor):

```sql
select
  id,
  legacy_id,
  site_slug,
  title,
  venue,
  description,
  source_route,
  published,
  show_on_home,
  home_order,
  sort_order,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

---

## 7. Rollback / restore SQL (retained — not executed)

Separate approval required. See preflight restore approval text.

```sql
-- G-9g2 restore — staging only; operator manual only
update public.schedules
set title = '<>'
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and legacy_id = 'schedule-2026-07-010'
  and site_slug = 'gosaki-piano';
```

`rollbackNeeded: false` for PoC verification. Restore is optional separate phase.

---

## 8. Routine dev after execution

Restart routine dev with dry-run default:

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED unset or false
```

Do **not** re-click G-9g2 Save.

---

## 9. Gates

```txt
stagingShellScheduleTitlePocExecutionSucceeded: true
stagingShellScheduleTitlePocNotExecuted: false
operatorG9g2TitlePocSaveExecuted: true
cursorClickedSave: false
cursorExecutedSql: false
rollbackNeeded: false
rollbackExecuted: false
readyForG9g2Restore: true
readyForG9g3OrNextSiteSlugSlice: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 10. Next

- Optional **G-9g2-restore** — separate approval; restore `title = <>`  
- Or defer restore; plan next site_slug edit slice (venue / description / time fields)
