# CMS Core v2 Phase 2 — YouTube Supabase Vertical Slice (local implementation)

- **Phase:** `cms-core-v2-youtube-supabase-vertical-slice-staging-save-round-trip-complete` (builds on `cms-core-v2-youtube-supabase-vertical-slice-local-implementation`)
- **Status:** cutover **stage 1 Admin staging Supabase path QA COMPLETE** · Save arm **false** · public JSON 未変更 · production **unchanged**
- **Date:** 2026-07-24
- **Staging project:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta`
- **STOP:** production `vsbvndwuajjhnzpohghh` — **unchanged / not touched**
- **ADR:** [cms-core-v2-minimal-architecture-decision.md](./cms-core-v2-minimal-architecture-decision.md)
- **Stage-1 package + FTP/QA:** [cms-core-v2-youtube-supabase-admin-path-package-prep.md](./cms-core-v2-youtube-supabase-admin-path-package-prep.md)

## Gates

```txt
cmsCoreV2YoutubeSupabaseVerticalSliceLocalImplemented: true
cmsCoreV2YoutubeSupabaseLocalSecurityHardeningComplete: true
cmsCoreV2YoutubeSupabaseReAuditPass: true
cmsCoreV2YoutubeSupabaseStagingMigrationPreflightComplete: true
cmsCoreV2YoutubeSupabaseSqlTemplateHardenComplete: true
cmsCoreV2YoutubeSupabaseFinalSqlHardenComplete: true
cmsCoreV2YoutubeSupabaseStagingDbApplyComplete: true
cmsCoreV2YoutubeSupabaseOwnerRemoteDryRunPass: true
cmsCoreV2YoutubeSupabaseBrowserDryRunComplete: true
cmsCoreV2YoutubeSupabaseSaveRoundTripPreflightComplete: true
cmsCoreV2YoutubeSupabaseStagingSaveRoundTripComplete: true
cmsCoreV2YoutubeSupabaseCutoverPlanningComplete: true
cmsCoreV2YoutubeSupabaseAdminPathPackagePrepared: true
cmsCoreV2YoutubeAdminStagingSupabasePathCutoverQaComplete: true
adminSupabasePathEnabledInPackage: true
adminStagingSupabasePathLive: true
publicSiteEmbedsBuildReadEnabled: false
readyForOperatorAdminPathFtpUpload: false
readyForOperatorMigrationApply: applied
operatorMigrationApplyCompleted: true
edgeDeployExecuted: true
dbMigrationExecuted: true
dbWriteExecuted: true
rlsApplied: true
seedExecuted: true
accessAssignmentExecuted: true
rollbackExecuted: false
browserRoundtripExecuted: true
browserDryRunComplete: true
actualSaveExecuted: true
restoreSaveExecuted: true
saveArmEnabled: false
liveDbSelectConfirmationPendingOperator: false
contentsApiPathUnchangedDefault: false
contentsYoutubeCutoverExecuted: false
ftpUploadExecuted: true
operatorManualFtpOnly: true
scheduleDiscographyAboutUnchanged: true
readyForAnyFutureFtpApply: false
```

`readyForOperatorMigrationApply: applied` — Core DDL/RLS/seed/access already applied.
Staging **admin** YouTube path is live on Supabase (manual FTP + browser QA). Public/build remains JSON. Contents Edges remain as rollback. Server Save arm is **false**.

## Admin staging Supabase path cutover QA (2026-07-24 · operator)

| Item | Result |
| --- | --- |
| FTP | human manual full `public-dist/` overwrite → `/cms-kit-staging/gosaki-piano/` |
| production | **unchanged** |
| `/admin/` · `/admin/youtube/` | OK |
| Owner login | OK |
| YouTube display | OK |
| Save button | **disabled** |
| No-change dry-run | `invokeError=null` · `ok=true` · `operation=dryRun` · `didWrite=false` · `dbWrite=false` · `noChange=true` · `changedItemIds=[]` |
| Public home YouTube | unchanged (JSON) |
| Other primary pages | OK |
| Save / Secret / SQL / Edge | **not executed** |

Detail: [cms-core-v2-youtube-supabase-admin-path-package-prep.md](./cms-core-v2-youtube-supabase-admin-path-package-prep.md).

## Staging Save round-trip result (2026-07-24 · operator)

| Step | Result |
| --- | --- |
| Project | `kmjqppxjdnwwrtaeqjta` |
| production `vsbvndwuajjhnzpohghh` | **unchanged** |
| Actor | **owner** (email/UUID not recorded) |
| Forward dry-run | **PASS** |
| Forward Save | **PASS** — `sort_order` 10→11 · `didWrite=true` · `dbWrite=true` · `rowsAffected=1` |
| Post-Save SELECT | **PASS** |
| Restore dry-run | **PASS** |
| Restore Save | **PASS** — `sort_order` 11→10 · `didWrite=true` · `dbWrite=true` · `rowsAffected=1` |
| Final SELECT | `row_count=1` · `sort_order=10` · `published=true` · `source_url` unchanged · `updated_at=2026-07-23 15:38:35.562674+00` |
| Save arm | returned **false** |
| Operator PAT | unset from shell |
| Contents path | **default maintained** (cutover not executed) |

**Next:** Contents→Supabase YouTube **cutover planning** below (execution not started). Do **not** re-arm Save without a new approval ID / plan.

## Contents → Supabase YouTube cutover planning (2026-07-24 · docs-only)

```txt
cmsCoreV2YoutubeSupabaseCutoverPlanningComplete: true
contentsYoutubeCutoverExecuted: false
recommendedCutoverMode: staged-admin-then-build
```

### Current SoT and routes (as implemented)

| Surface | Default today | Supabase opt-in | Fallback |
| --- | --- | --- | --- |
| Admin live-read / dry-run / Save | **GitHub Contents** Edges `gosaki-youtube-url-dry-run` / `gosaki-youtube-url-save` (G-11c*) | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` → same UI hits `gosaki-youtube-supabase-save-dry-run` | Unset path env → Contents again |
| Admin Save arm (Contents) | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` + server `GOSAKI_YOUTUBE_URL_SAVE_ARMED` | Supabase: `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` + server `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | Both default **false** |
| Public home embed (build/convert) | **JSON** `config/sites/gosaki-piano-youtube-embed.json` → baked `src/data/gosaki-youtube-embed.json` | `CMS_KIT_SITE_EMBEDS_BUILD_READ=true` **or** `registry.supabaseFeatures.siteEmbeds=true` → anon read `site_embeds` | Empty/error/blocked → **keep JSON** (no blank home) |
| Runtime public HTML | Static package only (no live Supabase on page) | Rebuild + upload after DB prefer | Re-upload package from JSON HEAD |

