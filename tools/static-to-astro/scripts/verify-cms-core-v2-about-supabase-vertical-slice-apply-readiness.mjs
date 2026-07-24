/**
 * CMS Core v2 — About Supabase vertical slice apply-readiness verifier.
 * Static checks only — no DB / Edge / Contents / FTP / SQL apply.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice-apply-readiness.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_STOP = "vsbvndwuajjhnzpohghh";
const LEDE = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";

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

function sqlActive(sql) {
  return sql
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
}

const DOC = "tools/static-to-astro/docs/cms-core-v2-about-supabase-vertical-slice-apply-readiness.md";
const PREFLIGHT = "tools/static-to-astro/docs/cms-core-v2-about-supabase-vertical-slice-preflight.md";

assert("apply-readiness doc exists", exists(DOC));
assert("preflight doc exists", exists(PREFLIGHT));
const doc = read(DOC);
const preflight = read(PREFLIGHT);

assert("phase id", doc.includes("cms-core-v2-about-supabase-vertical-slice-apply-readiness"));
assert("gate apply-readiness complete", /cmsCoreV2AboutSupabaseVerticalSliceApplyReadinessComplete:\s*true/.test(doc));
assert("ready apply true (operator re-accepted)", /readyForOperatorAboutMigrationApply:\s*true/.test(doc));
assert("banner ready true", /READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY:\s*true/.test(doc));
assert("templates change false", /sqlTemplatesChangeRequired:\s*false/.test(doc));
assert("migration service_role revoke harden", /migrationServiceRoleRevokeHarden:\s*true|MIGRATION_SERVICE_ROLE_REVOKE_HARDEN:\s*true/.test(doc));
assert("operator reaccepted", /operatorReacceptedAfterServiceRoleRevoke:\s*true|OPERATOR_REACCEPTED_AFTER_SERVICE_ROLE_REVOKE:\s*true/.test(doc));
assert("apply yes", /Apply可否:\s*\*\*YES/i.test(doc) || doc.includes("**YES（staging only）**"));
assert("implementation false", /aboutSupabaseImplementationExecuted:\s*false/.test(doc));
assert("sql apply false", /sqlApplyExecuted:\s*false/.test(doc));
assert("db write false", /dbWriteExecuted:\s*false/.test(doc));
assert("edge false", /edgeDeployExecuted:\s*false/.test(doc));
assert("contents unchanged", /contentsAboutPathUnchanged:\s*true/.test(doc));
assert("access reuse", /aboutAccessAssignmentReusesYoutubeMembership:\s*true/.test(doc));
assert("service_role false", /serviceRoleUsed:\s*false/.test(doc));
assert("ftp false", /readyForAnyFutureFtpApply:\s*false/.test(doc));
assert("staging ref", doc.includes(STAGING));
assert("production stop", doc.includes(PRODUCTION_STOP));
assert("post-migration privilege check", /grantee in \('PUBLIC', 'anon', 'authenticated', 'service_role'\)/.test(doc) || doc.includes("PUBLIC / anon / authenticated / service_role"));
assert("order migration then rls then seed", /migration[\s\S]*RLS[\s\S]*seed/i.test(doc));
assert("pre-apply select section", doc.includes("First SELECT-only") || doc.includes("SELECT-ONLY apply readiness"));
assert("post migration select", doc.includes("5.1 After migration"));
assert("post rls select", doc.includes("5.2 After RLS"));
assert("post seed select", doc.includes("5.3 After seed"));
assert("rollback section", doc.includes("Rollback conditions"));
assert("approval form", doc.includes("承認します。この操作を1回だけ実行してください。"));
assert("no access insert", /No Access INSERT|no About access INSERT|Access INSERT不要/i.test(doc));
assert("g-12a isolation", /G-12a/i.test(doc) && /none|do \*\*not\*\* touch|unchanged/i.test(doc));
assert("seed lede", doc.includes(LEDE));
assert("site_page_fields", doc.includes("site_page_fields"));
assert("can_write_site", doc.includes("can_write_site"));
assert("first apply table absent", /site_page_fields.*ABSENT|must be ABSENT|absent \(first apply\)/i.test(doc));

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
  assert(`${path.basename(rel)} staging`, sql.includes(STAGING));
  assert(`${path.basename(rel)} prod STOP`, sql.includes(PRODUCTION_STOP));
  assert(`${path.basename(rel)} no service_role grant`, !/grant\s+.*service_role/i.test(sqlActive(sql)));
  assert(`${path.basename(rel)} no G-12a`, !sql.includes("G-12a"));
  assert(`${path.basename(rel)} no Contents path`, !/GOSAKI_ABOUT_GITHUB|gosaki-about-content-save/i.test(sql));
}

const migration = read(templates[0]);
const migA = sqlActive(migration);
assert("migration fail-closed sites", /STOP: public\.sites missing/i.test(migration));
assert("migration composite unique check", migration.includes("sites_id_site_slug_key"));
assert("migration create table", /create table if not exists public\.site_page_fields/i.test(migA));
assert("migration fk restrict", /on delete restrict/i.test(migA));
assert("migration audit auth.uid", migA.includes("auth.uid()"));
assert("migration revoke all", /revoke all on table public\.site_page_fields/i.test(migA));
assert("migration revoke service_role", /revoke all on table public\.site_page_fields from service_role/i.test(migA));
assert("migration no sites create", !/create table if not exists public\.sites/i.test(migA));
assert("migration no site_members insert", !/insert into public\.site_members/i.test(migA));
assert("migration verify comment lists service_role", /service_role/i.test(migration) && /role_table_grants/i.test(migration));

const rls = read(templates[1]);
const rlsA = sqlActive(rls);
assert("rls can_write_site", rlsA.includes("can_write_site(site_id)"));
assert("rls no delete policy", !/for delete/i.test(rlsA));
assert("rls no sites policy", !/on public\.sites/i.test(rlsA));
assert("rls no site_embeds", !/site_embeds/i.test(rlsA));
assert("rls column grants", /grant insert\s*\(/i.test(rlsA) && /grant update\s*\(/i.test(rlsA));

const seed = read(templates[2]);
const seedA = sqlActive(seed);
assert("seed only about profile.lede", seedA.includes("'about'") && seedA.includes("'profile.lede'"));
assert("seed lede value", seed.includes(LEDE));
assert("seed no access insert", !/insert into public\.site_members/i.test(seedA) && !/insert into public\.platform_admins/i.test(seedA));
assert("seed on conflict scoped", /on conflict \(site_id, page_key, field_key\)/i.test(seedA));

const seedRb = read(templates[5]);
assert("seed rollback exact value", seedRb.includes(LEDE));
assert("seed rollback scoped", /delete from public\.site_page_fields/i.test(sqlActive(seedRb)));

const migRb = sqlActive(read(templates[3]));
assert("ddl rollback no cascade", !/drop\s+table[\s\S]*\bcascade\b/i.test(migRb));
assert("ddl rollback keeps sites", !/drop table if exists public\.sites/i.test(migRb));

assert("preflight still complete", /cmsCoreV2AboutSupabaseVerticalSlicePreflightComplete:\s*true/.test(preflight));
assert("preflight notes apply gate or readiness", /readyForOperatorAboutMigrationApply|apply-readiness|Apply readiness/i.test(preflight));

const ai00 = read("tools/static-to-astro/docs/ai/00-current-state.md");
const ai03 = read("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoff = read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("ai00 apply-readiness", /apply-readiness|About.*MigrationApply|readyForOperatorAboutMigrationApply:\s*true|operator re-accept/i.test(ai00));
assert("ai03 apply-readiness", /READY_FOR_OPERATOR_ABOUT_MIGRATION_APPLY:\s*true|readyForOperatorAboutMigrationApply:\s*true/i.test(ai03));
assert("handoff apply-readiness", /readyForOperatorAboutMigrationApply:\s*true/i.test(handoff));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
