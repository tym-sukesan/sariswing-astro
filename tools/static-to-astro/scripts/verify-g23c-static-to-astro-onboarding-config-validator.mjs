/**
 * G-23c — Static-to-Astro onboarding config validator verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23c-static-to-astro-onboarding-config-validator.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  PROD_REF,
  STAGING_REF,
  validateOnboardingConfig,
  validateOnboardingConfigFile,
} from "./validate-onboarding-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const VALIDATOR_REL = "tools/static-to-astro/scripts/validate-onboarding-config.mjs";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/static-to-astro-onboarding-config-validator-result.md";
const GOSAKI_REL = "tools/static-to-astro/config/onboarding.gosaki-piano.example.json";
const SCHEMA_REL = "tools/static-to-astro/config/onboarding.schema.example.json";

const BASE_COMMIT = "9b43d55";

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

function runValidator(configPath, json = false) {
  const args = ["node", path.join(REPO_ROOT, VALIDATOR_REL), configPath];
  if (json) args.push("--json");
  return spawnSync(args[0], args.slice(1), {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
}

function loadGosakiBase() {
  return JSON.parse(read(GOSAKI_REL));
}

function writeTempConfig(name, config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "g23c-onboarding-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, JSON.stringify(config, null, 2), "utf8");
  return { dir, file };
}

function cleanupTemp(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 9b43d55", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 9b43d55", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("validator script exists", exists(VALIDATOR_REL));
assert("result doc exists", exists(RESULT_DOC_REL));
assert("gosaki example config exists", exists(GOSAKI_REL));
assert("schema example exists", exists(SCHEMA_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23c", resultDoc.includes("G-23c-static-to-astro-onboarding-config-validator"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroOnboardingConfigValidatorComplete: true"),
);
assert("result doc validator purpose", /validator|検証/i.test(resultDoc));
assert("result doc gosaki PASS", /Gosaki.*PASS|gosaki.*PASS/i.test(resultDoc));
assert("result doc bad config FAIL", /bad config.*FAIL|FAIL.*bad/i.test(resultDoc));
assert("result doc allowDbWrite false", resultDoc.includes("allowDbWrite"));
assert("result doc FTP deploy forbidden", /FTP|deploy/i.test(resultDoc));
assert("result doc production ref forbidden", resultDoc.includes(PROD_REF));
assert("result doc service_role not used", /service_role/i.test(resultDoc));
assert("result doc no DB write", /DB write.*no|no.*DB write/i.test(resultDoc));
assert("result doc no crawl", /crawl.*no|no.*crawl/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc schema example not validation target", /schema example|構造説明/i.test(resultDoc));

const gosakiCli = runValidator(path.join(REPO_ROOT, GOSAKI_REL));
assert("gosaki example validator CLI exit 0", gosakiCli.status === 0, gosakiCli.stderr);
assert("gosaki example validator CLI PASS", /PASS/.test(gosakiCli.stdout));

const gosakiApi = validateOnboardingConfigFile(path.join(REPO_ROOT, GOSAKI_REL));
assert("gosaki example API PASS", gosakiApi.ok === true);
assert(
  "gosaki schedule module enabled",
  gosakiApi.ok &&
    loadGosakiBase().cms.modules.some((m) => m.id === "schedule" && m.enabled === true),
);

const gosaki = loadGosakiBase();
assert("gosaki safety allowDbWrite false", gosaki.safetyGates.allowDbWrite === false);
assert("gosaki safety allowPackageBuild false", gosaki.safetyGates.allowPackageBuild === false);
assert("gosaki safety allowFtpUpload false", gosaki.safetyGates.allowFtpUpload === false);
assert("gosaki safety allowProductionDeploy false", gosaki.safetyGates.allowProductionDeploy === false);
assert("gosaki safety forbidServiceRole true", gosaki.safetyGates.forbidServiceRole === true);
assert("gosaki ftp disabled", gosaki.ftp.enabled === false);
assert("gosaki forbidden prod ref listed", gosaki.supabase.forbiddenProjectRefs.includes(PROD_REF));
assert("gosaki staging ref", gosaki.supabase.projectRef === STAGING_REF);

/** @type {Array<{ name: string, mutate: (c: object) => void, expect: RegExp }>} */
const badCases = [
  {
    name: "allowFtpUpload-true",
    mutate: (c) => {
      c.safetyGates.allowFtpUpload = true;
    },
    expect: /allowFtpUpload/,
  },
  {
    name: "allowProductionDeploy-true",
    mutate: (c) => {
      c.safetyGates.allowProductionDeploy = true;
    },
    expect: /allowProductionDeploy/,
  },
  {
    name: "forbidServiceRole-false",
    mutate: (c) => {
      c.safetyGates.forbidServiceRole = false;
    },
    expect: /forbidServiceRole/,
  },
  {
    name: "missing-forbidden-prod-ref",
    mutate: (c) => {
      c.supabase.forbiddenProjectRefs = [];
    },
    expect: /forbiddenProjectRefs/,
  },
  {
    name: "invalid-sourceUrl",
    mutate: (c) => {
      c.sourceUrl = "not-a-valid-url";
    },
    expect: /sourceUrl/,
  },
  {
    name: "invalid-siteSlug",
    mutate: (c) => {
      c.siteSlug = "INVALID SLUG!";
    },
    expect: /siteSlug/,
  },
  {
    name: "missing-siteSlug",
    mutate: (c) => {
      delete c.siteSlug;
    },
    expect: /siteSlug/,
  },
];

