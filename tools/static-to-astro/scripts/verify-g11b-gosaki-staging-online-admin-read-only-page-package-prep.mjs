/**
 * G-11b — Gosaki staging online admin read-only page package prep verification.
 * Run: node tools/static-to-astro/scripts/verify-g11b-gosaki-staging-online-admin-read-only-page-package-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-online-admin-read-only-page-package-prep.md";
const ADMIN_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/admin/index.html";
const MANUAL_ADMIN_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/admin/index.html";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const REPORT_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md";
const YOUTUBE_CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
const CONTACT_CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-contact-hubspot.json";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EXPECTED_BAND_IMAGES = [
  "gosakirikako_trio.jpg",
  "onomatopoeia.jpg",
  "careless_hornets.jpg",
  "kikioto.jpg",
  "caribbean_function.jpg",
];

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function count(text, pattern) {
  return (String(text).match(pattern) || []).length;
}

const youtubeConfig = JSON.parse(read(YOUTUBE_CONFIG_REL));
const contactConfig = JSON.parse(read(CONTACT_CONFIG_REL));
const adminHtml = exists(ADMIN_HTML_REL) ? read(ADMIN_HTML_REL) : "";
const manualAdminHtml = exists(MANUAL_ADMIN_REL) ? read(MANUAL_ADMIN_REL) : "";
const report = exists(REPORT_REL) ? read(REPORT_REL) : "";
const doc = exists(DOC_REL) ? read(DOC_REL) : "";

const embedCode = youtubeConfig.items?.[0]?.embedCode ?? "";
const videoId = "Ke4F8JAQz-I";

assert("G-11b doc exists", exists(DOC_REL));
assert("G-11b doc phase", doc.includes("G-11b-gosaki-staging-online-admin-read-only-page-package-prep"));
assert("public-dist admin/index.html exists", exists(ADMIN_HTML_REL));
assert("manual-upload admin/index.html exists", exists(MANUAL_ADMIN_REL));
assert("read-only marker", adminHtml.includes('data-gosaki-read-only-admin="true"'));
assert("READ-ONLY label", adminHtml.includes("READ-ONLY"));
assert("Save disabled buttons", count(adminHtml, /disabled/g) >= 3);
assert("Save 無効 label", adminHtml.includes("Save（無効）"));
assert("Publish disabled", adminHtml.includes("Publish（無効）"));
assert("Deploy disabled", adminHtml.includes("Deploy（無効）"));
assert("siteSlug gosaki-piano", adminHtml.includes("gosaki-piano"));
assert("YouTube embedCode shown", adminHtml.includes(embedCode));
assert("YouTube videoId shown", adminHtml.includes(videoId));
assert("About profile section", adminHtml.includes("About profile"));
assert("About bands section", adminHtml.includes("Bands / Projects"));
for (const img of EXPECTED_BAND_IMAGES) {
  assert(`band image file ${img}`, adminHtml.includes(img));
}
assert("HubSpot portalId", adminHtml.includes(contactConfig.portalId));
assert("HubSpot formId", adminHtml.includes(contactConfig.formId));
assert("HubSpot region", adminHtml.includes(contactConfig.region));
assert("noindex meta", /noindex/i.test(adminHtml));
assert("admin canonical deployBase", adminHtml.includes("/cms-kit-staging/gosaki-piano/admin/"));
assert("no API write endpoint ref", !/youtube-embed-static-json-write/i.test(adminHtml));
assert("no workflow_dispatch ref", !/workflow_dispatch/i.test(adminHtml));
assert("no service_role string", !/service_role/i.test(adminHtml));
assert("no GITHUB_TOKEN string", !/GITHUB_TOKEN/i.test(adminHtml));
assert("manual-upload matches admin marker", manualAdminHtml.includes('data-gosaki-read-only-admin="true"'));
assert("safeForStaticFtp true in report", report.includes("safeForStaticFtp (after exclude copy):** true"));
assert("manual-upload package exists", exists(PACKAGE_REL));
assert("zip exists", exists(`${PACKAGE_REL}/gosaki-piano-manual-upload.zip`));

assert("src/pages/admin not modified in working tree", (() => {
  const out = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--short", "--", SARISWING_ADMIN_REL], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return !out.stdout?.trim() && !status.stdout?.trim();
})());

console.log("");
console.log(`G-11b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
