-- G-20u36a-permissions-remediation-preflight — Gosaki Discography remediation preflight
-- Phase: G-20u36a-permissions-remediation-preflight-select-only
-- Classification: **SELECT-ONLY** — safe for Supabase SQL Editor (staging)
--
-- STAGING ONLY:
--   project ref: kmjqppxjdnwwrtaeqjta
--   database: static-to-astro-cms-staging
--
-- PRODUCTION STOP — DO NOT RUN on:
--   project ref: vsbvndwuajjhnzpohghh
--
-- Purpose: Re-verify grants · RLS · data baseline BEFORE manual REVOKE UPDATE (2 tables)
-- Cursor does NOT execute this file. Operator confirms project ref before run.
-- No REVOKE / GRANT / RLS policy changes in this phase.

WITH params AS (
  SELECT
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_forbidden,
    'staging'::text AS expected_environment,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    ARRAY['anon', 'authenticated', 'public']::text[] AS watch_grantees,
    2::int AS expected_authenticated_update_grants,
    4::int AS expected_total_releases,
    34::int AS expected_total_tracks,
    8::int AS expected_target_track_count,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
table_grants AS (
  SELECT
    g.table_name,
    g.grantee,
    g.privilege_type,
    g.is_grantable
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee = ANY (p.watch_grantees)
),
write_grants AS (
  SELECT *
  FROM table_grants tg
  WHERE tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
),
update_grants AS (
  SELECT *
  FROM table_grants tg
  WHERE tg.grantee = 'authenticated'
    AND tg.privilege_type = 'UPDATE'
),
insert_delete_grants AS (
  SELECT *
  FROM table_grants tg
  WHERE tg.grantee IN ('anon', 'authenticated')
    AND tg.privilege_type IN ('INSERT', 'DELETE')
),
select_grants AS (
  SELECT *
  FROM table_grants tg
  WHERE tg.privilege_type = 'SELECT'
    AND tg.grantee IN ('anon', 'authenticated')
),
rls_status AS (
  SELECT
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
admin_all_policies AS (
  SELECT *
  FROM policies pol
  WHERE pol.policyname IN ('discography_admin_all', 'discography_tracks_admin_all')
),
select_policies AS (
  SELECT *
  FROM policies pol
  WHERE pol.cmd IN ('SELECT', 'ALL', '*')
     OR pol.policyname ILIKE '%select%'
     OR pol.policyname ILIKE '%read%'
),
target_release_count AS (
  SELECT count(*) AS cnt
  FROM public.discography d
  CROSS JOIN params p
  WHERE d.site_slug = p.target_site_slug
    AND d.legacy_id = p.target_legacy_id
),
target_tracks_count AS (
  SELECT count(*) AS cnt
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
global_counts AS (
  SELECT
    (SELECT count(*) FROM public.discography d CROSS JOIN params p WHERE d.site_slug = p.target_site_slug) AS releases,
    (SELECT count(*) FROM public.discography_tracks t CROSS JOIN params p WHERE t.site_slug = p.target_site_slug) AS tracks
),
integrity_counts AS (
  SELECT
    (
      SELECT count(*)
      FROM public.discography_tracks t
      LEFT JOIN public.discography d ON d.legacy_id = t.discography_legacy_id AND d.site_slug = t.site_slug
      CROSS JOIN params p
      WHERE t.site_slug = p.target_site_slug
        AND d.legacy_id IS NULL
    ) AS orphan_tracks,
    (
      SELECT count(*)
      FROM public.discography_tracks t
      CROSS JOIN params p
      WHERE t.site_slug = p.target_site_slug
        AND t.site_slug IS DISTINCT FROM p.target_site_slug
    ) AS site_slug_mismatch_tracks,
    (
      SELECT count(*) - count(DISTINCT (d.legacy_id, d.site_slug))
      FROM public.discography d
      CROSS JOIN params p
      WHERE d.site_slug = p.target_site_slug
    ) AS duplicate_release_keys
),
metrics AS (
  SELECT
    p.expected_project_ref,
    p.production_project_ref_forbidden,
    p.target_site_slug,
    p.target_legacy_id,
    p.expected_authenticated_update_grants,
    p.expected_total_releases,
    p.expected_total_tracks,
    p.expected_target_track_count,
    p.captured_at,
    (SELECT count(*) FROM update_grants) AS authenticated_update_count,
    (SELECT count(*) FROM write_grants WHERE grantee = 'anon') AS anon_write_count,
    (SELECT count(*) FROM insert_delete_grants) AS insert_delete_grant_count,
    (SELECT count(*) FROM select_grants WHERE grantee = 'authenticated') AS authenticated_select_grant_count,
    (SELECT count(*) FROM select_grants WHERE grantee = 'anon') AS anon_select_grant_count,
    (SELECT bool_and(rs.rls_enabled) FROM rls_status rs) AS rls_enabled_both,
    (SELECT count(*) FROM admin_all_policies) AS admin_all_policy_count,
    (SELECT count(*) FROM select_policies) AS select_policy_count,
    (SELECT cnt FROM target_release_count) AS target_release_count,
    (SELECT cnt FROM target_tracks_count) AS target_tracks_count,
    gc.releases AS global_releases,
    gc.tracks AS global_tracks,
    ic.orphan_tracks,
    ic.site_slug_mismatch_tracks,
    ic.duplicate_release_keys
  FROM params p
  CROSS JOIN global_counts gc
  CROSS JOIN integrity_counts ic
),
readiness_flags AS (
  SELECT
    m.*,
    (m.authenticated_update_count = m.expected_authenticated_update_grants) AS flag_update_grants_expected,
    (m.anon_write_count = 0) AS flag_anon_write_zero,
    (m.insert_delete_grant_count = 0) AS flag_no_insert_delete_grants,
    (m.authenticated_select_grant_count >= 2) AS flag_auth_select_present,
    (m.anon_select_grant_count >= 2) AS flag_anon_select_present,
    (m.rls_enabled_both IS TRUE) AS flag_rls_enabled,
    (m.admin_all_policy_count = 2) AS flag_admin_all_policies,
    (m.target_release_count = 1) AS flag_target_release,
    (m.target_tracks_count = m.expected_target_track_count) AS flag_target_tracks,
    (m.global_releases = m.expected_total_releases) AS flag_global_releases,
    (m.global_tracks = m.expected_total_tracks) AS flag_global_tracks,
    (m.orphan_tracks = 0 AND m.site_slug_mismatch_tracks = 0 AND m.duplicate_release_keys = 0) AS flag_integrity
  FROM metrics m
),
checks AS (
  SELECT
    'A.target_identity.expected_project_ref'::text AS check_key,
    'INFO'::text AS status,
    rf.expected_project_ref AS expected,
    rf.expected_project_ref AS actual,
    jsonb_build_object(
      'expected_environment', 'staging',
      'production_project_ref_forbidden', rf.production_project_ref_forbidden,
      'operator_must_confirm_sql_editor_project_ref_before_run', true,
      'captured_at', rf.captured_at
    ) AS details_json
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'B.grants.all_for_target_tables',
    'INFO',
    'full grant inventory',
    (SELECT count(*)::text FROM table_grants),
    (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'table_name', tg.table_name,
            'grantee', tg.grantee,
            'privilege_type', tg.privilege_type,
            'is_grantable', tg.is_grantable
          )
          ORDER BY tg.table_name, tg.grantee, tg.privilege_type
        ),
        '[]'::jsonb
      )
      FROM table_grants tg
    )

  UNION ALL

  SELECT
    'B.grants.authenticated_update_count',
    CASE WHEN rf.authenticated_update_count = rf.expected_authenticated_update_grants THEN 'PASS' ELSE 'STOP' END,
    rf.expected_authenticated_update_grants::text,
    rf.authenticated_update_count::text,
    (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'table_name', ug.table_name,
            'grantee', ug.grantee,
            'privilege_type', ug.privilege_type
          )
          ORDER BY ug.table_name
        ),
        '[]'::jsonb
      )
      FROM update_grants ug
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'B.grants.anon_write_count',
    CASE WHEN rf.anon_write_count = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    rf.anon_write_count::text,
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', wg.table_name,
          'grantee', wg.grantee,
          'privilege_type', wg.privilege_type
        ) ORDER BY wg.table_name),
        '[]'::jsonb
      )
      FROM write_grants wg
      WHERE wg.grantee = 'anon'
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'B.grants.authenticated_select_present',
    CASE WHEN rf.flag_auth_select_present THEN 'PASS' ELSE 'STOP' END,
    '>=2 (both tables)',
    rf.authenticated_select_grant_count::text,
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', sg.table_name,
          'grantee', sg.grantee,
          'privilege_type', sg.privilege_type
        ) ORDER BY sg.table_name),
        '[]'::jsonb
      )
      FROM select_grants sg
      WHERE sg.grantee = 'authenticated'
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'B.grants.anon_select_present',
    CASE WHEN rf.flag_anon_select_present THEN 'PASS' ELSE 'STOP' END,
    '>=2 (both tables)',
    rf.anon_select_grant_count::text,
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', sg.table_name,
          'grantee', sg.grantee,
          'privilege_type', sg.privilege_type
        ) ORDER BY sg.table_name),
        '[]'::jsonb
      )
      FROM select_grants sg
      WHERE sg.grantee = 'anon'
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'B.grants.no_insert_delete_grants',
    CASE WHEN rf.insert_delete_grant_count = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    rf.insert_delete_grant_count::text,
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', idg.table_name,
          'grantee', idg.grantee,
          'privilege_type', idg.privilege_type
        ) ORDER BY idg.table_name),
        '[]'::jsonb
      )
      FROM insert_delete_grants idg
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'C.rls.both_tables_enabled',
    CASE WHEN rf.rls_enabled_both IS TRUE THEN 'PASS' ELSE 'STOP' END,
    'true',
    coalesce(rf.rls_enabled_both::text, 'null'),
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', rs.table_name,
          'rls_enabled', rs.rls_enabled,
          'rls_forced', rs.rls_forced
        ) ORDER BY rs.table_name),
        '[]'::jsonb
      )
      FROM rls_status rs
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'D.policies.admin_all_policies',
    CASE WHEN rf.admin_all_policy_count = 2 THEN 'PASS' ELSE 'STOP' END,
    '2',
    rf.admin_all_policy_count::text,
    (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'tablename', ap.tablename,
            'policyname', ap.policyname,
            'cmd', ap.cmd,
            'roles', ap.roles,
            'qual', ap.qual,
            'with_check', ap.with_check
          )
          ORDER BY ap.tablename
        ),
        '[]'::jsonb
      )
      FROM admin_all_policies ap
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'D.policies.select_policies_inventory',
    'INFO',
    '>=1 public read policies',
    rf.select_policy_count::text,
    (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'tablename', sp.tablename,
            'policyname', sp.policyname,
            'cmd', sp.cmd,
            'roles', sp.roles,
            'qual', sp.qual
          )
          ORDER BY sp.tablename, sp.policyname
        ),
        '[]'::jsonb
      )
      FROM select_policies sp
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'E.data.global_releases_tracks',
    CASE WHEN rf.global_releases = rf.expected_total_releases AND rf.global_tracks = rf.expected_total_tracks THEN 'PASS' ELSE 'STOP' END,
    rf.expected_total_releases::text || ' / ' || rf.expected_total_tracks::text,
    rf.global_releases::text || ' / ' || rf.global_tracks::text,
    jsonb_build_object('site_slug', rf.target_site_slug)
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'E.data.target_discography_002',
    CASE WHEN rf.target_release_count = 1 AND rf.target_tracks_count = rf.expected_target_track_count THEN 'PASS' ELSE 'STOP' END,
    '1 release / ' || rf.expected_target_track_count::text || ' tracks',
    rf.target_release_count::text || ' / ' || rf.target_tracks_count::text,
    jsonb_build_object('legacy_id', rf.target_legacy_id, 'site_slug', rf.target_site_slug)
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'E.data.integrity_orphans_duplicates',
    CASE WHEN rf.flag_integrity THEN 'PASS' ELSE 'STOP' END,
    '0 / 0 / 0',
    rf.orphan_tracks::text || ' / ' || rf.site_slug_mismatch_tracks::text || ' / ' || rf.duplicate_release_keys::text,
    jsonb_build_object(
      'orphan_tracks', rf.orphan_tracks,
      'site_slug_mismatch_tracks', rf.site_slug_mismatch_tracks,
      'duplicate_release_keys', rf.duplicate_release_keys
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'F.apply_readiness.revoke_target_inventory',
    'INFO',
    '2 UPDATE revoke targets',
    'discography + discography_tracks',
    jsonb_build_object(
      'revoke_targets', jsonb_build_array(
        jsonb_build_object('table', 'public.discography', 'grantee', 'authenticated', 'privilege', 'UPDATE'),
        jsonb_build_object('table', 'public.discography_tracks', 'grantee', 'authenticated', 'privilege', 'UPDATE')
      ),
      'not_in_this_phase', 'REVOKE not executed — preflight only'
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'F.apply_readiness.ready_for_manual_revoke',
    CASE
      WHEN rf.flag_update_grants_expected
        AND rf.flag_anon_write_zero
        AND rf.flag_no_insert_delete_grants
        AND rf.flag_auth_select_present
        AND rf.flag_anon_select_present
        AND rf.flag_rls_enabled
        AND rf.flag_admin_all_policies
        AND rf.flag_target_release
        AND rf.flag_target_tracks
        AND rf.flag_global_releases
        AND rf.flag_global_tracks
        AND rf.flag_integrity
      THEN 'READY_FOR_MANUAL_REVOKE'
      ELSE 'STOP'
    END,
    'READY_FOR_MANUAL_REVOKE when all preflight checks PASS',
    CASE
      WHEN rf.flag_update_grants_expected
        AND rf.flag_anon_write_zero
        AND rf.flag_no_insert_delete_grants
        AND rf.flag_auth_select_present
        AND rf.flag_anon_select_present
        AND rf.flag_rls_enabled
        AND rf.flag_admin_all_policies
        AND rf.flag_target_release
        AND rf.flag_target_tracks
        AND rf.flag_global_releases
        AND rf.flag_global_tracks
        AND rf.flag_integrity
      THEN 'READY_FOR_MANUAL_REVOKE'
      ELSE 'STOP — preflight check failed'
    END,
    jsonb_build_object(
      'flag_update_grants_expected', rf.flag_update_grants_expected,
      'flag_anon_write_zero', rf.flag_anon_write_zero,
      'flag_no_insert_delete_grants', rf.flag_no_insert_delete_grants,
      'flag_auth_select_present', rf.flag_auth_select_present,
      'flag_anon_select_present', rf.flag_anon_select_present,
      'flag_rls_enabled', rf.flag_rls_enabled,
      'flag_admin_all_policies', rf.flag_admin_all_policies,
      'flag_data_baseline', rf.flag_target_release AND rf.flag_target_tracks AND rf.flag_global_releases AND rf.flag_global_tracks AND rf.flag_integrity,
      'next_phase_if_ready', 'G-20u36a-permissions-remediation-apply-plan'
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'G.post_apply_expectation.authenticated_update_grants',
    'INFO',
    '0 after manual REVOKE',
    'not yet applied — expectation only',
    jsonb_build_object('after_revoke_expected', 0, 'executed_in_this_phase', false)
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'G.post_apply_expectation.select_grants_preserved',
    'INFO',
    'SELECT grants unchanged',
    'verify in after-verification phase',
    jsonb_build_object('authenticated_select', rf.authenticated_select_grant_count, 'anon_select', rf.anon_select_grant_count)
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'G.post_apply_expectation.effective_write_risk',
    'INFO',
    'no longer RISK after REVOKE',
    'current state still RISK until apply',
    jsonb_build_object(
      'current_authenticated_update_grants', rf.authenticated_update_count,
      'admin_all_policies', rf.admin_all_policy_count,
      'note', 'Re-run deep-dive SQL after manual REVOKE in after-verification phase'
    )
  FROM readiness_flags rf

  UNION ALL

  SELECT
    'H.preflight_summary.any_stop',
    CASE
      WHEN NOT (
        rf.flag_update_grants_expected
        AND rf.flag_anon_write_zero
        AND rf.flag_no_insert_delete_grants
        AND rf.flag_auth_select_present
        AND rf.flag_anon_select_present
        AND rf.flag_rls_enabled
        AND rf.flag_admin_all_policies
        AND rf.flag_target_release
        AND rf.flag_target_tracks
        AND rf.flag_global_releases
        AND rf.flag_global_tracks
        AND rf.flag_integrity
      ) THEN 'STOP'
      ELSE 'READY_FOR_MANUAL_REVOKE'
    END,
    'READY_FOR_MANUAL_REVOKE or STOP',
    CASE
      WHEN NOT (
        rf.flag_update_grants_expected
        AND rf.flag_anon_write_zero
        AND rf.flag_no_insert_delete_grants
        AND rf.flag_auth_select_present
        AND rf.flag_anon_select_present
        AND rf.flag_rls_enabled
        AND rf.flag_admin_all_policies
        AND rf.flag_target_release
        AND rf.flag_target_tracks
        AND rf.flag_global_releases
        AND rf.flag_global_tracks
        AND rf.flag_integrity
      ) THEN 'STOP — one or more preflight checks failed'
      ELSE 'READY_FOR_MANUAL_REVOKE'
    END,
    jsonb_build_object(
      'save_blocked', true,
      'revoke_not_executed_in_preflight', true,
      'record_results_in', 'G-20u36a-permissions-remediation-preflight-result-record'
    )
  FROM readiness_flags rf
)
SELECT
  check_key,
  status,
  expected,
  actual,
  details_json
FROM checks
ORDER BY check_key;
