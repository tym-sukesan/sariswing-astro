/**
 * G-9k7 — Gosaki schedule Save UI copy and editor scroll fix.
 * Run: node tools/static-to-astro/scripts/verify-g9k7-gosaki-schedule-save-ui-copy-and-editor-scroll-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const doc = read("tools/static-to-astro/docs/gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md");
const uiSrc = read("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
const astroSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const cssSrc = read("tools/static-to-astro/templates/admin-cms/styles/admin.css");

assert("G-9k7 doc phase", doc.includes("G-9k7-gosaki-schedule-save-ui-copy-and-editor-scroll-fix"));
assert("save disabled operator message", uiSrc.includes("保存は無効です。DB UPDATE は実行されません。"));
assert("save enabled operator message", uiSrc.includes("保存が有効です。内容を確認し、「更新する」を1回だけ押すとDBに反映されます。"));
assert("no contradictory false assert in dry-run render", !uiSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED=false の間は DB UPDATE"));
assert("conditional dry-run outcome note", uiSrc.includes("renderDryRunOutcomeNote"));
assert("list panel class in astro", astroSrc.includes("gosaki-schedule-admin-list-panel"));
assert("editor panel class in astro", astroSrc.includes("gosaki-schedule-admin-editor-panel"));
assert("independent scroll CSS", cssSrc.includes("gosaki-schedule-admin-list-panel") && cssSrc.includes("overflow-y: auto"));
assert("save-enabled note style", cssSrc.includes("gosaki-schedule-edit-dry-run__save-enabled"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));
assert("00-current-state G-9k7", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k7"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
