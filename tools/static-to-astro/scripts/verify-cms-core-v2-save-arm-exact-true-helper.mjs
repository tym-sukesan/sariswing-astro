/**
 * CMS Core v2 — Save arm exact-true helper verifier.
 * Confirms helper contract + client bake wiring (Edge remains unwired).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isSaveArmExactTrue } from "./lib/save-arm-utils.mjs";
import {
  ARM_PARSE_FIXTURE_MATRIX,
  CLIENT_TRIM_DIVERGENCE_COUNT,
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED,
  PARSE_POLICY_FULLY_IMPLEMENTED,
  POLICY_FULLY_IMPLEMENTED,
  policyArmedExactTrue,
} from "./lib/cms-core-v2-save-arm-parse-policy-fixtures.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const HELPER = path.join(TOOL_ROOT, "scripts/lib/save-arm-utils.mjs");
const POLICY_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-save-arm-parse-policy.md");
const ADMIN_TS = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
const TEMPLATE_HELPER = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/save-arm-utils.ts",
);
const PACKAGE_MARKER = path.join(TOOL_ROOT, "scripts/lib/package-run-marker.mjs");

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

assert("PARSE_POLICY_FULLY_IMPLEMENTED true", PARSE_POLICY_FULLY_IMPLEMENTED === true);
assert("POLICY_FULLY_IMPLEMENTED true", POLICY_FULLY_IMPLEMENTED === true);
assert("CLIENT_TRIM_DIVERGENCE_COUNT 0", CLIENT_TRIM_DIVERGENCE_COUNT === 0);
assert(
  "GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED true",
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === true,
);

// Client bake wired; Edge / supabase functions must NOT import save-arm-utils
const edgeRoots = [
  path.join(TOOL_ROOT, "scripts/edge-functions"),
  path.join(REPO_ROOT, "supabase/functions"),
];
const edgeFiles = edgeRoots.flatMap((root) => walkFiles(root, [".ts", ".mjs", ".js"]));
const edgeHits = edgeFiles.filter((f) => {
  const text = fs.readFileSync(f, "utf8");
  return /save-arm-utils/.test(text) || /isSaveArmExactTrue/.test(text);
});
assert(
  "helper unwired from Edge/supabase",
  edgeHits.length === 0,
  edgeHits.map((f) => path.relative(REPO_ROOT, f)).join(", "),
);

// Allowed Node wiring: package-run-marker + fixtures (and this verifier)
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
const allowedLib = new Set([
  "package-run-marker.mjs",
  "gosaki-operational-save-ui-arm-mutex-gate.mjs",
]);
const unexpectedLib = libHits.filter((f) => !allowedLib.has(path.basename(f)));
assert(
  "helper lib wiring limited to package-run-marker + mutex package gate (+ fixtures)",
  unexpectedLib.length === 0,
  unexpectedLib.map((f) => path.basename(f)).join(", "),
);
assert(
  "package-run-marker imports isSaveArmExactTrue",
  /isSaveArmExactTrue/.test(fs.readFileSync(PACKAGE_MARKER, "utf8")),
);

assert("admin ts exists", fs.existsSync(ADMIN_TS));
const adminTs = fs.readFileSync(ADMIN_TS, "utf8");
assert("admin imports isSaveArmExactTrue", /isSaveArmExactTrue/.test(adminTs));
assert("admin imports ./save-arm-utils", /from ["']\.\/save-arm-utils["']/.test(adminTs));

const saveArmFns = [
  "isG20u45ScheduleOperationalSaveArmed",
  "isG20u41DiscographyOperationalSaveArmed",
  "isG11c6aSaveEnabled",
  "isGosakiYoutubeSupabaseSaveEnabled",
  "isG12aAboutSaveEnabled",
  "isGosakiAboutSupabaseSaveEnabled",
];
for (const fn of saveArmFns) {
  const m = adminTs.match(new RegExp(`export function ${fn}\\([\\s\\S]*?\\n\\}`, "m"));
  const body = m ? m[0] : "";
  assert(`${fn} uses isSaveArmExactTrue`, /isSaveArmExactTrue\(/.test(body));
  assert(`${fn} has no trim===true`, !/\.trim\(\)\s*===\s*"true"/.test(body));
}

assert("template mirror exists", fs.existsSync(TEMPLATE_HELPER));
const templateSrc = fs.readFileSync(TEMPLATE_HELPER, "utf8");
assert(
  "template mirror raw === \"true\"",
  /return raw === "true"/.test(templateSrc) && !/\.trim\(/.test(templateSrc),
);

// Path-enable may still trim (non-save)
assert(
  "path-enable may retain trim (non-save)",
  /isGosakiYoutubeSupabasePathEnabled[\s\S]*?\.trim\(\)\s*===\s*"true"/.test(adminTs) ||
    /YOUTUBE_SUPABASE_PATH_ENABLED[\s\S]{0,200}\.trim\(\)\s*===\s*"true"/.test(adminTs),
);

assert("policy doc exists", fs.existsSync(POLICY_DOC));
const doc = fs.readFileSync(POLICY_DOC, "utf8");
assert("doc mentions save-arm-utils", /save-arm-utils\.mjs/.test(doc));
assert(
  "doc client wiring phase",
  /cms-core-v2-save-arm-client-exact-true-wiring/.test(doc),
);
assert(
  "doc PARSE_POLICY_FULLY_IMPLEMENTED true",
  /PARSE_POLICY_FULLY_IMPLEMENTED:\s*true/.test(doc),
);
assert(
  "doc GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED true (post package-gate)",
  /GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED:\s*true/.test(doc) ||
    /GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED:\s*\*\*true\*\*/.test(doc),
);

console.log(`\nHELPER_WIRED_TO_CLIENT_BAKE: true`);
console.log(`HELPER_WIRED_TO_EDGE: false`);
console.log(`PARSE_POLICY_FULLY_IMPLEMENTED: ${PARSE_POLICY_FULLY_IMPLEMENTED}`);
console.log(`POLICY_FULLY_IMPLEMENTED: ${POLICY_FULLY_IMPLEMENTED}`);
console.log(`CLIENT_TRIM_DIVERGENCE_COUNT: ${CLIENT_TRIM_DIVERGENCE_COUNT}`);
console.log(`GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: ${GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED}`);
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-save-arm-exact-true-helper");
