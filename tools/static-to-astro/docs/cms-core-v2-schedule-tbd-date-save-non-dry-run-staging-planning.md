# CMS Core v2 — Schedule TBD date Save non-dry-run staging planning

- **Phase:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning`
- **Date:** 2026-08-03
- **Status:** **COMPLETE (docs-only / offline verifier)**
- **Verdict:** planning locked · **READY_FOR_TBD_NON_DRY_RUN_IMPLEMENTATION: true**
- **This phase:** no runtime wire · no Edge deploy · no env ON · no DB write · no Save · no commit/push

Prior:

- dry-run COMPLETE — `cms-core-v2-schedule-tbd-date-save-dry-run.md`
- Admin UI connect COMPLETE
- staging migration apply COMPLETE (`date` nullable · `date_status`)
- Admin/Save planning COMPLETE

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_DATE_SAVE_NON_DRY_RUN_STAGING_PLANNING_COMPLETE: true
READY_FOR_TBD_NON_DRY_RUN_IMPLEMENTATION: true
READY_FOR_TBD_NON_DRY_RUN_EXECUTION: false
TBD_SAVE_WIRED: true
TBD_WRITE_ENABLED: false
RUNTIME_CHANGED: true
EDGE_CHANGED: false
ENV_CHANGED: false
DB_WRITE_EXECUTED: false
SAVE_EXECUTED: false
MIO_SEED_UNCHANGED: true
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution
IMPLEMENTATION_PHASE: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation
```

**Implementation supersedes planning “RUNTIME_CHANGED: false” inventory** — see `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md` (`IMPLEMENTATION_READY: true` · `ACTUAL_WRITE_READY: false`).

**Staging only:** `kmjqppxjdnwwrtaeqjta`

**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Current write paths (inventory)

### 1.1 Path A — Edge confirmed operational Save

