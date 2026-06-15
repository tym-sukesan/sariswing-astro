/**
 * Static public artifact verification (Phase 3-T).
 * Validates dist/client (or dist) is safe for static FTP after excluding Admin paths.
 */

import fs from "node:fs";
import path from "node:path";
import { scanDirForSecrets } from "./admin-api-auth-verifier.mjs";
import {
  isStagingSubdirBuild,
  readAstroDeployBaseFromConfig,
  verifyAssetPathsIncludeBase,
  verifyPublicDistSeoFlags,
  verifyStagingPreviewHtml,
} from "./deploy-base.mjs";
import { loadExportEnv } from "./supabase-json-exporter.mjs";

/** Always required in gosaki-style static public artifacts. */
export const CORE_PUBLIC_HTML = ["index.html", "discography/index.html"];

/** Manual fixture default month routes (schedule-prefixed). */
export const DEFAULT_GOSAKI_SCHEDULE_MONTHS = [
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];

export const YEAR_MONTH_DIR_RE = /^\d{4}-\d{2}$/;
export const SCHEDULE_PREFIXED_DIR_RE = /^schedule-(\d{4}-\d{2})$/;
export const MONTHLY_SCHEDULE_ROUTE_RE = /^(?:schedule-)?(\d{4}-\d{2})\/index\.html$/;

/** @deprecated Prefer {@link verifyPublicHtmlExists} — includes live-crawl `YYYY-MM/` routes. */
export const EXPECTED_PUBLIC_HTML = [
  ...CORE_PUBLIC_HTML,
  ...DEFAULT_GOSAKI_SCHEDULE_MONTHS.map((ym) => `schedule-${ym}/index.html`),
];

/**
 * @param {string} dirName
 * @returns {string | null}
 */
export function extractYearMonthFromScheduleDir(dirName) {
  if (YEAR_MONTH_DIR_RE.test(dirName)) return dirName;
  const prefixed = dirName.match(SCHEDULE_PREFIXED_DIR_RE);
  return prefixed ? prefixed[1] : null;
}

/**
 * Discover month keys (YYYY-MM) from either `schedule-YYYY-MM/` or `YYYY-MM/` dirs.
 * @param {string} publicDir
 * @returns {string[]}
 */
export function discoverMonthlyScheduleMonths(publicDir) {
  if (!fs.existsSync(publicDir)) return [];
  const months = new Set();
  for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const ym = extractYearMonthFromScheduleDir(entry.name);
    if (ym) months.add(ym);
  }
  return [...months].sort();
}

/**
 * @param {string} publicDir
 * @param {string} yearMonth
 */
export function resolveMonthlySchedulePath(publicDir, yearMonth) {
  const livePath = `${yearMonth}/index.html`;
  const prefixedPath = `schedule-${yearMonth}/index.html`;
  if (fs.existsSync(path.join(publicDir, livePath))) {
    return { path: livePath, exists: true, variant: "live-crawl", yearMonth };
  }
  if (fs.existsSync(path.join(publicDir, prefixedPath))) {
    return { path: prefixedPath, exists: true, variant: "schedule-prefixed", yearMonth };
  }
  return {
    path: prefixedPath,
    alternative: livePath,
    exists: false,
    variant: "missing",
    yearMonth,
  };
}

/**
 * @param {string} relPath
 */
export function isMonthlyScheduleRoute(relPath) {
  return MONTHLY_SCHEDULE_ROUTE_RE.test(relPath.replace(/\\/g, "/"));
}

/** Top-level dirs excluded from static FTP public copy */
export const STATIC_PUBLIC_EXCLUDE_DIRS = ["admin", "api"];

/** Path patterns that must not appear in static public copy */
export const ADMIN_API_PATH_MARKERS = [
  { id: "admin_dir", test: (rel) => rel === "admin" || rel.startsWith("admin/") },
  { id: "api_admin", test: (rel) => rel.includes("api/admin") || rel.startsWith("api/") },
  { id: "me_json", test: (rel) => /(^|\/)me\.json$/i.test(rel) },
  { id: "update_json", test: (rel) => /(^|\/)update\.json$/i.test(rel) },
];

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

