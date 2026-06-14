/**
 * G-6-f3 — Browser UI for schedule description dry-run prototype (staging shell only).
 * Plan A: pure client-side dry-run — no write adapter, no Supabase writes.
 */

import type { ScheduleAdminReadSource } from "./schedule-admin-ui-binding";
import {
  buildScheduleDescriptionDryRunResult,
  buildScheduleDescriptionSelectionError,
  type ScheduleDescriptionDryRunResult,
} from "./schedule-description-dry-run";
import { getStagingScheduleDescriptionDryRunConfig } from "./schedule-description-dry-run-config";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import { loadSchedulesForDryRunUi } from "./staging-schedule-read";

let schedules: ScheduleRecord[] = [];
let selectedId: string | null = null;
let readSource: ScheduleAdminReadSource = "static";

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

function getTextareaValue(id: string): string {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  return el?.value ?? "";
}

function setTextareaValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLTextAreaElement | null;
  if (el) el.value = value;
}

function getSelectedRecord(): ScheduleRecord | null {
  if (!selectedId) return null;
  return schedules.find((s) => s.id === selectedId) ?? null;
}

function resolveReadSourceLabel(
  source: ScheduleAdminReadSource,
  error?: string,
): string {
  return source + (error ? ` (${error})` : "");
}

function renderDryRunResult(result: ScheduleDescriptionDryRunResult): void {
  const el = document.getElementById("schedule-desc-dry-run-result");
  if (!el) return;

  const statusClass = result.wouldWrite
    ? "schedule-desc-dry-run-result__changed"
    : "schedule-desc-dry-run-result__unchanged";

  const changedFields =
    result.changedFields.length > 0
      ? result.changedFields.join(", ")
      : "(none)";

  el.innerHTML = [
    `<p class="${statusClass}"><strong>${escapeHtml(result.message)}</strong></p>`,
    `<dl class="schedule-desc-dry-run-result__meta">`,
    `<div><dt>approvalId</dt><dd>${escapeHtml(result.approvalId)}</dd></div>`,
    `<div><dt>readSource</dt><dd>${escapeHtml(result.readSource)}</dd></div>`,
    `<div><dt>targetId</dt><dd><code>${escapeHtml(result.targetId || "—")}</code></dd></div>`,
    result.legacyId
      ? `<div><dt>legacy_id</dt><dd><code>${escapeHtml(result.legacyId)}</code></dd></div>`
      : "",
    `<div><dt>targetField</dt><dd>description</dd></div>`,
    `<div><dt>dryRun</dt><dd>true</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(changedFields)}</dd></div>`,
    `<div><dt>writeAdapterUsed</dt><dd>false</dd></div>`,
    `<div><dt>supabaseWriteCalled</dt><dd>false</dd></div>`,
    `</dl>`,
    `<p><strong>Before snapshot (description):</strong></p>`,
    `<pre class="schedule-desc-dry-run-result__block">${escapeHtml(
      JSON.stringify(result.beforeSnapshot, null, 2),
    )}</pre>`,
    `<p><strong>Payload:</strong></p>`,
    `<pre class="schedule-desc-dry-run-result__block">${escapeHtml(
      JSON.stringify(result.payload, null, 2),
    )}</pre>`,
    `<p><strong>After preview:</strong></p>`,
    `<pre class="schedule-desc-dry-run-result__block">${escapeHtml(
      JSON.stringify(result.afterPreview, null, 2),
    )}</pre>`,
  ].join("");
}

function renderPickerList(): void {
  const listEl = document.getElementById("schedule-desc-dry-run-picker-list");
  if (!listEl) return;

  if (!schedules.length) {
    listEl.innerHTML =
      '<li class="schedule-desc-dry-run-picker__empty">No schedules loaded.</li>';
    return;
  }

  listEl.innerHTML = schedules
    .map((record) => {
      const selected = record.id === selectedId ? " is-selected" : "";
      const title = record.title?.trim() ? record.title : "—";
      const descPreview = record.description?.trim()
        ? record.description.slice(0, 40) + (record.description.length > 40 ? "…" : "")
        : "—";
      return `<li class="schedule-desc-dry-run-picker__item${selected}" data-schedule-id="${escapeHtml(record.id)}">
        <div class="schedule-desc-dry-run-picker__main">
          <span class="schedule-desc-dry-run-picker__date">${escapeHtml(record.date)}</span>
          <strong>${escapeHtml(title)}</strong>
          <span class="schedule-desc-dry-run-picker__desc">${escapeHtml(descPreview)}</span>
        </div>
        <button type="button" class="admin-button admin-button--small schedule-desc-dry-run-select-btn" data-schedule-id="${escapeHtml(record.id)}">Select</button>
      </li>`;
    })
    .join("");
}

