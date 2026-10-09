-- =============================================================================
-- Gosaki About multi-field Save RPC — TEMPLATE
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
--
-- One call is one transaction. Validation returns before any write.
-- A write that does not match its optimistic lock RAISE EXCEPTION and rolls
-- the whole call back (no partial site_page_fields update).
-- Authz: SECURITY INVOKER. No SECURITY DEFINER. No service_role.
-- Writes: column INSERT/UPDATE for authenticated, plus RESTRICTIVE RLS.
--   Direct PostgREST writes have no transaction-local marker and fail RLS.
--   SELECT stays on the existing table grant. Existing permissive policies stay.
-- Scope: site_slug = gosaki-piano, page_key = about, shared allowlist function.
-- Marker: app.gosaki_about_rpc_write = 1, set_config(..., true) is transaction-local.
-- Does not change image URLs. Does not touch Contents.
-- Rollback: cms-core-v2-gosaki-about-page-fields-save-rpc-rollback.template.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.gosaki_about_field_key_allowed(p_field_key text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
  SELECT btrim(coalesce(p_field_key, '')) IN (
    'profile.heading',
    'profile.body',
    'profile.image_alt',
    'profile.lede',
    'bands.gosakirika-trio.name',
    'bands.gosakirika-trio.body',
    'bands.gosakirika-trio.image_alt',
    'bands.onomatope.name',
    'bands.onomatope.body',
    'bands.onomatope.image_alt',
    'bands.careless-hornets.name',
    'bands.careless-hornets.body',
    'bands.careless-hornets.image_alt',
    'bands.kikioto.name',
    'bands.kikioto.body',
    'bands.kikioto.image_alt',
    'bands.caribbean-function.name',
    'bands.caribbean-function.body',
    'bands.caribbean-function.image_alt'
  );
$$;

CREATE OR REPLACE FUNCTION public.gosaki_about_rpc_write_allowed(
  p_site_id uuid,
  p_site_slug text,
  p_page_key text,
  p_field_key text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT current_setting('app.gosaki_about_rpc_write', true) = '1'
    AND public.can_write_site(p_site_id)
    AND btrim(coalesce(p_site_slug, '')) = 'gosaki-piano'
    AND btrim(coalesce(p_page_key, '')) = 'about'
    AND public.gosaki_about_field_key_allowed(p_field_key);
$$;

CREATE OR REPLACE FUNCTION public.gosaki_about_page_fields_save(
  p_site_slug text,
  p_page_key text,
  p_fields jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_site_slug text := btrim(coalesce(p_site_slug, ''));
  v_page_key text := btrim(coalesce(p_page_key, ''));
  v_site_id uuid;
  v_can_write boolean;
  v_item jsonb;
  v_field_key text;
  v_value text;
  v_lock text;
  v_expected timestamptz;
  v_part text;
  v_seen text[] := ARRAY[]::text[];
  v_row public.site_page_fields%ROWTYPE;
  v_found boolean;
  v_plan jsonb := '[]'::jsonb;
  v_any_changed boolean := false;
  v_changed text[] := ARRAY[]::text[];
  v_new_updated timestamptz;
  v_after jsonb := '[]'::jsonb;
  v_locks jsonb := '{}'::jsonb;
  v_out_row public.site_page_fields%ROWTYPE;
BEGIN
  IF v_site_slug <> 'gosaki-piano' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'site_mismatch', 'http_status', 400);
  END IF;
  IF v_page_key <> 'about' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'page_not_allowed', 'http_status', 400);
  END IF;
  IF jsonb_typeof(p_fields) IS DISTINCT FROM 'array' OR jsonb_array_length(p_fields) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'fields_required', 'http_status', 400);
  END IF;

  SELECT s.id INTO v_site_id
  FROM public.sites s
  WHERE s.site_slug = v_site_slug;
  IF v_site_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'site_not_found', 'http_status', 403);
  END IF;

  BEGIN
    v_can_write := public.can_write_site(v_site_id);
  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Forbidden', 'detail', 'can_write_site', 'http_status', 403);
  END;
  IF v_can_write IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Forbidden', 'detail', 'can_write_site denied', 'http_status', 403);
  END IF;

  -- Transaction-local only. Required before SELECT ... FOR UPDATE, because the
  -- restrictive UPDATE policy also filters locked rows. Dies at transaction end.
  PERFORM set_config('app.gosaki_about_rpc_write', '1', true);

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_fields) AS t(value)
  LOOP
    v_field_key := btrim(coalesce(v_item->>'fieldKey', ''));
    v_value := btrim(coalesce(v_item->>'nextValueText', v_item->>'valueText', ''));
    v_lock := nullif(btrim(coalesce(v_item->>'expectedBeforeUpdatedAt', '')), '');
    v_part := CASE WHEN v_field_key LIKE '%.image_alt' THEN 'image_alt' ELSE 'text' END;

    IF v_field_key = ANY (v_seen) OR v_field_key = '' OR NOT public.gosaki_about_field_key_allowed(v_field_key) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'field_not_allowed', 'detail', v_field_key, 'http_status', 400);
    END IF;

    v_seen := array_append(v_seen, v_field_key);

    IF v_part IS DISTINCT FROM 'image_alt' AND v_value = '' THEN
      RETURN jsonb_build_object('ok', false, 'error', 'value_text_required', 'detail', v_field_key, 'http_status', 400);
    END IF;

    SELECT * INTO v_row
    FROM public.site_page_fields f
    WHERE f.site_slug = v_site_slug
      AND f.page_key = 'about'
      AND f.field_key = v_field_key
    FOR UPDATE;
    v_found := FOUND;

    IF v_found THEN
      IF v_lock IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'stale_optimistic_lock', 'detail', v_field_key, 'http_status', 409);
      END IF;
      BEGIN
        v_expected := v_lock::timestamptz;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN jsonb_build_object('ok', false, 'error', 'stale_optimistic_lock', 'detail', v_field_key, 'http_status', 409);
      END;
      IF v_row.updated_at IS DISTINCT FROM v_expected THEN
        RETURN jsonb_build_object('ok', false, 'error', 'stale_optimistic_lock', 'detail', v_field_key, 'http_status', 409);
      END IF;
      IF btrim(coalesce(v_row.value_text, '')) IS DISTINCT FROM v_value THEN
        v_any_changed := true;
        v_changed := array_append(v_changed, v_field_key);
      END IF;
    ELSE
      IF v_lock IS NOT NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'stale_optimistic_lock', 'detail', v_field_key, 'http_status', 409);
      END IF;
      v_any_changed := true;
      v_changed := array_append(v_changed, v_field_key);
      v_expected := NULL;
    END IF;

    v_plan := v_plan || jsonb_build_array(jsonb_build_object(
      'fieldKey', v_field_key,
      'nextValueText', v_value,
      'mode', CASE WHEN v_found THEN 'update' ELSE 'insert' END,
      'rowId', CASE WHEN v_found THEN v_row.id::text ELSE NULL END,
      'expectedBeforeUpdatedAt', CASE WHEN v_found THEN v_row.updated_at ELSE NULL END,
      'changed', CASE
        WHEN NOT v_found THEN true
        WHEN btrim(coalesce(v_row.value_text, '')) IS DISTINCT FROM v_value THEN true
        ELSE false
      END
    ));
  END LOOP;

  IF NOT v_any_changed THEN
    RETURN jsonb_build_object(
      'ok', true,
      'noChange', true,
      'changedFields', '[]'::jsonb,
      'http_status', 200
    );
  END IF;

  -- ATOMIC WRITES (only after every field passed allowlist, validation, and lock checks)
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_plan) AS t(value)
  LOOP
    IF coalesce((v_item->>'changed')::boolean, false) IS NOT TRUE THEN
      CONTINUE;
    END IF;

    IF v_item->>'mode' = 'update' THEN
      v_new_updated := NULL;
      UPDATE public.site_page_fields f
      SET value_text = v_item->>'nextValueText'
      WHERE f.id = (v_item->>'rowId')::uuid
        AND f.site_slug = 'gosaki-piano'
        AND f.page_key = 'about'
        AND f.field_key = v_item->>'fieldKey'
        AND f.updated_at = (v_item->>'expectedBeforeUpdatedAt')::timestamptz
      RETURNING f.updated_at INTO v_new_updated;
      IF v_new_updated IS NULL THEN
        RAISE EXCEPTION 'about_fields_save:stale_optimistic_lock';
      END IF;
    ELSE
      INSERT INTO public.site_page_fields (
        site_id,
        site_slug,
        page_key,
        field_key,
        value_text,
        published,
        sort_order
      ) VALUES (
        v_site_id,
        'gosaki-piano',
        'about',
        v_item->>'fieldKey',
        v_item->>'nextValueText',
        true,
        100
      );
    END IF;
  END LOOP;

  FOREACH v_field_key IN ARRAY v_seen
  LOOP
    SELECT * INTO v_out_row
    FROM public.site_page_fields f
    WHERE f.site_slug = 'gosaki-piano'
      AND f.page_key = 'about'
      AND f.field_key = v_field_key;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'about_fields_save:row_missing_after_write';
    END IF;
    v_after := v_after || jsonb_build_array(jsonb_build_object(
      'fieldKey', v_out_row.field_key,
      'valueText', v_out_row.value_text,
      'updatedAt', v_out_row.updated_at
    ));
    v_locks := v_locks || jsonb_build_object(v_out_row.field_key, v_out_row.updated_at);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'noChange', false,
    'changedFields', to_jsonb(v_changed),
    'fields', v_after,
    'fieldLocks', v_locks,
    'http_status', 200
  );
