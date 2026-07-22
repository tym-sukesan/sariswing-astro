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

const rls = read(sqlFiles[1]);
assert("RLS enable site_embeds", rls.includes("alter table public.site_embeds enable row level security"));
assert("published select policy", rls.includes("site_embeds_public_select_published"));
assert("admin update policy", rls.includes("site_embeds_admin_update"));
assert("RLS uses can_write_site(site_id) no uid", rls.includes("can_write_site(site_id)"));
assert("RLS no can_write_site(site_id, auth.uid())", !rls.includes("can_write_site(site_id, auth.uid())"));
assert("table revoke anon site_embeds", /revoke all on table public\.site_embeds from anon/i.test(rls));
assert("table grant select anon site_embeds", /grant select on table public\.site_embeds to anon/i.test(rls));
assert("table grant authenticated write site_embeds", /grant select, insert, update on table public\.site_embeds to authenticated/i.test(rls));
const rlsNoComments = rls.replace(/--[^\n]*/g, "");
assert("no service_role grant", !/\bgrant\b[\s\S]*?\bto\s+service_role\b/i.test(rlsNoComments));

const rollbackFiles = [
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-youtube-seed-rollback.template.sql",
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
assert("handler updated_by from JWT", handler.includes("updated_by: auth.user.id"));
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
assert("doc readyForOperatorMigrationApply false", /readyForOperatorMigrationApply:\s*false/.test(doc));
assert("doc deploy SoT", doc.includes("Deploy SoT"));
assert("doc hardening complete gate", doc.includes("cmsCoreV2YoutubeSupabaseLocalSecurityHardeningComplete: true"));

const adr = read("tools/static-to-astro/docs/cms-core-v2-minimal-architecture-decision.md");
assert("ADR platform_admins.active", adr.includes("`active`"));
assert("ADR immediate revoke", /active\s*=\s*false/i.test(adr) && adr.includes("immediately"));

const registry = JSON.parse(read("tools/static-to-astro/config/sites/registry.json"));
assert(
  "registry siteEmbeds still false (opt-in via env)",
  registry.sites["gosaki-piano"].supabaseFeatures?.siteEmbeds === false,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
