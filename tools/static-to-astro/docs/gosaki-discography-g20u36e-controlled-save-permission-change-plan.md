# G-20u36e — Gosaki Discography controlled Save permission change plan

**Phase:** `G-20u36e-controlled-save-permission-change-planning`  
**Status:** **complete** — planning only · **no executable SQL · no GRANT/REVOKE · no POLICY · no DB write · no Save**  
**Date:** 2026-07-14  
**Base commit:** `17aac7a`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result.md) · [gosaki-discography-g20u36e-controlled-save-permission-model-decision.md](./gosaki-discography-g20u36e-controlled-save-permission-model-decision.md)

| Check | Status |
| --- | --- |
| Planning only | **yes** |
| Executable SQL block | **none** · なし |
| SQL executed | **no** |
| GRANT / REVOKE executed | **no** |
| CREATE / ALTER / DROP POLICY executed | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save | **not sent** · 未送信 |
| Save enablement | **no** |
| FTP / upload | **no** |
| Production changed | **no** · production未変更 |
| service_role | **not used** · 不使用 |
| JWT / access_token / refresh_token displayed | **no** · 非表示 |
| Operator JWT admin | **VERIFIED** (STG readonly probe) |
| Current authenticated UPDATE grants | **0** (table + title column) |
| First controlled Save | **still not allowed** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionChangePlanPrepared: true
phase: G-20u36e-controlled-save-permission-change-planning
planningOnly: true
executableSqlBlockPresent: false
sqlExecuted: false
grantRevokeExecuted: false
createAlterDropPolicyExecuted: false
dbWriteExecuted: false
edgeImplementationExecuted: false
supabaseFunctionsEdited: false
edgeDeployExecuted: false
operationSaveSent: false
saveEnablementExecuted: false
ftpUploadExecuted: false
productionChanged: false
serviceRoleUsed: false
jwtAccessTokenRefreshTokenDisplayed: false
operatorJwtAdminVerified: true
currentAuthenticatedUpdateGrantsZero: true
currentAuthenticatedTitleUpdateColumnGrantsZero: true
firstControlledSaveStillNotAllowed: true
readyForFirstControlledSaveExecution: false
recommendedNextPhase: G-20u36e-controlled-save-permission-change-sql-prep
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.  
**STG UI package sourceCommit:** `724d951f4d64eb5fa03e96d9d97c79da1c91bade`

---

## 1. Permission change purpose

Enable **First controlled Save** so an authenticated **operator JWT** that already passes `public.is_admin()` can update **exactly one** `discography_tracks.title` cell — and nothing else.

| Allow | Deny |
| --- | --- |
| `authenticated` + `is_admin()` + slice row + `title` only | Other rows / columns / sites / releases / tracks |
| Staging project only | Production ref / path |
| Grant + restrictive RLS (planned later) | anon write · service_role · table-wide UPDATE |

UI/package layer and DB permission layer are **separate** — UI reupload does not change grants/RLS.

---

## 2. Current verified baseline

| Item | Value |
| --- | --- |
| Operator JWT `is_admin()` | **true** (STG probe · **VERIFIED**) |
| `is_admin()` definition | `admin_users.user_id = auth.uid() AND role = 'admin'` |
| Policies | `discography_admin_all` · `discography_tracks_admin_all` (PERMISSIVE / ALL / authenticated / `is_admin()`) + public SELECT |
| authenticated UPDATE grants | **0** |
| authenticated title UPDATE column grants | **0** |
| anon write grants | **0** |
| RLS | enabled on `discography` and `discography_tracks` |

### Target controlled Save slice (G-20u36e1)

