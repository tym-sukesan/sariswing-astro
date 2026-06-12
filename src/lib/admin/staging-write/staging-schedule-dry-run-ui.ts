/**
 * G-6-e2 — Browser UI for staging schedule dry-run PoC (staging shell only).
 */

import {
  buildScheduleDryRunSelectionError,
  buildScheduleDuplicateDryRunResult,
  buildScheduleUpdateDryRunResult,
} from "./schedule-dry-run-adapter";
import { recordToFormState } from "./schedule-dry-run-payload";
import { formStateToDryRunInput } from "./schedule-dry-run-validation";
import type { ScheduleDryRunResult, ScheduleRecord } from "./schedule-dry-run-types";
import { getStagingScheduleDryRunConfig } from "./staging-schedule-dry-run-config";
import {
  loadSchedulesForDryRunUi,
  splitSchedulesByDate,
} from "./staging-schedule-read";

let schedules: ScheduleRecord[] = [];
let selectedId: string | null = null;

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
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return el?.value ?? "";
}

function getCheckbox(id: string): boolean {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el?.checked ?? false;
}

function setInputValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) el.value = value;
}

function setCheckbox(id: string, checked: boolean): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.checked = checked;
}

function getSelectedRecord(): ScheduleRecord | null {
  if (!selectedId) return null;
  return schedules.find((s) => s.id === selectedId) ?? null;
}

function readFormFromDom(): ReturnType<typeof recordToFormState> {
  return {
    date: getInputValue("schedule-dry-run-date"),
    title: getInputValue("schedule-dry-run-title"),
    venue: getInputValue("schedule-dry-run-venue"),
    open_time: getInputValue("schedule-dry-run-open-time"),
    start_time: getInputValue("schedule-dry-run-start-time"),
    price: getInputValue("schedule-dry-run-price"),
    description: getInputValue("schedule-dry-run-description"),
    published: getCheckbox("schedule-dry-run-published"),
    show_on_home: getCheckbox("schedule-dry-run-show-on-home"),
    home_order: getInputValue("schedule-dry-run-home-order"),
    sort_order: getInputValue("schedule-dry-run-sort-order"),
  };
}

function populateForm(record: ScheduleRecord): void {
  const form = recordToFormState(record);
  setInputValue("schedule-dry-run-date", form.date);
  setInputValue("schedule-dry-run-title", form.title);
  setInputValue("schedule-dry-run-venue", form.venue);
  setInputValue("schedule-dry-run-open-time", form.open_time);
  setInputValue("schedule-dry-run-start-time", form.start_time);
  setInputValue("schedule-dry-run-price", form.price);
  setInputValue("schedule-dry-run-description", form.description);
  setCheckbox("schedule-dry-run-published", form.published);
  setCheckbox("schedule-dry-run-show-on-home", form.show_on_home);
  setInputValue("schedule-dry-run-home-order", form.home_order);
  setInputValue("schedule-dry-run-sort-order", form.sort_order);

  setText("schedule-dry-run-readonly-id", record.id);
  setText("schedule-dry-run-readonly-legacy-id", record.legacy_id ?? "—");
  setText("schedule-dry-run-readonly-year", record.year != null ? String(record.year) : "—");
  setText("schedule-dry-run-readonly-month", record.month ?? "—");
  setText("schedule-dry-run-readonly-source-file", record.source_file ?? "—");
  setText("schedule-dry-run-readonly-source-route", record.source_route ?? "—");
  setText("schedule-dry-run-readonly-created-at", record.created_at ?? "—");
  setText("schedule-dry-run-readonly-updated-at", record.updated_at ?? "—");
}

