/**
 * G-6-e5 — Browser UI for hidden schedule non-dry-run PoC trigger (staging shell only).
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import {
  getScheduleNonDryRunPocConfig,
  SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
} from "./schedule-non-dry-run-poc-config";
import {
  executeScheduleNonDryRunPoc,
  SCHEDULE_NON_DRY_RUN_POC_BEFORE_DESCRIPTION,
  SCHEDULE_NON_DRY_RUN_POC_FIXED_PAYLOAD,
  SCHEDULE_NON_DRY_RUN_POC_LEGACY_ID,
} from "./schedule-non-dry-run-poc-trigger";
import { SCHEDULE_WRITE_APPROVAL_ID } from "./schedule-write-types";
import type { ScheduleWriteAdapterResult } from "./schedule-write-types";

const MANUAL_CONFIRM_TEXT = SCHEDULE_WRITE_APPROVAL_ID;

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

function refreshRunButtonState(): void {
  const config = getScheduleNonDryRunPocConfig();
  const runBtn = document.getElementById(
    "schedule-non-dry-run-poc-run-btn",
  ) as HTMLButtonElement | null;
  if (!runBtn) return;
  const ready = config.enabled && isManualConfirmValid();
  runBtn.disabled = !ready;
  runBtn.title = ready
    ? "One-off staging schedule update — irreversible without rollback"
    : config.disabledReason ?? "Complete manual confirmation to enable";
}

function renderNotExecutedPanel(): void {
  const el = document.getElementById("schedule-non-dry-run-poc-result");
  if (!el) return;
  el.innerHTML = [
    '<p class="schedule-non-dry-run-poc-result__status">not executed</p>',
    "<dl>",
    "<div><dt>actualWrite</dt><dd>—</dd></div>",
    "<div><dt>operation</dt><dd>update</dd></div>",
    "<div><dt>targetTable</dt><dd>schedules</dd></div>",
    `<div><dt>targetId</dt><dd>${escapeHtml(SCHEDULE_NON_DRY_RUN_POC_TARGET_ID)}</dd></div>`,
    "</dl>",
  ].join("");
}

function renderResultPanel(
  result: ScheduleWriteAdapterResult,
  warnings: string[],
): void {
  const el = document.getElementById("schedule-non-dry-run-poc-result");
  if (!el) return;

  const actualWrite = "actualWrite" in result ? String(result.actualWrite) : "false";
  const targetId =
    "targetId" in result && result.targetId
      ? result.targetId
      : SCHEDULE_NON_DRY_RUN_POC_TARGET_ID;
  const changedFields =
    "changedFields" in result && result.changedFields
      ? result.changedFields.join(", ")
      : "—";
  const beforeDesc =
    result.beforeSnapshot?.description != null
      ? String(result.beforeSnapshot.description)
      : "—";
  const afterDesc =
    "afterSnapshot" in result && result.afterSnapshot?.description != null
      ? String(result.afterSnapshot.description)
      : "—";
  const rollbackHint = result.rollbackHint ?? "—";
  const errorCode = "errorCode" in result ? result.errorCode : "—";
  const errorMessage = "errorMessage" in result ? result.errorMessage : "—";

  const warningHtml =
    warnings.length > 0
      ? `<ul class="schedule-non-dry-run-poc-result__warnings">${warnings
          .map((w) => `<li>${escapeHtml(w)}</li>`)
          .join("")}</ul>`
      : "";

  el.innerHTML = [
    warningHtml,
    `<p class="schedule-non-dry-run-poc-result__status">${actualWrite === "true" ? "executed" : "failed or blocked"}</p>`,
    "<dl>",
    `<div><dt>actualWrite</dt><dd>${escapeHtml(actualWrite)}</dd></div>`,
    `<div><dt>operation</dt><dd>${escapeHtml(result.operation)}</dd></div>`,
    `<div><dt>targetTable</dt><dd>${escapeHtml(result.targetTable)}</dd></div>`,
    `<div><dt>targetId</dt><dd>${escapeHtml(targetId)}</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    `<div><dt>beforeSnapshot.description</dt><dd>${escapeHtml(beforeDesc)}</dd></div>`,
    `<div><dt>afterSnapshot.description</dt><dd>${escapeHtml(afterDesc)}</dd></div>`,
    `<div><dt>rollbackHint</dt><dd>${escapeHtml(rollbackHint)}</dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(errorCode)}</dd></div>`,
    `<div><dt>errorMessage</dt><dd>${escapeHtml(errorMessage)}</dd></div>`,
    "</dl>",
    `<pre class="schedule-non-dry-run-poc-result__json">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`,
  ].join("");
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
  refreshRunButtonState();
  void refreshAuthWriteDebugPanel();
}

async function handleRunClick(): Promise<void> {
  const config = getScheduleNonDryRunPocConfig();
  if (!config.enabled || !isManualConfirmValid()) {
    return;
  }

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

    if (outcome.errorMessage && !outcome.result) {
      const el = document.getElementById("schedule-non-dry-run-poc-result");
      if (el) {
        el.innerHTML = `<p class="schedule-non-dry-run-poc-result__error">${escapeHtml(outcome.errorMessage)}</p>`;
      }
      return;
    }

    if (outcome.result) {
      renderResultPanel(outcome.result, outcome.preCheck.warnings);
    }
  } finally {
    if (runBtn) {
      runBtn.textContent = "Run one-off staging schedule update";
    }
    refreshRunButtonState();
  }
}

export function initStagingScheduleNonDryRunPocUi(): void {
  const root = document.getElementById("schedule-non-dry-run-poc-trigger-root");
  if (!root) return;

  renderNotExecutedPanel();
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
