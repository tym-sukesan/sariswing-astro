/**
 * Local validation for Discography create and setPublished.
 * No network, no Deno, no database client.
 */

export const DISCOGRAPHY_CREATE_OPERATION = "create";
export const DISCOGRAPHY_CREATE_APPROVAL_ID = "gosaki-discography-operational-create";
export const DISCOGRAPHY_CREATE_RPC_NAME = "gosaki_discography_operational_create";
export const DISCOGRAPHY_CREATE_ARMED_ENV = "GOSAKI_DISCOGRAPHY_CREATE_ARMED";

export const DISCOGRAPHY_SET_PUBLISHED_OPERATION = "setPublished";
export const DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID = "gosaki-discography-operational-set-published";
export const DISCOGRAPHY_SET_PUBLISHED_RPC_NAME = "gosaki_discography_operational_set_published";
export const DISCOGRAPHY_SET_PUBLISHED_ARMED_ENV = "GOSAKI_DISCOGRAPHY_SET_PUBLISHED_ARMED";

export const DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG = "gosaki-piano";

const CREATE_KEYS = ["operation", "approvalId", "siteSlug", "release", "trackTitles"] as const;
const RELEASE_KEYS = [
  "title",
  "artist",
  "release_date",
  "release_display",
  "label",
  "catalog_number",
  "description",
  "price",
  "purchase_note",
  "purchase_url",
  "streaming_url",
  "cover_image_url",
] as const;
const SET_PUBLISHED_KEYS = [
  "operation",
  "approvalId",
  "siteSlug",
  "legacyId",
  "expectedBeforeUpdatedAt",
  "published",
] as const;

