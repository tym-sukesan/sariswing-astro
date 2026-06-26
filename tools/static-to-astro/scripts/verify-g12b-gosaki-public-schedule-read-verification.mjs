/**
 * G-12b — Gosaki public schedule read verification.
 * Run: node tools/static-to-astro/scripts/verify-g12b-gosaki-public-schedule-read-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-public-schedule-read-verification.md";
const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

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
  const body = parts.join("\n");
  return { ok: true, body, code };
}

const doc = read(DOC_REL);

assert("G-12b doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-12b", doc.includes("G-12b-gosaki-public-schedule-read-verification"));
assert("doc verification complete", doc.includes("verification complete"));
assert("doc staging URL only", doc.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));
assert("doc not production", doc.includes("Not Sariswing production") || doc.includes("Sariswing production"));
assert("doc HTTP 200 recorded", doc.includes("**200**") || doc.includes("| 200 |"));
assert("doc scheduleDataSource supabase", doc.includes("scheduleDataSource=supabase"));
assert("doc static fallback noted", doc.includes("static-fallback") || doc.includes("Supabase read"));
assert("doc canonical", doc.includes("canonical"));
assert("doc noindex", doc.includes("noindex"));
assert("doc legacy stub", doc.includes("/2026-07/") && doc.includes("legacy"));
assert("doc event counts", doc.includes("13") && doc.includes("14"));
assert("doc 404 for 2026-08", doc.includes("404") && doc.includes("2026-08"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no FTP", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("deployExecuted") && doc.includes("**false**"));
assert("doc no workflow dispatch", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no secrets set", doc.includes("supabaseSecretsSetExecuted") && doc.includes("**false**"));
assert("doc verification gate true", doc.includes("gosakiPublicScheduleReadVerificationComplete") && doc.includes("**true**"));
assert("doc next phase", doc.includes("G-12c") || doc.includes("G-9h1") || doc.includes("Next"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

const hub = curl(`${STAGING_BASE}/schedule/`);
if (hub.ok) {
  assert("live hub HTTP 200", hub.code === "200");
  assert("live hub supabase marker", hub.body.includes("scheduleDataSource=supabase"));
  assert("live hub noindex", /noindex/i.test(hub.body));
  assert("live hub canonical staging", hub.body.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/"));
}

const month = curl(`${STAGING_BASE}/schedule/2026-07/`);
if (month.ok) {
  assert("live month HTTP 200", month.code === "200");
  assert("live month supabase", month.body.includes("scheduleDataSource=supabase"));
  const cards = (month.body.match(/<article class="gosaki-schedule-event-card">/g) || []).length;
  assert("live 2026-07 event count 14", cards === 14, `got ${cards}`);
}

const legacy = curl(`${STAGING_BASE}/2026-07/`);
if (legacy.ok) {
  assert("live legacy HTTP 200", legacy.code === "200");
  assert("live legacy canonical to schedule path", legacy.body.includes("/schedule/2026-07/"));
}

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-12b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
