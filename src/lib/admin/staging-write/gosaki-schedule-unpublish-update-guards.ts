/**
 * G-22f3 — Gosaki Schedule unpublish UPDATE guards (single slice).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { getG22fUnpublishUpdateConfig } from "./gosaki-schedule-unpublish-update-config";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";
import { G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22F_UNPUBLISH_UPDATE_PAYLOAD_KEYS = ["published"] as const;

export type G22fUnpublishUpdatePayloadKey = (typeof G22F_UNPUBLISH_UPDATE_PAYLOAD_KEYS)[number];

export const G22F_PROTECTED_LEGACY_SCHEDULE_2026_03_014 = "schedule-2026-03-014";
export const G22F_PROTECTED_LEGACY_SCHEDULE_2026_09_001 = "schedule-2026-09-001";

export const G22F_PROTECTED_ROW_IDS = [
  "434e4051-86c3-473e-9ad0-39d2e5042fb8",
  "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3",
] as const;

export function buildG22fUnpublishUpdatePayload(): ScheduleUpdateWritePayload {
  return {
    published: false,
  };
}

export function assertG22fUnpublishUpdatePayloadOnly(payload: ScheduleUpdateWritePayload): void {
  const keys = Object.keys(payload).sort();
  const allowed = [...G22F_UNPUBLISH_UPDATE_PAYLOAD_KEYS].sort();
  if (keys.length !== allowed.length || !keys.every((key, index) => key === allowed[index])) {
    throw new Error(
      `G-22f UPDATE payload keys mismatch (expected ${allowed.join(", ")}, got ${keys.join(", ")}).`,
    );
  }
  if (payload.published !== false) {
    throw new Error("G-22f unpublish UPDATE must set published=false.");
  }
  if ("updated_at" in payload) {
    throw new Error("G-22f unpublish UPDATE must not include updated_at in patch.");
  }
}

export function assertG22fUnpublishUpdateWritableTarget(target: ScheduleDryRunSource): void {
  if (!String(target.id ?? "").trim()) {
    throw new Error("G-22f unpublish UPDATE target id required.");
  }
  if (!String(target.legacy_id ?? "").trim()) {
    throw new Error("G-22f unpublish UPDATE target legacy_id required.");
  }
  if (target.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`G-22f site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
  if (target.published !== true) {
    throw new Error("G-22f unpublish UPDATE blocked — target is already unpublished.");
  }
  if (
    target.legacy_id === G22F_PROTECTED_LEGACY_SCHEDULE_2026_03_014 ||
    target.legacy_id === G22F_PROTECTED_LEGACY_SCHEDULE_2026_09_001
  ) {
    throw new Error(`G-22f must not touch protected test row ${target.legacy_id}.`);
  }
  if ((G22F_PROTECTED_ROW_IDS as readonly string[]).includes(target.id)) {
    throw new Error(`G-22f must not touch protected test row id ${target.id}.`);
  }
}

export function collectG22fUnpublishUpdateGuardFailures(input: {
  unpublishMode: boolean;
  target: ScheduleDryRunSource | null;
  unpublishDryRunOk: boolean;
  unpublishDryRunOperation?: string;
  wouldUpdate?: boolean;
  wouldDelete?: boolean;
  physicalDelete?: boolean;
  beforePublished?: boolean;
  afterPublished?: boolean;
  duplicateMode?: boolean;
  newEventMode?: boolean;
  existingUpdateMode?: boolean;
  approvalId?: string;
  env?: ImportMetaEnv;
}): string[] {
  const failures: string[] = [];
  const config = getG22fUnpublishUpdateConfig(input.env ?? import.meta.env);

  if (input.approvalId && input.approvalId !== G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID) {
    failures.push(`approvalId must be ${G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID}`);
  }
  if (!input.unpublishMode) {
    failures.push("Unpublish draft mode required.");
  }
  if (input.duplicateMode) {
    failures.push("Duplicate mode must be off for unpublish UPDATE.");
  }
  if (input.newEventMode) {
    failures.push("New event mode must be off for unpublish UPDATE.");
  }
  if (input.existingUpdateMode) {
    failures.push("Existing update mode must be off for unpublish UPDATE.");
  }
  if (!input.target) {
    failures.push("Unpublish target row missing.");
    return failures;
  }
  if (input.target.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    failures.push("site_slug must be gosaki-piano.");
  }
  if (input.target.published !== true) {
    failures.push("Target published must be true.");
  }
  if (
    input.target.legacy_id === G22F_PROTECTED_LEGACY_SCHEDULE_2026_03_014 ||
    input.target.legacy_id === G22F_PROTECTED_LEGACY_SCHEDULE_2026_09_001
  ) {
    failures.push(`Must not touch protected test row ${input.target.legacy_id}.`);
  }
  if (!input.unpublishDryRunOk) {
    failures.push("Unpublish dry-run must succeed before Save.");
  }
  if (input.unpublishDryRunOperation && input.unpublishDryRunOperation !== "unpublish") {
    failures.push("Latest dry-run operation must be unpublish.");
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
  if (input.beforePublished === false) {
    failures.push("before.published must be true.");
  }
  if (input.afterPublished === true) {
    failures.push("after.published must be false.");
  }
  if (!config.saveEnabled) {
    failures.push(config.armFailureReason ?? config.defaultDisabledReason);
  }
  return failures;
}
