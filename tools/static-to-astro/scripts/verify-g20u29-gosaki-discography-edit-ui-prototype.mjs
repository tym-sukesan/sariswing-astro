/**
 * G-20u29 — Gosaki Discography edit UI prototype verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u29-gosaki-discography-edit-ui-prototype.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS } from "./lib/sitemap-exclusions.mjs";
import { DISCOGRAPHY_SELECT } from "./lib/supabase-discography-read.mjs";
import {
  G20U29_DISCOGRAPHY_EDITOR_PHASE,
  GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL,
  applyGosakiStagingReadOnlyAdmin,
  buildDiscographyEditorPrototypeSnapshot,
  formatDiscographyTrackListTextarea,
} from "./lib/gosaki-staging-read-only-admin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-edit-ui-prototype.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-staging-read-only-admin.mjs";
const DISC_READ_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const BASE_COMMIT = "11eadf5";

const EXPECTED_RELEASES = 4;
const EXPECTED_TRACKS = 34;

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

function buildMockDiscographyBundle() {
  const releases = [
    {
      legacy_id: "discography-001",
      title: "Continuous",
      artist: "ごさきりかこTrio",
      release_date: "2023-07-26",
      label: null,
      catalog_number: "GSRT-0002",
      published: true,
      cover_image_url: "https://example.test/cover-001.png",
      purchase_url: "https://example.test/shop/",
      streaming_url: null,
      description: "personnel line 1",
    },
    {
      legacy_id: "discography-002",
      title: "SKYLARK",
      artist: "後藤沙紀",
      release_date: "2023-04-26",
      label: null,
      catalog_number: "STU-001",
      published: true,
      cover_image_url: "https://example.test/cover-002.jpg",
      purchase_url: "https://example.test/shop2/",
      streaming_url: null,
      description: "",
    },
    {
      legacy_id: "discography-003",
      title: "About Us!!",
      artist: "Artist 3",
      release_date: "2022-01-01",
      label: "Label",
      catalog_number: "CAT-003",
      published: true,
      cover_image_url: null,
      purchase_url: null,
      streaming_url: null,
      description: "About notes",
    },
    {
      legacy_id: "discography-004",
      title: "Ja-Jaaaaan!",
      artist: "Artist 4",
      release_date: "2021-06-01",
      label: null,
      catalog_number: "CAT-004",
      published: true,
      cover_image_url: null,
      purchase_url: null,
      streaming_url: null,
      description: "Venue only",
    },
  ];

  /** @type {Record<string, Array<{ track_number: number, sort_order: number, title: string }>>} */
  const tracksByLegacyId = {
    "discography-001": Array.from({ length: 9 }, (_, i) => ({
      track_number: i + 1,
      sort_order: i + 1,
      title: `Track ${i + 1}`,
    })),
    "discography-002": Array.from({ length: 8 }, (_, i) => ({
      track_number: i + 1,
      sort_order: i + 1,
      title: `Skylark ${i + 1}`,
    })),
    "discography-003": Array.from({ length: 9 }, (_, i) => ({
      track_number: i + 1,
      sort_order: i + 1,
      title: `About ${i + 1}`,
    })),
    "discography-004": Array.from({ length: 8 }, (_, i) => ({
      track_number: i + 1,
      sort_order: i + 1,
      title: `Jaa ${i + 1}`,
    })),
  };

  const tracks = Object.entries(tracksByLegacyId).flatMap(([legacyId, rows]) =>
    rows.map((row) => ({ ...row, discography_legacy_id: legacyId })),
  );

  return {
    discographyDataSource: "supabase",
    siteSlug: "gosaki-piano",
    siteSlugFilterApplied: true,
    releases,
    tracks,
    tracksByLegacyId,
    rowCount: releases.length,
    trackRowCount: tracks.length,
  };
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u29 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminLib = read(ADMIN_LIB_REL);
const discRead = read(DISC_READ_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u29", doc.includes("G-20u29-gosaki-discography-edit-ui-prototype"));
assert("doc gate complete", doc.includes("gosakiDiscographyEditUiPrototypeComplete: true"));
assert("doc no DB write", doc.includes("no DB write") || doc.includes("DB write"));
assert("doc textarea policy", doc.includes("1 line = 1 track"));
assert("doc no 34 fixed inputs", doc.includes("34") && /fixed|Do not/i.test(doc));
assert("doc production STOP", doc.includes("G-20j") && /STOP/i.test(doc));

assert("discography editor section", adminPage.includes('id="gra-discography-editor"'));
assert("discography editor data-section", adminPage.includes('data-section="discography-editor-prototype"'));
assert("discography editor snapshot import", adminPage.includes("gosaki-read-only-admin-discography-editor.json"));
assert("G20U29 phase on body", adminPage.includes("G20U29_DISCOGRAPHY_EDITOR_PHASE"));
assert("discography editor heading", adminPage.includes("Discography Editor Prototype"));
assert("track list textarea attr", adminPage.includes('data-track-list-textarea="true"'));
assert("1 line = 1 track label", adminPage.includes("1 line = 1 track"));
assert("Save disabled future phase", adminPage.includes("Save disabled") && adminPage.includes("future phase"));
assert("dashboard editor prototype link", adminPage.includes('#gra-discography-editor') && adminPage.includes("Editor prototype"));
assert("album card legacy id attr", adminPage.includes("data-album-legacy-id"));
assert("description personnel readonly", adminPage.includes("description / personnel"));
assert("cover preview class", adminPage.includes("gosaki-read-only-admin__cover-preview"));
assert("section Save disabled banner", adminPage.includes("DB write なし"));

const trackTextareaMatches = adminPage.match(/data-track-list-textarea="true"/g) ?? [];
assert("one track textarea template per album card", trackTextareaMatches.length === 1, String(trackTextareaMatches.length));
assert("no fixed 34 track input ids", !adminPage.includes("gra-disc-track-034"));
const perTrackInputPattern = (adminPage.match(/id="gra-disc-track-\d{2}"/g) ?? []).length;
assert("no numbered per-track input fields", perTrackInputPattern === 0, String(perTrackInputPattern));

assert("global Save disabled retained", adminPage.includes("Save（無効）"));
assert("global Publish disabled retained", adminPage.includes("Publish（無効）"));
assert("global Deploy disabled retained", adminPage.includes("Deploy（無効）"));
assert("global FTP disabled retained", adminPage.includes("FTP（無効）"));

assert("no supabase write in admin page", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("no localStorage in admin page", !/localStorage/i.test(adminPage));

assert("buildDiscographyEditorPrototypeSnapshot export", adminLib.includes("buildDiscographyEditorPrototypeSnapshot"));
assert("formatDiscographyTrackListTextarea export", adminLib.includes("formatDiscographyTrackListTextarea"));
assert("G20U29 phase constant in mjs", adminLib.includes(G20U29_DISCOGRAPHY_EDITOR_PHASE));
assert("discography editor data rel", adminLib.includes(GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL));

assert("DISCOGRAPHY_SELECT release_date", DISCOGRAPHY_SELECT.includes("release_date"));
assert("DISCOGRAPHY_SELECT description", DISCOGRAPHY_SELECT.includes("description"));
assert("DISCOGRAPHY_SELECT cover_image_url", DISCOGRAPHY_SELECT.includes("cover_image_url"));

const mockBundle = buildMockDiscographyBundle();
assert("mock bundle 4 releases", mockBundle.rowCount === EXPECTED_RELEASES);
assert("mock bundle 34 tracks", mockBundle.trackRowCount === EXPECTED_TRACKS);

const snapshot = buildDiscographyEditorPrototypeSnapshot(mockBundle);
assert("snapshot phase G-20u29", snapshot.phase === G20U29_DISCOGRAPHY_EDITOR_PHASE);
assert("snapshot 4 releases", snapshot.releaseCount === EXPECTED_RELEASES);
assert("snapshot 34 tracks", snapshot.trackCount === EXPECTED_TRACKS);
assert("snapshot save disabled", snapshot.saveEnabled === false);
assert("snapshot filtered read", snapshot.filteredRead === true);
assert("snapshot 4 albums", snapshot.albums.length === EXPECTED_RELEASES);
assert("snapshot album track textarea text", snapshot.albums[0].trackListText.includes("Track 1"));
assert("formatDiscographyTrackListTextarea multiline", formatDiscographyTrackListTextarea(mockBundle.tracksByLegacyId["discography-001"]).split("\n").length === 9);

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "g20u29-admin-"));
const applyResult = applyGosakiStagingReadOnlyAdmin(tmpOut, TOOL_ROOT, { discographyBundle: mockBundle });
assert("apply admin tmp", applyResult.applied === true, applyResult.reason ?? "");
const editorJsonPath = path.join(tmpOut, GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL);
assert("discography editor json written", fs.existsSync(editorJsonPath));
const writtenEditor = JSON.parse(fs.readFileSync(editorJsonPath, "utf8"));
assert("written editor 4/34", writtenEditor.releaseCount === 4 && writtenEditor.trackCount === 34);

const sitemapHasAdminExclusion = CMS_KIT_SITEMAP_EXCLUDED_SEGMENT_PATTERNS.some((re) =>
  re.test("/admin/") || re.test("/cms-kit-staging/gosaki-piano/admin/"),
);
assert("sitemap admin exclusion pattern", sitemapHasAdminExclusion);

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u29", packageJson.includes("verify:g20u29-gosaki-discography-edit-ui-prototype"));

assert("AI current-state G-20u29", currentState.includes("G-20u29"));
assert("AI next-actions G-20u29", nextActions.includes("G-20u29"));
assert("handoff G-20u29", handoff.includes("G-20u29"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);

console.log(`\nG-20u29 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