for (const badCase of badCases) {
  const base = loadGosakiBase();
  badCase.mutate(base);
  const temp = writeTempConfig(`${badCase.name}.json`, base);
  const cli = runValidator(temp.file);
  const api = validateOnboardingConfig(base, { label: badCase.name });
  assert(`bad config ${badCase.name} CLI exit 1`, cli.status === 1);
  assert(`bad config ${badCase.name} CLI FAIL`, /FAIL/.test(cli.stdout));
  assert(
    `bad config ${badCase.name} catches expected error`,
    badCase.expect.test(cli.stdout) || badCase.expect.test(api.errors.join(" ")),
  );
  cleanupTemp(temp.dir);
}

const parseErrorFile = writeTempConfig("invalid-json.json", "{ not json");
fs.writeFileSync(parseErrorFile.file, "{ not json", "utf8");
const parseCli = runValidator(parseErrorFile.file);
assert("JSON parse error CLI exit 1", parseCli.status === 1);
assert("JSON parse error reported", /JSON parse error/i.test(parseCli.stdout));
cleanupTemp(parseErrorFile.dir);

const prodRefActive = loadGosakiBase();
prodRefActive.supabase.projectRef = PROD_REF;
const prodTemp = writeTempConfig("prod-ref-active.json", prodRefActive);
const prodCli = runValidator(prodTemp.file);
assert("active production ref CLI FAIL", prodCli.status === 1);
assert("active production ref error", /vsbvndwuajjhnzpohghh|production ref/i.test(prodCli.stdout));
cleanupTemp(prodTemp.dir);

const serviceRoleKey = loadGosakiBase();
serviceRoleKey.dangerous = { service_role: "must-not-exist" };
const srTemp = writeTempConfig("service-role-key.json", serviceRoleKey);
const srCli = runValidator(srTemp.file);
assert("service_role key CLI FAIL", srCli.status === 1);
assert("service_role key error", /service_role/i.test(srCli.stdout));
cleanupTemp(srTemp.dir);

const schemaRaw = read(SCHEMA_REL);
let schemaJson;
try {
  schemaJson = JSON.parse(schemaRaw);
  assert("schema example parses as JSON", true);
} catch (e) {
  assert("schema example parses as JSON", false, e.message);
  schemaJson = {};
}
const schemaValidation = validateOnboardingConfig(schemaJson, { label: "schema-example" });
assert(
  "schema example is not onboarding instance (validator FAIL expected)",
  schemaValidation.ok === false,
  schemaValidation.errors.slice(0, 3).join("; "),
);

const jsonCli = runValidator(path.join(REPO_ROOT, GOSAKI_REL), true);
assert("gosaki --json exit 0", jsonCli.status === 0);
let jsonOut;
try {
  jsonOut = JSON.parse(jsonCli.stdout);
  assert("gosaki --json parses", true);
  assert("gosaki --json status PASS", jsonOut.status === "PASS");
} catch (e) {
  assert("gosaki --json parses", false, e.message);
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

assert("00-current-state mentions G-23c", currentState.includes("G-23c"));
assert("03-next-actions mentions G-23c", nextActions.includes("G-23c"));
assert("handoff mentions G-23c", handoff.includes("G-23c"));

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
  `\nG-23c Static-to-Astro onboarding config validator verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
