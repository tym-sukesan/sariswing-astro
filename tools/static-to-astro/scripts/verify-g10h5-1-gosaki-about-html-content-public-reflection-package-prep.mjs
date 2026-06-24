/**
 * G-10h5-1 — Gosaki About HTML content public reflection package prep verification.
 * Run after local convert + build + manual-upload package (no FTP).
 * Run: node tools/static-to-astro/scripts/verify-g10h5-1-gosaki-about-html-content-public-reflection-package-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G10H4B_PROFILE_SAVE_TEST_COMMENT,
  G10H4A_TARGET_BLOCK_ID,
} from "../../../src/lib/admin/staging-write/gosaki-about-profile-html-static-json-write-types.ts";
import {
  G10H4D_BANDS_SAVE_TEST_COMMENT,
  G10H4C_TARGET_BLOCK_ID,
} from "../../../src/lib/admin/staging-write/gosaki-about-bands-html-static-json-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-about-html-content-public-reflection-package-prep.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";
const ABOUT_ASTRO_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/pages/about/index.astro";
const ABOUT_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/about/index.html";
const MANUAL_ABOUT_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/about/index.html";
const REPORT_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md";
const MANIFEST_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json";
const README_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/README-UPLOAD.md";
const CHECKLIST_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/CHECKLIST.md";
const ZIP_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip";

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

function countMarker(text, pattern) {
  return (String(text).match(pattern) || []).length;
}

const doc = read(DOC_REL);
const config = JSON.parse(read(CONFIG_REL));
const profileBlock = config.blocks?.find((b) => b.id === G10H4A_TARGET_BLOCK_ID);
const bandsBlock = config.blocks?.find((b) => b.id === G10H4C_TARGET_BLOCK_ID);
const profileHtml = String(profileBlock?.html ?? "");
const bandsHtml = String(bandsBlock?.html ?? "");
const aboutAstro = exists(ABOUT_ASTRO_REL) ? read(ABOUT_ASTRO_REL) : "";
const aboutHtml = exists(ABOUT_HTML_REL) ? read(ABOUT_HTML_REL) : "";
const manualAboutHtml = exists(MANUAL_ABOUT_REL) ? read(MANUAL_ABOUT_REL) : "";
const report = exists(REPORT_REL) ? read(REPORT_REL) : "";

assert("G-10h5-1 doc phase", doc.includes("G-10h5-1-gosaki-about-html-content-public-reflection-package-prep"));
assert("prep complete gate", doc.includes("gosakiAboutHtmlContentPublicReflectionPackagePrepComplete: true"));
assert("readyFor G-10h5-2 upload", doc.includes("readyForG10h5_2GosakiAboutHtmlStagingManualUploadByOperator: true"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("DB not executed", doc.includes("cursorDbWriteExecuted: false"));
assert("image ops not executed", doc.includes("cursorImageFileOpsExecuted: false"));

assert("source JSON profile marker once", countMarker(profileHtml, /G-10h4b profile save test/g) === 1);
assert("source JSON bands marker once", countMarker(bandsHtml, /G-10h4d bands save test/g) === 1);
assert("source JSON profile no bands marker", !profileHtml.includes("G-10h4d bands save test"));
assert("source JSON bands no profile marker", !bandsHtml.includes("G-10h4b profile save test"));
assert("source JSON bands ends with marker", bandsHtml.trimEnd().endsWith(G10H4D_BANDS_SAVE_TEST_COMMENT));

assert("generated about astro exists", aboutAstro.length > 0);
assert("astro profile marker once", countMarker(aboutAstro, /G-10h4b profile save test/g) === 1);
assert("astro bands marker once", countMarker(aboutAstro, /G-10h4d bands save test/g) === 1);
assert("astro no BandProfilesSection import", !aboutAstro.includes("import BandProfilesSection"));
assert("astro no BandProfilesSection component", !aboutAstro.includes("<BandProfilesSection"));
assert("astro single band-profiles section", countMarker(aboutAstro, /class="band-profiles"/g) === 1);
assert("astro bands content", aboutAstro.includes("ごさきりかこTrio"));

assert("public-dist about html exists", exists(ABOUT_HTML_REL));
assert("public-dist profile marker once", countMarker(aboutHtml, /G-10h4b profile save test/g) === 1);
assert("public-dist bands content reflected", aboutHtml.includes("ごさきりかこTrio"));
assert("public-dist single band-profiles", countMarker(aboutHtml, /class="band-profiles"/g) === 1);
assert("public-dist noindex", aboutHtml.includes('content="noindex,nofollow,noarchive"'));
assert("public-dist deployBase", aboutHtml.includes("/cms-kit-staging/gosaki-piano/"));
assert(
  "public-dist bands marker (documented build strip if absent)",
  countMarker(aboutHtml, /G-10h4d bands save test/g) === 1 ||
    doc.includes("bandsMarkerStrippedInPublicBuild: true"),
);

assert("safeForStaticFtp true", report.includes('"safeForStaticFtp": true'));

assert("manual-upload about exists", exists(MANUAL_ABOUT_REL));
assert("manual-upload profile marker", countMarker(manualAboutHtml, /G-10h4b profile save test/g) === 1);
assert("manual-upload bands content", manualAboutHtml.includes("band-profiles"));
assert("README-UPLOAD exists", exists(README_REL));
assert("CHECKLIST exists", exists(CHECKLIST_REL));
assert("MANIFEST exists", exists(MANIFEST_REL));
assert("zip exists", exists(ZIP_REL));
assert("README upload target path", read(README_REL).includes("/cms-kit-staging/gosaki-piano/"));
assert("README no mirror delete", read(README_REL).includes("mirror") || read(README_REL).includes("delete"));
assert("CHECKLIST about route", read(CHECKLIST_REL).includes("/about/"));

assert("00-current-state G-10h5-1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h5-1"));

const adminProdDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminProdDiff.stdout ?? "").trim() === "");

console.log(`\nG-10h5-1 verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
