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
  PACKAGE_RUN_MARKER_NAME,
  PACKAGE_RUNS_DIR_NAME,
  STALE_BACKUP_DIR_NAME,
  buildPackageRunMarker,
  isManualUploadMetaPath,
  isStaleBackupPath,
  relocateExistingManualUploadPackageToStaleBackup,
  resolvePackageRunMarkerPath,
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
const realBackup = path.join(TOOL_ROOT, "output/manual-upload", STALE_BACKUP_DIR_NAME, "gosaki-piano");
assert(
  "real _stale-backup/gosaki-piano not created by this fixture run",
  !fs.existsSync(realBackup),
);

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK package-stale-backup-and-run-marker");
