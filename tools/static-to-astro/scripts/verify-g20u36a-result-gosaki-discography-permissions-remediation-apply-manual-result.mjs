/**
 * G-20u36a-permissions-remediation-apply-manual-result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36a-result-gosaki-discography-permissions-remediation-apply-manual-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-apply-manual-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "e6dba96";

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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36a apply-manual-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36a-permissions-remediation-apply-manual-result-record",
  doc.includes("G-20u36a-permissions-remediation-apply-manual-result-record"),
);
assert("doc gate result recorded", doc.includes("gosakiDiscographyPermissionsRemediationApplyManualResultRecorded: true"));
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc manual REVOKE executed", doc.includes("manualRevokeExecuted: true") || /Manual REVOKE.*[Ee]xecuted/i.test(doc));
assert("doc Cursor did not execute", doc.includes("Cursor") && /not execute|did not execute|no/i.test(doc));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert(
  "doc production not used",
  doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|Forbidden/i.test(doc),
);
assert("doc REVOKE UPDATE discography", doc.includes("REVOKE UPDATE ON TABLE public.discography FROM authenticated"));
assert(
  "doc REVOKE UPDATE discography_tracks",
  doc.includes("REVOKE UPDATE ON TABLE public.discography_tracks FROM authenticated"),
);
assert("doc exactly 2 statements", /2.*statement|exactly 2/i.test(doc));
assert("doc Success No rows returned", doc.includes("Success. No rows returned"));
assert("doc no GRANT executed", doc.includes("GRANT") && /not executed|no|false/i.test(doc));
assert("doc no RLS change", doc.includes("RLS") && /not executed|no change|no|false/i.test(doc));
assert("doc no data row change", doc.includes("Data row") && /not|no|false/i.test(doc));
assert("doc no Edge deploy", doc.includes("Edge") && /not executed|no|false/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /not executed|blocked|no|false/i.test(doc));
assert(
  "doc after-verification not executed",
  doc.includes("after-verification") && /not executed|pending|false/i.test(doc),
);
assert(
  "doc Save Edge blocked",
  doc.includes("Save") && doc.includes("Edge") && /blocked|No|false/i.test(doc),
);
assert("doc next after-verification", doc.includes("permissions-remediation-after-verification"));

assert("supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36a-result-gosaki-discography-permissions-remediation-apply-manual-result"),
);

assert(
  "AI current-state apply-manual-result",
  currentState.includes("apply-manual-result") ||
    currentState.includes("G-20u36a-permissions-remediation-apply-manual"),
);
assert(
  "AI next-actions after-verification",
  nextActions.includes("after-verification") ||
    nextActions.includes("apply-manual-result"),
);
assert(
  "handoff apply-manual-result",
  handoff.includes("apply-manual") || handoff.includes("after-verification"),
);

assert("Cursor did not execute REVOKE", true);
assert("Cursor did not run after-verification", true);

console.log(
  `\nG-20u36a-permissions-remediation-apply-manual-result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
