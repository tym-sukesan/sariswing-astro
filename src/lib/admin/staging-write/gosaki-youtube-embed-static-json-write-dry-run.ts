/**
 * G-10c — Gosaki YouTube embed static JSON write dry-run (no file write).
 */

import {
  buildYoutubeNocookieEmbedUrl,
  buildYoutubeWatchUrl,
  parseYoutubeVideoId,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";
import {
  getG10cYoutubeEmbedStaticJsonWriteConfig,
} from "./gosaki-youtube-embed-static-json-write-config";
import {
  assertG10cYoutubeEmbedChangedFieldsOnly,
  assertG10cYoutubeEmbedPayloadKeysOnly,
  assertG10cYoutubeEmbedPublishedRequiresVideoId,
  assertG10cYoutubeEmbedSiteSlug,
  assertG10cYoutubeEmbedTargetItemId,
  assertG10cYoutubeEmbedWritableItem,
  buildG10cYoutubeEmbedWritePayload,
  computeG10cYoutubeEmbedChangedFields,
} from "./gosaki-youtube-embed-static-json-write-guards";
import {
  G10C_PHASE,
  G10C_YOUTUBE_EMBED_CONFIG_REL,
  G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
  G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
  type G10cYoutubeEmbedAllowedField,
  type G10cYoutubeEmbedConfigSnapshot,
  type G10cYoutubeEmbedFormValues,
  type G10cYoutubeEmbedItemSnapshot,
  type G10cYoutubeEmbedWritePayload,
} from "./gosaki-youtube-embed-static-json-write-types";

function resolveG10cOperatorSaveEnabled(env?: ImportMetaEnv): boolean {
  return getG10cYoutubeEmbedStaticJsonWriteConfig(env).saveEnabled;
}

export type G10cYoutubeEmbedDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G10cYoutubeEmbedDryRunSafety = {
  jsonFileWriteCalled: false;
  supabaseWriteCalled: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G10cYoutubeEmbedNormalizedPreview = {
  videoId: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
};

export type G10cYoutubeEmbedDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G10C_PHASE;
  approvalId: typeof G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID;
  target: {
    itemId: typeof G10C_YOUTUBE_EMBED_TARGET_ITEM_ID;
    configPath: typeof G10C_YOUTUBE_EMBED_CONFIG_REL;
    siteSlug: string;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G10cYoutubeEmbedAllowedField, string | boolean | null>>;
  after: Partial<Record<G10cYoutubeEmbedAllowedField, string | boolean | null>>;
  payload: G10cYoutubeEmbedWritePayload;
  normalized: G10cYoutubeEmbedNormalizedPreview;
  guardErrors: string[];
  saveReadiness: G10cYoutubeEmbedDryRunSaveReadiness;
  saveAllowed: boolean;
  itemsAffectedRequired: 1;
  safety: G10cYoutubeEmbedDryRunSafety;
};

function displayPublished(value: boolean): string {
  return value ? "公開" : "非公開";
}

function snapshotField(
  item: G10cYoutubeEmbedItemSnapshot,
  field: G10cYoutubeEmbedAllowedField,
): string | boolean | null {
  if (field === "published") return item.published === true;
  return String(item.embedCode ?? "").trim() || null;
}

function buildNormalizedPreview(
  payload: G10cYoutubeEmbedWritePayload,
): G10cYoutubeEmbedNormalizedPreview {
  const videoId = parseYoutubeVideoId(payload.embedCode);
  if (!videoId) {
    return { videoId: null, embedUrl: null, watchUrl: null };
  }
  return {
    videoId,
    embedUrl: buildYoutubeNocookieEmbedUrl(videoId),
    watchUrl: buildYoutubeWatchUrl(videoId),
  };
}

function emptyDryRunResult(
  beforeItem: G10cYoutubeEmbedItemSnapshot | null,
  config: G10cYoutubeEmbedConfigSnapshot | null,
  guardErrors: string[],
  saveReadiness: G10cYoutubeEmbedDryRunSaveReadiness,
  env?: ImportMetaEnv,
): G10cYoutubeEmbedDryRunResult {
  const payload = { embedCode: "", published: false };
  return {
    ok: false,
    dryRun: true,
    phase: G10C_PHASE,
    approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
    target: {
      itemId: G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
      configPath: G10C_YOUTUBE_EMBED_CONFIG_REL,
      siteSlug: String(config?.siteSlug ?? ""),
    },
    changedFields: [],
    payloadKeys: [],
    before: beforeItem
      ? {
          embedCode: snapshotField(beforeItem, "embedCode") as string | null,
          published: snapshotField(beforeItem, "published") as boolean,
        }
      : {},
    after: {},
    payload,
    normalized: buildNormalizedPreview(payload),
    guardErrors,
    saveReadiness,
    saveAllowed: resolveG10cOperatorSaveEnabled(env),
    itemsAffectedRequired: 1,
    safety: {
      jsonFileWriteCalled: false,
      supabaseWriteCalled: false,
      serviceRoleUsed: false,
      actualWrite: false,
    },
  };
}

/**
 * Pure dry-run for G-10c YouTube embed static JSON write. No file mutation.
 */
export function executeG10cYoutubeEmbedStaticJsonWriteDryRun(input: {
  config: G10cYoutubeEmbedConfigSnapshot;
  beforeItem: G10cYoutubeEmbedItemSnapshot;
  formValues: G10cYoutubeEmbedFormValues;
  signedIn?: boolean;
  env?: ImportMetaEnv;
}): G10cYoutubeEmbedDryRunResult {
  const guardErrors: string[] = [];

  if (input.signedIn === false) {
    guardErrors.push("G-10c authenticated admin session required.");
    return emptyDryRunResult(
      input.beforeItem,
      input.config,
      guardErrors,
      "guard_error",
      input.env,
    );
  }

  try {
    assertG10cYoutubeEmbedSiteSlug(input.config);
    assertG10cYoutubeEmbedWritableItem(input.beforeItem);
    assertG10cYoutubeEmbedTargetItemId(input.beforeItem.id);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeItem,
      input.config,
      guardErrors,
      "guard_error",
      input.env,
    );
  }

  const payload = buildG10cYoutubeEmbedWritePayload(input.formValues);
  const changedFields = computeG10cYoutubeEmbedChangedFields(input.beforeItem, input.formValues);
  const normalized = buildNormalizedPreview(payload);

  if (changedFields.length === 0) {
    return {
      ok: true,
      dryRun: true,
      phase: G10C_PHASE,
      approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
      target: {
        itemId: G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
        configPath: G10C_YOUTUBE_EMBED_CONFIG_REL,
        siteSlug: String(input.config.siteSlug ?? ""),
      },
      changedFields: [],
      payloadKeys: [],
      before: {
        embedCode: snapshotField(input.beforeItem, "embedCode") as string | null,
        published: snapshotField(input.beforeItem, "published") as boolean,
      },
      after: {
        embedCode: payload.embedCode || null,
        published: payload.published,
      },
      payload,
      normalized,
      guardErrors: [],
      saveReadiness: "no_changes",
      saveAllowed: resolveG10cOperatorSaveEnabled(input.env),
      itemsAffectedRequired: 1,
      safety: {
        jsonFileWriteCalled: false,
        supabaseWriteCalled: false,
        serviceRoleUsed: false,
        actualWrite: false,
      },
    };
  }

  try {
    assertG10cYoutubeEmbedChangedFieldsOnly(changedFields);
    assertG10cYoutubeEmbedPayloadKeysOnly(changedFields);
    assertG10cYoutubeEmbedPublishedRequiresVideoId(payload);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeItem,
      input.config,
      guardErrors,
      "guard_error",
      input.env,
    );
  }

  const before: Partial<Record<G10cYoutubeEmbedAllowedField, string | boolean | null>> = {};
  const after: Partial<Record<G10cYoutubeEmbedAllowedField, string | boolean | null>> = {};
  for (const field of changedFields) {
    before[field] = snapshotField(input.beforeItem, field);
    after[field] = field === "published" ? payload.published : payload.embedCode || null;
  }

  const saveEnabled = resolveG10cOperatorSaveEnabled(input.env);
  const saveReadiness: G10cYoutubeEmbedDryRunSaveReadiness = saveEnabled
    ? "ready_to_save"
    : "ready_but_save_disabled";

  return {
    ok: true,
    dryRun: true,
    phase: G10C_PHASE,
    approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
    target: {
      itemId: G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
      configPath: G10C_YOUTUBE_EMBED_CONFIG_REL,
      siteSlug: String(input.config.siteSlug ?? ""),
    },
    changedFields,
    payloadKeys: [...changedFields],
    before,
    after,
    payload,
    normalized,
    guardErrors: [],
    saveReadiness,
    saveAllowed: saveEnabled,
    itemsAffectedRequired: 1,
    safety: {
      jsonFileWriteCalled: false,
      supabaseWriteCalled: false,
      serviceRoleUsed: false,
      actualWrite: false,
    },
  };
}

export function formatG10cDryRunPublished(value: string | boolean | null | undefined): string {
  if (typeof value === "boolean") return displayPublished(value);
  if (value === "true") return displayPublished(true);
  if (value === "false") return displayPublished(false);
  return String(value ?? "").trim() || "（空）";
}
