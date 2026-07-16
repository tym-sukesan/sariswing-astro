/**
 * G-20u40 — Discography operational view/edit client (dry-run only · no Save).
 * Used by STG package page + shared ContentPanel markers.
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
  buildEndpointRequest: (input: {
    legacyId: string;
    tracksText: string;
    release: Record<string, unknown>;
    expectedBeforeUpdatedAt?: string | null;
    localDryRun?: Record<string, unknown>;
  }) => Record<string, unknown>;
  sanitizeEndpointDisplay: (body: unknown, status?: number) => Record<string, unknown>;
  assertEndpointSafe: (endpoint: string) => boolean;
  dryRunOperation: string;
  productionProjectRefStop: string;
};

const UNSAVED_LEAVE =
  "未保存の変更があります。編集をやめて破棄しますか？";
const UNSAVED_SWITCH =
  "未保存の変更があります。アルバムを切り替えると破棄されます。続けますか？";

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

function isDirty(form: HTMLFormElement): boolean {
  const raw = form.dataset.originalSnapshot || "";
  if (!raw) return false;
  try {
    const original = JSON.parse(raw);
    const current = readFormSnapshot(form);
    const keys = [
      "title",
      "artist",
      "release_date",
      "label",
      "purchase_url",
      "description",
      "tracks",
    ] as const;
    return keys.some((key) => String(original[key] ?? "") !== String(current[key] ?? ""));
  } catch {
    return false;
  }
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

function renderCover(root: HTMLElement, url: string, title: string) {
  const wrap = root.querySelector("[data-gosaki-disc-cover-preview]");
  if (!(wrap instanceof HTMLElement)) return;
  if (url) {
    wrap.innerHTML = `<img src="${url.replace(/"/g, "&quot;")}" alt="" loading="lazy" decoding="async" /><p class="gosaki-discography-content-panel__hint">画像変更は後続フェーズです。</p>`;
  } else {
    wrap.innerHTML = `<p class="gosaki-discography-content-panel__hint">画像なし · 画像変更は後続フェーズです。</p>`;
  }
  void title;
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
  if (!(form instanceof HTMLFormElement) || !(resultEl instanceof HTMLElement)) return;

  let dryRunInFlight = false;

  const refreshDirty = () => setUnsaved(root, isDirty(form));

  const enterEdit = (legacyId: string) => {
    const album = albumById.get(legacyId);
    if (!album) return;
    const snap = snapshotFromAlbum(album);
    applySnapshotToForm(form, snap);
    renderCover(root, snap.cover_image_url, snap.title);
    resultEl.textContent = "（まだ確認していません）";
    setMode(root, "edit");
    setUnsaved(root, false);
  };

  const leaveEdit = () => {
    setMode(root, "view");
    setUnsaved(root, false);
    resultEl.textContent = "（まだ確認していません）";
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
      if (dryRunInFlight) return;
      const current = readFormSnapshot(form);
      const originalTracks = field(form, "tracks")?.getAttribute("data-original-track-list") ?? "";
      const localDryRun = deps.validateTrackListDryRun(originalTracks, current.tracks, {
        legacyId: current.legacyId,
        title: current.title,
      });

      const release = {
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

      const expectedBeforeUpdatedAt = form.dataset.expectedBeforeUpdatedAt || null;
      const localOnly = {
        ok: localDryRun.ok !== false,
        mode: "local+endpoint",
        legacyId: current.legacyId,
        expectedBeforeUpdatedAt,
        before: {
          title: JSON.parse(form.dataset.originalSnapshot || "{}").title,
          artist: JSON.parse(form.dataset.originalSnapshot || "{}").artist,
          release_date: JSON.parse(form.dataset.originalSnapshot || "{}").release_date,
          label: JSON.parse(form.dataset.originalSnapshot || "{}").label,
          purchase_url: JSON.parse(form.dataset.originalSnapshot || "{}").purchase_url,
          description: JSON.parse(form.dataset.originalSnapshot || "{}").description,
          tracks: originalTracks,
        },
        after: {
          title: current.title,
          artist: current.artist,
          release_date: current.release_date,
          label: current.label,
          purchase_url: current.purchase_url,
          description: current.description,
          tracks: current.tracks,
        },
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
          {
            ...localOnly,
            endpoint: { ok: false, errors: ["Endpoint or anon key not configured"] },
          },
          null,
          2,
        );
        return;
      }

      if (
        endpoint.includes(deps.productionProjectRefStop) ||
        !deps.assertEndpointSafe(endpoint)
      ) {
        resultEl.textContent = JSON.stringify(
          {
            ...localOnly,
            endpoint: { ok: false, errors: ["Production endpoint blocked — staging only"] },
          },
          null,
          2,
        );
        return;
      }

      const payload = deps.buildEndpointRequest({
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
        return;
      }

      dryRunInFlight = true;
      dryRunBtns.forEach((b) => {
        if (b instanceof HTMLButtonElement) b.disabled = true;
      });
      resultEl.textContent = "Endpoint dry-run 送信中…（DB write なし · Save disabled）";

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
      }
    });
  });
}
