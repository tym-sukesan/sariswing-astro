# G-20u36a — Gosaki Discography permissions / RLS deep-dive

**Phase:** `G-20u36a-permissions-rls-deep-dive`  
**Status:** **complete** — SELECT-only deep-dive SQL prepared · **Cursor did not execute SQL**  
**Date:** 2026-07-11  
**Base commit:** `eb93f92`  
**Prior:** G-20u36a-result STOP — authenticated UPDATE grants on `discography` + `discography_tracks`

| Check | Status |
| --- | --- |
| SELECT-only SQL file | **yes** |
| SQL executed by Cursor | **no** |
| DB write | **no** |
| REVOKE / GRANT | **no** |
| RLS policy change | **no** |
| Edge deploy | **no** |
| Save UI enabled | **no** |

---

## Gates

```txt
gosakiDiscographyPermissionsRlsDeepDivePrepared: true
phase: G-20u36a-permissions-rls-deep-dive
sqlExecutedByCursor: false
dbWriteExecuted: false
sqlMutationExecuted: false
revokeGrantExecuted: false
rlsPolicyChangeExecuted: false
edgeFunctionDeployed: false
saveEnabled: false
productionUploadStop: true
productionDbWriteStop: true
```

---

## Context — previous STOP (G-20u36a-result)

| Item | Value |
| --- | --- |
| `C.permissions.anon_auth_write_grants` | **STOP** — expected 0 · actual **2** |
| Grant 1 | `authenticated` **UPDATE** on `public.discography` |
| Grant 2 | `authenticated` **UPDATE** on `public.discography_tracks` |
| `H.stop_summary.any_stop` | **STOP** |
| Data baseline | **PASS** — `discography-002` row 1 · 8 tracks · global 4/34 |
| RLS | **enabled** on both tables |

**Decision before this phase:** Do not proceed to REVOKE / GRANT / RLS changes until grants and policies are fully understood via SELECT-only deep-dive.

---

## Target

| Item | Value |
| --- | --- |
| Staging project ref | **`kmjqppxjdnwwrtaeqjta`** |
| Database | `static-to-astro-cms-staging` |
| **Forbidden** production ref | **`vsbvndwuajjhnzpohghh`** — **STOP** — do not run |
| Tables | `public.discography` · `public.discography_tracks` |
| Grantees (watch) | `anon` · `authenticated` · `public` |
| Roles (info only) | `anon` · `authenticated` · `service_role` |

---

## SQL file

**Path:** `scripts/supabase/gosaki-discography-g20u36a-permissions-rls-deep-dive.sql`

**Classification:** **SELECT-only** — one copy-paste block → unified result table:

| Column | Purpose |
| --- | --- |
| `check_key` | Check identifier (A–H) |
| `status` | `PASS` · `STOP` · `RISK` · `NEEDS_REVIEW` · `INFO` |
| `expected` | Expected value or interpretation |
| `actual` | Actual value |
| `details_json` | Grants inventory · policies · risk notes |

### Verification groups

| Group | Checks |
| --- | --- |
| **A** | Target identity · staging project ref · forbidden production ref (comment) |
| **B** | `information_schema.role_table_grants` — all grants for target tables · authenticated UPDATE count |
| **C** | RLS status via `pg_class` (`relrowsecurity` · `relforcerowsecurity`) |
| **D** | RLS policies via `pg_policies` — policyname · roles · cmd · qual · with_check · UPDATE/ALL policies |
| **E** | Effective write risk summary per table · highest risk row |
| **F** | Edge-only write path readiness — browser direct write grant assessment |
| **G** | Next action classification (remediation plan deferred) |
| **H** | Review summary — proceed to remediation planning gate |

---

## Operator execution procedure

1. Open Supabase Dashboard → confirm project ref is **`kmjqppxjdnwwrtaeqjta`**
2. If project is **`vsbvndwuajjhnzpohghh`** → **STOP** — do not run
3. SQL Editor → paste **entire** SQL file → Run once
4. Review all rows — note `RISK` · `NEEDS_REVIEW` · `STOP` statuses
5. Record results in **`G-20u36a-permissions-rls-deep-dive-result-record`** (future phase)

