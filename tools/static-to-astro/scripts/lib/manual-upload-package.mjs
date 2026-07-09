/**
 * Manual staging upload package builder (G-7g / G-20t3).
 * No FTP connection — copies public-dist locally and writes operator docs.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeDeployBase, verifyPublicDistCssPresence } from "./deploy-base.mjs";
import {
  detectGosakiReadOnlyAdminInPublicDir,
  listPublicFiles,
} from "./static-public-artifact-verifier.mjs";
import { isUnsafeIntendedRemotePath, resolveSourceCommit, sanitizeProductionPublicDistSitemaps } from "./package-upload-safety.mjs";

function resolveStaticPublicManifestPath(publicDir) {
  const abs = path.resolve(publicDir);
  return path.join(path.dirname(abs), "static-public-manifest.json");
}

/**
 * @param {string} publicDistDir
 */
export function loadStaticPublicManifest(publicDistDir) {
  const manifestPath = resolveStaticPublicManifestPath(publicDistDir);
  if (!fs.existsSync(manifestPath)) {
    return { ok: false, manifestPath, manifest: null, error: "static-public-manifest.json not found" };
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return { ok: true, manifestPath, manifest, error: null };
  } catch (err) {
    return { ok: false, manifestPath, manifest: null, error: `failed to parse manifest: ${err.message}` };
  }
}

/**
 * @param {string} publicDistDir
 * @param {{ targetEnvironment?: "staging"|"production" }} [opts]
 */
export function validatePublicDistForManualUpload(publicDistDir, opts = {}) {
  /** @type {string[]} */
  const errors = [];
  const abs = path.resolve(publicDistDir);
  const targetEnvironment = opts.targetEnvironment ?? "staging";

  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    return { ok: false, errors: ["public-dist does not exist or is not a directory"], fileCount: 0 };
  }

  const files = listPublicFiles(abs);
  if (files.length === 0) errors.push("public-dist has no files");
  if (!fs.existsSync(path.join(abs, "index.html"))) errors.push("index.html missing");

  const manifestState = loadStaticPublicManifest(abs);
  if (!manifestState.ok) {
    errors.push(manifestState.error);
  } else if (!manifestState.manifest?.safeForStaticFtp) {
    errors.push("safeForStaticFtp is not true in static-public-manifest.json");
  }

  const adminPresent = fs.existsSync(path.join(abs, "admin"));
  if (targetEnvironment === "production") {
    if (adminPresent) errors.push("admin/ must not exist in production public-dist");
    if (fs.existsSync(path.join(abs, "__admin-staging-shell"))) {
      errors.push("__admin-staging-shell/ must not exist in production public-dist");
    }
  } else if (adminPresent) {
    if (!detectGosakiReadOnlyAdminInPublicDir(abs)) {
      errors.push("admin/ must not exist in public-dist (unless Gosaki read-only admin G-11b)");
    }
  }

  if (fs.existsSync(path.join(abs, "api"))) errors.push("api/ must not exist in public-dist");

  const cssPresence = verifyPublicDistCssPresence(
    abs,
    manifestState.manifest?.deployBase ?? "/cms-kit-staging/gosaki-piano/",
  );
  if (!cssPresence.ok) {
    errors.push(cssPresence.reason ?? "public-dist CSS presence check failed");
  }

  return {
    ok: errors.length === 0,
    errors,
    fileCount: files.length,
    files,
    manifest: manifestState.manifest,
    manifestPath: manifestState.manifestPath,
    cssPresence,
    adminPresent,
  };
}

/**
 * @param {{
 *   siteSlug: string,
 *   deployBase: string,
 *   stagingUrl?: string,
 *   publicBaseUrl?: string,
 *   sourcePublicDist: string,
 *   fileCount: number,
 *   safeForStaticFtp: boolean,
 *   cssPresenceOk?: boolean,
 *   targetEnvironment?: "staging"|"production",
 *   packageProfileName?: string,
 *   intendedRemotePath?: string,
 *   sourceCommit?: string | null,
 *   includesAdmin?: boolean,
 *   includeGosakiReadOnlyAdmin?: boolean,
 *   siteKey?: string,
 *   cmsSiteSlug?: string,
 *   supabaseSiteSlug?: string,
 *   packageKey?: string,
 * }} meta
 */
