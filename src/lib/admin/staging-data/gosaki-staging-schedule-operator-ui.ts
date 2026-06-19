/**
 * Gosaki staging shell — operator schedule add/edit UI (no save).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "./staging-schedule-site-slug-config";
import { dispatchRowSelected } from "./staging-schedule-site-slug-row-picker-events";
import { confirmDiscardDirtyCandidateIfNeeded } from "./staging-schedule-site-slug-edit-picker-binding";
import { isPocAuditScheduleRow } from "./staging-schedule-site-slug-row-picker-utils";

type PublishedFilter = "published" | "all" | "draft";

let selectableRows: ScheduleRecord[] = [];
let selectedRowId: string | null = null;
let previewBase = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayValue(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  return trimmed || "—";
}

function getRoot(): HTMLElement | null {
  return document.getElementById("gosaki-schedule-operator");
}

function parseRowsDataset(): ScheduleRecord[] {
  const root = getRoot();
  if (!root) return [];
  previewBase = root.dataset.previewBase ?? previewBase;
  const raw = root.dataset.selectableRows;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ScheduleRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function monthFromDate(date: string): string {
  const trimmed = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "";
  return trimmed.slice(0, 7);
}

function schedulePreviewUrl(month: string | null | undefined): string {
  const normalized = String(month ?? "").trim();
  if (normalized && /^\d{4}-\d{2}$/.test(normalized)) {
    return `${previewBase}${normalized}/`;
  }
  return `${previewBase}schedule/`;
}

function setPreviewLink(linkId: string, month: string | null | undefined): void {
  const link = document.getElementById(linkId) as HTMLAnchorElement | null;
  if (!link) return;
  const url = schedulePreviewUrl(month);
  link.href = url;
  link.textContent =
    month && /^\d{4}-\d{2}$/.test(month)
      ? `${month} のページを見る`
      : "スケジュールページを見る";
}

function getMonthFilter(): string {
  const el = document.getElementById(
    "gosaki-schedule-operator-month-filter",
  ) as HTMLSelectElement | null;
  return el?.value ?? "all";
}

function getPublishedFilter(): PublishedFilter {
  const el = document.getElementById(
    "gosaki-schedule-operator-published-filter",
  ) as HTMLSelectElement | null;
  const value = el?.value ?? "published";
  if (value === "all" || value === "draft") return value;
  return "published";
}

function getKeywordFilter(): string {
  const el = document.getElementById(
    "gosaki-schedule-operator-keyword",
  ) as HTMLInputElement | null;
  return (el?.value ?? "").trim().toLowerCase();
}

function rowMatchesFilters(row: ScheduleRecord): boolean {
  const monthFilter = getMonthFilter();
  if (monthFilter !== "all" && String(row.month ?? "") !== monthFilter) return false;

  const publishedFilter = getPublishedFilter();
  if (publishedFilter === "published" && row.published !== true) return false;
  if (publishedFilter === "draft" && row.published !== false) return false;

  const keyword = getKeywordFilter();
  if (keyword) {
    const haystack = [row.title, row.venue, row.description]
      .map((v) => String(v ?? "").toLowerCase())
      .join(" ");
    if (!haystack.includes(keyword)) return false;
  }

  return true;
}

function setFieldValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  if (el) el.value = value;
}

function setCheckbox(id: string, checked: boolean): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.checked = checked;
}

function populateAddFormFromRow(row: ScheduleRecord): void {
  setFieldValue("gosaki-add-date", row.date ?? "");
  const month = String(row.month ?? monthFromDate(row.date));
  const monthSelect = document.getElementById("gosaki-add-month") as HTMLSelectElement | null;
  if (monthSelect) monthSelect.value = month || "";
  setFieldValue("gosaki-add-title", String(row.title ?? ""));
  setFieldValue("gosaki-add-venue", String(row.venue ?? ""));
  setFieldValue("gosaki-add-open-time", String(row.open_time ?? ""));
  setFieldValue("gosaki-add-start-time", String(row.start_time ?? ""));
  setFieldValue("gosaki-add-price", String(row.price ?? ""));
  setFieldValue("gosaki-add-description", String(row.description ?? ""));
  setFieldValue(
    "gosaki-add-sort-order",
    row.sort_order != null ? String(row.sort_order) : "10",
  );
  setCheckbox("gosaki-add-published", row.published === true);
  setPreviewLink("gosaki-add-preview-link", month);
}

function renderEditForm(row: ScheduleRecord | null): void {
  const emptyEl = document.getElementById("gosaki-schedule-operator-edit-empty");
  const formEl = document.getElementById("gosaki-schedule-edit-form");
  if (!emptyEl || !formEl) return;

  if (!row) {
    emptyEl.hidden = false;
    formEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  formEl.hidden = false;

  const month = String(row.month ?? monthFromDate(row.date));

  setFieldValue("gosaki-edit-date", row.date ?? "");
  setFieldValue("gosaki-edit-month", month);
  setFieldValue("gosaki-edit-title", String(row.title ?? ""));
  setFieldValue("gosaki-edit-venue", String(row.venue ?? ""));
  setFieldValue("gosaki-edit-open-time", String(row.open_time ?? ""));
  setFieldValue("gosaki-edit-start-time", String(row.start_time ?? ""));
  setFieldValue("gosaki-edit-price", String(row.price ?? ""));
  setFieldValue("gosaki-edit-description", String(row.description ?? ""));
  setCheckbox("gosaki-edit-published", row.published === true);
  setPreviewLink("gosaki-edit-preview-link", month);
}

function renderTable(): void {
  const tbody = document.getElementById("gosaki-schedule-operator-table-body");
  if (!tbody) return;

  const filtered = selectableRows.filter(rowMatchesFilters);
  const countEl = document.getElementById("gosaki-schedule-operator-filtered-count");
  if (countEl) countEl.textContent = String(filtered.length);

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="admin-gosaki-schedule-table__empty">該当する公演はありません。</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((row) => {
      const selected = selectedRowId === row.id;
      return `<tr class="admin-gosaki-schedule-table__row${selected ? " is-selected" : ""}" data-row-id="${escapeHtml(row.id)}">
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(displayValue(row.title))}</td>
        <td>${escapeHtml(displayValue(row.venue))}</td>
        <td>${escapeHtml(displayValue(row.open_time))}</td>
        <td>${escapeHtml(displayValue(row.start_time))}</td>
        <td>${escapeHtml(displayValue(row.price))}</td>
        <td><button type="button" class="admin-button admin-button--secondary admin-gosaki-schedule-select-btn" data-select-row-id="${escapeHtml(row.id)}">${selected ? "選択中" : "編集する"}</button></td>
      </tr>`;
    })
    .join("");
}

function selectRowById(rowId: string): void {
  const row = selectableRows.find((r) => r.id === rowId);
  if (!row) return;
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) return;
  if (isPocAuditScheduleRow(row)) return;
  if (!confirmDiscardDirtyCandidateIfNeeded(rowId)) return;

  selectedRowId = rowId;
  renderTable();
  renderEditForm(row);
  dispatchRowSelected(row);

  const editCard = document.getElementById("gosaki-schedule-operator-edit");
  editCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function wireFilters(): void {
  const month = document.getElementById("gosaki-schedule-operator-month-filter");
  const published = document.getElementById("gosaki-schedule-operator-published-filter");
  const keyword = document.getElementById("gosaki-schedule-operator-keyword");

  month?.addEventListener("change", () => renderTable());
  published?.addEventListener("change", () => renderTable());
  keyword?.addEventListener("input", () => renderTable());
}

function wireTableActions(): void {
  const tbody = document.getElementById("gosaki-schedule-operator-table-body");
  tbody?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-select-row-id]");
    if (!button) return;
    const rowId = button.dataset.selectRowId;
    if (rowId) selectRowById(rowId);
  });
}

function wireAddForm(): void {
  const dateInput = document.getElementById("gosaki-add-date") as HTMLInputElement | null;
  const monthSelect = document.getElementById("gosaki-add-month") as HTMLSelectElement | null;
  const duplicateSelect = document.getElementById(
    "gosaki-add-duplicate-source",
  ) as HTMLSelectElement | null;

  dateInput?.addEventListener("change", () => {
    const month = monthFromDate(dateInput.value);
    if (monthSelect && monthSelect.value === "") {
      setPreviewLink("gosaki-add-preview-link", month);
    }
  });

  monthSelect?.addEventListener("change", () => {
    const month = monthSelect.value || monthFromDate(dateInput?.value ?? "");
    setPreviewLink("gosaki-add-preview-link", month);
  });

  duplicateSelect?.addEventListener("change", () => {
    const rowId = duplicateSelect.value;
    if (!rowId) return;
    const row = selectableRows.find((r) => r.id === rowId);
    if (row) populateAddFormFromRow(row);
  });
}

function wireEditForm(): void {
  const dateInput = document.getElementById("gosaki-edit-date") as HTMLInputElement | null;
  dateInput?.addEventListener("change", () => {
    const month = monthFromDate(dateInput.value);
    setFieldValue("gosaki-edit-month", month);
    setPreviewLink("gosaki-edit-preview-link", month);
  });
}

function wireDisabledActions(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-gosaki-schedule-action-disabled]")
    .forEach((button) => {
      button.disabled = true;
      button.title = "保存は次フェーズで開放予定です";
    });
}

export function initGosakiStagingScheduleOperatorUi(): void {
  const root = getRoot();
  if (!root) return;

  selectableRows = parseRowsDataset();
  wireFilters();
  wireTableActions();
  wireAddForm();
  wireEditForm();
  wireDisabledActions();
  renderTable();
  renderEditForm(null);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingScheduleOperatorUi();
  });
}
