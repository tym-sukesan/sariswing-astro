/**
 * G-9g1 — Browser UI for site_slug schedule edit dry-run (staging shell only).
 * Preview only — no Save, no Supabase write.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  buildSiteSlugScheduleEditDryRunError,
  buildSiteSlugScheduleEditDryRunResult,
  type SiteSlugScheduleEditDryRunResult,
} from "./staging-schedule-site-slug-edit-dry-run";
import {
  G9G1_PHASE,
  G9G1_TARGET_ROW_ID,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { runDryRunStaleCheck } from "../staging-write/schedule-optimistic-lock-dry-run";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";

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
    `<h4 class="site-slug-edit-dry-run-result__subhead">full result</h4>`,
    `<pre class="site-slug-edit-dry-run-result__block">${escapeHtml(JSON.stringify(result, null, 2))}</pre>`,
  ].join("");
}

async function onPreviewClick(): Promise<void> {
  const root = getRoot();
  const row = parseTargetRow();
  const titleInput = document.getElementById(
    "site-slug-edit-dry-run-title",
  ) as HTMLInputElement | null;

  if (!root || !row) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G1_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target row not loaded — enable Supabase env and reload.",
      }),
    );
    return;
  }

  if (row.id !== G9G1_TARGET_ROW_ID) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G1_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "Target row id mismatch — preview blocked.",
      }),
    );
    return;
  }

  if (row.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    renderDryRunResult(
      buildSiteSlugScheduleEditDryRunError({
        phase: G9G1_PHASE,
        siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
        message: "site_slug scope mismatch — preview blocked.",
      }),
    );
    return;
  }

  const title = titleInput?.value ?? "";
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
}

function initSiteSlugEditDryRunUi(): void {
  const root = getRoot();
  if (!root) return;

  const previewBtn = document.getElementById("site-slug-edit-dry-run-preview-btn");
  previewBtn?.addEventListener("click", () => {
    void onPreviewClick();
  });

  const row = parseTargetRow();
  const titleInput = document.getElementById(
    "site-slug-edit-dry-run-title",
  ) as HTMLInputElement | null;
  if (titleInput && row?.title != null) {
    titleInput.value = row.title;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSiteSlugEditDryRunUi);
} else {
  initSiteSlugEditDryRunUi();
}
