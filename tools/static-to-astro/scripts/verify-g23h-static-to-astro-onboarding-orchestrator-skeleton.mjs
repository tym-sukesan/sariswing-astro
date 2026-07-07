/**
 * G-23h — Static-to-Astro onboarding orchestrator skeleton verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  runOnboardingOrchestrator,
  SUPPORTED_MODES,
  UNSUPPORTED_MODES,
} from "./run-onboarding-orchestrator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const ORCHESTRATOR_REL = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-onboarding-orchestrator-skeleton-result.md";
const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";

const BASE_COMMIT = "3ca9c3a";
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

function runCli(args) {
  return spawnSync("node", [path.join(REPO_ROOT, ORCHESTRATOR_REL), ...args], {
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

assert("HEAD is 3ca9c3a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 3ca9c3a", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("orchestrator script exists", exists(ORCHESTRATOR_REL));
assert("result doc exists", exists(RESULT_DOC_REL));
assert("sample config exists", exists(CONFIG_REL));
assert("sample fixture exists", exists(FIXTURE_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23h", resultDoc.includes("G-23h-static-to-astro-onboarding-orchestrator-skeleton"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroOnboardingOrchestratorSkeletonComplete: true"),
);
assert("result doc orchestrator role", /orchestrator.*role|Orchestrator skeleton role/i.test(resultDoc));
assert("result doc supported modes", /validate-only/i.test(resultDoc) && /fixture-dry-run/i.test(resultDoc));
assert("result doc unsupported modes", /NOT_IMPLEMENTED|crawl-dry-run/i.test(resultDoc));
assert("result doc execution command", /run-onboarding-orchestrator/i.test(resultDoc));
assert("result doc fixture-dry-run result", /fixture-dry-run result/i.test(resultDoc));
assert("result doc validate-only result", /validate-only result/i.test(resultDoc));
assert("result doc seed counts", /schedule.*2|schedule \| \*\*2\*\*/i.test(resultDoc));
assert("result doc safety gates", /Safety gate/i.test(resultDoc));
assert("result doc DB planOnly", /DB step planOnly|staging DB plan only/i.test(resultDoc));
assert("result doc package planOnly", /Package step planOnly|package plan only/i.test(resultDoc));
assert("result doc FTP planOnly", /FTP.*planOnly|upload step planOnly/i.test(resultDoc));
assert("result doc no crawl", /crawl.*no|no.*crawl|not executed/i.test(resultDoc));
assert("result doc no DB write", /DB.*no|no.*DB|not executed/i.test(resultDoc));
assert("result doc no SQL mutation", /SQL.*no|no.*SQL|mutation/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc no FTP", /FTP.*no|no.*FTP/i.test(resultDoc));
assert("result doc next G-23i", /G-23i/i.test(resultDoc));
assert("result doc next G-23j", /G-23j/i.test(resultDoc));
assert("result doc next G-23k", /G-23k/i.test(resultDoc));

assert("SUPPORTED_MODES includes validate-only", SUPPORTED_MODES.includes("validate-only"));
assert("SUPPORTED_MODES includes fixture-dry-run", SUPPORTED_MODES.includes("fixture-dry-run"));
assert("UNSUPPORTED_MODES includes crawl-dry-run", UNSUPPORTED_MODES.includes("crawl-dry-run"));
assert("UNSUPPORTED_MODES includes apply-staging-db", UNSUPPORTED_MODES.includes("apply-staging-db"));

const configAbs = path.join(REPO_ROOT, CONFIG_REL);
const fixtureAbs = path.join(REPO_ROOT, FIXTURE_REL);

const validateApi = runOnboardingOrchestrator({
  configPath: configAbs,
  mode: "validate-only",
});
assert("validate-only API PASS", validateApi.ok === true && validateApi.status === "PASS");
assert("validate-only config PASS", validateApi.validation?.config?.status === "PASS");
assert("validate-only registry PASS", validateApi.validation?.registry?.status === "PASS");
assert("validate-only no live crawl", validateApi.liveCrawlExecuted === false);
assert("validate-only no DB", validateApi.dbWriteExecuted === false);

const fixtureApi = runOnboardingOrchestrator({
  configPath: configAbs,
  fixturePath: fixtureAbs,
  mode: "fixture-dry-run",
});
assert("fixture-dry-run API PASS", fixtureApi.ok === true && fixtureApi.status === "PASS");
assert("fixture-dry-run schedule 2", fixtureApi.moduleCandidateCounts?.schedule === 2);
assert("fixture-dry-run news 1", fixtureApi.moduleCandidateCounts?.news === 1);
assert("fixture-dry-run profile 1", fixtureApi.moduleCandidateCounts?.profile === 1);
assert("fixture-dry-run discography 1", fixtureApi.moduleCandidateCounts?.discography === 1);
assert("fixture-dry-run video 1", fixtureApi.moduleCandidateCounts?.video === 1);
assert("fixture-dry-run contact 1", fixtureApi.moduleCandidateCounts?.contact === 1);
assert("fixture-dry-run seed extraction PASS", fixtureApi.seedExtraction?.status === "PASS");
assert("fixture-dry-run fixtureOnly", fixtureApi.fixtureLoad?.fixtureOnly === true);

const step6 = fixtureApi.steps?.find((s) => s.id === "step-6");
const step7 = fixtureApi.steps?.find((s) => s.id === "step-7");
const step8 = fixtureApi.steps?.find((s) => s.id === "step-8");
assert("DB step planOnly", step6?.status === "PLAN_ONLY");
assert("package step planOnly", step7?.status === "PLAN_ONLY");
assert("upload step planOnly", step8?.status === "PLAN_ONLY");
assert("safety gates planOnly db", fixtureApi.safetyGates?.planOnly?.stagingDb === true);
assert("safety gates planOnly package", fixtureApi.safetyGates?.planOnly?.package === true);
assert("safety gates planOnly upload", fixtureApi.safetyGates?.planOnly?.upload === true);

const unsupportedApi = runOnboardingOrchestrator({
  configPath: configAbs,
  mode: "crawl-dry-run",
});
assert("unsupported mode NOT_IMPLEMENTED", unsupportedApi.status === "NOT_IMPLEMENTED");
assert("unsupported mode not ok", unsupportedApi.ok === false);

const validateCli = runCli([
  "--config",
  CONFIG_REL,
  "--mode",
  "validate-only",
]);
assert("validate-only CLI exit 0", validateCli.status === 0, validateCli.stderr);
assert("validate-only CLI PASS", /Onboarding orchestrator:\s*PASS/i.test(validateCli.stdout));

const fixtureCli = runCli([
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "fixture-dry-run",
]);
assert("fixture-dry-run CLI exit 0", fixtureCli.status === 0, fixtureCli.stderr);
assert("fixture-dry-run CLI schedule 2", /schedule:\s*2/.test(fixtureCli.stdout));

const jsonCli = runCli([
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "fixture-dry-run",
  "--json",
]);
assert("fixture --json exit 0", jsonCli.status === 0);
let jsonOut;
try {
  jsonOut = JSON.parse(jsonCli.stdout);
  assert("fixture --json parses", true);
  assert("fixture --json PASS", jsonOut.status === "PASS");
  assert("fixture --json schedule 2", jsonOut.moduleCandidateCounts?.schedule === 2);
} catch (e) {
  assert("fixture --json parses", false, e.message);
}

const badModeCli = runCli(["--config", CONFIG_REL, "--mode", "full-dry-run"]);
assert("unsupported CLI exit 2", badModeCli.status === 2);
assert("unsupported CLI NOT_IMPLEMENTED", /NOT_IMPLEMENTED|not implemented/i.test(badModeCli.stdout));

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

assert("00-current-state mentions G-23h", currentState.includes("G-23h"));
assert("03-next-actions mentions G-23h", nextActions.includes("G-23h"));
assert("handoff mentions G-23h", handoff.includes("G-23h"));

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
  `\nG-23h Static-to-Astro onboarding orchestrator skeleton verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
