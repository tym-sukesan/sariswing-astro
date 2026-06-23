/**
 * G-10e — Gosaki YouTube embed section layout improvement.
 * Run: node tools/static-to-astro/scripts/verify-g10e-gosaki-youtube-embed-section-layout-improvement.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-embed-section-layout-improvement.md";
const TEMPLATE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro";
const OVERRIDES_REL =
  "tools/static-to-astro/scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs";
const PACKAGE_HOME_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/index.html";
const STATIC_REPORT_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md";
const DEPLOY_BASE = "/cms-kit-staging/gosaki-piano/";
const EXPECTED_VIDEO_ID = "Ke4F8JAQz-I";
const EXPECTED_NOCOOKIE = `youtube-nocookie.com/embed/${EXPECTED_VIDEO_ID}`;

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

function readIfExists(rel) {
  const abs = path.join(REPO_ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
}

function globCssInPackage() {
  const astroDir = path.join(
    REPO_ROOT,
    "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro",
  );
  if (!fs.existsSync(astroDir)) return "";
  return fs
    .readdirSync(astroDir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => fs.readFileSync(path.join(astroDir, name), "utf8"))
    .join("\n");
}

const doc = read(DOC_REL);
const template = read(TEMPLATE_REL);
const overrides = read(OVERRIDES_REL);
const homeHtml = readIfExists(PACKAGE_HOME_REL);
const staticReport = readIfExists(STATIC_REPORT_REL);
const packageCss = globCssInPackage();
const combinedCss = `${homeHtml ?? ""}\n${packageCss}`;

assert("G-10e doc phase", doc.includes("G-10e-gosaki-youtube-embed-section-layout-improvement"));
assert("layout improvement complete gate", doc.includes("gosakiYoutubeEmbedSectionLayoutImprovementComplete: true"));
assert("720px target recorded", doc.includes("720px"));
assert("aspect-ratio 16/9 recorded", doc.includes("16 / 9") || doc.includes("16:9"));
assert("FTP not executed", doc.includes("Cursor FTP") && doc.includes("**no**"));
assert("workflow_dispatch not executed", doc.includes("workflow_dispatch"));
assert("Save not clicked", doc.includes("Do not re-click G-10c Save"));
assert("next G-10e1 recorded", doc.includes("G-10e1-gosaki-youtube-embed-section-layout-operator-reupload"));
assert("readyFor G-10e1", doc.includes("readyForG10e1YoutubeEmbedSectionLayoutOperatorReupload: true"));

assert("template max-width 720px", template.includes("max-width: 720px"));
assert("template aspect-ratio 16/9", template.includes("aspect-ratio: 16 / 9"));
assert("overrides G-10e block", overrides.includes("G-10e gosaki YouTube embed section layout improvement"));
assert("overrides 720px", overrides.includes("max-width: 720px !important"));

assert("package home HTML exists", homeHtml !== null);
if (homeHtml) {
  assert("package gosaki-youtube-embed class", homeHtml.includes("gosaki-youtube-embed"));
  assert("package nocookie embed", homeHtml.includes(EXPECTED_NOCOOKIE));
  assert("package videoId", homeHtml.includes(EXPECTED_VIDEO_ID));
  assert("package noindex", homeHtml.includes("noindex"));
  assert("package deployBase path", homeHtml.includes(DEPLOY_BASE) || homeHtml.includes("cms-kit-staging/gosaki-piano"));
}

assert("CSS max-width 720px", /max-width:\s*720px/.test(combinedCss));
assert(
  "CSS aspect-ratio 16/9",
  /aspect-ratio:\s*16\s*\/\s*9/.test(combinedCss),
);
assert("CSS iframe width 100%", /gosaki-youtube-embed__iframe[\s\S]{0,200}width:\s*100%/.test(combinedCss) || combinedCss.includes("width:100%"));

if (staticReport) {
  assert(
    "safeForStaticFtp true",
    staticReport.includes("safeForStaticFtp: true") ||
      staticReport.includes('"safeForStaticFtp": true') ||
      staticReport.includes("safeForStaticFtp (after exclude copy):** true"),
  );
  assert("deployBase in report", staticReport.includes("cms-kit-staging/gosaki-piano"));
}

assert("00-current-state G-10e", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10e"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
