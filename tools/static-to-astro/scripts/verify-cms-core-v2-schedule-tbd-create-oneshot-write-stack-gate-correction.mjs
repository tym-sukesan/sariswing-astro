#!/usr/bin/env node
/**
 * Offline verifier — TBD CREATE oneshot write-stack gate correction.
 * npm: verify:cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction
 *
 * No env mutation / network / DB write. Matrix A–I via esbuild bundles.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction.md",
);
const FINAL = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.md",
);
const IMPL = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md",
);
const PLAN = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.md",
);
const CONFIG = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-config.ts",
);
const G22E = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-config.ts",
);
const G9K = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts",
);
const G6G1 = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/schedule-general-edit-config.ts",
);
const G6D = path.join(REPO_ROOT, "src/lib/admin/staging-write/staging-write-config.ts");
const YT = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-config.ts",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const OUT = path.join(TOOL_ROOT, "output/_tbd-oneshot-write-stack-gate-bundles");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const STAGING_URL = `https://${STAGING_REF}.supabase.co`;
const PRODUCTION_URL = `https://${PRODUCTION_REF}.supabase.co`;
const APPROVAL = "cms-core-v2-schedule-tbd-create-non-dry-run-oneshot";
const CLIENT_ARM = "PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED";
const SERVER_ARM = "ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED";
const PEER_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED";

let passed = 0;
let failed = 0;
function assert(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS ${name}`);
    passed += 1;
  } else {
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function writeEnabled(cfg) {
  if (!cfg || typeof cfg !== "object") return false;
  if (cfg.saveEnabled === true) return true;
  if (cfg.armed === true && cfg.saveAllowed === true) return true;
  if (cfg.canWrite === true && cfg.writeOperationsEnabled === true) return true;
  return false;
}

function bundleEntry(label, entry) {
  fs.mkdirSync(OUT, { recursive: true });
  const outfile = path.join(OUT, `${label}.mjs`);
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    packages: "external",
  });
  return outfile;
}

const doc = fs.readFileSync(DOC, "utf8");
const finalDoc = fs.readFileSync(FINAL, "utf8");
const impl = fs.readFileSync(IMPL, "utf8");
const plan = fs.readFileSync(PLAN, "utf8");
const configSrc = fs.readFileSync(CONFIG, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert("correction doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction/.test(doc),
);
assert("IMPLEMENTATION_READY true", /IMPLEMENTATION_READY:\s*true/.test(doc));
assert("PREFLIGHT_PASS true", /PREFLIGHT_PASS:\s*true/.test(doc));
assert("EXECUTION_PACKET_READY true", /EXECUTION_PACKET_READY:\s*true/.test(doc));
assert("ACTUAL_WRITE_READY false", /ACTUAL_WRITE_READY:\s*false/.test(doc));
assert("ACTUAL_WRITE_EXECUTED false", /ACTUAL_WRITE_EXECUTED:\s*false/.test(doc));
assert("PACKET_ONESHOT_ONLY_PROVEN true", /PACKET_ONESHOT_ONLY_PROVEN:\s*true/.test(doc));
assert("PROCESS_SCOPED_ENV_REQUIRED true", /PROCESS_SCOPED_ENV_REQUIRED:\s*true/.test(doc));
assert(
  "process-scoped 7-key ON command",
  /Exact process-scoped 7-key ON command/.test(doc) &&
    /env \\\s*\n\s*ENABLE_ADMIN_STAGING_WRITE=true/.test(doc) &&
    /npm run dev/.test(doc),
);
assert(
  "forbid .env.local write for 7 keys",
  /Forbidden:.*\.env\.local|forbidden.*\.env\.local/i.test(doc),
);
assert(
  "OFF is Ctrl+C not file restore",
  /Ctrl\+C/.test(doc) && /no `\.env\.local` restore/.test(doc),
);
assert("fan-out table", /Runtime consumers \(fan-out\)/.test(doc));
assert("matrix A–I section", /Offline config matrix/.test(doc) && /\|\s*\*\*A\*\*/.test(doc));
assert("no trim oneshot provider", /no trim/.test(doc));
assert(
  "process env overrides .env files",
  /process env overrides/.test(doc),
);
assert(
  "client PUBLIC + SSR private documented",
  /PUBLIC_\*/.test(doc) && /ADMIN_\*/.test(doc) && /mergeStagingShellEnv/.test(doc),
);
assert("npm script registered", /verify:cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction/.test(pkg));
assert("safety suite lists verifier", /verify-cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction\.mjs/.test(suite));

