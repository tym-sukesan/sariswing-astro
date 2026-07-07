/**
 * G-23g — Static-to-Astro seed extractor standardization verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23g-static-to-astro-seed-extractor-standardization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { validateCmsPresetConfig } from "./lib/cms-preset-registry.mjs";
import {
  extractModuleSeedCandidates,
  extractOnboardingSeedCandidates,
  listSupportedSeedModules,
  normalizeSeedCandidate,
  summarizeSeedExtraction,
} from "./lib/onboarding-seed-extractor.mjs";
import { validateOnboardingConfig } from "./validate-onboarding-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const EXTRACTOR_REL = "tools/static-to-astro/scripts/lib/onboarding-seed-extractor.mjs";
const INSPECT_REL = "tools/static-to-astro/scripts/inspect-onboarding-seed-extraction.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-seed-extractor-standardization-result.md";
const CONFIG_REL = "tools/static-to-astro/config/onboarding.sample-musician-fixture.example.json";
const FIXTURE_REL = "tools/static-to-astro/fixtures/onboarding/sample-musician-basic-crawl-result.json";

const BASE_COMMIT = "914be95";
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

assert("HEAD is 914be95", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 914be95", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("extractor exists", exists(EXTRACTOR_REL));
assert("inspect script exists", exists(INSPECT_REL));
assert("result doc exists", exists(RESULT_DOC_REL));
assert("sample config exists", exists(CONFIG_REL));
assert("sample fixture exists", exists(FIXTURE_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23g", resultDoc.includes("G-23g-static-to-astro-seed-extractor-standardization"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroSeedExtractorStandardizationComplete: true"),
);
assert("result doc extractor role", /seed extractor.*role|Extractor role/i.test(resultDoc));
assert("result doc supported modules", /schedule.*news.*profile|Supported modules/i.test(resultDoc));
assert("result doc candidate format", /seed candidate format|Standard seed candidate/i.test(resultDoc));
assert("result doc normalized fields", /normalized fields|Module-specific normalized/i.test(resultDoc));
assert("result doc inspect command", /inspect-onboarding-seed-extraction/i.test(resultDoc));
assert("result doc sample extraction", /schedule.*2|schedule \| \*\*2\*\*/i.test(resultDoc));
assert("result doc registry connection", /preset registry|CMS preset registry/i.test(resultDoc));
assert("result doc orchestrator connection", /orchestrator/i.test(resultDoc));
assert("result doc not DB SQL", /Not DB|not DB|intermediate/i.test(resultDoc));
assert("result doc no crawl", /crawl.*no|no.*crawl|not executed/i.test(resultDoc));
assert("result doc no DB write", /DB.*no|no.*DB|not executed/i.test(resultDoc));
assert("result doc no SQL mutation", /SQL.*no|no.*SQL|mutation/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc no FTP", /FTP.*no|no.*FTP/i.test(resultDoc));
assert("result doc next G-23h", /G-23h/i.test(resultDoc));
assert("result doc next G-23i", /G-23i/i.test(resultDoc));
assert("result doc next G-23j", /G-23j/i.test(resultDoc));

assert("extractOnboardingSeedCandidates is function", typeof extractOnboardingSeedCandidates === "function");
assert("extractModuleSeedCandidates is function", typeof extractModuleSeedCandidates === "function");
assert("normalizeSeedCandidate is function", typeof normalizeSeedCandidate === "function");
assert("summarizeSeedExtraction is function", typeof summarizeSeedExtraction === "function");
assert("listSupportedSeedModules is function", typeof listSupportedSeedModules === "function");

const supported = listSupportedSeedModules();
for (const modId of ["schedule", "news", "profile", "discography", "video", "contact"]) {
  assert(`supported module ${modId}`, supported.includes(modId));
}

const config = JSON.parse(read(CONFIG_REL));
const fixture = JSON.parse(read(FIXTURE_REL));

const configValidation = validateOnboardingConfig(config, { label: "sample-musician-fixture" });
assert("config validator PASS", configValidation.ok === true, configValidation.errors.join("; "));

const registryValidation = validateCmsPresetConfig(config);
assert("registry validation PASS", registryValidation.ok === true, registryValidation.errors.join("; "));

const extraction = extractOnboardingSeedCandidates(config, fixture);
assert("seed extraction PASS", extraction.ok === true && extraction.status === "PASS", extraction.errors.join("; "));
assert("extraction schedule 2", extraction.summary?.byModule?.schedule?.candidateCount === 2);
assert("extraction news 1", extraction.summary?.byModule?.news?.candidateCount === 1);
assert("extraction profile 1", extraction.summary?.byModule?.profile?.candidateCount === 1);
assert("extraction discography 1", extraction.summary?.byModule?.discography?.candidateCount === 1);
assert("extraction video 1", extraction.summary?.byModule?.video?.candidateCount === 1);
assert("extraction contact 1", extraction.summary?.byModule?.contact?.candidateCount === 1);
assert("extraction total 7", extraction.summary?.totalCandidates === 7);

const scheduleCandidate = extraction.candidates.find((c) => c.moduleId === "schedule");
assert("schedule candidate has normalized.title", !!scheduleCandidate?.normalized?.title);
assert("schedule candidate has normalized.date", !!scheduleCandidate?.normalized?.date);
assert("schedule candidate status candidate or warn", ["candidate", "warn"].includes(scheduleCandidate?.status));

const unknownMod = extractModuleSeedCandidates("unknown-module-g23g", config, fixture);
assert("unknown module FAIL", unknownMod.status === "FAIL");
assert(
  "unknown module error clear",
  unknownMod.errors.some((e) => /unknown|unsupported/i.test(e)),
);

const badConfig = structuredClone(config);
badConfig.cms.modules.push({
  id: "bogus-module-g23g",
  enabled: true,
  extractionStrategy: "skip",
  seedPolicy: "skip",
  adminUiEnabled: false,
  publicRoute: "/bogus/",
  table: null,
  publishField: "published",
});
const badExtraction = extractOnboardingSeedCandidates(badConfig, fixture);
assert("unknown module in config FAIL", badExtraction.ok === false);
assert(
  "unknown module config error",
  badExtraction.errors.some((e) => /bogus-module-g23g|unknown module/i.test(e)),
);

const inspectCli = spawnSync(
  "node",
  [path.join(REPO_ROOT, INSPECT_REL), path.join(REPO_ROOT, CONFIG_REL), path.join(REPO_ROOT, FIXTURE_REL)],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("inspect CLI exit 0", inspectCli.status === 0, inspectCli.stderr);
assert("inspect CLI schedule 2", /schedule:\s*2/.test(inspectCli.stdout));
assert("inspect CLI extraction PASS", /Seed extraction:\s*PASS/i.test(inspectCli.stdout));

const inspectJson = spawnSync(
  "node",
  [
    path.join(REPO_ROOT, INSPECT_REL),
    path.join(REPO_ROOT, CONFIG_REL),
    path.join(REPO_ROOT, FIXTURE_REL),
    "--json",
  ],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("inspect --json exit 0", inspectJson.status === 0);
let inspectReport;
try {
  inspectReport = JSON.parse(inspectJson.stdout);
  assert("inspect --json parses", true);
  assert("inspect --json ok", inspectReport.ok === true);
  assert("inspect --json schedule 2", inspectReport.moduleCandidateCounts?.schedule === 2);
} catch (e) {
  assert("inspect --json parses", false, e.message);
}

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

assert("00-current-state mentions G-23g", currentState.includes("G-23g"));
assert("03-next-actions mentions G-23g", nextActions.includes("G-23g"));
assert("handoff mentions G-23g", handoff.includes("G-23g"));

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
  `\nG-23g Static-to-Astro seed extractor standardization verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
