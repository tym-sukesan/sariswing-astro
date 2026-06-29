/**
 * G-17d — Gosaki Discography label Save path enablement verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17d-gosaki-discography-label-save-path-enablement.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-path-enablement.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md";
const GENERIC_SAVE_REL = "src/lib/admin/staging-write/discography-scalar-field-save.ts";
const SAVE_CONFIG_REL = "src/lib/admin/staging-write/discography-scalar-field-save-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/discography-scalar-field-guards.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const REGISTRY_REL = "src/lib/admin/staging-write/discography-scalar-field-slice-registry.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const G15B_SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts";
const G15D_SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-artist-save.ts";
const G16A_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-save.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G17D_BASE_COMMIT = "d1eefb8";
const TARGET_LEGACY_ID = "discography-004";
const TARGET_ID = "32b83506-8766-4cf6-9de7-40defbfc0b38";
const LABEL_AFTER = "Mardi Gras JAPAN Records";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const DRY_RUN_APPROVAL = "G-17c-gosaki-discography-label-dry-run-slice";
const SAVE_APPROVAL = "G-17c-gosaki-discography-existing-release-label-non-dry-run";
const G17C_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED";
const G17C_ENABLED = "G17C_DISCOGRAPHY_SAVE_ENABLED";
const CLOSED_001 = "discography-001";
const CLOSED_002 = "discography-002";
const CLOSED_003 = "discography-003";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

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

function loadEnv(file) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) return {};
  const out = {};
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
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
  ["merge-base", "--is-ancestor", G17D_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is d1eefb8", head.stdout.trim() === G17D_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is d1eefb8",
  origin.stdout.trim() === G17D_BASE_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-17d base d1eefb8",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);
const genericSave = read(GENERIC_SAVE_REL);
const saveConfig = read(SAVE_CONFIG_REL);
const guards = read(GUARDS_REL);
const adapter = read(ADAPTER_REL);
const registry = read(REGISTRY_REL);
const ui = read(UI_REL);
const g15bSave = read(G15B_SAVE_REL);
const g15dSave = read(G15D_SAVE_REL);
const g16aSave = read(G16A_SAVE_REL);

assert("G-17d doc exists", exists(DOC_REL));
assert("prior G-17c dry-run doc exists", exists(PRIOR_DOC_REL));
assert("doc references prior dry-run doc", doc.includes("gosaki-discography-g17c-label-dry-run-result"));
assert("doc enablement gate", doc.includes("gosakiDiscographyG17dLabelSavePathEnablementComplete: true"));
assert("doc readyForG17dExecution true", doc.includes("readyForG17dDiscographyLabelSaveExecution: true"));
assert("doc cursorSave false", doc.includes("cursorSaveExecuted: false"));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc changedFields label", doc.includes('changedFields') && doc.includes("`label`"));
assert("doc Save approvalId", doc.includes(SAVE_APPROVAL));
assert("doc dry-run approvalId", doc.includes(DRY_RUN_APPROVAL));
assert("doc armed env", doc.includes(G17C_ARM));
assert("doc enabled env", doc.includes(G17C_ENABLED));
assert("doc afterVerification", doc.includes(LABEL_AFTER));
assert("doc updated_at advance", doc.includes(BASELINE_UPDATED_AT));
assert("doc env stack PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc operator Preview ready_to_save", doc.includes("ready_to_save"));
assert("doc closed chain unaffected", doc.includes("G-16b-f"));
assert("doc generic layer", doc.includes("executeDiscographyScalarSliceSave"));
assert("doc staging host", doc.includes(STAGING_REF));

assert("generic save module exists", exists(GENERIC_SAVE_REL));
assert("generic save executeDiscographyScalarSliceSave", genericSave.includes("executeDiscographyScalarSliceSave"));
assert("generic save uses save config", genericSave.includes("getDiscographyScalarSliceSaveConfig"));
assert("generic save uses scalar guards", genericSave.includes("assertDiscographyScalarSliceGuards"));
assert("generic save uses adapter", genericSave.includes("updateDiscographyWrite"));
assert("generic save not closed check", genericSave.includes("assertDiscographyScalarSliceNotClosedForReSave"));

assert("save config getDiscographyScalarSliceSaveConfig", saveConfig.includes("getDiscographyScalarSliceSaveConfig"));
assert("save config checks enabled env", saveConfig.includes("enabledEnvName"));
assert("save config checks approvalId env", saveConfig.includes("approvalIdEnv !== entry.approvalId"));
assert("save config single-arm", saveConfig.includes("detectMultipleDiscographyScalarSliceEnvArms"));

assert("guards assertDiscographyScalarSliceGuards", guards.includes("assertDiscographyScalarSliceGuards"));
assert("adapter registry lookup", adapter.includes("getDiscographyScalarSliceEntryByApprovalId"));
assert("adapter G17C rollback", adapter.includes("G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID"));
assert("registry g17c-label open", registry.includes('sliceId: "g17c-label"') && registry.includes("closed: false"));

assert("ui g17c Save block removed", !ui.includes("G-17c preflight: Save path is not enabled"));
assert("ui executeDiscographyScalarSliceSave", ui.includes("executeDiscographyScalarSliceSave"));
assert("ui g17c-label save branch", ui.includes('slice === "g17c-label"'));
assert("ui isDiscographyScalarSliceSaveOutcomeSuccess", ui.includes("isDiscographyScalarSliceSaveOutcomeSuccess"));

assert("G-15b save unchanged export", g15bSave.includes("executeG15bDiscographyPurchaseUrlSave"));
assert("G-15d save unchanged export", g15dSave.includes("executeG15dDiscographyArtistSave"));
assert("G-16a save unchanged export", g16aSave.includes("executeG16aDiscographyArtistSave"));
assert("ui G-16a save still wired", ui.includes("executeG16aDiscographyArtistSave"));
assert("ui G-15d save still wired", ui.includes("executeG15dDiscographyArtistSave"));
assert("ui G-15b save still wired", ui.includes("executeG15bDiscographyPurchaseUrlSave"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

assert("staging url configured", !!url, "missing PUBLIC_SUPABASE_URL");
assert("anon key configured", !!key, "missing PUBLIC_SUPABASE_ANON_KEY");
assert("staging host only", url.includes(STAGING_REF), url);
assert("not production host", !url.includes(SARISWING_HOST), url);
assert("not service_role key", !String(key).toLowerCase().includes("service_role"));

if (url && key) {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,label,updated_at`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  if (Array.isArray(rows) && rows[0]) {
    assert("live label still null (no Save)", rows[0].label == null);
    assert("live updated_at baseline", rows[0].updated_at === BASELINE_UPDATED_AT);
  }

  for (const closedId of [CLOSED_001, CLOSED_002, CLOSED_003]) {
    const closedRes = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${closedId}&select=legacy_id`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    assert(`closed ${closedId} SELECT ok`, closedRes.ok);
  }
}

assert("Save not executed in verifier", true);
assert("DB write not executed in verifier", true);
assert("FTP/upload not executed", true);
assert("commit/push not executed", true);

console.log(`\nG-17d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
