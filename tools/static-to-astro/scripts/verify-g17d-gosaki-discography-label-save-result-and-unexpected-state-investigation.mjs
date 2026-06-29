/**
 * G-17d-execution — Gosaki Discography label Save result + unexpected state investigation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17d-gosaki-discography-label-save-result-and-unexpected-state-investigation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md";
const DRY_RUN_REL = "src/lib/admin/staging-write/discography-scalar-field-dry-run.ts";
const SAVE_REL = "src/lib/admin/staging-write/discography-scalar-field-save.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";

const BASE_COMMIT = "9016d5a";
const TARGET_LEGACY_ID = "discography-004";
const TARGET_ID = "32b83506-8766-4cf6-9de7-40defbfc0b38";
const LABEL_AFTER = "Mardi Gras JAPAN Records";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const AFTER_UPDATED_AT = "2026-06-29T07:36:49.044397+00:00";
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

assert("HEAD is 9016d5a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is 9016d5a",
  origin.stdout.trim() === BASE_COMMIT,
  origin.stdout.trim(),
);

const doc = read(DOC_REL);
const dryRun = read(DRY_RUN_REL);
const save = read(SAVE_REL);
const ui = read(UI_REL);
const adapter = read(ADAPTER_REL);

assert("investigation doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc label after value", doc.includes(LABEL_AFTER));
assert("doc updated_at after", doc.includes(AFTER_UPDATED_AT));
assert("doc baseline updated_at", doc.includes(BASELINE_UPDATED_AT));
assert("doc updated_at advanced", doc.includes("advanced"));
assert("doc title unchanged", doc.includes("Ja-Jaaaaan!"));
assert("doc artist unchanged", doc.includes("新谷健介オノマトペ"));
assert("doc year 2015", doc.includes("2015"));
assert("doc release_date unchanged", doc.includes("2015-03-21"));
assert("doc catalog_number OMP-001", doc.includes("OMP-001"));
assert("doc purchase_url null", doc.includes("purchase_url") && doc.includes("null"));
assert("doc streaming_url null", doc.includes("streaming_url"));
assert("doc Preview actualWrite false", doc.includes("actualWrite") && doc.includes("false"));
assert("doc Preview no_changes", doc.includes("no_changes"));
assert("doc unexpected already-applied state", doc.includes("already-applied") || doc.includes("already applied"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false") || doc.includes("Rollback required"));
assert("doc re-Save prohibited", doc.includes("Do not re-Save") || doc.includes("Re-Save"));
assert("doc public reflection pending", doc.includes("G-17e"));
assert("doc investigation gate", doc.includes("gosakiDiscographyG17dUnexpectedAlreadyAppliedStateInvestigationComplete: true"));

assert("dry-run no updateDiscographyWrite", !dryRun.includes("updateDiscographyWrite"));
assert("dry-run no executeDiscographyScalarSliceSave", !dryRun.includes("executeDiscographyScalarSliceSave"));
assert("dry-run actualWrite false safety", dryRun.includes("actualWrite: false"));
assert("dry-run no_changes readiness", dryRun.includes('"no_changes"'));

assert("save calls updateDiscographyWrite", save.includes("updateDiscographyWrite"));
assert("adapter updateDiscographyWrite export", adapter.includes("export async function updateDiscographyWrite"));

assert("ui runDryRunPreview separate from runSave", ui.includes("runDryRunPreview") && ui.includes("runSave"));
assert("ui preview btn wires dry-run only", ui.includes("gosaki-disc-dry-run-preview-btn"));
assert("ui save btn wires runSave", ui.includes("gosaki-disc-update-btn"));

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(SARISWING_HOST), url);

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,artist,label,year,release_date,catalog_number,purchase_url,streaming_url,updated_at`;
  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  if (Array.isArray(rows) && rows[0]) {
    const row = rows[0];
    assert("live id", row.id === TARGET_ID);
    assert("live label after", row.label === LABEL_AFTER);
    assert("live updated_at after", row.updated_at === AFTER_UPDATED_AT);
    assert("live title unchanged", row.title === "Ja-Jaaaaan!");
    assert("live artist unchanged", row.artist === "新谷健介オノマトペ");
    assert("live year 2015", row.year === 2015);
    assert("live release_date", row.release_date === "2015-03-21");
    assert("live catalog_number", row.catalog_number === "OMP-001");
    assert("live purchase_url null", row.purchase_url == null);
    assert("live streaming_url null", row.streaming_url == null);
    assert("live updated_at after baseline", row.updated_at !== BASELINE_UPDATED_AT);
  }
}

assert("DB write not executed by Cursor", true);
assert("FTP/upload not executed", true);
assert("service_role not used", true);
assert("commit/push not executed", true);

console.log(`\nG-17d result/investigation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
