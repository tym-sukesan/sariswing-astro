/**
 * G-10h3 — Gosaki About HTML content admin read-only preview.
 * Run: node tools/static-to-astro/scripts/verify-g10h3-gosaki-about-html-content-admin-readonly-preview.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-about-html-content-admin-readonly-preview.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";
const ROUTE_REL =
  "src/pages/__admin-staging-shell/musician-basic/admin/about/index.astro";
const PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminAboutPage.astro";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const BINDING_REL = "src/lib/admin/staging-data/gosaki-about-content-admin-binding.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-about-content-admin-ui.ts";
const PATHS_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/gosaki-staging-admin-paths.ts";
const ABOUT_PATH = "/__admin-staging-shell/musician-basic/admin/about/";

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
const route = read(ROUTE_REL);
const operator = read(OPERATOR_REL);
const binding = read(BINDING_REL);
const ui = read(UI_REL);
const paths = read(PATHS_REL);
const astroConfig = read("astro.config.mjs");

assert("G-10h3 doc phase", doc.includes("G-10h3-gosaki-about-html-content-admin-readonly-preview"));
assert("readonly preview complete gate", doc.includes("gosakiAboutHtmlContentAdminReadonlyPreviewComplete: true"));
assert("readyFor G-10h4", doc.includes("readyForG10h4GosakiAboutHtmlContentStaticJsonWrite: true"));

assert("about admin route file exists", exists(ROUTE_REL));
assert("about admin page template exists", exists(PAGE_REL));
assert("operator component exists", exists(OPERATOR_REL));
assert("binding module exists", exists(BINDING_REL));
assert("admin ui module exists", exists(UI_REL));
assert("astro injectRoute about", astroConfig.includes("/__admin-staging-shell/musician-basic/admin/about"));
assert("admin path constant", paths.includes("GOSAKI_STAGING_ADMIN_ABOUT_PATH") && paths.includes(ABOUT_PATH));

assert("config JSON referenced", binding.includes("gosaki-piano-about-content.json"));
assert("config file exists", exists(CONFIG_REL));
assert("load binding export", binding.includes("loadGosakiAboutContentAdminBinding"));

assert("block about-profile-html", operator.includes("about-profile-html") || binding.includes("about-profile-html"));
assert("block about-bands-html", operator.includes("about-bands-html") || binding.includes("about-bands-html"));
assert("textarea UI", operator.includes("<textarea") && operator.includes("readonly"));
assert("preview container", operator.includes("gosaki-about-admin-preview") && operator.includes("set:html"));
assert("read-only notice", operator.includes("read-only preview"));
assert("Save not implemented note", operator.includes("保存") && operator.includes("未実装"));
assert("save button disabled", operator.includes("data-gosaki-about-save-disabled") && operator.includes("disabled"));
assert("wire readonly ui", ui.includes("wireReadOnlyUi"));

assert("no write API route added", !exists("src/pages/__admin-staging-shell/musician-basic/api/about-html-content-static-json-write.json.ts"));
assert("no about write api in pages", !route.includes("about-html-content-static-json-write"));
assert("operator no fetch save", !operator.includes("fetch(") || !operator.includes("static-json-write"));

assert("admin Save not implemented doc", doc.includes("staticJsonWriteImplemented: false"));
assert("write API not implemented doc", doc.includes("writeApiImplemented: false"));
assert("JSON write not executed", doc.includes("cursorJsonWriteExecuted: false"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));

assert("home menu link", read("tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro").includes("GOSAKI_STAGING_ADMIN_ABOUT_PATH"));
assert("00-current-state G-10h3", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h3"));

const adminProdDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminProdDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
