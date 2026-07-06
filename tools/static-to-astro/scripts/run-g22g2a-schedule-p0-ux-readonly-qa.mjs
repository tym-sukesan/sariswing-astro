/**
 * G-22g2a — read-only live QA runner (HTTP markers + SSR JSON analysis).
 * Re-run while dry-run dev is listening on :4321. Does not click Save or mutate DB.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/run-g22g2a-schedule-p0-ux-readonly-qa.mjs
 */

import { spawnSync } from "node:child_process";

const SCHEDULE_URL =
  "http://127.0.0.1:4321/__admin-staging-shell/musician-basic/admin/schedule/";
const TARGET_LEGACY = "schedule-2026-07-008";

function curl(args) {
  return spawnSync("curl", args, {
    encoding: "utf8",
    maxBuffer: 15 * 1024 * 1024,
    timeout: 45000,
  });
}

const status = curl(["-sS", "-o", "/dev/null", "-w", "%{http_code}", SCHEDULE_URL]);
if (status.status !== 0 || status.stdout.trim() !== "200") {
  console.error("HTTP_FAIL", status.stdout.trim(), status.stderr);
  process.exit(1);
}

const html = curl(["-sS", SCHEDULE_URL]);
if (html.status !== 0) {
  console.error("HTML_FETCH_FAIL", html.stderr);
  process.exit(1);
}

const body = html.stdout;
const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
}

check("http_200", true);
check(
  "no_transform_error",
  !/Transform failed|An error occurred|ReferenceError|SyntaxError/i.test(body),
);
check("operator_guide", body.includes("通常の Schedule 操作はこちら"));
check("procedure_hints_section", body.includes("gosaki-schedule-operator-procedure-hints"));
check("procedure_hints_title", body.includes("操作手順のヒント"));
check("operation_existing_update", body.includes('data-gosaki-procedure-hint="existing-update"'));
check("operation_duplicate", body.includes('data-gosaki-procedure-hint="duplicate"'));
check("operation_new_event", body.includes('data-gosaki-procedure-hint="new-event"'));
check("operation_unpublish", body.includes('data-gosaki-procedure-hint="unpublish"'));
check("db_unchanged_copy", body.includes("DBは変わりません"));
check(
  "db_unchanged_until_save",
  body.includes("保存ボタンを押すまでDBは変更されません") ||
    body.includes("保存ボタンを押すまでDBは変わりません"),
);
check("save_once_note", body.includes("1回だけ") && body.includes("連打禁止"));
check("dev_mock_isolation", body.includes("gosaki-schedule-dev-mock-zone"));
check("dev_tools_details", body.includes("開発者向け詳細"));
check("legacy_id_column", body.includes('scope="col">legacy_id</th>') || body.includes("gosaki-schedule-legacy-id-code"));
check("selected_summary_shell", body.includes("gosaki-schedule-operator-selected-summary"));
check("save_target_panel", body.includes("gosaki-schedule-save-target-panel"));
check("dry_run_button", body.includes('id="gosaki-schedule-edit-dry-run-btn"'));
check("read_source_supabase", body.includes('data-read-source="supabase"'));
check("write_disabled", body.includes('data-g9k-staging-write-enabled="false"'));
check("save_button_disabled", /id="gosaki-schedule-update-btn"[^>]*disabled/.test(body));
check("delete_preparing", body.includes("削除（準備中）"));
check("admin_read_hint_shell", body.includes("gosaki-schedule-admin-read-procedure-hint"));
check(
  "transient_error_visible_on_ssr",
  body.includes("admin-gosaki-schedule-operator__unavailable") &&
    body.includes("スケジュールを読み込めませんでした"),
);

const rowsMatch = body.match(/data-selectable-rows="([^"]+)"/);
let ssrCount = 0;
let ssrAllPublished = false;
let ssrHas008 = false;
if (rowsMatch) {
  const decoded = rowsMatch[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  try {
    const rows = JSON.parse(decoded);
    ssrCount = rows.length;
    ssrAllPublished = rows.every((row) => row.published === true);
    ssrHas008 = rows.some((row) => row.legacy_id === TARGET_LEGACY);
  } catch (error) {
    check("ssr_rows_json", false, String(error));
  }
}

check("ssr_bootstrap_row_count", ssrCount >= 50, `count=${ssrCount}`);
check("ssr_published_only_bootstrap", ssrAllPublished, `allPublished=${ssrAllPublished}`);
check("ssr_no_008_before_login", !ssrHas008, "008 in SSR = unexpected before login");

const failed = checks.filter((item) => !item.ok);
for (const item of checks) {
  console.log(item.ok ? "PASS" : "FAIL", item.name, item.detail ? item.detail : "");
}
console.log(`SSR_ROWS=${ssrCount} ALL_PUBLISHED=${ssrAllPublished} HAS_008=${ssrHas008}`);
console.log(`G22G2A_QA_CHECKS=${checks.length - failed.length}/${checks.length}`);
process.exit(failed.length > 0 ? 1 : 0);
