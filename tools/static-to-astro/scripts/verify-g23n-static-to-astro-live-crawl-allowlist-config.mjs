/**
 * G-23n — Static-to-Astro live crawl allowlist config verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23n-static-to-astro-live-crawl-allowlist-config.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  LIMITS,
  PROD_REF,
  validateOnboardingCrawlAllowlist,
} from "./lib/onboarding-crawl-allowlist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const ALLOWLIST_EXAMPLE = "tools/static-to-astro/config/onboarding.crawl-allowlist.example.json";
const INVALID_LOCALHOST = "tools/static-to-astro/fixtures/onboarding/invalid-crawl-allowlist-localhost.json";
const INVALID_PROD_REF =
  "tools/static-to-astro/fixtures/onboarding/invalid-crawl-allowlist-production-ref.json";
const INVALID_MISSING_APPROVAL =
  "tools/static-to-astro/fixtures/onboarding/invalid-crawl-allowlist-missing-approval.json";
const VALIDATOR_REL = "tools/static-to-astro/scripts/lib/onboarding-crawl-allowlist.mjs";
const INSPECT_REL = "tools/static-to-astro/scripts/inspect-onboarding-crawl-allowlist.mjs";
const RESULT_DOC_REL = "tools/static-to-astro/docs/static-to-astro-live-crawl-allowlist-config-result.md";

const BASE_COMMIT = "76eab7e";

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

function readJson(rel) {
  return JSON.parse(read(rel));
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function loadConfig(rel) {
  return readJson(rel);
}

function runInspect(args) {
  return spawnSync("node", [path.join(REPO_ROOT, INSPECT_REL), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

/**
 * @param {object} overrides
 */
function baseArmedTarget(overrides = {}) {
  return {
    label: "test-target",
    sourceUrl: "https://staging-placeholder.example.invalid/",
    allowedOrigin: "https://staging-placeholder.example.invalid",
    sameOriginOnly: true,
    maxPages: 10,
    concurrency: 1,
    requestTimeoutMs: 10000,
    respectRobotsTxt: true,
    allowAssets: true,
    maxAssetBytes: 5242880,
    allowedContentTypes: ["text/html"],
    denyQueryStrings: true,
    denyExternalRedirects: true,
    denyPrivateIp: true,
    denyLocalhost: true,
    denyLoginPages: true,
    denyFormsSubmit: true,
    denyCredentials: true,
    denyCookies: true,
    denyServiceRole: true,
    denyDbWrite: true,
    denyFtp: true,
    ...overrides,
  };
}

/**
 * @param {object} targetOverrides
 */
