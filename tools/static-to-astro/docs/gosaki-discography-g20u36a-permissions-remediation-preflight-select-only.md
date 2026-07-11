# G-20u36a — Gosaki Discography permissions remediation preflight (SELECT-only)

**Phase:** `G-20u36a-permissions-remediation-preflight-select-only`  
**Status:** **complete** — preflight SELECT-only SQL prepared · **Cursor did not execute SQL**  
**Date:** 2026-07-11  
**Base commit:** `b41a8c4`  
**Prior:** G-20u36a-permissions-remediation-plan — REVOKE authenticated UPDATE x2 (not executed)

| Check | Status |
| --- | --- |
| Preflight SELECT-only SQL | **yes** |
| SQL executed by Cursor | **no** |
| DB write | **no** |
| REVOKE / GRANT | **no** |
| RLS policy change | **no** |
| Edge deploy | **no** |
| Save UI enabled | **no** |

---

## Gates

```txt
gosakiDiscographyPermissionsRemediationPreflightSelectOnlyPrepared: true
phase: G-20u36a-permissions-remediation-preflight-select-only
sqlExecutedByCursor: false
dbWriteExecuted: false
revokeGrantExecuted: false
rlsPolicyChangeExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
productionUploadStop: true
productionDbWriteStop: true
```

---

## Purpose

Re-verify staging DB state **immediately before** manual REVOKE of authenticated UPDATE grants on:

- `public.discography`
- `public.discography_tracks`

Confirms grants · RLS · policies · data baseline match remediation plan expectations.

---

## Target environment

| Item | Value |
| --- | --- |
| Staging project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Database | `static-to-astro-cms-staging` |
| **Forbidden** production ref | **`vsbvndwuajjhnzpohghh`** — **STOP** |
| Target `site_slug` | `gosaki-piano` |
| Target `legacy_id` | `discography-002` |

---

## SQL file

**Path:** `scripts/supabase/gosaki-discography-g20u36a-permissions-remediation-preflight-select-only.sql`

**Classification:** **SELECT-only** — one copy-paste block → unified result table:

| Column | Purpose |
| --- | --- |
| `check_key` | Check identifier (A–H) |
| `status` | `PASS` · `STOP` · `INFO` · `READY_FOR_MANUAL_REVOKE` |
| `expected` | Expected value |
| `actual` | Actual value |
| `details_json` | Grant/policy/data inventory |

### Verification groups

| Group | Checks |
| --- | --- |
| **A** | Target identity · staging ref · forbidden production ref |
| **B** | Current grants — UPDATE x2 · anon write 0 · SELECT preserved · no INSERT/DELETE |
| **C** | RLS enabled + forced status |
| **D** | Admin ALL policies · public SELECT policies inventory |
| **E** | Data baseline 4/34 · discography-002/8 · integrity |
| **F** | Apply readiness · revoke target inventory · **READY_FOR_MANUAL_REVOKE** gate |
| **G** | Post-apply expectations (informational — not executed) |
| **H** | Preflight summary |

---

## Operator execution procedure

1. Open Supabase Dashboard → confirm project ref is **`kmjqppxjdnwwrtaeqjta`**
2. If project is **`vsbvndwuajjhnzpohghh`** → **STOP** — do not run
3. SQL Editor → paste **entire** SQL file → Run once
4. Review all rows — focus on **`F.apply_readiness.ready_for_manual_revoke`** and **`H.preflight_summary.any_stop`**
5. Record results in **`G-20u36a-permissions-remediation-preflight-result-record`** (future phase)
6. **Do not** run REVOKE in this phase

**Cursor / AI:** must **not** execute this SQL.

---

## READY_FOR_MANUAL_REVOKE / STOP interpretation

| Status | Meaning | Action |
| --- | --- | --- |
| **READY_FOR_MANUAL_REVOKE** | All preflight checks PASS · UPDATE grants = 2 (expected) · data stable | Proceed to **apply-plan** → **apply-manual** (separate approved phases) |
| **STOP** | Any check failed · unexpected grants · data drift · RLS off | **Do not REVOKE** — investigate · re-run baseline SQL |
| **PASS** (individual rows) | Sub-check satisfied | Continue review |
| **INFO** | Inventory / post-apply expectation | Record only |

### Preflight PASS conditions (summary)

| Check | Expected |
| --- | --- |
| `B.grants.authenticated_update_count` | **2** (before revoke) |
| `B.grants.anon_write_count` | **0** |
| `B.grants.authenticated_select_present` | **≥2** (both tables) |
| `B.grants.anon_select_present` | **≥2** (both tables) |
| `B.grants.no_insert_delete_grants` | **0** |
| `C.rls.both_tables_enabled` | **true** |
| `D.policies.admin_all_policies` | **2** (`discography_admin_all` · `discography_tracks_admin_all`) |
| `E.data.global_releases_tracks` | **4 / 34** |
| `E.data.target_discography_002` | **1 / 8** |
| `E.data.integrity_orphans_duplicates` | **0 / 0 / 0** |
| `F.apply_readiness.ready_for_manual_revoke` | **READY_FOR_MANUAL_REVOKE** |

### STOP conditions

| Condition | Action |
| --- | --- |
| Wrong Supabase project (production) | **STOP** |
| authenticated UPDATE grants ≠ 2 | **STOP** — state drift |
| anon write grants > 0 | **STOP** |
| SELECT grants missing | **STOP** — do not REVOKE |
| INSERT/DELETE grants appear | **STOP** |
| RLS disabled | **STOP** |
| Data baseline ≠ 4/34 or discography-002 ≠ 1/8 | **STOP** |
| Orphans / duplicates / slug mismatch | **STOP** |
| Admin ALL policies missing | **STOP** — investigate before revoke |

---

## Post-apply expectations (G — not executed in preflight)

After future manual REVOKE (separate phase):

| Check | Expected |
| --- | --- |
| authenticated UPDATE grants | **0** |
| SELECT grants | **unchanged** |
| RLS enabled | **true** |
| Data baseline | **4/34 · 1/8** unchanged |
| Effective write risk | **no longer RISK** (re-run deep-dive SQL) |

---

## What this phase did NOT do

- Execute SQL (Cursor)
- DB write / REVOKE / GRANT
- RLS policy change
- Edge Function deploy
- Save UI enablement
- Production changes

---

## Next phases (recommended)

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-remediation-preflight-result-record** | Operator runs preflight SQL · records results |
| **G-20u36a-permissions-remediation-apply-plan** | Formal apply preflight · approval ID · exact REVOKE statements |
| **G-20u36a-permissions-remediation-apply-manual** | Operator manual REVOKE (staging only) |
| **G-20u36a-permissions-remediation-after-verification** | After-apply SELECT-only verification |

Save / Edge deploy remain **blocked** until permissions gate cleared.

---

## Related docs

- `gosaki-discography-g20u36a-permissions-remediation-plan.md`
- `gosaki-discography-g20u36a-permissions-rls-deep-dive-result.md`
- `gosaki-discography-g20u36a-select-only-before-verification-result.md`

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-permissions-remediation-preflight-select-only
npm run verify:current-active-regression
```

Historical verifier — not part of current active regression gate.
