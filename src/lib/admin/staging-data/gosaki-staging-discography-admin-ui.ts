/**
 * Gosaki staging shell — Discography admin UI (Supabase read + G-15a2/G-15d/G-16a dry-run + Save slices).
 */

import type { GosakiDiscographyRecord } from "./gosaki-discography-read-types";
import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import { checkDiscographyRowStale } from "../staging-write/staging-discography-optimistic-lock-stale-check";
import { getGosakiDiscographyDryRunConfig } from "../staging-write/gosaki-discography-dry-run-config";
import {
  executeG15a2DiscographyDryRun,
  readDiscographyDryRunFormValues,
  type G15a2DiscographyDryRunResult,
} from "../staging-write/gosaki-discography-existing-release-dry-run";
import {
  executeG15dDiscographyArtistDryRun,
  type G15dDiscographyDryRunResult,
} from "../staging-write/gosaki-discography-existing-release-artist-dry-run";
import {
  executeG16aDiscographyArtistDryRun,
  type G16aDiscographyDryRunResult,
} from "../staging-write/gosaki-discography-g16a-existing-release-artist-dry-run";
import {
  executeG16aDiscographyArtistSave,
  isG16aDiscographySaveOutcomeSuccess,
  type G16aDiscographySaveOutcome,
} from "../staging-write/gosaki-discography-g16a-existing-release-artist-save";
import {
  executeG15bDiscographyPurchaseUrlSave,
  isG15bDiscographySaveOutcomeSuccess,
  type G15bDiscographySaveOutcome,
} from "../staging-write/gosaki-discography-existing-release-save";
import {
  executeG15dDiscographyArtistSave,
  isG15dDiscographySaveOutcomeSuccess,
  type G15dDiscographySaveOutcome,
} from "../staging-write/gosaki-discography-existing-release-artist-save";
import {
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
} from "../staging-write/discography-write-types";
import {
  executeDiscographyScalarSliceDryRun,
  type DiscographyScalarSliceDryRunResult,
} from "../staging-write/discography-scalar-field-dry-run";
import {
  executeDiscographyScalarSliceSave,
  isDiscographyScalarSliceSaveOutcomeSuccess,
  type DiscographyScalarSliceSaveOutcome,
} from "../staging-write/discography-scalar-field-save";
import type { DiscographyUpdateWritePayload } from "../staging-write/discography-write-types";
import {
  evaluateDiscographyScalarSliceOperatorSaveUiGate,
  getDiscographyScalarSliceSaveConfig,
} from "../staging-write/discography-scalar-field-save-config";
import {
  evaluateG17cDiscographyOperatorSaveUiGate,
  getG17cDiscographyLabelSaveConfig,
} from "../staging-write/gosaki-discography-g17c-label-save-config";
import {
  getDiscographyScalarSliceEntryByLegacyId,
  getDiscographyScalarSliceRegistryEntry,
  type DiscographyScalarFieldSliceId,
} from "../staging-write/discography-scalar-field-slice-registry";
import {
  G15A2_DRY_RUN_SLICE_APPROVAL_ID,
  G15A2_TARGET_LEGACY_ID,
} from "../staging-write/gosaki-discography-dry-run-types";
import {
  G16A_DRY_RUN_SLICE_APPROVAL_ID,
  G16A_TARGET_LEGACY_ID,
} from "../staging-write/gosaki-discography-g16a-next-field-types";
import {
  G15D_DRY_RUN_SLICE_APPROVAL_ID,
  G15D_TARGET_LEGACY_ID,
} from "../staging-write/gosaki-discography-next-field-types";
import {
  executeG18fTracklistTextareaDryRun,
  G18F_TARGET_LEGACY_ID,
  G18F_TRACKLIST_DRY_RUN_APPROVAL_ID,
  readDiscographyTracklistTextareaFromForm,
  type G18fTracklistTextareaDryRunResult,
} from "../staging-write/gosaki-discography-g18f-tracklist-textarea-dry-run";
import { getGosakiDiscographyG18fTracklistDryRunConfig } from "../staging-write/gosaki-discography-g18f-tracklist-dry-run-config";

type GosakiDiscographyDryRunResultUnion =
  | G15a2DiscographyDryRunResult
  | G15dDiscographyDryRunResult
  | G16aDiscographyDryRunResult
  | DiscographyScalarSliceDryRunResult
  | G18fTracklistTextareaDryRunResult;

