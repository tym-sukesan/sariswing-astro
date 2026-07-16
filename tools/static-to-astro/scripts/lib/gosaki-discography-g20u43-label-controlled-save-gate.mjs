/**
 * G-20u43 — Gosaki Discography label controlled Save gate (pure · Node-runnable).
 * Mirrors supabase/functions/gosaki-discography-save-dry-run/handler.ts allowlist rules.
 * No network · no DB · no Edge invoke.
 */

export const G20U43_LABEL_SAVE_APPROVAL_ID =
  "G-20u43-gosaki-discography-label-controlled-save-slice";
export const G20U36_TRACKLIST_SAVE_APPROVAL_ID =
  "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
export const G20U31_DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
export const G20U43_LABEL_SITE_SLUG = "gosaki-piano";
export const G20U43_LABEL_LEGACY_ID = "discography-004";
export const G20U43_LABEL_ALBUM_TITLE = "Ja-Jaaaaan!";
export const G20U43_LABEL_ORIGINAL = "Mardi Gras JAPAN Records";
export const G20U43_LABEL_TEMPORARY = "[CMS Kit staging] G-20u42 label PoC";
export const G20U43_SAVE_OPERATION = "save";

/** Top-level keys allowed on G-20u43 Save request body. */
export const G20U43_ALLOWED_TOP_LEVEL_KEYS = Object.freeze([
  "operation",
  "siteSlug",
  "legacyId",
  "discographyLegacyId",
  "approvalId",
  "expectedBeforeUpdatedAt",
  "release",
  "tracksText",
  "trackPolicy",
  "clientDryRun",
  "beforeLabel",
]);

/** Nested keys — must match buildDiscographyDryRunEndpointRequest / handler usage. */
export const G20U43_RELEASE_ALLOWED_KEYS = Object.freeze([
  "title",
  "artist",
  "release_date",
  "label",
  "catalog_number",
  "published",
  "cover_image_url",
  "purchase_url",
  "streaming_url",
  "description",
]);

export const G20U43_TRACK_POLICY_ALLOWED_KEYS = Object.freeze([
  "oneLineOneTrack",
  "blankLinesIgnored",
  "allowDuplicateTitles",
  "allowEmptyTrackList",
]);

export const G20U43_CLIENT_DRY_RUN_ALLOWED_KEYS = Object.freeze([
  "totalBefore",
  "totalAfter",
  "added",
  "removed",
  "reordered",
  "wouldWrite",
]);

function ownKeys(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.keys(value);
}

function unexpectedOwnKeys(value, allowedKeys, path) {
  const keys = ownKeys(value);
  if (!keys) return [`${path} must be a non-null object`];
  const unexpected = keys.filter((k) => !allowedKeys.includes(k));
  if (unexpected.length > 0) {
    return [`unexpected ${path} keys: ${unexpected.join(", ")}`];
  }
  const missing = allowedKeys.filter((k) => !keys.includes(k));
  if (missing.length > 0) {
    return [`missing required ${path} keys: ${missing.join(", ")}`];
  }
  return [];
}

function isNullableString(value) {
  return value === null || typeof value === "string";
}

/**
 * G-20u43 nested payload allowlist — release / trackPolicy / clientDryRun (own keys + types).
 */
