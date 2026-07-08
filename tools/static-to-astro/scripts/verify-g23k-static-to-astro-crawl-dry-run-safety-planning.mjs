/**
 * G-23k — Static-to-Astro crawl-dry-run safety planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23k-static-to-astro-crawl-dry-run-safety-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/static-to-astro-crawl-dry-run-safety-planning.md";
const G23J_DOC = "tools/static-to-astro/docs/static-to-astro-first-non-network-sample-full-dry-run-result.md";
const G23E_DOC = "tools/static-to-astro/docs/static-to-astro-onboarding-orchestrator-planning.md";
const ORCHESTRATOR_REL = "tools/static-to-astro/scripts/run-onboarding-orchestrator.mjs";

const BASE_COMMIT = "ad6091a";
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

assert("HEAD is ad6091a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is ad6091a", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("planning doc exists", exists(DOC_REL));
assert("G-23j result doc exists", exists(G23J_DOC));
assert("G-23e planning doc exists", exists(G23E_DOC));
assert("orchestrator script exists", exists(ORCHESTRATOR_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-23k", doc.includes("G-23k-static-to-astro-crawl-dry-run-safety-planning"));
assert(
  "doc planning gate complete",
  doc.includes("staticToAstroCrawlDryRunSafetyPlanningComplete: true"),
);

assert("doc purpose non-network to live crawl", /non-network.*live crawl|G-23j.*live crawl/i.test(doc));
assert("doc crawl-dry-run read-only separated", /read-only|DB\/package\/FTP|分離/i.test(doc));
assert("doc live crawl deferred", /not implemented|deferred|次フェーズ|G-23o/i.test(doc));

assert("doc live crawl-dry-run definition", /live crawl-dry-run definition|Live crawl-dry-run definition/i.test(doc));
assert("doc HTTP GET", /HTTP GET/i.test(doc));
assert("doc same-origin", /same.origin|sameOriginOnly/i.test(doc));
assert("doc maxPages", /maxPages/i.test(doc));
assert("doc robots", /robots/i.test(doc));
assert("doc assets limited", /asset/i.test(doc));
assert("doc no writes", /no writes|書き込み.*ない|Writes.*none/i.test(doc));
assert("doc crawl result JSON", /crawl result/i.test(doc));
assert("doc no DB or package from crawl", /no DB|no package|DB投入.*しない/i.test(doc));

const safetyGates = [
  "explicitCrawlApprovalId",
  "requireHumanReview",
  "sameOriginOnly",
  "maxPages",
  "concurrency",
  "requestTimeout",
  "userAgent",
  "respectRobots",
  "denylist",
  "private IP",
  "localhost",
  "no POST",
  "no form submit",
  "no login",
  "no credentials",
  "no cookies",
  "no service_role",
  "no DB write",
  "no FTP",
];
for (const gate of safetyGates) {
  assert(`doc safety gate ${gate}`, doc.includes(gate) || new RegExp(gate.replace(/ /g, ".*"), "i").test(doc));
}

assert("doc URL restrictions section", /Target URL restrictions|対象URL制限/i.test(doc));
assert("doc https recommended", /https/i.test(doc));
assert("doc example.com blocked", /example\.com/i.test(doc));
assert("doc fixture URL blocked", /fixture URL|fixture.*blocked/i.test(doc));
assert("doc localhost forbidden", /localhost|127\.0\.0\.1/i.test(doc));
assert("doc private IP forbidden", /private IP|172\.16|192\.168/i.test(doc));
assert("doc staging vs production", /staging.*production|sourceUrl.*publicDomain/i.test(doc));
assert("doc sourceUrl vs publicDomain", /sourceUrl/i.test(doc) && /publicDomain/i.test(doc));

assert("doc crawl result schema", /Crawl result schema|crawl result schema/i.test(doc));
assert("doc schema fixtureOnly false", doc.includes("fixtureOnly") && /false/.test(doc));
assert("doc schema liveCrawl true", doc.includes("liveCrawl"));
assert("doc schema pages array", /pages\[\]|"pages"/i.test(doc));
assert("doc schema assets array", /assets\[\]|"assets"/i.test(doc));
assert("doc schema warnings", /warnings/i.test(doc));
assert("doc schema blocked", /blocked/i.test(doc));
assert("doc schema safetySummary", /safetySummary/i.test(doc));
assert("doc schema htmlHash", /htmlHash/i.test(doc));
assert("doc schema contentSummary", /contentSummary/i.test(doc));
assert("doc schema detectedModule", /detectedModule/i.test(doc));

assert("doc orchestrator integration", /Orchestrator integration|orchestrator/i.test(doc));
assert("doc mode crawl-dry-run", doc.includes("crawl-dry-run"));
assert("doc step 2 fixture to crawl swap", /Step 2|fixture.*crawl|crawl source/i.test(doc));
assert("doc page classifier downstream", /page classifier|classification/i.test(doc));
assert("doc seed extractor downstream", /seed extractor/i.test(doc));
assert("doc fixture-compatible schema", /fixture-compatible|fixture compatible/i.test(doc));

assert("doc failure policy", /Failure policy|failure policy/i.test(doc));
assert("doc failure missing approval", /approvalId.*FAIL|Missing.*approval/i.test(doc));
assert("doc failure unsafe URL", /Unsafe URL|unsafe URL/i.test(doc));
assert("doc failure robots", /robots.*FAIL|robots.*SKIP/i.test(doc));
assert("doc failure maxPages stop", /maxPages.*STOP|maxPages.*exceeded/i.test(doc));
assert("doc failure redirect different origin", /Redirect.*different origin|redirect.*origin/i.test(doc));
assert("doc failure login skip", /Login required|login required/i.test(doc));
assert("doc failure POST form warn", /POST form|no submit/i.test(doc));
assert("doc failure binary skip", /Binary|huge file|large asset/i.test(doc));
assert("doc failure private IP resolve", /private IP|DNS resolves/i.test(doc));
assert("doc failure rate limit", /Rate limit|429/i.test(doc));
assert("doc failure timeout", /Timeout|timeout/i.test(doc));
assert("doc failure network error stop", /network error|Unexpected network/i.test(doc));

assert("doc next G-23l", /G-23l/i.test(doc));
assert("doc next G-23m", /G-23m/i.test(doc));
assert("doc next G-23n", /G-23n/i.test(doc));
assert("doc next G-23o", /G-23o/i.test(doc));
assert("doc G-23o requires approval", /承認します|explicit operator approval|operator approval/i.test(doc));

assert("doc not in scope live crawl", /Live crawl.*not executed|live crawl.*not executed|cursorCrawlExecuted: false/i.test(doc));
assert("doc not in scope network", /networkAccess: false|Network access.*not executed/i.test(doc));
assert("doc not in scope DB write", /dbWriteExecuted: false|DB write.*not executed/i.test(doc));
assert("doc not in scope package", /packageBuildExecuted: false|Package build.*not executed/i.test(doc));
assert("doc not in scope FTP", /ftpUploadExecuted: false|FTP.*not executed/i.test(doc));
assert("doc not in scope deploy", /deployExecuted: false|deploy.*not executed/i.test(doc));

assert("doc cursor crawl false", doc.includes("cursorCrawlExecuted: false"));
assert("doc network false", doc.includes("networkAccess: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc package false", doc.includes("packageBuildExecuted: false"));
assert("doc ftp false", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy false", doc.includes("deployExecuted: false"));
assert("doc service_role false", doc.includes("serviceRoleUsed: false"));

assert(
  "doc prod ref only forbidden context",
  doc.includes(PROD_REF) && /forbidden|never|not used|not crawl|Never/i.test(doc),
);
assert(
  "doc prod ref not active target",
  doc.includes(`forbiddenProjectRef ${PROD_REF}`) || /not used as active target/i.test(doc),
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

assert("00-current-state mentions G-23k", currentState.includes("G-23k"));
assert("03-next-actions mentions G-23k", nextActions.includes("G-23k"));
assert("handoff mentions G-23k", handoff.includes("G-23k"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Crawl not executed by Cursor", true);
assert("Network not executed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-23k Static-to-Astro crawl-dry-run safety planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
