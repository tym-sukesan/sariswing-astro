# Staging shell schedule site_slug operational general edit non-dry-run execution result (G-9g3g4)

**Phase:** `G-9g3g4-operational-non-dry-run-execution`
**Status:** **success — execution complete**
**Date:** 2026-06-18
**Prior:** G-9g3g4 runbook — commit `586a1de`
**Type:** operator manual non-dry-run Save — **one UPDATE on staging `public.schedules`**

| Check | Status |
| --- | --- |
| Save clicked | **yes** (operator manual, exactly once) |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **yes** (one row, description only) |
| SQL mutation executed (Cursor/AI) | **no** |
| Rollback SQL executed | **no** |
| service_role used | **no** |

Cursor did **not** click Save or Preview.
Operator performed Preview + Save manually.

**Do not re-click G-9g3g operational Save.** **Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditNonDryRunExecutionComplete: true
readyForG9g3g5PostExecutionHardening: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
rollbackSqlExecuted: false
rollbackNeeded: false
```

---

## 2. Summary (operator-confirmed)

```txt
Execution: PASS
Supabase project: static-to-astro-cms-staging
Active host: kmjqppxjdnwwrtaeqjta.supabase.co
G-9g3g ARMED: true
Preview dry-run: PASS (operator manual)
Save button clicked: yes (operator manual, exactly once)
DB write performed: yes (one UPDATE on public.schedules)
site_slug scoped: gosaki-piano
changedFields: ["description"] only
optimistic lock: PASS (expectedBeforeUpdatedAt matched; stale=false at preview)
description changed: yes (G-9g3g4 marker appended)
title / venue / open_time / start_time / price unchanged: yes
service_role used: false
production touched: false
/admin touched: false
FTP / workflow_dispatch: not executed
rollback needed: false
rollback executed: false
```

### Auth context

```txt
authStatus: signed-in
authEmail: ysktoyamax@gmail.com
mockRole: denied
note: local mock role denied, but Supabase Auth + RLS/admin_users verification proceeded
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

## 3. Execution context

```txt
Route:     /__admin-staging-shell/musician-basic/#schedule
URL:       http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
Section:   AdminStagingScheduleSiteSlugEditSection
site_slug: gosaki-piano
staging host:     kmjqppxjdnwwrtaeqjta.supabase.co
production host:  vsbvndwuajjhnzpohghh.supabase.co (blocked)
Approval ID: G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
Env arm:     PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
Write path:  executeG9G3gOperationalGeneralEditSave → executeScheduleGeneralUpdateWrite
changedFields: description only
```

### Target row

```txt
id:         888c58f2-f152-4563-a3cf-a20d7c2456c1
legacy_id:  schedule-2026-03-001
site_slug:  gosaki-piano
date:       2026-03-01
title:      <ごちまきトリオ>
venue:      銀座 N
open_time:  13:30
start_time: 14:00
price:      3,500円
source_route: /schedule/2026-03/
published:  true
show_on_home: false
sort_order: 48
```

### Planned payload

**Field:** `description` only

**Before (baseline — must match at execution):**

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

**After (candidate):**

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/\n[CMS Kit staging] G-9g3g4 operational Save test — temporary marker"
}
```

### Lock baseline (matched at execution)

```txt
expectedBeforeUpdatedAt: 2026-06-16T16:03:41.551792+00:00
after updated_at:         2026-06-18T16:35:45.060011+00:00
```

---

## 4. Live baseline check (operator — before Save)

**No SQL mutation.** Confirm via UI reload, row picker hydrate, and Preview result.

| # | Check | Pass criteria | Operator record |
| --- | --- | --- | --- |
| 1 | target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` | |
| 2 | legacy_id | `schedule-2026-03-001` | |
| 3 | site_slug | `gosaki-piano` | |
| 4 | title | `<ごちまきトリオ>` | |
| 5 | description (loaded) | matches §1 before exactly — **stop if different** | |
| 6 | updated_at | record from Preview `currentUpdatedAt` / optimistic lock | |
| 7 | active host | `kmjqppxjdnwwrtaeqjta.supabase.co` | |
| 8 | production host | **not** `vsbvndwuajjhnzpohghh.supabase.co` | |
| 9 | service_role | not used | |
| 10 | PoC audit row | **not** `aa440e29-…` | |

**Loaded from DB (read-only)** strip must show baseline description.
Edit only **Description → YOUR EDIT (CANDIDATE)**.

---

## 5. Required env stack (operator — Step 0)

