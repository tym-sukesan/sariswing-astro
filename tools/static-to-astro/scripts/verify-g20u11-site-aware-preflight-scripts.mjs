/**
 * G-20u11 — Site-aware preflight scripts verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u11-site-aware-preflight-scripts.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/site-aware-preflight-scripts.md";
const PREFLIGHT_CLI_REL = "tools/static-to-astro/scripts/run-site-preflight.mjs";
const BASE_COMMIT = "207a455";

const REQUIRED_SCRIPTS = [
  "preflight",
  "preflight:gosaki:staging",
  "preflight:gosaki:production",
  "preflight:pilot:staging",
  "build:gosaki:staging",
  "build:gosaki:production",
  "build:pilot:staging",
  "build:site-package",
  "verify:gosaki:staging",
  "verify:gosaki:production",
  "verify:pilot:staging",
  "verify:site-package",
  "verify:package-freshness:staging",
  "verify:package-freshness:production",
  "verify:package-freshness:pilot",
  "verify:package-freshness",
];

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

function runNpm(script, extraArgs = [], { expectFail = false } = {}) {
  const args = ["run", script, ...(extraArgs.length ? ["--", ...extraArgs] : [])];
  const out = spawnSync("npm", args, {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const ok = expectFail ? out.status !== 0 : out.status === 0;
  return { ok, status: out.status, stdout: out.stdout ?? "", stderr: out.stderr ?? "" };
}

function runPreflightCli(args, { expectFail = false } = {}) {
  const out = spawnSync("node", ["scripts/run-site-preflight.mjs", ...args], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const ok = expectFail ? out.status !== 0 : out.status === 0;
  return { ok, status: out.status, stdout: out.stdout ?? "", stderr: out.stderr ?? "" };
}

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (head.stdout.trim().startsWith(BASE_COMMIT)) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${head.stdout.trim().slice(0, 12)} (G-20u11 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u11 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("preflight CLI exists", exists(PREFLIGHT_CLI_REL));

const doc = read(DOC_REL);
const packageJson = JSON.parse(read("tools/static-to-astro/package.json"));
const preflightCli = read(PREFLIGHT_CLI_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u11", doc.includes("G-20u11-site-aware-preflight-scripts"));
assert("doc gate complete", doc.includes("siteAwarePreflightScriptsComplete: true"));
assert("doc gosaki staging flow", /build:gosaki:staging[\s\S]*preflight:gosaki:staging/i.test(doc));
assert("doc gosaki production flow", /build:gosaki:production[\s\S]*preflight:gosaki:production/i.test(doc));
assert("doc pilot flow", /preflight:pilot:staging/i.test(doc));
assert("doc stale package STOP", /stale.*STOP|STOP.*stale/i.test(doc));
assert("doc rebuild at HEAD", /rebuild.*HEAD|current HEAD/i.test(doc));
assert("doc manual FTP only", /Manual FTP|manual FTP/i.test(doc));
assert("doc G-20j production", /G-20j/i.test(doc));
assert("doc production upload STOP", /upload.*STOP|Upload still STOP/i.test(doc));

for (const script of REQUIRED_SCRIPTS) {
  assert(`package.json script ${script}`, Boolean(packageJson.scripts[script]));
}

assert("preflight uses run-site-preflight", packageJson.scripts.preflight.includes("run-site-preflight.mjs"));
assert(
  "preflight:gosaki:staging site-aware",
  packageJson.scripts["preflight:gosaki:staging"].includes("--site gosaki-piano") &&
    packageJson.scripts["preflight:gosaki:staging"].includes("--profile staging"),
);
assert(
  "preflight:gosaki:production site-aware",
  packageJson.scripts["preflight:gosaki:production"].includes("--site gosaki-piano") &&
    packageJson.scripts["preflight:gosaki:production"].includes("--profile production"),
);
assert(
  "preflight:pilot:staging site-aware",
  packageJson.scripts["preflight:pilot:staging"].includes("--site pilot-sample-static") &&
    packageJson.scripts["preflight:pilot:staging"].includes("--profile staging"),
);

assert("CLI --site required", preflightCli.includes("--site is required"));
assert("CLI verify-site-package step", preflightCli.includes("verify-site-package.mjs"));
assert("CLI freshness step", preflightCli.includes("verify-package-upload-freshness.mjs"));
assert("CLI stale STOP message", preflightCli.includes("stale package"));

const help = spawnSync("node", ["scripts/run-site-preflight.mjs", "--help"], {
  cwd: TOOL_ROOT,
  encoding: "utf8",
});
assert("preflight --help", help.status === 0);
assert("preflight help --site", help.stdout.includes("--site"));

const missingSite = runPreflightCli([], { expectFail: true });
assert("missing --site exit 1", missingSite.ok);

const unknownSite = runPreflightCli(["--site", "not-a-site", "--profile", "staging"], {
  expectFail: true,
});
assert("unknown site exit 1", unknownSite.ok);

const pilotProduction = runPreflightCli(
  ["--site", "pilot-sample-static", "--profile", "production"],
  { expectFail: true },
);
assert("pilot production profile exit 1", pilotProduction.ok);

if (exists("tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json")) {
  const preflightStaging = runNpm("preflight:gosaki:staging", [], { expectFail: true });
  assert(
    "preflight:gosaki:staging STOP on stale package",
    preflightStaging.ok,
    `exit ${preflightStaging.status}`,
  );
  assert(
    "preflight staging reports STOP",
    preflightStaging.stderr.includes("STOP") ||
      preflightStaging.stdout.includes("STOP") ||
      preflightStaging.stdout.includes("stale"),
  );
} else {
  console.log("NOTE gosaki staging package missing — skipped stale preflight test");
}

if (exists("tools/static-to-astro/output/manual-upload/pilot-sample-static/MANIFEST.json")) {
  const preflightPilot = runNpm("preflight:pilot:staging", [], { expectFail: true });
  assert(
    "preflight:pilot:staging STOP on stale package",
    preflightPilot.ok,
    `exit ${preflightPilot.status}`,
  );
} else {
  console.log("NOTE pilot package missing — skipped stale preflight test");
}

const packageJsonParsed = JSON.parse(read("tools/static-to-astro/package.json"));
const preflightScriptValues = Object.entries(packageJsonParsed.scripts ?? {})
  .filter(([key]) => key.startsWith("preflight"))
  .map(([, value]) => value)
  .join("\n");
assert(
  "no FTP in preflight scripts",
  !/preflight.*ftp|preflight.*mirror|preflight.*deploy/i.test(preflightScriptValues),
);
const DEPLOY_SCRIPT_PATTERNS = [
  "deploy-public-dist",
  "deploy-ftp",
  "workflow_dispatch",
  "mirror --",
  "lftp",
  "create-manual-upload-package",
];
assert(
  "no deploy/FTP script invocations in run-site-preflight",
  DEPLOY_SCRIPT_PATTERNS.every((pattern) => !preflightCli.includes(pattern)),
);

assert("AI current-state G-20u11", currentState.includes("G-20u11"));
assert("AI next-actions G-20u11", nextActions.includes("G-20u11"));
assert("handoff G-20u11", handoff.includes("G-20u11"));

console.log("");
console.log(`G-20u11 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
