/**
 * G-15c-f — Gosaki Discography public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15c-f-gosaki-discography-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const UPLOAD_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RETRY_REL =
  "tools/static-to-astro/docs/gosaki-discography-save-retry-result-and-updated-at-investigation.md";
const INVENTORY_REL =
  "tools/static-to-astro/docs/gosaki-discography-cms-mvp-inventory-and-plan.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const TARGET_ID = "ed59d236-881a-45ce-ab9f-de5427e39dad";
const TARGET_LEGACY_ID = "discography-002";
const TARGET_TITLE = "SKYLARK";
const G15B_APPROVAL =
  "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const UPDATED_AT_AT_SAVE = "2026-06-05T17:39:44.201802+00:00";
const CSS_HASH = "index.YcHrHZH4.css";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

const CHAIN_DOCS = [
  "gosaki-discography-cms-mvp-inventory-and-plan.md",
  "gosaki-discography-admin-supabase-read-binding.md",
  "gosaki-discography-dry-run-preview-implementation-and-preflight.md",
  "gosaki-discography-save-slice-final-preflight.md",
  "gosaki-discography-save-permission-failure-and-investigation.md",
  "gosaki-discography-update-grant-apply-result.md",
  "gosaki-discography-save-retry-result-and-updated-at-investigation.md",
  "gosaki-discography-updated-at-trigger-final-preflight.md",
  "gosaki-discography-updated-at-trigger-apply-result.md",
  "gosaki-discography-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-discography-public-reflection-upload-result.md",
];

const AUDIT_MARKERS = ["[CMS Kit staging]", "PoC", "dry-run"];

const REPEATER_ITEM_START_RE =
  /<div id="comp-llexymga__item-[^"]+" class="[^"]*wixui-repeater__item"/g;

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

function curl(url) {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", url], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return { ok: false, body: "", code: "0" };
  const parts = r.stdout.trimEnd().split("\n");
  const code = parts.pop();
  return { ok: true, body: parts.join("\n"), code };
}

function extractSkylarkItem(html) {
  const titleIdx = html.indexOf(TARGET_TITLE);
  if (titleIdx < 0) return "";

  /** @type {number[]} */
  const starts = [];
  REPEATER_ITEM_START_RE.lastIndex = 0;
  let match;
  while ((match = REPEATER_ITEM_START_RE.exec(html)) !== null) {
    starts.push(match.index);
  }
  if (!starts.length) return "";

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? html.length;
    if (titleIdx >= start && titleIdx < end) {
      return html.slice(start, end);
    }
  }
  return "";
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("HEAD is 4fea4f2", head.stdout.trim() === "4fea4f2", head.stdout.trim());
assert("origin/main is 4fea4f2", origin.stdout.trim() === "4fea4f2", origin.stdout.trim());

const doc = read(DOC_REL);

assert("closure doc exists", exists(DOC_REL));
assert(
  "doc phase G-15c-f",
  doc.includes("G-15c-f-gosaki-discography-public-reflection-closure"),
);
assert("doc chain complete gate", doc.includes("gosakiDiscographyPurchaseUrlChainComplete: true"));
assert(
  "doc closure complete gate",
  doc.includes("gosakiDiscographyPublicReflectionClosureComplete: true"),
);
assert("doc no re-upload", doc.includes("readyForG15cDiscographyReUpload: false"));
assert("doc no reflection re-upload", doc.includes("readyForG15cDiscographyReflectionReUpload: false"));
assert("doc no same row re-save", doc.includes("readyForG15bSameRowReSave: false"));
assert("doc no purchase url re-execution", doc.includes("readyForG15DiscographyPurchaseUrlReExecution: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc continuous untouched", doc.includes("continuousReleaseTouched: false"));
assert("doc about us untouched", doc.includes("aboutUsReleaseTouched: false"));
assert("doc ja-jaaaaan untouched", doc.includes("jaJaaaaanReleaseTouched: false"));
assert("doc G-15b approval", doc.includes(G15B_APPROVAL));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc legacy id", doc.includes(TARGET_LEGACY_ID));
assert("doc purchase_url after", doc.includes(PURCHASE_URL_AFTER));
assert("doc purchase_url before", doc.includes(PURCHASE_URL_BEFORE));
assert("doc updated_at at save", doc.includes(UPDATED_AT_AT_SAVE));
assert("doc css hash unchanged", doc.includes(CSS_HASH));
assert("doc hook module", doc.includes("supabase-discography-read.mjs"));
assert("doc routine dev dry-run reset", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc next phase A recommended", doc.includes("A — Discography CMS MVP completion"));
assert("doc next phase recommendations", doc.includes("Next phase recommendations"));
assert("doc upload result ref", doc.includes("gosaki-discography-public-reflection-upload-result"));
assert("doc commit 4fea4f2", doc.includes("4fea4f2"));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists: ${chainDoc}`, exists(`tools/static-to-astro/docs/${chainDoc}`));
  assert(`closure references: ${chainDoc}`, doc.includes(chainDoc));
}

assert("G-14c playbook exists", exists(G14C_REL));
assert("hook module exists", exists(HOOK_REL));
assert("inventory doc exists", exists(INVENTORY_REL));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const live = curl(STAGING_DISCOGRAPHY_URL);
if (live.ok) {
  assert("live discography HTTP 200", live.code === "200", live.code);
  assert("live discographyDataSource supabase", live.body.includes("discographyDataSource=supabase"));
  assert("live CSS hash", live.body.includes(CSS_HASH));
  assert("live SKYLARK present", live.body.includes(TARGET_TITLE));
  assert("live new purchase_url present", live.body.includes(PURCHASE_URL_AFTER));
  assert("live old purchase_url absent", !live.body.includes(PURCHASE_URL_BEFORE));
  const skylark = extractSkylarkItem(live.body);
  assert("live SKYLARK item new url", skylark.includes(PURCHASE_URL_AFTER));
  assert("live SKYLARK item old url absent", !skylark.includes(PURCHASE_URL_BEFORE));
  assert("live Continuous present", live.body.includes("Continuous"));
  assert("live About Us present", live.body.includes("About Us!!"));
  assert("live Ja-Jaaaaan present", live.body.includes("Ja-Jaaaaan!"));
  assert("live not production host", !live.body.includes("gosaki-piano.com"));
  assert("live not wrong staging ref", !live.body.includes("vsbvndwuajjhnzpohghh"));
  for (const marker of AUDIT_MARKERS) {
    assert(`live no audit marker: ${marker}`, !live.body.includes(marker));
  }
}

console.log(`\nG-15c-f closure verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
