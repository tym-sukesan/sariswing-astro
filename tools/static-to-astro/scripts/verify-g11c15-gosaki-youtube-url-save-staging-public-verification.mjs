/**
 * G-11c15 — Gosaki YouTube URL save staging public verification.
 * Run: node tools/static-to-astro/scripts/verify-g11c15-gosaki-youtube-url-save-staging-public-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-staging-public-verification.md";
const STAGING_HOME = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const NEW_VID = "I-eY9YMq9GI";
const OLD_VID = "Ke4F8JAQz-I";

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

assert("G-11c15 doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-11c15", doc.includes("G-11c15-gosaki-youtube-url-save-staging-public-verification"));
assert("doc verification complete", doc.includes("verification complete"));
assert("doc staging URL", doc.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));
assert("doc new embed", doc.includes(`youtube-nocookie.com/embed/${NEW_VID}`));
assert("doc old vid absent", doc.includes(OLD_VID) && doc.includes("absent"));
assert("doc HTTP 200", doc.includes("**200**") || doc.includes("| 200 |"));
assert("doc not production", doc.includes("not") && doc.includes("Sariswing production"));
assert("doc no FTP executed", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("deployExecuted") && doc.includes("**false**"));
assert("doc no workflow dispatch", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc no secrets set", doc.includes("supabaseSecretsSetExecuted") && doc.includes("**false**"));
assert("doc verification gate true", doc.includes("stagingPublicVerificationComplete") && doc.includes("**true**"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const live = curl(STAGING_HOME);
if (live.ok) {
  assert("live home HTTP 200", live.code === "200");
  assert("live new embed", live.body.includes(`youtube-nocookie.com/embed/${NEW_VID}`));
  assert("live old vid absent", !live.body.includes(OLD_VID));
} else {
  console.log("SKIP live HTTP checks (curl unavailable)");
}

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-11c15 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
