-- Gosaki Discography operational Save — atomic RPC (staging only)
-- Project: kmjqppxjdnwwrtaeqjta (static-to-astro-cms-staging)
-- STOP: vsbvndwuajjhnzpohghh / production
--
-- Purpose: release editable columns + tracks replace in ONE transaction.
-- Does NOT GRANT table UPDATE/INSERT/DELETE to authenticated/anon.
-- DO NOT auto-apply from CI. Operator applies via SQL Editor after SELECT-only preflight.
--
-- Site boundary (design):
--   All SELECT FOR UPDATE / UPDATE / DELETE / INSERT predicates bind
--   site_slug = btrim(p_site_slug) AND legacy_id|discography_legacy_id = btrim(p_legacy_id).
--   Empty p_site_slug / p_legacy_id are rejected. p_site_slug must be 'gosaki-piano'.
--   Therefore a row with the same legacy_id under another site_slug cannot be matched
--   or mutated (example: site_slug='other-site', legacy_id='discography-001').

CREATE OR REPLACE FUNCTION public.gosaki_discography_operational_save(
  p_site_slug text,
  p_legacy_id text,
  p_expected_before_updated_at timestamptz,
  p_title text,
  p_artist text,
  p_release_date date,
  p_label text,
  p_purchase_url text,
  p_description text,
  p_track_titles text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_admin boolean;
  v_site_slug text;
  v_legacy_id text;
  v_row public.discography%ROWTYPE;
  v_release_date date;
  v_title text;
  v_artist text;
  v_label text;
  v_purchase_url text;
  v_description text;
  v_track_titles text[];
  v_changed text[] := ARRAY[]::text[];
  v_before_tracks text[];
  v_i integer;
  v_line text;
  v_next_updated_at timestamptz;
  v_tracks_changed boolean := false;
BEGIN
  -- 1) Admin gate (must use caller JWT context via is_admin)
  BEGIN
    v_admin := public.is_admin();
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason_code', 'admin_probe_failed',
        'message', 'Admin probe failed',
        'http_status', 403
      );
  END;

  IF v_admin IS DISTINCT FROM true THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'admin_required',
      'message', 'public.is_admin() must be true',
      'http_status', 403
    );
  END IF;

  -- 2) Input identity (reject empty; bind all writes to trimmed site + legacy)
  v_site_slug := btrim(coalesce(p_site_slug, ''));
  v_legacy_id := btrim(coalesce(p_legacy_id, ''));

  IF v_site_slug = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'site_slug_required',
      'message', 'p_site_slug must not be empty',
      'http_status', 400
    );
  END IF;

  IF v_legacy_id = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'legacy_id_required',
      'message', 'p_legacy_id must not be empty',
      'http_status', 400
    );
  END IF;

  IF v_site_slug <> 'gosaki-piano' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'site_mismatch',
      'message', 'siteSlug must be gosaki-piano',
      'http_status', 400
    );
  END IF;

  IF v_legacy_id !~ '^discography-[0-9]{3}$' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'legacy_id_mismatch',
      'message', 'legacyId must match discography-NNN',
      'http_status', 400
    );
  END IF;

  IF p_expected_before_updated_at IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_missing',
      'message', 'expectedBeforeUpdatedAt is required',
      'http_status', 400
    );
  END IF;

  -- 3) Normalize / validate editable scalars (no frozen columns accepted)
  -- p_release_date is date|null (Edge validates YYYY-MM-DD or null before call)
  v_release_date := p_release_date;

  v_title := btrim(coalesce(p_title, ''));
  IF v_title = '' OR char_length(v_title) > 200 OR v_title ~ '[<>]' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid title',
      'http_status', 400
    );
  END IF;

  v_artist := nullif(btrim(coalesce(p_artist, '')), '');
  IF v_artist IS NOT NULL AND (char_length(v_artist) > 200 OR v_artist ~ '[<>]') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid artist',
      'http_status', 400
    );
  END IF;

  v_label := nullif(btrim(coalesce(p_label, '')), '');
  IF v_label IS NOT NULL AND (char_length(v_label) > 200 OR v_label ~ '[<>]') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid label',
      'http_status', 400
    );
  END IF;

  v_description := nullif(coalesce(p_description, ''), '');
  IF v_description IS NOT NULL AND (char_length(v_description) > 5000 OR v_description ~ '[<>]') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'field_validation_failed',
      'message', 'invalid description',
      'http_status', 400
    );
  END IF;

  v_purchase_url := nullif(btrim(coalesce(p_purchase_url, '')), '');
  IF v_purchase_url IS NOT NULL THEN
    IF char_length(v_purchase_url) > 2000
       OR lower(v_purchase_url) LIKE 'javascript:%'
       OR v_purchase_url !~* '^https?://' THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason_code', 'field_validation_failed',
        'message', 'invalid purchase_url',
        'http_status', 400
      );
    END IF;
  END IF;

  -- 4) Track titles array
  IF p_track_titles IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'tracks_required',
      'message', 'track titles array is required',
      'http_status', 400
    );
  END IF;

  v_track_titles := ARRAY[]::text[];
  FOR v_i IN 1 .. coalesce(array_length(p_track_titles, 1), 0) LOOP
    v_line := btrim(coalesce(p_track_titles[v_i], ''));
    IF v_line = '' THEN
      CONTINUE;
    END IF;
    IF char_length(v_line) > 200 OR v_line ~ '[<>]' THEN
      RETURN jsonb_build_object(
        'ok', false,
        'reason_code', 'tracks_validation_failed',
        'message', 'invalid track title',
        'http_status', 400
      );
    END IF;
    v_track_titles := array_append(v_track_titles, v_line);
  END LOOP;

  IF coalesce(array_length(v_track_titles, 1), 0) > 100 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'tracks_validation_failed',
      'message', 'too many tracks',
      'http_status', 400
    );
  END IF;

  -- 5) Lock release row (site_slug + legacy_id — never legacy_id alone)
  SELECT * INTO v_row
  FROM public.discography d
  WHERE d.site_slug = v_site_slug
    AND d.legacy_id = v_legacy_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'release_read_failed',
      'message', 'discography row not found',
      'http_status', 404
    );
  END IF;

  IF v_row.updated_at IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_unavailable',
      'message', 'current updated_at is unavailable',
      'http_status', 409
    );
  END IF;

  IF v_row.updated_at IS DISTINCT FROM p_expected_before_updated_at THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_conflict',
      'message', 'expectedBeforeUpdatedAt does not match current updated_at',
      'http_status', 409
    );
  END IF;

  -- 6) Diff editable fields (frozen columns never written)
  IF coalesce(v_row.title, '') IS DISTINCT FROM v_title THEN
    v_changed := array_append(v_changed, 'title');
  END IF;
  IF nullif(btrim(coalesce(v_row.artist, '')), '') IS DISTINCT FROM v_artist THEN
    v_changed := array_append(v_changed, 'artist');
  END IF;
  IF v_row.release_date IS DISTINCT FROM v_release_date THEN
    v_changed := array_append(v_changed, 'release_date');
  END IF;
  IF nullif(btrim(coalesce(v_row.label, '')), '') IS DISTINCT FROM v_label THEN
    v_changed := array_append(v_changed, 'label');
  END IF;
  IF nullif(btrim(coalesce(v_row.purchase_url, '')), '') IS DISTINCT FROM v_purchase_url THEN
    v_changed := array_append(v_changed, 'purchase_url');
  END IF;
  IF coalesce(v_row.description, '') IS DISTINCT FROM coalesce(v_description, '') THEN
    v_changed := array_append(v_changed, 'description');
  END IF;

  SELECT coalesce(array_agg(t.title ORDER BY t.track_number NULLS LAST, t.sort_order NULLS LAST), ARRAY[]::text[])
  INTO v_before_tracks
  FROM public.discography_tracks t
  WHERE t.site_slug = v_site_slug
    AND t.discography_legacy_id = v_legacy_id;

  IF coalesce(v_before_tracks, ARRAY[]::text[]) IS DISTINCT FROM coalesce(v_track_titles, ARRAY[]::text[]) THEN
    v_tracks_changed := true;
    v_changed := array_append(v_changed, 'tracks');
  END IF;

  IF coalesce(array_length(v_changed, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'no_change',
      'message', 'no editable field or tracklist change detected',
      'http_status', 422
    );
  END IF;

  -- 7) Update release editable columns + bump updated_at (same TX)
  UPDATE public.discography d
  SET
    title = v_title,
    artist = v_artist,
    release_date = v_release_date,
    label = v_label,
    purchase_url = v_purchase_url,
    description = v_description,
    updated_at = now()
  WHERE d.site_slug = v_site_slug
    AND d.legacy_id = v_legacy_id
    AND d.updated_at = p_expected_before_updated_at
  RETURNING d.updated_at INTO v_next_updated_at;

  IF v_next_updated_at IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason_code', 'optimistic_lock_conflict',
      'message', 'UPDATE matched 0 rows — conflict / already changed / STOP',
      'http_status', 409
    );
  END IF;

  -- 8) Replace tracks (same TX) when changed — site_slug bound on DELETE and every INSERT
  IF v_tracks_changed THEN
    DELETE FROM public.discography_tracks t
    WHERE t.site_slug = v_site_slug
      AND t.discography_legacy_id = v_legacy_id;

    IF coalesce(array_length(v_track_titles, 1), 0) > 0 THEN
      INSERT INTO public.discography_tracks (
        site_slug,
        discography_legacy_id,
        track_number,
        sort_order,
        title
      )
      SELECT
        v_site_slug,
        v_legacy_id,
        gs.ordinality::integer,
        gs.ordinality::integer,
        gs.title
      FROM unnest(v_track_titles) WITH ORDINALITY AS gs(title, ordinality);
      -- id default gen_random_uuid(); created_at default now() — omit both
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'reason_code', 'ok',
    'legacy_id', v_legacy_id,
    'site_slug', v_site_slug,
    'updated_at', v_next_updated_at,
    'changed_fields', to_jsonb(v_changed),
    'http_status', 200
  );
END;
$$;

COMMENT ON FUNCTION public.gosaki_discography_operational_save(
  text, text, timestamptz, text, text, date, text, text, text, text[]
) IS
  'Gosaki staging atomic Discography operational Save. SECURITY DEFINER; requires is_admin(); no table grants to authenticated.';

REVOKE ALL ON FUNCTION public.gosaki_discography_operational_save(
  text, text, timestamptz, text, text, date, text, text, text, text[]
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.gosaki_discography_operational_save(
  text, text, timestamptz, text, text, date, text, text, text, text[]
) FROM anon;

GRANT EXECUTE ON FUNCTION public.gosaki_discography_operational_save(
  text, text, timestamptz, text, text, date, text, text, text, text[]
) TO authenticated;

-- Explicit: do not grant table write privileges here.
-- authenticated/anon remain SELECT-only on discography / discography_tracks.
