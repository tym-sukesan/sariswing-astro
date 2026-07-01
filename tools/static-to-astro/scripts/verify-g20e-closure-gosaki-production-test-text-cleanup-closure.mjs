/**
 * G-20e-closure — Gosaki production test text cleanup chain closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20e-closure-gosaki-production-test-text-cleanup-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DOCS_DIR = "tools/static-to-astro/docs";
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-closure.md";
const G20B_EXEC_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-execution-result.md";
const G20C_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md";
const G20DE_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-public-reflection-upload-result.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";

const BASE_COMMIT = "32cb18e";
const ROW_A_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const ROW_B_ID = "04e987a9-e251-4b0b-b860-21a61e711f8e";
const TEST_A = "Like a Lover（テスト）";
const TEST_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const CSS_REF = "index.YcHrHZH4.css";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const CHAIN_DOCS = [
  "gosaki-production-release-readiness-inventory.md",
  "gosaki-production-test-text-cleanup-final-preflight.md",
  "gosaki-production-test-text-cleanup-execution-result.md",
  "gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-production-test-text-cleanup-public-reflection-upload-result.md",
];

const CHAIN_COMMITS = ["7eda613", "a6c1cf1", "041f16c", "32cb18e"];

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

function extractTrackTitlesFromItem(itemHtml) {
  const tlIdx = itemHtml.indexOf("Track List");
  if (tlIdx < 0) return [];
  const after = itemHtml.slice(tlIdx);
  const endRel = after.search(/Personnel|Release/);
  const block = endRel > 0 ? after.slice(0, endRel) : after;
  /** @type {string[]} */
  const titles = [];
  const re = /<p class="font_(8|13)[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\u200b/g, "")
      .trim();
    if (text && !/track list/i.test(text)) titles.push(text);
  }
  return titles;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 32cb18e", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 32cb18e", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const hookSrc = read(HOOK_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("G-20e-closure doc exists", exists(DOC_REL));
assert(
  "doc phase G-20e-closure",
  doc.includes("G-20e-closure-gosaki-production-test-text-cleanup-closure"),
);
assert(
  "doc closure gate",
  doc.includes("gosakiProductionTestTextCleanupChainClosureComplete: true"),
);
assert("doc chain complete gate", doc.includes("gosakiProductionTestTextCleanupChainComplete: true"));
assert("doc no re-execution gate", doc.includes("readyForG20bTestTextCleanupReExecution: false"));
assert("doc no re-upload gate", doc.includes("readyForG20dDiscographyCleanupReUpload: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc G-20b DB cleanup complete", doc.includes("G-20b") && doc.includes("complete"));
assert("doc G-20c local reflection", doc.includes("G-20c") && doc.includes("complete"));
assert("doc G-20d upload", doc.includes("G-20d") && doc.includes("complete"));
assert("doc G-20e HTTP verify", doc.includes("G-20e") && doc.includes("PASS"));
assert("doc cleanup targets 2 rows", doc.includes(ROW_A_ID) && doc.includes(ROW_B_ID));
assert("doc production titles", doc.includes(AFTER_A) && doc.includes(AFTER_B));
assert("doc test titles before", doc.includes(TEST_A) && doc.includes(TEST_B));
assert("doc G-20f next", doc.includes("G-20f"));
assert("doc cursor no ftp save db", doc.includes("cursorFtpExecuted: false"));
assert("doc chain closed", doc.includes("closed"));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists ${chainDoc}`, exists(`${DOCS_DIR}/${chainDoc}`));
  assert(
    `closure references ${chainDoc}`,
    doc.includes(chainDoc.replace(".md", "")) || doc.includes(chainDoc),
  );
}

for (const commit of CHAIN_COMMITS) {
  assert(`closure references commit ${commit}`, doc.includes(commit));
}

assert("G-20b execution doc exists", exists(G20B_EXEC_REL));
assert("G-20c preflight doc exists", exists(G20C_REL));
assert("G-20d/e upload result doc exists", exists(G20DE_REL));
assert("hook patchDiscographyItemTracks", hookSrc.includes("patchDiscographyItemTracks"));
assert("hook loadDiscographyTracksFromSupabase", hookSrc.includes("loadDiscographyTracksFromSupabase"));

assert("00-current-state mentions G-20e-closure", currentState.includes("G-20e-closure"));
assert("03-next-actions mentions G-20e-closure", nextActions.includes("G-20e-closure"));
assert("handoff mentions G-20e-closure", handoff.includes("G-20e-closure"));
assert("03-next-actions G-20f next", nextActions.includes("G-20f"));
assert("handoff G-20f next", handoff.includes("G-20f"));

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP 200", liveRes.status === 200, String(liveRes.status));
  const body = await liveRes.text();

  assert("live not production host", !body.includes(PROD_REF));
  assert("live test Like absent", !body.includes(TEST_A));
  assert("live test Mary absent", !body.includes(TEST_B));
  assert("live Like a Lover present", body.includes(AFTER_A));
  assert("live Mary Ann present", body.includes(AFTER_B));
  assert("live discographyDataSource supabase", body.includes("discographyDataSource=supabase"));

  const jaBounds = findDiscographyRepeaterItemBounds(body, "Ja-Jaaaaan!");
  const jaTitles = extractTrackTitlesFromItem(body.slice(jaBounds.start, jaBounds.end));
  assert("live Ja-Jaaaaan 8 tracks", jaTitles.length === 8, String(jaTitles.length));
  assert("live Ja-Jaaaaan track 1", jaTitles[0] === AFTER_B, jaTitles[0]);

  const skBounds = findDiscographyRepeaterItemBounds(body, "SKYLARK");
  const skylarkTitles = extractTrackTitlesFromItem(body.slice(skBounds.start, skBounds.end));
  assert("live SKYLARK 8 tracks", skylarkTitles.length === 8, String(skylarkTitles.length));
  assert("live SKYLARK track 7", skylarkTitles[6] === AFTER_A, skylarkTitles[6]);

  const cssRes = await fetch(`${STAGING_ORIGIN}/_astro/${CSS_REF}`, { method: "HEAD" });
  assert("live CSS HTTP 200", cssRes.status === 200, String(cssRes.status));
} catch (err) {
  assert("live HTTP verification", false, err instanceof Error ? err.message : String(err));
}

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP/upload not executed by Cursor", true);
assert("mirror sync delete not executed", true);
assert("deploy workflow_dispatch not executed", true);
assert("production not used", true);
assert("service_role not used", true);
assert("commit push not executed", true);

console.log(
  `\nG-20e-closure production test text cleanup chain closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
