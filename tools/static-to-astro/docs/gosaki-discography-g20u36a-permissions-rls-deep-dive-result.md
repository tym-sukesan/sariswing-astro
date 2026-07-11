# G-20u36a-result — Gosaki Discography permissions / RLS deep-dive (execution record)

**Phase:** `G-20u36a-permissions-rls-deep-dive-result-record`  
**Status:** **complete** — operator SQL execution recorded · **RISK confirmed** · **do not proceed to Save**  
**Date:** 2026-07-11  
**Base commit:** `dfdd15e`  
**Prior:** G-20u36a-permissions-rls-deep-dive SELECT-only SQL prepared

| Check | Status |
| --- | --- |
| SQL executed | **yes** — human operator · Supabase SQL Editor |
| Executed by Cursor | **no** |
| Target project | **staging** `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| Production project | **not used** — `vsbvndwuajjhnzpohghh` **not executed** |
| SQL type | **SELECT-only** |
| DB write / SQL mutation | **not executed** |
| REVOKE / GRANT / RLS change | **not executed** |
| Edge deploy / Save / FTP | **not executed** |

---

## Gates

```txt
gosakiDiscographyPermissionsRlsDeepDiveResultRecorded: true
phase: G-20u36a-permissions-rls-deep-dive-result-record
effectiveWriteRiskHighest: RISK
hReviewSummaryProceedToRemediation: STOP
proceedToSave: false
proceedToDbWrite: false
proceedToEdgeDeploy: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
revokeGrantPolicyChangeExecuted: false
productionUploadStop: true
productionDbWriteStop: true
```

---

## Execution context

| Item | Value |
| --- | --- |
| SQL file | `scripts/supabase/gosaki-discography-g20u36a-permissions-rls-deep-dive.sql` |
| Executor | **Human operator** (not Cursor) |
| Environment | **staging only** |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Forbidden production ref | `vsbvndwuajjhnzpohghh` — **confirmed not used** |
| Tables | `public.discography` · `public.discography_tracks` |

---

## Result summary

| Outcome | Value |
| --- | --- |
| **Anon direct write grants** | **PASS** — 0 |
| **Authenticated UPDATE grants** | **NEEDS_REVIEW** — 2 (both tables) |
| **RLS enabled** | **PASS** — both tables |
| **Write-related RLS policies** | **2** — authenticated ALL + `is_admin()` |
| **Effective write risk (highest)** | **RISK** |
| **Review summary** | **STOP** — RISK confirmed |
| **Proceed to Save / DB write / Edge deploy** | **No** |

---

## Check results (recorded)

| check_key | status | expected | actual | Notes |
| --- | --- | --- | --- | --- |
| `B.grants.anon_write_count` | PASS | 0 | 0 | No anon INSERT/UPDATE/DELETE |
| `B.grants.authenticated_update_count` | NEEDS_REVIEW | 2 (known) | **2** | See §Authenticated UPDATE grants |
| `C.rls.both_tables_enabled` | PASS | true | true | RLS on both tables |
| `D.policies.write_related_count` | INFO | ≥0 | **2** | See §ALL policies |
| `E.risk.discography.authenticated_update` | **RISK** | — | authenticated UPDATE | Grant + ALL policy overlap |
| `E.risk.discography_tracks.authenticated_update` | **RISK** | — | authenticated UPDATE | Grant + ALL policy overlap |
| `E.risk.summary_highest` | **RISK** | PASS/NEEDS_REVIEW/RISK | **RISK** | Highest classification |
| `F.edge_only_write_path.browser_direct_write_grants` | NEEDS_REVIEW | anon=0; auth minimal | anon=0 · auth=2 | Conflicts with Edge-only ideal |
| `H.review_summary.proceed_to_remediation_planning` | **STOP** | review before REVOKE plan | **STOP — RISK confirmed** | Do not Save |

---

## RISK reason (primary)

### Overlap: authenticated UPDATE grant + authenticated ALL RLS policy

Both target tables expose a **direct authenticated client write path** when `is_admin()` is satisfied:

| Table | Table grant | RLS policy | Policy cmd | Policy roles | qual / with_check |
| --- | --- | --- | --- | --- | --- |
| `public.discography` | **authenticated** **UPDATE** | `discography_admin_all` | **ALL** | **authenticated** | `is_admin()` / `is_admin()` |
| `public.discography_tracks` | **authenticated** **UPDATE** | `discography_tracks_admin_all` | **ALL** | **authenticated** | `is_admin()` / `is_admin()` |

**Classification logic (E):**

- Table-level **UPDATE** grant present **and**
- RLS policy with cmd **ALL** (covers UPDATE) for role **authenticated** with `is_admin()` qual

→ **RISK** — an authenticated user satisfying `is_admin()` can UPDATE via PostgREST/browser Supabase client without Edge Function mediation.

**Impact:** Contradicts G-20u31+ **Edge-only write path** design (browser anon/auth direct write forbidden; writes via Edge Function + `service_role` internal).

---

## STOP reason (review gate)

### `H.review_summary.proceed_to_remediation_planning` — STOP

| Field | Value |
| --- | --- |
| **actual** | **STOP — RISK confirmed** |
| **Meaning** | Effective write risk highest = **RISK** on both tables |
| **Decision** | **Do not proceed** to Save · DB write · Edge Save deploy · G-20u36e |
| **Required next step** | **G-20u36a-permissions-remediation-plan** (doc only — no REVOKE/GRANT/RLS execution in planning phase) |

Prior G-20u36a-result STOP (authenticated UPDATE grants only) is **confirmed and escalated** by policy overlap analysis.

---

## Authenticated UPDATE grants (detail)

| # | Table | Grantee | Privilege | is_grantable |
| --- | --- | --- | --- | --- |
| 1 | `public.discography` | **authenticated** | **UPDATE** | (operator inventory) |
| 2 | `public.discography_tracks` | **authenticated** | **UPDATE** | (operator inventory) |

- **Expected for Save MVP (Edge-only):** no browser-facing authenticated UPDATE on discography tables
- **Actual:** 2 UPDATE grants — **not aligned** with least-privilege / Edge-only path

---

## ALL policies / `is_admin()` (detail)

| Policy | Table | cmd | roles | permissive | qual | with_check |
| --- | --- | --- | --- | --- | --- | --- |
| `discography_admin_all` | `discography` | **ALL** | `{authenticated}` | PERMISSIVE | `is_admin()` | `is_admin()` |
| `discography_tracks_admin_all` | `discography_tracks` | **ALL** | `{authenticated}` | PERMISSIVE | `is_admin()` | `is_admin()` |

**Interpretation:**

- cmd **ALL** includes SELECT, INSERT, UPDATE, DELETE
- Policies target **authenticated** role directly (not service_role-only)
- When JWT user passes `is_admin()`, RLS permits row operations including UPDATE
- Combined with table **UPDATE** grant → PostgREST direct write is **architecturally possible**

**Note:** Whether any staging user currently satisfies `is_admin()` is out of scope for this record — the **design risk** is sufficient to STOP Save readiness.

---

## Edge-only write path — contradiction

| Path | Ideal (G-20u31+) | Staging actual (this run) |
| --- | --- | --- |
| Browser **anon** direct write | **forbidden** | **PASS** — 0 anon write grants |
| Browser **authenticated** direct write | **forbidden** | **NEEDS_REVIEW/RISK** — 2 authenticated write grants + ALL policies |
| **service_role** | Edge Function internal only | Not browser-exposed (unchanged) |
| Save via Edge Function | Controlled path after permissions gate | **Blocked** until remediation |

**Judgment:** Current grants + policies allow **authenticated admin direct UPDATE** — conflicts with Edge-only write path. Remediation planning required before any Save phase.

---

## Decision (G-20u36a-permissions-rls-deep-dive-result)

| Question | Answer |
| --- | --- |
| Is effective write risk understood? | **Yes** — RISK confirmed |
| Proceed to Save / DB write? | **No** |
| Proceed to Edge Save deploy (G-20u36b)? | **No** |
| REVOKE / GRANT / RLS change now? | **No** — separate remediation plan phase |
| Next phase? | **G-20u36a-permissions-remediation-plan** |

---

## Not executed in this phase

- DB write / SQL mutation
- REVOKE / GRANT / RLS policy changes
- Edge Function deploy
- Save enablement
- Cursor SQL execution
- FTP / production changes

---

## Next phases (recommended)

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-remediation-plan** | REVOKE authenticated UPDATE grants · align RLS with Edge-only path · doc/plan only |
| **G-20u36b** | Edge dry-run endpoint deploy plan — **after permissions gate cleared** |
| **G-20u36e** | First controlled Save — **blocked until RISK/STOP resolved** |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-result-gosaki-discography-permissions-rls-deep-dive-result
npm run verify:current-active-regression
```
