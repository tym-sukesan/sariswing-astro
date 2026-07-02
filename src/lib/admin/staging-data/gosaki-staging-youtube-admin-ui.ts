/**
 * Gosaki staging shell — YouTube admin UI (G-10c static JSON write slice; default Save disabled).
 */

import {
  buildYoutubeNocookieEmbedUrl,
  GOSAKI_YOUTUBE_DEFAULT_IFRAME_TITLE,
  parseYoutubeVideoId,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";
import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import {
  evaluateG10cYoutubeEmbedSaveUiGate,
  getG10cYoutubeEmbedStaticJsonWriteConfig,
} from "../staging-write/gosaki-youtube-embed-static-json-write-config";
import {
  executeG10cYoutubeEmbedStaticJsonClientSave,
  type G10cYoutubeEmbedClientSaveOutcome,
} from "../staging-write/gosaki-youtube-embed-static-json-write-client-save";
import {
  executeG10cYoutubeEmbedStaticJsonWriteDryRun,
  formatG10cDryRunPublished,
  type G10cYoutubeEmbedDryRunResult,
} from "../staging-write/gosaki-youtube-embed-static-json-write-dry-run";
import { readG10cSaveButtonPageConfigFromDom } from "../staging-write/gosaki-youtube-embed-static-json-write-page-config";
import {
  G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
  type G10cYoutubeEmbedConfigSnapshot,
  type G10cYoutubeEmbedItemSnapshot,
} from "../staging-write/gosaki-youtube-embed-static-json-write-types";

const G10C_FIELD_LABELS: Record<string, string> = {
  embedCode: "埋め込みコード",
  published: "公開",
};

let configSnapshot: G10cYoutubeEmbedConfigSnapshot | null = null;
let beforeItemSnapshot: G10cYoutubeEmbedItemSnapshot | null = null;
let lastDryRunResult: G10cYoutubeEmbedDryRunResult | null = null;
let stagingAuthSignedIn: boolean | null = null;
let saveInFlight = false;

function isG10cOperatorSaveEnabled(): boolean {
  return getG10cYoutubeEmbedStaticJsonWriteConfig().saveEnabled;
}

function operatorSaveDisabledMessage(): string {
  return "保存が必要な場合は戸山が代行します。";
}

function operatorSaveDisabledDryRunCompleteMessage(): string {
  return "保存は無効です。確認のみ完了しました。";
}

function operatorSaveEnabledMessage(): string {
  return "保存が有効です。内容を確認し、「更新する」を1回だけ押すとJSONに反映されます。";
}

function operatorSavePrepMessage(): string {
  if (isG10cOperatorSaveEnabled()) {
    return "「変更を確認」で内容を確認してから「更新する」を押してください。";
  }
  return `「変更を確認」で内容を確認できます。${operatorSaveDisabledMessage()}`;
}

function setSaveButtonNote(text: string | null): void {
  const note = document.getElementById("gosaki-yt-update-btn-note");
  if (!note) return;
  if (!text) {
    note.hidden = true;
    note.textContent = "";
    return;
  }
  note.hidden = false;
  note.textContent = text;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayDryRunValue(value: string | boolean | null | undefined): string {
  if (typeof value === "boolean") return formatG10cDryRunPublished(value);
  const trimmed = String(value ?? "").trim();
  return trimmed || "（空）";
}

function readG10cFormValues(): { embedCode: string; published: boolean } {
  const embedEl = document.getElementById(
    "gosaki-yt-g10c-embed-code",
  ) as HTMLTextAreaElement | null;
  const publishedEl = document.getElementById(
    "gosaki-yt-g10c-published",
  ) as HTMLInputElement | null;
  return {
    embedCode: (embedEl?.value ?? "").trim(),
    published: publishedEl?.checked === true,
  };
}

function renderLivePreview(): void {
  const preview = document.getElementById("gosaki-yt-g10c-live-preview");
  const videoIdEl = document.getElementById("gosaki-yt-g10c-video-id");
  if (!preview || !videoIdEl) return;

  const { embedCode } = readG10cFormValues();
  const videoId = parseYoutubeVideoId(embedCode);
  videoIdEl.textContent = videoId ?? "—";

  if (!videoId) {
    preview.innerHTML =
      '<p class="admin-gosaki-operator-empty">埋め込みコードを貼り付けると、ここに動画が表示されます。</p>';
    return;
  }

  const embedUrl = buildYoutubeNocookieEmbedUrl(videoId);
  const title = GOSAKI_YOUTUBE_DEFAULT_IFRAME_TITLE;
  preview.innerHTML = `<div class="gosaki-youtube-admin-preview__media">
    <iframe src="${embedUrl}" title="${title}" loading="lazy" allowfullscreen></iframe>
  </div>`;
}

function parsePageDataset(): void {
  const root = document.getElementById("gosaki-youtube-operator");
  if (!root) return;

  const configRaw = root.dataset.g10cConfig;
  const itemRaw = root.dataset.g10cBeforeItem;
  try {
    configSnapshot = configRaw ? (JSON.parse(configRaw) as G10cYoutubeEmbedConfigSnapshot) : null;
    beforeItemSnapshot = itemRaw
      ? (JSON.parse(itemRaw) as G10cYoutubeEmbedItemSnapshot)
      : null;
  } catch {
    configSnapshot = null;
    beforeItemSnapshot = null;
  }
}

function renderGuardErrorList(errors: string[]): string {
  if (errors.length === 0) return "";
  const items = errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("");
  return `<ul class="gosaki-schedule-edit-dry-run__guard-errors">${items}</ul>`;
}

function renderChangedFieldChips(changedFields: string[]): string {
  if (changedFields.length === 0) {
    return '<span class="gosaki-schedule-edit-dry-run__chip gosaki-schedule-edit-dry-run__chip--empty">なし</span>';
  }
  return changedFields
    .map((field) => {
      const label = G10C_FIELD_LABELS[field] ?? field;
      return `<span class="gosaki-schedule-edit-dry-run__chip">${escapeHtml(label)}</span>`;
    })
    .join("");
}

function renderPayloadKeys(keys: string[]): string {
  if (keys.length === 0) {
    return '<span class="gosaki-schedule-edit-dry-run__chip gosaki-schedule-edit-dry-run__chip--empty">なし</span>';
  }
  return keys
    .map((key) => `<span class="gosaki-schedule-edit-dry-run__chip"><code>${escapeHtml(key)}</code></span>`)
    .join("");
}

function renderBeforeAfterRows(result: G10cYoutubeEmbedDryRunResult): string {
  return result.changedFields
    .map((field) => {
      const label = G10C_FIELD_LABELS[field] ?? field;
      const before = displayDryRunValue(result.before[field as keyof typeof result.before]);
      const after = displayDryRunValue(result.after[field as keyof typeof result.after]);
      return `<tr>
        <th scope="row">${escapeHtml(label)}</th>
        <td class="gosaki-schedule-edit-dry-run__before">${escapeHtml(before)}</td>
        <td class="gosaki-schedule-edit-dry-run__after">${escapeHtml(after)}</td>
      </tr>`;
    })
    .join("");
}

function renderDryRunOutcomeNote(
  saveReadiness: G10cYoutubeEmbedDryRunResult["saveReadiness"],
): string {
  if (saveReadiness === "ready_but_save_disabled") {
    return "";
  }
  if (saveReadiness === "ready_to_save") {
    return `<p class="gosaki-schedule-edit-dry-run__note">この確認では JSON ファイルは変更されません。保存はまだ実行されません。</p>`;
  }
  return "";
}

function updateSaveButtonState(result: G10cYoutubeEmbedDryRunResult | null): void {
  const button = document.getElementById(
    "gosaki-yt-g10c-update-btn",
  ) as HTMLButtonElement | null;
  if (!button) return;

  const gate = evaluateG10cYoutubeEmbedSaveUiGate({
    signedIn: stagingAuthSignedIn === true,
    dryRunResult: result,
  });

  button.disabled = !gate.enabled || saveInFlight;
  if (gate.enabled && !saveInFlight) {
    button.removeAttribute("data-gosaki-yt-action-disabled");
    button.setAttribute("data-gosaki-save-allowed", "true");
    button.title = "変更内容を JSON に保存します";
    button.textContent = "更新する";
    setSaveButtonNote(operatorSaveEnabledMessage());
    return;
  }

  button.setAttribute("data-gosaki-yt-action-disabled", "");
  button.setAttribute("data-gosaki-save-allowed", "false");

  if (!result) {
    button.textContent = "更新する（準備中）";
    button.title = gate.reason;
    setSaveButtonNote(operatorSavePrepMessage());
    return;
  }

  if (result.saveReadiness === "ready_but_save_disabled" && result.ok) {
    button.textContent = "更新する（保存無効）";
    button.title = gate.reason;
    setSaveButtonNote(null);
    return;
  }

  button.textContent = "更新する（保存不可）";
  button.title = gate.reason;
  if (result.saveReadiness === "no_changes") {
    setSaveButtonNote("変更がありません。保存できません。");
  } else {
    setSaveButtonNote(gate.reason || "確認エラーがあります。保存できません。");
  }
}

function renderDryRunResult(result: G10cYoutubeEmbedDryRunResult): void {
  const el = document.getElementById("gosaki-yt-g10c-dry-run-result");
  if (!el) return;

  el.hidden = false;
  el.classList.remove(
    "gosaki-schedule-edit-dry-run--ok",
    "gosaki-schedule-edit-dry-run--empty",
    "gosaki-schedule-edit-dry-run--error",
    "gosaki-schedule-edit-dry-run--ready",
  );

  updateSaveButtonState(result);

  const noChanges = result.saveReadiness === "no_changes";
  const hasGuardFailure = !result.ok && result.guardErrors.length > 0;

  if (noChanges) {
    el.classList.add("gosaki-schedule-edit-dry-run--empty");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">変更された項目はありません。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認では JSON ファイルは変更されません。保存はできません。</p>
    `;
    return;
  }

  if (hasGuardFailure) {
    el.classList.add("gosaki-schedule-edit-dry-run--error");
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
      <p class="gosaki-schedule-edit-dry-run__message">確認できませんでした。入力内容を確認してください。</p>
      ${renderGuardErrorList(result.guardErrors)}
      <p class="gosaki-schedule-edit-dry-run__note">この確認では JSON ファイルは変更されません。保存はまだ実行されません。</p>
    `;
    return;
  }

  el.classList.add("gosaki-schedule-edit-dry-run--ok", "gosaki-schedule-edit-dry-run--ready");
  const saveReadyMessage =
    result.saveReadiness === "ready_to_save"
      ? "保存準備OK。更新できます"
      : operatorSaveDisabledDryRunCompleteMessage();

  const normalizedBlock =
    result.normalized.videoId != null
      ? `<dl class="gosaki-schedule-edit-dry-run__target">
          <div><dt>videoId</dt><dd><code>${escapeHtml(result.normalized.videoId)}</code></dd></div>
          <div><dt>embedUrl</dt><dd><code>${escapeHtml(result.normalized.embedUrl ?? "—")}</code></dd></div>
          <div><dt>watchUrl</dt><dd><code>${escapeHtml(result.normalized.watchUrl ?? "—")}</code></dd></div>
        </dl>`
      : "";

  el.innerHTML = `
    <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
    <p class="gosaki-schedule-edit-dry-run__message gosaki-schedule-edit-dry-run__message--ready">
      ${escapeHtml(saveReadyMessage)}
    </p>
    <dl class="gosaki-schedule-edit-dry-run__target">
      <div><dt>対象 item</dt><dd><code>${escapeHtml(result.target.itemId)}</code></dd></div>
      <div><dt>config path</dt><dd><code>${escapeHtml(result.target.configPath)}</code></dd></div>
      <div><dt>siteSlug</dt><dd><code>${escapeHtml(result.target.siteSlug || "—")}</code></dd></div>
      <div><dt>approvalId</dt><dd><code>${escapeHtml(result.approvalId)}</code></dd></div>
    </dl>
    ${normalizedBlock}
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">changedFields</span>
      ${renderChangedFieldChips(result.changedFields)}
    </div>
    <div class="gosaki-schedule-edit-dry-run__chips">
      <span class="gosaki-schedule-edit-dry-run__chips-label">payload keys</span>
      ${renderPayloadKeys(result.payloadKeys)}
    </div>
    <div class="gosaki-schedule-edit-dry-run__diff-wrap">
      <table class="gosaki-schedule-edit-dry-run__diff">
        <thead>
          <tr>
            <th scope="col">項目</th>
            <th scope="col">変更前</th>
            <th scope="col">変更後</th>
          </tr>
        </thead>
        <tbody>${renderBeforeAfterRows(result)}</tbody>
      </table>
    </div>
    <p class="gosaki-schedule-edit-dry-run__lock">
      安全確認: <code>itemsAffected</code> 必須 = ${String(result.itemsAffectedRequired)}
    </p>
    ${renderDryRunOutcomeNote(result.saveReadiness)}
  `;
}

function renderSaveResult(outcome: G10cYoutubeEmbedClientSaveOutcome): void {
  const el = document.getElementById("gosaki-yt-g10c-save-result");
  if (!el) return;
  el.hidden = false;

  if (outcome.ok) {
    el.className = "gosaki-schedule-edit-save-result gosaki-schedule-edit-save-result--ok";
    el.innerHTML = `
      <h3 class="gosaki-schedule-edit-save-result__title">保存結果</h3>
      <p class="gosaki-schedule-edit-save-result__message">JSON への保存に成功しました（itemsAffected: ${String(outcome.itemsAffected ?? 1)}）。</p>
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
  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    stagingAuthSignedIn = false;
    updateSaveButtonState(lastDryRunResult);
    return false;
  }
  try {
    const auth = await getStagingAuthSessionDetails(url, anonKey);
    stagingAuthSignedIn = isSignedInStagingAuth(auth);
  } catch {
    stagingAuthSignedIn = false;
  }
  updateSaveButtonState(lastDryRunResult);
  return stagingAuthSignedIn === true;
}

async function runG10cDryRun(): Promise<void> {
  const el = document.getElementById("gosaki-yt-g10c-dry-run-result");
  if (!configSnapshot || !beforeItemSnapshot) {
    if (el) {
      el.hidden = false;
      el.className = "gosaki-schedule-edit-dry-run gosaki-schedule-edit-dry-run--error";
      el.innerHTML = `
        <h3 class="gosaki-schedule-edit-dry-run__title">確認結果</h3>
        <p class="gosaki-schedule-edit-dry-run__message">対象 item（${escapeHtml(G10C_YOUTUBE_EMBED_TARGET_ITEM_ID)}）が見つかりません。</p>
      `;
    }
    updateSaveButtonState(null);
    return;
  }

  const signedIn = await refreshStagingAuthSignedIn();
  const result = executeG10cYoutubeEmbedStaticJsonWriteDryRun({
    config: configSnapshot,
    beforeItem: beforeItemSnapshot,
    formValues: readG10cFormValues(),
    signedIn,
  });
  lastDryRunResult = result;
  renderDryRunResult(result);
}

async function runG10cSave(): Promise<void> {
  const config = getG10cYoutubeEmbedStaticJsonWriteConfig();
  if (!config.saveEnabled) {
    const pageConfig = readG10cSaveButtonPageConfigFromDom();
    if (!pageConfig?.saveButtonSaveEnabled) {
      window.alert(
        "保存は無効です。開発用の Save 有効化が必要です（G-10c 相当の env stack）。",
      );
      return;
    }
    window.alert(config.armFailureReason ?? "G-10c Save env arm / approval stack が未設定です。");
    return;
  }

  if (!configSnapshot || !beforeItemSnapshot || !lastDryRunResult?.ok) {
    window.alert("先に「変更を確認」で dry-run を成功させてください。");
    return;
  }

  const gate = evaluateG10cYoutubeEmbedSaveUiGate({
    signedIn: stagingAuthSignedIn === true,
    dryRunResult: lastDryRunResult,
  });
  if (!gate.enabled) {
    window.alert(gate.reason);
    return;
  }

  if (
    !window.confirm(
      "この内容で YouTube 埋め込み設定を JSON に保存します。よろしいですか？（1 item のみ更新）",
    )
  ) {
    return;
  }

  saveInFlight = true;
  updateSaveButtonState(lastDryRunResult);

  const url = String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  const outcome = await executeG10cYoutubeEmbedStaticJsonClientSave({
    url,
    anonKey,
    config: configSnapshot,
    beforeItem: beforeItemSnapshot,
    formValues: readG10cFormValues(),
    saveBinding: {
      changedFields: [...lastDryRunResult.changedFields],
      payloadKeys: [...lastDryRunResult.payloadKeys],
      dryRunOk: lastDryRunResult.ok,
    },
  });

  saveInFlight = false;
  renderSaveResult(outcome);
  updateSaveButtonState(lastDryRunResult);
}

function wireDisabledLegacyActions(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-gosaki-yt-action-disabled]").forEach((button) => {
    if (button.id === "gosaki-yt-g10c-update-btn") return;
    button.disabled = true;
    button.title = "保存は次フェーズで開放予定です";
  });
}

function wireLocalReorder(): void {
  const list = document.getElementById("gosaki-yt-item-list");
  list?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "[data-gosaki-yt-move]",
    );
    if (!button) return;

    const item = button.closest<HTMLElement>(".gosaki-youtube-admin-item");
    if (!item) return;

    const direction = button.dataset.gosakiYtMove;
    if (direction === "up" && item.previousElementSibling) {
      list.insertBefore(item, item.previousElementSibling);
    } else if (direction === "down" && item.nextElementSibling) {
      list.insertBefore(item.nextElementSibling, item);
    }
  });
}

function wireAddFormPreview(): void {
  document.getElementById("gosaki-yt-add-embed-code")?.addEventListener("input", () => {
    const preview = document.getElementById("gosaki-yt-add-preview");
    if (!preview) return;
    const embedCode = (
      document.getElementById("gosaki-yt-add-embed-code") as HTMLTextAreaElement | null
    )?.value.trim();
    const videoId = parseYoutubeVideoId(embedCode ?? "");
    if (!videoId) {
      preview.innerHTML =
        '<p class="admin-gosaki-operator-empty">埋め込みコードを貼り付けると、ここに動画が表示されます。</p>';
      return;
    }
    const embedUrl = buildYoutubeNocookieEmbedUrl(videoId);
    const title = GOSAKI_YOUTUBE_DEFAULT_IFRAME_TITLE;
    preview.innerHTML = `<div class="gosaki-youtube-admin-preview__media">
      <iframe src="${embedUrl}" title="${title}" loading="lazy" allowfullscreen></iframe>
    </div>`;
  });
}

export function initGosakiStagingYoutubeAdminUi(): void {
  if (!document.getElementById("gosaki-youtube-operator")) return;

  parsePageDataset();
  wireDisabledLegacyActions();
  wireLocalReorder();
  wireAddFormPreview();

  document
    .getElementById("gosaki-yt-g10c-embed-code")
    ?.addEventListener("input", () => {
      renderLivePreview();
      lastDryRunResult = null;
      updateSaveButtonState(null);
    });
  document.getElementById("gosaki-yt-g10c-published")?.addEventListener("change", () => {
    lastDryRunResult = null;
    updateSaveButtonState(null);
  });

  document.getElementById("gosaki-yt-g10c-dry-run-btn")?.addEventListener("click", () => {
    void runG10cDryRun();
  });
  document.getElementById("gosaki-yt-g10c-update-btn")?.addEventListener("click", () => {
    void runG10cSave();
  });

  renderLivePreview();
  setSaveButtonNote(operatorSavePrepMessage());
  updateSaveButtonState(null);
  void refreshStagingAuthSignedIn();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingYoutubeAdminUi();
  });
}
