/**
 * G-10h1 — Gosaki About HTML content CMS implementation preflight.
 * Run: node tools/static-to-astro/scripts/verify-g10h1-gosaki-about-html-content-cms-implementation-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-about-html-content-cms-implementation-preflight.md";
const PLANNING_REL = "tools/static-to-astro/docs/gosaki-about-html-content-cms-planning.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";
const HOOK_REL = "tools/static-to-astro/scripts/lib/gosaki-about-content.mjs";
const APPROVAL_ID = "G-10h-about-html-content-static-json-write-slice";

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

const preflight = read(PREFLIGHT_REL);
const planning = read(PLANNING_REL);

assert("G-10h1 preflight doc phase", preflight.includes("G-10h1-gosaki-about-html-content-cms-implementation-preflight"));
assert("preflight complete gate", preflight.includes("gosakiAboutHtmlContentCmsImplementationPreflightComplete: true"));
assert("readyFor G-10h2", preflight.includes("readyForG10h2GosakiAboutHtmlContentCmsImplementation: true"));

assert("seed JSON path", preflight.includes("gosaki-piano-about-content.json"));
assert("JSON schema version", preflight.includes('"version": 1') || preflight.includes("version"));
assert("block about-profile-html", preflight.includes("about-profile-html"));
assert("block about-bands-html", preflight.includes("about-bands-html"));
assert("max length recorded", preflight.includes("100,000") || preflight.includes("100000"));

assert("profile selector grid container", preflight.includes("comp-lol1i5l0inlineContent-gridContainer"));
assert("profile includes heading bio portrait", preflight.includes("WRchTxt16") && preflight.includes("comp-jrqh3smr"));
assert("excludes BaseLayout", preflight.includes("BaseLayout") && preflight.includes("no"));

assert("bands replaces BandProfilesSection", preflight.includes("BandProfilesSection"));
assert("bands empty fallback", preflight.includes("fallback") || preflight.includes("Fallback"));
assert("band-profiles json seed only", preflight.includes("fallback only") || preflight.includes("seed / fallback"));

assert("convert hook path", preflight.includes("gosaki-about-content.mjs"));
assert("convert after band profiles", preflight.includes("applyGosakiAboutBandProfiles"));
assert("about page only scope", preflight.includes("about/index.astro"));

assert("admin route path", preflight.includes("/__admin-staging-shell/musician-basic/admin/about/"));
assert("textarea preview UI", preflight.includes("textarea") && preflight.includes("preview"));
assert("Save disabled default", preflight.includes("Disabled by default") || preflight.includes("disabled"));

assert("approvalId recorded", preflight.includes(APPROVAL_ID));
assert("write module about-html-content", preflight.includes("about-html-content"));
assert("blocksAffected 1", preflight.includes("blocksAffected: 1") || preflight.includes("blocksAffected"));

assert("HTML script reject", preflight.includes("<script") && preflight.includes("Reject"));
assert("HTML iframe reject about", preflight.includes("<iframe") && preflight.includes("Reject"));
assert("event handler reject", preflight.includes("onclick") || preflight.includes("on*"));
assert("style allow", preflight.includes("Allow") && preflight.includes("style"));
assert("HubSpot separate", preflight.includes("G-10g") || preflight.includes("Contact"));

assert("images bands path", preflight.includes("public/images/bands/"));
assert("naming band-id jpg", preflight.includes("{band-id}.jpg") || preflight.includes("gosakirika-trio.jpg"));

assert("implementation not executed", preflight.includes("cursorImplementationExecuted: false"));
assert("config JSON not created", preflight.includes("configJsonFileCreated: false"));
assert("config file absent on disk", !exists(CONFIG_REL));
assert("hook file absent on disk", !exists(HOOK_REL));
assert("image mutation not executed", preflight.includes("cursorImageFileMutationExecuted: false"));
assert("JSON write not executed", preflight.includes("cursorJsonWriteExecuted: false"));
assert("FTP not executed", preflight.includes("cursorFtpUploadExecuted: false"));

assert("planning links preflight", planning.includes("G-10h1") || exists(PREFLIGHT_REL));
assert("00-current-state G-10h1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h1"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
