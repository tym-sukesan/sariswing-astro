-- G-20u36a-permissions-rls — Gosaki Discography permissions / RLS deep-dive
-- Phase: G-20u36a-permissions-rls-deep-dive
-- Classification: **SELECT-ONLY** — safe for Supabase SQL Editor (staging)
--
-- STAGING ONLY:
--   project ref: kmjqppxjdnwwrtaeqjta
--   database: static-to-astro-cms-staging
--
-- PRODUCTION STOP — DO NOT RUN on:
--   project ref: vsbvndwuajjhnzpohghh
--
-- Context: G-20u36a-result STOP — authenticated UPDATE on discography + discography_tracks
-- Cursor does NOT execute this file. Operator confirms project ref before run.
-- No REVOKE / GRANT / RLS policy changes in this phase.

WITH params AS (
  SELECT
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_forbidden,
    'staging'::text AS expected_environment,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    ARRAY['anon', 'authenticated', 'public']::text[] AS watch_grantees,
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
write_grants AS (
  SELECT *
  FROM table_grants tg
  WHERE tg.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
),
update_grants AS (
  SELECT *
  FROM table_grants tg
  WHERE tg.privilege_type = 'UPDATE'
),
write_policies AS (
  SELECT *
  FROM policies pol
  WHERE pol.cmd IN ('UPDATE', 'ALL', '*')
     OR pol.cmd ILIKE '%UPDATE%'
     OR pol.cmd = 'ALL'
),
metrics AS (
  SELECT
    p.expected_project_ref,
    p.production_project_ref_forbidden,
    p.expected_environment,
    p.captured_at,
    (SELECT count(*) FROM update_grants) AS authenticated_update_grant_count,
    (SELECT count(*) FROM write_grants WHERE grantee = 'anon') AS anon_write_grant_count,
    (SELECT count(*) FROM write_grants WHERE grantee = 'authenticated') AS authenticated_write_grant_count,
    (SELECT bool_and(rs.rls_enabled) FROM rls_status rs) AS rls_enabled_both,
    (SELECT bool_and(rs.rls_forced) FROM rls_status rs) AS rls_forced_both,
    (SELECT count(*) FROM write_policies) AS write_policy_count
  FROM params p
),
risk_rows AS (
  SELECT
    ug.table_name,
    ug.grantee,
    ug.privilege_type,
    EXISTS (
      SELECT 1
      FROM write_policies wp
      WHERE wp.tablename = ug.table_name
        AND (
          wp.cmd IN ('UPDATE', 'ALL', '*')
          OR wp.roles && ARRAY[ug.grantee]::name[]
          OR 'public' = ANY (wp.roles::text[])
          OR ug.grantee = ANY (wp.roles::text[])
        )
    ) AS has_matching_write_policy
  FROM update_grants ug
),
checks AS (
  SELECT
    'A.target_identity.expected_project_ref'::text AS check_key,
    'INFO'::text AS status,
    m.expected_project_ref AS expected,
    m.expected_project_ref AS actual,
    jsonb_build_object(
      'expected_environment', m.expected_environment,
      'production_project_ref_forbidden', m.production_project_ref_forbidden,
      'operator_must_confirm_sql_editor_project_ref_before_run', true,
      'captured_at', m.captured_at
    ) AS details_json
  FROM metrics m

  UNION ALL

  SELECT
    'B.grants.all_for_target_tables',
    'INFO',
    'list all anon/authenticated/public grants',
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
  FROM metrics m

  UNION ALL

  SELECT
    'B.grants.authenticated_update_count',
    CASE WHEN m.authenticated_update_grant_count = 2 THEN 'NEEDS_REVIEW' ELSE 'INFO' END,
    '2 (known from G-20u36a-result)',
    m.authenticated_update_grant_count::text,
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
  FROM metrics m

  UNION ALL

  SELECT
    'B.grants.anon_write_count',
    CASE WHEN m.anon_write_grant_count = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    m.anon_write_grant_count::text,
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', wg.table_name,
          'grantee', wg.grantee,
          'privilege_type', wg.privilege_type
        ) ORDER BY wg.table_name, wg.privilege_type),
        '[]'::jsonb
      )
      FROM write_grants wg
      WHERE wg.grantee = 'anon'
    )
  FROM metrics m

  UNION ALL

  SELECT
    'C.rls.both_tables_enabled',
    CASE WHEN m.rls_enabled_both IS TRUE THEN 'PASS' ELSE 'STOP' END,
    'true',
    coalesce(m.rls_enabled_both::text, 'null'),
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
  FROM metrics m

  UNION ALL

  SELECT
    'C.rls.forced_status',
    'INFO',
    'relforcerowsecurity per table',
    coalesce(m.rls_forced_both::text, 'null'),
    (
      SELECT coalesce(
        jsonb_agg(jsonb_build_object(
          'table_name', rs.table_name,
          'rls_forced', rs.rls_forced
        ) ORDER BY rs.table_name),
        '[]'::jsonb
      )
      FROM rls_status rs
    )
  FROM metrics m

  UNION ALL

  SELECT
    'D.policies.all_for_target_tables',
    'INFO',
    'full policy inventory',
    (SELECT count(*)::text FROM policies),
    (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'tablename', pol.tablename,
            'policyname', pol.policyname,
            'permissive', pol.permissive,
            'roles', pol.roles,
            'cmd', pol.cmd,
            'qual', pol.qual,
            'with_check', pol.with_check
          )
          ORDER BY pol.tablename, pol.policyname
        ),
        '[]'::jsonb
      )
      FROM policies pol
    )
  FROM metrics m

  UNION ALL

  SELECT
    'D.policies.write_related_count',
    'INFO',
    '>=0',
    m.write_policy_count::text,
    (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'tablename', wp.tablename,
            'policyname', wp.policyname,
            'roles', wp.roles,
            'cmd', wp.cmd,
            'qual', wp.qual,
            'with_check', wp.with_check
          )
          ORDER BY wp.tablename, wp.policyname
        ),
        '[]'::jsonb
      )
      FROM write_policies wp
    )
  FROM metrics m

  UNION ALL

  SELECT
    'E.risk.' || rr.table_name || '.authenticated_update',
    CASE
      WHEN rr.has_matching_write_policy THEN 'RISK'
      ELSE 'NEEDS_REVIEW'
    END,
    CASE WHEN rr.has_matching_write_policy THEN 'grant+policy may allow write' ELSE 'grant present; review policy block' END,
    rr.grantee || ' ' || rr.privilege_type,
    jsonb_build_object(
      'table_name', rr.table_name,
      'has_matching_write_policy', rr.has_matching_write_policy,
      'interpretation',
        CASE
          WHEN rr.has_matching_write_policy THEN 'RISK — table UPDATE grant and write-related RLS policy overlap'
          ELSE 'NEEDS_REVIEW — UPDATE grant present; verify RLS blocks authenticated direct write'
        END
    )
  FROM risk_rows rr

  UNION ALL

  SELECT
    'E.risk.summary_highest',
    CASE
      WHEN EXISTS (SELECT 1 FROM risk_rows rr WHERE rr.has_matching_write_policy) THEN 'RISK'
      WHEN EXISTS (SELECT 1 FROM update_grants) THEN 'NEEDS_REVIEW'
      ELSE 'PASS'
    END,
    'PASS or NEEDS_REVIEW or RISK',
    (
      SELECT CASE
        WHEN EXISTS (SELECT 1 FROM risk_rows rr WHERE rr.has_matching_write_policy) THEN 'RISK'
        WHEN EXISTS (SELECT 1 FROM update_grants) THEN 'NEEDS_REVIEW'
        ELSE 'PASS'
      END
    ),
    jsonb_build_object(
      'authenticated_update_grants', (SELECT count(*) FROM update_grants),
      'write_policies', (SELECT count(*) FROM write_policies),
      'note', 'Decision aid only — no REVOKE/GRANT/RLS change in this phase'
    )
  FROM metrics m

  UNION ALL

  SELECT
    'F.edge_only_write_path.browser_direct_write_grants',
    CASE
      WHEN m.anon_write_grant_count > 0 THEN 'STOP'
      WHEN m.authenticated_write_grant_count > 0 THEN 'NEEDS_REVIEW'
      ELSE 'PASS'
    END,
    'anon write=0; auth write minimal',
    jsonb_build_object(
      'anon_write_grants', m.anon_write_grant_count,
      'authenticated_write_grants', m.authenticated_write_grant_count
    )::text,
    jsonb_build_object(
      'ideal', 'browser anon/auth direct write forbidden; service_role Edge Function internal only',
      'authenticated_update_on_discography_tables', (SELECT count(*) FROM update_grants),
      'service_role_not_checked_in_browser', true
    )
  FROM metrics m

  UNION ALL

  SELECT
    'G.next_action.classification',
    'INFO',
    'remediation plan deferred',
    'no change in this phase',
    jsonb_build_object(
      'if_grants_unnecessary', 'G-20u36a-permissions-remediation-plan (REVOKE plan doc only)',
      'if_policy_blocks_but_grant_present', 'document grant present but policy blocked; still least-privilege cleanup candidate',
      'if_risk_confirmed', 'do not proceed to Save until remediated',
      'blocked_phases', jsonb_build_array('G-20u36e Save', 'G-20u36b Edge deploy until permissions gate cleared')
    )
  FROM metrics m

  UNION ALL

  SELECT
    'H.review_summary.proceed_to_remediation_planning',
    CASE
      WHEN EXISTS (SELECT 1 FROM risk_rows rr WHERE rr.has_matching_write_policy) THEN 'STOP'
      WHEN EXISTS (SELECT 1 FROM update_grants) THEN 'NEEDS_REVIEW'
      ELSE 'PASS'
    END,
    'review complete before REVOKE plan',
    (
      SELECT CASE
        WHEN EXISTS (SELECT 1 FROM risk_rows rr WHERE rr.has_matching_write_policy) THEN 'STOP — RISK confirmed'
        WHEN EXISTS (SELECT 1 FROM update_grants) THEN 'NEEDS_REVIEW — grants present'
        ELSE 'PASS'
      END
    ),
    jsonb_build_object(
      'previous_stop', 'G-20u36a-result authenticated UPDATE x2',
      'save_blocked', true,
      'revoke_grant_rls_change', false
    )
  FROM metrics m
)
SELECT
  check_key,
  status,
  expected,
  actual,
  details_json
FROM checks
ORDER BY check_key;