/**
 * @param {string} astroDir
 * @param {string | null | undefined} publicDirCli
 */
export function detectPublicDir(astroDir, publicDirCli) {
  if (publicDirCli?.trim()) {
    return path.resolve(publicDirCli);
  }

  const clientDir = path.join(astroDir, "dist", "client");
  if (fs.existsSync(clientDir) && fs.statSync(clientDir).isDirectory()) {
    return clientDir;
  }

  const distDir = path.join(astroDir, "dist");
  if (fs.existsSync(distDir) && fs.statSync(distDir).isDirectory()) {
    return distDir;
  }

  return null;
}

/**
 * @param {string} publicDir
 */
export function detectServerDir(astroDir) {
  const serverDir = path.join(astroDir, "dist", "server");
  if (fs.existsSync(serverDir) && fs.statSync(serverDir).isDirectory()) {
    return serverDir;
  }
  return null;
}

/**
 * @param {string} relativePath POSIX relative path
 */
export function shouldExcludeFromStaticPublic(relativePath) {
  const rel = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const top = rel.split("/")[0];
  if (STATIC_PUBLIC_EXCLUDE_DIRS.includes(top)) {
    return true;
  }
  for (const marker of ADMIN_API_PATH_MARKERS) {
    if (marker.test(rel)) return true;
  }
  return false;
}

/**
 * @param {string} dir
 * @param {(relPath: string, absPath: string) => void} onFile
 * @param {string} [prefix]
 */
function walkDir(dir, onFile, prefix = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(abs, onFile, rel);
      continue;
    }
    onFile(rel.replace(/\\/g, "/"), abs);
  }
}

/**
 * @param {string} publicDir
 */
export function listPublicFiles(publicDir) {
  /** @type {Array<{ rel: string, abs: string }>} */
  const files = [];
  if (!fs.existsSync(publicDir)) return files;
  walkDir(publicDir, (rel, abs) => files.push({ rel, abs }));
  return files;
}

/**
 * @param {string} publicDir
 */
export function verifyPublicHtmlExists(publicDir) {
  /** @type {Array<{ path: string, exists: boolean, kind?: string, yearMonth?: string, variant?: string, alternative?: string | null, acceptedVariants?: string[] }>} */
  const checks = [];

  for (const rel of CORE_PUBLIC_HTML) {
    checks.push({
      path: rel,
      exists: fs.existsSync(path.join(publicDir, rel)),
      kind: "core",
    });
  }

  const discovered = discoverMonthlyScheduleMonths(publicDir);
  const months = discovered.length > 0 ? discovered : DEFAULT_GOSAKI_SCHEDULE_MONTHS;

  for (const ym of months) {
    const resolved = resolveMonthlySchedulePath(publicDir, ym);
    checks.push({
      path: resolved.path,
      exists: resolved.exists,
      kind: "monthly-schedule",
      yearMonth: ym,
      variant: resolved.variant,
      alternative: resolved.alternative ?? null,
      acceptedVariants: [`${ym}/index.html`, `schedule-${ym}/index.html`],
    });
  }

  return checks;
}

/**
 * @param {string} publicDir
 */
export function scanAdminApiContamination(publicDir) {
  const files = listPublicFiles(publicDir);
  /** @type {Array<{ rel: string, marker: string }>} */
  const hits = [];

  for (const file of files) {
    for (const marker of ADMIN_API_PATH_MARKERS) {
      if (marker.test(file.rel)) {
        hits.push({ rel: file.rel, marker: marker.id });
      }
    }
  }

  const adminHtmlInClient = hits.filter((h) => h.marker === "admin_dir");
  const apiInClient = hits.filter((h) => h.marker !== "admin_dir");

  return {
    contaminated: hits.length > 0,
    hits,
    adminHtmlInClient,
    apiInClient,
    adminDirExists: fs.existsSync(path.join(publicDir, "admin")),
  };
}

