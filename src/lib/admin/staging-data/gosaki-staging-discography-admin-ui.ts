/**
 * Gosaki staging shell — Discography admin UI (Supabase read + G-15a2 dry-run Preview).
 */

import type { GosakiDiscographyRecord } from "./gosaki-discography-read-types";
import { checkDiscographyRowStale } from "../staging-write/staging-discography-optimistic-lock-stale-check";
import { getGosakiDiscographyDryRunConfig } from "../staging-write/gosaki-discography-dry-run-config";
import {
  executeG15a2DiscographyDryRun,
  readDiscographyDryRunFormValues,
  type G15a2DiscographyDryRunResult,
} from "../staging-write/gosaki-discography-existing-release-dry-run";
import { G15A2_TARGET_LEGACY_ID } from "../staging-write/gosaki-discography-dry-run-types";

let selectedRowSnapshot: GosakiDiscographyRecord | null = null;
let lastDryRunResult: G15a2DiscographyDryRunResult | null = null;

function wireDisabledActions(): void {
  const disabledButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-gosaki-disc-action-disabled]",
  );
  disabledButtons.forEach((button) => {
    button.disabled = true;
    button.title = "保存は次フェーズで開放予定です";
  });
}

function parseRowsFromDom(root: HTMLElement): GosakiDiscographyRecord[] {
  const raw = root.dataset.discographyRows ?? "[]";
  try {
    const parsed = JSON.parse(raw) as GosakiDiscographyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readRowDataset(item: HTMLElement): GosakiDiscographyRecord | null {
  const legacyId = item.dataset.legacyId ?? "";
  if (!legacyId) return null;
  return {
    id: item.dataset.id ?? "",
    legacy_id: legacyId,
    title: item.dataset.title ?? "",
    artist: item.dataset.artist || null,
    release_date: item.dataset.releaseDate || null,
    year: item.dataset.year ? Number(item.dataset.year) : null,
    catalog_number: item.dataset.catalogNumber || null,
    label: item.dataset.label || null,
    description: item.dataset.description || null,
    cover_image_url: item.dataset.coverImageUrl || null,
    purchase_url: item.dataset.purchaseUrl || null,
    streaming_url: item.dataset.streamingUrl || null,
    sort_order: item.dataset.sortOrder ? Number(item.dataset.sortOrder) : null,
    published: item.dataset.published === "true",
    updated_at: item.dataset.updatedAt || null,
    tracks: [],
  };
}

function populateEditForm(item: HTMLElement, rows: GosakiDiscographyRecord[]): void {
  const form = document.getElementById("gosaki-disc-edit-form");
  if (!form) return;

  const legacyId = item.dataset.legacyId ?? "";
  const snapshot =
    rows.find((row) => row.legacy_id === legacyId) ?? readRowDataset(item);
  if (!snapshot) return;
  selectedRowSnapshot = snapshot;

  const setValue = (name: string, value: string) => {
    const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]`,
    );
    if (el) el.value = value;
  };

  setValue("legacy_id", snapshot.legacy_id);
  setValue("title", snapshot.title);
  setValue("artist", snapshot.artist ?? "");
  setValue("release_date", snapshot.release_date ?? "");
  setValue("year", snapshot.year != null ? String(snapshot.year) : "");
  setValue("catalog_number", snapshot.catalog_number ?? "");
  setValue("label", snapshot.label ?? "");
  setValue("description", snapshot.description ?? "");
  setValue("cover_image_url", snapshot.cover_image_url ?? "");
  setValue("purchase_url", snapshot.purchase_url ?? "");
  setValue("streaming_url", snapshot.streaming_url ?? "");
  setValue("sort_order", snapshot.sort_order != null ? String(snapshot.sort_order) : "");
  setValue(
    "tracks",
    snapshot.tracks.map((track) => track.title).join("\n"),
  );

  const published = form.querySelector<HTMLInputElement>('input[name="published"]');
  if (published) published.checked = snapshot.published !== false;

  const selectedLabel = document.getElementById("gosaki-disc-selected-legacy-id");
  if (selectedLabel) selectedLabel.textContent = snapshot.legacy_id || "—";

  const updatedAtEl = document.getElementById("gosaki-disc-form-updated-at");
  if (updatedAtEl) updatedAtEl.textContent = snapshot.updated_at ?? "—";

  document.querySelectorAll<HTMLElement>(".gosaki-discography-admin-item").forEach((row) => {
    row.classList.toggle("gosaki-discography-admin-item--selected", row === item);
  });

  clearDryRunResult();
}

function clearDryRunResult(): void {
  lastDryRunResult = null;
  const el = document.getElementById("gosaki-disc-dry-run-result");
  if (!el) return;
  el.hidden = true;
  el.innerHTML = "";
}

function renderDryRunResult(result: G15a2DiscographyDryRunResult): void {
  const el = document.getElementById("gosaki-disc-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.className = `gosaki-disc-dry-run-result gosaki-disc-dry-run-result--${result.ok ? "ok" : "error"}`;

  const guardHtml =
    result.guardErrors.length > 0
      ? `<ul>${result.guardErrors.map((msg) => `<li>${escapeHtml(msg)}</li>`).join("")}</ul>`
      : "<p>なし</p>";

  el.innerHTML = `
    <h3 class="gosaki-disc-dry-run-result__title">確認結果（dry-run）</h3>
    <p><strong>ok:</strong> ${result.ok ? "true" : "false"}</p>
    <p><strong>actualWrite:</strong> ${result.safety.actualWrite ? "true" : "false"}</p>
    <p><strong>wouldWrite:</strong> ${result.safety.wouldWrite ? "true" : "false"}</p>
    <p><strong>changedFields:</strong> ${escapeHtml(result.changedFields.join(", ") || "—")}</p>
    <p><strong>payloadKeys:</strong> ${escapeHtml(result.payloadKeys.join(", ") || "—")}</p>
    <p><strong>expectedBeforeUpdatedAt:</strong> ${escapeHtml(result.expectedBeforeUpdatedAt ?? "—")}</p>
    <p><strong>optimisticLockStale:</strong> ${result.optimisticLockStale ? "true" : "false"}</p>
    <p><strong>saveReadiness:</strong> ${escapeHtml(result.saveReadiness)}</p>
    <p><strong>before:</strong> <code>${escapeHtml(JSON.stringify(result.before))}</code></p>
    <p><strong>after:</strong> <code>${escapeHtml(JSON.stringify(result.after))}</code></p>
    <p><strong>payload:</strong> <code>${escapeHtml(JSON.stringify(result.payload))}</code></p>
    <div><strong>guardErrors:</strong> ${guardHtml}</div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function runDryRunPreview(): Promise<void> {
  const form = document.getElementById("gosaki-disc-edit-form");
  if (!form || !(form instanceof HTMLFormElement)) return;

  if (!selectedRowSnapshot) {
    renderDryRunResult({
      ok: false,
      dryRun: true,
      phase: "G-15a2-gosaki-discography-dry-run-preview-implementation-and-preflight",
      approvalId: "G-15a2-gosaki-discography-purchase-url-dry-run-slice",
      target: {
        id: "",
        legacy_id: G15A2_TARGET_LEGACY_ID,
        title: "",
        site_slug: "gosaki-piano",
      },
      changedFields: [],
      payloadKeys: [],
      before: {},
      after: {},
      payload: {},
      expectedBeforeUpdatedAt: null,
      optimisticLockStale: false,
      guardErrors: ["先に一覧から編集する作品を選んでください。"],
      saveReadiness: "guard_error",
      saveAllowed: false,
      rowsAffectedRequired: 1,
      safety: {
        supabaseWriteCalled: false,
        writeAdapterUsed: false,
        discographyTracksTouched: false,
        serviceRoleUsed: false,
        actualWrite: false,
        wouldWrite: false,
      },
    });
    return;
  }

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const stale = await checkDiscographyRowStale({
    url,
    anonKey,
    legacyId: selectedRowSnapshot.legacy_id,
    baselineUpdatedAt: selectedRowSnapshot.updated_at,
  });

  const result = executeG15a2DiscographyDryRun({
    beforeSnapshot: selectedRowSnapshot,
    formValues: readDiscographyDryRunFormValues(form),
    optimisticLockStale: stale.staleDetected,
    supabaseUrl: url,
  });

  lastDryRunResult = result;
  renderDryRunResult(result);
}

function wireRowSelection(rows: GosakiDiscographyRecord[]): void {
  const list = document.getElementById("gosaki-disc-item-list");
  if (!list) return;

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const selectButton = target?.closest<HTMLButtonElement>("[data-gosaki-disc-select]");
    if (selectButton) {
      const item = selectButton.closest<HTMLElement>(".gosaki-discography-admin-item");
      if (item) populateEditForm(item, rows);
      return;
    }
  });

  const initial =
    list.querySelector<HTMLElement>(`[data-legacy-id="${G15A2_TARGET_LEGACY_ID}"]`) ??
    list.querySelector<HTMLElement>(".gosaki-discography-admin-item--selected") ??
    list.querySelector<HTMLElement>(".gosaki-discography-admin-item");
  if (initial) populateEditForm(initial, rows);
}

function wireDryRunPreview(): void {
  const button = document.getElementById("gosaki-disc-dry-run-preview-btn");
  button?.addEventListener("click", () => {
    void runDryRunPreview();
  });
}

export function initGosakiStagingDiscographyAdminUi(): void {
  const root = document.getElementById("gosaki-discography-operator");
  if (!root) return;

  const config = getGosakiDiscographyDryRunConfig();
  if (!config.dryRunPreviewEnabled) return;

  const rows = parseRowsFromDom(root);
  wireDisabledActions();
  wireRowSelection(rows);
  wireDryRunPreview();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingDiscographyAdminUi();
  });
}
