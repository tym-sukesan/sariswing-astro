/**
 * G-9g3f3a — Picker → general edit form binding (client-side CustomEvent bridge).
 * Hydrate only — no Save / Preview execution / DB writes.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import {
  ROW_CLEARED_EVENT,
  ROW_RELOADED_EVENT,
  ROW_SELECTED_EVENT,
  eventDetailToScheduleRecord,
  type RowClearedEventPayload,
  type RowReloadedEventPayload,
  type RowSelectedEventPayload,
} from "./staging-schedule-site-slug-row-picker-events";
import { isPocAuditScheduleRow } from "./staging-schedule-site-slug-row-picker-utils";
import {
  G9G3F3C_PREVIEW_STALE_MSG,
  G9G3F3C_ROW_SWITCH_UNSAVED_CONFIRM_MSG,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";

const SCHEDULE_EDIT_RELOAD_SELECT =
  "id,legacy_id,site_slug,date,year,month,title,venue,open_time,start_time,price,description,show_on_home,home_order,published,sort_order,source_file,source_route,created_at,updated_at";

const SAFE_FIELD_INPUT_IDS: Record<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], string> = {
  title: "site-slug-edit-dry-run-title",
  venue: "site-slug-edit-dry-run-venue",
  open_time: "site-slug-edit-dry-run-open-time",
  start_time: "site-slug-edit-dry-run-start-time",
  price: "site-slug-edit-dry-run-price",
  description: "site-slug-edit-dry-run-description",
};

const LOADED_VALUE_IDS: Record<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], string> = {
  title: "site-slug-edit-loaded-title",
  venue: "site-slug-edit-loaded-venue",
  open_time: "site-slug-edit-loaded-open-time",
  start_time: "site-slug-edit-loaded-start-time",
  price: "site-slug-edit-loaded-price",
  description: "site-slug-edit-loaded-description",
};

export interface PickerEditBindingHooks {
  invalidateDryRunPreview: () => void;
  markG9PreviewStale: (reason?: string) => void;
  refreshSaveButtonStates: () => void;
  refreshSaveGatePanel: () => void;
  refreshPreviewButtonState: () => void;
  clearDryRunResultPlaceholder: (message: string) => void;
}

let hooks: PickerEditBindingHooks | null = null;
let loadedBaseline: ScheduleRecord | null = null;
let previewBaselineUpdatedAt: string | null = null;

function getEditRoot(): HTMLElement | null {
  return document.getElementById("admin-staging-schedule-site-slug-edit");
}

function isPickerDrivenBinding(): boolean {
  return getEditRoot()?.dataset.pickerDrivenBinding === "true";
}

function getFieldValue(field: (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number]): string {
  const el = document.getElementById(SAFE_FIELD_INPUT_IDS[field]);
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return "";
}

function setFieldValue(field: (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], value: string): void {
  const el = document.getElementById(SAFE_FIELD_INPUT_IDS[field]);
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    el.value = value;
  }
}

function isDirtyCandidate(): boolean {
  if (!loadedBaseline) return false;
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    const current = getFieldValue(field);
    const baseline = loadedBaseline[field] ?? "";
    if (current !== baseline) return true;
  }
  return false;
}

/** G-9g3f3c — row picker calls before changing selection when edit form may have dirty candidates. */
export function confirmDiscardDirtyCandidateIfNeeded(nextRowId: string): boolean {
  if (!isPickerDrivenBinding()) return true;
  if (!loadedBaseline) return true;
  if (loadedBaseline.id === nextRowId) return true;
  if (!isDirtyCandidate()) return true;
  return window.confirm(G9G3F3C_ROW_SWITCH_UNSAVED_CONFIRM_MSG);
}

export function hasUnsavedCandidateEdits(): boolean {
  return isDirtyCandidate();
}

function setCandidateInputsEnabled(enabled: boolean): void {
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    const el = document.getElementById(SAFE_FIELD_INPUT_IDS[field]);
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.disabled = !enabled;
    }
  }
}

function updateLoadedDisplays(row: ScheduleRecord | null): void {
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    const el = document.getElementById(LOADED_VALUE_IDS[field]);
    if (el) el.textContent = row ? (row[field] ?? "—") : "—";
  }
}

function setTargetRowDataset(row: ScheduleRecord | null): void {
  const root = getEditRoot();
  if (!root) return;
  root.dataset.targetRow = row ? JSON.stringify(row) : "";
  root.dataset.targetId = row?.id ?? "";
  root.dataset.legacyId = row?.legacy_id ?? "";
  root.dataset.pickerRowBound = row ? "true" : "false";
}

