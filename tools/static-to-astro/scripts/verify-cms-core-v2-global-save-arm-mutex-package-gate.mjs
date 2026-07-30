/**
 * CMS Core v2 — Global Save arm mutex package generate gate verifier.
 * Phase: cms-core-v2-global-save-arm-mutex-package-gate
 *
 * Fixture / temporary directory only — does NOT run real package generate,
 * touch public-dist/output, FTP, Admin runtime, Edge, or remote Secrets.
 *
 * Run: npm run verify:cms-core-v2-global-save-arm-mutex-package-gate
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS,
  GOSAKI_MUTEX_INVENTORY_SITE_KEY,
} from "./lib/gosaki-operational-save-ui-arm-inventory.mjs";
import {
  assertGosakiOperationalClientSaveUiMutexForPackageGenerate,
  collectGosakiOperationalClientSaveUiMutexEntries,
  evaluateGosakiOperationalClientSaveUiMutexFromEnv,
  formatGosakiOperationalSaveUiMutexGateError,
  runGosakiOperationalSaveUiMutexGateThen,
  shouldApplyGosakiOperationalSaveUiMutexPackageGate,
} from "./lib/gosaki-operational-save-ui-arm-mutex-gate.mjs";
import {
  ADMIN_RUNTIME_MUTEX_WIRED,
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED,
  MUTEX_EVALUATOR_AVAILABLE,
  MUTEX_EVALUATOR_WIRED,
  MUTEX_REASON,
  PACKAGE_GENERATE_GATE_WIRED,
  evaluateOperationalClientSaveUiMutex,
} from "./lib/save-arm-mutex-utils.mjs";
import { isSaveArmExactTrue } from "./lib/save-arm-utils.mjs";
import { buildPackageRunMarker } from "./lib/package-run-marker.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const POLICY_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-global-save-arm-mutex-policy.md");
const BUILD_CORE = path.join(TOOL_ROOT, "scripts/lib/build-site-package-core.mjs");
const MANUAL_PKG = path.join(TOOL_ROOT, "scripts/lib/manual-upload-package.mjs");
const GATE_FILE = path.join(
  TOOL_ROOT,
  "scripts/lib/gosaki-operational-save-ui-arm-mutex-gate.mjs",
);
const ADMIN_TS = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function envAllFalse() {
  /** @type {Record<string, string>} */
  const env = {};
  for (const arm of GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS) {
    env[arm.clientEnv] = "false";
  }
  return env;
}

/**
 * @param {string[]} featureIds
 * @param {Record<string, string>} [base]
 */
function envArmIds(featureIds, base = envAllFalse()) {
  const env = { ...base };
  const set = new Set(featureIds);
  for (const arm of GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS) {
    env[arm.clientEnv] = set.has(arm.featureId) ? "true" : "false";
  }
  return env;
}

function fingerprintDir(dir) {
  if (!fs.existsSync(dir)) return { exists: false, entries: [] };
  const entries = fs.readdirSync(dir).sort();
  /** @type {Record<string, string>} */
  const hashes = {};
  for (const name of entries) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isFile()) {
      hashes[name] = `${st.size}:${fs.readFileSync(full, "utf8")}`;
    } else {
      hashes[name] = `dir:${st.mtimeMs}`;
    }
  }
  return { exists: true, entries, hashes };
}

