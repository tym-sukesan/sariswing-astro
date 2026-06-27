/**
 * G-14b1a — Gosaki routine Schedule CMS practical Save enablement (G-9k path arm alias).
 * No hardcoded PoC row/values — operator picker + form input at execution time.
 */

import {
  getScheduleOptimisticLockConfig,
  SCHEDULE_OPTIMISTIC_LOCK_ENABLED_ENV,
} from "./schedule-optimistic-lock-config";

const GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";

export const G14B1A_PHASE =
  "G-14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation";

export const GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED";

export const G14B1A_ROUTINE_EDIT_SAVE_DISABLED_DEFAULT_REASON =
  "G-14b1a routine edit Save disabled — practical arm not configured (routine dev safety).";

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim() === "true";
}

export function isGosakiSchedulePracticalEditEnvArmTrue(
  env: ImportMetaEnv,
): boolean {
  return isEnvArmTrue(env, GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV);
}

export function isGosakiScheduleLegacyG9kSaveButtonEnvArmTrue(
  env: ImportMetaEnv,
): boolean {
  return isEnvArmTrue(env, GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV);
}

/** True when either legacy G-9k arm or G-14b1a practical arm is active. */
export function isGosakiScheduleRoutineEditArmSatisfied(env: ImportMetaEnv): boolean {
  return (
    isGosakiScheduleLegacyG9kSaveButtonEnvArmTrue(env) ||
    isGosakiSchedulePracticalEditEnvArmTrue(env)
  );
}

/** Mutual exclusion — call from cleanup / other write configs. */
export function collectG14b1aPracticalEditArmOffFailures(
  env: ImportMetaEnv,
): string[] {
  if (isGosakiSchedulePracticalEditEnvArmTrue(env)) {
    return [`${GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV} must be off`];
  }
  return [];
}

/** G-9k config — routine edit arm resolution (single-arm policy). */
export function collectG14b1aRoutineEditArmFailures(env: ImportMetaEnv): string[] {
  const failures: string[] = [];
  const legacyArm = isGosakiScheduleLegacyG9kSaveButtonEnvArmTrue(env);
  const practicalArm = isGosakiSchedulePracticalEditEnvArmTrue(env);

  if (legacyArm && practicalArm) {
    failures.push(
      `only one routine edit arm allowed (${GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV} or ${GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV}, not both)`,
    );
  }
  if (!legacyArm && !practicalArm) {
    failures.push(
      `${GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV}=true (recommended) or ${GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV}=true`,
    );
  }
  if (!getScheduleOptimisticLockConfig(env).enabled) {
    failures.push(`${SCHEDULE_OPTIMISTIC_LOCK_ENABLED_ENV}=true`);
  }
  return failures;
}
