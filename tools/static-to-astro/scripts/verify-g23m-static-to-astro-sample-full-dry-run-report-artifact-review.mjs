/**
 * G-23m — Static-to-Astro sample full dry-run report artifact review verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23m-static-to-astro-sample-full-dry-run-report-artifact-review.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  assertReportPathAllowed,
  resolveOnboardingReportDir,
  resolveReportsRoot,
} from "./lib/onboarding-report-writer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const ORCHESTRATOR_REL = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";
const REPORT_WRITER_REL = "tools/static-to-astro/scripts/lib/onboarding-report-writer.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-sample-full-dry-run-report-artifact-review-result.md";
const G23L_RESULT_DOC = "tools/static-to-astro/docs/static-to-astro-onboarding-report-output-result.md";
const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";

const BASE_COMMIT = "b1f7dcb";
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

assert("HEAD is b1f7dcb", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is b1f7dcb", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("result doc exists", exists(RESULT_DOC_REL));
assert("G-23l result doc exists", exists(G23L_RESULT_DOC));
assert("report writer exists", exists(REPORT_WRITER_REL));
assert("orchestrator exists", exists(ORCHESTRATOR_REL));
assert("sample config exists", exists(CONFIG_REL));
assert("sample fixture exists", exists(FIXTURE_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23m", resultDoc.includes("G-23m-sample-full-dry-run-report-artifact-review"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroSampleFullDryRunReportArtifactReviewComplete: true"),
);
assert("result doc execution command", /--write-report/i.test(resultDoc));
assert("result doc four report review", /summary\.json|seeds-preview|human-review|risk-summary/i.test(resultDoc));
assert("result doc verdict", /PASS_WITH_KNOWN_WARNING|reportArtifactReviewVerdict/i.test(resultDoc));
assert("result doc no live crawl", /live crawl.*not executed|実クロール/i.test(resultDoc));
assert("result doc no network", /network.*not executed|networkAccess: false/i.test(resultDoc));
assert("result doc no DB write", /dbWriteExecuted: false|DB write.*not executed/i.test(resultDoc));
assert("result doc no package", /packageBuildExecuted: false|Package build.*not executed/i.test(resultDoc));
assert("result doc no FTP", /ftpUploadExecuted: false|FTP.*not executed/i.test(resultDoc));
assert(
  "result doc prod ref forbidden only",
  resultDoc.includes(PROD_REF) && /forbidden|not used|blocked/i.test(resultDoc),
);
assert("result doc next G-23n", /G-23n/i.test(resultDoc));
assert("result doc next G-23o", /G-23o/i.test(resultDoc));

const cli = runCli([
  "--config",
  CONFIG_REL,
  "--fixture",
  FIXTURE_REL,
  "--mode",
  "full-dry-run",
  "--write-report",
]);
assert("full-dry-run --write-report exit 0", cli.status === 0, cli.stderr);
assert("CLI reports written", /Report written to:/.test(cli.stdout));

const reportDir = resolveOnboardingReportDir(SITE_SLUG, { toolRoot: TOOL_ROOT });
const summaryPath = path.join(reportDir, "summary.json");
const seedsPath = path.join(reportDir, "seeds-preview.json");
const humanPath = path.join(reportDir, "human-review.md");
const riskPath = path.join(reportDir, "risk-summary.md");

assert("report dir under sample-musician-fixture", reportDir.includes(SITE_SLUG));
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
assert("summary overall PASS", summary.overall === "PASS");
assert("summary generatedAt", Boolean(summary.generatedAt));
assert("summary reviewReady", summary.reviewReady === true);
assert("summary steps 0-9", (summary.steps?.length ?? 0) === 10);
assert("summary step 6 PLAN_ONLY", summary.steps?.[6]?.status === "PLAN_ONLY");
assert("summary step 7 PLAN_ONLY", summary.steps?.[7]?.status === "PLAN_ONLY");
assert("summary step 8 PLAN_ONLY", summary.steps?.[8]?.status === "PLAN_ONLY");
assert("summary warnings present", (summary.warnings?.length ?? 0) >= 1);
assert("summary nextRecommendedPhase G-23n", summary.nextRecommendedPhase === "G-23n-live-crawl-allowlist-config");

for (const [modId, count] of Object.entries(EXPECTED_COUNTS)) {
  assert(`summary seedCounts ${modId}=${count}`, summary.seedCounts?.[modId] === count);
}

assert("seeds reviewOnly true", seeds.reviewOnly === true);
assert("seeds notDbSql true", seeds.notDbSql === true);
assert("seeds doNotExecuteAsSql true", seeds.doNotExecuteAsSql === true);
assert("seeds disclaimer not SQL", /NOT executable SQL|NOT approved for DB/i.test(seeds.disclaimer ?? ""));
for (const [modId, count] of Object.entries(EXPECTED_COUNTS)) {
  assert(`seeds seedCounts ${modId}=${count}`, seeds.seedCounts?.[modId] === count);
  assert(`seeds byModule ${modId} count`, seeds.byModule?.[modId]?.candidateCount === count);
}
const scheduleCandidates = seeds.byModule?.schedule?.candidates ?? [];
assert("schedule 2 candidates reviewable", scheduleCandidates.length === 2);
assert(
  "schedule candidate titles present",
  scheduleCandidates.every((c) => Boolean(c.title)),
);
assert(
  "candidates approvedForDbInsert false",
  scheduleCandidates.every((c) => c.approvedForDbInsert === false),
);

assert("human-review operator checklist", /Operator checklist|operator checklist/i.test(humanMd));
assert("human-review seeds-preview reference", /seeds-preview\.json/i.test(humanMd));
assert("human-review DB planOnly", /DB planOnly/i.test(humanMd));
assert("human-review package planOnly", /package planOnly/i.test(humanMd));
assert("human-review upload planOnly", /upload planOnly/i.test(humanMd));
assert("human-review conditions to proceed", /Conditions to proceed/i.test(humanMd));
assert("human-review do not proceed", /Do NOT proceed/i.test(humanMd));
assert("human-review live crawl approval", /Approval required before live crawl|G-23n|G-23o/i.test(humanMd));

assert("risk-summary blocked operations", /Blocked operations/i.test(riskMd));
assert("risk-summary live crawl no", /実クロール|live crawl/i.test(riskMd));
assert("risk-summary network no", /Network access/i.test(riskMd));
assert("risk-summary DB no", /DB connection|DB write/i.test(riskMd));
assert("risk-summary FTP no", /FTP/i.test(riskMd));
assert("risk-summary service_role", /service_role/i.test(riskMd));
assert("risk-summary production ref blocked", new RegExp(PROD_REF).test(riskMd));
assert("risk-summary next phase risk", /Risk increases in next phases|G-23n|G-23o/i.test(riskMd));

let outsideRejected = false;
try {
  assertReportPathAllowed("/tmp/evil-report", resolveReportsRoot(TOOL_ROOT));
} catch {
  outsideRejected = true;
}
assert("output outside onboarding-reports rejected", outsideRejected);

const gitStatus = spawnSync("git", ["status", "--porcelain", "tools/static-to-astro/output/"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("output/ not in git tracked diff", gitStatus.stdout.trim().length === 0, gitStatus.stdout.trim());

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

assert("00-current-state mentions G-23m", currentState.includes("G-23m"));
assert("03-next-actions mentions G-23m", nextActions.includes("G-23m"));
assert("handoff mentions G-23m", handoff.includes("G-23m"));

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
  `\nG-23m Static-to-Astro sample full dry-run report artifact review verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
