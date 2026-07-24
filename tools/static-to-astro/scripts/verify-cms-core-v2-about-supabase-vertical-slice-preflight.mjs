/**
 * CMS Core v2 — About Supabase vertical slice preflight verifier.
 * Static checks only — no DB / Edge / Contents / FTP / SQL apply.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_STOP = "vsbvndwuajjhnzpohghh";
const LEDE = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";
const DRY_RUN_APPROVAL = "G-cms-v2-about-supabase-profile-lede-dry-run";
const SAVE_APPROVAL = "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice";

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

const DOC = "tools/static-to-astro/docs/cms-core-v2-about-supabase-vertical-slice-preflight.md";
assert("preflight doc exists", exists(DOC));
const doc = read(DOC);

assert("phase id", doc.includes("cms-core-v2-about-supabase-vertical-slice-preflight"));
assert("gate preflight complete", /cmsCoreV2AboutSupabaseVerticalSlicePreflightComplete:\s*true/.test(doc));
assert("recommended schema site_page_fields", /recommendedAboutSchema:\s*site_page_fields/.test(doc));
assert("first field profile.lede", /aboutFirstFieldKey:\s*about\/profile\.lede/.test(doc));
assert("opaque html false", /opaqueHtmlPrimaryModel:\s*false/.test(doc));
assert("tenancy reuse", /tenancyReuseSitesSiteMembersPlatformAdmins:\s*true/.test(doc));
assert("access reuses youtube", /aboutAccessAssignmentReusesYoutubeMembership:\s*true/.test(doc));
assert("apply gate true (apply-readiness)", /readyForOperatorAboutMigrationApply:\s*true/.test(doc));
assert(
  "banner apply ready true",
  /READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY:\s*true/.test(doc),
);
assert("sql apply still false", /sqlApplyExecuted:\s*false/.test(doc) || /SQL_APPLY_EXECUTED:\s*false/.test(doc));
assert(
  "apply-readiness linked",
  doc.includes("cms-core-v2-about-supabase-vertical-slice-apply-readiness.md"),
);
assert("implementation false", /aboutSupabaseImplementationExecuted:\s*false/.test(doc));
assert("contents unchanged", /contentsAboutPathUnchanged:\s*true/.test(doc));
assert("db write false", /dbWriteExecuted:\s*false/.test(doc));
assert("edge deploy false", /edgeDeployExecuted:\s*false/.test(doc));
assert("service_role false", /serviceRoleUsed:\s*false/.test(doc));
assert("ftp false", /readyForAnyFutureFtpApply:\s*false/.test(doc));
assert("staging ref", doc.includes(STAGING));
assert("production stop", doc.includes(PRODUCTION_STOP));
assert("dry-run approval reserved", doc.includes(DRY_RUN_APPROVAL));
assert("save approval reserved", doc.includes(SAVE_APPROVAL));
assert("no G-12a reuse", /Do \*\*not\*\* reuse|do \*\*not\*\* reuse|Do not reuse/i.test(doc) && doc.includes("G-12a"));
assert("rejects opaque HTML blocks", /Reject|reject/.test(doc) && /opaque HTML/i.test(doc));
assert("singleton compared", /Singleton|singleton/.test(doc));
assert("lede seed value in doc", doc.includes(LEDE));
assert("can_write_site reuse", doc.includes("can_write_site"));
assert("optimistic lock updated_at", /optimistic lock/i.test(doc) && doc.includes("updated_at"));
assert("dual-path Contents default", /Contents/i.test(doc) && /dual-path|Default Admin path/i.test(doc));
assert("build-read flag", doc.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ"));
assert("path enabled flag", doc.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED"));
assert("approval form required", doc.includes("承認します。この操作を1回だけ実行してください。"));

const templates = [
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-page-fields-migration.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-page-fields-rls.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-about-profile-lede-seed.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-page-fields-migration-rollback.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-site-page-fields-rls-rollback.template.sql",
  "tools/static-to-astro/scripts/supabase/cms-core-v2-gosaki-about-profile-lede-seed-rollback.template.sql",
];

for (const rel of templates) {
  assert(`template exists ${path.basename(rel)}`, exists(rel));
  const sql = read(rel);
  assert(`${path.basename(rel)} DO NOT EXECUTE`, /DO NOT EXECUTE/i.test(sql));
  assert(`${path.basename(rel)} staging ref`, sql.includes(STAGING));
  assert(`${path.basename(rel)} production STOP`, sql.includes(PRODUCTION_STOP));
  assert(`${path.basename(rel)} no service_role grant`, !/grant\s+.*service_role/i.test(sql));
  assert(`${path.basename(rel)} no service_role use`, !/auth\.service_role|service_role\s+key/i.test(sql));
}

const migration = read(templates[0]);
assert("migration creates site_page_fields", /create table if not exists public\.site_page_fields/i.test(migration));
assert("migration composite FK", migration.includes("site_page_fields_site_id_slug_fkey"));
assert("migration ON DELETE RESTRICT", /on delete restrict/i.test(migration));
assert("migration unique page field", migration.includes("unique (site_id, page_key, field_key)"));
assert("migration value_text", migration.includes("value_text"));
assert("migration updated_at trigger", migration.includes("tg_site_page_fields_set_updated_at"));
assert("migration audit trigger", migration.includes("tg_site_page_fields_set_audit_actors"));
assert("migration auth.uid audit", migration.includes("auth.uid()"));
assert("migration requires sites", /sites missing|public\.sites/i.test(migration));
assert("migration fail-closed revoke", /revoke all on table public\.site_page_fields/i.test(migration));
assert("migration no tenancy create", !/create table if not exists public\.sites/i.test(migration));
assert("migration no html column", !/\bhtml\b/.test(migration.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").match(/create table[\s\S]*?;/)?.[0] ?? ""));

const rls = read(templates[1]);
assert("rls enable", /alter table public\.site_page_fields enable row level security/i.test(rls));
assert("rls public published", rls.includes("site_page_fields_public_select_published"));
assert("rls can_write_site", rls.includes("can_write_site(site_id)"));
assert("rls no delete policy", !/for delete/i.test(rls));
assert("rls column insert grant", /grant insert\s*\([\s\S]*value_text/i.test(rls));
assert("rls column update grant", /grant update\s*\([\s\S]*value_text/i.test(rls));
assert("rls no update created_by", !/grant update\s*\([^)]*created_by/i.test(rls));
assert("rls scope only site_page_fields", !/on public\.site_embeds/i.test(rls) && !/on public\.sites/i.test(rls));

const seed = read(templates[2]);
assert("seed page_key about", seed.includes("'about'"));
assert("seed field_key profile.lede", seed.includes("'profile.lede'"));
assert("seed lede text", seed.includes(LEDE));
assert("seed published true", /true,\s*\n\s*10/.test(seed) || seed.includes("true,\n  10"));
assert("seed on conflict", /on conflict \(site_id, page_key, field_key\)/i.test(seed));
assert("seed no access insert", !/insert into public\.site_members/i.test(seed) && !/insert into public\.platform_admins/i.test(seed));

const seedRb = read(templates[5]);
assert("seed rollback exact lede", seedRb.includes(LEDE));
assert("seed rollback scoped delete", /delete from public\.site_page_fields/i.test(seedRb));
assert("seed rollback field_key", seedRb.includes("profile.lede"));

function sqlActive(sql) {
  return sql
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
}

const migRb = read(templates[3]);
const migRbActive = sqlActive(migRb);
assert("migration rollback drops table", /drop table if exists public\.site_page_fields/i.test(migRbActive));
assert("migration rollback no cascade", !/drop\s+table[\s\S]*\bcascade\b/i.test(migRbActive));
assert("migration rollback keeps sites", !/drop table if exists public\.sites/i.test(migRbActive));
assert("migration rollback keeps helpers", !/drop function if exists public\.can_write_site/i.test(migRbActive));

const rlsRb = read(templates[4]);
const rlsRbActive = sqlActive(rlsRb);
assert("rls rollback drops policies", rlsRb.includes("site_page_fields_public_select_published"));
assert("rls rollback no table drop", !/drop\s+table/i.test(rlsRbActive));

assert("about json sot exists", exists("tools/static-to-astro/config/sites/gosaki-piano-about-content.json"));
const aboutJson = JSON.parse(read("tools/static-to-astro/config/sites/gosaki-piano-about-content.json"));
const profile = aboutJson.blocks?.find((b) => b.id === "about-profile-html");
assert("about profile block present", Boolean(profile?.html));
assert("about html contains lede", String(profile?.html ?? "").includes(LEDE));

assert("contents save still github", exists("supabase/functions/_shared/gosaki-about-content-save.ts"));
assert(
  "contents path unchanged in code",
  read("supabase/functions/_shared/gosaki-about-content-save.ts").includes("GOSAKI_ABOUT_GITHUB_FILE_PATH"),
);

const forbiddenApprovals = [
  "G-12a-gosaki-about-content-web-save-non-dry-run-slice",
  "G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice",
  "G-cms-v2-youtube-supabase-items-dry-run",
];
for (const id of forbiddenApprovals) {
  assert(`templates do not register ${id}`, !templates.some((rel) => read(rel).includes(id)));
  assert(`preflight does not set ${id} as About Save`, !new RegExp(`Save approval[^\\n]*${id}`).test(doc));
}
assert("preflight Save approval is new id", doc.includes(SAVE_APPROVAL) && !doc.includes(`Save approval | \`${forbiddenApprovals[0]}\``));

const ai00 = read("tools/static-to-astro/docs/ai/00-current-state.md");
const ai03 = read("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoff = read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("ai00 mentions about preflight", /about-supabase-vertical-slice-preflight|About Supabase.*preflight/i.test(ai00));
assert("ai03 mentions about preflight", /about-supabase-vertical-slice-preflight|About Supabase.*preflight/i.test(ai03));
assert("handoff mentions about preflight", /about-supabase-vertical-slice-preflight|About Supabase.*preflight/i.test(handoff));
assert("ai03 apply gate true", /readyForOperatorAboutMigrationApply:\s*true|READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY:\s*true/i.test(ai03));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
