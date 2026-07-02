/**
 * G-20ui2 — Gosaki admin UI polish implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20ui2-gosaki-admin-ui-polish-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-polish-implementation.md";
const G20UI1_REL = "tools/static-to-astro/docs/gosaki-admin-ui-polish-inventory.md";
const BASE_COMMIT = "6d02ce1";

const UI_FILES = [
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro",
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro",
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
  "tools/static-to-astro/templates/admin-cms/styles/admin.css",
];

const DISPLAY_TS = [
  "src/lib/admin/staging-data/gosaki-staging-about-content-admin-ui.ts",
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
  "src/lib/admin/staging-data/gosaki-staging-youtube-admin-ui.ts",
];

const FORBIDDEN_SAVE_PATHS = [
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts",
  "src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-client-save.ts",
  "src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-client-save.ts",
  "src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-client-save.ts",
  "tools/static-to-astro/scripts/build-gosaki-production-package.mjs",
  "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs",
];

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

assert("HEAD is 6d02ce1", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 6d02ce1", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20ui2 doc exists", exists(DOC_REL));
assert("G-20ui1 prior doc exists", exists(G20UI1_REL));

const doc = read(DOC_REL);
const home = read(UI_FILES[0]);
const schedule = read(UI_FILES[2]);
const disc = read(UI_FILES[3]);
const about = read(UI_FILES[4]);
const yt = read(UI_FILES[5]);
const readonlyAdmin = read(UI_FILES[6]);

assert("doc phase G-20ui2", doc.includes("G-20ui2-gosaki-admin-ui-polish-implementation"));
assert("doc saveBehaviorChanged false", doc.includes("saveBehaviorChanged: false"));
assert("doc no save executed", doc.includes("saveExecuted: false"));

assert("home no 保存は準備中です", !home.includes("保存は準備中です"));
assert("home operator explainer", home.includes("戸山が代行すること"));
assert("home workflow card", home.includes("ご利用の流れ"));
assert("home 変更を確認", home.includes("変更を確認"));
assert("home menu スケジュール", home.includes("スケジュール"));
assert("home dev tools details", home.includes('class="admin-gosaki-dev-tools'));

assert("schedule 変更を確認 button", schedule.includes("変更を確認"));
assert("schedule no 保存機能は準備中", !schedule.includes("保存機能は準備中です"));
assert("schedule operator note", schedule.includes("戸山が確認して行います"));
assert("schedule poc in details", /details.*admin-gosaki-dev-tools[\s\S]*G-13c1/s.test(schedule));

const discBeforeDetails = disc.split("<details")[0];
assert("disc approvalId not in default view", !discBeforeDetails.includes("approvalId"));
assert("disc approvalId in dev details", disc.includes("approvalId"));
assert("disc dev details", disc.includes('class="admin-gosaki-dev-tools'));
assert("disc 変更を確認", disc.includes("変更を確認"));

const aboutBeforeDetails = about.split("<details")[0];
assert("about no env disabled in default view", !aboutBeforeDetails.includes("env disabled"));
assert("about 変更を確認 buttons", (about.match(/変更を確認/g) ?? []).length >= 2);
assert("about 保存する（現在は無効）", about.includes("保存する（現在は無効）"));
assert("about approvalId in details", about.includes("approvalId"));

assert("youtube 変更を確認", yt.includes("変更を確認"));
assert("youtube operator note", yt.includes("戸山が確認して行います"));
assert("youtube dev details", yt.includes("admin-gosaki-dev-tools"));

assert("readonly japanese banner", readonlyAdmin.includes("読み取り専用管理画面"));
assert("readonly G-11c6a in details", /details[\s\S]*G-11c6a/.test(readonlyAdmin));

for (const rel of FORBIDDEN_SAVE_PATHS) {
  assert(`forbidden path unchanged ${path.basename(rel)}`, gitDiff(rel).length === 0);
}

for (const rel of DISPLAY_TS) {
  const diff = gitDiff(rel);
  if (diff.length > 0) {
    assert(`${path.basename(rel)} no save handler edits`, !/execute.*Save|\.update\(|\.insert\(|\.upsert\(|\.delete\(/.test(diff));
  } else {
    assert(`${path.basename(rel)} checked`, true);
  }
}

assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh|Never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("about ts no env disabled string", !read(DISPLAY_TS[0]).includes("env disabled"));

console.log(`\nG-20ui2 admin UI polish implementation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