| Item | Value |
| --- | --- |
| Edge | `gosaki-schedule-save-dry-run` · `SAVE_APPROVAL_ID=gosaki-schedule-operational-save` |
| Client arm | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` exact `"true"` |
| Server arm | `GOSAKI_SCHEDULE_SAVE_ARMED` exact `"true"` |
| Create | INSERT · `date` **required string** · **no** `date_status` |
| Edit | UPDATE safe fields + optimistic lock · **date forbidden** |
| Actor | JWT + `rpc('is_admin')` |
| Host | staging ref required · production throws |

**Not suitable for first TBD oneshot as-is:** Edge create allowlist still requires calendar `date`. Changing Edge now risks confirmed Save contract.

### 1.2 Path B — Staging shell adapters (G-6 / G-9 / G-22)

| Item | Value |
| --- | --- |
| Operator UI | `gosaki-staging-schedule-operator-ui.ts` |
| UPDATE | `buildScheduleLockedWriteRequest` → `updateScheduleWrite` |
| INSERT | `insertNewEventScheduleWrite` / `insertScheduleWrite` |
| Optimistic lock | UPDATE only · `expectedBeforeUpdatedAt` · staging trigger `schedules_set_updated_at` |
| Arms | slice `PUBLIC_ADMIN_…_NON_DRY_RUN_ARMED` + `PUBLIC_ADMIN_WRITE_DRY_RUN=false` + write stack |
| Host | `evaluateSupabaseHostGate` / allowlist · production blocked |
| Auth | signed-in staging session |

**G-22e CREATE precedent (recommended pattern):**

- approval: `G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice`
- env: `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED`
- inserted: `schedule-2026-09-001` · `published=false` · kept unpublished
- cleanup template: DELETE with `id` + `site_slug` + `legacy_id` + exact `title` + `published=false`

### 1.3 TBD helpers (today)

| Module | Role |
| --- | --- |
| `schedule-tbd-save-payload.mjs` | SoT payload · `tbd-v1` · dry-run via `tbdDryRunEnabled` without write |
| `schedule-tbd-save-dry-run.ts` | Local preview only · `tbdWriteEnabled: false` forced |
| Operator | TBD Save button **disabled** · Dry-run確認 only |

**Not wired:** Edge · `insertScheduleWrite` · `updateScheduleWrite` · `buildScheduleLockedWriteRequest`.

### 1.4 Staging schema (already applied)

- `date` nullable · `date_status` `confirmed`|`tbd` · consistency CHECKs
- Counts (migration completion): total **79** · published **74** · **mio 0** · tbd **0**

---

## 2. Recommended first oneshot: **CREATE-only** (Path B)

### 2.1 Decision

| Option | Verdict |
| --- | --- |
| **Shell CREATE-only (Path B), month-known TBD** | **SELECTED** |
| Edge CREATE first | Rejected for oneshot — Edge still date-required; higher blast radius on confirmed Save |
| UPDATE existing Gosaki row → TBD | Rejected — mutates one of 79; harder rollback semantics |
| CREATE + UPDATE same slice | Rejected — violate create/update separation |

**Why CREATE-only:**

1. Does not mutate existing confirmed rows (79 invariant).
2. Matches G-22e INSERT + exact-guard DELETE runbook.
3. No optimistic lock on INSERT (simpler oneshot).
4. Keeps confirmed UPDATE / Edge contracts untouched.
5. Mio remains 0 (`site_slug=gosaki-piano` only).

**Why not UPDATE in same phase:** different approval ID, lock semantics, and failure modes. Defer TBD UPDATE to a later slice.

### 2.2 Implementation target (next phase — not this phase)

Extend shell INSERT path only:

1. New approval ID (below) registered in `SCHEDULE_WRITE_APPROVAL_IDS`.
2. New dual arms (below).
3. Allow `ScheduleInsertWritePayload` / adapter to accept TBD create shape **only** when TBD create approval + arms match (fail-closed otherwise).
4. Wire operator 「TBD保存（one-shot）」**separate** from confirmed Save / G-22e Save.
5. Confirmed Save paths **unchanged**.
6. Edge Function **unchanged** in first implementation slice (optional later Edge TBD — separate phase).

---

## 3. Test row specification (locked)

| Field | Value | Rationale |
| --- | --- | --- |
| `site_slug` | `gosaki-piano` | staging Gosaki only |
| `legacy_id` | `schedule-2026-11-001` | unused month vs G-22e `2026-09`; exact cleanup key |
| `date_status` | `tbd` | TBD contract |
| `date` | `null` | CHECK consistency |
| `month` | `2026-11` | month-known |
| `year` | `2026` | derived |
| `source_route` | `/schedule/2026-11/` | existing route helper |
| `source_file` | `schedule-2026-11.html` | existing helper |
| `title` | `【CMS Kit staging】TBD create oneshot PoC` | unique marker |
| `venue` | `[CMS Kit staging] TBD create PoC venue` | marker |
| `description` | `[CMS Kit staging] TBD create oneshot — unpublished` | marker |
| `open_time` / `start_time` / `price` | `null` or short markers | optional |
| `published` | **`false`** | no public reflection |
| `show_on_home` | **`false`** | |
| `home_order` | **`null`** | |
| `sort_order` | `0` (or allocator max+10 if required by guard) | low visibility |

**Mode:** month-known TBD (not month-unknown) — clearer membership + non-null `source_route` for verification.

**Collision check (preflight SELECT-only, execution phase):**

```sql
-- SELECT-only
select id, legacy_id, title, published, date_status, date, month
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-11-001';
-- expect: 0 rows
```

**Public / package:** do not regen package / FTP; `published=false` so anon public lists exclude the row.

**Existing 79:** INSERT adds +1 unpublished · do not UPDATE/DELETE other rows.

**Mio 0:** never insert `mio-kisaragi-jazz`.

---

## 4. Dual arm (+ stack)

### 4.1 Required exact arms (implementation phase)

| Arm | Name | Parse | Role |
| --- | --- | --- | --- |
| Client UI arm | `PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED` | trimmed exact `"true"` | shows/enables oneshot Save UI |
| Server arm | `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED` | exact `"true"` (no trim / Family B preferred) | SSR/server gate · **not** `PUBLIC_` |
| Write capability | `tbdWriteEnabled` | exact boolean `true` (from SSR only when arms+staging) | payload builder write path |
| Dry-run off | `PUBLIC_ADMIN_WRITE_DRY_RUN` | must be exact `"false"` | leave default dry-run for routine |

Unset / false / `" true"` / boolean string mismatches → **Save disabled**.

### 4.2 Additional gates (all required)

| Gate | Rule |
| --- | --- |
| Staging URL | host/project **exact** `kmjqppxjdnwwrtaeqjta` client + server |
| Production | `vsbvndwuajjhnzpohghh` → **STOP** |
| Auth | signed-in staging session (operator) |
| Approval ID | `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` (register once) |
| Operation | **create only** · update TBD Save **not exposed** |
| Mutex | all other Schedule non-dry-run arms **OFF** (G-22e, G-9k, G-6-*, Edge `GOSAKI_SCHEDULE_SAVE_ARMED`, etc.) |
| Explicit operator approval | text form: `承認します。この操作を1回だけ実行してください。` + approval ID |

### 4.3 Keep false / off forever in planning → through routine work

- `tbdWriteEnabled` default false
- Edge `GOSAKI_SCHEDULE_SAVE_ARMED` false for this oneshot (do not piggyback Edge)
- Production env never armed

---

## 5. Runbook A–I

### A. 実行前 SELECT-only

**Do:**

```sql
-- staging only · SELECT-only
select count(*) as total from public.schedules;
select count(*) as mio from public.schedules where site_slug = 'mio-kisaragi-jazz';
select count(*) as gosaki from public.schedules where site_slug = 'gosaki-piano';
select count(*) as tbd from public.schedules where date_status = 'tbd';
select id from public.schedules
 where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-11-001';
