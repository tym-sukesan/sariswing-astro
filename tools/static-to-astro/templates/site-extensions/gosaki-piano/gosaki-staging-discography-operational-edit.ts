/**
 * G-20u40 / G-20u41 — Discography operational view/edit client.
 * One-click Save: internal dry-run → Save POST (same lock). Client arm does not skip Save.
 */

import {
  GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE,
  GOSAKI_ADMIN_LIVE_READ_PENDING_MESSAGE,
  GOSAKI_ADMIN_LIVE_SITE_SLUG,
  createGosakiAdminLiveReadSession,
  fetchGosakiDiscographyAuthenticatedLive,
  gosakiAdminLiveReadAuthFingerprint,
  type GosakiAdminLiveDiscographyAlbum,
} from "./gosaki-staging-admin-live-read";
import {
  GOSAKI_CLIENT_SAVE_DISARMED_REASON,
  GOSAKI_SAVE_DIRTY_USER_MESSAGE,
  GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE,
  GOSAKI_SAVE_SUCCESS_USER_MESSAGE,
  isClientSaveArmed,
  isGosakiSaveNotArmedResponse,
  userMessageForSaveFailure,
} from "./gosaki-staging-one-click-save";

export type DiscographyOperationalAlbum = {
  legacyId: string;
  title: string;
  artist?: string | null;
  releaseDate?: string | null;
  label?: string | null;
  catalogNumber?: string | null;
  published?: boolean;
  coverImageUrl?: string | null;
  purchaseUrl?: string | null;
  streamingUrl?: string | null;
  description?: string | null;
  trackListText?: string;
  trackCount?: number;
  updatedAt?: string | null;
};

export type DiscographyOperationalEditDeps = {
  validateTrackListDryRun: (
    original: string,
    next: string,
    meta?: { legacyId?: string; title?: string },
  ) => Record<string, unknown>;
  buildDryRunEndpointRequest: (input: {
    legacyId: string;
    tracksText: string;
    release: Record<string, unknown>;
    expectedBeforeUpdatedAt?: string | null;
    localDryRun?: Record<string, unknown>;
  }) => Record<string, unknown>;
  buildSaveEndpointRequest: (input: {
    legacyId: string;
    tracksText: string;
    release: Record<string, unknown>;
    expectedBeforeUpdatedAt?: string | null;
    localDryRun?: Record<string, unknown>;
  }) => Record<string, unknown>;
  sanitizeEndpointDisplay: (body: unknown, status?: number) => Record<string, unknown>;
  isSaveConflictResponse: (body: unknown) => boolean;
  evaluateSaveGate: (input: {
    authenticated: boolean;
    dryRunSucceeded: boolean;
    formMatchesDryRunSnapshot: boolean;
    expectedBeforeUpdatedAt: string | null;
    saveEndpointConfigured: boolean;
    saveEndpointSafe: boolean;
    envArmed: boolean;
    approvalId: string;
    expectedApprovalId: string;
    saveInFlight: boolean;
  }) => { enabled: boolean; reason: string };
  assertDryRunEndpointSafe: (endpoint: string) => boolean;
  assertSaveEndpointSafe: (endpoint: string) => boolean;
  dryRunOperation: string;
  saveOperation: string;
  /** Formal Save approval ID (G-20u36 slice) — gate expected side only. */
  expectedSaveApprovalId: string;
  saveArmed: boolean;
  conflictMessage: string;
  productionProjectRefStop: string;
  getAccessToken?: () => Promise<string | null>;
  supabaseUrl?: string;
  siteSlug?: string;
  anonKey?: string;
  fetchImpl?: typeof fetch;
};

const UNSAVED_LEAVE =
  "未保存の変更があります。編集をやめて破棄しますか？";
const UNSAVED_SWITCH =
  "未保存の変更があります。アルバムを切り替えると破棄されます。続けますか？";

const EDITABLE_KEYS = [
  "title",
  "artist",
  "release_date",
  "label",
  "purchase_url",
  "description",
  "tracks",
] as const;

