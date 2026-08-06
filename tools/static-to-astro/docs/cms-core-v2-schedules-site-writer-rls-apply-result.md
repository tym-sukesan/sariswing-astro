# CMS Core v2 — schedules site-writer RLS staging apply result

- **Phase:** `cms-core-v2-schedules-site-writer-rls-apply-result-recording`
- **Date recorded:** 2026-08-06
- **Status:** **COMPLETE (docs / offline recording)**
- **HEAD at apply:** `3e5bc88f63f498bf9e673cea4e9985424947c747`
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` — **untouched**
- **This phase:** record human-applied staging RLS + live JWT probe · **no** Cursor SQL · **no** Schedule row write · **no** arm/Save/process · **no** commit/push by Cursor until operator asks

Prior: `cms-core-v2-schedule-site-owner-authz-rls-implementation.md` · apply readiness packet (read-only)

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULES_SITE_WRITER_RLS_APPLY_RESULT_RECORDED: true
RLS_MIGRATION_EXECUTED: true
RLS_POSTCHECK_PASS: true
post_apply_pass: true
post_live_probe_pass: true
OWNER_VISIBILITY_PASS: true
ANON_VISIBILITY_PASS: true
CAN_WRITE_SITE_PASS: true
SITE_WRITER_RLS_APPLIED: true
SCHEDULE_SITE_MAPPING_SAFE: true
CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT: 3f6c87dda8edf44159d939ec69fbcc2b
PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL: e7344ff0de1d5e2862965ffc0e4e72cf
POLICY_COUNT: 4
SCHEDULE_ROW_WRITE_EXECUTED: false
TARGET_ROW_EXISTS: false
ROLLBACK_EXECUTED: false
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: false
READY_FOR_RETRY: false
DB_WRITE_EXECUTED: false
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
NEXT_PRIMARY: cms-core-v2-schedule-tbd-create-oneshot-retry-readiness-gate (after this docs commit)
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
| Schedule INSERT/UPDATE/DELETE | **0** |
| Production | **unchanged** |

---

## 2. Data baseline (unchanged by RLS apply)

| Metric | Value |
| --- | ---: |
| schedules total | **79** |
| published | **74** |
| gosaki | **79** |
| TBD | **0** |
| target `schedule-2026-11-001` | **0** |

---

## 3. Live JWT probe (arms OFF · no INSERT)

| Probe | Result |
| --- | --- |
| `can_write_site` (gosaki-piano) | **true** |
| owner schedules total | **79** |
| anon schedules total | **74** |
| `post_live_probe_pass` | **true** |

Dev server stopped after probe. Write arms remained OFF. Oneshot CREATE **not** retried.

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
