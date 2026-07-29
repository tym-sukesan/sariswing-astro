/**
 * CMS Core v2 — Save arm exact-true helper verifier.
 * Confirms helper contract + unwired status. Does not change runtime parsers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isSaveArmExactTrue } from "./lib/save-arm-utils.mjs";
import {
  ARM_PARSE_FIXTURE_MATRIX,
  POLICY_FULLY_IMPLEMENTED,
  policyArmedExactTrue,
} from "./lib/cms-core-v2-save-arm-parse-policy-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const HELPER = path.join(TOOL_ROOT, "scripts/lib/save-arm-utils.mjs");
const POLICY_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-save-arm-parse-policy.md");

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
    if (ent.name === "node_modules" || ent.name === "output" || ent.name === ".git") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, exts, out);
    else if (exts.some((e) => ent.name.endsWith(e))) out.push(full);
  }
  return out;
}

assert("helper file exists", fs.existsSync(HELPER));
const helperSrc = fs.readFileSync(HELPER, "utf8");
assert("helper exports isSaveArmExactTrue", /export function isSaveArmExactTrue/.test(helperSrc));
assert("helper uses raw === \"true\"", /return raw === "true"/.test(helperSrc));
assert("helper has no trim", !/\.trim\(/.test(helperSrc));
assert("helper has no toLowerCase", !/toLowerCase/.test(helperSrc));
assert("helper has no gosaki import", !/from ["'].*gosaki-/i.test(helperSrc));

// Matrix from policy fixtures — helper must match policy column
for (const row of ARM_PARSE_FIXTURE_MATRIX) {
  assert(
    `helper matrix[${row.label}]`,
    isSaveArmExactTrue(row.raw) === row.policy,
  );
  assert(
    `helper === policyArmedExactTrue[${row.label}]`,
    isSaveArmExactTrue(row.raw) === policyArmedExactTrue(row.raw),
  );
}

// Extra strict cases beyond matrix
const EXTRA = [
  ["null", null, false],
  ["boolean-true", true, false],
  ["boolean-false", false, false],
  ["number-1", 1, false],
  ["number-0", 0, false],
  ["object", { true: true }, false],
  ["array", ["true"], false],
  ["true-string-only", "true", true],
];
for (const [label, raw, expected] of EXTRA) {
  assert(`helper extra[${label}]`, isSaveArmExactTrue(raw) === expected);
}

assert("POLICY_FULLY_IMPLEMENTED still false", POLICY_FULLY_IMPLEMENTED === false);

// Unwired: runtime / feature paths must not import save-arm-utils
const runtimeRoots = [
  path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano"),
  path.join(TOOL_ROOT, "scripts/edge-functions"),
  path.join(REPO_ROOT, "supabase/functions"),
];
const runtimeFiles = runtimeRoots.flatMap((root) =>
  walkFiles(root, [".ts", ".mjs", ".js", ".astro"]),
);
const runtimeHits = runtimeFiles.filter((f) => {
  const text = fs.readFileSync(f, "utf8");
  return /save-arm-utils/.test(text) || /isSaveArmExactTrue/.test(text);
});
assert(
  "helper unwired from Admin/Edge/supabase runtime",
  runtimeHits.length === 0,
  runtimeHits.map((f) => path.relative(REPO_ROOT, f)).join(", "),
);

// package-run-marker + operational libs (except fixtures/verifiers) unwired
const libDir = path.join(TOOL_ROOT, "scripts/lib");
const libFiles = walkFiles(libDir, [".mjs"]).filter((f) => {
  const base = path.basename(f);
  return (
    base !== "save-arm-utils.mjs" &&
    base !== "cms-core-v2-save-arm-parse-policy-fixtures.mjs"
  );
});
const libHits = libFiles.filter((f) => {
  const text = fs.readFileSync(f, "utf8");
  return /save-arm-utils|isSaveArmExactTrue/.test(text);
});
assert(
  "helper unwired from scripts/lib consumers (except fixtures)",
  libHits.length === 0,
  libHits.map((f) => path.basename(f)).join(", "),
);

// Client trim still present (must not have been removed this phase)
const adminTs = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
assert("admin ts exists", fs.existsSync(adminTs));
assert(
  "client trim divergence retained",
  /\.trim\(\)\s*===\s*"true"/.test(fs.readFileSync(adminTs, "utf8")),
);

assert("policy doc exists", fs.existsSync(POLICY_DOC));
const doc = fs.readFileSync(POLICY_DOC, "utf8");
assert("doc mentions save-arm-utils", /save-arm-utils\.mjs/.test(doc));
assert("doc helper unwired gate", /HELPER_WIRED_TO_RUNTIME:\s*false/.test(doc));
assert(
  "doc exact-true helper phase",
  /cms-core-v2-save-arm-exact-true-helper/.test(doc),
);

console.log(`\nHELPER_WIRED_TO_RUNTIME: false`);
console.log(`POLICY_FULLY_IMPLEMENTED: ${POLICY_FULLY_IMPLEMENTED}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-save-arm-exact-true-helper");
