/**
 * Mio local public asset URL helpers.
 * Rejects external / traversal / data URLs. Emits root-absolute paths for Astro withBase.
 */

/**
 * Allow only relative local asset paths (no external URL, no .. traversal).
 * @param {unknown} src
 * @returns {string | null} normalized relative path like `images/foo.svg` (no leading slash)
 */
export function resolveMioSafeLocalImageSrc(src) {
  const raw = String(src ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("//") || raw.startsWith("data:")) {
    return null;
  }
  if (raw.includes("..") || raw.includes("\\")) return null;
  if (raw.startsWith("/")) {
    if (!raw.startsWith("/images/") && !raw.startsWith("/assets/")) return null;
    return raw.replace(/^\//, "");
  }
  if (!/^(images|assets)\//i.test(raw)) return null;
  return raw;
}

/**
 * Root-absolute public path (site root), e.g. `/images/foo.svg`.
 * Pair with Astro `withBase()` for subdirectory deployBase.
 * @param {unknown} src
 * @returns {string | null}
 */
export function toMioRootPublicAssetPath(src) {
  const safe = resolveMioSafeLocalImageSrc(src);
  if (!safe) return null;
  return `/${safe}`;
}

/**
 * Astro attribute fragment: `src={withBase('/images/foo.svg')}`
 * @param {unknown} src
 * @returns {string | null}
 */
export function mioAstroWithBaseSrcAttr(src) {
  const root = toMioRootPublicAssetPath(src);
  if (!root) return null;
  const escaped = root.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `src={withBase('${escaped}')}`;
}