export function validateG20u43NestedSavePayload(request) {
  const errors = [];
  const body = request && typeof request === "object" && !Array.isArray(request) ? request : null;
  if (!body) return ["request must be an object"];

  const release = body.release;
  errors.push(...unexpectedOwnKeys(release, G20U43_RELEASE_ALLOWED_KEYS, "release"));
  if (errors.length === 0 && release) {
    if (typeof release.title !== "string" || !release.title.trim()) {
      errors.push("release.title must be a non-empty string");
    }
    if (typeof release.artist !== "string" || !release.artist.trim()) {
      errors.push("release.artist must be a non-empty string");
    }
    if (!isNullableString(release.release_date)) {
      errors.push("release.release_date must be string or null");
    }
    if (typeof release.label !== "string" || !release.label.trim()) {
      errors.push("release.label must be a non-empty string");
    }
    if (!isNullableString(release.catalog_number)) {
      errors.push("release.catalog_number must be string or null");
    }
    if (typeof release.published !== "boolean") {
      errors.push("release.published must be boolean");
    }
    if (!isNullableString(release.cover_image_url)) {
      errors.push("release.cover_image_url must be string or null");
    }
    if (!isNullableString(release.purchase_url)) {
      errors.push("release.purchase_url must be string or null");
    }
    if (!isNullableString(release.streaming_url)) {
      errors.push("release.streaming_url must be string or null");
    }
    if (!isNullableString(release.description)) {
      errors.push("release.description must be string or null");
    }
  }

  const trackPolicy = body.trackPolicy;
  errors.push(...unexpectedOwnKeys(trackPolicy, G20U43_TRACK_POLICY_ALLOWED_KEYS, "trackPolicy"));
  if (errors.length === 0 && trackPolicy) {
    if (trackPolicy.oneLineOneTrack !== true) {
      errors.push("trackPolicy.oneLineOneTrack must be true");
    }
    if (trackPolicy.blankLinesIgnored !== true) {
      errors.push("trackPolicy.blankLinesIgnored must be true");
    }
    if (typeof trackPolicy.allowDuplicateTitles !== "boolean") {
      errors.push("trackPolicy.allowDuplicateTitles must be boolean");
    }
    if (typeof trackPolicy.allowEmptyTrackList !== "boolean") {
      errors.push("trackPolicy.allowEmptyTrackList must be boolean");
    }
  }

  const clientDryRun = body.clientDryRun;
  errors.push(...unexpectedOwnKeys(clientDryRun, G20U43_CLIENT_DRY_RUN_ALLOWED_KEYS, "clientDryRun"));
  if (errors.length === 0 && clientDryRun) {
    if (typeof clientDryRun.totalBefore !== "number") {
      errors.push("clientDryRun.totalBefore must be number");
    }
    if (typeof clientDryRun.totalAfter !== "number") {
      errors.push("clientDryRun.totalAfter must be number");
    }
    if (!Array.isArray(clientDryRun.added)) {
      errors.push("clientDryRun.added must be array");
    }
    if (!Array.isArray(clientDryRun.removed)) {
      errors.push("clientDryRun.removed must be array");
    }
    if (typeof clientDryRun.reordered !== "boolean") {
      errors.push("clientDryRun.reordered must be boolean");
    }
    if (clientDryRun.wouldWrite !== false) {
      errors.push("clientDryRun.wouldWrite must be false");
    }
  }

  return errors;
}

/**
 * Classify UPDATE row count — no DB · no network.
 */
export function classifyG20u43LabelUpdateOutcome(input) {
  const rows = Array.isArray(input?.updatedRows) ? input.updatedRows : [];
  const count = rows.length;
  if (count === 0) {
    return {
      ok: false,
      reasonCode: "update_zero_rows",
      status: 409,
      updatedCount: 0,
      autoRetry: false,
    };
  }
  if (count !== 1) {
    return {
      ok: false,
      reasonCode: "update_multiple_rows",
      status: 500,
      updatedCount: count,
      autoRetry: false,
    };
  }
  const row = rows[0];
  const nextUpdatedAt = String(row?.updated_at ?? row?.updatedAt ?? "").trim();
  if (!nextUpdatedAt) {
    return {
      ok: false,
      reasonCode: "post_save_updated_at_missing",
      status: 500,
      updatedCount: 1,
      autoRetry: false,
    };
  }
  return {
    ok: true,
    reasonCode: "ok",
    status: 200,
    updatedCount: 1,
    nextUpdatedAt,
    updatedRow: row,
    autoRetry: false,
  };
}

/**
 * Resolve exact two-way label transition.
 * @returns {{ ok: true, direction, beforeLabel, afterLabel } | { ok: false, reasonCode, message }}
 */
