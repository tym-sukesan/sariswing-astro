/**
 * CMS Core — Save arm exact-"true" parser (Node).
 * Site-agnostic SoT for CMS Core v2 Save arm policy: armed ⇔ raw === "true".
 *
 * No trim · no case-fold · never throws (invalid → disarmed).
 *
 * Runtime wiring (Admin bake / Edge / package) is intentionally deferred —
 * see cms-core-v2-save-arm-parse-policy.md. Do not import from Gosaki feature
 * parsers until an explicit wiring phase.
 */

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isSaveArmExactTrue(raw) {
  return raw === "true";
}
