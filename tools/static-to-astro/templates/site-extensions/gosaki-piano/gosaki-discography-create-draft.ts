/**
 * Local dry-run payload for a new Gosaki discography album.
 * Matches gosaki_discography_operational_create arguments.
 * Network POST runs only when a caller passes fetchImpl and the UI arm is on.
 */

export const GOSAKI_DISCOGRAPHY_CREATE_SITE_SLUG = "gosaki-piano";
export const GOSAKI_DISCOGRAPHY_CREATE_RPC = "gosaki_discography_operational_create";
export const GOSAKI_DISCOGRAPHY_CREATE_LOCAL_CONFIRM_MESSAGE =
  "下書き内容を確認しました。データベースには保存していません。";
export const GOSAKI_DISCOGRAPHY_CREATE_EDGE_APPROVAL_ID = "gosaki-discography-operational-create";
export const GOSAKI_DISCOGRAPHY_SET_PUBLISHED_EDGE_APPROVAL_ID =
  "gosaki-discography-operational-set-published";
export const GOSAKI_DISCOGRAPHY_CREATE_SAVED_MESSAGE_PREFIX = "下書きとして保存しました";
export const GOSAKI_DISCOGRAPHY_PUBLISH_SITE_UPDATE_MESSAGE =
  "公開対象に設定しました。公開サイトへの反映には、管理ポータルの「公開サイトを更新」が必要です。";

export type GosakiDiscographyCreateInput = {
  title: string;
  artist: string;
  releaseDate: string;
  releaseDisplay: string;
  label: string;
  catalogNumber: string;
  price: string;
  purchaseNote: string;
  description: string;
  purchaseUrl: string;
  streamingUrl: string;
  coverImageUrl: string;
  trackListText: string;
};

export type GosakiDiscographyCreateDryRunPayload = {
  ok: true;
  dryRun: true;
  networkWrite: false;
  rpc: typeof GOSAKI_DISCOGRAPHY_CREATE_RPC;
  published: false;
  args: {
    p_site_slug: typeof GOSAKI_DISCOGRAPHY_CREATE_SITE_SLUG;
    p_title: string;
    p_artist: string | null;
    p_release_date: string | null;
    p_release_display: string | null;
    p_label: string | null;
    p_catalog_number: string | null;
    p_description: string | null;
    p_price: string | null;
    p_purchase_note: string | null;
    p_purchase_url: string | null;
    p_streaming_url: string | null;
    p_cover_image_url: string | null;
    p_track_titles: string[];
  };
};

export type GosakiDiscographyCreateValidation =
  | { ok: true; payload: GosakiDiscographyCreateDryRunPayload }
  | { ok: false; reasonCode: string; field: string; message: string };

const FIELD_LABELS: Record<string, string> = {
  title: "タイトル",
  artist: "アーティスト",
  release_date: "発売日",
  release_display: "表示用発売日",
  label: "レーベル",
  catalog_number: "カタログ番号",
  description: "説明文",
  price: "価格",
  purchase_note: "購入案内",
  purchase_url: "購入URL",
  streaming_url: "配信URL",
  cover_image_url: "ジャケットURL",
  tracks: "曲名",
};

export type GosakiDiscographyPanelMode = "view" | "edit" | "create";

export function gosakiDiscographyPanelModeAfter(
  action: "create" | "edit" | "cancel",
): GosakiDiscographyPanelMode {
  if (action === "cancel") return "view";
  if (action === "create") return "create";
  return "edit";
}

export function gosakiDiscographyCreateFingerprint(input: GosakiDiscographyCreateInput): string {
  return JSON.stringify([
    input.title,
    input.artist,
    input.releaseDate,
    input.releaseDisplay,
    input.label,
    input.catalogNumber,
    input.price,
    input.purchaseNote,
    input.description,
    input.purchaseUrl,
    input.streamingUrl,
    input.coverImageUrl,
    input.trackListText,
  ]);
}

export function gosakiDiscographyCreateSaveBar(input: {
  dirty: boolean;
  inFlight: boolean;
  validationMessage: string;
  confirmed: boolean;
}): {
  enabled: boolean;
  reason: string;
  inFlightVisible: boolean;
  validationVisible: boolean;
  successVisible: boolean;
  successMessage: string;
} {
  if (input.inFlight) {
    return {
      enabled: false,
      reason: "保存中…",
      inFlightVisible: true,
      validationVisible: false,
      successVisible: false,
      successMessage: "",
    };
  }
  if (input.validationMessage) {
    return {
      enabled: input.dirty,
      reason: "入力内容を確認してください",
      inFlightVisible: false,
      validationVisible: true,
      successVisible: false,
      successMessage: "",
    };
  }
  if (!input.dirty) {
    return {
      enabled: false,
      reason: "変更がありません",
      inFlightVisible: false,
      validationVisible: false,
      successVisible: false,
      successMessage: "",
    };
  }
  if (input.confirmed) {
    return {
      enabled: true,
      reason: GOSAKI_DISCOGRAPHY_CREATE_LOCAL_CONFIRM_MESSAGE,
      inFlightVisible: false,
      validationVisible: false,
      successVisible: true,
      successMessage: GOSAKI_DISCOGRAPHY_CREATE_LOCAL_CONFIRM_MESSAGE,
    };
  }
  return {
    enabled: true,
    reason: "未保存の変更があります",
    inFlightVisible: false,
    validationVisible: false,
    successVisible: false,
    successMessage: "",
  };
}