```

**Success:** total ≥79 · mio=0 · tbd=0 · legacy target **0 rows**.

**STOP:** mio≠0 unexpected · legacy already exists · production URL.

### B. arms OFF 確認

**Do:** confirm all Schedule non-dry-run / Edge Save / TBD create arms unset or not `"true"`; `PUBLIC_ADMIN_WRITE_DRY_RUN` default true (or unset).

**Success:** operator Save for TBD create disabled; confirmed routine dry-run OK.

**STOP:** any unexpected arm true.

### C. arms ON 手順

**Do (operator machine only, staging):**

1. Set server arm `ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=true`
2. Set client arm `PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED=true`
3. Set `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
4. Ensure write stack flags match G-22e (staging shell + write + provider/module/approval ID)
5. Restart local/dev **once**
6. Confirm SSR inject: staging ref · `tbdWriteEnabled:true` · productionBlocked false
7. Confirm other arms still OFF

**Success:** TBD create oneshot UI armed; confirmed Save arms unchanged/off as designed.

**STOP:** production URL · arm parse not exact · mutex conflict.

### D. one-shot create payload

**Do:** local Dry-run確認 first (existing dry-run UI) with month-known `2026-11` + title marker.

Then build write payload via `buildScheduleTbdSavePayload` mode `tbd-v1` with `tbdWriteEnabled:true` (implementation).

**Expected shape:**

```json
{
  "date_status": "tbd",
  "date": null,
  "month": "2026-11",
  "year": 2026,
  "source_route": "/schedule/2026-11/",
  "source_file": "schedule-2026-11.html",
  "legacy_id": "schedule-2026-11-001",
  "site_slug": "gosaki-piano",
  "title": "【CMS Kit staging】TBD create oneshot PoC",
  "published": false,
  "show_on_home": false,
  "home_order": null
}
```

**Success:** dry-run preview matches · no `date` sentinel.

**STOP:** incomplete draft · date non-null · published true · wrong site_slug.

### E. Save 実行手順

**Do:**

1. Operator explicit approval text + approval ID match
2. Click TBD create Save **once** only
3. Cursor must **not** click Save / run SQL
4. Record: `insertedId`, `actualWrite`, `approvalId`, timestamps

**Success:** `actualWrite:true` · one INSERT · returned id.

**STOP / ambiguity:** timeout · non-JSON · unclear outcome → **stop · do not retry · do not cleanup · record · ask human** (destructive op policy).

### F. 実行後 SELECT-only 確認

