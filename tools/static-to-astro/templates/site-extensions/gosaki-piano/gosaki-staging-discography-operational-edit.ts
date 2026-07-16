/**
 * G-20u40 / G-20u41 — Discography operational view/edit client.
 * Dry-run + gated Save wiring (Save default disabled · no auto-save).
 */

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

/**
 * Initialize Discography operational edit UI on a ContentPanel root.
 */
export function initGosakiDiscographyOperationalEdit(
  root: HTMLElement,
  deps: DiscographyOperationalEditDeps,
): void {
  if (root.dataset.gosakiDiscEditInitialized === "true") return;
  root.dataset.gosakiDiscEditInitialized = "true";

  const albums = readAlbumsJson(root);
  const albumById = new Map(albums.map((a) => [a.legacyId, a]));
  const form = root.querySelector("[data-gosaki-disc-edit-form]");
  const resultEl = root.querySelector("[data-gosaki-disc-dry-run-result]");
  const saveBtn = root.querySelector("[data-gosaki-disc-save]");
  const saveReasonEl = root.querySelector("[data-gosaki-disc-save-disabled-reason]");
  const saveInFlightEl = root.querySelector("[data-gosaki-disc-save-in-flight]");
  const saveSuccessEl = root.querySelector("[data-gosaki-disc-save-success]");
  const saveValidationEl = root.querySelector("[data-gosaki-disc-save-validation]");
  const saveConflictEl = root.querySelector("[data-gosaki-disc-save-conflict]");
  const dryRunOkEl = root.querySelector("[data-gosaki-disc-dry-run-ok]");

  if (!(form instanceof HTMLFormElement) || !(resultEl instanceof HTMLElement)) return;

  let dryRunInFlight = false;
  let saveInFlight = false;
  let dryRunSucceeded = false;
  let dryRunLockedFingerprint = "";
  let authenticated = false;

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
    // Candidate from page attr; expected from formal constant dep — never the same binding.
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
      saveInFlight,
    });

    if (saveReasonEl instanceof HTMLElement) {
      saveReasonEl.textContent = gate.enabled
        ? "保存できます（operator 明示操作のみ）"
        : gate.reason || "Save は無効です";
    }
    if (saveBtn instanceof HTMLButtonElement) {
      saveBtn.disabled = !gate.enabled;
      saveBtn.setAttribute("aria-disabled", gate.enabled ? "false" : "true");
    }
    if (saveInFlightEl instanceof HTMLElement) saveInFlightEl.hidden = !saveInFlight;
  };

  const refreshDirty = () => {
    const dirty = isDirty(form);
    setUnsaved(root, dirty);
    if (dirty || (dryRunLockedFingerprint && editableFingerprint(readFormSnapshot(form)) !== dryRunLockedFingerprint)) {
      clearDryRunLock();
    }
    void refreshSaveUi();
  };

  const enterEdit = (legacyId: string) => {
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

  root.querySelectorAll("[data-gosaki-disc-album-summary]").forEach((item) => {
    const legacyId = item.getAttribute("data-gosaki-disc-album-summary") || "";
    item.querySelectorAll("[data-gosaki-edit-start]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (root.dataset.mode === "edit" && isDirty(form)) {
          if (!window.confirm(UNSAVED_SWITCH)) return;
        }
        enterEdit(legacyId);
      });
    });
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

  const dryRunBtns = root.querySelectorAll("[data-gosaki-edit-dry-run]");
  dryRunBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (dryRunInFlight || saveInFlight) return;
      clearDryRunLock();

      const current = readFormSnapshot(form);
      const originalTracks = field(form, "tracks")?.getAttribute("data-original-track-list") ?? "";
      const localDryRun = deps.validateTrackListDryRun(originalTracks, current.tracks, {
        legacyId: current.legacyId,
        title: current.title,
      });
      const release = buildReleasePayload(current);
      const expectedBeforeUpdatedAt = form.dataset.expectedBeforeUpdatedAt || null;

      const localOnly = {
        ok: localDryRun.ok !== false,
        mode: "local+endpoint",
        legacyId: current.legacyId,
        expectedBeforeUpdatedAt,
        trackListDryRun: localDryRun,
        didWrite: false,
        dbWrite: false,
        saveEnabled: false,
      };

      const body = document.body;
      const endpoint = (body?.dataset.gosakiDiscographyDryRunEndpoint || "").trim();
      const anonKey = (body?.dataset.gosakiSupabaseAnonKey || "").trim();

      if (!endpoint || !anonKey) {
        resultEl.textContent = JSON.stringify(
          { ...localOnly, endpoint: { ok: false, errors: ["Endpoint or anon key not configured"] } },
          null,
          2,
        );
        void refreshSaveUi();
        return;
      }

      if (endpoint.includes(deps.productionProjectRefStop) || !deps.assertDryRunEndpointSafe(endpoint)) {
        resultEl.textContent = JSON.stringify(
          { ...localOnly, endpoint: { ok: false, errors: ["Production endpoint blocked — staging only"] } },
          null,
          2,
        );
        void refreshSaveUi();
        return;
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
        resultEl.textContent = JSON.stringify(
          { ...localOnly, endpoint: { ok: false, errors: ["operation must be dryRun only"] } },
          null,
          2,
        );
        void refreshSaveUi();
        return;
      }

      dryRunInFlight = true;
      dryRunBtns.forEach((b) => {
        if (b instanceof HTMLButtonElement) b.disabled = true;
      });
      resultEl.textContent = "Endpoint dry-run 送信中…（DB write なし · Save disabled）";
      void refreshSaveUi();

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + anonKey,
            apikey: anonKey,
          },
          body: JSON.stringify(payload),
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
          if (dryRunOkEl instanceof HTMLElement) dryRunOkEl.hidden = false;
        }
        resultEl.textContent = JSON.stringify(
          {
            ...localOnly,
            endpoint: display,
            requestEcho: {
              expectedBeforeUpdatedAt: payload.expectedBeforeUpdatedAt ?? null,
              operation: payload.operation,
              wouldWriteClient: false,
            },
          },
          null,
          2,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        resultEl.textContent = JSON.stringify(
          {
            ...localOnly,
            endpoint: {
              ok: false,
              fetchError: message,
              didWrite: false,
              dbWrite: false,
              saveEnabled: false,
            },
          },
          null,
          2,
        );
      } finally {
        dryRunInFlight = false;
        dryRunBtns.forEach((b) => {
          if (b instanceof HTMLButtonElement) b.disabled = false;
        });
        void refreshSaveUi();
      }
    });
  });

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener("click", async () => {
      if (saveInFlight || dryRunInFlight) return;
      await refreshSaveUi();
      if (saveBtn.disabled) return;

      const current = readFormSnapshot(form);
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
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = "Save endpoint または認証が未設定です";
        }
        return;
      }

      const token = await deps.getAccessToken();
      if (!token) {
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = "ログインが必要です";
        }
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
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = "Save payload operation が不正です";
        }
        return;
      }
      if (savePayload.approvalId !== deps.expectedSaveApprovalId) {
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = "approval ID が一致しません";
        }
        return;
      }

      saveInFlight = true;
      if (saveConflictEl instanceof HTMLElement) saveConflictEl.hidden = true;
      if (saveValidationEl instanceof HTMLElement) {
        saveValidationEl.hidden = true;
        saveValidationEl.textContent = "";
      }
      void refreshSaveUi();

      try {
        const res = await fetch(saveEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
            apikey: anonKey,
          },
          body: JSON.stringify(savePayload),
        });
        let data: unknown = {};
        try {
          data = await res.json();
        } catch {
          data = { ok: false, errors: ["non-JSON response"] };
        }

        if (deps.isSaveConflictResponse(data)) {
          if (saveConflictEl instanceof HTMLElement) {
            saveConflictEl.hidden = false;
            saveConflictEl.textContent = deps.conflictMessage;
          }
          clearDryRunLock();
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
            updateAlbumCacheUpdatedAt(albums, current.legacyId, nextUpdatedAt);
          }
          if (saveSuccessEl instanceof HTMLElement) {
            saveSuccessEl.hidden = false;
            saveSuccessEl.textContent = "保存に成功しました（staging）";
          }
          clearDryRunLock();
        } else if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = JSON.stringify(display, null, 2);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (saveValidationEl instanceof HTMLElement) {
          saveValidationEl.hidden = false;
          saveValidationEl.textContent = message;
        }
      } finally {
        saveInFlight = false;
        void refreshSaveUi();
      }
    });
  }

  void refreshSaveUi();
}
