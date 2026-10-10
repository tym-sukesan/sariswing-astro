#!/usr/bin/env node
/**
 * Shared fixed Save bar is visual only.
 * Save enablement, Edge, RPC, and approval IDs stay in the existing clients.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

let passed = 0;
let failed = 0;
function assert(name, ok) {
  if (ok) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${name}`);
  }
}

const css = read("templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css");
const schedule = read("templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleContentPanel.astro");
const disc = read("templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro");
const youtube = read("templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeContentPanel.astro");
const about = read("templates/admin-cms/gosaki/components/AdminGosakiStagingAboutContentPanel.astro");
const scheduleClient = read("templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts");
const discClient = read("templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts");
const youtubeClient = read("templates/site-extensions/gosaki-piano/gosaki-staging-youtube-multi-operational-edit.ts");
const aboutClient = read("templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts");

const saveRule = css.slice(css.indexOf("/* Shared fixed Save bar"));
assert("shared rule pins the save area", saveRule.includes("position: fixed !important"));
assert("desktop bar matches the 960px content column", saveRule.includes("width: min(960px, 100%)"));
assert("desktop actions stay at the end of the bar", saveRule.includes("justify-content: flex-end"));
assert(
  "mobile bar is full width with a tall tap target",
  /@media \(max-width: 640px\)[\s\S]*width: 100% !important[\s\S]*min-height: 3\.25rem/.test(saveRule),
);
assert("main keeps bottom padding so the bar does not cover the form", css.includes("padding-bottom: 7.5rem"));

for (const [name, src] of [
  ["schedule", schedule],
  ["discography", disc],
  ["youtube", youtube],
  ["about", about],
]) {
  assert(`${name} uses the shared save area`, src.includes("gosaki-admin-save-area"));
  assert(`${name} keeps the unchanged status`, src.includes("変更がありません"));
  assert(`${name} keeps the save label`, src.includes("保存"));
}

assert("schedule save button stays disabled until the client enables it", schedule.includes('data-gosaki-schedule-save') && schedule.includes("disabled"));
assert("discography save button stays disabled until the client enables it", disc.includes("data-gosaki-disc-save") && disc.includes("disabled"));
assert("youtube save button stays disabled until the client enables it", youtube.includes("data-gosaki-youtube-multi-save") && youtube.includes("disabled"));
assert("about save button stays disabled until the client enables it", about.includes("data-gosaki-about-save") && about.includes("disabled"));
assert("schedule cancel reuses the existing edit-cancel control", schedule.includes("data-gosaki-edit-cancel") && schedule.includes("一覧へ戻る"));
assert("discography cancel reuses the existing edit-cancel control", disc.includes("data-gosaki-edit-cancel") && disc.includes("編集をやめる"));
assert("youtube cancel stays on its existing control", youtube.includes("data-gosaki-youtube-multi-cancel"));
assert("about cancel stays on its existing control", about.includes("data-gosaki-about-cancel"));

assert("schedule client still owns save enablement", scheduleClient.includes("applySaveButtonUi(") && scheduleClient.includes("data-gosaki-schedule-save"));
assert("discography client still owns save enablement", discClient.includes("data-gosaki-disc-save"));
assert("youtube client still owns save enablement", youtubeClient.includes("data-gosaki-youtube-multi-save"));
assert("about client still owns save enablement", aboutClient.includes("data-gosaki-about-save"));
assert("success and dirty copy stay in the shared save helper", read("templates/site-extensions/gosaki-piano/gosaki-staging-one-click-save.ts").includes('GOSAKI_SAVE_SUCCESS_USER_MESSAGE = "保存しました"') && read("templates/site-extensions/gosaki-piano/gosaki-staging-one-click-save.ts").includes('GOSAKI_SAVE_DIRTY_USER_MESSAGE = "未保存の変更があります"'));
assert("validation copy still reaches the status node", scheduleClient.includes("入力内容を確認してください"));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