export function buildManualUploadManifest(meta) {
  const deployBase = normalizeDeployBase(meta.deployBase);
  const publicBaseUrl = (meta.publicBaseUrl ?? meta.stagingUrl ?? "").replace(/\/$/, "") + "/";
  const intendedRemotePath = meta.intendedRemotePath ?? deployBase;
  const targetEnvironment = meta.targetEnvironment ?? "staging";
  const packageProfileName =
    meta.packageProfileName ?? (targetEnvironment === "production" ? "production" : "staging");
  const includesAdmin =
    meta.includesAdmin === true ||
    (meta.includeGosakiReadOnlyAdmin === true && targetEnvironment !== "production");

  const manifest = {
    phase: "G-20t3-package-upload-safety-hardening",
    siteSlug: meta.siteSlug,
    siteKey: meta.siteKey ?? null,
    cmsSiteSlug: meta.cmsSiteSlug ?? null,
    supabaseSiteSlug: meta.supabaseSiteSlug ?? meta.siteSlug ?? null,
    packageKey: meta.packageKey ?? meta.siteSlug ?? null,
    packageProfileName,
    targetEnvironment,
    deployBase,
    stagingUrl: publicBaseUrl,
    publicBaseUrl,
    intendedRemotePath,
    source: meta.sourcePublicDist.replace(/\\/g, "/"),
    sourceCommit: meta.sourceCommit ?? null,
    fileCount: meta.fileCount,
    generatedAt: new Date().toISOString(),
    ftpAutoDeployUsed: false,
    safeForStaticFtp: meta.safeForStaticFtp,
    cssPresenceOk: meta.cssPresenceOk === true,
    includesAdmin,
    uploadTarget: intendedRemotePath,
    uploadContents: "public-dist/ contents only (not the public-dist folder itself)",
    includeGosakiReadOnlyAdmin: includesAdmin,
    adminExcludedFromPackage: !includesAdmin,
  };

  return manifest;
}

/**
 * @param {{
 *   deployBase: string,
 *   stagingUrl?: string,
 *   publicBaseUrl?: string,
 *   siteSlug: string,
 *   targetEnvironment?: "staging"|"production",
 *   packageProfileName?: string,
 *   intendedRemotePath?: string,
 *   includesAdmin?: boolean,
 *   zipName?: string,
 *   sourceCommit?: string | null,
 *   generatedAt?: string | null,
 * }} opts
 */
