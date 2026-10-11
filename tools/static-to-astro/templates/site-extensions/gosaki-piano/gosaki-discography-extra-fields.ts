/**
 * Edit classification and Edge payload for the six Discography extra fields.
 * Network POST runs only when the caller passes fetchImpl and the UI arm is on.
 */

export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_OPERATION = "saveExtraFields";
export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID =
  "gosaki-discography-operational-save-extra-fields";
export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG = "gosaki-piano";
export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_SAVED_MESSAGE = "追加項目を保存しました";
export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_MIXED_MESSAGE =
  "追加項目と既存の編集項目は別々に保存してください。一度に片方だけ変更してから保存してください。";
export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_STOPPED_MESSAGE =
  "この項目の保存は現在停止しています。";
export const GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_LOCK_MESSAGE =
  "保存できません。更新日時がありません。";

export const GOSAKI_DISCOGRAPHY_CORE_EDIT_KEYS = [
  "title",
  "artist",
  "release_date",
  "label",
  "purchase_url",
  "description",
  "tracks",
] as const;

export const GOSAKI_DISCOGRAPHY_EXTRA_FIELD_KEYS = [
  "price",
  "purchase_note",
  "release_display",
  "catalog_number",
  "streaming_url",
  "cover_image_url",
] as const;

export type GosakiDiscographyExtraFieldKey = (typeof GOSAKI_DISCOGRAPHY_EXTRA_FIELD_KEYS)[number];

export type GosakiDiscographyEditClass = "none" | "core" | "extra" | "mixed";

function norm(value: unknown): string {
  return String(value ?? "").trim();
}

export function classifyGosakiDiscographyEditChanges(input: {
  originalCore: Record<string, unknown>;
  currentCore: Record<string, unknown>;
  originalExtra: Record<string, unknown>;
  currentExtra: Record<string, unknown>;
}): GosakiDiscographyEditClass {
  const core = GOSAKI_DISCOGRAPHY_CORE_EDIT_KEYS.some(
    (key) => norm(input.originalCore[key]) !== norm(input.currentCore[key]),
  );
  const extra = GOSAKI_DISCOGRAPHY_EXTRA_FIELD_KEYS.some(
    (key) => norm(input.originalExtra[key]) !== norm(input.currentExtra[key]),
  );
  if (core && extra) return "mixed";
  if (extra) return "extra";
  if (core) return "core";
  return "none";
}

export function validateGosakiDiscographyExtraFields(input: Record<string, unknown>):
  | {
      ok: true;
      release: Record<GosakiDiscographyExtraFieldKey, string | null>;
    }
  | { ok: false; reasonCode: string; message: string } {
  const release = {} as Record<GosakiDiscographyExtraFieldKey, string | null>;
  for (const key of GOSAKI_DISCOGRAPHY_EXTRA_FIELD_KEYS) {
    const raw = input[key];
    if (raw == null || String(raw).trim() === "") {
      release[key] = null;
      continue;
    }
    if (typeof raw !== "string" && typeof raw !== "number") {
      return { ok: false, reasonCode: "field_validation_failed", message: `${key}を確認してください` };
    }
    const trimmed = String(raw).trim();
    const max = key === "purchase_note" ? 5000 : key === "streaming_url" || key === "cover_image_url" ? 2000 : 200;
    if (trimmed.length > max || /[<>]/.test(trimmed)) {
      return { ok: false, reasonCode: "field_validation_failed", message: `${key}を確認してください` };
    }
    if (key === "streaming_url" || key === "cover_image_url") {
      if (trimmed.toLowerCase().startsWith("javascript:") || !/^https?:\/\//i.test(trimmed)) {
        return { ok: false, reasonCode: "field_validation_failed", message: `${key}を確認してください` };
      }
    }
    release[key] = trimmed;
  }
  return { ok: true, release };
}

export function buildGosakiDiscographyExtraFieldsEdgeBody(input: {
  legacyId: string;
  expectedBeforeUpdatedAt: string | null | undefined;
  fields: Record<string, unknown>;
}):
  | {
      ok: true;
      body: {
        operation: typeof GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_OPERATION;
        approvalId: typeof GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID;
        siteSlug: typeof GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG;
        legacyId: string;
        expectedBeforeUpdatedAt: string;
        release: Record<GosakiDiscographyExtraFieldKey, string | null>;
      };
    }
  | { ok: false; reasonCode: string; message: string } {
  const legacyId = String(input.legacyId ?? "").trim();
  if (!/^discography-[0-9]{3}$/.test(legacyId)) {
    return { ok: false, reasonCode: "legacy_id_mismatch", message: "作品IDを確認してください" };
  }
  const expected = String(input.expectedBeforeUpdatedAt ?? "").trim();
  if (!expected) {
    return {
      ok: false,
      reasonCode: "optimistic_lock_missing",
      message: GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_LOCK_MESSAGE,
    };
  }
  const validated = validateGosakiDiscographyExtraFields(input.fields);
  if (!validated.ok) return validated;
  return {
    ok: true,
    body: {
      operation: GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_OPERATION,
      approvalId: GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_APPROVAL_ID,
      siteSlug: GOSAKI_DISCOGRAPHY_EXTRA_FIELDS_SITE_SLUG,
      legacyId,
      expectedBeforeUpdatedAt: expected,
      release: validated.release,
    },
  };
}

export async function runGosakiDiscographyExtraFieldsEdgeAttempt(input: {
  armed: boolean;
  legacyId: string;
  expectedBeforeUpdatedAt: string | null | undefined;
  fields: Record<string, unknown>;
  endpoint: string;
  anonKey: string;
  accessToken: string;
  endpointSafe: boolean;
  fetchImpl: (url: string, init: Record<string, unknown>) => Promise<{
    status: number;
    json: () => Promise<unknown>;
  }>;
}): Promise<{ called: boolean; status: number; body: Record<string, unknown>; edgeBody?: Record<string, unknown> }> {
  if (!input.armed) {
    return { called: false, status: 0, body: { ok: false, reasonCode: "extra_fields_not_armed" } };
  }
  const built = buildGosakiDiscographyExtraFieldsEdgeBody({
    legacyId: input.legacyId,
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt,
    fields: input.fields,
  });
  if (!built.ok) {
    return { called: false, status: 0, body: { ok: false, reasonCode: built.reasonCode } };
  }
  if (!input.endpointSafe || !String(input.accessToken ?? "").trim() || !String(input.endpoint ?? "").trim()) {
    return { called: false, status: 0, body: { ok: false, reasonCode: "endpoint_unsafe" }, edgeBody: built.body };
  }
  const response = await input.fetchImpl(input.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + input.accessToken,
      apikey: input.anonKey,
    },
    body: JSON.stringify(built.body),
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
  return { called: true, status: response.status, body, edgeBody: built.body };
}
