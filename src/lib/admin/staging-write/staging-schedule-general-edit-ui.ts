/**
 * G-6-g1 / G-6-g2 — Browser UI for schedule general edit (staging shell only).
 * Implementation phase: do not click Save or Preview in Cursor/Playwright.
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import {
  hasStagingShellServerGateInjection,
  mergeStagingShellEnv,
} from "../staging-shell/staging-shell-client-gates";
import { executeG6G1TitleNonDryRunSave } from "./schedule-g6g1-title-non-dry-run-trigger";
import { executeG6G2TimeFieldsNonDryRunSave } from "./schedule-g6g2-time-fields-non-dry-run-trigger";
import type { ScheduleAdminReadSource } from "./schedule-admin-ui-binding";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import {
  createEditSessionBaseline,
  renderOptimisticLockDryRunHtml,
  runDryRunStaleCheck,
} from "./schedule-optimistic-lock-dry-run";
import {
  getActiveSupabaseHostFromGeneralEditEnv,
  getScheduleGeneralEditConfig,
  getScheduleG6G2TimeFieldsEditConfig,
  G6G1_SCHEDULE_TITLE_SLICE_DEFAULT_TITLE,
  G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_DEFAULT_OPEN_TIME,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_DEFAULT_START_TIME,
  G6G2_SCHEDULE_TIME_FIELDS_SLICE_TARGET_ID,
} from "./schedule-general-edit-config";
import {
  buildScheduleTitleDryRunResult,
  buildScheduleTitleSelectionError,
  formatTitleDisplay,
  type ScheduleTitleDryRunResult,
} from "./schedule-title-dry-run";
import {
  buildScheduleTimeFieldsDryRunResult,
  buildScheduleTimeFieldsSelectionError,
  formatTimeFieldDisplay,
  type ScheduleTimeFieldsDryRunResult,
} from "./schedule-time-fields-dry-run";
import { SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA } from "./schedule-write-utils";
import {
  G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID,
  G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID,
} from "./schedule-write-types";
import type { G6G1TitleNonDryRunSaveOutcome } from "./schedule-g6g1-title-non-dry-run-trigger";
import type { G6G2TimeFieldsNonDryRunSaveOutcome } from "./schedule-g6g2-time-fields-non-dry-run-trigger";
import type { ScheduleWriteAdapterResult } from "./schedule-write-types";
import { loadSchedulesForDryRunUi, type ScheduleReadResult } from "./staging-schedule-read";
import type { ScheduleGeneralEditConfig } from "./schedule-general-edit-config";

const G6G1_MANUAL_CONFIRM_TEXT = G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID;
const G6G2_MANUAL_CONFIRM_TEXT = G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID;

let schedules: ScheduleRecord[] = [];
let selectedId: string | null = null;
let readSource: ScheduleAdminReadSource = "static";
let baselineUpdatedAt: string | null = null;

let g6g1DryRunPreviewValid = false;
let lastG6g1PreviewTitle: string | null = null;
let lastG6g1PreviewChangedFields: string[] = [];
let lastG6g1PreviewStale = false;

let g6g2DryRunPreviewValid = false;
let lastG6g2PreviewOpenTime: string | null = null;
let lastG6g2PreviewStartTime: string | null = null;
let lastG6g2PreviewChangedFields: string[] = [];
let lastG6g2PreviewStale = false;

let executionInFlight = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function getInputValue(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el?.value ?? "";
}

function setInputValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.value = value;
}

function getSelectedRecord(): ScheduleRecord | null {
  if (!selectedId) return null;
  return schedules.find((s) => s.id === selectedId) ?? null;
}

function getSupabaseEnv(): { url: string; anonKey: string } {
  const env = mergeStagingShellEnv();
  const url = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return { url, anonKey };
}

function describeMockReadFallback(
  config: ScheduleGeneralEditConfig,
  result: ScheduleReadResult,
  useSupabase: boolean,
): string {
  if (result.error) return result.error;
  if (useSupabase) {
    return "Live Supabase read was attempted but fell back to mock schedules.";
  }
  const merged = mergeStagingShellEnv();
  const parts: string[] = ["Live Supabase read not enabled — using mock schedules."];
  if (!hasStagingShellServerGateInjection()) {
    parts.push(
      "Server gate injection missing (#staging-shell-server-gates). Restart dev with ENABLE_ADMIN_STAGING_DATA_READ=true.",
    );
  }
  if (!config.dataReadEnabled) {
    parts.push(
      `dataReadEnabled=false (merged ENABLE_ADMIN_STAGING_DATA_READ=${String(merged.ENABLE_ADMIN_STAGING_DATA_READ ?? "undefined")}, PUBLIC_ADMIN_DATA_PROVIDER=${String(merged.PUBLIC_ADMIN_DATA_PROVIDER ?? "undefined")}).`,
    );
  }
  if (!config.canUseSupabaseRead) {
    parts.push("PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY missing on client.");
  }
  return parts.join(" ");
}

function isG6G1ManualConfirmValid(): boolean {
  const input = document.getElementById(
    "schedule-general-edit-confirm-input",
  ) as HTMLInputElement | null;
  return input?.value.trim() === G6G1_MANUAL_CONFIRM_TEXT;
}

function isG6G2ManualConfirmValid(): boolean {
  const input = document.getElementById(
    "schedule-general-edit-g6g2-confirm-input",
  ) as HTMLInputElement | null;
  return input?.value.trim() === G6G2_MANUAL_CONFIRM_TEXT;
}

function hideStaleBanner(): void {
  const banner = document.getElementById("schedule-general-edit-stale-banner");
  if (banner) banner.hidden = true;
}

function showStaleBanner(message: string): void {
  const banner = document.getElementById("schedule-general-edit-stale-banner");
  if (!banner) return;
  banner.textContent = message;
  banner.hidden = false;
}

function invalidateG6G1DryRunPreview(): void {
  g6g1DryRunPreviewValid = false;
  lastG6g1PreviewTitle = null;
  lastG6g1PreviewChangedFields = [];
  lastG6g1PreviewStale = false;
  refreshG6G1SaveButtonState();
}

function invalidateG6G2DryRunPreview(): void {
  g6g2DryRunPreviewValid = false;
  lastG6g2PreviewOpenTime = null;
  lastG6g2PreviewStartTime = null;
  lastG6g2PreviewChangedFields = [];
  lastG6g2PreviewStale = false;
  refreshG6G2SaveButtonState();
}

function invalidateAllDryRunPreviews(): void {
  invalidateG6G1DryRunPreview();
  invalidateG6G2DryRunPreview();
}

function renderG6G1DryRunResult(result: ScheduleTitleDryRunResult): void {
  const el = document.getElementById("schedule-general-edit-dry-run-result");
  if (!el) return;
  const statusClass = result.wouldWrite
    ? "schedule-general-edit-dry-run-result__changed"
    : "schedule-general-edit-dry-run-result__unchanged";
  const changedFields =
    result.changedFields.length > 0 ? result.changedFields.join(", ") : "(none)";
  el.innerHTML = [
    `<p class="${statusClass}"><strong>${escapeHtml(result.message)}</strong></p>`,
    `<dl class="schedule-general-edit-dry-run-result__meta">`,
    `<div><dt>slice</dt><dd>G-6-g1 title</dd></div>`,
    `<div><dt>approvalId</dt><dd>${escapeHtml(result.approvalId)}</dd></div>`,
    `<div><dt>readSource</dt><dd>${escapeHtml(result.readSource)}</dd></div>`,
    `<div><dt>targetFields</dt><dd>title</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    `<div><dt>writeAdapterUsed</dt><dd>false</dd></div>`,
    `<div><dt>supabaseWriteCalled</dt><dd>false</dd></div>`,
    `</dl>`,
    renderOptimisticLockDryRunHtml(result.optimisticLock, escapeHtml),
    `<p><strong>Before title:</strong> ${escapeHtml(formatTitleDisplay(result.beforeSnapshot.title))}</p>`,
    `<pre class="schedule-general-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>`,
    `<p><em>${escapeHtml(result.rollbackHint)}</em></p>`,
  ].join("");
}

function renderG6G2DryRunResult(result: ScheduleTimeFieldsDryRunResult): void {
  const el = document.getElementById("schedule-general-edit-g6g2-dry-run-result");
  if (!el) return;
  const statusClass = result.wouldWrite
    ? "schedule-general-edit-dry-run-result__changed"
    : "schedule-general-edit-dry-run-result__unchanged";
  const changedFields =
    result.changedFields.length > 0 ? result.changedFields.join(", ") : "(none)";
  const stalePerformed = result.optimisticLock?.staleCheckPerformed ?? false;
  el.innerHTML = [
    `<p class="${statusClass}"><strong>${escapeHtml(result.message)}</strong></p>`,
    `<dl class="schedule-general-edit-dry-run-result__meta">`,
    `<div><dt>slice</dt><dd>G-6-g2 time fields</dd></div>`,
    `<div><dt>approvalId</dt><dd>${escapeHtml(result.approvalId)}</dd></div>`,
    `<div><dt>readSource</dt><dd>${escapeHtml(result.readSource)}</dd></div>`,
    `<div><dt>targetFields</dt><dd>open_time, start_time</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    `<div><dt>staleCheckPerformed</dt><dd>${stalePerformed ? "true" : "false"}</dd></div>`,
    `<div><dt>writeAdapterUsed</dt><dd>false</dd></div>`,
    `<div><dt>supabaseWriteCalled</dt><dd>false</dd></div>`,
    `</dl>`,
    renderOptimisticLockDryRunHtml(result.optimisticLock, escapeHtml),
    `<p><strong>Before open_time:</strong> ${escapeHtml(formatTimeFieldDisplay(result.beforeSnapshot.open_time))}</p>`,
    `<p><strong>Before start_time:</strong> ${escapeHtml(formatTimeFieldDisplay(result.beforeSnapshot.start_time))}</p>`,
    `<pre class="schedule-general-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.payload, null, 2))}</pre>`,
    `<p><em>${escapeHtml(result.rollbackHint)}</em></p>`,
  ].join("");
}

function renderPickerList(): void {
  const listEl = document.getElementById("schedule-general-edit-picker-list");
  if (!listEl) return;
  if (!schedules.length) {
    listEl.innerHTML =
      '<li class="schedule-general-edit-picker__empty">No schedules loaded.</li>';
    return;
  }
  listEl.innerHTML = schedules
    .map((record) => {
      const selected = record.id === selectedId ? " is-selected" : "";
      const title = formatTitleDisplay(record.title);
      const isTarget =
        record.id === G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID ? " (G-6-g target)" : "";
      return `<li class="schedule-general-edit-picker__item${selected}" data-schedule-id="${escapeHtml(record.id)}">
        <div class="schedule-general-edit-picker__main">
          <span class="schedule-general-edit-picker__date">${escapeHtml(record.date)}</span>
          <strong>${escapeHtml(title)}${escapeHtml(isTarget)}</strong>
        </div>
        <button type="button" class="admin-button admin-button--small schedule-general-edit-select-btn" data-schedule-id="${escapeHtml(record.id)}">Select</button>
      </li>`;
    })
    .join("");
}

function populateSelectedPanel(record: ScheduleRecord): void {
  const baseline = createEditSessionBaseline(record);
  baselineUpdatedAt = baseline.baselineUpdatedAt;
  setText("schedule-general-edit-target-id", record.id);
  setText("schedule-general-edit-legacy-id", record.legacy_id ?? "—");
  setText("schedule-general-edit-row-date", record.date);
  setText("schedule-general-edit-selected-id", record.id);
  setText("schedule-general-edit-baseline-updated-at", baseline.baselineUpdatedAt ?? "—");
  setText("schedule-general-edit-current-title", formatTitleDisplay(record.title));
  setText("schedule-general-edit-current-venue", record.venue ?? "—");
  setText("schedule-general-edit-current-description", record.description ?? "—");
  setText("schedule-general-edit-current-open-time", formatTimeFieldDisplay(record.open_time));
  setText("schedule-general-edit-current-start-time", formatTimeFieldDisplay(record.start_time));
  setInputValue("schedule-general-edit-title", record.title ?? G6G1_SCHEDULE_TITLE_SLICE_DEFAULT_TITLE);
  setInputValue(
    "schedule-general-edit-g6g2-open-time",
    record.open_time ?? G6G2_SCHEDULE_TIME_FIELDS_SLICE_DEFAULT_OPEN_TIME,
  );
  setInputValue(
    "schedule-general-edit-g6g2-start-time",
    record.start_time ?? G6G2_SCHEDULE_TIME_FIELDS_SLICE_DEFAULT_START_TIME,
  );
  hideStaleBanner();
  invalidateAllDryRunPreviews();
}

function selectSchedule(id: string): void {
  const record = schedules.find((s) => s.id === id);
  if (!record) return;
  selectedId = id;
  populateSelectedPanel(record);
  renderPickerList();
}

function canEnableG6G1Save(): { ok: boolean; reason: string } {
  const config = getScheduleGeneralEditConfig();
  const g6g2Config = getScheduleG6G2TimeFieldsEditConfig();
  if (g6g2Config.armed) {
    return { ok: false, reason: "G-6-g2 armed — G-6-g1 Save disabled" };
  }
  if (!config.saveEnabled) {
    return { ok: false, reason: config.armFailureReason ?? "G-6-g1 not armed" };
  }
  if (executionInFlight) return { ok: false, reason: "Save in flight" };
  if (!g6g1DryRunPreviewValid) return { ok: false, reason: "G-6-g1 dry-run preview required" };
  if (
    !lastG6g1PreviewChangedFields.includes("title") ||
    lastG6g1PreviewChangedFields.length !== 1
  ) {
    return { ok: false, reason: "G-6-g1 preview changedFields must be [title] only" };
  }
  if (lastG6g1PreviewStale) return { ok: false, reason: "Stale detected — reload rows" };
  if (readSource !== "supabase") return { ok: false, reason: "readSource must be supabase" };
  if (!isG6G1ManualConfirmValid()) return { ok: false, reason: "G-6-g1 approval ID confirm mismatch" };
  const record = getSelectedRecord();
  if (!record || record.id !== G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID) {
    return { ok: false, reason: "Select G-6-g1 target row" };
  }
  if (getInputValue("schedule-general-edit-title") !== lastG6g1PreviewTitle) {
    return { ok: false, reason: "Title changed since preview — re-run preview" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function canEnableG6G2Save(): { ok: boolean; reason: string } {
  const config = getScheduleG6G2TimeFieldsEditConfig();
  const g6g1Config = getScheduleGeneralEditConfig();
  if (g6g1Config.armed) {
    return { ok: false, reason: "G-6-g1 armed — disable G-6-g1 arm first" };
  }
  if (!config.saveEnabled) {
    return { ok: false, reason: config.armFailureReason ?? "G-6-g2 not armed" };
  }
  if (executionInFlight) return { ok: false, reason: "Save in flight" };
  if (!g6g2DryRunPreviewValid) return { ok: false, reason: "G-6-g2 dry-run preview required" };
  const expectedChanged = ["open_time", "start_time"];
  if (
    lastG6g2PreviewChangedFields.length !== 2 ||
    !expectedChanged.every((f) => lastG6g2PreviewChangedFields.includes(f))
  ) {
    return {
      ok: false,
      reason: 'G-6-g2 preview changedFields must be exactly ["open_time", "start_time"]',
    };
  }
  if (lastG6g2PreviewStale) return { ok: false, reason: "Stale detected — reload rows" };
  if (readSource !== "supabase") return { ok: false, reason: "readSource must be supabase" };
  if (!isG6G2ManualConfirmValid()) return { ok: false, reason: "G-6-g2 approval ID confirm mismatch" };
  const record = getSelectedRecord();
  if (!record || record.id !== G6G2_SCHEDULE_TIME_FIELDS_SLICE_TARGET_ID) {
    return { ok: false, reason: "Select G-6-g2 target row" };
  }
  const openTime = getInputValue("schedule-general-edit-g6g2-open-time");
  const startTime = getInputValue("schedule-general-edit-g6g2-start-time");
  if (openTime !== lastG6g2PreviewOpenTime || startTime !== lastG6g2PreviewStartTime) {
    return { ok: false, reason: "Time fields changed since preview — re-run preview" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function refreshG6G1SaveButtonState(): void {
  const config = getScheduleGeneralEditConfig();
  const saveBtn = document.getElementById(
    "schedule-general-edit-save-btn",
  ) as HTMLButtonElement | null;
  const reasonEl = document.getElementById("schedule-general-edit-save-disabled-reason");
  const gateEl = document.getElementById("schedule-general-edit-gate-status");
  if (gateEl) gateEl.textContent = config.armed ? "armed" : "not armed";
  const { ok, reason } = canEnableG6G1Save();
  if (saveBtn) {
    saveBtn.disabled = !ok;
    saveBtn.title = ok ? "G-6-g1 non-dry-run Save — manual only" : reason;
  }
  if (reasonEl) {
    reasonEl.textContent = ok ? "G-6-g1 Save enabled (operator must click manually)" : reason;
  }
}

function refreshG6G2SaveButtonState(): void {
  const config = getScheduleG6G2TimeFieldsEditConfig();
  const saveBtn = document.getElementById(
    "schedule-general-edit-g6g2-save-btn",
  ) as HTMLButtonElement | null;
  const reasonEl = document.getElementById("schedule-general-edit-g6g2-save-disabled-reason");
  const gateEl = document.getElementById("schedule-general-edit-g6g2-gate-status");
  if (gateEl) gateEl.textContent = config.armed ? "armed" : "not armed";
  const { ok, reason } = canEnableG6G2Save();
  if (saveBtn) {
    saveBtn.disabled = !ok;
    saveBtn.title = ok ? "G-6-g2 non-dry-run Save — manual only" : reason;
  }
  if (reasonEl) {
    reasonEl.textContent = ok ? "G-6-g2 Save enabled (operator must click manually)" : reason;
  }
}

function refreshAllSaveButtonStates(): void {
  refreshG6G1SaveButtonState();
  refreshG6G2SaveButtonState();
}

function renderG6G1SaveResult(
  outcome: G6G1TitleNonDryRunSaveOutcome,
  result?: ScheduleWriteAdapterResult,
): void {
  const el = document.getElementById("schedule-general-edit-save-result");
  if (!el) return;
  renderSaveResultPanel(el, {
    slice: "G-6-g1 title",
    approvalId: G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID,
    outcome,
    result,
    fieldLabels: ["title"],
    beforeValues: {
      title: result?.beforeSnapshot?.title != null ? String(result.beforeSnapshot.title) : "—",
    },
    afterValues: {
      title:
        result && "afterSnapshot" in result && result.afterSnapshot?.title != null
          ? String(result.afterSnapshot.title)
          : "—",
    },
  });
}

function renderG6G2SaveResult(
  outcome: G6G2TimeFieldsNonDryRunSaveOutcome,
  result?: ScheduleWriteAdapterResult,
): void {
  const el = document.getElementById("schedule-general-edit-g6g2-save-result");
  if (!el) return;
  renderSaveResultPanel(el, {
    slice: "G-6-g2 time fields",
    approvalId: G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID,
    outcome,
    result,
    fieldLabels: ["open_time", "start_time"],
    beforeValues: {
      open_time:
        result?.beforeSnapshot?.open_time != null
          ? String(result.beforeSnapshot.open_time)
          : formatTimeFieldDisplay(result?.beforeSnapshot?.open_time),
      start_time:
        result?.beforeSnapshot?.start_time != null
          ? String(result.beforeSnapshot.start_time)
          : formatTimeFieldDisplay(result?.beforeSnapshot?.start_time),
    },
    afterValues: {
      open_time:
        result && "afterSnapshot" in result && result.afterSnapshot?.open_time != null
          ? String(result.afterSnapshot.open_time)
          : "—",
      start_time:
        result && "afterSnapshot" in result && result.afterSnapshot?.start_time != null
          ? String(result.afterSnapshot.start_time)
          : "—",
    },
  });
}

function renderSaveResultPanel(
  el: HTMLElement,
  input: {
    slice: string;
    approvalId: string;
    outcome: {
      optimisticLockEnabled: boolean;
      expectedBeforeUpdatedAt: string | null;
      warnings: string[];
      errorCode?: string;
      errorMessage?: string;
    };
    result?: ScheduleWriteAdapterResult;
    fieldLabels: string[];
    beforeValues: Record<string, string>;
    afterValues: Record<string, string>;
  },
): void {
  const actualWrite =
    input.result && "actualWrite" in input.result ? String(input.result.actualWrite) : "false";
  const beforeUpdatedAt =
    input.result?.beforeSnapshot?.updated_at != null
      ? String(input.result.beforeSnapshot.updated_at)
      : "—";
  const afterUpdatedAt =
    input.result && "afterSnapshot" in input.result && input.result.afterSnapshot?.updated_at != null
      ? String(input.result.afterSnapshot.updated_at)
      : "—";
  const changedFields =
    input.result && "changedFields" in input.result && Array.isArray(input.result.changedFields)
      ? input.result.changedFields.join(", ")
      : "—";
  const errorCode =
    input.result && "errorCode" in input.result && input.result.errorCode
      ? String(input.result.errorCode)
      : input.outcome.errorCode ?? "—";
  const errorMessage =
    input.result && "errorMessage" in input.result && input.result.errorMessage
      ? String(input.result.errorMessage)
      : input.outcome.errorMessage ?? "—";
  const rollbackHint =
    input.result && "rollbackHint" in input.result && input.result.rollbackHint
      ? String(input.result.rollbackHint)
      : "—";
  const lockStatus =
    errorCode === "optimistic_lock_failed"
      ? SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA
      : input.outcome.optimisticLockEnabled
        ? "enabled"
        : "disabled";
  const warningHtml =
    input.outcome.warnings.length > 0
      ? `<ul>${input.outcome.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
      : "";
  const fieldRows = input.fieldLabels
    .flatMap((label) => [
      `<div><dt>beforeSnapshot.${label}</dt><dd>${escapeHtml(input.beforeValues[label] ?? "—")}</dd></div>`,
      `<div><dt>afterSnapshot.${label}</dt><dd>${escapeHtml(input.afterValues[label] ?? "—")}</dd></div>`,
    ])
    .join("");

  el.innerHTML = [
    warningHtml,
    `<p><strong>Slice:</strong> ${escapeHtml(input.slice)}</p>`,
    `<p><strong>Status:</strong> ${escapeHtml(actualWrite === "true" ? "executed" : "failed or blocked")}</p>`,
    "<dl>",
    `<div><dt>actualWrite</dt><dd>${escapeHtml(actualWrite)}</dd></div>`,
    `<div><dt>approvalId</dt><dd>${escapeHtml(input.approvalId)}</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    fieldRows,
    `<div><dt>beforeSnapshot.updated_at</dt><dd>${escapeHtml(beforeUpdatedAt)}</dd></div>`,
    `<div><dt>afterSnapshot.updated_at</dt><dd>${escapeHtml(afterUpdatedAt)}</dd></div>`,
    `<div><dt>optimisticLock</dt><dd>${escapeHtml(lockStatus)}</dd></div>`,
    `<div><dt>expectedBeforeUpdatedAt</dt><dd>${escapeHtml(input.outcome.expectedBeforeUpdatedAt ?? "—")}</dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(errorCode)}</dd></div>`,
    `<div><dt>errorMessage</dt><dd>${escapeHtml(errorMessage)}</dd></div>`,
    `<div><dt>rollbackHint</dt><dd>${escapeHtml(rollbackHint)}</dd></div>`,
    `<div><dt>serviceRoleUsed</dt><dd>false</dd></div>`,
    `<div><dt>schedule_months</dt><dd>read_only_derived (not touched)</dd></div>`,
    "</dl>",
    input.result
      ? `<pre class="schedule-general-edit-save-result__json">${escapeHtml(JSON.stringify(input.result, null, 2))}</pre>`
      : "",
  ].join("");
}

async function handleG6G1PreviewDryRunAsync(): Promise<void> {
  const config = getScheduleGeneralEditConfig();
  const g6g2Config = getScheduleG6G2TimeFieldsEditConfig();
  if (!config.previewEnabled || g6g2Config.armed) return;
  const record = getSelectedRecord();
  if (!record) {
    renderG6G1DryRunResult(
      buildScheduleTitleSelectionError({
        message: "Select a schedule row first.",
        approvalId: config.dryRunPreviewApprovalId,
        readSource,
      }),
    );
    invalidateG6G1DryRunPreview();
    return;
  }
  const title = getInputValue("schedule-general-edit-title");
  const { url, anonKey } = getSupabaseEnv();
  const optimisticLock = await runDryRunStaleCheck({
    url,
    anonKey,
    scheduleId: record.id,
    baselineUpdatedAt,
    liveSupabaseRead: readSource === "supabase",
  });
  if (optimisticLock.staleDetected && optimisticLock.message) {
    showStaleBanner(optimisticLock.message);
    lastG6g1PreviewStale = true;
    g6g1DryRunPreviewValid = false;
  } else {
    hideStaleBanner();
    lastG6g1PreviewStale = false;
    g6g1DryRunPreviewValid = true;
    lastG6g1PreviewTitle = title;
  }
  const result = buildScheduleTitleDryRunResult({
    source: record,
    title,
    approvalId: config.dryRunPreviewApprovalId,
    readSource,
    optimisticLock,
  });
  lastG6g1PreviewChangedFields = result.changedFields;
  if (!result.wouldWrite) g6g1DryRunPreviewValid = false;
  renderG6G1DryRunResult(result);
  refreshAllSaveButtonStates();
}

async function handleG6G2PreviewDryRunAsync(): Promise<void> {
  const config = getScheduleG6G2TimeFieldsEditConfig();
  if (!config.previewEnabled) return;
  const record = getSelectedRecord();
  if (!record) {
    renderG6G2DryRunResult(
      buildScheduleTimeFieldsSelectionError({
        message: "Select a schedule row first.",
        approvalId: config.dryRunPreviewApprovalId,
        readSource,
      }),
    );
    invalidateG6G2DryRunPreview();
    return;
  }
  const openTime = getInputValue("schedule-general-edit-g6g2-open-time");
  const startTime = getInputValue("schedule-general-edit-g6g2-start-time");
  const { url, anonKey } = getSupabaseEnv();
  const optimisticLock = await runDryRunStaleCheck({
    url,
    anonKey,
    scheduleId: record.id,
    baselineUpdatedAt,
    liveSupabaseRead: readSource === "supabase",
  });
  if (optimisticLock.staleDetected && optimisticLock.message) {
    showStaleBanner(optimisticLock.message);
    lastG6g2PreviewStale = true;
    g6g2DryRunPreviewValid = false;
  } else {
    hideStaleBanner();
    lastG6g2PreviewStale = false;
    g6g2DryRunPreviewValid = true;
    lastG6g2PreviewOpenTime = openTime;
    lastG6g2PreviewStartTime = startTime;
  }
  const result = buildScheduleTimeFieldsDryRunResult({
    source: record,
    openTime,
    startTime,
    approvalId: config.dryRunPreviewApprovalId,
    readSource,
    optimisticLock,
  });
  lastG6g2PreviewChangedFields = result.changedFields;
  const exactFields =
    result.changedFields.length === 2 &&
    result.changedFields.includes("open_time") &&
    result.changedFields.includes("start_time");
  if (!result.wouldWrite || !exactFields) g6g2DryRunPreviewValid = false;
  renderG6G2DryRunResult(result);
  refreshAllSaveButtonStates();
}

async function handleG6G1SaveAsync(): Promise<void> {
  const check = canEnableG6G1Save();
  if (!check.ok || executionInFlight) return;
  const record = getSelectedRecord();
  if (!record) return;
  executionInFlight = true;
  refreshAllSaveButtonStates();
  const title = getInputValue("schedule-general-edit-title");
  const { url, anonKey } = getSupabaseEnv();
  const outcome = await executeG6G1TitleNonDryRunSave({
    url,
    anonKey,
    beforeSnapshot: record,
    payload: { title },
  });
  renderG6G1SaveResult(outcome, outcome.result);
  void refreshAuthWriteDebugPanel();
  if (
    outcome.result &&
    "actualWrite" in outcome.result &&
    outcome.result.actualWrite &&
    "afterSnapshot" in outcome.result &&
    outcome.result.afterSnapshot
  ) {
    const idx = schedules.findIndex((s) => s.id === record.id);
    if (idx >= 0) {
      schedules[idx] = {
        ...schedules[idx],
        title: outcome.result.afterSnapshot.title ?? title,
        updated_at: outcome.result.afterSnapshot.updated_at ?? schedules[idx].updated_at,
      };
      populateSelectedPanel(schedules[idx]);
    }
    invalidateG6G1DryRunPreview();
  }
  executionInFlight = false;
  refreshAllSaveButtonStates();
}

async function handleG6G2SaveAsync(): Promise<void> {
  const check = canEnableG6G2Save();
  if (!check.ok || executionInFlight) return;
  const record = getSelectedRecord();
  if (!record) return;
  executionInFlight = true;
  refreshAllSaveButtonStates();
  const openTime = getInputValue("schedule-general-edit-g6g2-open-time");
  const startTime = getInputValue("schedule-general-edit-g6g2-start-time");
  const { url, anonKey } = getSupabaseEnv();
  const outcome = await executeG6G2TimeFieldsNonDryRunSave({
    url,
    anonKey,
    beforeSnapshot: record,
    payload: { open_time: openTime, start_time: startTime },
  });
  renderG6G2SaveResult(outcome, outcome.result);
  void refreshAuthWriteDebugPanel();
  if (
    outcome.result &&
    "actualWrite" in outcome.result &&
    outcome.result.actualWrite &&
    "afterSnapshot" in outcome.result &&
    outcome.result.afterSnapshot
  ) {
    const idx = schedules.findIndex((s) => s.id === record.id);
    if (idx >= 0) {
      schedules[idx] = {
        ...schedules[idx],
        open_time: outcome.result.afterSnapshot.open_time ?? openTime,
        start_time: outcome.result.afterSnapshot.start_time ?? startTime,
        updated_at: outcome.result.afterSnapshot.updated_at ?? schedules[idx].updated_at,
      };
      populateSelectedPanel(schedules[idx]);
    }
    invalidateG6G2DryRunPreview();
  }
  executionInFlight = false;
  refreshAllSaveButtonStates();
}

async function loadSchedules(): Promise<void> {
  const config = getScheduleGeneralEditConfig();
  setText("schedule-general-edit-read-source", "loading…");
  setText("schedule-general-edit-data-read", config.dataReadEnabled ? "enabled" : "off");
  setText("schedule-general-edit-supabase-host", getActiveSupabaseHostFromGeneralEditEnv());
  if (!config.previewEnabled) {
    setText("schedule-general-edit-read-source", "disabled");
    return;
  }
  const { url, anonKey } = getSupabaseEnv();
  const useSupabase = config.dataReadEnabled;
  const result = await loadSchedulesForDryRunUi({ url, anonKey, useSupabase });
  schedules = result.records;
  readSource =
    result.source === "supabase" && useSupabase
      ? "supabase"
      : result.source === "mock"
        ? "mock"
        : "static";
  setText(
    "schedule-general-edit-read-source",
    readSource + (result.error ? ` (${result.error})` : ""),
  );
  const notice = document.getElementById("schedule-general-edit-read-notice");
  if (notice) {
    if (readSource !== "supabase") {
      notice.textContent = describeMockReadFallback(config, result, useSupabase);
      notice.hidden = false;
    } else if (result.error) {
      notice.textContent = result.error;
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }
  }
  const target = schedules.find((s) => s.id === G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID);
  if (target) {
    selectSchedule(target.id);
  } else if (!selectedId && schedules.length > 0) {
    selectSchedule(schedules[0].id);
  } else if (selectedId) {
    const refreshed = schedules.find((s) => s.id === selectedId);
    if (refreshed) populateSelectedPanel(refreshed);
    renderPickerList();
    hideStaleBanner();
    invalidateAllDryRunPreviews();
  } else {
    renderPickerList();
  }
  refreshAllSaveButtonStates();
}

function bindScheduleGeneralEditUi(): void {
  const config = getScheduleGeneralEditConfig();
  const root = document.getElementById("schedule-general-edit-root");
  if (!root || !config.sectionVisible) return;
  void loadSchedules();
  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const btn = target.closest(".schedule-general-edit-select-btn") as HTMLElement | null;
    if (btn?.dataset.scheduleId) selectSchedule(btn.dataset.scheduleId);
  });
  document.getElementById("schedule-general-edit-preview-btn")?.addEventListener("click", () => {
    void handleG6G1PreviewDryRunAsync();
  });
  document.getElementById("schedule-general-edit-g6g2-preview-btn")?.addEventListener("click", () => {
    void handleG6G2PreviewDryRunAsync();
  });
  document.getElementById("schedule-general-edit-reload-btn")?.addEventListener("click", () => {
    void loadSchedules();
  });
  document.getElementById("schedule-general-edit-save-btn")?.addEventListener("click", () => {
    void handleG6G1SaveAsync();
  });
  document.getElementById("schedule-general-edit-g6g2-save-btn")?.addEventListener("click", () => {
    void handleG6G2SaveAsync();
  });
  document.getElementById("schedule-general-edit-confirm-input")?.addEventListener("input", () => {
    refreshG6G1SaveButtonState();
  });
  document.getElementById("schedule-general-edit-g6g2-confirm-input")?.addEventListener("input", () => {
    refreshG6G2SaveButtonState();
  });
  document.getElementById("schedule-general-edit-title")?.addEventListener("input", () => {
    invalidateG6G1DryRunPreview();
  });
  document.getElementById("schedule-general-edit-g6g2-open-time")?.addEventListener("input", () => {
    invalidateG6G2DryRunPreview();
  });
  document.getElementById("schedule-general-edit-g6g2-start-time")?.addEventListener("input", () => {
    invalidateG6G2DryRunPreview();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindScheduleGeneralEditUi);
  } else {
    bindScheduleGeneralEditUi();
  }
}
