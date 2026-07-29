/**
 * Manual-upload package run marker + stale backup relocate (About Admin-path fail-closed).
 * Marker lives OUTSIDE the FTP upload package so FileZilla of gosaki-piano/ cannot ship it.
 * No FTP · no network · no secrets in marker.
 */

import fs from "node:fs";
import path from "node:path";
import { resolveSourceCommit } from "./package-upload-safety.mjs";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
} from "./supabase-staging-ref-utils.mjs";
import { isSaveArmExactTrue } from "./save-arm-utils.mjs";

export const PACKAGE_RUN_MARKER_NAME = "PACKAGE_RUN.json";
export const STALE_BACKUP_DIR_NAME = "_stale-backup";
/** Sibling of live package dirs under manual-upload/ — not part of FTP payload. */
export const PACKAGE_RUNS_DIR_NAME = "_package-runs";

/** Expected bake for About Admin-path staging packages (fail-closed · Save UI disarmed). */
export const EXPECTED_ABOUT_ADMIN_PATH_BAKE = Object.freeze({
  aboutWriteBackend: "supabase",
  aboutSaveUiArmed: false,
  publicAboutBuildRead: false,
});

/**
 * Temporary Save-UI-armed About Admin-path bake (operator-declared verify only).
 * Never the default for `npm run verify:manual-upload`.
 */
export const EXPECTED_ABOUT_ADMIN_PATH_BAKE_SAVE_UI_ARMED = Object.freeze({
  aboutWriteBackend: "supabase",
  aboutSaveUiArmed: true,
  publicAboutBuildRead: false,
});

/**
 * Temporary public About build-read bake (operator-declared verify only).
 * Never the default for `npm run verify:manual-upload`. Save UI stays disarmed.
 */
export const EXPECTED_ABOUT_ADMIN_PATH_BAKE_PUBLIC_BUILD_READ = Object.freeze({
  aboutWriteBackend: "supabase",
  aboutSaveUiArmed: false,
  publicAboutBuildRead: true,
});

export const ABOUT_PUBLIC_BUILD_READ_REPORT_NAME = "ABOUT_PUBLIC_BUILD_READ_REPORT.json";
/** Staging seed / JSON baseline lede — HTML cross-check when build-read success. */
export const GOSAKI_ABOUT_PROFILE_LEDE_BASELINE =
  "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";

export const GOSAKI_STAGING_SUPABASE_REF = STAGING_PROJECT_REF;
export const GOSAKI_PRODUCTION_SUPABASE_REF_STOP = PRODUCTION_REF_STOP;
export const ABOUT_SUPABASE_ENDPOINT_NAME = "gosaki-about-supabase-save-dry-run";
export const ABOUT_CONTENTS_DRY_RUN_ENDPOINT_NAME = "gosaki-about-content-dry-run";
export const ABOUT_CONTENTS_SAVE_ENDPOINT_NAME = "gosaki-about-content-save";

/**
 * @param {NodeJS.ProcessEnv | Record<string, unknown>} [env]
 */
export function resolveAboutAdminPathBakeFromEnv(env = process.env) {
  const e = env ?? {};
  return {
    aboutWriteBackend:
      String(e.PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED ?? "").trim() === "true"
        ? "supabase"
        : "contents",
    aboutSaveUiArmed: isSaveArmExactTrue(e.PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED),
    publicAboutBuildRead:
      String(e.CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ ?? "").trim() === "true",
  };
}

/**
 * Live package: …/manual-upload/gosaki-piano
 * External marker: …/manual-upload/_package-runs/gosaki-piano/PACKAGE_RUN.json
 *
 * @param {string} packageDir
 * @returns {string}
 */
export function resolvePackageRunMarkerPath(packageDir) {
  const abs = path.resolve(packageDir);
  const parent = path.dirname(abs);
  const siteFolder = path.basename(abs);
  return path.join(parent, PACKAGE_RUNS_DIR_NAME, siteFolder, PACKAGE_RUN_MARKER_NAME);
}

/**
 * Paths under _stale-backup or _package-runs are meta — not FTP / fileCount payload.
 *
 * @param {string} relativeOrAbsolutePath
 */