**Proven on staging:** Core DDL/RLS/seed/access · Edge deploy · owner dry-run · Save round-trip (sort_order poke) · arm returned false.

**Cutover stage 1 (live):** Admin Supabase path ON package prepared + **operator manual FTP + browser QA COMPLETE** — see [cms-core-v2-youtube-supabase-admin-path-package-prep.md](./cms-core-v2-youtube-supabase-admin-path-package-prep.md) · `sourceCommit` `8c3e79f` · public JSON SoT unchanged · Contents Edges remain in repo as rollback.

### Dual-path vs cutover

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Keep dual-path** (status quo) | Zero public risk · Contents remains operator-familiar | Two SoTs can drift (JSON/`main` vs `site_embeds`) | OK short-term |
| **Big-bang** (admin+build+registry same day) | One story | High blast radius · hard rollback if package+admin disagree | **Reject** for first cutover |
| **Staged cutover** (admin env → staging build prefer-DB → optional registry) | Reversible per layer · JSON/Contents stay as fallback | Multi-step approvals | **Recommended** |

### Recommended cutover mode: staged-admin-then-build

1. **Admin staging package only** — build/upload with `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` (Save arm **false**). Verify live-read + dry-run against Supabase; Contents Edges untouched.
2. **Public staging package** — convert/build with `CMS_KIT_SITE_EMBEDS_BUILD_READ=true` (registry `siteEmbeds` may stay **false**). Confirm home embed matches DB published rows; empty DB → JSON fallback still works.
3. **Optional lasting config** — set `registry.sites.gosaki-piano.supabaseFeatures.siteEmbeds=true` in a dedicated commit (after staging visual QA). Until then env-only prefer-DB is enough for experiments.
4. **Do not** disable Contents Edges or delete JSON until a later “retire Contents YouTube” phase (separate approval).
5. **Production** — out of scope until hosting cutover; never use production Supabase ref.

### Flags / env / config (no secrets in git)

| Knob | Role |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED` | Admin dry-run/Save/live-read → Supabase Edge |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | Client Save UI (Console invoke only needs server arm) |
| `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | Server Save arm (staging secret) — keep **false** except approved edits |
| `CMS_KIT_SITE_EMBEDS_BUILD_READ` | Convert prefers published `site_embeds` |
| `registry.supabaseFeatures.siteEmbeds` | Lasting feature gate (currently **false**) |
| Contents arms / Edges | Rollback path for admin writes to `main` JSON |

