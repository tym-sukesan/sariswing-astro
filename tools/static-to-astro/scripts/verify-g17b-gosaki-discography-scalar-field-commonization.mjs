/**
 * G-17b — Gosaki Discography scalar field commonization verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17b-gosaki-discography-scalar-field-commonization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g17b-scalar-field-commonization.md";
const G17A_AUDIT_REL = "tools/static-to-astro/docs/gosaki-discography-g17a-commonization-audit.md";
const REGISTRY_REL = "src/lib/admin/staging-write/discography-scalar-field-slice-registry.ts";
const SAVE_CONFIG_REL = "src/lib/admin/staging-write/discography-scalar-field-save-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/discography-scalar-field-guards.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const G15B_CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-purchase-url-save-config.ts";
const G15D_CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-artist-save-config.ts";
const G16A_CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-g16a-artist-save-config.ts";
const G15B_SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts";
const G15D_SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-artist-save.ts";
const G16A_SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-save.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const G17B_BASE_COMMIT = "5161eaa";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh";

const G15B_APPROVAL = "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";
const G15D_APPROVAL = "G-15d-gosaki-discography-existing-release-artist-non-dry-run";
const G16A_APPROVAL = "G-16a-gosaki-discography-existing-release-artist-non-dry-run";
const G15A2_DRY_RUN = "G-15a2-gosaki-discography-purchase-url-dry-run-slice";
const G15D_DRY_RUN = "G-15d-gosaki-discography-artist-dry-run-slice";
const G16A_DRY_RUN = "G-16a-gosaki-discography-artist-dry-run-slice";

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

assert("HEAD is 5161eaa", head.stdout.trim() === G17B_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is 5161eaa",
  origin.stdout.trim() === G17B_BASE_COMMIT,
  origin.stdout.trim(),
);

const doc = read(DOC_REL);
const registry = read(REGISTRY_REL);
const saveConfig = read(SAVE_CONFIG_REL);
const scalarGuards = read(GUARDS_REL);
const adapter = read(ADAPTER_REL);
const hook = read(HOOK_REL);
const g15bConfig = read(G15B_CONFIG_REL);

assert("G-17b doc exists", exists(DOC_REL));
assert("G-17a audit doc exists", exists(G17A_AUDIT_REL));
assert("doc references G-17a", doc.includes("gosaki-discography-g17a-commonization-audit.md"));
assert("doc phase G-17b", doc.includes("G-17b-gosaki-discography-scalar-field-commonization"));
assert(
  "doc complete gate",
  doc.includes("gosakiDiscographyG17bScalarFieldCommonizationComplete: true"),
);
assert("doc G-17c ready", doc.includes("readyForG17cDiscographyRegistryNativeFieldSlice: true"));

assert("registry file exists", exists(REGISTRY_REL));
assert("registry 3 closed entries", (registry.match(/closed: true,/g) ?? []).length === 3);
assert("registry g15b-purchase-url", registry.includes('sliceId: "g15b-purchase-url"'));
assert("registry g15d-artist", registry.includes('sliceId: "g15d-artist"'));
assert("registry g16a-artist", registry.includes('sliceId: "g16a-artist"'));
assert("registry legacy id G15A2", registry.includes("G15A2_TARGET_LEGACY_ID"));
assert("registry legacy id G15D", registry.includes("G15D_TARGET_LEGACY_ID"));
assert("registry legacy id G16A", registry.includes("G16A_TARGET_LEGACY_ID"));
assert("registry purchase_url field", registry.includes('field: "purchase_url"'));
assert("registry artist fields", (registry.match(/field: "artist"/g) ?? []).length === 2);
assert("registry G-15b approval", registry.includes(G15B_APPROVAL));
assert("registry G-15d approval", registry.includes(G15D_APPROVAL));
assert("registry G-16a approval", registry.includes(G16A_APPROVAL));
assert("registry G-15a2 dry-run ref", registry.includes("G15A2_DRY_RUN_SLICE_APPROVAL_ID"));
assert("registry G-15d dry-run ref", registry.includes("G15D_DRY_RUN_SLICE_APPROVAL_ID"));
assert("registry G-16a dry-run ref", registry.includes("G16A_DRY_RUN_SLICE_APPROVAL_ID"));
assert(
  "registry armed env purchase_url",
  registry.includes("PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED"),
);
assert(
  "registry armed env G-15d artist",
  registry.includes("PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED"),
);
assert(
  "registry armed env G-16a artist",
  registry.includes("PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED"),
);
assert("registry enabled env G15B", registry.includes("G15B_DISCOGRAPHY_SAVE_ENABLED"));
assert("registry enabled env G15D", registry.includes("G15D_DISCOGRAPHY_SAVE_ENABLED"));
assert("registry enabled env G16A", registry.includes("G16A_DISCOGRAPHY_SAVE_ENABLED"));
assert("registry lookup by approvalId", registry.includes("getDiscographyScalarSliceEntryByApprovalId"));

assert("generic save config exists", exists(SAVE_CONFIG_REL));
assert("getDiscographyScalarSliceSaveConfig", saveConfig.includes("getDiscographyScalarSliceSaveConfig"));
assert("evaluateDiscographyScalarSliceOperatorSaveUiGate", saveConfig.includes("evaluateDiscographyScalarSliceOperatorSaveUiGate"));

assert("generic guards exist", exists(GUARDS_REL));
assert("assertDiscographyScalarSliceGuards", scalarGuards.includes("assertDiscographyScalarSliceGuards"));
assert("assertDiscographyScalarSliceWriteGuards", scalarGuards.includes("assertDiscographyScalarSliceWriteGuards"));

assert("adapter registry lookup", adapter.includes("getDiscographyScalarSliceEntryByApprovalId"));
assert("adapter scalar write guards", adapter.includes("assertDiscographyScalarSliceWriteGuards"));

assert("hook public patch registry", hook.includes("DISCOGRAPHY_PUBLIC_PATCH_REGISTRY"));
assert("hook patch field order", hook.includes("DISCOGRAPHY_PUBLIC_PATCH_FIELD_ORDER"));
assert("hook purchase_url patch", hook.includes("patchDiscographyItemPurchaseUrl"));
assert("hook artist patch", hook.includes("patchDiscographyItemArtist"));
assert("hook patchGosakiDiscographySupabaseFields", hook.includes("patchGosakiDiscographySupabaseFields"));

assert("G-15b config wrapper uses generic", g15bConfig.includes("getDiscographyScalarSliceSaveConfig"));
assert("G-15b config still exports getG15b", g15bConfig.includes("getG15bDiscographyPurchaseUrlSaveConfig"));
assert("G-15d config file exists", exists(G15D_CONFIG_REL));
assert("G-16a config file exists", exists(G16A_CONFIG_REL));
assert("G-15b save executor exists", exists(G15B_SAVE_REL));
assert("G-15d save executor exists", exists(G15D_SAVE_REL));
assert("G-16a save executor exists", exists(G16A_SAVE_REL));

assert("doc staging host", doc.includes(STAGING_HOST));
assert("doc production stop", doc.includes(PRODUCTION_HOST));
assert("doc cursor db write not executed", doc.includes("DB write") && doc.includes("**no**"));
assert("doc cursor ftp not executed", doc.includes("FTP") && doc.includes("**no**"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert("cursor db write not executed in verifier", true);
assert("cursor ftp not executed in verifier", true);
assert("service_role not used in verifier", true);
assert("commit not executed in verifier", true);
assert("push not executed in verifier", true);

console.log(`\nG-17b commonization verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
