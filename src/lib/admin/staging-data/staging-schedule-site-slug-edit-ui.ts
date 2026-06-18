/**
 * G-9g1 / G-9g2 / G-9g3a / G-9g3b / G-9g3c / G-9g3d — Browser UI for site_slug schedule edit (staging shell only).
 * G-9g3d: unified general safe-fields Save. Legacy slice Saves frozen by default.
 * Preview: actualWrite=false always.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  buildSiteSlugScheduleEditDryRunError,
  buildSiteSlugScheduleEditDryRunResult,
  sanitizeSiteSlugEditSafeFieldPatch,
  type SiteSlugEditSafeFieldPatch,
  type SiteSlugScheduleEditDryRunResult,
} from "./staging-schedule-site-slug-edit-dry-run";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import { getG9G3bVenueDescriptionPocConfig } from "./staging-schedule-site-slug-venue-description-poc-config";
import { getG9G3cTimePricePocConfig } from "./staging-schedule-site-slug-time-price-poc-config";
import { getG9G3dGeneralEditPocConfig } from "./staging-schedule-site-slug-general-edit-poc-config";
import {
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  G9G3A_PHASE,
  G9G3B_DESCRIPTION_POC_DEFAULT,
  G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID,
  G9G3B_VENUE_POC_DEFAULT,
  G9G3C_OPEN_TIME_POC_DEFAULT,
  G9G3C_PRICE_POC_DEFAULT,
  G9G3C_START_TIME_POC_DEFAULT,
  G9G3C_TIME_PRICE_NON_DRY_RUN_APPROVAL_ID,
  G9G3D_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
  G9G3D_GENERAL_EDIT_POC_EXECUTED,
  G9G3D_POC_EXECUTED_ARM_FAILURE,
  G9G3D_PHASE,
  G9G3F3B_PHASE,
  G9G3F3C_PHASE,
  G9G3F3C_PREVIEW_STALE_MSG,
  G9G3_SLICE_POC_EXECUTED_ARM_FAILURE,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { executeG9G3bVenueDescriptionNonDryRunSave } from "../staging-write/staging-schedule-site-slug-venue-description-poc-save";
import { executeG9G3cTimePriceNonDryRunSave } from "../staging-write/staging-schedule-site-slug-time-price-poc-save";
import { executeG9G3dGeneralEditNonDryRunSave } from "../staging-write/staging-schedule-site-slug-general-edit-poc-save";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import {
  isSignedInStagingAuth,
} from "../staging-write/schedule-non-dry-run-poc-auth";
import { buildG9G3dGeneralEditPayload } from "../staging-write/schedule-write-guards";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import type { ScheduleWriteResult } from "../staging-write/schedule-write-types";
import {
  initPickerEditBinding,
  hasPickerBoundRow,
} from "./staging-schedule-site-slug-edit-picker-binding";
import { isPocAuditScheduleRow } from "./staging-schedule-site-slug-row-picker-utils";

const SAFE_FIELD_INPUT_IDS: Record<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], string> = {
  title: "site-slug-edit-dry-run-title",
  venue: "site-slug-edit-dry-run-venue",
  open_time: "site-slug-edit-dry-run-open-time",
  start_time: "site-slug-edit-dry-run-start-time",
  price: "site-slug-edit-dry-run-price",
  description: "site-slug-edit-dry-run-description",
};

const G9G3B_CHANGED_FIELDS = ["venue", "description"] as const;
const G9G3C_CHANGED_FIELDS = ["open_time", "start_time", "price"] as const;

let g9g3bDryRunPreviewValid = false;
let lastPreviewVenue: string | null = null;
let lastPreviewDescription: string | null = null;
let lastPreviewChangedFields: string[] = [];
let lastPreviewStale = false;
let g9g3cDryRunPreviewValid = false;
let lastPreviewOpenTime: string | null = null;
let lastPreviewStartTime: string | null = null;
let lastPreviewPrice: string | null = null;
let lastPreviewG9g3cChangedFields: string[] = [];
let lastPreviewG9g3cStale = false;
let g9g3dDryRunPreviewValid = false;
let lastPreviewG9g3dChangedFields: string[] = [];
let lastPreviewG9g3dFieldValues: Record<string, string> = {};
let lastPreviewG9g3dStale = false;
let stagingAuthSignedIn: boolean | null = null;
let executionInFlight = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPickerDrivenBinding(): boolean {
  return getRoot()?.dataset.pickerDrivenBinding === "true";
}

function getRoot(): HTMLElement | null {
  return document.getElementById("admin-staging-schedule-site-slug-edit");
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

function isG9g3bArmed(): boolean {
  const root = getRoot();
  return root?.dataset.g9g3bArmed === "true";
}

function isG9g3cArmed(): boolean {
  const root = getRoot();
  return root?.dataset.g9g3cArmed === "true";
}

function isG9g3dArmed(): boolean {
  const root = getRoot();
  return root?.dataset.g9g3dArmed === "true";
}

function isLegacyPoCUiVisible(): boolean {
  const root = getRoot();
  return root?.dataset.legacyPocUiVisible === "true";
}

function getFieldValue(field: (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number]): string {
  const id = SAFE_FIELD_INPUT_IDS[field];
  const el = document.getElementById(id);
  if (!el) return "";
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    return el.value;
  }
  return "";
}

function collectSafeFieldPatch(): SiteSlugEditSafeFieldPatch {
  const patch: SiteSlugEditSafeFieldPatch = {};
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    patch[field] = getFieldValue(field);
  }
  return sanitizeSiteSlugEditSafeFieldPatch(patch);
}

function getClientHostGate() {
  const { url } = getSupabaseEnv();
  return evaluateSupabaseHostGate(url);
}

function updateHostGateSummary(hostGate: ReturnType<typeof evaluateSupabaseHostGate>): void {
  const activeEl = document.getElementById("site-slug-edit-active-host");
  const passedEl = document.getElementById("site-slug-edit-host-gate-passed");
  const root = getRoot();
  if (activeEl) activeEl.textContent = hostGate.activeHost;
  if (passedEl) passedEl.textContent = hostGate.hostGatePassed ? "true" : "false";
  if (root) {
    root.dataset.hostGatePassed = hostGate.hostGatePassed ? "true" : "false";
    root.dataset.activeHost = hostGate.activeHost;
  }
  updateProductionStopBanner(hostGate);
  refreshSaveGatePanel();
}

function changedFieldsMatchVenueDescriptionOnly(fields: string[]): boolean {
  if (fields.length !== G9G3B_CHANGED_FIELDS.length) return false;
  const sorted = [...fields].sort();
  const expected = [...G9G3B_CHANGED_FIELDS].sort();
  return sorted.every((field, index) => field === expected[index]);
}

function changedFieldsMatchTimePriceOnly(fields: string[]): boolean {
  if (fields.length !== G9G3C_CHANGED_FIELDS.length) return false;
  const sorted = [...fields].sort();
  const expected = [...G9G3C_CHANGED_FIELDS].sort();
  return sorted.every((field, index) => field === expected[index]);
}

function changedFieldsSubsetOfSafeFields(fields: string[]): boolean {
  const safe = new Set<string>(SITE_SLUG_EDIT_SAFE_FIELDS);
  return fields.length > 0 && fields.every((field) => safe.has(field));
}

async function refreshStagingAuthSignedIn(): Promise<boolean> {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    stagingAuthSignedIn = false;
    updateAuthBanner(false);
    return false;
  }
  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    stagingAuthSignedIn = isSignedInStagingAuth(auth);
  } catch {
    stagingAuthSignedIn = false;
  }
  updateAuthBanner(stagingAuthSignedIn);
  return stagingAuthSignedIn ?? false;
}

function updateAuthBanner(signedIn: boolean | null): void {
  const banner = document.getElementById("site-slug-edit-auth-banner");
  if (!banner) return;
  if (signedIn === null) {
    banner.innerHTML =
      '<strong class="admin-staging-schedule-site-slug-edit__auth-badge admin-staging-schedule-site-slug-edit__auth-badge--checking">Checking</strong> Verifying staging admin session…';
    banner.className = "admin-staging-schedule-site-slug-edit__auth-checking";
    return;
  }
  if (signedIn) {
    banner.innerHTML =
      '<strong class="admin-staging-schedule-site-slug-edit__auth-badge admin-staging-schedule-site-slug-edit__auth-badge--ok">Staging admin</strong> Signed in — Preview always available; Save remains gated.';
    banner.className = "admin-staging-schedule-site-slug-edit__auth-ok";
  } else {
    banner.innerHTML =
      '<strong class="admin-staging-schedule-site-slug-edit__auth-badge admin-staging-schedule-site-slug-edit__auth-badge--warn">Not signed in</strong> Sign in as staging admin before Save.';
    banner.className = "admin-staging-schedule-site-slug-edit__auth-warn";
  }
}

function updateProductionStopBanner(hostGate: ReturnType<typeof evaluateSupabaseHostGate>): void {
  const el = document.getElementById("site-slug-edit-production-stop");
  if (!el) return;
  if (hostGate.isKnownProductionHost) {
    el.hidden = false;
    el.textContent =
      "STOP — production Supabase host detected. All writes blocked. Expected staging host only.";
  } else if (!hostGate.hostGatePassed) {
    el.hidden = false;
    el.textContent =
      hostGate.warningMessage ??
      "STOP — Supabase host gate failed. Preview may run; Save blocked.";
  } else {
    el.hidden = true;
  }
}

function updateStaleLockBanner(stale: boolean): void {
  const el = document.getElementById("site-slug-edit-stale-lock-banner");
  if (!el) return;
  el.hidden = !stale;
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

function buildPayloadPreview(
  changedFields: string[],
  after: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of changedFields) {
    payload[field] = after[field];
  }
  return payload;
}

function clearG9PreviewStaleVisual(): void {
  const el = document.getElementById("site-slug-edit-dry-run-result");
  if (!el) return;
  el.classList.remove("site-slug-edit-dry-run-result--stale");
  el.querySelector(".site-slug-edit-dry-run-result__preview-stale")?.remove();
}

function markG9PreviewStale(reason?: string): void {
  invalidateDryRunPreview();
  const el = document.getElementById("site-slug-edit-dry-run-result");
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

  refreshSaveGatePanel();
}

function invalidateDryRunPreview(): void {
  g9g3bDryRunPreviewValid = false;
  lastPreviewVenue = null;
  lastPreviewDescription = null;
  lastPreviewChangedFields = [];
  lastPreviewStale = false;
  g9g3cDryRunPreviewValid = false;
  lastPreviewOpenTime = null;
  lastPreviewStartTime = null;
  lastPreviewPrice = null;
  lastPreviewG9g3cChangedFields = [];
  lastPreviewG9g3cStale = false;
  g9g3dDryRunPreviewValid = false;
  lastPreviewG9g3dChangedFields = [];
  lastPreviewG9g3dFieldValues = {};
  lastPreviewG9g3dStale = false;
  refreshG9G3bSaveButtonState();
  refreshG9G3cSaveButtonState();
  refreshG9G3dSaveButtonState();
  updateStaleLockBanner(false);
  refreshSaveGatePanel();
}

function renderDryRunResult(result: SiteSlugScheduleEditDryRunResult): void {
  const el = document.getElementById("site-slug-edit-dry-run-result");
  if (!el) return;

  clearG9PreviewStaleVisual();

  const hostFailBanner = !result.hostGate.hostGatePassed
    ? `<p class="site-slug-edit-dry-run-result__host-fail" role="alert"><strong>Host gate failed.</strong> ${escapeHtml(result.hostGate.warningMessage ?? "Save path blocked.")}</p>`
    : "";

  const staleBanner = result.optimisticLock.stale
    ? `<p class="site-slug-edit-dry-run-result__stale" role="alert"><strong>STOP — stale optimistic lock.</strong> expectedBeforeUpdatedAt=${escapeHtml(result.optimisticLock.expectedBeforeUpdatedAt ?? "—")} currentUpdatedAt=${escapeHtml(result.optimisticLock.currentUpdatedAt ?? "—")}. Re-run Preview after reload.</p>`
    : "";

  const payloadPreview = buildPayloadPreview(result.changedFields, result.after);

  el.innerHTML = [
    hostFailBanner,
    staleBanner,
    `<p class="site-slug-edit-dry-run-result__message">${escapeHtml(result.message)}</p>`,
    `<div class="site-slug-edit-dry-run-result__chips"><span class="site-slug-edit-dry-run-result__chips-label">changedFields:</span> ${renderChangedFieldChips(result.changedFields)}</div>`,
    `<dl class="site-slug-edit-dry-run-result__meta">`,
    `<div><dt>actualWrite</dt><dd>false</dd></div>`,
    `<div><dt>wouldWrite</dt><dd>${result.wouldWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>changedFields</dt><dd>${escapeHtml(result.changedFields.join(", ") || "—")}</dd></div>`,
    `<div><dt>target.id</dt><dd><code>${escapeHtml(result.target.id)}</code></dd></div>`,
    `<div><dt>target.legacy_id</dt><dd><code>${escapeHtml(result.target.legacy_id ?? "—")}</code></dd></div>`,
    `<div><dt>target.site_slug</dt><dd><code>${escapeHtml(result.target.site_slug)}</code></dd></div>`,
    `<div><dt>optimisticLock.expectedBeforeUpdatedAt</dt><dd>${escapeHtml(result.optimisticLock.expectedBeforeUpdatedAt ?? "—")}</dd></div>`,
    `<div><dt>optimisticLock.currentUpdatedAt</dt><dd>${escapeHtml(result.optimisticLock.currentUpdatedAt ?? "—")}</dd></div>`,
    `<div><dt>optimisticLock.stale</dt><dd>${result.optimisticLock.stale ? "true" : "false"}</dd></div>`,
    `<div><dt>activeHost</dt><dd><code>${escapeHtml(result.hostGate.activeHost)}</code></dd></div>`,
    `<div><dt>expectedHost</dt><dd><code>${escapeHtml(result.hostGate.expectedHost)}</code></dd></div>`,
    `<div><dt>hostGatePassed</dt><dd>${result.hostGate.hostGatePassed ? "true" : "false"}</dd></div>`,
    `</dl>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">payload to write (changed fields only)</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block site-slug-edit-dry-run-result__block--payload">${escapeHtml(JSON.stringify(payloadPreview, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">before</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.before, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">after</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.after, null, 2))}</pre>`,
  ].join("");

  updateStaleLockBanner(result.optimisticLock.stale);
  refreshSaveGatePanel();
}

function refreshPreviewButtonState(): void {
  const btn = document.getElementById("site-slug-edit-dry-run-preview-btn");
  if (!(btn instanceof HTMLButtonElement)) return;

  if (!isPickerDrivenBinding()) {
    btn.disabled = false;
    btn.textContent = "Preview G-9 site_slug general edit dry-run";
    btn.title = "G-9 site_slug changed-fields-only preview — actualWrite=false";
    return;
  }

  const rowBound = hasPickerBoundRow() && parseTargetRow() != null;
  btn.disabled = !rowBound;
  btn.textContent = rowBound
    ? "Preview G-9 site_slug general edit dry-run"
    : "Preview G-9 site_slug general edit dry-run (select row first)";
  btn.title = rowBound
    ? "G-9 site_slug changed-fields-only preview on selected row — actualWrite=false"
    : "Select a row in the picker above first";
}

function refreshSaveGatePanel(): void {
  const el = document.getElementById("site-slug-edit-save-gate-panel");
  if (!el) return;

  const hostGate = getClientHostGate();
  const g9g3dGate = canEnableG9G3dSave();
  const lines: string[] = [];

  if (G9G3D_GENERAL_EDIT_POC_EXECUTED) {
    lines.push(`G-9g3d Save: frozen — ${G9G3D_POC_EXECUTED_ARM_FAILURE}`);
  } else if (isPickerDrivenBinding()) {
    lines.push("G-9g3f3a: General edit binding only — operational Save not implemented");
  } else if (document.getElementById("site-slug-edit-g9g3d-save-btn")) {
    lines.push(
      g9g3dGate.ok
        ? "G-9g3d Save: enabled — operator manual only"
        : `G-9g3d Save: disabled — ${g9g3dGate.reason}`,
    );
  } else {
    lines.push("G-9g3d Save: hidden — arm not configured");
  }

  if (!hostGate.hostGatePassed) {
    lines.push(`Host gate: STOP — ${hostGate.warningMessage ?? "failed"}`);
  } else {
    lines.push(`Host gate: passed (${hostGate.activeHost})`);
  }

  if (stagingAuthSignedIn === false) {
    lines.push("Auth: not signed in — Save blocked");
  } else if (stagingAuthSignedIn === true) {
    lines.push("Auth: staging admin signed in");
  } else {
    lines.push("Auth: checking session…");
  }

  if (isPickerDrivenBinding() && !hasPickerBoundRow()) {
    lines.push("Row picker: no row selected — edit disabled");
  }

  if (isPickerDrivenBinding()) {
    lines.push(
      hasPickerBoundRow()
        ? "Preview: dry-run on selected row (G-9g3f3c hardened)"
        : "Preview: select a row first",
    );
    const resultEl = document.getElementById("site-slug-edit-dry-run-result");
    if (resultEl?.classList.contains("site-slug-edit-dry-run-result--stale")) {
      lines.push(`Preview: ${G9G3F3C_PREVIEW_STALE_MSG}`);
    }
  }

  if (lastPreviewG9g3dStale) {
    lines.push("Optimistic lock: STOP — stale; re-run Preview");
  }

  el.textContent = lines.join(" · ");
}

function renderSaveResult(payload: {
  actualWrite: boolean;
  outcome: Awaited<ReturnType<typeof executeG9G3bVenueDescriptionNonDryRunSave>>;
}): void {
  const el = document.getElementById("site-slug-edit-g9g3b-save-result");
  if (!el) return;

  const result = payload.outcome.result;
  const success = result && "actualWrite" in result && result.actualWrite === true;

  el.innerHTML = [
    `<p class="site-slug-edit-save-result__message">${escapeHtml(
      success
        ? "G-9g3b Save completed — actualWrite=true."
        : payload.outcome.errorMessage ?? "G-9g3b Save did not complete.",
    )}</p>`,
    `<dl class="site-slug-edit-save-result__meta">`,
    `<div><dt>actualWrite</dt><dd>${payload.actualWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID)}</code></dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(payload.outcome.errorCode ?? "—")}</dd></div>`,
    `<div><dt>expectedBeforeUpdatedAt</dt><dd>${escapeHtml(payload.outcome.expectedBeforeUpdatedAt ?? "—")}</dd></div>`,
    `</dl>`,
    result && "afterSnapshot" in result
      ? `<h4 class="site-slug-edit-save-result__subhead">updatedRow</h4><pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify((result as ScheduleWriteResult).afterSnapshot, null, 2))}</pre>`
      : "",
    `<h4 class="site-slug-edit-save-result__subhead">full outcome</h4>`,
    `<pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify(payload.outcome, null, 2))}</pre>`,
  ].join("");

  void refreshAuthWriteDebugPanel();
}

function otherSafeFieldsUnchangedForG9g3b(row: ScheduleRecord): boolean {
  const unchangedFields = ["title", "open_time", "start_time", "price"] as const;
  for (const field of unchangedFields) {
    const current = getFieldValue(field);
    const baseline = row[field] ?? "";
    if (current !== baseline) return false;
  }
  return true;
}

function otherSafeFieldsUnchangedForG9g3c(row: ScheduleRecord): boolean {
  const unchangedFields = ["title", "venue", "description"] as const;
  for (const field of unchangedFields) {
    const current = getFieldValue(field);
    const baseline = row[field] ?? "";
    if (current !== baseline) return false;
  }
  return true;
}

function canEnableG9G3bSave(): { ok: boolean; reason: string } {
  if (isPickerDrivenBinding()) {
    return { ok: false, reason: "G-9g3f3a — Save not implemented" };
  }
  const config = getG9G3bVenueDescriptionPocConfig();
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
      reason: config.armFailureReason ?? "G-9g3b venue+description PoC not armed",
    };
  }
  if (executionInFlight) return { ok: false, reason: "Save in flight" };
  if (!g9g3bDryRunPreviewValid) {
    return { ok: false, reason: "Dry-run preview required" };
  }
  if (lastPreviewStale) return { ok: false, reason: "Stale — re-run preview" };
  if (!changedFieldsMatchVenueDescriptionOnly(lastPreviewChangedFields)) {
    return { ok: false, reason: 'changedFields must be ["venue", "description"] only' };
  }

  const row = parseTargetRow();
  if (!row || row.id !== G9G1_TARGET_ROW_ID) {
    return { ok: false, reason: "Target row mismatch" };
  }
  if (row.legacy_id !== G9G1_TARGET_LEGACY_ID) {
    return { ok: false, reason: "legacy_id mismatch" };
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { ok: false, reason: "site_slug mismatch" };
  }
  if (getFieldValue("venue") !== lastPreviewVenue) {
    return { ok: false, reason: "Venue changed since preview" };
  }
  if (getFieldValue("description") !== lastPreviewDescription) {
    return { ok: false, reason: "Description changed since preview" };
  }
  if (!otherSafeFieldsUnchangedForG9g3b(row)) {
    return { ok: false, reason: "Non-target safe fields changed since load" };
  }
  if (!canUseLiveSupabase()) {
    return { ok: false, reason: "Supabase read source required" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function refreshG9G3bSaveButtonState(): void {
  const btn = document.getElementById("site-slug-edit-g9g3b-save-btn");
  const hint = document.getElementById("site-slug-edit-g9g3b-save-hint");
  if (!btn) return;

  if (isLegacyPoCUiVisible()) {
    (btn as HTMLButtonElement).disabled = true;
    if (hint) {
      hint.textContent = `Audit only — ${G9G3_SLICE_POC_EXECUTED_ARM_FAILURE}`;
    }
    return;
  }

  const { ok, reason } = canEnableG9G3bSave();
  (btn as HTMLButtonElement).disabled = !ok;
  if (hint) {
    hint.textContent = ok
      ? reason
      : `Save venue+description PoC disabled — ${reason}`;
  }
}

function canEnableG9G3cSave(): { ok: boolean; reason: string } {
  if (isPickerDrivenBinding()) {
    return { ok: false, reason: "G-9g3f3a — Save not implemented" };
  }
  const config = getG9G3cTimePricePocConfig();
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
      reason: config.armFailureReason ?? "G-9g3c time+price PoC not armed",
    };
  }
  if (executionInFlight) return { ok: false, reason: "Save in flight" };
  if (!g9g3cDryRunPreviewValid) {
    return { ok: false, reason: "Dry-run preview required" };
  }
  if (lastPreviewG9g3cStale) return { ok: false, reason: "Stale — re-run preview" };
  if (!changedFieldsMatchTimePriceOnly(lastPreviewG9g3cChangedFields)) {
    return {
      ok: false,
      reason: 'changedFields must be ["open_time", "start_time", "price"] only',
    };
  }

  const row = parseTargetRow();
  if (!row || row.id !== G9G1_TARGET_ROW_ID) {
    return { ok: false, reason: "Target row mismatch" };
  }
  if (row.legacy_id !== G9G1_TARGET_LEGACY_ID) {
    return { ok: false, reason: "legacy_id mismatch" };
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { ok: false, reason: "site_slug mismatch" };
  }
  if (getFieldValue("open_time") !== lastPreviewOpenTime) {
    return { ok: false, reason: "open_time changed since preview" };
  }
  if (getFieldValue("start_time") !== lastPreviewStartTime) {
    return { ok: false, reason: "start_time changed since preview" };
  }
  if (getFieldValue("price") !== lastPreviewPrice) {
    return { ok: false, reason: "price changed since preview" };
  }
  if (!otherSafeFieldsUnchangedForG9g3c(row)) {
    return { ok: false, reason: "Non-target safe fields changed since load" };
  }
  if (!canUseLiveSupabase()) {
    return { ok: false, reason: "Supabase read source required" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function refreshG9G3cSaveButtonState(): void {
  const btn = document.getElementById("site-slug-edit-g9g3c-save-btn");
  const hint = document.getElementById("site-slug-edit-g9g3c-save-hint");
  if (!btn) return;

  if (isLegacyPoCUiVisible()) {
    (btn as HTMLButtonElement).disabled = true;
    if (hint) {
      hint.textContent = `Audit only — ${G9G3_SLICE_POC_EXECUTED_ARM_FAILURE}`;
    }
    return;
  }

  const { ok, reason } = canEnableG9G3cSave();
  (btn as HTMLButtonElement).disabled = !ok;
  if (hint) {
    hint.textContent = ok
      ? reason
      : `Save time+price PoC disabled — ${reason}`;
  }
}

function renderG9G3cSaveResult(payload: {
  actualWrite: boolean;
  outcome: Awaited<ReturnType<typeof executeG9G3cTimePriceNonDryRunSave>>;
}): void {
  const el = document.getElementById("site-slug-edit-g9g3c-save-result");
  if (!el) return;

  const result = payload.outcome.result;
  const success = result && "actualWrite" in result && result.actualWrite === true;

  el.innerHTML = [
    `<p class="site-slug-edit-save-result__message">${escapeHtml(
      success
        ? "G-9g3c Save completed — actualWrite=true."
        : payload.outcome.errorMessage ?? "G-9g3c Save did not complete.",
    )}</p>`,
    `<dl class="site-slug-edit-save-result__meta">`,
    `<div><dt>actualWrite</dt><dd>${payload.actualWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(G9G3C_TIME_PRICE_NON_DRY_RUN_APPROVAL_ID)}</code></dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(payload.outcome.errorCode ?? "—")}</dd></div>`,
    `<div><dt>expectedBeforeUpdatedAt</dt><dd>${escapeHtml(payload.outcome.expectedBeforeUpdatedAt ?? "—")}</dd></div>`,
    `</dl>`,
    result && "afterSnapshot" in result
      ? `<h4 class="site-slug-edit-save-result__subhead">updatedRow</h4><pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify((result as ScheduleWriteResult).afterSnapshot, null, 2))}</pre>`
      : "",
    `<h4 class="site-slug-edit-save-result__subhead">full outcome</h4>`,
    `<pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify(payload.outcome, null, 2))}</pre>`,
  ].join("");

  void refreshAuthWriteDebugPanel();
}

function nonChangedSafeFieldsUnchanged(
  row: ScheduleRecord,
  changedFields: string[],
): boolean {
  const changed = new Set(changedFields);
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    if (changed.has(field)) continue;
    const current = getFieldValue(field);
    const baseline = row[field] ?? "";
    if (current !== baseline) return false;
  }
  return true;
}

function canEnableG9G3dSave(): { ok: boolean; reason: string } {
  if (isPickerDrivenBinding()) {
    return { ok: false, reason: "G-9g3f3a — operational Save not implemented" };
  }
  if (G9G3D_GENERAL_EDIT_POC_EXECUTED) {
    return { ok: false, reason: G9G3D_POC_EXECUTED_ARM_FAILURE };
  }

  const config = getG9G3dGeneralEditPocConfig();
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
      reason: config.armFailureReason ?? "G-9g3d general edit not armed",
    };
  }
  if (executionInFlight) return { ok: false, reason: "Save in flight" };
  if (!g9g3dDryRunPreviewValid) {
    return { ok: false, reason: "Dry-run preview required" };
  }
  if (lastPreviewG9g3dStale) return { ok: false, reason: "Stale — re-run preview" };
  if (!changedFieldsSubsetOfSafeFields(lastPreviewG9g3dChangedFields)) {
    return { ok: false, reason: "changedFields must be safe-field subset" };
  }
  if (lastPreviewG9g3dChangedFields.length === 0) {
    return { ok: false, reason: "No changed fields — edit a value before Save" };
  }
  if (stagingAuthSignedIn === false) {
    return { ok: false, reason: "Sign in as staging admin before Save" };
  }
  if (stagingAuthSignedIn === null) {
    return { ok: false, reason: "Checking auth session…" };
  }

  const row = parseTargetRow();
  if (!row || row.id !== G9G1_TARGET_ROW_ID) {
    return { ok: false, reason: "Target row mismatch" };
  }
  if (row.legacy_id !== G9G1_TARGET_LEGACY_ID) {
    return { ok: false, reason: "legacy_id mismatch" };
  }
  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    return { ok: false, reason: "site_slug mismatch" };
  }

  for (const field of lastPreviewG9g3dChangedFields) {
    const current = getFieldValue(field as (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number]);
    if (current !== (lastPreviewG9g3dFieldValues[field] ?? "")) {
      return { ok: false, reason: `${field} changed since preview` };
    }
    if (field === "title" && current.trim() === "") {
      return { ok: false, reason: "title cannot be empty" };
    }
  }

  if (!nonChangedSafeFieldsUnchanged(row, lastPreviewG9g3dChangedFields)) {
    return { ok: false, reason: "Non-changed safe fields modified since load" };
  }
  if (!canUseLiveSupabase()) {
    return { ok: false, reason: "Supabase read source required" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function refreshG9G3dSaveButtonState(): void {
  const btn = document.getElementById("site-slug-edit-g9g3d-save-btn");
  const hint = document.getElementById("site-slug-edit-g9g3d-save-hint");
  if (!btn) return;

  const { ok, reason } = canEnableG9G3dSave();
  (btn as HTMLButtonElement).disabled = !ok;
  if (hint) {
    hint.textContent = ok
      ? reason
      : `Save general edit disabled — ${reason}`;
  }
  refreshSaveGatePanel();
}

function renderG9G3dSaveResult(payload: {
  actualWrite: boolean;
  outcome: Awaited<ReturnType<typeof executeG9G3dGeneralEditNonDryRunSave>>;
}): void {
  const el = document.getElementById("site-slug-edit-g9g3d-save-result");
  if (!el) return;

  const result = payload.outcome.result;
  const success = result && "actualWrite" in result && result.actualWrite === true;

  el.innerHTML = [
    `<p class="site-slug-edit-save-result__message">${escapeHtml(
      success
        ? "G-9g3d Save completed — actualWrite=true."
        : payload.outcome.errorMessage ?? "G-9g3d Save did not complete.",
    )}</p>`,
    `<dl class="site-slug-edit-save-result__meta">`,
    `<div><dt>actualWrite</dt><dd>${payload.actualWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(G9G3D_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID)}</code></dd></div>`,
    `<div><dt>errorCode</dt><dd>${escapeHtml(payload.outcome.errorCode ?? "—")}</dd></div>`,
    `<div><dt>expectedBeforeUpdatedAt</dt><dd>${escapeHtml(payload.outcome.expectedBeforeUpdatedAt ?? "—")}</dd></div>`,
    `</dl>`,
    result && "afterSnapshot" in result
      ? `<h4 class="site-slug-edit-save-result__subhead">updatedRow</h4><pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify((result as ScheduleWriteResult).afterSnapshot, null, 2))}</pre>`
      : "",
    `<h4 class="site-slug-edit-save-result__subhead">full outcome</h4>`,
    `<pre class="site-slug-edit-save-result__block">${escapeHtml(JSON.stringify(payload.outcome, null, 2))}</pre>`,
  ].join("");

  void refreshAuthWriteDebugPanel();
}

async function onPreviewClick(): Promise<void> {
  const pickerMode = isPickerDrivenBinding();
  const row = parseTargetRow();
  const hostGate = getClientHostGate();
  updateHostGateSummary(hostGate);

  const hostGatePreview = {
    activeHost: hostGate.activeHost,
    expectedHost: hostGate.expectedHost,
    hostGatePassed: hostGate.hostGatePassed,
    isKnownProductionHost: hostGate.isKnownProductionHost,
    warningMessage: hostGate.warningMessage,
  };

  const previewPhase = pickerMode
    ? G9G3F3C_PHASE
    : isG9g3dArmed()
      ? G9G3D_PHASE
      : G9G3A_PHASE;

  if (!row) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: previewPhase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: pickerMode
          ? "No row selected — select a row in the picker above."
          : "Target row not loaded — enable Supabase env and reload.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateDryRunPreview();
    return;
  }

  if (pickerMode) {
    if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
      renderDryRunResult(
        buildSiteSlugScheduleEditDryRunError({
          phase: previewPhase,
          siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
          message: "site_slug mismatch — preview blocked.",
          hostGate: hostGatePreview,
        }),
      );
      invalidateDryRunPreview();
      return;
    }
    if (isPocAuditScheduleRow(row)) {
      renderDryRunResult(
        buildSiteSlugScheduleEditDryRunError({
          phase: previewPhase,
          siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
          message: "PoC audit row — preview blocked.",
          hostGate: hostGatePreview,
        }),
      );
      invalidateDryRunPreview();
      return;
    }
  } else if (
    row.id !== G9G1_TARGET_ROW_ID ||
    row.legacy_id !== G9G1_TARGET_LEGACY_ID ||
    row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG
  ) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: previewPhase,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target scope mismatch — preview blocked.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateDryRunPreview();
    return;
  }

  const patch = collectSafeFieldPatch();
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
    phase: previewPhase,
    source: row,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    patch,
    optimisticLock,
    hostGate: hostGatePreview,
  });

  renderDryRunResult(result);

  g9g3bDryRunPreviewValid = true;
  lastPreviewVenue = getFieldValue("venue");
  lastPreviewDescription = getFieldValue("description");
  lastPreviewChangedFields = [...result.changedFields];
  lastPreviewStale = result.optimisticLock.stale;
  g9g3cDryRunPreviewValid = true;
  lastPreviewOpenTime = getFieldValue("open_time");
  lastPreviewStartTime = getFieldValue("start_time");
  lastPreviewPrice = getFieldValue("price");
  lastPreviewG9g3cChangedFields = [...result.changedFields];
  lastPreviewG9g3cStale = result.optimisticLock.stale;
  g9g3dDryRunPreviewValid = true;
  lastPreviewG9g3dChangedFields = [...result.changedFields];
  lastPreviewG9g3dFieldValues = {};
  for (const field of result.changedFields) {
    lastPreviewG9g3dFieldValues[field] = getFieldValue(
      field as (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number],
    );
  }
  lastPreviewG9g3dStale = result.optimisticLock.stale;
  refreshG9G3bSaveButtonState();
  refreshG9G3cSaveButtonState();
  refreshG9G3dSaveButtonState();
  updateStaleLockBanner(false);
  refreshSaveGatePanel();
}

async function onG9g3bSaveClick(): Promise<void> {
  if (isLegacyPoCUiVisible()) return;

  const gate = canEnableG9G3bSave();
  if (!gate.ok) {
    refreshG9G3bSaveButtonState();
    return;
  }

  const row = parseTargetRow();
  if (!row) return;

  executionInFlight = true;
  refreshG9G3bSaveButtonState();

  const { url, anonKey } = getSupabaseEnv();
  const payload = {
    venue: getFieldValue("venue"),
    description: getFieldValue("description"),
  };

  try {
    const outcome = await executeG9G3bVenueDescriptionNonDryRunSave({
      url,
      anonKey,
      beforeSnapshot: row,
      payload,
    });

    const actualWrite =
      outcome.result != null &&
      "actualWrite" in outcome.result &&
      outcome.result.actualWrite === true;

    renderSaveResult({ actualWrite, outcome });

    if (actualWrite && outcome.result && "afterSnapshot" in outcome.result) {
      const root = getRoot();
      if (root) {
        const updated = outcome.result.afterSnapshot as ScheduleRecord;
        root.dataset.targetRow = JSON.stringify(updated);
        const baseline = document.getElementById("site-slug-edit-baseline-updated-at");
        if (baseline) baseline.textContent = updated.updated_at ?? "—";
      }
      invalidateDryRunPreview();
    }
  } finally {
    executionInFlight = false;
    refreshG9G3bSaveButtonState();
  }
}

async function onG9g3cSaveClick(): Promise<void> {
  if (isLegacyPoCUiVisible()) return;

  const gate = canEnableG9G3cSave();
  if (!gate.ok) {
    refreshG9G3cSaveButtonState();
    return;
  }

  const row = parseTargetRow();
  if (!row) return;

  executionInFlight = true;
  refreshG9G3cSaveButtonState();

  const { url, anonKey } = getSupabaseEnv();
  const payload = {
    open_time: getFieldValue("open_time"),
    start_time: getFieldValue("start_time"),
    price: getFieldValue("price"),
  };

  try {
    const outcome = await executeG9G3cTimePriceNonDryRunSave({
      url,
      anonKey,
      beforeSnapshot: row,
      payload,
    });

    const actualWrite =
      outcome.result != null &&
      "actualWrite" in outcome.result &&
      outcome.result.actualWrite === true;

    renderG9G3cSaveResult({ actualWrite, outcome });

    if (actualWrite && outcome.result && "afterSnapshot" in outcome.result) {
      const root = getRoot();
      if (root) {
        const updated = outcome.result.afterSnapshot as ScheduleRecord;
        root.dataset.targetRow = JSON.stringify(updated);
        const baseline = document.getElementById("site-slug-edit-baseline-updated-at");
        if (baseline) baseline.textContent = updated.updated_at ?? "—";
      }
      invalidateDryRunPreview();
    }
  } finally {
    executionInFlight = false;
    refreshG9G3cSaveButtonState();
  }
}

async function onG9g3dSaveClick(): Promise<void> {
  if (G9G3D_GENERAL_EDIT_POC_EXECUTED) {
    refreshG9G3dSaveButtonState();
    return;
  }

  const gate = canEnableG9G3dSave();
  if (!gate.ok) {
    refreshG9G3dSaveButtonState();
    return;
  }

  const row = parseTargetRow();
  if (!row) return;

  executionInFlight = true;
  refreshG9G3dSaveButtonState();

  const { url, anonKey } = getSupabaseEnv();
  const changedFields = [...lastPreviewG9g3dChangedFields];
  const rawValues: Record<string, string> = {};
  for (const field of changedFields) {
    rawValues[field] = getFieldValue(field as (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number]);
  }
  const payload = buildG9G3dGeneralEditPayload(changedFields, rawValues);

  try {
    const outcome = await executeG9G3dGeneralEditNonDryRunSave({
      url,
      anonKey,
      beforeSnapshot: row,
      payload,
      changedFields,
    });

    const actualWrite =
      outcome.result != null &&
      "actualWrite" in outcome.result &&
      outcome.result.actualWrite === true;

    renderG9G3dSaveResult({ actualWrite, outcome });

    if (actualWrite && outcome.result && "afterSnapshot" in outcome.result) {
      const root = getRoot();
      if (root) {
        const updated = outcome.result.afterSnapshot as ScheduleRecord;
        root.dataset.targetRow = JSON.stringify(updated);
        const baseline = document.getElementById("site-slug-edit-baseline-updated-at");
        if (baseline) baseline.textContent = updated.updated_at ?? "—";
        updateLoadedValueDisplays(updated);
      }
      invalidateDryRunPreview();
    }
  } finally {
    executionInFlight = false;
    refreshG9G3dSaveButtonState();
  }
}

function updateLoadedValueDisplays(row: ScheduleRecord): void {
  const map: Record<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], string> = {
    title: "site-slug-edit-loaded-title",
    venue: "site-slug-edit-loaded-venue",
    open_time: "site-slug-edit-loaded-open-time",
    start_time: "site-slug-edit-loaded-start-time",
    price: "site-slug-edit-loaded-price",
    description: "site-slug-edit-loaded-description",
  };
  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    const el = document.getElementById(map[field]);
    if (el) el.textContent = row[field] ?? "—";
  }
}

function applyG9G3bDefaultFieldValues(row: ScheduleRecord | null): void {
  if (G9G3D_GENERAL_EDIT_POC_EXECUTED) return;
  if (!isLegacyPoCUiVisible() || !isG9g3bArmed() || !row) return;

  const venueInput = document.getElementById(
    "site-slug-edit-dry-run-venue",
  ) as HTMLInputElement | null;
  const descriptionInput = document.getElementById(
    "site-slug-edit-dry-run-description",
  ) as HTMLTextAreaElement | null;

  if (venueInput && !venueInput.value.trim()) {
    venueInput.value = G9G3B_VENUE_POC_DEFAULT;
  }
  if (
    descriptionInput &&
    (!descriptionInput.value.trim() || descriptionInput.value === "出演：")
  ) {
    descriptionInput.value = G9G3B_DESCRIPTION_POC_DEFAULT;
  }
}

function applyG9G3cDefaultFieldValues(row: ScheduleRecord | null): void {
  if (G9G3D_GENERAL_EDIT_POC_EXECUTED) return;
  if (!isLegacyPoCUiVisible() || !isG9g3cArmed() || !row) return;

  const openInput = document.getElementById(
    "site-slug-edit-dry-run-open-time",
  ) as HTMLInputElement | null;
  const startInput = document.getElementById(
    "site-slug-edit-dry-run-start-time",
  ) as HTMLInputElement | null;
  const priceInput = document.getElementById(
    "site-slug-edit-dry-run-price",
  ) as HTMLInputElement | null;

  if (openInput && !openInput.value.trim()) {
    openInput.value = G9G3C_OPEN_TIME_POC_DEFAULT;
  }
  if (startInput && !startInput.value.trim()) {
    startInput.value = G9G3C_START_TIME_POC_DEFAULT;
  }
  if (priceInput && !priceInput.value.trim()) {
    priceInput.value = G9G3C_PRICE_POC_DEFAULT;
  }
}

function initSiteSlugEditUi(): void {
  const root = getRoot();
  if (!root) return;

  initPickerEditBinding({
    invalidateDryRunPreview,
    markG9PreviewStale,
    refreshSaveButtonStates: () => {
      refreshG9G3bSaveButtonState();
      refreshG9G3cSaveButtonState();
      refreshG9G3dSaveButtonState();
    },
    refreshSaveGatePanel,
    refreshPreviewButtonState,
    clearDryRunResultPlaceholder: (message: string) => {
      clearG9PreviewStaleVisual();
      const el = document.getElementById("site-slug-edit-dry-run-result");
      if (el) {
        el.innerHTML = `<p class="site-slug-edit-dry-run-result__placeholder" role="status">${escapeHtml(message)}</p>`;
      }
    },
  });

  document
    .getElementById("site-slug-edit-dry-run-preview-btn")
    ?.addEventListener("click", () => {
      void onPreviewClick();
    });

  document.getElementById("site-slug-edit-g9g3b-save-btn")?.addEventListener("click", () => {
    void onG9g3bSaveClick();
  });

  document.getElementById("site-slug-edit-g9g3c-save-btn")?.addEventListener("click", () => {
    void onG9g3cSaveClick();
  });

  document.getElementById("site-slug-edit-g9g3d-save-btn")?.addEventListener("click", () => {
    void onG9g3dSaveClick();
  });

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    document.getElementById(SAFE_FIELD_INPUT_IDS[field])?.addEventListener("input", () => {
      if (isPickerDrivenBinding()) {
        markG9PreviewStale(G9G3F3C_PREVIEW_STALE_MSG);
        return;
      }
      const resultEl = document.getElementById("site-slug-edit-dry-run-result");
      if (resultEl) {
        resultEl.innerHTML =
          '<p class="site-slug-edit-dry-run-result__placeholder">Fields changed — click Preview dry-run again.</p>';
      }
      invalidateDryRunPreview();
    });
  }

  const hostGate = getClientHostGate();
  updateHostGateSummary(hostGate);

  const row = parseTargetRow();
  applyG9G3bDefaultFieldValues(row);
  applyG9G3cDefaultFieldValues(row);
  void refreshStagingAuthSignedIn().then(() => {
    refreshG9G3bSaveButtonState();
    refreshG9G3cSaveButtonState();
    refreshG9G3dSaveButtonState();
    refreshPreviewButtonState();
    refreshSaveGatePanel();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteSlugEditUi);
} else {
  initSiteSlugEditUi();
}
