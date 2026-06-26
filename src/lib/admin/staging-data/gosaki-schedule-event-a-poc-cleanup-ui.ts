/**
 * G-13d1 — Gosaki Event A PoC cleanup panel (staging shell operator page).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  buildG13c1EventAPocCleanupTargetFormValues,
  G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID,
  G13C1_PREVIEW_BTN_ID,
  G13C1_PREVIEW_RESULT_ID,
  G13C1_SAVE_BTN_ID,
  G13C1_SAVE_RESULT_ID,
  getG13c1EventAPocCleanupConfig,
} from "../staging-write/gosaki-schedule-event-a-poc-cleanup-config";
import {
  executeG13c1EventAPocCleanupDryRun,
  type G13c1EventAPocCleanupDryRunResult,
} from "../staging-write/gosaki-schedule-event-a-poc-cleanup-dry-run";
import {
  executeG13c1EventAPocCleanupSave,
  type G13c1EventAPocCleanupSaveOutcome,
} from "../staging-write/gosaki-schedule-event-a-poc-cleanup-save";
import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";

let targetRowSnapshot: ScheduleRecord | null = null;
let lastG13c1DryRun: G13c1EventAPocCleanupDryRunResult | null = null;
let g13c1SaveInFlight = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findTargetRowFromOperatorSection(): ScheduleRecord | null {
  const section = document.getElementById("gosaki-schedule-operator");
  if (!section) return null;
  const raw = section.getAttribute("data-selectable-rows");
  if (!raw) return null;
  try {
    const rows = JSON.parse(raw) as ScheduleRecord[];
    return rows.find((row) => row.id === G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID) ?? null;
  } catch {
    return null;
  }
}

function renderChangedFieldChips(changedFields: string[]): string {
  if (changedFields.length === 0) {
    return `<span class="gosaki-schedule-edit-dry-run__chip gosaki-schedule-edit-dry-run__chip--none">(none)</span>`;
  }
  return changedFields
    .map(
      (field) =>
        `<span class="gosaki-schedule-edit-dry-run__chip">${escapeHtml(field)}</span>`,
    )
    .join("");
}

function renderG13c1DryRunResult(result: G13c1EventAPocCleanupDryRunResult): void {
  const el = document.getElementById(G13C1_PREVIEW_RESULT_ID);
  if (!el) return;
  el.hidden = false;
  const statusClass = result.ok
    ? "gosaki-schedule-edit-dry-run--ok"
    : "gosaki-schedule-edit-dry-run--error";
  el.className = `gosaki-schedule-edit-dry-run ${statusClass}`;
  const guardBlock =
    result.guardErrors.length > 0
      ? `<ul class="gosaki-schedule-edit-dry-run__errors">${result.guardErrors
          .map((msg) => `<li>${escapeHtml(msg)}</li>`)
          .join("")}</ul>`
      : "";
  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">G-13c1 Event A cleanup — 確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message">dryRun: true / actualWrite: false / saveReadiness: ${escapeHtml(result.saveReadiness)}</p>
    <div><span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span> ${renderChangedFieldChips(result.changedFields)}</div>
    <p><code>approvalId</code>: ${escapeHtml(result.approvalId)}</p>
    ${guardBlock}
  `;
}

function updateG13c1SaveButton(result: G13c1EventAPocCleanupDryRunResult | null): void {
  const btn = document.getElementById(G13C1_SAVE_BTN_ID) as HTMLButtonElement | null;
  if (!btn) return;
  const config = getG13c1EventAPocCleanupConfig();
  const enabled =
    !g13c1SaveInFlight &&
    config.saveEnabled &&
    result?.ok === true &&
    result.saveReadiness === "ready_to_save" &&
    result.changedFields.length > 0;
  btn.disabled = !enabled;
  btn.textContent = enabled
    ? "Event A cleanup を保存（1回）"
    : "Event A cleanup 保存（無効）";
}

function renderG13c1SaveOutcome(outcome: G13c1EventAPocCleanupSaveOutcome): void {
  const el = document.getElementById(G13C1_SAVE_RESULT_ID);
  if (!el) return;
  el.hidden = false;
  const ok = !outcome.errorCode && outcome.result && "actualWrite" in outcome.result;
  el.className = `gosaki-schedule-edit-save-result ${ok ? "gosaki-schedule-edit-save-result--ok" : "gosaki-schedule-edit-save-result--error"}`;
  const err = outcome.errorMessage
    ? `<p>${escapeHtml(outcome.errorMessage)}</p>`
    : "";
  el.innerHTML = `
    <h3>G-13c1 Save outcome</h3>
    <p>errorCode: ${escapeHtml(outcome.errorCode ?? "(none)")}</p>
    ${err}
  `;
}

async function resolveSignedIn(): Promise<boolean> {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return false;
  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    return isSignedInStagingAuth(auth);
  } catch {
    return false;
  }
}

async function runG13c1Preview(): Promise<void> {
  targetRowSnapshot = findTargetRowFromOperatorSection();
  if (!targetRowSnapshot) {
    const el = document.getElementById(G13C1_PREVIEW_RESULT_ID);
    if (el) {
      el.hidden = false;
      el.className = "gosaki-schedule-edit-dry-run gosaki-schedule-edit-dry-run--error";
      el.innerHTML = `<p>Event A row (${escapeHtml(G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID)}) not found in selectable rows.</p>`;
    }
    lastG13c1DryRun = null;
    updateG13c1SaveButton(null);
    return;
  }

  const signedIn = await resolveSignedIn();
  const formValues = buildG13c1EventAPocCleanupTargetFormValues();
  const result = executeG13c1EventAPocCleanupDryRun({
    beforeSnapshot: targetRowSnapshot,
    formValues,
    signedIn,
    supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
  });
  lastG13c1DryRun = result;
  renderG13c1DryRunResult(result);
  updateG13c1SaveButton(result);
}

async function runG13c1Save(): Promise<void> {
  const config = getG13c1EventAPocCleanupConfig();
  if (!config.saveEnabled) {
    window.alert(config.armFailureReason ?? "G-13c1 Save is disabled (routine dev).");
    return;
  }
  if (!targetRowSnapshot || !lastG13c1DryRun?.ok) {
    window.alert("先に G-13c1 Preview を成功させてください。");
    return;
  }
  if (
    !window.confirm(
      "Event A (2026-03-15) の PoC 文言をクリーンアップします。よろしいですか？",
    )
  ) {
    return;
  }

  g13c1SaveInFlight = true;
  updateG13c1SaveButton(lastG13c1DryRun);

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const outcome = await executeG13c1EventAPocCleanupSave({
    url,
    anonKey,
    beforeSnapshot: targetRowSnapshot,
    formValues: buildG13c1EventAPocCleanupTargetFormValues(),
    saveBinding: {
      changedFields: [...lastG13c1DryRun.changedFields],
      payloadKeys: [...lastG13c1DryRun.payloadKeys],
      expectedBeforeUpdatedAt: lastG13c1DryRun.expectedBeforeUpdatedAt,
      dryRunOk: lastG13c1DryRun.ok,
    },
  });

  g13c1SaveInFlight = false;
  renderG13c1SaveOutcome(outcome);
  updateG13c1SaveButton(lastG13c1DryRun);
}

function bindG13c1EventAPocCleanupPanel(): void {
  const section = document.getElementById("gosaki-schedule-g13c1-event-a-poc-cleanup");
  if (!section) return;

  document.getElementById(G13C1_PREVIEW_BTN_ID)?.addEventListener("click", () => {
    void runG13c1Preview();
  });
  document.getElementById(G13C1_SAVE_BTN_ID)?.addEventListener("click", () => {
    void runG13c1Save();
  });

  updateG13c1SaveButton(null);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindG13c1EventAPocCleanupPanel);
  } else {
    bindG13c1EventAPocCleanupPanel();
  }
}
