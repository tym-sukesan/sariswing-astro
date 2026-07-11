# G-20u36a — Gosaki Discography permissions remediation after-verification

**Phase:** `G-20u36a-permissions-remediation-after-verification`  
**Status:** **complete** — after-verification SELECT-only SQL prepared · **Cursor did not execute SQL**  
**Date:** 2026-07-11  
**Base commit:** `da5fb05`  
**Prior:** G-20u36a-permissions-remediation-apply-manual-result — 2× REVOKE UPDATE executed

| Check | Status |
| --- | --- |
| After-verification SELECT-only SQL | **yes** |
| SQL executed by Cursor | **no** |
| DB write | **no** |
| REVOKE / GRANT (additional) | **no** |
| RLS policy change | **no** |
| Edge deploy | **no** |
| Save UI enabled | **no** |

---

## Gates

```txt
gosakiDiscographyPermissionsRemediationAfterVerificationPrepared: true
phase: G-20u36a-permissions-remediation-after-verification
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

Verify staging DB state **after** manual REVOKE of authenticated UPDATE on:

- `public.discography`
- `public.discography_tracks`

Confirms grants · RLS · data baseline · effective write risk post-remediation.

---

## Prerequisite — manual apply recorded

| Item | Value |
| --- | --- |
| Apply manual result doc | `gosaki-discography-g20u36a-permissions-remediation-apply-manual-result.md` |
| REVOKE executed | **yes** — 2 statements · **Success. No rows returned.** |
| After-verification (this SQL) | **not yet executed** by operator |

---

## Target environment

| Item | Value |
| --- | --- |
| Staging project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Database | `static-to-astro-cms-staging` |
| **Forbidden** production ref | **`vsbvndwuajjhnzpohghh`** — **STOP** |

---

## SQL file

**Path:** `scripts/supabase/gosaki-discography-g20u36a-permissions-remediation-after-verification.sql`

**Classification:** **SELECT-only** — unified output: `check_key / status / expected / actual / details_json`

### Verification groups

| Group | Checks |
| --- | --- |
| **A** | Target identity · staging ref · manual REVOKE context |
| **B** | Post-REVOKE grants — UPDATE=0 · anon write=0 · SELECT preserved |
| **C** | RLS enabled + forced status |
| **D** | Admin ALL policies (informational — may remain) |
| **E** | Data baseline 4/34 · discography-002/8 · integrity |
| **F** | Effective write risk after remediation |
| **G** | Remediation summary · complete candidate |
| **H** | Final gate — **PASS / STOP** |

---

## Operator execution procedure

1. Confirm manual REVOKE was executed per apply-manual-result doc
2. Open Supabase Dashboard → project ref = **`kmjqppxjdnwwrtaeqjta`**
3. If **`vsbvndwuajjhnzpohghh`** → **STOP**
4. SQL Editor → paste **entire** SQL file → Run once
5. Review **`H.after_verification.summary`** and **`F.effective_write_risk.after_remediation`**
6. Record in **`G-20u36a-permissions-remediation-after-verification-result-record`**

**Cursor / AI:** must **not** execute this SQL.

---

## PASS / STOP interpretation

| Status | Meaning |
| --- | --- |
| **PASS** | Check satisfied — remediation verification OK for that item |
| **NEEDS_REVIEW** | Admin ALL policies remain; grant-layer UPDATE removed — informational |
| **STOP** | Do not declare remediation complete — investigate |

### Required PASS conditions (summary)

| Check | Expected (post-REVOKE) |
| --- | --- |
| `B.grants.authenticated_update_count` | **0** |
| `B.grants.anon_write_count` | **0** |
| `B.grants.authenticated_select_present` | **≥2** |
| `B.grants.anon_select_present` | **≥2** |
| `C.rls.both_tables_enabled` | **true** |
| `E.data.global_releases_tracks` | **4 / 34** |
| `E.data.target_discography_002` | **1 / 8** |
| `E.data.integrity_orphans_duplicates` | **0 / 0 / 0** |
| `F.effective_write_risk.after_remediation` | **not RISK** (UPDATE grant = 0) |
| `H.after_verification.summary` | **PASS** |

### STOP conditions

| Condition | Action |
| --- | --- |
| Wrong project (production) | **STOP** |
| authenticated UPDATE grants > 0 | **STOP** — REVOKE incomplete |
| anon write grants > 0 | **STOP** |
| SELECT grants missing | **STOP** |
| RLS disabled | **STOP** |
| Data baseline drift | **STOP** |
| `H.after_verification.summary` = STOP | **STOP** — do not clear permissions gate |

---

## Effective write risk (post-REVOKE)

| Condition | Classification |
| --- | --- |
| authenticated UPDATE grant > 0 | **STOP / RISK** |
| No UPDATE grant · ALL policies remain | **NEEDS_REVIEW** — grant layer blocks direct UPDATE; policy hardening deferred |
| No write grants | **PASS** |

Prior deep-dive **RISK** was grant + policy overlap. After REVOKE, table UPDATE grant removed → **no longer RISK** at grant layer.

---

## After result record PASS

| Gate | Status |
| --- | --- |
| Permissions remediation complete | Candidate **true** (after result record) |
| Save / G-20u36e | **Still blocked** until Edge path ready |
| G-20u36b Edge dry-run deploy plan | **May proceed** after after-verification-result PASS |

---

## What this phase did NOT do

- Execute SQL (Cursor)
- Additional REVOKE / GRANT
- RLS policy change
- Edge deploy / Save enablement
- Production changes

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36a-permissions-remediation-after-verification-result-record** | Operator runs SQL · records PASS/STOP |
| **G-20u36b** | Edge dry-run endpoint deploy plan — after permissions gate PASS |
| **G-20u36e** | First Save — still blocked until Edge path ready |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36a-permissions-remediation-after-verification
npm run verify:current-active-regression
```

Historical verifier — not part of current active regression gate.
