/**
 * G-9g1 / G-9g2 / G-9g3a — Browser UI for site_slug schedule edit (staging shell only).
 * G-9g3a: multi-field dry-run preview + host hard gate. Preview: actualWrite=false only.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  buildSiteSlugScheduleEditDryRunError,
  buildSiteSlugScheduleEditDryRunResult,
  sanitizeSiteSlugEditSafeFieldPatch,
  type SiteSlugEditSafeFieldPatch,
  type SiteSlugScheduleEditDryRunResult,
} from "./staging-schedule-site-slug-edit-dry-run";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import {
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  G9G3A_PHASE,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";

const SAFE_FIELD_INPUT_IDS: Record<(typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number], string> = {
  title: "site-slug-edit-dry-run-title",
  venue: "site-slug-edit-dry-run-venue",
  open_time: "site-slug-edit-dry-run-open-time",
  start_time: "site-slug-edit-dry-run-start-time",
  price: "site-slug-edit-dry-run-price",
  description: "site-slug-edit-dry-run-description",
};

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

function isG9g3aSaveHidden(): boolean {
  const root = getRoot();
  return root?.dataset.g9g3aSaveHidden === "true";
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
        phase: G9G3A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target row not loaded — enable Supabase env and reload.",
        hostGate: hostGatePreview,
      }),
    );
    return;
  }

  if (
    row.id !== G9G1_TARGET_ROW_ID ||
    row.legacy_id !== G9G1_TARGET_LEGACY_ID ||
    row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG
  ) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G3A_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target scope mismatch — preview blocked.",
        hostGate: hostGatePreview,
      }),
    );
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
    phase: G9G3A_PHASE,
    source: row,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    patch,
    optimisticLock,
    hostGate: hostGatePreview,
  });

  renderDryRunResult(result);
}

function initSiteSlugEditUi(): void {
  const root = getRoot();
  if (!root) return;

  document
    .getElementById("site-slug-edit-dry-run-preview-btn")
    ?.addEventListener("click", () => {
      void onPreviewClick();
    });

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    document.getElementById(SAFE_FIELD_INPUT_IDS[field])?.addEventListener("input", () => {
      const resultEl = document.getElementById("site-slug-edit-dry-run-result");
      if (resultEl) {
        resultEl.innerHTML =
          '<p class="site-slug-edit-dry-run-result__placeholder">Fields changed — click Preview dry-run again.</p>';
      }
    });
  }

  const hostGate = getClientHostGate();
  updateHostGateSummary(hostGate);

  if (isG9g3aSaveHidden()) {
    return;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteSlugEditUi);
} else {
  initSiteSlugEditUi();
}