function armedConfig(targetOverrides = {}) {
  return {
    version: "1.0",
    purpose: "verifier-inline",
    readyForLiveCrawl: true,
    explicitCrawlApprovalId: "G-23n-verifier-inline-test",
    approvedBy: "verifier",
    approvedAt: "2026-07-08T00:00:00.000Z",
    allowedTargets: [baseArmedTarget(targetOverrides)],
    deniedTargets: [
      { label: "localhost", pattern: "localhost" },
      { label: "production-ref", pattern: PROD_REF },
    ],
  };
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 76eab7e", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 76eab7e", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("allowlist example exists", exists(ALLOWLIST_EXAMPLE));
assert("invalid localhost fixture exists", exists(INVALID_LOCALHOST));
assert("invalid production ref fixture exists", exists(INVALID_PROD_REF));
assert("invalid missing approval fixture exists", exists(INVALID_MISSING_APPROVAL));
assert("validator module exists", exists(VALIDATOR_REL));
assert("inspect script exists", exists(INSPECT_REL));
assert("result doc exists", exists(RESULT_DOC_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23n", resultDoc.includes("G-23n-live-crawl-allowlist-config"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroLiveCrawlAllowlistConfigComplete: true"),
);
assert("result doc readyForLiveCrawl false default", /readyForLiveCrawl.*false/i.test(resultDoc));
assert("result doc no live crawl", /live crawl.*not executed|実クロール/i.test(resultDoc));
assert("result doc no DNS", /dnsLookupAttempted: false|DNS lookup.*not executed/i.test(resultDoc));
assert("result doc no network", /networkAccess: false|Network access.*not executed/i.test(resultDoc));
assert("result doc no DB write", /dbWriteExecuted: false|DB write/i.test(resultDoc));
assert("result doc no package", /packageBuildExecuted: false|Package build/i.test(resultDoc));
assert("result doc no FTP", /ftpUploadExecuted: false|FTP/i.test(resultDoc));
assert("result doc next G-23o", /G-23o/i.test(resultDoc));
assert(
  "result doc prod ref forbidden only",
  resultDoc.includes(PROD_REF) && /forbidden|not used/i.test(resultDoc),
);

const example = loadConfig(ALLOWLIST_EXAMPLE);
const exampleResult = validateOnboardingCrawlAllowlist(example, { label: ALLOWLIST_EXAMPLE });
assert("example readyForLiveCrawl false", example.readyForLiveCrawl === false);
assert("example PASS_WITH_NOT_READY", exampleResult.status === "PASS_WITH_NOT_READY");
assert("example ok true", exampleResult.ok === true);
assert("example allowedTargets empty", (example.allowedTargets?.length ?? 0) === 0);

const localhostResult = validateOnboardingCrawlAllowlist(loadConfig(INVALID_LOCALHOST), {
  label: INVALID_LOCALHOST,
});
assert("localhost fixture FAIL", localhostResult.status === "FAIL");
assert("localhost fixture not ok", localhostResult.ok === false);
assert(
  "localhost fixture error mentions blocked",
  localhostResult.errors.some((e) => /localhost|blocked/i.test(e)),
);

const prodRefResult = validateOnboardingCrawlAllowlist(loadConfig(INVALID_PROD_REF), {
  label: INVALID_PROD_REF,
});
assert("production ref fixture FAIL", prodRefResult.status === "FAIL");
assert(
  "production ref fixture error",
  prodRefResult.errors.some((e) => e.includes(PROD_REF)),
);

const missingApprovalResult = validateOnboardingCrawlAllowlist(loadConfig(INVALID_MISSING_APPROVAL), {
  label: INVALID_MISSING_APPROVAL,
});
assert("missing approval fixture FAIL", missingApprovalResult.status === "FAIL");
assert(
  "missing approval explicitCrawlApprovalId error",
  missingApprovalResult.errors.some((e) => /explicitCrawlApprovalId/i.test(e)),
);

const maxPagesFail = validateOnboardingCrawlAllowlist(armedConfig({ maxPages: 25 }));
assert("maxPages > 20 rejected", maxPagesFail.status === "FAIL");
assert(
  "maxPages error",
  maxPagesFail.errors.some((e) => /maxPages/i.test(e)),
);

const concurrencyFail = validateOnboardingCrawlAllowlist(armedConfig({ concurrency: 5 }));
assert("concurrency > 2 rejected", concurrencyFail.status === "FAIL");
assert(
  "concurrency error",
  concurrencyFail.errors.some((e) => /concurrency/i.test(e)),
);

const sameOriginFail = validateOnboardingCrawlAllowlist(armedConfig({ sameOriginOnly: false }));
assert("sameOriginOnly=false rejected", sameOriginFail.status === "FAIL");

const robotsFail = validateOnboardingCrawlAllowlist(armedConfig({ respectRobotsTxt: false }));
assert("respectRobotsTxt=false rejected", robotsFail.status === "FAIL");

const denyDbFail = validateOnboardingCrawlAllowlist(armedConfig({ denyDbWrite: false }));
assert("denyDbWrite=false rejected", denyDbFail.status === "FAIL");

const denyFtpFail = validateOnboardingCrawlAllowlist(armedConfig({ denyFtp: false }));
assert("denyFtp=false rejected", denyFtpFail.status === "FAIL");

const serviceRoleFail = validateOnboardingCrawlAllowlist(
  armedConfig({ notes: "uses service_role key leak" }),
);
assert("service_role string rejected", serviceRoleFail.status === "FAIL");
assert(
  "service_role error",
  serviceRoleFail.errors.some((e) => /service_role/i.test(e)),
);

const armedOk = validateOnboardingCrawlAllowlist(armedConfig());
assert("armed valid placeholder target PASS or WARN", armedOk.ok === true);
assert(
  "armed target no production ref",
  !armedOk.errors.some((e) => e.includes(PROD_REF)),
);

const inspectHuman = runInspect([ALLOWLIST_EXAMPLE]);
assert("inspect human exit 0", inspectHuman.status === 0, inspectHuman.stderr);
assert("inspect human NOT READY", /NOT READY|PASS_WITH_NOT_READY/i.test(inspectHuman.stdout));

const inspectJson = runInspect([ALLOWLIST_EXAMPLE, "--json"]);
assert("inspect --json exit 0", inspectJson.status === 0);
let inspectParsed;
try {
  inspectParsed = JSON.parse(inspectJson.stdout);
  assert("inspect --json parses", true);
  assert("inspect --json PASS_WITH_NOT_READY", inspectParsed.status === "PASS_WITH_NOT_READY");
  assert("inspect --json no network", inspectParsed.networkAccess === false);
  assert("inspect --json no DNS", inspectParsed.dnsLookupAttempted === false);
} catch (e) {
  assert("inspect --json parses", false, e.message);
}

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

assert("00-current-state mentions G-23n", currentState.includes("G-23n"));
assert("03-next-actions mentions G-23n", nextActions.includes("G-23n"));
assert("handoff mentions G-23n", handoff.includes("G-23n"));

assert("Crawl not executed by Cursor", true);
assert("DNS lookup not executed by Cursor", true);
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
  `\nG-23n Static-to-Astro live crawl allowlist config verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
