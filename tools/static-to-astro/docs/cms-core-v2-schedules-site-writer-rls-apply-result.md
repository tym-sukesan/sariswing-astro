# CMS Core v2 — schedules site-writer RLS staging apply result

- **Phase:** `cms-core-v2-schedules-site-writer-rls-apply-result-recording`
- **Date recorded:** 2026-08-06 · **post-oneshot note:** 2026-08-08 · **post-success baseline:** 2026-08-08
- **Status:** **COMPLETE (docs / offline recording)** · oneshot CREATE later **SUCCESS** · post-success 80-row baseline **recorded**
- **HEAD at apply:** `3e5bc88f63f498bf9e673cea4e9985424947c747`
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **untouched**
- **This phase (historical):** record human-applied staging RLS + live JWT probe · **no** Cursor SQL at apply · Schedule row write came later via oneshot SUCCESS

Prior: `cms-core-v2-schedule-site-owner-authz-rls-implementation.md` · apply readiness packet (read-only)

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULES_SITE_WRITER_RLS_APPLY_RESULT_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED: true
RLS_MIGRATION_EXECUTED: true
RLS_POSTCHECK_PASS: true
post_apply_pass: true
post_live_probe_pass: true
OWNER_VISIBILITY_PASS: true
ANON_VISIBILITY_PASS: true
CAN_WRITE_SITE_PASS: true
SITE_WRITER_RLS_APPLIED: true
SITE_WRITER_RLS_RETAINED: true
SCHEDULE_SITE_MAPPING_SAFE: true
OWNER_WRITE_SUCCESS: true
LEGACY_PUBLIC_ADMIN_POLICIES_RETAINED: true
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL: e7344ff0de1d5e2862965ffc0e4e72cf
POST_SUCCESS_SITE_SLUG_FP: 1d780b234483e3c860a66cec93311718
POST_SUCCESS_DATA_FP: 221256605d1501abc7cab3e044d54e2b
POST_SUCCESS_INDEX_FP: cbaada6b44ae2cd07f4a0516f9d0f9b3
POST_SUCCESS_TRIGGER_FP: 2e9899f09421456307b3c96402574106
POST_CLEANUP_SITE_SLUG_FP: a4ff22feb81e19789732525937f4be7e
POST_CLEANUP_DATA_FP: 1910b4faa5b17344d63968dc25f89cd6
DATA_BASELINE_RESTORED: true
SITE_SLUG_BASELINE_RESTORED: true
PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL: a4ff22feb81e19789732525937f4be7e
PRE_ONESHOT_DATA_FP_HISTORICAL: 1910b4faa5b17344d63968dc25f89cd6
ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS: 79
POLICY_COUNT: 4
SCHEDULE_ROW_WRITE_AT_APPLY: false
SCHEDULE_ROW_WRITE_EXECUTED: true
TARGET_ROW_EXISTS: false
TARGET_ROW_EXACT: true
OUTCOME: INSERTED_EXACT
CLEANUP_DELETE_OUTCOME: DELETED_EXACT
CURRENT_TOTAL: 79
CURRENT_PUBLISHED: 74
CURRENT_GOSAKI: 79
CURRENT_TBD: 0
CURRENT_TARGET: 0
ROLLBACK_EXECUTED: false
RLS_ROLLBACK_EXECUTED: false
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: true
READY_FOR_RETRY: false
READY_FOR_CLEANUP: false
CLEANUP_EXECUTED: true
POC_CLOSE_READY: true
DB_WRITE_EXECUTED: true
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
NEXT_PRIMARY: PoC closed for row write · site-writer RLS remains current · no oneshot re-arm
```

---

## 1. Apply result (operator · staging)

| Item | Value |
| --- | --- |
| Applied at | **2026-08-06 01:28:23.744153+00** |
| Project | `kmjqppxjdnwwrtaeqjta` |
| Result | **SUCCESS** · `post_apply_pass=true` |
| Policies added | `schedules_site_writer_select` · `schedules_site_writer_insert` |
| Policies retained | `schedules_public_select` · `schedules_admin_all` |
| Policy count | **4** |
| Rollback | **not executed** |
| Schedule INSERT at apply time | **0** (`SCHEDULE_ROW_WRITE_AT_APPLY: false`) |
| Production | **unchanged** |

---

## 2. Data baseline at RLS apply (historical · unchanged by RLS)

| Metric | Value |
| --- | ---: |
| schedules total | **79** |
| published | **74** |
| gosaki | **79** |
| TBD | **0** |
| target `schedule-2026-11-001` | **0** |

---

## 2b. Post-oneshot then post-cleanup baselines

| Metric | Post-success (historical 80) | Post-cleanup (current) |
| --- | ---: | ---: |
| schedules total | **80** | **79** |
| published | **74** | **74** |
| gosaki | **80** | **79** |
| TBD | **1** | **0** |
| target `schedule-2026-11-001` | **1** | **0** |

| Fingerprint | Post-success (historical) | Post-cleanup (current / restored) |
| --- | --- | --- |
| site_slug_count | `1d780b234483e3c860a66cec93311718` | `a4ff22feb81e19789732525937f4be7e` |
| data | `221256605d1501abc7cab3e044d54e2b` | `1910b4faa5b17344d63968dc25f89cd6` |
| index | `cbaada6b44ae2cd07f4a0516f9d0f9b3` | unchanged |
| trigger | `2e9899f09421456307b3c96402574106` | unchanged |
| RLS | `3f6c87dda8edf44159d939ec69fbcc2b` | retained (site-writer · not rolled back) |

Docs: `cms-core-v2-schedule-tbd-create-oneshot-success-result.md` · `cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md` · `cms-core-v2-schedule-tbd-create-oneshot-cleanup-result.md`. No UPDATE/DELETE writer policies.
---

## 3. Live JWT probe at apply (arms OFF · no INSERT · historical)

| Probe | Result |
| --- | --- |
| `can_write_site` (gosaki-piano) | **true** |
| owner schedules total | **79** |
| anon schedules total | **74** |
| `post_live_probe_pass` | **true** |

Dev server stopped after probe. Write arms remained OFF at apply. Later (2026-08-08) oneshot CREATE **succeeded once** under these policies — see success-result doc. Re-run **forbidden**.

---

## 4. RLS fingerprints

| Role | Fingerprint | Use |
| --- | --- | --- |
| **Current staging baseline** (post site-writer apply) | `3f6c87dda8edf44159d939ec69fbcc2b` | oneshot preflight / final-preflight / verifier **current** expectation |
| **Historical pre-apply** (2 policies only) | `e7344ff0de1d5e2862965ffc0e4e72cf` | migration-before history · pre-apply records · **rollback** expectation if writer policies dropped |

Do **not** erase or rewrite past measured values in TBD date-migration apply completion (that phase recorded the pre-writer fingerprint as its then-current SoT).

---

## 5. Policy contract (applied)

- `schedules_public_select` — published only (anon **74**)
- `schedules_admin_all` — legacy `is_admin()` ALL
- `schedules_site_writer_select` — `site_slug` → `sites` → `can_write_site(id)`
- `schedules_site_writer_insert` — same WITH CHECK

No UPDATE/DELETE writer policies. Grants/helpers/`service_role` unchanged by this apply.

---

## 6. Explicit non-actions (this recording phase)

- Cursor did **not** re-run SQL / apply / rollback
- Schedule row write **0**
- arm ON / login / Save / process start / production / commit-push (until operator asks) **not** done
- `READY_FOR_RETRY=false` until dedicated retry-readiness gate after docs commit