| Field | Value |
| --- | --- |
| table | `public.discography_tracks` |
| id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | `1` |
| before title | `On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count (album) | `8` |
| track_7_title | `Like a Lover` |

---

## 3. Recommended model (Option A — execute planning)

Aligns with selected permission model decision:

| Layer | Plan |
| --- | --- |
| Grant | **authenticated** → `UPDATE(title)` on `public.discography_tracks` only (column-level · not table-wide) |
| RLS | Keep existing **PERMISSIVE** `*_admin_all` (`is_admin()`) · add **one RESTRICTIVE UPDATE** policy for the slice |
| Caller | Operator JWT with `is_admin()=true` (already VERIFIED) |
| anon | **no** write grant |
| service_role | **rejected / STOP** |
| SECURITY DEFINER RPC for Save | **rejected** this path |
| Manual SQL UPDATE as main route | **rejected** |

---

## 4. Restrictive RLS design

Postgres RLS: PERMISSIVE policies OR-combine; RESTRICTIVE policies AND-combine. For UPDATE:

| Clause | Role | Slice condition |
| --- | --- | --- |
| **USING** (old row) | Must match row being updated | `site_slug = 'gosaki-piano'` AND `discography_legacy_id = 'discography-002'` AND `track_number = 1` AND `title = 'On a Clear Day'` |
| **WITH CHECK** (new row) | Must match row after update | `site_slug = 'gosaki-piano'` AND `discography_legacy_id = 'discography-002'` AND `track_number = 1` AND `title = 'On a Clear Day [CMS Kit staging G-20u36e]'` |

### Design notes

- **USING alone** is insufficient for write-time title drift — **WITH CHECK** required for after-title.
- **WITH CHECK alone** cannot constrain the pre-update row — **USING** required.
- Column-level `UPDATE(title)` blocks non-title column writes even if RLS row matched.
- Expected invariants before/after permission change (no data mutate in this / SQL-prep phases): `track_count=8` · track 7 `Like a Lover` · target row still before-title until Save.
- Suggested policy name (for SQL prep · not created here): e.g. `discography_tracks_g20u36e1_title_update_restrictive` — avoid colliding with existing names.
- Existing `discography_tracks_admin_all` remains; restrictive policy **narrows** UPDATE for this slice beyond admin ALL.

---

## 5. Expected state after permission change (future apply phase)

| Check | Expected |
| --- | --- |
| authenticated title UPDATE column grant count | **1** |
| broad authenticated table UPDATE | prefer remain **0** |
| anon write grants | **0** |
| restrictive UPDATE policy count | **1** |
| admin_all permissive policies | **remain** |
| RLS enabled | **remain** |
| operator JWT `is_admin` | still **true** |
| target row data | **unchanged** until Save |
| Save / operation=save | **still not executed** |
| Edge Save path | **still not implemented** in permission apply |

---

## 6. Rollback方針

Rollback is a **separate phase** (SQL prep → explicit approval → execute). Planning intents only:

| Action | Intent |
| --- | --- |
| REVOKE | `UPDATE(title)` from `authenticated` on `discography_tracks` |
| DROP | the restrictive UPDATE policy |
| Grants | return authenticated title UPDATE count to **0** |
| Keep | RLS **enabled** · admin_all · public SELECT |
| Do not | change target row data during rollback of grants/policy |
| Do not | run rollback without documented SQL prep + approval |

---

## 7. Preflight / verification方針

### Before permission-change SQL prep / apply

| # | Check |
| --- | --- |
| 1 | Current grants snapshot (authenticated UPDATE / title column / anon write = 0) |
| 2 | Current policies snapshot (admin_all + SELECT · no unexpected restrictive UPDATE) |
| 3 | Target row count = **1** · id `e30c5ea9-…` |
| 4 | title still `On a Clear Day` |
| 5 | track_count still **8** · track_7 still `Like a Lover` |
| 6 | Operator JWT admin recently **VERIFIED** (or re-probe if session stale) |
| 7 | Active project = staging `kmjqppxjdnwwrtaeqjta` · production ref **not** active |
| 8 | No service_role |

### After permission-change apply (future)

| # | Check |
| --- | --- |
| 1 | authenticated title UPDATE grant = **1** |
| 2 | Document broad table UPDATE grant handling (prefer still 0) |
| 3 | anon write = **0** |
| 4 | restrictive UPDATE policy exists (count = 1) |
| 5 | RLS still enabled |
| 6 | Target row **unchanged** |
| 7 | Save still not executed · operation=save still not sent |

---

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| `GRANT UPDATE(title)` without tight RLS opens wide title writes for any role matching RLS | Restrictive USING+WITH CHECK · keep `is_admin()` via permissive admin |
| Wrong restrictive policy → wrong-row update or cannot update | Exact slice predicates · preflight row check · rollback SQL ready first |
| WITH CHECK only / USING only | Always both |
| Policy name collision | Unique G-20u36e1 name in SQL prep |
| Apply without rollback SQL | STOP until rollback prep exists |
| Permission apply then click Save before Edge Save path | Save remain disabled · no operation=save |
| Confusing UI package freshness vs DB grants | Treat as separate layers |

---

## 9. Rejected options

| Option | Verdict |
| --- | --- |
| anon UPDATE grant | **rejected** |
| table-wide unrestricted UPDATE | **rejected** |
| service_role | **rejected / STOP** |
| SECURITY DEFINER RPC for Save | **rejected** for this phase |
| Manual SQL UPDATE as main Save route | **rejected** |
| Production permission change | **STOP** |

---

## 10. First controlled Save still not allowed

Permission **planning** does not unlock Save. Still required after this plan:

1. SQL prep (next) → approval → apply (later phases)  
2. Post-apply grant/policy verification  
3. Edge Save path that forwards operator JWT (separate)  
4. Explicit Save arm / operation=save phase  

Until then: **First controlled Save still not allowed**.

---

## 11. Recommended next phase

**`G-20u36e-controlled-save-permission-change-sql-prep`**

Prepare reviewable SQL text for GRANT + restrictive POLICY + rollback — **still no SQL execution** in that phase.

---

## 12. Not executed in this phase

Executable SQL · GRANT/REVOKE · CREATE/ALTER/DROP POLICY · DB write · Edge · functions edit · deploy · operation=save · Save · FTP · production · service_role.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-permission-change-plan
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result
npm run verify:g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result
npm run verify:current-active-regression
```