export function formatReadmeUpload(opts) {
  const base = normalizeDeployBase(opts.deployBase);
  const url = (opts.publicBaseUrl ?? opts.stagingUrl ?? "").replace(/\/$/, "") + "/";
  const targetEnvironment = opts.targetEnvironment ?? "staging";
  const packageProfileName = opts.packageProfileName ?? targetEnvironment;
  const intendedRemotePath = opts.intendedRemotePath ?? base;
  const includesAdmin = opts.includesAdmin === true;
  const zipName = opts.zipName ?? `${opts.siteSlug}-manual-upload.zip`;
  const isProduction = targetEnvironment === "production";

  const environmentLabel = isProduction ? "production" : "staging";
  const adminLine = includesAdmin
    ? `${base}admin/          (G-11b read-only CMS — staging only)`
    : `${base}admin/          (must NOT exist in this package)`;

  const postUploadChecks = isProduction
    ? `- ${url}
- ${url}about/
- ${url}contact/
- ${url}schedule/
- ${url}robots.txt
- ${url}sitemap-index.xml

Check: HTTP 200, **no** noindex on public pages, canonical / og:url use **www.gosaki-piano.com**.`
    : `- ${url}
- ${url}about/
- ${url}contact/
- ${url}2026-07/
- ${url}robots.txt
${includesAdmin ? `- ${url}admin/ (read-only CMS, G-11b)` : ""}

Check: HTTP 200, noindex, canonical / og:url use staging host, Nav Home → staging path.`;

  const profileWarning = isProduction
    ? `**PRODUCTION package** (\`${packageProfileName}\`) — do **not** upload to staging path \`/cms-kit-staging/\`.`
    : `**STAGING package** (\`${packageProfileName}\`) — do **not** upload to production root \`/\` or www.gosaki-piano.com document root until cutover is approved.`;

  return `# Manual ${environmentLabel} upload — ${opts.siteSlug}

${profileWarning}

This package is for **manual FTP upload only**. Do **not** use automated FTP deploy scripts, mirror, sync, or CLI FTP tools.

## Package identity (verify before upload)

| Field | Value |
| --- | --- |
| \`packageProfileName\` | \`${packageProfileName}\` |
| \`targetEnvironment\` | \`${targetEnvironment}\` |
| \`includesAdmin\` | \`${includesAdmin}\` |
| \`intendedRemotePath\` | \`${intendedRemotePath}\` |
| \`publicBaseUrl\` | \`${url}\` |
| \`generatedAt\` | \`${opts.generatedAt ?? "(see MANIFEST.json)"}\` |
| \`sourceCommit\` | \`${opts.sourceCommit ?? "(see MANIFEST.json)"}\` |

## Freshness gate (G-20t6) — run before FTP upload

**STOP** if \`sourceCommit\` in \`MANIFEST.json\` does not match current git HEAD.

\`\`\`bash
cd tools/static-to-astro
npm run verify:package-freshness:${packageProfileName === "production" ? "production" : "staging"}
\`\`\`

- **PASS** → package was built at current HEAD; upload may proceed (other safety gates still apply)
- **STOP** → stale package; regen with \`build-gosaki-${packageProfileName === "production" ? "production" : "staging-admin"}-package.mjs\` first

Open \`MANIFEST.json\` and confirm \`generatedAt\` is recent enough for this release.

## What this is

- A local copy of \`public-dist/\` ready for FileZilla or Lolipop FTP manual upload
- **FTP auto-deploy is disabled** after the G-7f incident — operator uploads by hand

## Upload destination (remote path)

\`\`\`txt
${intendedRemotePath}
\`\`\`

**STOP** if remote path is empty, account root \`/\`, \`./\`, or still marked \`TBD\`.

## What to upload

Upload the **contents** of the \`public-dist/\` folder in this package — **not** the \`public-dist\` folder itself.

## Correct layout on server

\`\`\`txt
${base}index.html
${base}about/
${base}contact/
${base}discography/
${base}schedule/
${base}robots.txt
${base}sitemap-0.xml
${base}sitemap-index.xml
${adminLine}
\`\`\`

## Wrong layout (do NOT do this)

\`\`\`txt
${base}public-dist/index.html
${base}public-dist/about/
\`\`\`

## Safety rules

- Open \`${intendedRemotePath}\` in FTP before uploading — **confirm you are NOT at account root \`/\`** unless this is an approved production cutover
- Do **not** delete existing root or other folders
- Do **not** use mirror / sync / delete-remote-extras / \`mirror --delete\` in FileZilla or lftp
- Do **not** use command-line FTP or automated deploy scripts
- Overwrite existing files in the target path only — no delete-sync
- Do **not** mix staging and production packages — check \`MANIFEST.json\` \`targetEnvironment\`
- Visually confirm remote path before upload

## After upload — verify these URLs

${postUploadChecks}

## Package files

| File | Purpose |
|------|---------|
| \`public-dist/\` | Files to upload (contents only) |
| \`CHECKLIST.md\` | Before/after checklist |
| \`MANIFEST.json\` | Package metadata — **read first** |
| \`${zipName}\` | Same package archived |
`;
}

/**
 * @param {{
 *   deployBase: string,
 *   publicBaseUrl?: string,
 *   stagingUrl?: string,
 *   targetEnvironment?: "staging"|"production",
 *   packageProfileName?: string,
 *   intendedRemotePath?: string,
 *   includesAdmin?: boolean,
 *   sourceCommit?: string | null,
 *   generatedAt?: string | null,
 * }} opts
 */