assert(
  "final-preflight process-scoped command",
  /env \\\s*\n\s*ENABLE_ADMIN_STAGING_WRITE=true/.test(finalDoc) && /npm run dev/.test(finalDoc),
);
assert(
  "final-preflight ACTUAL_WRITE_READY false",
  /ACTUAL_WRITE_READY:\s*false/.test(finalDoc),
);
assert(
  "final-preflight no 3-keys-only claim",
  !/exactly these 3/.test(finalDoc),
);
assert(
  "final-preflight no Restore root .env.local",
  !/Restore root `\.env\.local`/.test(finalDoc),
);
assert(
  "impl mentions process-scoped / write-stack",
  /process-scoped|write-stack|7-key|7 keys/.test(impl),
);
assert(
  "planning mentions process-scoped",
  /process-scoped|write-stack|env … npm run dev|env \.\.\. npm run dev/.test(plan),
);

assert(
  "oneshot ENABLE exact true no trim",
  /ENABLE_ADMIN_STAGING_WRITE === "true"/.test(configSrc),
);
assert(
  "oneshot provider no trim",
  /providerRaw = String\(mergedEnv\.PUBLIC_ADMIN_WRITE_PROVIDER \?\? ""\)/.test(configSrc) &&
    !/providerRaw = String\(mergedEnv\.PUBLIC_ADMIN_WRITE_PROVIDER \?\? ""\)\.trim\(\)/.test(
      configSrc,
    ),
);
assert(
  "oneshot module no trim",
  /module = String\(mergedEnv\.PUBLIC_ADMIN_WRITE_MODULE \?\? ""\)/.test(configSrc) &&
    !/module = String\(mergedEnv\.PUBLIC_ADMIN_WRITE_MODULE \?\? ""\)\.trim\(\)/.test(configSrc),
);
assert(
  "oneshot approval no trim",
  /approvalIdEnv = String\(mergedEnv\.PUBLIC_ADMIN_WRITE_APPROVAL_ID \?\? ""\)/.test(configSrc) &&
    !/approvalIdEnv = String\(mergedEnv\.PUBLIC_ADMIN_WRITE_APPROVAL_ID \?\? ""\)\.trim\(\)/.test(
      configSrc,
    ),
);

const oneshotPath = bundleEntry("oneshot-config", CONFIG);
const g22ePath = bundleEntry("g22e-config", G22E);
const g9kPath = bundleEntry("g9k-config", G9K);
const g6g1Path = bundleEntry("g6g1-config", G6G1);
const g6dPath = bundleEntry("g6d-config", G6D);
const ytPath = bundleEntry("yt-config", YT);

const oneshot = await import(`${pathToFileURL(oneshotPath).href}?t=${Date.now()}`);
const g22e = await import(`${pathToFileURL(g22ePath).href}?t=${Date.now()}`);
const g9k = await import(`${pathToFileURL(g9kPath).href}?t=${Date.now()}`);
const g6g1 = await import(`${pathToFileURL(g6g1Path).href}?t=${Date.now()}`);
const g6d = await import(`${pathToFileURL(g6dPath).href}?t=${Date.now()}`);
const yt = await import(`${pathToFileURL(ytPath).href}?t=${Date.now()}`);

const { getTbdCreateOneshotConfig } = oneshot;
const { getG22eNewEventInsertConfig } = g22e;
const { getG9kExistingEventSaveButtonConfig } = g9k;
const { getScheduleGeneralEditConfig } = g6g1;
const { getStagingWriteConfig } = g6d;
const { getG10cYoutubeEmbedStaticJsonWriteConfig } = yt;

function baseStaging(extra = {}) {
  return {
    PUBLIC_SUPABASE_URL: STAGING_URL,
    PUBLIC_SUPABASE_ANON_KEY: "anon-test",
    ENABLE_ADMIN_STAGING_SHELL: "true",
    DEV: true,
    ...extra,
  };
}

function writeStack4(extra = {}) {
  return {
    ENABLE_ADMIN_STAGING_WRITE: "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: "supabase",
    PUBLIC_ADMIN_WRITE_MODULE: "schedule",
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: APPROVAL,
    ...extra,
  };
}

function oneshot3(extra = {}) {
  return {
    [CLIENT_ARM]: "true",
    [SERVER_ARM]: "true",
    PUBLIC_ADMIN_WRITE_DRY_RUN: "false",
    ...extra,
  };
}

function sevenExact(extra = {}) {
  return baseStaging({
    ...writeStack4(),
    ...oneshot3(),
    ...extra,
  });
}

function sampleOthers(env) {
  return {
    oneshot: getTbdCreateOneshotConfig(env, { serverArmOkFromSsr: env[SERVER_ARM] === "true" }),
    g22e: getG22eNewEventInsertConfig(env),
    g9k: getG9kExistingEventSaveButtonConfig(env),
    g6g1: getScheduleGeneralEditConfig(env),
    g6d: getStagingWriteConfig(env),
    youtube: getG10cYoutubeEmbedStaticJsonWriteConfig(env),
  };
}

