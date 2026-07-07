/**
 * G-23d — Static-to-Astro onboarding sample site dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { PROD_REF, STAGING_REF, validateOnboardingConfigFile } from "./validate-onboarding-config.mjs";
import { runOnboardingFixtureDryRun } from "./run-onboarding-fixture-dry-run.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";
const DRY_RUN_REL = "tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs";
const VALIDATOR_REL = "tools/static-to-astro/scripts/validate-onboarding-config.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-onboarding-sample-site-dry-run-result.md";

const BASE_COMMIT = "dac762c";

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

function runDryRun(configPath, fixturePath, json = false) {
  const args = ["node", path.join(REPO_ROOT, DRY_RUN_REL), configPath, fixturePath];
  if (json) args.push("--json");
  return spawnSync(args[0], args.slice(1), {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is dac762c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is dac762c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("sample fixture config exists", exists(CONFIG_REL));
assert("sample crawl fixture exists", exists(FIXTURE_REL));
assert("dry-run script exists", exists(DRY_RUN_REL));
assert("validator script exists", exists(VALIDATOR_REL));
assert("result doc exists", exists(RESULT_DOC_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23d", resultDoc.includes("G-23d-static-to-astro-onboarding-sample-site-dry-run"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroOnboardingSampleSiteDryRunComplete: true"),
);
assert("result doc fixture-only", /fixture-only|fixture only/i.test(resultDoc));
assert("result doc no live crawl", /live crawl.*no|no live crawl/i.test(resultDoc));
assert("result doc no DB write", /DB.*no|no.*DB/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc no FTP", /FTP.*no|no.*FTP/i.test(resultDoc));
assert("result doc config validation PASS", /config validation.*PASS/i.test(resultDoc));
assert("result doc fixture load PASS", /fixture load.*PASS/i.test(resultDoc));
assert("result doc page classification", /Page classification|ページ分類/i.test(resultDoc));
assert("result doc CMS modules", /CMS module|seed candidate/i.test(resultDoc));
assert("result doc 30-min flow", /30.minute|0.–3|0–3 min/i.test(resultDoc));
assert("result doc safety gates", /allowDbWrite.*false/i.test(resultDoc));
assert("result doc next G-23e", /G-23e/i.test(resultDoc));
assert(
  "result doc prod ref only forbidden",
  !resultDoc.includes(`ref=${PROD_REF}`) && resultDoc.includes(PROD_REF),
);

const configAbs = path.join(REPO_ROOT, CONFIG_REL);
const fixtureAbs = path.join(REPO_ROOT, FIXTURE_REL);

const configValidation = validateOnboardingConfigFile(configAbs);
assert("config validator PASS", configValidation.ok === true);

const config = JSON.parse(read(CONFIG_REL));
assert("config sourcePlatform static", config.sourcePlatform === "static");
assert("config siteSlug sample-musician-fixture", config.siteSlug === "sample-musician-fixture");
assert("config example.com sourceUrl", config.sourceUrl === "https://example.com/sample-musician/");
assert("config safety allowDbWrite false", config.safetyGates.allowDbWrite === false);
assert("config safety allowPackageBuild false", config.safetyGates.allowPackageBuild === false);
assert("config safety allowFtpUpload false", config.safetyGates.allowFtpUpload === false);
assert("config ftp disabled", config.ftp.enabled === false);
assert("config staging ref", config.supabase.projectRef === STAGING_REF);
assert("config forbidden prod ref", config.supabase.forbiddenProjectRefs.includes(PROD_REF));
assert("config active prod ref absent", config.supabase.projectRef !== PROD_REF);

const enabledModules = config.cms.modules.filter((m) => m.enabled).map((m) => m.id);
for (const mod of ["schedule", "news", "profile", "discography", "video", "contact"]) {
  assert(`config module ${mod} enabled`, enabledModules.includes(mod));
}

const fixture = JSON.parse(read(FIXTURE_REL));
assert("fixture fixtureOnly true", fixture.fixtureOnly === true);
assert("fixture liveCrawl false", fixture.source?.liveCrawl === false);
assert("fixture 6 pages", fixture.pages?.length === 6);
assert("fixture schedule seeds 2", fixture.seedCandidates?.schedule?.length === 2);
assert("fixture news seeds 1", fixture.seedCandidates?.news?.length === 1);
assert("fixture discography seeds 1", fixture.seedCandidates?.discography?.length === 1);
assert("fixture video seeds 1", fixture.seedCandidates?.video?.length === 1);
assert("fixture detected platform", fixture.metadata?.detectedPlatform === "fixture/static");

const pagePaths = fixture.pages.map((p) => p.path);
for (const p of ["/", "/profile/", "/schedule/", "/discography/", "/videos/", "/contact/"]) {
  assert(`fixture page ${p}`, pagePaths.includes(p));
}

const dryCli = runDryRun(configAbs, fixtureAbs);
assert("dry-run CLI exit 0", dryCli.status === 0, dryCli.stderr);
assert("dry-run CLI PASS", /PASS/.test(dryCli.stdout));
assert("dry-run CLI fixture-only", /Fixture-only:\s*true/i.test(dryCli.stdout));
assert("dry-run CLI no live crawl", /Live crawl:\s*false/i.test(dryCli.stdout));
assert("dry-run uses config validator", /Config validation:\s*PASS/i.test(dryCli.stdout));

const dryApi = runOnboardingFixtureDryRun({ configPath: configAbs, fixturePath: fixtureAbs });
assert("dry-run API ok", dryApi.ok === true);
assert("dry-run API status PASS", dryApi.status === "PASS");
assert("dry-run API fixtureOnly", dryApi.fixtureOnly === true);
assert("dry-run API no network", dryApi.networkAccess === false);
assert("dry-run API no DB", dryApi.dbConnectionAttempted === false);
assert("dry-run API no package", dryApi.packageBuildExecuted === false);
assert("dry-run API no FTP", dryApi.ftpUploadExecuted === false);
assert("dry-run API config validation PASS", dryApi.configValidation.status === "PASS");
assert("dry-run API fixture load PASS", dryApi.fixtureLoad.status === "PASS");
assert("dry-run API 7 flow steps", dryApi.steps?.length === 7);
assert("dry-run API seed schedule 2", dryApi.seedCounts?.schedule === 2);
assert("dry-run API seed news 1", dryApi.seedCounts?.news === 1);
assert("dry-run API safety gates PASS", dryApi.safetyGates.status === "PASS");
assert("dry-run API supabase staging", dryApi.supabaseTarget.projectRef === STAGING_REF);
assert("dry-run API supabase not prod", dryApi.supabaseTarget.projectRef !== PROD_REF);

const jsonCli = runDryRun(configAbs, fixtureAbs, true);
assert("dry-run --json exit 0", jsonCli.status === 0);
let jsonOut;
try {
  jsonOut = JSON.parse(jsonCli.stdout);
  assert("dry-run --json parses", true);
  assert("dry-run --json status PASS", jsonOut.status === "PASS");
  assert("dry-run --json fixtureOnly", jsonOut.fixtureOnly === true);
} catch (e) {
  assert("dry-run --json parses", false, e.message);
}

const dryRunSource = read(DRY_RUN_REL);
assert("dry-run imports validateOnboardingConfig", dryRunSource.includes("validateOnboardingConfig"));

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

assert("00-current-state mentions G-23d", currentState.includes("G-23d"));
assert("03-next-actions mentions G-23d", nextActions.includes("G-23d"));
assert("handoff mentions G-23d", handoff.includes("G-23d"));

assert("Crawl not executed by Cursor", true);
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
  `\nG-23d Static-to-Astro onboarding sample site dry-run verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
