/**
 * Gosaki package-generate gate — operational client Save UI arm mutex.
 *
 * Phase: cms-core-v2-global-save-arm-mutex-package-gate
 *
 * Flow: inventory (6) → isSaveArmExactTrue → evaluateOperationalClientSaveUiMutex
 * Fail-closed before any package filesystem mutation.
 *
 * Injection direction (required):
 * - Gosaki entrypoints / this adapter inject into site-agnostic Core via callbacks
 * - Core (`build-site-package-core` / `manual-upload-package`) must NOT import this file
 *
 * Does NOT read server Secrets · does NOT weaken production / staging-ref gates ·
 * does NOT wire Admin runtime.
 */

import { isSaveArmExactTrue } from "./save-arm-utils.mjs";
import {
  evaluateOperationalClientSaveUiMutex,
  MUTEX_REASON,
} from "./save-arm-mutex-utils.mjs";
import {
  GOSAKI_MUTEX_INVENTORY_SITE_KEY,
  GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS,
} from "./gosaki-operational-save-ui-arm-inventory.mjs";

export { MUTEX_REASON };
export { GOSAKI_MUTEX_INVENTORY_SITE_KEY };

/**
 * @param {string | null | undefined} siteKey
 * @returns {boolean}
 */
export function shouldApplyGosakiOperationalSaveUiMutexPackageGate(siteKey) {
  return String(siteKey ?? "") === GOSAKI_MUTEX_INVENTORY_SITE_KEY;
}

/**
 * Collect normalized mutex entries from env (client arms only · exact `"true"`).
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {{ featureId: string, armed: boolean }[]}
 */
export function collectGosakiOperationalClientSaveUiMutexEntries(env = process.env) {
  return GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS.map((arm) => ({
    featureId: arm.featureId,
    armed: isSaveArmExactTrue(env[arm.clientEnv]),
  }));
}

/**
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult}
 */
export function evaluateGosakiOperationalClientSaveUiMutexFromEnv(env = process.env) {
  return evaluateOperationalClientSaveUiMutex(
    collectGosakiOperationalClientSaveUiMutexEntries(env),
  );
}

/**
 * CLI / log line — never includes env values or Secrets.
 *
 * @param {import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult} result
 * @returns {string}
 */
export function formatGosakiOperationalSaveUiMutexGateError(result) {
  const ids =
    Array.isArray(result.armedFeatureIds) && result.armedFeatureIds.length > 0
      ? result.armedFeatureIds.join(",")
      : "(none)";
  return (
    `operational client Save UI arm mutex gate failed` +
    ` · reason=${result.reason}` +
    ` · armedCount=${result.armedCount}` +
    ` · armedFeatureIds=${ids}`
  );
}

/**
 * Marker / metadata evidence (no secrets).
 *
 * @param {import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult} result
 */
export function buildGosakiOperationalSaveUiMutexMarkerEvidence(result) {
  return {
    mutexChecked: true,
    mutexReason: String(result.reason ?? ""),
    armedCount: Number(result.armedCount ?? 0),
    armedFeatureIds: Array.isArray(result.armedFeatureIds)
      ? [...result.armedFeatureIds]
      : [],
  };
}

/**
 * Fail-closed assert for Gosaki package generate.
 * Returns mutex result on PASS; throws Error (with .mutexResult) on FAIL.
 *
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} [env]
 * @returns {import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult}
 */
export function assertGosakiOperationalClientSaveUiMutexForPackageGenerate(
  env = process.env,
) {
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  if (!result.ok) {
    const err = new Error(formatGosakiOperationalSaveUiMutexGateError(result));
    /** @type {any} */ (err).mutexResult = result;
    throw err;
  }
  return result;
}

/**
 * Log PASS line without env values.
 *
 * @param {import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult} result
 */
export function logGosakiOperationalSaveUiMutexGatePass(result) {
  const ids =
    result.armedFeatureIds.length > 0
      ? result.armedFeatureIds.join(",")
      : "(none)";
  console.log(
    `[save-arm-mutex] PASS · reason=${result.reason} · armedCount=${result.armedCount} · armedFeatureIds=${ids}`,
  );
}

/**
 * Core injection for `runSitePackageBuild({ beforeFirstFilesystemWrite })`.
 * Returns `undefined` for non-Gosaki (no-op · preserves non-Gosaki callers).
 *
 * Authoritative gate for the full package pipeline (once per invocation).
 *
 * @param {string | null | undefined} siteKey
 * @returns {undefined | ((ctx: { env?: NodeJS.ProcessEnv | Record<string, string | undefined>, siteKey?: string }) => { mutex: ReturnType<typeof buildGosakiOperationalSaveUiMutexMarkerEvidence> })}
 */
export function createGosakiBeforeFirstFilesystemWrite(siteKey) {
  if (!shouldApplyGosakiOperationalSaveUiMutexPackageGate(siteKey)) return undefined;
  return (ctx = {}) => {
    const env = ctx.env ?? process.env;
    const result = assertGosakiOperationalClientSaveUiMutexForPackageGenerate(env);
    logGosakiOperationalSaveUiMutexGatePass(result);
    return { mutex: buildGosakiOperationalSaveUiMutexMarkerEvidence(result) };
  };
}

/**
 * Core injection for standalone `createManualUploadPackage({ beforePackageDirMutation })`.
 * Do NOT pass this when `runSitePackageBuild` already ran the authoritative gate.
 *
 * @param {string | null | undefined} siteKey
 * @returns {undefined | (() => void)}
 */
export function createGosakiBeforePackageDirMutation(siteKey) {
  if (!shouldApplyGosakiOperationalSaveUiMutexPackageGate(siteKey)) return undefined;
  return () => {
    const result = assertGosakiOperationalClientSaveUiMutexForPackageGenerate(process.env);
    logGosakiOperationalSaveUiMutexGatePass(result);
  };
}

/**
 * Run gate then optional side-effect only on PASS (verifier / tempdir probes).
 *
 * @template T
 * @param {NodeJS.ProcessEnv | Record<string, string | undefined>} env
 * @param {(result: import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult) => T} onPass
 * @returns {{ ok: boolean, proceeded: boolean, result: import("./save-arm-mutex-utils.mjs").OperationalSaveArmMutexResult, out?: T }}
 */
export function runGosakiOperationalSaveUiMutexGateThen(env, onPass) {
  const result = evaluateGosakiOperationalClientSaveUiMutexFromEnv(env);
  if (!result.ok) {
    return { ok: false, proceeded: false, result };
  }
  const out = onPass(result);
  return { ok: true, proceeded: true, result, out };
}
