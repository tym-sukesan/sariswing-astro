-- =============================================================================
-- Discography Slice A — staging preflight (SELECT-ONLY)
-- Phase: discography-site-owner-authz-slice-a-staging-preflight
-- DO NOT APPLY migrations / CREATE POLICY / DROP / GRANT / REVOKE / RPC redefine
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- Cursor does NOT execute this file. Operator: confirm project ref, paste once, record results.
-- service_role: not used
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
    (now() AT TIME ZONE 'utc')::timestamptz AS captured_at
),
rls_status AS (
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN params p
  WHERE n.nspname = 'public' AND c.relname = ANY (p.target_tables)
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
helper_meta AS (
  SELECT p.proname, p.prosecdef AS security_definer,
         md5(pg_get_functiondef(p.oid)) AS definition_md5
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('can_write_site', 'is_site_member', 'is_platform_admin', 'is_admin')
),
helper_exec AS (
  SELECT p.proname, r.rolname AS grantee, has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  CROSS JOIN (SELECT oid, rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')) r
  WHERE n.nspname = 'public'
    AND p.proname IN ('can_write_site', 'is_site_member', 'is_platform_admin', 'is_admin')
),
sites_gosaki AS (
  SELECT s.id, s.site_slug, s.status
  FROM public.sites s
  CROSS JOIN params p
  WHERE s.site_slug = p.target_site_slug
),
site_count AS (
  SELECT count(*)::int AS n FROM sites_gosaki
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
album_slug_dist AS (
  SELECT coalesce(site_slug, '<null>') AS site_slug, count(*)::int AS n
  FROM public.discography
  GROUP BY 1
),
track_slug_dist AS (
  SELECT coalesce(site_slug, '<null>') AS site_slug, count(*)::int AS n
  FROM public.discography_tracks
  GROUP BY 1
),
orphan_tracks AS (
  SELECT count(*)::int AS n
  FROM public.discography_tracks t
  WHERE NOT EXISTS (
    SELECT 1 FROM public.discography d
    WHERE d.site_slug = t.site_slug
      AND d.legacy_id = t.discography_legacy_id
  )
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
),
-- Owner fixture inventory (membership rows only — NOT a live JWT probe)
owner_members AS (
  SELECT sm.user_id, sm.role, sm.site_id
  FROM public.site_members sm
  JOIN sites_gosaki sg ON sg.id = sm.site_id
  WHERE sm.role = 'owner'
),
owner_admin_overlap AS (
  SELECT om.user_id,
         EXISTS (
           SELECT 1 FROM public.admin_users au
           WHERE au.user_id = om.user_id AND au.role = 'admin'
         ) AS in_admin_users
  FROM owner_members om
)
SELECT * FROM (
  SELECT 'A.staging_ref_reminder'::text AS check_key,
         'INFO'::text AS status,
         (SELECT expected_staging_ref FROM params) AS expected,
         'Confirm Dashboard project ref before trusting rows'::text AS actual,
         jsonb_build_object(
           'expected_staging_ref', (SELECT expected_staging_ref FROM params),
           'production_ref_forbidden', (SELECT production_ref_forbidden FROM params),
           'captured_at', (SELECT captured_at FROM params)
         ) AS details_json
  UNION ALL
  SELECT 'B.rls_enabled',
         CASE WHEN (SELECT bool_and(rls_enabled) FROM rls_status) THEN 'PASS' ELSE 'STOP' END,
         'both tables RLS true',
         (SELECT string_agg(table_name || '=' || rls_enabled::text, ', ' ORDER BY table_name) FROM rls_status),
         (SELECT jsonb_agg(to_jsonb(r) ORDER BY table_name) FROM rls_status r)
  UNION ALL
  SELECT 'C.policies_inventory',
         'INFO',
         'list current policies',
         (SELECT count(*)::text FROM policies),
         (SELECT coalesce(jsonb_agg(jsonb_build_object(
            'tablename', tablename, 'policyname', policyname, 'cmd', cmd, 'roles', roles, 'permissive', permissive
          ) ORDER BY tablename, policyname), '[]'::jsonb) FROM policies)
  UNION ALL
  SELECT 'C.policy_fingerprint',
         'INFO',
         'md5 baseline',
         (SELECT fp FROM policy_fingerprint),
         jsonb_build_object('policy_fingerprint', (SELECT fp FROM policy_fingerprint))
  UNION ALL
  SELECT 'D.forward_policies_absent',
         CASE WHEN (SELECT count(*) FROM forward_present) = 0 THEN 'PASS' ELSE 'STOP' END,
         '0 Slice A writer SELECT policies',
         (SELECT count(*)::text FROM forward_present),
         jsonb_build_object(
           'present', coalesce((SELECT jsonb_agg(policyname) FROM forward_present), '[]'::jsonb),
           'expected_absent', (SELECT to_jsonb(slice_a_forward_policies) FROM params)
         )
  UNION ALL
  SELECT 'E.grants_inventory',
         'INFO',
         'anon/authenticated/public grants',
         (SELECT count(*)::text FROM table_grants),
         (SELECT coalesce(jsonb_agg(to_jsonb(g) ORDER BY table_name, grantee, privilege_type), '[]'::jsonb) FROM table_grants g)
  UNION ALL
  SELECT 'E.grants_fingerprint',
         'INFO',
         'md5 baseline',
         (SELECT fp FROM grants_fingerprint),
         jsonb_build_object('grants_fingerprint', (SELECT fp FROM grants_fingerprint))
  UNION ALL
  SELECT 'E.write_grants_slice_a_scope',
         CASE
           WHEN (SELECT count(*) FROM write_grants WHERE privilege_type IN ('INSERT', 'DELETE')) = 0
            AND (SELECT count(*) FROM write_grants WHERE privilege_type = 'UPDATE' AND grantee = 'authenticated') = 0
           THEN 'PASS'
           WHEN (SELECT count(*) FROM write_grants WHERE privilege_type IN ('INSERT', 'DELETE')) > 0
           THEN 'STOP'
           ELSE 'INFO'
         END,
         'no authenticated table UPDATE/INSERT/DELETE preferred for Slice A (column grants may INFO)',
         (SELECT count(*)::text FROM write_grants),
         (SELECT coalesce(jsonb_agg(to_jsonb(w) ORDER BY table_name, grantee, privilege_type), '[]'::jsonb) FROM write_grants w)
  UNION ALL
  SELECT 'F.data_album_counts',
         'INFO',
         'total/published/gosaki/null_slug',
         (SELECT format('total=%s published=%s gosaki=%s null_slug=%s', total, published, gosaki, null_or_empty_slug) FROM album_counts),
         (SELECT to_jsonb(a) FROM album_counts a)
  UNION ALL
  SELECT 'F.data_track_counts',
         'INFO',
         'total/gosaki/null_slug',
         (SELECT format('total=%s gosaki=%s null_slug=%s', total, gosaki, null_or_empty_slug) FROM track_counts),
         (SELECT to_jsonb(t) FROM track_counts t)
  UNION ALL
  SELECT 'F.site_slug_distribution',
         CASE
           WHEN (SELECT null_or_empty_slug FROM album_counts) = 0
            AND (SELECT null_or_empty_slug FROM track_counts) = 0
            AND (SELECT count(*) FROM album_slug_dist WHERE site_slug <> (SELECT target_site_slug FROM params)) = 0
            AND (SELECT count(*) FROM track_slug_dist WHERE site_slug <> (SELECT target_site_slug FROM params)) = 0
           THEN 'PASS'
           ELSE 'STOP'
         END,
         'all rows site_slug=gosaki-piano · no null',
         'see details',
         jsonb_build_object(
           'albums', (SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY site_slug), '[]'::jsonb) FROM album_slug_dist a),
           'tracks', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY site_slug), '[]'::jsonb) FROM track_slug_dist t)
         )
  UNION ALL
  SELECT 'F.orphan_tracks',
         CASE WHEN (SELECT n FROM orphan_tracks) = 0 THEN 'PASS' ELSE 'STOP' END,
         '0',
         (SELECT n::text FROM orphan_tracks),
         jsonb_build_object('orphan_tracks', (SELECT n FROM orphan_tracks))
  UNION ALL
  SELECT 'G.sites_singleton',
         CASE WHEN (SELECT n FROM site_count) = 1 THEN 'PASS' ELSE 'STOP' END,
         '1',
         (SELECT n::text FROM site_count),
         (SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) FROM sites_gosaki s)
  UNION ALL
  SELECT 'H.rpc_exists',
         CASE WHEN (SELECT count(*) FROM rpc_meta) >= 1 THEN 'PASS' ELSE 'STOP' END,
         '>=1 overload',
         (SELECT count(*)::text FROM rpc_meta),
         (SELECT coalesce(jsonb_agg(jsonb_build_object(
            'identity_args', identity_args,
            'security_definer', security_definer,
            'definition_md5', definition_md5
          )), '[]'::jsonb) FROM rpc_meta)
  UNION ALL
  SELECT 'H.rpc_security_definer',
         CASE WHEN (SELECT bool_and(security_definer) FROM rpc_meta) THEN 'PASS' ELSE 'STOP' END,
         'true',
         (SELECT bool_and(security_definer)::text FROM rpc_meta),
         '{}'::jsonb
  UNION ALL
  SELECT 'H.rpc_is_historical_is_admin',
         CASE
           WHEN (SELECT bool_and(definition ~ 'public\.is_admin\(\)' AND definition !~ 'can_write_site\(') FROM rpc_meta)
           THEN 'PASS'
           WHEN (SELECT bool_and(definition ~ 'can_write_site\(') FROM rpc_meta)
           THEN 'STOP'
           ELSE 'STOP'
         END,
         'definition contains is_admin() and not can_write_site (current value only — not correctness)',
         CASE
           WHEN (SELECT bool_and(definition ~ 'public\.is_admin\(\)') FROM rpc_meta) THEN 'has_is_admin'
           ELSE 'missing_is_admin'
         END || ' / ' ||
         CASE
           WHEN (SELECT bool_or(definition ~ 'can_write_site\(') FROM rpc_meta) THEN 'has_can_write_site'
           ELSE 'no_can_write_site'
         END,
         (SELECT jsonb_build_object(
            'definition_md5', (SELECT string_agg(definition_md5, ',' ORDER BY identity_args) FROM rpc_meta),
            'note', 'PASS here means historical gate still present pre-apply — not an authz design endorsement'
          ))
  UNION ALL
  SELECT 'H.rpc_execute_grants',
         CASE
           WHEN (SELECT bool_or(can_execute) FROM rpc_exec_grants WHERE grantee = 'authenticated')
            AND NOT (SELECT bool_or(can_execute) FROM rpc_exec_grants WHERE grantee = 'anon')
           THEN 'PASS'
           ELSE 'STOP'
         END,
         'authenticated EXECUTE · anon no',
         (SELECT string_agg(grantee || '=' || can_execute::text, ', ' ORDER BY grantee) FROM rpc_exec_grants),
         (SELECT coalesce(jsonb_agg(to_jsonb(g) ORDER BY grantee), '[]'::jsonb) FROM rpc_exec_grants g)
  UNION ALL
  SELECT 'I.helpers_present',
         CASE
           WHEN (SELECT count(DISTINCT proname) FROM helper_meta WHERE proname IN ('can_write_site','is_site_member','is_platform_admin')) = 3
           THEN 'PASS' ELSE 'STOP'
         END,
         'can_write_site + is_site_member + is_platform_admin',
         (SELECT string_agg(proname, ',' ORDER BY proname) FROM helper_meta),
         (SELECT coalesce(jsonb_agg(to_jsonb(h) ORDER BY proname), '[]'::jsonb) FROM helper_meta h)
  UNION ALL
  SELECT 'I.can_write_site_authenticated_execute',
         CASE
           WHEN (SELECT bool_or(can_execute) FROM helper_exec WHERE proname = 'can_write_site' AND grantee = 'authenticated')
           THEN 'PASS' ELSE 'STOP'
         END,
         'authenticated EXECUTE on can_write_site',
         (SELECT string_agg(grantee || '=' || can_execute::text, ', ') FROM helper_exec WHERE proname = 'can_write_site'),
         (SELECT coalesce(jsonb_agg(to_jsonb(h)), '[]'::jsonb) FROM helper_exec h WHERE proname = 'can_write_site')
  UNION ALL
  SELECT 'J.owner_membership_inventory',
         CASE WHEN (SELECT count(*) FROM owner_members) >= 1 THEN 'INFO' ELSE 'STOP' END,
         '>=1 site_members.owner for gosaki-piano (inventory only)',
         (SELECT count(*)::text FROM owner_members),
         jsonb_build_object(
           'owner_count', (SELECT count(*) FROM owner_members),
           'owners_in_admin_users', (SELECT count(*) FROM owner_admin_overlap WHERE in_admin_users),
           'note', 'NOT a live JWT can_write_site/is_admin probe — do not treat as OWNER_FIXTURE_READY'
         )
  UNION ALL
  SELECT 'K.public_read_prediction',
         'INFO',
         'Slice A adds authenticated writer SELECT only — anon published SELECT unchanged',
         'predict_ok_if_forward_select_only',
         jsonb_build_object(
           'anon_expected', 'discography*_public_select unchanged',
           'authenticated_writer_expected_after_apply', 'unpublished visible via site_writer_select when can_write_site',
           'slice_b_c_out_of_scope', true
         )
  UNION ALL
  SELECT 'Z.preflight_summary',
         CASE
           WHEN EXISTS (
             SELECT 1 FROM (
               SELECT CASE WHEN (SELECT count(*) FROM forward_present) = 0 THEN 'PASS' ELSE 'STOP' END AS s
               UNION ALL SELECT CASE WHEN (SELECT n FROM site_count) = 1 THEN 'PASS' ELSE 'STOP' END
               UNION ALL SELECT CASE WHEN (SELECT null_or_empty_slug FROM album_counts) = 0
                                      AND (SELECT null_or_empty_slug FROM track_counts) = 0 THEN 'PASS' ELSE 'STOP' END
               UNION ALL SELECT CASE WHEN (SELECT n FROM orphan_tracks) = 0 THEN 'PASS' ELSE 'STOP' END
               UNION ALL SELECT CASE WHEN (SELECT bool_and(definition ~ 'public\.is_admin\(\)' AND definition !~ 'can_write_site\(') FROM rpc_meta) THEN 'PASS' ELSE 'STOP' END
             ) x WHERE x.s = 'STOP'
           ) THEN 'STOP'
           ELSE 'READY_FOR_OPERATOR_RECORD'
         END,
         'no STOP on drift/absent/RPC/site mapping',
         'see rows',
         jsonb_build_object(
           'next', 'Record results → discography-site-owner-authz-slice-a-staging-preflight-result',
           'apply_forbidden_until', 'explicit operator approval after recorded PASS',
           'owner_jwt_probe', 'separate — not this packet'
         )
) q
ORDER BY check_key;