function assertAllOthersOff(label, samples) {
  for (const [k, cfg] of Object.entries(samples)) {
    if (k === "oneshot") continue;
    assert(`${label} ${k} write OFF`, !writeEnabled(cfg));
  }
}

// A — baseline
{
  const env = baseStaging({
    ENABLE_ADMIN_STAGING_WRITE: "false",
    PUBLIC_ADMIN_WRITE_PROVIDER: "",
    PUBLIC_ADMIN_WRITE_MODULE: "",
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: "",
    PUBLIC_ADMIN_WRITE_DRY_RUN: "true",
  });
  const s = sampleOthers(env);
  assert("matrix A oneshot OFF", !writeEnabled(s.oneshot));
  assertAllOthersOff("matrix A", s);
}

// B — write-stack 4 only
{
  const env = baseStaging({
    ...writeStack4(),
    PUBLIC_ADMIN_WRITE_DRY_RUN: "true",
  });
  const s = sampleOthers(env);
  assert("matrix B oneshot OFF", !writeEnabled(s.oneshot));
  assertAllOthersOff("matrix B", s);
}

// C — write-stack 4 + dry-run false · arms OFF
{
  const env = baseStaging({
    ...writeStack4(),
    PUBLIC_ADMIN_WRITE_DRY_RUN: "false",
  });
  const s = sampleOthers(env);
  assert("matrix C oneshot OFF", !writeEnabled(s.oneshot));
  assertAllOthersOff("matrix C", s);
}

// D — oneshot 3 only · write-stack insufficient
{
  const env = baseStaging({
    ...oneshot3(),
    ENABLE_ADMIN_STAGING_WRITE: "false",
    PUBLIC_ADMIN_WRITE_PROVIDER: "",
    PUBLIC_ADMIN_WRITE_MODULE: "",
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: "",
  });
  const s = sampleOthers(env);
  assert("matrix D oneshot OFF", !writeEnabled(s.oneshot));
}

// E — 7 keys exact
{
  const env = sevenExact();
  const s = sampleOthers(env);
  assert("matrix E oneshot ON", writeEnabled(s.oneshot));
  assert("matrix E oneshot tbdWriteEnabled", s.oneshot.tbdWriteEnabled === true);
  assertAllOthersOff("matrix E", s);
}

// F — E + peer arm
{
  const env = sevenExact({ [PEER_ARM]: "true" });
  const s = sampleOthers(env);
  assert("matrix F oneshot STOP", !writeEnabled(s.oneshot));
}

// G — E + production URL
{
  const env = sevenExact({ PUBLIC_SUPABASE_URL: PRODUCTION_URL });
  const s = sampleOthers(env);
  assert("matrix G oneshot STOP", !writeEnabled(s.oneshot));
}

// H — mismatches
{
  for (const [label, patch] of [
    ["approval", { PUBLIC_ADMIN_WRITE_APPROVAL_ID: "wrong-approval" }],
    ["provider", { PUBLIC_ADMIN_WRITE_PROVIDER: "static-json" }],
    ["module", { PUBLIC_ADMIN_WRITE_MODULE: "discography" }],
    ["provider whitespace", { PUBLIC_ADMIN_WRITE_PROVIDER: "supabase " }],
    ["True case", { ENABLE_ADMIN_STAGING_WRITE: "True" }],
  ]) {
    const env = sevenExact(patch);
    const cfg = getTbdCreateOneshotConfig(env, { serverArmOkFromSsr: true });
    assert(`matrix H ${label} STOP`, !writeEnabled(cfg));
  }
}

// I — E: other CMS / routine paths remain disarmed (sampled)
{
  const env = sevenExact();
  const s = sampleOthers(env);
  assert("matrix I oneshot only ON", writeEnabled(s.oneshot));
  assertAllOthersOff("matrix I", s);
  assert(
    "matrix I g6d module mismatch reason",
    s.g6d.canWrite === false && /profile|MODULE|approval/i.test(String(s.g6d.disabledReason ?? "")),
  );
}

assert(
  "no file restore packet for provider/module/approval",
  !/PUBLIC_ADMIN_WRITE_PROVIDER=\s*\nPUBLIC_ADMIN_WRITE_MODULE=\s*\nPUBLIC_ADMIN_WRITE_APPROVAL_ID=/.test(
    doc,
  ),
);
assert("armed build forbidden in write-stack doc", /Do not.*armed `build`|armed `build`\/package/i.test(doc));

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