export function formatUploadChecklist(opts) {
  const base = normalizeDeployBase(opts.deployBase);
  const url = (opts.publicBaseUrl ?? opts.stagingUrl ?? "").replace(/\/$/, "") + "/";
  const targetEnvironment = opts.targetEnvironment ?? "staging";
  const packageProfileName = opts.packageProfileName ?? targetEnvironment;
  const intendedRemotePath = opts.intendedRemotePath ?? base;
  const includesAdmin = opts.includesAdmin === true;
  const isProduction = targetEnvironment === "production";
  const remotePathUnsafe = isUnsafeIntendedRemotePath(intendedRemotePath);

  const manifestChecks = `- [ ] Open \`MANIFEST.json\`
- [ ] \`targetEnvironment\` is **${targetEnvironment}** (not ${isProduction ? "staging" : "production"})
- [ ] \`packageProfileName\` is **${packageProfileName}**
- [ ] \`includesAdmin\` is **${includesAdmin}**${isProduction ? " — production must be false" : ""}
- [ ] \`generatedAt\` is **${opts.generatedAt ?? "(check MANIFEST)"}** — recent enough for this release
- [ ] \`sourceCommit\` is **${opts.sourceCommit ?? "(check MANIFEST)"}**
- [ ] Run freshness preflight: \`npm run verify:package-freshness:${isProduction ? "production" : "staging"}\` → **PASS**
- [ ] **STOP** if sourceCommit !== current git HEAD (stale package)
- [ ] \`safeForStaticFtp\` is **true**
- [ ] \`ftpAutoDeployUsed\` is **false**`;

  const remoteChecks = remotePathUnsafe
    ? `- [ ] **STOP** — \`intendedRemotePath\` is \`${intendedRemotePath}\` (unsafe / TBD). Do not upload until path is confirmed.`
    : `- [ ] Navigate to remote path: \`${intendedRemotePath}\`
- [ ] Confirm you are **NOT** at the wrong environment path
- [ ] ${isProduction ? "Confirm this is the approved production document root — not staging" : "Confirm path is under `/cms-kit-staging/` — not production root"}`;

  const afterUpload = isProduction
    ? `- [ ] Top page HTTP 200 — ${url}
- [ ] \`/about/\` HTTP 200
- [ ] \`/schedule/\` HTTP 200
- [ ] \`robots.txt\` references production sitemap
- [ ] HTML pages have **no** noindex
- [ ] canonical / og:url use **www.gosaki-piano.com** (not staging host)
- [ ] \`/admin/\` returns 404 (production must not expose admin)`
    : `- [ ] Top page HTTP 200 — staging URL root
- [ ] \`/about/\` HTTP 200
- [ ] \`/contact/\` HTTP 200
- [ ] \`/schedule/\` HTTP 200
- [ ] \`robots.txt\` HTTP 200
- [ ] noindex meta present on HTML pages
- [ ] canonical / og:url use staging host (not gosaki-piano.com)
- [ ] Nav Home links to staging path under \`${base}\``;

  return `# Manual upload checklist — ${packageProfileName}

## Before upload — manifest

${manifestChecks}

## Before upload — remote path & package mix-up prevention

${remoteChecks}
- [ ] This folder is the **${targetEnvironment}** package — not ${isProduction ? "staging `gosaki-piano/`" : "production `gosaki-piano-production/`"}
- [ ] Select **contents** of local \`public-dist/\` (not the \`public-dist\` folder itself)
- [ ] Do **not** use mirror / sync / delete-remote-extras / CLI FTP
- [ ] Overwrite is OK; delete-sync is **not** OK
- [ ] Do not delete unrelated remote folders

## After upload

${afterUpload}

## If something looks wrong

- Stop immediately
- Do not retry with mirror/delete
- Do not clean up remote root
- Record what you see and ask before further changes
`;
}

/**
 * @param {string} srcDir
 * @param {string} destDir
 */
export function copyPublicDistRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.cpSync(path.resolve(srcDir), path.resolve(destDir), { recursive: true });
}

/**
 * @param {string} packageDir
 * @param {string} zipPath
 * @param {string[]} entries
 */
