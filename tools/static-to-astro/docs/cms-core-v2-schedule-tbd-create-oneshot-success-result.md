# CMS Core v2 — Schedule TBD CREATE oneshot success result

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-success-recording`
- **Date recorded:** 2026-08-08
- **Status:** **COMPLETE (docs / offline recording)**
- **HEAD at recording start:** `a14b6a8aa21af862e1c55156a0d8cd2200350667`
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **untouched**
- **This phase:** record human oneshot CREATE SUCCESS · **no** Cursor SQL · **no** cleanup/DELETE/UPDATE · **no** arm/process · **no** commit/push by Cursor until operator asks

Prior: site-writer RLS applied · final retry readiness `READY_FOR_RETRY: true` · operator executed CREATE once

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED: true
SUCCESS_RECORDED: true
OUTCOME: INSERTED_EXACT
ACTUAL_WRITE_EXECUTED: true
SCHEDULE_ROW_WRITE_EXECUTED: true
TARGET_ROW_EXISTS: true
TARGET_ROW_EXACT: true
ONESHOT_TERMINAL: succeeded
ONESHOT_RERUN_FORBIDDEN: true
READY_FOR_RETRY: false
CLEANUP_EXECUTED: false
READY_FOR_CLEANUP: false
CURRENT_TOTAL: 80
CURRENT_PUBLISHED: 74
CURRENT_GOSAKI: 80
CURRENT_MIO: 0
CURRENT_TBD: 1
CURRENT_TARGET: 1
CONTRACT_VIOLATIONS: 0
SITE_WRITER_RLS_APPLIED: true
OWNER_AUTHZ_PATH_USED: sites -> can_write_site -> preflight -> INSERT
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
DATA_SITE_SLUG_FINGERPRINT_POST_SUCCESS: pending-select-only
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
NEXT_PRIMARY: cms-core-v2-schedule-tbd-create-oneshot-post-success-select-only-fingerprint (SELECT-only · capture inserted id + data/site_slug fps)
```

---

## 1. Success summary (operator)

| Item | Value |
| --- | --- |
| Outcome | **INSERTED_EXACT** |
| Approval | `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` |
| `legacy_id` | `schedule-2026-11-001` |
| `site_slug` | `gosaki-piano` |
| `published` | **false** |
| `show_on_home` | **false** |
| `date_status` / `date` | `tbd` / `null` |
| Terminal | **succeeded** · re-click / re-arm **forbidden** |
| Server | stopped · **4321** not LISTEN |
| Inserted UUID | **pending SELECT-only** (not pasted in this chat · do not invent) |
| Exact success timestamptz | **pending SELECT-only** (`created_at` / `updated_at` of target row) |
| Operator confirm day | **2026-08-08** (recording session) |

---

## 2. Counts before → after

| Metric | Before | After |
| --- | ---: | ---: |
| schedules total | 79 | **80** |
| published | 74 | **74** |
| gosaki | 79 | **80** |
| mio | 0 | **0** |
| TBD (`date_status=tbd`) | 0 | **1** |
| target legacy row | 0 | **1** |
| contract violations | 0 | **0** |

Pre-insert oneshot preflight baseline (`TBD_CREATE_ONESHOT_PREFLIGHT_BASELINE.totalSchedules=79`) remains the **historical runtime gate** for that completed oneshot — **do not** rewrite guards to 80 (re-run must stay blocked).

---

## 3. Authz path that succeeded

1. Fixed guards / payload / fingerprint / approval
2. Signed-in gosaki-piano **site owner** (not legacy `admin_users` / `is_admin`)
3. `sites` resolve `site_slug=gosaki-piano` → exactly one id
4. `rpc('can_write_site', { p_site_id }) === true`
5. Preflight counts (79 / mio0 / tbd0 / target0)
6. Same authenticated singleton → INSERT max 1

Site-writer RLS: `schedules_site_writer_select` + `schedules_site_writer_insert` enabled owner write. `schedules_public_select` + `schedules_admin_all` retained. No UPDATE/DELETE writer policies. No `service_role`.

---

## 4. Failures resolved on the path to success

| Prior failure | Resolution |
| --- | --- |
| Preflight intermediate `.eq()` await → false ambiguous | query-builder fix (`050789d` lineage) |
| Preflight before auth → got **74** published | auth-before-preflight + shared client |
| Owner conflated with legacy `is_admin` | site-scoped `can_write_site` + site-writer RLS |

---

## 5. Exact payload contract (unchanged SoT)

Fixed INSERT allowlist matches `buildTbdCreateOneshotFixedInsertPayload()` / final-preflight §6 JSON (`legacy_id`, `site_slug`, TBD null date, `published=false`, title/venue/description markers, month `2026-11`, …). Operator: **inserted row exact match**.

---

## 6. Cleanup

- **Not executed** · **not approved**
- Manual rollback (separate approval only):
  `DELETE FROM public.schedules WHERE site_slug='gosaki-piano' AND legacy_id='schedule-2026-11-001';`
  (assert count=1 first · staging only)
- `READY_FOR_CLEANUP: false`

---

## 7. Next: SELECT-only fingerprint refresh (no write)

Data / `site_slug` catalog fingerprints **changed** because a row was inserted. RLS policy fingerprint `3f6c87dda8edf44159d939ec69fbcc2b` may stay valid (policies unchanged).

```sql
-- staging only · SELECT-only · do not paste UUID/email in chat if sharing counts only
select id, created_at, updated_at, legacy_id, site_slug, date_status, date,
       published, show_on_home, title, month
from public.schedules
where site_slug = 'gosaki-piano'
  and legacy_id = 'schedule-2026-11-001';
-- Expect: exactly 1 row

select
  (select count(*) from public.schedules) as total,
  (select count(*) from public.schedules where published = true) as published,
  (select count(*) from public.schedules where site_slug = 'gosaki-piano') as gosaki,
  (select count(*) from public.schedules where site_slug = 'mio-kisaragi-jazz') as mio,
  (select count(*) from public.schedules where coalesce(date_status,'confirmed') = 'tbd') as tbd,
  (select count(*) from public.schedules
     where site_slug = 'gosaki-piano' and legacy_id = 'schedule-2026-11-001') as target;

-- Expect: 80 / 74 / 80 / 0 / 1 / 1

-- Then re-run existing data + site_slug md5 fingerprint queries from TBD migration gate SoT;
-- record NEW values as POST_ONESHOT baseline (do not rewrite pre-oneshot history).
```

---

## 8. Explicit non-actions (this recording phase)

- No process / env / arm / SQL / DB write / cleanup by Cursor
- No oneshot re-execution
- Production untouched
- Commit/push only when operator requests