### Code / deploy targets for cutover execution (later · not this phase)

| Change | Needed? |
| --- | --- |
| New application code | **No** for staged env cutover (wiring exists) |
| Staging admin package rebuild + manual upload | **Yes** (path env true) |
| Staging public package rebuild + manual upload | **Yes** (build-read env true) |
| Edge redeploy | **No** (already deployed) unless code changes |
| DB / SQL / migration | **No** |
| FTP auto-apply | **No** (manual upload only; `readyForAnyFutureFtpApply: false`) |
| Contents API / workflow | **No** for Supabase path; keep as rollback |

### Staging verification checklist (before calling cutover “done”)

- [ ] Admin: path env on · Contents endpoints still reachable if env off
- [ ] Admin: login owner · live-read shows DB items · dry-run `didWrite=false`
- [ ] Admin: Save remains disabled unless separately armed
- [ ] Public: home embed URL/published match `site_embeds` when build-read on
- [ ] Public: force empty/error path → JSON fallback still renders (no blank section)
- [ ] production ref never in build env / Edge URL
- [ ] `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=false` after any test Save

### Rollback

| Layer | Action |
| --- | --- |
| Admin | Rebuild/upload with `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED` unset/false → Contents path |
| Public build | Rebuild **without** `CMS_KIT_SITE_EMBEDS_BUILD_READ` (and `siteEmbeds=false`) → JSON SoT |
| Registry | Revert `siteEmbeds: true` commit if used |
| Save arm | Ensure `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=false` |
| Data | DB rows remain; Contents JSON on `main` unchanged by Supabase Saves — no Contents restore required for sort_order-only tests |

### High-risk gates still required for execution

1. Explicit approval to rebuild/upload **admin** package with Supabase path env
2. Explicit approval to rebuild/upload **public** package with build-read env
3. Any Save during cutover QA → separate arm approval (same Save arm rules as Phase 2)
4. Registry `siteEmbeds=true` commit + push (only if lasting cutover chosen)
5. Later: retire Contents YouTube Edges / stop dual SoT (not in first cutover)

**This planning phase does not execute** rebuild, upload, arm, registry flip, or production work.

## Owner remote dry-run result (2026-07-24 · operator)

| Item | Result |
| --- | --- |
| Project | `kmjqppxjdnwwrtaeqjta` |
| Function | `gosaki-youtube-supabase-save-dry-run` |
| Actor | **owner** staging Auth user (email/UUID not recorded) |
| HTTP | **200** |
| `ok` | **true** |
| `operation` | `dryRun` |
| `didWrite` / `dbWrite` | **false** / **false** |
| `noChange` | **true** |
| `changedItemIds` | `[]` |
| `saveEnabled` | **false** |
| `invokeError` | **null** |
| production | **unchanged** |
| actual Save / arm / restore | **not executed** |

## Staging DB apply result (2026-07-23 · operator)

| Step | Result |
| --- | --- |
| migration | **PASS** |
| RLS / minimal GRANT | **PASS** |
| Gosaki content seed | **PASS** |
| access assignment | **PASS** |
| production `vsbvndwuajjhnzpohghh` | **unchanged** |
| Edge deploy | **executed** (prerequisite for dry-run PASS) |
| browser Save round-trip | **not executed** |
| rollback | **not executed** (not needed) |

**Row counts (staging, post-apply):** `sites=1` · `site_embeds=1` · `site_members=1` · `platform_admins=1`
**Access:** owner and platform_admin are **distinct** staging Auth users (emails/UUIDs **not** recorded in git).

## Save round-trip operator preflight (2026-07-24 · read-only · not executed)

### Why `sortOrder` 10 → 11 → 10

| Candidate | Risk | Verdict |
| --- | --- | --- |
| `embedCode` / URL change | Public JSON SoT + Contents path still default, but changes visible identity | avoid for first Save |
| `published` flip | Can hide embed from DB-prefer builds | avoid |
| **`sortOrder` only** | UPDATE-grant column; no URL/published change; single-item site → display order unchanged | **recommended** |

Public/staging **HTML package** uses Contents/JSON by default (`registry.siteEmbeds=false`, path env off) → this DB-only `sort_order` poke does **not** change public pages until cutover / `CMS_KIT_SITE_EMBEDS_BUILD_READ`. Admin Supabase live-read (if path enabled) would see sortOrder.

### Contract (Save)

