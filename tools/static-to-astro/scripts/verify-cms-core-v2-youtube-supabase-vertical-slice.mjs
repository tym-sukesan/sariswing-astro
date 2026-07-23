/**
 * CMS Core v2 Phase 2 — YouTube Supabase vertical slice local verifier.
 * Static checks only — no DB / Edge deploy / staging CLI / Contents write.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-youtube-supabase-vertical-slice.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CMS_CORE_V2_YOUTUBE_PHASE,
  GOSAKI_YOUTUBE_SITE_SLUG,
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
  YOUTUBE_SUPABASE_DRY_RUN_APPROVAL_ID,
  YOUTUBE_SUPABASE_ENDPOINT_NAME,
  YOUTUBE_SUPABASE_PATH_ENABLED_ENV,
  YOUTUBE_SUPABASE_SAVE_APPROVAL_ID,
  YOUTUBE_SUPABASE_SAVE_ARMED_ENV,
  YOUTUBE_SUPABASE_SAVE_UI_ARMED_ENV,
  buildYoutubeNocookieEmbedUrl,
  mapSiteEmbedRowsToYoutubeConfig,
  parseYoutubeVideoId,
  planYoutubeSupabaseItemsDryRun,
} from "./lib/cms-core-v2-youtube-supabase-contract.mjs";
import { loadSiteEmbedsDataForBuild } from "./lib/site-cms-features.mjs";
import { GOSAKI_SITE_KEY, TOOL_ROOT } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

assert("phase id", CMS_CORE_V2_YOUTUBE_PHASE.includes("youtube-supabase"));
assert("staging ref", STAGING_PROJECT_REF === "kmjqppxjdnwwrtaeqjta");
assert("production stop", PRODUCTION_REF_STOP === "vsbvndwuajjhnzpohghh");

const sqlFiles = [
  "tools/static-to-astro/scripts/supabase/cms-core-v2-tenancy-and-site-embeds-migration.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-embeds-rls.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-youtube-seed.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-access-assignment.template.sql",
];
for (const rel of sqlFiles) {
  assert(`sql exists ${path.basename(rel)}`, exists(rel));
  const sql = read(rel);
  assert(`${path.basename(rel)} DO NOT EXECUTE banner`, /DO NOT EXECUTE/i.test(sql));
  assert(`${path.basename(rel)} staging ref`, sql.includes(STAGING_PROJECT_REF));
  assert(`${path.basename(rel)} production STOP`, sql.includes(PRODUCTION_REF_STOP));
}

const migration = read(sqlFiles[0]);
assert("sites table", migration.includes("create table if not exists public.sites"));
assert("site_members table", migration.includes("create table if not exists public.site_members"));
assert("platform_admins table", migration.includes("create table if not exists public.platform_admins"));
assert("site_embeds table", migration.includes("create table if not exists public.site_embeds"));
assert("created_by column", migration.includes("created_by"));
assert("updated_by column", migration.includes("updated_by"));
assert(
  "created_by on delete set null",
  /created_by uuid references auth\.users \(id\) on delete set null/i.test(migration),
);
assert(
  "updated_by on delete set null",
  /updated_by uuid references auth\.users \(id\) on delete set null/i.test(migration),
);
assert("can_write_site helper", migration.includes("can_write_site"));
assert(
  "safe is_platform_admin() signature",
  /create or replace function public\.is_platform_admin\(\)/.test(migration),
);
assert(
  "safe is_site_member(p_site_id) signature",
  /create or replace function public\.is_site_member\(p_site_id uuid\)/.test(migration),
);
assert(
  "safe can_write_site(p_site_id) signature",
  /create or replace function public\.can_write_site\(p_site_id uuid\)/.test(migration),
);
assert(
  "no client uid arg on is_platform_admin create",
  !/create or replace function public\.is_platform_admin\(uid/.test(migration),
);
assert(
  "no client uid arg on is_site_member create",
  !/create or replace function public\.is_site_member\(\s*p_site_id uuid,\s*uid/.test(migration),
);
assert(
  "no client uid arg on can_write_site create",
  !/create or replace function public\.can_write_site\(\s*p_site_id uuid,\s*uid/.test(migration),
);
assert("drop legacy is_platform_admin(uuid)", migration.includes("drop function if exists public.is_platform_admin(uuid)"));
assert("drop legacy is_site_member(uuid, uuid)", migration.includes("drop function if exists public.is_site_member(uuid, uuid)"));
assert("drop legacy can_write_site(uuid, uuid)", migration.includes("drop function if exists public.can_write_site(uuid, uuid)"));
assert("DEFINER uses auth.uid()", migration.includes("auth.uid()"));
assert("search_path public", migration.includes("set search_path = public"));
assert("revoke execute public is_platform_admin", /revoke all on function public\.is_platform_admin\(\) from public/i.test(migration));
assert("revoke execute anon is_platform_admin", /revoke all on function public\.is_platform_admin\(\) from anon/i.test(migration));
assert("revoke execute public can_write_site", /revoke all on function public\.can_write_site\(uuid\) from public/i.test(migration));
assert("revoke execute anon can_write_site", /revoke all on function public\.can_write_site\(uuid\) from anon/i.test(migration));
assert("grant execute authenticated can_write_site", /grant execute on function public\.can_write_site\(uuid\) to authenticated/i.test(migration));
assert("migration composite sites unique", migration.includes("sites_id_site_slug_key"));
assert("migration composite FK", migration.includes("site_embeds_site_id_slug_fkey"));
assert("migration site_embeds on delete restrict", /site_embeds_site_id_slug_fkey[\s\S]*?on delete restrict/i.test(migration));
assert(
  "migration no site_embeds fkey cascade",
  /foreign key \(site_id, site_slug\)\s+references public\.sites \(id, site_slug\)\s+on delete restrict/i.test(migration),
);
assert("migration site_members on delete cascade", /create table if not exists public\.site_members \([\s\S]*?on delete cascade/i.test(migration));
assert("migration revoke all authenticated sites", /revoke all on table public\.sites from authenticated/i.test(migration));
assert("migration revoke all authenticated site_embeds", /revoke all on table public\.site_embeds from authenticated/i.test(migration));
assert("migration notes suspended ignored", /status.*suspended/i.test(migration) && /Ignores sites\.status|ignore this column|NOT checked here/i.test(migration));
assert("migration audit actors trigger", migration.includes("tg_site_embeds_set_audit_actors"));
assert("migration audit actors auth.uid", /tg_site_embeds_set_audit_actors[\s\S]*auth\.uid\(\)/.test(migration));
assert("migration updated_at trigger retained", migration.includes("tg_site_embeds_set_updated_at"));

const rls = read(sqlFiles[1]);
assert("RLS enable site_embeds", rls.includes("alter table public.site_embeds enable row level security"));
assert("published select policy", rls.includes("site_embeds_public_select_published"));
assert("admin update policy", rls.includes("site_embeds_admin_update"));
assert("RLS uses can_write_site(site_id) no uid", rls.includes("can_write_site(site_id)"));
assert("RLS no can_write_site(site_id, auth.uid())", !rls.includes("can_write_site(site_id, auth.uid())"));
assert("RLS revoke all authenticated sites", /revoke all on table public\.sites from authenticated/i.test(rls));
assert("RLS revoke all authenticated site_embeds", /revoke all on table public\.site_embeds from authenticated/i.test(rls));
assert("table revoke anon site_embeds", /revoke all on table public\.site_embeds from anon/i.test(rls));
assert("table grant select anon site_embeds", /grant select on table public\.site_embeds to anon/i.test(rls));
assert("table grant select authenticated site_embeds", /grant select on table public\.site_embeds to authenticated/i.test(rls));
assert(
  "column grant insert site_embeds",
  /grant insert\s*\(\s*site_id[\s\S]*?sort_order\s*\)\s*on table public\.site_embeds to authenticated/i.test(rls),
);
assert(
  "column grant update site_embeds",
  /grant update\s*\(\s*title[\s\S]*?sort_order\s*\)\s*on table public\.site_embeds to authenticated/i.test(rls),
);
assert(
  "no table-level insert/update grant site_embeds",
  !/grant select,\s*insert,\s*update on table public\.site_embeds to authenticated/i.test(rls),
);
assert("update grant omits site_id", !/grant update\s*\([^)]*site_id/i.test(rls));
assert("update grant omits updated_by", !/grant update\s*\([^)]*updated_by/i.test(rls));
assert("insert grant omits created_by", !/grant insert\s*\([^)]*created_by/i.test(rls));
const rlsNoComments = rls.replace(/--[^\n]*/g, "");
assert("no service_role grant", !/\bgrant\b[\s\S]*?\bto\s+service_role\b/i.test(rlsNoComments));

