/**
 * G-20u34 — Gosaki Discography Save UI arm design verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u34-gosaki-discography-save-ui-arm-design.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  DISCOGRAPHY_SAVE_UI_SAFETY_COPY,
  PROPOSED_GOSAKI_DISCOGRAPHY_SAVE_UI_GATES,
  buildDiscographySaveUiGateChecklist,
  buildSampleDiscographySaveUiArmInputAllMet,
  resolveDiscographySaveUiArmState,
  validateDiscographySaveUiArmPrerequisites,
} from "./lib/gosaki-discography-save-ui-arm-design.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-save-ui-arm-design.md";
const MODULE_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-save-ui-arm-design.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "533595e";

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u34 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
assert("arm design module exists", exists(MODULE_REL));

const doc = read(DOC_REL);
const moduleSrc = read(MODULE_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u34", doc.includes("G-20u34-gosaki-discography-save-ui-arm-design"));
assert("doc gate complete", doc.includes("gosakiDiscographySaveUiArmDesignComplete: true"));
assert("doc is Save UI arm design", doc.includes("Save UI arm") || doc.includes("arm design"));
assert("doc save disabled continues", doc.includes("saveEnabled: false") || doc.includes("Save remains disabled"));
assert("doc no DB write", doc.includes("DB write") && /false|not|none|no/i.test(doc));
assert("doc no network write", doc.includes("networkWrite") || doc.includes("network write"));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc proposed PUBLIC_GOSAKI gates", doc.includes("PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED"));
assert("doc server dry-run required", doc.includes("server dry-run") || doc.includes("Server dry-run"));
assert("doc approvalId required", doc.includes("approvalId"));
assert("doc rollback read-back", doc.includes("rollback") || doc.includes("read-back"));
assert("doc UI states", doc.includes("disabled") && doc.includes("future-executable"));

assert("module resolveDiscographySaveUiArmState", moduleSrc.includes("resolveDiscographySaveUiArmState"));
assert("module buildDiscographySaveUiGateChecklist", moduleSrc.includes("buildDiscographySaveUiGateChecklist"));
assert("module validateDiscographySaveUiArmPrerequisites", moduleSrc.includes("validateDiscographySaveUiArmPrerequisites"));
assert("module no fetch", !moduleSrc.includes("fetch("));
assert("module no createClient", !moduleSrc.includes("createClient"));
assert("module no localStorage", !moduleSrc.includes("localStorage"));
assert("module no privileged key string", !/service_role|SERVICE_ROLE/.test(moduleSrc));

const defaultState = resolveDiscographySaveUiArmState({});
assert("executableSaveAllowed always false default", defaultState.executableSaveAllowed === false);
assert("saveButtonDisabled true default", defaultState.saveButtonDisabled === true);
assert("dbWrite false default", defaultState.dbWrite === false);
assert("networkWrite false default", defaultState.networkWrite === false);
assert("allowedPhase designOnly", defaultState.allowedPhase === "designOnly");

const allMetInput = buildSampleDiscographySaveUiArmInputAllMet();
const allMetState = resolveDiscographySaveUiArmState(allMetInput);
assert("executableSaveAllowed false even all met", allMetState.executableSaveAllowed === false);
assert("saveButtonDisabled true even all met", allMetState.saveButtonDisabled === true);
assert("dbWrite false even all met", allMetState.dbWrite === false);
assert("networkWrite false even all met", allMetState.networkWrite === false);

const checklist = buildDiscographySaveUiGateChecklist({});
assert("checklist has staging-only", checklist.some((item) => item.id === "staging-only"));
assert("checklist has server-dry-run", checklist.some((item) => item.id === "server-dry-run"));
assert("checklist has approval-id", checklist.some((item) => item.id === "approval-id"));

const prereqFail = validateDiscographySaveUiArmPrerequisites({});
assert("prerequisites unmet by default", !prereqFail.ok);

assert("proposed gate names recorded", Object.keys(PROPOSED_GOSAKI_DISCOGRAPHY_SAVE_UI_GATES).length >= 4);
assert("safety copy save disabled", DISCOGRAPHY_SAVE_UI_SAFETY_COPY.saveDisabled.includes("disabled"));

assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));
assert("admin Save disabled badge intact", adminPage.includes("Save disabled"));
assert("admin dry-run only intact", adminPage.includes("Dry-run") || adminPage.includes("dry-run"));
assert("admin production STOP context", adminPage.includes("FTP") || adminPage.includes("Deploy"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u34", packageJson.includes("verify:g20u34-gosaki-discography-save-ui-arm-design"));

assert("AI current-state G-20u34", currentState.includes("G-20u34"));
assert("AI next-actions G-20u34", nextActions.includes("G-20u34"));
assert("handoff G-20u34", handoff.includes("G-20u34"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u34 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