export function resolveG20u43LabelTransition(beforeLabel, afterLabel) {
  const before = String(beforeLabel ?? "").trim();
  const after = String(afterLabel ?? "").trim();
  if (!before || !after) {
    return {
      ok: false,
      reasonCode: "empty_label_forbidden",
      message: "empty label is forbidden",
    };
  }
  if (before === G20U43_LABEL_ORIGINAL && after === G20U43_LABEL_TEMPORARY) {
    return {
      ok: true,
      direction: "original_to_temporary",
      beforeLabel: before,
      afterLabel: after,
    };
  }
  if (before === G20U43_LABEL_TEMPORARY && after === G20U43_LABEL_ORIGINAL) {
    return {
      ok: true,
      direction: "temporary_to_original",
      beforeLabel: before,
      afterLabel: after,
    };
  }
  return {
    ok: false,
    reasonCode: "label_transition_not_allowlisted",
    message: "label must be exact original↔temporary transition only",
  };
}

/**
 * UI eligibility: discography-004 + label-only + allowlisted transition.
 */
export function evaluateG20u43LabelSliceEligibility(input) {
  const legacyId = String(input?.legacyId ?? "").trim();
  if (legacyId !== G20U43_LABEL_LEGACY_ID) {
    return {
      ok: false,
      reason: `G-20u43 Save は ${G20U43_LABEL_LEGACY_ID} の label のみ対応です`,
      reasonCode: "legacy_id_mismatch",
    };
  }
  const changed = Array.isArray(input?.changedFields)
    ? input.changedFields.map(String)
    : [];
  if (changed.length !== 1 || changed[0] !== "label") {
    return {
      ok: false,
      reason: "G-20u43 Save は label 単一変更のみ許可（他フィールド変更時は不可）",
      reasonCode: "label_only_required",
    };
  }
  const transition = resolveG20u43LabelTransition(input?.originalLabel, input?.currentLabel);
  if (!transition.ok) {
    return {
      ok: false,
      reason: "許可された label 遷移（original↔temporary）ではありません",
      reasonCode: transition.reasonCode,
    };
  }
  return {
    ok: true,
    reason: "",
    reasonCode: "ok",
    direction: transition.direction,
    beforeLabel: transition.beforeLabel,
    afterLabel: transition.afterLabel,
  };
}

/**
 * Fail-closed Save request shape + allowlist (no auth / no DB).
 */
export function validateG20u43LabelSaveRequestShape(request) {
  const errors = [];
  const reasonCodes = [];
  const body = request && typeof request === "object" ? request : null;
  if (!body) {
    return {
      ok: false,
      reasonCode: "invalid_body",
      errors: ["request must be an object"],
    };
  }

  const keys = Object.keys(body);
  const unexpected = keys.filter((k) => !G20U43_ALLOWED_TOP_LEVEL_KEYS.includes(k));
  if (unexpected.length > 0) {
    errors.push(`unexpected payload keys: ${unexpected.join(", ")}`);
    reasonCodes.push("unexpected_payload_key");
  }

  const serialized = JSON.stringify(body);
  if (/service_role/i.test(serialized)) {
    errors.push("service_role must not appear in Save request");
    reasonCodes.push("service_role_forbidden");
  }

  if (String(body.operation ?? "") !== G20U43_SAVE_OPERATION) {
    errors.push('operation must be "save"');
    reasonCodes.push("operation_mismatch");
  }

  const approvalId = String(body.approvalId ?? "").trim();
  if (!approvalId) {
    errors.push("approvalId is required");
    reasonCodes.push("approval_empty");
  } else if (approvalId === G20U31_DRY_RUN_APPROVAL_ID) {
    errors.push("dry-run approval ID is not accepted for Save");
    reasonCodes.push("approval_dry_run_forbidden");
  } else if (approvalId === G20U36_TRACKLIST_SAVE_APPROVAL_ID) {
    errors.push("tracklist Save approval ID is not accepted for G-20u43 label Save");
    reasonCodes.push("approval_tracklist_forbidden");
  } else if (approvalId !== G20U43_LABEL_SAVE_APPROVAL_ID) {
    errors.push("approvalId must match G-20u43 label controlled Save slice");
    reasonCodes.push("approval_id_mismatch");
  }

  const siteSlug = String(body.siteSlug ?? "").trim();
  if (siteSlug !== G20U43_LABEL_SITE_SLUG) {
    errors.push(`siteSlug must be "${G20U43_LABEL_SITE_SLUG}"`);
    reasonCodes.push("site_mismatch");
  }

  const legacyId = String(body.legacyId ?? body.discographyLegacyId ?? "").trim();
  if (legacyId !== G20U43_LABEL_LEGACY_ID) {
    errors.push(`legacyId must be "${G20U43_LABEL_LEGACY_ID}"`);
    reasonCodes.push("legacy_id_mismatch");
  }

  const lock = String(body.expectedBeforeUpdatedAt ?? "").trim();
  if (!lock) {
    errors.push("expectedBeforeUpdatedAt is required");
    reasonCodes.push("optimistic_lock_missing");
  }

  const nestedErrors = validateG20u43NestedSavePayload(body);
  if (nestedErrors.length > 0) {
    errors.push(...nestedErrors);
    reasonCodes.push("nested_payload_invalid");
  }

  return {
    ok: errors.length === 0,
    reasonCode: reasonCodes[0] ?? (errors.length === 0 ? "ok" : "shape_invalid"),
    errors,
    approvalId,
    legacyId,
    expectedBeforeUpdatedAt: lock,
  };
}