| Field | Value |
| --- | --- |
| `operation` | `"save"` |
| `approvalId` | `G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice` |
| `siteSlug` | `"gosaki-piano"` |
| `fingerprint` | **exact** string from latest **dry-run** response (`fingerprint` of current DB before) |
| `expectedBeforeUpdatedAtById` | from dry-run; for `yt-placeholder-01` must match DB `updated_at` |
| `items[]` | intended after-state (e.g. sortOrder **11** then restore **10**) |
| Server arm | `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true` (Edge secret) |
| Client UI arm | not required for Console `functions.invoke` |
| Production | handler rejects URL containing `vsbvndwuajjhnzpohghh` |

Dry-run returns before any INSERT/UPDATE. Save writes only after arm + approval + fingerprint + per-id `updated_at` lock.

### Strict order (operator · one approval cycle)

1. **Pre-check (SELECT-only):** confirm `legacy_item_id=yt-placeholder-01` · `sort_order=10` · note `updated_at` (no emails/UUIDs in chat/git).
2. **Dry-run (baseline)** — noChange expected with sortOrder 10; capture `fingerprint` + `expectedBeforeUpdatedAtById`.
3. **Dry-run (delta)** — same body but `sortOrder: 11`; expect `noChange: false`, `changedItemIds: ["yt-placeholder-01"]`; reuse **baseline** fingerprint/lock from step 2 for Save (Save locks against **current DB before**, not after-items fingerprint).
4. **Arm ON** (CLI below) — staging ref only.
5. **Save once** — body uses step-2 fingerprint/lock + items with sortOrder **11**.
6. **DB confirm (SELECT-only):** `sort_order=11`; new `updated_at`.
7. **Restore dry-run** — items sortOrder **10**; capture **new** fingerprint/lock from this response.
8. **Restore Save once** — sortOrder **10** + step-7 fingerprint/lock.
9. **Final SELECT:** `sort_order=10`; URL/published unchanged.
10. **Arm OFF** immediately.

### Arm CLI (**do not run in this docs phase**)

```bash
# ON — staging only
supabase secrets set GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta

# OFF after round-trip (prefer explicit false)
supabase secrets set GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED=false --project-ref kmjqppxjdnwwrtaeqjta
```

STOP if `--project-ref` is not `kmjqppxjdnwwrtaeqjta` or equals production `vsbvndwuajjhnzpohghh`.

### Console scripts (owner logged-in admin · no token logging)

**A — dry-run helper** (returns summary; keep last dry-run payload in memory as `window.__ytSbLastDry`):

```js
(async () => {
  const client = window.__gosakiAdminSupabaseClient;
  if (!client) throw new Error("login first");
  const items = [{
    id: "yt-placeholder-01",
    published: true,
    sortOrder: 10, // change to 11 for delta dry-run / save-forward
    embedCode: "https://youtu.be/I-eY9YMq9GI",
  }];
  const { data, error } = await client.functions.invoke(
    "gosaki-youtube-supabase-save-dry-run",
    {
      body: {
        siteSlug: "gosaki-piano",
        operation: "dryRun",
        dryRun: true,
        approvalId: "G-cms-v2-youtube-supabase-items-dry-run",
        items,
      },
    },
  );
  window.__ytSbLastDry = { data, items };
  console.log({
    invokeError: error ? { message: error.message, status: error.context?.status } : null,
    ok: data?.ok,
    didWrite: data?.didWrite,
    noChange: data?.noChange,
    changedItemIds: data?.changedItemIds,
    hasFingerprint: Boolean(data?.fingerprint),
    lockKeys: data?.expectedBeforeUpdatedAtById
      ? Object.keys(data.expectedBeforeUpdatedAtById)
      : [],
  });
})();
```

**B — Save once** (only after arm ON · uses **prior dry-run before-lock**, not the delta dry-run’s afterItems as fingerprint source — fingerprint must be from dry-run against current DB):

```js
(async () => {
  const client = window.__gosakiAdminSupabaseClient;
  const dry = window.__ytSbLastDry?.data;
  if (!client || !dry?.fingerprint) throw new Error("run matching dry-run first");
  const items = [{
    id: "yt-placeholder-01",
    published: true,
    sortOrder: 11, // restore Save: use 10
    embedCode: "https://youtu.be/I-eY9YMq9GI",
  }];
  const { data, error } = await client.functions.invoke(
    "gosaki-youtube-supabase-save-dry-run",
    {
      body: {
        siteSlug: "gosaki-piano",
        operation: "save",
        dryRun: false,
        approvalId: "G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice",
        fingerprint: dry.fingerprint,
        expectedBeforeUpdatedAtById: dry.expectedBeforeUpdatedAtById,
        items,
      },
    },
  );
  console.log({
    invokeError: error ? { message: error.message, status: error.context?.status } : null,
    ok: data?.ok,
    didWrite: data?.didWrite,
    rowsAffected: data?.rowsAffected,
    error: data?.error,
  });
})();
```

