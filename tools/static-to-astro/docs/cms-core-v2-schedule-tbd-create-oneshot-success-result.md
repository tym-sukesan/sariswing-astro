# CMS Core v2 — Schedule TBD CREATE oneshot success result

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-success-recording`
- **Follow-up:** `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline-recording` (SELECT-only 80-row baseline fixed)
- **Date recorded:** 2026-08-08
- **Status:** **COMPLETE (docs / offline recording)** · post-success baseline **RECORDED**
- **HEAD at success docs commit:** `cef4de140de121f53331e3d87ff4de32b2565f78`
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **untouched**
- **This phase (historical):** record human oneshot CREATE SUCCESS · **no** cleanup/DELETE/UPDATE

Prior: site-writer RLS applied · final retry readiness `READY_FOR_RETRY: true` · operator executed CREATE once

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED: true
SUCCESS_RECORDED: true
POST_SUCCESS_BASELINE_RECORDED: true
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
POST_SUCCESS_SITE_SLUG_FP: 1d780b234483e3c860a66cec93311718
POST_SUCCESS_DATA_FP: 221256605d1501abc7cab3e044d54e2b
POST_SUCCESS_INDEX_FP: cbaada6b44ae2cd07f4a0516f9d0f9b3
POST_SUCCESS_TRIGGER_FP: 2e9899f09421456307b3c96402574106
PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL: a4ff22feb81e19789732525937f4be7e
PRE_ONESHOT_DATA_FP_HISTORICAL: 1910b4faa5b17344d63968dc25f89cd6
ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS: 79
TARGET_CREATED_AT: 2026-08-08 11:25:17.007763+00
TARGET_UPDATED_AT: 2026-08-08 11:25:17.007763+00
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
NEXT_PRIMARY: cleanup requires separate explicit approval only (READY_FOR_CLEANUP false)
POST_SUCCESS_BASELINE_DOC: cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md
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
| Inserted UUID | **not pasted** (do not invent) |
| `created_at` / `updated_at` | `2026-08-08 11:25:17.007763+00` |
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

## 7. Post-success baseline (SELECT-only PASS)

Full detail: `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md`.

| Kind | Post-success (80 / pre-cleanup) | Historical pre-oneshot (79) |
| --- | --- | --- |
| site_slug_count | `1d780b234483e3c860a66cec93311718` | `a4ff22feb81e19789732525937f4be7e` |
| data | `221256605d1501abc7cab3e044d54e2b` | `1910b4faa5b17344d63968dc25f89cd6` |
| index | `cbaada6b44ae2cd07f4a0516f9d0f9b3` | unchanged |
| trigger | `2e9899f09421456307b3c96402574106` | unchanged |
| RLS | `3f6c87dda8edf44159d939ec69fbcc2b` | current site-writer (unchanged by INSERT) |

After cleanup, re-SELECT fingerprints in a dedicated phase — do not assume values here.

---

## 8. Explicit non-actions (this recording phase)

- No process / env / arm / SQL / DB write / cleanup by Cursor
- No oneshot re-execution
- Production untouched
- Commit/push only when operator requests