/**
 * @param {string} dir
 * @param {string[]} secretValues
 */
export function scanPublicDirForSecrets(dir, secretValues) {
  const secrets = secretValues.filter((s) => s && s.length >= 12);
  const hits = scanDirForSecrets(dir, secrets);
  return {
    ok: hits.length === 0,
    hitCount: hits.length,
    files: hits.map((h) => path.relative(dir, h.file)),
  };
}

/**
 * @param {string} dir
 */
export function scanSupabaseKeyExposure(dir) {
  const files = listPublicFiles(dir);
  /** @type {Array<{ file: string, kind: string }>} */
  const findings = [];

  for (const { rel, abs } of files) {
    if (!/\.(html|js|css|json|mjs|txt|xml)$/i.test(rel)) continue;
    const content = fs.readFileSync(abs, "utf8");

    if (JWT_LIKE.test(content)) {
      findings.push({ file: rel, kind: "jwt_like_token" });
    }

    if (/createClient\s*\(\s*['"]https:\/\/[^'"]+\.supabase\.co['"]\s*,\s*['"]eyJ/i.test(content)) {
      findings.push({ file: rel, kind: "supabase_client_with_inline_key" });
    }
  }

  return {
    publicStaticDoesNotNeedSupabaseKeys: findings.length === 0,
    findings,
  };
}

/**
 * @param {string} sourceDir
 * @param {string} destDir
 */
export function copyStaticPublicArtifact(sourceDir, destDir) {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  const copied = [];
  const excluded = [];

  for (const file of listPublicFiles(sourceDir)) {
    if (shouldExcludeFromStaticPublic(file.rel)) {
      excluded.push(file.rel);
      continue;
    }

    const dest = path.join(destDir, file.rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file.abs, dest);
    copied.push(file.rel);
  }

  return {
    copiedFiles: copied,
    copiedCount: copied.length,
    excluded: [...new Set(excluded.map((rel) => rel.split("/")[0]))].sort(),
    excludedPaths: excluded,
  };
}

/**
 * @param {string} toolRoot
 */
export function loadOptionalSecretsForScan(toolRoot) {
  try {
    const env = loadExportEnv(toolRoot);
    const raw = fs.readFileSync(path.join(toolRoot, ".env.local"), "utf8");
    let adminPassword = null;
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (key === "SUPABASE_ADMIN_PASSWORD" && val) adminPassword = val;
    }
    return {
      serviceRoleKey: env.serviceRoleKey,
      anonKey: env.anonKey ?? null,
      adminPassword,
    };
  } catch {
    return { serviceRoleKey: null, anonKey: null, adminPassword: null };
  }
}

/**
 * @param {{ astroDir: string, toolRoot: string, publicDirCli?: string | null, manifestOutDir?: string | null }} opts
 */
export function runStaticPublicArtifactVerification({
  astroDir,
  toolRoot,
  publicDirCli = null,
  manifestOutDir = null,
}) {
  const astroAbs = path.resolve(astroDir);
  const publicDir = detectPublicDir(astroAbs, publicDirCli);
  const serverDir = detectServerDir(astroAbs);

  const result = {
    astroDir: astroAbs,
    publicDir,
    publicDirKind: publicDir?.endsWith(`${path.sep}client`) ? "dist/client" : publicDir ? "dist" : null,
    serverDir,
    publicDirExists: Boolean(publicDir && fs.existsSync(publicDir)),
    publicHtml: null,
    rawClientContamination: null,
    serverArtifact: null,
    keyLeakScan: null,
    supabaseKeyScan: null,
    staticPublicCopy: null,
    manifest: null,
    safeForStaticFtp: false,
    directClientUploadRecommended: false,
    errors: [],
    passed: false,
  };

  if (!result.publicDirExists || !publicDir) {
    result.errors.push("public dir not found (expected dist/client or dist)");
    return result;
  }

  result.publicHtml = {
    checks: verifyPublicHtmlExists(publicDir),
    allPresent: verifyPublicHtmlExists(publicDir).every((c) => c.exists),
  };

  if (!result.publicHtml.allPresent) {
    result.errors.push("missing expected public HTML files");
  }

  result.rawClientContamination = scanAdminApiContamination(publicDir);

  result.serverArtifact = {
    exists: Boolean(serverDir),
    path: serverDir,
    note: serverDir
      ? "dist/server is for Node host (Admin/API SSR). Do NOT upload to static FTP."
      : null,
    entryExists: serverDir ? fs.existsSync(path.join(serverDir, "entry.mjs")) : false,
  };

  const secrets = loadOptionalSecretsForScan(toolRoot);
  const secretValues = [secrets.serviceRoleKey, secrets.adminPassword, secrets.anonKey].filter(Boolean);
  result.keyLeakScanRaw = scanPublicDirForSecrets(publicDir, secretValues);
  result.keyLeakScan = result.keyLeakScanRaw;

  result.supabaseKeyScanRaw = scanSupabaseKeyExposure(publicDir);

  const outBase =
    manifestOutDir ??
    path.join(toolRoot, "output", "static-public", "gosaki");
  const publicDistDir = path.join(outBase, "public-dist");
  const manifestPath = path.join(outBase, "static-public-manifest.json");

  result.staticPublicCopy = copyStaticPublicArtifact(publicDir, publicDistDir);

  const deployBase = readAstroDeployBaseFromConfig(astroAbs);
  result.deployBaseCheck = verifyAssetPathsIncludeBase(publicDistDir, deployBase);
  result.seoFlags = verifyPublicDistSeoFlags(publicDistDir, deployBase);
  result.stagingPreview = verifyStagingPreviewHtml(publicDistDir, deployBase);

  const copyContamination = scanAdminApiContamination(publicDistDir);
  const copyKeyLeak = scanPublicDirForSecrets(publicDistDir, secretValues);
  const copySupabaseScan = scanSupabaseKeyExposure(publicDistDir);

  result.keyLeakScanCopy = copyKeyLeak;
  result.supabaseKeyScanCopy = copySupabaseScan;
  result.supabaseKeyScan = copySupabaseScan;

  result.manifest = {
    source: path.relative(toolRoot, publicDir).replace(/\\/g, "/"),
    publicDist: path.relative(toolRoot, publicDistDir).replace(/\\/g, "/"),
    copiedFiles: result.staticPublicCopy.copiedCount,
    excluded: result.staticPublicCopy.excluded,
    excludedPathsSample: result.staticPublicCopy.excludedPaths.slice(0, 8),
    deployBase,
    stagingSubdirBuild: isStagingSubdirBuild(deployBase),
    assetPathsIncludeBase: result.deployBaseCheck.assetPathsIncludeBase,
    deployBaseCheckOk: result.deployBaseCheck.ok,
    stagingNoindex: result.seoFlags.stagingNoindex,
    robotsDisallowAll: result.seoFlags.robotsDisallowAll,
    productionIndexable: result.seoFlags.productionIndexable,
    canonicalMode: result.seoFlags.canonicalMode,
    seoFlagsOk: result.seoFlags.ok,
    stagingPreviewOk: result.stagingPreview.ok,
    canonicalDoesNotContainProductionHost:
      result.stagingPreview.canonicalDoesNotContainProductionHost,
    canonicalDoesNotDuplicateDeployBase: result.stagingPreview.canonicalDoesNotDuplicateDeployBase,
    ogUrlDoesNotContainProductionHost: result.stagingPreview.ogUrlDoesNotContainProductionHost,
    navHomeRewritten: result.stagingPreview.navHomeRewritten,
    internalLinksRewritten: result.stagingPreview.internalLinksRewritten,
    safeForStaticFtp:
      result.publicHtml.allPresent &&
      !copyContamination.contaminated &&
      copyKeyLeak.ok &&
      copySupabaseScan.publicStaticDoesNotNeedSupabaseKeys &&
      result.deployBaseCheck.ok &&
      result.seoFlags.ok &&
      result.stagingPreview.ok,
    rawClientHasAdminHtml: result.rawClientContamination.adminDirExists,
    directClientUploadRecommended: !result.rawClientContamination.contaminated,
    note: result.rawClientContamination.adminDirExists
      ? "Do not upload dist/client directly to FTP. Use static-public/public-dist (admin excluded)."
      : "dist/client may be uploaded to static FTP if no admin/api paths present.",
  };

  result.safeForStaticFtp = result.manifest.safeForStaticFtp;
  result.directClientUploadRecommended = result.manifest.directClientUploadRecommended;

  fs.mkdirSync(outBase, { recursive: true });
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(result.manifest, null, 2)}\n`,
    "utf8",
  );
  result.manifestPath = manifestPath;

  if (copyContamination.contaminated) {
    result.errors.push("excluded copy still contains admin/api paths");
  }
  if (!copyKeyLeak.ok) {
    result.errors.push("secret leak in static-public copy");
  }
  if (!copySupabaseScan.publicStaticDoesNotNeedSupabaseKeys) {
    result.errors.push("supabase keys or client code found in static-public copy");
  }
  if (!result.deployBaseCheck.ok) {
    result.errors.push(
      result.deployBaseCheck.reason ??
        `deploy base paths missing in public-dist (deployBase=${deployBase})`,
    );
  }
  if (!result.seoFlags.ok) {
    result.errors.push(
      result.seoFlags.stagingBuild
        ? "staging SEO flags incomplete (expected noindex meta + robots Disallow: /)"
        : "production SEO flags incomplete (expected no noindex meta + robots Allow: /)",
    );
  }
  if (!result.stagingPreview.ok) {
    result.errors.push(
      result.stagingPreview.reason ?? "staging preview HTML checks failed (canonical / nav links)",
    );
  }

  result.passed =
    result.publicDirExists &&
    result.publicHtml.allPresent &&
    result.keyLeakScanRaw.ok &&
    copyKeyLeak.ok &&
    copySupabaseScan.publicStaticDoesNotNeedSupabaseKeys &&
    result.safeForStaticFtp &&
    result.errors.length === 0;

  return result;
}

/**
 * @param {object} result
 * @param {{ reportPath: string, elapsedMs: number }} meta
 */
export function formatStaticPublicArtifactReport(result, { reportPath, elapsedMs }) {
  const lines = [
    "# Static Public Artifact Report (Phase 3-T)",
    "",
    `- **Result:** ${result.passed ? "PASS" : "FAIL"}`,
    `- **Astro dir:** \`${result.astroDir}\``,
    `- **Public dir detected:** \`${result.publicDir ?? "—"}\` (${result.publicDirKind ?? "—"})`,
    `- **safeForStaticFtp (after exclude copy):** ${result.safeForStaticFtp ? "true" : "false"}`,
    `- **deployBase:** \`${result.manifest?.deployBase ?? "—"}\``,
    `- **stagingSubdirBuild:** ${result.manifest?.stagingSubdirBuild ? "yes" : "no"}`,
    `- **asset paths include base:** ${result.manifest?.assetPathsIncludeBase ? "yes" : "no"}`,
    `- **stagingNoindex:** ${result.manifest?.stagingNoindex ? "yes" : "no"}`,
    `- **robotsDisallowAll:** ${result.manifest?.robotsDisallowAll ? "yes" : "no"}`,
    `- **productionIndexable:** ${result.manifest?.productionIndexable ? "yes" : "no"}`,
    `- **canonicalMode:** ${result.manifest?.canonicalMode ?? "—"}`,
    `- **Direct dist/client FTP upload recommended:** ${result.directClientUploadRecommended ? "yes" : "no"}`,
    "",
    "## Build output layout",
    "",
    "| Path | Role | FTP upload? |",
    "| --- | --- | --- |",
    "| `dist/client/` | Prerendered static HTML/CSS/assets | Partial — **admin HTML may be included** |",
    "| `dist/server/` | Node SSR + `/api/admin/*` routes | **No** — Node host only |",
    "",
  ];

  if (result.serverArtifact?.exists) {
    lines.push(
      "### Server artifact",
      "",
      `- **dist/server exists:** yes`,
      `- **entry.mjs:** ${result.serverArtifact.entryExists ? "yes" : "no"}`,
      `- ${result.serverArtifact.note}`,
      "",
    );
  }

  lines.push("## Public HTML", "");
  for (const check of result.publicHtml?.checks ?? []) {
    lines.push(`- \`${check.path}\`: ${check.exists ? "OK" : "MISSING"}`);
  }
  lines.push("");

  lines.push("## Admin/API contamination (raw public dir)", "");
  if (result.rawClientContamination?.contaminated) {
    lines.push(
      `- **Admin HTML in dist/client:** ${result.rawClientContamination.adminDirExists ? "yes — IMPORTANT" : "no"}`,
      `- **Finding:** Hybrid build prerenders Admin pages into \`dist/client/admin/\`.`,
      `- **Recommendation:** Use \`static-public/public-dist\` (admin excluded) for FTP, not raw \`dist/client\`.`,
      "",
      "Sample contaminated paths:",
    );
    for (const hit of result.rawClientContamination.hits.slice(0, 10)) {
      lines.push(`- \`${hit.rel}\` (${hit.marker})`);
    }
    lines.push("");
  } else {
    lines.push("- No admin/api paths in raw public dir.", "");
  }

  lines.push("## Static-public copy", "");
  if (result.staticPublicCopy) {
    lines.push(
      `- **Copied files:** ${result.staticPublicCopy.copiedCount}`,
      `- **Excluded top-level:** ${result.staticPublicCopy.excluded.join(", ") || "—"}`,
      `- **Output:** \`${result.manifest?.publicDist ?? "—"}\``,
      "",
    );
  }

  lines.push("## Key leak scan (raw public dir)", "");
  lines.push(
    `- **OK:** ${result.keyLeakScan?.ok ? "yes" : "no"}`,
    `- **Hits:** ${result.keyLeakScan?.hitCount ?? 0}`,
    "",
  );

  lines.push("## Supabase keys in public static artifact", "");
  lines.push(
    `- **Public site needs Supabase keys (public-dist copy):** ${result.supabaseKeyScanCopy?.publicStaticDoesNotNeedSupabaseKeys ? "no (expected — data from JSON at build time)" : "review required"}`,
    `- **Findings in public-dist:** ${result.supabaseKeyScanCopy?.findings?.length ?? 0}`,
    `- **Findings in raw dist/client (incl. admin HTML):** ${result.supabaseKeyScanRaw?.findings?.length ?? 0}`,
    "",
  );

  if (result.manifest) {
    lines.push("## Manifest", "", "```json", JSON.stringify(result.manifest, null, 2), "```", "");
  }

  if (result.errors.length) {
    lines.push("## Errors", "", ...result.errors.map((e) => `- ${e}`), "");
  }

  lines.push(
    "## Hosting guidance",
    "",
    "- **Public site:** upload `static-public/.../public-dist/` to Lolipop FTP (or raw `dist/client/` only if no admin paths).",
    "- **Admin/API:** run on Node host or local dev; `/api/admin/*` does not work on static FTP.",
    "",
    "---",
    `Elapsed: ${elapsedMs}ms`,
    `Report: \`${reportPath}\``,
    "",
  );

  return lines.join("\n");
}
