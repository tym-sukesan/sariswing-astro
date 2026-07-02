/**
 * G-20ui3 — Gosaki admin UI minor polish verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20ui3-gosaki-admin-ui-minor-polish.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-minor-polish.md";
const QA_REL = "tools/static-to-astro/docs/gosaki-admin-ui-polish-local-visual-qa.md";
const BASE_COMMIT = "8b4cf83";

const SCHEDULE_PAGE = "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro";
const DISC_PAGE = "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminDiscographyPage.astro";
const ABOUT_PAGE = "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminAboutPage.astro";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const DISC_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const ABOUT_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const YT_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro";

const FORBIDDEN = [
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts",
  "src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-client-save.ts",
  "tools/static-to-astro/scripts/build-gosaki-production-package.mjs",
  "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs",
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

assert("HEAD is 8b4cf83", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8b4cf83", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20ui3 doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("G-20ui2-QA prior doc exists", fs.existsSync(path.join(REPO_ROOT, QA_REL)));

const doc = read(DOC_REL);
const schedulePage = read(SCHEDULE_PAGE);
const discPage = read(DISC_PAGE);
const aboutPage = read(ABOUT_PAGE);
const scheduleUi = read(SCHEDULE_UI);
const aboutUi = read(ABOUT_UI);
const ytUi = read(YT_UI);

assert("doc phase G-20ui3", doc.includes("G-20ui3-gosaki-admin-ui-minor-polish"));
assert("doc saveBehaviorChanged false", doc.includes("saveBehaviorChanged: false"));
assert("doc contact deferred", doc.includes("contactStubDeferred: true"));
assert("doc disc labels deferred", doc.includes("discographyFieldLabelsDeferred: true"));

assert("schedule title ja", schedulePage.includes('title="スケジュール管理"'));
assert("disc title ja", discPage.includes('title="ディスコグラフィー管理"'));
assert("about title ja", aboutPage.includes('title="プロフィール管理"'));

assert("no old schedule title", !schedulePage.includes("Schedule管理"));
assert("no old disc title", !discPage.includes("Discography管理"));
assert("no old about title", !aboutPage.includes("About HTML"));

assert("schedule aria ja", scheduleUi.includes('aria-label="スケジュール管理"'));
assert("about aria ja", aboutUi.includes('aria-label="プロフィール管理"'));

assert("about no dry-run では visible", !aboutUi.includes("dry-run では"));
assert("about 変更確認では", aboutUi.includes("変更確認では"));

assert("schedule no 保存は準備中", !scheduleUi.includes("保存は準備中"));
assert("yt no 保存は準備中", !ytUi.includes("保存は準備中"));
assert("schedule operator save note", scheduleUi.includes("直接保存はまだ無効"));
assert("yt operator save note", ytUi.includes("戸山が確認して反映"));

const aboutBeforeDetails = aboutUi.split("<details")[0];
assert("about visible no dry-run では", !aboutBeforeDetails.includes("dry-run では"));

for (const rel of FORBIDDEN) {
  assert(`unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh|Never.*vsbvndwuajjhnzpohghh/i.test(doc));

console.log(`\nG-20ui3 admin UI minor polish verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
