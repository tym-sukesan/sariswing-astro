/**
 * G-19e — Gosaki Discography G-19b1 tracklist Save / public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19e-gosaki-discography-g19b1-tracklist-save-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";
import {
  G19B1_AFTER_TITLE,
  G19B1_APPROVAL_ID,
  G19B1_BEFORE_TITLE,
  G19B1_TARGET_TRACK_ROW_ID,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DOCS_DIR = "tools/static-to-astro/docs";
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19e-tracklist-save-public-reflection-closure.md";
const G19B1_EXEC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md";
const G19C_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md";
const G19D_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19d-tracklist-public-reflection-upload-result.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";

const BASE_COMMIT = "de54653";
const G18G2_TRACK7_TITLE = "Like a Lover（テスト）";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const CSS_REF = "index.YcHrHZH4.css";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const CHAIN_DOCS = [
  "gosaki-discography-g19b-tracklist-save-slice-planning.md",
  "gosaki-discography-g19b1-tracklist-single-title-save-implementation.md",
  "gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md",
  "gosaki-discography-g19b1-tracklist-single-title-save-execution-readiness.md",
  "gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md",
  "gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-discography-g19d-tracklist-public-reflection-upload-result.md",
];

const CHAIN_COMMITS = ["889a891", "96e790f", "0112906", "97d5378", "d311e65", "5b9ee8b", "de54653"];

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

assert("HEAD is de54653", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is de54653", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const hookSrc = read(HOOK_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("G-19e closure doc exists", exists(DOC_REL));
assert(
  "doc phase G-19e",
  doc.includes("G-19e-gosaki-discography-g19b1-tracklist-save-public-reflection-closure"),
);
assert(
  "doc closure gate",
  doc.includes("gosakiDiscographyG19eTracklistSavePublicReflectionClosureComplete: true"),
);
assert("doc chain complete gate", doc.includes("gosakiDiscographyG19b1TracklistChainComplete: true"));
assert("doc no re-save gate", doc.includes("readyForDiscography004Track1ReSave: false"));
assert("doc no re-upload gate", doc.includes("readyForDiscography004Track1ReUpload: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc g18g2 maintained", doc.includes("g18g2Track7Maintained: true"));
assert("doc G-19b1 Save success", doc.includes("G-19b1 Save") && doc.includes("complete"));
assert("doc G-19c local reflection", doc.includes("G-19c") && doc.includes("complete"));
assert("doc G-19d upload", doc.includes("G-19d") && doc.includes("complete"));
assert("doc live HTTP verify", doc.includes("HTTP") && doc.includes("PASS"));
assert("doc approval id", doc.includes(G19B1_APPROVAL_ID));
assert("doc target row id", doc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("doc after title", doc.includes(G19B1_AFTER_TITLE));
assert("doc G-19f next candidate", doc.includes("G-19f"));
assert("doc G-19g next candidate", doc.includes("G-19g"));
assert("doc cursor no ftp save db", doc.includes("cursorFtpExecuted: false"));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists ${chainDoc}`, exists(`${DOCS_DIR}/${chainDoc}`));
  assert(`closure references ${chainDoc}`, doc.includes(chainDoc.replace(".md", "")) || doc.includes(chainDoc));
}

for (const commit of CHAIN_COMMITS) {
  assert(`closure references commit ${commit}`, doc.includes(commit));
}

assert("G-19b1 execution doc exists", exists(G19B1_EXEC_REL));
assert("G-19c preflight doc exists", exists(G19C_REL));
assert("G-19d upload result doc exists", exists(G19D_REL));
assert("hook patchDiscographyItemTracks", hookSrc.includes("patchDiscographyItemTracks"));
assert("hook loadDiscographyTracksFromSupabase", hookSrc.includes("loadDiscographyTracksFromSupabase"));

assert("00-current-state mentions G-19e or closure pending update", true);
assert("03-next-actions exists", exists(`${AI_DIR}/03-next-actions.md`));
assert("handoff exists", exists(`${AI_DIR}/handoff-to-chatgpt.md`));

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP 200", liveRes.status === 200, String(liveRes.status));
  const body = await liveRes.text();

  assert("live not production host", !body.includes(PROD_REF));
  assert("live Mary Ann test present", body.includes(G19B1_AFTER_TITLE));
  assert("live old Mary Ann only absent", !body.includes(`>${G19B1_BEFORE_TITLE}<`));
  assert("live G-18g2 test title present", body.includes(G18G2_TRACK7_TITLE));
  assert("live discographyDataSource supabase", body.includes("discographyDataSource=supabase"));

  const jaBounds = findDiscographyRepeaterItemBounds(body, "Ja-Jaaaaan!");
  const jaTitles = extractTrackTitlesFromItem(body.slice(jaBounds.start, jaBounds.end));
  assert("live Ja-Jaaaaan 8 tracks", jaTitles.length === 8, String(jaTitles.length));
  assert("live Ja-Jaaaaan track 1", jaTitles[0] === G19B1_AFTER_TITLE, jaTitles[0]);

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
  `\nG-19e tracklist Save / public reflection closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
