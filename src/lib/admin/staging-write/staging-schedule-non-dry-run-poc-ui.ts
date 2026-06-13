/**
 * G-6-e5 — Browser UI for hidden schedule non-dry-run PoC trigger (staging shell only).
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import {
  extractSupabaseHost,
  getScheduleNonDryRunPocConfig,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
} from "./schedule-non-dry-run-poc-config";
import {
  loadScheduleNonDryRunPocPanelSnapshot,
  mapAdapterErrorCode,
  saveScheduleNonDryRunPocPanelSnapshot,
  SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES,
  type ScheduleNonDryRunPocPanelSnapshot,
} from "./schedule-non-dry-run-poc-error";
import {
  executeScheduleNonDryRunPoc,
  SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION,
  SCHEDULE_NON_DRY_RUN_POC_FIXED_PAYLOAD,
  SCHEDULE_NON_DRY_RUN_POC_LEGACY_ID,
  type ScheduleNonDryRunPocExecutionOutcome,
} from "./schedule-non-dry-run-poc-trigger";
import { SCHEDULE_WRITE_APPROVAL_ID } from "./schedule-write-types";
import type { ScheduleWriteAdapterResult } from "./schedule-write-types";

const MANUAL_CONFIRM_TEXT = SCHEDULE_WRITE_APPROVAL_ID;

let executionInFlight = false;

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return { url, anonKey };
}

function isManualConfirmValid(): boolean {
  const input = document.getElementById(
    "schedule-non-dry-run-poc-confirm-input",
  ) as HTMLInputElement | null;
  return input?.value.trim() === MANUAL_CONFIRM_TEXT;
}

function scrollToDangerZone(): void {
  const root = document.getElementById("schedule-non-dry-run-poc-trigger-root");
  root?.scrollIntoView({ behavior: "smooth", block: "start" });
  document
    .getElementById("schedule-non-dry-run-poc-result")
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function refreshRunButtonState(): void {
  const config = getScheduleNonDryRunPocConfig();
  const runBtn = document.getElementById(
    "schedule-non-dry-run-poc-run-btn",
  ) as HTMLButtonElement | null;
  if (!runBtn) return;
  if (executionInFlight) {
    runBtn.disabled = true;
    return;
  }
  const ready = config.enabled && isManualConfirmValid();
  runBtn.disabled = !ready;
  runBtn.title = ready
    ? "One-off staging schedule update — irreversible without rollback"
    : config.disabledReason ?? "Complete manual confirmation to enable";
}

function buildPanelSnapshot(
  fields: Partial<ScheduleNonDryRunPocPanelSnapshot> & Pick<ScheduleNonDryRunPocPanelSnapshot, "status">,
): ScheduleNonDryRunPocPanelSnapshot {
  return {
    status: fields.status,
    actualWrite: fields.actualWrite ?? "—",
    operation: fields.operation ?? "update",
    targetTable: fields.targetTable ?? "schedules",
    targetId: fields.targetId ?? SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
    authEmail: fields.authEmail ?? "—",
    authStatus: fields.authStatus ?? "—",
    mockRole: fields.mockRole ?? "—",
    warnings: fields.warnings ?? [],
    errorCode: fields.errorCode ?? "—",
    errorMessage: fields.errorMessage ?? "—",
    abortReason: fields.abortReason ?? "—",
    beforeDescription: fields.beforeDescription ?? SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION,
    afterDescription: fields.afterDescription ?? "—",
    timestamp: fields.timestamp ?? new Date().toISOString(),
  };
}

function renderPanelSnapshot(snapshot: ScheduleNonDryRunPocPanelSnapshot): void {
  const el = document.getElementById("schedule-non-dry-run-poc-result");
  if (!el) return;

  const warningHtml =
    snapshot.warnings.length > 0
      ? `<ul class="schedule-non-dry-run-poc-result__warnings">${snapshot.warnings
          .map((w) => `<li>${escapeHtml(w)}</li>`)
          .join("")}</ul>`
      : "";

  el.innerHTML = [
    warningHtml,
    `<p class="schedule-non-dry-run-poc-result__status">${escapeHtml(snapshot.status)}</p>`,
    "<dl>",
    `<div><dt>actualWrite</dt><dd>${escapeHtml(snapshot.actualWrite)}</dd></div>`,
    `<div><dt>operation</dt><dd>${escapeHtml(snapshot.operation)}</dd></div>`,
    `<div><dt>targetTable</dt><dd>${escapeHtml(snapshot.targetTable)}</dd></div>`,
    `<div><dt>targetId</dt><dd>${escapeHtml(snapshot.targetId)}</dd></div>`,
    `<div><dt>authEmail</dt><dd>${escapeHtml(snapshot.authEmail)}</dd></div>`,
    `<div><dt>authStatus</dt><dd>${escapeHtml(snapshot.authStatus)}</dd></div>`,
    `<div><dt>mockRole</dt><dd>${escapeHtml(snapshot.mockRole)}</dd></div>`,
    `<div><dt>beforeSnapshot.description</dt><dd>${escapeHtml(snapshot.beforeDescription)}</dd></div>`,
    `<div><dt>afterSnapshot.description</dt><dd>${escapeHtml(snapshot.afterDescription)}</dd></div>`,
    `<div><dt>preCheck.abortReason</dt><dd>${escapeHtml(snapshot.abortReason)}</dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(snapshot.errorCode)}</dd></div>`,
    `<div><dt>errorMessage</dt><dd>${escapeHtml(snapshot.errorMessage)}</dd></div>`,
    `<div><dt>timestamp</dt><dd>${escapeHtml(snapshot.timestamp)}</dd></div>`,
    "</dl>",
  ].join("");

  saveScheduleNonDryRunPocPanelSnapshot(snapshot);
}

function renderNotExecutedPanel(): void {
  renderPanelSnapshot(
    buildPanelSnapshot({
      status: "not executed",
    }),
  );
}

function renderOutcomePanel(outcome: ScheduleNonDryRunPocExecutionOutcome): void {
  if (outcome.result) {
    renderWriteResultPanel(outcome.result, outcome);
    return;
  }

  const snapshot = buildPanelSnapshot({
    status: "failed or blocked",
    actualWrite: "false",
    authEmail: outcome.authEmail ?? "—",
    authStatus: outcome.authStatus ?? "—",
    mockRole: outcome.mockRole ?? "—",
    warnings: outcome.preCheck.warnings,
    errorCode: outcome.errorCode ?? "—",
    errorMessage: outcome.errorMessage ?? outcome.preCheck.abortReason ?? "—",
    abortReason: outcome.preCheck.abortReason ?? "—",
  });
  renderPanelSnapshot(snapshot);
}

function renderWriteResultPanel(
  result: ScheduleWriteAdapterResult,
  outcome: ScheduleNonDryRunPocExecutionOutcome,
): void {
  const actualWrite = "actualWrite" in result ? String(result.actualWrite) : "false";
  const beforeDesc =
    result.beforeSnapshot?.description != null
      ? String(result.beforeSnapshot.description)
      : SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION;
  const afterDesc =
    "afterSnapshot" in result && result.afterSnapshot?.description != null
      ? String(result.afterSnapshot.description)
      : "—";
  const adapterErrorCode =
    "errorCode" in result && result.errorCode
      ? mapAdapterErrorCode(String(result.errorCode))
      : "—";
  const adapterErrorMessage =
    "errorMessage" in result && result.errorMessage
      ? String(result.errorMessage)
      : "—";

  const snapshot = buildPanelSnapshot({
    status: actualWrite === "true" ? "executed" : "failed or blocked",
    actualWrite,
    targetId:
      "targetId" in result && result.targetId
        ? String(result.targetId)
        : SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
    authEmail: outcome.authEmail ?? "—",
    authStatus: outcome.authStatus ?? "—",
    mockRole: outcome.mockRole ?? "—",
    warnings: outcome.preCheck.warnings,
    errorCode: actualWrite === "true" ? "—" : adapterErrorCode,
    errorMessage: actualWrite === "true" ? "—" : adapterErrorMessage,
    abortReason: outcome.preCheck.abortReason ?? "—",
    beforeDescription: beforeDesc,
    afterDescription: afterDesc,
  });
  renderPanelSnapshot(snapshot);

  const el = document.getElementById("schedule-non-dry-run-poc-result");
  if (!el) return;

  const jsonBlock = `<pre class="schedule-non-dry-run-poc-result__json">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  el.insertAdjacentHTML("beforeend", jsonBlock);
}

function renderUnexpectedExceptionPanel(message: string): void {
  renderPanelSnapshot(
    buildPanelSnapshot({
      status: "failed or blocked",
      actualWrite: "false",
      errorCode: SCHEDULE_NON_DRY_RUN_POC_ERROR_CODES.UNEXPECTED_EXCEPTION,
      errorMessage: message,
      abortReason: message,
    }),
  );
}

function refreshSupabaseHostDisplay(): void {
  const { url } = getSupabaseEnv();
  const host = extractSupabaseHost(url);
  setText("schedule-non-dry-run-poc-supabase-host", host);
  setText(
    "schedule-non-dry-run-poc-expected-project",
    SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  );

  const hostNote = document.getElementById("schedule-non-dry-run-poc-host-note");
  if (!hostNote) return;

  if (host === "—") {
    hostNote.textContent = "Supabase URL not configured in client env.";
    return;
  }

  if (host !== SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST) {
    hostNote.textContent = `Warning: active host (${host}) does not match expected staging host (${SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST}).`;
    return;
  }

  hostNote.textContent = "Active host matches expected staging project.";
}

function refreshDangerZonePanel(): void {
  const config = getScheduleNonDryRunPocConfig();
  const root = document.getElementById("schedule-non-dry-run-poc-trigger-root");
  if (!root) return;

  if (!config.visible) {
    root.hidden = true;
    return;
  }

  root.hidden = false;
  setText("schedule-non-dry-run-poc-target-legacy", SCHEDULE_NON_DRY_RUN_POC_LEGACY_ID);
  setText("schedule-non-dry-run-poc-target-id", SCHEDULE_NON_DRY_RUN_POC_TARGET_ID);
  setText("schedule-non-dry-run-poc-before-desc", SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION);
  setText(
    "schedule-non-dry-run-poc-after-desc",
    SCHEDULE_NON_DRY_RUN_POC_FIXED_PAYLOAD.description ?? "—",
  );
  setText("schedule-non-dry-run-poc-approval-id", SCHEDULE_WRITE_APPROVAL_ID);
  setText("schedule-non-dry-run-poc-gate-status", config.enabled ? "armed" : "blocked");
  refreshSupabaseHostDisplay();
  refreshRunButtonState();
  void refreshAuthWriteDebugPanel();
}

async function handleRunClick(): Promise<void> {
  if (executionInFlight) return;

  const config = getScheduleNonDryRunPocConfig();
  if (!config.enabled || !isManualConfirmValid()) {
    return;
  }

  executionInFlight = true;

  const runBtn = document.getElementById(
    "schedule-non-dry-run-poc-run-btn",
  ) as HTMLButtonElement | null;
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = "Running…";
  }

  try {
    const { url, anonKey } = getSupabaseEnv();
    const outcome = await executeScheduleNonDryRunPoc({ url, anonKey });
    renderOutcomePanel(outcome);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    renderUnexpectedExceptionPanel(message);
  } finally {
    executionInFlight = false;
    if (runBtn) {
      runBtn.textContent = "Run one-off staging schedule update";
    }
    refreshRunButtonState();
    scrollToDangerZone();
  }
}

export function initStagingScheduleNonDryRunPocUi(): void {
  const root = document.getElementById("schedule-non-dry-run-poc-trigger-root");
  if (!root) return;

  const stored = loadScheduleNonDryRunPocPanelSnapshot();
  if (stored) {
    renderPanelSnapshot(stored);
  } else {
    renderNotExecutedPanel();
  }

  refreshDangerZonePanel();

  const confirmInput = document.getElementById(
    "schedule-non-dry-run-poc-confirm-input",
  );
  confirmInput?.addEventListener("input", refreshRunButtonState);

  document
    .getElementById("schedule-non-dry-run-poc-run-btn")
    ?.addEventListener("click", () => {
      void handleRunClick();
    });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStagingScheduleNonDryRunPocUi);
  } else {
    initStagingScheduleNonDryRunPocUi();
  }
}
