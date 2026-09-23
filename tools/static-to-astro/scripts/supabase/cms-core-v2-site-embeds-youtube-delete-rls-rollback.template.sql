-- =============================================================================
-- Rollback for cms-core-v2-site-embeds-youtube-delete-rls.template.sql
-- DO NOT EXECUTE without a separate explicit operator approval
-- Staging only: kmjqppxjdnwwrtaeqjta · STOP production vsbvndwuajjhnzpohghh
-- Drops the YouTube DELETE policy + DELETE grant only. Table and other RLS stay.
-- =============================================================================

begin;

drop policy if exists site_embeds_admin_delete_youtube on public.site_embeds;
revoke delete on table public.site_embeds from authenticated;

commit;
