-- =============================================================================
-- Rollback: Gosaki About multi-field Save RPC — TEMPLATE
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Drops only the objects this rollout adds:
--   site_page_fields_about_rpc_insert
--   site_page_fields_about_rpc_update
--   gosaki_about_page_fields_save
--   gosaki_about_rpc_write_allowed
--   gosaki_about_field_key_allowed
--   column INSERT and UPDATE(value_text) for authenticated
-- Does not delete rows. Does not revoke SELECT.
-- Does not drop site_page_fields_admin_insert, site_page_fields_admin_update,
-- or the public/admin SELECT policies.
-- No service_role.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS site_page_fields_about_rpc_insert ON public.site_page_fields;
DROP POLICY IF EXISTS site_page_fields_about_rpc_update ON public.site_page_fields;

DROP FUNCTION IF EXISTS public.gosaki_about_page_fields_save(text, text, jsonb);
DROP FUNCTION IF EXISTS public.gosaki_about_rpc_write_allowed(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.gosaki_about_field_key_allowed(text);

REVOKE INSERT (
  site_id,
  site_slug,
  page_key,
  field_key,
  value_text,
  published,
  sort_order
) ON TABLE public.site_page_fields FROM authenticated;

REVOKE UPDATE (value_text) ON TABLE public.site_page_fields FROM authenticated;

COMMIT;
