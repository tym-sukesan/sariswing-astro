/**
 * G-22f — Gosaki Schedule unpublish dry-run (no DB write; no DELETE).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { buildScheduleUnpublishDryRunResult } from "./schedule-dry-run-adapter";
import type { ScheduleDryRunResult, ScheduleRecord } from "./schedule-dry-run-types";

export const G22F_PHASE = "G-22f-gosaki-schedule-unpublish-dry-run-ui-implementation";

export const G22F_SCHEDULE_UNPUBLISH_DRY_RUN_APPROVAL_ID =
  "G-22f-gosaki-schedule-unpublish-dry-run";

export type GosakiScheduleUnpublishDraftState = {
  mode: "unpublish";
  targetId: string;
  targetLegacyId: string | null;
  source: ScheduleRecord;
};

export type G22fScheduleUnpublishDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  physicalDelete: false;
};

export type G22fScheduleUnpublishDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G22F_PHASE;
  approvalId: typeof G22F_SCHEDULE_UNPUBLISH_DRY_RUN_APPROVAL_ID;
  operation: "unpublish";
  wouldUpdate: boolean;
  wouldDelete: false;
  wouldWrite: boolean;
  actualWrite: false;
  saveAllowed: false;
  physicalDelete: false;
  target: {
    id: string;
    legacy_id: string | null;
    site_slug: string;
    title: string;
    date: string;
  };
  before: {
    published: boolean;
  };
  after: {
    published: false;
  };
  payloadKeys: string[];
  payload: Record<string, unknown>;
  validation: { ok: boolean; errors: string[]; warnings: string[] };
  guardErrors: string[];
  message: string;
  rollbackHint: string;
  safety: G22fScheduleUnpublishDryRunSafety;
  adapterResult: ScheduleDryRunResult;
};

export function buildGosakiScheduleUnpublishDraft(
  source: ScheduleRecord,
): GosakiScheduleUnpublishDraftState {
  return {
    mode: "unpublish",
    targetId: source.id,
    targetLegacyId: source.legacy_id ?? null,
    source: { ...source },
  };
}

export function validateG22fUnpublishDryRunTarget(
  target: ScheduleRecord,
): { ok: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!String(target.id ?? "").trim()) {
    errors.push("対象イベントの id がありません。");
  }
  if (!String(target.legacy_id ?? "").trim()) {
    errors.push("対象イベントの legacy_id がありません。");
  }
  if (target.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    errors.push(
      `site_slug が ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG} ではありません。`,
    );
  }
  if (target.published !== true) {
    errors.push("このイベントはすでに非公開です。");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Pure unpublish dry-run preview for Gosaki operator UI (G-22f).
 * Does not call Supabase update or any write adapter. No physical DELETE.
 */
export function executeG22fScheduleUnpublishDryRun(input: {
  target: ScheduleRecord;
  signedIn?: boolean;
  supabaseUrl?: string;
}): G22fScheduleUnpublishDryRunResult {
  const guardErrors: string[] = [];

  if (input.signedIn === false) {
    guardErrors.push("G-22f authenticated admin session required for unpublish preview.");
  }

  if (input.supabaseUrl !== undefined) {
    try {
      assertStaticToAstroCmsStagingSupabaseProject(input.supabaseUrl);
    } catch (error) {
      guardErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const validation = validateG22fUnpublishDryRunTarget(input.target);
  const adapterResult = buildScheduleUnpublishDryRunResult({
    source: input.target,
    approvalId: G22F_SCHEDULE_UNPUBLISH_DRY_RUN_APPROVAL_ID,
  });

  const wouldUpdate = validation.ok;
  const previewOk = guardErrors.length === 0;

  return {
    ok: previewOk,
    dryRun: true,
    phase: G22F_PHASE,
    approvalId: G22F_SCHEDULE_UNPUBLISH_DRY_RUN_APPROVAL_ID,
    operation: "unpublish",
    wouldUpdate,
    wouldDelete: false,
    wouldWrite: wouldUpdate,
    actualWrite: false,
    saveAllowed: false,
    physicalDelete: false,
    target: {
      id: input.target.id,
      legacy_id: input.target.legacy_id ?? null,
      site_slug: String(input.target.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
      title: String(input.target.title ?? ""),
      date: String(input.target.date ?? ""),
    },
    before: {
      published: input.target.published === true,
    },
    after: {
      published: false,
    },
    payloadKeys: Object.keys(adapterResult.payload),
    payload: adapterResult.payload,
    validation,
    guardErrors: [...guardErrors, ...validation.errors],
    message: previewOk
      ? wouldUpdate
        ? "この公演を非公開にする予定です。データベースは変更されません。行は削除しません。"
        : "非公開化案を確認しました。保存不可の理由を確認してください。データベースは変更されません。"
      : "非公開化案を確認できませんでした。",
    rollbackHint: adapterResult.rollbackHint,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      serviceRoleUsed: false,
      actualWrite: false,
      physicalDelete: false,
    },
    adapterResult,
  };
}
