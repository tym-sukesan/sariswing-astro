# G-20u36e — Gosaki Discography controlled Save rollback name adjustment prep

**Phase:** `G-20u36e-controlled-save-rollback-name-adjustment-prep`  
**Status:** **complete** — preparation only · **all SQL blocks prepared · none executed**  
**Date:** 2026-07-14  
**Base commit:** `9c3eb07`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-permission-change-post-apply-result.md](./gosaki-discography-g20u36e-controlled-save-permission-change-post-apply-result.md)

| Check | Status |
| --- | --- |
| Preparation only | **yes** |
| Rollback executed | **no** · 未実行 |
| REVOKE executed | **no** · 未実行 |
| DROP POLICY executed | **no** · 未実行 |
| SQL executed | **no** · 未実行 |
| DB write | **no** |
| Save executed | **no** · 未実行 |
| operation=save | **not sent** · 未送信 |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |
| First controlled Save | **still not executed** |

---

## Gates

```txt
gosakiDiscographyControlledSaveRollbackNameAdjustmentPrepared: true
phase: G-20u36e-controlled-save-rollback-name-adjustment-prep
preparationOnly: true
rollbackExecuted: false
revokeExecuted: false
dropPolicyExecuted: false
sqlExecuted: false
dbWriteExecuted: false
saveExecuted: false
operationSaveSent: false
serviceRoleUsed: false
productionChanged: false
firstControlledSaveStillNotExecuted: true
intendedFullPolicyName: discography_tracks_g20u36e_controlled_save_title_update_restrictive
actualObservedTruncatedPolicyName: discography_tracks_g20u36e_controlled_save_title_update_restric
policynameLength: 63
recommendedNextPhase: G-20u36e-controlled-save-handler-permission-aware-planning
rollbackExecutionNotNextByDefault: true
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh`.

---

## 1. Policy name truncation (source of truth)

| Name kind | Value |
| --- | --- |
| Intended full policy name (reference only) | `discography_tracks_g20u36e_controlled_save_title_update_restrictive` |
| **Actual observed truncated policy name** | **`discography_tracks_g20u36e_controlled_save_title_update_restric`** |
| `policyname_length` | **63** |

| Fact | Detail |
| --- | --- |
| Cause | PostgreSQL **identifier truncation** (63 bytes) on unquoted identifiers |
| Effect on initial Post-apply | exact-name verification → **false negative** (`restrictive_policy_exists_count=0`) |
| Post-apply v2 | **PASS** using truncated / candidate match |
| Future rollback / verification | **must** use **actual observed truncated policy name** explicitly |
| Intended full name | keep as **reference only** — not the primary DROP target |

### Current permission state (post-apply v2 · snapshot)

| check | Value |
| --- | --- |
| `authenticated_title_update_column_grants_count` | **1** |
| `authenticated_table_update_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `restrictive_policy_candidate_count` | **1** |
| `observed_truncated_policy_name_count` | **1** |
| `admin_all_policy_count` | **2** |
| `rls_enabled_discography_tracks` | **true** |
| `target_title` | `On a Clear Day` |
| `track_count` / `track_7_title` | **8** / `Like a Lover` |
| Save / operation=save | **not executed** / **not sent** |

---

## 2. Adjusted rollback SQL (prepared · **未実行**)

**Purpose:** Undo apply permission change only.  
**DROP target:** **actual observed truncated policy name** (not intended full name).  
**Apply rule reminder:** Apply forbade `DROP POLICY IF EXISTS`. **Rollback may use** `DROP POLICY IF EXISTS` as safe undo.

**Does not touch:** RLS enable/disable · `admin_all` · `public_select` · target row data · service_role · data UPDATE/INSERT/DELETE.

```sql
-- G-20u36e permission-change ADJUSTED ROLLBACK — NOT EXECUTED in prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh — DO NOT RUN
-- DROP target = actual observed truncated name (length 63)
-- Reference only (NOT primary DROP target):
--   intended full: discography_tracks_g20u36e_controlled_save_title_update_restrictive
-- Forbidden: data UPDATE/INSERT/DELETE · ENABLE/DISABLE RLS · touch admin_all/public_select · service_role

BEGIN;

REVOKE UPDATE (title) ON TABLE public.discography_tracks FROM authenticated;

DROP POLICY IF EXISTS discography_tracks_g20u36e_controlled_save_title_update_restric
  ON public.discography_tracks;

