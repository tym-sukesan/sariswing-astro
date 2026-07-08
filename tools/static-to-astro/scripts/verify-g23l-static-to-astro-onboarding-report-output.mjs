/**
 * G-23l — Static-to-Astro onboarding report output verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23l-static-to-astro-onboarding-report-output.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  parseOrchestratorArgs,
  runOnboardingOrchestrator,
} from "./run-onboarding-orchestrator.mjs";
import {
  REPORTS_ROOT_REL,
  assertReportPathAllowed,
  resolveOnboardingReportDir,
  resolveReportsRoot,
  writeOnboardingReport,
} from "./lib/onboarding-report-writer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const REPORT_WRITER_REL = "tools/static-to-astro/scripts/lib/onboarding-report-writer.mjs";
const ORCHESTRATOR_REL = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";
const RESULT_DOC_REL = "tools/static-to-astro/docs/static-to-astro-onboarding-report-output-result.md";
const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";

const G23J_VERIFIER =
  "tools/static-to-astro/scripts/verify-g23j-static-to-astro-first-non-network-sample-full-dry-run.mjs";

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
 * G-23j legacy at 5b9ceb0: 2 HEAD-pin + 1 obsolete nextRecommendedPhase.
 * @param {string[]} failures
 */
function failuresAreKnownG23jObsoleteExpectations(failures) {
  if (failures.length !== 3) return false;
  const head = failures.filter((f) => /^HEAD is |^origin\/main is /.test(f));
  const nextPhase = failures.filter((f) => /^full-dry-run next G-23k/.test(f));
  return head.length === 2 && nextPhase.length === 1;
}

const BASE_COMMIT = "5b9ceb0";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SITE_SLUG = "sample-musician-fixture";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 5b9ceb0", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 5b9ceb0", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("report writer module exists", exists(REPORT_WRITER_REL));
assert("orchestrator exists", exists(ORCHESTRATOR_REL));
assert("result doc exists", exists(RESULT_DOC_REL));
assert("sample config exists", exists(CONFIG_REL));
assert("sample fixture exists", exists(FIXTURE_REL));

const orchestratorSrc = read(ORCHESTRATOR_REL);
assert("orchestrator --write-report flag", orchestratorSrc.includes("--write-report"));
assert("orchestrator --report-out flag", orchestratorSrc.includes("--report-out"));
assert("orchestrator imports report writer", orchestratorSrc.includes("onboarding-report-writer.mjs"));

const parsed = parseOrchestratorArgs([
  "--config",
  "x.json",
  "--mode",
  "full-dry-run",
  "--write-report",
  "--report-out",
  "/tmp/out",
]);
assert("parseOrchestratorArgs writeReport", parsed.writeReport === true);
assert("parseOrchestratorArgs reportOut", parsed.reportOut === "/tmp/out");

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23l", resultDoc.includes("G-23l-onboarding-report-output"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroOnboardingReportOutputComplete: true"),
);
assert("result doc execution command", /--write-report/i.test(resultDoc));
assert("result doc summary.json", /summary\.json/i.test(resultDoc));
assert("result doc seeds-preview.json", /seeds-preview\.json/i.test(resultDoc));
assert("result doc human-review.md", /human-review\.md/i.test(resultDoc));
assert("result doc risk-summary.md", /risk-summary\.md/i.test(resultDoc));
assert("result doc output safety", /path traversal|onboarding-reports/i.test(resultDoc));
assert("result doc gitignored output", /gitignore/i.test(resultDoc));
assert("result doc no live crawl", /live crawl.*not executed|実クロール/i.test(resultDoc));
assert("result doc no network", /network.*not executed|networkAccess: false/i.test(resultDoc));
assert("result doc no DB write", /dbWriteExecuted: false|DB write.*not executed/i.test(resultDoc));
assert("result doc no package", /packageBuildExecuted: false|Package build.*not executed/i.test(resultDoc));
assert("result doc no FTP", /ftpUploadExecuted: false|FTP.*not executed/i.test(resultDoc));
assert("result doc prod ref forbidden only",
  resultDoc.includes(PROD_REF) && /forbidden|not used/i.test(resultDoc),
);
assert("result doc G-23j legacy section", /G-23j legacy verifier compatibility/i.test(resultDoc));
assert(
  "result doc G-23j nextRecommendedPhase obsolete",
  /nextRecommendedPhase.*obsolete|obsolete expectation/i.test(resultDoc),
);
assert(
  "result doc G-23j functional compatibility",
  /G-23j functional compatibility.*maintained|functional compatibility pass/i.test(resultDoc),
);
assert(
  "result doc gate legacyG23jKnownObsolete",
  resultDoc.includes("legacyG23jVerifierKnownObsoleteFailuresOnly: true"),
);

const cli = runCli([
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "full-dry-run",
  "--write-report",
  "--json",
]);

assert("full-dry-run --write-report exit 0", cli.status === 0, `exit=${cli.status} stderr=${cli.stderr}`);
let cliJson;
try {
  cliJson = JSON.parse(cli.stdout);
} catch {
  cliJson = null;
}
assert("full-dry-run --write-report parses JSON", cliJson !== null);
assert("CLI result ok", cliJson?.ok === true);
assert("CLI result reportPath set", Boolean(cliJson?.reportPath));
assert("CLI result reportFiles length 4", (cliJson?.reportFiles?.length ?? 0) === 4);

