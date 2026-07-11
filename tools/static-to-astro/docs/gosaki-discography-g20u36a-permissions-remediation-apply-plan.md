# G-20u36a — Gosaki Discography permissions remediation apply plan

**Phase:** `G-20u36a-permissions-remediation-apply-plan`  
**Status:** **complete** — apply plan doc only · **REVOKE not executed**  
**Date:** 2026-07-11  
**Base commit:** `3487f51`  
**Prior:** G-20u36a-permissions-remediation-preflight-result — **READY_FOR_MANUAL_REVOKE**

| Check | Status |
| --- | --- |
| Apply plan doc | **yes** (this file) |
| SQL executed by Cursor | **no** |
| DB write | **no** |
| REVOKE / GRANT executed | **no** |
| RLS policy change | **no** |
| Mutation `.sql` file | **no** |
| Edge deploy | **no** |
| Save UI enabled | **no** |
| Production changes | **no** |

---

## Gates

```txt
gosakiDiscographyPermissionsRemediationApplyPlanPrepared: true
phase: G-20u36a-permissions-remediation-apply-plan
sqlExecutedByCursor: false
dbWriteExecuted: false
revokeGrantExecuted: false
rlsPolicyChangeExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
productionUploadStop: true
productionDbWriteStop: true
proceedToManualRevoke: pending
proceedToSave: false
proceedToEdgeDeploy: false
```

---

## Prerequisite — preflight result

| Item | Value |
| --- | --- |
| Preflight doc | `gosaki-discography-g20u36a-permissions-remediation-preflight-result.md` |
| `F.apply_readiness.ready_for_manual_revoke` | **READY_FOR_MANUAL_REVOKE** |
| `H.preflight_summary.any_stop` | **READY_FOR_MANUAL_REVOKE** |
| REVOKE executed in preflight | **no** |

**Do not apply** if preflight result is not **READY_FOR_MANUAL_REVOKE**.

---

## Execution target

| Item | Value |
| --- | --- |
| Environment | **staging only** |
| Database | `static-to-astro-cms-staging` |
| Project ref | **`kmjqppxjdnwwrtaeqjta`** |

### Execution forbidden

| Target | Action |
| --- | --- |
| Production ref **`vsbvndwuajjhnzpohghh`** | **STOP** |
| Sariswing production | **STOP** |
| Any project ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |

---

## Current state (recorded — pre-apply)

| Item | Value |
| --- | --- |
| authenticated UPDATE grants | **2** |
| anon write grants | **0** |
| anon SELECT grants | **2** |
| authenticated SELECT grants | **2** |
| INSERT/DELETE grants | **0** |
| RLS enabled | **true** (both tables) |
| Admin ALL policies | **2** |
| Global data | **4** releases · **34** tracks |
| Target `discography-002` | **1** release · **8** tracks |

---

## Manual operation target

**Exactly 2 statements** — REVOKE UPDATE only:

| # | Table | Grantee | Privilege | Action |
| --- | --- | --- | --- | --- |
| 1 | `public.discography` | **authenticated** | **UPDATE** | REVOKE |
| 2 | `public.discography_tracks` | **authenticated** | **UPDATE** | REVOKE |

### Explicitly out of scope (this apply)

- **No GRANT**
- **No RLS policy changes**
- **No data row changes** (INSERT/UPDATE/DELETE on table contents)
- **No Edge Function deploy**
- **No Save UI enablement**
- **No policy hardening** (ALL → SELECT-only — separate future phase)

---

## Operator procedure (apply-manual phase — not this phase)

1. Confirm preflight result = **READY_FOR_MANUAL_REVOKE**
2. Open Supabase Dashboard → confirm project ref = **`kmjqppxjdnwwrtaeqjta`**
3. If ref = **`vsbvndwuajjhnzpohghh`** or any other project → **STOP**
4. SQL Editor → run **only** the 2 REVOKE statements below (future manual block)
5. **Do not** run GRANT, RLS DDL, or data mutations in the same session
6. Proceed immediately to **after-verification** SELECT-only SQL
7. Record results in **G-20u36a-permissions-remediation-after-verification**

---

## Future manual operation block — NOT EXECUTED IN THIS PHASE

> **NOT EXECUTED IN THIS PHASE**  
> **HUMAN OPERATOR ONLY**  
> **STAGING ONLY**  
> **CONFIRM** project ref = **`kmjqppxjdnwwrtaeqjta`** before run  
> **STOP** if project ref = **`vsbvndwuajjhnzpohghh`** or any non-staging project  
> Cursor must **not** execute these statements.

