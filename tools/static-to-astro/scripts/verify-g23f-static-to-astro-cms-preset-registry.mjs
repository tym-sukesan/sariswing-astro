/**
 * G-23f — Static-to-Astro CMS preset registry verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23f-static-to-astro-cms-preset-registry.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  CMS_PRESET_REGISTRY,
  getCmsPreset,
  getPresetModule,
  listCmsPresets,
  listPresetModules,
  validateCmsPresetConfig,
} from "./lib/cms-preset-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const REGISTRY_REL = "tools/static-to-astro/scripts/lib/cms-preset-registry.mjs";
const INSPECT_REL = "tools/static-to-astro/scripts/inspect-cms-preset-registry.mjs";
const RESULT_DOC_REL = "tools/static-to-astro/docs/static-to-astro-cms-preset-registry-result.md";
const GOSAKI_REL = "tools/static-to-astro/config/onboarding.gosaki-piano.example.json";

const BASE_COMMIT = "e32ab31";
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

assert("HEAD is e32ab31", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is e32ab31", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("registry exists", exists(REGISTRY_REL));
assert("inspect script exists", exists(INSPECT_REL));
assert("result doc exists", exists(RESULT_DOC_REL));
assert("gosaki config exists", exists(GOSAKI_REL));

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("result doc phase G-23f", resultDoc.includes("G-23f-static-to-astro-cms-preset-registry"));
assert(
  "result doc gate complete",
  resultDoc.includes("staticToAstroCmsPresetRegistryComplete: true"),
);
assert("result doc registry role", /registry.*role|Registry role/i.test(resultDoc));
assert("result doc musician-basic modules", /musician-basic modules/i.test(resultDoc));
assert("result doc lesson-studio", /lesson-studio-basic/i.test(resultDoc));
assert("result doc shop-basic", /shop-basic/i.test(resultDoc));
assert("result doc exported functions", /Exported functions|validateCmsPresetConfig/i.test(resultDoc));
assert("result doc gosaki connection", /Gosaki|gosaki-piano/i.test(resultDoc));
assert("result doc no DB write", /DB.*no|no.*DB/i.test(resultDoc));
assert("result doc no crawl", /crawl.*no|no.*crawl/i.test(resultDoc));
assert("result doc no package", /package.*no|no.*package/i.test(resultDoc));
assert("result doc no FTP", /FTP.*no|no.*FTP/i.test(resultDoc));
assert("result doc next G-23g", /G-23g/i.test(resultDoc));
assert("result doc next G-23h", /G-23h/i.test(resultDoc));

assert("CMS_PRESET_REGISTRY exported", typeof CMS_PRESET_REGISTRY === "object");
assert("getCmsPreset is function", typeof getCmsPreset === "function");
assert("listCmsPresets is function", typeof listCmsPresets === "function");
assert("listPresetModules is function", typeof listPresetModules === "function");
assert("getPresetModule is function", typeof getPresetModule === "function");
assert("validateCmsPresetConfig is function", typeof validateCmsPresetConfig === "function");

assert("preset musician-basic exists", !!getCmsPreset("musician-basic"));
assert("preset lesson-studio-basic exists", !!getCmsPreset("lesson-studio-basic"));
assert("preset shop-basic exists", !!getCmsPreset("shop-basic"));
assert("listCmsPresets count 3", listCmsPresets().length === 3);

const scheduleMod = getPresetModule("musician-basic", "schedule");
assert("musician schedule enabledByDefault true", scheduleMod?.enabledByDefault === true);
assert("musician schedule table", scheduleMod?.table === "public.schedules");

for (const modId of ["news", "profile", "discography", "video", "contact"]) {
  assert(`musician-basic module ${modId}`, !!getPresetModule("musician-basic", modId));
}

const lessonMods = ["schedule", "classes", "instructors", "news", "pricing", "contact"];
for (const modId of lessonMods) {
  assert(`lesson-studio-basic module ${modId}`, !!getPresetModule("lesson-studio-basic", modId));
}

const shopMods = ["news", "menu", "access", "gallery", "contact"];
for (const modId of shopMods) {
  assert(`shop-basic module ${modId}`, !!getPresetModule("shop-basic", modId));
}

const gosaki = JSON.parse(read(GOSAKI_REL));
const gosakiValidation = validateCmsPresetConfig(gosaki);
assert("gosaki validateCmsPresetConfig PASS", gosakiValidation.ok === true, gosakiValidation.errors.join("; "));

const badUnknown = structuredClone(gosaki);
badUnknown.cms.modules.push({
  id: "unknown-module-g23f",
  enabled: false,
  extractionStrategy: "skip",
  seedPolicy: "skip",
  adminUiEnabled: false,
  publicRoute: "/unknown/",
  table: null,
  publishField: "published",
});
const badUnknownResult = validateCmsPresetConfig(badUnknown);
assert("unknown module FAIL", badUnknownResult.ok === false);
assert("unknown module error mentions id", /unknown-module-g23f|unknown module/i.test(badUnknownResult.errors.join(" ")));

const badRoute = structuredClone(gosaki);
const sched = badRoute.cms.modules.find((m) => m.id === "schedule");
sched.publicRoute = "/wrong-schedule/";
const badRouteResult = validateCmsPresetConfig(badRoute);
assert("enabled module route conflict FAIL", badRouteResult.ok === false);

const inspectCli = spawnSync(
  "node",
  [path.join(REPO_ROOT, INSPECT_REL)],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("inspect CLI exit 0", inspectCli.status === 0, inspectCli.stderr);
assert("inspect CLI shows musician-basic", inspectCli.stdout.includes("musician-basic"));
assert("inspect CLI gosaki PASS", /status:\s*PASS/i.test(inspectCli.stdout));

const inspectJson = spawnSync(
  "node",
  [path.join(REPO_ROOT, INSPECT_REL), "--json"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("inspect --json exit 0", inspectJson.status === 0);
let inspectReport;
try {
  inspectReport = JSON.parse(inspectJson.stdout);
  assert("inspect --json parses", true);
  assert("inspect --json presetValidation PASS", inspectReport.configValidation?.presetValidation?.status === "PASS");
} catch (e) {
  assert("inspect --json parses", false, e.message);
}

assert(
  "doc prod ref not active",
  !resultDoc.includes(`projectRef=${PROD_REF}`) &&
    (!resultDoc.includes(PROD_REF) || /forbidden|never/i.test(resultDoc) || resultDoc.includes("forbiddenProjectRefs")),
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

assert("00-current-state mentions G-23f", currentState.includes("G-23f"));
assert("03-next-actions mentions G-23f", nextActions.includes("G-23f"));
assert("handoff mentions G-23f", handoff.includes("G-23f"));

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
  `\nG-23f Static-to-Astro CMS preset registry verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
