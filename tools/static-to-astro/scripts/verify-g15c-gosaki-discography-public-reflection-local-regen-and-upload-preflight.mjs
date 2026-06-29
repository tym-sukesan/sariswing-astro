/**
 * G-15c — Gosaki Discography public reflection local regen + upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-local-regen-and-upload-preflight.md";
const TRIGGER_APPLY_REL =
  "tools/static-to-astro/docs/gosaki-discography-updated-at-trigger-apply-result.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const CONVERT_REL = "tools/static-to-astro/scripts/convert-static-to-astro.mjs";
const GENERATOR_REL = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const GITIGNORE_REL = "tools/static-to-astro/.gitignore";

const DISCOGRAPHY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const ASTRO_CSS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.YcHrHZH4.css";
const ASTRO_JS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

const TARGET_LEGACY_ID = "discography-002";
const TARGET_TITLE = "SKYLARK";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";

const AUDIT_MARKERS = ["[CMS Kit staging]", "PoC", "G-15", "dry-run"];

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

function extractSkylarkItem(html) {
  const idx = html.indexOf(TARGET_TITLE);
  if (idx < 0) return "";
  const start = html.lastIndexOf("comp-llexymga__item-", idx);
  const end = html.indexOf("comp-llexymga__item-", idx + TARGET_TITLE.length);
  if (start < 0) return "";
  return html.slice(start, end > idx ? end : html.length);
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("HEAD is a32e95d", head.stdout.trim() === "a32e95d", head.stdout.trim());
assert("origin/main is a32e95d", origin.stdout.trim() === "a32e95d", origin.stdout.trim());

const doc = read(DOC_REL);

assert("G-15c preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-15c",
  doc.includes(
    "G-15c-gosaki-discography-public-reflection-local-regen-and-upload-preflight",
  ),
);
assert("doc local regen complete gate", doc.includes("gosakiDiscographyPublicReflectionLocalRegenComplete: true"));
assert("doc upload preflight complete gate", doc.includes("gosakiDiscographyPublicReflectionUploadPreflightComplete: true"));
assert("doc readyForUploadExecution", doc.includes("readyForG15cPublicReflectionUploadExecution: true"));
assert("doc packageRegenExecuted true", doc.includes("packageRegenExecuted: true"));
assert("doc cssJsHashChanged false", doc.includes("cssJsHashChanged: false"));
assert("doc minimal upload scope", doc.includes("minimalUploadScopeConfirmed: true"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc post upload http not executed", doc.includes("postUploadHttpVerifyExecuted: false"));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc target title SKYLARK", doc.includes(TARGET_TITLE));
assert("doc purchase_url before", doc.includes(PURCHASE_URL_BEFORE));
assert("doc purchase_url after", doc.includes(PURCHASE_URL_AFTER));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc hook module", doc.includes("supabase-discography-read.mjs"));
assert("doc file count 27", doc.includes("**27**"));
assert("doc CSS hash", doc.includes("index.YcHrHZH4.css"));
assert("doc JS hash", doc.includes("index.astro_astro_type_script_index_0_lang.CTyGy8yS.js"));
assert("doc minimal 1 file upload", doc.includes("discography/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc old url absent", doc.includes("gosaakiii") && doc.includes("absent"));
assert("doc discographyDataSource supabase", doc.includes("discographyDataSource=supabase"));
assert("doc live stale", doc.includes("stale"));
assert("doc gitignore note", doc.includes("gitignored"));
assert("doc continuous not touched", doc.includes("continuousReleaseTouched: false"));

assert("G-15b-f8 trigger apply doc exists", exists(TRIGGER_APPLY_REL));
assert("G-14c playbook exists", exists(G14C_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));
assert("hook module exists", exists(HOOK_REL));
assert("ftp safety doc exists", exists(FTP_SAFETY_REL));
assert("output gitignored", read(GITIGNORE_REL).includes("output/*"));

const hookSrc = read(HOOK_REL);
const convertSrc = read(CONVERT_REL);
const generatorSrc = read(GENERATOR_REL);
assert("hook loadGosakiDiscographyDataForBuild", hookSrc.includes("loadGosakiDiscographyDataForBuild"));
assert("hook patchGosakiDiscographyPurchaseUrls", hookSrc.includes("patchGosakiDiscographyPurchaseUrls"));
assert("hook discographyDataSource marker", hookSrc.includes("discographyDataSource="));
assert("convert loads discography bundle", convertSrc.includes("loadGosakiDiscographyDataForBuild"));
assert("generator applies discography patch", generatorSrc.includes("patchGosakiDiscographyPurchaseUrls"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert("discography HTML exists", exists(DISCOGRAPHY_HTML_REL));
assert("astro CSS exists", exists(ASTRO_CSS_REL));
assert("astro JS exists", exists(ASTRO_JS_REL));

const discHtml = read(DISCOGRAPHY_HTML_REL);
const skylarkItem = extractSkylarkItem(discHtml);

assert("local discographyDataSource supabase", discHtml.includes("discographyDataSource=supabase"));
assert("local new purchase_url present", discHtml.includes(PURCHASE_URL_AFTER));
assert("local old purchase_url absent", !discHtml.includes(PURCHASE_URL_BEFORE));
assert("SKYLARK item new url", skylarkItem.includes(PURCHASE_URL_AFTER));
assert("SKYLARK item old url absent", !skylarkItem.includes(PURCHASE_URL_BEFORE));
assert("Continuous title present", discHtml.includes("Continuous"));
assert("About Us title present", discHtml.includes("About Us!!"));
assert("Ja-Jaaaaan title present", discHtml.includes("Ja-Jaaaaan!"));

for (const marker of AUDIT_MARKERS) {
  assert(`discography HTML no audit marker: ${marker}`, !discHtml.includes(marker));
}

const fileCount = spawnSync(
  "find",
  [
    path.join(REPO_ROOT, "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist"),
    "-type",
    "f",
  ],
  { encoding: "utf8" },
);
const count = fileCount.stdout.trim().split("\n").filter(Boolean).length;
assert("public-dist file count 27", count === 27, String(count));

try {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", STAGING_DISCOGRAPHY_URL], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status === 0) {
    const parts = r.stdout.trimEnd().split("\n");
    const code = parts.pop();
    const body = parts.join("\n");
    assert("live discography HTTP 200", code === "200", code);
    const liveSkylark = extractSkylarkItem(body);
    assert("live SKYLARK still stale old url", liveSkylark.includes(PURCHASE_URL_BEFORE));
    assert("live SKYLARK not yet new url", !liveSkylark.includes(PURCHASE_URL_AFTER));
    assert("live page not production host", !body.includes("gosaki-piano.com"));
  } else {
    console.log("SKIP live HTTP — curl failed");
  }
} catch {
  console.log("SKIP live HTTP");
}

console.log(`\nG-15c preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