export function isManualUploadMetaPath(relativeOrAbsolutePath) {
  const parts = path.resolve(relativeOrAbsolutePath).split(path.sep);
  return parts.includes(STALE_BACKUP_DIR_NAME) || parts.includes(PACKAGE_RUNS_DIR_NAME);
}

/**
 * @param {string} relativeOrAbsolutePath
 */
export function isStaleBackupPath(relativeOrAbsolutePath) {
  return path.resolve(relativeOrAbsolutePath).split(path.sep).includes(STALE_BACKUP_DIR_NAME);
}

/**
 * @param {string} relativeOrAbsolutePath
 */
export function isPackageRunsPath(relativeOrAbsolutePath) {
  return path.resolve(relativeOrAbsolutePath).split(path.sep).includes(PACKAGE_RUNS_DIR_NAME);
}

/**
 * @param {string} packageDir absolute or relative package root (…/manual-upload/gosaki-piano)
 * @param {{ repoRoot: string, siteKey?: string, now?: Date }} opts
 * @returns {{ relocated: boolean, from?: string, to?: string, reason?: string }}
 */
export function relocateExistingManualUploadPackageToStaleBackup(packageDir, opts) {
  const abs = path.resolve(packageDir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    return { relocated: false, reason: "package dir absent" };
  }

  const parent = path.dirname(abs);
  const siteFolder = path.basename(abs);
  const head = String(resolveSourceCommit(opts.repoRoot) ?? "unknown").trim();
  const shortHead = head.length >= 7 ? head.slice(0, 7) : head || "unknown";
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(parent, STALE_BACKUP_DIR_NAME, siteFolder);
  const dest = path.join(backupRoot, `${stamp}-${shortHead}`);

  fs.mkdirSync(backupRoot, { recursive: true });
  if (fs.existsSync(dest)) {
    throw new Error(`stale backup destination already exists: ${dest}`);
  }
  // Same-filesystem rename (no copy · no delete of contents).
  fs.renameSync(abs, dest);
  return { relocated: true, from: abs, to: dest };
}

/**
 * @param {{
 *   runId: string,
 *   generatedAt: string,
 *   sourceCommit: string,
 *   siteKey: string,
 *   profile: string,
 *   bake?: {
 *     aboutWriteBackend: string,
 *     aboutSaveUiArmed: boolean,
 *     publicAboutBuildRead: boolean,
 *   },
 *   buildReadEvidence?: {
 *     pageFieldDataSource?: string,
 *     profileLedeOverlayApplied?: boolean,
 *     overlayOutcome?: string,
 *     fieldCount?: number,
 *     fallbackReason?: string | null,
 *   } | null,
 *   sourceTreeClean?: boolean,
 * }} input
 */
export function buildPackageRunMarker(input) {
  const bake = input.bake ?? EXPECTED_ABOUT_ADMIN_PATH_BAKE;
  /** @type {Record<string, unknown>} */
  const marker = {
    runId: String(input.runId),
    generatedAt: String(input.generatedAt),
    sourceCommit: String(input.sourceCommit),
    siteKey: String(input.siteKey),
    profile: String(input.profile),
    completed: true,
    sourceTreeClean: input.sourceTreeClean !== false,
    aboutWriteBackend: bake.aboutWriteBackend,
    aboutSaveUiArmed: bake.aboutSaveUiArmed === true,
    publicAboutBuildRead: bake.publicAboutBuildRead === true,
  };
  const ev = input.buildReadEvidence;
  if (ev && typeof ev === "object") {
    marker.pageFieldDataSource = String(ev.pageFieldDataSource ?? "");
    marker.profileLedeOverlayApplied = ev.profileLedeOverlayApplied === true;
    if (ev.overlayOutcome != null) marker.overlayOutcome = String(ev.overlayOutcome);
    marker.fieldCount = Number(ev.fieldCount ?? 0);
    if (ev.fallbackReason != null && String(ev.fallbackReason).trim()) {
      marker.fallbackReason = String(ev.fallbackReason);
    }
  }
  return marker;
}

/**
 * @param {string} packageDir
 * @returns {string}
 */
