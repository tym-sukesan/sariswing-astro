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

function normalizeDateInput(date: string): string {
  const trimmed = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (slash) return `${slash[1]}-${slash[2]}-${slash[3]}`;
  return "";
}

function monthFromDate(date: string): string {
  const normalized = normalizeDateInput(date);
  if (!normalized) return "";
  return normalized.slice(0, 7);
}

function formatMonthHint(date: string): string {
  const month = monthFromDate(date);
  if (!month) {
    return "日付を入力すると、表示先の月が自動で決まります。";
  }
  const [year, mon] = month.split("-");
  return `この公演は ${year}-${mon} のページに表示されます`;
}

function setMonthHint(elementId: string, date: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = formatMonthHint(date);
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

function formatTimes(row: ScheduleRecord): string {
  const open = String(row.open_time ?? "").trim();
  const start = String(row.start_time ?? "").trim();
  const openLabel = open || "—";
  const startLabel = start || "—";
  if (!open && !start) return "—";
  return `開場 ${openLabel} / 開演 ${startLabel}`;
}

function formatPriceLabel(price: string | null | undefined): string {
  const value = String(price ?? "").trim();
  if (!value) return "—";
  return value.startsWith("料金") ? value : `料金 ${value}`;
}

function setCheckbox(id: string, checked: boolean): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) el.checked = checked;
}

function populateAddFormFromRow(row: ScheduleRecord): void {
  const date = row.date ?? "";
  setFieldValue("gosaki-add-date", date);
  setFieldValue("gosaki-add-title", String(row.title ?? ""));
  setFieldValue("gosaki-add-venue", String(row.venue ?? ""));
  setFieldValue("gosaki-add-open-time", String(row.open_time ?? ""));
  setFieldValue("gosaki-add-start-time", String(row.start_time ?? ""));
  setFieldValue("gosaki-add-price", String(row.price ?? ""));
  setFieldValue("gosaki-add-description", String(row.description ?? ""));
  setCheckbox("gosaki-add-published", row.published === true);
  setMonthHint("gosaki-add-month-hint", date);
  setPreviewLink("gosaki-add-preview-link", monthFromDate(date));
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

  const date = row.date ?? "";
  const month = monthFromDate(date);

  setFieldValue("gosaki-edit-date", date);
  setMonthHint("gosaki-edit-month-hint", date);
  setFieldValue("gosaki-edit-title", String(row.title ?? ""));
  setFieldValue("gosaki-edit-venue", String(row.venue ?? ""));
  setFieldValue("gosaki-edit-open-time", String(row.open_time ?? ""));
  setFieldValue("gosaki-edit-start-time", String(row.start_time ?? ""));
  setFieldValue("gosaki-edit-price", String(row.price ?? ""));
  setFieldValue("gosaki-edit-description", String(row.description ?? ""));
  setCheckbox("gosaki-edit-published", row.published === true);
  setPreviewLink("gosaki-edit-preview-link", month);
}

function renderScheduleRowButton(rowId: string, selected: boolean): string {
  return `<button type="button" class="admin-button admin-button--secondary admin-gosaki-schedule-select-btn" data-select-row-id="${escapeHtml(rowId)}">${selected ? "選択中" : "編集する"}</button>`;
}

