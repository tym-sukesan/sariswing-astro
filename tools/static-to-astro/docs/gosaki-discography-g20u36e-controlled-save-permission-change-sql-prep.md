# G-20u36e — Gosaki Discography controlled Save permission change SQL prep

**Phase:** `G-20u36e-controlled-save-permission-change-sql-prep`  
**Status:** **complete** — SQL prep only · **all SQL blocks prepared · none executed**  
**Date:** 2026-07-14  
**Base commit:** `b5f9d86`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-change-plan.md](./gosaki-discography-g20u36e-controlled-save-permission-change-plan.md)

| Check | Status |
| --- | --- |
| SQL prep only | **yes** |
| SQL executed | **no** · 未実行 |
| GRANT / REVOKE executed | **no** · 未実行 |
| CREATE / DROP POLICY executed | **no** · 未実行 |
| DB write | **no** |
| operation=save | **not sent** · 未送信 |
| Save enablement | **no** |
| Edge implementation | **no** |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not allowed** |

---

## Gates

```txt
gosakiDiscographyControlledSavePermissionChangeSqlPrepared: true
phase: G-20u36e-controlled-save-permission-change-sql-prep
sqlPrepOnly: true
sqlExecuted: false
grantRevokeExecuted: false
createDropPolicyExecuted: false
dbWriteExecuted: false
operationSaveSent: false
saveEnablementExecuted: false
edgeImplementationExecuted: false
serviceRoleUsed: false
productionChanged: false
firstControlledSaveStillNotAllowed: true
readyForFirstControlledSaveExecution: false
policyName: discography_tracks_g20u36e_controlled_save_title_update_restrictive
dropPolicyIfExistsForbidden: true
recommendedNextPhase: G-20u36e-controlled-save-permission-change-preflight-select-execution
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.

### Target slice

| Field | Value |
| --- | --- |
| table | `public.discography_tracks` |
| id | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| site_slug | `gosaki-piano` |
| discography_legacy_id | `discography-002` |
| track_number | `1` |
| before title (USING) | `On a Clear Day` |
| after title (WITH CHECK) | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | `8` |
| track_7_title | `Like a Lover` |
| restrictive policy name | `discography_tracks_g20u36e_controlled_save_title_update_restrictive` |

**Operator JWT admin:** **VERIFIED** (`is_admin()=true`). Current grants expected **0** until apply.

---

## SQL safety notes

| Rule | Detail |
| --- | --- |
| Risk | Apply SQL changes **DB permissions** (GRANT + CREATE POLICY) — high risk |
| Who runs | Operator in Supabase SQL Editor **after ChatGPT review** — Cursor must **not** execute |
| Production | Never run on `vsbvndwuajjhnzpohghh` |
| Apply gate | Preflight SELECT-only must **PASS** · rollback SQL reviewed · same policy name must **not** already exist |
| After apply | First controlled Save **still not allowed** · no `operation=save` until Edge Save path exists |
| Data | Apply/rollback SQL contain **no** data UPDATE / INSERT / DELETE |
| anon | **no** write grant |
| service_role | **not used** |
| DROP POLICY IF EXISTS | **forbidden** on apply — if policy exists → **STOP** (do not recreate via DROP) |

---

## STOP conditions

Do **not** apply if any of:

| # | Condition |
| --- | --- |
| 1 | Project ref ≠ `kmjqppxjdnwwrtaeqjta` |
| 2 | Production ref `vsbvndwuajjhnzpohghh` is the active project |
| 3 | Preflight `target_row_count` ≠ **1** |
| 4 | Target title ≠ `On a Clear Day` |
| 5 | `track_count` ≠ **8** |
| 6 | `track_7_title` ≠ `Like a Lover` |
| 7 | RLS disabled on `discography` or `discography_tracks` |
| 8 | `anon_write_grants_count` > **0** |
| 9 | Unexpected broad UPDATE grant (human review) |
| 10 | Policy name already exists (`restrictive_policy_name_collision` = true) |
| 11 | Rollback SQL unclear / missing |
| 12 | service_role appears required |
| 13 | SQL mixes data UPDATE / INSERT / DELETE |
| 14 | operation=save / Save enablement required for this step |

---

## A. Preflight SELECT-only SQL

**Status:** prepared · **未実行**  
**Classification:** SELECT-only · one row · column `g20u36e_permission_change_preflight_snapshot`  
**Purpose:** Final check before apply. **No data mutation.**

```sql
-- G-20u36e permission-change PREFLIGHT (SELECT-ONLY) — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh
-- Forbidden: INSERT UPDATE DELETE ALTER CREATE DROP GRANT REVOKE TRUNCATE

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-permission-change-preflight'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day'::text AS target_title_before,
    'On a Clear Day [CMS Kit staging G-20u36e]'::text AS target_title_after,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    'e30c5ea9-2857-492b-8a78-58cbfcbe7929'::uuid AS target_row_id_expected,
    'discography_tracks_g20u36e_controlled_save_title_update_restrictive'::text AS restrictive_policy_name,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
