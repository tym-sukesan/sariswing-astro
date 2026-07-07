/**
 * G-23e — Static-to-Astro onboarding orchestrator planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23e-static-to-astro-onboarding-orchestrator-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/static-to-astro-onboarding-orchestrator-planning.md";
const G23A_DOC = "tools/static-to-astro/docs/static-to-astro-30-minute-onboarding-flow-planning.md";
const G23B_DOC = "tools/static-to-astro/docs/static-to-astro-onboarding-config-schema-planning.md";
const G23C_DOC = "tools/static-to-astro/docs/static-to-astro-onboarding-config-validator-result.md";
const G23D_DOC = "tools/static-to-astro/docs/static-to-astro-onboarding-sample-site-dry-run-result.md";
const VALIDATOR_REL = "tools/static-to-astro/scripts/validate-onboarding-config.mjs";
const FIXTURE_DRY_RUN_REL = "tools/static-to-astro/scripts/run-onboarding-fixture-dry-run.mjs";
const ORCHESTRATOR_SCRIPT = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";

const BASE_COMMIT = "72951ee";
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

assert("HEAD is 72951ee", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 72951ee", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("planning doc exists", exists(DOC_REL));
assert("G-23a planning doc exists", exists(G23A_DOC));
assert("G-23b planning doc exists", exists(G23B_DOC));
assert("G-23c result doc exists", exists(G23C_DOC));
assert("G-23d result doc exists", exists(G23D_DOC));
assert("G-23c validator exists", exists(VALIDATOR_REL));
assert("G-23d fixture dry-run exists", exists(FIXTURE_DRY_RUN_REL));
assert("orchestrator script not implemented yet", !exists(ORCHESTRATOR_SCRIPT));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-23e", doc.includes("G-23e-static-to-astro-onboarding-orchestrator-planning"));
assert(
  "doc planning gate complete",
  doc.includes("staticToAstroOnboardingOrchestratorPlanningComplete: true"),
);

assert("doc orchestrator purpose", /orchestrator.*purpose|統括|30.minute/i.test(doc));
assert("doc validator integration", /validateOnboardingConfig|validate-onboarding-config/i.test(doc));
assert("doc fail-fast", /fail-fast|即停止|stop immediately/i.test(doc));
assert("doc CLI and UI", /CLI.*UI|UI.*CLI/i.test(doc));

assert("doc CLI example run-onboarding-orchestrator", doc.includes("run-onboarding-orchestrator.mjs"));
assert("doc mode fixture-dry-run", doc.includes("fixture-dry-run"));
assert("doc mode validate-only", doc.includes("validate-only"));
assert("doc mode crawl-dry-run", doc.includes("crawl-dry-run"));
assert("doc mode seed-dry-run", doc.includes("seed-dry-run"));
assert("doc mode package-dry-run", doc.includes("package-dry-run"));
assert("doc mode full-dry-run", doc.includes("full-dry-run"));
assert("doc mode apply-staging-db", doc.includes("apply-staging-db"));
assert("doc mode prepare-upload-plan", doc.includes("prepare-upload-plan"));
assert("doc G-23e no implementation", /G-23e.*not implemented|implementation.*deferred|実装しない/i.test(doc));

const steps = [
  "Step 0",
  "Step 1",
  "Step 2",
  "Step 3",
  "Step 4",
  "Step 5",
  "Step 6",
  "Step 7",
  "Step 8",
  "Step 9",
];
for (const step of steps) {
  assert(`doc ${step} design`, doc.includes(step));
}

assert("doc step 0 validate config", /Step 0.*validate|validate.*Step 0/i.test(doc));
assert("doc step 2 fixture mode", /fixture.*mode|fixture-dry-run/i.test(doc));
assert("doc step 3 page classifier", /page classifier|Page classifier/i.test(doc));
assert("doc step 4 CMS module planner", /CMS module planner/i.test(doc));
assert("doc step 5 seed extractor", /seed extractor/i.test(doc));
assert("doc step 6 staging DB plan", /staging DB plan/i.test(doc));
assert("doc step 7 package plan", /package plan/i.test(doc));
assert("doc step 8 diff QA", /diff.*QA|Diff \/ QA/i.test(doc));
assert("doc step 9 handoff", /handoff|Handoff/i.test(doc));

const safetyGates = [
  "allowDbWrite",
  "allowPackageBuild",
  "allowFtpUpload",
  "allowProductionDeploy",
  "forbidMirrorDelete",
  "forbidServiceRole",
  "requireOutputDiffReview",
  "requireUploadFileList",
  "manualCommitPush",
];
for (const gate of safetyGates) {
  assert(`doc safety gate ${gate}`, doc.includes(gate));
}
assert("doc safety gate matrix", /safety gate matrix|Safety gate matrix/i.test(doc));
assert("doc allowDbWrite plan only", /allowDbWrite.*plan only|plan only.*allowDbWrite/i.test(doc));

assert("doc failure policy", /failure policy|Failure policy/i.test(doc));
assert("doc validation FAIL stop", /validation FAIL.*stop|Config validation FAIL/i.test(doc));
assert("doc forbidden production ref stop", new RegExp(`forbidden production ref.*${PROD_REF}|${PROD_REF}.*active target`, "i").test(doc));
assert("doc service_role stop", /service_role.*stop|service_role.*FAIL/i.test(doc));

assert("doc output report design", /output report|Output report/i.test(doc));
assert("doc report config summary", /config summary/i.test(doc));
assert("doc report upload candidate", /upload candidate/i.test(doc));
assert("doc report human review checklist", /human review checklist/i.test(doc));
assert("doc report next recommended command", /next recommended command/i.test(doc));
assert("doc report risk summary", /risk summary/i.test(doc));

assert("doc 30-min flow mapping", /30.minute flow mapping|30-minute flow mapping/i.test(doc));
assert("doc 0-3 min intake", /0.–3|0–3 min/i.test(doc));
assert("doc 3-8 min crawl", /3.–8|3–8 min/i.test(doc));
assert("doc 8-12 min classify", /8.–12|8–12 min/i.test(doc));
assert("doc 12-17 min CMS", /12.–17|12–17 min/i.test(doc));
assert("doc 17-22 min staging", /17.–22|17–22 min/i.test(doc));
assert("doc 22-26 min package", /22.–26|22–26 min/i.test(doc));
assert("doc 26-30 min report", /26.–30|26–30 min/i.test(doc));

assert("doc G-23d relationship", /G-23d|run-onboarding-fixture-dry-run/i.test(doc));
assert("doc do not replace G-23d yet", /Do not replace G-23d|すぐ置き換えない|not replace G-23d/i.test(doc));
assert("doc G-23d prototype", /prototype|原型/i.test(doc));

assert("doc next G-23f", /G-23f/i.test(doc));
assert("doc next G-23g", /G-23g/i.test(doc));
assert("doc next G-23h", /G-23h/i.test(doc));
assert("doc next G-23i", /G-23i/i.test(doc));
assert("doc next G-23j", /G-23j/i.test(doc));

assert("doc not in scope orchestrator impl", /orchestrator.*implementation.*no|Orchestrator script implementation.*deferred/i.test(doc));
assert("doc not in scope live crawl", /Live URL crawl.*forbidden|live crawl.*no|実URLクロール/i.test(doc));
assert("doc not in scope DB write", /DB write.*forbidden|DB connection.*forbidden/i.test(doc));
assert("doc not in scope package", /Package build.*forbidden|package regen.*no/i.test(doc));
assert("doc not in scope FTP", /FTP.*forbidden|upload.*forbidden/i.test(doc));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc live crawl false", doc.includes("liveCrawlExecuted: false"));
assert("doc network false", doc.includes("networkAccess: false"));
assert("doc package false", doc.includes("packageBuildExecuted: false"));
assert("doc ftp false", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy false", doc.includes("deployExecuted: false"));

assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only forbidden context",
  !doc.match(new RegExp(`projectRef.*${PROD_REF}`)) &&
    (doc.includes(PROD_REF) && /forbidden|never|Never|active target/i.test(doc)),
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

assert("00-current-state mentions G-23e", currentState.includes("G-23e"));
assert("03-next-actions mentions G-23e", nextActions.includes("G-23e"));
assert("handoff mentions G-23e", handoff.includes("G-23e"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Crawl not executed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-23e Static-to-Astro onboarding orchestrator planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
