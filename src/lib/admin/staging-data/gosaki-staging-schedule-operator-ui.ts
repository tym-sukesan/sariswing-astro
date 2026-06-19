/**
 * Gosaki staging shell — operator schedule list (read-only; dispatches row selection to edit binding).
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "./staging-schedule-site-slug-config";
import { dispatchRowSelected } from "./staging-schedule-site-slug-row-picker-events";
import { confirmDiscardDirtyCandidateIfNeeded } from "./staging-schedule-site-slug-edit-picker-binding";
import { isPocAuditScheduleRow } from "./staging-schedule-site-slug-row-picker-utils";

type PublishedFilter = "published" | "all" | "draft";

let selectableRows: ScheduleRecord[] = [];
let selectedRowId: string | null = null;

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
  const raw = root.dataset.selectableRows;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ScheduleRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

function renderDetailPanel(row: ScheduleRecord | null): void {
  const emptyEl = document.getElementById("gosaki-schedule-operator-detail-empty");
  const bodyEl = document.getElementById("gosaki-schedule-operator-detail-body");
  if (!emptyEl || !bodyEl) return;

  if (!row) {
    emptyEl.hidden = false;
    bodyEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  bodyEl.hidden = false;

  const set = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  set("gosaki-detail-date", row.date);
  set("gosaki-detail-title", displayValue(row.title));
  set("gosaki-detail-venue", displayValue(row.venue));
  set("gosaki-detail-open-time", displayValue(row.open_time));
  set("gosaki-detail-start-time", displayValue(row.start_time));
  set("gosaki-detail-price", displayValue(row.price));
  set("gosaki-detail-description", displayValue(row.description));
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
        <td><button type="button" class="admin-button admin-button--secondary admin-gosaki-schedule-select-btn" data-select-row-id="${escapeHtml(row.id)}">${selected ? "選択中" : "確認する"}</button></td>
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
  renderDetailPanel(row);
  dispatchRowSelected(row);
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

export function initGosakiStagingScheduleOperatorUi(): void {
  const root = getRoot();
  if (!root) return;

  selectableRows = parseRowsDataset();
  wireFilters();
  wireTableActions();
  renderTable();
  renderDetailPanel(null);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingScheduleOperatorUi();
  });
}
