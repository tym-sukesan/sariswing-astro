/**
 * G-10h — Gosaki About HTML content CMS planning.
 * Run: node tools/static-to-astro/scripts/verify-g10h-gosaki-about-html-content-cms-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-html-content-cms-planning.md";
const STAGING_ABOUT_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/";

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

const doc = read(DOC_REL);

assert("G-10h doc phase", doc.includes("G-10h-gosaki-about-html-content-cms-planning"));
assert("planning complete gate", doc.includes("gosakiAboutHtmlContentCmsPlanningComplete: true"));
assert("staging about URL", doc.includes(STAGING_ABOUT_URL.trim()));

assert("Sariswing site_pages recorded", doc.includes("site_pages"));
assert("Sariswing textarea editor", doc.includes("textarea"));
assert("Sariswing set:html render", doc.includes("set:html"));
assert("Sariswing no sanitizer noted", doc.includes("sanitize") || doc.includes("allowlist"));
assert("Sariswing production must not copy", doc.includes("must-not-copy") || doc.includes("Do **not** copy"));

assert("Gosaki fixture about.html SoT", doc.includes("fixtures/gosaki-piano/about.html"));
assert("BandProfilesSection hook", doc.includes("gosaki-about-band-profiles.mjs"));
assert("comp-lol1i5l0 anchor", doc.includes("comp-lol1i5l0"));
assert("no Gosaki About admin yet", doc.includes("No About admin") || doc.includes("no About admin"));

assert("PHOTO placeholder mechanism", doc.includes("band-profile__placeholder"));
assert("placeholder is div not img", doc.includes("`<div>`") || doc.includes("div placeholder"));
assert("5 bands missing images", doc.includes("missing") && doc.includes("ごさきりかこTrio"));

assert("granularity A-E comparison", doc.includes("**A**") && doc.includes("**E**"));
assert("recommended two blocks", doc.includes("about-profile-html") && doc.includes("about-bands-html"));
assert("operator hypothesis valid", doc.includes("valid"));

assert("proposed config path", doc.includes("gosaki-piano-about-content.json"));
assert("staging admin about route", doc.includes("/__admin-staging-shell/musician-basic/admin/about/"));
assert("G-10c write pattern", doc.includes("G-10c"));

assert("images bands directory", doc.includes("public/images/bands/"));
assert("img src in HTML ok", doc.includes("<img src"));

assert("HubSpot separate config", doc.includes("gosaki-piano-contact-embed.json") || doc.includes("contact-embed"));
assert("HubSpot contact not about", doc.includes("Contact") && doc.includes("not** About"));

assert("G-10f deferred", doc.includes("G-10f") && doc.includes("Deferred"));
assert("implementation not executed", doc.includes("cursorImplementationExecuted: false"));
assert("image mutation not executed", doc.includes("cursorImageFileMutationExecuted: false"));
assert("JSON write not executed", doc.includes("cursorJsonWriteExecuted: false"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("next G-10h1", doc.includes("G-10h1"));
assert("readyFor G-10h1", doc.includes("readyForG10h1GosakiAboutHtmlContentCmsImplementationPreflight: true"));

assert("00-current-state G-10h", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
