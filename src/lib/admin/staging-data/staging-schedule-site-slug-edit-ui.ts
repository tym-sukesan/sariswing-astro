/**
 * G-9g1 / G-9g2 — Browser UI for site_slug schedule edit (staging shell only).
 * Preview: actualWrite=false. Save: operator manual only — not auto-clicked.
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  buildSiteSlugScheduleEditDryRunError,
  buildSiteSlugScheduleEditDryRunResult,
  type SiteSlugScheduleEditDryRunResult,
} from "./staging-schedule-site-slug-edit-dry-run";
import { getG9G2TitlePocConfig } from "./staging-schedule-site-slug-title-poc-config";
import {
  G9G1_PHASE,
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  G9G2_TITLE_NON_DRY_RUN_APPROVAL_ID,
  G9G2_TITLE_POC_DEFAULT_TITLE,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { executeG9G2TitleNonDryRunSave } from "../staging-write/staging-schedule-site-slug-title-poc-save";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import type { ScheduleWriteResult } from "../staging-write/schedule-write-types";

let g9g2DryRunPreviewValid = false;
let lastPreviewTitle: string | null = null;
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

function isG9G2Armed(): boolean {
  const root = getRoot();
  return root?.dataset.g9g2Armed === "true";
}

function getTitleInputValue(): string {
  const el = document.getElementById(
    "site-slug-edit-dry-run-title",
  ) as HTMLInputElement | null;
  return el?.value ?? "";
}

function invalidateDryRunPreview(): void {
  g9g2DryRunPreviewValid = false;
  lastPreviewTitle = null;
  lastPreviewChangedFields = [];
  lastPreviewStale = false;
  refreshG9G2SaveButtonState();
}

function renderDryRunResult(result: SiteSlugScheduleEditDryRunResult): void {
  const el = document.getElementById("site-slug-edit-dry-run-result");
  if (!el) return;

  const staleClass = result.optimisticLock.stale
    ? "site-slug-edit-dry-run-result__stale"
    : "site-slug-edit-dry-run-result__fresh";

  const staleBanner = result.optimisticLock.stale
    ? `<p class="${staleClass}" role="alert"><strong>Stale row detected. Preview only. Save remains unavailable.</strong></p>`
    : "";

  el.innerHTML = [
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
    `</dl>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">before</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.before, null, 2))}</pre>`,
    `<h4 class="site-slug-edit-dry-run-result__subhead">after</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result.after, null, 2))}</pre>`,
  ].join("");
}

function renderSaveResult(payload: {
  actualWrite: boolean;
  outcome: Awaited<ReturnType<typeof executeG9G2TitleNonDryRunSave>>;
}): void {
  const el = document.getElementById("site-slug-edit-g9g2-save-result");
  if (!el) return;

  const result = payload.outcome.result;
  const success = result && "actualWrite" in result && result.actualWrite === true;

  el.innerHTML = [
    `<p class="site-slug-edit-save-result__message">${escapeHtml(
      success
        ? "G-9g2 Save completed — actualWrite=true."
        : payload.outcome.errorMessage ?? "G-9g2 Save did not complete.",
    )}</p>`,
    `<dl class="site-slug-edit-save-result__meta">`,
    `<div><dt>actualWrite</dt><dd>${payload.actualWrite ? "true" : "false"}</dd></div>`,
    `<div><dt>approvalId</dt><dd><code>${escapeHtml(G9G2_TITLE_NON_DRY_RUN_APPROVAL_ID)}</code></dd></div>`,
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

function canEnableG9G2Save(): { ok: boolean; reason: string } {
  const config = getG9G2TitlePocConfig();
  if (!config.saveEnabled) {
    return {
      ok: false,
      reason: config.armFailureReason ?? "G-9g2 title PoC not armed",
    };
  }
  if (executionInFlight) return { ok: false, reason: "Save in flight" };
  if (!g9g2DryRunPreviewValid) {
    return { ok: false, reason: "Dry-run preview required" };
  }
  if (lastPreviewStale) return { ok: false, reason: "Stale — re-run preview" };
  if (
    lastPreviewChangedFields.length !== 1 ||
    !lastPreviewChangedFields.includes("title")
  ) {
    return { ok: false, reason: 'changedFields must be ["title"] only' };
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
  if (getTitleInputValue() !== lastPreviewTitle) {
    return { ok: false, reason: "Title changed since preview" };
  }
  if (!canUseLiveSupabase()) {
    return { ok: false, reason: "Supabase read source required" };
  }
  return { ok: true, reason: "Ready (manual Save only — not auto-clicked)" };
}

function refreshG9G2SaveButtonState(): void {
  const btn = document.getElementById("site-slug-edit-g9g2-save-btn");
  const hint = document.getElementById("site-slug-edit-g9g2-save-hint");
  if (!btn) return;

  const { ok, reason } = canEnableG9G2Save();
  (btn as HTMLButtonElement).disabled = !ok;
  if (hint) hint.textContent = ok ? reason : `Save title PoC disabled — ${reason}`;
}

async function onPreviewClick(): Promise<void> {
  const row = parseTargetRow();
  const title = getTitleInputValue();

  if (!row) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G1_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target row not loaded — enable Supabase env and reload.",
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
        phase: G9G1_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target scope mismatch — preview blocked.",
      }),
    );
    invalidateDryRunPreview();
    return;
  }

  const live = canUseLiveSupabase();
  const { url, anonKey } = getSupabaseEnv();

  const optimisticLock = await runDryRunStaleCheck({
    url,
    anonKey,
    scheduleId: row.id,
    baselineUpdatedAt: row.updated_at ?? null,
    liveSupabaseRead: live,
  });

  const result = buildSiteSlugScheduleEditDryRunResult({
    phase: G9G1_PHASE,
    source: row,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    patch: { title },
    optimisticLock,
  });

  renderDryRunResult(result);

  g9g2DryRunPreviewValid = true;
  lastPreviewTitle = title;
  lastPreviewChangedFields = [...result.changedFields];
  lastPreviewStale = result.optimisticLock.stale;
  refreshG9G2SaveButtonState();
}

async function onSaveClick(): Promise<void> {
  const gate = canEnableG9G2Save();
  if (!gate.ok) {
    refreshG9G2SaveButtonState();
    return;
  }

  const row = parseTargetRow();
  if (!row) return;

  executionInFlight = true;
  refreshG9G2SaveButtonState();

  const { url, anonKey } = getSupabaseEnv();
  const title = getTitleInputValue();

  try {
    const outcome = await executeG9G2TitleNonDryRunSave({
      url,
      anonKey,
      beforeSnapshot: row,
      payload: { title },
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
    refreshG9G2SaveButtonState();
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

  document.getElementById("site-slug-edit-g9g2-save-btn")?.addEventListener("click", () => {
    void onSaveClick();
  });

  document
    .getElementById("site-slug-edit-dry-run-title")
    ?.addEventListener("input", () => {
      invalidateDryRunPreview();
    });

  const row = parseTargetRow();
  const titleInput = document.getElementById(
    "site-slug-edit-dry-run-title",
  ) as HTMLInputElement | null;
  if (titleInput && row?.title != null && titleInput.value === "") {
    titleInput.value = row.title;
  }

  if (isG9G2Armed() && titleInput && titleInput.value === "<>") {
    titleInput.value = G9G2_TITLE_POC_DEFAULT_TITLE;
  }

  refreshG9G2SaveButtonState();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteSlugEditUi);
} else {
  initSiteSlugEditUi();
}
