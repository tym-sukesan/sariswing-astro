/**
 * CMS Core — feature-flag trim-true parser (Node).
 * Site-agnostic SoT for PATH_ENABLED / BUILD_READ / similar opt-in flags:
 * armed ⇔ String(raw ?? "").trim() === "true"
 *
 * Distinct from Save arm exact-"true" parser (no trim · raw === "true" only).
 * Never throws. Does not case-fold (`"True"` / `"TRUE"` → false).
 * Legacy String coerce: boolean `true` → `"true"` → true (parity with prior inline).
 */

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isFeatureFlagTrimTrue(raw) {
  return String(raw ?? "").trim() === "true";
}
