/**
 * Gosaki YouTube multi-item admin helpers + Edge items dry-run / gated Save wiring.
 * Backward compatible with legacy single-item + items[] configs via normalizeGosakiYoutubeConfig.
 *
 * Edge contract (same functions as single-item):
 * - dry-run: field=items · G-11c7-gosaki-youtube-items-dry-run
 * - save: field=items · G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice
 * - approval + server arm (GOSAKI_YOUTUBE_URL_SAVE_ARMED) + GitHub SHA fingerprint required
 * Normal STG keeps client arm false — no Contents PUT from this UI by default.
 */

import type { GosakiYoutubeEmbedConfig, GosakiYoutubeEmbedItem } from "./gosaki-youtube-embed";
import {
  buildYoutubeNocookieEmbedUrl,
  buildYoutubeWatchUrl,
  normalizeGosakiYoutubeConfig,
  parseYoutubeVideoId,
} from "./gosaki-youtube-embed";
import {
  GOSAKI_CLIENT_SAVE_DISARMED_REASON,
  GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE,
  isClientSaveArmed,
  isGosakiSaveNotArmedResponse,
  userMessageForSaveFailure,
} from "./gosaki-staging-one-click-save";

export type YoutubeMultiDraftItem = {
  id: string;
  published: boolean;
  sortOrder: number;
  embedCode: string;
  title?: string;
};