Stop any routine dev server (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`, operational arm off).
Start with non-dry-run stack. **Do not commit** `.env` / `.env.local`. **Never use `service_role`.**

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Legacy PoC arms — must be **off**

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED                    — off
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED       — off
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED              — off
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED            — off
```

Single-arm: operational arm only.

---

## 6. Operator execution steps (runbook — completed)

### Step 0 — Arm dev server

1. Stop existing dev server if running routine dev env.
2. Start with §3 env stack (inline env; secrets not displayed in docs).
3. Confirm staging host in shell / UI — not production.

### Step 1 — Open staging shell

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
```

Sign in as staging admin if prompted.

### Step 2 — Select target row (row picker)

| Field | Expected |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| title | `<ごちまきトリオ>` |

Confirm hydrate strip shows correct id / legacy_id / site_slug.

### Step 3 — Set Description candidate

- Edit **only** `Description` → **YOUR EDIT (CANDIDATE)** → §1 after text.
- Do **not** change `Loaded from DB (read-only)`.
- Do **not** change title / venue / time / price.

### Step 4 — G-9 Preview (manual — once before Save)

**Press — OK:**

| Item | Value |
| --- | --- |
| Section | G-9 site_slug general edit |
| Button label | `Preview G-9 site_slug general edit dry-run` |
| Button id | `#site-slug-edit-dry-run-preview-btn` |
| Result panel title | `G-9 site_slug general edit preview result` |
| Result panel id | `#site-slug-edit-dry-run-result` |

**Expected preview result:**

| Check | Expected |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| optimisticLock.stale | `false` |
| optimisticLock.expectedBeforeUpdatedAt | equals `currentUpdatedAt` at Preview time |
| hostGatePassed | `true` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| payload | changed-fields-only; `description` only |
| after.description | includes G-9g3g4 marker |

**If any check fails → stop. Do not Save.**

### Step 5 — Confirm operational Save gate

**Save button:**

| Item | Value |
| --- | --- |
| Label | `Save operational general edit` |
| Button id | `#site-slug-edit-g9g3g-operational-save-btn` |
| Result panel id | `#site-slug-edit-g9g3g-operational-save-result` |
| Gate panel id | `#site-slug-edit-save-gate-panel` |

**Expected gate (all must pass before Save):**

| Check | Expected |
| --- | --- |
| Save button | **enabled** |
| approval ID | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true` |
| write dry-run | `false` |
| host gate | passed |
| auth | ok |
| preview stale | **false** |
| changedFields | `description` only |
| candidate / preview match | yes |

### Step 6 — Operator manual Save (once only)

**Press — OK (exactly once):**

```txt
Save operational general edit
#site-slug-edit-g9g3g-operational-save-btn
```

Do **not** double-click. Do **not** press any other Save.

### Step 7 — Record Save result

Copy JSON from `#site-slug-edit-g9g3g-operational-save-result` into §6 below after execution.

**Expected Save result:**

| Check | Expected |
| --- | --- |
| actualWrite | `true` |
| rowsAffected | `1` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| beforeSnapshot | recorded |
| payload | `{ "description": "…marker…" }` only |
| afterSnapshot | description contains marker |
| updated_at | changed from lock baseline |
| production | untouched |
| serviceRoleUsed | `false` |

### Step 8 — Restore routine dev (after successful Save)

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED unset or false
ENABLE_ADMIN_STAGING_WRITE=false (routine default)
```

Do **not** re-click operational Save.

---

## 7. Wrong buttons / panels — do not press

| Item | Reason |
| --- | --- |
| Legacy G-6 preview/update panels | Wrong approval path |
| `#schedule-dry-run-update-btn` | G-6-e2 — invalid |
| G-9g3d PoC Save `#site-slug-edit-g9g3d-save-btn` | Frozen PoC |
| G-9g3c / G-9g3b / G-9g2 PoC Save buttons | Legacy slice PoCs |
| Rollback SQL | G-9g3g5 or separate restore phase |
| FTP / deploy / workflow_dispatch | Out of scope |

---

## 8. Failure stop conditions (before Save)

**Stop immediately** if any occur:

- Wrong target row (id / legacy_id / title)
- Loaded description ≠ §1 baseline
- Preview `optimisticLock.stale=true`
- `changedFields` includes anything other than `description`
- Payload includes fields other than `description`
- `hostGatePassed=false`
- `activeHost` is not staging
- Production host displayed
- Save enabled for unknown reason
- Wrong `approvalId`
- Wrong env arm
- Preview stale message shown
- Candidate / preview mismatch
- Operator uncertainty — pause and re-read runbook

---

## 9. Execution result (operator-confirmed)

### Save result

```txt
actualWrite: true
rowsAffected: 1
approvalId: G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
changedFields: description only
serviceRoleUsed: false
expectedBeforeUpdatedAt: 2026-06-16T16:03:41.551792+00:00
```

### beforeSnapshot

```txt
description:
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

### payload

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/\n[CMS Kit staging] G-9g3g4 operational Save test — temporary marker"
}
```

### afterSnapshot

```txt
description:
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker

updated_at: 2026-06-18T16:35:45.060011+00:00
```

### Unchanged fields (expected)

```txt
id: 888c58f2-f152-4563-a3cf-a20d7c2456c1
legacy_id: schedule-2026-03-001
site_slug: gosaki-piano
title: <ごちまきトリオ>
venue: 銀座 N
open_time: 13:30
start_time: 14:00
price: 3,500円
source_route: /schedule/2026-03/
published: true
show_on_home: false
sort_order: 48
```

---

## 10. Rollback note

Rollback SQL template is in [preflight doc §8](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md).

**G-9g3g4:** rollback **not executed**. `rollbackNeeded: false` for PoC verification.
Rollback decision: **G-9g3g5-post-execution-hardening-and-restore-decision** or operator explicit judgment.

Cursor / AI does **not** execute rollback SQL.

---

## 11. Operator approval text (used before Save)

```txt
承認します。この操作を1回だけ実行してください。
G-9g3g4 operational general edit として、static-to-astro-cms-staging の public.schedules で、id=888c58f2-f152-4563-a3cf-a20d7c2456c1 / legacy_id=schedule-2026-03-001 / site_slug=gosaki-piano の1行について、description のみに G-9g3g4 marker を追記します。G-9 Preview 成功・optimistic lock 一致・operational arm のみ on の場合に1回だけ Save operational general edit を押します。他フィールド・他行・本番には触りません。
```

---

## 12. Routine dev after execution

Restart routine dev with dry-run default:

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED unset or false
ENABLE_ADMIN_STAGING_WRITE=false (routine default)
```

Do **not** re-click G-9g3g operational Save.

---

## 13. Next phase

**`G-9g3g5-post-execution-hardening-and-restore-decision`**

---

## 14. Git

```txt
G-9g3g4 runbook committed at: 586a1de
G-9g3g4 execution result: success (uncommitted)
```
