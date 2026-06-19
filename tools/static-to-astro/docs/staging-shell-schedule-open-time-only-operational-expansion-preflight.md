# Staging shell schedule open_time-only operational expansion preflight (G-9g4a2a1)

**Phase:** `G-9g4a2a1-open-time-only-operational-expansion-preflight`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a2a open_time-only implementation — commit `8ae0d1e`; G-9g4a1e venue-only round-trip — commit `3b807c8`  
**Type:** preflight / rollback planning / operator checklist only — **no Save, no Preview click by Cursor, no DB write, no SQL execution**

| Check | Status |
| --- | --- |
| Row picker clicked (Cursor/AI) | **no** |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Restore executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |
| `.env` / `.env.local` arm write | **no** |

Prior docs:

- [staging-shell-schedule-open-time-only-operational-expansion-implementation.md](./staging-shell-schedule-open-time-only-operational-expansion-implementation.md)
- [staging-shell-schedule-text-fields-operational-expansion-planning.md](./staging-shell-schedule-text-fields-operational-expansion-planning.md)
- [staging-shell-schedule-venue-only-operational-restore-result-finalization.md](./staging-shell-schedule-venue-only-operational-restore-result-finalization.md)

**G-9g4a2a2 open_time smoke execution is forbidden until operator completes Preview, checklist, and ChatGPT confirmation gates.**

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 / G-9g4a1 venue-only Save.**

---

## Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionPreflightComplete: true
readyForG9g4a2a2OpenTimeOnlyOperationalExpansionManualExecution: true
targetRowId: eb1f1898-5107-4deb-a6d5-a792e0ec3f69
markerRemainsInStagingDb: false
restoreRequired: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
rollbackSqlExecuted: false
```

**Recommended next:** `G-9g4a2a2-open-time-only-operational-expansion-manual-execution`

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
G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true
```

Distinct from G-9g4a1 venue-only and G-9g3g operational paths:

```txt
G-9g4a1-schedule-site-slug-venue-only-non-dry-run
G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
```

---

## 3. Target row (fixed — G-9g4a1 proven safe row)

Reuse the row validated by G-9g4a1 venue-only write → restore round-trip. **No venue marker remains.**

```txt
id:           eb1f1898-5107-4deb-a6d5-a792e0ec3f69
legacy_id:    schedule-2026-03-003
site_slug:    gosaki-piano
title:        <Live & Session>
date:         2026-03-08
source_route: /schedule/2026-03/
published:    true
```

Operator must load this row in row picker before G-9g4a2a Preview.

| Verification | Expected |
| --- | --- |
| target row id | `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` |
| legacy_id | `schedule-2026-03-003` |
| site_slug | `gosaki-piano` |

---

## 4. Current known state (post G-9g4a1e round-trip closure)

From G-9g4a1e venue-only operational restore result finalization:

```txt
venue:                    学芸大学 珈琲美学
open_time:                11:30
start_time:               12:30
price:                    3,850円(税込)
description:              (unchanged — not in scope)
updated_at:               2026-06-19T05:54:34.767498+00:00
markerRemainsInStagingDb: false
activeRestoreExceptionsCount: 0
```

### Fields that must remain unchanged by open_time-only Save

```txt
venue
start_time
price
description
title
date
published
image_url / home_image_url
source_route
month / year
site_slug
sort_order / home_order / show_on_home
```

---

## 5. Smoke candidate (open_time only)

```txt
before open_time:     11:30
candidate open_time:  11:30 [G-9g4a2a open_time smoke]
restore target:       11:30
```

### Smoke marker rules

| Rule | Detail |
| --- | --- |
| Suffix | `[G-9g4a2a open_time smoke]` appended to original open_time |
| Do **not** use `[CMS Kit staging]` alone | avoids PoC audit classification |
| Published row | open_time may appear on public schedule cards briefly |
| Post-smoke | **restore required** via same G-9g4a2a open_time-only path |
| Restore path | **not** G-9g3g5 operational restore |

