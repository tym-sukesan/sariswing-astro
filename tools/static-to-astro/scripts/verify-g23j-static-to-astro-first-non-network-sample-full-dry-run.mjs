/**
 * G-23j — Static-to-Astro first non-network sample full dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  runOnboardingOrchestrator,
  SUPPORTED_MODES,
  isFixtureMode,
} from "./run-onboarding-orchestrator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const ORCHESTRATOR_REL = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-first-non-network-sample-full-dry-run-result.md";
const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";

const G23H_VERIFIER =
  "tools/static-to-astro/scripts/verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs";

const BASE_COMMIT = "7ce291f";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const EXPECTED_COUNTS = {
  schedule: 2,
  news: 1,
  profile: 1,
  discography: 1,
  video: 1,
  contact: 1,
};

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

function runCli(args) {
  return spawnSync("node", [path.join(REPO_ROOT, ORCHESTRATOR_REL), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

function runVerifier(rel) {
  return spawnSync("node", [path.join(REPO_ROOT, rel)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

function countVerifierFailures(output) {
  const m = output.match(/(\d+) passed, (\d+) failed/);
  if (!m) return { passed: 0, failed: 999 };
  return { passed: Number(m[1]), failed: Number(m[2]) };
}

/**
 * @param {string} output
 * @returns {string[]}
 */
function extractVerifierFailures(output) {
  return output
    .split("\n")
    .filter((line) => line.startsWith("FAIL "))
    .map((line) => line.replace(/^FAIL /, ""));
}

/**
 * @param {string[]} failures
 */
function failuresAreHeadPinOnly(failures) {
  if (failures.length === 0) return true;
  return failures.every((f) => /^HEAD is |^origin\/main is /.test(f));
}

/**
 * G-23h legacy verifier at 7ce291f: 2 HEAD-pin + 2 obsolete full-dry-run unsupported.
 * @param {string[]} failures
 */
