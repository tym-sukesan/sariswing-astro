# G-20u36a — Gosaki Discography permissions remediation plan

**Phase:** `G-20u36a-permissions-remediation-plan`  
**Status:** **complete** — remediation plan doc only · **no REVOKE / GRANT / RLS execution**  
**Date:** 2026-07-11  
**Base commit:** `83b42c9`  
**Prior:** G-20u36a-permissions-rls-deep-dive-result — RISK confirmed · Save/Edge deploy STOP

| Check | Status |
| --- | --- |
| Remediation plan doc | **yes** (this file) |
| SQL executed by Cursor | **no** |
| DB write | **no** |
| REVOKE / GRANT executed | **no** |
| RLS policy change | **no** |
| Edge deploy | **no** |
| Save UI enabled | **no** |
| Production changes | **no** |

---

## Gates

```txt
gosakiDiscographyPermissionsRemediationPlanPrepared: true
phase: G-20u36a-permissions-remediation-plan
sqlExecutedByCursor: false
dbWriteExecuted: false
revokeGrantExecuted: false
rlsPolicyChangeExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
productionUploadStop: true
productionDbWriteStop: true
proceedToSave: false
proceedToEdgeDeploy: false
```

---

## Target environment

| Item | Value |
| --- | --- |
| Staging project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Database | `static-to-astro-cms-staging` |
| **Forbidden** production ref | **`vsbvndwuajjhnzpohghh`** — **STOP** — do not run remediation |
| Tables | `public.discography` · `public.discography_tracks` |
| First Save candidate (future) | `discography-002` · `site_slug=gosaki-piano` |

---

## Current risk (recorded — G-20u36a deep-dive result)

| Risk item | Detail |
| --- | --- |
| **Effective write risk** | **RISK** (highest) |
| **Review summary** | **STOP — RISK confirmed** |
| **authenticated UPDATE grants** | **2** — `discography` + `discography_tracks` |
| **authenticated ALL policies** | **2** — see below |
| **anon write grants** | **0** (PASS) |
| **RLS enabled** | **true** on both tables |

### authenticated UPDATE grants

| # | Table | Grantee | Privilege |
| --- | --- | --- | --- |
| 1 | `public.discography` | **authenticated** | **UPDATE** |
| 2 | `public.discography_tracks` | **authenticated** | **UPDATE** |

### authenticated ALL policies (`is_admin()`)

| Policy | Table | cmd | roles | qual | with_check |
| --- | --- | --- | --- | --- | --- |
| `discography_admin_all` | `discography` | **ALL** | `{authenticated}` | `is_admin()` | `is_admin()` |
| `discography_tracks_admin_all` | `discography_tracks` | **ALL** | `{authenticated}` | `is_admin()` | `is_admin()` |

### Edge-only write path contradiction

G-20u31+ design requires:

- Browser **anon** direct write → **forbidden**
- Browser **authenticated** direct write → **forbidden**
- Future Save → **Edge Function** internal **`service_role`** only

**Current staging:** authenticated user satisfying `is_admin()` may **UPDATE via PostgREST/browser Supabase client** — **contradicts Edge-only path**. Save and Edge deploy remain **blocked**.

### Data baseline (unchanged — must hold through remediation)

| Check | Expected |
| --- | --- |
| Target release `discography-002` | 1 row |
| Target tracks | 8 |
| Global releases (`gosaki-piano`) | 4 |
| Global tracks | 34 |

---

## Recommended remediation strategy

### A. Immediate least-privilege cleanup (recommended first apply)

**Goal:** Remove browser-facing authenticated direct UPDATE capability while preserving read path.

| Action | Scope | Rationale |
| --- | --- | --- |
| **REVOKE UPDATE** from **authenticated** | `public.discography` | Removes table-level UPDATE grant — primary RISK driver |
| **REVOKE UPDATE** from **authenticated** | `public.discography_tracks` | Same |
| **Keep SELECT grants** | both tables · anon + authenticated | Admin read UI + public site read unchanged |
| **Keep anon write grants at 0** | both tables | Already PASS — do not add INSERT/UPDATE/DELETE |
| **Do not add INSERT/DELETE grants** | authenticated / anon | Not required for read; Save uses Edge path |
| **Do not expose service_role** | browser / client | Edge Function internal only |

**Expected effect after A alone:**

- authenticated UPDATE grants → **0**
- Overlap with ALL policies → **grant side removed** → effective write risk should drop from **RISK** to **NEEDS_REVIEW** or lower (policy still ALL but no table UPDATE grant)
- Read path → unchanged if SELECT grants preserved
- Future Save → still **blocked** until Edge dry-run path ready (G-20u36b+)

### B. Policy hardening (separate future phase — not first apply)

| Consideration | Detail |
| --- | --- |
| **Current state after A** | ALL policies remain; direct UPDATE blocked at grant layer |
| **Residual risk** | If UPDATE grant is re-granted later, RISK returns immediately |
| **Stronger option** | Replace `discography_admin_all` / `discography_tracks_admin_all` with **SELECT-only** admin policies |
| **Why deferred** | Policy change affects admin read/write semantics broadly; requires SELECT-only impact survey + rollback plan |
| **Phase split** | Policy hardening → **after** grant REVOKE verified · dedicated phase with its own preflight |

