/**
 * Gosaki staging shell — About HTML content admin UI (G-10h4a profile + G-10h4c bands dry-run).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_API_PATH,
  parseG10h4cDryRunApiJsonResponse,
  type G10h4cDryRunApiJsonBody,
} from "../staging-write/gosaki-about-bands-html-static-json-write-api";
import {
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_API_PATH,
  parseG10h4aDryRunApiJsonResponse,
  type G10h4aDryRunApiJsonBody,
} from "../staging-write/gosaki-about-profile-html-static-json-write-api";
import {
  evaluateG10h4aAboutProfileHtmlSaveUiGate,
  getG10h4aAboutProfileHtmlStaticJsonWriteConfig,
} from "../staging-write/gosaki-about-profile-html-static-json-write-config";
import { executeG10h4bAboutProfileHtmlStaticJsonClientSave } from "../staging-write/gosaki-about-profile-html-static-json-write-client-save";
import {
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_SITE_SLUG,
  G10H4A_TARGET_BLOCK_ID,
} from "../staging-write/gosaki-about-profile-html-static-json-write-types";
import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
} from "../staging-write/gosaki-about-bands-html-static-json-write-types";

let lastProfileDryRunBody: G10h4aDryRunApiJsonBody | null = null;
let lastBandsDryRunBody: G10h4cDryRunApiJsonBody | null = null;
let profileDryRunInFlight = false;
let bandsDryRunInFlight = false;
let saveInFlight = false;
let stagingAuthSignedIn = false;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readProfileHtml(): string {
  const textarea = document.getElementById(
    "gosaki-about-html-source-profile",
  ) as HTMLTextAreaElement | null;
  return textarea?.value ?? "";
}

function updateProfileHtmlLength(): void {
  const lengthEl = document.getElementById("gosaki-about-profile-html-length");
  if (lengthEl) {
    lengthEl.textContent = readProfileHtml().length.toLocaleString("ja-JP");
  }
}

function renderProfileLivePreview(): void {
  const preview = document.getElementById("gosaki-about-preview-profile");
  if (!preview) return;
  preview.innerHTML = readProfileHtml();
  updateProfileHtmlLength();
}

function readBandsHtml(): string {
  const textarea = document.getElementById(
    "gosaki-about-html-source-bands",
  ) as HTMLTextAreaElement | null;
  return textarea?.value ?? "";
}

function updateBandsHtmlLength(): void {
  const lengthEl = document.getElementById("gosaki-about-bands-html-length");
  if (lengthEl) {
    lengthEl.textContent = readBandsHtml().length.toLocaleString("ja-JP");
  }
}

function renderBandsLivePreview(): void {
  const preview = document.getElementById("gosaki-about-preview-bands");
  if (!preview) return;
  preview.innerHTML = readBandsHtml();
  updateBandsHtmlLength();
}

function wireBandsSaveDisabled(): void {
  const saveButton = document.getElementById(
    "gosaki-about-bands-save-btn",
  ) as HTMLButtonElement | null;
  if (!saveButton) return;
  saveButton.disabled = true;
  saveButton.setAttribute("aria-disabled", "true");
}

function setSaveButtonNote(message: string | null): void {
  const note = document.getElementById("gosaki-about-profile-save-note");
  if (!note) return;
  note.textContent =
    message ??
    "※ dry-run 成功後、env が有効な場合のみ Save できます。about-bands-html は対象外です。";
}

function updateSaveButtonState(body: G10h4aDryRunApiJsonBody | null): void {
  const saveButton = document.getElementById(
    "gosaki-about-profile-save-btn",
  ) as HTMLButtonElement | null;
  if (!saveButton) return;

  const gate = evaluateG10h4aAboutProfileHtmlSaveUiGate({
    signedIn: stagingAuthSignedIn,
    dryRunResult: body,
  });

  saveButton.disabled = !gate.enabled || saveInFlight;
  saveButton.setAttribute("aria-disabled", saveButton.disabled ? "true" : "false");

  if (gate.enabled && !saveInFlight) {
    saveButton.textContent = "保存する";
    saveButton.title = "about-profile-html の html のみ JSON に保存します";
    setSaveButtonNote("dry-run OK — Save を1回だけ実行できます。");
    return;
  }

  const config = getG10h4aAboutProfileHtmlStaticJsonWriteConfig();
  if (!config.saveEnabled) {
    saveButton.textContent = "保存する（env disabled）";
    saveButton.title = gate.reason;
    setSaveButtonNote("保存は無効です（G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED=false）。");
    return;
  }

  if (!body?.ok) {
    saveButton.textContent = "保存する（dry-run 未確認）";
    saveButton.title = gate.reason;
    setSaveButtonNote("先に dry-run を成功させてください。");
    return;
  }

  if ((body.changedFields ?? []).length === 0) {
    saveButton.textContent = "保存する（変更なし）";
    saveButton.title = gate.reason;
    setSaveButtonNote("変更がありません。保存できません。");
    return;
  }

  saveButton.textContent = "保存する（不可）";
  saveButton.title = gate.reason;
  setSaveButtonNote(gate.reason || "Save 条件を満たしていません。");
}

function wireSaveDisabled(): void {
  updateSaveButtonState(null);
}

function renderList(items: string[]): string {
  if (items.length === 0) return "<li>なし</li>";
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderChangedFieldChips(changedFields: string[]): string {
  if (!changedFields.length) {
    return '<span class="gosaki-schedule-edit-dry-run__chip gosaki-schedule-edit-dry-run__chip--empty">なし</span>';
  }
  return changedFields
    .map((field) => `<span class="gosaki-schedule-edit-dry-run__chip"><code>${escapeHtml(field)}</code></span>`)
    .join("");
}

function renderProfileDryRunResult(body: G10h4aDryRunApiJsonBody, httpOk: boolean): void {
  const el = document.getElementById("gosaki-about-profile-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--ready",
  );

  if (!httpOk || body.ok !== true) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">dry-run 結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">確認できませんでした。</p>
      <p><code>${escapeHtml(body.errorCode ?? "dry_run_failed")}</code>: ${escapeHtml(body.errorMessage ?? "")}</p>
      <ul class="gosaki-schedule-edit-dry-run__guard-errors">${renderList(body.guardErrors ?? [])}</ul>
      <p class="gosaki-schedule-edit-dry-run__note">wouldWrite: false / dryRun: true — JSON は変更されません。</p>
    `;
    return;
  }

  const noChanges = (body.changedFields ?? []).length === 0;
  if (noChanges) {
    el.classList.add("gosaki-schedule-edit-dry-run--empty");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">dry-run 結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">変更された項目はありません。</p>
      <dl class="gosaki-schedule-edit-dry-run__target">
        <div><dt>approvalId</dt><dd><code>${escapeHtml(body.approvalId ?? "")}</code></dd></div>
        <div><dt>blockId</dt><dd><code>${escapeHtml(body.blockId ?? "")}</code></dd></div>
        <div><dt>target path</dt><dd><code>${escapeHtml(body.targetPath ?? "")}</code></dd></div>
        <div><dt>old length</dt><dd>${String(body.oldLength ?? 0)}</dd></div>
        <div><dt>new length</dt><dd>${String(body.newLength ?? 0)}</dd></div>
        <div><dt>length delta</dt><dd>${String(body.lengthDelta ?? 0)}</dd></div>
        <div><dt>blocksAffected</dt><dd>${String(body.blocksAffected ?? 1)}</dd></div>
        <div><dt>wouldWrite</dt><dd>false</dd></div>
        <div><dt>dryRun</dt><dd>true</dd></div>
      </dl>
      <p class="gosaki-schedule-edit-dry-run__note">JSON ファイルは変更されません。</p>
    `;
    return;
  }

  el.classList.add("gosaki-schedule-edit-dry-run--ok", "gosaki-schedule-edit-dry-run--ready");
  const safety = body.htmlSafety;
  const saveNote =
    body.saveReadiness === "ready_to_save"
      ? "保存準備OK。env が有効な場合は Save できます。"
      : body.saveAllowed
        ? "Save env は有効ですが、dry-run 条件を確認してください。"
        : "保存は無効です。dry-run のみ完了しました。";

  updateSaveButtonState(body);

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">dry-run 結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(saveNote)}
    </p>
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>approvalId</dt><dd><code>${escapeHtml(body.approvalId ?? "")}</code></dd></div>
      <div><dt>siteSlug</dt><dd><code>${escapeHtml(body.siteSlug ?? "")}</code></dd></div>
      <div><dt>blockId</dt><dd><code>${escapeHtml(body.blockId ?? "")}</code></dd></div>
      <div><dt>target path</dt><dd><code>${escapeHtml(body.targetPath ?? "")}</code></dd></div>
      <div><dt>old length</dt><dd>${String(body.oldLength ?? 0)}</dd></div>
      <div><dt>new length</dt><dd>${String(body.newLength ?? 0)}</dd></div>
      <div><dt>length delta</dt><dd>${String(body.lengthDelta ?? 0)}</dd></div>
      <div><dt>blocksAffected</dt><dd>${String(body.blocksAffected ?? 1)}</dd></div>
      <div><dt>wouldWrite</dt><dd>false</dd></div>
      <div><dt>dryRun</dt><dd>true</dd></div>
      <div><dt>saveAllowed</dt><dd>${body.saveAllowed ? "true" : "false"}</dd></div>
    </dl>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span>
      ${renderChangedFieldChips(body.changedFields ?? [])}
    </div>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">html safety</span>
      <span class="gosaki-schedule-edit-dry-run__chip">${safety?.ok ? "OK" : "NG"}</span>
    </div>
    ${
      safety?.warnings?.length
        ? `<p class="gosaki-schedule-edit-dry-run__note">warnings: ${escapeHtml(safety.warnings.join(" "))}</p>`
        : ""
    }
    <p class="gosaki-schedule-edit-dry-run__note">この確認では JSON ファイルは変更されません。</p>
  `;
}

function renderBandsDryRunResult(body: G10h4cDryRunApiJsonBody, httpOk: boolean): void {
  const el = document.getElementById("gosaki-about-bands-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--ready",
  );

  if (!httpOk || body.ok !== true) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">dry-run 結果（bands）</h3>
      <p class="gosaki-schedule-edit-dry-run__message">確認できませんでした。</p>
      <p><code>${escapeHtml(body.errorCode ?? "dry_run_failed")}</code>: ${escapeHtml(body.errorMessage ?? "")}</p>
      <ul class="gosaki-schedule-edit-dry-run__guard-errors">${renderList(body.guardErrors ?? [])}</ul>
      <p class="gosaki-schedule-edit-dry-run__note">wouldWrite: false / dryRun: true — JSON は変更されません。</p>
    `;
    return;
  }

  const noChanges = (body.changedFields ?? []).length === 0;
  if (noChanges) {
    el.classList.add("gosaki-schedule-edit-dry-run--empty");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">dry-run 結果（bands）</h3>
      <p class="gosaki-schedule-edit-dry-run__message">変更された項目はありません。</p>
      <dl class="gosaki-schedule-edit-dry-run__target">
        <div><dt>approvalId</dt><dd><code>${escapeHtml(body.approvalId ?? "")}</code></dd></div>
        <div><dt>siteSlug</dt><dd><code>${escapeHtml(body.siteSlug ?? "")}</code></dd></div>
        <div><dt>blockId</dt><dd><code>${escapeHtml(body.blockId ?? "")}</code></dd></div>
        <div><dt>target path</dt><dd><code>${escapeHtml(body.targetPath ?? "")}</code></dd></div>
        <div><dt>old length</dt><dd>${String(body.oldLength ?? 0)}</dd></div>
        <div><dt>new length</dt><dd>${String(body.newLength ?? 0)}</dd></div>
        <div><dt>length delta</dt><dd>${String(body.lengthDelta ?? 0)}</dd></div>
        <div><dt>blocksAffected</dt><dd>${String(body.blocksAffected ?? 1)}</dd></div>
        <div><dt>wouldWrite</dt><dd>false</dd></div>
        <div><dt>dryRun</dt><dd>true</dd></div>
      </dl>
      <p class="gosaki-schedule-edit-dry-run__note">JSON ファイルは変更されません。</p>
    `;
    return;
  }

  el.classList.add("gosaki-schedule-edit-dry-run--ok", "gosaki-schedule-edit-dry-run--ready");
  const safety = body.htmlSafety;
  const saveNote = body.saveAllowed
    ? "Save env は有効ですが、G-10h4c では non-dry-run は未実装です。"
    : "保存は無効です。dry-run のみ完了しました。";

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">dry-run 結果（bands）</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(saveNote)}
    </p>
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>approvalId</dt><dd><code>${escapeHtml(body.approvalId ?? "")}</code></dd></div>
      <div><dt>siteSlug</dt><dd><code>${escapeHtml(body.siteSlug ?? "")}</code></dd></div>
      <div><dt>blockId</dt><dd><code>${escapeHtml(body.blockId ?? "")}</code></dd></div>
      <div><dt>target path</dt><dd><code>${escapeHtml(body.targetPath ?? "")}</code></dd></div>
      <div><dt>old length</dt><dd>${String(body.oldLength ?? 0)}</dd></div>
      <div><dt>new length</dt><dd>${String(body.newLength ?? 0)}</dd></div>
      <div><dt>length delta</dt><dd>${String(body.lengthDelta ?? 0)}</dd></div>
      <div><dt>blocksAffected</dt><dd>${String(body.blocksAffected ?? 1)}</dd></div>
      <div><dt>wouldWrite</dt><dd>false</dd></div>
      <div><dt>dryRun</dt><dd>true</dd></div>
      <div><dt>saveAllowed</dt><dd>${body.saveAllowed ? "true" : "false"}</dd></div>
    </dl>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span>
      ${renderChangedFieldChips(body.changedFields ?? [])}
    </div>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">html safety</span>
      <span class="gosaki-schedule-edit-dry-run__chip">${safety?.ok ? "OK" : "NG"}</span>
    </div>
    ${
      safety?.warnings?.length
        ? `<p class="gosaki-schedule-edit-dry-run__note">warnings: ${escapeHtml(safety.warnings.join(" "))}</p>`
        : ""
    }
    <p class="gosaki-schedule-edit-dry-run__note">この確認では JSON ファイルは変更されません。</p>
  `;
}

function renderSaveResult(outcome: {
  ok: boolean;
  blocksAffected?: number;
  changedFields?: string[];
  errorCode?: string;
  errorMessage?: string;
}): void {
  const el = document.getElementById("gosaki-about-profile-save-result");
  if (!el) return;
  el.hidden = false;

  if (outcome.ok) {
    el.className = "gosaki-schedule-edit-save-result gosaki-schedule-edit-save-result--ok";
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-save-result__title">保存結果</h3>
      <p class="gosaki-schedule-edit-save-result__message">
        JSON への保存に成功しました（blocksAffected: ${String(outcome.blocksAffected ?? 1)}）。
      </p>
      <p class="gosaki-schedule-edit-dry-run__note">changedFields: ${escapeHtml((outcome.changedFields ?? ["html"]).join(", "))}</p>
      <p class="gosaki-schedule-edit-dry-run__note">公開反映には convert / build / manual upload が別途必要です。</p>
    `;
    return;
  }

  el.className = "gosaki-schedule-edit-save-result gosaki-schedule-edit-save-result--error";
  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-save-result__title">保存結果</h3>
    <p class="gosaki-schedule-edit-save-result__message">保存できませんでした。</p>
    <p><code>${escapeHtml(outcome.errorCode ?? "unknown")}</code>: ${escapeHtml(outcome.errorMessage ?? "")}</p>
  `;
}

async function refreshStagingAuthSignedIn(): Promise<boolean> {
  const authRequired =
    import.meta.env.ENABLE_ADMIN_STAGING_AUTH === "true" ||
    import.meta.env.PUBLIC_ENABLE_ADMIN_STAGING_AUTH === "true";
  if (!authRequired) {
    stagingAuthSignedIn = true;
    updateSaveButtonState(lastProfileDryRunBody);
    return true;
  }

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    stagingAuthSignedIn = false;
    updateSaveButtonState(lastProfileDryRunBody);
    return false;
  }

  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    stagingAuthSignedIn = isSignedInStagingAuth(auth);
  } catch {
    stagingAuthSignedIn = false;
  }
  updateSaveButtonState(lastProfileDryRunBody);
  return stagingAuthSignedIn;
}

async function getBearerToken(): Promise<string | null> {
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return null;
  const client = getStagingSupabaseClient(url, anonKey);
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

async function ensureStagingAuthForDryRun(): Promise<boolean> {
  const authRequired =
    import.meta.env.ENABLE_ADMIN_STAGING_AUTH === "true" ||
    import.meta.env.PUBLIC_ENABLE_ADMIN_STAGING_AUTH === "true";
  if (!authRequired) return true;

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) return false;

  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    return isSignedInStagingAuth(auth);
  } catch {
    return false;
  }
}

async function runProfileDryRun(): Promise<void> {
  if (profileDryRunInFlight) return;

  const signedIn = await ensureStagingAuthForDryRun();
  if (!signedIn) {
    window.alert("staging admin にログインしてから dry-run を実行してください。");
    return;
  }

  profileDryRunInFlight = true;
  const button = document.getElementById("gosaki-about-profile-dry-run-btn") as HTMLButtonElement | null;
  if (button) button.disabled = true;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = await getBearerToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_API_PATH, {
      method: "POST",
      headers,
      body: JSON.stringify({
        approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
        siteSlug: G10H4A_SITE_SLUG,
        blockId: G10H4A_TARGET_BLOCK_ID,
        html: readProfileHtml(),
        dryRun: true,
      }),
    });

    const parsed = await parseG10h4aDryRunApiJsonResponse(response);
    if (!parsed.ok) {
      renderProfileDryRunResult(
        {
          ok: false,
          errorCode: parsed.errorCode,
          errorMessage: parsed.errorMessage,
          dryRun: true,
          wouldWrite: false,
        },
        false,
      );
      return;
    }

    lastProfileDryRunBody = parsed.body;
    renderProfileDryRunResult(parsed.body, parsed.status < 400);
    await refreshStagingAuthSignedIn();
  } catch (error) {
    renderProfileDryRunResult(
      {
        ok: false,
        errorCode: "network_error",
        errorMessage: error instanceof Error ? error.message : String(error),
        dryRun: true,
        wouldWrite: false,
      },
      false,
    );
  } finally {
    profileDryRunInFlight = false;
    if (button) button.disabled = false;
  }
}

async function runBandsDryRun(): Promise<void> {
  if (bandsDryRunInFlight) return;

  const signedIn = await ensureStagingAuthForDryRun();
  if (!signedIn) {
    window.alert("staging admin にログインしてから dry-run を実行してください。");
    return;
  }

  bandsDryRunInFlight = true;
  const button = document.getElementById("gosaki-about-bands-dry-run-btn") as HTMLButtonElement | null;
  if (button) button.disabled = true;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = await getBearerToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_API_PATH, {
      method: "POST",
      headers,
      body: JSON.stringify({
        approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
        siteSlug: G10H4C_SITE_SLUG,
        blockId: G10H4C_TARGET_BLOCK_ID,
        html: readBandsHtml(),
        dryRun: true,
      }),
    });

    const parsed = await parseG10h4cDryRunApiJsonResponse(response);
    if (!parsed.ok) {
      renderBandsDryRunResult(
        {
          ok: false,
          errorCode: parsed.errorCode,
          errorMessage: parsed.errorMessage,
          dryRun: true,
          wouldWrite: false,
        },
        false,
      );
      return;
    }

    lastBandsDryRunBody = parsed.body;
    renderBandsDryRunResult(parsed.body, parsed.status < 400);
  } catch (error) {
    renderBandsDryRunResult(
      {
        ok: false,
        errorCode: "network_error",
        errorMessage: error instanceof Error ? error.message : String(error),
        dryRun: true,
        wouldWrite: false,
      },
      false,
    );
  } finally {
    bandsDryRunInFlight = false;
    if (button) button.disabled = false;
  }
}

async function runProfileSave(): Promise<void> {
  const config = getG10h4aAboutProfileHtmlStaticJsonWriteConfig();
  if (!config.saveEnabled) {
    window.alert("保存は無効です（G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED=false）。");
    return;
  }

  if (!lastProfileDryRunBody?.ok) {
    window.alert("先に dry-run を成功させてください。");
    return;
  }

  const gate = evaluateG10h4aAboutProfileHtmlSaveUiGate({
    signedIn: stagingAuthSignedIn,
    dryRunResult: lastProfileDryRunBody,
  });
  if (!gate.enabled) {
    window.alert(gate.reason);
    return;
  }

  if (
    !window.confirm(
      "about-profile-html の html のみ JSON に保存します。よろしいですか？（1 block のみ更新）",
    )
  ) {
    return;
  }

  saveInFlight = true;
  updateSaveButtonState(lastProfileDryRunBody);

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const outcome = await executeG10h4bAboutProfileHtmlStaticJsonClientSave({
    url,
    anonKey,
    formValues: { html: readProfileHtml() },
    saveBinding: {
      changedFields: [...(lastProfileDryRunBody.changedFields ?? [])],
      dryRunOk: lastProfileDryRunBody.ok === true,
      saveReadiness: lastProfileDryRunBody.saveReadiness,
    },
  });

  saveInFlight = false;
  renderSaveResult({
    ok: outcome.ok,
    blocksAffected: outcome.blocksAffected,
    changedFields: outcome.changedFields,
    errorCode: outcome.errorCode,
    errorMessage: outcome.errorMessage,
  });
  updateSaveButtonState(lastProfileDryRunBody);
}

export function initGosakiStagingAboutContentAdminUi(): void {
  const root = document.getElementById("gosaki-about-operator");
  if (!root) return;

  wireBandsSaveDisabled();
  wireSaveDisabled();

  const profileEditor = document.getElementById("gosaki-about-html-source-profile");
  profileEditor?.addEventListener("input", () => {
    renderProfileLivePreview();
    lastProfileDryRunBody = null;
    const result = document.getElementById("gosaki-about-profile-dry-run-result");
    if (result) result.hidden = true;
    updateSaveButtonState(null);
  });

  document.getElementById("gosaki-about-profile-dry-run-btn")?.addEventListener("click", () => {
    void runProfileDryRun();
  });

  document.getElementById("gosaki-about-profile-save-btn")?.addEventListener("click", () => {
    void runProfileSave();
  });

  const bandsEditor = document.getElementById("gosaki-about-html-source-bands");
  bandsEditor?.addEventListener("input", () => {
    renderBandsLivePreview();
    lastBandsDryRunBody = null;
    const result = document.getElementById("gosaki-about-bands-dry-run-result");
    if (result) result.hidden = true;
  });

  document.getElementById("gosaki-about-bands-dry-run-btn")?.addEventListener("click", () => {
    void runBandsDryRun();
  });

  document.getElementById("gosaki-about-bands-save-btn")?.addEventListener("click", () => {
    window.alert("G-10h4c では bands の non-dry-run Save は未実装です。");
  });

  renderProfileLivePreview();
  renderBandsLivePreview();
  void refreshStagingAuthSignedIn();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingAboutContentAdminUi();
  });
}
