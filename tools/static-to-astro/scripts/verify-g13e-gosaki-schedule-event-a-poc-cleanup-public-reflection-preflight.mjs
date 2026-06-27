/**
 * G-13e — Gosaki Event A public reflection preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight.md";
const G13D1_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-execution-result.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const CONVERT_REL = "tools/static-to-astro/scripts/convert-static-to-astro.mjs";
const SUPABASE_READ_REL = "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs";
const DATA_PAGES_REL = "tools/static-to-astro/scripts/lib/gosaki-schedule-data-pages.mjs";
const PACKAGE_JSON_REL = "tools/static-to-astro/package.json";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-03-007";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const STAGING_MONTH_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-03/";

const EXPECTED_CLEAN = {
  title: "<Duo>",
  venue: "川崎 ぴあにしも",
  open_time: "15:00",
  start_time: "15:30",
  price: "3,000円",
};

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

function curl(url) {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", url], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return { ok: false, body: "", code: "0" };
  const parts = r.stdout.trimEnd().split("\n");
  const code = parts.pop();
  return { ok: true, body: parts.join("\n"), code };
}

const doc = read(DOC_REL);
const g13d1Doc = read(G13D1_RESULT_REL);
const buildScript = read(BUILD_SCRIPT_REL);
const convertSrc = read(CONVERT_REL);
const supabaseReadSrc = read(SUPABASE_READ_REL);
const dataPagesSrc = read(DATA_PAGES_REL);
const packageJson = read(PACKAGE_JSON_REL);

assert("G-13e doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13e preflight",
  doc.includes("G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection-preflight"),
);
assert("doc references G-13d1 result", doc.includes("gosaki-schedule-event-a-poc-cleanup-execution-result"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc build script path", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc manual-upload package", doc.includes("manual-upload:package"));
assert("doc primary HTML path", doc.includes("schedule/2026-03/index.html"));
assert("doc upload target", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc no package regen this phase", doc.includes("packageRegenExecuted") && doc.includes("**false**"));
assert("doc no FTP this phase", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc scheduleDataSource supabase", doc.includes("scheduleDataSource=supabase"));
assert("doc Event B out of scope", doc.includes("Event B") && doc.includes("out of scope"));
assert("doc G-13e next local regen", doc.includes("public-reflection-local-regen"));
assert("doc operator SELECT sql", doc.includes("from public.schedules"));

for (const [field, value] of Object.entries(EXPECTED_CLEAN)) {
  assert(`doc expected clean ${field}`, doc.includes(value));
}

assert("doc PoC markers to remove", doc.includes("G-9k6") && doc.includes("G-9k4"));
assert("doc live gap noted", doc.includes("still") || doc.includes("Stale") || doc.includes("still shows"));

assert("G-13d1 result doc exists", fs.existsSync(path.join(REPO_ROOT, G13D1_RESULT_REL)));
assert("G-13d1 save success", g13d1Doc.includes("gosakiScheduleEventAPocCleanupSaveSuccess: true"));
assert("G-13d1 updated_at", g13d1Doc.includes("2026-06-27T05:10:58.008982+00:00"));

assert("build script exists", fs.existsSync(path.join(REPO_ROOT, BUILD_SCRIPT_REL)));
assert("build script runs convert", buildScript.includes("convert-static-to-astro.mjs"));
assert("build script runs manual-upload", buildScript.includes("manual-upload:package"));
assert("convert loads gosaki schedule", convertSrc.includes("loadGosakiScheduleDataForBuild"));
assert("supabase read module", supabaseReadSrc.includes("loadScheduleRowsFromSupabase"));
assert("data pages apply", dataPagesSrc.includes("applyGosakiScheduleDataPages"));
assert("data pages month path", dataPagesSrc.includes("schedule/${monthMeta.month}"));
assert("package.json manual-upload", packageJson.includes("manual-upload:package"));

assert("doc no Event B cleanup scope", !doc.includes(`cleanup Event B`) || doc.includes("out of scope"));
assert("config file no Event B target", !read("src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts").includes(`= "${EVENT_B_ID}"`));

const live = curl(STAGING_MONTH_URL);
if (live.ok && live.code === "200") {
  assert("live month HTTP 200", true);
  assert("live scheduleDataSource supabase", live.body.includes("scheduleDataSource=supabase"));
  assert(
    "live still has G-9k6 pre-reflection (gap)",
    live.body.includes("G-9k6") || live.body.includes("UI保存テスト"),
  );
  assert("live Event A date present", live.body.includes("2026.03.15"));
} else {
  console.log("SKIP live HTTP checks (network unavailable)");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(
  `\nG-13e public reflection preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
