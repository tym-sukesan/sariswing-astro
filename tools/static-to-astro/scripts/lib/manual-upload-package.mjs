/**
 * Manual staging upload package builder (G-7g).
 * No FTP connection — copies public-dist locally and writes operator docs.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeDeployBase, verifyPublicDistCssPresence } from "./deploy-base.mjs";
import {
  listPublicFiles,
} from "./static-public-artifact-verifier.mjs";

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
 */
export function validatePublicDistForManualUpload(publicDistDir) {
  /** @type {string[]} */
  const errors = [];
  const abs = path.resolve(publicDistDir);

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

  if (fs.existsSync(path.join(abs, "admin"))) errors.push("admin/ must not exist in public-dist");
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
  };
}

/**
 * @param {{
 *   siteSlug: string,
 *   deployBase: string,
 *   stagingUrl: string,
 *   sourcePublicDist: string,
 *   fileCount: number,
 *   safeForStaticFtp: boolean,
 *   cssPresenceOk?: boolean,
 * }} meta
 */
export function buildManualUploadManifest(meta) {
  return {
    phase: "G-7i-gosaki-staging-visual-polish-and-wix-css-behavior-fix",
    siteSlug: meta.siteSlug,
    deployBase: normalizeDeployBase(meta.deployBase),
    stagingUrl: meta.stagingUrl.replace(/\/$/, "") + "/",
    source: meta.sourcePublicDist.replace(/\\/g, "/"),
    fileCount: meta.fileCount,
    generatedAt: new Date().toISOString(),
    ftpAutoDeployUsed: false,
    safeForStaticFtp: meta.safeForStaticFtp,
    cssPresenceOk: meta.cssPresenceOk === true,
    uploadTarget: normalizeDeployBase(meta.deployBase),
    uploadContents: "public-dist/ contents only (not the public-dist folder itself)",
  };
}

/**
 * @param {{ deployBase: string, stagingUrl: string, siteSlug: string }} opts
 */
export function formatReadmeUpload(opts) {
  const base = normalizeDeployBase(opts.deployBase);
  const url = opts.stagingUrl.replace(/\/$/, "") + "/";

  return `# Manual staging upload — ${opts.siteSlug}

This package is for **manual FTP upload only**. Do **not** use automated FTP deploy scripts.

## What this is

- A local copy of \`public-dist/\` ready for FileZilla or Lolipop FTP manual upload
- **FTP auto-deploy is disabled** after the G-7f incident — operator uploads by hand

## Upload destination (remote path)

\`\`\`txt
${base}
\`\`\`

## What to upload

Upload the **contents** of the \`public-dist/\` folder in this package — **not** the \`public-dist\` folder itself.

## Correct layout on server

\`\`\`txt
${base}index.html
${base}about/
${base}contact/
${base}discography/
${base}link/
${base}2026-03/
${base}2026-07/
${base}robots.txt
${base}sitemap-0.xml
${base}sitemap-index.xml
\`\`\`

## Wrong layout (do NOT do this)

\`\`\`txt
${base}public-dist/index.html
${base}public-dist/about/
\`\`\`

## Safety rules

- Open \`${base}\` in FTP before uploading — **confirm you are NOT at account root \`/\`**
- Do **not** delete existing root or other folders
- Do **not** use mirror / sync / delete-remote-extras options in FileZilla
- Overwrite existing files in \`${base}\` only — no delete-sync
- Visually confirm remote path before upload

## After upload — verify these URLs

- ${url}
- ${url}about/
- ${url}contact/
- ${url}2026-07/
- ${url}robots.txt

Check: HTTP 200, noindex, canonical / og:url use staging host, Nav Home → staging path.

## Package files

| File | Purpose |
|------|---------|
| \`public-dist/\` | Files to upload |
| \`CHECKLIST.md\` | Before/after checklist |
| \`MANIFEST.json\` | Package metadata |
| \`gosaki-piano-manual-upload.zip\` | Same package archived |
`;
}

/**
 * @param {{ deployBase: string }} opts
 */
export function formatUploadChecklist(opts) {
  const base = normalizeDeployBase(opts.deployBase);
  return `# Manual upload checklist

## Before upload

- [ ] FTP host / credentials are correct (FileZilla or Lolipop FTP)
- [ ] Navigate to remote path: \`${base}\`
- [ ] Confirm you are **NOT** at account root \`/\`
- [ ] Select **contents** of local \`public-dist/\` (not the \`public-dist\` folder)
- [ ] Do **not** use mirror / sync / delete-remote-extras
- [ ] Overwrite is OK; delete-sync is **not** OK
- [ ] Do not delete unrelated remote folders

## After upload

- [ ] Top page HTTP 200 — staging URL root
- [ ] \`/about/\` HTTP 200
- [ ] \`/contact/\` HTTP 200
- [ ] \`/2026-07/\` HTTP 200
- [ ] \`robots.txt\` HTTP 200
- [ ] noindex meta present on HTML pages
- [ ] canonical / og:url use staging host (not gosaki-piano.com)
- [ ] Nav Home links to staging path under \`${base}\`

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
 * @param {object} opts
 */
export function createManualUploadPackage(opts) {
  const {
    publicDistDir,
    outDir,
    siteSlug,
    deployBase,
    stagingUrl,
    toolRoot,
    repoRoot,
  } = opts;

  const validation = validatePublicDistForManualUpload(publicDistDir);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, packageDir: null };
  }

  const packageDir = path.resolve(outDir);
  const publicDistOut = path.join(packageDir, "public-dist");
  const readmePath = path.join(packageDir, "README-UPLOAD.md");
  const checklistPath = path.join(packageDir, "CHECKLIST.md");
  const manifestPath = path.join(packageDir, "MANIFEST.json");
  const zipPath = path.join(packageDir, `${siteSlug}-manual-upload.zip`);

  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });

  copyPublicDistRecursive(publicDistDir, publicDistOut);

  const sourceRel = path
    .relative(repoRoot, path.resolve(publicDistDir))
    .replace(/\\/g, "/");

  const manifest = buildManualUploadManifest({
    siteSlug,
    deployBase,
    stagingUrl,
    sourcePublicDist: sourceRel,
    fileCount: validation.fileCount,
    safeForStaticFtp: Boolean(validation.manifest?.safeForStaticFtp),
    cssPresenceOk: validation.cssPresence?.ok === true,
  });

  fs.writeFileSync(readmePath, formatReadmeUpload({ deployBase, stagingUrl, siteSlug }), "utf8");
  fs.writeFileSync(checklistPath, formatUploadChecklist({ deployBase }), "utf8");
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
    manifest,
    validation,
    toolRoot,
  };
}