function isG18fTracklistDryRunResult(
  result: GosakiDiscographyDryRunResultUnion,
): result is G18fTracklistTextareaDryRunResult {
  return "albumLegacyId" in result && "diff" in result;
}

type DiscographyWriteSlice = DiscographyScalarFieldSliceId;

let selectedRowSnapshot: GosakiDiscographyRecord | null = null;
let lastDryRunResult: GosakiDiscographyDryRunResultUnion | null = null;
let stagingAuthSignedIn = false;
let saveInFlight = false;

function resolveDiscographyWriteSlice(legacyId: string): DiscographyWriteSlice | null {
  return getDiscographyScalarSliceEntryByLegacyId(legacyId)?.sliceId ?? null;
}

function getSaveConfigForSlice(slice: DiscographyWriteSlice | null) {
  if (!slice) {
    throw new Error("No discography scalar slice for save config.");
  }
  if (slice === "g17c-label") {
    return getG17cDiscographyLabelSaveConfig();
  }
  return getDiscographyScalarSliceSaveConfig(getDiscographyScalarSliceRegistryEntry(slice));
}

function evaluateSaveGateForSlice(
  slice: DiscographyWriteSlice | null,
  input: {
    signedIn: boolean;
    dryRunOk: boolean;
    stale: boolean;
    saveReadiness: string;
  },
) {
  if (!slice) {
    return { enabled: false, reason: "この行には Save スライスがありません。" };
  }
  if (slice === "g17c-label") {
    return evaluateG17cDiscographyOperatorSaveUiGate(input);
  }
  const entry = getDiscographyScalarSliceRegistryEntry(slice);
  return evaluateDiscographyScalarSliceOperatorSaveUiGate(entry, input);
}

function getActiveDryRunApprovalId(slice: DiscographyWriteSlice | null): string {
  if (selectedRowSnapshot?.legacy_id === G18F_TARGET_LEGACY_ID) {
    return G18F_TRACKLIST_DRY_RUN_APPROVAL_ID;
  }
  if (!slice) return "—";
  return getDiscographyScalarSliceRegistryEntry(slice).dryRunApprovalId;
}

function getActiveSaveApprovalId(slice: DiscographyWriteSlice | null): string {
  if (!slice) return "—";
  return getDiscographyScalarSliceRegistryEntry(slice).approvalId;
}

function getActiveTargetLegacyId(slice: DiscographyWriteSlice | null): string {
  if (!slice) return selectedRowSnapshot?.legacy_id ?? "—";
  return getDiscographyScalarSliceRegistryEntry(slice).legacyId;
}

