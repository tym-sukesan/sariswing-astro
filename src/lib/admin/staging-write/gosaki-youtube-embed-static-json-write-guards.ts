/**
 * G-10c — Gosaki YouTube embed static JSON write guards.
 */

import {
  parseYoutubeVideoId,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";
import {
  G10C_YOUTUBE_EMBED_ALLOWED_FIELDS,
  G10C_YOUTUBE_EMBED_CONFIG_REL,
  G10C_YOUTUBE_EMBED_SITE_SLUG,
  G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
  G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
  type G10cYoutubeEmbedAllowedField,
  type G10cYoutubeEmbedConfigSnapshot,
  type G10cYoutubeEmbedFormValues,
  type G10cYoutubeEmbedItemSnapshot,
  type G10cYoutubeEmbedWritePayload,
} from "./gosaki-youtube-embed-static-json-write-types";

export function assertG10cYoutubeEmbedApproval(
  approvalId: string,
): asserts approvalId is typeof G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID {
  if (approvalId !== G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID) {
    throw new Error(
      `approvalId must be ${G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID}`,
    );
  }
}

export function assertG10cYoutubeEmbedTargetItemId(
  itemId: string,
): asserts itemId is typeof G10C_YOUTUBE_EMBED_TARGET_ITEM_ID {
  if (itemId !== G10C_YOUTUBE_EMBED_TARGET_ITEM_ID) {
    throw new Error(`target item id must be ${G10C_YOUTUBE_EMBED_TARGET_ITEM_ID}`);
  }
}

export function assertG10cYoutubeEmbedConfigPathAllowlisted(configPath: string): void {
  const normalized = configPath.replace(/\\/g, "/");
  if (!normalized.endsWith(G10C_YOUTUBE_EMBED_CONFIG_REL)) {
    throw new Error(`config path must be ${G10C_YOUTUBE_EMBED_CONFIG_REL}`);
  }
}

export function assertG10cYoutubeEmbedSiteSlug(
  config: G10cYoutubeEmbedConfigSnapshot,
): void {
  const siteSlug = String(config.siteSlug ?? "").trim();
  if (siteSlug !== G10C_YOUTUBE_EMBED_SITE_SLUG) {
    throw new Error(`siteSlug must be ${G10C_YOUTUBE_EMBED_SITE_SLUG}`);
  }
}

export function assertG10cYoutubeEmbedChangedFieldsOnly(changedFields: string[]): void {
  for (const field of changedFields) {
    if (!(G10C_YOUTUBE_EMBED_ALLOWED_FIELDS as readonly string[]).includes(field)) {
      throw new Error(`changed field not allowed: ${field}`);
    }
  }
}

export function assertG10cYoutubeEmbedPayloadKeysOnly(payloadKeys: string[]): void {
  for (const key of payloadKeys) {
    if (!(G10C_YOUTUBE_EMBED_ALLOWED_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`payload key not allowed: ${key}`);
    }
  }
}

export function assertG10cYoutubeEmbedWritableItem(
  item: G10cYoutubeEmbedItemSnapshot | null | undefined,
): asserts item is G10cYoutubeEmbedItemSnapshot {
  if (!item) {
    throw new Error(`target item ${G10C_YOUTUBE_EMBED_TARGET_ITEM_ID} not found`);
  }
  assertG10cYoutubeEmbedTargetItemId(item.id);
}

export function buildG10cYoutubeEmbedWritePayload(
  formValues: G10cYoutubeEmbedFormValues,
): G10cYoutubeEmbedWritePayload {
  return {
    embedCode: String(formValues.embedCode ?? "").trim(),
    published: formValues.published === true,
  };
}

export function computeG10cYoutubeEmbedChangedFields(
  beforeItem: G10cYoutubeEmbedItemSnapshot,
  formValues: G10cYoutubeEmbedFormValues,
): G10cYoutubeEmbedAllowedField[] {
  const payload = buildG10cYoutubeEmbedWritePayload(formValues);
  const changed: G10cYoutubeEmbedAllowedField[] = [];

  const beforeEmbed = String(beforeItem.embedCode ?? "").trim();
  if (beforeEmbed !== payload.embedCode) {
    changed.push("embedCode");
  }

  const beforePublished = beforeItem.published === true;
  if (beforePublished !== payload.published) {
    changed.push("published");
  }

  return changed;
}

export function assertG10cYoutubeEmbedPublishedRequiresVideoId(
  payload: G10cYoutubeEmbedWritePayload,
): void {
  if (!payload.published) return;
  const videoId = parseYoutubeVideoId(payload.embedCode);
  if (!videoId) {
    throw new Error(
      "published=true requires a valid YouTube video (URL, iframe, or videoId).",
    );
  }
}

export function assertG10cItemsAffectedExactlyOne(itemsAffected: number): void {
  if (itemsAffected !== 1) {
    throw new Error(`itemsAffected must be 1 (got ${itemsAffected})`);
  }
}
