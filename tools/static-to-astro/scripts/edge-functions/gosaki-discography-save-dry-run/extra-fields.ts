/**
 * Local validation for Discography extra-field save.
 * No network, no Deno, no database client.
 */

export const DISCOGRAPHY_EXTRA_FIELDS_OPERATION = "saveExtraFields";
export const DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID = "gosaki-discography-operational-save-extra-fields";
export const DISCOGRAPHY_EXTRA_FIELDS_RPC_NAME = "gosaki_discography_operational_save_extra_fields";
export const DISCOGRAPHY_EXTRA_FIELDS_ARMED_ENV = "GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_ARMED";
export const DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG = "gosaki-piano";

const TOP_KEYS = [
  "operation",
  "approvalId",
  "siteSlug",
  "legacyId",
  "expectedBeforeUpdatedAt",
  "release",
] as const;

const RELEASE_KEYS = [
  "price",
  "purchase_note",
  "release_display",
  "catalog_number",
  "streaming_url",
  "cover_image_url",
] as const;

export type DiscographyExtraFieldsRpcArgs = {
  p_site_slug: typeof DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG;
  p_legacy_id: string;
  p_expected_before_updated_at: string;
  p_price: string | null;
  p_purchase_note: string | null;
  p_release_display: string | null;
  p_catalog_number: string | null;
  p_streaming_url: string | null;
  p_cover_image_url: string | null;
};

export type DiscographyExtraFieldsRejection = {
  ok: false;
  reasonCode: string;
  message: string;
  status: number;
};

export function validateDiscographyExtraFieldsRequest(
  request: Record<string, unknown>,
): { ok: true; rpcArgs: DiscographyExtraFieldsRpcArgs } | DiscographyExtraFieldsRejection {
  const keys = unexpectedKeys(request, TOP_KEYS);
  if (keys) return reject("unexpected_payload", keys, 400);
  if (request.operation !== DISCOGRAPHY_EXTRA_FIELDS_OPERATION) {
    return reject("operation_mismatch", 'operation must be "saveExtraFields"', 400);
  }
  if (request.approvalId !== DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID) {
    return reject("approval_mismatch", "approvalId is not the extra-fields approval", 400);
  }
  if (request.siteSlug !== DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG) {
    return reject("site_mismatch", "siteSlug must be gosaki-piano", 400);
  }
  if ("published" in request || "tracks" in request || "trackTitles" in request) {
    return reject("unexpected_payload", "published and tracks are not accepted", 400);
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
  if (!isPlainObject(request.release)) {
    return reject("field_validation_failed", "release must be an object", 400);
  }
  const release = request.release;
  if ("published" in release || "title" in release || "tracks" in release) {
    return reject("unexpected_payload", "release includes a column this operation cannot write", 400);
  }
  const releaseExtra = unexpectedKeys(release, RELEASE_KEYS);
  if (releaseExtra) return reject("unexpected_payload", releaseExtra, 400);

  const price = optionalText(release.price, 200, "price");
  if (!price.ok) return price;
  const purchaseNote = optionalText(release.purchase_note, 5000, "purchase_note");
  if (!purchaseNote.ok) return purchaseNote;
  const releaseDisplay = optionalText(release.release_display, 200, "release_display");
  if (!releaseDisplay.ok) return releaseDisplay;
  const catalogNumber = optionalText(release.catalog_number, 200, "catalog_number");
  if (!catalogNumber.ok) return catalogNumber;
  const streamingUrl = optionalUrl(release.streaming_url, "streaming_url");
  if (!streamingUrl.ok) return streamingUrl;
  const coverImageUrl = optionalUrl(release.cover_image_url, "cover_image_url");
  if (!coverImageUrl.ok) return coverImageUrl;

  return {
    ok: true,
    rpcArgs: {
      p_site_slug: DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG,
      p_legacy_id: legacyId,
      p_expected_before_updated_at: expected,
      p_price: price.value,
      p_purchase_note: purchaseNote.value,
      p_release_display: releaseDisplay.value,
      p_catalog_number: catalogNumber.value,
      p_streaming_url: streamingUrl.value,
      p_cover_image_url: coverImageUrl.value,
    },
  };
}

function reject(reasonCode: string, message: string, status: number): DiscographyExtraFieldsRejection {
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

function optionalText(
  value: unknown,
  max: number,
  field: string,
): { ok: true; value: string | null } | DiscographyExtraFieldsRejection {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return reject("field_validation_failed", `invalid ${field}`, 400);
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > max || /[<>]/.test(trimmed)) {
    return reject("field_validation_failed", `invalid ${field}`, 400);
  }
  return { ok: true, value: trimmed };
}

function optionalUrl(
  value: unknown,
  field: string,
): { ok: true; value: string | null } | DiscographyExtraFieldsRejection {
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
