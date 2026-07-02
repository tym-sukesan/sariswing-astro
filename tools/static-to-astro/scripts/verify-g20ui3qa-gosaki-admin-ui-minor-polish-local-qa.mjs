/**
 * G-20ui3-QA — Gosaki admin UI minor polish local QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20ui3qa-gosaki-admin-ui-minor-polish-local-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-minor-polish-local-qa.md";
const G20UI3_REL = "tools/static-to-astro/docs/gosaki-admin-ui-minor-polish.md";
const BASE_COMMIT = "75e2bc1";

const SCHEDULE_PAGE = "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro";
const DISC_PAGE = "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminDiscographyPage.astro";
const ABOUT_PAGE = "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminAboutPage.astro";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const ABOUT_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const YT_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro";

const FORBIDDEN = [
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts",
  "tools/static-to-astro/scripts/build-gosaki-production-package.mjs",
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

assert("HEAD is 75e2bc1", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 75e2bc1", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20ui3-QA doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("G-20ui3 prior doc exists", fs.existsSync(path.join(REPO_ROOT, G20UI3_REL)));

const doc = read(DOC_REL);
const schedulePage = read(SCHEDULE_PAGE);
const discPage = read(DISC_PAGE);
const aboutPage = read(ABOUT_PAGE);
const scheduleUi = read(SCHEDULE_UI);
const aboutUi = read(ABOUT_UI);
const ytUi = read(YT_UI);

assert("doc phase G-20ui3qa", doc.includes("G-20ui3qa-gosaki-admin-ui-minor-polish-local-qa"));
assert("doc QA gate complete", doc.includes("gosakiAdminUiMinorPolishLocalQaComplete: true"));
assert("doc no blocking issues", doc.includes("qaBlockingIssuesFound: false"));
assert("doc dryRun not clicked", doc.includes("dryRunClicked: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc schedule title verified", doc.includes("スケジュール管理"));
assert("doc disc title verified", doc.includes("ディスコグラフィー管理"));
assert("doc about title verified", doc.includes("プロフィール管理"));
assert("doc about 変更確認では", doc.includes("変更確認では"));
assert("doc all routes QA", doc.includes("/admin/youtube/"));

assert("source schedule title ja", schedulePage.includes('title="スケジュール管理"'));
assert("source disc title ja", discPage.includes('title="ディスコグラフィー管理"'));
assert("source about title ja", aboutPage.includes('title="プロフィール管理"'));
assert("source schedule no 保存は準備中 note", !scheduleUi.includes("保存は準備中"));
assert("source about 変更確認では", aboutUi.includes("変更確認では"));
assert("source yt operator note", ytUi.includes("戸山が確認して反映"));

for (const rel of FORBIDDEN) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh|Never.*vsbvndwuajjhnzpohghh/i.test(doc));

console.log(`\nG-20ui3-QA admin UI minor polish local QA verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