const contentSeed = read(sqlFiles[2]);
assert("content seed has youtube row", contentSeed.includes("yt-placeholder-01"));
assert("content seed no site_members insert", !/insert into public\.site_members/i.test(contentSeed));
assert("content seed no platform_admins insert", !/insert into public\.platform_admins/i.test(contentSeed));
assert("content seed uses sites.site_slug for embed", contentSeed.includes("s.site_slug"));

const accessSeed = read(sqlFiles[3]);
assert("access assignment has site_members", /insert into public\.site_members/i.test(accessSeed));
assert("access assignment has platform_admins", /insert into public\.platform_admins/i.test(accessSeed));
assert("access assignment placeholder owner uuid", accessSeed.includes("00000000-0000-4000-8000-000000000001"));
assert("access assignment placeholder admin uuid", accessSeed.includes("00000000-0000-4000-8000-000000000002"));
assert("access assignment never commits real email", !/@/.test(accessSeed.replace(/--[^\n]*/g, "")));
assert("access assignment fail-closed placeholder", /placeholders not replaced/i.test(accessSeed));
assert("access assignment fail-closed site missing", /sites row missing/i.test(accessSeed));
assert("access assignment fail-closed auth missing", /Auth user not found/i.test(accessSeed));
assert("access assignment fail-closed same uuid", /must be distinct UUIDs/i.test(accessSeed));
assert("access assignment fail-closed existing member", /site_members row already exists/i.test(accessSeed));
assert("access assignment fail-closed existing admin", /platform_admins row already exists/i.test(accessSeed));
assert("access assignment no on conflict upsert", !/on conflict\s*\(/i.test(accessSeed.replace(/--[^\n]*/g, "")));

const rollbackFiles = [
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-youtube-seed-rollback.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-access-assignment-rollback.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-embeds-rls-rollback.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-tenancy-and-site-embeds-rollback.template.sql",
];
for (const rel of rollbackFiles) {
  assert(`rollback exists ${path.basename(rel)}`, exists(rel));
  const sql = read(rel);
  assert(`${path.basename(rel)} DO NOT EXECUTE`, /DO NOT EXECUTE/i.test(sql));
  assert(`${path.basename(rel)} staging ref`, sql.includes(STAGING_PROJECT_REF));
}
assert(
  "seed rollback scoped to yt-placeholder-01",
  read(rollbackFiles[0]).includes("legacy_item_id = 'yt-placeholder-01'"),
);
assert(
  "access rollback scoped placeholders",
  read(rollbackFiles[1]).includes("00000000-0000-4000-8000-000000000001"),
);
assert("access rollback stop unreplaced", /placeholders not replaced/i.test(read(rollbackFiles[1])));
assert("access rollback premise assignment rows", /first-time run|exact rows created/i.test(read(rollbackFiles[1])));
assert("access rollback stop missing target", /target site_members owner row not found/i.test(read(rollbackFiles[1])));
assert("access rollback no on conflict", !/on conflict/i.test(read(rollbackFiles[1])));
const ddlRollback = read(rollbackFiles[3]);
assert("ddl rollback no drop table cascade", !/drop table if exists public\.\w+\s+cascade/i.test(ddlRollback));
assert("ddl rollback unexpected FK stop", /unexpected FKs reference Core v2 tables/i.test(ddlRollback));
assert("ddl rollback drops audit trigger", ddlRollback.includes("drop trigger if exists site_embeds_set_audit_actors"));
assert("ddl rollback drops audit function", ddlRollback.includes("drop function if exists public.tg_site_embeds_set_audit_actors()"));

assert(
  "edge handler exists",
  exists("supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts"),
);
assert(
  "edge index exists",
  exists("supabase/functions/gosaki-youtube-supabase-save-dry-run/index.ts"),
);
assert(
  "tools edge mirror exists",
  exists(
    "tools/static-to-astro/scripts/edge-functions/gosaki-youtube-supabase-save-dry-run/handler.ts",
  ),
);

const handler = read("supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts");
assert("handler no service_role client", !/createClient\([^)]*SERVICE_ROLE/i.test(handler));
assert("handler SUPABASE_SERVICE_ROLE_CONNECTED false", handler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("handler expectedBeforeUpdatedAt", handler.includes("expectedBeforeUpdatedAtById"));
assert("handler membership rpc", handler.includes("can_write_site"));
assert("handler save arm env", handler.includes(YOUTUBE_SUPABASE_SAVE_ARMED_ENV));
assert("handler approval save", handler.includes(YOUTUBE_SUPABASE_SAVE_APPROVAL_ID));
assert("handler approval dry-run", handler.includes(YOUTUBE_SUPABASE_DRY_RUN_APPROVAL_ID));
assert("handler production stop", handler.includes(PRODUCTION_REF_STOP));
assert("handler staging ref allowlist", handler.includes("staging_ref_required"));
assert("handler staging ref constant", handler.includes(STAGING_PROJECT_REF));
assert("handler site_slug_mismatch", handler.includes("site_slug_mismatch"));
assert("handler dry-run approval required", handler.includes("dry-run requires exact approvalId"));
assert("handler lock eq site_id", handler.includes('.eq("site_id", siteRow.id)'));
assert("handler lock eq updated_at", handler.includes('.eq("updated_at", prev.updatedAt)'));
assert("handler omits client updated_by", !handler.includes("updated_by: auth.user.id"));
assert("handler omits client created_by", !handler.includes("created_by: auth.user.id"));
assert("handler documents audit trigger", handler.includes("tg_site_embeds_set_audit_actors") || handler.includes("auth.uid()"));
const updatePayload = handler.match(/\.from\("site_embeds"\)\s*\.update\(\{([\s\S]*?)\}\)/);
assert(
  "handler update omits site_slug payload",
  Boolean(updatePayload) &&
    !/site_slug\s*:/.test(String(updatePayload?.[1] ?? "").replace(/\/\/[^\n]*/g, "")),
);
assert(
  "handler mirror in sync",
  handler ===
    read(
      "tools/static-to-astro/scripts/edge-functions/gosaki-youtube-supabase-save-dry-run/handler.ts",
    ),
);

const videoId = parseYoutubeVideoId("https://youtu.be/I-eY9YMq9GI");
assert("parse video id", videoId === "I-eY9YMq9GI");
assert(
  "nocookie url",
  buildYoutubeNocookieEmbedUrl(videoId) ===
    "https://www.youtube-nocookie.com/embed/I-eY9YMq9GI",
);

const mapped = mapSiteEmbedRowsToYoutubeConfig(
  [
    {
      provider: "youtube",
      legacy_item_id: "yt-placeholder-01",
      published: true,
      sort_order: 10,
      source_url: "https://youtu.be/I-eY9YMq9GI",
      embed_url: "https://www.youtube-nocookie.com/embed/I-eY9YMq9GI",
    },
  ],
  { siteSlug: GOSAKI_YOUTUBE_SITE_SLUG },
);
assert("map config siteSlug", mapped.siteSlug === "gosaki-piano");
assert("map config item id", mapped.items[0]?.id === "yt-placeholder-01");

const plan = planYoutubeSupabaseItemsDryRun({
  before: [
    {
      id: "yt-placeholder-01",
      published: true,
      sortOrder: 10,
      embedCode: "https://youtu.be/I-eY9YMq9GI",
      updatedAt: "2026-07-20T00:00:00.000Z",
    },
  ],
  after: [
    {
      id: "yt-placeholder-01",
      published: true,
      sortOrder: 10,
      embedCode: "https://youtu.be/I-eY9YMq9GI",
    },
  ],
});
assert("dry-run plan ok", plan.ok === true);
assert("dry-run noChange", plan.noChange === true);
assert("dry-run didWrite false", plan.didWrite === false);
assert(
  "dry-run lock map",
  plan.expectedBeforeUpdatedAtById["yt-placeholder-01"] === "2026-07-20T00:00:00.000Z",
);

const embedsDisabled = await loadSiteEmbedsDataForBuild({
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
  env: {},
});
assert("embeds null by default", embedsDisabled === null);

const adminTs = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
assert("admin path env", adminTs.includes(YOUTUBE_SUPABASE_PATH_ENABLED_ENV));
assert("admin save arm env", adminTs.includes(YOUTUBE_SUPABASE_SAVE_UI_ARMED_ENV));
assert("admin supabase builders", adminTs.includes("buildYoutubeSupabaseItemsDryRunEndpointRequest"));
assert("admin contents endpoints retained", adminTs.includes("gosaki-youtube-url-dry-run"));

const pageAstro = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
);
assert("page default contents unless flag", pageAstro.includes('youtubeSupabasePathEnabled ? "supabase" : "contents"'));
assert("page keeps resolveG11c4aDryRunEndpoint", pageAstro.includes("resolveG11c4aDryRunEndpoint"));

const multiEdit = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-youtube-multi-operational-edit.ts",
);
assert("multi sticky success message import", multiEdit.includes("GOSAKI_SAVE_SUCCESS_USER_MESSAGE"));
assert("multi dirty helper", multiEdit.includes("isYoutubeDraftDirty"));
assert("multi lock passthrough", multiEdit.includes("expectedBeforeUpdatedAtById"));

