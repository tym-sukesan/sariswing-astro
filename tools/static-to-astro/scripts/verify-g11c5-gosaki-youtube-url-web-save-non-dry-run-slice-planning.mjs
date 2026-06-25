/**
 * G-11c5 — Gosaki YouTube URL web-save non-dry-run slice planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c5-gosaki-youtube-url-web-save-non-dry-run-slice-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-web-save-non-dry-run-slice-planning.md";
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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const doc = read(DOC_REL);

assert("G-11c5 doc exists", exists(DOC_REL));
assert("doc phase", doc.includes("G-11c5-gosaki-youtube-url-web-save-non-dry-run-slice-planning"));
assert("doc planning complete", doc.includes("planning complete"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production ref blocked", doc.includes(PRODUCTION_REF) && doc.includes("stop"));
assert("doc no production deploy.yml reuse", doc.includes("deploy.yml") && doc.includes("not"));
assert("doc G-11c4d input", doc.includes("G-11c4d"));
assert("doc static JSON recommended", doc.includes("gosaki-piano-youtube-embed.json"));
assert("doc Edge save function planned", doc.includes("gosaki-youtube-url-save"));
assert("doc separate from dry-run", doc.includes("separate") || doc.includes("Separate"));
assert("doc ADMIN_EMAILS reuse", doc.includes("ADMIN_EMAILS"));
assert("doc no secrets in docs", doc.includes("no real emails") || doc.includes("Placeholders only"));
assert("doc dry-run save publish boundaries", doc.includes("Dry-run") && doc.includes("Save") && doc.includes("Publish"));
assert("doc no_change handling", doc.includes("no_change"));
assert("doc conflict 409", doc.includes("409") || doc.includes("conflict"));
assert("doc unauthorized", doc.includes("401") || doc.includes("403"));
assert("doc wouldWrite false dry-run", doc.includes("wouldWrite: false"));
assert("doc rollback", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc next G-11c6", doc.includes("G-11c6"));
assert("doc no Save execution", doc.includes("no Save") || doc.includes("Save execution"));
assert("doc no DB write", doc.includes("DB write") && doc.includes("**no**"));
assert("doc no JSON mutation", doc.includes("JSON") && (doc.includes("**no**") || doc.includes("mutation")));
assert("doc no workflow_dispatch execution", doc.includes("workflow_dispatch") && doc.includes("**no**"));
assert("doc no FTP", doc.includes("FTP") && doc.includes("**no**") || doc.includes("Out of first"));
assert("doc no functions deploy", doc.includes("functions deploy") && doc.includes("**no**"));
assert("doc no service_role", doc.includes("service_role") && doc.includes("Forbidden"));
assert("doc src/pages/admin untouched", doc.includes("src/pages/admin"));
assert(
  "doc no real email in body",
  !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

console.log("");
console.log(`G-11c5 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
