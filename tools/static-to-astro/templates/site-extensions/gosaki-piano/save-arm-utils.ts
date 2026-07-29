/**
 * Gosaki admin bake mirror of CMS Core `scripts/lib/save-arm-utils.mjs`.
 * Keep logic identical (`raw === "true"`). Verifier locks Core ↔ this file.
 * Astro site package cannot import tools/static-to-astro/scripts/lib directly.
 */

export function isSaveArmExactTrue(raw: unknown): boolean {
  return raw === "true";
}
