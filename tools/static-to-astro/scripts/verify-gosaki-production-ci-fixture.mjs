#!/usr/bin/env node
/**
 * Source + snapshot verifier for the tracked Gosaki production CI fixture.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_PRODUCTION_CI_EXPECTED_HTML,
  GOSAKI_PRODUCTION_CI_FIXTURE_DIR,
  GOSAKI_RAW_CRAWL_FIXTURE_DIR,
} from "./lib/gosaki-production-ci-fixture.mjs";
import {
  listSanitizedGosakiHtmlSecurityFailures,
  loadTrackedGosakiCiHtmlJoined,
  scanSanitizedGosakiHtmlBlob,
} from "./lib/gosaki-production-ci-fixture-security.mjs";
import { resolveSitePackageBuildProfile } from "./lib/site-registry.mjs";
import { matchRegistryFixtureDir } from "./lib/site-fixture-match.mjs";
import { createGosakiPianoHookMethods } from "./lib/gosaki-site-generator-hooks-adapter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

/** @type {string[]} */
const failures = [];
/** @type {string[]} */
const passes = [];

function assert(name, condition, detail = "") {
  if (condition) {
    passes.push(name);
    return;
  }
  failures.push(detail ? `${name}: ${detail}` : name);
}

const fixtureAbs = path.join(TOOL_ROOT, GOSAKI_PRODUCTION_CI_FIXTURE_DIR);
const gitignore = fs.readFileSync(path.join(TOOL_ROOT, ".gitignore"), "utf8");
const workflow = fs.readFileSync(
  path.join(REPO_ROOT, ".github/workflows/gosaki-piano-production-public-dist.yml"),
  "utf8",
);
const registry = fs.readFileSync(path.join(TOOL_ROOT, "config/sites/registry.json"), "utf8");

assert("ci fixture dir exists", fs.existsSync(fixtureAbs));
assert("gitignore still ignores raw crawl dir", gitignore.includes("fixtures/gosaki-piano/"));
assert(
  "gitignore does not ignore gosaki-piano-ci",
  !gitignore.split("\n").some((line) => line.trim() === "fixtures/gosaki-piano-ci/"),
);

const htmlFiles = fs
  .readdirSync(fixtureAbs)
  .filter((n) => n.endsWith(".html"))
  .sort();
assert("html count is 10", htmlFiles.length === 10);
assert(
  "expected names",
  GOSAKI_PRODUCTION_CI_EXPECTED_HTML.every((n) => htmlFiles.includes(n)),
);
assert("no manifest.json in ci dir", !fs.existsSync(path.join(fixtureAbs, "manifest.json")));
assert("no CRAWL_REPORT in ci dir", !fs.existsSync(path.join(fixtureAbs, "CRAWL_REPORT.md")));

const staging = resolveSitePackageBuildProfile("gosaki-piano", "staging");
const production = resolveSitePackageBuildProfile("gosaki-piano", "production");
const ciao = resolveSitePackageBuildProfile("gosaki-piano", "ciao-preview");
assert("staging still uses raw fixtureDir", staging.fixtureDir === GOSAKI_RAW_CRAWL_FIXTURE_DIR);
assert("ciao-preview still uses raw fixtureDir", ciao.fixtureDir === GOSAKI_RAW_CRAWL_FIXTURE_DIR);
assert("production uses ci fixtureDir", production.fixtureDir === GOSAKI_PRODUCTION_CI_FIXTURE_DIR);
assert("registry production overlay has ci fixtureDir", registry.includes('"fixtureDir": "fixtures/gosaki-piano-ci"'));

const hooks = createGosakiPianoHookMethods();
assert(
  "matchFixture raw basename",
  matchRegistryFixtureDir(path.join(TOOL_ROOT, GOSAKI_RAW_CRAWL_FIXTURE_DIR), "gosaki-piano"),
);
assert(
  "matchFixture ci basename",
  matchRegistryFixtureDir(fixtureAbs, "gosaki-piano"),
);
assert(
  "visual slug maps ci to gosaki-piano",
  hooks.resolveVisualOverrideSiteSlug(fixtureAbs, "gosaki-piano-ci") === "gosaki-piano",
);
assert(
  "visual slug keeps gosaki-piano",
  hooks.resolveVisualOverrideSiteSlug(path.join(TOOL_ROOT, "fixtures/gosaki-piano"), "gosaki-piano") ===
    "gosaki-piano",
);

assert("workflow preflight script", workflow.includes("gosaki-production-fixture-preflight.mjs"));
assert("workflow preflight before FTP", workflow.indexOf("gosaki-production-fixture-preflight.mjs") < workflow.indexOf("lftp"));
assert("workflow does not crawl", !/crawl-static-site|url:staging|--run-crawl/.test(workflow));

const scan = scanSanitizedGosakiHtmlBlob(loadTrackedGosakiCiHtmlJoined(TOOL_ROOT));
const securityFails = listSanitizedGosakiHtmlSecurityFailures(scan);
assert("security scan clean", securityFails.length === 0, securityFails.join(", "));

const preflight = spawnSync(process.execPath, [path.join(__dirname, "gosaki-production-fixture-preflight.mjs")], {
  cwd: TOOL_ROOT,
  encoding: "utf8",
});
assert("preflight exit 0", preflight.status === 0, preflight.stderr || preflight.stdout);

console.log(`verify-gosaki-production-ci-fixture: ${passes.length} passed, ${failures.length} failed`);
for (const name of passes) console.log(`PASS ${name}`);
for (const name of failures) console.log(`FAIL ${name}`);
if (failures.length > 0) process.exit(1);
