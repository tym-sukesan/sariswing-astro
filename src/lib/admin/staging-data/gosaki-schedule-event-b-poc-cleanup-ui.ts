/**
 * G-13c2d1 — Gosaki Event B PoC cleanup panel (staging shell operator page).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  buildG13c2EventBPocCleanupTargetFormValues,
  G13C2_PREVIEW_BTN_ID,
  G13C2_PREVIEW_RESULT_ID,
  G13C2_SAVE_BTN_ID,
  G13C2_SAVE_ENABLED_ENV,
  G13C2_SAVE_RESULT_ID,
  getG13c2EventBPocCleanupConfig,
} from "../staging-write/gosaki-schedule-event-b-poc-cleanup-config";
import { resolveG13c2EventBPocCleanupTargetRow } from "./gosaki-schedule-event-b-poc-cleanup-target-row-resolve";
import {
  executeG13c2EventBPocCleanupDryRun,
  type G13c2EventBPocCleanupDryRunResult,
} from "../staging-write/gosaki-schedule-event-b-poc-cleanup-dry-run";
import {
  executeG13c2EventBPocCleanupSave,
  type G13c2EventBPocCleanupSaveOutcome,
} from "../staging-write/gosaki-schedule-event-b-poc-cleanup-save";
import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";

let targetRowSnapshot: ScheduleRecord | null = null;
let lastG13c2DryRun: G13c2EventBPocCleanupDryRunResult | null = null;
let g13c2SaveInFlight = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSnapshotValue(value: string | null | undefined): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  return escapeHtml(String(value));
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

function buildG13c2SaveGateNote(
  result: G13c2EventBPocCleanupDryRunResult,
): string {
  if (result.saveReadiness !== "ready_but_save_disabled") return "";

  const config = getG13c2EventBPocCleanupConfig();
  const parts: string[] = [];
  if (!config.armed) {
    parts.push(config.armFailureReason ?? "armed=false");
  } else if (!config.saveEnabled) {
    parts.push(`${G13C2_SAVE_ENABLED_ENV}=true (compile gate off)`);
  }
  if (parts.length === 0) return "";

  return `<p class="gosaki-schedule-edit-dry-run__message">Save gate: ${escapeHtml(parts.join("; "))}</p>`;
}

function renderFieldSnapshotTable(
  result: G13c2EventBPocCleanupDryRunResult,
): string {
  const fields = result.changedFields;
  if (fields.length === 0) return "";

  const rows = fields
    .map((field) => {
      const before = result.before[field as keyof typeof result.before];
      const after = result.after[field as keyof typeof result.after];
      const payload = result.payload[field as keyof typeof result.payload];
      return `<tr>
        <td><code>${escapeHtml(field)}</code></td>
        <td>${formatSnapshotValue(before)}</td>
        <td>${formatSnapshotValue(after)}</td>
        <td>${formatSnapshotValue(payload as string | null | undefined)}</td>
      </tr>`;
    })
    .join("");

  return `
    <table class="gosaki-schedule-edit-dry-run__table">
      <thead><tr><th>field</th><th>before</th><th>after</th><th>payload</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderG13c2DryRunResult(result: G13c2EventBPocCleanupDryRunResult): void {
  const el = document.getElementById(G13C2_PREVIEW_RESULT_ID);
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
  const saveGateNote = buildG13c2SaveGateNote(result);
  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">G-13c2 Event B cleanup — 確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message">dryRun: true / actualWrite: false / saveReadiness: ${escapeHtml(result.saveReadiness)}</p>
    ${saveGateNote}
    <div><span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span> ${renderChangedFieldChips(result.changedFields)}</div>
    ${renderFieldSnapshotTable(result)}
    <p><code>approvalId</code>: ${escapeHtml(result.approvalId)}</p>
    ${guardBlock}
  `;
}

function updateG13c2SaveButton(result: G13c2EventBPocCleanupDryRunResult | null): void {
  const btn = document.getElementById(G13C2_SAVE_BTN_ID) as HTMLButtonElement | null;
  if (!btn) return;
  const config = getG13c2EventBPocCleanupConfig();
  const enabled =
    !g13c2SaveInFlight &&
    config.saveEnabled &&
    result?.ok === true &&
    result.saveReadiness === "ready_to_save" &&
    result.changedFields.length > 0;
  btn.disabled = !enabled;
  btn.textContent = enabled
    ? "Event B cleanup を保存（1回）"
    : "Event B cleanup 保存（無効）";
}

function renderG13c2SaveOutcome(outcome: G13c2EventBPocCleanupSaveOutcome): void {
  const el = document.getElementById(G13C2_SAVE_RESULT_ID);
  if (!el) return;
  el.hidden = false;
  const ok = !outcome.errorCode && outcome.result && "actualWrite" in outcome.result;
  el.className = `gosaki-schedule-edit-save-result ${ok ? "gosaki-schedule-edit-save-result--ok" : "gosaki-schedule-edit-save-result--error"}`;
  const err = outcome.errorMessage
    ? `<p>${escapeHtml(outcome.errorMessage)}</p>`
    : "";
  el.innerHTML = `
    <h3>G-13c2 Save outcome</h3>
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

async function runG13c2Preview(): Promise<void> {
  const resolved = await resolveG13c2EventBPocCleanupTargetRow();
  if (!resolved.ok) {
    const el = document.getElementById(G13C2_PREVIEW_RESULT_ID);
    if (el) {
      el.hidden = false;
      el.className = "gosaki-schedule-edit-dry-run gosaki-schedule-edit-dry-run--error";
      el.innerHTML = `<p>${escapeHtml(resolved.errorMessage)}</p>`;
    }
    targetRowSnapshot = null;
    lastG13c2DryRun = null;
    updateG13c2SaveButton(null);
    return;
  }

  targetRowSnapshot = resolved.row;

  const signedIn = await resolveSignedIn();
  const formValues = buildG13c2EventBPocCleanupTargetFormValues();
  const result = executeG13c2EventBPocCleanupDryRun({
    beforeSnapshot: targetRowSnapshot,
    formValues,
    signedIn,
    supabaseUrl: String(import.meta.env.PUBLIC_SUPABASE_URL ?? ""),
  });
  lastG13c2DryRun = result;
  renderG13c2DryRunResult(result);
  updateG13c2SaveButton(result);
}

async function runG13c2Save(): Promise<void> {
  const config = getG13c2EventBPocCleanupConfig();
  if (!config.saveEnabled) {
    window.alert(config.armFailureReason ?? "G-13c2 Save is disabled (routine dev).");
    return;
  }
  if (!targetRowSnapshot || !lastG13c2DryRun?.ok) {
    window.alert("先に G-13c2 Preview を成功させてください。");
    return;
  }
  if (
    !window.confirm(
      "Event B (2026-07-19) の PoC 文言をクリーンアップします。よろしいですか？",
    )
  ) {
    return;
  }

  g13c2SaveInFlight = true;
  updateG13c2SaveButton(lastG13c2DryRun);

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const outcome = await executeG13c2EventBPocCleanupSave({
    url,
    anonKey,
    beforeSnapshot: targetRowSnapshot,
    formValues: buildG13c2EventBPocCleanupTargetFormValues(),
    saveBinding: {
      changedFields: [...lastG13c2DryRun.changedFields],
      payloadKeys: [...lastG13c2DryRun.payloadKeys],
      expectedBeforeUpdatedAt: lastG13c2DryRun.expectedBeforeUpdatedAt,
      dryRunOk: lastG13c2DryRun.ok,
    },
  });

  g13c2SaveInFlight = false;
  renderG13c2SaveOutcome(outcome);
  updateG13c2SaveButton(lastG13c2DryRun);
}

function bindG13c2EventBPocCleanupPanel(): void {
  const section = document.getElementById("gosaki-schedule-g13c2-event-b-poc-cleanup");
  if (!section) return;

  document.getElementById(G13C2_PREVIEW_BTN_ID)?.addEventListener("click", () => {
    void runG13c2Preview();
  });
  document.getElementById(G13C2_SAVE_BTN_ID)?.addEventListener("click", () => {
    void runG13c2Save();
  });

  updateG13c2SaveButton(null);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindG13c2EventBPocCleanupPanel);
  } else {
    bindG13c2EventBPocCleanupPanel();
  }
}