export type YoutubeMultiLocalDryRun = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  changedItemIds: string[];
  publishedCount: number;
  itemCount: number;
  nextItems: YoutubeMultiDraftItem[];
  /** Design-only Save payload preview — not sent in this phase. */
  savePayloadPreview: {
    siteSlug: string;
    sectionTitle: string;
    items: YoutubeMultiDraftItem[];
  };
  /** Dual Edge contract: items[] mode (G-11c7) alongside legacy single nextValue. */
  edgeItemsContract: {
    dryRunOperationId: string;
    saveOperationId: string;
    field: string;
    note: string;
  };
};

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function newYoutubeItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `yt-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `yt-${Date.now().toString(36)}`;
}

export function draftItemsFromConfig(
  config: GosakiYoutubeEmbedConfig | null | undefined,
): YoutubeMultiDraftItem[] {
  const { items } = normalizeGosakiYoutubeConfig(config);
  return items
    .map((item, index) => ({
      id: String(item.id || `legacy-${index + 1}`).trim() || `legacy-${index + 1}`,
      published: item.published === true,
      sortOrder: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : (index + 1) * 10,
      embedCode: String(item.embedCode ?? item.sourceUrl ?? item.videoId ?? "").trim(),
      title: item.title ? String(item.title) : undefined,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id, "ja"));
}

/** Deep-clone draft items so baseline and edit state never share object/array refs. */
export function cloneYoutubeDraftItems(
  list: YoutubeMultiDraftItem[] | null | undefined,
): YoutubeMultiDraftItem[] {
  return (list ?? []).map((item) => ({
    id: String(item.id ?? ""),
    published: item.published === true,
    sortOrder: Number(item.sortOrder) || 0,
    embedCode: String(item.embedCode ?? ""),
    ...(item.title != null ? { title: String(item.title) } : {}),
  }));
}

/** Fingerprint used for dirty detection (id / published / sortOrder / embedCode). */
export function youtubeDraftItemsFingerprint(
  list: YoutubeMultiDraftItem[] | null | undefined,
): string {
  return JSON.stringify(
    (list ?? []).map((i) => ({
      id: i.id,
      published: i.published === true,
      sortOrder: Number(i.sortOrder) || 0,
      embedCode: String(i.embedCode ?? ""),
    })),
  );
}

export function isYoutubeDraftDirty(
  baseline: YoutubeMultiDraftItem[] | null | undefined,
  current: YoutubeMultiDraftItem[] | null | undefined,
): boolean {
  return youtubeDraftItemsFingerprint(current) !== youtubeDraftItemsFingerprint(baseline);
}

export function validateYoutubeEmbedInput(raw: string): {
  ok: boolean;
  videoId: string | null;
  error: string | null;
} {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) {
    return { ok: false, videoId: null, error: "URL / 埋め込みコードを入力してください" };
  }
  if (/<script|javascript:/i.test(trimmed)) {
    return { ok: false, videoId: null, error: "不正な埋め込みコードです" };
  }
  const videoId = parseYoutubeVideoId(trimmed);
  if (!videoId) {
    return {
      ok: false,
      videoId: null,
      error: "有効な YouTube URL / iframe / videoId ではありません",
    };
  }
  return { ok: true, videoId, error: null };
}

export function buildYoutubeMultiLocalDryRun(input: {
  siteSlug?: string;
  sectionTitle?: string;
  before: YoutubeMultiDraftItem[];
  after: YoutubeMultiDraftItem[];
}): YoutubeMultiLocalDryRun {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const item of input.after) {
    if (!item.id || !String(item.id).trim()) {
      errors.push("各動画に安定した ID が必要です");
      continue;
    }
    if (ids.has(item.id)) {
      errors.push(`重複 ID: ${item.id}`);
    }
    ids.add(item.id);
    const v = validateYoutubeEmbedInput(item.embedCode);
    if (!v.ok) {
      errors.push(`${item.id}: ${v.error}`);
    }
  }

  const beforeMap = new Map(input.before.map((i) => [i.id, i]));
  const changedItemIds: string[] = [];
  for (const item of input.after) {
    const prev = beforeMap.get(item.id);
    if (
      !prev ||
      prev.embedCode !== item.embedCode ||
      prev.published !== item.published ||
      prev.sortOrder !== item.sortOrder
    ) {
      changedItemIds.push(item.id);
    }
  }
  for (const prev of input.before) {
    if (!input.after.some((i) => i.id === prev.id)) {
      changedItemIds.push(prev.id);
      warnings.push(`削除は未実装 — ${prev.id} は非表示（published=false）で扱ってください`);
    }
  }

  const publishedCount = input.after.filter((i) => i.published).length;

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    changedItemIds: [...new Set(changedItemIds)],
    publishedCount,
    itemCount: input.after.length,
    nextItems: input.after,
    savePayloadPreview: {
      siteSlug: String(input.siteSlug ?? "gosaki-piano"),
      sectionTitle: String(input.sectionTitle ?? "YouTube"),
      items: input.after,
    },
    edgeItemsContract: {
      dryRunOperationId: "G-11c7-gosaki-youtube-items-dry-run",
      saveOperationId: "G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice",
      field: "items",
      note: "同一 Edge Function で field=items 契約。legacy nextValue も併存。",
    },
  };
}

function previewHtmlForEmbed(embedCode: string): string {
  const v = validateYoutubeEmbedInput(embedCode);
  if (!v.ok || !v.videoId) {
    return `<p class="admin-gosaki-operator-empty">${escapeHtml(v.error || "プレビュー不可")}</p>`;
  }
  const src = buildYoutubeNocookieEmbedUrl(v.videoId);
  const watch = buildYoutubeWatchUrl(v.videoId);
  return `<div class="gosaki-youtube-admin-preview__media"><iframe src="${escapeHtml(src)}" title="YouTube preview" loading="lazy" allowfullscreen></iframe></div><p class="gosaki-youtube-admin-preview__watch"><a href="${escapeHtml(watch)}" target="_blank" rel="noopener noreferrer">YouTubeで見る</a></p>`;
}

/**
 * Multi-item YouTube admin UI — local edit + Edge items dry-run / gated Save.
 * Save stays disarmed unless client env arm is true (normal STG: false).
 * Does not auto-retry on timeout / indeterminate.
 */
export type YoutubeMultiOperationalEditDeps = {
  saveArmed?: boolean;
  getAccessToken?: () => Promise<string | null>;
  dryRunEndpoint?: string;
  saveEndpoint?: string;
  anonKey?: string;
  assertDryRunEndpointSafe?: (endpoint: string) => boolean;
  assertSaveEndpointSafe?: (endpoint: string) => boolean;
  buildDryRunEndpointRequest?: (items: YoutubeMultiDraftItem[]) => Record<string, unknown>;
  buildSaveEndpointRequest?: (input: {
    items: YoutubeMultiDraftItem[];
    expectedBeforeItems: YoutubeMultiDraftItem[];
    fingerprint: string;
    requestId?: string;
  }) => Record<string, unknown>;
  evaluateSaveGate?: (input: {
    authenticated: boolean;
    dryRunSucceeded: boolean;
    formMatchesDryRunSnapshot: boolean;
    fingerprintPresent: boolean;
    expectedBeforeEmbed: string | null;
    expectedBeforeVideoId: string | null;
    contentLockMode?: "embed" | "items";
    saveEndpointConfigured: boolean;
    saveEndpointSafe: boolean;
    envArmed: boolean;
    approvalId: string;
    expectedApprovalId: string;
    saveInFlight: boolean;
    noChange?: boolean;
  }) => { enabled: boolean; reason: string };
  expectedSaveApprovalId?: string;
  conflictMessage?: string;
  fetchImpl?: typeof fetch;
};

export function initGosakiYoutubeMultiOperationalEdit(
  root: HTMLElement,
  options: {
    config: GosakiYoutubeEmbedConfig;
    saveArmed?: boolean;
  } & YoutubeMultiOperationalEditDeps,
): void {
  const listEl = root.querySelector("[data-gosaki-youtube-multi-list]");
  const statusEl = root.querySelector("[data-gosaki-youtube-status]");
  const dryRunResult = root.querySelector("[data-gosaki-youtube-multi-dry-run-result]");
  const saveBtn = root.querySelector("[data-gosaki-youtube-multi-save]");
  const saveReasonEl = root.querySelector("[data-gosaki-youtube-multi-save-reason]");
  const addUrlInput = root.querySelector("[data-gosaki-youtube-add-url]");
  const addPublishedInput = root.querySelector("[data-gosaki-youtube-add-published]");

  const normalized = normalizeGosakiYoutubeConfig(options.config);
  // Fix baseline at load with an independent deep clone. Edit `items` must never
  // share array/object refs with baseline (or mutate baseline via shared items).
  let baseline = cloneYoutubeDraftItems(draftItemsFromConfig(options.config));
  let items = cloneYoutubeDraftItems(baseline);
  const saveArmed = isClientSaveArmed(options.saveArmed);
  const expectedSaveApprovalId =
    options.expectedSaveApprovalId ||
    "G-11c7-gosaki-youtube-items-web-save-non-dry-run-slice";
  const SAVE_STOPPED = GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE;
  let pendingOneClickSave = false;

  let dryRunOk = false;
  let dryRunFingerprint: string | null = null;
  let dryRunBeforeItems: YoutubeMultiDraftItem[] | null = null;
  let dryRunAfterFingerprint: string | null = null;
  let dryRunNoChange = false;
  let dryRunInFlight = false;
  let saveInFlight = false;
  let indeterminateLocked = false;
  let saveNotArmedLocked = false;

  function itemsFingerprint(list: YoutubeMultiDraftItem[]): string {
    return youtubeDraftItemsFingerprint(list);
  }

  function isDirty(): boolean {
    return isYoutubeDraftDirty(baseline, items);
  }

  function applySaveButtonUi(enabled: boolean, reason: string) {
    if (saveBtn instanceof HTMLButtonElement) {
      saveBtn.disabled = !enabled;
      saveBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
      saveBtn.setAttribute("data-gosaki-save-allowed", enabled ? "true" : "false");
      saveBtn.textContent = "保存";
    }
    if (saveReasonEl) saveReasonEl.textContent = reason;
  }

  async function refreshSaveGate() {
    const token = (await (options.getAccessToken?.() ?? Promise.resolve(null))) || null;
    if (indeterminateLocked) {
      applySaveButtonUi(false, "結果不明のため自動では再試行しません");
      return;
    }
    if (saveInFlight || dryRunInFlight) {
      applySaveButtonUi(false, saveInFlight ? "保存中…" : "確認中…");
      return;
    }
    if (saveNotArmedLocked) {
      applySaveButtonUi(false, GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE);
      return;
    }
    if (!saveArmed) {
      applySaveButtonUi(false, GOSAKI_CLIENT_SAVE_DISARMED_REASON);
      return;
    }
    if (!isDirty()) {
      applySaveButtonUi(false, "変更がありません");
      return;
    }
    if (!token) {
      applySaveButtonUi(false, "ログインが必要です");
      return;
    }
    applySaveButtonUi(true, "保存");
  }

  function setSaveDisabled(reason = SAVE_STOPPED) {
    dryRunOk = false;
    dryRunFingerprint = null;
    dryRunBeforeItems = null;
    dryRunAfterFingerprint = null;
    dryRunNoChange = false;
    applySaveButtonUi(false, reason);
  }

  function renumberSortOrders(next: YoutubeMultiDraftItem[]): YoutubeMultiDraftItem[] {
    return next.map((item, index) => ({
      ...item,
      sortOrder: (index + 1) * 10,
    }));
  }

  function renderList() {
    if (!(listEl instanceof HTMLElement)) return;
    if (items.length === 0) {
      listEl.innerHTML = `<p class="gosaki-admin-content-panel__empty">登録されている動画はありません。</p>`;
      return;
    }
    listEl.innerHTML = items
      .map((item, index) => {
        const v = validateYoutubeEmbedInput(item.embedCode);
        const statusClass = item.published
          ? "gosaki-youtube-admin-item__status--published"
          : "gosaki-youtube-admin-item__status--draft";
        return `
