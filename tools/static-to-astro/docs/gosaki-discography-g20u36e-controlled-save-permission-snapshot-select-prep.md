# G-20u36e — Gosaki Discography controlled Save permission snapshot SELECT prep

**Phase:** `G-20u36e-controlled-save-permission-snapshot-select-prep`  
**Status:** **complete** — SELECT-only SQL prepared · **Cursor did not execute SQL**  
**Date:** 2026-07-14  
**Base commit:** `56aef0e`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-preflight-plan.md](./gosaki-discography-g20u36e-controlled-save-permission-preflight-plan.md) — **complete**

| Check | Status |
| --- | --- |
| Permission snapshot SELECT prep | **yes** (this file) |
| Prep only | **yes** |
| SQL executed | **no** |
| SELECT-only SQL prepared | **yes** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| DB write | **no** |
| Edge implementation | **no** |
| supabase/functions edit | **no** |
| Edge deploy | **no** |
| operation=save sent | **no** — operation=save not sent |
| dryRun HTTP re-sent | **no** |
| Admin UI change | **no** |
| FTP / upload | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionSnapshotSelectPrepReady: true
phase: G-20u36e-controlled-save-permission-snapshot-select-prep
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
readyForG20u36ePermissionSnapshotSelectExecution: true
readyForFirstControlledSaveExecution: false
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## Purpose

Prepare a **single copy-paste SELECT-only SQL block** for operator execution in Supabase SQL Editor on staging. Captures grants · column privileges · RLS · policies · target row/slice sanity before any permission change or Edge Save path implementation.

**This phase:** SQL preparation + operator checklist only — **no execution**.

---

## Controlled Save target (context)

| Field | Value |
| --- | --- |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| table | `public.discography_tracks` |
| target row | `site_slug=gosaki-piano` · `discography_legacy_id=discography-002` · `track_number=1` · `title=On a Clear Day` |
| after title | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track count | **8** |
| track 7 | **`Like a Lover`** |

---

## Operator checklist

1. Open Supabase Dashboard → confirm project ref is **`kmjqppxjdnwwrtaeqjta`** (`static-to-astro-cms-staging`).
2. If project ref is **`vsbvndwuajjhnzpohghh`** → **STOP** — do not run any SQL.
3. SQL Editor → paste **entire** §SELECT-only SQL block below → Run **once**.
4. Confirm result is **one row** with column **`g20u36e_permission_snapshot`** (JSON).
5. Copy the JSON result → paste into ChatGPT / record in **`G-20u36e-controlled-save-permission-snapshot-select-execution`** phase.
6. Review `checks` object against §Expected results / §PASS conditions.
7. **Do not** run GRANT / REVOKE / CREATE POLICY / UPDATE / Save in this phase.
8. This prep doc contains **no rollback SQL** and **no grant-change SQL**.
9. If any STOP condition triggers → **do not proceed** to Save path tools draft or permission change.

**Cursor / AI:** must **not** execute this SQL.

---

## SELECT-only SQL block

**Classification:** SELECT-only.  
**Forbidden in SQL body:** INSERT · UPDATE · DELETE · ALTER · CREATE · DROP · GRANT · REVOKE · TRUNCATE · RPC execution.  
**Comments** may mention forbidden operations for operator guidance.

```sql
-- G-20u36e — Gosaki Discography controlled Save permission snapshot (SELECT-ONLY)
-- Phase: G-20u36e-controlled-save-permission-snapshot-select-prep
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Cursor does NOT execute this block.
-- Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE TRUNCATE RPC

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-permission-snapshot-select-execution'::text AS phase,
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
policies AS (
  SELECT
    pol.schemaname,
    pol.tablename,
    pol.policyname,
    pol.permissive,
    pol.roles,
    pol.cmd,
    pol.qual,
    pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public'
    AND pol.tablename = ANY (p.target_tables)
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
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'anon' AND tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE'))::int AS anon_write_grants_count,
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'authenticated' AND tg.privilege_type = 'UPDATE')::int AS authenticated_update_grants_count,
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'authenticated' AND tg.table_name = 'discography_tracks' AND tg.privilege_type = 'UPDATE')::int AS authenticated_discography_tracks_update_grants_count,
    (SELECT count(*) FROM column_privileges cp WHERE cp.grantee = 'authenticated' AND cp.privilege_type = 'UPDATE')::int AS authenticated_title_update_column_grants_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false) FROM rls_status rs WHERE rs.table_name = 'discography') AS rls_enabled_discography,
    (SELECT coalesce(bool_or(rs.rls_enabled), false) FROM rls_status rs WHERE rs.table_name = 'discography_tracks') AS rls_enabled_discography_tracks,
    (SELECT count(*) FROM policies pol WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int AS admin_all_policy_count,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT tr.title FROM target_tracks tr WHERE tr.track_number = 1 LIMIT 1) AS target_track_1_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tr.title FROM target_tracks tr WHERE tr.track_number = 7 LIMIT 1) AS track_7_title
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'target_site_slug', (SELECT target_site_slug FROM params),
  'target_legacy_id', (SELECT target_legacy_id FROM params),
  'role_table_grants', coalesce((SELECT jsonb_agg(to_jsonb(tg) ORDER BY tg.table_name, tg.grantee, tg.privilege_type) FROM table_grants tg), '[]'::jsonb),
  'column_privileges_title', coalesce((SELECT jsonb_agg(to_jsonb(cp) ORDER BY cp.grantee) FROM column_privileges cp), '[]'::jsonb),
  'rls_status', coalesce((SELECT jsonb_agg(to_jsonb(rs) ORDER BY rs.table_name) FROM rls_status rs), '[]'::jsonb),
  'policies', coalesce((SELECT jsonb_agg(to_jsonb(pol) ORDER BY pol.tablename, pol.policyname) FROM policies pol), '[]'::jsonb),
  'target_row', coalesce((SELECT to_jsonb(tr) FROM target_row tr LIMIT 1), 'null'::jsonb),
  'target_tracks_sample', coalesce((SELECT jsonb_agg(to_jsonb(tt) ORDER BY tt.track_number) FROM target_tracks tt), '[]'::jsonb),
  'checks', (SELECT to_jsonb(c) FROM checks c)
) AS g20u36e_permission_snapshot;
```

