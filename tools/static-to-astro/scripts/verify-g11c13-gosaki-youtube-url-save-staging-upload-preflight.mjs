/**
 * G-11c13 — Gosaki YouTube URL save staging upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c13-gosaki-youtube-url-save-staging-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-url-save-staging-upload-preflight.md";
const UPLOAD_ROOT = "output/manual-upload/gosaki-piano/public-dist";
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

function toolPath(rel) {
  return path.join(TOOL_ROOT, rel);
}

const doc = read(DOC_REL);

assert("G-11c13 doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-11c13", doc.includes("G-11c13-gosaki-youtube-url-save-staging-upload-preflight"));
assert("doc preflight complete", doc.includes("preflight complete"));
assert("doc upload source", doc.includes("output/manual-upload/gosaki-piano/public-dist"));
assert("doc upload contents not zip", doc.includes("not the zip") || doc.includes("not the folder itself"));
assert("doc staging URL", doc.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano"));
assert("doc FTP path", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc not production", doc.includes("Not Sariswing production") || doc.includes("Sariswing production"));
assert("doc mirror delete forbidden", doc.includes("mirror --delete") || doc.includes("mirror-delete"));
assert("doc sync delete forbidden", doc.includes("sync --delete") || doc.includes("sync-delete"));
assert("doc no FTP executed", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc G-11c14 approval", doc.includes("承認します。この手動アップロードを1回だけ実行してください。"));
assert("doc rollback", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc next G-11c14", doc.includes("G-11c14"));

const uploadIndex = toolPath(`${UPLOAD_ROOT}/index.html`);
assert("upload index exists", fs.existsSync(uploadIndex));

if (fs.existsSync(uploadIndex)) {
  const home = fs.readFileSync(uploadIndex, "utf8");
  assert("home new embed", home.includes(`youtube-nocookie.com/embed/${NEW_VID}`));
  assert("home old vid absent", !home.includes(OLD_VID));
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(toolPath(UPLOAD_ROOT));
  assert("file count ~27", files.length === 27);
  const hasRobots = files.some((f) => f.endsWith("robots.txt"));
  const hasSitemap = files.some((f) => f.includes("sitemap"));
  const hasAdmin = files.some((f) => f.endsWith("admin/index.html"));
  assert("package has robots.txt", hasRobots);
  assert("package has sitemap", hasSitemap);
  assert("package has admin", hasAdmin);
  const rg = spawnSync("rg", ["-l", OLD_VID, toolPath(UPLOAD_ROOT)], { encoding: "utf8" });
  assert("no old vid in upload source", !rg.stdout.trim());
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

console.log(`\nG-11c13 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