---

## 6. Lock baseline / payload / changedFields

```txt
expectedBeforeUpdatedAt: 2026-06-19T05:54:34.767498+00:00
```

```json
payload: { "open_time": "11:30 [G-9g4a2a open_time smoke]" }
```

```txt
changedFields: ["open_time"]
```

Preview result must show:

```txt
actualWrite: false
changedFields: ["open_time"]
optimisticLock.stale: false
hostGatePassed: true
serviceRoleUsed: false
productionBlocked: true
```

---

## 7. beforeSnapshot (preflight-fixed)

```txt
id:           eb1f1898-5107-4deb-a6d5-a792e0ec3f69
legacy_id:    schedule-2026-03-003
site_slug:    gosaki-piano
title:        <Live & Session>
date:         2026-03-08
source_route: /schedule/2026-03/
venue:        学芸大学 珈琲美学
open_time:    11:30
start_time:   12:30
price:        3,850円(税込)
updated_at:   2026-06-19T05:54:34.767498+00:00
```

Operator confirms loaded row matches at Preview. If `updated_at` differs, re-run Preview and update lock baseline before Save.

---

## 8. Env stack / arm plan

### Routine dev (default — **this preflight and daily work**)

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

### G-9g4a2a execution-only stack (G-9g4a2a2 — operator arms for one Save window)

```txt
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

Extended execution stack (operator may also need staging shell / auth / provider flags — see G-9g4a1b runbook pattern):

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true
PUBLIC_SUPABASE_URL=https://kmjqppxjdnwwrtaeqjta.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<staging anon key — never commit>
```

### Arm mutual exclusion (mandatory)

**G-9g4a2a arm only on** during execution — G-9g4a1 / G-9g3g / G-9g3g5 arms must stay off.

| Arm | G-9g4a2a2 execution |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED` | **on** |
| `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` | **off** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **off** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | **off** |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC arms | **off** |
| `service_role` | **forbidden** |
| Production host | **blocked** |

**This preflight:** do **not** write arms to `.env` / `.env.local`; do **not** start dev server with execution stack; do **not** change env in this phase.

---

## 9. UI targets (G-9g4a2a open_time-only only)

| Panel / element | id |
| --- | --- |
| open_time-only Preview button | `#site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn` |
| Preview result | `#site-slug-edit-g9g4a2a-open-time-only-dry-run-result` |
| Save gate | `#site-slug-edit-g9g4a2a-open-time-only-save-gate-panel` |
| Save button | `#site-slug-edit-g9g4a2a-open-time-only-save-btn` |
| Save result | `#site-slug-edit-g9g4a2a-open-time-only-save-result` |

### Do not use

| Path | Reason |
| --- | --- |
| G-9g4a1 venue-only Save | wrong field / approval ID |
| G-9g3g general Save | wrong field / mutual exclusion |
| G-9g3g5 restore | wrong path — use G-9g4a2a open_time-only restore |
| G-6 buttons | frozen PoC slices |
| `/admin` | out of scope |
| production | blocked |

---

## 10. Preview checklist (operator — G-9g4a2a2)