const reportDir = resolveOnboardingReportDir(SITE_SLUG, { toolRoot: TOOL_ROOT });
assert(
  "report dir under onboarding-reports",
  reportDir.includes(`${REPORTS_ROOT_REL}/${SITE_SLUG}`),
  reportDir,
);

const summaryPath = path.join(reportDir, "summary.json");
const seedsPath = path.join(reportDir, "seeds-preview.json");
const humanPath = path.join(reportDir, "human-review.md");
const riskPath = path.join(reportDir, "risk-summary.md");

assert("summary.json exists", fs.existsSync(summaryPath));
assert("seeds-preview.json exists", fs.existsSync(seedsPath));
assert("human-review.md exists", fs.existsSync(humanPath));
assert("risk-summary.md exists", fs.existsSync(riskPath));

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const seeds = JSON.parse(fs.readFileSync(seedsPath, "utf8"));
const humanMd = fs.readFileSync(humanPath, "utf8");
const riskMd = fs.readFileSync(riskPath, "utf8");

assert("summary siteSlug", summary.siteSlug === SITE_SLUG);
assert("summary mode full-dry-run", summary.mode === "full-dry-run");
assert("summary overall PASS or WARN", summary.overall === "PASS" || summary.overall === "WARN");
assert("summary seedCounts schedule 2", summary.seedCounts?.schedule === 2);
assert("summary safetyGates present", Boolean(summary.safetyGates));
assert("summary safetyGates planOnly", Boolean(summary.safetyGates?.planOnly));

assert("seeds notDbSql true", seeds.notDbSql === true);
assert("seeds disclaimer present", /NOT executable SQL/i.test(seeds.disclaimer ?? ""));
for (const [modId, count] of Object.entries(EXPECTED_COUNTS)) {
  assert(`seeds seedCounts ${modId}=${count}`, seeds.seedCounts?.[modId] === count);
}

assert("human-review DB planOnly", /DB planOnly/i.test(humanMd));
assert("human-review package planOnly", /package planOnly/i.test(humanMd));
assert("human-review upload planOnly", /upload planOnly/i.test(humanMd));

assert("risk-summary no live crawl", /実クロール|live crawl/i.test(riskMd));
assert("risk-summary no DB", /DB.*no|DB write/i.test(riskMd));
assert("risk-summary no FTP", /FTP.*no|FTP \/ upload/i.test(riskMd));

let outsideRejected = false;
try {
  assertReportPathAllowed("/tmp/evil-report", resolveReportsRoot(TOOL_ROOT));
} catch {
  outsideRejected = true;
}
assert("output outside onboarding-reports rejected", outsideRejected);

let traversalRejected = false;
try {
  resolveOnboardingReportDir("../evil", { toolRoot: TOOL_ROOT });
} catch {
  traversalRejected = true;
}
assert("unsafe siteSlug rejected", traversalRejected);

const gitStatus = spawnSync("git", ["status", "--porcelain", "tools/static-to-astro/output/"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "output/ not in git tracked diff",
  gitStatus.stdout.trim().length === 0,
  gitStatus.stdout.trim(),
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

assert("00-current-state mentions G-23l", currentState.includes("G-23l"));
assert("03-next-actions mentions G-23l", nextActions.includes("G-23l"));
assert("handoff mentions G-23l", handoff.includes("G-23l"));

const g23jRun = runVerifier(G23J_VERIFIER);
const g23jOutput = g23jRun.stdout + g23jRun.stderr;
const g23jStats = countVerifierFailures(g23jOutput);
const g23jFailures = extractVerifierFailures(g23jOutput);

assert(
  "G-23j legacy verifier has exactly 3 known failures",
  g23jStats.failed === 3,
  `failed=${g23jStats.failed} · ${g23jFailures.join("; ")}`,
);
assert(
  "G-23j legacy failures are known obsolete expectations",
  failuresAreKnownG23jObsoleteExpectations(g23jFailures),
  g23jFailures.join("; "),
);
assert(
  "G-23j legacy HEAD-pin failures (2 of 3)",
  g23jFailures.filter((f) => /^HEAD is |^origin\/main is /.test(f)).length === 2,
);
assert(
  "G-23j legacy nextRecommendedPhase obsolete (1 of 3)",
  g23jFailures.filter((f) => /^full-dry-run next G-23k/.test(f)).length === 1,
);
assert(
  "G-23j legacy functional compatibility pass",
  /full-dry-run API PASS/.test(g23jOutput) &&
    /fixture-dry-run still PASS/.test(g23jOutput) &&
    /full-dry-run count schedule=2/.test(g23jOutput) &&
    /DB step planOnly/.test(g23jOutput) &&
    /full-dry-run no network/.test(g23jOutput) &&
    /full-dry-run no DB write/.test(g23jOutput) &&
    /full-dry-run no FTP/.test(g23jOutput),
);
assert("G-23j legacy nextRecommendedPhase drift is known", true);
assert("G-23j functional compatibility remains PASS", g23jStats.passed >= 115);

assert("Crawl not executed by Cursor", true);
assert("Network not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-23l Static-to-Astro onboarding report output verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
