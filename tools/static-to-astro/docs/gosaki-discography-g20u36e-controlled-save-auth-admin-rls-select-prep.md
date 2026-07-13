# G-20u36e — Gosaki Discography controlled Save auth / admin / RLS SELECT prep

**Phase:** `G-20u36e-controlled-save-auth-admin-rls-select-prep`  
**Status:** **complete** — SELECT-only SQL prepared · **Cursor did not execute SQL**  
**Date:** 2026-07-14  
**Base commit:** `15636be`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-preflight.md](./gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-preflight.md) — **NEEDS_SELECT_ONLY_AUTH_SNAPSHOT**

| Check | Status |
| --- | --- |
| Auth / admin / RLS SELECT prep | **yes** (this file) |
| Prep only | **yes** |
| SQL executed | **no** |
| SELECT-only SQL prepared | **yes** |
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
gosakiDiscographyControlledSaveAuthAdminRlsSelectPrepReady: true
phase: G-20u36e-controlled-save-auth-admin-rls-select-prep
prepOnly: true
sqlExecuted: false
selectOnlySqlPrepared: true
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
readyForG20u36eAuthAdminRlsSelectExecution: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## Purpose

Prepare a **single copy-paste SELECT-only SQL block** for operator execution in Supabase SQL Editor on staging. Captures:

- `is_admin()` function metadata + definition (`pg_get_functiondef`)
- Policies that reference `is_admin()` on discography tables
- Permissive / restrictive policy inventory
- RLS status
- Grant re-check (anon write · authenticated UPDATE · title column)
- SQL Editor `is_admin()` callability note (not operator JWT context)
- Target slice sanity (track 1 / track 7 / count 8)

**This phase:** SQL preparation + operator checklist only — **no execution**.

**Output column:** `g20u36e_auth_admin_rls_snapshot`

---

## Controlled Save target (context)