**This plan phase:** document option B only — **no policy change**.

### C. Future manual operation workflow (not executed in this phase)

1. Operator confirms Supabase project ref = **`kmjqppxjdnwwrtaeqjta`**
2. If **`vsbvndwuajjhnzpohghh`** → **STOP**
3. Run **before** SELECT-only verification (existing deep-dive + before-verification SQL)
4. Apply **first remediation only:** REVOKE authenticated UPDATE (2 statements)
5. Run **after** SELECT-only verification
6. Confirm data baseline unchanged (4/34 · discography-002/8)
7. Record results in remediation after-verification phase
8. **Do not** proceed to Save / Edge deploy until permissions gate + Edge path ready

---

## Future manual operation draft — NOT EXECUTED / DO NOT RUN IN THIS PHASE

> **Classification:** FUTURE MANUAL OPERATION DRAFT  
> **NOT EXECUTED** · **DO NOT RUN IN THIS PHASE**  
> **Cursor must not execute.** Operator-only · staging `kmjqppxjdnwwrtaeqjta` · explicit approval required in apply phase.

### Proposed first remediation (UPDATE REVOKE only)

```sql
-- FUTURE MANUAL OPERATION DRAFT — NOT EXECUTED — DO NOT RUN IN THIS PHASE
-- Staging only: kmjqppxjdnwwrtaeqjta
-- Production STOP: vsbvndwuajjhnzpohghh

REVOKE UPDATE ON TABLE public.discography FROM authenticated;
REVOKE UPDATE ON TABLE public.discography_tracks FROM authenticated;
```

### Rollback draft (doc only — also NOT EXECUTED)

```sql
-- FUTURE MANUAL OPERATION DRAFT — ROLLBACK — NOT EXECUTED — DO NOT RUN IN THIS PHASE
-- Use only if after-verification fails and operator approves rollback

GRANT UPDATE ON TABLE public.discography TO authenticated;
GRANT UPDATE ON TABLE public.discography_tracks TO authenticated;
```

**Note:** Rollback restores prior RISK state. Prefer re-running after-verification before rollback unless grant removal caused unexpected read breakage (unlikely for UPDATE-only REVOKE).

---

## Success conditions (after future apply + verification)

| Check | Expected |
| --- | --- |
| authenticated UPDATE grants | **0** |
| anon write grants (INSERT/UPDATE/DELETE) | **0** |
| SELECT grants | **preserved** (anon + authenticated as before) |
| RLS enabled | **true** on both tables |
| Global releases / tracks | **4 / 34** unchanged |
| Target `discography-002` / tracks | **1 / 8** unchanged |
| Effective write risk | **no longer RISK** (target: NEEDS_REVIEW or PASS) |
| Save enabled | **still false** until Edge dry-run path ready |
| Edge deploy | **still blocked** until permissions gate cleared |

---

## STOP conditions (apply phase)

| Condition | Action |
| --- | --- |
| Wrong project (production ref `vsbvndwuajjhnzpohghh`) | **STOP** — do not run |
| Unintended grant/revoke target (other tables/roles) | **STOP** |
| SELECT grants removed | **STOP** — rollback per draft |
| anon write grant appears | **STOP** |
| RLS disabled | **STOP** |
| Data baseline unexpected change | **STOP** — investigate · rollback if needed |
| service_role exposed to browser | **STOP** |
| Edge deploy before permissions gate clear | **STOP** |
| Any row `status = STOP` in after-verification | **STOP** — no Save |

---

## What this phase did NOT do

- Execute SQL (Cursor or automated)
- DB write / SQL mutation
- REVOKE / GRANT (live)
- RLS policy change
- Create mutation `.sql` files
- Edge Function deploy / implementation
- Save UI enablement
- Modify `supabase/functions/**` · `src/**` · `public/**`
- Production changes

---

## Next phases (recommended order)

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-remediation-preflight-select-only** | Before-apply SELECT-only checklist · operator confirmation |
| **G-20u36a-permissions-remediation-apply-plan** | Formal apply preflight doc · exact statements · approval ID |
| **G-20u36a-permissions-remediation-apply-manual** | Operator manual REVOKE (2 statements) · staging only |
| **G-20u36a-permissions-remediation-after-verification** | After-apply SELECT-only · result record |
| **G-20u36b** | Edge dry-run endpoint deploy plan — after permissions gate |
| **G-20u36e** | First controlled Save — **still blocked** until permissions + Edge path ready |

Optional later: **policy hardening phase** (ALL → SELECT-only admin policies) with separate SELECT-only survey.

---

## Related docs

- `gosaki-discography-g20u36a-permissions-rls-deep-dive-result.md` — RISK source
- `gosaki-discography-g20u36a-permissions-rls-deep-dive.md` — deep-dive SQL prep
- `gosaki-discography-g20u36a-select-only-before-verification-result.md` — data baseline
- `gosaki-discography-staging-db-write-test-plan-rollback-drill.md` — Save test plan
- `gosaki-discography-save-design.md` — Edge-only write path design

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-permissions-remediation-plan
npm run verify:current-active-regression
```

Historical verifier — not part of current active regression gate.
