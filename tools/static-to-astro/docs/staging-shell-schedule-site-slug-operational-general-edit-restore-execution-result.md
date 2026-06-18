# Staging shell schedule site_slug operational general edit restore execution result (G-9g3g5c)

**Phase:** `G-9g3g5c-operational-restore-execution`  
**Status:** **operator pending**  
**Date:** 2026-06-18  
**Prior:** G-9g3g5b2 UI gate smoke passed — commit `3b113c5`  
**Type:** operator manual restore Save — **one UPDATE on staging `public.schedules` (planned)**

| Check | Status |
| --- | --- |
| Save clicked | **no** (not yet — operator execution pending) |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| SQL mutation executed (Cursor/AI) | **no** |
| Rollback SQL executed | **no** |
| restore executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-ui-gate-smoke-test-result.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-ui-gate-smoke-test-result.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md)
- [staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-run G-9g3g5b2 smoke Save.**

---

## Gates (pending — fill after operator execution)

```txt
stagingShellScheduleSiteSlugOperationalRestoreExecutionComplete: false
readyForG9g3g5dPostRestoreHardening: false
operatorPending: true
cursorClickedSave: false
cursorClickedPreview: false
restoreExecuted: false
dbWriteExecuted: false
markerRemainsInStagingDb: true
rollbackSqlExecuted: false
rollbackNeeded: false
serviceRoleUsed: false
productionUntouched: true
```

After successful operator restore Save, set `stagingShellScheduleSiteSlugOperationalRestoreExecutionComplete: true` and `readyForG9g3g5dPostRestoreHardening: true`.

**Next after success:** `G-9g3g5d-post-restore-hardening`

---

## 1. Execution context

```txt
Route:     /__admin-staging-shell/musician-basic/#schedule
URL:       http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
Section:   AdminStagingScheduleSiteSlugEditSection
site_slug: gosaki-piano
staging host:     kmjqppxjdnwwrtaeqjta.supabase.co
production host:  vsbvndwuajjhnzpohghh.supabase.co (blocked)
Approval ID: G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
Env arm:     PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true
Write path:  executeG9G3g5OperationalRestoreSave → executeScheduleGeneralUpdateWrite
changedFields: description only
```

### Target row

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| venue | `銀座 N` |
| open_time | `13:30` |
| start_time | `14:00` |
| price | `3,500円` |
| expected `updated_at` (lock baseline from G-9g3g5b2 smoke) | `2026-06-18T16:35:45.060011+00:00` |

### Current description (expected before restore — includes marker)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

### Restore candidate / planned after description (no marker)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

### Planned payload

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/"
}
```

---

## 2. Required env stack (operator execution)

```txt
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true
```

**Must be off:**

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED=false (or unset)
```

### Inline dev arm (operator — do not commit secrets)

Stop routine dev / G-9g3g operational arm server first:

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g5-schedule-site-slug-operational-restore-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key from local env — do not commit>" \
npm run dev
```

Do **not** print or commit anon keys. Do **not** use `service_role`.

---

## 3. Live baseline check (operator — before Preview / Save)

Operator must confirm **live** row state matches before proceeding.

| Check | How to verify | Expected |
| --- | --- | --- |
| target.id | Row picker + selected row strip | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | Row picker + selected row strip | `schedule-2026-03-001` |
| site_slug | Row picker + preview result | `gosaki-piano` |
| title | Loaded fields | `<ごちまきトリオ>` |
| current description | `Loaded from DB (read-only)` | includes `[CMS Kit staging] G-9g3g4 operational Save test — temporary marker` |
| current `updated_at` | Record from Step 4 Preview `optimisticLock.currentUpdatedAt` | must match `optimisticLock.expectedBeforeUpdatedAt` (baseline from smoke: `2026-06-18T16:35:45.060011+00:00` unless live differs — if differs, **STOP** and update lock baseline before Save) |
| staging host | Preview result `activeHost` / gate panel | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| production host | Must **not** appear as active | `vsbvndwuajjhnzpohghh.supabase.co` blocked |
| service_role | Save result safety flags (after Save) | `false` |

**If marker missing from Loaded description — STOP.** Do not Save.

---

## 4. Exact UI controls

### G-9 Preview (Step 4)

| Item | Value |
| --- | --- |
| Section | G-9 site_slug general edit |
| Preview button label | `Preview G-9 site_slug general edit dry-run` |
| Preview button id | `#site-slug-edit-dry-run-preview-btn` |
| Result panel title | `G-9 site_slug general edit preview result` |
| Result panel id | `#site-slug-edit-dry-run-result` |

### Restore Save (Step 5–6)

| Item | Value |
| --- | --- |
| Save button label | `Save operational general edit` |
| Save button id | `#site-slug-edit-g9g3g-operational-save-btn` |
| Save result panel id | `#site-slug-edit-g9g3g-operational-save-result` |
| Save gate panel id | `#site-slug-edit-save-gate-panel` |

Legacy G-6 panels — **not** used (`#schedule-dry-run-update-btn`, `G-6-e2-schedule-dry-run-ui`).

---

## 5. Operator execution steps

### Step 0 — Start dev server with restore env stack — **pending**

1. Stop existing dev server (routine dev or other arms).
2. Start with restore env stack §2.
3. Confirm staging host only; `service_role` not used.

