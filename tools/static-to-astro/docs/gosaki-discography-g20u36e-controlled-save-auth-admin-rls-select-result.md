# G-20u36e — Gosaki Discography controlled Save auth / admin / RLS SELECT result

**Phase:** `G-20u36e-controlled-save-auth-admin-rls-select-result-record`  
**Status:** **complete** — operator SELECT-only auth/admin/RLS snapshot recorded · **PASS** · **no DB write**  
**Date:** 2026-07-14  
**Base commit:** `cfe4247`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-prep.md](./gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-prep.md)

| Check | Status |
| --- | --- |
| SELECT-only auth/admin/RLS snapshot | **executed by operator** (staging SQL Editor) |
| SQL re-run by Cursor | **no** |
| DB write | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| Edge implementation | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSaveAuthAdminRlsSelectResultRecorded: true
phase: G-20u36e-controlled-save-auth-admin-rls-select-result-record
authAdminRlsSnapshotSelectExecutedByOperator: true
authAdminRlsSnapshotPass: true
sqlReExecutedByCursor: false
dbWriteExecuted: false
grantRevokeExecuted: false
rlsPolicyChangeExecuted: false
edgeImplementationExecuted: false
edgeDeployExecuted: false
operationSaveSent: false
dryRunHttpSent: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
operatorJwtAdminStatusVerified: false
isAdminFunctionDefinitionConfirmed: true
restrictivePolicyPresentOnDiscographyTracks: false
authenticatedUpdateGrantPresent: false
readyForG20u36eAuthJwtAdminProbePlanning: true
readyForPermissionChangePreflight: false
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## Snapshot execution context

| Item | Value |
| --- | --- |
| Executor | Operator (Supabase SQL Editor) |
| Cursor SQL execution | **no** · **SQL re-run none** |
| Output column | `g20u36e_auth_admin_rls_snapshot` |
| Result `phase` | `G-20u36e-controlled-save-auth-admin-rls-select-execution` |
| `expected_project_ref` | `kmjqppxjdnwwrtaeqjta` |
| `production_project_ref_stop` | `vsbvndwuajjhnzpohghh` |
| `captured_at` | `2026-07-13T23:40:42.848989+00:00` |

---

## 1. Checks (recorded)

