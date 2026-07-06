/**
 * G-22h3 — Gosaki Schedule republish UPDATE guards (dry-run validation; Save deferred to G-22h6).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import { G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22H_REPUBLISH_UPDATE_PAYLOAD_KEYS = ["published"] as const;

export type G22hRepublishUpdatePayloadKey = (typeof G22H_REPUBLISH_UPDATE_PAYLOAD_KEYS)[number];

export function assertG22hRepublishUpdatePayloadOnly(payload: Record<string, unknown>): void {
  const keys = Object.keys(payload).sort();
  const allowed = [...G22H_REPUBLISH_UPDATE_PAYLOAD_KEYS].sort();
  if (keys.join(",") !== allowed.join(",")) {
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

export function assertG22hRepublishUpdateTargetEligible(target: ScheduleRecord): void {
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
}

export function collectG22hRepublishUpdateGuardFailures(input: {
  target?: ScheduleRecord | null;
  payload?: Record<string, unknown>;
  approvalId?: string;
}): string[] {
  const failures: string[] = [];

  if (input.approvalId && input.approvalId !== G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID) {
    failures.push(`approvalId must be ${G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID}`);
  }

  if (input.target) {
    try {
      assertG22hRepublishUpdateTargetEligible(input.target);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (input.payload) {
    try {
      assertG22hRepublishUpdatePayloadOnly(input.payload);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }

  return failures;
}