**Lock rule:** Before each Save, run a fresh dry-run whose `items` reflect the **intended after-state** is OK for `changedItemIds`, but `fingerprint` / `expectedBeforeUpdatedAtById` must come from a dry-run computed against **current DB** (handler fingerprints `before` rows). Practical pattern: dry-run with intended items → if `ok` and `changedItemIds` correct, Save immediately with **that same response’s** `fingerprint` + `expectedBeforeUpdatedAtById` (they are before-state). Do not reuse an older dry-run after any write.

### Success / STOP

| Stage | Success | STOP |
| --- | --- | --- |
| Dry-run | `ok` · `didWrite:false` · correct `changedItemIds` | production ref · wrong approval · token printed |
| Arm ON | secret set on **staging** only | wrong `--project-ref` |
| Save | `ok` · `didWrite:true` · `rowsAffected:1` | `save_not_armed` · lock 409 · `didWrite` ambiguity |
| Restore | `sort_order=10` again · arm OFF | restore Save fails with arm still ON → see recovery |

### Restore failure recovery

1. **Stop** further Saves. Confirm arm state.
2. Fresh dry-run with intended restore items (`sortOrder: 10`); use **new** fingerprint/lock.
3. One restore Save. Re-SELECT.
4. If still stuck: approved **SELECT-only** then optional scoped SQL `UPDATE … SET sort_order=10 WHERE legacy_item_id='yt-placeholder-01' AND site_slug='gosaki-piano'` (separate approval — not this preflight). Prefer Edge restore Save over SQL.
5. Always **arm OFF** before leaving the session.

### High-risk ops still pending (human)

1. `secrets set` Save arm ON (staging)
2. Forward Save (`sortOrder` 11)
3. Restore Save (`sortOrder` 10)
4. Arm OFF

## What was implemented (local only)

| Area | Artifact |
| --- | --- |
| Tenancy + `site_embeds` DDL | `scripts/supabase/cms-core-v2-tenancy-and-site-embeds-migration.template.sql` |
| RLS + minimal GRANT/REVOKE | `scripts/supabase/cms-core-v2-site-embeds-rls.template.sql` |
| Gosaki content seed (site + youtube) | `scripts/supabase/cms-core-v2-gosaki-youtube-seed.template.sql` |
| Gosaki access assignment (owner / platform_admin placeholders) | `scripts/supabase/cms-core-v2-gosaki-access-assignment.template.sql` |
| Rollback templates | content seed / access / RLS / DDL (no `DROP TABLE CASCADE`) |
| Pure contract | `scripts/lib/cms-core-v2-youtube-supabase-contract.mjs` |
| Edge | `supabase/functions/gosaki-youtube-supabase-save-dry-run/` (+ tools mirror) — **staging deployed**; Save arm default false |

| Build prefer-DB + JSON fallback | `site-cms-features.mjs` · `gosaki-home-youtube-embed.mjs` · convert/hooks threading |
| Admin dual path | default **Contents**; opt-in `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` |
| Sticky / dirty | existing multi-item UI retained; Supabase Save passes `expectedBeforeUpdatedAtById` |
| Verifier | `scripts/verify-cms-core-v2-youtube-supabase-vertical-slice.mjs` |

## Schema / authz (summary)

- Tables: `sites`, `site_members` (`owner`\|`editor`), `platform_admins` (`active`), `site_embeds`
- `site_embeds`: composite FK `(site_id, site_slug) → sites(id, site_slug)` · **`ON DELETE RESTRICT`** · `ON UPDATE CASCADE`
- `site_members` → `sites`: **`ON DELETE CASCADE`** (unchanged)
- **`sites.status=suspended`:** ignored by Phase 2 DEFINER helpers; Edge Save path may still reject suspended (see ADR)
- Fail-closed privileges: migration ends with `REVOKE ALL` on Core 4 tables from `PUBLIC`/`anon`/`authenticated`; RLS template revokes again then re-GRANTs minimal privileges
- `site_embeds` write GRANTs are **column-level** (not table INSERT/UPDATE):
  - INSERT: `site_id`, `site_slug`, `provider`, `legacy_item_id`, `title`, `source_url`, `embed_url`, `published`, `sort_order`
  - UPDATE: `title`, `source_url`, `embed_url`, `published`, `sort_order`
  - Client cannot UPDATE identity/audit columns (`id`, `site_id`, `site_slug`, `provider`, `legacy_item_id`, `created_at`, `created_by`, `updated_at`, `updated_by`)
  - `created_by` / `updated_by` set only by `tg_site_embeds_set_audit_actors` from `auth.uid()`; `updated_at` via existing trigger; FK to `auth.users` is **`ON DELETE SET NULL`**