```sql
REVOKE UPDATE ON TABLE public.discography FROM authenticated;
REVOKE UPDATE ON TABLE public.discography_tracks FROM authenticated;
```

**Scope check:** Exactly **2** statements · REVOKE UPDATE only · no other SQL in same operation.

---

## Emergency rollback draft — NOT EXECUTED / EMERGENCY ROLLBACK DRAFT

> **NOT EXECUTED** · **EMERGENCY ROLLBACK DRAFT ONLY**  
> Use **only** if after-verification shows unexpected read breakage and operator receives **separate explicit approval**.  
> Rollback **restores prior RISK state** (authenticated direct UPDATE path).  
> **Principle:** Do not rollback unless after-verification documents a concrete failure attributable to UPDATE REVOKE.

```sql
GRANT UPDATE ON TABLE public.discography TO authenticated;
GRANT UPDATE ON TABLE public.discography_tracks TO authenticated;
```

---

## Risk assessment

| Risk | Mitigation |
| --- | --- |
| Existing UI depends on authenticated direct UPDATE | G-20u31+ design **forbids** browser direct write; staging admin Save is **disabled**; intended direction |
| Read path broken | SELECT grants **preserved** — public site + read-only admin display expected to continue |
| Data rows altered | REVOKE affects **privileges only** — no row mutation |
| Edge-only path conflict remains | Admin ALL policies remain; grant-layer RISK removed; policy hardening deferred |
| Accidental production apply | Project ref checklist · **STOP** on `vsbvndwuajjhnzpohghh` |

---

## Success criteria (after manual apply + after-verification)

| Check | Expected |
| --- | --- |
| authenticated UPDATE grants | **0** |
| anon write grants | **0** |
| anon SELECT grants | **2** (unchanged) |
| authenticated SELECT grants | **2** (unchanged) |
| RLS enabled | **true** on both tables |
| Global releases / tracks | **4 / 34** unchanged |
| Target `discography-002` / tracks | **1 / 8** unchanged |
| Effective write risk | **no longer RISK** (re-run deep-dive or after-verification SQL) |
| Save enabled | **still false** until Edge dry-run path ready |
| Edge deploy (G-20u36b) | **only after** after-verification PASS |

---

## STOP criteria

| Condition | Action |
| --- | --- |
| Supabase project ref ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Project ref = `vsbvndwuajjhnzpohghh` | **STOP** |
| Preflight result ≠ **READY_FOR_MANUAL_REVOKE** | **STOP** |
| SQL includes anything other than 2 REVOKE UPDATE statements | **STOP** |
| GRANT / RLS / data mutation / deploy in same operation | **STOP** |
| SELECT grants would be removed | **STOP** — do not proceed |
| anon write grant appears | **STOP** |
| RLS disabled | **STOP** |
| Data baseline unexpected change | **STOP** — consider rollback only with separate approval |
| service_role exposed to browser | **STOP** |
| Save enabled before after-verification PASS | **STOP** |

---

## After-verification plan

After human manual REVOKE (apply-manual phase):

1. Run SELECT-only verification (deep-dive SQL and/or dedicated after-verification SQL)
2. Verify grants · RLS · data baseline · effective write risk
3. Record in **G-20u36a-permissions-remediation-after-verification**
4. **Only if PASS:** permissions gate may clear for **G-20u36b** Edge dry-run endpoint deploy plan
5. **G-20u36e** First Save remains blocked until Edge path + permissions gate both ready

---

## What this phase did NOT do

- Execute SQL (Cursor or operator in this phase)
- DB write / REVOKE / GRANT (live)
- RLS policy change
- Create mutation `.sql` files
- Edge Function deploy / Save enablement
- Modify `supabase/functions/**` · `src/**` · `public/**`
- Production changes

---

## Next phases (recommended order)

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-remediation-apply-manual** | Operator runs 2 REVOKE statements · staging only |
| **G-20u36a-permissions-remediation-after-verification** | SELECT-only after apply · result record |
| **G-20u36b** | Edge dry-run endpoint deploy plan — after permissions gate PASS |
| **G-20u36e** | First Save — still blocked |

---

## Related docs

- `gosaki-discography-g20u36a-permissions-remediation-preflight-result.md`
- `gosaki-discography-g20u36a-permissions-remediation-plan.md`
- `gosaki-discography-g20u36a-permissions-rls-deep-dive-result.md`
- `gosaki-discography-save-design.md`

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-permissions-remediation-apply-plan
npm run verify:current-active-regression
```

Historical verifier — not part of current active regression gate.