function sameFingerprint(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- Flags ---
assert("MUTEX_EVALUATOR_AVAILABLE true", MUTEX_EVALUATOR_AVAILABLE === true);
assert("MUTEX_EVALUATOR_WIRED true", MUTEX_EVALUATOR_WIRED === true);
assert("PACKAGE_GENERATE_GATE_WIRED true", PACKAGE_GENERATE_GATE_WIRED === true);
assert(
  "GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED true",
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === true,
);
assert("ADMIN_RUNTIME_MUTEX_WIRED false", ADMIN_RUNTIME_MUTEX_WIRED === false);
assert("gate file exists", fs.existsSync(GATE_FILE));
assert("shouldApply gosaki-piano", shouldApplyGosakiOperationalSaveUiMutexPackageGate("gosaki-piano"));
assert(
  "shouldApply rejects other",
  !shouldApplyGosakiOperationalSaveUiMutexPackageGate("pilot-sample-static"),
);
assert("inventory site key", GOSAKI_MUTEX_INVENTORY_SITE_KEY === "gosaki-piano");

// --- Matrix via env → exact-true → evaluate ---
{
  const env = envAllFalse();
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  assert("all false ok", result.ok === true);
  assert("all false reason", result.reason === MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM);
  assert("all false count 0", result.armedCount === 0);
}

{
  const env = envArmIds(["gosaki-schedule"]);
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  assert("one true ok", result.ok === true);
  assert("one true reason", result.reason === MUTEX_REASON.SINGLE_OPERATIONAL_SAVE_ARM);
  assert("one true count 1", result.armedCount === 1);
  assert("one true id", result.armedFeatureIds[0] === "gosaki-schedule");
}

{
  const env = envArmIds(["gosaki-schedule", "gosaki-about-supabase"]);
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  assert("schedule+about fail", result.ok === false);
  assert(
    "schedule+about reason",
    result.reason === MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
  );
  assert("schedule+about count 2", result.armedCount === 2);
}

{
  const env = envArmIds(["gosaki-youtube-contents", "gosaki-youtube-supabase"]);
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  assert("youtube contents+supabase fail", result.ok === false);
  assert(
    "youtube pair reason",
    result.reason === MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
  );
}

{
  const env = envArmIds(["gosaki-about-contents", "gosaki-about-supabase"]);
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  assert("about contents+supabase fail", result.ok === false);
  assert(
    "about pair reason",
    result.reason === MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
  );
}

{
  const env = envAllFalse();
  env.PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED = " true ";
  const entries = collectGosakiOperationalClientSaveUiMutexEntries(env);
  const schedule = entries.find((e) => e.featureId === "gosaki-schedule");
  assert('" true " disarmed via exact-true', schedule?.armed === false);
  assert(
    '" true " isSaveArmExactTrue false',
    isSaveArmExactTrue(" true ") === false,
  );
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  assert('" true " gate ok (0 armed)', result.ok === true);
  assert("\" true \" armedCount 0", result.armedCount === 0);
}

function deepFingerprint(root) {
  /** @type {Record<string, string>} */
  const out = {};
  function walk(dir, rel = "") {
    if (!fs.existsSync(dir)) {
      out["__missing__"] = "1";
      return;
    }
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const key = rel ? `${rel}/${name}` : name;
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        out[`${key}/`] = `dir:${st.mtimeMs}`;
        walk(full, key);
      } else {
        out[key] = `file:${st.size}:${st.mtimeMs}:${fs.readFileSync(full, "utf8")}`;
      }
    }
  }
  walk(root);
  return out;
}

function sameDeep(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Simulate authoritative gate then optional package-dir mutation (Core pattern).
 * FAIL must not call mutate / mkdir / marker.
 */
function simulatePackageGenerateGate(env, paths, mutate) {
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  if (!result.ok) {
    return { ok: false, proceeded: false, result, mutated: false };
  }
  mutate(result);
  return { ok: true, proceeded: true, result, mutated: true };
}

// --- FAIL: filesystem untouched across package-like layout; PASS: proceeded once ---
{
  const cases = [
    {
      label: "schedule+about",
      env: envArmIds(["gosaki-schedule", "gosaki-about-supabase"]),
      expectReason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    },
    {
      label: "youtube-pair",
      env: envArmIds(["gosaki-youtube-contents", "gosaki-youtube-supabase"]),
      expectReason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    },
    {
      label: "about-pair",
      env: envArmIds(["gosaki-about-contents", "gosaki-about-supabase"]),
      expectReason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    },
  ];

  for (const c of cases) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), `mutex-fs-${c.label}-`));
    const packageDir = path.join(root, "packageDir");
    const stale = path.join(root, "_stale-backup");
    const output = path.join(root, "output");
    const publicDist = path.join(root, "public-dist");
    const packageRuns = path.join(root, "_package-runs");
    const marker = path.join(packageRuns, "PACKAGE_RUN.json");
    const probe = path.join(root, "EXISTING_PROBE.txt");
    fs.mkdirSync(packageDir, { recursive: true });
    fs.mkdirSync(stale, { recursive: true });
    fs.mkdirSync(output, { recursive: true });
    fs.mkdirSync(publicDist, { recursive: true });
    fs.mkdirSync(packageRuns, { recursive: true });
    fs.writeFileSync(probe, "keep-me\n", "utf8");
    fs.writeFileSync(path.join(packageDir, "placeholder.txt"), "pkg\n", "utf8");
    const before = deepFingerprint(root);
    const probeBefore = {
      content: fs.readFileSync(probe, "utf8"),
      mtimeMs: fs.statSync(probe).mtimeMs,
    };

    let mutateCount = 0;
    const run = simulatePackageGenerateGate(c.env, {}, () => {
      mutateCount += 1;
      fs.writeFileSync(path.join(packageDir, "NEW.txt"), "nope\n");
      fs.mkdirSync(path.join(root, "temp-created"), { recursive: true });
      fs.writeFileSync(marker, "{}\n");
      fs.renameSync(packageDir, path.join(stale, "relocated"));
    });

    assert(`${c.label} fail ok=false`, run.ok === false);
    assert(`${c.label} reason`, run.result.reason === c.expectReason);
    assert(`${c.label} mutateCount 0`, mutateCount === 0);
    assert(`${c.label} deep fingerprint unchanged`, sameDeep(before, deepFingerprint(root)));
    assert(
      `${c.label} probe content/mtime unchanged`,
      fs.readFileSync(probe, "utf8") === probeBefore.content &&
        fs.statSync(probe).mtimeMs === probeBefore.mtimeMs,
    );
    assert(`${c.label} marker not created`, !fs.existsSync(marker));
    assert(`${c.label} no temp-created`, !fs.existsSync(path.join(root, "temp-created")));
    assert(`${c.label} packageDir listing unchanged`, fs.existsSync(path.join(packageDir, "placeholder.txt")));

    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  // invalid input — Core evaluate; no FS mutation
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mutex-fs-invalid-"));
  const probe = path.join(root, "EXISTING_PROBE.txt");
  fs.writeFileSync(probe, "keep\n", "utf8");
  const before = deepFingerprint(root);
  const badResult = evaluateOperationalClientSaveUiMutex([{ featureId: "x", armed: "yes" }]);
  assert("invalid ok false", badResult.ok === false);
  assert(
    "invalid reason",
    badResult.reason === MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
  );
  assert("invalid deep fingerprint unchanged", sameDeep(before, deepFingerprint(root)));
  fs.rmSync(root, { recursive: true, force: true });
}

