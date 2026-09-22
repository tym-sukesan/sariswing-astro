#!/usr/bin/env node
/**
 * gosaki-production-cms-save-completion — local / static verifier.
 * No DB write · no Secrets · no Edge deploy · no FTP · no Save arm.
 *
 * npm: verify:gosaki-production-cms-save-completion
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function readRel(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function existsRel(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

let passed = 0;
let failed = 0;
function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const chips = readRel(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingSafetyChips.astro",
);
const page = readRel(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
);
const adminLib = readRel(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
const shell = readRel(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro",
);
const bake = readRel("tools/static-to-astro/scripts/lib/gosaki-package-build-env-preflight.mjs");
const rootHandler = readRel("supabase/functions/gosaki-schedule-save-dry-run/handler.ts");
const mirrorHandler = readRel(
  "tools/static-to-astro/scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
);
const discoHandler = readRel("supabase/functions/gosaki-discography-save-dry-run/handler.ts");
const youtubeHandler = readRel(
  "supabase/functions/gosaki-youtube-supabase-save-dry-run/handler.ts",
);
const aboutHandler = readRel("supabase/functions/gosaki-about-supabase-save-dry-run/handler.ts");
const rlsUpdate = readRel(
  "tools/static-to-astro/scripts/supabase/cms-core-v2-schedules-site-writer-update-rls.template.sql",
);
const rlsRollback = readRel(
  "tools/static-to-astro/scripts/supabase/cms-core-v2-schedules-site-writer-update-rls-rollback.template.sql",
);
const rlsInsert = readRel(
  "tools/static-to-astro/scripts/supabase/cms-core-v2-schedules-site-writer-rls.template.sql",
);
const youtubeJson = readRel(
  "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json",
);
const armInventory = readRel(
  "tools/static-to-astro/scripts/lib/gosaki-operational-save-ui-arm-inventory.mjs",
);
const pkg = readRel("tools/static-to-astro/package.json");

assert(
  "chips branches on PUBLIC_GOSAKI_ADMIN_SURFACE",
  chips.includes("PUBLIC_GOSAKI_ADMIN_SURFACE") && chips.includes("isProductionAdmin"),
);
assert("chips keeps staging テスト環境 copy", chips.includes("テスト環境｜公開サイトには自動反映されません"));
assert(
  "chips production copy omits テスト環境",
  chips.includes("本番CMS｜保存内容は公開ページへ自動反映されません"),
);
assert("page titles branch production vs staging", page.includes("isGosakiProductionAdminSurface"));
assert("page staging titles retain テスト環境", page.includes("Gosaki Piano CMS（テスト環境）"));
assert(
  "page production titles omit テスト環境",
  /portal:\s*"Gosaki Piano CMS"/.test(page) && page.includes("adminFooterText"),
);
assert(
  "musician-basic shell staging copy retained",
  shell.includes("Gosaki Piano CMS（テスト環境）") && shell.includes("AdminGosakiStagingSafetyChips"),
);
assert(
  "production bake sets ADMIN_SURFACE production",
  bake.includes('PUBLIC_GOSAKI_ADMIN_SURFACE: adminSurface') &&
    bake.includes('const adminSurface = isProductionProfile ? "production" : "staging"'),
);
assert(
  "staging bake is not production surface",
  bake.includes('isProductionProfile ? "production" : "staging"'),
);
assert(
  "production bake PATH_ENABLED youtube+about",
  bake.includes("PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED: \"true\"") &&
    bake.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED: \"true\""),
);
assert(
  "production bake does not set Save arms",
  bake.includes("Save arms: not set (must remain false)") &&
    !/PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED:\s*"true"/.test(bake) &&
    !/PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED:\s*"true"/.test(bake) &&
    !/PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED:\s*"true"/.test(bake) &&
    !/PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED:\s*"true"/.test(bake) &&
    !/PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED:\s*"true"/.test(bake) &&
    !/PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED:\s*"true"/.test(bake),
);

assert("schedule handler SITE_SLUG gosaki-piano", rootHandler.includes('SITE_SLUG = "gosaki-piano"'));
assert("schedule handler can_write_site helper", rootHandler.includes("assertCanWriteSiteForSiteSlug"));
assert("schedule handler rpc can_write_site", rootHandler.includes('rpc("can_write_site"'));
assert("schedule handler no is_admin Save gate", !rootHandler.includes("assertOperatorIsAdmin"));
assert("schedule handler no rpc is_admin", !rootHandler.includes('rpc("is_admin")'));
assert(
  "schedule Save path uses can_write_site",
  /skipAdminProbe[\s\S]*assertCanWriteSiteForSiteSlug\(client, SITE_SLUG\)/.test(rootHandler),
);
assert("schedule handler site_slug on UPDATE", rootHandler.includes('.eq("site_slug", input.siteSlug)'));
assert("schedule handler production STOP", rootHandler.includes("vsbvndwuajjhnzpohghh"));
assert("schedule handler kmjq only", rootHandler.includes("kmjqppxjdnwwrtaeqjta"));
assert("schedule handler Save arm env unchanged", rootHandler.includes('SAVE_ARMED_ENV = "GOSAKI_SCHEDULE_SAVE_ARMED"'));
assert("schedule handler no service_role", rootHandler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("schedule handler mirror byte-eq", rootHandler === mirrorHandler);

assert(
  "unrelated siteSlug denied in helper",
  rootHandler.includes('if (!slug || slug !== SITE_SLUG)') &&
    rootHandler.includes('siteSlug must be "${SITE_SLUG}"'),
);
assert(
  "unrelated / non-member denied",
  rootHandler.includes("can_write_site denied — site not visible") &&
    rootHandler.includes("can_write_site(site_id) must be true"),
);

assert("discography Edge can_write_site", discoHandler.includes("assertCanWriteSiteForSiteSlug"));
assert("discography Edge no is_admin gate", !discoHandler.includes("assertOperatorIsAdmin"));
assert("youtube supabase Edge can_write_site", youtubeHandler.includes("can_write_site"));
assert("about supabase Edge can_write_site", aboutHandler.includes("can_write_site"));

assert(
  "admin UI production youtube/about backend follows PATH_ENABLED",
  page.includes('youtubeSupabasePathEnabled ? "supabase" : "contents"') &&
    page.includes("data-gosaki-about-write-backend") &&
    page.includes("aboutSupabasePathEnabled"),
);
assert(
  "Contents YouTube/About arms remain registered (not deleted)",
  armInventory.includes("gosaki-youtube-contents") &&
    armInventory.includes("gosaki-about-contents") &&
    armInventory.includes("PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED") &&
    armInventory.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED"),
);
assert(
  "Contents is not production PATH default",
  bake.includes("PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED: \"true\"") &&
    !bake.includes("PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED: \"false\""),
);

assert("UPDATE RLS template exists", existsRel(
  "tools/static-to-astro/scripts/supabase/cms-core-v2-schedules-site-writer-update-rls.template.sql",
));
assert("UPDATE RLS is template not applied", rlsUpdate.includes("DO NOT EXECUTE"));
assert("UPDATE RLS uses can_write_site", rlsUpdate.includes("can_write_site(site_row.id)"));
assert("UPDATE RLS keeps schedules_admin_all", rlsUpdate.includes("schedules_admin_all"));
assert("UPDATE RLS no gosaki-piano hardcoded in policy", !/create policy[\s\S]*site_slug = 'gosaki-piano'/.test(rlsUpdate));
assert("UPDATE RLS rollback drops only update policy", rlsRollback.includes("schedules_site_writer_update"));
assert("INSERT RLS template unchanged (no UPDATE in it)", !rlsInsert.includes("schedules_site_writer_update"));

assert("test YouTube unpublished in JSON SoT", /"published":\s*false/.test(youtubeJson) && youtubeJson.includes("I-eY9YMq9GI"));
assert("lib surface helpers exported", adminLib.includes("isGosakiProductionAdminSurface") && adminLib.includes("GOSAKI_ADMIN_SAFETY_CHIP_PRODUCTION"));

assert("npm script registered", pkg.includes("verify:gosaki-production-cms-save-completion"));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK gosaki-production-cms-save-completion");
