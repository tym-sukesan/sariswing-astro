/**
 * G-20u12 follow-up — safe-output-cleanup + pilot build ENOTEMPTY fix verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u12-pilot-build-enotempty-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  assertUnderGeneratedOutput,
  removeGeneratedOutputDir,
} from "./lib/safe-output-cleanup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const PILOT_ASTRO = path.join(TOOL_ROOT, "output/pilot-sample-static-astro");

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

let guardThrew = false;
try {
  assertUnderGeneratedOutput(path.join(REPO_ROOT, "src"));
} catch (err) {
  guardThrew = /outside generated output/i.test(err.message);
}
assert("path guard blocks src/", guardThrew);

let rootGuardThrew = false;
try {
  assertUnderGeneratedOutput(path.join(TOOL_ROOT, "output"));
} catch (err) {
  rootGuardThrew = /output root itself/i.test(err.message);
}
assert("path guard blocks output root", rootGuardThrew);

assert("allows pilot astro path", assertUnderGeneratedOutput(PILOT_ASTRO) === PILOT_ASTRO);

if (fs.existsSync(PILOT_ASTRO)) {
  const result = removeGeneratedOutputDir(PILOT_ASTRO);
  assert("remove pilot astro dir", result.removed === true);
  assert("pilot astro gone", !fs.existsSync(PILOT_ASTRO));
}

const astroGen = fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/astro-generator.mjs"), "utf8");
assert("astro-generator uses safe cleanup", astroGen.includes("removeGeneratedOutputDir"));

console.log("");
console.log(`G-20u12 ENOTEMPTY fix verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