- Access assignment is **separate** from YouTube content seed — **first-time fail-closed** (STOP on unreplaced placeholders, missing site/Auth user, same UUID pair, existing target rows); no `ON CONFLICT` / upsert
- Access rollback deletes **only** the exact assignment-created rows; STOP if placeholders unreplaced or targets missing
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
- Edge: staging ref allowlist `kmjqppxjdnwwrtaeqjta` · production `vsbvndwuajjhnzpohghh` STOP · site_slug mismatch reject · Save payload omits `created_by`/`updated_by`/`site_slug` on update · lock `id`+`site_id`+`updated_at`
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

## Staging migration preflight (2026-07-22 · read-only)

### Git / project lock

| Item | Value |
| --- | --- |
| Baseline commit | `338428d7228e802cf4521d395db05c9a5f63fbf3` |
| Working tree at preflight authoring | clean @ `338428d` / `main` |
| Staging project ref | `kmjqppxjdnwwrtaeqjta` |
| Production ref | `vsbvndwuajjhnzpohghh` — **STOP** (do not open SQL Editor there) |
| Cursor DB / apply | **none** this phase — operator runs SELECT only |

### Apply order (fixed — do not reorder)

| # | File | Purpose |
| --- | --- | --- |
| 1 | `scripts/supabase/cms-core-v2-tenancy-and-site-embeds-migration.template.sql` | DDL + DEFINER helpers + EXECUTE GRANT/REVOKE + fail-closed table `REVOKE ALL` + `site_embeds` trigger |
| 2 | `scripts/supabase/cms-core-v2-site-embeds-rls.template.sql` | RLS policies + fail-closed `REVOKE ALL` then minimal table GRANT |
| 3 | `scripts/supabase/cms-core-v2-gosaki-youtube-seed.template.sql` | `gosaki-piano` **site + YouTube content** only |
| 4 | `scripts/supabase/cms-core-v2-gosaki-access-assignment.template.sql` | owner / platform_admin (**replace UUID placeholders locally**; never commit real ids) |

Dependencies: RLS assumes tables + `can_write_site` exist. Content seed assumes `sites` / `site_embeds` (+ composite FK). Access assignment assumes `sites.gosaki-piano` exists.

### Rollback order (fixed — reverse of apply; explicit approval each step)

| # | File | Scope |
| --- | --- | --- |
| 1 | (ops) | Disarm client/server Save arms; keep Contents path default |
| 2 | `cms-core-v2-gosaki-access-assignment-rollback.template.sql` | DELETE **only** placeholder-targeted owner / platform_admin rows |
| 3 | `cms-core-v2-gosaki-youtube-seed-rollback.template.sql` | DELETE **only** `yt-placeholder-01` + exact URLs — not arbitrary client rows; does **not** remove `sites` |
| 4 | `cms-core-v2-site-embeds-rls-rollback.template.sql` | Drop policies + revoke table grants — **no row delete** |
| 5 | `cms-core-v2-tenancy-and-site-embeds-rollback.template.sql` | Fail-closed DDL drop (**no `CASCADE`**); aborts if unexpected FKs reference Core tables |

**When to roll back:** wrong project, failed mid-apply, incompatible pre-existing objects, or operator abort. If outcome unclear → stop, do not retry, ask human (AGENTS destructive failure rule).

### SQL template safety scan (local @ `338428d`)

| Check | Result |
| --- | --- |
| Staging ref on all 6 templates | present |
| Production ref only as STOP comment | yes — no production DSN/apply target |
| Unconditional `DELETE` / `TRUNCATE` in apply path | **none** (content seed upsert; access uses placeholder UUIDs; scoped DELETEs only in rollbacks) |
| `DROP TABLE … CASCADE` in DDL rollback | **removed** — fail-closed on unexpected dependents |
| `site_embeds` site delete | **`ON DELETE RESTRICT`** (not CASCADE) |
| `service_role` grant/use | **none** |
| Migration re-run | `CREATE TABLE IF NOT EXISTS` + `CREATE OR REPLACE` helpers + `DROP FUNCTION IF EXISTS` legacy — generally idempotent (**first staging apply expected empty**) |
| Content seed re-run | `ON CONFLICT` upsert for site + embed — safe overwrite of **this** seed key only |

### Values the human must fill before access assignment

