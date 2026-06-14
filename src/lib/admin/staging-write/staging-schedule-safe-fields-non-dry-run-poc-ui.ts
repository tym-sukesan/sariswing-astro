/**
 * G-6-f6 — Browser UI for safe-fields non-dry-run PoC (staging shell only).
 * Implementation phase: do not click Run in Cursor/Playwright.
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import {
  getActiveSupabaseHostFromEnv,
  getScheduleSafeFieldsNonDryRunPocConfig,
} from "./schedule-safe-fields-non-dry-run-poc-config";
import {
  loadScheduleSafeFieldsNonDryRunPocPanelSnapshot,
  mapSafeFieldsAdapterErrorCode,
  saveScheduleSafeFieldsNonDryRunPocPanelSnapshot,
  SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES,
  type ScheduleSafeFieldsNonDryRunPocPanelSnapshot,
} from "./schedule-safe-fields-non-dry-run-poc-error";
import {
  executeG6F6SafeFieldsNonDryRunPoc,
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION,
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_FIXED_PAYLOAD,
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_LEGACY_ID,
  type G6F6SafeFieldsNonDryRunPocExecutionOutcome,
} from "./schedule-safe-fields-non-dry-run-poc-trigger";
import { SCHEDULE_NON_DRY_RUN_POC_TARGET_ID } from "./schedule-non-dry-run-poc-config";
import {
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
  type ScheduleWriteAdapterResult,
} from "./schedule-write-types";

const MANUAL_CONFIRM_TEXT = G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID;

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
    "schedule-safe-fields-non-dry-run-poc-confirm-input",
  ) as HTMLInputElement | null;
  return input?.value.trim() === MANUAL_CONFIRM_TEXT;
}

function buildPanelSnapshot(
  fields: Partial<ScheduleSafeFieldsNonDryRunPocPanelSnapshot> &
    Pick<ScheduleSafeFieldsNonDryRunPocPanelSnapshot, "status">,
): ScheduleSafeFieldsNonDryRunPocPanelSnapshot {
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
    beforeVenue: fields.beforeVenue ?? "—",
    beforeDescription:
      fields.beforeDescription ?? G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION,
    afterVenue: fields.afterVenue ?? "—",
    afterDescription: fields.afterDescription ?? "—",
    changedFields: fields.changedFields ?? "—",
    timestamp: fields.timestamp ?? new Date().toISOString(),
  };
}

function renderPanelSnapshot(snapshot: ScheduleSafeFieldsNonDryRunPocPanelSnapshot): void {
  const el = document.getElementById("schedule-safe-fields-non-dry-run-poc-result");
  if (!el) return;

  const warningHtml =
    snapshot.warnings.length > 0
      ? `<ul class="schedule-safe-fields-non-dry-run-poc-result__warnings">${snapshot.warnings
          .map((w) => `<li>${escapeHtml(w)}</li>`)
          .join("")}</ul>`
      : "";

  el.innerHTML = [
    warningHtml,
    `<p class="schedule-safe-fields-non-dry-run-poc-result__status">${escapeHtml(snapshot.status)}</p>`,
    "<dl>",
    `<div><dt>actualWrite</dt><dd>${escapeHtml(snapshot.actualWrite)}</dd></div>`,
    `<div><dt>approvalId</dt><dd>${escapeHtml(G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID)}</dd></div>`,
    `<div><dt>targetId</dt><dd>${escapeHtml(snapshot.targetId)}</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(snapshot.changedFields)}</dd></div>`,
    `<div><dt>beforeVenue</dt><dd>${escapeHtml(snapshot.beforeVenue)}</dd></div>`,
    `<div><dt>beforeDescription</dt><dd>${escapeHtml(snapshot.beforeDescription)}</dd></div>`,
    `<div><dt>afterVenue</dt><dd>${escapeHtml(snapshot.afterVenue)}</dd></div>`,
    `<div><dt>afterDescription</dt><dd>${escapeHtml(snapshot.afterDescription)}</dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(snapshot.errorCode)}</dd></div>`,
    `<div><dt>errorMessage</dt><dd>${escapeHtml(snapshot.errorMessage)}</dd></div>`,
    `<div><dt>timestamp</dt><dd>${escapeHtml(snapshot.timestamp)}</dd></div>`,
    "</dl>",
  ].join("");

  saveScheduleSafeFieldsNonDryRunPocPanelSnapshot(snapshot);
}

function renderWriteResultPanel(
  result: ScheduleWriteAdapterResult,
  outcome: G6F6SafeFieldsNonDryRunPocExecutionOutcome,
): void {
  const actualWrite = "actualWrite" in result ? String(result.actualWrite) : "false";
  const beforeVenue =
    result.beforeSnapshot?.venue != null ? String(result.beforeSnapshot.venue) : "—";
  const beforeDesc =
    result.beforeSnapshot?.description != null
      ? String(result.beforeSnapshot.description)
      : G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION;
  const afterVenue =
    "afterSnapshot" in result && result.afterSnapshot?.venue != null
      ? String(result.afterSnapshot.venue)
      : "—";
  const afterDesc =
    "afterSnapshot" in result && result.afterSnapshot?.description != null
      ? String(result.afterSnapshot.description)
      : "—";
  const changedFields =
    "changedFields" in result && Array.isArray(result.changedFields)
      ? result.changedFields.join(", ")
      : "—";
  const adapterErrorCode =
    "errorCode" in result && result.errorCode
      ? mapSafeFieldsAdapterErrorCode(String(result.errorCode))
      : "—";
  const adapterErrorMessage =
    "errorMessage" in result && result.errorMessage ? String(result.errorMessage) : "—";

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
    beforeVenue,
    beforeDescription: beforeDesc,
    afterVenue,
    afterDescription: afterDesc,
    changedFields,
  });
  renderPanelSnapshot(snapshot);

  const el = document.getElementById("schedule-safe-fields-non-dry-run-poc-result");
  if (!el) return;
  const jsonBlock = `<pre class="schedule-safe-fields-non-dry-run-poc-result__json">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  el.insertAdjacentHTML("beforeend", jsonBlock);
}

function renderOutcomePanel(outcome: G6F6SafeFieldsNonDryRunPocExecutionOutcome): void {
  if (outcome.result) {
    renderWriteResultPanel(outcome.result, outcome);
    return;
  }

  renderPanelSnapshot(
    buildPanelSnapshot({
      status: "failed or blocked",
      actualWrite: "false",
      authEmail: outcome.authEmail ?? "—",
      authStatus: outcome.authStatus ?? "—",
      mockRole: outcome.mockRole ?? "—",
      warnings: outcome.preCheck.warnings,
      errorCode: outcome.errorCode ?? "—",
      errorMessage: outcome.errorMessage ?? outcome.preCheck.abortReason ?? "—",
      abortReason: outcome.preCheck.abortReason ?? "—",
    }),
  );
}

function refreshRunButtonState(): void {
  const config = getScheduleSafeFieldsNonDryRunPocConfig();
  const runBtn = document.getElementById(
    "schedule-safe-fields-non-dry-run-poc-run-btn",
  ) as HTMLButtonElement | null;
  const runWrap = document.getElementById(
    "schedule-safe-fields-non-dry-run-poc-run-wrap",
  );

  if (runWrap) {
    runWrap.hidden = !config.armed;
  }

  if (!runBtn) return;

  if (!config.armed) {
    runBtn.disabled = true;
    runBtn.title = config.armFailureReason ?? "PoC not armed — see gate status";
    return;
  }

  if (executionInFlight) {
    runBtn.disabled = true;
    return;
  }

  const ready = config.enabled && isManualConfirmValid();
  runBtn.disabled = !ready;
  runBtn.title = ready
    ? "G-6-f6 safe-fields staging update — manual only; final preflight required"
    : config.disabledReason ?? "Type approval ID to enable";
}

function refreshPanelMeta(): void {
  const config = getScheduleSafeFieldsNonDryRunPocConfig();
  const host = getActiveSupabaseHostFromEnv();

  setText("schedule-safe-fields-non-dry-run-poc-gate-status", config.armed ? "armed" : "not armed");
  setText("schedule-safe-fields-non-dry-run-poc-arm-failures", config.armFailureReason ?? "—");
  setText("schedule-safe-fields-non-dry-run-poc-supabase-host", host);
  setText("schedule-safe-fields-non-dry-run-poc-expected-project", config.expectedProject);
  setText(
    "schedule-safe-fields-non-dry-run-poc-target-legacy",
    G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_LEGACY_ID,
  );
  setText("schedule-safe-fields-non-dry-run-poc-target-id", config.targetId);
  setText(
    "schedule-safe-fields-non-dry-run-poc-before-desc",
    G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_BEFORE_DESCRIPTION,
  );
  setText(
    "schedule-safe-fields-non-dry-run-poc-after-venue",
    G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_FIXED_PAYLOAD.venue ?? "—",
  );
  setText(
    "schedule-safe-fields-non-dry-run-poc-after-desc",
    G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_FIXED_PAYLOAD.description ?? "—",
  );

  const hostNote = document.getElementById("schedule-safe-fields-non-dry-run-poc-host-note");
  if (hostNote) {
    if (host === "—") {
      hostNote.textContent = "Supabase URL not configured.";
    } else if (host !== config.expectedSupabaseHost) {
      hostNote.textContent = `Warning: host ${host} ≠ expected ${config.expectedSupabaseHost}`;
    } else {
      hostNote.textContent = "Active host matches expected staging project.";
    }
  }

  refreshRunButtonState();
  void refreshAuthWriteDebugPanel();
}

async function handleRunClick(): Promise<void> {
  if (executionInFlight) return;

  const config = getScheduleSafeFieldsNonDryRunPocConfig();
  if (!config.enabled || !isManualConfirmValid()) return;

  executionInFlight = true;
  const runBtn = document.getElementById(
    "schedule-safe-fields-non-dry-run-poc-run-btn",
  ) as HTMLButtonElement | null;
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = "Running…";
  }

  try {
    const { url, anonKey } = getSupabaseEnv();
    const outcome = await executeG6F6SafeFieldsNonDryRunPoc({ url, anonKey });
    renderOutcomePanel(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    renderPanelSnapshot(
      buildPanelSnapshot({
        status: "failed or blocked",
        actualWrite: "false",
        errorCode: SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ERROR_CODES.UNEXPECTED_EXCEPTION,
        errorMessage: message,
        abortReason: message,
      }),
    );
  } finally {
    executionInFlight = false;
    if (runBtn) {
      runBtn.textContent = "Execute G-6-f6 safe-fields non-dry-run (manual)";
    }
    refreshRunButtonState();
  }
}

export function initStagingScheduleSafeFieldsNonDryRunPocUi(): void {
  const root = document.getElementById("schedule-safe-fields-non-dry-run-poc-root");
  if (!root) return;

  const stored = loadScheduleSafeFieldsNonDryRunPocPanelSnapshot();
  if (stored) {
    renderPanelSnapshot(stored);
  } else {
    renderPanelSnapshot(buildPanelSnapshot({ status: "not executed" }));
  }

  refreshPanelMeta();

  document
    .getElementById("schedule-safe-fields-non-dry-run-poc-confirm-input")
    ?.addEventListener("input", refreshRunButtonState);

  document
    .getElementById("schedule-safe-fields-non-dry-run-poc-run-btn")
    ?.addEventListener("click", () => {
      void handleRunClick();
    });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStagingScheduleSafeFieldsNonDryRunPocUi);
  } else {
    initStagingScheduleSafeFieldsNonDryRunPocUi();
  }
}