| check_key | Recorded |
| --- | --- |
| `is_admin_function_count` | **1** |
| `is_admin_security_definer_count` | **1** |
| `is_admin_policy_count` | **2** |
| `admin_all_policy_count` | **2** |
| `discography_tracks_restrictive_policy_count` | **0** |
| `discography_tracks_permissive_policy_count` | **2** |
| `rls_enabled_discography` | **true** |
| `rls_enabled_discography_tracks` | **true** |
| `authenticated_update_grants_count` | **0** |
| `authenticated_title_update_column_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `target_row_count` | **1** |
| `track_count` | **8** |
| `track_7_title` | **`Like a Lover`** |
| `sql_editor_is_admin_callable` | **true** |
| `sql_editor_is_admin_result` | **false** |

---

## 2. `is_admin()` function (recorded)

| Field | Value |
| --- | --- |
| schema | `public` |
| language | `sql` |
| return_type | `boolean` |
| volatility | `stable` |
| `security_definer` | **true** (`SECURITY DEFINER`) |
| count | **1** |

**Definition summary (no secrets):**

`is_admin()` returns whether a row exists in **`public.admin_users`** where:

- `user_id = auth.uid()`
- `role = 'admin'`

**Implication:** Admin gate is **DB membership in `admin_users`**, not browser mock-allowlist. Operator JWT must map to a `admin_users` row with `role='admin'` for `is_admin()` to be true under Edge Save.

---

## 3. Policies (recorded)

| policy | permissive | cmd | roles | using |
| --- | --- | --- | --- | --- |
| `discography_admin_all` | **PERMISSIVE** | ALL | authenticated | `is_admin()` |
| `discography_public_select` | **PERMISSIVE** | SELECT | anon, authenticated | `published = true` |
| `discography_tracks_admin_all` | **PERMISSIVE** | ALL | authenticated | `is_admin()` |
| `discography_tracks_public_select` | **PERMISSIVE** | SELECT | anon, authenticated | published parent discography exists |

| Metric | Recorded |
| --- | --- |
| Policies referencing `is_admin` | **2** |
| Admin ALL policies | **2** |
| `discography_tracks` **RESTRICTIVE** | **0** |
| `discography_tracks` **PERMISSIVE** | **2** |

**RLS composition note:** Admin ALL is **PERMISSIVE**. No restrictive policy exists yet. Option A still requires a **new restrictive UPDATE policy** before First controlled Save so admin ALL does not widen blast radius after any future UPDATE grant.

---

## 4. RLS status (recorded)

| Table | `rls_enabled` |
| --- | --- |
| `public.discography` | **true** |
| `public.discography_tracks` | **true** |

---

## 5. Grants (recorded)

| Grant | Recorded |
| --- | --- |
| anon SELECT `discography` | present |
| authenticated SELECT `discography` | present |
| anon SELECT `discography_tracks` | present |
| authenticated SELECT `discography_tracks` | present |
| INSERT / UPDATE / DELETE (anon or authenticated) | **none** |
| `column_privileges_title` | **`[]`** |
| `authenticated_update_grants_count` | **0** |
| `authenticated_title_update_column_grants_count` | **0** |
| `anon_write_grants_count` | **0** |

**Judgment:** Grants remain **SELECT only**. **Permission change still required** before controlled Save (Option A: authenticated UPDATE(title) + restrictive RLS). No write path is open today at grant layer.

---

## 6. Target slice (recorded)

| Field | Value |
| --- | --- |
| id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | **1** |
| title | **`On a Clear Day`** |
| track_count | **8** |
| track 7 | **`Like a Lover`** |
| target_row_count | **1** |

---

## 7. PASS / STOP judgment

### Auth / Admin / RLS snapshot = **PASS**

| Condition | Result |
| --- | --- |
| Project ref staging | **PASS** (`kmjqppxjdnwwrtaeqjta`) |
| `is_admin_function_count` = 1 · definition readable | **PASS** |
| Admin criteria known (`admin_users` + `auth.uid()` + `role='admin'`) | **PASS** |
| Admin ALL policies recorded · PERMISSIVE | **PASS** |
| RLS enabled both tables | **PASS** |
| Grants SELECT only · UPDATE = 0 · anon write = 0 | **PASS** |
| Target slice 1 / 8 / Like a Lover | **PASS** |
| Restrictive policy need assessable (count = 0) | **PASS** |
| No email / JWT / secret dump in operator-provided summary | **PASS** |

### SQL Editor `is_admin()` = false — **not STOP**

| Item | Judgment |
| --- | --- |
| `sql_editor_is_admin_callable` | **true** |
| `sql_editor_is_admin_result` | **false** |
| Meaning | SQL Editor executor context (`auth.uid()` often **null**) — **not** operator JWT context |
| STOP? | **no** — expected for Dashboard SQL Editor |

### Remaining gaps (do not unlock Save)

| Gap | Status |
| --- | --- |
| **Operator JWT admin status** | **unverified** — requires JWT-scoped probe |
| Restrictive policy on `discography_tracks` | **absent** (count = 0) |
| authenticated UPDATE(title) grant | **absent** (still 0) |
| Edge Save path | not implemented |
| First controlled Save | **still not allowed** |

**Do not proceed to permission-change SQL or Edge Save implementation until JWT-scoped admin probe is planned (and preferably executed).**

---

## 8. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| SQL re-run by Cursor | **no** |
| GRANT / REVOKE | **no** |
| RLS CREATE/ALTER/DROP | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** |
| dryRun HTTP sent | **no** |
| Admin UI change | **no** |
| FTP | **no** |
| service_role | **not used** |

---

## 9. Next phase

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-auth-jwt-admin-probe-planning** | Design JWT-scoped read-only probe so operator JWT can confirm DB `is_admin()` = true (Edge or safe client) · **no implementation / SQL / Save in planning** |

**After JWT admin probe PASS:**

1. `G-20u36e-controlled-save-auth-jwt-tools-draft-planning` (or continue if already planned)
2. `G-20u36e-controlled-save-permission-change-preflight-planning` — authenticated UPDATE(title) + restrictive RLS

**Not next:** permission-change SQL · Save · Edge deploy.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-admin-rls-select-result
npm run verify:g20u36e-controlled-save-auth-admin-rls-select-prep
npm run verify:g20u36e-controlled-save-auth-jwt-feasibility-preflight
npm run verify:current-active-regression
```
