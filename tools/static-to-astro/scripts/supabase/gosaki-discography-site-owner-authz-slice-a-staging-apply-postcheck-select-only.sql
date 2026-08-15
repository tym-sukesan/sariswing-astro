-- =============================================================================
-- Discography Slice A — staging apply POSTCHECK (SELECT-ONLY)
-- Phase: discography-site-owner-authz-slice-a-staging-apply-result-recording
-- DO NOT APPLY / ROLLBACK / CREATE POLICY / DROP / GRANT / REVOKE / RPC redefine
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Cursor does NOT execute this file. Operator: confirm project ref, paste once.
-- service_role: not used
-- Expected post-apply (operator-confirmed 2026-08-15):
--   policy_count=6 · writer SELECT ×2 present · write grants=0
--   albums=4 · tracks=34
--   RPC md5=f4d50563f2e08abcfcded8e8ade7fb3b · can_write_site · no is_admin() call
--   grants table fingerprint expected unchanged:
--     88986aa562aad21b7defa89648288083
-- =============================================================================

WITH params AS (
  SELECT
    'kmjqppxjdnwwrtaeqjta'::text AS expected_staging_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_ref_forbidden,
    'gosaki-piano'::text AS target_site_slug,
    ARRAY['discography', 'discography_tracks']::text[] AS target_tables,
    ARRAY[
      'discography_site_writer_select',
      'discography_tracks_site_writer_select'
    ]::text[] AS slice_a_forward_policies,
    'gosaki_discography_operational_save'::text AS operational_rpc,
    'f4d50563f2e08abcfcded8e8ade7fb3b'::text AS expected_rpc_md5,
    'a04cb160099bada44a358404c9eed74c'::text AS historical_pre_apply_rpc_md5,
    '88986aa562aad21b7defa89648288083'::text AS expected_grants_fp,
    6::int AS expected_policy_count,
    4::int AS expected_albums,
    34::int AS expected_tracks,
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
policies AS (
  SELECT pol.tablename, pol.policyname, pol.cmd, pol.roles::text AS roles, pol.permissive, pol.qual, pol.with_check
  FROM pg_policies pol
  CROSS JOIN params p
  WHERE pol.schemaname = 'public' AND pol.tablename = ANY (p.target_tables)
),
forward_present AS (
  SELECT p.policyname
  FROM policies p
  CROSS JOIN params par
  WHERE p.policyname = ANY (par.slice_a_forward_policies)
),
named_counts AS (
  SELECT
    (SELECT count(*) FROM policies WHERE tablename = 'discography' AND policyname = 'discography_public_select') AS discography_public_select_rows,
    (SELECT count(*) FROM policies WHERE tablename = 'discography' AND policyname = 'discography_admin_all') AS discography_admin_all_rows,
    (SELECT count(*) FROM policies WHERE tablename = 'discography_tracks' AND policyname = 'discography_tracks_public_select') AS tracks_public_select_rows,
    (SELECT count(*) FROM policies WHERE tablename = 'discography_tracks' AND policyname = 'discography_tracks_admin_all') AS tracks_admin_all_rows,
    (SELECT count(*) FROM policies WHERE tablename = 'discography' AND policyname = 'discography_site_writer_select') AS discography_writer_select_rows,
    (SELECT count(*) FROM policies WHERE tablename = 'discography_tracks' AND policyname = 'discography_tracks_site_writer_select') AS tracks_writer_select_rows
),
table_grants AS (
  SELECT g.table_name, g.grantee, g.privilege_type
  FROM information_schema.role_table_grants g
  CROSS JOIN params p
  WHERE g.table_schema = 'public'
    AND g.table_name = ANY (p.target_tables)
    AND g.grantee IN ('anon', 'authenticated', 'public')
),
write_grants AS (
  SELECT * FROM table_grants
  WHERE privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    AND grantee IN ('anon', 'authenticated')
),
rpc_meta AS (
  SELECT
    p.proname,
    pg_get_function_identity_arguments(p.oid) AS identity_args,
    p.prosecdef AS security_definer,
    pg_get_functiondef(p.oid) AS definition,
    md5(pg_get_functiondef(p.oid)) AS definition_md5
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN params par
  WHERE n.nspname = 'public' AND p.proname = par.operational_rpc
),
rpc_exec_grants AS (
  SELECT r.rolname AS grantee, has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN params par
  CROSS JOIN (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'public')) r
  WHERE n.nspname = 'public' AND p.proname = par.operational_rpc
),
album_counts AS (
  SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE published IS TRUE)::int AS published,
    count(*) FILTER (WHERE site_slug IS NULL OR btrim(site_slug) = '')::int AS null_or_empty_slug,
    count(*) FILTER (WHERE site_slug = (SELECT target_site_slug FROM params))::int AS gosaki
  FROM public.discography
),
track_counts AS (
  SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE site_slug IS NULL OR btrim(site_slug) = '')::int AS null_or_empty_slug,
    count(*) FILTER (WHERE site_slug = (SELECT target_site_slug FROM params))::int AS gosaki
  FROM public.discography_tracks
),
policy_fingerprint AS (
  SELECT md5(string_agg(
    tablename || '|' || policyname || '|' || cmd || '|' || coalesce(qual, '') || '|' || coalesce(with_check, ''),
    E'\n' ORDER BY tablename, policyname
  )) AS fp
  FROM policies
),
grants_fingerprint AS (
  SELECT md5(string_agg(
    table_name || '|' || grantee || '|' || privilege_type,
    E'\n' ORDER BY table_name, grantee, privilege_type
  )) AS fp
  FROM table_grants
)
SELECT * FROM (
  SELECT 'A.staging_ref_reminder'::text AS check_key,
         'INFO'::text AS status,
         (SELECT expected_staging_ref FROM params) AS expected,
         'Confirm Dashboard project ref before trusting rows'::text AS actual,
         jsonb_build_object(
           'expected_staging_ref', (SELECT expected_staging_ref FROM params),
           'production_ref_forbidden', (SELECT production_ref_forbidden FROM params)
         ) AS details_json
  UNION ALL
  SELECT 'C.policy_count',
         CASE WHEN (SELECT count(*) FROM policies) = (SELECT expected_policy_count FROM params) THEN 'PASS' ELSE 'STOP' END,
         (SELECT expected_policy_count::text FROM params),
         (SELECT count(*)::text FROM policies),
         (SELECT to_jsonb(n) FROM named_counts n)
  UNION ALL
  SELECT 'C.policy_fingerprint',
         'INFO',
         'md5 post-apply baseline (record this value)',
         (SELECT fp FROM policy_fingerprint),
         jsonb_build_object(
           'policy_fingerprint', (SELECT fp FROM policy_fingerprint),
           'pre_apply_historical', '2ae7c19292f2c8c5ae68f27c0fe10221'
         )
  UNION ALL
  SELECT 'D.forward_policies_present',
         CASE WHEN (SELECT count(*) FROM forward_present) = 2 THEN 'PASS' ELSE 'STOP' END,
         '2 Slice A writer SELECT policies',
         (SELECT count(*)::text FROM forward_present),
         jsonb_build_object('present', coalesce((SELECT jsonb_agg(policyname ORDER BY policyname) FROM forward_present), '[]'::jsonb))
  UNION ALL
  SELECT 'E.grants_fingerprint',
         CASE WHEN (SELECT fp FROM grants_fingerprint) = (SELECT expected_grants_fp FROM params) THEN 'PASS' ELSE 'STOP' END,
         (SELECT expected_grants_fp FROM params),
         (SELECT fp FROM grants_fingerprint),
         jsonb_build_object('grants_fingerprint', (SELECT fp FROM grants_fingerprint))
  UNION ALL
  SELECT 'E.write_grants',
         CASE WHEN (SELECT count(*) FROM write_grants) = 0 THEN 'PASS' ELSE 'STOP' END,
         '0',
         (SELECT count(*)::text FROM write_grants),
         (SELECT coalesce(jsonb_agg(to_jsonb(w) ORDER BY table_name, grantee, privilege_type), '[]'::jsonb) FROM write_grants w)
  UNION ALL
  SELECT 'F.albums',
         CASE WHEN (SELECT total FROM album_counts) = (SELECT expected_albums FROM params)
               AND (SELECT gosaki FROM album_counts) = (SELECT expected_albums FROM params)
               AND (SELECT null_or_empty_slug FROM album_counts) = 0
              THEN 'PASS' ELSE 'STOP' END,
         '4/4 gosaki · null 0',
         (SELECT format('total=%s published=%s gosaki=%s null_slug=%s', total, published, gosaki, null_or_empty_slug) FROM album_counts),
         (SELECT to_jsonb(a) FROM album_counts a)
  UNION ALL
  SELECT 'F.tracks',
         CASE WHEN (SELECT total FROM track_counts) = (SELECT expected_tracks FROM params)
               AND (SELECT gosaki FROM track_counts) = (SELECT expected_tracks FROM params)
               AND (SELECT null_or_empty_slug FROM track_counts) = 0
              THEN 'PASS' ELSE 'STOP' END,
         '34/34 gosaki · null 0',
         (SELECT format('total=%s gosaki=%s null_slug=%s', total, gosaki, null_or_empty_slug) FROM track_counts),
         (SELECT to_jsonb(t) FROM track_counts t)
  UNION ALL
  SELECT 'H.rpc_md5',
         CASE WHEN (SELECT bool_and(definition_md5 = (SELECT expected_rpc_md5 FROM params)) FROM rpc_meta) THEN 'PASS' ELSE 'STOP' END,
         (SELECT expected_rpc_md5 FROM params),
         (SELECT string_agg(definition_md5, ',' ORDER BY identity_args) FROM rpc_meta),
         jsonb_build_object(
           'historical_pre_apply', (SELECT historical_pre_apply_rpc_md5 FROM params),
           'security_definer', (SELECT bool_and(security_definer) FROM rpc_meta)
         )
  UNION ALL
  SELECT 'H.rpc_can_write_site_no_is_admin_call',
         CASE
           WHEN (SELECT bool_and(
                   definition ~ 'can_write_site\('
                   AND definition !~ ':=\s*public\.is_admin\(\)'
                 ) FROM rpc_meta)
           THEN 'PASS' ELSE 'STOP' END,
         'can_write_site present · no is_admin() assignment',
         CASE
           WHEN (SELECT bool_or(definition ~ 'can_write_site\(') FROM rpc_meta) THEN 'has_can_write_site' ELSE 'missing_can_write_site' END
           || ' / ' ||
           CASE
             WHEN (SELECT bool_or(definition ~ ':=\s*public\.is_admin\(\)') FROM rpc_meta) THEN 'has_is_admin_call' ELSE 'no_is_admin_call' END,
         '{}'::jsonb
  UNION ALL
  SELECT 'H.rpc_execute_grants',
         CASE
           WHEN (SELECT bool_or(can_execute) FROM rpc_exec_grants WHERE grantee = 'authenticated')
            AND NOT (SELECT bool_or(can_execute) FROM rpc_exec_grants WHERE grantee = 'anon')
           THEN 'PASS' ELSE 'STOP' END,
         'authenticated EXECUTE · anon no',
         (SELECT string_agg(grantee || '=' || can_execute::text, ', ' ORDER BY grantee) FROM rpc_exec_grants),
         (SELECT coalesce(jsonb_agg(to_jsonb(g) ORDER BY grantee), '[]'::jsonb) FROM rpc_exec_grants g)
) q
ORDER BY check_key;