// --- PASS normal matrix (tempdir only · one onPass) ---
{
  const passCases = [
    { label: "env-unset", env: {}, expectReason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM },
    { label: "all-false", env: envAllFalse(), expectReason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM },
    {
      label: "one-true",
      env: envArmIds(["gosaki-schedule"]),
      expectReason: MUTEX_REASON.SINGLE_OPERATIONAL_SAVE_ARM,
    },
    {
      label: "padded-true-disarmed",
      env: { ...envAllFalse(), PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED: " true " },
      expectReason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM,
    },
  ];
  for (const c of passCases) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), `mutex-pass-${c.label}-`));
    const probe = path.join(root, "PROBE.txt");
    let calls = 0;
    const run = runGosakiOperationalSaveUiMutexGateThen(c.env, (result) => {
      calls += 1;
      fs.writeFileSync(
        probe,
        JSON.stringify({
          mutexChecked: true,
          mutexReason: result.reason,
          armedCount: result.armedCount,
          armedFeatureIds: result.armedFeatureIds,
        }),
        "utf8",
      );
      return "ok";
    });
    assert(`${c.label} pass ok`, run.ok === true);
    assert(`${c.label} reason`, run.result.reason === c.expectReason);
    assert(`${c.label} onPass once`, calls === 1);
    assert(`${c.label} probe once`, fs.existsSync(probe));
    const evidence = JSON.parse(fs.readFileSync(probe, "utf8"));
    assert(`${c.label} no env in evidence`, !/PUBLIC_|SECRET|eyJ/.test(JSON.stringify(evidence)));
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  // error format
  const fakeFail = {
    ok: false,
    reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
    armedCount: 0,
    armedFeatureIds: [],
  };
  const msg = formatGosakiOperationalSaveUiMutexGateError(fakeFail);
  assert("error includes reason", /reason=invalid_operational_save_arm_input/.test(msg));
  assert("error includes armedCount", /armedCount=0/.test(msg));
  assert("error includes armedFeatureIds", /armedFeatureIds=/.test(msg));
  assert("error has no secret-like payload", !/sk_live|service_role|eyJ/.test(msg));
  assert("error does not log env values", !/PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED=/.test(msg));
}

// Marker optional fields: legacy reader tolerates absence
{
  const legacy = buildPackageRunMarker({
    runId: "r1",
    generatedAt: "t",
    sourceCommit: "abc",
    siteKey: "gosaki-piano",
    profile: "staging",
  });
  assert("legacy marker has no mutexChecked required", legacy.mutexChecked === undefined);
  const withMutex = buildPackageRunMarker({
    runId: "r2",
    generatedAt: "t",
    sourceCommit: "abc",
    siteKey: "gosaki-piano",
    profile: "staging",
    mutex: {
      mutexChecked: true,
      mutexReason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM,
      armedCount: 0,
      armedFeatureIds: [],
    },
  });
  assert("new marker mutexChecked", withMutex.mutexChecked === true);
  assert("new marker no secrets", !/PUBLIC_|eyJ|service_role/.test(JSON.stringify(withMutex)));
}