const homeEmbed = read("tools/static-to-astro/scripts/lib/gosaki-home-youtube-embed.mjs");
assert("home embed prefers supabase bundle", homeEmbed.includes("embedDataSource === \"supabase\""));
assert("home embed JSON fallback path", homeEmbed.includes("loadGosakiYoutubeEmbedConfig"));

const docRel = "tools/static-to-astro/docs/cms-core-v2-youtube-supabase-vertical-slice.md";
assert("phase doc exists", exists(docRel));
const doc = read(docRel);
assert("doc phase", doc.includes(CMS_CORE_V2_YOUTUBE_PHASE));
assert("doc endpoint", doc.includes(YOUTUBE_SUPABASE_ENDPOINT_NAME));
assert("doc no Contents break", doc.includes("Contents"));
assert("doc readyForOperatorMigrationApply applied", /readyForOperatorMigrationApply:\s*applied/.test(doc));
assert("doc staging db apply complete", doc.includes("cmsCoreV2YoutubeSupabaseStagingDbApplyComplete: true"));
assert("doc dbMigrationExecuted true", /dbMigrationExecuted:\s*true/.test(doc));
assert("doc edge deploy executed", /edgeDeployExecuted:\s*true/.test(doc));
assert("doc owner remote dry-run pass", doc.includes("cmsCoreV2YoutubeSupabaseOwnerRemoteDryRunPass: true"));
assert("doc browser dry-run complete", /browserDryRunComplete:\s*true/.test(doc));
assert("doc save round-trip preflight", doc.includes("cmsCoreV2YoutubeSupabaseSaveRoundTripPreflightComplete: true"));
assert("doc staging save round-trip complete", doc.includes("cmsCoreV2YoutubeSupabaseStagingSaveRoundTripComplete: true"));
assert("doc browser roundtrip executed", /browserRoundtripExecuted:\s*true/.test(doc));
assert("doc actual save true", /actualSaveExecuted:\s*true/.test(doc));
assert("doc restore save true", /restoreSaveExecuted:\s*true/.test(doc));
assert("doc save arm false", /saveArmEnabled:\s*false/.test(doc));
assert("doc contents cutover false", /contentsYoutubeCutoverExecuted:\s*false/.test(doc));
assert("doc cutover planning complete", doc.includes("cmsCoreV2YoutubeSupabaseCutoverPlanningComplete: true"));
assert("doc staged cutover recommended", /staged-admin-then-build/.test(doc));
assert("doc path env flag", doc.includes("PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED"));
assert("doc build read flag", doc.includes("CMS_KIT_SITE_EMBEDS_BUILD_READ"));
assert("doc json fallback retained", /keep JSON|JSON fallback/i.test(doc));
assert("doc admin path package prepared", doc.includes("cmsCoreV2YoutubeSupabaseAdminPathPackagePrepared: true"));
assert("doc admin path enabled in package", /adminSupabasePathEnabledInPackage:\s*true/.test(doc));
assert("doc public build-read package prepared", doc.includes("cmsCoreV2YoutubeSupabasePublicBuildReadPackagePrepared: true"));
assert("doc public build-read in package", /publicSiteEmbedsBuildReadEnabledInPackage:\s*true/.test(doc));
assert("doc public build-read live", /publicSiteEmbedsBuildReadLive:\s*true/.test(doc));
assert("doc public build-read QA complete", doc.includes("cmsCoreV2YoutubePublicStagingSupabaseBuildReadQaComplete: true"));
assert("doc registry siteEmbeds still false", /registrySiteEmbedsStillFalse:\s*true/.test(doc));
assert("doc json fallback retained gate", /jsonYoutubeFallbackRetained:\s*true/.test(doc));
assert("doc public build-read FTP readiness closed", /readyForOperatorPublicBuildReadFtpUpload:\s*false/.test(doc));
assert("doc public build-read FTP done", /publicBuildReadFtpUploadExecuted:\s*true/.test(doc));
assert("doc admin path cutover QA complete", doc.includes("cmsCoreV2YoutubeAdminStagingSupabasePathCutoverQaComplete: true"));
assert("doc admin staging path live", /adminStagingSupabasePathLive:\s*true/.test(doc));
assert("doc ftp upload executed (manual)", /ftpUploadExecuted:\s*true/.test(doc));
assert("doc operator manual ftp only", /operatorManualFtpOnly:\s*true/.test(doc));
assert("doc admin FTP readiness closed", /readyForOperatorAdminPathFtpUpload:\s*false/.test(doc));
assert("doc contents default no longer", /contentsApiPathUnchangedDefault:\s*false/.test(doc));
assert("doc no-change dry-run qa", /noChange=true/.test(doc) && /didWrite=false/.test(doc) && /dbWrite=false/.test(doc));
assert("doc public home videoId", doc.includes("I-eY9YMq9GI"));

