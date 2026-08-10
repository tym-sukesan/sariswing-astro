# CMS Core v2 — Schedule TBD CREATE oneshot cleanup result

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-cleanup-recording`
- **Date recorded:** 2026-08-10
- **Status:** **COMPLETE (docs / offline recording)**
- **HEAD at recording start:** `7657e7290697f07d3fc22147f4d9a9604b358572`
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **untouched**
- **This phase:** record human cleanup DELETE SUCCESS · post-cleanup SELECT-only restore · **no** Cursor SQL · **no** re-delete · **no** RLS rollback · **no** arm/process · **no** commit/push by Cursor until operator asks

Prior: oneshot SUCCESS · post-success 80-row baseline · operator cleanup once

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED: true
CLEANUP_RECORDED: true
CLEANUP_EXECUTED: true
CLEANUP_DELETE_OUTCOME: DELETED_EXACT
CANDIDATE_ROWS: 1
DELETED_ROWS: 1
RETRY_REDELETE: false
POST_CLEANUP_PASS: true
TARGET_EXISTS: false
CURRENT_TOTAL: 79
CURRENT_PUBLISHED: 74
CURRENT_GOSAKI: 79
CURRENT_MIO: 0
CURRENT_TBD: 0
CURRENT_TARGET: 0
CONTRACT_VIOLATIONS: 0
DATA_BASELINE_RESTORED: true
SITE_SLUG_BASELINE_RESTORED: true
POST_CLEANUP_SITE_SLUG_FP: a4ff22feb81e19789732525937f4be7e
POST_CLEANUP_DATA_FP: 1910b4faa5b17344d63968dc25f89cd6
POST_CLEANUP_INDEX_FP: cbaada6b44ae2cd07f4a0516f9d0f9b3
POST_CLEANUP_TRIGGER_FP: 2e9899f09421456307b3c96402574106
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
SITE_WRITER_RLS_RETAINED: true
RLS_ROLLBACK_EXECUTED: false
ONESHOT_SUCCESS_HISTORY_RETAINED: true
POST_SUCCESS_80_ROW_BASELINE_RETAINED: true
ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS: 79
ONESHOT_TERMINAL: succeeded
ONESHOT_RERUN_FORBIDDEN: true
READY_FOR_RETRY: false
ACTUAL_WRITE_READY: false
POC_CLOSE_READY: true
OBSERVED_AT: 2026-08-10 00:33:33.416919+00
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
NEXT_PRIMARY: PoC closed for row write · site-writer RLS remains current · no oneshot re-arm
```

---

## 1. Cleanup summary (operator · staging)

| Item | Value |
| --- | --- |
| Outcome | **DELETED_EXACT** |
| `legacy_id` | `schedule-2026-11-001` |
| `site_slug` | `gosaki-piano` |
| candidate_rows | **1** |
| deleted_rows | **1** |
| Retry / re-delete | **none** |
| Observed at | `2026-08-10 00:33:33.416919+00` |
| RLS rollback | **not executed** · site-writer policies **retained** |

---

## 2. Counts post-cleanup

| Metric | Post-success (historical) | Post-cleanup (current) |
| --- | ---: | ---: |
| schedules total | 80 | **79** |
| published | 74 | **74** |
| gosaki | 80 | **79** |
| mio | 0 | **0** |
| TBD | 1 | **0** |
| target | 1 | **0** |
| contract violations | 0 | **0** |

---

## 3. Fingerprints

| Kind | Post-cleanup (current / restored) | Post-success 80-row (historical · retained) |
| --- | --- | --- |
| site_slug_count | `a4ff22feb81e19789732525937f4be7e` | `1d780b234483e3c860a66cec93311718` |
| data | `1910b4faa5b17344d63968dc25f89cd6` | `221256605d1501abc7cab3e044d54e2b` |
| index | `cbaada6b44ae2cd07f4a0516f9d0f9b3` | unchanged |
| trigger | `2e9899f09421456307b3c96402574106` | unchanged |
| RLS | `3f6c87dda8edf44159d939ec69fbcc2b` | unchanged (site-writer retained) |

`DATA_BASELINE_RESTORED: true` · `SITE_SLUG_BASELINE_RESTORED: true` — match pre-oneshot / TBD-migration apply-completion historical values.

---

## 4. What stays (do not erase)

- Oneshot SUCCESS history (`cms-core-v2-schedule-tbd-create-oneshot-success-result.md`)
- Post-success 80-row baseline (`cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md`)
- Site-writer RLS current (`3f6c87dda8edf44159d939ec69fbcc2b`)
- Fixed oneshot guard `totalSchedules=79` (historical contract · re-run forbidden)

---

## 5. Explicit non-actions (this recording phase)

- No Cursor SQL / DB write / DELETE / UPDATE / cleanup re-run
- No oneshot re-arm / retry
- No RLS rollback
- Production untouched · commit/push only when operator requests
