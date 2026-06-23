/**
 * G-10h4b — Gosaki About profile HTML static JSON write executor (server only).
 */

import fs from "node:fs";
import path from "node:path";
import {
  assertG10h4aApproval,
  assertG10h4aBlocksAffectedExactlyOne,
  assertG10h4aChangedFieldsOnly,
  assertG10h4aConfigPathAllowlisted,
  assertG10h4aConfigSiteSlug,
  assertG10h4aProfileHtmlLength,
  assertG10h4aSiteSlug,
  assertG10h4aTargetBlockId,
  assertG10h4aTotalHtmlLength,
  buildG10h4aProfileHtmlPayload,
  computeG10h4aProfileHtmlChangedFields,
  findG10h4aTargetBlock,
  validateG10h4aProfileHtmlSafety,
} from "./gosaki-about-profile-html-static-json-write-guards";
import { getG10h4aAboutProfileHtmlStaticJsonWriteConfig } from "./gosaki-about-profile-html-static-json-write-config";
import {
  executeG10h4aAboutProfileHtmlStaticJsonWriteDryRun,
  loadG10h4aAboutContentConfigFromDisk,
} from "./gosaki-about-profile-html-static-json-write-dry-run";
import {
  G10H4A_ABOUT_CONTENT_CONFIG_REL,
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4B_PHASE,
  G10H4A_TARGET_BLOCK_ID,
  type G10h4aAboutContentConfigSnapshot,
  type G10h4aProfileHtmlFormValues,
} from "./gosaki-about-profile-html-static-json-write-types";

export type G10h4bAboutProfileHtmlStaticJsonWriteOutcome = {
  phase: typeof G10H4B_PHASE;
  approvalId: typeof G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  configPath: typeof G10H4A_ABOUT_CONTENT_CONFIG_REL;
  blockId: typeof G10H4A_TARGET_BLOCK_ID;
  changedFields: string[];
  blocksAffected: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

function loadConfigAbsPath(cwd: string): string {
  const abs = path.resolve(cwd, G10H4A_ABOUT_CONTENT_CONFIG_REL);
  const normalized = path.normalize(abs);
  const expected = path.resolve(cwd, G10H4A_ABOUT_CONTENT_CONFIG_REL);
  if (normalized !== expected) {
    throw new Error("config path escape blocked");
  }
  assertG10h4aConfigPathAllowlisted(G10H4A_ABOUT_CONTENT_CONFIG_REL);
  return normalized;
}

function applyProfileHtmlUpdate(
  config: G10h4aAboutContentConfigSnapshot,
  html: string,
): { nextConfig: G10h4aAboutContentConfigSnapshot; blocksAffected: number } {
  const blocks = Array.isArray(config.blocks) ? [...config.blocks] : [];
  let blocksAffected = 0;

  const nextBlocks = blocks.map((block) => {
    if (block?.id !== G10H4A_TARGET_BLOCK_ID) return block;
    blocksAffected += 1;
    return { ...block, html };
  });

  assertG10h4aBlocksAffectedExactlyOne(blocksAffected);

  return {
    nextConfig: { ...config, blocks: nextBlocks },
    blocksAffected,
  };
}

function atomicWriteJson(absPath: string, config: G10h4aAboutContentConfigSnapshot): void {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const tmpPath = `${absPath}.g10h4b.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.renameSync(tmpPath, absPath);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function executeG10h4bAboutProfileHtmlStaticJsonWrite(options: {
  cwd: string;
  approvalId: string;
  siteSlug: string;
  blockId: string;
  formValues: G10h4aProfileHtmlFormValues;
  changedFields: string[];
  dryRunOk: boolean;
  signedIn: boolean;
  env?: ImportMetaEnv;
}): G10h4bAboutProfileHtmlStaticJsonWriteOutcome {
  const base = {
    phase: G10H4B_PHASE,
    approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    configPath: G10H4A_ABOUT_CONTENT_CONFIG_REL,
    blockId: G10H4A_TARGET_BLOCK_ID,
    changedFields: [...options.changedFields],
    blocksAffected: 0,
    ok: false,
  };

  const writeConfig = getG10h4aAboutProfileHtmlStaticJsonWriteConfig(options.env);
  if (!writeConfig.saveEnabled) {
    return {
      ...base,
      errorCode: "save_not_enabled",
      errorMessage:
        "G-10h4b Save rejected — G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED is false.",
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
    assertG10h4aApproval(options.approvalId);
    assertG10h4aSiteSlug(options.siteSlug);
    assertG10h4aTargetBlockId(options.blockId);
    assertG10h4aChangedFieldsOnly(options.changedFields);

    const absPath = loadConfigAbsPath(options.cwd);
    const config = loadG10h4aAboutContentConfigFromDisk(options.cwd);
    assertG10h4aConfigSiteSlug(config);
    const beforeBlock = findG10h4aTargetBlock(config);
    if (!beforeBlock) {
      throw new Error(`target block ${G10H4A_TARGET_BLOCK_ID} not found`);
    }

    const payload = buildG10h4aProfileHtmlPayload(options.formValues);
    const htmlSafety = validateG10h4aProfileHtmlSafety(payload.html);
    if (!htmlSafety.ok) {
      throw new Error(htmlSafety.errors.join("; "));
    }
    assertG10h4aProfileHtmlLength(payload.html);
    assertG10h4aTotalHtmlLength(config, payload.html);

    const dryRun = executeG10h4aAboutProfileHtmlStaticJsonWriteDryRun({
      cwd: options.cwd,
      approvalId: options.approvalId,
      siteSlug: options.siteSlug,
      blockId: options.blockId,
      formValues: options.formValues,
      signedIn: options.signedIn,
      env: options.env,
    });
    if (!dryRun.ok) {
      throw new Error(
        `G-10h4b dry-run re-check failed: ${dryRun.guardErrors.join("; ") || "unknown"}`,
      );
    }
    if (!arraysEqual(dryRun.changedFields, options.changedFields)) {
      throw new Error("G-10h4b Save: changedFields mismatch vs latest dry-run.");
    }
    if (dryRun.saveReadiness !== "ready_to_save") {
      throw new Error("G-10h4b Save: dry-run saveReadiness not ready_to_save.");
    }

    const recomputed = computeG10h4aProfileHtmlChangedFields(beforeBlock, options.formValues);
    if (!arraysEqual(recomputed, options.changedFields)) {
      throw new Error("G-10h4b Save: changedFields mismatch vs current JSON.");
    }

    const { nextConfig, blocksAffected } = applyProfileHtmlUpdate(config, payload.html);
    atomicWriteJson(absPath, nextConfig);

    return {
      ...base,
      changedFields: [...options.changedFields],
      blocksAffected,
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