Access is **not** in the YouTube content seed. Use `cms-core-v2-gosaki-access-assignment.template.sql` (**first-time only**, fail-closed).

| Placeholder (in template) | Replace with | Notes |
| --- | --- | --- |
| `00000000-0000-4000-8000-000000000001` | staging Auth UUID for site **owner** | Must exist in `auth.users` |
| `00000000-0000-4000-8000-000000000002` | staging Auth UUID for **platform_admin** | **Must differ** from owner UUID (template STOPs if equal) |

Lookup: Dashboard → Authentication → Users, or SELECT in preflight block H. **Do not commit** email or real UUID. Edit a local working copy only.

Assignment STOPs (whole transaction) if: placeholders unreplaced · `gosaki-piano` site missing · Auth user missing · owner==admin UUID · target `site_members` / `platform_admins` row already exists. No `ON CONFLICT` / upsert.

Rollback (`…-access-assignment-rollback.template.sql`): deletes **only** those two assignment-created rows for the same UUIDs; STOPs if placeholders unreplaced or targets missing / wrong delete counts.

### Template safety note (2026-07-22 SQL harden)

Before first staging apply: fail-closed Core table `REVOKE ALL` · composite FK · `ON DELETE RESTRICT` · column-level `site_embeds` GRANTs + audit trigger · fail-closed DDL/access · content/access split. `readyForOperatorMigrationApply` remains **false**.
### Seed YouTube row (expected / conflict)

| Field | Expected (JSON SoT `gosaki-piano-youtube-embed.json`) |
| --- | --- |
| `legacy_item_id` | `yt-placeholder-01` |
| `source_url` | `https://youtu.be/I-eY9YMq9GI` |
| `embed_url` | `https://www.youtube-nocookie.com/embed/I-eY9YMq9GI` |
| `published` | `true` |
| `sort_order` | `10` |

**Duplicate behavior:** unique `(site_id, provider, legacy_item_id)` → seed `ON CONFLICT DO UPDATE` refreshes URLs/published/sort. If a row exists with same key but **different** URLs, upsert **overwrites** to SoT values — confirm with SELECT first. Other `legacy_item_id` rows are untouched.

### Success conditions (after future apply — not this phase)

1. Dashboard project ref = `kmjqppxjdnwwrtaeqjta` only.
2. Tables `sites`, `site_members`, `platform_admins`, `site_embeds` exist.
3. Functions exactly: `is_platform_admin()`, `is_site_member(uuid)`, `can_write_site(uuid)` — no legacy `(uuid)` / `(uuid,uuid)` uid-arg variants.
4. RLS enabled; policies from RLS template present; no DELETE privilege on `site_embeds` for anon/authenticated.
5. Row `gosaki-piano` in `sites`; membership row for filled owner UUID; optional `platform_admins.active=true`.
6. Embed row `yt-placeholder-01` matches SoT URLs above.
7. Contents YouTube path still default; Supabase path/Save arms still **false**.
8. Edge still **undeployed** until a separate deploy preflight.

### STOP conditions (abort apply / do not continue)

- SQL Editor / CLI project is **not** `kmjqppxjdnwwrtaeqjta`
- Any touch of production `vsbvndwuajjhnzpohghh`
- `service_role` key offered or required
- SELECT shows incompatible existing Core v2 objects (wrong columns/signatures) and operator cannot reconcile
- Unclear mid-apply error / hang → stop, no retry, no cleanup without new approval
- Approval form missing (vague “OK” insufficient)
- Attempt to run rollback as “cleanup” without explicit rollback approval

### Operator SELECT-only preflight SQL (1 paste · staging SQL Editor)

**Run this first.** Do **not** run migration / RLS / seed / rollback in the same session until results are reviewed and a separate apply approval is recorded.