const adminPkgDoc = read(
  "tools/static-to-astro/docs/cms-core-v2-youtube-supabase-admin-path-package-prep.md",
);
assert("admin pkg doc exists", adminPkgDoc.includes("cmsCoreV2YoutubeSupabaseAdminPathPackagePrepared: true"));
assert("admin pkg doc write-backend supabase", adminPkgDoc.includes('data-gosaki-youtube-write-backend="supabase"'));
assert("admin pkg doc save arm false", /saveArmEnabled:\s*false/.test(adminPkgDoc));
assert("admin pkg doc FTP executed", /ftpUploadExecuted:\s*true/.test(adminPkgDoc));
assert("admin pkg doc QA complete", adminPkgDoc.includes("cmsCoreV2YoutubeAdminStagingSupabasePathCutoverQaComplete: true"));
assert("admin pkg doc public build-read false", /publicSiteEmbedsBuildReadEnabled:\s*false/.test(adminPkgDoc));
assert("admin pkg doc remote path", adminPkgDoc.includes("/cms-kit-staging/gosaki-piano/"));
assert("admin pkg doc no-change dry-run", /noChange.*true|`noChange`\s*\|\s*`true`/i.test(adminPkgDoc));
assert("admin pkg doc invokeError null", /invokeError.*null/i.test(adminPkgDoc));

