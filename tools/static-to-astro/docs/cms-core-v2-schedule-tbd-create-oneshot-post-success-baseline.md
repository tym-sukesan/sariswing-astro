# CMS Core v2 — Schedule TBD CREATE oneshot post-success baseline

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline-recording`
- **Follow-up (2026-08-10):** cleanup DELETED_EXACT restored 79-row catalog · this 80-row snapshot **retained as history** · Doc: `cms-core-v2-schedule-tbd-create-oneshot-cleanup-result.md`
- **Date recorded:** 2026-08-08
- **Status:** **COMPLETE (docs / offline recording)** · historical **80-row / pre-cleanup** evidence (do not erase)
- **HEAD:** `cef4de140de121f53331e3d87ff4de32b2565f78` (oneshot SUCCESS docs commit)
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **untouched**
- **This phase (historical):** record SELECT-only post-success / pre-cleanup 80-row baseline

Prior: `cms-core-v2-schedule-tbd-create-oneshot-success-recording` · operator SELECT-only PASS

---

## 0. Gates (historical post-success / pre-cleanup snapshot)

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED: true
POST_SUCCESS_BASELINE_RECORDED: true
POST_SUCCESS_SELECT_ONLY_PASS: true
ACTUAL_WRITE_EXECUTED: true
TARGET_EXISTS: true
TARGET_ROW_EXACT: true
ONESHOT_TERMINAL: succeeded
ONESHOT_RERUN_FORBIDDEN: true
READY_FOR_RETRY: false
CLEANUP_EXECUTED_AT_THIS_PHASE: false
HISTORICAL_POST_SUCCESS_TOTAL: 80
HISTORICAL_POST_SUCCESS_TBD: 1
HISTORICAL_POST_SUCCESS_TARGET: 1
CURRENT_PUBLISHED_AT_POST_SUCCESS: 74
CURRENT_GOSAKI_AT_POST_SUCCESS: 80
CURRENT_MIO_AT_POST_SUCCESS: 0
CONTRACT_VIOLATIONS_AT_POST_SUCCESS: 0
POST_SUCCESS_SITE_SLUG_FP: 1d780b234483e3c860a66cec93311718
POST_SUCCESS_DATA_FP: 221256605d1501abc7cab3e044d54e2b
POST_SUCCESS_INDEX_FP: cbaada6b44ae2cd07f4a0516f9d0f9b3
POST_SUCCESS_TRIGGER_FP: 2e9899f09421456307b3c96402574106
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL: a4ff22feb81e19789732525937f4be7e
PRE_ONESHOT_DATA_FP_HISTORICAL: 1910b4faa5b17344d63968dc25f89cd6
PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL: e7344ff0de1d5e2862965ffc0e4e72cf
ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS: 79
CLEANUP_LATER_RECORDED: true
POST_CLEANUP_CURRENT_TOTAL: 79
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
NEXT_PRIMARY: see cleanup-result · PoC CLOSE_READY
```

---

## 1. Target row (SELECT-only)

| Item | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-11-001` |
| `site_slug` | `gosaki-piano` |
| `created_at` | `2026-08-08 11:25:17.007763+00` |
| `updated_at` | `2026-08-08 11:25:17.007763+00` |
| Inserted UUID | **not pasted** in operator packet (do not invent) |

---

## 2. Counts (post-success / pre-cleanup)

| Metric | Value |
| --- | ---: |
| schedules total | **80** |
| published | **74** |
| gosaki | **80** |
| mio | **0** |
| TBD | **1** |
| target | **1** |
| contract violations | **0** |

---

## 3. Fingerprints

| Kind | Post-success (80-row / pre-cleanup) | Historical pre-oneshot (79-row) |
| --- | --- | --- |
| site_slug_count | `1d780b234483e3c860a66cec93311718` | `a4ff22feb81e19789732525937f4be7e` |
| data | `221256605d1501abc7cab3e044d54e2b` | `1910b4faa5b17344d63968dc25f89cd6` |
| index | `cbaada6b44ae2cd07f4a0516f9d0f9b3` | `cbaada6b44ae2cd07f4a0516f9d0f9b3` (unchanged) |
| trigger | `2e9899f09421456307b3c96402574106` | `2e9899f09421456307b3c96402574106` (unchanged) |
| RLS | `3f6c87dda8edf44159d939ec69fbcc2b` | pre-writer `e7344ff0de1d5e2862965ffc0e4e72cf` · current site-writer same as post-success |

**Do not** erase this 80-row snapshot after cleanup. **Do not** rewrite `TBD_CREATE_ONESHOT_PREFLIGHT_BASELINE.totalSchedules=79`. Cleanup (2026-08-10) restored site_slug/data to historical 79-row values — see `cms-core-v2-schedule-tbd-create-oneshot-cleanup-result.md`.

---

## 4. Explicit non-actions (this historical phase)

- No SQL / DB write / DELETE / UPDATE by Cursor in this phase
- No oneshot re-execution · no arm / process / env
- Cleanup recorded separately · this doc remains pre-cleanup evidence
- Production untouched · commit/push only when operator requests
