-- G-20u36a-permissions-remediation-after-verification — Gosaki Discography post-REVOKE verification
-- Phase: G-20u36a-permissions-remediation-after-verification
-- Classification: **SELECT-ONLY** — safe for Supabase SQL Editor (staging)
--
-- STAGING ONLY:
--   project ref: kmjqppxjdnwwrtaeqjta
--   database: static-to-astro-cms-staging
--
-- PRODUCTION STOP — DO NOT RUN on:
--   project ref: vsbvndwuajjhnzpohghh
--
-- Context: Manual REVOKE UPDATE x2 executed (apply-manual-result recorded)
-- Purpose: Verify grants · RLS · data baseline · effective write risk AFTER REVOKE
-- Cursor does NOT execute this file. Operator confirms project ref before run.

WITH params AS (
  SELECT
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_forbidden,
    'staging'::text AS expected_environment,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    ARRAY['anon', 'authenticated', 'public']::text[] AS watch_grantees,
    0::int AS expected_authenticated_update_grants,
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
    (SELECT count(*) FROM write_grants WHERE grantee = 'authenticated') AS authenticated_write_count,
    (SELECT count(*) FROM insert_delete_grants) AS insert_delete_grant_count,
    (SELECT count(*) FROM select_grants WHERE grantee = 'authenticated') AS authenticated_select_grant_count,
    (SELECT count(*) FROM select_grants WHERE grantee = 'anon') AS anon_select_grant_count,
    (SELECT bool_and(rs.rls_enabled) FROM rls_status rs) AS rls_enabled_both,
    (SELECT count(*) FROM admin_all_policies) AS admin_all_policy_count,
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
verify_flags AS (
  SELECT
    m.*,
    (m.authenticated_update_count = 0) AS flag_no_auth_update,
    (m.anon_write_count = 0) AS flag_anon_write_zero,
    (m.authenticated_write_count = 0) AS flag_auth_write_zero,
    (m.insert_delete_grant_count = 0) AS flag_no_insert_delete_grants,
    (m.authenticated_select_grant_count >= 2) AS flag_auth_select_present,
    (m.anon_select_grant_count >= 2) AS flag_anon_select_present,
    (m.rls_enabled_both IS TRUE) AS flag_rls_enabled,
    (m.target_release_count = 1) AS flag_target_release,
    (m.target_tracks_count = m.expected_target_track_count) AS flag_target_tracks,
    (m.global_releases = m.expected_total_releases) AS flag_global_releases,
    (m.global_tracks = m.expected_total_tracks) AS flag_global_tracks,
    (m.orphan_tracks = 0 AND m.site_slug_mismatch_tracks = 0 AND m.duplicate_release_keys = 0) AS flag_integrity,
    CASE
      WHEN m.authenticated_update_count > 0 THEN 'RISK'
      WHEN m.authenticated_write_count > 0 OR m.anon_write_count > 0 THEN 'NEEDS_REVIEW'
      WHEN m.admin_all_policy_count > 0 THEN 'NEEDS_REVIEW'
      ELSE 'PASS'
    END AS effective_write_risk_after
  FROM metrics m
),
checks AS (
  SELECT
    'A.target_identity.expected_project_ref'::text AS check_key,
    'INFO'::text AS status,
    vf.expected_project_ref AS expected,
    vf.expected_project_ref AS actual,
    jsonb_build_object(
      'expected_environment', 'staging',
      'production_project_ref_forbidden', vf.production_project_ref_forbidden,
      'manual_revoke_applied', true,
      'operator_must_confirm_sql_editor_project_ref_before_run', true,
      'captured_at', vf.captured_at
    ) AS details_json
  FROM verify_flags vf

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
    CASE WHEN vf.authenticated_update_count = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    vf.authenticated_update_count::text,
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'B.grants.anon_write_count',
    CASE WHEN vf.anon_write_count = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    vf.anon_write_count::text,
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'B.grants.authenticated_select_present',
    CASE WHEN vf.flag_auth_select_present THEN 'PASS' ELSE 'STOP' END,
    '>=2 (both tables)',
    vf.authenticated_select_grant_count::text,
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'B.grants.anon_select_present',
    CASE WHEN vf.flag_anon_select_present THEN 'PASS' ELSE 'STOP' END,
    '>=2 (both tables)',
    vf.anon_select_grant_count::text,
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'B.grants.no_insert_delete_grants',
    CASE WHEN vf.insert_delete_grant_count = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    vf.insert_delete_grant_count::text,
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'C.rls.both_tables_enabled',
    CASE WHEN vf.rls_enabled_both IS TRUE THEN 'PASS' ELSE 'STOP' END,
    'true',
    coalesce(vf.rls_enabled_both::text, 'null'),
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'D.policies.admin_all_policies',
    'INFO',
    'may remain after REVOKE — grant layer removed',
    vf.admin_all_policy_count::text,
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
  FROM verify_flags vf

  UNION ALL

  SELECT
    'E.data.global_releases_tracks',
    CASE WHEN vf.global_releases = vf.expected_total_releases AND vf.global_tracks = vf.expected_total_tracks THEN 'PASS' ELSE 'STOP' END,
    vf.expected_total_releases::text || ' / ' || vf.expected_total_tracks::text,
    vf.global_releases::text || ' / ' || vf.global_tracks::text,
    jsonb_build_object('site_slug', vf.target_site_slug)
  FROM verify_flags vf

  UNION ALL

  SELECT
    'E.data.target_discography_002',
    CASE WHEN vf.target_release_count = 1 AND vf.target_tracks_count = vf.expected_target_track_count THEN 'PASS' ELSE 'STOP' END,
    '1 release / ' || vf.expected_target_track_count::text || ' tracks',
    vf.target_release_count::text || ' / ' || vf.target_tracks_count::text,
    jsonb_build_object('legacy_id', vf.target_legacy_id, 'site_slug', vf.target_site_slug)
  FROM verify_flags vf

  UNION ALL

  SELECT
    'E.data.integrity_orphans_duplicates',
    CASE WHEN vf.flag_integrity THEN 'PASS' ELSE 'STOP' END,
    '0 / 0 / 0',
    vf.orphan_tracks::text || ' / ' || vf.site_slug_mismatch_tracks::text || ' / ' || vf.duplicate_release_keys::text,
    jsonb_build_object(
      'orphan_tracks', vf.orphan_tracks,
      'site_slug_mismatch_tracks', vf.site_slug_mismatch_tracks,
      'duplicate_release_keys', vf.duplicate_release_keys
    )
  FROM verify_flags vf

  UNION ALL

  SELECT
    'F.effective_write_risk.after_remediation',
    CASE
      WHEN vf.authenticated_update_count > 0 THEN 'STOP'
      WHEN vf.effective_write_risk_after = 'RISK' THEN 'STOP'
      WHEN vf.effective_write_risk_after = 'NEEDS_REVIEW' THEN 'NEEDS_REVIEW'
      ELSE 'PASS'
    END,
    'no longer RISK — UPDATE grant removed',
    vf.effective_write_risk_after,
    jsonb_build_object(
      'authenticated_update_grants', vf.authenticated_update_count,
      'authenticated_write_grants', vf.authenticated_write_count,
      'anon_write_grants', vf.anon_write_count,
      'admin_all_policies', vf.admin_all_policy_count,
      'interpretation',
        CASE
          WHEN vf.authenticated_update_count > 0 THEN 'STOP — authenticated UPDATE grant still present'
          WHEN vf.admin_all_policy_count > 0 THEN 'NEEDS_REVIEW — ALL policies remain but table UPDATE grant removed; direct PostgREST UPDATE blocked at grant layer'
          ELSE 'PASS — no write grants'
        END
    )
  FROM verify_flags vf

  UNION ALL

  SELECT
    'G.remediation_summary.permissions_complete_candidate',
    CASE
      WHEN vf.flag_no_auth_update
        AND vf.flag_anon_write_zero
        AND vf.flag_auth_select_present
        AND vf.flag_anon_select_present
        AND vf.flag_rls_enabled
        AND vf.flag_target_release
        AND vf.flag_target_tracks
        AND vf.flag_global_releases
        AND vf.flag_global_tracks
        AND vf.flag_integrity
        AND vf.authenticated_update_count = 0
      THEN 'PASS'
      ELSE 'STOP'
    END,
    'true when all required checks pass',
    CASE
      WHEN vf.flag_no_auth_update
        AND vf.flag_anon_write_zero
        AND vf.flag_auth_select_present
        AND vf.flag_anon_select_present
        AND vf.flag_rls_enabled
        AND vf.flag_target_release
        AND vf.flag_target_tracks
        AND vf.flag_global_releases
        AND vf.flag_global_tracks
        AND vf.flag_integrity
      THEN 'true'
      ELSE 'false'
    END,
    jsonb_build_object(
      'save_still_disabled', true,
      'edge_deploy_blocked_until_result_recorded', true,
      'record_results_in', 'G-20u36a-permissions-remediation-after-verification-result-record',
      'after_result_pass_may_proceed', 'G-20u36b Edge dry-run endpoint deploy plan'
    )
  FROM verify_flags vf

  UNION ALL

  SELECT
    'H.after_verification.summary',
    CASE
      WHEN NOT (
        vf.flag_no_auth_update
        AND vf.flag_anon_write_zero
        AND vf.flag_auth_select_present
        AND vf.flag_anon_select_present
        AND vf.flag_rls_enabled
        AND vf.flag_target_release
        AND vf.flag_target_tracks
        AND vf.flag_global_releases
        AND vf.flag_global_tracks
        AND vf.flag_integrity
      ) THEN 'STOP'
      WHEN vf.authenticated_update_count > 0 THEN 'STOP'
      ELSE 'PASS'
    END,
    'PASS or STOP',
    CASE
      WHEN NOT (
        vf.flag_no_auth_update
        AND vf.flag_anon_write_zero
        AND vf.flag_auth_select_present
        AND vf.flag_anon_select_present
        AND vf.flag_rls_enabled
        AND vf.flag_target_release
        AND vf.flag_target_tracks
        AND vf.flag_global_releases
        AND vf.flag_global_tracks
        AND vf.flag_integrity
      ) THEN 'STOP — one or more checks failed'
      WHEN vf.authenticated_update_count > 0 THEN 'STOP — UPDATE grants remain'
      ELSE 'PASS — after-verification ready for result record'
    END,
    jsonb_build_object(
      'effective_write_risk_after', vf.effective_write_risk_after,
      'permissions_remediation_complete_candidate',
        vf.flag_no_auth_update
        AND vf.flag_anon_write_zero
        AND vf.flag_auth_select_present
        AND vf.flag_anon_select_present
        AND vf.flag_rls_enabled
        AND vf.flag_integrity
        AND vf.flag_target_release
        AND vf.flag_target_tracks
        AND vf.flag_global_releases
        AND vf.flag_global_tracks
    )
  FROM verify_flags vf
)
SELECT
  check_key,
  status,
  expected,
  actual,
  details_json
FROM checks
ORDER BY check_key;
