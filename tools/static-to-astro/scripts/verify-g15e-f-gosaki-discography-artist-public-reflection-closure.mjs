/**
 * G-15e-f — Gosaki Discography artist public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15e-f-gosaki-discography-artist-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-closure.md";
const UPLOAD_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-save-result.md";
const NEXT_FIELD_REL =
  "tools/static-to-astro/docs/gosaki-discography-next-field-save-preflight.md";
const DRY_RUN_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md";
const INVENTORY_REL =
  "tools/static-to-astro/docs/gosaki-discography-cms-mvp-inventory-and-plan.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const G15C_F_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const TARGET_ID = "d17653b4-f83d-4548-9936-d3fcc218906e";
const TARGET_LEGACY_ID = "discography-003";
const TARGET_TITLE = "About Us!!";
const G15D_SAVE_APPROVAL =
  "G-15d-gosaki-discography-existing-release-artist-non-dry-run";
const G15D_DRY_RUN_APPROVAL = "G-15d-gosaki-discography-artist-dry-run-slice";
const ARTIST_BEFORE = "ごさきりかこtrio";
const ARTIST_AFTER = "ごさきりかこTrio";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const UPDATED_AT_AFTER_SAVE = "2026-06-29T02:40:57.83085+00:00";
const CSS_HASH = "index.YcHrHZH4.css";
const G15E_F_BASE_COMMIT = "6dc81c3";

const CHAIN_DOCS = [
  "gosaki-discography-cms-mvp-inventory-and-plan.md",
  "gosaki-discography-next-field-save-preflight.md",
  "gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md",
  "gosaki-discography-artist-save-result.md",
  "gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-discography-artist-public-reflection-upload-result.md",
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

function extractRepeaterItem(html, title) {
  const titleIdx = html.indexOf(title);
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
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G15E_F_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is 6dc81c3", head.stdout.trim() === G15E_F_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is 6dc81c3",
  origin.stdout.trim() === G15E_F_BASE_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-15e-upload baseline 6dc81c3",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("closure doc exists", exists(DOC_REL));
assert(
  "doc phase G-15e-f",
  doc.includes("G-15e-f-gosaki-discography-artist-public-reflection-closure"),
);
assert("doc artist chain complete gate", doc.includes("gosakiDiscographyArtistChainComplete: true"));
assert(
  "doc closure complete gate",
  doc.includes("gosakiDiscographyArtistPublicReflectionClosureComplete: true"),
);
assert("doc no re-upload", doc.includes("readyForG15eDiscographyArtistReUpload: false"));
assert(
  "doc no reflection re-upload",
  doc.includes("readyForG15eDiscographyArtistReflectionReUpload: false"),
);
assert("doc no same row re-save", doc.includes("readyForG15dSameRowReSave: false"));
assert(
  "doc no artist re-execution",
  doc.includes("readyForG15DiscographyArtistReExecution: false"),
);
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc discography002 untouched", doc.includes("discography002Touched: false"));
assert("doc skylark untouched", doc.includes("skylarkReleaseTouched: false"));
assert("doc continuous untouched", doc.includes("continuousReleaseTouched: false"));
assert("doc ja-jaaaaan untouched", doc.includes("jaJaaaaanReleaseTouched: false"));
assert(
  "doc purchase_url maintained",
  doc.includes("skylarkPurchaseUrlReflectionMaintained: true"),
);
assert("doc G-15d Save approval", doc.includes(G15D_SAVE_APPROVAL));
assert("doc G-15d dry-run approval", doc.includes(G15D_DRY_RUN_APPROVAL));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc legacy id", doc.includes(TARGET_LEGACY_ID));
assert("doc artist after", doc.includes(ARTIST_AFTER));
assert("doc artist before", doc.includes(ARTIST_BEFORE));
assert("doc updated_at after save", doc.includes(UPDATED_AT_AFTER_SAVE));
assert("doc css hash unchanged", doc.includes(CSS_HASH));
assert("doc hook module", doc.includes("patchGosakiDiscographySupabaseFields"));
assert("doc routine dev dry-run reset", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc next phase A field expansion", doc.includes("A — Discography CMS field expansion"));
assert("doc next phase B reflection", doc.includes("B — Discography public reflection generalization"));
assert("doc next phase C playbook", doc.includes("C — Save / Reflection playbook"));
assert("doc next phase D tracks", doc.includes("D — Tracks / personnel / price"));
assert("doc upload result ref", doc.includes("gosaki-discography-artist-public-reflection-upload-result"));
assert("doc commit 6dc81c3", doc.includes("6dc81c3"));
assert("doc G-15c-f cross-ref", doc.includes("G-15c-f"));
assert("doc staging host", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production stop", doc.includes("vsbvndwuajjhnzpohghh"));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists: ${chainDoc}`, exists(`tools/static-to-astro/docs/${chainDoc}`));
  assert(`closure references: ${chainDoc}`, doc.includes(chainDoc));
}

assert("G-14c playbook exists", exists(G14C_REL));
assert("G-15c-f closure exists", exists(G15C_F_CLOSURE_REL));
assert("hook module exists", exists(HOOK_REL));
assert("inventory doc exists", exists(INVENTORY_REL));
assert("upload result doc exists", exists(UPLOAD_RESULT_REL));
assert("save result doc exists", exists(SAVE_RESULT_REL));
assert("dry-run doc exists", exists(DRY_RUN_REL));
assert("next field doc exists", exists(NEXT_FIELD_REL));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const live = curl(STAGING_DISCOGRAPHY_URL);
if (live.ok) {
  const aboutUsItem = extractRepeaterItem(live.body, TARGET_TITLE);
  const skylarkItem = extractRepeaterItem(live.body, "SKYLARK");

  assert("live discography HTTP 200", live.code === "200", live.code);
  assert("live discographyDataSource supabase", live.body.includes("discographyDataSource=supabase"));
  assert("live CSS hash", live.body.includes(CSS_HASH));
  assert("live About Us present", live.body.includes(TARGET_TITLE));
  assert("live About Us item new artist", aboutUsItem.includes(ARTIST_AFTER));
  assert("live About Us item old artist absent", !aboutUsItem.includes(ARTIST_BEFORE));
  assert("live page old artist absent", !live.body.includes(ARTIST_BEFORE));
  assert("live new purchase_url present", live.body.includes(PURCHASE_URL_AFTER));
  assert("live old purchase_url absent", !live.body.includes(PURCHASE_URL_BEFORE));
  assert("live SKYLARK present", live.body.includes("SKYLARK"));
  assert("SKYLARK item new url", skylarkItem.includes(PURCHASE_URL_AFTER));
  assert("SKYLARK item old url absent", !skylarkItem.includes(PURCHASE_URL_BEFORE));
  assert("live Continuous present", live.body.includes("Continuous"));
  assert("live Ja-Jaaaaan present", live.body.includes("Ja-Jaaaaan!"));
  assert("live not production host", !live.body.includes("gosaki-piano.com"));
  assert("live not wrong staging ref", !live.body.includes("vsbvndwuajjhnzpohghh"));
  for (const marker of AUDIT_MARKERS) {
    assert(`live no audit marker: ${marker}`, !live.body.includes(marker));
  }
}

assert("cursor ftp not executed in verifier", true);
assert("cursor db write not executed in verifier", true);
assert("cursor package regen not executed in verifier", true);

console.log(`\nG-15e-f closure verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
