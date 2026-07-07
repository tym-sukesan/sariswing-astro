/**
 * G-22h3 — Gosaki Schedule republish dry-run (no DB write; no DELETE).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { buildScheduleRepublishDryRunResult } from "./schedule-dry-run-adapter";
import type { ScheduleDryRunResult, ScheduleRecord } from "./schedule-dry-run-types";

export const G22H3_PHASE = "G-22h3-gosaki-schedule-republish-dry-run-ui-implementation";

export const G22H_SCHEDULE_REPUBLISH_DRY_RUN_APPROVAL_ID =
  "G-22h-gosaki-schedule-republish-dry-run";

export type GosakiScheduleRepublishDraftState = {
  mode: "republish";
  targetId: string;
  targetLegacyId: string | null;
  expectedBeforeUpdatedAt: string | null;
  source: ScheduleRecord;
};

export type G22hScheduleRepublishDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  physicalDelete: false;
};

export type G22hScheduleRepublishDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G22H3_PHASE;
  approvalId: typeof G22H_SCHEDULE_REPUBLISH_DRY_RUN_APPROVAL_ID;
  operation: "republish";
  saveOperation: "republish-update";
  wouldUpdate: boolean;
  wouldDelete: false;
  wouldWrite: boolean;
  actualWrite: false;
  saveAllowed: false;
  physicalDelete: false;
  contentFieldsChanged: false;
  publicReflectionPending: true;
  target: {
    id: string;
    legacy_id: string | null;
    site_slug: string;
    title: string;
    date: string;
  };
  before: {
    published: false;
  };
  after: {
    published: true;
  };
  expectedBeforeUpdatedAt: string | null;
  payloadKeys: string[];
  payload: Record<string, unknown>;
  validation: { ok: boolean; errors: string[]; warnings: string[] };
  guardErrors: string[];
  message: string;
  rollbackHint: string;
  safety: G22hScheduleRepublishDryRunSafety;
  adapterResult: ScheduleDryRunResult;
};

export function buildGosakiScheduleRepublishDraft(
  source: ScheduleRecord,
): GosakiScheduleRepublishDraftState {
  return {
    mode: "republish",
    targetId: source.id,
    targetLegacyId: source.legacy_id ?? null,
    expectedBeforeUpdatedAt: source.updated_at ?? null,
    source: { ...source },
  };
}

export function validateG22hRepublishDryRunTarget(
  target: ScheduleRecord,
  options?: {
    expectedBeforeUpdatedAt?: string | null;
    expectedLegacyId?: string | null;
  },
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
  if (target.published !== false) {
    errors.push("このイベントはすでに公開されています（published=true）。");
  }

  const expectedUpdatedAt = options?.expectedBeforeUpdatedAt;
  if (
    expectedUpdatedAt != null &&
    String(expectedUpdatedAt).trim() !== "" &&
    String(target.updated_at ?? "") !== String(expectedUpdatedAt)
  ) {
    errors.push(
      "updated_at が一致しません。行が更新された可能性があります。一覧から再度選び直してください。",
    );
  }

  const expectedLegacyId = options?.expectedLegacyId;
  if (
    expectedLegacyId != null &&
    String(expectedLegacyId).trim() !== "" &&
    String(target.legacy_id ?? "") !== String(expectedLegacyId)
  ) {
    errors.push("legacy_id が一致しません。");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Pure republish dry-run preview for Gosaki operator UI (G-22h3).
 * Does not call Supabase update or any write adapter. No physical DELETE.
 */
export function executeG22hScheduleRepublishDryRun(input: {
  target: ScheduleRecord;
  expectedBeforeUpdatedAt?: string | null;
  expectedLegacyId?: string | null;
  signedIn?: boolean;
  supabaseUrl?: string;
}): G22hScheduleRepublishDryRunResult {
  const guardErrors: string[] = [];

  if (!input.signedIn) {
    guardErrors.push("G-22h authenticated admin session required for republish preview.");
  }

  if (input.supabaseUrl !== undefined) {
    try {
      assertStaticToAstroCmsStagingSupabaseProject(input.supabaseUrl);
    } catch (error) {
      guardErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const validation = validateG22hRepublishDryRunTarget(input.target, {
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt,
    expectedLegacyId: input.expectedLegacyId,
  });
  const adapterResult = buildScheduleRepublishDryRunResult({
    source: input.target,
    approvalId: G22H_SCHEDULE_REPUBLISH_DRY_RUN_APPROVAL_ID,
  });

  const wouldUpdate = validation.ok;
  const previewOk = guardErrors.length === 0 && validation.ok;

  return {
    ok: previewOk,
    dryRun: true,
    phase: G22H3_PHASE,
    approvalId: G22H_SCHEDULE_REPUBLISH_DRY_RUN_APPROVAL_ID,
    operation: "republish",
    saveOperation: "republish-update",
    wouldUpdate,
    wouldDelete: false,
    wouldWrite: wouldUpdate,
    actualWrite: false,
    saveAllowed: false,
    physicalDelete: false,
    contentFieldsChanged: false,
    publicReflectionPending: true,
    target: {
      id: input.target.id,
      legacy_id: input.target.legacy_id ?? null,
      site_slug: String(input.target.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
      title: String(input.target.title ?? ""),
      date: String(input.target.date ?? ""),
    },
    before: {
      published: false,
    },
    after: {
      published: true,
    },
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt ?? input.target.updated_at ?? null,
    payloadKeys: Object.keys(adapterResult.payload),
    payload: adapterResult.payload,
    validation,
    guardErrors: [...guardErrors, ...validation.errors],
    message: previewOk
      ? wouldUpdate
        ? "この公演を再公開する予定です（published を false から true に戻します）。データベースは変更されません。公開サイトへの反映は別フェーズです。"
        : "再公開案を確認しました。保存不可の理由を確認してください。データベースは変更されません。"
      : "再公開案を確認できませんでした。",
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
