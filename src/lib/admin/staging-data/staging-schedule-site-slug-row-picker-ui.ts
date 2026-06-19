/**
 * G-9g3f1 — Browser UI for site_slug schedule row picker (read-only; no Save / Preview / writes).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G3H1A_RESTORE_SELECTABLE_HINT,
  G9G3H1A_RESTORE_TARGET_UI_LABEL,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import {
  dispatchRowCleared,
  dispatchRowReloaded,
  dispatchRowSelected,
} from "./staging-schedule-site-slug-row-picker-events";
import {
  confirmDiscardDirtyCandidateIfNeeded,
} from "./staging-schedule-site-slug-edit-picker-binding";
import {
  isG9g3h1aSmokeMarkerRestoreTargetRow,
  isPocAuditScheduleRow,
} from "./staging-schedule-site-slug-row-picker-utils";

const SCHEDULE_ROW_PICKER_SELECT =
  "id,legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,show_on_home,home_order,published,sort_order,source_file,source_route,created_at,updated_at";

type TimeFilter = "all" | "future" | "past";
type PublishedFilter = "true" | "false" | "all";

let selectableRows: ScheduleRecord[] = [];
let selectedRow: ScheduleRecord | null = null;
let selectedRowLoadedAt: string | null = null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRoot(): HTMLElement | null {
  return document.getElementById("admin-staging-schedule-site-slug-row-picker");
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
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

function getSupabaseEnv(): { url: string; anonKey: string } {
  const env = mergeStagingShellEnv();
  return {
    url: String(env.PUBLIC_SUPABASE_URL ?? "").trim(),
    anonKey: String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
  };
}

function canUseLiveSupabase(): boolean {
  const root = getRoot();
  if (!root || root.dataset.readSource !== "supabase") return false;
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return false;
  const gate = evaluateSupabaseHostGate(url);
  return gate.hostGatePassed;
}

function getTimeFilter(): TimeFilter {
  const el = document.getElementById("site-slug-row-picker-time-filter") as HTMLSelectElement | null;
  const value = el?.value ?? "all";
  if (value === "future" || value === "past") return value;
  return "all";
}

function getMonthFilter(): string {
  const el = document.getElementById("site-slug-row-picker-month-filter") as HTMLSelectElement | null;
  return el?.value ?? "all";
}

function getPublishedFilter(): PublishedFilter {
  const el = document.getElementById(
    "site-slug-row-picker-published-filter",
  ) as HTMLSelectElement | null;
  const value = el?.value ?? "true";
  if (value === "false" || value === "all") return value;
  return "true";
}

function getKeywordFilter(): string {
  const el = document.getElementById("site-slug-row-picker-keyword") as HTMLInputElement | null;
  return (el?.value ?? "").trim().toLowerCase();
}

function rowMatchesFilters(row: ScheduleRecord): boolean {
  const today = getTodayIso();
  const timeFilter = getTimeFilter();
  if (timeFilter === "future" && row.date < today) return false;
  if (timeFilter === "past" && row.date >= today) return false;

  const monthFilter = getMonthFilter();
  if (monthFilter !== "all" && String(row.month ?? "") !== monthFilter) return false;

  const publishedFilter = getPublishedFilter();
  if (publishedFilter === "true" && row.published !== true) return false;
  if (publishedFilter === "false" && row.published !== false) return false;

  const keyword = getKeywordFilter();
  if (keyword) {
    const haystack = [row.title, row.venue, row.legacy_id, row.source_route]
      .map((v) => String(v ?? "").toLowerCase())
      .join(" ");
    if (!haystack.includes(keyword)) return false;
  }

  return true;
}

function renderRowTable(): void {
  const tbody = document.getElementById("site-slug-row-picker-table-body");
  if (!tbody) return;

  const filtered = selectableRows.filter(rowMatchesFilters);
  const countEl = document.getElementById("site-slug-row-picker-filtered-count");
  if (countEl) {
    countEl.textContent = String(filtered.length);
  }

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="site-slug-row-picker__empty-cell">No rows match current filters.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((row) => {
      const selected = selectedRow?.id === row.id;
      const restoreTarget = isG9g3h1aSmokeMarkerRestoreTargetRow(row);
      const rowClass = [
        "site-slug-row-picker__row",
        selected ? "site-slug-row-picker__row--selected" : "",
        restoreTarget ? "site-slug-row-picker__row--g9g3h1a-restore" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const restoreBadge = restoreTarget
        ? `<span class="site-slug-row-picker__restore-badge" title="${escapeHtml(G9G3H1A_RESTORE_SELECTABLE_HINT)}">${escapeHtml(G9G3H1A_RESTORE_TARGET_UI_LABEL)} — restore only</span>`
        : "";
      const selectLabel = selected
        ? "Selected"
        : restoreTarget
          ? "Select (restore)"
          : "Select";
      return `<tr class="${rowClass}" data-row-id="${escapeHtml(row.id)}" tabindex="0" role="button" aria-pressed="${selected ? "true" : "false"}">
        <td>${escapeHtml(row.date)}</td>
        <td>${escapeHtml(row.title ?? "—")}${restoreBadge}</td>
        <td>${escapeHtml(row.venue?.trim() ? row.venue : "—")}</td>
        <td><code>${escapeHtml(row.source_route ?? "—")}</code></td>
        <td>${row.published === true ? "true" : "false"}</td>
        <td><code>${escapeHtml(row.updated_at ?? "—")}</code></td>
        <td><code>${escapeHtml(row.legacy_id ?? "—")}</code></td>
        <td><button type="button" class="site-slug-row-picker__select-btn${restoreTarget ? " site-slug-row-picker__select-btn--restore" : ""}" data-select-row-id="${escapeHtml(row.id)}">${selectLabel}</button></td>
      </tr>`;
    })
    .join("");
}

function renderSelectedSummary(): void {
  const panel = document.getElementById("site-slug-row-picker-selected-summary");
  if (!panel) return;

  if (!selectedRow) {
    panel.innerHTML =
      '<p class="site-slug-row-picker__summary-empty" role="status">No row selected. Pick a row from the list above.</p>';
    return;
  }

  const staleHint = selectedRowLoadedAt
    ? `<p class="site-slug-row-picker__stale-hint" role="note">Loaded at <code>${escapeHtml(selectedRowLoadedAt)}</code>. Use <strong>Reload selected row</strong> if <code>updated_at</code> may have changed elsewhere. Selection feeds the general edit form below.</p>`
    : "";

  panel.innerHTML = `
    <dl class="site-slug-row-picker__summary-dl">
      <div><dt>id</dt><dd><code>${escapeHtml(selectedRow.id)}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code>${escapeHtml(selectedRow.legacy_id ?? "—")}</code></dd></div>
      <div><dt>site_slug</dt><dd><code>${escapeHtml(selectedRow.site_slug ?? "—")}</code></dd></div>
      <div><dt>updated_at</dt><dd><code>${escapeHtml(selectedRow.updated_at ?? "—")}</code></dd></div>
      <div><dt>date</dt><dd>${escapeHtml(selectedRow.date)}</dd></div>
      <div><dt>title</dt><dd>${escapeHtml(selectedRow.title ?? "—")}</dd></div>
      <div><dt>venue</dt><dd>${escapeHtml(selectedRow.venue?.trim() ? selectedRow.venue : "—")}</dd></div>
      <div><dt>source_route</dt><dd><code>${escapeHtml(selectedRow.source_route ?? "—")}</code></dd></div>
      <div><dt>published</dt><dd>${selectedRow.published === true ? "true" : "false"}</dd></div>
    </dl>
    ${staleHint}
    <p class="site-slug-row-picker__binding-note" role="note"><strong>Read-only picker.</strong> Selection feeds the general edit form below (G-9g3f3a binding).</p>
  `;
}

function selectRowById(rowId: string): void {
  const row = selectableRows.find((r) => r.id === rowId);
  if (!row) return;
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    dispatchRowCleared("site-slug-mismatch");
    const status = document.getElementById("site-slug-row-picker-status");
    if (status) status.textContent = "Selection blocked — site_slug scope mismatch.";
    return;
  }
  if (isPocAuditScheduleRow(row)) {
    dispatchRowCleared("poc-audit-blocked");
    const status = document.getElementById("site-slug-row-picker-status");
    if (status) {
      status.textContent =
        "PoC audit row — not selectable for edit. See PoC audit rows panel.";
    }
    return;
  }
  if (!confirmDiscardDirtyCandidateIfNeeded(rowId)) {
    return;
  }
  selectedRow = row;
  selectedRowLoadedAt = new Date().toISOString();
  renderRowTable();
  renderSelectedSummary();
  renderDetailPreview();
  dispatchRowSelected(row);
  const status = document.getElementById("site-slug-row-picker-status");
  if (status) {
    status.textContent = isG9g3h1aSmokeMarkerRestoreTargetRow(row)
      ? `Selected ${G9G3H1A_RESTORE_TARGET_UI_LABEL} — ${row.legacy_id ?? row.id} (${G9G3H1A_RESTORE_SELECTABLE_HINT}).`
      : `Selected row ${row.legacy_id ?? row.id} — bound to general edit.`;
  }
}

function clearSelection(): void {
  selectedRow = null;
  selectedRowLoadedAt = null;
  renderRowTable();
  renderSelectedSummary();
  renderDetailPreview();
  dispatchRowCleared("clear");
  const status = document.getElementById("site-slug-row-picker-status");
  if (status) status.textContent = "Selection cleared.";
}

function renderDetailPreview(): void {
  const el = document.getElementById("site-slug-row-picker-detail-preview");
  if (!el) return;
  if (!selectedRow) {
    el.innerHTML =
      '<p class="site-slug-row-picker__detail-empty">Select a row to preview details.</p>';
    return;
  }
  el.innerHTML = `<pre class="site-slug-row-picker__detail-json">${escapeHtml(
    JSON.stringify(
      {
        id: selectedRow.id,
        legacy_id: selectedRow.legacy_id,
        site_slug: selectedRow.site_slug,
        date: selectedRow.date,
        title: selectedRow.title,
        venue: selectedRow.venue,
        source_route: selectedRow.source_route,
        published: selectedRow.published,
        show_on_home: selectedRow.show_on_home,
        updated_at: selectedRow.updated_at,
      },
      null,
      2,
    ),
  )}</pre>`;
}

async function reloadSelectedRow(): Promise<void> {
  const status = document.getElementById("site-slug-row-picker-status");
  if (!selectedRow) {
    if (status) status.textContent = "No row selected to reload.";
    return;
  }
  if (!canUseLiveSupabase()) {
    if (status) {
      status.textContent = "Live Supabase read unavailable — use Reload page instead.";
    }
    return;
  }

  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  const { url, anonKey } = getSupabaseEnv();
  if (status) status.textContent = "Reloading selected row (SELECT only)…";

  try {
    const client = getStagingSupabaseClient(url, anonKey);
    const { data, error } = await client
      .from("schedules")
      .select(SCHEDULE_ROW_PICKER_SELECT)
      .eq("id", selectedRow.id)
      .eq("site_slug", siteSlug)
      .single();

    if (error || !data) {
      if (status) status.textContent = `Reload failed: ${error?.message ?? "row not found"}`;
      return;
    }

    const row = data as ScheduleRecord;
    if (row.site_slug !== siteSlug) {
      if (status) status.textContent = "Reload blocked — site_slug scope mismatch.";
      return;
    }

    const previousUpdatedAt = selectedRow.updated_at ?? null;
    selectedRow = row;
    selectedRowLoadedAt = new Date().toISOString();
    const idx = selectableRows.findIndex((r) => r.id === row.id);
    if (idx >= 0) selectableRows[idx] = row;

    renderRowTable();
    renderSelectedSummary();
    renderDetailPreview();
    dispatchRowReloaded(row, previousUpdatedAt);
    if (status) {
      status.textContent = `Selected row reloaded. updated_at=${row.updated_at ?? "—"}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (status) status.textContent = `Reload error: ${message}`;
  }
}

function reloadPage(): void {
  window.location.reload();
}

function onFilterChange(): void {
  renderRowTable();
  const status = document.getElementById("site-slug-row-picker-status");
  if (status) status.textContent = "Filters applied (client-side).";
}

function bindEvents(): void {
  const root = getRoot();
  if (!root) return;

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const selectBtn = target.closest("[data-select-row-id]") as HTMLElement | null;
    if (selectBtn?.dataset.selectRowId) {
      selectRowById(selectBtn.dataset.selectRowId);
      return;
    }
    if (target.id === "site-slug-row-picker-clear-btn") {
      clearSelection();
      return;
    }
    if (target.id === "site-slug-row-picker-reload-row-btn") {
      void reloadSelectedRow();
      return;
    }
    if (target.id === "site-slug-row-picker-reload-page-btn") {
      reloadPage();
    }
  });

  for (const id of [
    "site-slug-row-picker-time-filter",
    "site-slug-row-picker-month-filter",
    "site-slug-row-picker-published-filter",
    "site-slug-row-picker-keyword",
  ]) {
    const el = document.getElementById(id);
    el?.addEventListener("change", onFilterChange);
    el?.addEventListener("input", onFilterChange);
  }
}

function initRowPickerUi(): void {
  selectableRows = parseRowsDataset();
  renderRowTable();
  renderSelectedSummary();
  renderDetailPreview();
  bindEvents();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRowPickerUi);
} else {
  initRowPickerUi();
}
