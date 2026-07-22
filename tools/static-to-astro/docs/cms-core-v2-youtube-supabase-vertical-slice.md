# CMS Core v2 Phase 2 — YouTube Supabase Vertical Slice (local implementation)

- **Phase:** `cms-core-v2-youtube-supabase-vertical-slice-local-implementation`
- **Status:** **local security hardening complete** — re-audit next; staging execution **not** started
- **Date:** 2026-07-22
- **ADR:** [cms-core-v2-minimal-architecture-decision.md](./cms-core-v2-minimal-architecture-decision.md)

## Gates

```txt
cmsCoreV2YoutubeSupabaseVerticalSliceLocalImplemented: true
cmsCoreV2YoutubeSupabaseLocalSecurityHardeningComplete: true
readyForOperatorMigrationApply: false
edgeDeployExecuted: false
dbMigrationExecuted: false
dbWriteExecuted: false
rlsApplied: false
contentsApiPathUnchangedDefault: true
scheduleDiscographyAboutUnchanged: true
readyForAnyFutureFtpApply: false
```

`readyForOperatorMigrationApply` stays **false** until a dedicated re-audit PASSes. Do not flip true from this hardening alone.

## What was implemented (local only)

| Area | Artifact |
| --- | --- |
| Tenancy + `site_embeds` DDL | `scripts/supabase/cms-core-v2-tenancy-and-site-embeds-migration.template.sql` |
| RLS + minimal GRANT/REVOKE | `scripts/supabase/cms-core-v2-site-embeds-rls.template.sql` |
| Gosaki seed draft | `scripts/supabase/cms-core-v2-gosaki-youtube-seed.template.sql` |
| Rollback templates | `…-rollback.template.sql` (seed / RLS / DDL) |
| Pure contract | `scripts/lib/cms-core-v2-youtube-supabase-contract.mjs` |
| Edge (undeployed) | `supabase/functions/gosaki-youtube-supabase-save-dry-run/` (+ tools mirror) |
| Build prefer-DB + JSON fallback | `site-cms-features.mjs` · `gosaki-home-youtube-embed.mjs` · convert/hooks threading |
| Admin dual path | default **Contents**; opt-in `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` |
| Sticky / dirty | existing multi-item UI retained; Supabase Save passes `expectedBeforeUpdatedAtById` |
| Verifier | `scripts/verify-cms-core-v2-youtube-supabase-vertical-slice.mjs` |

## Schema / authz (summary)

- Tables: `sites`, `site_members` (`owner`\|`editor`), `platform_admins` (`active`), `site_embeds`
- `site_embeds`: `site_id` + denormalized `site_slug`, `provider`, `legacy_item_id`, `source_url`, `embed_url`, `published`, `sort_order`, `created_by`, `updated_by`, `updated_at` trigger
- Authz helpers (final signatures — **no client uid args**):
  - `is_platform_admin()`
  - `is_site_member(p_site_id uuid)`
  - `can_write_site(p_site_id uuid)`
- Each helper: `SECURITY DEFINER`, `search_path = public`, schema-qualified refs, uses **`auth.uid()` only**
- Legacy `(uuid)` / `(uuid,uuid)` signatures are dropped in the migration draft
- EXECUTE: `REVOKE` from `PUBLIC` + `anon`; `GRANT EXECUTE` to `authenticated` only
- Dual defense: RLS + Edge allowlist / approval / arm / optimistic lock
- Save arm default **false**: client `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` · server `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED`
- Approvals: `G-cms-v2-youtube-supabase-items-dry-run` · `G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice` (**required for dry-run and save**)
- Edge: staging ref allowlist `kmjqppxjdnwwrtaeqjta` · production `vsbvndwuajjhnzpohghh` STOP · site_slug mismatch reject · `updated_by` from JWT only · lock `id`+`site_id`+`updated_at`
- **No `service_role`**

## Edge dual placement (sync policy)

| Role | Path |
| --- | --- |
| **Deploy SoT** | `supabase/functions/gosaki-youtube-supabase-save-dry-run/` |
| **Tools mirror** | `tools/static-to-astro/scripts/edge-functions/gosaki-youtube-supabase-save-dry-run/` |

Edit **deploy SoT first**, then copy to tools mirror in the same change. Do not diverge. Large layout refactors deferred.

## Dual-path behavior (cutover not done)

| Flag | Behavior |
| --- | --- |
| path env unset/false (default) | Existing Contents dry-run/Save endpoints + G-11c* approvals |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` | Live-read/dry-run/Save → `gosaki-youtube-supabase-save-dry-run` |
| `CMS_KIT_SITE_EMBEDS_BUILD_READ=true` | Convert prefers published `site_embeds`; empty/error → JSON file SoT |

`registry.supabaseFeatures.siteEmbeds` remains **false** until operator cutover.

## Operator next steps (human — not executed by Cursor)

Blocked until re-audit sets `readyForOperatorMigrationApply: true`.

1. **Preflight** staging project `kmjqppxjdnwwrtaeqjta` (STOP `vsbvndwuajjhnzpohghh`)
2. Apply migration template (explicit approval form)
3. Apply RLS template + GRANT/REVOKE (same or separate approval)
4. Seed `gosaki-piano` site + membership + youtube row
5. Deploy Edge from **deploy SoT** (staging only; arms false)
6. Local/STG package with path env + dry-run once
7. One armed Save round-trip → disarm
8. Cutover public read / drop Contents YouTube Save only after sign-off

## Rollback

| Step | Template | Scope |
| --- | --- | --- |
| 1 | (ops) | Disarm client/server arms; path env false → Contents/JSON |
| 2 | `cms-core-v2-gosaki-youtube-seed-rollback.template.sql` | Deletes **only** known seed row `yt-placeholder-01` + exact URL match — not arbitrary client rows |
| 3 | `cms-core-v2-site-embeds-rls-rollback.template.sql` | Drop policies + revoke table grants — **no data delete** |
| 4 | `cms-core-v2-tenancy-and-site-embeds-rollback.template.sql` | Drop helpers + Core tables — **last**; does not touch Schedule/Discography/About |

Do not run rollbacks without explicit approval. Do not use seed rollback as a generic wipe.

## Out of scope / not executed

DB write · migration apply · RLS/GRANT apply · Edge deploy · Secret change · Contents API write · FTP · production · Schedule/Discography/About edits · staging CLI against live project · commit/push
