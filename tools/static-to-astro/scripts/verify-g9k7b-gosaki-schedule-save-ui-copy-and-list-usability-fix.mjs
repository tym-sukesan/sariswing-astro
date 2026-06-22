/**
 * G-9k7b — Gosaki schedule Save UI copy dedup + list edit button visibility.
 * Run: node tools/static-to-astro/scripts/verify-g9k7b-gosaki-schedule-save-ui-copy-and-list-usability-fix.mjs
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

assert("G-9k7b doc section", doc.includes("G-9k7b"));
assert("dry-run disabled short message", uiSrc.includes("保存は無効です。確認のみ完了しました。"));
assert("setSaveButtonNote helper", uiSrc.includes("function setSaveButtonNote"));
assert("hide button note when save disabled ready", uiSrc.includes("setSaveButtonNote(null)"));
assert("no duplicate ready-but-disabled long message", !uiSrc.includes("operatorSaveReadyButDisabledMessage"));
assert("sticky actions column class in astro", astroSrc.includes("admin-gosaki-schedule-table__actions-col"));
assert("sticky actions column CSS", cssSrc.includes("admin-gosaki-schedule-table__actions-col") && cssSrc.includes("position: sticky"));
assert("list panel scoped sticky", cssSrc.includes("gosaki-schedule-admin-list-panel") && cssSrc.includes("right: 0"));
assert("save enabled message retained", uiSrc.includes("保存が有効です。内容を確認し、「更新する」を1回だけ押すとDBに反映されます。"));
assert("00-current-state G-9k7b", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k7b"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