const buildReadDoc = read(
  "tools/static-to-astro/docs/cms-core-v2-youtube-supabase-public-build-read-package-prep.md",
);
assert("build-read pkg doc prepared", buildReadDoc.includes("cmsCoreV2YoutubeSupabasePublicBuildReadPackagePrepared: true"));
assert("build-read pkg QA complete", buildReadDoc.includes("cmsCoreV2YoutubePublicStagingSupabaseBuildReadQaComplete: true"));
assert("build-read pkg env", buildReadDoc.includes("CMS_KIT_SITE_EMBEDS_BUILD_READ=true"));
assert("build-read pkg admin path on", buildReadDoc.includes("PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true"));
assert("build-read pkg mapped evidence", /mapSiteEmbedRowsToYoutubeConfig/i.test(buildReadDoc));
assert("build-read pkg registry false", /registrySiteEmbedsStillFalse:\s*true/.test(buildReadDoc));
assert("build-read pkg json fallback", /jsonYoutubeFallbackRetained:\s*true/.test(buildReadDoc));
assert("build-read pkg FTP executed", /ftpUploadExecuted:\s*true/.test(buildReadDoc));
assert("build-read pkg live true", /publicSiteEmbedsBuildReadLive:\s*true/.test(buildReadDoc));
assert("build-read pkg save arm false", /saveArmEnabled:\s*false/.test(buildReadDoc));
assert("build-read pkg videoId", buildReadDoc.includes("I-eY9YMq9GI"));
assert("build-read pkg sourceCommit", buildReadDoc.includes("b3bbae653c14ae5bf872b0261641c4fbf01bcf10"));
assert("doc save approval id", doc.includes(YOUTUBE_SUPABASE_SAVE_APPROVAL_ID));
assert("doc sortOrder round-trip plan", /sortOrder.*10.*11|sort_order.*10.*11/i.test(doc));
assert("doc production stop ref", doc.includes(PRODUCTION_REF_STOP));
assert("doc final sort_order 10", /sort_order=10/.test(doc) || /sort_order.*10/.test(doc));
assert("doc final updated_at recorded", doc.includes("2026-07-23 15:38:35.562674+00"));
assert("doc deploy SoT", doc.includes("Deploy SoT"));
assert("doc hardening complete gate", doc.includes("cmsCoreV2YoutubeSupabaseLocalSecurityHardeningComplete: true"));
assert("doc sql harden gate", doc.includes("cmsCoreV2YoutubeSupabaseSqlTemplateHardenComplete: true"));
assert("doc final sql harden gate", doc.includes("cmsCoreV2YoutubeSupabaseFinalSqlHardenComplete: true"));
assert("doc access assignment template", doc.includes("cms-core-v2-gosaki-access-assignment.template.sql"));
assert("doc suspended authz note", /status\s*=\s*suspended/i.test(doc) && /ignored by Phase 2 DEFINER|DEFINER helpers/i.test(doc));
assert("doc column-level grants", /column-level/i.test(doc) && /tg_site_embeds_set_audit_actors/.test(doc));
assert("doc access fail-closed", /first-time fail-closed|first-time only/i.test(doc));

const adr = read("tools/static-to-astro/docs/cms-core-v2-minimal-architecture-decision.md");
assert("ADR platform_admins.active", adr.includes("`active`"));
assert("ADR immediate revoke", /active\s*=\s*false/i.test(adr) && adr.includes("immediately"));
assert("ADR suspended not in helpers", /do not.*read `sites\.status`|Do not.*sites\.status/i.test(adr));
assert("ADR composite FK", adr.includes("composite FK") || adr.includes("site_embeds (site_id, site_slug)"));

const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
assert(
  "registry siteEmbeds still false (opt-in via env)",
  registry.sites["gosaki-piano"].supabaseFeatures?.siteEmbeds === false,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
