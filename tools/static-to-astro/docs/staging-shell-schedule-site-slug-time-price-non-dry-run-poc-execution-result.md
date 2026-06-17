# Staging shell schedule site_slug time + price non-dry-run PoC execution result (G-9g3c)

**Phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-execution`  
**Date:** 2026-06-17  
**Prerequisites:**
- [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-preflight.md)
- [staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md](./staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation.md)
- Implementation commit `37ba023`, preflight commit `1cf5817`

---

## 1. Purpose

Records the successful outcome of the G-9g3c Gosaki `site_slug` open_time + start_time + price non-dry-run write (`open_time` + `start_time` + `price` only, one staging row) via `AdminStagingScheduleSiteSlugEditSection` → `executeG9G3cTimePriceNonDryRunSave`.

Cursor did **not** click Save.  
Cursor did **not** execute Supabase SQL.  
Playwright / Chromium auto-click was **not** used.

---

## 2. Summary

```txt
Execution: PASS
Supabase project: static-to-astro-cms-staging
Active host: kmjqppxjdnwwrtaeqjta.supabase.co
G-9g3c ARMED: true
Preview dry-run: PASS (operator-confirmed)
Save button clicked: yes (operator manual, exactly once)
cursorClickedSave: false
DB write performed: yes (one UPDATE on public.schedules)
site_slug scoped: gosaki-piano
changedFields: ["open_time", "start_time", "price"] only
optimistic lock: PASS (expectedBeforeUpdatedAt matched; actualWrite=true)
title unchanged: yes
venue unchanged: yes
description unchanged: yes
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
Approval ID: G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
Env arm: PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true
Target id: aa440e29-5be8-402e-9190-0d81c48434c0
Target legacy_id: schedule-2026-07-010
Target site_slug: gosaki-piano
Write path: executeG9G3cTimePriceNonDryRunSave → updateScheduleWrite (writeScope)
UPDATE scope: id + site_slug + legacy_id + updated_at (optimistic lock)
Session: authenticated staging Supabase Auth (operator)
G-9g2 / G-9g3b / G-6 arms: off
```

---

## 4. Before snapshot (operator-confirmed at preview)

```json
{
  "title": "[CMS Kit staging] G-9g2 title PoC",
  "venue": "[CMS Kit staging] G-9g3b venue PoC",
  "open_time": null,
  "start_time": null,
  "price": null,
  "description": "出演： [G-9g3b venue+description PoC]",
  "updated_at": "2026-06-17T14:36:04.711395+00:00"
}
```

Dry-run preview:

```txt
actualWrite: false
wouldWrite: true
changedFields: open_time, start_time, price
optimisticLock.stale: false
optimisticLock.expectedBeforeUpdatedAt: 2026-06-17T14:36:04.711395+00:00
optimisticLock.currentUpdatedAt: 2026-06-17T14:36:04.711395+00:00
hostGatePassed: true
```

---

## 5. Result (operator-confirmed)

```txt
actualWrite: true
approvalId: G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
errorCode: none
rowsAffected: 1
target table: public.schedules
target id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
site_slug: gosaki-piano
expectedBeforeUpdatedAt: 2026-06-17T14:36:04.711395+00:00
updated_at after Save: 2026-06-17T15:45:35.433566+00:00
changedFields: open_time, start_time, price only
```

### Payload

```json
{
  "open_time": "[CMS Kit staging] G-9g3c open PoC",
  "start_time": "[CMS Kit staging] G-9g3c start PoC",
  "price": "[CMS Kit staging] G-9g3c price PoC"
}
```

### After snapshot

```json
{
  "title": "[CMS Kit staging] G-9g2 title PoC",
  "venue": "[CMS Kit staging] G-9g3b venue PoC",
  "open_time": "[CMS Kit staging] G-9g3c open PoC",
  "start_time": "[CMS Kit staging] G-9g3c start PoC",
  "price": "[CMS Kit staging] G-9g3c price PoC",
  "description": "出演： [G-9g3b venue+description PoC]",
  "updated_at": "2026-06-17T15:45:35.433566+00:00"
}
```

### Safety flags

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false
}
```

---

## 6. Unchanged fields (verified)

```txt
title: [CMS Kit staging] G-9g2 title PoC
venue: [CMS Kit staging] G-9g3b venue PoC
description: 出演： [G-9g3b venue+description PoC]
source_route: /schedule/2026-07/ (expected)
published: true (expected)
show_on_home: false (expected)
```

Optional read-only SQL (staging project only — not executed by Cursor):

```sql
select
  id,
  legacy_id,
  site_slug,
  title,
  venue,
  open_time,
  start_time,
  price,
  description,
  source_route,
  published,
  show_on_home,
  updated_at
from public.schedules
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

---

## 7. Rollback SQL (retained — not executed)

Separate approval required. `rollbackNeeded: false` for PoC verification.

```sql
-- G-9g3c rollback — staging only; operator manual only
update public.schedules
set
  open_time = null,
  start_time = null,
  price = null
where id = 'aa440e29-5be8-402e-9190-0d81c48434c0'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-07-010';
```

---

## 8. Routine dev after execution

Dev server restored to routine dev safety:

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED: off (unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED: off (unset)
ENABLE_ADMIN_STAGING_WRITE: false
PUBLIC_ADMIN_WRITE_DRY_RUN: true
PUBLIC_SUPABASE_URL host: kmjqppxjdnwwrtaeqjta.supabase.co
```

Do **not** re-arm G-9g3c or re-click G-9g3c Save.  
Do **not** re-run G-9g2 or G-9g3b Save.

---

## 9. Gates

```txt
stagingShellScheduleTimePricePocExecutionSucceeded: true
stagingShellScheduleTimePricePocNotExecuted: false
readyForG9g3cExecution: false
readyForG9g3dGeneralEditConsolidationPlanning: true
readyForAnyDbWrite: false
rollbackNeeded: false
```

---

## 10. Next

**Do not re-run G-9g3c Save.**

All G-9g3 safe-field non-dry-run PoC slices are complete on the pilot row (G-9g2 title, G-9g3b venue+description, G-9g3c time+price).

Recommended next: **G-9g3d-staging-shell-schedule-site-slug-general-edit-consolidation-planning** — consolidate per-slice PoC Save paths into a single general edit UX inside `AdminStagingScheduleSiteSlugEditSection` (see [staging-shell-schedule-site-slug-safe-fields-edit-planning.md](./staging-shell-schedule-site-slug-safe-fields-edit-planning.md) §5.5).

Alternative deferred: next customer slice planning (YouTube embed CMS per G-9a) if general edit consolidation is deferred.

Lock baseline for any future write: `updated_at` = `2026-06-17T15:45:35.433566+00:00` (verify live before next Save).
