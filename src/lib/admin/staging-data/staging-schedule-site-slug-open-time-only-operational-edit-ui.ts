/**
 * G-9g4a2a — open_time-only operational edit UI (staging shell only).
 * Separate from G-9g3g general operational Save path.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  buildSiteSlugScheduleEditDryRunError,
  buildSiteSlugScheduleEditDryRunResult,
  sanitizeSiteSlugEditSafeFieldPatch,
} from "./staging-schedule-site-slug-edit-dry-run";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import {
  isPocAuditScheduleRow,
} from "./staging-schedule-site-slug-row-picker-utils";
import { getG9G4a2aOpenTimeOnlyOperationalConfig } from "./staging-schedule-site-slug-open-time-only-operational-config";
import {
  G9G3F3C_PREVIEW_STALE_MSG,
  G9G3H1_FRESH_PREVIEW_REQUIRED_MSG,
  G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG,
  G9G3H1_PREVIEW_CONSUMED_MSG,
  G9G3H1_ROUTINE_DEV_SAFETY_HINT,
  G9G3H1_SAVE_SUCCESS_BLOCKED_MSG,
  G9G4A2A_PHASE,
  G9G4A2A_OPEN_TIME_ONLY_CHANGED_FIELDS,
  G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2A_OPEN_TIME_ONLY_PREVIEW_BTN_ID,
  G9G4A2A_OPEN_TIME_ONLY_PREVIEW_RESULT_ID,
  G9G4A2A_OPEN_TIME_ONLY_SAVE_BTN_ID,
  G9G4A2A_OPEN_TIME_ONLY_SAVE_GATE_PANEL_ID,
  G9G4A2A_OPEN_TIME_ONLY_SAVE_RESULT_ID,
  G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
  SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { hasPickerBoundRow } from "./staging-schedule-site-slug-edit-picker-binding";
import {
  buildOperationalPreviewIdentity,
  isOperationalSaveReclickBlocked,
  type OperationalSaveSuccessRecord,
} from "./staging-schedule-site-slug-operational-save-reclick";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import {
  buildG9G4a2aOpenTimeOnlyPayload,
} from "../staging-write/schedule-write-guards";
import { executeG9G4a2aOpenTimeOnlyNonDryRunSave } from "../staging-write/staging-schedule-site-slug-open-time-only-operational-save";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import type { ScheduleWriteResult } from "../staging-write/schedule-write-types";

let g9g4a2aOpenTimeOnlyPreviewValid = false;
let lastG9g4a2aOpenTimeOnlyFieldValues: Record<string, string> = {};
let lastG9g4a2aPreviewTargetId: string | null = null;
let lastG9g4a2aPreviewTargetLegacyId: string | null = null;
let lastG9g4a2aPreviewExpectedUpdatedAt: string | null = null;
let lastG9g4a2aPreviewHostGatePassed = false;
let lastG9g4a2aPreviewStale = false;
let lastG9g4a2aPreviewIdentity: string | null = null;
let g9g4a2aOpenTimeOnlySaveSuccess: OperationalSaveSuccessRecord | null = null;
let g9g4a2aExecutionInFlight = false;
let g9g4a2aStagingAuthSignedIn: boolean | null = null;

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

export function isG9g4a2aOpenTimeOnlyArmed(): boolean {
  return getRoot()?.dataset.g9g4a2aArmed === "true";
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

function getOpenTimeCandidate(): string {
  const el = document.getElementById("site-slug-edit-dry-run-open-time");
  if (el instanceof HTMLInputElement) return el.value;
  return "";
}

function getNonOpenTimeFieldValue(field: Exclude<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], "open_time">): string {
  const idMap: Record<string, string> = {
    title: "site-slug-edit-dry-run-title",
    venue: "site-slug-edit-dry-run-venue",
    start_time: "site-slug-edit-dry-run-start-time",
    price: "site-slug-edit-dry-run-price",
    description: "site-slug-edit-dry-run-description",
  };
  const el = document.getElementById(idMap[field]);
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return "";
}

function nonOpenTimeFieldsUnchanged(row: ScheduleRecord): boolean {
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    if (field === "open_time") continue;
    const current = getNonOpenTimeFieldValue(field);
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

function isG9g4a2aPreviewResultStale(): boolean {
  const resultEl = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_PREVIEW_RESULT_ID);
  return (
    lastG9g4a2aPreviewStale ||
    Boolean(resultEl?.classList.contains("site-slug-edit-dry-run-result--stale"))
  );
}

function computeG9g4a2aOpenTimeOnlyPreviewIdentity(): string | null {
  if (!lastG9g4a2aPreviewTargetId) return null;
  return buildOperationalPreviewIdentity({
    mode: "open-time-only",
    approvalId: G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
    targetId: lastG9g4a2aPreviewTargetId,
    legacyId: lastG9g4a2aPreviewTargetLegacyId,
    expectedBeforeUpdatedAt: lastG9g4a2aPreviewExpectedUpdatedAt,
    changedFields: [...G9G4A2A_OPEN_TIME_ONLY_CHANGED_FIELDS],
    fieldValues: { ...lastG9g4a2aOpenTimeOnlyFieldValues },
  });
}

function checkG9g4a2aOpenTimeOnlySaveReclickGate(): { blocked: boolean; reason: string } {
  if (!g9g4a2aOpenTimeOnlySaveSuccess) {
    return { blocked: false, reason: "" };
  }
  if (!g9g4a2aOpenTimeOnlyPreviewValid) {
    return { blocked: true, reason: G9G3H1_SAVE_SUCCESS_BLOCKED_MSG };
  }
  if (isOperationalSaveReclickBlocked(g9g4a2aOpenTimeOnlySaveSuccess, lastG9g4a2aPreviewIdentity)) {
    return { blocked: true, reason: G9G3H1_PREVIEW_CONSUMED_MSG };
  }
  return { blocked: false, reason: "" };
}

export function invalidateG9g4a2aOpenTimeOnlyPreview(): void {
  g9g4a2aOpenTimeOnlyPreviewValid = false;
  lastG9g4a2aOpenTimeOnlyFieldValues = {};
  lastG9g4a2aPreviewTargetId = null;
  lastG9g4a2aPreviewTargetLegacyId = null;
  lastG9g4a2aPreviewExpectedUpdatedAt = null;
  lastG9g4a2aPreviewHostGatePassed = false;
  lastG9g4a2aPreviewStale = false;
  lastG9g4a2aPreviewIdentity = null;
  g9g4a2aOpenTimeOnlySaveSuccess = null;
  refreshG9g4a2aOpenTimeOnlySaveButtonState();
  refreshG9g4a2aOpenTimeOnlySaveGatePanel();
}

export function markG9g4a2aOpenTimeOnlyPreviewStale(reason?: string): void {
  invalidateG9g4a2aOpenTimeOnlyPreview();
  const el = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_PREVIEW_RESULT_ID);
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
  refreshG9g4a2aOpenTimeOnlySaveButtonState();
  refreshG9g4a2aOpenTimeOnlySaveGatePanel();
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

function renderG9g4a2aOpenTimeOnlyDryRunResult(
  result: ReturnType<typeof buildSiteSlugScheduleEditDryRunResult>,
): void {
  const el = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_PREVIEW_RESULT_ID);
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
    result.changedFields.length > 0 ? { open_time: result.after.open_time } : {};

  el.innerHTML = [
    `<p class="site-slug-edit-dry-run-result__slice-label"><strong>G-9g4a2a open-time-only</strong></p>`,
    hostFailBanner,
    staleBanner,
    `<p class="site-slug-edit-dry-run-result__message">${escapeHtml(result.message)}</p>`,
    `<div class="site-slug-edit-dry-run-result__chips"><span class="site-slug-edit-dry-run-result__chips-label">changedFields:</span> ${renderChangedFieldChips(result.changedFields)}</div>`,
    `<dl class="site-slug-edit-dry-run-result__meta">`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>changedFields</dt><dd>open_time</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID)}</code></dd></div>`,
    `<div><dt>optimisticLock.stale</dt><dd>${result.optimisticLock.stale ? "true" : "false"}</dd></div>`,
    `<div><dt>hostGatePassed</dt><dd>${result.hostGate.hostGatePassed ? "true" : "false"}</dd></div>`,
    `<div><dt>serviceRoleUsed</dt><dd>false</dd></div>`,
    `<div><dt>productionBlocked</dt><dd>true</dd></div>`,
    `</dl>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">payload to write (open_time only)</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block site-slug-edit-dry-run-result__block--payload">${escapeHtml(JSON.stringify(payloadPreview, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">before</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.before, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">after</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.after, null, 2))}</pre>`,
  ].join("");
}

export function canEnableG9g4a2aOpenTimeOnlySave(): { ok: boolean; reason: string } {
  if (!isPickerDrivenBinding()) {
    return { ok: false, reason: "Picker-driven binding required for G-9g4a2a open-time-only Save" };
  }
  if (!isG9g4a2aOpenTimeOnlyArmed()) {
    return {
      ok: false,
      reason: G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
    };
  }
  if (getRoot()?.dataset.g9g4a1Armed === "true") {
    return {
      ok: false,
      reason: "G-9g4a1 venue-only arm on — G-9g4a2a open_time-only Save blocked",
    };
  }

  const config = getG9G4a2aOpenTimeOnlyOperationalConfig();
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
      reason: config.armFailureReason ?? G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
    };
  }
  if (g9g4a2aExecutionInFlight) return { ok: false, reason: "Save in flight" };

  const reclickGate = checkG9g4a2aOpenTimeOnlySaveReclickGate();
  if (reclickGate.blocked) return { ok: false, reason: reclickGate.reason };

  if (!hasPickerBoundRow()) {
    return { ok: false, reason: "Select a non-PoC content row in the picker" };
  }
  if (!g9g4a2aOpenTimeOnlyPreviewValid) {
    return { ok: false, reason: "Latest G-9g4a2a open-time-only Preview required" };
  }
  if (isG9g4a2aPreviewResultStale()) {
    return { ok: false, reason: G9G3F3C_PREVIEW_STALE_MSG };
  }
  if (g9g4a2aStagingAuthSignedIn === false) {
    return { ok: false, reason: "Sign in as staging admin before Save" };
  }
  if (g9g4a2aStagingAuthSignedIn === null) {
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
  if (lastG9g4a2aPreviewTargetId && row.id !== lastG9g4a2aPreviewTargetId) {
    return { ok: false, reason: "Selected row id does not match preview target" };
  }
  if (!lastG9g4a2aPreviewHostGatePassed) {
    return { ok: false, reason: "Preview hostGatePassed was false" };
  }
  if (lastG9g4a2aPreviewStale) {
    return { ok: false, reason: "Optimistic lock stale at preview — re-run Preview" };
  }
  if (
    lastG9g4a2aPreviewExpectedUpdatedAt != null &&
    row.updated_at !== lastG9g4a2aPreviewExpectedUpdatedAt
  ) {
    return {
      ok: false,
      reason: "Row updated_at changed since preview — re-run Preview",
    };
  }

  const open_timeCandidate = getOpenTimeCandidate();
  if (open_timeCandidate.trim() === "") {
    return { ok: false, reason: "open_time cannot be empty" };
  }
  if (open_timeCandidate !== (lastG9g4a2aOpenTimeOnlyFieldValues.open_time ?? "")) {
    return { ok: false, reason: "open_time changed since preview" };
  }
  if (!nonOpenTimeFieldsUnchanged(row)) {
    return { ok: false, reason: "Non-open_time fields modified since load" };
  }
  if (!canUseLiveSupabase()) {
    return { ok: false, reason: "Supabase read source required" };
  }

  return { ok: true, reason: "Ready (operator manual only — not auto-clicked)" };
}

export function refreshG9g4a2aOpenTimeOnlySaveButtonState(): void {
  const btn = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_SAVE_BTN_ID);
  if (!(btn instanceof HTMLButtonElement)) return;
  const { ok, reason } = canEnableG9g4a2aOpenTimeOnlySave();
  btn.disabled = !ok;
  btn.title = ok
    ? "G-9g4a2a open-time-only Save — operator manual only"
    : `G-9g4a2a open-time-only Save disabled — ${reason}`;
}

export function refreshG9g4a2aOpenTimeOnlySaveGatePanel(): void {
  const el = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_SAVE_GATE_PANEL_ID);
  if (!el) return;

  const config = getG9G4a2aOpenTimeOnlyOperationalConfig();
  const hostGate = getClientHostGate();
  const saveGate = canEnableG9g4a2aOpenTimeOnlySave();
  const lines: string[] = [
    "G-9g4a2a open-time-only",
    `changedFields: open_time`,
    `approvalId: ${G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID}`,
    `env arm: ${SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV}=${isG9g4a2aOpenTimeOnlyArmed() ? "true" : "false"}`,
    `hostGatePassed: ${hostGate.hostGatePassed ? "true" : "false"}`,
    `optimisticLock.stale: ${lastG9g4a2aPreviewStale ? "true" : "false"}`,
    g9g4a2aOpenTimeOnlyPreviewValid
      ? isG9g4a2aPreviewResultStale()
        ? `preview: ${G9G3F3C_PREVIEW_STALE_MSG}`
        : g9g4a2aOpenTimeOnlySaveSuccess &&
            isOperationalSaveReclickBlocked(g9g4a2aOpenTimeOnlySaveSuccess, lastG9g4a2aPreviewIdentity)
          ? `preview: ${G9G3H1_PREVIEW_CONSUMED_MSG}`
          : "preview: valid"
      : `preview: ${G9G3H1_FRESH_PREVIEW_REQUIRED_MSG}`,
    saveGate.ok
      ? "Save: enabled — operator manual only"
      : `Save: disabled — ${saveGate.reason}`,
    G9G3H1_ROUTINE_DEV_SAFETY_HINT,
  ];

  if (g9g4a2aOpenTimeOnlySaveSuccess) {
    lines.push(G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG);
    lines.push(
      `re-click: blocked — Save completed once (rowsAffected=${g9g4a2aOpenTimeOnlySaveSuccess.rowsAffected})`,
    );
  }

  if (!config.saveEnabled) {
    lines.push(config.armFailureReason ?? G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON);
  }

  el.textContent = lines.join(" | ");
}

function refreshG9g4a2aOpenTimeOnlyPreviewButtonState(): void {
  const btn = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_PREVIEW_BTN_ID);
  if (!(btn instanceof HTMLButtonElement)) return;
  const rowBound = hasPickerBoundRow() && parseTargetRow() != null;
  btn.disabled = !rowBound;
  btn.title = rowBound
    ? "G-9g4a2a open-time-only dry-run Preview — changedFields=open_time only; actualWrite=false"
    : "Select a row in the picker above first";
}

function renderG9g4a2aOpenTimeOnlySaveResult(payload: {
  actualWrite: boolean;
  outcome: Awaited<ReturnType<typeof executeG9G4a2aOpenTimeOnlyNonDryRunSave>>;
  changedFields: string[];
  beforeSnapshot: ScheduleRecord;
  payloadWritten: Record<string, unknown>;
}): void {
  const el = document.getElementById(G9G4A2A_OPEN_TIME_ONLY_SAVE_RESULT_ID);
  if (!el) return;

  const result = payload.outcome.result;
  const success = result && "actualWrite" in result && result.actualWrite === true;
  const safety = result && "safety" in result ? result.safety : null;

  el.innerHTML = [
    `<p class="site-slug-edit-save-result__slice-label"><strong>G-9g4a2a open-time-only</strong></p>`,
    `<p class="site-slug-edit-save-result__message">${escapeHtml(
      success
        ? "G-9g4a2a open-time-only Save completed — actualWrite=true."
        : payload.outcome.errorMessage ?? "G-9g4a2a open-time-only Save did not complete.",
    )}</p>`,
    success
      ? `<p class="site-slug-edit-save-result__reclick" role="status"><strong>${escapeHtml(G9G3H1_SAVE_SUCCESS_BLOCKED_MSG)}</strong></p>`
      : "",
    `<dl class="site-slug-edit-save-result__meta">`,
    `<div><dt>actualWrite</dt><dd>${payload.actualWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID)}</code></dd></div>`,
    `<div><dt>changedFields</dt><dd>open_time</dd></div>`,
    `<div><dt>serviceRoleUsed</dt><dd>${safety?.serviceRoleUsed === false ? "false" : "false"}</dd></div>`,
    `<div><dt>productionBlocked</dt><dd>true</dd></div>`,
    `</dl>`,
    `<h4 class="site-slug-edit-save-result__subhead">full outcome</h4>`,
    `<pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify(payload.outcome, null, 2))}</pre>`,
  ].join("");
}

async function refreshG9g4a2aStagingAuthSignedIn(): Promise<boolean> {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    g9g4a2aStagingAuthSignedIn = false;
    return false;
  }
  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    g9g4a2aStagingAuthSignedIn = isSignedInStagingAuth(auth);
  } catch {
    g9g4a2aStagingAuthSignedIn = false;
  }
  return g9g4a2aStagingAuthSignedIn ?? false;
}

async function onG9g4a2aOpenTimeOnlyPreviewClick(): Promise<void> {
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
    renderG9g4a2aOpenTimeOnlyDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G4A2A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "No row selected — select a row in the picker above.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateG9g4a2aOpenTimeOnlyPreview();
    return;
  }

  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    renderG9g4a2aOpenTimeOnlyDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G4A2A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "site_slug mismatch — G-9g4a2a open-time-only preview blocked.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateG9g4a2aOpenTimeOnlyPreview();
    return;
  }

  if (isPocAuditScheduleRow(row)) {
    renderG9g4a2aOpenTimeOnlyDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G4A2A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "PoC audit row — G-9g4a2a open-time-only preview blocked.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateG9g4a2aOpenTimeOnlyPreview();
    return;
  }

  if (!nonOpenTimeFieldsUnchanged(row)) {
    renderG9g4a2aOpenTimeOnlyDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G4A2A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message:
          "G-9g4a2a open-time-only requires non-open_time fields unchanged — revert other edits.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateG9g4a2aOpenTimeOnlyPreview();
    return;
  }

  const open_timeCandidate = getOpenTimeCandidate();
  if (open_timeCandidate.trim() === "") {
    renderG9g4a2aOpenTimeOnlyDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G4A2A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "open_time cannot be empty for G-9g4a2a open-time-only preview.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateG9g4a2aOpenTimeOnlyPreview();
    return;
  }

  const patch = sanitizeSiteSlugEditSafeFieldPatch({ open_time: open_timeCandidate });
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
    phase: G9G4A2A_PHASE,
    source: row,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    patch,
    optimisticLock,
    hostGate: hostGatePreview,
  });

  if (
    result.changedFields.length !== 1 ||
    result.changedFields[0] !== "open_time"
  ) {
    renderG9g4a2aOpenTimeOnlyDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G4A2A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: `G-9g4a2a changedFields must be open_time only — got: ${result.changedFields.join(", ") || "none"}.`,
        hostGate: hostGatePreview,
      }),
    );
    invalidateG9g4a2aOpenTimeOnlyPreview();
    return;
  }

  renderG9g4a2aOpenTimeOnlyDryRunResult(result);

  g9g4a2aOpenTimeOnlyPreviewValid = true;
  lastG9g4a2aOpenTimeOnlyFieldValues = { open_time: open_timeCandidate };
  lastG9g4a2aPreviewTargetId = result.target.id;
  lastG9g4a2aPreviewTargetLegacyId = result.target.legacy_id ?? null;
  lastG9g4a2aPreviewExpectedUpdatedAt = result.optimisticLock.expectedBeforeUpdatedAt ?? null;
  lastG9g4a2aPreviewHostGatePassed = result.hostGate.hostGatePassed;
  lastG9g4a2aPreviewStale = result.optimisticLock.stale;
  lastG9g4a2aPreviewIdentity = computeG9g4a2aOpenTimeOnlyPreviewIdentity();
  g9g4a2aOpenTimeOnlySaveSuccess = null;

  refreshG9g4a2aOpenTimeOnlySaveButtonState();
  refreshG9g4a2aOpenTimeOnlySaveGatePanel();
}

async function onG9g4a2aOpenTimeOnlySaveClick(): Promise<void> {
  const gate = canEnableG9g4a2aOpenTimeOnlySave();
  if (!gate.ok) {
    refreshG9g4a2aOpenTimeOnlySaveButtonState();
    return;
  }

  const row = parseTargetRow();
  if (!row || isPocAuditScheduleRow(row)) return;

  g9g4a2aExecutionInFlight = true;
  refreshG9g4a2aOpenTimeOnlySaveButtonState();

  const { url, anonKey } = getSupabaseEnv();
  const changedFields = ["open_time"];
  const open_timeCandidate = getOpenTimeCandidate();
  const candidateValues = { open_time: open_timeCandidate };
  let payload;
  try {
    payload = buildG9G4a2aOpenTimeOnlyPayload(open_timeCandidate);
  } catch (err) {
    renderG9g4a2aOpenTimeOnlySaveResult({
      actualWrite: false,
      outcome: {
        optimisticLockEnabled: true,
        expectedBeforeUpdatedAt: lastG9g4a2aPreviewExpectedUpdatedAt,
        warnings: [],
        errorCode: "write_guard_failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
      changedFields,
      beforeSnapshot: row,
      payloadWritten: {},
    });
    g9g4a2aExecutionInFlight = false;
    refreshG9g4a2aOpenTimeOnlySaveButtonState();
    return;
  }

  const previewBinding = {
    targetId: lastG9g4a2aPreviewTargetId ?? row.id,
    legacyId: lastG9g4a2aPreviewTargetLegacyId ?? row.legacy_id ?? null,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    expectedBeforeUpdatedAt: lastG9g4a2aPreviewExpectedUpdatedAt,
    changedFields,
    fieldValues: { ...lastG9g4a2aOpenTimeOnlyFieldValues },
    hostGatePassed: lastG9g4a2aPreviewHostGatePassed,
    optimisticLockStale: lastG9g4a2aPreviewStale,
    previewIdentity:
      lastG9g4a2aPreviewIdentity ?? computeG9g4a2aOpenTimeOnlyPreviewIdentity() ?? "",
    consumedPreviewIdentity: g9g4a2aOpenTimeOnlySaveSuccess?.previewIdentity ?? null,
  };

  const reclickGate = checkG9g4a2aOpenTimeOnlySaveReclickGate();
  if (
    reclickGate.blocked ||
    isOperationalSaveReclickBlocked(g9g4a2aOpenTimeOnlySaveSuccess, previewBinding.previewIdentity)
  ) {
    renderG9g4a2aOpenTimeOnlySaveResult({
      actualWrite: false,
      outcome: {
        optimisticLockEnabled: true,
        expectedBeforeUpdatedAt: lastG9g4a2aPreviewExpectedUpdatedAt,
        warnings: [],
        errorCode: "preview_consumed",
        errorMessage: reclickGate.reason || G9G3H1_PREVIEW_CONSUMED_MSG,
      },
      changedFields,
      beforeSnapshot: row,
      payloadWritten: payload,
    });
    g9g4a2aExecutionInFlight = false;
    refreshG9g4a2aOpenTimeOnlySaveButtonState();
    return;
  }

  try {
    const outcome = await executeG9G4a2aOpenTimeOnlyNonDryRunSave({
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

    renderG9g4a2aOpenTimeOnlySaveResult({
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
        const loadedOpenTime = document.getElementById("site-slug-edit-loaded-open-time");
        if (loadedOpenTime) loadedOpenTime.textContent = updated.open_time ?? "—";
      }
      g9g4a2aOpenTimeOnlySaveSuccess = {
        previewIdentity: previewBinding.previewIdentity,
        mode: "open-time-only",
        approvalId: G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
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
    g9g4a2aExecutionInFlight = false;
    refreshG9g4a2aOpenTimeOnlySaveButtonState();
    refreshG9g4a2aOpenTimeOnlySaveGatePanel();
  }
}

export function initG9g4a2aOpenTimeOnlyOperationalEditUi(): void {
  document
    .getElementById(G9G4A2A_OPEN_TIME_ONLY_PREVIEW_BTN_ID)
    ?.addEventListener("click", () => {
      void onG9g4a2aOpenTimeOnlyPreviewClick();
    });

  document.getElementById(G9G4A2A_OPEN_TIME_ONLY_SAVE_BTN_ID)?.addEventListener("click", () => {
    void onG9g4a2aOpenTimeOnlySaveClick();
  });

  document.getElementById("site-slug-edit-dry-run-open-time")?.addEventListener("input", () => {
    if (isPickerDrivenBinding()) {
      markG9g4a2aOpenTimeOnlyPreviewStale(G9G3F3C_PREVIEW_STALE_MSG);
    }
  });

  void refreshG9g4a2aStagingAuthSignedIn().then(() => {
    refreshG9g4a2aOpenTimeOnlyPreviewButtonState();
    refreshG9g4a2aOpenTimeOnlySaveButtonState();
    refreshG9g4a2aOpenTimeOnlySaveGatePanel();
  });
}

export function refreshG9g4a2aOpenTimeOnlyUiState(): void {
  refreshG9g4a2aOpenTimeOnlyPreviewButtonState();
  refreshG9g4a2aOpenTimeOnlySaveButtonState();
  refreshG9g4a2aOpenTimeOnlySaveGatePanel();
}
