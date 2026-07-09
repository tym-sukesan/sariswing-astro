/**
 * G-20u18 — package.json / CLI default decoupling verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u18-package-json-cli-default-decoupling.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { GOSAKI_SITE_KEY, PILOT_SAMPLE_STATIC_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/package-json-cli-default-decoupling.md";
const BASE_COMMIT = "a544998";

const WRITE_PATTERNS = [
  /deploy-public-dist-ftp\.mjs.*--apply/,
  /mirror\s+--delete/,
  /service_role/i,
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

function runNode(args, { expectOk = true, cwd = TOOL_ROOT } = {}) {
  const result = spawnSync("node", args, { cwd, encoding: "utf8", env: { ...process.env } });
  const ok = result.status === (expectOk ? 0 : 1);
  return { ok, status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function runNpm(script, extraArgs = [], { expectOk = true } = {}) {
  const result = spawnSync("npm", ["run", script, "--", ...extraArgs], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env },
  });
  const ok = result.status === (expectOk ? 0 : 1);
  return { ok, status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u18 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
const doc = read(DOC_REL);
assert("doc phase G-20u18", doc.includes("G-20u18-package-json-cli-default-decoupling"));
assert("doc generic usage", doc.includes("manual-upload:site-package"));
assert("doc legacy aliases", doc.includes("manual-upload:package"));
assert("doc preflight rule", doc.includes("preflight"));

const packageJson = read("tools/static-to-astro/package.json");
const pkg = JSON.parse(packageJson);
const scripts = pkg.scripts;

assert("generic manual-upload:site-package", scripts["manual-upload:site-package"]?.includes("create-manual-upload-package"));
assert("explicit gosaki staging wrapper", scripts["manual-upload:package:gosaki:staging"]?.includes("--site-key gosaki-piano"));
assert("manual-upload:package legacy alias", scripts["manual-upload:package"] === "npm run manual-upload:package:gosaki:staging");
assert("gosaki production wrapper uses site-key", scripts["manual-upload:package:gosaki:production"]?.includes("--site-key gosaki-piano"));
assert("gosaki-production legacy alias", scripts["manual-upload:package:gosaki-production"] === "npm run manual-upload:package:gosaki:production");
assert("no inline gosaki in manual-upload:package alias", !scripts["manual-upload:package"]?.includes("gosaki-piano/public-dist"));

assert("freshness gosaki explicit staging", scripts["verify:package-freshness:gosaki:staging"]?.includes("--site gosaki-piano"));
assert("freshness staging legacy alias", scripts["verify:package-freshness:staging"] === "npm run verify:package-freshness:gosaki:staging");

assert("gosaki build convenience", scripts["build:gosaki:staging"]?.includes("--site gosaki-piano"));
assert("pilot build convenience", scripts["build:pilot:staging"]?.includes("pilot-sample-static"));
assert("url staging gosaki convenience", scripts["url:staging:gosaki"]?.includes("--site gosaki-piano"));
assert("url staging pilot convenience", scripts["url:staging:pilot"]?.includes("pilot-sample-static"));
assert("generic url:staging retained", scripts["url:staging"]?.includes("url-to-staging-pipeline"));

for (const key of Object.keys(scripts)) {
  for (const pattern of WRITE_PATTERNS) {
    assert(`npm script ${key} no destructive pattern`, !pattern.test(scripts[key]));
  }
}

const createCli = read("tools/static-to-astro/scripts/create-manual-upload-package.mjs");
assert("create CLI requires site-key message", createCli.includes("--site-key (or --site) is required"));
assert("create CLI no default gosaki-piano slug", !createCli.includes('siteSlug: "gosaki-piano"'));
assert("create CLI --profile alias", createCli.includes('arg === "--profile"'));
assert("create CLI registry resolve", createCli.includes("resolvePackageManifestMetaFromRegistry"));

const noSite = runNode(["scripts/create-manual-upload-package.mjs"], { expectOk: false });
assert("create CLI fails without --site-key", noSite.ok, `status=${noSite.status}`);

const unknownSite = runNode(
  [
    "scripts/create-manual-upload-package.mjs",
    "--site-key",
    "not-a-real-site",
    "--public-dir",
    "fixtures/sample-static-site",
    "--out",
    "output/manual-upload/tmp-test",
  ],
  { expectOk: false },
);
assert("create CLI unknown site fails", unknownSite.ok);

const pilotDry = runNpm("build:pilot:staging:dry-run");
assert("pilot build dry-run PASS", pilotDry.ok, pilotDry.stderr || pilotDry.stdout);

const gosakiDry = runNpm("build:gosaki:staging:dry-run");
assert("gosaki build dry-run PASS", gosakiDry.ok, gosakiDry.stderr || gosakiDry.stdout);

const buildNoSite = runNpm("build:site-package", [], { expectOk: false });
assert("build:site-package fails without --site", buildNoSite.ok);

const preflightPilotHelp = runNode(["scripts/run-site-preflight.mjs", "--help"]);
assert("preflight CLI exists", preflightPilotHelp.ok);

assert("npm verify:g20u18-cli-decoupling", packageJson.includes("verify:g20u18-cli-decoupling"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u18", currentState.includes("G-20u18"));
assert("AI next-actions G-20u18", nextActions.includes("G-20u18"));
assert("handoff G-20u18", handoff.includes("G-20u18"));

console.log(`\nG-20u18 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