COMMIT;
```

---

## 3. Pre-rollback verification SELECT-only SQL (prepared · **未実行**)

**Column:** `g20u36e_permission_change_pre_rollback_snapshot`  
**Purpose:** Confirm DB is in rollback-target state before any undo.  
**Target title policy:** allow **either** old or new title (Save may or may not have run yet). Execution-time context decides which is expected.

```sql
-- G-20u36e permission-change PRE-ROLLBACK verify (SELECT-ONLY) — NOT EXECUTED in prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta
-- PRODUCTION STOP: vsbvndwuajjhnzpohghh

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-pre-rollback'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day'::text AS title_old,
    'On a Clear Day [CMS Kit staging G-20u36e]'::text AS title_new,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    'discography_tracks_g20u36e_controlled_save_title_update_restrictive'::text AS intended_full_policy_name,
    'discography_tracks_g20u36e_controlled_save_title_update_restric'::text AS actual_observed_truncated_policy_name,
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
  SELECT c.grantee, c.privilege_type
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
  SELECT pol.tablename, pol.policyname, pol.permissive, pol.roles, pol.cmd
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
    (SELECT count(*) FROM policies pol CROSS JOIN params p
      WHERE pol.policyname = p.actual_observed_truncated_policy_name)::int
      AS observed_truncated_policy_name_count,
    (SELECT count(*) FROM policies pol CROSS JOIN params p
      WHERE pol.policyname = p.intended_full_policy_name)::int
      AS intended_full_policy_name_count,
    (SELECT count(*) FROM policies pol
      WHERE pol.tablename = 'discography_tracks'
        AND pol.permissive = 'RESTRICTIVE' AND pol.cmd = 'UPDATE'
        AND pol.policyname LIKE 'discography_tracks_g20u36e%')::int
      AS restrictive_policy_candidate_count,
    (SELECT count(*) FROM policies pol
      WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int
      AS admin_all_policy_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false)
      FROM rls_status rs WHERE rs.table_name = 'discography_tracks') AS rls_enabled_discography_tracks,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT tr.title FROM target_row tr LIMIT 1) AS target_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tt.title FROM target_tracks tt WHERE tt.track_number = 7 LIMIT 1) AS track_7_title,
    false AS data_mutation
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'actual_observed_truncated_policy_name', (SELECT actual_observed_truncated_policy_name FROM params),
  'intended_full_policy_name', (SELECT intended_full_policy_name FROM params),
  'checks', (SELECT to_jsonb(c) FROM checks c),
  'title_old_or_new_allowed', true
) AS g20u36e_permission_change_pre_rollback_snapshot;
```

### Pre-rollback expected (before undo)

| check | Expected |
| --- | --- |
| `authenticated_title_update_column_grants_count` | **1** |
| `authenticated_table_update_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `observed_truncated_policy_name_count` | **1** |
| `intended_full_policy_name_count` | **0** |
| `restrictive_policy_candidate_count` | **1** |
| `admin_all_policy_count` | **2** |
| RLS enabled | **true** |
| `target_row_count` | **1** |
| `target_title` | `On a Clear Day` **or** `On a Clear Day [CMS Kit staging G-20u36e]` |
| `track_count` / `track_7_title` | **8** / `Like a Lover` |
| `data_mutation` | **false** |

---

## 4. Adjusted post-rollback verification SELECT-only SQL (prepared · **未実行**)

**Column:** `g20u36e_permission_change_post_rollback_adjusted_snapshot`