export function createZipArchive(packageDir, zipPath, entries) {
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const zipName = path.basename(zipPath);
  const result = spawnSync(
    "zip",
    ["-r", zipName, ...entries],
    { cwd: packageDir, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );

  if (result.status !== 0) {
    throw new Error(`zip failed (exit ${result.status}): ${result.stderr || result.stdout}`);
  }

  if (!fs.existsSync(zipPath)) {
    throw new Error(`zip not created at ${zipPath}`);
  }

  return zipPath;
}

/**
 * @param {string} siteSlug
 * @param {string} packageProfileName
 */
export function resolvePackageZipName(siteSlug, packageProfileName) {
  if (packageProfileName === "production") {
    return `${siteSlug}-production-manual-upload.zip`;
  }
  return `${siteSlug}-manual-upload.zip`;
}

/**
 * @param {object} opts
 */
export function createManualUploadPackage(opts) {
  const {
    publicDistDir,
    outDir,
    siteSlug,
    deployBase,
    stagingUrl,
    publicBaseUrl,
    toolRoot,
    repoRoot,
    includeGosakiReadOnlyAdmin,
    targetEnvironment = "staging",
    packageProfileName,
    intendedRemotePath,
    siteKey,
    cmsSiteSlug,
    supabaseSiteSlug,
    packageKey,
  } = opts;

  const profileName =
    packageProfileName ?? (targetEnvironment === "production" ? "production" : "staging");

  const validation = validatePublicDistForManualUpload(publicDistDir, { targetEnvironment });
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, packageDir: null };
  }

  const includesAdmin =
    targetEnvironment === "production"
      ? false
      : includeGosakiReadOnlyAdmin === true ||
        (includeGosakiReadOnlyAdmin !== false && validation.adminPresent === true);

  const packageDir = path.resolve(outDir);
  const publicDistOut = path.join(packageDir, "public-dist");
  const readmePath = path.join(packageDir, "README-UPLOAD.md");
  const checklistPath = path.join(packageDir, "CHECKLIST.md");
  const manifestPath = path.join(packageDir, "MANIFEST.json");
  const zipName = resolvePackageZipName(siteSlug, profileName);
  const zipPath = path.join(packageDir, zipName);

  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });

  copyPublicDistRecursive(publicDistDir, publicDistOut);

  if (targetEnvironment === "production") {
    sanitizeProductionPublicDistSitemaps(publicDistOut);
  }

  const sourceRel = path
    .relative(repoRoot, path.resolve(publicDistDir))
    .replace(/\\/g, "/");

  const resolvedIntendedRemotePath = intendedRemotePath ?? normalizeDeployBase(deployBase);
  const resolvedPublicBaseUrl = publicBaseUrl ?? stagingUrl ?? "";

  const manifest = buildManualUploadManifest({
    siteSlug,
    siteKey,
    cmsSiteSlug,
    supabaseSiteSlug,
    packageKey,
    deployBase,
    stagingUrl,
    publicBaseUrl: resolvedPublicBaseUrl,
    sourcePublicDist: sourceRel,
    fileCount: validation.fileCount,
    safeForStaticFtp: Boolean(validation.manifest?.safeForStaticFtp),
    cssPresenceOk: validation.cssPresence?.ok === true,
    targetEnvironment,
    packageProfileName: profileName,
    intendedRemotePath: resolvedIntendedRemotePath,
    sourceCommit: resolveSourceCommit(repoRoot),
    includesAdmin,
    includeGosakiReadOnlyAdmin: includesAdmin,
  });

  const docOpts = {
    deployBase,
    stagingUrl,
    publicBaseUrl: resolvedPublicBaseUrl,
    siteSlug,
    targetEnvironment,
    packageProfileName: profileName,
    intendedRemotePath: resolvedIntendedRemotePath,
    includesAdmin,
    zipName,
    sourceCommit: manifest.sourceCommit,
    generatedAt: manifest.generatedAt,
  };

  fs.writeFileSync(readmePath, formatReadmeUpload(docOpts), "utf8");
  fs.writeFileSync(checklistPath, formatUploadChecklist(docOpts), "utf8");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  createZipArchive(packageDir, zipPath, [
    "public-dist",
    "README-UPLOAD.md",
    "CHECKLIST.md",
    "MANIFEST.json",
  ]);

  return {
    ok: true,
    errors: [],
    packageDir,
    publicDistOut,
    readmePath,
    checklistPath,
    manifestPath,
    zipPath,
    zipName,
    manifest,
    validation,
    toolRoot,
  };
}
