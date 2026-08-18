/**
 * Gosaki public Wix CDN media → local /images/wix-local/ paths.
 * Uses import.meta.env.BASE_URL so preview (/gosaki-piano/) and production (/) both work.
 * Does not rewrite intentional wixsite.com links.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");

export const GOSAKI_WIX_LOCAL_MANIFEST_REL = "config/sites/gosaki-piano-wix-local-assets.json";
export const GOSAKI_WIX_LOCAL_PUBLIC_DIR = "images/wix-local";

/** Media ids include underscores (`26e086_0cea…`). */
const WIXSTATIC_MEDIA_RE =
  /(?:https?:)?\/\/static\.wixstatic\.com\/media\/([a-zA-Z0-9_]+)[^"'\\\s)]*/gi;
const PARA_FAVICON_RE = /https:\/\/static\.parastorage\.com\/client\/pfavico\.ico/gi;

/** Public HTML media dependency (not thunderbolt JS, not wixsite.com). */
const PUBLIC_WIX_CDN_MEDIA_RE =
  /(?:https?:)?\/\/static\.wixstatic\.com\/media\/[^\s"'<>)]+|https:\/\/static\.parastorage\.com\/client\/pfavico\.ico/gi;

const ASTRO_EXT = new Set([".astro", ".html"]);
const REWRITE_EXT = new Set([".astro", ".html", ".json", ".css", ".md"]);

let cachedManifest = null;

/**
 * @param {string} [toolRoot]
 */
export function loadGosakiWixLocalManifest(toolRoot = TOOL_ROOT) {
  if (cachedManifest && cachedManifest.toolRoot === toolRoot) return cachedManifest.data;
  const abs = path.join(toolRoot, GOSAKI_WIX_LOCAL_MANIFEST_REL);
  const data = JSON.parse(fs.readFileSync(abs, "utf8"));
  const byMediaId = new Map();
  for (const asset of data.assets ?? []) {
    byMediaId.set(asset.id, asset);
  }
  cachedManifest = { toolRoot, data: { ...data, byMediaId, abs } };
  return cachedManifest.data;
}

export function resetGosakiWixLocalManifestCache() {
  cachedManifest = null;
}

function localPathForAsset(asset) {
  return `/${GOSAKI_WIX_LOCAL_PUBLIC_DIR}/${asset.file}`;
}

function toBaseUrlExpr(publicPath) {
  const rel = publicPath.replace(/^\//, "");
  return `{import.meta.env.BASE_URL + "${rel}"}`;
}

/**
 * @param {string} html
 * @param {{ toolRoot?: string, astroExpr?: boolean }} [opts]
 */
export function rewriteGosakiWixCdnHtml(html, opts = {}) {
  if (!html) return html;
  const manifest = loadGosakiWixLocalManifest(opts.toolRoot ?? TOOL_ROOT);
  const astroExpr = opts.astroExpr === true;
  let out = html.replace(WIXSTATIC_MEDIA_RE, (full, mediaId) => {
    const asset = manifest.byMediaId.get(mediaId);
    if (!asset) return full;
    return localPathForAsset(asset);
  });
  const fav = manifest.byMediaId.get("pfavico");
  if (fav) {
    out = out.replace(PARA_FAVICON_RE, localPathForAsset(fav));
  }
  out = out.replace(/\s+srcset=(["'])[^"']*\/images\/wix-local\/[^"']*\1/gi, "");
  if (astroExpr) {
    out = out.replace(
      /\b(src|href|favicon|appleTouchIcon)=["'](\/images\/wix-local\/[^"']+)["']/g,
      (_m, attr, p) => `${attr}=${toBaseUrlExpr(p)}`,
    );
  }
  return out;
}

/**
 * Remaining public Wix CDN media refs (not wixsite.com, not thunderbolt JS).
 * @param {string} html
 * @returns {string[]}
 */
export function findPublicWixCdnMediaRefs(html) {
  if (!html) return [];
  return [...String(html).matchAll(PUBLIC_WIX_CDN_MEDIA_RE)].map((m) => m[0]);
}

/**
 * @param {string} outDir
 * @param {string} [toolRoot]
 */
/**
 * Copy committed binaries into destRoot/images/wix-local/ (Astro public/ or public-dist/).
 * @param {string} destRoot
 * @param {string} [toolRoot]
 */
export function copyGosakiWixLocalAssetsIntoDir(destRoot, toolRoot = TOOL_ROOT) {
  const manifest = loadGosakiWixLocalManifest(toolRoot);
  const srcDir = path.join(toolRoot, manifest.sourceDir);
  const destDir = path.join(destRoot, GOSAKI_WIX_LOCAL_PUBLIC_DIR);
  fs.mkdirSync(destDir, { recursive: true });
  /** @type {string[]} */
  const copied = [];
  /** @type {string[]} */
  const missing = [];
  for (const asset of manifest.assets ?? []) {
    const from = path.join(srcDir, asset.file);
    const to = path.join(destDir, asset.file);
    if (!fs.existsSync(from)) {
      missing.push(asset.file);
      continue;
    }
    fs.copyFileSync(from, to);
    copied.push(asset.file);
  }
  return { copied, missing, destDir: `${GOSAKI_WIX_LOCAL_PUBLIC_DIR}/` };
}

/**
 * @param {string} outDir
 * @param {string} [toolRoot]
 */
export function copyGosakiWixLocalAssets(outDir, toolRoot = TOOL_ROOT) {
  return copyGosakiWixLocalAssetsIntoDir(path.join(outDir, "public"), toolRoot);
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walkFiles(p, acc);
    else acc.push(p);
  }
  return acc;
}

/**
 * @param {string} outDir
 * @param {string} [toolRoot]
 */
export function rewriteGosakiWixCdnInGeneratedTree(outDir, toolRoot = TOOL_ROOT) {
  let filesRewritten = 0;
  let remaining = 0;
  for (const file of walkFiles(outDir)) {
    if (file.includes(`${path.sep}node_modules${path.sep}`)) continue;
    const ext = path.extname(file);
    if (!REWRITE_EXT.has(ext)) continue;
    const before = fs.readFileSync(file, "utf8");
    const after = rewriteGosakiWixCdnHtml(before, {
      toolRoot,
      astroExpr: ASTRO_EXT.has(ext),
    });
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      filesRewritten += 1;
    }
    remaining += findPublicWixCdnMediaRefs(after).length;
  }
  return { filesRewritten, remainingCdnRefs: remaining };
}

/**
 * Convert hook: copy binaries + rewrite generated tree.
 * @param {string} outDir
 * @param {string} [toolRoot]
 */
export function applyGosakiWixLocalAssets(outDir, toolRoot = TOOL_ROOT) {
  const copy = copyGosakiWixLocalAssets(outDir, toolRoot);
  const rewrite = rewriteGosakiWixCdnInGeneratedTree(outDir, toolRoot);
  const missing = copy.missing;
  const remainingCdnRefs = rewrite.remainingCdnRefs;
  const applied = missing.length === 0 && remainingCdnRefs === 0;
  /** @type {string | null} */
  let reason = null;
  if (missing.length) reason = `missing files: ${missing.join(", ")}`;
  else if (remainingCdnRefs) reason = `remaining public Wix CDN media refs: ${remainingCdnRefs}`;
  return {
    applied,
    reason,
    copiedCount: copy.copied.length,
    missing,
    filesRewritten: rewrite.filesRewritten,
    remainingCdnRefs,
  };
}

/**
 * Fail-closed scan of a public-dist tree.
 * @param {string} publicDistDir
 * @returns {string[]}
 */
export function verifyPublicDistWixCdnMediaAbsent(publicDistDir) {
  /** @type {string[]} */
  const errors = [];
  if (!fs.existsSync(publicDistDir)) {
    errors.push("public-dist missing for Wix CDN media check");
    return errors;
  }
  const scanExt = new Set([".html", ".css", ".xml", ".txt", ".js", ".json"]);
  let refCount = 0;
  for (const file of walkFiles(publicDistDir)) {
    if (!scanExt.has(path.extname(file))) continue;
    const text = fs.readFileSync(file, "utf8");
    const refs = findPublicWixCdnMediaRefs(text);
    if (refs.length) {
      refCount += refs.length;
      const rel = path.relative(publicDistDir, file);
      errors.push(`${rel} has public Wix CDN media (${refs.length}): ${refs[0]}`);
    }
  }
  if (refCount) {
    errors.unshift(`public Wix CDN media dependency = ${refCount} (must be 0)`);
  }
  const manifest = loadGosakiWixLocalManifest();
  for (const asset of manifest.assets ?? []) {
    const abs = path.join(publicDistDir, GOSAKI_WIX_LOCAL_PUBLIC_DIR, asset.file);
    if (!fs.existsSync(abs)) {
      errors.push(`missing localized asset: ${GOSAKI_WIX_LOCAL_PUBLIC_DIR}/${asset.file}`);
    }
  }
  return errors;
}