// --- Wiring: injection (Core must not import Gosaki mutex gate) ---
const buildSrc = fs.readFileSync(BUILD_CORE, "utf8");
assert(
  "build-site-package-core does NOT import mutex gate",
  !/gosaki-operational-save-ui-arm-mutex-gate/.test(buildSrc),
);
assert(
  "build-site-package-core accepts beforeFirstFilesystemWrite",
  /beforeFirstFilesystemWrite/.test(buildSrc),
);
assert(
  "build-site-package-core runs callback before relocate",
  /beforeFirstFilesystemWrite[\s\S]*relocateExistingManualUploadPackageToStaleBackup/.test(
    buildSrc,
  ),
);
assert(
  "build-site-package-core does not pass beforePackageDirMutation (no double gate)",
  !/beforePackageDirMutation/.test(buildSrc),
);
const manualSrc = fs.readFileSync(MANUAL_PKG, "utf8");
assert(
  "manual-upload-package does NOT import mutex gate",
  !/gosaki-operational-save-ui-arm-mutex-gate/.test(manualSrc),
);
assert(
  "manual-upload-package accepts beforePackageDirMutation",
  /beforePackageDirMutation/.test(manualSrc),
);
assert(
  "manual-upload-package runs callback before rmSync",
  /beforePackageDirMutation[\s\S]*fs\.rmSync/.test(manualSrc),
);

const entrypoints = [
  path.join(TOOL_ROOT, "scripts/build-site-package.mjs"),
  path.join(TOOL_ROOT, "scripts/build-gosaki-staging-admin-package.mjs"),
  path.join(TOOL_ROOT, "scripts/build-gosaki-production-package.mjs"),
  path.join(TOOL_ROOT, "scripts/create-manual-upload-package.mjs"),
];
for (const ep of entrypoints) {
  const src = fs.readFileSync(ep, "utf8");
  const base = path.basename(ep);
  assert(`${base} imports mutex gate adapter`, /gosaki-operational-save-ui-arm-mutex-gate/.test(src));
  if (base === "create-manual-upload-package.mjs") {
    assert(
      `${base} injects beforePackageDirMutation`,
      /createGosakiBeforePackageDirMutation/.test(src),
    );
  } else {
    assert(
      `${base} injects beforeFirstFilesystemWrite`,
      /createGosakiBeforeFirstFilesystemWrite/.test(src),
    );
  }
}

const adminSrc = fs.readFileSync(ADMIN_TS, "utf8");
assert(
  "Admin runtime not wired to mutex gate",
  !/gosaki-operational-save-ui-arm-mutex-gate|evaluateOperationalClientSaveUiMutex|evaluateGosakiOperationalClientSaveUiMutexFromEnv/.test(
    adminSrc,
  ),
);

// Gate does not read Secrets / production ref
const gateSrc = fs.readFileSync(GATE_FILE, "utf8");
assert("gate has no Deno.env", !/Deno\.env/.test(gateSrc));
assert("gate has no service_role", !/service_role/.test(gateSrc));
assert(
  "gate does not weaken production STOP",
  !/PRODUCTION_REF_STOP|vsbvndwuajjhnzpohghh/.test(gateSrc),
);
assert("gate uses isSaveArmExactTrue", /isSaveArmExactTrue/.test(gateSrc));
assert(
  "gate uses evaluateOperationalClientSaveUiMutex",
  /evaluateOperationalClientSaveUiMutex/.test(gateSrc),
);
assert(
  "gate documents Core must not import",
  /must NOT import this file/.test(gateSrc),
);

// --- Policy §16 ---
assert("policy doc exists", fs.existsSync(POLICY_DOC));
const doc = fs.readFileSync(POLICY_DOC, "utf8");
assert(
  "policy package-gate phase",
  /cms-core-v2-global-save-arm-mutex-package-gate/.test(doc),
);
assert(
  "policy §16 PACKAGE_GENERATE_GATE_WIRED true",
  /## 16[\s\S]*PACKAGE_GENERATE_GATE_WIRED:\s*true/.test(doc),
);
assert(
  "policy §16 ADMIN_RUNTIME_MUTEX_WIRED false",
  /## 16[\s\S]*ADMIN_RUNTIME_MUTEX_WIRED:\s*false/.test(doc),
);
assert(
  "policy §16 GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED true",
  /## 16[\s\S]*GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED:\s*true/.test(doc),
);

console.log(`\nMUTEX_EVALUATOR_AVAILABLE: ${MUTEX_EVALUATOR_AVAILABLE}`);
console.log(`MUTEX_EVALUATOR_WIRED: ${MUTEX_EVALUATOR_WIRED}`);
console.log(`PACKAGE_GENERATE_GATE_WIRED: ${PACKAGE_GENERATE_GATE_WIRED}`);
console.log(`GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: ${GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED}`);
console.log(`ADMIN_RUNTIME_MUTEX_WIRED: ${ADMIN_RUNTIME_MUTEX_WIRED}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-global-save-arm-mutex-package-gate");
