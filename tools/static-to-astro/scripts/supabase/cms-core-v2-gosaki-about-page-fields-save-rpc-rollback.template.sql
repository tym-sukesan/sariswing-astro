-- =============================================================================
-- Rollback: Gosaki About multi-field Save RPC — TEMPLATE
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Drops the function. Revokes only the table INSERT/UPDATE this rollout adds.
-- Does not delete site_page_fields rows. Does not revoke SELECT.
-- Does not revoke column-level INSERT/UPDATE from the RLS template.
-- Does not touch anon or service_role.
-- Schedule, YouTube, and Discography do not write this table.
-- The legacy About value_text UPDATE is the same feature and uses this
-- table grant; revoking it returns that path to SELECT-only.
-- No service_role.
-- =============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.gosaki_about_page_fields_save(text, text, jsonb);

REVOKE INSERT, UPDATE ON TABLE public.site_page_fields FROM authenticated;

COMMIT;