```sql
-- =============================================================================
-- CMS Core v2 Phase 2 — SELECT-ONLY staging preflight
-- Project MUST be: kmjqppxjdnwwrtaeqjta
-- STOP: vsbvndwuajjhnzpohghh (do not run this there)
-- No INSERT/UPDATE/DELETE/DDL. Paste once in Supabase SQL Editor.
-- Replace :admin_email below before section H (Auth lookup).
-- =============================================================================

-- A) Core tables present?
select
  c.relname as table_name,
  c.relkind,
  obj_description(c.oid, 'pg_class') as comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('sites', 'site_members', 'platform_admins', 'site_embeds')
order by 1;

-- B) Authz helper signatures (expect empty before first apply; after apply: 3 rows, no uid-arg variants)
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as definition_preview
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_platform_admin', 'is_site_member', 'can_write_site')
order by 1, 2;

-- C) Legacy / unsafe signatures still present? (expect 0 rows always after safe apply)
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    (p.proname = 'is_platform_admin' and pg_get_function_identity_arguments(p.oid) = 'uuid')
    or (p.proname = 'is_site_member' and pg_get_function_identity_arguments(p.oid) = 'uuid, uuid')
    or (p.proname = 'can_write_site' and pg_get_function_identity_arguments(p.oid) = 'uuid, uuid')
  );

-- D) site_embeds trigger
select t.tgname, p.proname as function_name, t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and c.relname = 'site_embeds'
  and not t.tgisinternal;

-- E) RLS enabled?
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('sites', 'site_members', 'platform_admins', 'site_embeds')
order by 1;

-- F) Policies on Core tables
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('sites', 'site_members', 'platform_admins', 'site_embeds')
order by tablename, policyname;

-- G) Table privileges (anon / authenticated / public)
select
  grantee,
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('sites', 'site_members', 'platform_admins', 'site_embeds')
  and grantee in ('anon', 'authenticated', 'PUBLIC', 'public')
group by grantee, table_name
order by table_name, grantee;

-- H) Auth user lookup for seed membership (EDIT email; do not commit result)
-- select id, email, created_at
-- from auth.users
-- where email = ':admin_email'
-- limit 5;

-- I) Catalog presence map (safe when tables missing — no row scan yet)
select t.table_name,
  (to_regclass('public.' || t.table_name) is not null) as exists_now
from (values
  ('sites'),
  ('site_members'),
  ('platform_admins'),
  ('site_embeds')
) as t(table_name)
order by 1;

-- J) Row probes — uncomment ONLY after A/I show the table exists
-- select * from public.sites where site_slug = 'gosaki-piano';
-- select sm.* from public.site_members sm
--   join public.sites s on s.id = sm.site_id where s.site_slug = 'gosaki-piano';
-- select * from public.platform_admins;
-- select id, site_slug, provider, legacy_item_id, source_url, embed_url, published, sort_order, updated_at
-- from public.site_embeds
-- where site_slug = 'gosaki-piano' and provider = 'youtube';
-- select id, legacy_item_id, source_url, embed_url, published, sort_order, updated_at
-- from public.site_embeds
-- where site_slug = 'gosaki-piano'
--   and provider = 'youtube'
--   and legacy_item_id = 'yt-placeholder-01';
```

**How to interpret (before first apply):**

| Section | Prefer |
| --- | --- |
| A / I | tables absent (`exists_now = false`) **or** compatible existing Core v2 tables |
| B | 0 rows **or** exactly the 3 safe signatures |
| C | **0 rows** (no legacy uid-arg signatures) |
| D–G | empty OK before apply |
| H | exactly one Auth user for the staging admin email |
| J (after tables exist) | no `gosaki-piano` / seed row **or** same SoT URLs |

If tables already exist with divergent schema → **STOP** and reconcile before apply.

### Operator next steps after SELECT review

> **Historical (pre-apply).** Staging DB apply completed 2026-07-23 — see top gates. Do not re-apply first-time access assignment.

1. Paste SELECT results into the apply chat (redact email if needed; UUID OK).
2. Proceed only with AGENTS approval form when SELECT is compatible **and** membership UUIDs are ready (`readyForOperatorMigrationApply` is now **`applied`**).
3. Apply with AGENTS approval form, **one template at a time**, same order as above.
4. Edge deploy / Save round-trip = **later** phases (arms stay false).

## Rollback (summary)

| Step | Template | Scope |
| --- | --- | --- |
| 1 | (ops) | Disarm client/server arms; path env false → Contents/JSON |
| 2 | `cms-core-v2-gosaki-access-assignment-rollback.template.sql` | Placeholder-targeted owner / platform_admin only |
| 3 | `cms-core-v2-gosaki-youtube-seed-rollback.template.sql` | Deletes **only** known seed row `yt-placeholder-01` + exact URL match |
| 4 | `cms-core-v2-site-embeds-rls-rollback.template.sql` | Drop policies + revoke table grants — **no data delete** |
| 5 | `cms-core-v2-tenancy-and-site-embeds-rollback.template.sql` | Fail-closed drop helpers + Core tables — **no CASCADE**; unexpected FKs → STOP |

Do not run rollbacks without explicit approval. Do not use seed/access rollback as a generic wipe.

## Out of scope / not executed (this preflight)

DB write · migration apply · RLS/GRANT apply · seed · rollback · Edge deploy · Secret change · Contents API write · FTP · production · Schedule/Discography/About edits · live staging CLI mutation · commit/push · flipping `readyForOperatorMigrationApply` to true