export function buildGosakiDiscographyCreateEdgeBody(
  input: GosakiDiscographyCreateInput,
):
  | {
      ok: true;
      body: {
        operation: "create";
        approvalId: typeof GOSAKI_DISCOGRAPHY_CREATE_EDGE_APPROVAL_ID;
        siteSlug: typeof GOSAKI_DISCOGRAPHY_CREATE_SITE_SLUG;
        release: {
          title: string;
          artist: string | null;
          release_date: string | null;
          release_display: string | null;
          label: string | null;
          catalog_number: string | null;
          description: string | null;
          price: string | null;
          purchase_note: string | null;
          purchase_url: string | null;
          streaming_url: string | null;
          cover_image_url: string | null;
        };
        trackTitles: string[];
      };
    }
  | { ok: false; reasonCode: string; field: string; message: string } {
  const validated = validateGosakiDiscographyCreateInput(input);
  if (!validated.ok) return validated;
  const args = validated.payload.args;
  return {
    ok: true,
    body: {
      operation: "create",
      approvalId: GOSAKI_DISCOGRAPHY_CREATE_EDGE_APPROVAL_ID,
      siteSlug: args.p_site_slug,
      release: {
        title: args.p_title,
        artist: args.p_artist,
        release_date: args.p_release_date,
        release_display: args.p_release_display,
        label: args.p_label,
        catalog_number: args.p_catalog_number,
        description: args.p_description,
        price: args.p_price,
        purchase_note: args.p_purchase_note,
        purchase_url: args.p_purchase_url,
        streaming_url: args.p_streaming_url,
        cover_image_url: args.p_cover_image_url,
      },
      trackTitles: args.p_track_titles,
    },
  };
}

export function buildGosakiDiscographySetPublishedEdgeBody(input: {
  legacyId: string;
  expectedBeforeUpdatedAt: string | null | undefined;
  published?: boolean;
}):
  | {
      ok: true;
      body: {
        operation: "setPublished";
        approvalId: typeof GOSAKI_DISCOGRAPHY_SET_PUBLISHED_EDGE_APPROVAL_ID;
        siteSlug: typeof GOSAKI_DISCOGRAPHY_CREATE_SITE_SLUG;
        legacyId: string;
        expectedBeforeUpdatedAt: string;
        published: true;
      };
    }
  | { ok: false; reasonCode: string; message: string } {
  if (input.published !== true) {
    return { ok: false, reasonCode: "publish_only", message: "only published=true is accepted" };
  }
  const legacyId = String(input.legacyId ?? "").trim();
  if (!/^discography-[0-9]{3}$/.test(legacyId)) {
    return { ok: false, reasonCode: "legacy_id_mismatch", message: "legacyId must match discography-NNN" };
  }
  const expected = String(input.expectedBeforeUpdatedAt ?? "").trim();
  if (!expected) {
    return {
      ok: false,
      reasonCode: "optimistic_lock_missing",
      message: "expectedBeforeUpdatedAt is required",
    };
  }
  return {
    ok: true,
    body: {
      operation: "setPublished",
      approvalId: GOSAKI_DISCOGRAPHY_SET_PUBLISHED_EDGE_APPROVAL_ID,
      siteSlug: GOSAKI_DISCOGRAPHY_CREATE_SITE_SLUG,
      legacyId,
      expectedBeforeUpdatedAt: expected,
      published: true,
    },
  };
}

export function gosakiDiscographyPublishAvailability(album: {
  published?: boolean;
  updatedAt?: string | null;
}): { showPublish: boolean; enabled: boolean; reasonCode: string } {
  if (album.published !== false) {
    return { showPublish: false, enabled: false, reasonCode: "already_published" };
  }
  if (!String(album.updatedAt ?? "").trim()) {
    return { showPublish: true, enabled: false, reasonCode: "optimistic_lock_missing" };
  }
  return { showPublish: true, enabled: true, reasonCode: "ok" };
}