function renderScheduleList(): void {
  const filtered = selectableRows.filter(rowMatchesFilters);
  const countEl = document.getElementById("gosaki-schedule-operator-filtered-count");
  if (countEl) countEl.textContent = String(filtered.length);

  const tbody = document.getElementById("gosaki-schedule-operator-table-body");
  const cardList = document.getElementById("gosaki-schedule-operator-card-list");

  if (filtered.length === 0) {
    const emptyMessage =
      '<tr><td colspan="7" class="admin-gosaki-schedule-table__empty">該当する公演はありません。</td></tr>';
    if (tbody) tbody.innerHTML = emptyMessage;
    if (cardList) {
      cardList.innerHTML =
        '<li class="gosaki-schedule-admin-card-list__empty">該当する公演はありません。</li>';
    }
    return;
  }

  if (tbody) {
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
        <td>${renderScheduleRowButton(row.id, selected)}</td>
      </tr>`;
      })
      .join("");
  }

  if (cardList) {
    cardList.innerHTML = filtered
      .map((row) => {
        const selected = selectedRowId === row.id;
        const published = row.published === true;
        return `<li class="gosaki-schedule-admin-card${selected ? " is-selected" : ""}" data-row-id="${escapeHtml(row.id)}">
        <div class="gosaki-schedule-admin-card__head">
          <time class="gosaki-schedule-admin-card__date" datetime="${escapeHtml(row.date)}">${escapeHtml(row.date)}</time>
          <span class="gosaki-schedule-admin-card__status gosaki-schedule-admin-card__status--${published ? "published" : "draft"}">${published ? "公開" : "非公開"}</span>
        </div>
        <p class="gosaki-schedule-admin-card__title">${escapeHtml(displayValue(row.title))}</p>
        <p class="gosaki-schedule-admin-card__venue">${escapeHtml(displayValue(row.venue))}</p>
        <p class="gosaki-schedule-admin-card__times">${escapeHtml(formatTimes(row))}</p>
        <p class="gosaki-schedule-admin-card__price">${escapeHtml(formatPriceLabel(row.price))}</p>
        <div class="gosaki-schedule-admin-card__actions">
          ${renderScheduleRowButton(row.id, selected)}
        </div>
      </li>`;
      })
      .join("");
  }
}

function selectRowById(rowId: string): void {
  const row = selectableRows.find((r) => r.id === rowId);
  if (!row) return;
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) return;
  if (isPocAuditScheduleRow(row)) return;
  if (!confirmDiscardDirtyCandidateIfNeeded(rowId)) return;

  selectedRowId = rowId;
  renderScheduleList();
  renderEditForm(row);
  dispatchRowSelected(row);

  const editCard = document.getElementById("gosaki-schedule-operator-edit");
  editCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function wireFilters(): void {
  const month = document.getElementById("gosaki-schedule-operator-month-filter");
  const published = document.getElementById("gosaki-schedule-operator-published-filter");
  const keyword = document.getElementById("gosaki-schedule-operator-keyword");

  month?.addEventListener("change", () => renderScheduleList());
  published?.addEventListener("change", () => renderScheduleList());
  keyword?.addEventListener("input", () => renderScheduleList());
}

function wireListActions(): void {
  const handleClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-select-row-id]");
    if (!button) return;
    const rowId = button.dataset.selectRowId;
    if (rowId) selectRowById(rowId);
  };

  document.getElementById("gosaki-schedule-operator-table-body")?.addEventListener("click", handleClick);
  document.getElementById("gosaki-schedule-operator-card-list")?.addEventListener("click", handleClick);
}

function wireTableActions(): void {
  wireListActions();
}

function wireAddForm(): void {
  const dateInput = document.getElementById("gosaki-add-date") as HTMLInputElement | null;
  const duplicateSelect = document.getElementById(
    "gosaki-add-duplicate-source",
  ) as HTMLSelectElement | null;

  const syncAddDateDerived = () => {
    const date = dateInput?.value ?? "";
    const month = monthFromDate(date);
    setMonthHint("gosaki-add-month-hint", date);
    setPreviewLink("gosaki-add-preview-link", month);
  };

  dateInput?.addEventListener("change", syncAddDateDerived);
  dateInput?.addEventListener("input", syncAddDateDerived);

  duplicateSelect?.addEventListener("change", () => {
    const rowId = duplicateSelect.value;
    if (!rowId) return;
    const row = selectableRows.find((r) => r.id === rowId);
    if (row) populateAddFormFromRow(row);
  });

  syncAddDateDerived();
}

function wireEditForm(): void {
  const dateInput = document.getElementById("gosaki-edit-date") as HTMLInputElement | null;
  const syncEditDateDerived = () => {
    const date = dateInput?.value ?? "";
    const month = monthFromDate(date);
    setMonthHint("gosaki-edit-month-hint", date);
    setPreviewLink("gosaki-edit-preview-link", month);
  };
  dateInput?.addEventListener("change", syncEditDateDerived);
  dateInput?.addEventListener("input", syncEditDateDerived);
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
  renderScheduleList();
  renderEditForm(null);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingScheduleOperatorUi();
  });
}