table_grants AS (
  SELECT g.table_schema, g.table_name, g.grantee, g.privilege_type
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
),
column_privileges AS (
  SELECT c.table_name, c.column_name, c.grantee, c.privilege_type
  FROM information_schema.column_privileges c
  CROSS JOIN params p
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography_tracks'
    AND c.column_name = 'title'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
),
rls_status AS (
  SELECT n.nspname AS schema_name, c.relname AS table_name,
         c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN params p
  WHERE n.nspname = 'public' AND c.relname = ANY (p.target_tables)
),
policies AS (
  SELECT pol.tablename, pol.policyname, pol.permissive, pol.roles, pol.cmd,
         pol.qual, pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public' AND pol.tablename = ANY (p.target_tables)
),
is_admin_fn AS (
  SELECT
    (to_regprocedure('public.is_admin()') IS NOT NULL) AS is_admin_function_exists
),
target_row AS (
  SELECT t.id, t.site_slug, t.discography_legacy_id, t.track_number, t.title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
    AND t.title = p.target_title_before
),
target_tracks AS (
  SELECT t.track_number, t.title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
checks AS (
  SELECT
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'anon' AND tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE'))::int
      AS anon_write_grants_count,
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'authenticated' AND tg.table_name = 'discography_tracks'
        AND tg.privilege_type = 'UPDATE')::int
      AS authenticated_table_update_grants_count,
    (SELECT count(*) FROM column_privileges cp
      WHERE cp.grantee = 'authenticated' AND cp.privilege_type = 'UPDATE')::int
      AS authenticated_title_update_column_grants_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false)
      FROM rls_status rs WHERE rs.table_name = 'discography') AS rls_enabled_discography,
    (SELECT coalesce(bool_or(rs.rls_enabled), false)
      FROM rls_status rs WHERE rs.table_name = 'discography_tracks') AS rls_enabled_discography_tracks,
    (SELECT count(*) FROM policies pol
      WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int
      AS admin_all_policy_count,
    (SELECT count(*) FROM policies pol
      WHERE pol.tablename = 'discography_tracks' AND pol.permissive = 'RESTRICTIVE'
        AND pol.cmd = 'UPDATE')::int
      AS restrictive_update_policy_count,
    (SELECT count(*) FROM policies pol
      CROSS JOIN params p
      WHERE pol.policyname = p.restrictive_policy_name)::int
      AS restrictive_policy_name_collision_count,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT tr.id FROM target_row tr LIMIT 1) AS target_row_id,
    (SELECT tr.title FROM target_row tr LIMIT 1) AS target_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tt.title FROM target_tracks tt WHERE tt.track_number = 7 LIMIT 1) AS track_7_title,
    (SELECT is_admin_function_exists FROM is_admin_fn) AS is_admin_function_exists
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'restrictive_policy_name', (SELECT restrictive_policy_name FROM params),
  'role_table_grants', coalesce((SELECT jsonb_agg(to_jsonb(tg)) FROM table_grants tg), '[]'::jsonb),
  'column_privileges_title', coalesce((SELECT jsonb_agg(to_jsonb(cp)) FROM column_privileges cp), '[]'::jsonb),
  'rls_status', coalesce((SELECT jsonb_agg(to_jsonb(rs)) FROM rls_status rs), '[]'::jsonb),
  'policies', coalesce((SELECT jsonb_agg(to_jsonb(pol)) FROM policies pol), '[]'::jsonb),
  'target_row', coalesce((SELECT to_jsonb(tr) FROM target_row tr LIMIT 1), 'null'::jsonb),
  'checks', (SELECT to_jsonb(c) FROM checks c),
  'data_mutation', false
) AS g20u36e_permission_change_preflight_snapshot;
```

### Preflight PASS (before apply)

| check | Expected |
| --- | --- |
| operator project ref | `kmjqppxjdnwwrtaeqjta` |
| `anon_write_grants_count` | **0** |
| `authenticated_title_update_column_grants_count` | **0** |
| `authenticated_table_update_grants_count` | **0** (preferred) |
| `restrictive_update_policy_count` | **0** |
| `restrictive_policy_name_collision_count` | **0** → else **STOP** |
| `admin_all_policy_count` | **2** |
| `rls_enabled_*` | **true** |
| `is_admin_function_exists` | **true** |
| `target_row_count` | **1** |
| `target_row_id` | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| `target_title` | `On a Clear Day` |
| `track_count` | **8** |
| `track_7_title` | `Like a Lover` |

---

## B. Apply SQL

**Status:** prepared · **未実行**  
**Purpose:** Grant column-level `UPDATE(title)` + create RESTRICTIVE UPDATE policy.  
**Contains:** GRANT · CREATE POLICY only. **No** data UPDATE/INSERT/DELETE · **no** anon grant · **no** service_role · **no** DROP POLICY IF EXISTS.

### Transaction guidance

| Approach | Recommendation |
| --- | --- |
| Single `BEGIN` … `COMMIT` wrapping GRANT + CREATE POLICY | **Preferred** — atomic apply |
| If any statement fails | `ROLLBACK` · do not partial-apply |
| Preflight collision = 1 | **STOP** — do not run apply · do not DROP/recreate |

```sql
-- G-20u36e permission-change APPLY — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- Prerequisites: preflight PASS · rollback SQL reviewed · policy name does NOT exist
-- Forbidden: data UPDATE/INSERT/DELETE · DROP POLICY IF EXISTS · GRANT to anon · service_role