- [ ] Staging host only (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- [ ] Signed in as staging admin
- [ ] Row `eb1f1898-5107-4deb-a6d5-a792e0ec3f69` loaded in picker
- [ ] `legacy_id` = `schedule-2026-03-003`
- [ ] `site_slug` = `gosaki-piano`
- [ ] Current `open_time` = `11:30` (before smoke)
- [ ] No `[CMS Kit staging]` marker in safe text fields
- [ ] Candidate `open_time` = `11:30 [G-9g4a2a open_time smoke]`
- [ ] Non-open_time fields unchanged vs loaded row
- [ ] Click `#site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn` **once** (operator manual)
- [ ] Preview result: `changedFields: ["open_time"]`
- [ ] Preview result: payload exactly `{ "open_time": "11:30 [G-9g4a2a open_time smoke]" }`
- [ ] `hostGatePassed=true`
- [ ] `optimisticLock.stale=false`
- [ ] `expectedBeforeUpdatedAt` = `2026-06-19T05:54:34.767498+00:00` (or record actual if row changed)
- [ ] **Paste Preview result to ChatGPT** before arming Save

---

## 11. Save checklist (operator — G-9g4a2a2)

- [ ] ChatGPT confirmed Preview gates passed
- [ ] Execution-only env stack armed (§8) — **G-9g4a2a arm only on**
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED` **off**
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` **off**
- [ ] `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` **off**
- [ ] `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- [ ] `approvalId` = `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run`
- [ ] Save gate panel shows `preview: valid`
- [ ] Click `#site-slug-edit-g9g4a2a-open-time-only-save-btn` **exactly once** (operator manual — not Cursor/AI)
- [ ] **Paste Save result to ChatGPT** before further action
- [ ] Record `after.open_time`, `after.updated_at`, `rowsAffected`
- [ ] Plan restore (§12) — smoke marker used → restore required

---

## 12. Restore checklist (post-smoke — future phase)

After G-9g4a2a2 smoke Save, restore via **same G-9g4a2a open_time-only path**:

```txt
changedFields: ["open_time"]
payload: { "open_time": "11:30" }
restore target open_time: 11:30
```

| Step | Requirement |
| --- | --- |
| Path | G-9g4a2a open_time-only UI — **not** G-9g3g5 |
| Preview | `#site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn` first |
| Approval | `G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run` |
| Env arm | `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true` |
| Lock | fresh `expectedBeforeUpdatedAt` from post-smoke Preview |
| Save | operator manual exactly once |
| Confirm | smoke marker removed from `open_time` |

**restore required:** yes (after smoke marker use)

---

## 13. Rollback SQL (document-only — DO NOT RUN)

```sql
-- DO NOT RUN during G-9g4a2a1 preflight.
-- Document-only emergency rollback template.
-- Prefer G-9g4a2a open_time-only UI restore path.
UPDATE public.schedules
SET
  open_time = '11:30',
  updated_at = '2026-06-19T05:54:34.767498+00:00'
WHERE id = 'eb1f1898-5107-4deb-a6d5-a792e0ec3f69'
  AND site_slug = 'gosaki-piano'
  AND legacy_id = 'schedule-2026-03-003'
  AND open_time = '11:30 [G-9g4a2a open_time smoke]';
```

| Policy | Detail |
| --- | --- |
| Execute | **forbidden** in preflight and by Cursor/AI |
| Preferred restore | G-9g4a2a open_time-only UI path |
| SQL role | emergency documentation only |

---

## 14. Safety requirements

```json
{
  "serviceRoleUsed": false,
  "productionBlocked": true,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false,
  "stagingOnly": true
}
```

- Save: operator manual exactly once per preview identity
- Re-click prevention active after Save success
- Preview consumed after Save success

---

## 15. Forbidden operations avoided (this phase)

| Operation | Status |
| --- | --- |
| Row picker click (Cursor/AI) | **no** |
| Save click (Cursor/AI) | **no** |
| Preview click (Cursor/AI) | **no** |
| DB write | **no** |
| SQL mutation / rollback execution | **no** |
| Restore execution | **no** |
| `.env` / `.env.local` arm write | **no** |
| Dev server with execution arms | **no** |
| FTP / deploy / workflow_dispatch | **no** |
| service_role | **no** |

---

## 16. Recommended next phase

**`G-9g4a2a2-open-time-only-operational-expansion-manual-execution`**

Operator-driven: load target row → edit open_time candidate → G-9g4a2a Preview → ChatGPT confirm → armed stack → one manual Save → result doc. Smoke marker → restore chain via same G-9g4a2a path.
