-- G-20u36a — Gosaki Discography SELECT-only before verification
-- Phase: G-20u36a-gosaki-discography-select-only-before-verification
-- Classification: **SELECT-ONLY** — safe for Supabase SQL Editor (staging)
--
-- STAGING ONLY:
--   project ref: kmjqppxjdnwwrtaeqjta
--   database: static-to-astro-cms-staging
--
-- PRODUCTION STOP — DO NOT RUN on:
--   project ref: vsbvndwuajjhnzpohghh
--
-- Target first controlled Save candidate:
--   site_slug = 'gosaki-piano'
--   legacy_id = 'discography-002'
--
-- Cursor does NOT execute this file. Operator runs manually after confirming project ref.
-- Copy-paste this entire file as ONE block in Supabase SQL Editor.

WITH params AS (
  SELECT
    'kmjqppxjdnwwrtaeqjta'::text AS expected_project_ref,
    'vsbvndwuajjhnzpohghh'::text AS production_project_ref_forbidden,
    'staging'::text AS expected_environment,
    'gosaki-piano'::text AS target_site_slug,
    'discography-002'::text AS target_legacy_id,
    8::int AS expected_target_track_count_candidate,
    4::int AS expected_total_releases,
    34::int AS expected_total_tracks,
    (now() AT TIME ZONE 'utc')::timestamptz AS backup_timestamp
),
schema_cols AS (
  SELECT
    table_name,
    column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('discography', 'discography_tracks')
),
target_release_row AS (
  SELECT d.*
  FROM public.discography d
  CROSS JOIN params p
  WHERE d.site_slug = p.target_site_slug
    AND d.legacy_id = p.target_legacy_id
),
target_tracks_rows AS (
  SELECT t.*
  FROM public.discography_tracks t
  CROSS JOIN params p
  WHERE t.site_slug = p.target_site_slug
    AND t.discography_legacy_id = p.target_legacy_id
),
metrics AS (
  SELECT
    p.expected_project_ref,
    p.production_project_ref_forbidden,
    p.expected_environment,
    p.target_site_slug,
    p.target_legacy_id,
    p.expected_target_track_count_candidate,
    p.expected_total_releases,
    p.expected_total_tracks,
    p.backup_timestamp,
    (SELECT count(*) FROM target_release_row) AS target_release_count,
    (SELECT count(*) FROM target_tracks_rows) AS target_tracks_count,
    (SELECT count(*) FROM public.discography d WHERE d.site_slug = p.target_site_slug) AS total_releases_gosaki,
    (SELECT count(*) FROM public.discography_tracks t WHERE t.site_slug = p.target_site_slug) AS total_tracks_gosaki,
    (SELECT count(*) FROM target_release_row tr WHERE tr.site_slug IS DISTINCT FROM p.target_site_slug) AS target_release_site_slug_mismatch,
    (SELECT count(*) FROM target_tracks_rows tt WHERE tt.site_slug IS DISTINCT FROM p.target_site_slug) AS target_tracks_site_slug_mismatch,
    (SELECT count(*) FROM target_tracks_rows tt WHERE tt.site_slug IS NULL) AS target_tracks_null_site_slug,
    (
      SELECT count(*)
      FROM public.discography_tracks t
      LEFT JOIN public.discography d ON d.legacy_id = t.discography_legacy_id
      CROSS JOIN params px
      WHERE t.site_slug = px.target_site_slug
        AND t.discography_legacy_id = px.target_legacy_id
        AND d.legacy_id IS NULL
    ) AS target_orphan_tracks,
    (
      SELECT count(*)
      FROM public.discography_tracks t
      JOIN public.discography d ON d.legacy_id = t.discography_legacy_id
      CROSS JOIN params px
      WHERE t.discography_legacy_id = px.target_legacy_id
        AND t.site_slug IS DISTINCT FROM d.site_slug
    ) AS target_track_parent_site_slug_mismatch,
    (
      SELECT count(*)
      FROM (
        SELECT d.legacy_id, d.site_slug, count(*) AS c
        FROM public.discography d
        CROSS JOIN params px
        WHERE d.site_slug = px.target_site_slug
        GROUP BY d.legacy_id, d.site_slug
        HAVING count(*) > 1
      ) dup
    ) AS duplicate_release_keys,
    (
      SELECT count(*)
      FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public'
        AND g.table_name IN ('discography', 'discography_tracks')
        AND g.grantee IN ('anon', 'authenticated', 'public')
        AND g.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    ) AS anon_auth_write_grants,
    (
      SELECT bool_and(c.relrowsecurity)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('discography', 'discography_tracks')
    ) AS rls_enabled_both,
    (
      SELECT count(*)
      FROM schema_cols sc
      WHERE sc.table_name = 'discography' AND sc.column_name = 'site_slug'
    ) AS discography_site_slug_col,
    (
      SELECT count(*)
      FROM schema_cols sc
      WHERE sc.table_name = 'discography_tracks' AND sc.column_name = 'site_slug'
    ) AS tracks_site_slug_col,
    (
      SELECT to_jsonb(tr)
      FROM target_release_row tr
      LIMIT 1
    ) AS target_release_backup_json,
    (
      SELECT coalesce(jsonb_agg(to_jsonb(tt) ORDER BY tt.track_number, tt.sort_order, tt.title), '[]'::jsonb)
      FROM target_tracks_rows tt
    ) AS target_tracks_backup_json,
    (
      SELECT md5(coalesce(to_jsonb(tr)::text, '{}'))
      FROM target_release_row tr
      LIMIT 1
    ) AS target_release_checksum_md5,
    (
      SELECT md5(coalesce((SELECT jsonb_agg(to_jsonb(tt) ORDER BY tt.track_number, tt.sort_order, tt.title)::text FROM target_tracks_rows tt), '[]'))
    ) AS target_tracks_checksum_md5
  FROM params p
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
      'target_site_slug', m.target_site_slug,
      'target_legacy_id', m.target_legacy_id,
      'operator_must_confirm_sql_editor_project_ref_before_run', true
    ) AS details_json
  FROM metrics m

  UNION ALL

  SELECT
    'B.schema.discography.site_slug_column',
    CASE WHEN m.discography_site_slug_col = 1 THEN 'PASS' ELSE 'STOP' END,
    '1',
    m.discography_site_slug_col::text,
    jsonb_build_object('table', 'discography', 'column', 'site_slug')

  FROM metrics m

  UNION ALL

  SELECT
    'B.schema.discography_tracks.site_slug_column',
    CASE WHEN m.tracks_site_slug_col = 1 THEN 'PASS' ELSE 'STOP' END,
    '1',
    m.tracks_site_slug_col::text,
    jsonb_build_object('table', 'discography_tracks', 'column', 'site_slug')

  FROM metrics m

  UNION ALL

  SELECT
    'B.schema.key_columns_present',
    CASE
      WHEN (
        SELECT count(*)
        FROM schema_cols sc
        WHERE (sc.table_name = 'discography' AND sc.column_name IN ('legacy_id', 'title', 'artist', 'published', 'release_date', 'description'))
           OR (sc.table_name = 'discography_tracks' AND sc.column_name IN ('id', 'discography_legacy_id', 'track_number', 'title', 'sort_order'))
      ) >= 11 THEN 'PASS'
      ELSE 'STOP'
    END,
    '>=11 key columns',
    (
      SELECT count(*)::text
      FROM schema_cols sc
      WHERE (sc.table_name = 'discography' AND sc.column_name IN ('legacy_id', 'title', 'artist', 'published', 'release_date', 'description'))
         OR (sc.table_name = 'discography_tracks' AND sc.column_name IN ('id', 'discography_legacy_id', 'track_number', 'title', 'sort_order'))
    ),
    (
      SELECT jsonb_agg(jsonb_build_object('table_name', sc.table_name, 'column_name', sc.column_name) ORDER BY sc.table_name, sc.column_name)
      FROM schema_cols sc
      WHERE sc.column_name IN ('legacy_id', 'title', 'artist', 'published', 'release_date', 'description', 'site_slug', 'id', 'discography_legacy_id', 'track_number', 'sort_order', 'created_at', 'updated_at')
    )
  FROM metrics m

  UNION ALL

  SELECT
    'C.rls.both_tables_enabled',
    CASE WHEN m.rls_enabled_both IS TRUE THEN 'PASS' ELSE 'STOP' END,
    'true',
    coalesce(m.rls_enabled_both::text, 'null'),
    (
      SELECT jsonb_agg(jsonb_build_object('relname', c.relname, 'rls_enabled', c.relrowsecurity) ORDER BY c.relname)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('discography', 'discography_tracks')
    )
  FROM metrics m

  UNION ALL

  SELECT
    'C.permissions.anon_auth_write_grants',
    CASE WHEN m.anon_auth_write_grants = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    m.anon_auth_write_grants::text,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'table_name', g.table_name,
        'grantee', g.grantee,
        'privilege_type', g.privilege_type
      ) ORDER BY g.table_name, g.grantee, g.privilege_type), '[]'::jsonb)
      FROM information_schema.role_table_grants g
      WHERE g.table_schema = 'public'
        AND g.table_name IN ('discography', 'discography_tracks')
        AND g.grantee IN ('anon', 'authenticated', 'public')
        AND g.privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    )
  FROM metrics m

  UNION ALL

  SELECT
    'D.target_release.row_count',
    CASE WHEN m.target_release_count = 1 THEN 'PASS' ELSE 'STOP' END,
    '1',
    m.target_release_count::text,
    m.target_release_backup_json
  FROM metrics m

  UNION ALL

  SELECT
    'D.target_release.site_slug',
    CASE WHEN m.target_release_site_slug_mismatch = 0 AND m.target_release_count = 1 THEN 'PASS' ELSE 'STOP' END,
    m.target_site_slug,
    coalesce((SELECT tr.site_slug FROM target_release_row tr LIMIT 1), 'null'),
    jsonb_build_object(
      'title', (SELECT tr.title FROM target_release_row tr LIMIT 1),
      'artist', (SELECT tr.artist FROM target_release_row tr LIMIT 1),
      'published', (SELECT tr.published FROM target_release_row tr LIMIT 1),
      'release_date', (SELECT tr.release_date::text FROM target_release_row tr LIMIT 1),
      'label', (SELECT tr.label FROM target_release_row tr LIMIT 1),
      'catalog_number', (SELECT tr.catalog_number FROM target_release_row tr LIMIT 1),
      'purchase_url', (SELECT tr.purchase_url FROM target_release_row tr LIMIT 1),
      'streaming_url', (SELECT tr.streaming_url FROM target_release_row tr LIMIT 1),
      'cover_image_url', (SELECT tr.cover_image_url FROM target_release_row tr LIMIT 1),
      'description_present', (SELECT tr.description IS NOT NULL FROM target_release_row tr LIMIT 1)
    )
  FROM metrics m

  UNION ALL

  SELECT
    'E.target_tracks.count',
    CASE WHEN m.target_tracks_count > 0 THEN 'PASS' ELSE 'STOP' END,
    '>0 (candidate 8)',
    m.target_tracks_count::text,
    jsonb_build_object(
      'expected_candidate', m.expected_target_track_count_candidate,
      'matches_candidate', m.target_tracks_count = m.expected_target_track_count_candidate
    )
  FROM metrics m

  UNION ALL

  SELECT
    'E.target_tracks.site_slug_and_orphans',
    CASE
      WHEN m.target_tracks_null_site_slug = 0
       AND m.target_orphan_tracks = 0
       AND m.target_track_parent_site_slug_mismatch = 0
      THEN 'PASS'
      ELSE 'STOP'
    END,
    '0 null / 0 orphan / 0 mismatch',
    jsonb_build_object(
      'null_site_slug', m.target_tracks_null_site_slug,
      'orphan_tracks', m.target_orphan_tracks,
      'parent_site_slug_mismatch', m.target_track_parent_site_slug_mismatch
    )::text,
    m.target_tracks_backup_json
  FROM metrics m

  UNION ALL

  SELECT
    'E.target_tracks.order_preview',
    'INFO',
    'track_number asc',
    (
      SELECT coalesce(string_agg(tt.track_number::text || ':' || tt.title, ' | ' ORDER BY tt.track_number, tt.sort_order), '')
      FROM target_tracks_rows tt
    ),
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'track_number', tt.track_number,
        'sort_order', tt.sort_order,
        'title', tt.title
      ) ORDER BY tt.track_number, tt.sort_order), '[]'::jsonb)
      FROM target_tracks_rows tt
    )
  FROM metrics m

  UNION ALL

  SELECT
    'F.global.total_releases_gosaki',
    CASE WHEN m.total_releases_gosaki = m.expected_total_releases THEN 'PASS' ELSE 'STOP' END,
    m.expected_total_releases::text,
    m.total_releases_gosaki::text,
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object('legacy_id', d.legacy_id, 'title', d.title) ORDER BY d.sort_order, d.legacy_id), '[]'::jsonb)
      FROM public.discography d
      CROSS JOIN params p
      WHERE d.site_slug = p.target_site_slug
    )
  FROM metrics m

  UNION ALL

  SELECT
    'F.global.total_tracks_gosaki',
    CASE WHEN m.total_tracks_gosaki = m.expected_total_tracks THEN 'PASS' ELSE 'STOP' END,
    m.expected_total_tracks::text,
    m.total_tracks_gosaki::text,
    jsonb_build_object(
      'other_releases_count_expected', m.expected_total_releases - 1,
      'other_tracks_count_expected_if_target_is_8', m.expected_total_tracks - m.expected_target_track_count_candidate,
      'other_tracks_count_actual', m.total_tracks_gosaki - m.target_tracks_count
    )
  FROM metrics m

  UNION ALL

  SELECT
    'F.global.duplicate_release_keys',
    CASE WHEN m.duplicate_release_keys = 0 THEN 'PASS' ELSE 'STOP' END,
    '0',
    m.duplicate_release_keys::text,
    jsonb_build_object('scope', 'site_slug=gosaki-piano')
  FROM metrics m

  UNION ALL

  SELECT
    'F.global.other_albums_unchanged_scope',
    'INFO',
    'non-target albums are out of write scope',
    (
      SELECT coalesce(string_agg(d.legacy_id || '(' || tc.c::text || ' tracks)', ', ' ORDER BY d.legacy_id), '')
      FROM public.discography d
      CROSS JOIN params p
      LEFT JOIN LATERAL (
        SELECT count(*) AS c
        FROM public.discography_tracks t
        WHERE t.discography_legacy_id = d.legacy_id
          AND t.site_slug = p.target_site_slug
      ) tc ON true
      WHERE d.site_slug = p.target_site_slug
        AND d.legacy_id <> p.target_legacy_id
    ),
    (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'legacy_id', d.legacy_id,
        'title', d.title,
        'track_count', tc.c
      ) ORDER BY d.legacy_id), '[]'::jsonb)
      FROM public.discography d
      CROSS JOIN params p
      LEFT JOIN LATERAL (
        SELECT count(*) AS c
        FROM public.discography_tracks t
        WHERE t.discography_legacy_id = d.legacy_id
          AND t.site_slug = p.target_site_slug
      ) tc ON true
      WHERE d.site_slug = p.target_site_slug
        AND d.legacy_id <> p.target_legacy_id
    )
  FROM metrics m

  UNION ALL

  SELECT
    'G.backup.timestamp',
    'INFO',
    'ISO-8601 UTC',
    to_char(m.backup_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    jsonb_build_object('note', 'store with backup JSON before any future Save')
  FROM metrics m

  UNION ALL

  SELECT
    'G.backup.release_checksum_md5',
    'INFO',
    'md5(json)',
    m.target_release_checksum_md5,
    m.target_release_backup_json
  FROM metrics m

  UNION ALL

  SELECT
    'G.backup.tracks_checksum_md5',
    'INFO',
    'md5(json array)',
    m.target_tracks_checksum_md5,
    jsonb_build_object(
      'track_count', m.target_tracks_count,
      'tracks_json', m.target_tracks_backup_json
    )
  FROM metrics m

  UNION ALL

  SELECT
    'H.stop_summary.any_stop',
    CASE WHEN EXISTS (
      SELECT 1
      FROM (
        SELECT
          CASE WHEN m.target_release_count = 1 THEN 0 ELSE 1 END
          + CASE WHEN m.target_tracks_count > 0 THEN 0 ELSE 1 END
          + CASE WHEN m.target_release_site_slug_mismatch = 0 THEN 0 ELSE 1 END
          + CASE WHEN m.target_tracks_null_site_slug = 0 AND m.target_orphan_tracks = 0 AND m.target_track_parent_site_slug_mismatch = 0 THEN 0 ELSE 1 END
          + CASE WHEN m.discography_site_slug_col = 1 AND m.tracks_site_slug_col = 1 THEN 0 ELSE 1 END
          + CASE WHEN m.rls_enabled_both IS TRUE THEN 0 ELSE 1 END
          + CASE WHEN m.anon_auth_write_grants = 0 THEN 0 ELSE 1 END
          + CASE WHEN m.duplicate_release_keys = 0 THEN 0 ELSE 1 END
          + CASE WHEN m.total_releases_gosaki = m.expected_total_releases THEN 0 ELSE 1 END
          + CASE WHEN m.total_tracks_gosaki = m.expected_total_tracks THEN 0 ELSE 1 END
          AS stop_flags
        FROM metrics m
      ) s
      WHERE s.stop_flags > 0
    ) THEN 'STOP' ELSE 'PASS' END,
    '0 STOP flags',
    (
      SELECT (
        CASE WHEN m.target_release_count = 1 THEN 0 ELSE 1 END
        + CASE WHEN m.target_tracks_count > 0 THEN 0 ELSE 1 END
        + CASE WHEN m.target_release_site_slug_mismatch = 0 THEN 0 ELSE 1 END
        + CASE WHEN m.target_tracks_null_site_slug = 0 AND m.target_orphan_tracks = 0 AND m.target_track_parent_site_slug_mismatch = 0 THEN 0 ELSE 1 END
        + CASE WHEN m.discography_site_slug_col = 1 AND m.tracks_site_slug_col = 1 THEN 0 ELSE 1 END
        + CASE WHEN m.rls_enabled_both IS TRUE THEN 0 ELSE 1 END
        + CASE WHEN m.anon_auth_write_grants = 0 THEN 0 ELSE 1 END
        + CASE WHEN m.duplicate_release_keys = 0 THEN 0 ELSE 1 END
        + CASE WHEN m.total_releases_gosaki = m.expected_total_releases THEN 0 ELSE 1 END
        + CASE WHEN m.total_tracks_gosaki = m.expected_total_tracks THEN 0 ELSE 1 END
      )::text
      FROM metrics m
    ),
    jsonb_build_object(
      'operator_note', 'If status=STOP, do not proceed to Save. Confirm SQL Editor project is kmjqppxjdnwwrtaeqjta, NOT vsbvndwuajjhnzpohghh.'
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