BEGIN;

-- Column-level title UPDATE for authenticated (not table-wide UPDATE)
GRANT UPDATE (title) ON TABLE public.discography_tracks TO authenticated;

-- RESTRICTIVE UPDATE policy — narrows admin_all for this slice only
-- AS RESTRICTIVE · FOR UPDATE TO authenticated
-- USING = old row · WITH CHECK = new row
CREATE POLICY discography_tracks_g20u36e_controlled_save_title_update_restrictive
  ON public.discography_tracks
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    site_slug = 'gosaki-piano'
    AND discography_legacy_id = 'discography-002'
    AND track_number = 1
    AND title = 'On a Clear Day'
  )
  WITH CHECK (
    site_slug = 'gosaki-piano'
    AND discography_legacy_id = 'discography-002'
    AND track_number = 1
    AND title = 'On a Clear Day [CMS Kit staging G-20u36e]'
  );

COMMIT;
```

**Does not touch:** `discography_admin_all` · `discography_tracks_admin_all` · public SELECT policies · RLS enabled flag · row data.

---

## C. Post-apply verification SELECT-only SQL

**Status:** prepared · **未実行**  
**Column:** `g20u36e_permission_change_post_apply_snapshot`  
**No data mutation.**

```sql
-- G-20u36e permission-change POST-APPLY verify (SELECT-ONLY) — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-permission-change-post-apply'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day'::text AS target_title_still_before,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    'discography_tracks_g20u36e_controlled_save_title_update_restrictive'::text AS restrictive_policy_name,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
table_grants AS (
  SELECT g.table_name, g.grantee, g.privilege_type
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
),
column_privileges AS (
  SELECT c.grantee, c.privilege_type, c.column_name
  FROM information_schema.column_privileges c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography_tracks'
    AND c.column_name = 'title'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
),
rls_status AS (
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN params p
  WHERE n.nspname = 'public' AND c.relname = ANY (p.target_tables)
),
policies AS (
  SELECT pol.tablename, pol.policyname, pol.permissive, pol.roles, pol.cmd,
         pol.qual, pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public' AND pol.tablename = ANY (p.target_tables)
),
target_row AS (
  SELECT t.id, t.title, t.track_number, t.site_slug, t.discography_legacy_id
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
),
target_tracks AS (
  SELECT t.track_number, t.title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
checks AS (
  SELECT
    (SELECT count(*) FROM column_privileges cp
      WHERE cp.grantee = 'authenticated')::int
      AS authenticated_title_update_column_grants_count,
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'authenticated' AND tg.table_name = 'discography_tracks'
        AND tg.privilege_type = 'UPDATE')::int
      AS authenticated_table_update_grants_count,
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'anon' AND tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE'))::int
      AS anon_write_grants_count,
    (SELECT count(*) FROM policies pol
      CROSS JOIN params p
      WHERE pol.policyname = p.restrictive_policy_name
        AND pol.permissive = 'RESTRICTIVE' AND pol.cmd = 'UPDATE')::int
      AS restrictive_policy_exists_count,
    (SELECT pol.qual FROM policies pol CROSS JOIN params p
      WHERE pol.policyname = p.restrictive_policy_name LIMIT 1) AS restrictive_policy_using,
    (SELECT pol.with_check FROM policies pol CROSS JOIN params p
      WHERE pol.policyname = p.restrictive_policy_name LIMIT 1) AS restrictive_policy_with_check,
    (SELECT count(*) FROM policies pol
      WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int
      AS admin_all_policy_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false)
      FROM rls_status rs WHERE rs.table_name = 'discography_tracks') AS rls_enabled_discography_tracks,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT tr.title FROM target_row tr LIMIT 1) AS target_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tt.title FROM target_tracks tt WHERE tt.track_number = 7 LIMIT 1) AS track_7_title,
    false AS operation_save_involved,
    false AS data_mutation
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'checks', (SELECT to_jsonb(c) FROM checks c),
  'policies', coalesce((SELECT jsonb_agg(to_jsonb(pol)) FROM policies pol), '[]'::jsonb)
) AS g20u36e_permission_change_post_apply_snapshot;
```

### Post-apply expected

| check | Expected |
| --- | --- |
| `authenticated_title_update_column_grants_count` | **1** |
| `authenticated_table_update_grants_count` | record actual (prefer **0** if column-only visible) |
| `anon_write_grants_count` | **0** |
| `restrictive_policy_exists_count` | **1** |
| USING / WITH CHECK | match before / after titles |
| `admin_all_policy_count` | **2** |
| RLS enabled | **true** |
| `target_title` | still `On a Clear Day` (Save not run) |
| `track_count` / `track_7_title` | **8** / `Like a Lover` |

---

## D. Rollback SQL

**Status:** prepared · **未実行**  
**Purpose:** Undo apply only. **No** data change · **no** RLS disable · **no** admin_all / SELECT changes · **no** service_role.

```sql
-- G-20u36e permission-change ROLLBACK — NOT EXECUTED in sql-prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- Does NOT change target row data · does NOT disable RLS · does NOT drop admin_all

