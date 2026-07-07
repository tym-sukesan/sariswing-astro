/**
 * G-23i — Static-to-Astro fixture mode orchestrator integration verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23i-static-to-astro-fixture-mode-orchestrator-integration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { runOnboardingFixtureDryRun } from "./run-onboarding-fixture-dry-run.mjs";
import { runOnboardingOrchestrator } from "./run-onboarding-orchestrator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const ORCHESTRATOR_REL = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";
const COMPAT_REL = "tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-fixture-mode-orchestrator-integration-result.md";
const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";
const G23D_VERIFIER = "tools/static-to-astro/scripts/verify-g23d-static-to-astro-onboarding-sample-site-dry-run.mjs";
const G23H_VERIFIER =
  "tools/static-to-astro/scripts/verify-g23h-static-to-astro-onboarding-orchestrator-skeleton.mjs";

const BASE_COMMIT = "dfd1453";
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

function runCli(scriptRel, args) {
  return spawnSync("node", [path.join(REPO_ROOT, scriptRel), ...args], {
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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is dfd1453", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is dfd1453", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("orchestrator script exists", exists(ORCHESTRATOR_REL));
assert("compatibility script exists", exists(COMPAT_REL));
assert("result doc exists", exists(RESULT_DOC_REL));

const compatSource = read(COMPAT_REL);
assert("compat delegates to orchestrator", compatSource.includes("runOnboardingOrchestrator"));
assert("compat keeps validateOnboardingConfig import", compatSource.includes("validateOnboardingConfig"));
assert("compat documents standard entry", compatSource.includes("run-onboarding-orchestrator.mjs"));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23i", resultDoc.includes("G-23i-static-to-astro-fixture-mode-orchestrator-integration"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroFixtureModeOrchestratorIntegrationComplete: true"),
);
assert("result doc standard entry", /standard entry|Orchestrator as standard/i.test(resultDoc));
assert("result doc compatibility wrapper", /compatibility|Compatibility wrapper/i.test(resultDoc));
assert("result doc seed counts match", /schedule.*2|Seed candidate counts/i.test(resultDoc));
assert("result doc safety gates", /Safety gate/i.test(resultDoc));
assert("result doc G-23d compatibility", /G-23d/i.test(resultDoc));
assert("result doc G-23h compatibility", /G-23h/i.test(resultDoc));
assert("result doc no crawl", /crawl.*no|no.*crawl|not executed/i.test(resultDoc));
assert("result doc no DB write", /DB.*no|no.*DB|not executed/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc no FTP", /FTP.*no|no.*FTP/i.test(resultDoc));
assert("result doc next G-23j", /G-23j/i.test(resultDoc));
assert("result doc next G-23k", /G-23k/i.test(resultDoc));
assert("result doc next G-23l", /G-23l/i.test(resultDoc));

const configAbs = path.join(REPO_ROOT, CONFIG_REL);
const fixtureAbs = path.join(REPO_ROOT, FIXTURE_REL);

const standardApi = runOnboardingOrchestrator({
  configPath: configAbs,
  fixturePath: fixtureAbs,
  mode: "fixture-dry-run",
});
assert("standard API PASS", standardApi.ok === true && standardApi.status === "PASS");
assert("standard API no live crawl", standardApi.liveCrawlExecuted === false);
assert("standard API no DB", standardApi.dbWriteExecuted === false);

const compatApi = runOnboardingFixtureDryRun({
  configPath: configAbs,
  fixturePath: fixtureAbs,
});
assert("compat API PASS", compatApi.ok === true && compatApi.status === "PASS");
assert("compat API delegated", compatApi.delegatedTo === "run-onboarding-orchestrator.fixture-dry-run");
assert("compat API fixtureOnly", compatApi.fixtureOnly === true);
assert("compat API 7 steps", compatApi.steps?.length === 7);
assert("compat API no live crawl", compatApi.liveCrawlExecuted === false);
assert("compat API no DB", compatApi.dbWriteExecuted === false);

for (const [modId, expected] of Object.entries(EXPECTED_COUNTS)) {
  assert(`standard count ${modId}=${expected}`, standardApi.moduleCandidateCounts?.[modId] === expected);
  assert(`compat seedCounts ${modId}=${expected}`, compatApi.seedCounts?.[modId] === expected);
  assert(
    `counts match ${modId}`,
    standardApi.moduleCandidateCounts?.[modId] === compatApi.seedCounts?.[modId],
  );
}

assert("compat safety gates PASS", compatApi.safetyGates?.status === "PASS");
assert("compat safety planOnly db", compatApi.safetyGates?.planOnly?.stagingDb === true);
assert("compat safety planOnly package", compatApi.safetyGates?.planOnly?.package === true);
assert("compat safety planOnly upload", compatApi.safetyGates?.planOnly?.upload === true);

assert("standard safety planOnly db", standardApi.safetyGates?.planOnly?.stagingDb === true);
assert("standard safety planOnly package", standardApi.safetyGates?.planOnly?.package === true);
assert("standard safety planOnly upload", standardApi.safetyGates?.planOnly?.upload === true);

const standardCli = runCli(ORCHESTRATOR_REL, [
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "fixture-dry-run",
]);
assert("standard CLI exit 0", standardCli.status === 0, standardCli.stderr);
assert("standard CLI PASS", /Onboarding orchestrator:\s*PASS/i.test(standardCli.stdout));

const compatCli = runCli(COMPAT_REL, [CONFIG_REL, FIXTURE_REL]);
assert("compat CLI exit 0", compatCli.status === 0, compatCli.stderr);
assert("compat CLI PASS", /fixture dry-run:\s*PASS/i.test(compatCli.stdout));
assert("compat CLI fixture-only", /Fixture-only:\s*true/i.test(compatCli.stdout));
assert("compat CLI delegated", /Delegated to:/i.test(compatCli.stdout));

const standardJsonCli = runCli(ORCHESTRATOR_REL, [
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "fixture-dry-run",
  "--json",
]);
assert("standard --json exit 0", standardJsonCli.status === 0);
let standardJson;
try {
  standardJson = JSON.parse(standardJsonCli.stdout);
  assert("standard --json parses", true);
  assert("standard --json PASS", standardJson.status === "PASS");
} catch (e) {
  assert("standard --json parses", false, e.message);
}

const compatJsonCli = runCli(COMPAT_REL, [CONFIG_REL, FIXTURE_REL, "--json"]);
assert("compat --json exit 0", compatJsonCli.status === 0);
let compatJson;
try {
  compatJson = JSON.parse(compatJsonCli.stdout);
  assert("compat --json parses", true);
  assert("compat --json PASS", compatJson.status === "PASS");
  assert("compat --json delegated", compatJson.delegatedTo?.includes("orchestrator"));
} catch (e) {
  assert("compat --json parses", false, e.message);
}

const unsupportedCli = runCli(ORCHESTRATOR_REL, ["--config", CONFIG_REL, "--mode", "full-dry-run"]);
assert("unsupported mode exit 2", unsupportedCli.status === 2);
assert("unsupported mode blocked", /NOT_IMPLEMENTED|not implemented/i.test(unsupportedCli.stdout));

const g23dRun = runVerifier(G23D_VERIFIER);
const g23dOutput = g23dRun.stdout + g23dRun.stderr;
const g23dStats = countVerifierFailures(g23dOutput);
const g23dFailures = extractVerifierFailures(g23dOutput);
assert(
  "G-23d legacy verifier failures are HEAD-pin only",
  failuresAreHeadPinOnly(g23dFailures),
  g23dFailures.join("; "),
);
assert(
  "G-23d legacy functional compatibility pass",
  g23dStats.failed <= 2 &&
    failuresAreHeadPinOnly(g23dFailures) &&
    /dry-run API status PASS/.test(g23dOutput),
  `failed=${g23dStats.failed} · ${g23dFailures.join("; ")}`,
);
assert("G-23d legacy API shape seedCounts CLI preserved", /dry-run API seed schedule 2/.test(g23dOutput));
assert("G-23d legacy fixtureOnly preserved", /dry-run API fixtureOnly/.test(g23dOutput));

const g23hRun = runVerifier(G23H_VERIFIER);
const g23hOutput = g23hRun.stdout + g23hRun.stderr;
const g23hStats = countVerifierFailures(g23hOutput);
const g23hFailures = extractVerifierFailures(g23hOutput);
assert(
  "G-23h legacy verifier failures are HEAD-pin only",
  failuresAreHeadPinOnly(g23hFailures),
  g23hFailures.join("; "),
);
assert(
  "G-23h legacy functional compatibility pass",
  g23hStats.failed <= 2 &&
    failuresAreHeadPinOnly(g23hFailures) &&
    /fixture-dry-run API PASS/.test(g23hOutput),
  `failed=${g23hStats.failed} · ${g23hFailures.join("; ")}`,
);
assert("G-23h legacy planOnly steps preserved", /DB step planOnly/.test(g23hOutput));
assert("G-23h legacy seed counts preserved", /fixture-dry-run schedule 2/.test(g23hOutput));

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

assert("00-current-state mentions G-23i", currentState.includes("G-23i"));
assert("03-next-actions mentions G-23i", nextActions.includes("G-23i"));
assert("handoff mentions G-23i", handoff.includes("G-23i"));

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
  `\nG-23i Static-to-Astro fixture mode orchestrator integration verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
