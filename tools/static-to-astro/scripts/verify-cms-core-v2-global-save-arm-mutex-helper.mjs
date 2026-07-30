/**
 * CMS Core v2 — Global Save arm mutex helper verifier.
 * Phase: cms-core-v2-global-save-arm-mutex-helper
 *
 * Confirms site-agnostic evaluateOperationalClientSaveUiMutex contract +
 * unwired status. Does not wire package generate / Admin / Edge.
 *
 * Run: npm run verify:cms-core-v2-global-save-arm-mutex-helper
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MUTEX_EVAL_FIXTURE_MATRIX } from "./lib/cms-core-v2-save-arm-mutex-eval-fixtures.mjs";
import { GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS } from "./lib/gosaki-operational-save-ui-arm-inventory.mjs";
import {
  ADMIN_RUNTIME_MUTEX_WIRED,
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED,
  MUTEX_EVALUATOR_AVAILABLE,
  MUTEX_EVALUATOR_WIRED,
  MUTEX_REASON,
  PACKAGE_GENERATE_GATE_WIRED,
  evaluateOperationalClientSaveUiMutex,
} from "./lib/save-arm-mutex-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const HELPER = path.join(TOOL_ROOT, "scripts/lib/save-arm-mutex-utils.mjs");
const POLICY_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-global-save-arm-mutex-policy.md");
const PACKAGE_MARKER = path.join(TOOL_ROOT, "scripts/lib/package-run-marker.mjs");
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

function walkFiles(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "output", ".git", "fixtures"].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, exts, out);
    else if (exts.some((e) => ent.name.endsWith(e))) out.push(full);
  }
  return out;
}

function sameIds(a, b) {
  const aa = [...(a ?? [])];
  const bb = [...(b ?? [])];
  if (aa.length !== bb.length) return false;
  return aa.every((v, i) => v === bb[i]);
}

assert("helper file exists", fs.existsSync(HELPER));
const helperSrc = fs.readFileSync(HELPER, "utf8");
assert(
  "helper exports evaluateOperationalClientSaveUiMutex",
  /export function evaluateOperationalClientSaveUiMutex/.test(helperSrc),
);
assert("helper has no gosaki import", !/from ["'].*gosaki-/i.test(helperSrc));
assert("helper has no env parse", !/isSaveArmExactTrue|process\.env|Deno\.env/.test(helperSrc));
assert("helper has no production ref", !/vsbvndwuajjhnzpohghh|PRODUCTION_REF/.test(helperSrc));
assert("MUTEX_EVALUATOR_AVAILABLE true", MUTEX_EVALUATOR_AVAILABLE === true);
assert("MUTEX_EVALUATOR_WIRED true", MUTEX_EVALUATOR_WIRED === true);
assert("PACKAGE_GENERATE_GATE_WIRED true", PACKAGE_GENERATE_GATE_WIRED === true);
assert(
  "GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED true",
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === true,
);
assert("ADMIN_RUNTIME_MUTEX_WIRED false", ADMIN_RUNTIME_MUTEX_WIRED === false);

// --- Fixture matrix ---
for (const row of MUTEX_EVAL_FIXTURE_MATRIX) {
  const result = evaluateOperationalClientSaveUiMutex(row.input);
  assert(`fixture ok[${row.label}]`, result.ok === row.ok, `got ok=${result.ok}`);
  assert(
    `fixture reason[${row.label}]`,
    result.reason === row.reason,
    `got ${result.reason}`,
  );
  assert(
    `fixture armedCount[${row.label}]`,
    result.armedCount === row.armedCount,
    `got ${result.armedCount}`,
  );
  if (row.armedFeatureIds) {
    assert(
      `fixture armedFeatureIds[${row.label}]`,
      sameIds(result.armedFeatureIds, row.armedFeatureIds),
      JSON.stringify(result.armedFeatureIds),
    );
  }
  if (row.reason === MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT) {
    assert(
      `fixture invalidEntries[${row.label}]`,
      Array.isArray(result.invalidEntries) && result.invalidEntries.length > 0,
    );
  }
}

// Extra: never throws
assert(
  "never throws on garbage",
  (() => {
    try {
      evaluateOperationalClientSaveUiMutex(undefined);
      evaluateOperationalClientSaveUiMutex(42);
      evaluateOperationalClientSaveUiMutex([{ featureId: null, armed: true }]);
      return true;
    } catch {
      return false;
    }
  })(),
);

// --- Gosaki inventory shaped fixtures (verifier → inventory; helper stays agnostic) ---
assert(
  "gosaki inventory has 6 arms",
  GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.length === 6,
);
const gosakiAllFalse = GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.map((a) => ({
  featureId: a.featureId,
  armed: false,
}));
const allFalseResult = evaluateOperationalClientSaveUiMutex(gosakiAllFalse);
assert("gosaki inventory all false ok", allFalseResult.ok === true);
assert(
  "gosaki inventory all false reason",
  allFalseResult.reason === MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM,
);
assert("gosaki inventory all false count 0", allFalseResult.armedCount === 0);

const oneTrue = gosakiAllFalse.map((row, i) =>
  i === 0 ? { ...row, armed: true } : row,
);
const oneTrueResult = evaluateOperationalClientSaveUiMutex(oneTrue);
assert("gosaki inventory one true ok", oneTrueResult.ok === true);
assert(
  "gosaki inventory one true reason",
  oneTrueResult.reason === MUTEX_REASON.SINGLE_OPERATIONAL_SAVE_ARM,
);
assert("gosaki inventory one true count 1", oneTrueResult.armedCount === 1);
assert(
  "gosaki inventory one true id",
  oneTrueResult.armedFeatureIds[0] === GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS[0].featureId,
);

const ytPair = GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.filter((a) => a.family === "youtube").map(
  (a) => ({ featureId: a.featureId, armed: true }),
);
const ytPairResult = evaluateOperationalClientSaveUiMutex(ytPair);
assert("gosaki youtube pair fails", ytPairResult.ok === false);
assert(
  "gosaki youtube pair reason",
  ytPairResult.reason === MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
);

// --- Wired to package gate only; Admin / Edge remain unwired ---
const allowBase = new Set([
  "save-arm-mutex-utils.mjs",
  "cms-core-v2-save-arm-mutex-eval-fixtures.mjs",
  "verify-cms-core-v2-global-save-arm-mutex-helper.mjs",
  "verify-cms-core-v2-global-save-arm-mutex-inventory.mjs",
  "verify-cms-core-v2-global-save-arm-mutex-package-gate.mjs",
  "gosaki-operational-save-ui-arm-mutex-gate.mjs",
  "gosaki-operational-save-ui-arm-inventory.mjs",
  "build-site-package-core.mjs",
  "manual-upload-package.mjs",
  "cms-core-v2-save-arm-parse-policy-fixtures.mjs",
]);
const wireRoots = [
  path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano"),
  path.join(TOOL_ROOT, "scripts/lib"),
  path.join(TOOL_ROOT, "scripts/edge-functions"),
  path.join(REPO_ROOT, "supabase/functions"),
];
const wireFiles = wireRoots.flatMap((root) => walkFiles(root, [".ts", ".mjs", ".js", ".astro"]));
const wireHits = wireFiles.filter((f) => {
  if (allowBase.has(path.basename(f))) return false;
  const text = fs.readFileSync(f, "utf8");
  return (
    /save-arm-mutex-utils/.test(text) ||
    /evaluateOperationalClientSaveUiMutex/.test(text) ||
    /operationalSaveUiArmedCount/.test(text)
  );
});
assert(
  "helper not wired to Admin/Edge (package gate allowlisted)",
  wireHits.length === 0,
  wireHits.map((f) => path.relative(REPO_ROOT, f)).join(", "),
);

assert("admin ts does not import mutex helper", !/save-arm-mutex-utils|evaluateOperationalClientSaveUiMutex/.test(fs.readFileSync(ADMIN_TS, "utf8")));
assert(
  "package-run-marker does not import mutex helper",
  !/save-arm-mutex-utils|evaluateOperationalClientSaveUiMutex|operationalSaveUiArmedCount/.test(
    fs.readFileSync(PACKAGE_MARKER, "utf8"),
  ),
);

// Gosaki inventory must not import Core mutex helper (gate adapter does)
const invSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/gosaki-operational-save-ui-arm-inventory.mjs"),
  "utf8",
);
assert(
  "gosaki inventory does not import save-arm-mutex-utils",
  !/save-arm-mutex-utils|evaluateOperationalClientSaveUiMutex/.test(invSrc),
);

assert("policy doc exists", fs.existsSync(POLICY_DOC));
const doc = fs.readFileSync(POLICY_DOC, "utf8");
assert(
  "policy mentions helper phase",
  /cms-core-v2-global-save-arm-mutex-helper/.test(doc),
);
assert(
  "policy MUTEX_EVALUATOR_AVAILABLE true",
  /MUTEX_EVALUATOR_AVAILABLE:\s*true/.test(doc),
);
assert(
  "policy §16 MUTEX_EVALUATOR_WIRED true",
  /## 16[\s\S]*MUTEX_EVALUATOR_WIRED:\s*true/.test(doc),
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
console.log("OK cms-core-v2-global-save-arm-mutex-helper");