function renderListItem(record: ScheduleRecord): string {
  const publishedBadge = record.published
    ? '<span class="schedule-dry-run-badge schedule-dry-run-badge--published">published</span>'
    : '<span class="schedule-dry-run-badge schedule-dry-run-badge--draft">draft</span>';
  const homeBadge = record.show_on_home
    ? '<span class="schedule-dry-run-badge schedule-dry-run-badge--home">home</span>'
    : "";
  const meta = record.legacy_id ?? record.source_route ?? "";
  const selected = record.id === selectedId ? " is-selected" : "";

  return `<li class="schedule-dry-run-list__item${selected}" data-schedule-id="${escapeHtml(record.id)}">
    <div class="schedule-dry-run-list__main">
      <span class="schedule-dry-run-list__date">${escapeHtml(record.date)}</span>
      <strong class="schedule-dry-run-list__title">${escapeHtml(record.title ?? "—")}</strong>
      <span class="schedule-dry-run-list__venue">${escapeHtml(record.venue ?? "")}</span>
      ${record.start_time ? `<span class="schedule-dry-run-list__time">${escapeHtml(record.start_time)}</span>` : ""}
      <span class="schedule-dry-run-list__badges">${publishedBadge}${homeBadge}</span>
      ${meta ? `<span class="schedule-dry-run-list__meta">${escapeHtml(meta)}</span>` : ""}
    </div>
    <div class="schedule-dry-run-list__actions">
      <button type="button" class="admin-button admin-button--small schedule-dry-run-select-btn" data-schedule-id="${escapeHtml(record.id)}">Select</button>
      <button type="button" class="admin-button admin-button--small schedule-dry-run-duplicate-btn" data-schedule-id="${escapeHtml(record.id)}">Duplicate dry-run</button>
    </div>
  </li>`;
}

function renderLists(): void {
  const { upcoming, past } = splitSchedulesByDate(schedules);
  const upcomingEl = document.getElementById("schedule-dry-run-upcoming-list");
  const pastEl = document.getElementById("schedule-dry-run-past-list");
  if (upcomingEl) {
    upcomingEl.innerHTML =
      upcoming.length > 0
        ? upcoming.map(renderListItem).join("")
        : '<li class="schedule-dry-run-list__empty">No upcoming schedules.</li>';
  }
  if (pastEl) {
    pastEl.innerHTML =
      past.length > 0
        ? past.map(renderListItem).join("")
        : '<li class="schedule-dry-run-list__empty">No past schedules.</li>';
  }
  setText("schedule-dry-run-upcoming-count", String(upcoming.length));
  setText("schedule-dry-run-past-count", String(past.length));
}

function renderDryRunResult(result: ScheduleDryRunResult): void {
  const el = document.getElementById("schedule-dry-run-result");
  if (!el) return;

  const validationClass = result.validation.ok
    ? "schedule-dry-run-result__valid"
    : "schedule-dry-run-result__invalid";

  const metaParts = [
    `<div><dt>module</dt><dd>${escapeHtml(result.module)}</dd></div>`,
    `<div><dt>operation</dt><dd>${escapeHtml(result.operation)}</dd></div>`,
    `<div><dt>targetTable</dt><dd>${escapeHtml(result.targetTable)}</dd></div>`,
    result.targetId
      ? `<div><dt>targetId</dt><dd><code>${escapeHtml(result.targetId)}</code></dd></div>`
      : "",
    result.sourceId
      ? `<div><dt>sourceId</dt><dd><code>${escapeHtml(result.sourceId)}</code></dd></div>`
      : "",
    `<div><dt>dryRun</dt><dd>true</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>validation</dt><dd>${result.validation.ok ? "pass" : `fail: ${escapeHtml(result.validation.errors.join("; "))}`}</dd></div>`,
  ];

  const preview = result.derivedPreview;
  if (
    preview &&
    (preview.recalculatedYear != null ||
      preview.recalculatedMonth ||
      preview.scheduleGroup)
  ) {
    metaParts.push(
      `<div><dt>derivedPreview</dt><dd>${escapeHtml(
        [
          preview.recalculatedYear != null ? `year: ${preview.recalculatedYear}` : "",
          preview.recalculatedMonth ? `month: ${preview.recalculatedMonth}` : "",
          preview.scheduleGroup ? `group: ${preview.scheduleGroup}` : "",
        ]
          .filter(Boolean)
          .join(" / "),
      )}</dd></div>`,
    );
  }

  el.innerHTML = [
    `<p class="${validationClass}"><strong>${escapeHtml(result.message)}</strong></p>`,
    `<dl class="schedule-dry-run-result__meta">${metaParts.join("")}</dl>`,
    `<p><strong>Rollback hint:</strong> ${escapeHtml(result.rollbackHint)}</p>`,
    `<pre class="schedule-dry-run-result__payload">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`,
  ].join("");
}