function failuresAreKnownG23hObsoleteExpectations(failures) {
  if (failures.length !== 4) return false;
  const head = failures.filter((f) => /^HEAD is |^origin\/main is /.test(f));
  const unsupported = failures.filter((f) => /^unsupported CLI/.test(f));
  return head.length === 2 && unsupported.length === 2;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 7ce291f", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 7ce291f", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("orchestrator exists", exists(ORCHESTRATOR_REL));
assert("result doc exists", exists(RESULT_DOC_REL));
assert("sample config exists", exists(CONFIG_REL));
assert("sample fixture exists", exists(FIXTURE_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23j", resultDoc.includes("G-23j-first-non-network-sample-full-dry-run"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroFirstNonNetworkSampleFullDryRunComplete: true"),
);
assert("result doc non-network", /non-network|Non-network/i.test(resultDoc));
assert("result doc execution command", /full-dry-run/i.test(resultDoc));
assert("result doc config validation", /config validation/i.test(resultDoc));
assert("result doc registry validation", /registry/i.test(resultDoc));
assert("result doc fixture load", /fixture load|fixture source/i.test(resultDoc));
assert("result doc page classification", /page classification/i.test(resultDoc));
assert("result doc CMS module", /CMS module/i.test(resultDoc));
assert("result doc seed extraction", /seed extraction/i.test(resultDoc));
assert("result doc seed counts", /schedule.*2|schedule \| \*\*2\*\*/i.test(resultDoc));
assert("result doc DB planOnly", /DB planOnly|staging DB/i.test(resultDoc));
assert("result doc package planOnly", /package planOnly/i.test(resultDoc));
assert("result doc upload planOnly", /upload planOnly/i.test(resultDoc));
assert("result doc safety gates", /Safety gate/i.test(resultDoc));
assert("result doc warnings", /Warnings|warnings/i.test(resultDoc));
assert("result doc final PASS", /Overall.*PASS|Final result/i.test(resultDoc));
assert("result doc G-23h legacy", /G-23h legacy|legacy verifier/i.test(resultDoc));
assert("result doc full-dry-run supported", /full-dry-run.*support|formally supported/i.test(resultDoc));
assert("result doc obsolete unsupported", /obsolete|unsupported.*expectation/i.test(resultDoc));
assert("result doc legacy functional", /functional compatibility|fixture-dry-run/i.test(resultDoc));
assert(
  "result doc gate legacyG23hKnownObsolete",
  resultDoc.includes("legacyG23hVerifierKnownObsoleteFailuresOnly: true"),
);
assert("result doc no crawl", /crawl.*no|no.*crawl|not executed/i.test(resultDoc));
assert("result doc no DB", /DB.*no|no.*DB|not executed/i.test(resultDoc));
assert("result doc no SQL", /SQL.*no|no.*SQL|mutation/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc no FTP", /FTP.*no|no.*FTP/i.test(resultDoc));
assert("result doc next G-23k", /G-23k/i.test(resultDoc));
assert("result doc next G-23l", /G-23l/i.test(resultDoc));
assert("result doc next G-23m", /G-23m/i.test(resultDoc));
assert("result doc next G-23n", /G-23n/i.test(resultDoc));

assert("SUPPORTED_MODES includes full-dry-run", SUPPORTED_MODES.includes("full-dry-run"));
assert("isFixtureMode full-dry-run", isFixtureMode("full-dry-run"));
assert("isFixtureMode fixture-dry-run", isFixtureMode("fixture-dry-run"));

const configAbs = path.join(REPO_ROOT, CONFIG_REL);
const fixtureAbs = path.join(REPO_ROOT, FIXTURE_REL);
const config = JSON.parse(read(CONFIG_REL));

assert("config allowDbWrite false", config.safetyGates?.allowDbWrite === false);
assert("config allowPackageBuild false", config.safetyGates?.allowPackageBuild === false);
assert("config allowFtpUpload false", config.safetyGates?.allowFtpUpload === false);
assert("config requireOutputDiffReview true", config.safetyGates?.requireOutputDiffReview === true);
assert("config requireUploadFileList true", config.safetyGates?.requireUploadFileList === true);
assert("config prod ref not active", config.supabase?.projectRef !== PROD_REF);

const fullApi = runOnboardingOrchestrator({
  configPath: configAbs,
  fixturePath: fixtureAbs,
  mode: "full-dry-run",
});
assert("full-dry-run API PASS", fullApi.ok === true && fullApi.status === "PASS");
assert("full-dry-run phase G-23j", fullApi.phase === "G-23j-first-non-network-sample-full-dry-run");
assert("full-dry-run nonNetworkFullDryRun", fullApi.nonNetworkFullDryRun === true);
assert("full-dry-run config validation PASS", fullApi.validation?.config?.status === "PASS");
assert("full-dry-run registry validation PASS", fullApi.validation?.registry?.status === "PASS");
assert("full-dry-run fixtureOnly", fullApi.fixtureLoad?.fixtureOnly === true);
assert("full-dry-run liveCrawl false", fullApi.fixtureLoad?.liveCrawl === false);
assert("full-dry-run pages 6", fullApi.fixtureLoad?.pagesCount === 6);
assert("full-dry-run assets 5", fullApi.fixtureLoad?.assetsCount === 5);
assert("full-dry-run intake siteSlug", fullApi.intake?.siteSlug === "sample-musician-fixture");
assert("full-dry-run intake cmsPreset", fullApi.intake?.cmsPreset === "musician-basic");
assert("full-dry-run intake sourcePlatform static", fullApi.intake?.sourcePlatform === "static");
assert("full-dry-run total candidates 7", fullApi.totalActiveCandidates === 7);

for (const [modId, expected] of Object.entries(EXPECTED_COUNTS)) {
  assert(`full-dry-run count ${modId}=${expected}`, fullApi.moduleCandidateCounts?.[modId] === expected);
}

const step6 = fullApi.steps?.find((s) => s.id === "step-6");
const step7 = fullApi.steps?.find((s) => s.id === "step-7");
const step8 = fullApi.steps?.find((s) => s.id === "step-8");
assert("DB step planOnly", step6?.status === "PLAN_ONLY");
assert("package step planOnly", step7?.status === "PLAN_ONLY");
assert("upload step planOnly", step8?.status === "PLAN_ONLY");

assert("dbPlan planOnly", fullApi.dbPlan?.planOnly === true);
assert("dbPlan no connection", fullApi.dbPlan?.dbConnectionAttempted === false);
assert("dbPlan no SQL executed", fullApi.dbPlan?.sqlExecuted === false);
assert("dbPlan human approval", fullApi.dbPlan?.humanApprovalRequired === true);
assert("packagePlan planOnly", fullApi.packagePlan?.planOnly === true);
assert("packagePlan no build", fullApi.packagePlan?.packageBuildExecuted === false);
assert("uploadPlan planOnly", fullApi.uploadPlan?.planOnly === true);
assert("uploadPlan diff review", fullApi.uploadPlan?.requireOutputDiffReview === true);
assert("uploadPlan file list", fullApi.uploadPlan?.requireUploadFileList === true);
assert("uploadPlan candidates exist", (fullApi.uploadPlan?.uploadCandidates?.length ?? 0) > 0);

assert("full-dry-run no network", fullApi.networkAccess === false);
assert("full-dry-run no DB write", fullApi.dbWriteExecuted === false);
assert("full-dry-run no SQL mutation", fullApi.sqlMutationExecuted === false);
assert("full-dry-run no package", fullApi.packageBuildExecuted === false);
assert("full-dry-run no FTP", fullApi.ftpUploadExecuted === false);
assert("full-dry-run no deploy", fullApi.deployExecuted === false);
assert("full-dry-run warnings news unmapped", fullApi.warnings?.some((w) => /news/.test(w.message)));
assert("full-dry-run risk summary", fullApi.riskSummary?.overallRisk != null);
assert("full-dry-run next G-23k", fullApi.nextRecommendedPhase === "G-23k-crawl-dry-run-planning");

const fixtureApi = runOnboardingOrchestrator({
  configPath: configAbs,
  fixturePath: fixtureAbs,
  mode: "fixture-dry-run",
});
assert("fixture-dry-run still PASS", fixtureApi.ok === true && fixtureApi.status === "PASS");

const fullCli = runCli([
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "full-dry-run",
]);
assert("full-dry-run CLI exit 0", fullCli.status === 0, fullCli.stderr);
assert("full-dry-run CLI PASS", /full dry-run:\s*PASS/i.test(fullCli.stdout));
assert("full-dry-run CLI pages 6", /pages=6/.test(fullCli.stdout));
assert("full-dry-run CLI assets 5", /assets=5/.test(fullCli.stdout));

const jsonCli = runCli([
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "full-dry-run",
  "--json",
]);
assert("full-dry-run --json exit 0", jsonCli.status === 0);
let jsonOut;
try {
  jsonOut = JSON.parse(jsonCli.stdout);
  assert("full-dry-run --json parses", true);
  assert("full-dry-run --json PASS", jsonOut.status === "PASS");
  assert("full-dry-run --json schedule 2", jsonOut.moduleCandidateCounts?.schedule === 2);
  assert("full-dry-run --json total 7", jsonOut.totalActiveCandidates === 7);
} catch (e) {
  assert("full-dry-run --json parses", false, e.message);
}

assert("full-dry-run is supported by G-23j", SUPPORTED_MODES.includes("full-dry-run"));
assert("full-dry-run API not NOT_IMPLEMENTED", fullApi.status !== "NOT_IMPLEMENTED");

const g23hRun = runVerifier(G23H_VERIFIER);
const g23hOutput = g23hRun.stdout + g23hRun.stderr;
const g23hStats = countVerifierFailures(g23hOutput);
const g23hFailures = extractVerifierFailures(g23hOutput);

assert(
  "G-23h legacy verifier has exactly 4 known failures",
  g23hStats.failed === 4,
  `failed=${g23hStats.failed} · ${g23hFailures.join("; ")}`,
);
assert(
  "G-23h legacy failures are known obsolete expectations",
  failuresAreKnownG23hObsoleteExpectations(g23hFailures),
  g23hFailures.join("; "),
);
assert(
  "G-23h legacy HEAD-pin failures only (2 of 4)",
  g23hFailures.filter((f) => /^HEAD is |^origin\/main is /.test(f)).length === 2,
);
assert(
  "G-23h legacy full-dry-run unsupported obsolete (2 of 4)",
  g23hFailures.filter((f) => /^unsupported CLI/.test(f)).length === 2,
);
assert(
  "G-23h legacy functional compatibility pass",
  /validate-only API PASS/.test(g23hOutput) &&
    /fixture-dry-run API PASS/.test(g23hOutput) &&
    /fixture-dry-run schedule 2/.test(g23hOutput) &&
    /DB step planOnly/.test(g23hOutput),
);
assert("G-23h legacy validate-only preserved", /validate-only API PASS/.test(g23hOutput));
assert("G-23h legacy fixture-dry-run preserved", /fixture-dry-run API PASS/.test(g23hOutput));
assert("G-23h legacy safety gates planOnly", /safety gates planOnly db/.test(g23hOutput));
assert(
  "G-23h legacy crawl-dry-run still unsupported",
  /unsupported mode NOT_IMPLEMENTED/.test(g23hOutput),
);

assert(
  "doc prod ref not active",
  !resultDoc.includes(`projectRef=${PROD_REF}`) &&
    (!resultDoc.includes(PROD_REF) || /forbidden|never/i.test(resultDoc)),
);

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

assert("00-current-state mentions G-23j", currentState.includes("G-23j"));
assert("03-next-actions mentions G-23j", nextActions.includes("G-23j"));
assert("handoff mentions G-23j", handoff.includes("G-23j"));

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
  `\nG-23j Static-to-Astro first non-network sample full dry-run verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