**Cursor / AI:** must **not** execute this SQL.

---

## Expected review points

| Area | What to review |
| --- | --- |
| **B.grants** | Full grant matrix for anon/authenticated/public on both tables |
| **B.grants.authenticated_update_count** | Confirm 2 UPDATE grants (discography + discography_tracks) |
| **C.rls** | RLS enabled on both tables; forced status |
| **D.policies** | Every policy on both tables — especially UPDATE and ALL cmd |
| **D.policies.write_related** | Policies that could permit UPDATE for authenticated |
| **E.risk.*** | Per-table RISK vs NEEDS_REVIEW based on grant + policy overlap |
| **F.edge_only** | Whether browser anon/auth direct write grants exist |
| **G.next_action** | Classification for remediation vs grant-present-but-blocked |

---

## Status interpretation — STOP / RISK / NEEDS_REVIEW / PASS

| Status | Meaning | Action |
| --- | --- | --- |
| **PASS** | No UPDATE grant (or check satisfied) | Continue review; may still need least-privilege cleanup if other grants exist |
| **NEEDS_REVIEW** | UPDATE grant present; no matching write policy detected (or grant-only overlap unclear) | Document; plan REVOKE in remediation phase; **do not Save** until resolved |
| **RISK** | UPDATE grant **and** write-related RLS policy overlap | **STOP** — treat as potential authenticated direct write path; **do not Save** |
| **STOP** | Hard gate (e.g. anon write grants · confirmed RISK · wrong project) | **Do not proceed** to Save / REVOKE without explicit approval phase |
| **INFO** | Informational inventory | Record for remediation planning |

### Effective write risk logic (E)

| Condition | Classification |
| --- | --- |
| Table grant UPDATE **+** RLS UPDATE/ALL policy for same grantee scope | **RISK** |
| Table grant UPDATE **+** no matching UPDATE/ALL policy | **NEEDS_REVIEW** (grant present; verify policy blocks) |
| No UPDATE grant | **PASS** |

**Note:** Even if RLS blocks writes, authenticated UPDATE grants violate least-privilege and remain cleanup targets in remediation planning.

---

## Edge-only write path (ideal vs actual)

| Path | Ideal | This phase |
| --- | --- | --- |
| Browser anon direct write | **forbidden** | SELECT inventory only |
| Browser authenticated direct write | **forbidden** | SELECT inventory only |
| `service_role` | Edge Function internal only | Info display only — not browser-exposed |
| authenticated UPDATE grant | **should not exist** for direct client writes | **NEEDS_REVIEW** / **RISK** per E |

---

## Next phases (not executed in this phase)

| Phase | Purpose |
| --- | --- |
| **G-20u36a-permissions-rls-deep-dive-result-record** | Operator runs deep-dive SQL · records results |
| **G-20u36a-permissions-remediation-plan** | REVOKE / grant cleanup plan doc (no execution unless approved) |
| **G-20u36b** | Edge dry-run endpoint deploy plan (after permissions gate) |
| **G-20u36e** | First controlled Save (**blocked** until permissions STOP resolved) |

---

## Safety — this phase did NOT

- Execute SQL (Cursor)
- DB write / SQL mutation
- REVOKE / GRANT
- RLS policy change
- Edge Function deploy
- Save UI enablement
- FTP / production upload
- Modify `supabase/functions/**`

---

## Verifier

```bash
npm run verify:g20u36a-permissions-rls-deep-dive
```

Historical verifier — not part of current active regression gate (23 verifiers).

---

## Related docs

- `gosaki-discography-g20u36a-select-only-before-verification-result.md` — STOP source
- `gosaki-discography-g20u36a-select-only-before-verification.md` — prior SELECT-only baseline
- `gosaki-discography-staging-db-write-test-plan-rollback-drill.md` — G-20u36a–g split
- `gosaki-discography-save-design.md` — Save design (blocked)
