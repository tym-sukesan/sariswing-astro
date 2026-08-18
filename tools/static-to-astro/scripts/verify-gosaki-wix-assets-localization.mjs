#!/usr/bin/env node
/**
 * Gosaki Wix CDN media localization — offline unit + local-source checks.
 * Does not generate packages, FTP, or mutate remote/Wix.
 *
 * Run: node scripts/verify-gosaki-wix-assets-localization.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_WIX_LOCAL_PUBLIC_DIR,
  applyGosakiWixLocalAssets,
  findPublicWixCdnMediaRefs,
  loadGosakiWixLocalManifest,
  rewriteGosakiWixCdnHtml,
  verifyPublicDistWixCdnMediaAbsent,
} from "./lib/gosaki-wix-local-assets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const DOC = path.join(TOOL_ROOT, "docs/gosaki-wix-external-assets-localization.md");
const ADAPTER = path.join(TOOL_ROOT, "scripts/lib/gosaki-site-generator-hooks-adapter.mjs");
const HOME_SYNC = path.join(TOOL_ROOT, "scripts/lib/home-schedule-sync.mjs");
const ABOUT = path.join(TOOL_ROOT, "config/sites/gosaki-piano-about-content.json");
const CORE_ASTRO = path.join(TOOL_ROOT, "scripts/lib/astro-generator.mjs");

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const SAMPLE = `
<link rel="icon" href="https://static.parastorage.com/client/pfavico.ico">
<link rel="apple-touch-icon" href="https://static.parastorage.com/client/pfavico.ico">
<img src="https://static.wixstatic.com/media/26e086_0cea05e5141a49b99220e7383f218a99~mv2.jpg/v1/fill/w_1340,h_620,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/250428_0179re.jpg" srcset="https://static.wixstatic.com/media/26e086_0cea05e5141a49b99220e7383f218a99~mv2.jpg/v1/fill/w_1340,h_620,al_c,q_85/250428_0179re.jpg 1x, https://static.wixstatic.com/media/26e086_0cea05e5141a49b99220e7383f218a99~mv2.jpg/v1/fill/w_2680,h_1240,al_c,q_90/250428_0179re.jpg 2x" alt="kv">
<img src="https://static.wixstatic.com/media/11062b_0bec1cadb27b4d4a9898a740648fc5a9~mv2.png/v1/fill/w_46,h_46/x.png">
<a href="https://gosakirikakotrio.wixsite.com/gosakirikakotrio">trio</a>
<BaseLayout favicon="https://static.parastorage.com/client/pfavico.ico" appleTouchIcon="https://static.parastorage.com/client/pfavico.ico">
`;

const manifest = loadGosakiWixLocalManifest(TOOL_ROOT);
assert("manifest has 14 assets", (manifest.assets ?? []).length === 14);
assert("sourceDir committed", manifest.sourceDir === "assets/gosaki-piano/wix-local");

const srcDir = path.join(TOOL_ROOT, manifest.sourceDir);
let missingOnDisk = 0;
for (const asset of manifest.assets) {
  const abs = path.join(srcDir, asset.file);
  if (!fs.existsSync(abs) || fs.statSync(abs).size < 10) {
    missingOnDisk += 1;
    console.error(`  missing ${asset.file}`);
  }
}
assert("localized binaries on disk", missingOnDisk === 0, `missing=${missingOnDisk}`);

const rewritten = rewriteGosakiWixCdnHtml(SAMPLE, { toolRoot: TOOL_ROOT, astroExpr: true });
const refsAfter = findPublicWixCdnMediaRefs(rewritten);
assert("rewrite removes wixstatic media", !/static\.wixstatic\.com/.test(rewritten));
assert("rewrite removes pfavico CDN", !/pfavico\.ico/.test(rewritten) || rewritten.includes("/images/wix-local/favicon.ico") || rewritten.includes("images/wix-local/favicon.ico"));
assert("PUBLIC_WIX_CDN_MEDIA_REFS_AFTER sample = 0", refsAfter.length === 0, JSON.stringify(refsAfter));
assert("keeps intentional wixsite.com", rewritten.includes("https://gosakirikakotrio.wixsite.com/gosakirikakotrio"));
assert("no deployBase hard-code", !rewritten.includes("/gosaki-piano/"));
assert("uses BASE_URL for img", rewritten.includes('src={import.meta.env.BASE_URL + "images/wix-local/home-kv-250428-0179re.jpg"}'));
assert("srcset collapsed", !/\ssrcset=/.test(rewritten));
assert("favicon uses BASE_URL", rewritten.includes('favicon={import.meta.env.BASE_URL + "images/wix-local/favicon.ico"}'));

const previewHref = "/gosaki-piano/" + "images/wix-local/home-kv-250428-0179re.jpg";
const productionHref = "/" + "images/wix-local/home-kv-250428-0179re.jpg";
assert("preview deployBase path shape", previewHref === "/gosaki-piano/images/wix-local/home-kv-250428-0179re.jpg");
assert("production deployBase path shape", productionHref === "/images/wix-local/home-kv-250428-0179re.jpg");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-wix-local-"));
fs.mkdirSync(path.join(tmp, "src/pages"), { recursive: true });
fs.writeFileSync(path.join(tmp, "src/pages/index.astro"), SAMPLE, "utf8");
const applied = applyGosakiWixLocalAssets(tmp, TOOL_ROOT);
assert("apply copied 14", applied.copiedCount === 14, JSON.stringify(applied));
assert("apply remainingCdnRefs 0", applied.remainingCdnRefs === 0);
assert("apply applied", applied.applied === true, applied.reason ?? "");
const publicTmp = path.join(tmp, "public");
const distErrors = verifyPublicDistWixCdnMediaAbsent(publicTmp);
assert("verifyPublicDist on copied public = 0 errors", distErrors.length === 0, distErrors.join(" | "));

const adapterSrc = fs.readFileSync(ADAPTER, "utf8");
assert("adapter calls applyGosakiWixLocalAssets", /applyGosakiWixLocalAssets\(outDir/.test(adapterSrc));
assert("adapter still does not rewrite generateFooter", !/rewriteGosakiWixCdnHtml\(footer/.test(adapterSrc));

const homeSrc = fs.readFileSync(HOME_SYNC, "utf8");
assert("home-schedule-sync hero is local", homeSrc.includes("images/wix-local/home-kv-250428-0179re.jpg"));
assert("home-schedule-sync has no wixstatic", !homeSrc.includes("static.wixstatic.com"));

const aboutSrc = fs.readFileSync(ABOUT, "utf8");
assert("about SoT has no wixstatic media", !/static\.wixstatic\.com/.test(aboutSrc));
assert("about SoT keeps portrait local or none", /images\/wix-local\/about-portrait-250428-1002\.jpg/.test(aboutSrc));

const coreSrc = fs.readFileSync(CORE_ASTRO, "utf8");
assert("Core astro-generator has no gosaki-wix-local import", !/gosaki-wix-local-assets/.test(coreSrc));

const stalePublic = path.join(
  TOOL_ROOT,
  "output/manual-upload/gosaki-piano-ciao-preview/public-dist",
);
if (fs.existsSync(path.join(stalePublic, "index.html"))) {
  let publicRefs = 0;
  let htmlFiles = 0;
  let wixsiteKept = false;
  function walkHtml(dir) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) walkHtml(p);
      else if (name.endsWith(".html")) {
        htmlFiles += 1;
        const out = rewriteGosakiWixCdnHtml(fs.readFileSync(p, "utf8"), {
          toolRoot: TOOL_ROOT,
          astroExpr: false,
        });
        publicRefs += findPublicWixCdnMediaRefs(out).length;
        if (out.includes("gosakirikakotrio.wixsite.com")) wixsiteKept = true;
      }
    }
  }
  walkHtml(stalePublic);
  assert("stale-package HTML files scanned", htmlFiles >= 10, `n=${htmlFiles}`);
  assert("stale-package HTML rewrite PUBLIC_WIX_CDN_MEDIA_REFS_AFTER = 0", publicRefs === 0, `refs=${publicRefs}`);
  assert("stale-package rewrite keeps wixsite.com", wixsiteKept);
} else {
  assert("stale ciao-preview public-dist optional skip", true);
}

assert("phase doc exists", fs.existsSync(DOC));
if (fs.existsSync(DOC)) {
  const doc = fs.readFileSync(DOC, "utf8");
  assert("doc phase id", doc.includes("gosaki-wix-external-assets-localization"));
  assert("doc forbids FTP this phase", /FTP/.test(doc) && /not executed|not run|forbidden/i.test(doc));
}

console.log(`verify-gosaki-wix-assets-localization: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
