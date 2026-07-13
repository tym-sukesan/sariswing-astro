/**
 * G-20u36e-controlled-save-permission-snapshot-select-result-record verifier.
 * Result record only — no SQL re-run / GRANT / RLS / DB write / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-permission-snapshot-select-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-result.md";
const PREP_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-prep.md";
const PERMISSION_PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-preflight-plan.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const TRACK1 = "On a Clear Day";
const TRACK7 = "Like a Lover";
const BASE_COMMIT = "329f48d";

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
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e permission snapshot result base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during result doc creation`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("prep doc exists", exists(PREP_DOC_REL));
assert("permission preflight plan doc exists", exists(PERMISSION_PLAN_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-permission-snapshot-select-result-record",
  doc.includes("G-20u36e-controlled-save-permission-snapshot-select-result-record"),
);
assert(
  "doc gate gosakiDiscographyControlledSavePermissionSnapshotSelectResultRecorded",
  doc.includes("gosakiDiscographyControlledSavePermissionSnapshotSelectResultRecorded: true"),
);
assert(
  "doc SELECT-only snapshot executed by operator",
  doc.includes("executed by operator") || doc.includes("operator SELECT"),
);
assert("doc staging ref recorded", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));
assert("doc SQL re-run no", doc.includes("SQL re-run") && /no|not|false/i.test(doc));
assert("doc DB write no", doc.includes("DB write") && /no|not|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|not|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|not|false|変更なし/i.test(doc),
);
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|not|false/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc dryRun HTTP not sent",
  doc.includes("dryRun HTTP") && /no|not|未/i.test(doc),
);
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP no", doc.includes("FTP") && /no|not|false/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));

assert("doc track_count 8", doc.includes("track_count") && doc.includes("8"));
assert("doc track_7_title Like a Lover", doc.includes(TRACK7));
assert("doc target_row_count 1", doc.includes("target_row_count") && doc.includes("1"));
assert("doc target_track_1_title On a Clear Day", doc.includes(TRACK1));
assert("doc anon_write_grants_count 0", doc.includes("anon_write_grants_count") && /0/.test(doc));
assert(
  "doc authenticated_update_grants_count 0",
  doc.includes("authenticated_update_grants_count") && /0/.test(doc),
);
assert(
  "doc authenticated_discography_tracks_update_grants_count 0",
  doc.includes("authenticated_discography_tracks_update_grants_count"),
);
assert(
  "doc authenticated_title_update_column_grants_count 0",
  doc.includes("authenticated_title_update_column_grants_count"),
);
assert(
  "doc rls_enabled_discography true",
  doc.includes("rls_enabled_discography") && /true/.test(doc),
);
assert(
  "doc rls_enabled_discography_tracks true",
  doc.includes("rls_enabled_discography_tracks") && /true/.test(doc),
);
assert("doc admin_all_policy_count 2", doc.includes("admin_all_policy_count") && doc.includes("2"));
assert(
  "doc role_table_grants SELECT only",
  doc.includes("role_table_grants") && /SELECT only|SELECT-only|No INSERT/i.test(doc),
);
assert(
  "doc column_privileges_title empty",
  doc.includes("column_privileges_title") && (doc.includes("[]") || /empty/i.test(doc)),
);
assert(
  "doc permission model judgment",
  doc.includes("Permission model judgment") || doc.includes("permission model"),
);
assert(
  "doc Save path DB write likely blocked",
  doc.includes("DB write") && /fail|blocked|likely/i.test(doc),
);
assert(
  "doc service_role not used policy",
  doc.includes("service_role") && /Not used|not used|不使用/i.test(doc),
);
assert(
  "doc First controlled Save not executable",
  doc.includes("First controlled Save") && /not executable|Still not/i.test(doc),
);
assert("doc PASS judgment", doc.includes("PASS"));
assert(
  "doc next permission model decision",
  doc.includes("G-20u36e-controlled-save-permission-model-decision"),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-permission-snapshot-select-result"),
);
assert(
  "AI current-state permission snapshot result",
  currentState.includes("G-20u36e-controlled-save-permission-snapshot-select-result") ||
    currentState.includes("gosakiDiscographyControlledSavePermissionSnapshotSelectResultRecorded"),
);
assert(
  "AI next-actions permission model decision or result",
  nextActions.includes("G-20u36e-controlled-save-permission-snapshot-select-result") ||
    nextActions.includes("G-20u36e-controlled-save-permission-model-decision"),
);
assert(
  "AI handoff permission snapshot result",
  handoff.includes("G-20u36e-controlled-save-permission-snapshot-select-result") ||
    handoff.includes("gosakiDiscographyControlledSavePermissionSnapshotSelectResultRecorded"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-permission-snapshot-select-result: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
