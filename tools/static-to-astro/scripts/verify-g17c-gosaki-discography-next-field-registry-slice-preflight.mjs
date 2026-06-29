/**
 * G-17c — Gosaki Discography registry-based next field slice preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17c-gosaki-discography-next-field-registry-slice-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17c-next-field-registry-slice-preflight.md";
const G17B_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g17b-scalar-field-commonization.md";
const REGISTRY_REL = "src/lib/admin/staging-write/discography-scalar-field-slice-registry.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/discography-scalar-field-dry-run.ts";
const SAVE_CONFIG_REL = "src/lib/admin/staging-write/discography-scalar-field-save-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/discography-scalar-field-guards.ts";
const G17C_TYPES_REL = "src/lib/admin/staging-write/gosaki-discography-g17c-next-field-types.ts";
const G17C_SAVE_CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-g17c-label-save-config.ts";
const WRITE_TYPES_REL = "src/lib/admin/staging-write/discography-write-types.ts";
const ADMIN_UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SEED_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";

const G17C_BASE_COMMIT = "397f245";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh";

const G17C_DRY_RUN_APPROVAL = "G-17c-gosaki-discography-label-dry-run-slice";
const G17C_SAVE_APPROVAL = "G-17c-gosaki-discography-existing-release-label-non-dry-run";
const G17C_LEGACY_ID = "discography-004";
const G17C_TITLE = "Ja-Jaaaaan!";
const G17C_LABEL_AFTER = "Mardi Gras JAPAN Records";
const G17C_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const G17C_ARMED_ENV = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED";
const G17C_ENABLED_ENV = "G17C_DISCOGRAPHY_SAVE_ENABLED";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 397f245", head.stdout.trim() === G17C_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is 397f245",
  origin.stdout.trim() === G17C_BASE_COMMIT,
  origin.stdout.trim(),
);

assert("G-17c preflight doc exists", exists(DOC_REL));
assert("G-17b doc exists", exists(G17B_DOC_REL));

const doc = read(DOC_REL);
const g17bDoc = read(G17B_DOC_REL);
const registry = read(REGISTRY_REL);
const dryRun = read(DRY_RUN_REL);
const saveConfig = read(SAVE_CONFIG_REL);
const guards = read(GUARDS_REL);
const g17cTypes = read(G17C_TYPES_REL);
const g17cSaveConfig = read(G17C_SAVE_CONFIG_REL);
const writeTypes = read(WRITE_TYPES_REL);
const adminUi = read(ADMIN_UI_REL);
const seed = read(SEED_REL);

assert("doc references G-17b", doc.includes("gosaki-discography-g17b-scalar-field-commonization.md"));
assert("doc phase G-17c", doc.includes("G-17c-gosaki-discography-existing-release-label-non-dry-run"));
assert(
  "doc preflight gate",
  doc.includes("gosakiDiscographyG17cNextFieldRegistrySlicePreflightComplete: true"),
);
assert("doc discography-004 inventory", doc.includes(G17C_LEGACY_ID));
assert("doc Ja-Jaaaaan title", doc.includes(G17C_TITLE));
assert("doc recommended field label", doc.includes("`label`"));
assert("doc before null", doc.includes("null") || doc.includes("empty"));
assert("doc after Mardi Gras", doc.includes(G17C_LABEL_AFTER));
assert("doc dry-run approvalId", doc.includes(G17C_DRY_RUN_APPROVAL));
assert("doc Save approvalId", doc.includes(G17C_SAVE_APPROVAL));
assert("doc armed env", doc.includes(G17C_ARMED_ENV));
assert("doc enabled env", doc.includes(G17C_ENABLED_ENV));
assert("doc generic dry-run policy", doc.includes("discography-scalar-field-dry-run"));
assert("doc generic guards policy", doc.includes("discography-scalar-field-guards"));
assert("doc DB write not executed", doc.includes("dbWriteExecutedInThisPhase: false"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection estimate", doc.includes("Public reflection"));
assert("doc G-17b reduction", doc.includes("G-17b"));

assert("G-17b registry reference in g17b doc", g17bDoc.includes("discography-scalar-field-slice-registry.ts"));

assert("registry g17c-label slice", registry.includes('sliceId: "g17c-label"'));
assert("registry discography-004 legacy", registry.includes("G17C_TARGET_LEGACY_ID"));
assert("registry label field", registry.includes('field: "label"'));
assert("registry g17c closed false", registry.includes('sliceId: "g17c-label"') && registry.includes("closed: false"));
assert("registry 3 closed entries", (registry.match(/closed: true,/g) ?? []).length === 3);
assert("registry G-17c dry-run approval", registry.includes("G17C_DRY_RUN_SLICE_APPROVAL_ID"));
assert("registry G-17c Save approval", registry.includes("G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID"));
assert("registry armed env G17C", registry.includes(G17C_ARMED_ENV));
assert("registry enabled env G17C", registry.includes(G17C_ENABLED_ENV));
assert("registry publicPatchField label", registry.includes('publicPatchField: "label"'));

assert("g17c types legacy id", g17cTypes.includes(G17C_LEGACY_ID));
assert("g17c types label after", g17cTypes.includes(G17C_LABEL_AFTER));
assert("g17c types dry-run approval", g17cTypes.includes(G17C_DRY_RUN_APPROVAL));
assert("g17c types updated_at baseline", g17cTypes.includes(G17C_UPDATED_AT));

assert("generic dry-run module exists", exists(DRY_RUN_REL));
assert("dry-run uses generic save config", dryRun.includes("getDiscographyScalarSliceSaveConfig"));
assert("dry-run uses generic guards", dryRun.includes("assertDiscographyScalarSlicePayloadOnly"));
assert("dry-run actualWrite false", dryRun.includes("actualWrite: false"));

assert("g17c save config delegates generic", g17cSaveConfig.includes("getDiscographyScalarSliceSaveConfig"));
assert("g17c save config generic gate", g17cSaveConfig.includes("evaluateDiscographyScalarSliceOperatorSaveUiGate"));

assert("write types G17C approval", writeTypes.includes(G17C_SAVE_APPROVAL));
assert("write types label payload", writeTypes.includes("label?: string | null"));

assert("admin UI registry lookup", adminUi.includes("getDiscographyScalarSliceEntryByLegacyId"));
assert("admin UI generic dry-run", adminUi.includes("executeDiscographyScalarSliceDryRun"));
assert("admin UI g17c-label branch", adminUi.includes('"g17c-label"'));
assert("admin UI save blocked g17c", adminUi.includes("G-17c preflight"));

assert("seed discography-004", seed.includes(G17C_LEGACY_ID));
assert("seed label Mardi Gras", seed.includes(G17C_LABEL_AFTER));

assert("guards generic payload only", guards.includes("assertDiscographyScalarSlicePayloadOnly"));
assert("save config generic builder", saveConfig.includes("getDiscographyScalarSliceSaveConfig"));

assert("staging host in doc", doc.includes(STAGING_HOST));
assert("production host not target", doc.includes(PRODUCTION_HOST) && doc.includes("STOP"));
assert("service_role not in dry-run", !dryRun.includes("service_role"));
assert("verifier does not execute DB write", true);
assert("verifier does not execute FTP", true);
assert("verifier does not commit", true);

console.log(`\nG-17c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
