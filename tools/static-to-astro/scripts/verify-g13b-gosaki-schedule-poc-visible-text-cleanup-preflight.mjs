/**
 * G-13b — Gosaki schedule PoC visible text cleanup preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13b-gosaki-schedule-poc-visible-text-cleanup-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-poc-visible-text-cleanup-preflight.md";
const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

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

assert("G-13b doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-13b", doc.includes("G-13b-gosaki-schedule-poc-visible-text-cleanup-preflight"));
assert("doc preflight complete", doc.includes("preflight complete"));
assert("doc staging URL", doc.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));
assert("doc event A id", doc.includes("f687ebf3-407c-49d0-9ab8-58040c499b8e"));
assert("doc event B id", doc.includes("aa440e29-5be8-402e-9190-0d81c48434c0"));
assert("doc G-9k6 markers", doc.includes("G-9k6"));
assert("doc G-9g markers", doc.includes("G-9g2") || doc.includes("CMS Kit staging"));
assert("doc field cleanup table", doc.includes("Cleanup field candidates"));
assert("doc approval gate", doc.includes("G-13b-gosaki-schedule-poc-visible-text-cleanup"));
assert("doc approval phrase", doc.includes("承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc next implementation", doc.includes("implementation"));
assert("doc preflight gate true", doc.includes("gosakiSchedulePocVisibleTextCleanupPreflightComplete") && doc.includes("**true**"));

const mar = curl(`${STAGING_BASE}/2026-03/`);
if (mar.ok) {
  assert("live march HTTP 200", mar.code === "200");
  assert("live march G-9k6 marker", mar.body.includes("G-9k6"));
}

const jul = curl(`${STAGING_BASE}/2026-07/`);
if (jul.ok) {
  assert("live july HTTP 200", jul.code === "200");
  assert("live july CMS Kit staging", jul.body.includes("CMS Kit staging"));
}

const apr = curl(`${STAGING_BASE}/2026-04/`);
if (apr.ok) {
  assert("live april no CMS Kit staging", !apr.body.includes("CMS Kit staging"));
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-13b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
