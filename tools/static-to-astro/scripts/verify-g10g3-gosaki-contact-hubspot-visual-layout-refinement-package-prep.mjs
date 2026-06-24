/**
 * G-10g3 — Gosaki Contact HubSpot visual layout refinement package prep verification.
 * Run: node tools/static-to-astro/scripts/verify-g10g3-gosaki-contact-hubspot-visual-layout-refinement-package-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_CONTACT_HUBSPOT_ALLOWLIST,
  GOSAKI_CONTACT_HUBSPOT_CONFIG_REL,
  validateGosakiContactHubspotConfig,
} from "./lib/gosaki-contact-hubspot-embed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-contact-hubspot-visual-layout-refinement-package-prep.md";
const OVERRIDES_REL =
  "tools/static-to-astro/scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs";
const CONTACT_ASTRO_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/pages/contact/index.astro";
const CONTACT_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/contact/index.html";
const MANUAL_CONTACT_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/contact/index.html";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const README_REL = `${PACKAGE_REL}/README-UPLOAD.md`;
const CHECKLIST_REL = `${PACKAGE_REL}/CHECKLIST.md`;
const MANIFEST_REL = `${PACKAGE_REL}/MANIFEST.json`;
const ZIP_REL = `${PACKAGE_REL}/gosaki-piano-manual-upload.zip`;
const REPORT_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md";
const GLOBAL_CSS_REL =
  "tools/static-to-astro/output/gosaki-piano-astro/src/styles/global.css";
const PUBLIC_DIST_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist";

const SCRIPT_PAT = /js\.hsforms\.net\/forms\/embed\/21392032\.js/g;

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

function readPublicDistCssBundle() {
  const astroDir = path.join(REPO_ROOT, PUBLIC_DIST_REL, "_astro");
  if (!fs.existsSync(astroDir)) return "";
  return fs
    .readdirSync(astroDir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => fs.readFileSync(path.join(astroDir, name), "utf8"))
    .join("\n");
}

const doc = read(DOC_REL);
const overridesSrc = read(OVERRIDES_REL);
const CONFIG_REL = `tools/static-to-astro/${GOSAKI_CONTACT_HUBSPOT_CONFIG_REL}`;
const config = JSON.parse(read(CONFIG_REL));
const validation = validateGosakiContactHubspotConfig(config);
const contactAstro = exists(CONTACT_ASTRO_REL) ? read(CONTACT_ASTRO_REL) : "";
const contactHtml = exists(CONTACT_HTML_REL) ? read(CONTACT_HTML_REL) : "";
const manualContactHtml = exists(MANUAL_CONTACT_REL) ? read(MANUAL_CONTACT_REL) : "";
const report = exists(REPORT_REL) ? read(REPORT_REL) : "";
const globalCss = exists(GLOBAL_CSS_REL) ? read(GLOBAL_CSS_REL) : "";
const publicCssBundle = readPublicDistCssBundle();

assert(
  "G-10g3 doc phase",
  doc.includes("G-10g3-gosaki-contact-hubspot-visual-layout-refinement-package-prep"),
);
assert("prep complete gate", doc.includes("gosakiContactHubspotVisualLayoutRefinementPackagePrepComplete: true"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("DB not executed", doc.includes("cursorDbWriteExecuted: false"));
assert("image ops not executed", doc.includes("cursorImageOpsExecuted: false"));

assert("contact hubspot config exists", exists(CONFIG_REL));
assert("config validation ok", validation.ok === true);
assert("provider hubspot", config.provider === GOSAKI_CONTACT_HUBSPOT_ALLOWLIST.provider);
assert("scriptSrc allowlist", config.scriptSrc === GOSAKI_CONTACT_HUBSPOT_ALLOWLIST.scriptSrc);
assert("portalId 21392032", config.portalId === GOSAKI_CONTACT_HUBSPOT_ALLOWLIST.portalId);
assert("formId allowlist", config.formId === GOSAKI_CONTACT_HUBSPOT_ALLOWLIST.formId);
assert("region na1", config.region === GOSAKI_CONTACT_HUBSPOT_ALLOWLIST.region);

assert("G-10g3 refinement block", overridesSrc.includes("G-10g3: center page title + intro"));
assert("contact title center CSS", overridesSrc.includes("#comp-lol1i5gq #WRchTxt4 h4"));
assert("contact container max-width", overridesSrc.includes("max-width: min(100%, 1000px)"));
assert("contact container margin auto", overridesSrc.includes("margin-inline: auto"));
assert("contact grid columns 320px 560px", overridesSrc.includes("grid-template-columns: 320px 560px"));
assert("contact column gap 56px", overridesSrc.includes("column-gap: 56px"));
assert("intro full width centered", overridesSrc.includes("grid-column: 1 / -1") && overridesSrc.includes("#comp-j8pza50e"));
assert("PC min-width media query", overridesSrc.includes("@media (min-width: 769px)"));
assert("no excessive gap 120px", !overridesSrc.includes("column-gap: 120px"));

if (contactAstro) {
  assert("astro hubspot script once", count(contactAstro, SCRIPT_PAT) === 1);
  assert("astro hs-form-frame once", count(contactAstro, /class="hs-form-frame"/g) === 1);
  assert("astro wix form removed", !contactAstro.includes("comp-kei80g91"));
  assert("astro hubspot wrapper", contactAstro.includes("gosaki-contact-hubspot-embed"));
}

if (contactHtml) {
  assert("public-dist contact exists", true);
  assert("public-dist hubspot script once", count(contactHtml, SCRIPT_PAT) === 1);
  assert("public-dist hs-form-frame once", count(contactHtml, /class="hs-form-frame"/g) === 1);
  assert("public-dist wix form removed", !contactHtml.includes("comp-kei80g91"));
  assert("public-dist hubspot wrapper", contactHtml.includes("gosaki-contact-hubspot-embed"));
  assert("public-dist noindex", contactHtml.includes("noindex,nofollow,noarchive"));
  assert("public-dist deployBase", contactHtml.includes("/cms-kit-staging/gosaki-piano/"));
  assert(
    "public-dist G-10g3 layout CSS in bundle",
    publicCssBundle.includes("320px 560px") &&
      publicCssBundle.includes("margin-inline:auto") &&
      publicCssBundle.includes("comp-lol1i5gqinlineContent"),
  );
}

assert("global.css G-10g3 block", globalCss.includes("G-10g3: center page title + intro"));

if (manualContactHtml) {
  assert("manual contact hubspot script", count(manualContactHtml, SCRIPT_PAT) === 1);
  assert("manual contact hs-form-frame", count(manualContactHtml, /class="hs-form-frame"/g) === 1);
  assert("manual contact hubspot wrapper", manualContactHtml.includes("gosaki-contact-hubspot-embed"));
}

assert("safeForStaticFtp true", report.includes('"safeForStaticFtp": true'));
assert("manual-upload package exists", exists(PACKAGE_REL));
assert("README exists", exists(README_REL));
assert("CHECKLIST exists", exists(CHECKLIST_REL));
assert("MANIFEST exists", exists(MANIFEST_REL));
assert("zip exists", exists(ZIP_REL));

assert("about markers unchanged in JSON", read("tools/static-to-astro/config/sites/gosaki-piano-about-content.json").includes("G-10h4b profile save test"));
assert("about bands marker in JSON", read("tools/static-to-astro/config/sites/gosaki-piano-about-content.json").includes("G-10h4d bands save test"));

assert("00-current-state G-10g3", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10g3"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\nG-10g3 verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
