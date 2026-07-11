# G-20u36a-result — Gosaki Discography permissions remediation preflight (execution record)

**Phase:** `G-20u36a-permissions-remediation-preflight-result-record`  
**Status:** **complete** — operator SQL execution recorded · **READY_FOR_MANUAL_REVOKE** · **REVOKE not executed**  
**Date:** 2026-07-11  
**Base commit:** `a8b7ac0`  
**Prior:** G-20u36a-permissions-remediation-preflight-select-only SQL prepared

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
gosakiDiscographyPermissionsRemediationPreflightResultRecorded: true
phase: G-20u36a-permissions-remediation-preflight-result-record
preflightSummary: READY_FOR_MANUAL_REVOKE
revokeExecuted: false
proceedToManualRevoke: true
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
| SQL file | `scripts/supabase/gosaki-discography-g20u36a-permissions-remediation-preflight-select-only.sql` |
| Executor | **Human operator** (not Cursor) |
| Environment | **staging only** |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Forbidden production ref | `vsbvndwuajjhnzpohghh` — **confirmed not used** |
| Target `site_slug` | `gosaki-piano` |
| Target `legacy_id` | `discography-002` |

---

## Result summary

| Outcome | Value |
| --- | --- |
| **Preflight gate** | **READY_FOR_MANUAL_REVOKE** |
| **H.preflight_summary.any_stop** | **READY_FOR_MANUAL_REVOKE** |
| **Authenticated UPDATE grants (pre-revoke)** | **2** — expected |
| **Anon write grants** | **0** — PASS |
| **SELECT grants** | **preserved** — anon 2 · authenticated 2 |
| **RLS enabled** | **true** — both tables |
| **Data baseline** | **4 / 34** releases/tracks · **1 / 8** target |
| **REVOKE executed** | **No** |
| **Proceed to Save / Edge deploy** | **No** — still blocked |

---

## Check results (recorded)

| check_key | status | expected | actual | Notes |
| --- | --- | --- | --- | --- |
| `B.grants.anon_select_present` | PASS | ≥2 | **2** | Both tables |
| `B.grants.anon_write_count` | PASS | 0 | **0** | |
| `B.grants.authenticated_select_present` | PASS | ≥2 | **2** | Both tables |
| `B.grants.authenticated_update_count` | PASS | 2 | **2** | Pre-revoke expected |
| `B.grants.no_insert_delete_grants` | PASS | 0 | **0** | |
| `C.rls.both_tables_enabled` | PASS | true | **true** | |
| `D.policies.admin_all_policies` | PASS | 2 | **2** | See §Admin policies |
| `E.data.global_releases_tracks` | PASS | 4 / 34 | **4 / 34** | `gosaki-piano` |
| `E.data.integrity_orphans_duplicates` | PASS | 0 / 0 / 0 | **0 / 0 / 0** | |
| `E.data.target_discography_002` | PASS | 1 / 8 | **1 / 8** | |
| `F.apply_readiness.ready_for_manual_revoke` | **READY_FOR_MANUAL_REVOKE** | all checks PASS | **READY_FOR_MANUAL_REVOKE** | See §Decision |
| `F.apply_readiness.revoke_target_inventory` | INFO | 2 targets | **2** | See §REVOKE targets |
| `H.preflight_summary.any_stop` | **READY_FOR_MANUAL_REVOKE** | READY or STOP | **READY_FOR_MANUAL_REVOKE** | No STOP flags |

---

## READY_FOR_MANUAL_REVOKE judgment

All preflight checks **PASS**. Staging DB state **matches remediation plan expectations** before manual REVOKE:

- authenticated UPDATE grants = **2** (revoke candidates — not yet removed)
- anon write grants = **0**
- SELECT grants present on both tables (anon + authenticated)
- No INSERT/DELETE grants on target tables
- RLS enabled on both tables
- Admin ALL policies present (2)
- Data baseline stable: **4/34** global · **discography-002/8** target · no orphans/duplicates

**Decision:** Preflight **cleared** for apply-plan phase. **Do not REVOKE in this record phase** — operator executes REVOKE only in future **apply-manual** phase after apply-plan approval.

---

## REVOKE targets (2 — not executed)

| # | Table | Grantee | Privilege | Status |
| --- | --- | --- | --- | --- |
| 1 | `public.discography` | **authenticated** | **UPDATE** | **pending** — not revoked |
| 2 | `public.discography_tracks` | **authenticated** | **UPDATE** | **pending** — not revoked |

Documented from `F.apply_readiness.revoke_target_inventory`. Scope limited to these **2 statements** only.

---

## Admin policies (unchanged — pre-revoke)

| Policy | Table |
| --- | --- |
| `discography_admin_all` | `discography` |
| `discography_tracks_admin_all` | `discography_tracks` |

Policy hardening remains **deferred** per remediation plan. First apply is **UPDATE REVOKE only**.

---

## SELECT grants preserved (recorded)

| Grantee | Count | Status |
| --- | --- | --- |
| **anon** SELECT | **2** | PASS — both tables |
| **authenticated** SELECT | **2** | PASS — both tables |

Read path for staging admin and public site should remain intact after future REVOKE.

---

## Decision (G-20u36a-permissions-remediation-preflight-result)

| Question | Answer |
| --- | --- |
| Is pre-revoke state as expected? | **Yes** |
| Ready for manual REVOKE planning? | **Yes** — `READY_FOR_MANUAL_REVOKE` |
| Execute REVOKE now? | **No** — apply-plan first |
| Proceed to Save / DB write? | **No** |
| Proceed to Edge deploy? | **No** |
| Next phase? | **G-20u36a-permissions-remediation-apply-plan** |

**Rationale:** Apply-plan must formalize execution procedure · risks · rollback · after-verification before operator runs 2 REVOKE statements on staging.

---

## Not executed in this phase

- REVOKE / GRANT (live)
- RLS policy change
- DB write / SQL mutation
- Edge Function deploy
- Save enablement
- Cursor SQL execution
- FTP / production changes

---

## Next phases (recommended)

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-remediation-apply-plan** | Formal apply preflight · approval ID · REVOKE procedure · rollback · after-verification |
| **G-20u36a-permissions-remediation-apply-manual** | Operator manual REVOKE (staging only) |
| **G-20u36a-permissions-remediation-after-verification** | After-apply SELECT-only · result record |
| **G-20u36b** | Edge dry-run deploy plan — after permissions gate |

Save / G-20u36e remain **blocked** until permissions gate + Edge path ready.

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-result-gosaki-discography-permissions-remediation-preflight-result
npm run verify:current-active-regression
```