<li class="gosaki-youtube-admin-item" data-youtube-item-id="${escapeHtml(item.id)}">
  <div class="gosaki-youtube-admin-item__sort-bar">
    <div class="gosaki-youtube-admin-item__sort-bar-start">
      <span class="gosaki-youtube-admin-item__order">表示順 ${item.sortOrder}</span>
      <span class="gosaki-youtube-admin-item__status ${statusClass}">${item.published ? "公開" : "非公開"}</span>
      <code class="gosaki-youtube-admin-item__id">${escapeHtml(item.id)}</code>
    </div>
    <div class="gosaki-youtube-admin-item__move-controls">
      <button type="button" class="admin-button admin-button--small" data-yt-move="up" data-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="上へ">↑</button>
      <button type="button" class="admin-button admin-button--small" data-yt-move="down" data-index="${index}" ${index === items.length - 1 ? "disabled" : ""} aria-label="下へ">↓</button>
    </div>
  </div>
  <div class="gosaki-youtube-admin-item__preview">${previewHtmlForEmbed(item.embedCode)}</div>
  <div class="gosaki-youtube-admin-item__editor">
    <div class="admin-form gosaki-youtube-admin-form">
      <label class="admin-form__field admin-form__field--full">
        <span class="admin-form__label">YouTube URL / 埋め込み</span>
        <textarea class="gosaki-youtube-admin-embed-code" rows="3" data-yt-field="embedCode">${escapeHtml(item.embedCode)}</textarea>
      </label>
      <p class="admin-form__hint" data-yt-validation>${v.ok ? `videoId: ${v.videoId}` : escapeHtml(v.error || "")}</p>
      <label class="admin-form__field admin-form__field--checkbox">
        <input type="checkbox" data-yt-field="published" ${item.published ? "checked" : ""} />
        <span>公開する（OFF で非表示）</span>
      </label>
    </div>
    <div class="admin-actions">
      <button type="button" class="admin-button admin-button-secondary" data-yt-duplicate data-index="${index}">複製</button>
    </div>
  </div>
