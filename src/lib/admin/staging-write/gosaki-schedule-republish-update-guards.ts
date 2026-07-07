/**
 * G-22h6a — Gosaki Schedule republish UPDATE guards (single slice; target 008 only).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { getG22hRepublishUpdateConfig } from "./gosaki-schedule-republish-update-config";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";
import { G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22H_REPUBLISH_UPDATE_PAYLOAD_KEYS = ["published"] as const;

export type G22hRepublishUpdatePayloadKey = (typeof G22H_REPUBLISH_UPDATE_PAYLOAD_KEYS)[number];

/** G-22h5 preflight fixed target — only row allowed for G-22h6 Save slice. */
export const G22H_FIXED_TARGET_LEGACY = "schedule-2026-07-008";
export const G22H_FIXED_TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
export const G22H_PREFLIGHT_EXPECTED_BEFORE_UPDATED_AT =
  "2026-07-06T13:58:41.425402+00:00";

/** Reference rows — must not be G-22h6 Save target. */
export const G22H_REFERENCE_LEGACY_SCHEDULE_2026_03_014 = "schedule-2026-03-014";
export const G22H_REFERENCE_LEGACY_SCHEDULE_2026_09_001 = "schedule-2026-09-001";

export const G22H_REFERENCE_ROW_IDS = [
  "434e4051-86c3-473e-9ad0-39d2e5042fb8",
  "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3",
] as const;

export function buildG22hRepublishUpdatePayload(): ScheduleUpdateWritePayload {
  return {
    published: true,
  };
}

export function assertG22hRepublishUpdatePayloadOnly(payload: ScheduleUpdateWritePayload): void {
  const keys = Object.keys(payload).sort();
  const allowed = [...G22H_REPUBLISH_UPDATE_PAYLOAD_KEYS].sort();
  if (keys.length !== allowed.length || !keys.every((key, index) => key === allowed[index])) {
    throw new Error(
      `G-22h UPDATE payload keys mismatch (expected ${allowed.join(", ")}, got ${keys.join(", ")}).`,
    );
  }
  if (payload.published !== true) {
    throw new Error("G-22h republish UPDATE must set published=true.");
  }
  if ("updated_at" in payload) {
    throw new Error("G-22h republish UPDATE must not include updated_at in patch.");
  }
}