export function resolveAboutPublicBuildReadReportPath(packageDir) {
  return path.join(path.resolve(packageDir), ABOUT_PUBLIC_BUILD_READ_REPORT_NAME);
}

/**
 * @param {string} packageDir
 * @returns {Record<string, unknown> | null}
 */
export function readAboutPublicBuildReadReport(packageDir) {
  const target = resolveAboutPublicBuildReadReportPath(packageDir);
  if (!fs.existsSync(target)) return null;
  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Write marker OUTSIDE the package (…/_package-runs/<site>/PACKAGE_RUN.json).
 *
 * @param {string} packageDir live package root
 * @param {Record<string, unknown>} marker
 */
export function writePackageRunMarker(packageDir, marker) {
  const target = resolvePackageRunMarkerPath(packageDir);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
  return target;
}

/**
 * @param {string} packageDir live package root
 * @returns {Record<string, unknown> | null}
 */
export function readPackageRunMarker(packageDir) {
  const target = resolvePackageRunMarkerPath(packageDir);
  if (!fs.existsSync(target)) return null;
  try {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Fail-closed checks: live package + external PACKAGE_RUN.json (no secrets · not in FTP payload).
 *
 * @param {{
 *   packageDir: string,
 *   repoRoot: string,
 *   siteKey: string,
 *   profile: string,
 *   expectedBake?: typeof EXPECTED_ABOUT_ADMIN_PATH_BAKE,
 *   currentHead?: string | null,
 * }} opts
 * @returns {string[]} errors
 */
export function validatePackageRunMarker(opts) {
  /** @type {string[]} */
  const errors = [];
  const abs = path.resolve(opts.packageDir);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    errors.push("package dir missing");
    return errors;
  }

  if (isManualUploadMetaPath(abs)) {
    errors.push(
      `${STALE_BACKUP_DIR_NAME}/_package-runs must not be used as verify/FTP package path`,
    );
    return errors;
  }

  const inPackageMarker = path.join(abs, PACKAGE_RUN_MARKER_NAME);
  if (fs.existsSync(inPackageMarker)) {
    errors.push(
      `${PACKAGE_RUN_MARKER_NAME} must not live inside package (FTP payload); use ${PACKAGE_RUNS_DIR_NAME}/`,
    );
  }

  const markerPath = resolvePackageRunMarkerPath(abs);
  if (!fs.existsSync(markerPath)) {
    errors.push(`missing external ${PACKAGE_RUNS_DIR_NAME}/…/${PACKAGE_RUN_MARKER_NAME}`);
    return errors;
  }

  const marker = readPackageRunMarker(abs);
  if (!marker || typeof marker !== "object") {
    errors.push(`${PACKAGE_RUN_MARKER_NAME} invalid JSON`);
    return errors;
  }

  if (marker.completed !== true) errors.push("PACKAGE_RUN.completed must be true");
  if (marker.sourceTreeClean !== true) {
    errors.push("PACKAGE_RUN.sourceTreeClean must be true (clean-tree gate at package generate)");
  }
  if (!marker.runId) errors.push("PACKAGE_RUN.runId missing");
  if (!marker.generatedAt) errors.push("PACKAGE_RUN.generatedAt missing");
  if (!marker.sourceCommit) errors.push("PACKAGE_RUN.sourceCommit missing");
  if (String(marker.siteKey ?? "") !== String(opts.siteKey)) {
    errors.push(`PACKAGE_RUN.siteKey expected ${opts.siteKey}, got ${marker.siteKey}`);
  }
  if (String(marker.profile ?? "") !== String(opts.profile)) {
    errors.push(`PACKAGE_RUN.profile expected ${opts.profile}, got ${marker.profile}`);
  }

  const head =
    opts.currentHead != null
      ? String(opts.currentHead)
      : String(resolveSourceCommit(opts.repoRoot) ?? "");
  if (!head) {
    errors.push("unable to resolve git HEAD for PACKAGE_RUN freshness");
  } else if (String(marker.sourceCommit) !== head) {
    errors.push(
      `PACKAGE_RUN.sourceCommit stale: marker=${marker.sourceCommit} HEAD=${head}`,
    );
  }

  const expected = opts.expectedBake ?? EXPECTED_ABOUT_ADMIN_PATH_BAKE;
  if (marker.aboutWriteBackend !== expected.aboutWriteBackend) {
    errors.push(
      `PACKAGE_RUN.aboutWriteBackend expected ${expected.aboutWriteBackend}, got ${marker.aboutWriteBackend}`,
    );
  }
  if (marker.aboutSaveUiArmed !== expected.aboutSaveUiArmed) {
    errors.push(
      `PACKAGE_RUN.aboutSaveUiArmed expected ${expected.aboutSaveUiArmed}, got ${marker.aboutSaveUiArmed}`,
    );
  }
  if (marker.publicAboutBuildRead !== expected.publicAboutBuildRead) {
    errors.push(
      `PACKAGE_RUN.publicAboutBuildRead expected ${expected.publicAboutBuildRead}, got ${marker.publicAboutBuildRead}`,
    );
  }

  return errors;
}

/**
 * Independent HTML / public-dist checks for About Admin-path bake.
 * Does **not** trust PACKAGE_RUN alone — attrs must match the operator-declared expectedBake.
 *
 * @param {{
 *   packageDir: string,
 *   expectedBake?: typeof EXPECTED_ABOUT_ADMIN_PATH_BAKE,
 *   stagingRef?: string,
 *   productionRefStop?: string,
 *   expectedLede?: string,
 * }} opts
 * @returns {string[]}
 */
export function validateGosakiAboutAdminPathPackageArtifacts(opts) {
  /** @type {string[]} */
  const errors = [];
  const expected = opts.expectedBake ?? EXPECTED_ABOUT_ADMIN_PATH_BAKE;
  const stagingRef = opts.stagingRef ?? GOSAKI_STAGING_SUPABASE_REF;
  const productionStop = opts.productionRefStop ?? GOSAKI_PRODUCTION_SUPABASE_REF_STOP;
  const abs = path.resolve(opts.packageDir);
  const aboutHtmlPath = path.join(abs, "public-dist", "admin", "about", "index.html");
  const publicAboutPath = path.join(abs, "public-dist", "about", "index.html");

  if (!fs.existsSync(path.join(abs, "public-dist")) || !fs.statSync(path.join(abs, "public-dist")).isDirectory()) {
    errors.push("public-dist/ missing");
    return errors;
  }
  if (!fs.existsSync(aboutHtmlPath)) {
    errors.push("public-dist/admin/about/index.html missing");
    return errors;
  }

  const html = fs.readFileSync(aboutHtmlPath, "utf8");
  if (html.includes(productionStop)) {
    errors.push(`admin about HTML must not contain production ref ${productionStop}`);
  }

  const writeBackend = matchDataAttr(html, "data-gosaki-about-write-backend");
  const saveArmed = matchDataAttr(html, "data-gosaki-about-save-armed");
  const dryRunEndpoint = matchDataAttr(html, "data-gosaki-about-dry-run-endpoint");
  const saveEndpoint = matchDataAttr(html, "data-gosaki-about-save-endpoint");
  const supabaseUrl = matchDataAttr(html, "data-gosaki-supabase-url");

  if (writeBackend !== expected.aboutWriteBackend) {
    errors.push(
      `HTML data-gosaki-about-write-backend expected "${expected.aboutWriteBackend}", got "${writeBackend}"`,
    );
  }
  const expectedArmedAttr = expected.aboutSaveUiArmed === true ? "true" : "false";
  if (saveArmed !== expectedArmedAttr) {
    errors.push(
      `HTML data-gosaki-about-save-armed expected "${expectedArmedAttr}", got "${saveArmed}" (must match declared verify mode; do not trust PACKAGE_RUN alone)`,
    );
  }

  // Supabase path: About endpoints must be staging supabase function (not Contents G-12a).
  // This also enforces Contents non-dry-run write path is not the live About backend.
  if (expected.aboutWriteBackend === "supabase") {
    for (const [label, endpoint] of [
      ["dry-run", dryRunEndpoint],
      ["save", saveEndpoint],
    ]) {
      if (!endpoint) {
        errors.push(`HTML data-gosaki-about-${label}-endpoint missing`);
        continue;
      }
      if (!endpoint.includes(stagingRef)) {
        errors.push(`About ${label} endpoint must target staging ref ${stagingRef}`);
      }
      if (endpoint.includes(productionStop)) {
        errors.push(`About ${label} endpoint must not target production ref`);
      }
      if (!endpoint.includes(`/functions/v1/${ABOUT_SUPABASE_ENDPOINT_NAME}`)) {
        errors.push(
          `About ${label} endpoint must use ${ABOUT_SUPABASE_ENDPOINT_NAME} (Contents path not allowed for this bake)`,
        );
      }
      if (
        endpoint.includes(ABOUT_CONTENTS_DRY_RUN_ENDPOINT_NAME) ||
        endpoint.includes(ABOUT_CONTENTS_SAVE_ENDPOINT_NAME)
      ) {
        errors.push(`About ${label} endpoint must not use Contents G-12a endpoints`);
      }
    }
    if (supabaseUrl && !supabaseUrl.includes(stagingRef)) {
      errors.push(`data-gosaki-supabase-url must include staging ref ${stagingRef}`);
    }
    if (supabaseUrl && supabaseUrl.includes(productionStop)) {
      errors.push("data-gosaki-supabase-url must not include production ref");
    }
  }

  // build-read=false: public About page must exist (JSON SoT path).
  // build-read=true: require report + HTML lede cross-check (do not trust PACKAGE_RUN alone).
  if (expected.publicAboutBuildRead === false) {
    if (!fs.existsSync(publicAboutPath)) {
      errors.push("public-dist/about/index.html missing (JSON SoT public About)");
    }
  } else {
    errors.push(
      ...validateGosakiAboutPublicBuildReadArtifacts({
        packageDir: abs,
        stagingRef,
        productionRefStop: productionStop,
        expectedLede: opts.expectedLede ?? GOSAKI_ABOUT_PROFILE_LEDE_BASELINE,
      }),
    );
  }

  // Cross-check: other CMS Save UI arms stay false on this About-armed package.
  for (const [attr, label] of [
    ["data-gosaki-youtube-save-armed", "YouTube"],
    ["data-gosaki-schedule-save-armed", "Schedule"],
    ["data-gosaki-discography-save-armed", "Discography"],
  ]) {
    const v = matchDataAttr(html, attr);
    if (v != null && v !== "false") {
      errors.push(`${label} Save UI must stay false (got ${attr}="${v}")`);
    }
  }

  return errors;
}

/**
 * Cross-check PACKAGE_RUN ↔ ABOUT_PUBLIC_BUILD_READ_REPORT ↔ public About HTML.
 * Fail-closed: PACKAGE_RUN alone cannot PASS build-read mode.
 *
 * @param {{
 *   packageDir: string,
 *   stagingRef?: string,
 *   productionRefStop?: string,
 *   expectedLede?: string,
 * }} opts
 * @returns {string[]}
 */
export function validateGosakiAboutPublicBuildReadArtifacts(opts) {
  /** @type {string[]} */
  const errors = [];
  const abs = path.resolve(opts.packageDir);
  const stagingRef = opts.stagingRef ?? GOSAKI_STAGING_SUPABASE_REF;
  const productionStop = opts.productionRefStop ?? GOSAKI_PRODUCTION_SUPABASE_REF_STOP;
  const expectedLede = String(opts.expectedLede ?? GOSAKI_ABOUT_PROFILE_LEDE_BASELINE).trim();
  const publicAboutPath = path.join(abs, "public-dist", "about", "index.html");
  const report = readAboutPublicBuildReadReport(abs);
  const marker = readPackageRunMarker(abs);

  if (!fs.existsSync(publicAboutPath)) {
    errors.push("public-dist/about/index.html missing (public About build-read)");
    return errors;
  }
  if (!report || typeof report !== "object") {
    errors.push(
      `missing ${ABOUT_PUBLIC_BUILD_READ_REPORT_NAME} (build report required; do not trust PACKAGE_RUN alone)`,
    );
    return errors;
  }
  if (!marker || typeof marker !== "object") {
    errors.push("PACKAGE_RUN missing for build-read cross-check");
    return errors;
  }

  if (report.pageFieldDataSource !== "supabase") {
    errors.push(
      `build report pageFieldDataSource expected "supabase", got ${JSON.stringify(report.pageFieldDataSource)}`,
    );
  }
  const reportOutcome = String(report.overlayOutcome ?? "");
  if (reportOutcome !== "applied" && reportOutcome !== "noop_equal") {
    errors.push(
      `build report overlayOutcome expected "applied"|"noop_equal", got ${JSON.stringify(report.overlayOutcome)}`,
    );
  }
  const expectApplied = reportOutcome === "applied";
  if (report.profileLedeOverlayApplied !== expectApplied) {
    errors.push(
      `build report profileLedeOverlayApplied expected ${expectApplied} for overlayOutcome=${reportOutcome}, got ${JSON.stringify(report.profileLedeOverlayApplied)}`,
    );
  }
  if (Number(report.fieldCount) !== 1) {
    errors.push(`build report fieldCount expected 1, got ${JSON.stringify(report.fieldCount)}`);
  }
  if (report.fallbackReason != null && String(report.fallbackReason).trim()) {
    errors.push(
      `build report fallbackReason must be absent on supabase success (applied|noop_equal), got ${JSON.stringify(report.fallbackReason)}`,
    );
  }

  // PACKAGE_RUN must mirror report (honesty) — not sufficient alone.
  if (marker.publicAboutBuildRead !== true) {
    errors.push("PACKAGE_RUN.publicAboutBuildRead expected true for build-read package");
  }
  if (marker.sourceTreeClean !== true) {
    errors.push("PACKAGE_RUN.sourceTreeClean must be true");
  }
  if (marker.pageFieldDataSource !== "supabase") {
    errors.push(
      `PACKAGE_RUN.pageFieldDataSource expected "supabase" (must match report), got ${JSON.stringify(marker.pageFieldDataSource)}`,
    );
  }
  if (String(marker.overlayOutcome ?? "") !== reportOutcome) {
    errors.push(
      `PACKAGE_RUN.overlayOutcome expected ${JSON.stringify(reportOutcome)} (must match report), got ${JSON.stringify(marker.overlayOutcome)}`,
    );
  }
  if (marker.profileLedeOverlayApplied !== expectApplied) {
    errors.push(
      `PACKAGE_RUN.profileLedeOverlayApplied expected ${expectApplied} (must match report), got ${JSON.stringify(marker.profileLedeOverlayApplied)}`,
    );
  }
  if (Number(marker.fieldCount) !== 1) {
    errors.push(
      `PACKAGE_RUN.fieldCount expected 1 (must match report), got ${JSON.stringify(marker.fieldCount)}`,
    );
  }
  if (marker.fallbackReason != null && String(marker.fallbackReason).trim()) {
    errors.push(
      `PACKAGE_RUN.fallbackReason must be absent on success, got ${JSON.stringify(marker.fallbackReason)}`,
    );
  }

  const publicHtml = fs.readFileSync(publicAboutPath, "utf8");
  if (publicHtml.includes(productionStop)) {
    errors.push(`public About HTML must not contain production ref ${productionStop}`);
  }
  if (expectedLede && !publicHtml.includes(expectedLede)) {
    errors.push(
      `public About HTML missing expected profile.lede text (build-read overlay / baseline cross-check)`,
    );
  }
  // Prefer report lede when present (proves bake used supabase value even if equal to JSON).
  const reportLede = String(report.profileLedeValueText ?? "").trim();
  if (reportLede && !publicHtml.includes(reportLede)) {
    errors.push("public About HTML missing build report profileLedeValueText");
  }
  // Staging ref may appear in admin only; public static About should not require it,
  // but must not point Contents/production. Soft-check: if supabase URL present, staging only.
  if (publicHtml.includes("supabase.co") && !publicHtml.includes(stagingRef)) {
    errors.push(`public About HTML supabase URL must use staging ref ${stagingRef}`);
  }

  return errors;
}

/**
 * @param {string} html
 * @param {string} attr
 * @returns {string | null}
 */
function matchDataAttr(html, attr) {
  const re = new RegExp(`${attr}="([^"]*)"`, "i");
  const m = html.match(re);
  return m ? m[1] : null;
}