</li>`;
      })
      .join("");
  }

  function syncFromDom() {
    if (!(listEl instanceof HTMLElement)) return;
    const next: YoutubeMultiDraftItem[] = [];
    listEl.querySelectorAll<HTMLElement>("[data-youtube-item-id]").forEach((li, index) => {
      const id = li.getAttribute("data-youtube-item-id") || "";
      const embed =
        (li.querySelector('[data-yt-field="embedCode"]') as HTMLTextAreaElement | null)?.value ??
        "";
      const published =
        (li.querySelector('[data-yt-field="published"]') as HTMLInputElement | null)?.checked ===
        true;
      next.push({
        id,
        embedCode: String(embed).trim(),
        published,
        sortOrder: (index + 1) * 10,
      });
    });
    items = next;
  }

  function invalidateDryRunUi() {
    saveNotArmedLocked = false;
    if (dryRunResult instanceof HTMLElement) {
      dryRunResult.hidden = true;
      dryRunResult.innerHTML = "";
    }
    setSaveDisabled("変更後は再度「変更を確認」してください");
    if (statusEl) statusEl.textContent = "未保存の変更がある可能性があります";
    void refreshSaveGate();
  }

  async function runEndpointDryRun() {
    if (dryRunInFlight || indeterminateLocked) return;
    syncFromDom();
    const local = buildYoutubeMultiLocalDryRun({
      siteSlug: options.config.siteSlug,
      sectionTitle: normalized.sectionTitle,
      before: baseline,
      after: items,
    });
    if (!local.ok) {
      if (dryRunResult instanceof HTMLElement) {
        dryRunResult.hidden = true;
        dryRunResult.innerHTML = "";
      }
      setSaveDisabled("入力内容を確認してください");
      return;
    }

    const endpoint = String(options.dryRunEndpoint ?? "").trim();
    const endpointSafe = endpoint
      ? options.assertDryRunEndpointSafe?.(endpoint) !== false
      : false;
    const token = (await (options.getAccessToken?.() ?? Promise.resolve(null))) || null;

    if (!endpoint || !endpointSafe || !token || !options.buildDryRunEndpointRequest) {
      if (dryRunResult instanceof HTMLElement) {
        dryRunResult.hidden = true;
        dryRunResult.innerHTML = "";
      }
      dryRunOk = false;
      setSaveDisabled("いまは保存できません");
      if (statusEl) statusEl.textContent = "確認先が未設定です";
      return;
    }

    dryRunInFlight = true;
    try {
      const fetchImpl = options.fetchImpl ?? fetch;
      const body = options.buildDryRunEndpointRequest(items);
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 25000);
      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: String(options.anonKey ?? ""),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const ok = json.ok === true && res.ok;
      const fingerprint = typeof json.fingerprint === "string" ? json.fingerprint : "";
      const noChange = json.noChange === true;
      if (dryRunResult instanceof HTMLElement) {
        dryRunResult.hidden = true;
        dryRunResult.innerHTML = "";
      }
      if (ok && fingerprint) {
        dryRunOk = true;
        dryRunFingerprint = fingerprint;
        dryRunBeforeItems = cloneYoutubeDraftItems(baseline);
        dryRunAfterFingerprint = itemsFingerprint(items);
        dryRunNoChange = noChange;
        if (statusEl && !pendingOneClickSave) {
          statusEl.textContent = noChange ? "確認完了（変更なし）" : "確認完了";
        }
      } else {
        dryRunOk = false;
        setSaveDisabled(String(json.error ?? "確認に失敗しました"));
        if (statusEl) statusEl.textContent = "確認に失敗しました";
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? "時間切れです。自動では再試行しません。"
            : err.message
          : String(err);
      if (err instanceof Error && err.name === "AbortError") {
        indeterminateLocked = true;
      }
      dryRunOk = false;
      setSaveDisabled(message);
      if (dryRunResult instanceof HTMLElement) {
        dryRunResult.hidden = true;
        dryRunResult.innerHTML = "";
      }
    } finally {
      dryRunInFlight = false;
      if (pendingOneClickSave) {
        const matched =
          dryRunOk &&
          dryRunAfterFingerprint != null &&
          dryRunAfterFingerprint === itemsFingerprint(items);
        pendingOneClickSave = false;
        if (!matched) {
          applySaveButtonUi(true, "入力内容を確認してください");
          void refreshSaveGate();
          return;
        }
        if (!saveArmed) {
          applySaveButtonUi(false, GOSAKI_CLIENT_SAVE_DISARMED_REASON);
          void refreshSaveGate();
          return;
        }
        await runYoutubeMultiSaveRequest();
      } else {
        void refreshSaveGate();
      }
    }
  }

  async function runYoutubeMultiSaveRequest(): Promise<void> {
    if (saveInFlight || dryRunInFlight || indeterminateLocked) return;
    if (!saveArmed) {
      applySaveButtonUi(false, GOSAKI_CLIENT_SAVE_DISARMED_REASON);
      return;
    }
    const token = (await (options.getAccessToken?.() ?? Promise.resolve(null))) || null;
    if (!token) {
      applySaveButtonUi(false, "ログインが必要です");
      return;
    }
    const formMatches =
      dryRunOk &&
      dryRunAfterFingerprint != null &&
      dryRunAfterFingerprint === itemsFingerprint(items);
    if (!formMatches || !dryRunFingerprint || !dryRunBeforeItems || !options.buildSaveEndpointRequest) {
      applySaveButtonUi(false, "いまは保存できません");
      return;
    }
    const endpoint = String(options.saveEndpoint ?? "").trim();
    if (!endpoint) {
      applySaveButtonUi(false, "いまは保存できません");
      return;
    }

    saveInFlight = true;
    applySaveButtonUi(false, "保存中…");
    try {
      const fetchImpl = options.fetchImpl ?? fetch;
      const body = options.buildSaveEndpointRequest({
        items,
        expectedBeforeItems: dryRunBeforeItems,
        fingerprint: dryRunFingerprint,
        requestId: `ui-items-${Date.now()}`,
      });
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 25000);
      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: String(options.anonKey ?? ""),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (json.indeterminate === true) {
        indeterminateLocked = true;
        applySaveButtonUi(false, "結果不明のため自動では再試行しません");
        return;
      }
      if (isGosakiSaveNotArmedResponse(json, res.status)) {
        saveNotArmedLocked = true;
        applySaveButtonUi(false, SAVE_STOPPED);
        if (statusEl) statusEl.textContent = SAVE_STOPPED;
        return;
      }
      if (json.ok === true && res.ok) {
        baseline = cloneYoutubeDraftItems(items);
        dryRunOk = false;
        dryRunFingerprint = null;
        if (statusEl) statusEl.textContent = "保存しました";
        applySaveButtonUi(false, "保存しました");
      } else {
        const msg = userMessageForSaveFailure(json, res.status, "保存に失敗しました");
        applySaveButtonUi(false, msg);
        if (statusEl) statusEl.textContent = msg;
      }
    } catch (err) {
      applySaveButtonUi(
        false,
        err instanceof Error && err.name === "AbortError"
          ? "時間切れです。自動では再試行しません。"
          : "保存に失敗しました",
      );
    } finally {
      saveInFlight = false;
      void refreshSaveGate();
    }
  }

  root.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;

    const moveBtn = t.closest("[data-yt-move]");
    if (moveBtn instanceof HTMLElement) {
      syncFromDom();
      const index = Number(moveBtn.getAttribute("data-index"));
      const dir = moveBtn.getAttribute("data-yt-move");
      if (!Number.isFinite(index)) return;
      const swap = dir === "up" ? index - 1 : index + 1;
      if (swap < 0 || swap >= items.length) return;
      const copy = [...items];
      const tmp = copy[index];
      copy[index] = copy[swap];
      copy[swap] = tmp;
      items = renumberSortOrders(copy);
      renderList();
      invalidateDryRunUi();
      return;
    }

    const dupBtn = t.closest("[data-yt-duplicate]");
    if (dupBtn instanceof HTMLElement) {
      syncFromDom();
      const index = Number(dupBtn.getAttribute("data-index"));
      const src = items[index];
      if (!src) return;
      const copy: YoutubeMultiDraftItem = {
        ...src,
        id: newYoutubeItemId(),
        published: false,
        sortOrder: (items.length + 1) * 10,
      };
      items = renumberSortOrders([...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
      renderList();
      invalidateDryRunUi();
      return;
    }

    if (t.closest("[data-gosaki-youtube-add]")) {
      const url =
        addUrlInput instanceof HTMLTextAreaElement || addUrlInput instanceof HTMLInputElement
          ? String(addUrlInput.value || "").trim()
          : "";
      const v = validateYoutubeEmbedInput(url);
      if (!v.ok) {
        if (statusEl) statusEl.textContent = v.error || "追加できません";
        return;
      }
      const published =
        addPublishedInput instanceof HTMLInputElement ? addPublishedInput.checked : false;
      syncFromDom();
      items = renumberSortOrders([
        ...items,
        {
          id: newYoutubeItemId(),
          embedCode: url,
          published,
          sortOrder: (items.length + 1) * 10,
        },
      ]);
      if (addUrlInput instanceof HTMLTextAreaElement || addUrlInput instanceof HTMLInputElement) {
        addUrlInput.value = "";
      }
      renderList();
      invalidateDryRunUi();
      if (statusEl) statusEl.textContent = "動画を追加しました（ローカル・未保存）";
      return;
    }

    if (t.closest("[data-gosaki-youtube-multi-dry-run]")) {
      void runEndpointDryRun();
      return;
    }

    if (t.closest("[data-gosaki-youtube-multi-cancel]")) {
      items = cloneYoutubeDraftItems(baseline);
      renderList();
      invalidateDryRunUi();
      if (statusEl) statusEl.textContent = "変更を破棄しました";
      return;
    }

    if (t.closest("[data-gosaki-youtube-multi-save]")) {
      if (!(saveBtn instanceof HTMLButtonElement) || indeterminateLocked) {
        return;
      }
      if (saveInFlight || dryRunInFlight) return;
      if (saveNotArmedLocked) {
        applySaveButtonUi(false, SAVE_STOPPED);
        if (statusEl) statusEl.textContent = SAVE_STOPPED;
        return;
      }
      if (!saveArmed) {
        applySaveButtonUi(false, GOSAKI_CLIENT_SAVE_DISARMED_REASON);
        return;
      }
      syncFromDom();
      if (!isDirty()) {
        applySaveButtonUi(false, "変更がありません");
        return;
      }
      void (async () => {
        const token = (await (options.getAccessToken?.() ?? Promise.resolve(null))) || null;
        if (!token) {
          applySaveButtonUi(false, "ログインが必要です");
          return;
        }
        const formMatches =
          dryRunOk &&
          dryRunAfterFingerprint != null &&
          dryRunAfterFingerprint === itemsFingerprint(items);
        if (!formMatches) {
          pendingOneClickSave = true;
          applySaveButtonUi(false, "確認中…");
          const internalDry = root.querySelector("[data-gosaki-internal-dry-run]");
          if (internalDry instanceof HTMLElement) internalDry.click();
          else {
            pendingOneClickSave = false;
            applySaveButtonUi(true, "保存");
          }
          return;
        }
        await runYoutubeMultiSaveRequest();
      })();
      return;
    }
  });

  function onItemFieldEdited(ev: Event) {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.closest("[data-youtube-item-id]")) return;
    // Sync DOM → items before dirty / save-gate evaluation. Preview alone must not
    // leave `items` stale (otherwise isDirty stays false → 「変更がありません」).
    syncFromDom();
    invalidateDryRunUi();
    const li = t.closest("[data-youtube-item-id]");
    if (li && t.matches('[data-yt-field="embedCode"]')) {
      const v = validateYoutubeEmbedInput((t as HTMLTextAreaElement).value);
      const hint = li.querySelector("[data-yt-validation]");
      if (hint) hint.textContent = v.ok ? `videoId: ${v.videoId}` : v.error || "";
      const preview = li.querySelector(".gosaki-youtube-admin-item__preview");
      if (preview) preview.innerHTML = previewHtmlForEmbed((t as HTMLTextAreaElement).value);
    }
  }

  root.addEventListener("input", onItemFieldEdited);
  root.addEventListener("change", onItemFieldEdited);

  window.addEventListener("gosaki-admin-auth-changed", () => {
    void refreshSaveGate();
  });

  renderList();
  setSaveDisabled();
  void refreshSaveGate();
  if (statusEl) {
    statusEl.textContent = `${items.length} 件登録 · 公開 ${items.filter((i) => i.published).length} 件`;
  }
}

/** Re-export item type for callers that only need drafts. */
export type { GosakiYoutubeEmbedItem };