export function gosakiDiscographyEdgeFailureMessage(status: number, reasonCode: string): string {
  if (status === 409 || reasonCode === "optimistic_lock_conflict" || reasonCode === "legacy_id_conflict") {
    return "他の更新と競合しました。一覧を再読み込みしてください。";
  }
  if (status === 422 || reasonCode === "already_published") {
    return "すでに公開済みです。変更は行っていません。";
  }
  if (
    status === 403 ||
    reasonCode === "can_write_site_denied" ||
    reasonCode === "create_not_armed" ||
    reasonCode === "set_published_not_armed"
  ) {
    return "権限がないか、機能が停止しています。";
  }
  return "保存に失敗しました。";
}

export async function runGosakiDiscographyCreateEdgeAttempt(input: {
  armed: boolean;
  createInput: GosakiDiscographyCreateInput;
  endpoint: string;
  anonKey: string;
  accessToken: string;
  endpointSafe: boolean;
  fetchImpl: (input: string, init: Record<string, unknown>) => Promise<{
    status: number;
    json: () => Promise<unknown>;
  }>;
}): Promise<{
  mode: "dry-run" | "edge";
  called: boolean;
  status: number;
  body: Record<string, unknown>;
  edgeBody?: Record<string, unknown>;
}> {
  if (!input.armed) {
    const local = validateGosakiDiscographyCreateInput(input.createInput);
    return {
      mode: "dry-run",
      called: false,
      status: 0,
      body: local.ok ? { ok: true, networkWrite: false, published: false } : { ok: false, reasonCode: local.reasonCode },
    };
  }
  const built = buildGosakiDiscographyCreateEdgeBody(input.createInput);
  if (!built.ok) {
    return { mode: "edge", called: false, status: 0, body: { ok: false, reasonCode: built.reasonCode } };
  }
  const posted = await postGosakiDiscographyEdgeJson({
    endpoint: input.endpoint,
    anonKey: input.anonKey,
    accessToken: input.accessToken,
    body: built.body,
    endpointSafe: input.endpointSafe,
    fetchImpl: input.fetchImpl,
  });
  return { mode: "edge", called: posted.called, status: posted.status, body: posted.body, edgeBody: built.body };
}

export async function runGosakiDiscographySetPublishedEdgeAttempt(input: {
  armed: boolean;
  confirmAccepted: boolean;
  published: boolean | undefined;
  legacyId: string;
  expectedBeforeUpdatedAt: string | null | undefined;
  endpoint: string;
  anonKey: string;
  accessToken: string;
  endpointSafe: boolean;
  fetchImpl: (input: string, init: Record<string, unknown>) => Promise<{
    status: number;
    json: () => Promise<unknown>;
  }>;
}): Promise<{ called: boolean; status: number; body: Record<string, unknown>; edgeBody?: Record<string, unknown> }> {
  const availability = gosakiDiscographyPublishAvailability({
    published: input.published,
    updatedAt: input.expectedBeforeUpdatedAt,
  });
  if (!availability.showPublish || !availability.enabled) {
    return { called: false, status: 0, body: { ok: false, reasonCode: availability.reasonCode } };
  }
  if (!input.armed || !input.confirmAccepted) {
    return { called: false, status: 0, body: { ok: false, reasonCode: input.armed ? "confirm_required" : "set_published_not_armed" } };
  }
  const built = buildGosakiDiscographySetPublishedEdgeBody({
    legacyId: input.legacyId,
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt,
    published: true,
  });
  if (!built.ok) {
    return { called: false, status: 0, body: { ok: false, reasonCode: built.reasonCode } };
  }
  const posted = await postGosakiDiscographyEdgeJson({
    endpoint: input.endpoint,
    anonKey: input.anonKey,
    accessToken: input.accessToken,
    body: built.body,
    endpointSafe: input.endpointSafe,
    fetchImpl: input.fetchImpl,
  });
  return { called: posted.called, status: posted.status, body: posted.body, edgeBody: built.body };
}

export async function postGosakiDiscographyEdgeJson(input: {
  endpoint: string;
  anonKey: string;
  accessToken: string;
  body: Record<string, unknown>;
  endpointSafe: boolean;
  fetchImpl: (input: string, init: Record<string, unknown>) => Promise<{
    status: number;
    json: () => Promise<unknown>;
  }>;
}): Promise<{ called: boolean; status: number; body: Record<string, unknown> }> {
  if (!input.endpointSafe || !String(input.accessToken ?? "").trim() || !String(input.endpoint ?? "").trim()) {
    return { called: false, status: 0, body: {} };
  }
  const response = await input.fetchImpl(input.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + input.accessToken,
      apikey: input.anonKey,
    },
    body: JSON.stringify(input.body),
  });
  let parsed: unknown = {};
  try {
    parsed = await response.json();
  } catch {
    parsed = {};
  }
  const body =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  return { called: true, status: response.status, body };
}

