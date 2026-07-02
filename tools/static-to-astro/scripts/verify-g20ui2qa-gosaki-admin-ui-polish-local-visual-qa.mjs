/**
 * G-20ui2-QA — Gosaki admin UI polish local visual QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20ui2qa-gosaki-admin-ui-polish-local-visual-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-polish-local-visual-qa.md";
const G20UI2_REL = "tools/static-to-astro/docs/gosaki-admin-ui-polish-implementation.md";
const BASE_COMMIT = "afcbdcf";

const HOME = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro";
const SCHEDULE = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const DISC = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const ABOUT = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const YT = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro";
const READONLY =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";

const FORBIDDEN = [
  "tools/static-to-astro/scripts/build-gosaki-production-package.mjs",
  "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs",
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts",
];

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

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is afcbdcf", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is afcbdcf", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20ui2-QA doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("G-20ui2 prior doc exists", fs.existsSync(path.join(REPO_ROOT, G20UI2_REL)));

const doc = read(DOC_REL);
const home = read(HOME);
const schedule = read(SCHEDULE);
const disc = read(DISC);
const about = read(ABOUT);
const yt = read(YT);
const readonlyAdmin = read(READONLY);

assert("doc phase G-20ui2qa", doc.includes("G-20ui2qa-gosaki-admin-ui-polish-local-visual-qa"));
assert("doc QA gate complete", doc.includes("gosakiAdminUiPolishLocalVisualQaComplete: true"));
assert("doc no blocking issues", doc.includes("qaBlockingIssuesFound: false"));
assert("doc readyForG20ui3", doc.includes("readyForG20ui3OptionalPolish: true"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc dev env documented", doc.includes("ENABLE_ADMIN_STAGING_SHELL=true"));
assert("doc all routes QA", doc.includes("/admin/schedule/") && doc.includes("/admin/discography/"));
assert("doc read-only template review", doc.includes("Static template review"));
assert("doc fix not required", doc.includes("No immediate fix required"));

assert("home QA pass documented", doc.includes("Home — **PASS**"));
assert("schedule QA pass documented", doc.includes("Schedule — **PASS**"));
assert("discography QA pass documented", doc.includes("Discography — **PASS**"));
assert("about QA pass documented", doc.includes("About — **PASS**"));
assert("youtube QA pass documented", doc.includes("YouTube — **PASS**"));

assert("home no global 保存は準備中", !home.includes("保存は準備中です"));
assert("home operator cards", home.includes("ご利用の流れ") && home.includes("戸山が代行すること"));
assert("schedule no 保存機能は準備中", !schedule.includes("保存機能は準備中"));
assert("schedule dev details", schedule.includes("admin-gosaki-dev-tools"));
assert("disc dev details approvalId", /details[\s\S]*approvalId/.test(disc));
assert("about 変更を確認", about.includes("変更を確認"));
assert("about no env disabled visible default", !about.split("<details")[0].includes("env disabled"));
assert("yt operator note", yt.includes("戸山が確認して行います"));
assert("readonly ja banner", readonlyAdmin.includes("読み取り専用管理画面"));

for (const rel of FORBIDDEN) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh|Never.*vsbvndwuajjhnzpohghh/i.test(doc));

console.log(`\nG-20ui2-QA admin UI polish local visual QA verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