function populateSelectedPanel(record: ScheduleRecord): void {
  setText("schedule-desc-dry-run-target-id", record.id);
  setText("schedule-desc-dry-run-legacy-id", record.legacy_id ?? "—");
  setText("schedule-desc-dry-run-row-date", record.date);
  setText("schedule-desc-dry-run-row-title", record.title?.trim() ? record.title : "—");
  setText(
    "schedule-desc-dry-run-current-description",
    record.description?.trim() ? record.description : "—",
  );
  setTextareaValue("schedule-desc-dry-run-new-description", record.description ?? "");
  setText("schedule-desc-dry-run-selected-id", record.id);
}

function selectSchedule(id: string): void {
  const record = schedules.find((s) => s.id === id);
  if (!record) return;
  selectedId = id;
  populateSelectedPanel(record);
  renderPickerList();
}

function handlePreviewDryRun(): void {
  const config = getStagingScheduleDescriptionDryRunConfig();
  if (!config.enabled) return;

  const record = getSelectedRecord();
  if (!record) {
    renderDryRunResult(
      buildScheduleDescriptionSelectionError({
        message: "Select a schedule row first.",
        approvalId: config.approvalId,
        readSource,
      }),
    );
    return;
  }

  const result = buildScheduleDescriptionDryRunResult({
    source: record,
    newDescription: getTextareaValue("schedule-desc-dry-run-new-description"),
    approvalId: config.approvalId,
    readSource,
  });
  renderDryRunResult(result);
}

async function loadSchedules(): Promise<void> {
  const config = getStagingScheduleDescriptionDryRunConfig();
  setText("schedule-desc-dry-run-read-source", "loading…");
  setText("schedule-desc-dry-run-data-read", config.dataReadEnabled ? "enabled" : "off");

  if (!config.enabled) {
    setText("schedule-desc-dry-run-read-source", "disabled");
    return;
  }

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const provider = String(import.meta.env.PUBLIC_ADMIN_DATA_PROVIDER ?? "mock").trim();
  const dataReadFlag = import.meta.env.ENABLE_ADMIN_STAGING_DATA_READ === "true";

  const useSupabase =
    config.canUseSupabaseRead && dataReadFlag && provider === "supabase";

  const result = await loadSchedulesForDryRunUi({
    url,
    anonKey,
    useSupabase,
  });

  schedules = result.records;
  readSource =
    result.source === "supabase" && useSupabase
      ? "supabase"
      : result.source === "mock"
        ? "mock"
        : "static";

  setText(
    "schedule-desc-dry-run-read-source",
    resolveReadSourceLabel(readSource, result.error),
  );

  const notice = document.getElementById("schedule-desc-dry-run-read-notice");
  if (notice) {
    if (readSource !== "supabase") {
      notice.textContent =
        "Read source is not live Supabase — dry-run preview uses loaded fixtures/mock data. No writes occur.";
      notice.hidden = false;
    } else if (result.error) {
      notice.textContent = result.error;
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }
  }

  if (!selectedId && schedules.length > 0) {
    selectSchedule(schedules[0].id);
  } else {
    renderPickerList();
  }
}

function bindScheduleDescriptionDryRunUi(): void {
  const config = getStagingScheduleDescriptionDryRunConfig();
  const root = document.getElementById("schedule-desc-dry-run-root");
  if (!root || !config.enabled) return;

  void loadSchedules();

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const btn = target.closest(".schedule-desc-dry-run-select-btn") as HTMLElement | null;
    if (btn?.dataset.scheduleId) {
      selectSchedule(btn.dataset.scheduleId);
    }
  });

  document
    .getElementById("schedule-desc-dry-run-preview-btn")
    ?.addEventListener("click", () => handlePreviewDryRun());
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindScheduleDescriptionDryRunUi);
  } else {
    bindScheduleDescriptionDryRunUi();
  }
}