```sql
select id, legacy_id, site_slug, date_status, date, month, title, published, source_route
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-11-001'
  and title = '【CMS Kit staging】TBD create oneshot PoC'
  and published = false
  and date_status = 'tbd'
  and date is null;
-- expect: exactly 1 row · id = insertedId

select count(*) as mio from public.schedules where site_slug = 'mio-kisaragi-jazz';
-- expect: 0

select count(*) as other_tbd from public.schedules
 where date_status = 'tbd' and legacy_id <> 'schedule-2026-11-001';
-- expect: 0
```

**Success:** exact 1 test row · mio 0 · no other TBD.

**STOP:** mismatch → do not broad-fix; ask human.

### G. exact rollback / cleanup

**Template only (execution phase; requires separate explicit approval):**

```sql
-- staging only · exact guards · ONE row
delete from public.schedules
where id = '<inserted_id>'
  and site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-11-001'
  and title = '【CMS Kit staging】TBD create oneshot PoC'
  and published = false
  and date_status = 'tbd'
  and date is null
  and month = '2026-11';
-- expect: DELETE 1
```

**Forbidden:** DELETE without id · UPDATE all TBD · `mirror --delete` · production.

**If oneshot kept for later inspection:** `rollbackNeeded:false` allowed (like G-22e keep) — document choice; still prefer cleanup before Mio seed apply.

### H. cleanup 後 SELECT-only

```sql
select count(*) from public.schedules
 where legacy_id = 'schedule-2026-11-001' and site_slug = 'gosaki-piano';
-- expect: 0
select count(*) from public.schedules where date_status = 'tbd';
-- expect: 0
select count(*) from public.schedules where site_slug = 'mio-kisaragi-jazz';
-- expect: 0
```

### I. arms 即時 OFF

**Do immediately after Save (success or fail/ambiguous):**

1. Unset both TBD create arms
2. Restore `PUBLIC_ADMIN_WRITE_DRY_RUN=true`
3. Restart routine dev
4. Confirm TBD Save UI disabled · `tbdWriteEnabled` false in SSR JSON

**Success:** cannot re-click oneshot.

**Priority:** on any anomaly, **arms OFF first**, then ask human.

---

## 6. Rollback / cleanup guards (summary)

| Guard | Required |
| --- | --- |
| `id` | exact inserted UUID |
| `site_slug` | `gosaki-piano` |
| `legacy_id` | `schedule-2026-11-001` |
| `title` | exact marker |
| `published` | `false` |
| `date_status` | `tbd` |
| `date` | `IS NULL` |
| `month` | `2026-11` |
| Broad DELETE/UPDATE | **forbidden** |
| Production | **forbidden** |

---

## 7. Risks (accurate)

| Risk | Mitigation |
| --- | --- |
| Extending INSERT payload breaks G-22e confirmed create | TBD fields only under TBD approval/arms; confirmed path types unchanged |
| Admin list filters hide null-date rows | Known; verify via SELECT + Admin auth read (may need filter fix in implementation — document if required) |
| Accidental publish / package | Force `published=false`; no package/FTP in oneshot |
| Arm left ON | Runbook I mandatory; verifier asserts default false |
| Ambiguous Save | stop · no retry · no cleanup · ask human |
| Edge confirmed regression | Edge **not** changed in first implementation |
| Mio seed / counts | gosaki-only insert; mio stays 0 |
| Weakening optimistic lock | CREATE has no lock; UPDATE TBD deferred |

---

## 8. Explicit non-goals (this planning + next implementation slice)

- TBD UPDATE Save
- Edge Function change / deploy
- Mio seed apply
- Production
- Broad cleanup
- Weakening confirmed Save / lock / arms policy

---

## 9. Next Primary

Final-preflight **COMPLETE** · SQL Editor PASS · execution-preparation **COMPLETE**.

Doc: `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.md` · `PREFLIGHT_PASS: true` · `ACTUAL_WRITE_READY: true` · `ACTUAL_WRITE_EXECUTED: false`.

**Next:** `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution` (operator: temporary 3 arms → Save once → arms OFF).

---

## 10. Verifier

npm: `verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning`
Safety Suite offline step registered.
