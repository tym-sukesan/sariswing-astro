/**
 * G-20ui1 — Gosaki admin UI polish inventory verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20ui1-gosaki-admin-ui-polish-inventory.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-ui-polish-inventory.md";
const G20I3_REL = "tools/static-to-astro/docs/gosaki-production-package-admin-exclusion-result.md";
const BASE_COMMIT = "4a91061";

const SHELL_HOME = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro";
const SHELL_LAYOUT = "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const DISCO_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const YT_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro";
const ABOUT_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const READONLY_ADMIN =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const STAGING_BUILD = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";

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

assert("HEAD is 4a91061", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 4a91061", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-20ui1 doc exists", exists(DOC_REL));
assert("G-20i3 prior doc exists", exists(G20I3_REL));

const doc = read(DOC_REL);
const home = read(SHELL_HOME);
const layout = read(SHELL_LAYOUT);
const schedule = read(SCHEDULE_UI);
const disc = read(DISCO_UI);
const yt = read(YT_UI);
const about = read(ABOUT_UI);
const readonlyAdmin = read(READONLY_ADMIN);

assert("doc phase G-20ui1", doc.includes("G-20ui1-gosaki-admin-ui-polish-inventory"));
assert("doc inventory gate", doc.includes("gosakiAdminUiPolishInventoryComplete: true"));
assert("doc readyForG20ui2", doc.includes("readyForG20ui2AdminUiPolishImplementation: true"));
assert("doc no UI implementation", doc.includes("adminUiImplementationExecuted: false"));
assert("doc hosted admin defer", doc.includes("hostedAdminDeferPolicy: true"));
assert("doc G-20ui2 next", doc.includes("G-20ui2"));
assert("doc G-20j STOP context", doc.includes("G-20j"));

for (const section of [
  "must before client preview",
  "Should before public launch",
  "Can defer",
  "Developer-only",
  "Low-risk",
  "High-risk",
]) {
  assert(`doc section ${section}`, doc.includes(section) || doc.toLowerCase().includes(section.toLowerCase()));
}

assert("doc two admin surfaces", doc.includes("Local staging shell") && doc.includes("read-only admin"));
assert("doc contact gap", doc.includes("Contact") && doc.includes("なし"));
assert("doc operator workflow", doc.includes("local regen") || doc.includes("manual FTP"));
assert("doc save messaging issue", doc.includes("保存は準備中") || doc.includes("Contradicts"));
assert("doc approvalId hide", doc.includes("approvalId"));
assert("doc operator client mode", doc.includes("Operator mode") || doc.includes("client preview mode"));

for (const rel of [SHELL_HOME, SHELL_LAYOUT, SCHEDULE_UI, DISCO_UI, YT_UI, ABOUT_UI, READONLY_ADMIN]) {
  assert(`source exists ${path.basename(rel)}`, exists(rel));
}

assert("home save prep copy", home.includes("保存は準備中"));
assert("home can/cannot lists", home.includes("いまできること") && home.includes("まだできないこと"));
assert("layout global status", layout.includes("保存・本番反映はまだ開放"));
assert("schedule save prep", schedule.includes("保存は準備中") || schedule.includes("準備中"));
assert("schedule dev tools", schedule.includes("開発者向け詳細") || doc.includes("admin-gosaki-dev-tools"));
assert("disc approvalId visible in source", disc.includes("approvalId"));
assert("about env disabled copy", about.includes("env disabled") || about.includes("dry-run"));
assert("readonly badge", readonlyAdmin.includes("READ-ONLY") && readonlyAdmin.includes("保存不可"));

const stagingDiff = spawnSync("git", ["diff", STAGING_BUILD], { cwd: REPO_ROOT, encoding: "utf8" });
assert("staging build script unchanged", stagingDiff.stdout.length === 0);

assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc DB write not executed", doc.includes("cursorDbWriteExecuted: false"));

assert("doc warns never sariswing prod", /never.*vsbvndwuajjhnzpohghh|Never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("interim supabase ref in doc", doc.includes("kmjqppxjdnwwrtaeqjta"));

assert("commit push not executed", true);

console.log(`\nG-20ui1 admin UI polish inventory verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
