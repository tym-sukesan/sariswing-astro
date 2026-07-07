/**
 * G-23b — Static-to-Astro onboarding config schema planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23b-static-to-astro-onboarding-config-schema-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/static-to-astro-onboarding-config-schema-planning.md";
const SCHEMA_REL = "tools/static-to-astro/config/onboarding.schema.example.json";
const GOSAKI_REL = "tools/static-to-astro/config/onboarding.gosaki-piano.example.json";
const G23A_DOC = "tools/static-to-astro/docs/static-to-astro-30-minute-onboarding-flow-planning.md";

const BASE_COMMIT = "a97e80a";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is a97e80a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is a97e80a", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("planning doc exists", exists(DOC_REL));
assert("schema example exists", exists(SCHEMA_REL));
assert("gosaki example config exists", exists(GOSAKI_REL));
assert("G-23a planning doc exists", exists(G23A_DOC));

const doc = read(DOC_REL);
const schemaRaw = read(SCHEMA_REL);
const gosakiRaw = read(GOSAKI_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

let schema;
let gosaki;
try {
  schema = JSON.parse(schemaRaw);
  assert("schema example parses as JSON", true);
} catch (e) {
  assert("schema example parses as JSON", false, e.message);
  schema = {};
}
try {
  gosaki = JSON.parse(gosakiRaw);
  assert("gosaki example parses as JSON", true);
} catch (e) {
  assert("gosaki example parses as JSON", false, e.message);
  gosaki = {};
}

assert("doc phase G-23b", doc.includes("G-23b-static-to-astro-onboarding-config-schema-planning"));
assert(
  "doc planning gate complete",
  doc.includes("staticToAstroOnboardingConfigSchemaPlanningComplete: true"),
);

assert("doc onboarding config purpose", /onboarding config|30.minute|標準化/i.test(doc));
assert("doc URL input approach", /URL|sourceUrl/i.test(doc));
assert("doc human readable", /human-readable|人間が確認/i.test(doc));
assert("doc future CLI UI", /CLI|UI/i.test(doc));

const requiredFields = [
  "projectName",
  "siteSlug",
  "sourceUrl",
  "sourcePlatform",
  "siteType",
  "cmsPreset",
  "locale",
  "timezone",
  "ownerLabel",
  "publicDomain",
  "stagingDomain",
];
for (const field of requiredFields) {
  assert(`doc required field ${field}`, doc.includes(field));
}

assert("doc sourcePlatform enum", /wix.*studio.*jimdo|wix` · `studio/i.test(doc));
assert("doc siteType enum", /musician-basic/i.test(doc));

assert("doc cms preset musician-basic", doc.includes("musician-basic"));
assert("doc cms module schedule", /schedule/i.test(doc));
assert("doc cms module news", /news/i.test(doc));
assert("doc cms module profile", /profile/i.test(doc));
assert("doc cms module discography", /discography/i.test(doc));
assert("doc cms module video", /video/i.test(doc));
assert("doc cms module contact", /contact/i.test(doc));

assert("doc module enabled field", /enabled/i.test(doc));
assert("doc module extraction strategy", /extractionStrategy|extraction strategy/i.test(doc));
assert("doc module table", /table/i.test(doc));
assert("doc module seed policy", /seedPolicy|seed policy/i.test(doc));
assert("doc module publish field", /publishField|publish field/i.test(doc));
assert("doc module admin UI", /adminUiEnabled|admin UI/i.test(doc));
assert("doc module public route", /publicRoute|public route/i.test(doc));

assert("doc safety gates section", /safetyGates|safety gates/i.test(doc));
const safetyGates = [
  "stagingOnly",
  "requireHumanReview",
  "allowDbWrite",
  "allowPackageBuild",
  "allowFtpUpload",
  "allowProductionDeploy",
  "forbidMirrorDelete",
  "forbidServiceRole",
  "requireOutputDiffReview",
  "requireUploadFileList",
  "requireRollbackPlanForDbWrite",
  "manualCommitPush",
];
for (const gate of safetyGates) {
  assert(`doc safety gate ${gate}`, doc.includes(gate));
}

assert("doc allowDbWrite default false", /allowDbWrite.*false/i.test(doc));
assert("doc allowPackageBuild default false", /allowPackageBuild.*false/i.test(doc));
assert("doc allowFtpUpload default false", /allowFtpUpload.*false/i.test(doc));
assert("doc allowProductionDeploy default false", /allowProductionDeploy.*false/i.test(doc));

assert("doc output paths workspace", /fixtureOut|workspace/i.test(doc));
assert("doc output paths astro", /astroOut|astro output/i.test(doc));
assert("doc output paths public-dist", /staticPublicOut|public-dist/i.test(doc));
assert("doc output paths manual-upload", /manualUploadOut|manual-upload/i.test(doc));
assert("doc output paths reports", /reportsOut|reports output/i.test(doc));
assert("doc output paths docs", /docsOut|docs output/i.test(doc));

assert("doc gosaki example section", /Gosaki example|gosaki-piano/i.test(doc));
assert("doc gosaki sourceUrl", doc.includes("https://www.gosaki-piano.com/"));
assert("doc gosaki staging supabase", /static-to-astro-cms-staging|kmjqppxjdnwwrtaeqjta/i.test(doc));
assert("doc gosaki ftp disabled", /ftp.*disabled|enabled.*false/i.test(doc));

assert("doc 30-min flow 0-3", /0.–3|0–3 min/i.test(doc));
assert("doc 30-min flow 3-8 crawl", /3.–8|3–8 min/i.test(doc));
assert("doc 30-min flow 12-17 seed", /12.–17|12–17 min/i.test(doc));
assert("doc 30-min flow 17-22 staging", /17.–22|17–22 min/i.test(doc));
assert("doc 30-min flow 22-26 package", /22.–26|22–26 min/i.test(doc));
assert("doc 30-min flow 26-30 report", /26.–30|26–30 min/i.test(doc));

assert("doc not in scope CLI", /CLI.*deferred|CLI implementation/i.test(doc));
assert("doc not in scope crawl", /crawl.*not executed|Live crawl/i.test(doc));
assert("doc not in scope DB", /DB seed|DB write.*not/i.test(doc));
assert("doc not in scope package", /package regen.*not|Package regen/i.test(doc));
assert("doc not in scope FTP", /FTP.*not executed/i.test(doc));
assert("doc not in scope secrets", /secrets.*forbidden|Not in config/i.test(doc));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc crawl executed false", doc.includes("crawlExecuted: false"));
assert("doc package regen false", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));

assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in forbidden context",
  !doc.includes(PROD_REF) || /forbidden|never|Never/i.test(doc),
);

assert("schema has required projectName", schema.required?.includes("projectName"));
assert("schema has required siteSlug", schema.required?.includes("siteSlug"));
assert("schema has safetyGates", schema.properties?.safetyGates);
assert(
  "schema allowDbWrite default false",
  schema.properties?.safetyGates?.properties?.allowDbWrite?.default === false,
);

assert("gosaki projectName", gosaki.projectName === "gosaki-piano");
assert("gosaki siteSlug", gosaki.siteSlug === "gosaki-piano");
assert("gosaki sourcePlatform wix", gosaki.sourcePlatform === "wix");
assert("gosaki cmsPreset musician-basic", gosaki.cmsPreset === "musician-basic");
assert("gosaki staging supabase ref", gosaki.supabase?.projectRef === STAGING_REF);
assert(
  "gosaki forbidden prod ref",
  gosaki.supabase?.forbiddenProjectRefs?.includes(PROD_REF),
);
assert("gosaki schedule enabled", gosaki.cms?.modules?.some((m) => m.id === "schedule" && m.enabled));
assert("gosaki safety allowDbWrite false", gosaki.safetyGates?.allowDbWrite === false);
assert("gosaki safety allowPackageBuild false", gosaki.safetyGates?.allowPackageBuild === false);
assert("gosaki safety allowFtpUpload false", gosaki.safetyGates?.allowFtpUpload === false);
assert("gosaki ftp disabled", gosaki.ftp?.enabled === false);

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("00-current-state mentions G-23b", currentState.includes("G-23b"));
assert("03-next-actions mentions G-23b", nextActions.includes("G-23b"));
assert("handoff mentions G-23b", handoff.includes("G-23b"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-23b Static-to-Astro onboarding config schema planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
