/**
 * G-11c12 — Gosaki YouTube URL save static-public + manual-upload package regeneration verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c12-gosaki-youtube-url-save-static-public-and-manual-upload-package-regeneration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { G11C8_CONFIG_REL } from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-static-public-and-manual-upload-package-regeneration.md";
const PUBLIC_HOME = "output/static-public/gosaki-piano/public-dist/index.html";
const PKG_HOME = "output/manual-upload/gosaki-piano/public-dist/index.html";
const MANIFEST_REL = "output/static-public/gosaki-piano/static-public-manifest.json";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const NEW_VID = "I-eY9YMq9GI";
const OLD_VID = "Ke4F8JAQz-I";
const NEW_EMBED = "https://youtu.be/I-eY9YMq9GI";

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
  return fs.readFileSync(path.join(REPO_ROOT, rel.startsWith("tools/") ? rel : `tools/static-to-astro/${rel}`), "utf8");
}

function toolPath(rel) {
  return path.join(TOOL_ROOT, rel);
}

function existsTool(rel) {
  return fs.existsSync(toolPath(rel));
}

const doc = read(DOC_REL);
const config = JSON.parse(read(G11C8_CONFIG_REL));
const item = config.items?.find((i) => i.id === "yt-placeholder-01");

assert("G-11c12 doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-11c12", doc.includes("G-11c12-gosaki-youtube-url-save-static-public-and-manual-upload-package-regeneration"));
assert("doc regeneration complete", doc.includes("regeneration complete"));
assert("doc package path recorded", doc.includes("output/manual-upload/gosaki-piano"));
assert("doc static-public path", doc.includes("output/static-public/gosaki-piano/public-dist"));
assert("doc gitignored output", doc.includes("gitignored"));
assert("doc no FTP", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("deployExecuted") && doc.includes("**false**"));
assert("doc G-11c13 next", doc.includes("G-11c13"));
assert("doc G-11c14 approval", doc.includes("承認します。この手動アップロードを1回だけ実行してください。"));

assert("config embedCode", item?.embedCode === NEW_EMBED);
assert("config published", item?.published === true);

assert("public-dist index exists", existsTool(PUBLIC_HOME));
assert("manual-upload index exists", existsTool(PKG_HOME));

if (existsTool(PUBLIC_HOME)) {
  const home = fs.readFileSync(toolPath(PUBLIC_HOME), "utf8");
  const pkgHome = fs.readFileSync(toolPath(PKG_HOME), "utf8");
  assert("public HTML new embed", home.includes(`youtube-nocookie.com/embed/${NEW_VID}`));
  assert("public HTML old vid absent", !home.includes(OLD_VID));
  assert("package copy matches public home", pkgHome === home);
}

if (existsTool(MANIFEST_REL)) {
  const manifest = JSON.parse(fs.readFileSync(toolPath(MANIFEST_REL), "utf8"));
  assert("manifest safeForStaticFtp", manifest.safeForStaticFtp === true);
  assert("manifest file count 27", manifest.copiedFiles === 27);
  assert("manifest staging deployBase", manifest.deployBase === "/cms-kit-staging/gosaki-piano/");
}

if (existsTool("output/static-public/gosaki-piano/public-dist")) {
  const rg = spawnSync("rg", ["-l", OLD_VID, toolPath("output/static-public/gosaki-piano/public-dist")], {
    encoding: "utf8",
  });
  assert("no old videoId in public-dist", !rg.stdout.trim());
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

console.log(`\nG-11c12 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
