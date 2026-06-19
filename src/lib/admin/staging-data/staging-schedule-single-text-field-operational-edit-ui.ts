/**
 * G-9g4a2 — single-text-field operational edit UI (staging shell only).
 * Parameterized by registry fieldName — separate from G-9g3g general operational Save path.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  buildSiteSlugScheduleEditDryRunError,
  buildSiteSlugScheduleEditDryRunResult,
  sanitizeSiteSlugEditSafeFieldPatch,
} from "./staging-schedule-site-slug-edit-dry-run";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import { isPocAuditScheduleRow } from "./staging-schedule-site-slug-row-picker-utils";
import {
  G9G3F3C_PREVIEW_STALE_MSG,
  G9G3H1_FRESH_PREVIEW_REQUIRED_MSG,
  G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG,
  G9G3H1_PREVIEW_CONSUMED_MSG,
  G9G3H1_ROUTINE_DEV_SAFETY_HINT,
  G9G3H1_SAVE_SUCCESS_BLOCKED_MSG,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
  type SiteSlugEditSafeField,
} from "./staging-schedule-site-slug-config";
import { hasPickerBoundRow } from "./staging-schedule-site-slug-edit-picker-binding";
import {
  buildOperationalPreviewIdentity,
  isOperationalSaveReclickBlocked,
  type OperationalSaveSuccessRecord,
} from "./staging-schedule-site-slug-operational-save-reclick";
import { getSingleTextFieldOperationalConfig } from "./staging-schedule-single-text-field-operational-config";
import {
  SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY,
  getSingleTextFieldOperationalRegistryEntry,
  type SingleTextFieldOperationalFieldName,
} from "./staging-schedule-single-text-field-operational-registry";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import { buildSingleTextFieldPayload } from "../staging-write/schedule-write-guards";
import { executeSingleTextFieldOperationalNonDryRunSave } from "../staging-write/staging-schedule-single-text-field-operational-save";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import type { ScheduleWriteResult } from "../staging-write/schedule-write-types";

type FieldOperationalState = {
  previewValid: boolean;
  fieldValues: Record<string, string>;
  previewTargetId: string | null;
  previewTargetLegacyId: string | null;
  previewExpectedUpdatedAt: string | null;
  previewHostGatePassed: boolean;
  previewStale: boolean;
  previewIdentity: string | null;
  saveSuccess: OperationalSaveSuccessRecord | null;
  executionInFlight: boolean;
};

const ARMED_DATASET_KEYS: Record<
  SingleTextFieldOperationalFieldName,
  "g9g4a2aArmed" | "g9g4a2bArmed" | "g9g4a2cArmed"
> = {
  open_time: "g9g4a2aArmed",
  start_time: "g9g4a2bArmed",
  price: "g9g4a2cArmed",
};

const FIELD_INPUT_IDS: Record<SingleTextFieldOperationalFieldName, string> = {
  open_time: "site-slug-edit-dry-run-open-time",
  start_time: "site-slug-edit-dry-run-start-time",
  price: "site-slug-edit-dry-run-price",
};

const FIELD_LOADED_IDS: Record<SingleTextFieldOperationalFieldName, string> = {
  open_time: "site-slug-edit-loaded-open-time",
  start_time: "site-slug-edit-loaded-start-time",
  price: "site-slug-edit-loaded-price",
};

const SAFE_FIELD_INPUT_IDS: Record<SiteSlugEditSafeField, string> = {
  title: "site-slug-edit-dry-run-title",
  venue: "site-slug-edit-dry-run-venue",
  open_time: "site-slug-edit-dry-run-open-time",
  start_time: "site-slug-edit-dry-run-start-time",
  price: "site-slug-edit-dry-run-price",
  description: "site-slug-edit-dry-run-description",
};

const fieldStates = new Map<SingleTextFieldOperationalFieldName, FieldOperationalState>();
const initializedFields = new Set<SingleTextFieldOperationalFieldName>();
let stagingAuthSignedIn: boolean | null = null;
let authRefreshPromise: Promise<boolean> | null = null;

function createEmptyFieldState(): FieldOperationalState {
  return {
    previewValid: false,
    fieldValues: {},
    previewTargetId: null,
    previewTargetLegacyId: null,
    previewExpectedUpdatedAt: null,
    previewHostGatePassed: false,
    previewStale: false,
    previewIdentity: null,
    saveSuccess: null,
    executionInFlight: false,
  };
}

function getFieldState(fieldName: SingleTextFieldOperationalFieldName): FieldOperationalState {
  let state = fieldStates.get(fieldName);
  if (!state) {
    state = createEmptyFieldState();
    fieldStates.set(fieldName, state);
  }
  return state;
}

function getSliceLabel(fieldName: SingleTextFieldOperationalFieldName): string {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  return `${entry.phasePrefix} ${entry.reclickMode}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRoot(): HTMLElement | null {
  return document.getElementById("admin-staging-schedule-site-slug-edit");
}

export function isSingleTextFieldOperationalArmed(
  fieldName: SingleTextFieldOperationalFieldName,
): boolean {
  return getRoot()?.dataset[ARMED_DATASET_KEYS[fieldName]] === "true";
}

export function isAnySingleTextFieldOperationalArmed(): boolean {
  return SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY.some((entry) =>
    isSingleTextFieldOperationalArmed(entry.fieldName),
  );
}

function isPickerDrivenBinding(): boolean {
  return getRoot()?.dataset.pickerDrivenBinding === "true";
}

function parseTargetRow(): ScheduleRecord | null {
  const root = getRoot();
  if (!root) return null;
  const raw = root.dataset.targetRow;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScheduleRecord;
  } catch {
    return null;
  }
}

function getFieldCandidate(fieldName: SingleTextFieldOperationalFieldName): string {
  const el = document.getElementById(FIELD_INPUT_IDS[fieldName]);
  if (el instanceof HTMLInputElement) return el.value;
  return "";
}

function getSafeFieldValue(field: SiteSlugEditSafeField): string {
  const el = document.getElementById(SAFE_FIELD_INPUT_IDS[field]);
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return "";
}

function nonTargetFieldsUnchanged(
  row: ScheduleRecord,
  targetFieldName: SingleTextFieldOperationalFieldName,
): boolean {
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    if (field === targetFieldName) continue;
    const current = getSafeFieldValue(field);
    const baseline = row[field] ?? "";
    if (current !== baseline) return false;
  }
  return true;
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
  if (!root || root.dataset.source !== "supabase") return false;
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

function getClientHostGate() {
  const { url } = getSupabaseEnv();
  return evaluateSupabaseHostGate(url);
}

function isPreviewResultStale(
  fieldName: SingleTextFieldOperationalFieldName,
  previewResultId: string,
): boolean {
  const state = getFieldState(fieldName);
  const resultEl = document.getElementById(previewResultId);
  return (
    state.previewStale ||
    Boolean(resultEl?.classList.contains("site-slug-edit-dry-run-result--stale"))
  );
}

function computePreviewIdentity(fieldName: SingleTextFieldOperationalFieldName): string | null {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const state = getFieldState(fieldName);
  if (!state.previewTargetId) return null;
  return buildOperationalPreviewIdentity({
    mode: entry.reclickMode,
    approvalId: entry.approvalId,
    targetId: state.previewTargetId,
    legacyId: state.previewTargetLegacyId,
    expectedBeforeUpdatedAt: state.previewExpectedUpdatedAt,
    changedFields: [entry.fieldName],
    fieldValues: { ...state.fieldValues },
  });
}

function checkSaveReclickGate(fieldName: SingleTextFieldOperationalFieldName): {
  blocked: boolean;
  reason: string;
} {
  const state = getFieldState(fieldName);
  if (!state.saveSuccess) {
    return { blocked: false, reason: "" };
  }
  if (!state.previewValid) {
    return { blocked: true, reason: G9G3H1_SAVE_SUCCESS_BLOCKED_MSG };
  }
  if (isOperationalSaveReclickBlocked(state.saveSuccess, state.previewIdentity)) {
    return { blocked: true, reason: G9G3H1_PREVIEW_CONSUMED_MSG };
  }
  return { blocked: false, reason: "" };
}

export function invalidateSingleTextFieldOperationalPreview(
  fieldName: SingleTextFieldOperationalFieldName,
): void {
  fieldStates.set(fieldName, createEmptyFieldState());
  refreshSingleTextFieldOperationalSaveButtonState(fieldName);
  refreshSingleTextFieldOperationalSaveGatePanel(fieldName);
}

export function invalidateAllSingleTextFieldOperationalPreviews(): void {
  for (const entry of SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY) {
    invalidateSingleTextFieldOperationalPreview(entry.fieldName);
  }
}

export function markSingleTextFieldOperationalPreviewStale(
  fieldName: SingleTextFieldOperationalFieldName,
  reason?: string,
): void {
  invalidateSingleTextFieldOperationalPreview(fieldName);
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const el = document.getElementById(config.previewResultId);
  if (!el) return;
  const message = reason?.trim() ? reason : G9G3F3C_PREVIEW_STALE_MSG;
  const hasResult = el.querySelector(".site-slug-edit-dry-run-result__meta");
  if (hasResult) {
    el.classList.add("site-slug-edit-dry-run-result--stale");
    let banner = el.querySelector(
      ".site-slug-edit-dry-run-result__preview-stale",
    ) as HTMLElement | null;
    if (!banner) {
      banner = document.createElement("p");
      banner.className =
        "site-slug-edit-dry-run-result__preview-stale site-slug-edit-dry-run-result__stale";
      banner.setAttribute("role", "alert");
      el.prepend(banner);
    }
    banner.innerHTML = `<strong>${escapeHtml(G9G3F3C_PREVIEW_STALE_MSG)}</strong>${message !== G9G3F3C_PREVIEW_STALE_MSG ? ` — ${escapeHtml(message)}` : ""}`;
  } else {
    el.innerHTML = `<p class="site-slug-edit-dry-run-result__placeholder site-slug-edit-dry-run-result__stale" role="status">${escapeHtml(message)}</p>`;
  }
  refreshSingleTextFieldOperationalSaveButtonState(fieldName);
  refreshSingleTextFieldOperationalSaveGatePanel(fieldName);
}

function renderChangedFieldChips(fields: string[]): string {
  if (fields.length === 0) {
    return '<span class="site-slug-edit-dry-run-result__chip site-slug-edit-dry-run-result__chip--empty">none</span>';
  }
  return fields
    .map(
      (field) =>
        `<span class="site-slug-edit-dry-run-result__chip">${escapeHtml(field)}</span>`,
    )
    .join("");
}

function renderDryRunResult(
  fieldName: SingleTextFieldOperationalFieldName,
  result: ReturnType<typeof buildSiteSlugScheduleEditDryRunResult>,
): void {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const sliceLabel = getSliceLabel(fieldName);
  const el = document.getElementById(config.previewResultId);
  if (!el) return;

  el.classList.remove("site-slug-edit-dry-run-result--stale");
  el.querySelector(".site-slug-edit-dry-run-result__preview-stale")?.remove();

  const hostFailBanner = !result.hostGate.hostGatePassed
    ? `<p class="site-slug-edit-dry-run-result__host-fail" role="alert"><strong>Host gate failed.</strong> ${escapeHtml(result.hostGate.warningMessage ?? "Save path blocked.")}</p>`
    : "";

  const staleBanner = result.optimisticLock.stale
    ? `<p class="site-slug-edit-dry-run-result__stale" role="alert"><strong>STOP — stale optimistic lock.</strong> expectedBeforeUpdatedAt=${escapeHtml(result.optimisticLock.expectedBeforeUpdatedAt ?? "—")} currentUpdatedAt=${escapeHtml(result.optimisticLock.currentUpdatedAt ?? "—")}. Re-run Preview after reload.</p>`
    : "";

  const payloadPreview =
    result.changedFields.length > 0
      ? { [fieldName]: result.after[fieldName] }
      : {};

  el.innerHTML = [
    `<p class="site-slug-edit-dry-run-result__slice-label"><strong>${escapeHtml(sliceLabel)}</strong></p>`,
    hostFailBanner,
    staleBanner,
    `<p class="site-slug-edit-dry-run-result__message">${escapeHtml(result.message)}</p>`,
    `<div class="site-slug-edit-dry-run-result__chips"><span class="site-slug-edit-dry-run-result__chips-label">changedFields:</span> ${renderChangedFieldChips(result.changedFields)}</div>`,
    `<dl class="site-slug-edit-dry-run-result__meta">`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(entry.fieldName)}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(entry.approvalId)}</code></dd></div>`,
    `<div><dt>optimisticLock.stale</dt><dd>${result.optimisticLock.stale ? "true" : "false"}</dd></div>`,
    `<div><dt>hostGatePassed</dt><dd>${result.hostGate.hostGatePassed ? "true" : "false"}</dd></div>`,
    `<div><dt>serviceRoleUsed</dt><dd>false</dd></div>`,
    `<div><dt>productionBlocked</dt><dd>true</dd></div>`,
    `</dl>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">payload to write (${escapeHtml(entry.fieldName)} only)</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block site-slug-edit-dry-run-result__block--payload">${escapeHtml(JSON.stringify(payloadPreview, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">before</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.before, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">after</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.after, null, 2))}</pre>`,
  ].join("");
}

export function canEnableSingleTextFieldOperationalSave(
  fieldName: SingleTextFieldOperationalFieldName,
): { ok: boolean; reason: string } {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const state = getFieldState(fieldName);
  const sliceLabel = getSliceLabel(fieldName);

  if (!isPickerDrivenBinding()) {
    return { ok: false, reason: `Picker-driven binding required for ${sliceLabel} Save` };
  }
  if (!isSingleTextFieldOperationalArmed(fieldName)) {
    return {
      ok: false,
      reason: config.defaultDisabledReason,
    };
  }
  if (getRoot()?.dataset.g9g4a1Armed === "true") {
    return {
      ok: false,
      reason: `G-9g4a1 venue-only arm on — ${sliceLabel} Save blocked`,
    };
  }

  const hostGate = getClientHostGate();

  if (!hostGate.hostGatePassed) {
    return {
      ok: false,
      reason: hostGate.warningMessage ?? "Supabase host gate failed",
    };
  }
  if (!config.saveEnabled) {
    return {
      ok: false,
      reason: config.armFailureReason ?? config.defaultDisabledReason,
    };
  }
  if (state.executionInFlight) return { ok: false, reason: "Save in flight" };

  const reclickGate = checkSaveReclickGate(fieldName);
  if (reclickGate.blocked) return { ok: false, reason: reclickGate.reason };

  if (!hasPickerBoundRow()) {
    return { ok: false, reason: "Select a non-PoC content row in the picker" };
  }
  if (!state.previewValid) {
    return { ok: false, reason: `Latest ${sliceLabel} Preview required` };
  }
  if (isPreviewResultStale(fieldName, config.previewResultId)) {
    return { ok: false, reason: G9G3F3C_PREVIEW_STALE_MSG };
  }
  if (stagingAuthSignedIn === false) {
    return { ok: false, reason: "Sign in as staging admin before Save" };
  }
  if (stagingAuthSignedIn === null) {
    return { ok: false, reason: "Checking auth session…" };
  }

  const row = parseTargetRow();
  if (!row) {
    return { ok: false, reason: "No selected row loaded" };
  }
  if (isPocAuditScheduleRow(row)) {
    return { ok: false, reason: "PoC audit row cannot be saved" };
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { ok: false, reason: "site_slug mismatch" };
  }
  if (state.previewTargetId && row.id !== state.previewTargetId) {
    return { ok: false, reason: "Selected row id does not match preview target" };
  }
  if (!state.previewHostGatePassed) {
    return { ok: false, reason: "Preview hostGatePassed was false" };
  }
  if (state.previewStale) {
    return { ok: false, reason: "Optimistic lock stale at preview — re-run Preview" };
  }
  if (
    state.previewExpectedUpdatedAt != null &&
    row.updated_at !== state.previewExpectedUpdatedAt
  ) {
    return {
      ok: false,
      reason: "Row updated_at changed since preview — re-run Preview",
    };
  }

  const candidate = getFieldCandidate(fieldName);
  if (candidate.trim() === "") {
    return { ok: false, reason: `${entry.fieldName} cannot be empty` };
  }
  if (candidate !== (state.fieldValues[entry.fieldName] ?? "")) {
    return { ok: false, reason: `${entry.fieldName} changed since preview` };
  }
  if (!nonTargetFieldsUnchanged(row, fieldName)) {
    return { ok: false, reason: `Non-${entry.fieldName} fields modified since load` };
  }
  if (!canUseLiveSupabase()) {
    return { ok: false, reason: "Supabase read source required" };
  }

  return { ok: true, reason: "Ready (operator manual only — not auto-clicked)" };
}

export function refreshSingleTextFieldOperationalSaveButtonState(
  fieldName: SingleTextFieldOperationalFieldName,
): void {
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const sliceLabel = getSliceLabel(fieldName);
  const btn = document.getElementById(config.saveBtnId);
  if (!(btn instanceof HTMLButtonElement)) return;
  const { ok, reason } = canEnableSingleTextFieldOperationalSave(fieldName);
  btn.disabled = !ok;
  btn.title = ok
    ? `${sliceLabel} Save — operator manual only`
    : `${sliceLabel} Save disabled — ${reason}`;
}

export function refreshSingleTextFieldOperationalSaveGatePanel(
  fieldName: SingleTextFieldOperationalFieldName,
): void {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const state = getFieldState(fieldName);
  const sliceLabel = getSliceLabel(fieldName);
  const el = document.getElementById(config.saveGatePanelId);
  if (!el) return;

  const hostGate = getClientHostGate();
  const saveGate = canEnableSingleTextFieldOperationalSave(fieldName);
  const lines: string[] = [
    sliceLabel,
    `changedFields: ${entry.fieldName}`,
    `approvalId: ${entry.approvalId}`,
    `env arm: ${entry.envArm}=${isSingleTextFieldOperationalArmed(fieldName) ? "true" : "false"}`,
    `hostGatePassed: ${hostGate.hostGatePassed ? "true" : "false"}`,
    `optimisticLock.stale: ${state.previewStale ? "true" : "false"}`,
    state.previewValid
      ? isPreviewResultStale(fieldName, config.previewResultId)
        ? `preview: ${G9G3F3C_PREVIEW_STALE_MSG}`
        : state.saveSuccess &&
            isOperationalSaveReclickBlocked(state.saveSuccess, state.previewIdentity)
          ? `preview: ${G9G3H1_PREVIEW_CONSUMED_MSG}`
          : "preview: valid"
      : `preview: ${G9G3H1_FRESH_PREVIEW_REQUIRED_MSG}`,
    saveGate.ok
      ? "Save: enabled — operator manual only"
      : `Save: disabled — ${saveGate.reason}`,
    G9G3H1_ROUTINE_DEV_SAFETY_HINT,
  ];

  if (state.saveSuccess) {
    lines.push(G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG);
    lines.push(
      `re-click: blocked — Save completed once (rowsAffected=${state.saveSuccess.rowsAffected})`,
    );
  }

  if (!config.saveEnabled) {
    lines.push(config.armFailureReason ?? config.defaultDisabledReason);
  }

  el.textContent = lines.join(" | ");
}

function refreshPreviewButtonState(fieldName: SingleTextFieldOperationalFieldName): void {
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const sliceLabel = getSliceLabel(fieldName);
  const btn = document.getElementById(config.previewBtnId);
  if (!(btn instanceof HTMLButtonElement)) return;
  const rowBound = hasPickerBoundRow() && parseTargetRow() != null;
  btn.disabled = !rowBound;
  btn.title = rowBound
    ? `${sliceLabel} dry-run Preview — changedFields=${entry.fieldName} only; actualWrite=false`
    : "Select a row in the picker above first";
}

function renderSaveResult(
  fieldName: SingleTextFieldOperationalFieldName,
  payload: {
    actualWrite: boolean;
    outcome: Awaited<ReturnType<typeof executeSingleTextFieldOperationalNonDryRunSave>>;
    changedFields: string[];
    beforeSnapshot: ScheduleRecord;
    payloadWritten: Record<string, unknown>;
  },
): void {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const config = getSingleTextFieldOperationalConfig(fieldName);
  const sliceLabel = getSliceLabel(fieldName);
  const el = document.getElementById(config.saveResultId);
  if (!el) return;

  const result = payload.outcome.result;
  const success = result && "actualWrite" in result && result.actualWrite === true;
  const safety = result && "safety" in result ? result.safety : null;

  el.innerHTML = [
    `<p class="site-slug-edit-save-result__slice-label"><strong>${escapeHtml(sliceLabel)}</strong></p>`,
    `<p class="site-slug-edit-save-result__message">${escapeHtml(
      success
        ? `${sliceLabel} Save completed — actualWrite=true.`
        : payload.outcome.errorMessage ?? `${sliceLabel} Save did not complete.`,
    )}</p>`,
    success
      ? `<p class="site-slug-edit-save-result__reclick" role="status"><strong>${escapeHtml(G9G3H1_SAVE_SUCCESS_BLOCKED_MSG)}</strong></p>`
      : "",
    `<dl class="site-slug-edit-save-result__meta">`,
    `<div><dt>actualWrite</dt><dd>${payload.actualWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(entry.approvalId)}</code></dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(entry.fieldName)}</dd></div>`,
    `<div><dt>serviceRoleUsed</dt><dd>${safety?.serviceRoleUsed === false ? "false" : "false"}</dd></div>`,
    `<div><dt>productionBlocked</dt><dd>true</dd></div>`,
    `</dl>`,
    `<h4 class="site-slug-edit-save-result__subhead">full outcome</h4>`,
    `<pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify(payload.outcome, null, 2))}</pre>`,
  ].join("");
}

async function refreshStagingAuthSignedIn(): Promise<boolean> {
  const { url, anonKey } = getSupabaseEnv();
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
  return stagingAuthSignedIn ?? false;
}

function ensureStagingAuthRefreshed(): Promise<boolean> {
  if (!authRefreshPromise) {
    authRefreshPromise = refreshStagingAuthSignedIn();
  }
  return authRefreshPromise;
}

async function onPreviewClick(fieldName: SingleTextFieldOperationalFieldName): Promise<void> {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const state = getFieldState(fieldName);
  const sliceLabel = getSliceLabel(fieldName);
  const row = parseTargetRow();
  const hostGate = getClientHostGate();
  const hostGatePreview = {
    activeHost: hostGate.activeHost,
    expectedHost: hostGate.expectedHost,
    hostGatePassed: hostGate.hostGatePassed,
    isKnownProductionHost: hostGate.isKnownProductionHost,
    warningMessage: hostGate.warningMessage,
  };

  if (!row) {
    renderDryRunResult(
      fieldName,
      buildSiteSlugScheduleEditDryRunError({
        phase: entry.phase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "No row selected — select a row in the picker above.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateSingleTextFieldOperationalPreview(fieldName);
    return;
  }

  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    renderDryRunResult(
      fieldName,
      buildSiteSlugScheduleEditDryRunError({
        phase: entry.phase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: `site_slug mismatch — ${sliceLabel} preview blocked.`,
        hostGate: hostGatePreview,
      }),
    );
    invalidateSingleTextFieldOperationalPreview(fieldName);
    return;
  }

  if (isPocAuditScheduleRow(row)) {
    renderDryRunResult(
      fieldName,
      buildSiteSlugScheduleEditDryRunError({
        phase: entry.phase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: `PoC audit row — ${sliceLabel} preview blocked.`,
        hostGate: hostGatePreview,
      }),
    );
    invalidateSingleTextFieldOperationalPreview(fieldName);
    return;
  }

  if (!nonTargetFieldsUnchanged(row, fieldName)) {
    renderDryRunResult(
      fieldName,
      buildSiteSlugScheduleEditDryRunError({
        phase: entry.phase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: `${sliceLabel} requires non-${entry.fieldName} fields unchanged — revert other edits.`,
        hostGate: hostGatePreview,
      }),
    );
    invalidateSingleTextFieldOperationalPreview(fieldName);
    return;
  }

  const candidate = getFieldCandidate(fieldName);
  if (candidate.trim() === "") {
    renderDryRunResult(
      fieldName,
      buildSiteSlugScheduleEditDryRunError({
        phase: entry.phase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: `${entry.fieldName} cannot be empty for ${sliceLabel} preview.`,
        hostGate: hostGatePreview,
      }),
    );
    invalidateSingleTextFieldOperationalPreview(fieldName);
    return;
  }

  const patch = sanitizeSiteSlugEditSafeFieldPatch({ [fieldName]: candidate });
  const live = canUseLiveSupabase() && hostGate.hostGatePassed;
  const { url, anonKey } = getSupabaseEnv();

  const optimisticLock = await runDryRunStaleCheck({
    url,
    anonKey,
    scheduleId: row.id,
    baselineUpdatedAt: row.updated_at ?? null,
    liveSupabaseRead: live,
  });

  const result = buildSiteSlugScheduleEditDryRunResult({
    phase: entry.phase,
    source: row,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    patch,
    optimisticLock,
    hostGate: hostGatePreview,
  });

  if (result.changedFields.length !== 1 || result.changedFields[0] !== entry.fieldName) {
    renderDryRunResult(
      fieldName,
      buildSiteSlugScheduleEditDryRunError({
        phase: entry.phase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: `${entry.phasePrefix} changedFields must be ${entry.fieldName} only — got: ${result.changedFields.join(", ") || "none"}.`,
        hostGate: hostGatePreview,
      }),
    );
    invalidateSingleTextFieldOperationalPreview(fieldName);
    return;
  }

  renderDryRunResult(fieldName, result);

  state.previewValid = true;
  state.fieldValues = { [entry.fieldName]: candidate };
  state.previewTargetId = result.target.id;
  state.previewTargetLegacyId = result.target.legacy_id ?? null;
  state.previewExpectedUpdatedAt = result.optimisticLock.expectedBeforeUpdatedAt ?? null;
  state.previewHostGatePassed = result.hostGate.hostGatePassed;
  state.previewStale = result.optimisticLock.stale;
  state.previewIdentity = computePreviewIdentity(fieldName);
  state.saveSuccess = null;

  refreshSingleTextFieldOperationalSaveButtonState(fieldName);
  refreshSingleTextFieldOperationalSaveGatePanel(fieldName);
}

async function onSaveClick(fieldName: SingleTextFieldOperationalFieldName): Promise<void> {
  const entry = getSingleTextFieldOperationalRegistryEntry(fieldName);
  const state = getFieldState(fieldName);
  const gate = canEnableSingleTextFieldOperationalSave(fieldName);
  if (!gate.ok) {
    refreshSingleTextFieldOperationalSaveButtonState(fieldName);
    return;
  }

  const row = parseTargetRow();
  if (!row || isPocAuditScheduleRow(row)) return;

  state.executionInFlight = true;
  refreshSingleTextFieldOperationalSaveButtonState(fieldName);

  const { url, anonKey } = getSupabaseEnv();
  const changedFields = [entry.fieldName];
  const candidate = getFieldCandidate(fieldName);
  const candidateValues = { [entry.fieldName]: candidate };
  let payload;
  try {
    payload = buildSingleTextFieldPayload(
      entry.fieldName,
      candidate,
      entry.validate,
      entry.phasePrefix,
    );
  } catch (err) {
    renderSaveResult(fieldName, {
      actualWrite: false,
      outcome: {
        optimisticLockEnabled: true,
        expectedBeforeUpdatedAt: state.previewExpectedUpdatedAt,
        warnings: [],
        errorCode: "write_guard_failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
      changedFields,
      beforeSnapshot: row,
      payloadWritten: {},
    });
    state.executionInFlight = false;
    refreshSingleTextFieldOperationalSaveButtonState(fieldName);
    return;
  }

  const previewBinding = {
    targetId: state.previewTargetId ?? row.id,
    legacyId: state.previewTargetLegacyId ?? row.legacy_id ?? null,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    expectedBeforeUpdatedAt: state.previewExpectedUpdatedAt,
    changedFields,
    fieldValues: { ...state.fieldValues },
    hostGatePassed: state.previewHostGatePassed,
    optimisticLockStale: state.previewStale,
    previewIdentity: state.previewIdentity ?? computePreviewIdentity(fieldName) ?? "",
    consumedPreviewIdentity: state.saveSuccess?.previewIdentity ?? null,
  };

  const reclickGate = checkSaveReclickGate(fieldName);
  if (
    reclickGate.blocked ||
    isOperationalSaveReclickBlocked(state.saveSuccess, previewBinding.previewIdentity)
  ) {
    renderSaveResult(fieldName, {
      actualWrite: false,
      outcome: {
        optimisticLockEnabled: true,
        expectedBeforeUpdatedAt: state.previewExpectedUpdatedAt,
        warnings: [],
        errorCode: "preview_consumed",
        errorMessage: reclickGate.reason || G9G3H1_PREVIEW_CONSUMED_MSG,
      },
      changedFields,
      beforeSnapshot: row,
      payloadWritten: payload,
    });
    state.executionInFlight = false;
    refreshSingleTextFieldOperationalSaveButtonState(fieldName);
    return;
  }

  try {
    const outcome = await executeSingleTextFieldOperationalNonDryRunSave(fieldName, {
      url,
      anonKey,
      beforeSnapshot: row,
      payload,
      changedFields,
      previewBinding,
      candidateValues,
    });

    const actualWrite =
      outcome.result != null &&
      "actualWrite" in outcome.result &&
      outcome.result.actualWrite === true;

    renderSaveResult(fieldName, {
      actualWrite,
      outcome,
      changedFields,
      beforeSnapshot: row,
      payloadWritten: payload,
    });

    if (actualWrite && outcome.result && "afterSnapshot" in outcome.result) {
      const root = getRoot();
      if (root) {
        const updated = outcome.result.afterSnapshot as ScheduleRecord;
        root.dataset.targetRow = JSON.stringify(updated);
        const baseline = document.getElementById("site-slug-edit-baseline-updated-at");
        if (baseline) baseline.textContent = updated.updated_at ?? "—";
        const loadedField = document.getElementById(FIELD_LOADED_IDS[fieldName]);
        if (loadedField) loadedField.textContent = updated[fieldName] ?? "—";
      }
      state.saveSuccess = {
        previewIdentity: previewBinding.previewIdentity,
        mode: entry.reclickMode,
        approvalId: entry.approvalId,
        targetId: row.id,
        legacyId: row.legacy_id ?? null,
        changedFields: [...changedFields],
        rowsAffected:
          outcome.result && "rowsAffected" in outcome.result
            ? Number((outcome.result as ScheduleWriteResult).rowsAffected ?? 0)
            : 0,
      };
    }
  } finally {
    state.executionInFlight = false;
    refreshSingleTextFieldOperationalSaveButtonState(fieldName);
    refreshSingleTextFieldOperationalSaveGatePanel(fieldName);
  }
}

export function initSingleTextFieldOperationalEditUi(
  fieldName: SingleTextFieldOperationalFieldName,
): void {
  if (initializedFields.has(fieldName)) return;
  initializedFields.add(fieldName);

  const config = getSingleTextFieldOperationalConfig(fieldName);

  document.getElementById(config.previewBtnId)?.addEventListener("click", () => {
    void onPreviewClick(fieldName);
  });

  document.getElementById(config.saveBtnId)?.addEventListener("click", () => {
    void onSaveClick(fieldName);
  });

  document.getElementById(FIELD_INPUT_IDS[fieldName])?.addEventListener("input", () => {
    if (isPickerDrivenBinding()) {
      markSingleTextFieldOperationalPreviewStale(fieldName, G9G3F3C_PREVIEW_STALE_MSG);
    }
  });

  void ensureStagingAuthRefreshed().then(() => {
    refreshSingleTextFieldOperationalUiState(fieldName);
  });
}

export function initAllSingleTextFieldOperationalEditUi(): void {
  for (const entry of SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY) {
    initSingleTextFieldOperationalEditUi(entry.fieldName);
  }
}

export function refreshSingleTextFieldOperationalUiState(
  fieldName: SingleTextFieldOperationalFieldName,
): void {
  refreshPreviewButtonState(fieldName);
  refreshSingleTextFieldOperationalSaveButtonState(fieldName);
  refreshSingleTextFieldOperationalSaveGatePanel(fieldName);
}

export function refreshAllSingleTextFieldOperationalUiState(): void {
  for (const entry of SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY) {
    refreshSingleTextFieldOperationalUiState(entry.fieldName);
  }
}