/**
 * Given DB current release + request release, enforce label-only + two-way transition.
 */
export function validateG20u43LabelChangeAgainstCurrent(input) {
  const current = input?.currentRelease && typeof input.currentRelease === "object"
    ? input.currentRelease
    : null;
  const requested = input?.requestedRelease && typeof input.requestedRelease === "object"
    ? input.requestedRelease
    : null;
  if (!current || !requested) {
    return {
      ok: false,
      reasonCode: "release_required",
      message: "current and requested release are required",
    };
  }

  const title = String(current.title ?? "").trim();
  if (title !== G20U43_LABEL_ALBUM_TITLE) {
    return {
      ok: false,
      reasonCode: "album_title_mismatch",
      message: `album title must be "${G20U43_LABEL_ALBUM_TITLE}"`,
    };
  }

  const lockExpected = String(input?.expectedBeforeUpdatedAt ?? "").trim();
  const lockActual = String(current.updated_at ?? current.updatedAt ?? "").trim();
  if (!lockExpected) {
    return {
      ok: false,
      reasonCode: "optimistic_lock_missing",
      message: "expectedBeforeUpdatedAt is required",
    };
  }
  if (!lockActual) {
    return {
      ok: false,
      reasonCode: "optimistic_lock_unavailable",
      message: "current updated_at is unavailable",
    };
  }
  if (lockExpected !== lockActual) {
    return {
      ok: false,
      reasonCode: "optimistic_lock_conflict",
      message: "expectedBeforeUpdatedAt does not match current updated_at",
    };
  }

  const fields = [
    "title",
    "artist",
    "release_date",
    "label",
    "catalog_number",
    "published",
    "cover_image_url",
    "purchase_url",
    "streaming_url",
    "description",
  ];
  const changed = [];
  for (const field of fields) {
    const b = current[field] ?? null;
    const a = requested[field] ?? null;
    if (String(b ?? "") !== String(a ?? "")) changed.push(field);
  }
  if (changed.length !== 1 || changed[0] !== "label") {
    return {
      ok: false,
      reasonCode: "label_only_required",
      message: `only label may change (changed: ${changed.join(", ") || "none"})`,
      changedFields: changed,
    };
  }

  const beforeLabel = String(current.label ?? "").trim();
  const afterLabel = String(requested.label ?? "").trim();
  const transition = resolveG20u43LabelTransition(beforeLabel, afterLabel);
  if (!transition.ok) {
    return {
      ok: false,
      reasonCode: transition.reasonCode,
      message: transition.message,
      changedFields: changed,
    };
  }

  return {
    ok: true,
    reasonCode: "ok",
    message: "",
    changedFields: changed,
    beforeLabel: transition.beforeLabel,
    afterLabel: transition.afterLabel,
    direction: transition.direction,
  };
}