| Field | Value |
| --- | --- |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| table | `public.discography_tracks` |
| track_number | **1** |
| before title | `On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track count | **8** |
| track 7 | **`Like a Lover`** |

---

## Operator checklist

1. Open Supabase Dashboard → confirm project ref is **`kmjqppxjdnwwrtaeqjta`** (`static-to-astro-cms-staging`).
2. If project ref is **`vsbvndwuajjhnzpohghh`** → **STOP** — do not run any SQL.
3. SQL Editor → paste **entire** §SELECT-only SQL block below → Run **once**.
4. Confirm result is **one row** with column **`g20u36e_auth_admin_rls_snapshot`** (JSON).
5. Copy the **JSON result** → paste into ChatGPT / record in **`G-20u36e-controlled-save-auth-admin-rls-select-execution`** phase.
6. Review `checks` against §Expected results / §PASS / §STOP.
7. **Do not** paste JWT · access_token · anon key · service_role · passwords into chat or this SQL.
8. Result JSON must **not** contain user emails — this SQL is designed to output counts · policy text · function def only (no `auth.users` row dump).
9. **SQL Editor `is_admin()` result is NOT operator JWT context** — `auth.uid()` is often **null** in SQL Editor. Do not treat `sql_editor_is_admin_result` as proof that your staging login is (or is not) admin.
10. **Do not** run GRANT / REVOKE / CREATE POLICY / UPDATE / Save in this phase.
11. If any STOP condition triggers → do not proceed to tools draft / permission change.

**Cursor / AI:** must **not** execute this SQL.

---

## SELECT-only SQL block

**Classification:** SELECT-only.  
**Forbidden in SQL body:** INSERT · UPDATE · DELETE · ALTER · CREATE · DROP · GRANT · REVOKE · TRUNCATE · RPC execution.  
**Comments** may mention forbidden operations for operator guidance.  
**Secrets / JWT / email:** not selected as data rows.

```sql
-- G-20u36e — Gosaki Discography controlled Save auth/admin/RLS snapshot (SELECT-ONLY)
-- Phase: G-20u36e-controlled-save-auth-admin-rls-select-prep
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Cursor does NOT execute this block.
-- Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE TRUNCATE RPC
-- NOTE: SQL Editor auth.uid() is often null — is_admin() probe != operator JWT context
-- NOTE: No auth.users email dump — auth_users_count only

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-auth-admin-rls-select-execution'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day'::text AS target_track_1_title_expected,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
is_admin_functions AS (
  SELECT
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS argument_list,
    pg_get_function_result(p.oid) AS return_type,
    l.lanname AS language,
    p.prosecdef AS security_definer,
    (NOT p.prosecdef) AS security_invoker,
    CASE p.provolatile
      WHEN 'i' THEN 'immutable'
      WHEN 's' THEN 'stable'
      WHEN 'v' THEN 'volatile'
      ELSE p.provolatile::text
    END AS volatility,
    pg_get_functiondef(p.oid) AS function_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE p.proname = 'is_admin'
    AND n.nspname IN ('public', 'auth', 'extensions')
),
policies AS (
  SELECT
    pol.schemaname,
    pol.tablename,
    pol.policyname,
    pol.permissive,
    pol.roles,
    pol.cmd,
    pol.qual,
    pol.with_check,
    (
      coalesce(pol.qual, '') ILIKE '%is_admin%'
      OR coalesce(pol.with_check, '') ILIKE '%is_admin%'
    ) AS references_is_admin
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public'
    AND pol.tablename = ANY (p.target_tables)
),
rls_status AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN params p
  WHERE n.nspname = 'public'
    AND c.relname = ANY (p.target_tables)
),
table_grants AS (
  SELECT
    g.table_schema,
    g.table_name,
    g.grantee,
    g.privilege_type,
    g.is_grantable
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
),
column_privileges AS (
  SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.grantee,
    c.privilege_type,
    c.is_grantable
  FROM information_schema.column_privileges c
  CROSS JOIN params p
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography_tracks'
    AND c.column_name = 'title'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
),
auth_users_count AS (
  SELECT count(*)::bigint AS auth_users_count
  FROM auth.users
),
sql_editor_is_admin_probe AS (
  SELECT
    (SELECT count(*) > 0 FROM is_admin_functions) AS sql_editor_is_admin_callable,
    CASE
      WHEN (SELECT count(*) FROM is_admin_functions) = 0 THEN NULL
      WHEN to_regprocedure('public.is_admin()') IS NOT NULL THEN public.is_admin()
      ELSE NULL
    END AS sql_editor_is_admin_result,
    'SQL Editor context only — auth.uid() often null; NOT operator JWT context'::text AS sql_editor_is_admin_context_note
),
target_row AS (
  SELECT
    t.id,
    t.site_slug,
    t.discography_legacy_id,
    t.track_number,
    t.title,
    t.sort_order
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
    AND t.title = p.target_track_1_title_expected
),
target_tracks AS (
  SELECT
    t.track_number,
    t.title,
    t.sort_order
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
  ORDER BY t.sort_order ASC NULLS LAST, t.track_number ASC NULLS LAST
),
checks AS (
  SELECT
    (SELECT count(*) FROM is_admin_functions)::int AS is_admin_function_count,
    (SELECT count(*) FROM is_admin_functions f WHERE f.security_definer)::int AS is_admin_security_definer_count,
    (SELECT count(*) FROM policies pol WHERE pol.references_is_admin)::int AS is_admin_policy_count,
    (SELECT count(*) FROM policies pol WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int AS admin_all_policy_count,
    (SELECT count(*) FROM policies pol WHERE pol.tablename = 'discography_tracks' AND pol.permissive = 'RESTRICTIVE')::int AS discography_tracks_restrictive_policy_count,
    (SELECT count(*) FROM policies pol WHERE pol.tablename = 'discography_tracks' AND pol.permissive = 'PERMISSIVE')::int AS discography_tracks_permissive_policy_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false) FROM rls_status rs WHERE rs.table_name = 'discography') AS rls_enabled_discography,
    (SELECT coalesce(bool_or(rs.rls_enabled), false) FROM rls_status rs WHERE rs.table_name = 'discography_tracks') AS rls_enabled_discography_tracks,
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'authenticated' AND tg.privilege_type = 'UPDATE')::int AS authenticated_update_grants_count,
    (SELECT count(*) FROM column_privileges cp WHERE cp.grantee = 'authenticated' AND cp.privilege_type = 'UPDATE')::int AS authenticated_title_update_column_grants_count,
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'anon' AND tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE'))::int AS anon_write_grants_count,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tr.title FROM target_tracks tr WHERE tr.track_number = 7 LIMIT 1) AS track_7_title,
    (SELECT probe.sql_editor_is_admin_callable FROM sql_editor_is_admin_probe probe) AS sql_editor_is_admin_callable,
    (SELECT probe.sql_editor_is_admin_result FROM sql_editor_is_admin_probe probe) AS sql_editor_is_admin_result
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'target_site_slug', (SELECT target_site_slug FROM params),
  'target_legacy_id', (SELECT target_legacy_id FROM params),
  'is_admin_functions', coalesce(
    (SELECT jsonb_agg(to_jsonb(f) ORDER BY f.schema_name, f.function_name) FROM is_admin_functions f),
    '[]'::jsonb
  ),
  'is_admin_functions_note',
    'function_definition is for review of admin criteria (tables/claims). Do not treat as executable migration SQL.',
  'policies', coalesce(
    (SELECT jsonb_agg(to_jsonb(pol) ORDER BY pol.tablename, pol.policyname) FROM policies pol),
    '[]'::jsonb
  ),
  'rls_status', coalesce(
    (SELECT jsonb_agg(to_jsonb(rs) ORDER BY rs.table_name) FROM rls_status rs),
    '[]'::jsonb
  ),
  'role_table_grants', coalesce(
    (SELECT jsonb_agg(to_jsonb(tg) ORDER BY tg.table_name, tg.grantee, tg.privilege_type) FROM table_grants tg),
    '[]'::jsonb
  ),
  'column_privileges_title', coalesce(
    (SELECT jsonb_agg(to_jsonb(cp) ORDER BY cp.grantee) FROM column_privileges cp),
    '[]'::jsonb
  ),
  'auth_users_count', (SELECT auth_users_count FROM auth_users_count),
  'auth_users_note', 'count only — no email / user id dump',
  'sql_editor_is_admin_probe', (SELECT to_jsonb(probe) FROM sql_editor_is_admin_probe probe),
  'operator_jwt_admin_note',
    'SQL Editor is_admin() result is SQL Editor executor context (auth.uid often null). Operator JWT admin status requires a separate JWT-scoped probe phase — do not over-interpret this snapshot.',
  'target_row', coalesce((SELECT to_jsonb(tr) FROM target_row tr LIMIT 1), 'null'::jsonb),
  'target_tracks_sample', coalesce(
    (SELECT jsonb_agg(to_jsonb(tt) ORDER BY tt.track_number) FROM target_tracks tt),
    '[]'::jsonb
  ),
  'checks', (SELECT to_jsonb(c) FROM checks c)
) AS g20u36e_auth_admin_rls_snapshot;
```

### SQL inventory groups

| Group | Source | Purpose |
| --- | --- | --- |
| **A** | `pg_proc` + `pg_get_functiondef` | `is_admin()` metadata · security_definer · definition text |
| **B** | `pg_policies` | Policies · `is_admin()` reference · admin ALL |
| **C** | `pg_policies.permissive` | Permissive vs restrictive counts on `discography_tracks` |
| **D** | `pg_class` / `pg_namespace` | RLS enabled / forced |
| **E** | `role_table_grants` / `column_privileges` | Grant re-check (expect UPDATE = 0) |
| **F** | `is_admin()` probe + `auth.users` count | Callable flag · SQL Editor result · **no email** |
| **G** | `discography_tracks` | Target row · track count · track 7 |
| **H** | `checks` | Summary for PASS/STOP review |

---

## Expected results (checks — after operator execution)

| check_key | Expected | Notes |
| --- | --- | --- |
| `is_admin_function_count` | **≥ 1** | Prefer `public.is_admin()` |
| `is_admin_security_definer_count` | record actual | Informational — SECURITY DEFINER common for admin helpers |
| `is_admin_policy_count` | **≥ 2** (likely) | Policies referencing `is_admin` |
| `admin_all_policy_count` | **2** (likely) | `discography_admin_all` · `discography_tracks_admin_all` |
| `discography_tracks_restrictive_policy_count` | **0** (likely today) | New restrictive policy is planned later — absence informs need |
| `discography_tracks_permissive_policy_count` | **≥ 1** | Includes admin ALL + public SELECT |
| `rls_enabled_discography` | **true** | |
| `rls_enabled_discography_tracks` | **true** | |
| `authenticated_update_grants_count` | **0** | Matches permission snapshot |
| `authenticated_title_update_column_grants_count` | **0** | |
| `anon_write_grants_count` | **0** | |
| `target_row_count` | **1** | |
| `track_count` | **8** | |
| `track_7_title` | **`Like a Lover`** | |
| `sql_editor_is_admin_callable` | **true** if function exists | |
| `sql_editor_is_admin_result` | true/false/null | **SQL Editor context only** |

**Admin ALL permissive check:** policies inventory should show `discography_tracks_admin_all` with `permissive = PERMISSIVE`.

---

## PASS conditions (execution phase — for operator result review)

Snapshot execution **PASS** (unlock result record + next planning) when:

| # | Condition |
| --- | --- |
| 1 | Operator confirmed project ref **`kmjqppxjdnwwrtaeqjta`** |
| 2 | JSON readable · column **`g20u36e_auth_admin_rls_snapshot`** present |
| 3 | `is_admin_function_count` ≥ **1** · `function_definition` readable |
| 4 | Admin criteria judgeable from `function_definition` (tables / `auth.uid()` / claims) — **not** secret-dependent |
| 5 | `admin_all_policy_count` recorded · admin ALL policies present in `policies` |
| 6 | Admin ALL policies recorded as **PERMISSIVE** (supports restrictive-add design) |
| 7 | `rls_enabled_discography` = **true** · `rls_enabled_discography_tracks` = **true** |
| 8 | `authenticated_update_grants_count` = **0** · `authenticated_title_update_column_grants_count` = **0** |
| 9 | `anon_write_grants_count` = **0** |
| 10 | `target_row_count` = **1** · `track_count` = **8** · `track_7_title` = **`Like a Lover`** |
| 11 | Restrictive policy necessity assessable (`discography_tracks_restrictive_policy_count` recorded) |
| 12 | No email / JWT / secret values in JSON |
| 13 | **service_role not required** for snapshot itself |

**PASS does not authorize Save** — only unlocks result record + tools-draft / permission-change **planning** after human review.

**Note on operator JWT admin:** This snapshot cannot prove staging-shell operator JWT is admin. A later JWT-scoped probe may be needed after identity designation — separate from this SELECT prep.

---

## STOP conditions

Stop and do **not** proceed to permission-change / Save if:

| # | Condition |
| --- | --- |
| 1 | Supabase project ref unknown or **`vsbvndwuajjhnzpohghh`** |
| 2 | `is_admin_function_count` = **0** or `function_definition` unreadable |
| 3 | `is_admin()` definition implies **service_role** dependency or other inappropriate write path |
| 4 | Admin criteria remain **unknown** after reading `function_definition` |
| 5 | `rls_enabled_discography` or `rls_enabled_discography_tracks` = **false** |
| 6 | `authenticated_update_grants_count` > **0** or broad UPDATE grant already present without plan |
| 7 | `anon_write_grants_count` > **0** |
| 8 | `target_row_count` ≠ **1** |
| 9 | `track_count` ≠ **8** |
| 10 | `track_7_title` ≠ **`Like a Lover`** |
| 11 | SQL block contained non-SELECT statements (operator error — use this doc block only) |
| 12 | Result JSON contains secrets · JWT · emails (design breach — STOP + redact) |
| 13 | Any temptation to run GRANT/REVOKE / CREATE POLICY in same session — **STOP** |

---

## Next phase

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-auth-admin-rls-select-execution** | Operator manual SELECT · result record doc · PASS/STOP judgment |

**After PASS result record (recommended order):**

1. Review `is_admin()` definition + permissive/restrictive counts
2. `G-20u36e-controlled-save-auth-jwt-tools-draft-planning` (may proceed for Edge/caller design)
3. `G-20u36e-controlled-save-permission-change-preflight-planning` — **only after** auth-admin-rls snapshot PASS

**Not in next phase by default:** GRANT/REVOKE · RLS change · Edge Save implementation · operation=save.

---

## Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| SQL executed by Cursor | **no** |
| GRANT / REVOKE executed | **no** |
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
| JWT / access_token displayed | **no** |
| email dump from auth.users | **no** (count only) |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-auth-admin-rls-select-prep
npm run verify:g20u36e-controlled-save-auth-jwt-feasibility-preflight
npm run verify:g20u36e-controlled-save-auth-jwt-feasibility-plan
npm run verify:current-active-regression
```
