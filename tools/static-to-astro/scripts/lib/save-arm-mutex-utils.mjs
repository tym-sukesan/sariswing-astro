/**
 * CMS Core — operational Save UI arm mutex evaluator (site-agnostic).
 *
 * Evaluates already-normalized `{ featureId, armed }` rows.
 * Does NOT parse env strings, touch Secrets, or gate production.
 * Does NOT import Gosaki (or any site) inventory.
 *
 * Package generate gate is wired (Gosaki adapter). Admin runtime remains unwired —
 * see cms-core-v2-global-save-arm-mutex-policy.md §16.
 *
 * Flags:
 * - MUTEX_EVALUATOR_AVAILABLE: true (this module exists)
 * - MUTEX_EVALUATOR_WIRED: true (package generate gate uses this evaluator)
 * - PACKAGE_GENERATE_GATE_WIRED: true
 * - GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: true (package generate gate)
 * - ADMIN_RUNTIME_MUTEX_WIRED: false (do not confuse with package gate)
 */

export const MUTEX_EVALUATOR_AVAILABLE = true;
export const MUTEX_EVALUATOR_WIRED = true;
export const PACKAGE_GENERATE_GATE_WIRED = true;
/** Package generate gate landed; Admin runtime still unwired. */
export const GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED = true;
/** Admin / browser runtime mutex still unwired — not package generate. */
export const ADMIN_RUNTIME_MUTEX_WIRED = false;

export const MUTEX_REASON = Object.freeze({
  NO_OPERATIONAL_SAVE_ARM: "no_operational_save_arm",
  SINGLE_OPERATIONAL_SAVE_ARM: "single_operational_save_arm",
  MULTIPLE_OPERATIONAL_SAVE_ARMS: "multiple_operational_save_arms",
  INVALID_OPERATIONAL_SAVE_ARM_INPUT: "invalid_operational_save_arm_input",
});

/**
 * @typedef {{ featureId: string, armed: boolean }} OperationalSaveArmEntry
 * @typedef {{
 *   ok: boolean,
 *   reason: string,
 *   armedCount: number,
 *   armedFeatureIds: string[],
 *   invalidEntries?: Array<{ index: number, issue: string }>,
 * }} OperationalSaveArmMutexResult
 */

/**
 * Evaluate operational client Save UI arm mutex.
 * Never throws — invalid input → fail-closed.
 *
 * @param {unknown} entries
 * @returns {OperationalSaveArmMutexResult}
 */
export function evaluateOperationalClientSaveUiMutex(entries) {
  if (!Array.isArray(entries)) {
    return {
      ok: false,
      reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
      armedCount: 0,
      armedFeatureIds: [],
      invalidEntries: [{ index: -1, issue: "entries_not_array" }],
    };
  }

  /** @type {Array<{ index: number, issue: string }>} */
  const invalidEntries = [];
  /** @type {string[]} */
  const seenIds = [];
  /** @type {string[]} */
  const armedFeatureIds = [];

  for (let i = 0; i < entries.length; i++) {
    const row = entries[i];
    if (row == null || typeof row !== "object" || Array.isArray(row)) {
      invalidEntries.push({ index: i, issue: "entry_not_object" });
      continue;
    }
    const featureId = /** @type {{ featureId?: unknown, armed?: unknown }} */ (row).featureId;
    const armed = /** @type {{ featureId?: unknown, armed?: unknown }} */ (row).armed;

    if (typeof featureId !== "string" || featureId.length === 0) {
      invalidEntries.push({ index: i, issue: "feature_id_missing_or_empty" });
      continue;
    }
    if (seenIds.includes(featureId)) {
      invalidEntries.push({ index: i, issue: "feature_id_duplicate" });
      continue;
    }
    seenIds.push(featureId);

    if (typeof armed !== "boolean") {
      invalidEntries.push({ index: i, issue: "armed_not_boolean" });
      continue;
    }
    if (armed === true) armedFeatureIds.push(featureId);
  }

  if (invalidEntries.length > 0) {
    return {
      ok: false,
      reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
      armedCount: 0,
      armedFeatureIds: [],
      invalidEntries,
    };
  }

  const armedCount = armedFeatureIds.length;
  if (armedCount === 0) {
    return {
      ok: true,
      reason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM,
      armedCount: 0,
      armedFeatureIds: [],
    };
  }
  if (armedCount === 1) {
    return {
      ok: true,
      reason: MUTEX_REASON.SINGLE_OPERATIONAL_SAVE_ARM,
      armedCount: 1,
      armedFeatureIds,
    };
  }
  return {
    ok: false,
    reason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    armedCount,
    armedFeatureIds,
  };
}