export function gosakiDiscographyCreateCoverPreviewUrl(value: string): string | null {
  const checked = optionalUrl(value, "cover_image_url");
  return checked.ok ? checked.value : null;
}

export function parseGosakiDiscographyCreateTrackTitles(
  text: string,
): { ok: true; titles: string[] } | { ok: false; reasonCode: string; field: string; message: string } {
  const titles: string[] = [];
  for (const line of String(text ?? "").split(/\r\n|\n|\r/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length > 200 || /[<>]/.test(trimmed)) {
      return {
        ok: false,
        reasonCode: "tracks_validation_failed",
        field: "tracks",
        message: `${FIELD_LABELS.tracks}を確認してください`,
      };
    }
    titles.push(trimmed);
  }
  if (titles.length > 100) {
    return {
      ok: false,
      reasonCode: "tracks_validation_failed",
      field: "tracks",
      message: "曲は100件までです",
    };
  }
  return { ok: true, titles };
}

export function validateGosakiDiscographyCreateInput(
  input: GosakiDiscographyCreateInput,
): GosakiDiscographyCreateValidation {
  const title = optionalText(input.title, 200, "title");
  if (!title.ok) return title;
  if (!title.value) {
    return {
      ok: false,
      reasonCode: "field_validation_failed",
      field: "title",
      message: `${FIELD_LABELS.title}を確認してください`,
    };
  }

  const artist = optionalText(input.artist, 200, "artist");
  if (!artist.ok) return artist;
  const releaseDisplay = optionalText(input.releaseDisplay, 200, "release_display");
  if (!releaseDisplay.ok) return releaseDisplay;
  const label = optionalText(input.label, 200, "label");
  if (!label.ok) return label;
  const catalogNumber = optionalText(input.catalogNumber, 200, "catalog_number");
  if (!catalogNumber.ok) return catalogNumber;
  const price = optionalText(input.price, 200, "price");
  if (!price.ok) return price;
  const description = optionalText(input.description, 5000, "description");
  if (!description.ok) return description;
  const purchaseNote = optionalText(input.purchaseNote, 5000, "purchase_note");
  if (!purchaseNote.ok) return purchaseNote;

  const releaseDate = parseReleaseDate(input.releaseDate);
  if (!releaseDate.ok) return releaseDate;

  const purchaseUrl = optionalUrl(input.purchaseUrl, "purchase_url");
  if (!purchaseUrl.ok) return purchaseUrl;
  const streamingUrl = optionalUrl(input.streamingUrl, "streaming_url");
  if (!streamingUrl.ok) return streamingUrl;
  const coverImageUrl = optionalUrl(input.coverImageUrl, "cover_image_url");
  if (!coverImageUrl.ok) return coverImageUrl;

  const tracks = parseGosakiDiscographyCreateTrackTitles(input.trackListText);
  if (!tracks.ok) return tracks;

  return {
    ok: true,
    payload: {
      ok: true,
      dryRun: true,
      networkWrite: false,
      rpc: GOSAKI_DISCOGRAPHY_CREATE_RPC,
      published: false,
      args: {
        p_site_slug: GOSAKI_DISCOGRAPHY_CREATE_SITE_SLUG,
        p_title: title.value,
        p_artist: artist.value,
        p_release_date: releaseDate.value,
        p_release_display: releaseDisplay.value,
        p_label: label.value,
        p_catalog_number: catalogNumber.value,
        p_description: description.value,
        p_price: price.value,
        p_purchase_note: purchaseNote.value,
        p_purchase_url: purchaseUrl.value,
        p_streaming_url: streamingUrl.value,
        p_cover_image_url: coverImageUrl.value,
        p_track_titles: tracks.titles,
      },
    },
  };
}

function invalidField(field: string, reasonCode = "field_validation_failed") {
  return {
    ok: false as const,
    reasonCode,
    field,
    message: `${FIELD_LABELS[field] ?? field}を確認してください`,
  };
}

function optionalText(
  value: string,
  max: number,
  field: string,
): { ok: true; value: string | null } | ReturnType<typeof invalidField> {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > max || /[<>]/.test(trimmed)) return invalidField(field);
  return { ok: true, value: trimmed };
}

function optionalUrl(
  value: string,
  field: string,
): { ok: true; value: string | null } | ReturnType<typeof invalidField> {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  if (
    trimmed.length > 2000 ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    !/^https?:\/\//i.test(trimmed) ||
    /[<>]/.test(trimmed)
  ) {
    return invalidField(field);
  }
  return { ok: true, value: trimmed };
}

function parseReleaseDate(
  value: string,
): { ok: true; value: string | null } | ReturnType<typeof invalidField> {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return invalidField("release_date");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return invalidField("release_date");
  }
  return { ok: true, value: trimmed };
}
