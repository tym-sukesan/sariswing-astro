/**
 * CMS Core — Save arm exact-"true" parser (Node).
 * Site-agnostic SoT for CMS Core v2 Save arm policy: armed ⇔ raw === "true".
 *
 * No trim · no case-fold · never throws (invalid → disarmed).
 *
 * Client bake / package-run-marker Save UI arms are wired (see
 * cms-core-v2-save-arm-client-exact-true-wiring). Edge / Deno remain exact
 * `"true"` locally and do not import this module yet.
 */

/**
 * @param {unknown} raw
 * @returns {boolean}
 */
export function isSaveArmExactTrue(raw) {
  return raw === "true";
}