function selectSchedule(id: string): void {
  const record = schedules.find((s) => s.id === id);
  if (!record) return;
  selectedId = id;
  populateForm(record);
  renderLists();
  setText("schedule-dry-run-selected-id", id);
}

function handleUpdateDryRun(): void {
  const config = getStagingScheduleDryRunConfig();
  if (!config.enabled) return;
  const record = getSelectedRecord();
  if (!record) {
    renderDryRunResult(
      buildScheduleDryRunSelectionError({
        operation: "update",
        message: "Select a schedule first.",
        errors: ["No schedule selected"],
        approvalId: config.approvalId,
      }),
    );
    return;
  }
  const result = buildScheduleUpdateDryRunResult({
    source: record,
    form: formStateToDryRunInput(readFormFromDom()),
    approvalId: config.approvalId,
  });
  renderDryRunResult(result);
}

function handleDuplicateDryRun(sourceId?: string): void {
  const config = getStagingScheduleDryRunConfig();
  if (!config.enabled) return;
  const id = sourceId ?? selectedId;
  const record = id ? schedules.find((s) => s.id === id) : null;
  if (!record) {
    renderDryRunResult(
      buildScheduleDryRunSelectionError({
        operation: "duplicate",
        message: "Select a schedule to duplicate.",
        errors: ["No source schedule"],
        approvalId: config.approvalId,
      }),
    );
    return;
  }
  if (sourceId && sourceId !== selectedId) {
    selectSchedule(sourceId);
  }
  const result = buildScheduleDuplicateDryRunResult({
    source: record,
    overrides: formStateToDryRunInput(readFormFromDom()),
    approvalId: config.approvalId,
  });
  renderDryRunResult(result);
}

function refreshSafetyPanel(config: ReturnType<typeof getStagingScheduleDryRunConfig>): void {
  setText("schedule-dry-run-safety-dry-run-only", "true");
  setText("schedule-dry-run-safety-write-adapter", "false");
  setText("schedule-dry-run-safety-db-writes", "false");
  setText("schedule-dry-run-safety-months-mode", config.scheduleMonthsMode);
  setText("schedule-dry-run-safety-delete", "false");
  setText("schedule-dry-run-safety-non-dry-run", "false");
  setText("schedule-dry-run-data-source", "loading…");
}

async function loadSchedules(): Promise<void> {
  const config = getStagingScheduleDryRunConfig();
  refreshSafetyPanel(config);

  if (!config.enabled) {
    setText("schedule-dry-run-data-source", "disabled");
    return;
  }

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const result = await loadSchedulesForDryRunUi({
    url,
    anonKey,
    useSupabase: config.canUseSupabaseRead,
  });

  schedules = result.records;
  setText(
    "schedule-dry-run-data-source",
    result.source + (result.error ? ` (${result.error})` : ""),
  );

  if (!selectedId && schedules.length > 0) {
    selectSchedule(schedules[0].id);
  } else {
    renderLists();
  }

  const notice = document.getElementById("schedule-dry-run-read-notice");
  if (notice && result.error) {
    notice.textContent = result.error;
    notice.hidden = false;
  } else if (notice) {
    notice.hidden = true;
  }
}

function bindScheduleDryRunUi(): void {
  const config = getStagingScheduleDryRunConfig();
  refreshSafetyPanel(config);

  const root = document.getElementById("schedule-dry-run-poc-root");
  if (!root || !config.enabled) return;

  void loadSchedules();

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const selectBtn = target.closest(".schedule-dry-run-select-btn") as HTMLElement | null;
    const dupBtn = target.closest(".schedule-dry-run-duplicate-btn") as HTMLElement | null;
    if (selectBtn?.dataset.scheduleId) {
      selectSchedule(selectBtn.dataset.scheduleId);
      return;
    }
    if (dupBtn?.dataset.scheduleId) {
      handleDuplicateDryRun(dupBtn.dataset.scheduleId);
    }
  });

  document
    .getElementById("schedule-dry-run-update-btn")
    ?.addEventListener("click", () => handleUpdateDryRun());

  document
    .getElementById("schedule-dry-run-duplicate-form-btn")
    ?.addEventListener("click", () => handleDuplicateDryRun());
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindScheduleDryRunUi);
  } else {
    bindScheduleDryRunUi();
  }
}
