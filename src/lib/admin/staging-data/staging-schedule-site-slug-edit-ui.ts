/**
 * G-9g1 / G-9g2 / G-9g3a / G-9g3b — Browser UI for site_slug schedule edit (staging shell only).
 * G-9g3b: gated Save venue+description PoC. Preview: actualWrite=false always.
 */

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
import {
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  G9G3B_DESCRIPTION_POC_DEFAULT,
  G9G3B_PHASE,
  G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID,
  G9G3B_VENUE_POC_DEFAULT,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { executeG9G3bVenueDescriptionNonDryRunSave } from "../staging-write/staging-schedule-site-slug-venue-description-poc-save";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import type { ScheduleWriteResult } from "../staging-write/schedule-write-types";

const SAFE_FIELD_INPUT_IDS: Record<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], string> = {
  title: "site-slug-edit-dry-run-title",
  venue: "site-slug-edit-dry-run-venue",
  open_time: "site-slug-edit-dry-run-open-time",
  start_time: "site-slug-edit-dry-run-start-time",
  price: "site-slug-edit-dry-run-price",
  description: "site-slug-edit-dry-run-description",
};

const G9G3B_CHANGED_FIELDS = ["venue", "description"] as const;

let g9g3bDryRunPreviewValid = false;
let lastPreviewVenue: string | null = null;
let lastPreviewDescription: string | null = null;
let lastPreviewChangedFields: string[] = [];
let lastPreviewStale = false;
let executionInFlight = false;

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
}

function changedFieldsMatchVenueDescriptionOnly(fields: string[]): boolean {
  if (fields.length !== G9G3B_CHANGED_FIELDS.length) return false;
  const sorted = [...fields].sort();
  const expected = [...G9G3B_CHANGED_FIELDS].sort();
  return sorted.every((field, index) => field === expected[index]);
}

function invalidateDryRunPreview(): void {
  g9g3bDryRunPreviewValid = false;
  lastPreviewVenue = null;
  lastPreviewDescription = null;
  lastPreviewChangedFields = [];
  lastPreviewStale = false;
  refreshG9G3bSaveButtonState();
}

function renderDryRunResult(result: SiteSlugScheduleEditDryRunResult): void {
  const el = document.getElementById("site-slug-edit-dry-run-result");
  if (!el) return;

  const hostFailBanner = !result.hostGate.hostGatePassed
    ? `<p class="site-slug-edit-dry-run-result__host-fail" role="alert"><strong>Host gate failed.</strong> ${escapeHtml(result.hostGate.warningMessage ?? "Save path blocked.")}</p>`
    : "";

  const staleBanner = result.optimisticLock.stale
    ? `<p class="site-slug-edit-dry-run-result__stale" role="alert"><strong>Stale row detected.</strong> Preview only — Save remains unavailable.</p>`
    : "";

  el.innerHTML = [
    hostFailBanner,
    staleBanner,
    `<p class="site-slug-edit-dry-run-result__message">${escapeHtml(result.message)}</p>`,
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
    `<h4 class="site-slug-edit-dry-run-result__subhead">before</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.before, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">after</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.after, null, 2))}</pre>`,
  ].join("");
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

function otherSafeFieldsUnchanged(row: ScheduleRecord): boolean {
  const unchangedFields = ["title", "open_time", "start_time", "price"] as const;
  for (const field of unchangedFields) {
    const current = getFieldValue(field);
    const baseline = row[field] ?? "";
    if (current !== baseline) return false;
  }
  return true;
}

function canEnableG9G3bSave(): { ok: boolean; reason: string } {
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
  if (!otherSafeFieldsUnchanged(row)) {
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

  const { ok, reason } = canEnableG9G3bSave();
  (btn as HTMLButtonElement).disabled = !ok;
  if (hint) {
    hint.textContent = ok
      ? reason
      : `Save venue+description PoC disabled — ${reason}`;
  }
}

async function onPreviewClick(): Promise<void> {
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

  if (!row) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G3B_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target row not loaded — enable Supabase env and reload.",
        hostGate: hostGatePreview,
      }),
    );
    invalidateDryRunPreview();
    return;
  }

  if (
    row.id !== G9G1_TARGET_ROW_ID ||
    row.legacy_id !== G9G1_TARGET_LEGACY_ID ||
    row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG
  ) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G3B_PHASE,
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
    phase: G9G3B_PHASE,
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
  refreshG9G3bSaveButtonState();
}

async function onSaveClick(): Promise<void> {
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

function applyG9G3bDefaultFieldValues(row: ScheduleRecord | null): void {
  if (!isG9g3bArmed() || !row) return;

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

function initSiteSlugEditUi(): void {
  const root = getRoot();
  if (!root) return;

  document
    .getElementById("site-slug-edit-dry-run-preview-btn")
    ?.addEventListener("click", () => {
      void onPreviewClick();
    });

  document.getElementById("site-slug-edit-g9g3b-save-btn")?.addEventListener("click", () => {
    void onSaveClick();
  });

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    document.getElementById(SAFE_FIELD_INPUT_IDS[field])?.addEventListener("input", () => {
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
  refreshG9G3bSaveButtonState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteSlugEditUi);
} else {
  initSiteSlugEditUi();
}
