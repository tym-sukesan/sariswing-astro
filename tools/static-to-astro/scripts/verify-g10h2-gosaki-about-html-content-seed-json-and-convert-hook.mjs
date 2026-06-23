/**
 * G-10h2 — Gosaki About HTML content seed JSON + convert hook verification.
 * Run: node tools/static-to-astro/scripts/verify-g10h2-gosaki-about-html-content-seed-json-and-convert-hook.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  applyAboutContentToPage,
  BLOCK_BANDS_ID,
  BLOCK_PROFILE_ID,
  PROFILE_GRID_SELECTOR,
  shouldApplyAboutContentBlock,
} from "./lib/gosaki-about-content.mjs";
import { injectBandProfilesIntoAboutPage } from "./lib/gosaki-about-band-profiles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.join(REPO_ROOT, "tools/static-to-astro");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-about-html-content-seed-json-and-convert-hook.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";
const HOOK_REL = "tools/static-to-astro/scripts/lib/gosaki-about-content.mjs";
const GENERATOR_REL = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const ABOUT_ASTRO_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/pages/about/index.astro";
const ABOUT_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/about/index.html";
const MANUAL_ABOUT_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/about/index.html";
const REPORT_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md";

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

const doc = read(DOC_REL);
const config = JSON.parse(read(CONFIG_REL));
const profileBlock = config.blocks.find((b) => b.id === BLOCK_PROFILE_ID);
const bandsBlock = config.blocks.find((b) => b.id === BLOCK_BANDS_ID);
const aboutAstro = exists(ABOUT_ASTRO_REL) ? read(ABOUT_ASTRO_REL) : "";
const aboutHtml = exists(ABOUT_HTML_REL) ? read(ABOUT_HTML_REL) : "";
const allHtml = `${profileBlock?.html ?? ""}${bandsBlock?.html ?? ""}`.toLowerCase();

assert("G-10h2 doc phase", doc.includes("G-10h2-gosaki-about-html-content-seed-json-and-convert-hook"));
assert("implementation complete gate", doc.includes("gosakiAboutHtmlContentSeedJsonAndConvertHookComplete: true"));
assert("readyFor G-10h3", doc.includes("readyForG10h3GosakiAboutHtmlContentAdminUi: true"));

assert("config JSON exists", exists(CONFIG_REL));
assert("siteSlug gosaki-piano", config.siteSlug === "gosaki-piano");
assert("page about", config.page === "about");
assert("blocks count 2", config.blocks?.length === 2);
assert("about-profile-html enabled", profileBlock?.enabled === true);
assert("about-bands-html enabled", bandsBlock?.enabled === true);
assert("profile html non-empty", String(profileBlock?.html ?? "").trim().length > 0);
assert("bands html non-empty", String(bandsBlock?.html ?? "").trim().length > 0);

assert("no script tag", !allHtml.includes("<script"));
assert("no iframe tag", !allHtml.includes("<iframe"));
assert("no onclick handler", !allHtml.includes("onclick="));
assert("no javascript url", !allHtml.includes("javascript:"));

assert("convert hook exists", exists(HOOK_REL));
assert("astro-generator calls hook", read(GENERATOR_REL).includes("applyGosakiAboutContent"));

assert("generated about astro exists", aboutAstro.length > 0);
assert("profile About heading in astro", aboutAstro.includes(">About<") || aboutAstro.includes("About</span>"));
assert("profile bio snippet in astro", aboutAstro.includes("後藤 沙紀"));
assert("bands section in astro", aboutAstro.includes('class="band-profiles"'));
assert("band name in astro", aboutAstro.includes("ごさきりかこTrio"));
assert("no BandProfilesSection import", !aboutAstro.includes("import BandProfilesSection"));
assert("no BandProfilesSection component", !aboutAstro.includes("<BandProfilesSection"));
assert("single band-profiles section", (aboutAstro.match(/class="band-profiles"/g) ?? []).length === 1);

assert("public-dist about html exists", exists(ABOUT_HTML_REL));
assert("public-dist noindex", aboutHtml.includes('content="noindex,nofollow,noarchive"'));
assert("public-dist deployBase", aboutHtml.includes("/cms-kit-staging/gosaki-piano/"));
assert("public-dist profile content", aboutHtml.includes("後藤 沙紀"));
assert("public-dist bands content", aboutHtml.includes("band-profiles"));

const report = exists(REPORT_REL) ? read(REPORT_REL) : "";
assert("safeForStaticFtp true", report.includes("safeForStaticFtp: true") || report.includes('"safeForStaticFtp": true'));
assert("manual-upload about exists", exists(MANUAL_ABOUT_REL));

assert("admin Save not implemented", doc.includes("adminAboutPageImplemented: false"));
assert("write API not implemented", doc.includes("staticJsonWriteImplemented: false"));
assert("JSON write API not executed", doc.includes("cursorJsonWriteExecuted: false"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("deploy not executed", doc.includes("cursorDeployExecuted: false"));
assert("image mutation not executed", doc.includes("cursorImageFileMutationExecuted: false"));
assert("DB write not executed", doc.includes("cursorDbWriteExecuted: false"));

// Fallback unit checks (pure hook functions)
const samplePage = `---
import BaseLayout from "../../layouts/BaseLayout.astro";
---
<BaseLayout title="About">
<div data-mesh-id="comp-lol1i5l0inlineContent-gridContainer">ORIGINAL</div>
</BaseLayout>`;

const sampleWithBands = injectBandProfilesIntoAboutPage(samplePage);
const emptyConfig = {
  blocks: [
    { id: BLOCK_PROFILE_ID, enabled: true, html: "" },
    { id: BLOCK_BANDS_ID, enabled: true, html: "" },
  ],
};
const emptyResult = applyAboutContentToPage(sampleWithBands, emptyConfig);
assert("fallback empty html keeps BandProfilesSection", emptyResult.content.includes("<BandProfilesSection"));

const disabledConfig = {
  blocks: [
    { id: BLOCK_PROFILE_ID, enabled: false, html: "<p>x</p>" },
    { id: BLOCK_BANDS_ID, enabled: false, html: "<section class=\"band-profiles\"></section>" },
  ],
};
const disabledResult = applyAboutContentToPage(sampleWithBands, disabledConfig);
assert("fallback disabled keeps BandProfilesSection", disabledResult.content.includes("<BandProfilesSection"));
assert("fallback disabled keeps ORIGINAL profile", disabledResult.content.includes("ORIGINAL"));

const activeConfig = {
  blocks: [
    { id: BLOCK_PROFILE_ID, enabled: true, html: "<p>PROFILE-SEED</p>" },
    { id: BLOCK_BANDS_ID, enabled: true, html: '<section class="band-profiles"><h2>Bands</h2></section>' },
  ],
};
const activeResult = applyAboutContentToPage(sampleWithBands, activeConfig);
assert("active profile replaces inner", activeResult.content.includes("PROFILE-SEED"));
assert("active bands removes component", !activeResult.content.includes("<BandProfilesSection"));
assert("shouldApply true for non-empty", shouldApplyAboutContentBlock(activeConfig.blocks[0]));
assert("shouldApply false for empty", !shouldApplyAboutContentBlock(emptyConfig.blocks[0]));

assert("profile selector constant", PROFILE_GRID_SELECTOR.includes("comp-lol1i5l0inlineContent-gridContainer"));
assert("00-current-state G-10h2", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h2"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
