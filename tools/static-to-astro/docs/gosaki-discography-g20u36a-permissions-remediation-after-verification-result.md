# G-20u36a-result — Gosaki Discography permissions remediation after-verification (execution record)

**Phase:** `G-20u36a-permissions-remediation-after-verification-result-record`  
**Status:** **complete** — operator SQL execution recorded · **H.after_verification.summary = PASS** · **permissions remediation complete candidate**  
**Date:** 2026-07-11  
**Base commit:** `159cf92`  
**Prior:** G-20u36a-permissions-remediation-after-verification SQL prepared · manual REVOKE x2 executed

| Check | Status |
| --- | --- |
| After-verification SQL executed | **yes** — human operator · Supabase SQL Editor |
| Executed by Cursor | **no** |
| Target project | **staging** `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| Production project | **not used** — `vsbvndwuajjhnzpohghh` **not executed** |
| SQL type | **SELECT-only** |
| Additional REVOKE / GRANT / RLS change | **not executed** |
| Edge deploy / Save / FTP | **not executed** |

---

## Gates

```txt
gosakiDiscographyPermissionsRemediationAfterVerificationResultRecorded: true
phase: G-20u36a-permissions-remediation-after-verification-result-record
hAfterVerificationSummary: PASS
permissionsRemediationCompleteCandidate: true
effectiveWriteRiskAfter: NEEDS_REVIEW
effectiveWriteRiskNoLongerRisk: true
proceedToG20u36bEdgeDryRunDeployPlan: true
proceedToSave: false
proceedToDbWrite: false
proceedToEdgeDeploy: false
cursorSqlExecuted: false
revokeGrantPolicyChangeExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
productionUploadStop: true
productionDbWriteStop: true
```

---

## Execution context

| Item | Value |
| --- | --- |
| SQL file | `scripts/supabase/gosaki-discography-g20u36a-permissions-remediation-after-verification.sql` |
| Executor | **Human operator** (not Cursor) |
| Environment | **staging only** |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Forbidden production ref | `vsbvndwuajjhnzpohghh` — **confirmed not used** |
| Prior manual REVOKE | 2× REVOKE UPDATE (apply-manual-result recorded) |

---

## Result summary

| Outcome | Value |
| --- | --- |
| **`H.after_verification.summary`** | **PASS** |
| **`G.remediation_summary.permissions_complete_candidate`** | **PASS / true** |
| **authenticated UPDATE grants** | **0** (was 2 pre-REVOKE) |
| **anon write grants** | **0** |
| **SELECT grants** | **preserved** — anon 2 · authenticated 2 |
| **RLS enabled** | **true** — both tables |
| **Data baseline** | **4 / 34** · **discography-002 / 1 / 8** |
| **Effective write risk** | **NEEDS_REVIEW** — **no longer RISK** |
| **Admin ALL policies** | **2 remain** — future policy hardening candidate |
| **Save / Edge deploy executed** | **No** — still blocked until G-20u36b plan |

---

## Check results (recorded)

| check_key | status | expected | actual | Notes |
| --- | --- | --- | --- | --- |
| `B.grants.all_for_target_tables` | INFO | inventory | **4** | SELECT only — see §Grants |
| `B.grants.anon_select_present` | PASS | ≥2 | **2** | |
| `B.grants.anon_write_count` | PASS | 0 | **0** | |
| `B.grants.authenticated_select_present` | PASS | ≥2 | **2** | |
| `B.grants.authenticated_update_count` | PASS | 0 | **0** | **Resolved** — was 2 |
| `B.grants.no_insert_delete_grants` | PASS | 0 | **0** | |
| `C.rls.both_tables_enabled` | PASS | true | **true** | |
| `D.policies.admin_all_policies` | INFO | may remain | **2** | See §Policy hardening |
| `E.data.global_releases_tracks` | PASS | 4 / 34 | **4 / 34** | |
| `E.data.integrity_orphans_duplicates` | PASS | 0 / 0 / 0 | **0 / 0 / 0** | |
| `E.data.target_discography_002` | PASS | 1 / 8 | **1 / 8** | |
| `F.effective_write_risk.after_remediation` | **NEEDS_REVIEW** | no longer RISK | **NEEDS_REVIEW** | Grant layer fixed |
| `G.remediation_summary.permissions_complete_candidate` | **PASS** | true | **true** | |
| `H.after_verification.summary` | **PASS** | PASS | **PASS** | Final gate |

---

## Grants inventory (recorded — 4 rows)

| Table | Grantee | Privilege |
| --- | --- | --- |
| `public.discography` | **anon** | **SELECT** |
| `public.discography` | **authenticated** | **SELECT** |
| `public.discography_tracks` | **anon** | **SELECT** |
| `public.discography_tracks` | **authenticated** | **SELECT** |

No INSERT / UPDATE / DELETE grants on target tables for anon or authenticated.

---

## PASS reason (H.after_verification.summary)

All required post-REVOKE checks **PASS**:

- authenticated UPDATE grants = **0** (primary remediation goal)
- anon write grants = **0**
- SELECT grants preserved on both tables (anon + authenticated)
- RLS enabled on both tables
- Data baseline unchanged: **4/34** global · **discography-002/8** target · integrity **0/0/0**

**Permissions remediation complete candidate = true** — grant-layer RISK from G-20u36a deep-dive is **resolved**.

---

## NEEDS_REVIEW reason (F.effective_write_risk.after_remediation)

| Factor | State |
| --- | --- |
| Prior classification | **RISK** — UPDATE grant + ALL policy overlap |
| After REVOKE | **no longer RISK** at grant layer |
| Admin ALL policies | **Still present** (2) |

| Policy | Table |
| --- | --- |
| `discography_admin_all` | `discography` |
| `discography_tracks_admin_all` | `discography_tracks` |

**Interpretation:** Direct PostgREST UPDATE is **blocked at grant layer** (no table UPDATE privilege). ALL policies with `is_admin()` remain — if UPDATE grant were re-granted, RISK would return immediately.

**Future work:** Policy hardening (ALL → SELECT-only admin policies) — **deferred** · separate phase · not required for permissions gate clear.

---

## Permissions remediation complete candidate — judgment

| Question | Answer |
| --- | --- |
| Did REVOKE achieve intended grant cleanup? | **Yes** — authenticated UPDATE 2 → **0** |
| Is data baseline intact? | **Yes** |
| Is read path intact? | **Yes** — SELECT grants preserved |
| Is `H.after_verification.summary` PASS? | **Yes** |
| Is remediation **complete** for permissions gate? | **Yes — complete candidate** |
| Is policy hardening required now? | **No** — documented as future candidate |
| Proceed to G-20u36b Edge dry-run deploy plan? | **Yes** (planning phase only) |
| Proceed to Save / G-20u36e? | **No** — Edge dry-run path not ready |

---

## Decision (G-20u36a-permissions-remediation-after-verification-result)

| Path | Status |
| --- | --- |
| Permissions remediation gate | **Cleared (candidate confirmed)** |
| G-20u36b Edge dry-run endpoint deploy plan | **May proceed** |
| G-20u36e First Save | **Still blocked** |
| Edge Function deploy (live) | **Not executed** |
| Save UI enablement | **Not executed** |
| Additional REVOKE / GRANT / RLS change | **Not executed** |

---

## Not executed in this phase

- Additional REVOKE / GRANT
- RLS policy change
- DB data write
- Edge Function deploy
- Save enablement
- Cursor SQL execution
- FTP / production changes

---

## Next phases (recommended)

| Phase | Scope |
| --- | --- |
| **G-20u36b** | Edge dry-run endpoint deploy plan |
| **Policy hardening (future)** | ALL → SELECT-only admin policies — optional follow-up |
| **G-20u36e** | First controlled Save — after Edge path ready |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-result-gosaki-discography-permissions-remediation-after-verification-result
npm run verify:current-active-regression
```