### SQL inventory groups

| Group | Source | Purpose |
| --- | --- | --- |
| **A** | `information_schema.role_table_grants` | Table-level grants for anon/authenticated on `discography` · `discography_tracks` |
| **B** | `information_schema.column_privileges` | Column-level UPDATE on `discography_tracks.title` |
| **C** | `pg_class` + `pg_namespace` | RLS enabled / forced |
| **D** | `pg_policies` | All policies · admin ALL / `is_admin()` presence |
| **E** | `target_row` CTE | Single row match for slice WHERE + title |
| **F** | `target_tracks` CTE | Full track list count · track 7 title |
| **G** | `checks` | Summary counts for PASS/STOP review |

---

## Expected results (checks — after operator execution)

| check_key | Expected | Notes |
| --- | --- | --- |
| `anon_write_grants_count` | **0** | anon INSERT/UPDATE/DELETE should be absent |
| `authenticated_update_grants_count` | **0** (likely) | G-20u36a revoke baseline — record actual |
| `authenticated_discography_tracks_update_grants_count` | **0** (likely) | table-level UPDATE on tracks |
| `authenticated_title_update_column_grants_count` | **0** (likely) | column-level title UPDATE — informs Option A feasibility |
| `rls_enabled_discography` | **true** | |
| `rls_enabled_discography_tracks` | **true** | |
| `admin_all_policy_count` | **2** (likely) | `discography_admin_all` · `discography_tracks_admin_all` |
| `target_row_count` | **1** | exact slice row before Save |
| `target_track_1_title` | **`On a Clear Day`** | |
| `track_count` | **8** | |
| `track_7_title` | **`Like a Lover`** | |

**Informational (not automatic STOP unless unexpected):**

- `authenticated_update_grants_count > 0` → record drift vs G-20u36b baseline · assess before grant change
- `authenticated_title_update_column_grants_count > 0` → column grant already exists · narrow scope review
- Policies with broad UPDATE qual → assess in execution result record phase

---

## PASS conditions (execution phase — for operator result review)

Snapshot execution **PASS** (proceed to permission model decision / result record) when:

| # | Condition |
| --- | --- |
| 1 | Operator confirmed project ref **`kmjqppxjdnwwrtaeqjta`** |
| 2 | JSON readable · `g20u36e_permission_snapshot` present |
| 3 | `target_row_count` = **1** |
| 4 | `track_count` = **8** |
| 5 | `track_7_title` = **`Like a Lover`** |
| 6 | `anon_write_grants_count` = **0** |
| 7 | `rls_enabled_discography` = **true** |
| 8 | `rls_enabled_discography_tracks` = **true** |
| 9 | Grants · column privileges · policies · RLS inventories recorded in JSON |
| 10 | Permission model decision inputs sufficient (Option A feasibility assessable) |
| 11 | **service_role not required** for snapshot itself |

**PASS does not authorize Save** — only unlocks result record + permission change planning.

---

## STOP conditions

Stop and do **not** proceed to Save path implementation if:

| # | Condition |
| --- | --- |
| 1 | Supabase project ref unknown or **`vsbvndwuajjhnzpohghh`** |
| 2 | `target_row_count` ≠ **1** |
| 3 | `track_count` ≠ **8** |
| 4 | `track_7_title` ≠ **`Like a Lover`** |
| 5 | `anon_write_grants_count` > **0** |
| 6 | Unexpected broad UPDATE grants (e.g. authenticated UPDATE on `discography` parent without narrow plan) — human review |
| 7 | `rls_enabled_discography` or `rls_enabled_discography_tracks` = **false** |
| 8 | Policies suggest overly broad write path without admin gate — human review |
| 9 | JSON result missing / unreadable |
| 10 | SQL block contained non-SELECT statements (operator error — use this doc block only) |
| 11 | **service_role** appears necessary to inspect permissions |
| 12 | Any temptation to run GRANT/REVOKE in same session — **STOP** |

---

## Next phase

| Phase | Scope |
| --- | --- |
| **G-20u36e-controlled-save-permission-snapshot-select-execution** | Operator manual SELECT · result record doc · PASS/STOP judgment |

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
| operation=save sent | **no** — operation=save not sent |
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
npm run verify:g20u36e-controlled-save-permission-snapshot-select-prep
```

Script: `scripts/verify-g20u36e-controlled-save-permission-snapshot-select-prep.mjs`