BEGIN;

REVOKE UPDATE (title) ON TABLE public.discography_tracks FROM authenticated;

DROP POLICY IF EXISTS discography_tracks_g20u36e_controlled_save_title_update_restrictive
  ON public.discography_tracks;

COMMIT;
```

**Note:** Rollback may use `DROP POLICY IF EXISTS` (safe undo). Apply must **not** use DROP/recreate.

---

## E. Post-rollback verification SELECT-only SQL

**Status:** prepared · **未実行**  
**Column:** `g20u36e_permission_change_post_rollback_snapshot`

```sql
-- G-20u36e permission-change POST-ROLLBACK verify (SELECT-ONLY) — NOT EXECUTED in sql-prep phase

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-permission-change-post-rollback'::text AS phase,
    'discography_tracks_g20u36e_controlled_save_title_update_restrictive'::text AS restrictive_policy_name,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day'::text AS target_title_expected,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
column_privileges AS (
  SELECT c.grantee, c.privilege_type
  FROM information_schema.column_privileges c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'discography_tracks'
    AND c.column_name = 'title'
    AND c.grantee IN ('anon', 'authenticated')
    AND c.privilege_type = 'UPDATE'
),
table_grants AS (
  SELECT g.grantee, g.privilege_type, g.table_name
  FROM information_schema.role_table_grants g
  WHERE g.table_schema = 'public'
    AND g.table_name IN ('discography', 'discography_tracks')
    AND g.grantee IN ('anon', 'authenticated')
    AND g.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
),
policies AS (
  SELECT pol.policyname, pol.permissive, pol.cmd, pol.tablename
  FROM pg_policies pol
  WHERE pol.schemaname = 'public'
    AND pol.tablename IN ('discography', 'discography_tracks')
),
rls_status AS (
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname IN ('discography', 'discography_tracks')
),
target_row AS (
  SELECT t.title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
    AND t.track_number = p.target_track_number
),
target_tracks AS (
  SELECT t.track_number, t.title
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
checks AS (
  SELECT
    (SELECT count(*) FROM column_privileges cp WHERE cp.grantee = 'authenticated')::int
      AS authenticated_title_update_column_grants_count,
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'anon')::int
      AS anon_write_grants_count,
    (SELECT count(*) FROM policies pol CROSS JOIN params p
      WHERE pol.policyname = p.restrictive_policy_name)::int
      AS restrictive_policy_count,
    (SELECT count(*) FROM policies pol
      WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int
      AS admin_all_policy_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false) FROM rls_status rs) AS rls_enabled_any,
    (SELECT tr.title FROM target_row tr LIMIT 1) AS target_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tt.title FROM target_tracks tt WHERE tt.track_number = 7 LIMIT 1) AS track_7_title
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'checks', (SELECT to_jsonb(c) FROM checks c)
) AS g20u36e_permission_change_post_rollback_snapshot;
```

### Post-rollback expected

| check | Expected |
| --- | --- |
| `authenticated_title_update_column_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `restrictive_policy_count` | **0** |
| `admin_all_policy_count` | **2** |
| RLS enabled | **true** |
| target row title | `On a Clear Day` unchanged |

---

## Operator flow (future phases — not this phase)

1. ChatGPT / human review of this SQL prep.  
2. **Preflight SELECT** (A) once on staging → record result.  
3. If PASS + collision=0 → explicit approval for apply.  
4. **Apply** (B) once → **Post-apply** (C).  
5. Still **no** Save / operation=save / Edge Save.  
6. If needed: **Rollback** (D) → **Post-rollback** (E).

---

## First controlled Save still not allowed

SQL prep ≠ permission applied ≠ Save unlocked. Still need: preflight execution · apply approval · apply · Edge JWT Save path · separate Save arm.

---

## Recommended next phase

**`G-20u36e-controlled-save-permission-change-preflight-select-execution`**

Operator runs block **A** once on staging; Cursor/AI records result. Apply remains blocked until PASS + explicit approval.

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36e-controlled-save-permission-change-sql-prep
npm run verify:g20u36e-controlled-save-permission-change-plan
npm run verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result
npm run verify:current-active-regression
```