```sql
-- G-20u36e permission-change POST-ROLLBACK ADJUSTED verify (SELECT-ONLY) — NOT EXECUTED in prep phase
-- STAGING ONLY: kmjqppxjdnwwrtaeqjta

WITH params AS (
  SELECT
    'G-20u36e-controlled-save-post-rollback-adjusted'::text AS phase,
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_stop,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    1::int AS target_track_number,
    'On a Clear Day'::text AS title_old,
    'On a Clear Day [CMS Kit staging G-20u36e]'::text AS title_new,
    'Like a Lover'::text AS target_track_7_title_expected,
    8::int AS expected_track_count,
    'discography_tracks_g20u36e_controlled_save_title_update_restric'::text AS actual_observed_truncated_policy_name,
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
    (SELECT count(*) FROM table_grants tg
      WHERE tg.grantee = 'authenticated' AND tg.table_name = 'discography_tracks'
        AND tg.privilege_type = 'UPDATE')::int
      AS authenticated_table_update_grants_count,
    (SELECT count(*) FROM table_grants tg WHERE tg.grantee = 'anon')::int
      AS anon_write_grants_count,
    (SELECT count(*) FROM policies pol CROSS JOIN params p
      WHERE pol.policyname = p.actual_observed_truncated_policy_name)::int
      AS observed_truncated_policy_name_count,
    (SELECT count(*) FROM policies pol
      WHERE pol.tablename = 'discography_tracks'
        AND pol.permissive = 'RESTRICTIVE' AND pol.cmd = 'UPDATE'
        AND pol.policyname LIKE 'discography_tracks_g20u36e%')::int
      AS any_g20u36e_restrictive_policy_count,
    (SELECT count(*) FROM policies pol
      WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all'))::int
      AS admin_all_policy_count,
    (SELECT coalesce(bool_or(rs.rls_enabled), false) FROM rls_status rs) AS rls_enabled_any,
    (SELECT count(*) FROM target_row)::int AS target_row_count,
    (SELECT tr.title FROM target_row tr LIMIT 1) AS target_title,
    (SELECT count(*) FROM target_tracks)::int AS track_count,
    (SELECT tt.title FROM target_tracks tt WHERE tt.track_number = 7 LIMIT 1) AS track_7_title,
    false AS data_mutation
)
SELECT jsonb_build_object(
  'phase', (SELECT phase FROM params),
  'expected_project_ref', (SELECT expected_project_ref FROM params),
  'production_project_ref_stop', (SELECT production_project_ref_stop FROM params),
  'captured_at', (SELECT captured_at FROM params),
  'checks', (SELECT to_jsonb(c) FROM checks c),
  'title_old_or_new_allowed', true
) AS g20u36e_permission_change_post_rollback_adjusted_snapshot;
```

### Post-rollback adjusted expected

| check | Expected |
| --- | --- |
| `authenticated_title_update_column_grants_count` | **0** |
| `authenticated_table_update_grants_count` | **0** |
| `anon_write_grants_count` | **0** |
| `observed_truncated_policy_name_count` | **0** |
| `any_g20u36e_restrictive_policy_count` | **0** |
| `admin_all_policy_count` | **2** |
| RLS enabled | **true** |
| `target_row_count` | **1** |
| `target_title` | old **or** new (context) |
| `track_count` / `track_7_title` | **8** / `Like a Lover` |
| `data_mutation` | **false** |

---

## 5. STOP conditions

Do **not** run adjusted rollback if any of:

| # | Condition |
| --- | --- |
| 1 | Project ref ≠ `kmjqppxjdnwwrtaeqjta` |
| 2 | Production ref `vsbvndwuajjhnzpohghh` is the active project |
| 3 | Actual observed truncated policy name **not found** |
| 4 | `restrictive_policy_candidate_count` ≠ **1** |
| 5 | Before rollback: `authenticated_title_update_column_grants_count` ≠ **1** |
| 6 | `anon_write_grants_count` > **0** |
| 7 | `admin_all` policies missing |
| 8 | RLS disabled |
| 9 | `target_row_count` ≠ **1** |
| 10 | `target_title` is neither old nor new expected title |
| 11 | Rollback SQL mixes data UPDATE / INSERT / DELETE |
| 12 | Rollback SQL touches admin_all / public_select / RLS toggle / row data |
| 13 | service_role appears required |
| 14 | Save and Rollback are being advanced **at the same time** |

---

## 6. Next phase recommendation

```txt
recommendedNext: G-20u36e-controlled-save-handler-permission-aware-planning
```

| Rule | Detail |
| --- | --- |
| Default next | **handler-permission-aware-planning** — not rollback execution |
| Rollback SQL execution | **not next by default** |
| Reserved for | abort permission change · close permissions after controlled Save · emergency rollback |

---

## Gate summary

```txt
gosakiDiscographyControlledSaveRollbackNameAdjustmentPrepared: true
preparationOnly: true
rollbackExecuted: false
actualObservedTruncatedPolicyName: discography_tracks_g20u36e_controlled_save_title_update_restric
recommendedNextPhase: G-20u36e-controlled-save-handler-permission-aware-planning
```
