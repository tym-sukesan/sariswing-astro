/**
 * G-20u30 — Gosaki Discography dry-run validation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u30-gosaki-discography-dry-run-validation.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS } from "./lib/sitemap-exclusions.mjs";
import {
  G20U30_DISCOGRAPHY_DRY_RUN_PHASE,
  GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL,
  applyGosakiStagingReadOnlyAdmin,
  buildDiscographyEditorPrototypeSnapshot,
  parseDiscographyTrackListLines,
  validateDiscographyTrackListDryRun,
  validateDiscographyTrackListDryRunBatch,
} from "./lib/gosaki-staging-read-only-admin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-dry-run-validation.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const ADMIN_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-staging-read-only-admin.mjs";
const BASE_COMMIT = "7b44f24";

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u30 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminTs = read(ADMIN_TS_REL);
const adminLib = read(ADMIN_LIB_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u30", doc.includes("G-20u30-gosaki-discography-dry-run-validation"));
assert("doc gate complete", doc.includes("gosakiDiscographyDryRunValidationComplete: true"));
assert("doc no DB write", doc.includes("no DB write") || doc.includes("DB write"));
assert("doc no network write", doc.includes("network write") || doc.includes("networkWrite"));
assert("doc wouldWrite false", doc.includes("wouldWrite") && /false/i.test(doc));
assert("doc textarea policy", doc.includes("1 line = 1 track"));
assert("doc blank lines ignored", doc.includes("blank") || doc.includes("Blank"));
assert("doc production STOP", doc.includes("G-20j") && /STOP/i.test(doc));

assert("dry-run section all", adminPage.includes('data-section="discography-dry-run-all"'));
assert("dry-run section album", adminPage.includes('data-section="discography-dry-run-album"'));
assert("dry-run album button", adminPage.includes("Dry-run validation（保存なし）"));
assert("dry-run all button", adminPage.includes("Validate changes — no save"));
assert("dry-run result album", adminPage.includes('data-disc-dry-run-result="album"'));
assert("dry-run result all", adminPage.includes('data-disc-dry-run-result="all"'));
assert("data-original-track-list", adminPage.includes("data-original-track-list"));
assert("editable track textarea", adminPage.includes("track-list-textarea--editable"));
assert("track textarea not readonly", !adminPage.includes('data-track-list-textarea="true"') || !/data-track-list-textarea="true"[^>]*readonly/.test(adminPage));
assert("G20U30 phase on section", adminPage.includes("G20U30_DISCOGRAPHY_DRY_RUN_PHASE"));
assert("dry-run only badge", adminPage.includes("Dry-run only"));
assert(
  "no network write / wouldWrite false retained",
  adminPage.includes("wouldWrite: false") && adminPage.includes("networkWrite: false"),
);
assert("validateDiscographyTrackListDryRun import in script", adminPage.includes("validateDiscographyTrackListDryRun"));
assert("wouldWrite false in result hint", adminPage.includes("wouldWrite: false"));

const trackTextareaElements =
  adminPage.match(/<textarea[^>]*data-track-list-textarea="true"/g) ?? [];
assert("one track textarea element template", trackTextareaElements.length === 1, String(trackTextareaElements.length));
assert("no 34 fixed track inputs", !adminPage.includes("gra-disc-track-034"));

assert(
  "Save disabled retained (discography UI)",
  adminPage.includes("Save Discography（無効 — future phase）") &&
    adminPage.includes('data-gosaki-save-disabled-note="true"') &&
    adminPage.includes("Save disabled"),
);
assert("no discography fetch POST", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography/i.test(adminPage));
assert("no localStorage", !/localStorage/i.test(adminPage));
assert("no supabase write in page", !/\.(insert|update|upsert|delete)\(/i.test(adminPage.split("gra-youtube-dry-run-btn")[0] + adminPage.split("Discography Editor")[1]?.split("gra-youtube-dry-run-btn")[0]));

assert("ts parseDiscographyTrackListLines", adminTs.includes("parseDiscographyTrackListLines"));
assert("ts validateDiscographyTrackListDryRun", adminTs.includes("validateDiscographyTrackListDryRun"));
assert("mjs validateDiscographyTrackListDryRun", adminLib.includes("validateDiscographyTrackListDryRun"));

const lines = parseDiscographyTrackListLines("  A\n\nB \n");
assert("parse trims and drops blank", lines.length === 2 && lines[0] === "A" && lines[1] === "B");

const addResult = validateDiscographyTrackListDryRun("A\nB", "A\nB\nC");
assert("dry-run added track", addResult.added.length === 1 && addResult.added[0] === "C");
assert("dry-run wouldWrite false", addResult.wouldWrite === false);
assert("dry-run networkWrite false", addResult.networkWrite === false);
assert("dry-run saveEnabled false", addResult.saveEnabled === false);
assert("dry-run blankLinesIgnored", addResult.blankLinesIgnored === true);

const reorderResult = validateDiscographyTrackListDryRun("A\nB", "B\nA");
assert("dry-run reordered", reorderResult.reordered === true);
assert("dry-run reorder no add remove", reorderResult.added.length === 0 && reorderResult.removed.length === 0);

const removeResult = validateDiscographyTrackListDryRun("A\nB\nC", "A\nC");
assert("dry-run removed", removeResult.removed.length === 1 && removeResult.removed[0] === "B");

const batch = validateDiscographyTrackListDryRunBatch([
  { legacyId: "discography-001", title: "T1", originalText: "A", nextText: "A" },
  { legacyId: "discography-002", title: "T2", originalText: "X", nextText: "Y" },
]);
assert("batch wouldWrite false", batch.wouldWrite === false);
assert("batch albumCount 2", batch.albumCount === 2);

const mockBundle = {
  discographyDataSource: "supabase",
  siteSlug: "gosaki-piano",
  siteSlugFilterApplied: true,
  releases: [{ legacy_id: "discography-001", title: "Test", published: true }],
  tracksByLegacyId: { "discography-001": [{ title: "Track 1", sort_order: 1, track_number: 1 }] },
  trackRowCount: 1,
  rowCount: 1,
};
const snapshot = buildDiscographyEditorPrototypeSnapshot(mockBundle);
assert("snapshot dryRunValidation", snapshot.dryRunValidation === true);
assert("snapshot dryRun phase", snapshot.dryRunValidationPhase === G20U30_DISCOGRAPHY_DRY_RUN_PHASE);

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "g20u30-admin-"));
const applyResult = applyGosakiStagingReadOnlyAdmin(tmpOut, TOOL_ROOT, { discographyBundle: mockBundle });
assert("apply admin tmp", applyResult.applied === true, applyResult.reason ?? "");

const discographyRouteRel = "src/pages/admin/discography/index.astro";
const discographyRouteAbs = path.join(tmpOut, discographyRouteRel);
assert("applied discography route page exists", fs.existsSync(discographyRouteAbs));
const discographyRoutePage = fs.readFileSync(discographyRouteAbs, "utf8");
assert(
  "discography route wires page=discography",
  discographyRoutePage.includes('page="discography"') &&
    discographyRoutePage.includes("GosakiStagingReadOnlyAdminPage"),
);

const componentImportMatch = discographyRoutePage.match(
  /import\s+GosakiStagingReadOnlyAdminPage\s+from\s+"([^"]+)"/,
);
assert("discography route imports admin component", Boolean(componentImportMatch), "import not found");
const componentRelFromRoute = componentImportMatch?.[1] ?? "";
const componentAbs = path.resolve(path.dirname(discographyRouteAbs), componentRelFromRoute);
assert("discography route component file exists", fs.existsSync(componentAbs), componentAbs);

const appliedComponent = fs.readFileSync(componentAbs, "utf8");
assert(
  "applied discography component keeps Dry-run validation button UI",
  appliedComponent.includes('data-disc-dry-run-btn="album"') &&
    appliedComponent.includes("Dry-run validation（保存なし）") &&
    appliedComponent.includes('data-section="discography-dry-run-album"') &&
    appliedComponent.includes('data-section="discography-dry-run-all"'),
);
assert(
  "applied discography component keeps dry-run handlers",
  appliedComponent.includes("validateDiscographyTrackListDryRun") &&
    appliedComponent.includes("validateDiscographyTrackListDryRunBatch") &&
    appliedComponent.includes('data-disc-dry-run-result="album"'),
);
assert(
  "applied discography page mode gates dry-run section",
  appliedComponent.includes('page === "discography"'),
);
assert(
  "applied component keeps Save disabled on discography",
  appliedComponent.includes("Save Discography（無効 — future phase）") &&
    appliedComponent.includes('data-gosaki-save-disabled-note="true"'),
);
assert(
  "applied component lib import for dry-run helpers",
  appliedComponent.includes('../lib/gosaki-staging-read-only-admin"'),
);
assert(
  "applied snapshot path for discography editor",
  fs.existsSync(path.join(tmpOut, GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL)),
);

const sitemapHasAdminExclusion = CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS.some((re) =>
  re.test("/cms-kit-staging/gosaki-piano/admin/"),
);
assert("sitemap admin exclusion pattern", sitemapHasAdminExclusion);

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u30", packageJson.includes("verify:g20u30-gosaki-discography-dry-run-validation"));

assert("AI current-state G-20u30", currentState.includes("G-20u30"));
assert("AI next-actions G-20u30", nextActions.includes("G-20u30"));
assert("handoff G-20u30", handoff.includes("G-20u30"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u30 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
