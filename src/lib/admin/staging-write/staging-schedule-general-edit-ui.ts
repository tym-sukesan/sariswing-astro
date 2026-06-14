/**
 * G-6-g1 — Browser UI for schedule general edit (title slice; staging shell only).
 * Implementation phase: do not click Save in Cursor/Playwright.
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import {
  hasStagingShellServerGateInjection,
  mergeStagingShellEnv,
} from "../staging-shell/staging-shell-client-gates";
import { executeG6G1TitleNonDryRunSave } from "./schedule-g6g1-title-non-dry-run-trigger";
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
  G6G1_SCHEDULE_TITLE_SLICE_DEFAULT_TITLE,
  G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID,
} from "./schedule-general-edit-config";
import {
  buildScheduleTitleDryRunResult,
  buildScheduleTitleSelectionError,
  formatTitleDisplay,
  type ScheduleTitleDryRunResult,
} from "./schedule-title-dry-run";
import {
  SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA,
} from "./schedule-write-utils";
import { G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID } from "./schedule-write-types";
import type { G6G1TitleNonDryRunSaveOutcome } from "./schedule-g6g1-title-non-dry-run-trigger";
import type { ScheduleWriteAdapterResult } from "./schedule-write-types";
import { loadSchedulesForDryRunUi, type ScheduleReadResult } from "./staging-schedule-read";
import type { ScheduleGeneralEditConfig } from "./schedule-general-edit-config";

const MANUAL_CONFIRM_TEXT = G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID;

let schedules: ScheduleRecord[] = [];
let selectedId: string | null = null;
let readSource: ScheduleAdminReadSource = "static";
let baselineUpdatedAt: string | null = null;
let dryRunPreviewValid = false;
let lastPreviewTitle: string | null = null;
let lastPreviewChangedFields: string[] = [];
let lastPreviewStale = false;
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
  if (result.error) {
    return result.error;
  }
  if (useSupabase) {
    return "Live Supabase read was attempted but fell back to mock schedules.";
  }

  const merged = mergeStagingShellEnv();
  const parts: string[] = [
    "Live Supabase read not enabled — using mock schedules.",
  ];
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

function isManualConfirmValid(): boolean {
  const input = document.getElementById(
    "schedule-general-edit-confirm-input",
  ) as HTMLInputElement | null;
  return input?.value.trim() === MANUAL_CONFIRM_TEXT;
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

function invalidateDryRunPreview(): void {
  dryRunPreviewValid = false;
  lastPreviewTitle = null;
  lastPreviewChangedFields = [];
  lastPreviewStale = false;
  refreshSaveButtonState();
}

function renderDryRunResult(result: ScheduleTitleDryRunResult): void {
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
    `<div><dt>approvalId</dt><dd>${escapeHtml(result.approvalId)}</dd></div>`,
    `<div><dt>readSource</dt><dd>${escapeHtml(result.readSource)}</dd></div>`,
    `<div><dt>operation</dt><dd>${escapeHtml(result.operation)}</dd></div>`,
    `<div><dt>targetId</dt><dd><code>${escapeHtml(result.targetId || "—")}</code></dd></div>`,
    result.legacyId
      ? `<div><dt>legacy_id</dt><dd><code>${escapeHtml(result.legacyId)}</code></dd></div>`
      : "",
    `<div><dt>targetFields</dt><dd>title</dd></div>`,
    `<div><dt>dryRun</dt><dd>true</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    `<div><dt>writeAdapterUsed</dt><dd>false</dd></div>`,
    `<div><dt>supabaseWriteCalled</dt><dd>false</dd></div>`,
    `</dl>`,
    renderOptimisticLockDryRunHtml(result.optimisticLock, escapeHtml),
    `<p><strong>Before title:</strong> ${escapeHtml(formatTitleDisplay(result.beforeSnapshot.title))}</p>`,
    `<p><strong>Payload:</strong></p>`,
    `<pre class="schedule-general-edit-dry-run-result__block">${escapeHtml(
      JSON.stringify(result.payload, null, 2),
    )}</pre>`,
    `<p><strong>After preview title:</strong> ${escapeHtml(result.afterPreview.title)}</p>`,
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
        record.id === G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID ? " (G-6-g1 target)" : "";
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
  setText(
    "schedule-general-edit-baseline-updated-at",
    baseline.baselineUpdatedAt ?? "—",
  );
  setText("schedule-general-edit-current-title", formatTitleDisplay(record.title));
  setText("schedule-general-edit-current-venue", record.venue ?? "—");
  setText("schedule-general-edit-current-description", record.description ?? "—");
  setInputValue("schedule-general-edit-title", record.title ?? G6G1_SCHEDULE_TITLE_SLICE_DEFAULT_TITLE);
  hideStaleBanner();
  invalidateDryRunPreview();
}

function selectSchedule(id: string): void {
  const record = schedules.find((s) => s.id === id);
  if (!record) return;
  selectedId = id;
  populateSelectedPanel(record);
  renderPickerList();
}

function canEnableSave(): { ok: boolean; reason: string } {
  const config = getScheduleGeneralEditConfig();
  if (!config.saveEnabled) {
    return { ok: false, reason: config.armFailureReason ?? "G-6-g1 not armed" };
  }
  if (executionInFlight) {
    return { ok: false, reason: "Save in flight" };
  }
  if (!dryRunPreviewValid) {
    return { ok: false, reason: "Dry-run preview required" };
  }
  if (!lastPreviewChangedFields.includes("title") || lastPreviewChangedFields.length !== 1) {
    return { ok: false, reason: "Preview changedFields must be [title] only" };
  }
  if (lastPreviewStale) {
    return { ok: false, reason: "Stale detected — reload rows" };
  }
  if (readSource !== "supabase") {
    return { ok: false, reason: "readSource must be supabase" };
  }
  if (!isManualConfirmValid()) {
    return { ok: false, reason: "Approval ID confirm mismatch" };
  }
  const record = getSelectedRecord();
  if (!record || record.id !== G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID) {
    return { ok: false, reason: "Select G-6-g1 target row" };
  }
  const currentTitle = getInputValue("schedule-general-edit-title");
  if (currentTitle !== lastPreviewTitle) {
    return { ok: false, reason: "Title changed since preview — re-run preview" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function refreshSaveButtonState(): void {
  const config = getScheduleGeneralEditConfig();
  const saveBtn = document.getElementById(
    "schedule-general-edit-save-btn",
  ) as HTMLButtonElement | null;
  const reasonEl = document.getElementById("schedule-general-edit-save-disabled-reason");
  const gateEl = document.getElementById("schedule-general-edit-gate-status");

  if (gateEl) {
    gateEl.textContent = config.armed ? "armed" : "not armed";
  }

  const { ok, reason } = canEnableSave();
  if (saveBtn) {
    saveBtn.disabled = !ok;
    saveBtn.title = ok
      ? "Non-dry-run Save — manual operator action only"
      : reason;
  }
  if (reasonEl) {
    reasonEl.textContent = ok ? "Save enabled (operator must click manually)" : reason;
  }
}

function renderSaveResult(
  outcome: G6G1TitleNonDryRunSaveOutcome,
  result?: ScheduleWriteAdapterResult,
): void {
  const el = document.getElementById("schedule-general-edit-save-result");
  if (!el) return;

  const actualWrite =
    result && "actualWrite" in result ? String(result.actualWrite) : "false";
  const beforeTitle =
    result?.beforeSnapshot?.title != null ? String(result.beforeSnapshot.title) : "—";
  const afterTitle =
    result && "afterSnapshot" in result && result.afterSnapshot?.title != null
      ? String(result.afterSnapshot.title)
      : "—";
  const beforeUpdatedAt =
    result?.beforeSnapshot?.updated_at != null
      ? String(result.beforeSnapshot.updated_at)
      : "—";
  const afterUpdatedAt =
    result && "afterSnapshot" in result && result.afterSnapshot?.updated_at != null
      ? String(result.afterSnapshot.updated_at)
      : "—";
  const changedFields =
    result && "changedFields" in result && Array.isArray(result.changedFields)
      ? result.changedFields.join(", ")
      : "—";
  const errorCode =
    result && "errorCode" in result && result.errorCode
      ? String(result.errorCode)
      : outcome.errorCode ?? "—";
  const errorMessage =
    result && "errorMessage" in result && result.errorMessage
      ? String(result.errorMessage)
      : outcome.errorMessage ?? "—";
  const rollbackHint =
    result && "rollbackHint" in result && result.rollbackHint
      ? String(result.rollbackHint)
      : "—";

  const lockStatus =
    errorCode === "optimistic_lock_failed"
      ? SCHEDULE_OPTIMISTIC_LOCK_CONFLICT_MESSAGE_JA
      : outcome.optimisticLockEnabled
        ? "enabled"
        : "disabled";

  const warningHtml =
    outcome.warnings.length > 0
      ? `<ul>${outcome.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
      : "";

  el.innerHTML = [
    warningHtml,
    `<p><strong>Status:</strong> ${escapeHtml(actualWrite === "true" ? "executed" : "failed or blocked")}</p>`,
    "<dl>",
    `<div><dt>actualWrite</dt><dd>${escapeHtml(actualWrite)}</dd></div>`,
    `<div><dt>approvalId</dt><dd>${escapeHtml(G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID)}</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    `<div><dt>beforeSnapshot.title</dt><dd>${escapeHtml(beforeTitle)}</dd></div>`,
    `<div><dt>afterSnapshot.title</dt><dd>${escapeHtml(afterTitle)}</dd></div>`,
    `<div><dt>beforeSnapshot.updated_at</dt><dd>${escapeHtml(beforeUpdatedAt)}</dd></div>`,
    `<div><dt>afterSnapshot.updated_at</dt><dd>${escapeHtml(afterUpdatedAt)}</dd></div>`,
    `<div><dt>optimisticLock</dt><dd>${escapeHtml(lockStatus)}</dd></div>`,
    `<div><dt>expectedBeforeUpdatedAt</dt><dd>${escapeHtml(outcome.expectedBeforeUpdatedAt ?? "—")}</dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(errorCode)}</dd></div>`,
    `<div><dt>errorMessage</dt><dd>${escapeHtml(errorMessage)}</dd></div>`,
    `<div><dt>rollbackHint</dt><dd>${escapeHtml(rollbackHint)}</dd></div>`,
    `<div><dt>serviceRoleUsed</dt><dd>false</dd></div>`,
    `<div><dt>schedule_months</dt><dd>read_only_derived (not touched)</dd></div>`,
    "</dl>",
    result
      ? `<pre class="schedule-general-edit-save-result__json">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`
      : "",
  ].join("");
}

async function handlePreviewDryRunAsync(): Promise<void> {
  const config = getScheduleGeneralEditConfig();
  if (!config.previewEnabled) return;

  const record = getSelectedRecord();
  if (!record) {
    renderDryRunResult(
      buildScheduleTitleSelectionError({
        message: "Select a schedule row first.",
        approvalId: config.dryRunPreviewApprovalId,
        readSource,
      }),
    );
    invalidateDryRunPreview();
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
    lastPreviewStale = true;
    dryRunPreviewValid = false;
  } else {
    hideStaleBanner();
    lastPreviewStale = false;
    dryRunPreviewValid = true;
    lastPreviewTitle = title;
  }

  const result = buildScheduleTitleDryRunResult({
    source: record,
    title,
    approvalId: config.dryRunPreviewApprovalId,
    readSource,
    optimisticLock,
  });

  lastPreviewChangedFields = result.changedFields;
  if (!result.wouldWrite) {
    dryRunPreviewValid = false;
  }

  renderDryRunResult(result);
  refreshSaveButtonState();
}

async function handleSaveAsync(): Promise<void> {
  const check = canEnableSave();
  if (!check.ok || executionInFlight) return;

  const record = getSelectedRecord();
  if (!record) return;

  executionInFlight = true;
  refreshSaveButtonState();

  const title = getInputValue("schedule-general-edit-title");
  const { url, anonKey } = getSupabaseEnv();

  const outcome = await executeG6G1TitleNonDryRunSave({
    url,
    anonKey,
    beforeSnapshot: record,
    payload: { title },
  });

  renderSaveResult(outcome, outcome.result);
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
    invalidateDryRunPreview();
  }

  executionInFlight = false;
  refreshSaveButtonState();
}

async function loadSchedules(): Promise<void> {
  const config = getScheduleGeneralEditConfig();
  setText("schedule-general-edit-read-source", "loading…");
  setText(
    "schedule-general-edit-data-read",
    config.dataReadEnabled ? "enabled" : "off",
  );
  setText(
    "schedule-general-edit-supabase-host",
    getActiveSupabaseHostFromGeneralEditEnv(),
  );

  if (!config.previewEnabled) {
    setText("schedule-general-edit-read-source", "disabled");
    return;
  }

  const { url, anonKey } = getSupabaseEnv();
  // Use merged server-injected ENABLE_* gates (G-6-d client fix) — not raw import.meta.env.
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
    invalidateDryRunPreview();
  } else {
    renderPickerList();
  }

  refreshSaveButtonState();
}

function bindScheduleGeneralEditUi(): void {
  const config = getScheduleGeneralEditConfig();
  const root = document.getElementById("schedule-general-edit-root");
  if (!root || !config.sectionVisible) return;

  void loadSchedules();

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const btn = target.closest(".schedule-general-edit-select-btn") as HTMLElement | null;
    if (btn?.dataset.scheduleId) {
      selectSchedule(btn.dataset.scheduleId);
    }
  });

  document
    .getElementById("schedule-general-edit-preview-btn")
    ?.addEventListener("click", () => {
      void handlePreviewDryRunAsync();
    });

  document
    .getElementById("schedule-general-edit-reload-btn")
    ?.addEventListener("click", () => {
      void loadSchedules();
    });

  document
    .getElementById("schedule-general-edit-save-btn")
    ?.addEventListener("click", () => {
      void handleSaveAsync();
    });

  document
    .getElementById("schedule-general-edit-confirm-input")
    ?.addEventListener("input", () => refreshSaveButtonState());

  document
    .getElementById("schedule-general-edit-title")
    ?.addEventListener("input", () => invalidateDryRunPreview());
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindScheduleGeneralEditUi);
  } else {
    bindScheduleGeneralEditUi();
  }
}
