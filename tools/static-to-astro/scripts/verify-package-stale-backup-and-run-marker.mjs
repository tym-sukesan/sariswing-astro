/**
 * Local fixture tests for package stale relocate + external PACKAGE_RUN marker fail-closed.
 * Does NOT touch output/manual-upload/gosaki-piano · no npm install · no package generate · no deletes of real packages.
 *
 * Run: node tools/static-to-astro/scripts/verify-package-stale-backup-and-run-marker.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  EXPECTED_ABOUT_ADMIN_PATH_BAKE,
  EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
  EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
  ABOUT_PUBLIC_BUILD_READ_REPORT_NAME,
  PACKAGE_RUN_MARKER_NAME,
  PACKAGE_RUNS_DIR_NAME,
  STALE_BACKUP_DIR_NAME,
  buildPackageRunMarker,
  isManualUploadMetaPath,
  isStaleBackupPath,
  relocateExistingManualUploadPackageToStaleBackup,
  resolvePackageRunMarkerPath,
  validateGosakiAboutAdminPathPackageArtifacts,
  validatePackageRunMarker,
  writePackageRunMarker,
} from "./lib/package-run-marker.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const REAL_PACKAGE = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano");
const REAL_MARKER = path.join(
  TOOL_ROOT,
  "output/manual-upload",
  PACKAGE_RUNS_DIR_NAME,
  "gosaki-piano",
  PACKAGE_RUN_MARKER_NAME,
);

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

function mkTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cms-kit-package-stale-"));
}

function headSha() {
  return spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).stdout.trim();
}

// --- Guard: do not touch real staging package ---
const realBefore = fs.existsSync(REAL_PACKAGE);
const realMtimeBefore = realBefore ? fs.statSync(REAL_PACKAGE).mtimeMs : null;
const realMarkerBefore = fs.existsSync(REAL_MARKER);
const REAL_STALE_BACKUP = path.join(
  TOOL_ROOT,
  "output/manual-upload",
  STALE_BACKUP_DIR_NAME,
  "gosaki-piano",
);
const realStaleBackupBefore = fs.existsSync(REAL_STALE_BACKUP);

assert("real gosaki-piano package not required for this test", true);
assert(
  "fixture root is not real package path",
  !path.resolve(mkTempRoot()).startsWith(path.resolve(REAL_PACKAGE)),
);

// --- Relocate + no restore on failure ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(path.join(live, "public-dist"), { recursive: true });
  fs.writeFileSync(path.join(live, "MANIFEST.json"), JSON.stringify({ stale: true }), "utf8");
  fs.writeFileSync(path.join(live, "public-dist", "index.html"), "<html></html>\n", "utf8");

  const relocated = relocateExistingManualUploadPackageToStaleBackup(live, {
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    now: new Date("2026-07-27T12:00:00.000Z"),
  });
  assert("relocate reports relocated", relocated.relocated === true);
  assert("live path gone after relocate", !fs.existsSync(live));
  assert("backup path exists", Boolean(relocated.to && fs.existsSync(relocated.to)));
  assert(
    "backup under _stale-backup",
    String(relocated.to).includes(`${path.sep}${STALE_BACKUP_DIR_NAME}${path.sep}`),
  );
  assert(
    "failure path does not restore live package",
    !fs.existsSync(live),
    "live must stay absent (no restore)",
  );
  assert("isStaleBackupPath true for backup", isStaleBackupPath(relocated.to));
  assert("isManualUploadMetaPath true for backup", isManualUploadMetaPath(relocated.to));
}

// --- Marker PASS (external only) ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const head = headSha();
  const marker = buildPackageRunMarker({
    runId: "fixture-run-1",
    generatedAt: "2026-07-27T12:00:00.000Z",
    sourceCommit: head,
    siteKey: "gosaki-piano",
    profile: "staging",
    bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
  });
  const written = writePackageRunMarker(live, marker);
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    currentHead: head,
  });
  assert("success external marker validates", errs.length === 0, errs.join("; "));
  assert(
    "marker under _package-runs",
    written.includes(`${path.sep}${PACKAGE_RUNS_DIR_NAME}${path.sep}`) &&
      written === resolvePackageRunMarkerPath(live),
  );
  assert(
    "package body has no PACKAGE_RUN.json",
    !fs.existsSync(path.join(live, PACKAGE_RUN_MARKER_NAME)),
  );
  assert("isManualUploadMetaPath true for marker path", isManualUploadMetaPath(written));
}

// --- Marker missing FAIL ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    currentHead: "abc",
  });
  assert(
    "missing marker FAIL",
    errs.some((e) => /missing external|_package-runs|PACKAGE_RUN/i.test(e)),
  );
}

// --- In-package marker FAIL ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-ok-ext",
      generatedAt: "2026-07-27T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    }),
  );
  fs.writeFileSync(path.join(live, PACKAGE_RUN_MARKER_NAME), "{}\n", "utf8");
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    currentHead: head,
  });
  assert(
    "in-package PACKAGE_RUN FAIL",
    errs.some((e) => /must not live inside package/i.test(e)),
  );
}

// --- HEAD mismatch FAIL ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-stale",
      generatedAt: "2026-07-27T12:00:00.000Z",
      sourceCommit: "0000000000000000000000000000000000000000",
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    }),
  );
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    currentHead: headSha(),
  });
  assert("HEAD mismatch FAIL", errs.some((e) => /stale|HEAD/i.test(e)));
}

// --- bake mismatch FAIL ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-bake",
      generatedAt: "2026-07-27T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: {
        aboutWriteBackend: "contents",
        aboutSaveUiArmed: true,
        publicAboutBuildRead: true,
      },
    }),
  );
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    currentHead: head,
  });
  assert(
    "bake mismatch FAIL",
    errs.some((e) => /aboutWriteBackend|aboutSaveUiArmed|publicAboutBuildRead/.test(e)),
  );
}

// --- armed bake PASS when explicitly expected ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(path.join(live, "public-dist", "admin", "about"), { recursive: true });
  fs.mkdirSync(path.join(live, "public-dist", "about"), { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-armed",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
    }),
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "admin", "about", "index.html"),
    `<!doctype html><html><body
      data-gosaki-about-write-backend="supabase"
      data-gosaki-about-save-armed="true"
      data-gosaki-about-dry-run-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-about-save-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-supabase-url="https://kmjqppxjdnwwrtaeqjta.supabase.co"
      data-gosaki-youtube-save-armed="false"
      data-gosaki-schedule-save-armed="false"
      data-gosaki-discography-save-armed="false"
    ></body></html>`,
    "utf8",
  );
  fs.writeFileSync(path.join(live, "public-dist", "about", "index.html"), "<html></html>", "utf8");
  const markerErrs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
    currentHead: head,
  });
  const htmlErrs = validateGosakiAboutAdminPathPackageArtifacts({
    packageDir: live,
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
  });
  assert("armed bake marker PASS", markerErrs.length === 0, markerErrs.join(" | "));
  assert("armed bake HTML PASS", htmlErrs.length === 0, htmlErrs.join(" | "));
}

// --- armed marker with disarmed HTML FAIL (do not trust PACKAGE_RUN alone) ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(path.join(live, "public-dist", "admin", "about"), { recursive: true });
  fs.mkdirSync(path.join(live, "public-dist", "about"), { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-armed-html-mismatch",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
    }),
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "admin", "about", "index.html"),
    `<!doctype html><html><body
      data-gosaki-about-write-backend="supabase"
      data-gosaki-about-save-armed="false"
      data-gosaki-about-dry-run-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-about-save-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-supabase-url="https://kmjqppxjdnwwrtaeqjta.supabase.co"
      data-gosaki-youtube-save-armed="false"
      data-gosaki-schedule-save-armed="false"
      data-gosaki-discography-save-armed="false"
    ></body></html>`,
    "utf8",
  );
  fs.writeFileSync(path.join(live, "public-dist", "about", "index.html"), "<html></html>", "utf8");
  const htmlErrs = validateGosakiAboutAdminPathPackageArtifacts({
    packageDir: live,
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
  });
  assert(
    "armed expected vs disarmed HTML FAIL",
    htmlErrs.some((e) => /save-armed/.test(e)),
    htmlErrs.join(" | "),
  );
}

// --- default expectedBake still rejects armed marker ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-armed-default-reject",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED,
    }),
  );
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    currentHead: head,
  });
  assert(
    "default verify rejects armed PACKAGE_RUN",
    errs.some((e) => /aboutSaveUiArmed expected false/.test(e)),
  );
}

// --- public build-read success: applied (DB ≠ JSON) ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(path.join(live, "public-dist", "admin", "about"), { recursive: true });
  fs.mkdirSync(path.join(live, "public-dist", "about"), { recursive: true });
  const head = headSha();
  const lede = "[CMS Kit staging] About profile.lede build-read applied PoC";
  const evidence = {
    pageFieldDataSource: "supabase",
    profileLedeOverlayApplied: true,
    overlayOutcome: "applied",
    fieldCount: 1,
    profileLedeValueText: lede,
  };
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-build-read-applied",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
      buildReadEvidence: evidence,
      sourceTreeClean: true,
    }),
  );
  fs.writeFileSync(
    path.join(live, ABOUT_PUBLIC_BUILD_READ_REPORT_NAME),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "admin", "about", "index.html"),
    `<!doctype html><html><body
      data-gosaki-about-write-backend="supabase"
      data-gosaki-about-save-armed="false"
      data-gosaki-about-dry-run-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-about-save-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-supabase-url="https://kmjqppxjdnwwrtaeqjta.supabase.co"
      data-gosaki-youtube-save-armed="false"
      data-gosaki-schedule-save-armed="false"
      data-gosaki-discography-save-armed="false"
    ></body></html>`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "about", "index.html"),
    `<html><body><p>${lede}</p></body></html>`,
    "utf8",
  );
  const markerErrs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
    currentHead: head,
  });
  const htmlErrs = validateGosakiAboutAdminPathPackageArtifacts({
    packageDir: live,
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
    expectedLede: lede,
  });
  assert("build-read applied marker PASS", markerErrs.length === 0, markerErrs.join(" | "));
  assert("build-read applied HTML+report PASS", htmlErrs.length === 0, htmlErrs.join(" | "));
}

// --- public build-read success: noop_equal (DB === JSON) ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(path.join(live, "public-dist", "admin", "about"), { recursive: true });
  fs.mkdirSync(path.join(live, "public-dist", "about"), { recursive: true });
  const head = headSha();
  const lede = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";
  const evidence = {
    pageFieldDataSource: "supabase",
    profileLedeOverlayApplied: false,
    overlayOutcome: "noop_equal",
    fieldCount: 1,
    profileLedeValueText: lede,
  };
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-build-read-noop-equal",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
      buildReadEvidence: evidence,
      sourceTreeClean: true,
    }),
  );
  fs.writeFileSync(
    path.join(live, ABOUT_PUBLIC_BUILD_READ_REPORT_NAME),
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "admin", "about", "index.html"),
    `<!doctype html><html><body
      data-gosaki-about-write-backend="supabase"
      data-gosaki-about-save-armed="false"
      data-gosaki-about-dry-run-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-about-save-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-supabase-url="https://kmjqppxjdnwwrtaeqjta.supabase.co"
      data-gosaki-youtube-save-armed="false"
      data-gosaki-schedule-save-armed="false"
      data-gosaki-discography-save-armed="false"
    ></body></html>`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "about", "index.html"),
    `<html><body><p>${lede}</p></body></html>`,
    "utf8",
  );
  const htmlErrs = validateGosakiAboutAdminPathPackageArtifacts({
    packageDir: live,
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
  });
  assert("build-read noop_equal PASS", htmlErrs.length === 0, htmlErrs.join(" | "));
}

// --- sourceTreeClean=false rejected ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-dirty-tree",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
      sourceTreeClean: false,
    }),
  );
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    currentHead: head,
  });
  assert(
    "sourceTreeClean false FAIL",
    errs.some((e) => /sourceTreeClean/.test(e)),
  );
}

// --- build-read PACKAGE_RUN alone insufficient (missing report) ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(path.join(live, "public-dist", "admin", "about"), { recursive: true });
  fs.mkdirSync(path.join(live, "public-dist", "about"), { recursive: true });
  const head = headSha();
  const lede = "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-build-read-no-report",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
      buildReadEvidence: {
        pageFieldDataSource: "supabase",
        profileLedeOverlayApplied: true,
        overlayOutcome: "applied",
        fieldCount: 1,
      },
    }),
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "admin", "about", "index.html"),
    `<!doctype html><html><body
      data-gosaki-about-write-backend="supabase"
      data-gosaki-about-save-armed="false"
      data-gosaki-about-dry-run-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-about-save-endpoint="https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
      data-gosaki-supabase-url="https://kmjqppxjdnwwrtaeqjta.supabase.co"
      data-gosaki-youtube-save-armed="false"
      data-gosaki-schedule-save-armed="false"
      data-gosaki-discography-save-armed="false"
    ></body></html>`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(live, "public-dist", "about", "index.html"),
    `<html><body><p>${lede}</p></body></html>`,
    "utf8",
  );
  const htmlErrs = validateGosakiAboutAdminPathPackageArtifacts({
    packageDir: live,
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
  });
  assert(
    "build-read without report FAIL",
    htmlErrs.some((e) => /ABOUT_PUBLIC_BUILD_READ_REPORT|build report required/i.test(e)),
    htmlErrs.join(" | "),
  );
}

// --- default expectedBake still rejects build-read marker ---
{
  const root = mkTempRoot();
  const live = path.join(root, "manual-upload", "gosaki-piano");
  fs.mkdirSync(live, { recursive: true });
  const head = headSha();
  writePackageRunMarker(
    live,
    buildPackageRunMarker({
      runId: "fixture-run-build-read-default-reject",
      generatedAt: "2026-07-28T12:00:00.000Z",
      sourceCommit: head,
      siteKey: "gosaki-piano",
      profile: "staging",
      bake: EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ,
    }),
  );
  const errs = validatePackageRunMarker({
    packageDir: live,
    repoRoot: REPO_ROOT,
    siteKey: "gosaki-piano",
    profile: "staging",
    expectedBake: EXPECTED_ABOUT_ADMIN_PATH_BAKE,
    currentHead: head,
  });
  assert(
    "default verify rejects build-read PACKAGE_RUN",
    errs.some((e) => /publicAboutBuildRead expected false/.test(e)),
  );
}

// --- convert exit 1 on verify-build failure (static source check) ---
{
  const convertSrc = fs.readFileSync(
    path.join(TOOL_ROOT, "scripts/convert-static-to-astro.mjs"),
    "utf8",
  );
  assert(
    "convert exits 1 when verify-build fails",
    /verifyBuild && result\.buildVerification && !result\.buildVerification\.buildSuccess/.test(
      convertSrc,
    ) && /process\.exit\(1\)/.test(convertSrc),
  );
}

// --- site-verification: no omit=optional · has diagnostics · timeouts · timing logs ---
{
  const sv = fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/site-verification.mjs"), "utf8");
  assert("npm install without omit=optional", !sv.includes("--omit=optional"));
  assert("npm install --no-audit --no-fund", sv.includes("npm install --no-audit --no-fund"));
  assert("install timeout 600000", /timeout:\s*installTimeoutMs|installTimeoutMs\s*=\s*600_000/.test(sv));
  assert("build timeout 300000", /buildTimeoutMs\s*=\s*300_000/.test(sv));
  assert("timing start log", sv.includes("[verify-build] npm install start"));
  assert("timing end log", sv.includes("[verify-build] npm install end"));
  assert("error code/signal/message", sv.includes("err.code") && sv.includes("err.signal") && sv.includes("err.message"));
}

// --- build core wires relocate + external marker ---
{
  const core = fs.readFileSync(
    path.join(TOOL_ROOT, "scripts/lib/build-site-package-core.mjs"),
    "utf8",
  );
  assert("build relocates before convert", core.includes("relocateExistingManualUploadPackageToStaleBackup"));
  assert("build writes PACKAGE_RUN", core.includes("writePackageRunMarker"));
  assert("build logs external PACKAGE_RUN", /external PACKAGE_RUN\.json/.test(core));
  assert(
    "build clean-tree gate",
    core.includes("assertGitWorkingTreeCleanForManualUploadPackage"),
  );
  assert(
    "build does not restore on failure",
    /do NOT restore/i.test(core) &&
      !/renameSync\(\s*relocated\.to/.test(core) &&
      !/fs\.cpSync\(\s*relocated\.to/.test(core) &&
      !/restore.*from.*stale-backup|restoreExistingManualUpload/i.test(core),
  );
}

// --- verify core requires external marker for gosaki staging ---
{
  const ver = fs.readFileSync(
    path.join(TOOL_ROOT, "scripts/lib/verify-site-package-core.mjs"),
    "utf8",
  );
  assert("verify calls validatePackageRunMarker", ver.includes("validatePackageRunMarker"));
  assert(
    "verify calls About HTML cross-check",
    ver.includes("validateGosakiAboutAdminPathPackageArtifacts"),
  );
  assert(
    "verify supports expectAboutSaveUiArmed",
    ver.includes("expectAboutSaveUiArmed") &&
      ver.includes("EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED"),
  );
  assert(
    "verify supports expectPublicAboutBuildRead",
    ver.includes("expectPublicAboutBuildRead") &&
      ver.includes("EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ"),
  );
  assert("verify rejects meta paths", ver.includes("isManualUploadMetaPath"));
}

// --- marker module: external path contract ---
{
  const mod = fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/package-run-marker.mjs"), "utf8");
  assert("module defines _package-runs", mod.includes('PACKAGE_RUNS_DIR_NAME = "_package-runs"'));
  assert("resolvePackageRunMarkerPath exported", mod.includes("export function resolvePackageRunMarkerPath"));
}

// --- real package untouched ---
const realAfter = fs.existsSync(REAL_PACKAGE);
const realMtimeAfter = realAfter ? fs.statSync(REAL_PACKAGE).mtimeMs : null;
assert("real package still present (not relocated by fixture)", realBefore === realAfter);
assert(
  "real package mtime unchanged",
  realMtimeBefore === realMtimeAfter,
  `before=${realMtimeBefore} after=${realMtimeAfter}`,
);
assert(
  "real package has no in-package PACKAGE_RUN",
  !realAfter || !fs.existsSync(path.join(REAL_PACKAGE, PACKAGE_RUN_MARKER_NAME)),
);
assert(
  "real _package-runs marker not created by this fixture",
  fs.existsSync(REAL_MARKER) === realMarkerBefore,
);
assert(
  "real _stale-backup/gosaki-piano not created by this fixture run",
  fs.existsSync(REAL_STALE_BACKUP) === realStaleBackupBefore,
);

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK package-stale-backup-and-run-marker");
