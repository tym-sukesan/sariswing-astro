/**
 * G-10h4d — Gosaki About bands HTML static JSON write executor (server only).
 */

import fs from "node:fs";
import path from "node:path";
import {
  assertG10h4cApproval,
  assertG10h4cBlocksAffectedExactlyOne,
  assertG10h4cChangedFieldsOnly,
  assertG10h4cConfigPathAllowlisted,
  assertG10h4cConfigSiteSlug,
  assertG10h4cBandsHtmlLength,
  assertG10h4cSiteSlug,
  assertG10h4cTargetBlockId,
  assertG10h4cTotalHtmlLength,
  buildG10h4cBandsHtmlPayload,
  computeG10h4cBandsHtmlChangedFields,
  findG10h4cTargetBlock,
  validateG10h4cBandsHtmlSafety,
} from "./gosaki-about-bands-html-static-json-write-guards";
import { getG10h4cAboutBandsHtmlStaticJsonWriteConfig } from "./gosaki-about-bands-html-static-json-write-config";
import {
  executeG10h4cAboutBandsHtmlStaticJsonWriteDryRun,
  loadG10h4cAboutContentConfigFromDisk,
} from "./gosaki-about-bands-html-static-json-write-dry-run";
import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4D_PHASE,
  G10H4C_TARGET_BLOCK_ID,
  type G10h4cAboutContentConfigSnapshot,
  type G10h4cBandsHtmlFormValues,
} from "./gosaki-about-bands-html-static-json-write-types";

export type G10h4dAboutBandsHtmlStaticJsonWriteOutcome = {
  phase: typeof G10H4D_PHASE;
  approvalId: typeof G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  configPath: typeof G10H4C_ABOUT_CONTENT_CONFIG_REL;
  blockId: typeof G10H4C_TARGET_BLOCK_ID;
  changedFields: string[];
  blocksAffected: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

function loadConfigAbsPath(cwd: string): string {
  const abs = path.resolve(cwd, G10H4C_ABOUT_CONTENT_CONFIG_REL);
  const normalized = path.normalize(abs);
  const expected = path.resolve(cwd, G10H4C_ABOUT_CONTENT_CONFIG_REL);
  if (normalized !== expected) {
    throw new Error("config path escape blocked");
  }
  assertG10h4cConfigPathAllowlisted(G10H4C_ABOUT_CONTENT_CONFIG_REL);
  return normalized;
}

function applyBandsHtmlUpdate(
  config: G10h4cAboutContentConfigSnapshot,
  html: string,
): { nextConfig: G10h4cAboutContentConfigSnapshot; blocksAffected: number } {
  const blocks = Array.isArray(config.blocks) ? [...config.blocks] : [];
  let blocksAffected = 0;

  const nextBlocks = blocks.map((block) => {
    if (block?.id !== G10H4C_TARGET_BLOCK_ID) return block;
    blocksAffected += 1;
    return { ...block, html };
  });

  assertG10h4cBlocksAffectedExactlyOne(blocksAffected);

  return {
    nextConfig: { ...config, blocks: nextBlocks },
    blocksAffected,
  };
}

function atomicWriteJson(absPath: string, config: G10h4cAboutContentConfigSnapshot): void {
  const content = `${JSON.stringify(config, null, 2)}\n`;
  const tmpPath = `${absPath}.g10h4d.tmp.${process.pid}`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.renameSync(tmpPath, absPath);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

export function executeG10h4dAboutBandsHtmlStaticJsonWrite(options: {
  cwd: string;
  approvalId: string;
  siteSlug: string;
  blockId: string;
  formValues: G10h4cBandsHtmlFormValues;
  changedFields: string[];
  dryRunOk: boolean;
  signedIn: boolean;
  env?: ImportMetaEnv;
}): G10h4dAboutBandsHtmlStaticJsonWriteOutcome {
  const base = {
    phase: G10H4D_PHASE,
    approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    configPath: G10H4C_ABOUT_CONTENT_CONFIG_REL,
    blockId: G10H4C_TARGET_BLOCK_ID,
    changedFields: [...options.changedFields],
    blocksAffected: 0,
    ok: false,
  };

  const writeConfig = getG10h4cAboutBandsHtmlStaticJsonWriteConfig(options.env);
  if (!writeConfig.saveEnabled) {
    return {
      ...base,
      errorCode: "save_not_enabled",
      errorMessage:
        "G-10h4d Save rejected — G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED is false.",
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
    assertG10h4cApproval(options.approvalId);
    assertG10h4cSiteSlug(options.siteSlug);
    assertG10h4cTargetBlockId(options.blockId);
    assertG10h4cChangedFieldsOnly(options.changedFields);

    const absPath = loadConfigAbsPath(options.cwd);
    const config = loadG10h4cAboutContentConfigFromDisk(options.cwd);
    assertG10h4cConfigSiteSlug(config);
    const beforeBlock = findG10h4cTargetBlock(config);
    if (!beforeBlock) {
      throw new Error(`target block ${G10H4C_TARGET_BLOCK_ID} not found`);
    }

    const payload = buildG10h4cBandsHtmlPayload(options.formValues);
    const htmlSafety = validateG10h4cBandsHtmlSafety(payload.html);
    if (!htmlSafety.ok) {
      throw new Error(htmlSafety.errors.join("; "));
    }
    assertG10h4cBandsHtmlLength(payload.html);
    assertG10h4cTotalHtmlLength(config, payload.html);

    const dryRun = executeG10h4cAboutBandsHtmlStaticJsonWriteDryRun({
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
        `G-10h4d dry-run re-check failed: ${dryRun.guardErrors.join("; ") || "unknown"}`,
      );
    }
    if (!arraysEqual(dryRun.changedFields, options.changedFields)) {
      throw new Error("G-10h4d Save: changedFields mismatch vs latest dry-run.");
    }
    if (dryRun.saveReadiness !== "ready_to_save") {
      throw new Error("G-10h4d Save: dry-run saveReadiness not ready_to_save.");
    }

    const recomputed = computeG10h4cBandsHtmlChangedFields(beforeBlock, options.formValues);
    if (!arraysEqual(recomputed, options.changedFields)) {
      throw new Error("G-10h4d Save: changedFields mismatch vs current JSON.");
    }

    const { nextConfig, blocksAffected } = applyBandsHtmlUpdate(config, payload.html);
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
