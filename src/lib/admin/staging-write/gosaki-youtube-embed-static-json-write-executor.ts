/**
 * G-10c — Gosaki YouTube embed static JSON write executor (server only).
 */

import fs from "node:fs";
import path from "node:path";
import {
  assertG10cItemsAffectedExactlyOne,
  assertG10cYoutubeEmbedApproval,
  assertG10cYoutubeEmbedChangedFieldsOnly,
  assertG10cYoutubeEmbedConfigPathAllowlisted,
  assertG10cYoutubeEmbedPayloadKeysOnly,
  assertG10cYoutubeEmbedPublishedRequiresVideoId,
  assertG10cYoutubeEmbedSiteSlug,
  assertG10cYoutubeEmbedTargetItemId,
  assertG10cYoutubeEmbedWritableItem,
  buildG10cYoutubeEmbedWritePayload,
  computeG10cYoutubeEmbedChangedFields,
} from "./gosaki-youtube-embed-static-json-write-guards";
import { executeG10cYoutubeEmbedStaticJsonWriteDryRun } from "./gosaki-youtube-embed-static-json-write-dry-run";
import {
  G10C_PHASE,
  G10C_YOUTUBE_EMBED_CONFIG_REL,
  G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
  G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
  type G10cYoutubeEmbedConfigSnapshot,
  type G10cYoutubeEmbedFormValues,
  type G10cYoutubeEmbedItemSnapshot,
} from "./gosaki-youtube-embed-static-json-write-types";
import { getG10cYoutubeEmbedStaticJsonWriteConfig } from "./gosaki-youtube-embed-static-json-write-config";