export function assertG22hRepublishUpdateWritableTarget(target: ScheduleDryRunSource): void {
  if (!String(target.id ?? "").trim()) {
    throw new Error("G-22h republish UPDATE target id required.");
  }
  if (!String(target.legacy_id ?? "").trim()) {
    throw new Error("G-22h republish UPDATE target legacy_id required.");
  }
  if (target.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`G-22h site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
  if (target.published !== false) {
    throw new Error("G-22h republish UPDATE blocked — target is already published.");
  }
  if (target.id !== G22H_FIXED_TARGET_ID) {
    throw new Error(`G-22h republish UPDATE target id must be ${G22H_FIXED_TARGET_ID}.`);
  }
  if (target.legacy_id !== G22H_FIXED_TARGET_LEGACY) {
    throw new Error(`G-22h republish UPDATE target legacy_id must be ${G22H_FIXED_TARGET_LEGACY}.`);
  }
  if (
    target.legacy_id === G22H_REFERENCE_LEGACY_SCHEDULE_2026_03_014 ||
    target.legacy_id === G22H_REFERENCE_LEGACY_SCHEDULE_2026_09_001
  ) {
    throw new Error(`G-22h must not use reference test row ${target.legacy_id} as Save target.`);
  }
  if ((G22H_REFERENCE_ROW_IDS as readonly string[]).includes(target.id)) {
    throw new Error(`G-22h must not use reference test row id ${target.id} as Save target.`);
  }
}

export function collectG22hRepublishUpdateGuardFailures(input: {
  republishMode: boolean;
  target: ScheduleDryRunSource | null;
  republishDryRunOk: boolean;
  republishDryRunOperation?: string;
  wouldUpdate?: boolean;
  wouldDelete?: boolean;
  physicalDelete?: boolean;
  beforePublished?: boolean;
  afterPublished?: boolean;
  duplicateMode?: boolean;
  newEventMode?: boolean;
  unpublishMode?: boolean;
  existingUpdateMode?: boolean;
  expectedBeforeUpdatedAt?: string | null;
  approvalId?: string;
  env?: ImportMetaEnv;
}): string[] {
  const failures: string[] = [];
  const config = getG22hRepublishUpdateConfig(input.env ?? import.meta.env);

  if (input.approvalId && input.approvalId !== G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID) {
    failures.push(`approvalId must be ${G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID}`);
  }
  if (!input.republishMode) {
    failures.push("Republish draft mode required.");
  }
  if (input.duplicateMode) {
    failures.push("Duplicate mode must be off for republish UPDATE.");
  }
  if (input.newEventMode) {
    failures.push("New event mode must be off for republish UPDATE.");
  }
  if (input.unpublishMode) {
    failures.push("Unpublish mode must be off for republish UPDATE.");
  }
  if (input.existingUpdateMode) {
    failures.push("Existing update mode must be off for republish UPDATE.");
  }
  if (!input.target) {
    failures.push("Republish target row missing.");
    return failures;
  }
  if (input.target.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    failures.push("site_slug must be gosaki-piano.");
  }
  if (input.target.published !== false) {
    failures.push("Target published must be false.");
  }
  if (input.target.id !== G22H_FIXED_TARGET_ID) {
    failures.push(`Target id must be ${G22H_FIXED_TARGET_ID}.`);
  }
  if (input.target.legacy_id !== G22H_FIXED_TARGET_LEGACY) {
    failures.push(`Target legacy_id must be ${G22H_FIXED_TARGET_LEGACY}.`);
  }
  if (
    input.target.legacy_id === G22H_REFERENCE_LEGACY_SCHEDULE_2026_03_014 ||
    input.target.legacy_id === G22H_REFERENCE_LEGACY_SCHEDULE_2026_09_001
  ) {
    failures.push(`Must not use reference test row ${input.target.legacy_id} as Save target.`);
  }
  if (!input.republishDryRunOk) {
    failures.push("Republish dry-run must succeed before Save.");
  }
  if (input.republishDryRunOperation && input.republishDryRunOperation !== "republish") {
    failures.push("Latest dry-run operation must be republish.");
  }
  if (input.wouldUpdate === false) {
    failures.push("wouldUpdate must be true.");
  }
  if (input.wouldDelete === true) {
    failures.push("wouldDelete must be false.");
  }
  if (input.physicalDelete === true) {
    failures.push("physicalDelete must be false.");
  }
  if (input.beforePublished === true) {
    failures.push("before.published must be false.");
  }
  if (input.afterPublished === false) {
    failures.push("after.published must be true.");
  }
  if (
    input.expectedBeforeUpdatedAt != null &&
    String(input.expectedBeforeUpdatedAt).trim() !== "" &&
    String(input.target.updated_at ?? "") !== String(input.expectedBeforeUpdatedAt)
  ) {
    failures.push("expectedBeforeUpdatedAt must match target updated_at (optimistic lock stale).");
  }
  if (!String(input.target.updated_at ?? "").trim()) {
    failures.push("expectedBeforeUpdatedAt (target updated_at) required.");
  }
  if (!config.saveEnabled) {
    failures.push(config.armFailureReason ?? config.defaultDisabledReason);
  }
  return failures;
}

/** @deprecated Use assertG22hRepublishUpdateWritableTarget — kept for dry-run guard re-export. */
export function assertG22hRepublishUpdateTargetEligible(target: ScheduleDryRunSource): void {
  assertG22hRepublishUpdateWritableTarget(target);
}
