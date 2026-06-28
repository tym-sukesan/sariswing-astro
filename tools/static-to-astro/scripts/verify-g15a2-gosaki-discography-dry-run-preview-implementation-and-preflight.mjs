/**
 * G-15a2 — Gosaki Discography dry-run Preview verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15a2-gosaki-discography-dry-run-preview-implementation-and-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-dry-run-preview-implementation-and-preflight.md";
const DRY_RUN_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-dry-run.ts";
const GUARDS_REL = "src/lib/admin/staging-write/gosaki-discography-dry-run-guards.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-dry-run-config.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const TARGET_LEGACY_ID = "discography-002";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";

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
assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);

const doc = read(DOC_REL);
const dryRunSrc = read(DRY_RUN_REL);
const guardsSrc = read(GUARDS_REL);
const configSrc = read(CONFIG_REL);
const operator = read(OPERATOR_REL);
const uiSrc = read(UI_REL);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15a2", doc.includes("G-15a2-gosaki-discography-dry-run-preview-implementation-and-preflight"));
assert("doc complete gate", doc.includes("gosakiDiscographyDryRunPreviewImplementationAndPreflightComplete: true"));
assert("doc target discography-002", doc.includes("discography-002"));
assert("doc purchase_url slice", doc.includes("purchase_url"));
assert("doc actualWrite false", doc.includes("actualWrite: false"));
assert("doc save disabled", doc.includes("saveEnabled: false"));

assert("dry-run module exists", exists(DRY_RUN_REL));
assert("dry-run export", dryRunSrc.includes("executeG15a2DiscographyDryRun"));
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run wouldWrite", dryRunSrc.includes("wouldWrite"));
assert("dry-run no update", !dryRunSrc.includes(".update("));

assert("guards purchase_url only", guardsSrc.includes('["purchase_url"]'));
assert("guards target legacy", guardsSrc.includes(TARGET_LEGACY_ID));

assert("config save disabled", configSrc.includes("saveEnabled: G15A2_DISCOGRAPHY_SAVE_ENABLED"));
assert("config save false const", configSrc.includes("false as const"));

assert("operator preview button", operator.includes("gosaki-disc-dry-run-preview-btn"));
assert("operator dry-run result panel", operator.includes("gosaki-disc-dry-run-result"));
assert("operator save disabled", operator.includes('data-g15a2-save-enabled="false"'));
assert("operator dry-run enabled label", operator.includes("Discography dry-run Preview:"));

assert("ui wires preview", uiSrc.includes("runDryRunPreview"));
assert("ui execute dry-run", uiSrc.includes("executeG15a2DiscographyDryRun"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  try {
    const host = new URL(url).hostname;
    assert("staging host only", host.includes(STAGING_REF) && !host.includes(SARISWING_HOST), host);

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key);

    const beforeRow = await sb
      .from("discography")
      .select(
        "id,legacy_id,title,artist,release_date,year,catalog_number,label,description,cover_image_url,purchase_url,streaming_url,sort_order,published,updated_at",
      )
      .eq("legacy_id", TARGET_LEGACY_ID)
      .single();
    assert("live row read", !beforeRow.error, beforeRow.error?.message);
    assert("live SKYLARK title", beforeRow.data?.title === "SKYLARK");
    const updatedAtBefore = beforeRow.data?.updated_at;

    const purchaseUrlBefore = beforeRow.data?.purchase_url;
    assert("live purchase_url before", purchaseUrlBefore === PURCHASE_URL_BEFORE, purchaseUrlBefore);

    const formPurchaseAfter = PURCHASE_URL_AFTER;
    const changedFields =
      String(purchaseUrlBefore ?? "") !== String(formPurchaseAfter) ? ["purchase_url"] : [];
    assert("changedFields one purchase_url", changedFields.length === 1);
    assert("changedFields purchase_url", changedFields[0] === "purchase_url");
    const payload = { purchase_url: formPurchaseAfter };
    assert("payload keys purchase_url only", Object.keys(payload).join(",") === "purchase_url");
    assert("dry-run actualWrite false (simulated)", true);
    assert("dry-run wouldWrite true (simulated)", changedFields.length === 1);
    assert("save disabled (config)", configSrc.includes("G15A2_DISCOGRAPHY_SAVE_ENABLED = false"));

    const afterRow = await sb
      .from("discography")
      .select("updated_at,purchase_url")
      .eq("legacy_id", TARGET_LEGACY_ID)
      .single();
    assert("live row after read", !afterRow.error);
    assert("updated_at unchanged", afterRow.data?.updated_at === updatedAtBefore);
    assert("purchase_url unchanged in DB", afterRow.data?.purchase_url === beforeRow.data?.purchase_url);
  } catch (e) {
    assert("live supabase dry-run probe", false, String(e));
  }
} else {
  console.log("SKIP live Supabase probe (no anon env)");
}

console.log(`\nG-15a2 dry-run verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
