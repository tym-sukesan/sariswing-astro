/**
 * G-14c — Gosaki public reflection operation standardization verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14c-gosaki-public-reflection-operation-standardization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const G14B_REL =
  "tools/static-to-astro/docs/gosaki-schedule-cms-practical-editing-flow-definition.md";
const G13E_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md";
const G13E_UPLOAD_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-upload-preflight.md";
const BUILD_SCRIPT_REL =
  "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const VERIFY_STATIC_REL =
  "tools/static-to-astro/scripts/verify-static-public-artifact.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

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

const doc = read(DOC_REL);

assert("G-14c doc exists", exists(DOC_REL));
assert(
  "doc phase G-14c",
  doc.includes("G-14c-gosaki-public-reflection-operation-standardization"),
);
assert(
  "doc standardization complete gate",
  doc.includes("gosakiPublicReflectionOperationStandardizationComplete: true"),
);
assert("doc standard flow", doc.includes("Standard public reflection flow"));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc regen preflight", doc.includes("Regen preflight") || doc.includes("regen preflight"));
assert("doc post-regen verify", doc.includes("Post-regen"));
assert("doc minimal upload", doc.includes("Minimal upload"));
assert("doc full upload", doc.includes("Full upload"));
assert("doc upload scope decision", doc.includes("Upload scope decision"));
assert("doc HTTP verify", doc.includes("HTTP verify"));
assert("doc failure stop", doc.includes("Stop") || doc.includes("stop"));
assert("doc rollback policy", doc.includes("Rollback"));
assert("doc Schedule playbook", doc.includes("Schedule CMS edit"));
assert("doc YouTube playbook", doc.includes("YouTube"));
assert("doc Event B G-13c2", doc.includes("G-13c2"));
assert("doc readyForG13c2 reflection", doc.includes("readyForG13c2EventBCleanupReflection: true"));
assert("doc scheduleDataSource", doc.includes("scheduleDataSource=supabase"));
assert("doc staging path", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc blocked root FTP", doc.includes("blocked") && doc.includes("/"));
assert("doc mirror delete forbidden", doc.includes("mirror --delete") || doc.includes("mirror-delete"));
assert("doc readyForAnyFutureFtpApply false", doc.includes("readyForAnyFutureFtpApply: false"));
assert("doc no cursor regen this phase", doc.includes("cursorPackageRegenExecuted: false"));
assert("doc approval phrase", doc.includes("承認します。この手動アップロードを1回だけ実行してください。"));
assert("doc kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc static-fallback stop", doc.includes("static-fallback") || doc.includes("fallback"));

assert("G-14b doc exists", exists(G14B_REL));
assert("G-13e closure exists", exists(G13E_CLOSURE_REL));
assert("G-13e upload preflight exists", exists(G13E_UPLOAD_PREFLIGHT_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));
assert("verify-static script exists", exists(VERIFY_STATIC_REL));
assert(
  "build script runs verify-static",
  read(BUILD_SCRIPT_REL).includes("verify-static-public-artifact.mjs"),
);
assert(
  "G-14b references G-14c",
  read(G14B_REL).includes("G-14c"),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

console.log(
  `\nG-14c public reflection standardization verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