function wireDisabledActions(): void {
  const disabledButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-gosaki-disc-action-disabled]",
  );
  disabledButtons.forEach((button) => {
    if (button.id === "gosaki-disc-update-btn") return;
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
    tracks: (item.dataset.tracks ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((title, index) => ({
        track_number: index + 1,
        title,
        sort_order: index + 1,
      })),
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

  const tracksEl = form.querySelector<HTMLTextAreaElement>('textarea[name="tracks"]');
  if (tracksEl) {
    tracksEl.readOnly = snapshot.legacy_id !== G18F_TARGET_LEGACY_ID;
    tracksEl.rows = snapshot.legacy_id === G18F_TARGET_LEGACY_ID ? 8 : 6;
  }

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
  updateOperatorStatusPanel(null);
  updateSaveButtonState(null);
}

function clearDryRunResult(): void {
  lastDryRunResult = null;
  const el = document.getElementById("gosaki-disc-dry-run-result");
  if (!el) return;
  el.hidden = true;
  el.innerHTML = "";
  updateSaveButtonState(null);
}

function updateOperatorStatusPanel(result: GosakiDiscographyDryRunResultUnion | null): void {
  const slice = resolveDiscographyWriteSlice(selectedRowSnapshot?.legacy_id ?? "");
  const saveConfig = getSaveConfigForSlice(slice);
  const dryRunConfig = getGosakiDiscographyDryRunConfig();

  const setText = (id: string, value: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText("gosaki-disc-status-save", saveConfig.saveEnabled ? "ready_to_save" : "disabled");
  setText(
    "gosaki-disc-status-db-write",
    saveConfig.saveEnabled ? "gated (operator Save only)" : "disabled",
  );
  setText("gosaki-disc-status-dry-run-approval", getActiveDryRunApprovalId(slice));
  setText("gosaki-disc-status-save-approval", getActiveSaveApprovalId(slice));
  setText("gosaki-disc-status-target-legacy-id", getActiveTargetLegacyId(slice));
  setText(
    "gosaki-disc-status-changed-fields",
    result
      ? isG18fTracklistDryRunResult(result)
        ? [
            result.changed.length ? `changed:${result.changed.length}` : "",
            result.added.length ? `added:${result.added.length}` : "",
            result.deleted.length ? `deleted:${result.deleted.length}` : "",
            result.reordered.length ? `reordered:${result.reordered.length}` : "",
          ]
            .filter(Boolean)
            .join(", ") || "—"
        : result.changedFields.join(", ") || "—"
      : "—",
  );
  setText(
    "gosaki-disc-status-payload-keys",
    result
      ? isG18fTracklistDryRunResult(result)
        ? `tracks textarea (${result.afterCount} lines)`
        : result.payloadKeys.join(", ") || "—"
      : "—",
  );
  setText(
    "gosaki-disc-status-expected-updated-at",
    result && isG18fTracklistDryRunResult(result)
      ? "—"
      : result && "expectedBeforeUpdatedAt" in result
        ? (result.expectedBeforeUpdatedAt ?? "—")
        : selectedRowSnapshot?.updated_at ?? "—",
  );
  setText(
    "gosaki-disc-status-stale",
    result
      ? isG18fTracklistDryRunResult(result)
        ? "—"
        : "optimisticLockStale" in result
          ? result.optimisticLockStale
            ? "true"
            : "false"
          : "—"
      : "—",
  );
  setText(
    "gosaki-disc-status-host-gate",
    dryRunConfig.hostGatePassed ? "true" : "false",
  );
  setText("gosaki-disc-status-save-readiness", result?.saveReadiness ?? "—");
}

function updateSaveButtonState(result: GosakiDiscographyDryRunResultUnion | null): void {
  const button = document.getElementById("gosaki-disc-update-btn") as HTMLButtonElement | null;
  if (!button) return;

  if (selectedRowSnapshot?.legacy_id === G18F_TARGET_LEGACY_ID) {
    const g18fConfig = getGosakiDiscographyG18fTracklistDryRunConfig();
    button.disabled = true;
    button.setAttribute("data-gosaki-disc-save-allowed", "false");
    button.textContent = "更新する（G-18f tracklist Save 無効）";
    button.title = g18fConfig.defaultDisabledReason;
    return;
  }

  const slice = resolveDiscographyWriteSlice(selectedRowSnapshot?.legacy_id ?? "");
  const gate = evaluateSaveGateForSlice(slice, {
    signedIn: stagingAuthSignedIn === true,
    dryRunOk: result?.ok === true,
    stale: result?.optimisticLockStale === true,
    saveReadiness: result?.saveReadiness ?? "guard_error",
  });

  button.disabled = !gate.enabled || saveInFlight || slice == null;
  button.setAttribute(
    "data-gosaki-disc-save-allowed",
    gate.enabled && !saveInFlight && slice != null ? "true" : "false",
  );

  if (gate.enabled && !saveInFlight && slice != null) {
    const entry = getDiscographyScalarSliceRegistryEntry(slice);
    button.title = `${entry.field} を保存します（${entry.phaseLabel}）`;
    button.textContent = "更新する";
    return;
  }

  if (!result) {
    button.textContent = "更新する（準備中）";
    button.title = slice == null ? "この行には Save スライスがありません" : gate.reason;
    return;
  }

  if (result.saveReadiness === "ready_but_save_disabled" && result.ok) {
    button.textContent = "更新する（保存無効）";
    button.title = gate.reason;
    return;
  }

  button.textContent = "更新する（保存不可）";
  button.title = gate.reason;
}

function renderDryRunResult(result: GosakiDiscographyDryRunResultUnion): void {
  if (isG18fTracklistDryRunResult(result)) {
    renderTracklistDryRunResult(result);
    return;
  }

  const el = document.getElementById("gosaki-disc-dry-run-result");
  if (!el) return;

  const slice = resolveDiscographyWriteSlice(result.target.legacy_id);
  const saveApprovalId = getActiveSaveApprovalId(slice);
  const saveConfig = getSaveConfigForSlice(slice);

  el.hidden = false;
  el.className = `gosaki-disc-dry-run-result gosaki-disc-dry-run-result--${result.ok ? "ok" : "error"}`;

  const guardHtml =
    result.guardErrors.length > 0
      ? `<ul>${result.guardErrors.map((msg) => `<li>${escapeHtml(msg)}</li>`).join("")}</ul>`
      : "<p>なし</p>";

  el.innerHTML = `
    <h3 class="gosaki-disc-dry-run-result__title">確認結果（dry-run）</h3>
    <p><strong>dryRunApprovalId:</strong> ${escapeHtml(result.approvalId)}</p>
    <p><strong>saveApprovalId:</strong> ${escapeHtml(saveApprovalId)}</p>
    <p><strong>ok:</strong> ${result.ok ? "true" : "false"}</p>
    <p><strong>dryRun:</strong> ${result.dryRun ? "true" : "false"}</p>
    <p><strong>actualWrite:</strong> ${result.safety.actualWrite ? "true" : "false"}</p>
    <p><strong>wouldWrite:</strong> ${result.safety.wouldWrite ? "true" : "false"}</p>
    <p><strong>target legacy_id:</strong> ${escapeHtml(result.target.legacy_id)}</p>
    <p><strong>changedFields:</strong> ${escapeHtml(result.changedFields.join(", ") || "—")}</p>
    <p><strong>payloadKeys:</strong> ${escapeHtml(result.payloadKeys.join(", ") || "—")}</p>
    <p><strong>expectedBeforeUpdatedAt:</strong> ${escapeHtml(result.expectedBeforeUpdatedAt ?? "—")}</p>
    <p><strong>stale:</strong> ${result.optimisticLockStale ? "true" : "false"}</p>
    <p><strong>hostGatePassed:</strong> ${saveConfig.hostGatePassed ? "true" : "false"}</p>
    <p><strong>saveReadiness:</strong> ${escapeHtml(result.saveReadiness)}</p>
    <p><strong>saveAllowed:</strong> ${result.saveAllowed ? "true" : "false"}</p>
    <p><strong>before:</strong> <code>${escapeHtml(JSON.stringify(result.before))}</code></p>
    <p><strong>after:</strong> <code>${escapeHtml(JSON.stringify(result.after))}</code></p>
    <p><strong>payload:</strong> <code>${escapeHtml(JSON.stringify(result.payload))}</code></p>
    <div><strong>guardErrors:</strong> ${guardHtml}</div>
  `;

  updateSaveButtonState(result);
  updateOperatorStatusPanel(result);
}

function renderTracklistDryRunResult(result: G18fTracklistTextareaDryRunResult): void {
  const el = document.getElementById("gosaki-disc-dry-run-result");
  if (!el) return;

  const g18fConfig = getGosakiDiscographyG18fTracklistDryRunConfig();

  el.hidden = false;
  el.className = `gosaki-disc-dry-run-result gosaki-disc-dry-run-result--${result.ok ? "ok" : "error"}`;

  const guardHtml =
    result.guardErrors.length > 0
      ? `<ul>${result.guardErrors.map((msg) => `<li>${escapeHtml(msg)}</li>`).join("")}</ul>`
      : "<p>なし</p>";

  const listOrEmpty = <T,>(items: T[], render: (item: T) => string) =>
    items.length > 0
      ? `<ul>${items.map((item) => `<li>${render(item)}</li>`).join("")}</ul>`
      : "<p>なし</p>";

  el.innerHTML = `
    <h3 class="gosaki-disc-dry-run-result__title">Track List 差分（G-18f dry-run）</h3>
    <p><strong>approvalId:</strong> ${escapeHtml(result.approvalId)}</p>
    <p><strong>ok:</strong> ${result.ok ? "true" : "false"}</p>
    <p><strong>dryRun:</strong> ${result.dryRun ? "true" : "false"}</p>
    <p><strong>actualWrite:</strong> ${result.safety.actualWrite ? "true" : "false"}</p>
    <p><strong>wouldWrite:</strong> ${result.safety.wouldWrite ? "true" : "false"}</p>
    <p><strong>albumLegacyId:</strong> ${escapeHtml(result.albumLegacyId)}</p>
    <p><strong>albumTitle:</strong> ${escapeHtml(result.albumTitle)}</p>
    <p><strong>beforeCount:</strong> ${result.beforeCount}</p>
    <p><strong>afterCount:</strong> ${result.afterCount}</p>
    <p><strong>saveReadiness:</strong> ${escapeHtml(result.saveReadiness)}</p>
    <p><strong>saveAllowed:</strong> false</p>
    <p><strong>hostGatePassed:</strong> ${g18fConfig.hostGatePassed ? "true" : "false"}</p>
    <div><strong>unchanged:</strong> ${listOrEmpty(result.unchanged, (row) => `${row.track_number}. ${escapeHtml(row.title)}`)}</div>
    <div><strong>changed:</strong> ${listOrEmpty(result.changed, (row) => `#${row.track_number}: ${escapeHtml(row.before)} → ${escapeHtml(row.after)}`)}</div>
    <div><strong>added:</strong> ${listOrEmpty(result.added, (row) => `#${row.track_number}: ${escapeHtml(row.title)}`)}</div>
    <div><strong>deleted:</strong> ${listOrEmpty(result.deleted, (row) => `#${row.track_number}: ${escapeHtml(row.title)}`)}</div>
    <div><strong>reordered:</strong> ${listOrEmpty(result.reordered, (row) => `${escapeHtml(row.title)}: ${row.from} → ${row.to}`)}</div>
    <p><strong>previewJson:</strong> <code>${escapeHtml(
      JSON.stringify({
        ok: result.ok,
        dryRun: result.dryRun,
        actualWrite: result.safety.actualWrite,
        albumLegacyId: result.albumLegacyId,
        beforeCount: result.beforeCount,
        afterCount: result.afterCount,
        changed: result.changed,
        added: result.added,
        deleted: result.deleted,
        reordered: result.reordered,
        wouldWrite: result.safety.wouldWrite,
      }),
    )}</code></p>
    <div><strong>guardErrors:</strong> ${guardHtml}</div>
  `;

  updateSaveButtonState(result);
  updateOperatorStatusPanel(result);
}

function renderSaveResult(
  outcome:
    | G15bDiscographySaveOutcome
    | G15dDiscographySaveOutcome
    | G16aDiscographySaveOutcome
    | DiscographyScalarSliceSaveOutcome,
): void {
  const el = document.getElementById("gosaki-disc-save-result");
  if (!el) return;
  el.hidden = false;
  el.className = "gosaki-disc-save-result gosaki-disc-save-result--error";
  const message =
    "errorMessage" in outcome ? outcome.errorMessage : JSON.stringify(outcome);
  el.innerHTML = `
    <h3 class="gosaki-disc-save-result__title">保存結果</h3>
    <p><strong>actualWrite:</strong> false</p>
    <p><strong>error:</strong> ${escapeHtml(String(message))}</p>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function refreshStagingAuthSignedIn(): Promise<boolean> {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    stagingAuthSignedIn = false;
    return false;
  }
  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    stagingAuthSignedIn = isSignedInStagingAuth(auth);
  } catch {
    stagingAuthSignedIn = false;
  }
  updateSaveButtonState(lastDryRunResult);
  return stagingAuthSignedIn;
}

async function runDryRunPreview(): Promise<void> {
  const form = document.getElementById("gosaki-disc-edit-form");
  if (!form || !(form instanceof HTMLFormElement)) return;

  await refreshStagingAuthSignedIn();

  if (!selectedRowSnapshot) {
    const empty: G15dDiscographyDryRunResult = {
      ok: false,
      dryRun: true,
      phase: "G-15d-gosaki-discography-existing-release-artist-non-dry-run",
      approvalId: G15D_DRY_RUN_SLICE_APPROVAL_ID,
      target: {
        id: "",
        legacy_id: G15D_TARGET_LEGACY_ID,
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
    };
    lastDryRunResult = empty;
    renderDryRunResult(empty);
    return;
  }

  if (selectedRowSnapshot.legacy_id === G18F_TARGET_LEGACY_ID) {
    const result = executeG18fTracklistTextareaDryRun({
      beforeSnapshot: selectedRowSnapshot,
      tracksTextarea: readDiscographyTracklistTextareaFromForm(form),
    });
    lastDryRunResult = result;
    renderDryRunResult(result);
    return;
  }

  const slice = resolveDiscographyWriteSlice(selectedRowSnapshot.legacy_id);
  if (slice == null) {
    const empty: G15dDiscographyDryRunResult = {
      ok: false,
      dryRun: true,
      phase: "G-15d-gosaki-discography-existing-release-artist-non-dry-run",
      approvalId: G15D_DRY_RUN_SLICE_APPROVAL_ID,
      target: {
        id: selectedRowSnapshot.id,
        legacy_id: selectedRowSnapshot.legacy_id,
        title: selectedRowSnapshot.title,
        site_slug: "gosaki-piano",
      },
      changedFields: [],
      payloadKeys: [],
      before: {},
      after: {},
      payload: {},
      expectedBeforeUpdatedAt: selectedRowSnapshot.updated_at,
      optimisticLockStale: false,
      guardErrors: [`No dry-run slice for legacy_id ${selectedRowSnapshot.legacy_id}.`],
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
    };
    lastDryRunResult = empty;
    renderDryRunResult(empty);
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

  const formValues = readDiscographyDryRunFormValues(form);
  const entry = slice ? getDiscographyScalarSliceRegistryEntry(slice) : null;
  const result =
    entry?.sliceId === "g17c-label"
      ? executeDiscographyScalarSliceDryRun({
          entry,
          beforeSnapshot: selectedRowSnapshot,
          formValues,
          optimisticLockStale: stale.staleDetected,
          supabaseUrl: url,
        })
      : slice === "g16a"
        ? executeG16aDiscographyArtistDryRun({
            beforeSnapshot: selectedRowSnapshot,
            formValues,
            optimisticLockStale: stale.staleDetected,
            supabaseUrl: url,
          })
        : slice === "g15d"
          ? executeG15dDiscographyArtistDryRun({
              beforeSnapshot: selectedRowSnapshot,
              formValues,
              optimisticLockStale: stale.staleDetected,
              supabaseUrl: url,
            })
          : executeG15a2DiscographyDryRun({
              beforeSnapshot: selectedRowSnapshot,
              formValues,
              optimisticLockStale: stale.staleDetected,
              supabaseUrl: url,
            });

  lastDryRunResult = result;
  renderDryRunResult(result);
}

async function runSave(): Promise<void> {
  if (selectedRowSnapshot?.legacy_id === G18F_TARGET_LEGACY_ID) {
    window.alert(getGosakiDiscographyG18fTracklistDryRunConfig().defaultDisabledReason);
    return;
  }

  const slice = resolveDiscographyWriteSlice(selectedRowSnapshot?.legacy_id ?? "");
  if (slice == null) {
    window.alert("この行には Save スライスがありません。");
    return;
  }

  const config = getSaveConfigForSlice(slice);

  if (!config.saveEnabled) {
    window.alert(config.armFailureReason ?? config.defaultDisabledReason);
    return;
  }

  if (!selectedRowSnapshot || !lastDryRunResult?.ok) {
    window.alert("先に「変更を確認」で dry-run を成功させてください。");
    return;
  }

  const gate = evaluateSaveGateForSlice(slice, {
    signedIn: stagingAuthSignedIn === true,
    dryRunOk: lastDryRunResult.ok,
    stale: lastDryRunResult.optimisticLockStale,
    saveReadiness: lastDryRunResult.saveReadiness,
  });

  if (!gate.enabled) {
    window.alert(gate.reason);
    return;
  }

  const entry = getDiscographyScalarSliceRegistryEntry(slice);
  const confirmMessage =
    slice === "g17c-label"
      ? `${entry.field} を更新します。よろしいですか？（${entry.legacyId} の 1 行のみ）`
      : slice === "g16a"
        ? "artist を更新します。よろしいですか？（discography-001 の 1 行のみ）"
        : slice === "g15d"
          ? "artist を更新します。よろしいですか？（discography-003 の 1 行のみ）"
          : "purchase_url を更新します。よろしいですか？（discography-002 の 1 行のみ）";

  if (!window.confirm(confirmMessage)) {
    return;
  }

  saveInFlight = true;
  updateSaveButtonState(lastDryRunResult);

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const saveBinding = {
    changedFields: [...lastDryRunResult.changedFields],
    payloadKeys: [...lastDryRunResult.payloadKeys],
    expectedBeforeUpdatedAt: lastDryRunResult.expectedBeforeUpdatedAt,
    dryRunOk: lastDryRunResult.ok,
  };

  if (slice === "g17c-label") {
    const registryEntry = getDiscographyScalarSliceRegistryEntry(slice);
    const payload = lastDryRunResult.payload as DiscographyUpdateWritePayload;
    const outcome = await executeDiscographyScalarSliceSave({
      entry: registryEntry,
      url,
      anonKey,
      beforeSnapshot: selectedRowSnapshot,
      saveBinding,
      payload,
    });

    saveInFlight = false;

    if (isDiscographyScalarSliceSaveOutcomeSuccess(outcome)) {
      selectedRowSnapshot = outcome.afterSnapshot;
      const updatedAtEl = document.getElementById("gosaki-disc-form-updated-at");
      if (updatedAtEl) updatedAtEl.textContent = outcome.afterSnapshot.updated_at ?? "—";
      lastDryRunResult = null;
      clearDryRunResult();
      window.alert("保存しました。");
      return;
    }

    renderSaveResult(outcome);
    updateSaveButtonState(lastDryRunResult);
    return;
  }

  if (slice === "g16a") {
    const outcome = await executeG16aDiscographyArtistSave({
      url,
      anonKey,
      beforeSnapshot: selectedRowSnapshot,
      saveBinding,
    });

    saveInFlight = false;

    if (isG16aDiscographySaveOutcomeSuccess(outcome)) {
      selectedRowSnapshot = outcome.afterSnapshot;
      const updatedAtEl = document.getElementById("gosaki-disc-form-updated-at");
      if (updatedAtEl) updatedAtEl.textContent = outcome.afterSnapshot.updated_at ?? "—";
      lastDryRunResult = null;
      clearDryRunResult();
      window.alert("保存しました。");
      return;
    }

    renderSaveResult(outcome);
    updateSaveButtonState(lastDryRunResult);
    return;
  }

  if (slice === "g15d") {
    const outcome = await executeG15dDiscographyArtistSave({
      url,
      anonKey,
      beforeSnapshot: selectedRowSnapshot,
      saveBinding,
    });

    saveInFlight = false;

    if (isG15dDiscographySaveOutcomeSuccess(outcome)) {
      selectedRowSnapshot = outcome.afterSnapshot;
      const updatedAtEl = document.getElementById("gosaki-disc-form-updated-at");
      if (updatedAtEl) updatedAtEl.textContent = outcome.afterSnapshot.updated_at ?? "—";
      lastDryRunResult = null;
      clearDryRunResult();
      window.alert("保存しました。");
      return;
    }

    renderSaveResult(outcome);
    updateSaveButtonState(lastDryRunResult);
    return;
  }

  const outcome = await executeG15bDiscographyPurchaseUrlSave({
    url,
    anonKey,
    beforeSnapshot: selectedRowSnapshot,
    saveBinding,
  });

  saveInFlight = false;

  if (isG15bDiscographySaveOutcomeSuccess(outcome)) {
    selectedRowSnapshot = outcome.afterSnapshot;
    const updatedAtEl = document.getElementById("gosaki-disc-form-updated-at");
    if (updatedAtEl) updatedAtEl.textContent = outcome.afterSnapshot.updated_at ?? "—";
    lastDryRunResult = null;
    clearDryRunResult();
    window.alert("保存しました。");
    return;
  }

  renderSaveResult(outcome);
  updateSaveButtonState(lastDryRunResult);
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
    }
  });

  const initial =
    list.querySelector<HTMLElement>(`[data-legacy-id="${G18F_TARGET_LEGACY_ID}"]`) ??
    list.querySelector<HTMLElement>(`[data-legacy-id="${G16A_TARGET_LEGACY_ID}"]`) ??
    list.querySelector<HTMLElement>(".gosaki-discography-admin-item--selected") ??
    list.querySelector<HTMLElement>(".gosaki-discography-admin-item");
  if (initial) populateEditForm(initial, rows);
}

function wireDryRunPreview(): void {
  document
    .getElementById("gosaki-disc-dry-run-preview-btn")
    ?.addEventListener("click", () => {
      void runDryRunPreview();
    });
}

function wireSaveButton(): void {
  document.getElementById("gosaki-disc-update-btn")?.addEventListener("click", () => {
    void runSave();
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
  wireSaveButton();
  void refreshStagingAuthSignedIn();
  updateOperatorStatusPanel(null);
  updateSaveButtonState(null);
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingDiscographyAdminUi();
  });
}