export type DiscographyCreateRpcArgs = {
  p_site_slug: typeof DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG;
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

export type DiscographySetPublishedRpcArgs = {
  p_site_slug: typeof DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG;
  p_legacy_id: string;
  p_expected_before_updated_at: string;
  p_published: true;
};

export type DiscographyEdgeRejection = {
  ok: false;
  reasonCode: string;
  message: string;
  status: number;
};

export type DiscographyRpcMap = {
  ok: boolean;
  reasonCode: string;
  message: string;
  status: number;
  legacyId: string;
  published: boolean | null;
  updatedAt: string;
  sortOrder: number | null;
  trackCount: number | null;
  didWrite: boolean;
};

export function isDiscographyEdgeArmExactTrue(value: string | undefined): boolean {
  return value === "true";
}

export function validateDiscographyCreateRequest(
  request: Record<string, unknown>,
): { ok: true; rpcArgs: DiscographyCreateRpcArgs } | DiscographyEdgeRejection {
  if ("legacyId" in request || "discographyLegacyId" in request || "p_legacy_id" in request) {
    return reject("legacy_id_forbidden", "legacy_id must not be sent by the caller", 400);
  }
  if ("published" in request || "p_published" in request) {
    return reject("published_forbidden", "published must not be sent by the caller", 400);
  }
  const keys = unexpectedKeys(request, CREATE_KEYS);
  if (keys) return reject("unexpected_payload", keys, 400);
  if (request.operation !== DISCOGRAPHY_CREATE_OPERATION) {
    return reject("operation_mismatch", 'operation must be "create"', 400);
  }
  if (request.approvalId !== DISCOGRAPHY_CREATE_APPROVAL_ID) {
    return reject("approval_mismatch", "approvalId is not the create approval", 400);
  }
  if (request.siteSlug !== DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG) {
    return reject("site_mismatch", "siteSlug must be gosaki-piano", 400);
  }
  if (!isPlainObject(request.release)) {
    return reject("field_validation_failed", "release must be an object", 400);
  }
  const release = request.release;
  if ("published" in release) {
    return reject("published_forbidden", "published must not be sent by the caller", 400);
  }
  const releaseExtra = unexpectedKeys(release, RELEASE_KEYS);
  if (releaseExtra) return reject("unexpected_payload", releaseExtra, 400);

  const title = requiredText(release.title, 200, "title");
  if (!title.ok) return title;
  const artist = optionalText(release.artist, 200, "artist");
  if (!artist.ok) return artist;
  const releaseDate = optionalDate(release.release_date);
  if (!releaseDate.ok) return releaseDate;
  const releaseDisplay = optionalText(release.release_display, 200, "release_display");
  if (!releaseDisplay.ok) return releaseDisplay;
  const label = optionalText(release.label, 200, "label");
  if (!label.ok) return label;
  const catalogNumber = optionalText(release.catalog_number, 200, "catalog_number");
  if (!catalogNumber.ok) return catalogNumber;
  const description = optionalText(release.description, 5000, "description");
  if (!description.ok) return description;
  const price = optionalText(release.price, 200, "price");
  if (!price.ok) return price;
  const purchaseNote = optionalText(release.purchase_note, 5000, "purchase_note");
  if (!purchaseNote.ok) return purchaseNote;
  const purchaseUrl = optionalUrl(release.purchase_url, "purchase_url");
  if (!purchaseUrl.ok) return purchaseUrl;
  const streamingUrl = optionalUrl(release.streaming_url, "streaming_url");
  if (!streamingUrl.ok) return streamingUrl;
  const coverImageUrl = optionalUrl(release.cover_image_url, "cover_image_url");
  if (!coverImageUrl.ok) return coverImageUrl;

  const tracks = parseTrackTitles(request.trackTitles);
  if (!tracks.ok) return tracks;

  return {
    ok: true,
    rpcArgs: {
      p_site_slug: DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG,
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
  };
}

export function validateDiscographySetPublishedRequest(
  request: Record<string, unknown>,
): { ok: true; rpcArgs: DiscographySetPublishedRpcArgs } | DiscographyEdgeRejection {
  const keys = unexpectedKeys(request, SET_PUBLISHED_KEYS);
  if (keys) return reject("unexpected_payload", keys, 400);
  if (request.operation !== DISCOGRAPHY_SET_PUBLISHED_OPERATION) {
    return reject("operation_mismatch", 'operation must be "setPublished"', 400);
  }
  if (request.approvalId !== DISCOGRAPHY_SET_PUBLISHED_APPROVAL_ID) {
    return reject("approval_mismatch", "approvalId is not the setPublished approval", 400);
  }
  if (request.siteSlug !== DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG) {
    return reject("site_mismatch", "siteSlug must be gosaki-piano", 400);
  }
  if (request.published !== true) {
    return reject("publish_only", "only published=true is accepted", 400);
  }
  const legacyId = typeof request.legacyId === "string" ? request.legacyId.trim() : "";
  if (!legacyId) return reject("legacy_id_required", "legacyId is required", 400);
  if (!/^discography-[0-9]{3}$/.test(legacyId)) {
    return reject("legacy_id_mismatch", "legacyId must match discography-NNN", 400);
  }
  const expected =
    typeof request.expectedBeforeUpdatedAt === "string" ? request.expectedBeforeUpdatedAt.trim() : "";
  if (!expected) {
    return reject("optimistic_lock_missing", "expectedBeforeUpdatedAt is required", 400);
  }
  return {
    ok: true,
    rpcArgs: {
      p_site_slug: DISCOGRAPHY_CREATE_PUBLISH_SITE_SLUG,
      p_legacy_id: legacyId,
      p_expected_before_updated_at: expected,
      p_published: true,
    },
  };
}

export function mapDiscographyWriteRpcResult(
  rpcData: unknown,
  transportError: { message?: string } | null,
): DiscographyRpcMap {
  if (transportError) {
    return {
      ok: false,
      reasonCode: "rpc_error",
      message: String(transportError.message ?? "RPC call failed"),
      status: 500,
      legacyId: "",
      published: null,
      updatedAt: "",
      sortOrder: null,
      trackCount: null,
      didWrite: false,
    };
  }
  const rpc =
    rpcData && typeof rpcData === "object" && !Array.isArray(rpcData)
      ? (rpcData as Record<string, unknown>)
      : {};
  const httpStatus = Number(rpc.http_status ?? rpc.httpStatus ?? (rpc.ok === true ? 200 : 400));
  const status = allowedStatus(httpStatus) ? httpStatus : 400;
  const published = typeof rpc.published === "boolean" ? rpc.published : null;
  return {
    ok: rpc.ok === true,
    reasonCode: String(rpc.reason_code ?? rpc.reasonCode ?? (rpc.ok === true ? "ok" : "rpc_rejected")),
    message: String(rpc.message ?? ""),
    status,
    legacyId: typeof rpc.legacy_id === "string" ? rpc.legacy_id : "",
    published,
    updatedAt: typeof rpc.updated_at === "string" ? rpc.updated_at : "",
    sortOrder: typeof rpc.sort_order === "number" ? rpc.sort_order : null,
    trackCount: typeof rpc.track_count === "number" ? rpc.track_count : null,
    didWrite: rpc.ok === true && status === 200,
  };
}

function allowedStatus(status: number): boolean {
  return status === 200 || status === 400 || status === 403 || status === 404 || status === 409 || status === 422 || status === 500 || status === 503;
}

function reject(reasonCode: string, message: string, status: number): DiscographyEdgeRejection {
  return { ok: false, reasonCode, message, status };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unexpectedKeys(value: Record<string, unknown>, allowed: readonly string[]): string | null {
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extra.length === 0) return null;
  return `unexpected payload keys: ${extra.join(", ")}`;
}

function requiredText(
  value: unknown,
  max: number,
  field: string,
): { ok: true; value: string } | DiscographyEdgeRejection {
  if (typeof value !== "string" || !value.trim()) {
    return reject("field_validation_failed", `${field} is required`, 400);
  }
  const trimmed = value.trim();
  if (trimmed.length > max || /[<>]/.test(trimmed)) {
    return reject("field_validation_failed", `invalid ${field}`, 400);
  }
  return { ok: true, value: trimmed };
}

function optionalText(
  value: unknown,
  max: number,
  field: string,
): { ok: true; value: string | null } | DiscographyEdgeRejection {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return reject("field_validation_failed", `invalid ${field}`, 400);
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > max || /[<>]/.test(trimmed)) {
    return reject("field_validation_failed", `invalid ${field}`, 400);
  }
  return { ok: true, value: trimmed };
}

function optionalDate(value: unknown): { ok: true; value: string | null } | DiscographyEdgeRejection {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return reject("field_validation_failed", "invalid release_date", 400);
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return reject("field_validation_failed", "invalid release_date", 400);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return reject("field_validation_failed", "invalid release_date", 400);
  }
  return { ok: true, value: trimmed };
}

function optionalUrl(
  value: unknown,
  field: string,
): { ok: true; value: string | null } | DiscographyEdgeRejection {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return reject("field_validation_failed", `invalid ${field}`, 400);
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (
    trimmed.length > 2000 ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    !/^https?:\/\//i.test(trimmed) ||
    /[<>]/.test(trimmed)
  ) {
    return reject("field_validation_failed", `invalid ${field}`, 400);
  }
  return { ok: true, value: trimmed };
}

function parseTrackTitles(
  value: unknown,
): { ok: true; titles: string[] } | DiscographyEdgeRejection {
  if (!Array.isArray(value)) {
    return reject("tracks_required", "trackTitles array is required", 400);
  }
  if (value.length > 100) {
    return reject("tracks_validation_failed", "too many tracks", 400);
  }
  const titles: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return reject("tracks_validation_failed", "invalid track title", 400);
    }
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > 200 || /[<>]/.test(trimmed)) {
      return reject("tracks_validation_failed", "invalid track title", 400);
    }
    titles.push(trimmed);
  }
  return { ok: true, titles };
}
