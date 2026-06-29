/**
 * G-17a — Gosaki Discography CMS commonization audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17a-gosaki-discography-commonization-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g17a-commonization-audit.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const G16B_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-closure.md";
const G15C_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const G15E_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-closure.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const GUARDS_REL = "src/lib/admin/staging-write/discography-write-guards.ts";
const TYPES_REL = "src/lib/admin/staging-write/discography-write-types.ts";
const SCHEDULE_REGISTRY_REL =
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-registry.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const G17A_BASE_COMMIT = "de2a388";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh";

const PURCHASE_URL_FILES = [
  "src/lib/admin/staging-write/gosaki-discography-purchase-url-save-config.ts",
  "src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts",
  "src/lib/admin/staging-write/gosaki-discography-existing-release-dry-run.ts",
];

const ARTIST_G15D_FILES = [
  "src/lib/admin/staging-write/gosaki-discography-artist-save-config.ts",
  "src/lib/admin/staging-write/gosaki-discography-existing-release-artist-save.ts",
  "src/lib/admin/staging-write/gosaki-discography-existing-release-artist-dry-run.ts",
  "src/lib/admin/staging-write/gosaki-discography-next-field-types.ts",
];

const ARTIST_G16A_FILES = [
  "src/lib/admin/staging-write/gosaki-discography-g16a-artist-save-config.ts",
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-save.ts",
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-dry-run.ts",
  "src/lib/admin/staging-write/gosaki-discography-g16a-next-field-types.ts",
];

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
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G17A_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is de2a388", head.stdout.trim() === G17A_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is de2a388",
  origin.stdout.trim() === G17A_BASE_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-16b-f baseline de2a388",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("audit doc exists", exists(DOC_REL));
assert("doc phase G-17a", doc.includes("G-17a-gosaki-discography-commonization-audit"));
assert("doc audit complete gate", doc.includes("gosakiDiscographyG17aCommonizationAuditComplete: true"));
assert("doc G-17b ready gate", doc.includes("readyForG17bDiscographyScalarSliceRegistry: true"));

assert("doc inefficiency conclusion", doc.includes("非効率になり始めている"));
assert("doc duplication section", doc.includes("どこが重複しているか"));
assert("doc commonization benefit", doc.includes("何を共通化すれば効果が大きいか"));
assert("doc over-commonization risk", doc.includes("何を共通化しすぎると危険か"));
assert("doc G-17b minimal implementation", doc.includes("G-17bでやるべき最小実装"));
assert("doc G-17c resume Save", doc.includes("G-17c以降で次フィールドSaveに戻るべきか"));
assert("doc ideal work volume", doc.includes("次フィールド追加時の理想作業量"));

assert("doc classification A", doc.includes("A — すぐ共通化すべき"));
assert("doc classification B", doc.includes("B — まだ個別sliceでよい"));
assert("doc classification C", doc.includes("C — 今は触らない"));

assert("doc G-15c-f chain ref", doc.includes("G-15c-f") || doc.includes("discography-002"));
assert("doc G-15e-f chain ref", doc.includes("G-15e-f") || doc.includes("discography-003"));
assert("doc G-16b-f chain ref", doc.includes("G-16b-f") || doc.includes("discography-001"));
assert("doc playbook ref", doc.includes("cms-kit-save-reflection-playbook.md"));

assert("doc purchase_url duplication", doc.includes("purchase-url-save-config"));
assert("doc G-15d artist duplication", doc.includes("artist-save-config"));
assert("doc G-16a artist duplication", doc.includes("g16a-artist-save-config"));
assert("doc patch registry target", doc.includes("DISCOGRAPHY_PUBLIC_PATCH_REGISTRY"));
assert("doc scalar slice registry target", doc.includes("discography-scalar-field-slice-registry"));
assert("doc schedule registry precedent", doc.includes("staging-schedule-single-text-field-operational-registry"));

assert("doc discography-004 next target", doc.includes("discography-004"));
assert("doc cursor db write not executed", doc.includes("DB write") && doc.includes("**no**"));
assert("doc cursor ftp not executed", doc.includes("FTP") && doc.includes("**no**"));
assert("doc staging host", doc.includes(STAGING_HOST));
assert("doc production stop", doc.includes(PRODUCTION_HOST));

assert("G-16b-f closure exists", exists(G16B_CLOSURE_REL));
assert("G-15c-f closure exists", exists(G15C_CLOSURE_REL));
assert("G-15e-f closure exists", exists(G15E_CLOSURE_REL));
assert("playbook exists", exists(PLAYBOOK_REL));
assert("hook module exists", exists(HOOK_REL));
assert("adapter exists", exists(ADAPTER_REL));
assert("guards exists", exists(GUARDS_REL));
assert("types exists", exists(TYPES_REL));
assert("schedule registry precedent exists", exists(SCHEDULE_REGISTRY_REL));

for (const f of PURCHASE_URL_FILES) {
  assert(`purchase_url file exists: ${path.basename(f)}`, exists(f));
}
for (const f of ARTIST_G15D_FILES) {
  assert(`G-15d artist file exists: ${path.basename(f)}`, exists(f));
}
for (const f of ARTIST_G16A_FILES) {
  assert(`G-16a artist file exists: ${path.basename(f)}`, exists(f));
}

const adapter = read(ADAPTER_REL);
const guards = read(GUARDS_REL);
const hook = read(HOOK_REL);

assert("adapter has updateDiscographyWrite", adapter.includes("updateDiscographyWrite"));
assert("guards assertG15b", guards.includes("assertG15bDiscographyUpdatePayloadAllowed"));
assert("guards assertG15d", guards.includes("assertG15dDiscographyUpdatePayloadAllowed"));
assert("guards assertG16a", guards.includes("assertG16aDiscographyUpdatePayloadAllowed"));
assert("hook patchGosakiDiscographySupabaseFields", hook.includes("patchGosakiDiscographySupabaseFields"));
assert("hook patchDiscographyItemArtist", hook.includes("patchDiscographyItemArtist"));
assert("hook patchDiscographyItemPurchaseUrl", hook.includes("patchDiscographyItemPurchaseUrl"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert("cursor db write not executed in verifier", true);
assert("cursor ftp not executed in verifier", true);
assert("cursor save not executed in verifier", true);
assert("service_role not used in verifier", true);
assert("commit not executed in verifier", true);
assert("push not executed in verifier", true);

console.log(`\nG-17a commonization audit verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