**Operator result:** _pending_

---

### Step 1 — Open staging shell — **pending**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
```

Sign in as staging admin.

**Operator result:** _pending_

---

### Step 2 — Select target row — **pending**

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| title | `<ごちまきトリオ>` |

Do **not** select PoC audit row `aa440e29-5be8-402e-9190-0d81c48434c0`.

**Operator result:** _pending_

---

### Step 3 — Set Description candidate to restore candidate — **pending**

Edit **only** `Description` / `YOUR EDIT (CANDIDATE)`. Do **not** edit `Loaded from DB (read-only)`.

Restore candidate (no marker) — see §1.

**Operator result:** _pending_

---

### Step 4 — G-9 Preview (operator manual once) — **pending**

Press `#site-slug-edit-dry-run-preview-btn` once. Read `#site-slug-edit-dry-run-result`.

**Expected preview result:**

| Check | Expected |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| before.description | includes G-9g3g4 temporary marker |
| after.description | equals restore candidate (no marker) |
| optimisticLock.stale | `false` |
| optimisticLock.expectedBeforeUpdatedAt | equals `optimisticLock.currentUpdatedAt` |
| hostGatePassed | `true` |
| payload (changed-fields-only) | `{ "description": "<restore candidate>" }` only |

**Operator result:** _pending_

---

### Step 5 — Restore Save gate confirmation — **pending**

Before Save, confirm gate panel and Save button state.

**Expected:**

| Check | Expected |
| --- | --- |
| restore mode | `G-9g3g5 restore mode` enabled |
| approvalId | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true` |
| G-9g3g operational arm | off |
| host gate | passed |
| auth | staging admin signed in |
| preview | valid, not stale |
| changedFields | `description` only |
| marker-before / original-after | guards pass |
| candidate / preview match | yes |
| Save button | **enabled** |

**Operator result:** _pending_

---

### Step 6 — Operator manual restore Save once — **pending (G-9g3g5c execution only)**

Press **once**:

- Label: `Save operational general edit`
- Id: `#site-slug-edit-g9g3g-operational-save-btn`

**G-9g3g5c preparation:** Save **not** clicked.

**Operator result:** _pending_

---

### Step 7 — Record restore Save result — **pending**

Read `#site-slug-edit-g9g3g-operational-save-result`.

**Expected after successful Save:**

| Check | Expected |
| --- | --- |
| actualWrite | `true` |
| rowsAffected | `1` |
| approvalId | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| beforeSnapshot.description | includes temporary marker |
| payload.description | equals original description (no marker) |
| afterSnapshot.description | equals original description (no marker) |
| title / venue / open_time / start_time / price | unchanged |
| updated_at | changes from `2026-06-18T16:35:45.060011+00:00` |
| serviceRoleUsed | `false` |
| production | untouched |

**Operator result:** _pending_

---

## 6. Wrong buttons / panels — do not use

| Control | Rule |
| --- | --- |
| Legacy G-6 preview/update panels | **Do not use** |
| `#schedule-dry-run-update-btn` | **Do not click** |
| G-9g3g4 operational Save | **Do not re-click** |
| G-9g3d PoC Save (`#site-slug-edit-g9g3d-save-btn`) | **Do not click** |
| G-9g2 / G-9g3b / G-9g3c PoC Save | **Do not click** |
| SQL rollback | **Do not execute** |
| restore SQL (direct) | **Do not execute** — use UI restore Save only |
| FTP / deploy / workflow_dispatch | **Do not execute** |

---

## 7. Failure stop conditions (before Save)

**Stop immediately** if any of:

- Wrong target row (id / legacy_id / title mismatch)
- Current description **missing** G-9g3g4 temporary marker
- Current description unexpected vs §1
- Preview `optimisticLock.stale=true`
- `changedFields` includes anything other than `description`
- Payload includes fields other than `description`
- Preview `after.description` does not equal restore candidate
- `hostGatePassed=false`
- `activeHost` is not staging (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- Production host shown as active
- Approval ID is not `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`
- Restore env arm not `true`
- G-9g3g operational arm or any PoC arm also on
- Preview stale (`Preview is stale — run G-9 preview again`)
- Candidate / preview mismatch
- Operator uncertainty — stop and ask

```txt
stop immediately
do not retry Save
do not run rollback SQL
record incident
ask human
```

---

## 8. Post-restore next phase

After successful G-9g3g5c restore Save:

**`G-9g3g5d-post-restore-hardening`**

Confirm in G-9g3g5d:

- G-9g3g4 temporary marker **removed** from description
- Row picker / `CMS Kit staging` filter behavior restored for normal rows
- Routine dev env restored (restore arm off, dry-run on)
- Restore execution result committed
- Operational editor hardening / next slice planning

---

## 9. Operator pass record

_Fill after G-9g3g5c execution:_

| Field | Value |
| --- | --- |
| Operator | _pending_ |
| Date | _pending_ |
| Preview clicked (operator) | _pending_ |
| Save clicked | _pending_ |
| DB write | _pending_ |
| restore executed | _pending_ |
| after `updated_at` | _pending_ |
| Notes | _pending_ |

---

## 10. Git

```txt
G-9g3g5b2 committed at: 3b113c5
G-9g3g5c restore execution: operator pending (uncommitted)
```
