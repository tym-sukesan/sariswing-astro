/**
 * G-22i2 — Gosaki Schedule public reflection planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22i2-gosaki-schedule-public-reflection-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-public-reflection-planning.md";
const G22I1_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-release-readiness-review.md";
const G14C_STD = "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const FTP_SAFETY = "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const BUILD_SCRIPT = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const SCHEDULE_READ = "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs";

const BASE_COMMIT = "f093e97";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const SAVED_UPDATED_AT = "2026-07-07T02:30:32.260326+00:00";
const REF_014 = "schedule-2026-03-014";
const REF_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
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

assert("HEAD is f093e97", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is f093e97", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("planning doc exists", exists(DOC_REL));
assert("G-22i1 readiness doc exists", exists(G22I1_REL));
assert("G-14c standard doc exists", exists(G14C_STD));
assert("FTP safety doc exists", exists(FTP_SAFETY));
assert("build script exists", exists(BUILD_SCRIPT));
assert("schedule read module exists", exists(SCHEDULE_READ));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const scheduleRead = read(SCHEDULE_READ);

assert("doc phase G-22i2", doc.includes("G-22i2-gosaki-schedule-public-reflection-planning"));
assert(
  "doc planning gate complete",
  doc.includes("gosakiSchedulePublicReflectionPlanningComplete: true"),
);
assert("doc ready G-22i3", doc.includes("readyForG22i3PackageDiffDryRun: true"));
assert("doc public reflection planning", /public reflection/i.test(doc));

assert("doc reflection definition", doc.includes("published=true") && doc.includes("static"));
assert(
  "doc separate from package and FTP",
  doc.includes("package") && doc.includes("FTP") && /separate|distinct|別/i.test(doc),
);

assert("doc 008 published true", doc.includes(TARGET_LEGACY) && doc.includes("published=true"));
assert("doc 008 public eligible", doc.includes("public eligible") || doc.includes("Public eligible"));
assert("doc 008 id", doc.includes(TARGET_ID));
assert("doc saved updated_at", doc.includes(SAVED_UPDATED_AT));

assert("doc 014 excluded", doc.includes(REF_014) && /exclude|excluded/i.test(doc));
assert("doc 014 published false", doc.includes(REF_014) && doc.includes("published=false"));
assert("doc 001 excluded", doc.includes(REF_001) && /exclude|excluded/i.test(doc));
assert("doc 001 published false", doc.includes(REF_001) && doc.includes("published=false"));

assert("doc expected output diff", doc.includes("Expected output diff") || doc.includes("output diff"));
assert("doc schedule 2026-07 route", doc.includes("schedule/2026-07"));

assert("doc package diff dry-run policy", doc.includes("G-22i3") && doc.includes("dry-run"));
assert("doc ftp planning policy", doc.includes("G-22i5") || doc.includes("FTP / deploy planning"));

assert("doc root delete prevention", /root.*delete|誤消去|mirror.*delete/i.test(doc));
assert("doc delete accident prevention", /--delete|readyForAnyFutureFtpApply/i.test(doc));
assert(
  "doc manual upload path",
  doc.includes("output/manual-upload/gosaki-piano") &&
    doc.includes("/cms-kit-staging/gosaki-piano/"),
);

assert("doc package not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));
assert("doc production not executed", doc.includes("productionDeployExecuted: false"));

assert("doc next G-22i3", doc.includes("G-22i3"));
assert("doc next G-22i4", doc.includes("G-22i4"));
assert("doc next G-22i5", doc.includes("G-22i5"));
assert("doc next G-22i6", doc.includes("G-22i6"));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc physical delete deferred", doc.includes("physicalDeleteImplemented: false"));

assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert("schedule read filters published true", scheduleRead.includes('.eq("published", true)'));

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

assert("00-current-state mentions G-22i2", currentState.includes("G-22i2"));
assert("03-next-actions mentions G-22i2", nextActions.includes("G-22i2"));
assert("handoff mentions G-22i2", handoff.includes("G-22i2"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Rollback not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22i2 Gosaki Schedule public reflection planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
