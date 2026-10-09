-- =============================================================================
-- Rollback: Gosaki About multi-field Save RPC — TEMPLATE
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Drops the function only. Does not delete site_page_fields rows.
-- No service_role.
-- =============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.gosaki_about_page_fields_save(text, text, jsonb);

COMMIT;
