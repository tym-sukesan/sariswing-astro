/**
 * Tempdir fixtures for site-package verifier extension decoupling.
 * No real package / no network.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyGosakiWixLocalAssetsIntoDir } from "./gosaki-wix-local-assets.mjs";

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * @param {string} prefix
 */
export function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * Minimal generic package that satisfies Core-only checks for a registry site
 * when wired with matching MANIFEST meta (caller supplies siteKey/profile).
 *
 * @param {{
 *   packageDir: string,
 *   siteKey: string,
 *   siteSlug: string,
 *   packageProfileName: string,
 *   targetEnvironment: string,
 *   publicBaseUrl: string,
 *   intendedRemotePath: string,
 *   deployBase: string,
 *   includesAdmin: boolean,
 *   zipName: string,
 * }} opts
 */
export function writeMinimalGenericPackage(opts) {
  const {
    packageDir,
    siteKey,
    siteSlug,
    packageProfileName,
    targetEnvironment,
    publicBaseUrl,
    intendedRemotePath,
    deployBase,
    includesAdmin,
    zipName,
  } = opts;

  const publicDist = path.join(packageDir, "public-dist");
  fs.mkdirSync(publicDist, { recursive: true });
  fs.writeFileSync(path.join(publicDist, "index.html"), "<!doctype html><html><head></head><body>ok</body></html>");
  fs.writeFileSync(path.join(publicDist, "robots.txt"), "User-agent: *\nAllow: /\n");
  fs.writeFileSync(
    path.join(publicDist, "sitemap-0.xml"),
    `<?xml version="1.0"?><urlset><url><loc>${publicBaseUrl}/</loc></url></urlset>`,
  );
  if (includesAdmin && targetEnvironment === "staging") {
    fs.mkdirSync(path.join(publicDist, "admin"), { recursive: true });
    fs.writeFileSync(path.join(publicDist, "admin/index.html"), "<html>admin</html>");
  }

  // Empty _astro so CSS presence may warn — write a stub css link matching deployBase optional.
  // Core CSS check: verifyPublicDistCssPresence — may fail without assets.
  // For Core-only PASS we need cssPresenceOk in manifest AND css check on disk.
  // Avoid CSS fail: skip by not requiring css when check fails — write minimal _astro css
  // OR set deployBase and ensure index doesn't require _astro if no link.
  // verifyPublicDistCssPresence typically requires _astro when linked. Index has no link → ok.

  fs.writeFileSync(path.join(packageDir, "README-UPLOAD.md"), `# Upload\n${deployBase}\n`);
  fs.writeFileSync(
    path.join(packageDir, "CHECKLIST.md"),
    "# Checklist\ntargetEnvironment\nsourceCommit\ngeneratedAt\n",
  );
  fs.writeFileSync(path.join(packageDir, zipName), "PK\u0003\u0004");

  const manifest = {
    ftpAutoDeployUsed: false,
    safeForStaticFtp: true,
    cssPresenceOk: true,
    sourceCommit: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    generatedAt: "2026-07-30T00:00:00.000Z",
    fileCount: 3,
    targetEnvironment,
    packageProfileName,
    siteKey,
    siteSlug,
    publicBaseUrl,
    intendedRemotePath,
    deployBase,
    includesAdmin,
  };
  fs.writeFileSync(path.join(packageDir, "MANIFEST.json"), JSON.stringify(manifest, null, 2));
}

/**
 * Gosaki-shaped staging public-dist fragments for extension PASS path.
 * @param {string} packageDir
 * @param {string} deployBase
 */
export function writeGosakiStagingExtensionHappyPublicDist(packageDir, deployBase) {
  const publicDist = path.join(packageDir, "public-dist");
  for (const ym of ["2026-06", "2026-07", "2026-08"]) {
    const monthDir = path.join(publicDist, "schedule", ym);
    fs.mkdirSync(monthDir, { recursive: true });
    fs.writeFileSync(
      path.join(monthDir, "index.html"),
      `<html><body class="gosaki-schedule-month">会場 scheduleDataSource=supabase</body></html>`,
    );
    const legacyDir = path.join(publicDist, ym);
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(
      path.join(legacyDir, "index.html"),
      `<html><head><meta name="robots" content="noindex"></head><body class="gosaki-schedule-legacy-stub"><a href="/schedule/${ym}/">go</a></body></html>`,
    );
  }
  fs.mkdirSync(path.join(publicDist, "schedule"), { recursive: true });
  fs.writeFileSync(
    path.join(publicDist, "schedule/index.html"),
    `<html><body class="gosaki-schedule-hub"><a href="${deployBase}schedule/2026-07/">Jul</a></body></html>`,
  );
  fs.mkdirSync(path.join(publicDist, "discography"), { recursive: true });
  fs.writeFileSync(
    path.join(publicDist, "discography/index.html"),
    `<html><body id="comp-llexymel"><div id="comp-jshobkm1">Track List Personnel</div></body></html>`,
  );
  fs.writeFileSync(
    path.join(publicDist, "index.html"),
    `<html><body><button class="nav-toggle"></button><a>Schedule</a>
    <div class="gosaki-footer-social-links">
      <a href="https://facebook.com/goto.saki.3">Facebook</a>
      <a href="https://twitter.com/goto_saki_pf">X</a>
      <a href="https://instagram.com/gosaakiii">Instagram</a>
    </div>
    <div id="SITE_FOOTERinlineContent-gridContainer"></div>
    </body></html>`,
  );
  copyGosakiWixLocalAssetsIntoDir(publicDist, TOOL_ROOT);
  fs.writeFileSync(
    path.join(publicDist, "sitemap-0.xml"),
    `<?xml version="1.0"?><urlset>
      <url><loc>https://yskcreate.weblike.jp${deployBase}</loc></url>
      <url><loc>https://yskcreate.weblike.jp${deployBase}schedule/2026-07/</loc></url>
      <url><loc>https://yskcreate.weblike.jp${deployBase}schedule/2026-08/</loc></url>
    </urlset>`,
  );
}