function readAlbumsJson(root: HTMLElement): DiscographyOperationalAlbum[] {
  const el = root.querySelector("#gosaki-disc-albums-json, [data-gosaki-disc-albums-json]");
  if (!el) return [];
  try {
    const parsed = JSON.parse(el.textContent || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function field(form: HTMLFormElement, name: string): HTMLInputElement | HTMLTextAreaElement | null {
  return form.querySelector(`[data-gosaki-disc-field="${name}"]`);
}

function snapshotFromAlbum(album: DiscographyOperationalAlbum) {
  return {
    legacyId: album.legacyId,
    title: album.title ?? "",
    artist: album.artist ?? "",
    release_date: album.releaseDate ?? "",
    label: album.label ?? "",
    purchase_url: album.purchaseUrl ?? "",
    description: album.description ?? "",
    tracks: album.trackListText ?? "",
    catalog_number: album.catalogNumber ?? "",
    published: album.published !== false ? "true" : "false",
    streaming_url: album.streamingUrl ?? "",
    cover_image_url: album.coverImageUrl ?? "",
    updatedAt: album.updatedAt ?? "",
  };
}

function applySnapshotToForm(form: HTMLFormElement, snap: ReturnType<typeof snapshotFromAlbum>) {
  const set = (name: string, value: string) => {
    const el = field(form, name);
    if (el) el.value = value;
  };
  set("legacy_id", snap.legacyId);
  set("title", snap.title);
  set("artist", snap.artist);
  set("release_date", snap.release_date);
  set("label", snap.label);
  set("purchase_url", snap.purchase_url);
  set("description", snap.description);
  set("tracks", snap.tracks);
  set("catalog_number", snap.catalog_number);
  set("published", snap.published);
  set("streaming_url", snap.streaming_url);
  set("cover_image_url", snap.cover_image_url);
  const tracks = field(form, "tracks");
  if (tracks) tracks.setAttribute("data-original-track-list", snap.tracks);
  form.dataset.albumLegacyId = snap.legacyId;
  form.dataset.expectedBeforeUpdatedAt = snap.updatedAt;
  form.dataset.originalSnapshot = JSON.stringify(snap);
}

function readFormSnapshot(form: HTMLFormElement) {
  const get = (name: string) => field(form, name)?.value ?? "";
  return {
    legacyId: get("legacy_id"),
    title: get("title"),
    artist: get("artist"),
    release_date: get("release_date"),
    label: get("label"),
    purchase_url: get("purchase_url"),
    description: get("description"),
    tracks: get("tracks"),
    catalog_number: get("catalog_number"),
    published: get("published") || "true",
    streaming_url: get("streaming_url"),
    cover_image_url: get("cover_image_url"),
    updatedAt: form.dataset.expectedBeforeUpdatedAt ?? "",
  };
}

function editableFingerprint(snap: ReturnType<typeof readFormSnapshot>): string {
  const pick: Record<string, string> = {};
  for (const key of EDITABLE_KEYS) {
    pick[key] = String(snap[key] ?? "");
  }
  return JSON.stringify(pick);
}

function isDirty(form: HTMLFormElement): boolean {
  const raw = form.dataset.originalSnapshot || "";
  if (!raw) return false;
  try {
    const original = JSON.parse(raw);
    const current = readFormSnapshot(form);
    return EDITABLE_KEYS.some(
      (key) => String(original[key] ?? "") !== String(current[key] ?? ""),
    );
  } catch {
    return false;
  }
}

function changedEditableFields(form: HTMLFormElement): string[] {
  const raw = form.dataset.originalSnapshot || "";
  if (!raw) return [];
  try {
    const original = JSON.parse(raw) as Record<string, unknown>;
    const current = readFormSnapshot(form) as Record<string, unknown>;
    return EDITABLE_KEYS.filter(
      (key) => String(original[key] ?? "") !== String(current[key] ?? ""),
    );
  } catch {
    return [];
  }
}

function buildReleasePayload(current: ReturnType<typeof readFormSnapshot>) {
  return {
    title: current.title,
    artist: current.artist || null,
    release_date: current.release_date || null,
    label: current.label || null,
    catalog_number: current.catalog_number || null,
    published: current.published === "true",
    cover_image_url: current.cover_image_url || null,
    purchase_url: current.purchase_url || null,
    streaming_url: current.streaming_url || null,
    description: current.description || null,
  };
}

function setUnsaved(root: HTMLElement, dirty: boolean) {
  const banner = root.querySelector("[data-gosaki-unsaved-banner]");
  if (banner instanceof HTMLElement) banner.hidden = !dirty;
}

function setMode(root: HTMLElement, mode: "view" | "edit") {
  root.dataset.mode = mode;
  const view = root.querySelector("[data-gosaki-disc-view-mode]");
  const edit = root.querySelector("[data-gosaki-disc-edit-mode]");
  if (view instanceof HTMLElement) view.hidden = mode !== "view";
  if (edit instanceof HTMLElement) edit.hidden = mode !== "edit";
}

function renderCover(root: HTMLElement, url: string) {
  const wrap = root.querySelector("[data-gosaki-disc-cover-preview]");
  if (!(wrap instanceof HTMLElement)) return;
  if (url) {
    wrap.innerHTML = `<img src="${url.replace(/"/g, "&quot;")}" alt="" loading="lazy" decoding="async" /><p class="gosaki-discography-content-panel__hint">画像変更は後続フェーズです。</p>`;
  } else {
    wrap.innerHTML = `<p class="gosaki-discography-content-panel__hint">画像なし · 画像変更は後続フェーズです。</p>`;
  }
}

function updateAlbumCacheUpdatedAt(
  albums: DiscographyOperationalAlbum[],
  legacyId: string,
  updatedAt: string,
) {
  const album = albums.find((a) => a.legacyId === legacyId);
  if (album) album.updatedAt = updatedAt;
  const jsonEl = document.querySelector("#gosaki-disc-albums-json, [data-gosaki-disc-albums-json]");
  if (jsonEl) jsonEl.textContent = JSON.stringify(albums);
}

function escapeDiscHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function displayDisc(value: string | null | undefined): string {
  const t = String(value ?? "").trim();
  return t || "—";
}

export function renderDiscographyOperationalAlbumList(
  root: HTMLElement,
  albums: DiscographyOperationalAlbum[],
): void {
  const list = root.querySelector("[data-gosaki-disc-album-list]");
  if (!(list instanceof HTMLElement)) return;
  if (albums.length === 0) {
    list.innerHTML = `<p class="gosaki-admin-content-panel__empty">Discography データがありません。</p>`;
    return;
  }
  list.innerHTML = albums
    .map((album) => {
      const thumb = album.coverImageUrl
        ? `<img class="gosaki-discography-content-panel__thumb" src="${escapeDiscHtml(album.coverImageUrl)}" alt="" loading="lazy" decoding="async" />`
        : `<div class="gosaki-discography-content-panel__thumb gosaki-discography-content-panel__thumb--empty" aria-hidden="true"></div>`;
      return `<li class="gosaki-discography-content-panel__album-item" data-gosaki-disc-album-summary="${escapeDiscHtml(album.legacyId)}">
  <div class="gosaki-discography-content-panel__album-summary">
    ${thumb}
    <div class="gosaki-discography-content-panel__album-meta">
      <h2 class="gosaki-discography-content-panel__album-title">${escapeDiscHtml(album.title)}</h2>
      <p class="gosaki-admin-content-panel__meta">${escapeDiscHtml(displayDisc(album.artist))} · ${escapeDiscHtml(displayDisc(album.releaseDate))} · ${album.trackCount ?? 0} tracks</p>
      <p class="gosaki-admin-content-panel__meta">${escapeDiscHtml(displayDisc(album.label))}</p>
    </div>
    <div class="gosaki-admin-edit-toolbar" data-gosaki-edit-toolbar="view">
      <button type="button" class="gosaki-admin-btn gosaki-admin-btn--primary gosaki-admin-edit-toolbar__btn gosaki-admin-edit-toolbar__btn--primary" data-gosaki-edit-start>編集</button>
    </div>
  </div>
</li>`;
    })
    .join("");

  const meta = root.querySelector(".gosaki-admin-content-panel__meta");
  if (meta) {
    const trackTotal = albums.reduce((n, a) => n + (a.trackCount ?? 0), 0);
    const strongs = meta.querySelectorAll("strong");
    if (strongs[0]) strongs[0].textContent = String(albums.length);
    if (strongs[1]) strongs[1].textContent = String(trackTotal);
  }
}

/**
 * Initialize Discography operational edit UI on a ContentPanel root.
 */
export function initGosakiDiscographyOperationalEdit(
  root: HTMLElement,
  deps: DiscographyOperationalEditDeps,
): void {
  if (root.dataset.gosakiDiscEditInitialized === "true") return;
  root.dataset.gosakiDiscEditInitialized = "true";

  let albums: DiscographyOperationalAlbum[] = readAlbumsJson(root);
  let albumById = new Map(albums.map((a) => [a.legacyId, a]));
  const form = root.querySelector("[data-gosaki-disc-edit-form]");
  const resultEl = root.querySelector("[data-gosaki-disc-dry-run-result]");
  const saveBtn = root.querySelector("[data-gosaki-disc-save]");
  const saveReasonEl = root.querySelector("[data-gosaki-disc-save-disabled-reason]");
  const saveInFlightEl = root.querySelector("[data-gosaki-disc-save-in-flight]");
  const saveSuccessEl = root.querySelector("[data-gosaki-disc-save-success]");
  const saveValidationEl = root.querySelector("[data-gosaki-disc-save-validation]");
  const saveConflictEl = root.querySelector("[data-gosaki-disc-save-conflict]");
  const dryRunOkEl = root.querySelector("[data-gosaki-disc-dry-run-ok]");
  const statusEl = root.querySelector("[data-gosaki-disc-status]");

  if (!(form instanceof HTMLFormElement) || !(resultEl instanceof HTMLElement)) return;

  let dryRunInFlight = false;
  let saveInFlight = false;
  let dryRunSucceeded = false;
  let dryRunLockedFingerprint = "";
  let authenticated = false;
  let pendingOneClickSave = false;
  let indeterminateLocked = false;
  let saveNotArmedLocked = false;
  let saveSuccessSticky = false;
  let liveReadState: "pending" | "ready" | "error" = "pending";

  const setUserSaveMessage = (message: string) => {
    if (saveReasonEl instanceof HTMLElement) saveReasonEl.textContent = message;
  };

  const setLiveReadUi = (state: "pending" | "ready" | "error", error = "") => {
    liveReadState = state;
    root.dataset.liveSource = state;
    root.dataset.liveSourceLocked = state === "ready" ? "false" : "true";
    root.querySelectorAll("[data-gosaki-edit-start]").forEach((el) => {
      if (el instanceof HTMLButtonElement) {
        el.disabled = state !== "ready";
        el.setAttribute("aria-disabled", state === "ready" ? "false" : "true");
      }
    });
    if (statusEl instanceof HTMLElement && root.dataset.mode !== "edit") {
      if (state === "pending") statusEl.textContent = GOSAKI_ADMIN_LIVE_READ_PENDING_MESSAGE;
      else if (state === "error") {
        statusEl.textContent = error || GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE;
      } else {
        statusEl.textContent = "アルバムの確認と編集ができます";
      }
    }
  };

  const applyAlbums = (next: DiscographyOperationalAlbum[]) => {
    albums = next;
    albumById = new Map(albums.map((a) => [a.legacyId, a]));
    const jsonEl = root.querySelector("#gosaki-disc-albums-json, [data-gosaki-disc-albums-json]");
    if (jsonEl) jsonEl.textContent = JSON.stringify(albums);
    if (root.dataset.mode !== "edit") {
      renderDiscographyOperationalAlbumList(root, albums);
      setLiveReadUi(liveReadState);
    }
  };

  const liveSession = createGosakiAdminLiveReadSession({
    onPhaseChange: (phase, error) => {
      if (phase === "idle" || phase === "loading") setLiveReadUi("pending");
      else if (phase === "ready") setLiveReadUi("ready");
      else setLiveReadUi("error", error || GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE);
    },
    shouldDefer: () => root.dataset.mode === "edit" && isDirty(form),
    fetchLive: async () => {
      const token = (await (deps.getAccessToken?.() ?? Promise.resolve(null))) || null;
      const supabaseUrl = String(deps.supabaseUrl ?? "").trim();
      const anonKey = String(deps.anonKey ?? "").trim();
      if (!token || !supabaseUrl || !anonKey) {
        return { ok: false, error: GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE };
      }
      const result = await fetchGosakiDiscographyAuthenticatedLive({
        supabaseUrl,
        anonKey,
        accessToken: token,
        siteSlug: String(deps.siteSlug ?? GOSAKI_ADMIN_LIVE_SITE_SLUG).trim(),
        fetchImpl: deps.fetchImpl ?? fetch,
      });
      if (!result.ok) {
        return { ok: false, error: result.error || GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE };
      }
      applyAlbums(result.albums as GosakiAdminLiveDiscographyAlbum[]);
      return { ok: true };
    },
  });

  const clearDryRunLock = () => {
    dryRunSucceeded = false;
    dryRunLockedFingerprint = "";
    form.dataset.dryRunLockedSnapshot = "";
    if (dryRunOkEl instanceof HTMLElement) dryRunOkEl.hidden = true;
    if (saveSuccessEl instanceof HTMLElement) {
      saveSuccessEl.hidden = true;
      saveSuccessEl.textContent = "";
    }
    if (saveConflictEl instanceof HTMLElement) saveConflictEl.hidden = true;
    if (saveValidationEl instanceof HTMLElement) {
      saveValidationEl.hidden = true;
      saveValidationEl.textContent = "";
    }
  };

  const refreshSaveUi = async () => {
    if (deps.getAccessToken) {
      try {
        const token = await deps.getAccessToken();
        authenticated = Boolean(token);
      } catch {
        authenticated = false;
      }
    }

    const body = document.body;
    const saveEndpoint = (
      body?.dataset.gosakiDiscographySaveEndpoint ||
      body?.dataset.gosakiDiscographyDryRunEndpoint ||
      ""
    ).trim();
    const expectedBeforeUpdatedAt = String(form.dataset.expectedBeforeUpdatedAt ?? "").trim() || null;
    const currentFingerprint = editableFingerprint(readFormSnapshot(form));
    const formMatchesDryRunSnapshot =
      dryRunSucceeded &&
      dryRunLockedFingerprint !== "" &&
      currentFingerprint === dryRunLockedFingerprint;
    const candidateApprovalId = String(body?.dataset.g20u41DiscographySaveApprovalId ?? "").trim();

    const gate = deps.evaluateSaveGate({
      authenticated,
      dryRunSucceeded,
      formMatchesDryRunSnapshot,
      expectedBeforeUpdatedAt,
      saveEndpointConfigured: Boolean(saveEndpoint),
      saveEndpointSafe: saveEndpoint ? deps.assertSaveEndpointSafe(saveEndpoint) : false,
      envArmed: deps.saveArmed,
      approvalId: candidateApprovalId,
      expectedApprovalId: deps.expectedSaveApprovalId,
      saveInFlight: saveInFlight || dryRunInFlight,
    });

    if (saveReasonEl instanceof HTMLElement) {
      const dirty = isDirty(form);
      if (indeterminateLocked) {
        saveReasonEl.textContent = "結果が確認できません。自動では再試行しません。";
      } else if (saveNotArmedLocked) {
        saveReasonEl.textContent = GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE;
      } else if (!authenticated) {
        saveReasonEl.textContent = "ログインが必要です";
      } else if (!dirty) {
        saveReasonEl.textContent = saveSuccessSticky
          ? GOSAKI_SAVE_SUCCESS_USER_MESSAGE
          : "変更がありません";
      } else if (saveInFlight) {
        saveReasonEl.textContent = "保存中…";
      } else if (dryRunInFlight) {
        saveReasonEl.textContent = "確認中…";
      } else if (!deps.saveArmed && dirty && authenticated) {
        saveReasonEl.textContent = GOSAKI_CLIENT_SAVE_DISARMED_REASON;
      } else if (dirty && authenticated && isClientSaveArmed(deps.saveArmed)) {
        saveReasonEl.textContent = GOSAKI_SAVE_DIRTY_USER_MESSAGE;
      } else {
        saveReasonEl.textContent = gate.enabled
          ? GOSAKI_SAVE_DIRTY_USER_MESSAGE
          : gate.reason || "変更がありません";
      }
    }
    if (saveBtn instanceof HTMLButtonElement) {
      const dirty = isDirty(form);
      const canClick =
        isClientSaveArmed(deps.saveArmed) &&
        authenticated &&
        dirty &&
        !saveInFlight &&
        !dryRunInFlight &&
        !indeterminateLocked &&
        !saveNotArmedLocked;
      saveBtn.disabled = !canClick;
      saveBtn.setAttribute("aria-disabled", canClick ? "false" : "true");
      saveBtn.textContent = "保存";
    }
    if (saveInFlightEl instanceof HTMLElement) saveInFlightEl.hidden = !saveInFlight;
  };

  const refreshDirty = () => {
    saveNotArmedLocked = false;
    saveSuccessSticky = false;
    const dirty = isDirty(form);
    setUnsaved(root, dirty);
    if (dirty || (dryRunLockedFingerprint && editableFingerprint(readFormSnapshot(form)) !== dryRunLockedFingerprint)) {
      clearDryRunLock();
    }
    void refreshSaveUi();
  };

  const enterEdit = (legacyId: string) => {
    if (liveReadState !== "ready") return;
    const album = albumById.get(legacyId);
    if (!album) return;
    const snap = snapshotFromAlbum(album);
    applySnapshotToForm(form, snap);
    renderCover(root, snap.cover_image_url);
    resultEl.textContent = "（まだ確認していません）";
    clearDryRunLock();
    setMode(root, "edit");
    setUnsaved(root, false);
    void refreshSaveUi();
  };

  const leaveEdit = () => {
    setMode(root, "view");
    setUnsaved(root, false);
    resultEl.textContent = "（まだ確認していません）";
    clearDryRunLock();
    void refreshSaveUi();
  };

  root.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const startBtn = t.closest("[data-gosaki-edit-start]");
    if (startBtn instanceof HTMLElement) {
      if (liveReadState !== "ready") return;
      const item = startBtn.closest("[data-gosaki-disc-album-summary]");
      const legacyId = item?.getAttribute("data-gosaki-disc-album-summary") || "";
      if (!legacyId) return;
      if (root.dataset.mode === "edit" && isDirty(form)) {
        if (!window.confirm(UNSAVED_SWITCH)) return;
      }
      enterEdit(legacyId);
    }
  });

  root.querySelectorAll("[data-gosaki-edit-cancel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (isDirty(form) && !window.confirm(UNSAVED_LEAVE)) return;
      const raw = form.dataset.originalSnapshot;
      if (raw) {
        try {
          applySnapshotToForm(form, JSON.parse(raw));
        } catch {
          /* ignore */
        }
      }
      leaveEdit();
    });
  });

  form.addEventListener("input", refreshDirty);
  form.addEventListener("change", refreshDirty);

  const runInternalDryRun = async (): Promise<boolean> => {
    if (dryRunInFlight || saveInFlight || indeterminateLocked) return false;
    clearDryRunLock();

    const current = readFormSnapshot(form);
    const originalTracks = field(form, "tracks")?.getAttribute("data-original-track-list") ?? "";
    const localDryRun = deps.validateTrackListDryRun(originalTracks, current.tracks, {
      legacyId: current.legacyId,
      title: current.title,
    });
    if (localDryRun.ok === false) {
      setUserSaveMessage("入力内容を確認してください");
      if (saveValidationEl instanceof HTMLElement) {
        saveValidationEl.hidden = false;
        saveValidationEl.textContent = "トラックリストの形式を確認してください";
      }
      return false;
    }

    const release = buildReleasePayload(current);
    const expectedBeforeUpdatedAt = form.dataset.expectedBeforeUpdatedAt || null;
    const body = document.body;
    const endpoint = (body?.dataset.gosakiDiscographyDryRunEndpoint || "").trim();
    const anonKey = (body?.dataset.gosakiSupabaseAnonKey || "").trim();

    if (!endpoint || !anonKey) {
      setUserSaveMessage("保存の準備に失敗しました");
      return false;
    }
    if (endpoint.includes(deps.productionProjectRefStop) || !deps.assertDryRunEndpointSafe(endpoint)) {
      setUserSaveMessage("保存先が不正です");
      return false;
    }

    const payload = deps.buildDryRunEndpointRequest({
      legacyId: current.legacyId,
      tracksText: current.tracks,
      release,
      expectedBeforeUpdatedAt,
      localDryRun: {
        totalBefore: Number(localDryRun.totalBefore ?? 0),
        totalAfter: Number(localDryRun.totalAfter ?? 0),
        added: (localDryRun.added as string[]) ?? [],
        removed: (localDryRun.removed as string[]) ?? [],
        reordered: Boolean(localDryRun.reordered),
      },
    });

    if (payload.operation !== deps.dryRunOperation) {
      setUserSaveMessage("保存の準備に失敗しました");
      return false;
    }

    dryRunInFlight = true;
    void refreshSaveUi();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + anonKey,
          apikey: anonKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      let data: unknown = {};
      try {
        data = await res.json();
      } catch {
        data = { ok: false, errors: ["non-JSON response"] };
      }
      const display = deps.sanitizeEndpointDisplay(data, res.status);
      const endpointOk = display.ok === true;
      if (endpointOk) {
        dryRunSucceeded = true;
        dryRunLockedFingerprint = editableFingerprint(current);
        form.dataset.dryRunLockedSnapshot = dryRunLockedFingerprint;
        if (dryRunOkEl instanceof HTMLElement) dryRunOkEl.hidden = true;
        resultEl.textContent = "";
        return true;
      }
      setUserSaveMessage("入力内容を確認してください");
      return false;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        indeterminateLocked = true;
        setUserSaveMessage("時間切れです。自動では再試行しません。");
      } else {
        setUserSaveMessage("確認に失敗しました。自動では再試行しません。");
      }
      return false;
    } finally {
      window.clearTimeout(timeoutId);
      dryRunInFlight = false;
      void refreshSaveUi();
    }
  };

  const executeSaveAfterDryRun = async (): Promise<void> => {
    if (saveInFlight || dryRunInFlight || indeterminateLocked) return;
    if (!isClientSaveArmed(deps.saveArmed)) {
      setUserSaveMessage(GOSAKI_CLIENT_SAVE_DISARMED_REASON);
      return;
    }

    const current = readFormSnapshot(form);
    const currentFingerprint = editableFingerprint(current);
    const formMatches =
      dryRunSucceeded &&
      dryRunLockedFingerprint !== "" &&
      currentFingerprint === dryRunLockedFingerprint;

    if (!formMatches) {
      setUserSaveMessage("入力内容を確認してください");
      return;
    }

    // Always POST Save after successful dry-run — client arm must not skip.
    // Server arm=false returns 403 save_not_armed.

    const originalTracks = field(form, "tracks")?.getAttribute("data-original-track-list") ?? "";
    const localDryRun = deps.validateTrackListDryRun(originalTracks, current.tracks, {
      legacyId: current.legacyId,
      title: current.title,
    });
    const release = buildReleasePayload(current);
    const expectedBeforeUpdatedAt = form.dataset.expectedBeforeUpdatedAt || null;
    const body = document.body;
    const saveEndpoint = (
      body?.dataset.gosakiDiscographySaveEndpoint ||
      body?.dataset.gosakiDiscographyDryRunEndpoint ||
      ""
    ).trim();
    const anonKey = (body?.dataset.gosakiSupabaseAnonKey || "").trim();

    if (!saveEndpoint || !anonKey || !deps.getAccessToken) {
      setUserSaveMessage("いまは保存できません");
      return;
    }

    const token = await deps.getAccessToken();
    if (!token) {
      setUserSaveMessage("ログインが必要です");
      void refreshSaveUi();
      return;
    }

    const savePayload = deps.buildSaveEndpointRequest({
      legacyId: current.legacyId,
      tracksText: current.tracks,
      release,
      expectedBeforeUpdatedAt,
      localDryRun: {
        totalBefore: Number(localDryRun.totalBefore ?? 0),
        totalAfter: Number(localDryRun.totalAfter ?? 0),
        added: (localDryRun.added as string[]) ?? [],
        removed: (localDryRun.removed as string[]) ?? [],
        reordered: Boolean(localDryRun.reordered),
      },
    });

    if (savePayload.operation !== deps.saveOperation) {
      setUserSaveMessage("保存設定が不正です");
      return;
    }
    if (savePayload.approvalId !== deps.expectedSaveApprovalId) {
      setUserSaveMessage("保存設定が一致しません");
      return;
    }

    saveInFlight = true;
    if (saveConflictEl instanceof HTMLElement) saveConflictEl.hidden = true;
    if (saveValidationEl instanceof HTMLElement) {
      saveValidationEl.hidden = true;
      saveValidationEl.textContent = "";
    }
    setUserSaveMessage("保存中…");
    void refreshSaveUi();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(saveEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          apikey: anonKey,
        },
        body: JSON.stringify(savePayload),
        signal: controller.signal,
      });
      let data: unknown = {};
      try {
        data = await res.json();
      } catch {
        indeterminateLocked = true;
        setUserSaveMessage("結果が確認できません。自動では再試行しません。");
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = "通信結果不明 — 再試行禁止";
        }
        return;
      }

      if (
        data &&
        typeof data === "object" &&
        (data as Record<string, unknown>).indeterminate === true
      ) {
        indeterminateLocked = true;
        setUserSaveMessage("結果が確認できません。自動では再試行しません。");
        return;
      }

      if (deps.isSaveConflictResponse(data)) {
        if (saveConflictEl instanceof HTMLElement) {
          saveConflictEl.hidden = false;
          saveConflictEl.textContent = deps.conflictMessage;
        }
        setUserSaveMessage(deps.conflictMessage);
        clearDryRunLock();
        return;
      }

      if (isGosakiSaveNotArmedResponse(data, res.status)) {
        saveNotArmedLocked = true;
        setUserSaveMessage(GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE);
        return;
      }

      const display = deps.sanitizeEndpointDisplay(data, res.status);
      if (display.ok === true) {
        const nextUpdatedAt =
          typeof (data as Record<string, unknown>).updatedAt === "string"
            ? String((data as Record<string, unknown>).updatedAt)
            : typeof (data as Record<string, unknown>).updated_at === "string"
              ? String((data as Record<string, unknown>).updated_at)
              : "";
        if (nextUpdatedAt) {
          form.dataset.expectedBeforeUpdatedAt = nextUpdatedAt;
          const snap = readFormSnapshot(form);
          snap.updatedAt = nextUpdatedAt;
          form.dataset.originalSnapshot = JSON.stringify(snap);
          const tracksField = field(form, "tracks");
          if (tracksField) tracksField.setAttribute("data-original-track-list", snap.tracks);
          updateAlbumCacheUpdatedAt(albums, current.legacyId, nextUpdatedAt);
        }
        if (saveSuccessEl instanceof HTMLElement) {
          saveSuccessEl.hidden = false;
          saveSuccessEl.textContent = GOSAKI_SAVE_SUCCESS_USER_MESSAGE;
        }
        saveSuccessSticky = true;
        setUserSaveMessage(GOSAKI_SAVE_SUCCESS_USER_MESSAGE);
        clearDryRunLock();
        setUnsaved(root, false);
      } else {
        setUserSaveMessage(
          userMessageForSaveFailure(data, res.status, "保存に失敗しました"),
        );
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = "保存に失敗しました";
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        indeterminateLocked = true;
        setUserSaveMessage("時間切れです。自動では再試行しません。");
      } else {
        setUserSaveMessage("保存に失敗しました。自動では再試行しません。");
      }
    } finally {
      window.clearTimeout(timeoutId);
      saveInFlight = false;
      void refreshSaveUi();
    }
  };

  const dryRunBtns = root.querySelectorAll("[data-gosaki-edit-dry-run]");
  dryRunBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await runInternalDryRun();
      if (pendingOneClickSave) {
        pendingOneClickSave = false;
        if (!ok) {
          setUserSaveMessage("入力内容を確認してください");
          return;
        }
        const after = readFormSnapshot(form);
        const matched =
          dryRunSucceeded &&
          dryRunLockedFingerprint != null &&
          dryRunLockedFingerprint === editableFingerprint(after);
        if (!matched) {
          setUserSaveMessage("入力内容を確認してください");
          return;
        }
        if (!isClientSaveArmed(deps.saveArmed)) {
          setUserSaveMessage(GOSAKI_CLIENT_SAVE_DISARMED_REASON);
          return;
        }
        await executeSaveAfterDryRun();
      }
    });
  });

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener("click", async () => {
      if (saveInFlight || dryRunInFlight || indeterminateLocked) return;
      if (saveNotArmedLocked) {
        setUserSaveMessage(GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE);
        void refreshSaveUi();
        return;
      }
      if (!isClientSaveArmed(deps.saveArmed)) {
        setUserSaveMessage(GOSAKI_CLIENT_SAVE_DISARMED_REASON);
        void refreshSaveUi();
        return;
      }
      await refreshSaveUi();
      if (!authenticated) {
        setUserSaveMessage("ログインが必要です");
        return;
      }
      if (!isDirty(form)) {
        setUserSaveMessage("変更がありません");
        return;
      }

      const currentFingerprint = editableFingerprint(readFormSnapshot(form));
      const formMatches =
        dryRunSucceeded &&
        dryRunLockedFingerprint !== "" &&
        currentFingerprint === dryRunLockedFingerprint;

      if (!formMatches) {
        pendingOneClickSave = true;
        setUserSaveMessage("確認中…");
        const internalDry = root.querySelector("[data-gosaki-internal-dry-run]");
        if (internalDry instanceof HTMLElement) {
          internalDry.click();
        } else {
          pendingOneClickSave = false;
          setUserSaveMessage("保存の準備に失敗しました");
        }
        return;
      }

      await executeSaveAfterDryRun();
    });
  }

  void refreshSaveUi();
  setLiveReadUi("pending");

  window.addEventListener("gosaki-admin-auth-changed", ((ev: Event) => {
    const detail = (ev as CustomEvent<{
      signedIn?: boolean;
      userId?: string;
      email?: string;
    }>).detail;
    void liveSession.notifyAuth(gosakiAdminLiveReadAuthFingerprint(detail ?? {}));
  }) as EventListener);

  void (async () => {
    const token = (await (deps.getAccessToken?.() ?? Promise.resolve(null))) || null;
    if (!token) return;
    if (liveSession.getPhase() !== "idle") return;
    void liveSession.notifyAuth(gosakiAdminLiveReadAuthFingerprint({ signedIn: true }));
  })();
}