function updateSelectedRowStrip(row: ScheduleRecord | null): void {
  const badge = document.getElementById("site-slug-edit-editing-badge");
  const strip = document.getElementById("site-slug-edit-selected-row-strip");
  const placeholder = document.getElementById("site-slug-edit-picker-placeholder");

  if (badge) badge.hidden = !row;
  if (placeholder) placeholder.hidden = Boolean(row);

  if (!strip) return;
  if (!row) {
    strip.innerHTML = "";
    return;
  }

  strip.innerHTML = `
    <dl class="admin-staging-schedule-site-slug-edit__selected-dl" data-selected-row-identity="true">
      <div><dt>id</dt><dd><code id="site-slug-edit-bound-id">${escapeHtml(row.id)}</code></dd></div>
      <div><dt>legacy_id</dt><dd><code id="site-slug-edit-bound-legacy-id">${escapeHtml(row.legacy_id ?? "—")}</code></dd></div>
      <div><dt>site_slug</dt><dd><code id="site-slug-edit-bound-site-slug">${escapeHtml(row.site_slug ?? "—")}</code></dd></div>
      <div><dt>updated_at</dt><dd><code id="site-slug-edit-baseline-updated-at">${escapeHtml(row.updated_at ?? "—")}</code></dd></div>
      <div><dt>source_route</dt><dd><code id="site-slug-edit-bound-source-route">${escapeHtml(row.source_route ?? "—")}</code></dd></div>
      <div><dt>title</dt><dd id="site-slug-edit-bound-title">${escapeHtml(row.title ?? "—")}</dd></div>
    </dl>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setBannerVisible(id: string, visible: boolean, message?: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.hidden = !visible;
  if (message !== undefined) el.textContent = message;
}

function setDirtyWarning(visible: boolean): void {
  const el = document.getElementById("site-slug-edit-dirty-candidate-warning");
  if (!el) return;
  el.hidden = !visible;
}

function validateRowForHydrate(row: ScheduleRecord): string | null {
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return "site_slug mismatch — edit hydrate blocked";
  }
  if (isPocAuditScheduleRow(row)) {
    return "PoC audit row — edit hydrate blocked";
  }
  return null;
}

function hydrateFromRow(row: ScheduleRecord): void {
  loadedBaseline = row;
  previewBaselineUpdatedAt = row.updated_at ?? null;
  setTargetRowDataset(row);
  updateSelectedRowStrip(row);
  updateLoadedDisplays(row);

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    setFieldValue(field, row[field] ?? "");
  }

  setCandidateInputsEnabled(true);
  setBannerVisible("site-slug-edit-poc-audit-blocked", false);
  setBannerVisible("site-slug-edit-site-slug-stop", false);
  setDirtyWarning(false);

  hooks?.invalidateDryRunPreview();
  hooks?.clearDryRunResultPlaceholder(
    "Row bound from picker — change fields and run Preview G-9 site_slug general edit dry-run.",
  );
  hooks?.refreshPreviewButtonState();
  hooks?.refreshSaveButtonStates();
  hooks?.refreshSaveGatePanel();
}

function clearToPlaceholder(reason: string): void {
  loadedBaseline = null;
  previewBaselineUpdatedAt = null;
  setTargetRowDataset(null);
  updateSelectedRowStrip(null);
  updateLoadedDisplays(null);

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    setFieldValue(field, "");
  }

  setCandidateInputsEnabled(false);
  setDirtyWarning(false);
  setBannerVisible("site-slug-edit-poc-audit-blocked", false);
  setBannerVisible("site-slug-edit-site-slug-stop", false);

  hooks?.invalidateDryRunPreview();
  hooks?.clearDryRunResultPlaceholder(
    `No row selected — ${reason}. Select a row in the picker above.`,
  );
  hooks?.refreshSaveButtonStates();
  hooks?.refreshSaveGatePanel();
  hooks?.refreshPreviewButtonState();
}

function onRowSelected(event: Event): void {
  if (!isPickerDrivenBinding()) return;
  const detail = (event as CustomEvent<RowSelectedEventPayload>).detail;
  const row = eventDetailToScheduleRecord(detail.row);

  const blockReason = validateRowForHydrate(row);
  if (blockReason) {
    if (blockReason.includes("site_slug")) {
      setBannerVisible("site-slug-edit-site-slug-stop", true, `STOP — ${blockReason}`);
    } else {
      setBannerVisible(
        "site-slug-edit-poc-audit-blocked",
        true,
        `STOP — ${blockReason}. Pilot / [CMS Kit staging] rows are audit-only.`,
      );
    }
    clearToPlaceholder(blockReason);
    return;
  }

  hydrateFromRow(row);
}

function onRowCleared(event: Event): void {
  if (!isPickerDrivenBinding()) return;
  const detail = (event as CustomEvent<RowClearedEventPayload>).detail;
  if (detail.reason === "poc-audit-blocked") {
    setBannerVisible(
      "site-slug-edit-poc-audit-blocked",
      true,
      "STOP — PoC audit row cannot be bound to general edit.",
    );
  }
  clearToPlaceholder(`Selection cleared (${detail.reason})`);
}

function onRowReloaded(event: Event): void {
  if (!isPickerDrivenBinding()) return;
  const detail = (event as CustomEvent<RowReloadedEventPayload>).detail;
  const row = eventDetailToScheduleRecord(detail.row);
  const blockReason = validateRowForHydrate(row);
  if (blockReason) {
    clearToPlaceholder(blockReason);
    return;
  }

  const updatedAtChanged =
    detail.previousUpdatedAt != null &&
    detail.previousUpdatedAt !== (row.updated_at ?? null);

  hydrateFromRow(row);

  if (updatedAtChanged) {
    hooks?.clearDryRunResultPlaceholder(
      `${G9G3F3C_PREVIEW_STALE_MSG} (updated_at changed on reload).`,
    );
  }
}

function resetCandidatesToLoaded(): void {
  if (!loadedBaseline) return;
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    setFieldValue(field, loadedBaseline[field] ?? "");
  }
  setDirtyWarning(false);
  hooks?.invalidateDryRunPreview();
  hooks?.clearDryRunResultPlaceholder("Candidate values reset to loaded DB baseline.");
}

function getSupabaseEnv(): { url: string; anonKey: string } {
  const env = mergeStagingShellEnv();
  return {
    url: String(env.PUBLIC_SUPABASE_URL ?? "").trim(),
    anonKey: String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
  };
}

async function reloadFromDb(): Promise<void> {
  if (!loadedBaseline) return;
  const root = getEditRoot();
  if (!root || root.dataset.source !== "supabase") return;

  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return;
  const gate = evaluateSupabaseHostGate(url);
  if (!gate.hostGatePassed) return;

  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  const previousUpdatedAt = loadedBaseline.updated_at ?? null;
  const status = document.getElementById("site-slug-edit-reload-status");
  if (status) status.textContent = "Reloading from DB (SELECT only)…";

  try {
    const client = getStagingSupabaseClient(url, anonKey);
    const { data, error } = await client
      .from("schedules")
      .select(SCHEDULE_EDIT_RELOAD_SELECT)
      .eq("id", loadedBaseline.id)
      .eq("site_slug", siteSlug)
      .single();

    if (error || !data) {
      if (status) status.textContent = `Reload failed: ${error?.message ?? "row not found"}`;
      return;
    }

    const row = data as ScheduleRecord;
    if (row.site_slug !== siteSlug) {
      setBannerVisible("site-slug-edit-site-slug-stop", true, "STOP — site_slug scope mismatch.");
      if (status) status.textContent = "Reload blocked — site_slug mismatch.";
      return;
    }

    const updatedAtChanged =
      previousUpdatedAt != null && previousUpdatedAt !== (row.updated_at ?? null);

    hydrateFromRow(row);

    if (updatedAtChanged) {
      hooks?.clearDryRunResultPlaceholder(
        `${G9G3F3C_PREVIEW_STALE_MSG} (updated_at changed on DB reload).`,
      );
      if (status) {
        status.textContent = `Reloaded — updated_at changed (${previousUpdatedAt} → ${row.updated_at ?? "—"}). ${G9G3F3C_PREVIEW_STALE_MSG}`;
      }
    } else if (status) {
      status.textContent = `Reloaded from DB. updated_at=${row.updated_at ?? "—"}`;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (status) status.textContent = `Reload error: ${message}`;
  }
}

function bindPickerEditControls(): void {
  document.getElementById("site-slug-edit-reset-candidates-btn")?.addEventListener("click", () => {
    resetCandidatesToLoaded();
  });

  document.getElementById("site-slug-edit-reload-from-db-btn")?.addEventListener("click", () => {
    void reloadFromDb();
  });

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    document.getElementById(SAFE_FIELD_INPUT_IDS[field])?.addEventListener("input", () => {
      if (!loadedBaseline) return;
      setDirtyWarning(isDirtyCandidate());
      hooks?.markG9PreviewStale(G9G3F3C_PREVIEW_STALE_MSG);
    });
  }
}

export function initPickerEditBinding(bindingHooks: PickerEditBindingHooks): void {
  if (!isPickerDrivenBinding()) return;
  hooks = bindingHooks;

  document.addEventListener(ROW_SELECTED_EVENT, onRowSelected);
  document.addEventListener(ROW_CLEARED_EVENT, onRowCleared);
  document.addEventListener(ROW_RELOADED_EVENT, onRowReloaded);

  bindPickerEditControls();
  clearToPlaceholder("Select a row in the picker above");
}

export function hasPickerBoundRow(): boolean {
  return loadedBaseline != null;
}

export function getPickerLoadedBaseline(): ScheduleRecord | null {
  return loadedBaseline;
}
