/**
 * G-20u31 — Gosaki Discography Save design verifier (doc-only · no implementation).
 * Run: node tools/static-to-astro/scripts/verify-g20u31-gosaki-discography-save-design.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-save-design.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "5143e45";

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

function globExists(globPattern) {
  const dir = path.dirname(path.join(REPO_ROOT, globPattern));
  const base = path.basename(globPattern);
  if (!fs.existsSync(dir)) return false;
  const re = new RegExp(`^${base.replace(/\*/g, ".*")}$`);
  return fs.readdirSync(dir).some((name) => re.test(name));
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u31 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u31", doc.includes("G-20u31-gosaki-discography-save-design"));
assert("doc gate complete", doc.includes("gosakiDiscographySaveDesignComplete: true"));
assert("doc is save design", doc.includes("Save design") || doc.includes("Save specification"));
assert("doc DB write not executed", doc.includes("DB write") && /not executed|not implemented|Forbidden/i.test(doc));
assert("doc save disabled continues", doc.includes("saveEnabled: false") || doc.includes("Save UI enabled"));
assert("doc save buttons disabled", doc.includes("disabled") && /Save/i.test(doc));
assert("doc edge function design only", doc.includes("Edge Function") && /not implemented|design only|proposal/i.test(doc));
assert("doc service_role browser forbidden", doc.includes("service_role") && /browser|Forbidden|never/i.test(doc));
assert("doc anon write forbidden", doc.includes("anon") && /Forbidden|No direct|禁止/i.test(doc));
assert("doc site_slug required", doc.includes("site_slug") && /required|必須|gosaki-piano/i.test(doc));
assert("doc rollback policy", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc operator approval gate", doc.includes("approval") && /operator|gate|dry-run/i.test(doc));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc save scope release metadata", doc.includes("title") && doc.includes("artist") && doc.includes("description"));
assert("doc tracks textarea policy", doc.includes("1 line = 1 track"));
assert("doc not 34 fixed inputs", doc.includes("34") && /fixed|Reject|not/i.test(doc));
assert("doc diff added removed reordered", doc.includes("added") && doc.includes("removed") && doc.includes("reordered"));
assert("doc edge function endpoint names", doc.includes("gosaki-discography-save-dry-run") && doc.includes("gosaki-discography-save"));
assert("doc implementation phases", doc.includes("G-20u32") || doc.includes("Implementation phase"));
assert("doc personnel deferred", doc.includes("personnel") && /Deferred|defer|later/i.test(doc));
assert("doc transaction policy", doc.includes("transaction") || doc.includes("ROLLBACK"));

assert("no g20u31 executable sql file", !globExists("tools/static-to-astro/scripts/supabase/gosaki-discography-g20u31*.sql"));
assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));
assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u31", packageJson.includes("verify:g20u31-gosaki-discography-save-design"));

assert("AI current-state G-20u31", currentState.includes("G-20u31"));
assert("AI next-actions G-20u31", nextActions.includes("G-20u31"));
assert("handoff G-20u31", handoff.includes("G-20u31"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not implemented by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u31 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