export type G10cYoutubeEmbedStaticJsonWriteOutcome = {
  phase: typeof G10C_PHASE;
  approvalId: typeof G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID;
  configPath: typeof G10C_YOUTUBE_EMBED_CONFIG_REL;
  itemId: typeof G10C_YOUTUBE_EMBED_TARGET_ITEM_ID;
  changedFields: string[];
  payloadKeys: string[];
  itemsAffected: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

function resolveAllowedConfigAbsolutePath(cwd: string): string {
  const abs = path.resolve(cwd, G10C_YOUTUBE_EMBED_CONFIG_REL);
  const normalized = path.normalize(abs);
  const expected = path.resolve(cwd, G10C_YOUTUBE_EMBED_CONFIG_REL);
  if (normalized !== expected) {
    throw new Error("config path escape blocked");
  }
  assertG10cYoutubeEmbedConfigPathAllowlisted(G10C_YOUTUBE_EMBED_CONFIG_REL);
  return normalized;
}

function loadConfig(absPath: string): G10cYoutubeEmbedConfigSnapshot {
  const raw = fs.readFileSync(absPath, "utf8");
  return JSON.parse(raw) as G10cYoutubeEmbedConfigSnapshot;
}

function findTargetItem(
  config: G10cYoutubeEmbedConfigSnapshot,
): G10cYoutubeEmbedItemSnapshot | null {
  const items = Array.isArray(config.items) ? config.items : [];
  return items.find((item) => item?.id === G10C_YOUTUBE_EMBED_TARGET_ITEM_ID) ?? null;
}

function applyItemUpdate(
  config: G10cYoutubeEmbedConfigSnapshot,
  changedFields: string[],
  formValues: G10cYoutubeEmbedFormValues,
): { nextConfig: G10cYoutubeEmbedConfigSnapshot; itemsAffected: number } {
  const payload = buildG10cYoutubeEmbedWritePayload(formValues);
  const items = Array.isArray(config.items) ? [...config.items] : [];
  let itemsAffected = 0;

  const nextItems = items.map((item) => {
    if (item?.id !== G10C_YOUTUBE_EMBED_TARGET_ITEM_ID) return item;
    itemsAffected += 1;
    const next = { ...item };
    for (const field of changedFields) {
      if (field === "embedCode") {
        next.embedCode = payload.embedCode;
      }
      if (field === "published") {
        next.published = payload.published;
      }
    }
    return next;
  });

  assertG10cItemsAffectedExactlyOne(itemsAffected);

  return {
    nextConfig: { ...config, items: nextItems },
    itemsAffected,
  };
}

function atomicWriteJson(absPath: string, config: G10cYoutubeEmbedConfigSnapshot): void {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const tmpPath = `${absPath}.g10c.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.renameSync(tmpPath, absPath);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function executeG10cYoutubeEmbedStaticJsonWrite(options: {
  cwd: string;
  itemId: string;
  approvalId: string;
  formValues: G10cYoutubeEmbedFormValues;
  changedFields: string[];
  payloadKeys: string[];
  dryRunOk: boolean;
  signedIn: boolean;
  env?: ImportMetaEnv;
}): G10cYoutubeEmbedStaticJsonWriteOutcome {
  const base = {
    phase: G10C_PHASE,
    approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
    configPath: G10C_YOUTUBE_EMBED_CONFIG_REL,
    itemId: G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
    changedFields: [...options.changedFields],
    payloadKeys: [...options.payloadKeys],
    itemsAffected: 0,
    ok: false,
  };

  const writeConfig = getG10cYoutubeEmbedStaticJsonWriteConfig(options.env);
  if (!writeConfig.saveEnabled) {
    return {
      ...base,
      errorCode: "save_not_enabled",
      errorMessage:
        writeConfig.armFailureReason ??
        "G-10c Save path disabled — env arm / approval stack not satisfied.",
    };
  }

  if (!options.dryRunOk) {
    return {
      ...base,
      errorCode: "dry_run_not_ok",
      errorMessage: "Dry-run must succeed before Save.",
    };
  }

  if (options.changedFields.length === 0) {
    return {
      ...base,
      errorCode: "no_changed_fields",
      errorMessage: "No changedFields — Save blocked.",
    };
  }

  try {
    assertG10cYoutubeEmbedApproval(options.approvalId);
    assertG10cYoutubeEmbedTargetItemId(options.itemId);
    assertG10cYoutubeEmbedChangedFieldsOnly(options.changedFields);
    assertG10cYoutubeEmbedPayloadKeysOnly(options.payloadKeys);
    if (!arraysEqual(options.changedFields, options.payloadKeys)) {
      throw new Error("changedFields and payloadKeys must match.");
    }

    const absPath = resolveAllowedConfigAbsolutePath(options.cwd);
    const config = loadConfig(absPath);
    assertG10cYoutubeEmbedSiteSlug(config);
    const beforeItem = findTargetItem(config);
    assertG10cYoutubeEmbedWritableItem(beforeItem);

    const payload = buildG10cYoutubeEmbedWritePayload(options.formValues);
    assertG10cYoutubeEmbedPublishedRequiresVideoId(payload);

    const dryRun = executeG10cYoutubeEmbedStaticJsonWriteDryRun({
      config,
      beforeItem,
      formValues: options.formValues,
      signedIn: options.signedIn,
      env: options.env,
    });
    if (!dryRun.ok) {
      throw new Error(
        `G-10c dry-run re-check failed: ${dryRun.guardErrors.join("; ") || "unknown"}`,
      );
    }
    if (!arraysEqual(dryRun.changedFields, options.changedFields)) {
      throw new Error("G-10c Save: changedFields mismatch vs latest dry-run.");
    }
    if (!arraysEqual(dryRun.payloadKeys, options.payloadKeys)) {
      throw new Error("G-10c Save: payload keys mismatch vs latest dry-run.");
    }

    const recomputed = computeG10cYoutubeEmbedChangedFields(beforeItem, options.formValues);
    if (!arraysEqual(recomputed, options.changedFields)) {
      throw new Error("G-10c Save: changedFields mismatch vs current JSON.");
    }

    const { nextConfig, itemsAffected } = applyItemUpdate(
      config,
      options.changedFields,
      options.formValues,
    );

    atomicWriteJson(absPath, nextConfig);

    return {
      ...base,
      changedFields: [...options.changedFields],
      payloadKeys: [...options.payloadKeys],
      itemsAffected,
      ok: true,
    };
  } catch (error) {
    return {
      ...base,
      errorCode: "write_failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}
