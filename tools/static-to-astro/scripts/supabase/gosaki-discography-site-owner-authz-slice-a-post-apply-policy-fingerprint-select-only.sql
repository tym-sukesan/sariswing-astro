-- =============================================================================
-- Discography Slice A — post-apply CURRENT_POLICY_FP (SELECT-ONLY)
-- Phase: discography-site-owner-authz-slice-a-post-apply-policy-fingerprint
-- DO NOT APPLY / ROLLBACK / CREATE POLICY / DROP / GRANT / REVOKE / RPC redefine
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Operator: confirm Dashboard project ref = kmjqppxjdnwwrtaeqjta, paste once.
-- Cursor does NOT execute this file. service_role: not used.
--
-- Canonicalization MUST match pre-apply packet
--   gosaki-discography-site-owner-authz-slice-a-staging-preflight-select-only.sql
-- which produced:
--   2ae7c19292f2c8c5ae68f27c0fe10221
--
-- md5 input (one line per policy, LF-joined, ORDER BY tablename, policyname):
--   tablename|policyname|cmd|coalesce(qual,'')|coalesce(with_check,'')
-- roles / permissive are NOT part of the hash (same as pre-apply).
--
-- This packet reads pg_policies only. It does not SELECT/mutate
-- grants, RPC definitions, or discography row data.
-- =============================================================================

WITH params AS (
  SELECT
    'kmjqppxjdnwwrtaeqjta'::text AS expected_staging_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_ref_forbidden,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    '2ae7c19292f2c8c5ae68f27c0fe10221'::text AS historical_pre_apply_policy_fp,
    6::int AS expected_policy_count
),
-- Identical source set as pre-apply `policies` CTE
policies AS (
  SELECT pol.tablename, pol.policyname, pol.cmd, pol.roles::text AS roles, pol.permissive, pol.qual, pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public' AND pol.tablename = ANY (p.target_tables)
),
-- Identical md5 as pre-apply `policy_fingerprint` CTE
policy_fingerprint AS (
  SELECT md5(string_agg(
    tablename || '|' || policyname || '|' || cmd || '|' || coalesce(qual, '') || '|' || coalesce(with_check, ''),
    E'\n' ORDER BY tablename, policyname
  )) AS fp
  FROM policies
),
named_counts AS (
  SELECT
    (SELECT count(*)::int FROM policies) AS policy_count,
    (SELECT count(*)::int FROM policies WHERE tablename = 'discography' AND policyname = 'discography_public_select') AS discography_public_select_rows,
    (SELECT count(*)::int FROM policies WHERE tablename = 'discography' AND policyname = 'discography_admin_all') AS discography_admin_all_rows,
    (SELECT count(*)::int FROM policies WHERE tablename = 'discography_tracks' AND policyname = 'discography_tracks_public_select') AS tracks_public_select_rows,
    (SELECT count(*)::int FROM policies WHERE tablename = 'discography_tracks' AND policyname = 'discography_tracks_admin_all') AS tracks_admin_all_rows,
    (SELECT count(*)::int FROM policies WHERE tablename = 'discography' AND policyname = 'discography_site_writer_select') AS discography_writer_select_rows,
    (SELECT count(*)::int FROM policies WHERE tablename = 'discography_tracks' AND policyname = 'discography_tracks_site_writer_select') AS tracks_writer_select_rows
)
SELECT * FROM (
  SELECT 'A.staging_ref_reminder'::text AS check_key,
         'INFO'::text AS status,
         (SELECT expected_staging_ref FROM params) AS expected,
         'Confirm Dashboard project ref before trusting fp'::text AS actual,
         jsonb_build_object(
           'expected_staging_ref', (SELECT expected_staging_ref FROM params),
           'production_ref_forbidden', (SELECT production_ref_forbidden FROM params)
         ) AS details_json
  UNION ALL
  SELECT 'C.policy_count',
         CASE WHEN (SELECT policy_count FROM named_counts) = (SELECT expected_policy_count FROM params)
              THEN 'PASS' ELSE 'STOP' END,
         (SELECT expected_policy_count::text FROM params),
         (SELECT policy_count::text FROM named_counts),
         (SELECT to_jsonb(n) FROM named_counts n)
  UNION ALL
  SELECT 'C.existing_four_each_one',
         CASE WHEN (SELECT discography_public_select_rows FROM named_counts) = 1
               AND (SELECT discography_admin_all_rows FROM named_counts) = 1
               AND (SELECT tracks_public_select_rows FROM named_counts) = 1
               AND (SELECT tracks_admin_all_rows FROM named_counts) = 1
              THEN 'PASS' ELSE 'STOP' END,
         '1/1/1/1',
         (SELECT format('public=%s/%s admin_all=%s/%s',
            discography_public_select_rows, tracks_public_select_rows,
            discography_admin_all_rows, tracks_admin_all_rows) FROM named_counts),
         (SELECT to_jsonb(n) FROM named_counts n)
  UNION ALL
  SELECT 'C.writer_select_each_one',
         CASE WHEN (SELECT discography_writer_select_rows FROM named_counts) = 1
               AND (SELECT tracks_writer_select_rows FROM named_counts) = 1
              THEN 'PASS' ELSE 'STOP' END,
         '1/1',
         (SELECT format('discography_site_writer_select=%s tracks_site_writer_select=%s',
            discography_writer_select_rows, tracks_writer_select_rows) FROM named_counts),
         (SELECT to_jsonb(n) FROM named_counts n)
  UNION ALL
  SELECT 'C.policy_fingerprint',
         'INFO',
         'md5 post-apply CURRENT_POLICY_FP (same algorithm as pre-apply)',
         (SELECT fp FROM policy_fingerprint),
         jsonb_build_object(
           'CURRENT_POLICY_FP', (SELECT fp FROM policy_fingerprint),
           'PRE_APPLY_POLICY_FP', (SELECT historical_pre_apply_policy_fp FROM params),
           'must_differ_from_pre_apply', (SELECT fp FROM policy_fingerprint) IS DISTINCT FROM (SELECT historical_pre_apply_policy_fp FROM params)
         )
  UNION ALL
  SELECT 'C.policy_inventory',
         'INFO',
         'tablename|policyname|cmd (hash inputs also include qual + with_check)',
         (SELECT count(*)::text FROM policies),
         (SELECT coalesce(jsonb_agg(jsonb_build_object(
            'tablename', tablename,
            'policyname', policyname,
            'cmd', cmd,
            'roles', roles,
            'permissive', permissive
          ) ORDER BY tablename, policyname), '[]'::jsonb) FROM policies)
) q
ORDER BY check_key;
