# G-20u36e — Gosaki Discography controlled Save permission model decision

**Phase:** `G-20u36e-controlled-save-permission-model-decision`  
**Status:** **complete** — permission model decided · **no SQL / grant / RLS / Edge / Save**  
**Date:** 2026-07-14  
**Base commit:** `a480704`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-result.md](./gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-result.md) — **PASS**

| Check | Status |
| --- | --- |
| Permission model decision | **yes** (this file) |
| Decision only | **yes** |
| SQL created | **no** |
| Executable SQL blocks | **no** |
| SQL executed | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP re-sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionModelDecided: true
phase: G-20u36e-controlled-save-permission-model-decision
decisionOnly: true
sqlCreated: false
executableSqlBlocksCreated: false
sqlExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
dbWriteExecuted: false
edgeImplementationExecuted: false
supabaseFunctionsEdited: false
edgeDeployExecuted: false
operationSaveSent: false
dryRunHttpResent: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
selectedPermissionModel: OptionA_authenticatedUpdateTitle_restrictiveRls_operatorJwt
operatorJwtFeasibilityNextTask: true
readyForG20u36eAuthJwtFeasibilityPlanning: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 0. Controlled Save target (unchanged)

| Field | Value |
| --- | --- |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| table | `public.discography_tracks` |
| target row | `site_slug=gosaki-piano` · `discography_legacy_id=discography-002` · `track_number=1` · `title=On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track count | **8 → 8** |
| track 7 | **`Like a Lover`** — unchanged |
| release scalars | unchanged |

---

## 1. Permission snapshot summary (recorded — PASS)

Source: G-20u36e-controlled-save-permission-snapshot-select-result-record.

| Item | Recorded |
| --- | --- |
| `target_row_count` | **1** |
| `track_count` | **8** |
| `track_7_title` | **`Like a Lover`** |
| `target_track_1_title` | **`On a Clear Day`** |
| `anon_write_grants_count` | **0** |
| `authenticated_update_grants_count` | **0** |
| `authenticated_discography_tracks_update_grants_count` | **0** |
| `authenticated_title_update_column_grants_count` | **0** |
| `rls_enabled_discography` | **true** |
| `rls_enabled_discography_tracks` | **true** |
| `admin_all_policy_count` | **2** |
| `role_table_grants` | **SELECT only** (anon + authenticated on both tables) |
| `column_privileges_title` | **`[]`** |

**Edge auth (read-only code review):** readBack uses **`SUPABASE_ANON_KEY` only** — incoming `Authorization` header **not parsed for user JWT** today.

**Decision input:** Target data is healthy · **write path blocked at grant layer** · Save cannot proceed without permission model change + Edge auth change.

---

## 2. Option comparison

### Option A — authenticated UPDATE(title) + restrictive RLS + operator JWT

| Aspect | Detail |
| --- | --- |
| Scope | **staging `kmjqppxjdnwwrtaeqjta` only** |
| Grant | **authenticated UPDATE** on `discography_tracks.title` (column-level if supported) |
| RLS | **New restrictive policy** — 1 row · `site_slug` · `discography_legacy_id` · `track_number=1` |
| Edge | Accept **operator authenticated JWT** in `Authorization` · Supabase client uses JWT for PATCH (not anon) |
| Defense | **Edge server-side guard** (old title · new title · fingerprint · diff) **+ RLS** |
| Duration | **Temporary / minimal** — revert or tighten after controlled Save + verify |
| **Verdict** | **SELECTED — first candidate** |

### Option B — anon UPDATE + restrictive RLS

| Aspect | Detail |
| --- | --- |
| Risk | Anon key exposed in browser / static packages |
| Blast radius | Any anon key holder could attempt UPDATE if RLS misconfigured |
| **Verdict** | **REJECTED** — high risk · do not use even on staging |

### Option C — manual SQL one-shot UPDATE

| Aspect | Detail |
| --- | --- |
| Validation | Does **not** prove CMS Edge Save path |
| Use | **Emergency / fallback only** (rollback-style recovery) |
| **Verdict** | **REJECTED as primary path** · fallback only |

### Option D — service_role

| **Verdict** | **STOP / REJECTED** — forbidden by project policy |

### Option E — RPC / SECURITY DEFINER

| Aspect | Detail |
| --- | --- |
| Risk | Privilege escalation · audit complexity |
| **Verdict** | **REJECTED** — not primary for First controlled Save |

### Summary table

| Option | Verdict |
| --- | --- |
| **A. authenticated UPDATE(title) + RLS + operator JWT** | **SELECTED (first candidate)** |
| B. anon UPDATE + RLS | **REJECTED** |
| C. manual SQL one-shot | **Fallback only — not primary** |
| D. service_role | **STOP / REJECTED** |
| E. RPC / SECURITY DEFINER | **REJECTED** |

---

## 3. Selected permission model (decision)

**Adopt Option A as the first and only planned write path** for G-20u36e First controlled Save, subject to feasibility gates below.

### 3.1 Core decisions

| # | Decision |
| --- | --- |
| 1 | **Option A** is the **selected permission model** |
| 2 | **operator JWT path** must be **confirmed feasible** in next phase — **do not proceed to permission change or Edge Save draft until confirmed** |
| 3 | If Edge remains **anon key only**, **Save path must not advance** |
| 4 | **authenticated UPDATE(title)** grant — **staging-only · temporary · minimal scope** |
| 5 | **Restrictive RLS policy** — scoped to **1 site · 1 legacy · track_number=1** (`gosaki-piano` / `discography-002` / `1`) |
| 6 | Prefer **new restrictive UPDATE policy** over relying solely on existing `discography_tracks_admin_all` (`is_admin()`) — narrower blast radius for First Save slice |
| 7 | **Edge server-side guard** remains mandatory — old title · new title · fingerprint · dryRun-equivalent diff · track 7 unchanged |
| 8 | **service_role** — **not used** |
| 9 | **anon UPDATE** — **not used** |
| 10 | **First controlled Save** — **still not executable** after this decision phase |

### 3.2 Permission change design premises (no SQL in this phase)

| Premise | Detail |
| --- | --- |
| Project | staging **`kmjqppxjdnwwrtaeqjta` only** |
| Production | **`vsbvndwuajjhnzpohghh` STOP** |
| Table / column | `public.discography_tracks.title` only |
| Row scope | `site_slug='gosaki-piano'` AND `discography_legacy_id='discography-002'` AND `track_number=1` |
| WITH CHECK | Updated row must remain within slice scope |
| Title guard | RLS qual may include `title = 'On a Clear Day'` · **Edge guard still required** |
| Cleanup | Plan **revoke grant / drop policy** after Save verify — decision on keep-vs-revert in permission-change preflight |
| Admin ALL policies | **Remain** — new policy is additive narrow path; do not broaden admin ALL |

### 3.3 Existing admin policies vs new restrictive policy

Snapshot recorded **`discography_tracks_admin_all`** (`cmd=ALL`, `is_admin()`). Option A does **not** depend on widening admin ALL. Planned approach:

- Add **dedicated restrictive UPDATE policy** for the slice row (First Save only)
- Add **authenticated UPDATE(title)** grant if column-level supported
- Operator must present **valid authenticated JWT** satisfying policy qual (admin or slice-specific role — **to be decided in auth JWT feasibility phase**)

Using **`is_admin()` only** without new restrictive policy is **insufficiently narrow** for CMS Kit controlled Save documentation — prefer explicit slice policy.

---

## 4. Pre-SQL feasibility checks (next phases)

**No SQL creation in this decision phase.** Before permission-change preflight SQL:

| # | Check | Phase owner |
| --- | --- | --- |
| 1 | Edge Function can read `Authorization: Bearer <user JWT>` and pass to Supabase client for write | **G-20u36e-controlled-save-auth-jwt-feasibility-planning** |
| 2 | Operator can obtain and send **authenticated user JWT** (staging admin session / curl / script) | auth JWT feasibility |
| 3 | **`is_admin()` vs new restrictive policy** — which JWT role satisfies write path | auth JWT feasibility + permission-change preflight |
| 4 | **Column-level UPDATE(title)** grant works via PostgREST PATCH | permission-change preflight (after JWT feasible) |
| 5 | **RLS WITH CHECK** prevents row scope escape | permission-change preflight |
| 6 | **Rollback / cleanup** — REVOKE grant + DROP policy after Save | permission-change preflight |
| 7 | **Keep vs revert permissions** on staging after successful Save | permission-change preflight / operator decision |

---

## 5. Recommended phase order

| Order | Phase | Scope |
| --- | --- | --- |
| **1** | **G-20u36e-controlled-save-auth-jwt-feasibility-planning** | Edge JWT forward · operator JWT ops · **recommended next** |
| 2 | G-20u36e-controlled-save-permission-change-preflight-planning | Grant/RLS change requirements · rollback doc |
| 3 | Permission change SQL preflight | Executable SQL in **separate approved phase only** |
| 4 | Operator manual permission change | GRANT/RLS on staging · explicit approval |
| 5 | Edge Save path tools draft | Save branch + guards in tools draft |
| 6 | Root placement | supabase/functions copy · scoped approval |
| 7 | Edge deploy | Staging deploy preflight + operator deploy |
| 8 | One-shot Save execution | Operator controlled Save once |

**Gate:** Steps 3–8 **blocked** until Step 1 confirms operator JWT feasibility.

---

## 6. STOP conditions

Stop and ask operator if:

| # | Condition |
| --- | --- |
| 1 | **Operator JWT path** cannot be established |
| 2 | Edge **cannot move off anon key only** for write client |
| 3 | **Authenticated user / admin** identity for write is **unknown** |
| 4 | **Title column-only** UPDATE grant is **not supported** or **not verifiable** |
| 5 | **Row-scoped RLS** would be **broader** than single slice row |
| 6 | **anon UPDATE** becomes necessary |
| 7 | **service_role** becomes necessary |
| 8 | **RPC / SECURITY DEFINER** becomes necessary |
| 9 | Production ref **`vsbvndwuajjhnzpohghh`** appears in target/config |
| 10 | **Permission rollback / cleanup** plan cannot be documented |
| 11 | Decision phase requires **SQL creation** |
| 12 | Decision phase requires **DB write** |
| 13 | Decision phase requires **operation=save** HTTP send |

---

## 7. Next phase

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-auth-jwt-feasibility-planning** | Edge Authorization header · Supabase client with user JWT · operator JWT acquisition · **no implementation** |

**Not next:** permission-change SQL · GRANT execution · Edge Save draft (until JWT feasibility PASS).

---

## 8. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| SQL created | **no** |
| Executable SQL blocks | **no** |
| SQL executed | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP re-sent | **no** |
| Save enabled | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |
| First controlled Save | **not executable** |

---

## Verifier

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-permission-model-decision
```

Script: `scripts/verify-g20u36e-controlled-save-permission-model-decision.mjs`