END;
$$;

COMMENT ON FUNCTION public.gosaki_about_page_fields_save(text, text, jsonb) IS
  'Atomic Gosaki About site_page_fields save. INVOKER. can_write_site required. gosaki-piano/about allowlist only. RAISE rolls back. No service_role.';

REVOKE ALL ON FUNCTION public.gosaki_about_field_key_allowed(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.gosaki_about_field_key_allowed(text) FROM anon;
REVOKE ALL ON FUNCTION public.gosaki_about_field_key_allowed(text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.gosaki_about_field_key_allowed(text) TO authenticated;

REVOKE ALL ON FUNCTION public.gosaki_about_rpc_write_allowed(uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.gosaki_about_rpc_write_allowed(uuid, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.gosaki_about_rpc_write_allowed(uuid, text, text, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.gosaki_about_rpc_write_allowed(uuid, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.gosaki_about_page_fields_save(text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.gosaki_about_page_fields_save(text, text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.gosaki_about_page_fields_save(text, text, jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION public.gosaki_about_page_fields_save(text, text, jsonb) TO authenticated;

GRANT INSERT (
  site_id,
  site_slug,
  page_key,
  field_key,
  value_text,
  published,
  sort_order
) ON TABLE public.site_page_fields TO authenticated;

GRANT UPDATE (value_text) ON TABLE public.site_page_fields TO authenticated;

DROP POLICY IF EXISTS site_page_fields_about_rpc_insert ON public.site_page_fields;
CREATE POLICY site_page_fields_about_rpc_insert
  ON public.site_page_fields
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.gosaki_about_rpc_write_allowed(site_id, site_slug, page_key, field_key)
  );

DROP POLICY IF EXISTS site_page_fields_about_rpc_update ON public.site_page_fields;
CREATE POLICY site_page_fields_about_rpc_update
  ON public.site_page_fields
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    public.gosaki_about_rpc_write_allowed(site_id, site_slug, page_key, field_key)
  )
  WITH CHECK (
    public.gosaki_about_rpc_write_allowed(site_id, site_slug, page_key, field_key)
  );

COMMIT;
