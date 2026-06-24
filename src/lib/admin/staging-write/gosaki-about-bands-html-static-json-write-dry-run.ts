/**
 * G-10h4c — Gosaki About bands HTML static JSON write dry-run (no file write).
 */

import fs from "node:fs";
import path from "node:path";
import {
  assertG10h4cChangedFieldsOnly,
  assertG10h4cConfigPathAllowlisted,
  assertG10h4cConfigSiteSlug,
  assertG10h4cBandsHtmlLength,
  assertG10h4cTotalHtmlLength,
  buildG10h4cBandsHtmlPayload,
  computeG10h4cBandsHtmlChangedFields,
  findG10h4cTargetBlock,
  validateG10h4cBandsHtmlSafety,
} from "./gosaki-about-bands-html-static-json-write-guards";
import { getG10h4cAboutBandsHtmlStaticJsonWriteConfig } from "./gosaki-about-bands-html-static-json-write-config";
import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4C_PHASE,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  type G10h4cAboutContentConfigSnapshot,
  type G10h4cBandsHtmlFormValues,
  type G10h4cHtmlSafetyResult,
} from "./gosaki-about-bands-html-static-json-write-types";

export type G10h4cBandsHtmlDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G10h4cBandsHtmlDryRunSafety = {
  jsonFileWriteCalled: false;
  supabaseWriteCalled: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: false;
};

export type G10h4cBandsHtmlDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G10H4C_PHASE;
  approvalId: typeof G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  siteSlug: typeof G10H4C_SITE_SLUG;
  blockId: typeof G10H4C_TARGET_BLOCK_ID;
  targetPath: typeof G10H4C_ABOUT_CONTENT_CONFIG_REL;
  changedFields: string[];
  oldLength: number;
  newLength: number;
  lengthDelta: number;
  blocksAffected: 1;
  htmlSafety: G10h4cHtmlSafetyResult;
  guardErrors: string[];
  saveReadiness: G10h4cBandsHtmlDryRunSaveReadiness;
  saveAllowed: boolean;
  safety: G10h4cBandsHtmlDryRunSafety;
};

function resolveAllowedConfigAbsolutePath(cwd: string): string {
  const abs = path.resolve(cwd, G10H4C_ABOUT_CONTENT_CONFIG_REL);
  const normalized = path.normalize(abs);
  const expected = path.resolve(cwd, G10H4C_ABOUT_CONTENT_CONFIG_REL);
  if (normalized !== expected) {
    throw new Error("config path escape blocked");
  }
  assertG10h4cConfigPathAllowlisted(G10H4C_ABOUT_CONTENT_CONFIG_REL);
  return normalized;
}

export function loadG10h4cAboutContentConfigFromDisk(
  cwd: string,
): G10h4cAboutContentConfigSnapshot {
  const absPath = resolveAllowedConfigAbsolutePath(cwd);
  if (!fs.existsSync(absPath)) {
    throw new Error(`config file not found: ${G10H4C_ABOUT_CONTENT_CONFIG_REL}`);
  }
  return JSON.parse(fs.readFileSync(absPath, "utf8")) as G10h4cAboutContentConfigSnapshot;
}

function emptyDryRunResult(
  beforeHtml: string,
  afterHtml: string,
  guardErrors: string[],
  htmlSafety: G10h4cHtmlSafetyResult,
  saveReadiness: G10h4cBandsHtmlDryRunSaveReadiness,
  env?: ImportMetaEnv,
): G10h4cBandsHtmlDryRunResult {
  const saveAllowed = getG10h4cAboutBandsHtmlStaticJsonWriteConfig(env).saveEnabled;
  return {
    ok: false,
    dryRun: true,
    phase: G10H4C_PHASE,
    approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10H4C_SITE_SLUG,
    blockId: G10H4C_TARGET_BLOCK_ID,
    targetPath: G10H4C_ABOUT_CONTENT_CONFIG_REL,
    changedFields: [],
    oldLength: beforeHtml.length,
    newLength: afterHtml.length,
    lengthDelta: afterHtml.length - beforeHtml.length,
    blocksAffected: 1,
    htmlSafety,
    guardErrors,
    saveReadiness,
    saveAllowed,
    safety: {
      jsonFileWriteCalled: false,
      supabaseWriteCalled: false,
      serviceRoleUsed: false,
      actualWrite: false,
      wouldWrite: false,
    },
  };
}

/**
 * Pure dry-run for G-10h4c About bands HTML static JSON write. No file mutation.
 */
export function executeG10h4cAboutBandsHtmlStaticJsonWriteDryRun(input: {
  cwd: string;
  siteSlug: string;
  blockId: string;
  approvalId: string;
  formValues: G10h4cBandsHtmlFormValues;
  signedIn?: boolean;
  env?: ImportMetaEnv;
}): G10h4cBandsHtmlDryRunResult {
  const guardErrors: string[] = [];
  const payload = buildG10h4cBandsHtmlPayload(input.formValues);
  const afterHtml = payload.html;
  let beforeHtml = "";
  let config: G10h4cAboutContentConfigSnapshot | null = null;

  if (input.signedIn === false) {
    guardErrors.push("G-10h4c authenticated admin session required.");
    return emptyDryRunResult(
      "",
      afterHtml,
      guardErrors,
      validateG10h4cBandsHtmlSafety(afterHtml),
      "guard_error",
      input.env,
    );
  }

  try {
    if (input.approvalId !== G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID) {
      throw new Error(
        `approvalId must be ${G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID}`,
      );
    }
    if (input.siteSlug !== G10H4C_SITE_SLUG) {
      throw new Error(`siteSlug must be ${G10H4C_SITE_SLUG}`);
    }
    if (input.blockId !== G10H4C_TARGET_BLOCK_ID) {
      throw new Error(`blockId must be ${G10H4C_TARGET_BLOCK_ID}`);
    }

    config = loadG10h4cAboutContentConfigFromDisk(input.cwd);
    assertG10h4cConfigSiteSlug(config);
    const beforeBlock = findG10h4cTargetBlock(config);
    if (!beforeBlock) {
      throw new Error(`target block ${G10H4C_TARGET_BLOCK_ID} not found`);
    }
    beforeHtml = String(beforeBlock.html ?? "");
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      beforeHtml,
      afterHtml,
      guardErrors,
      validateG10h4cBandsHtmlSafety(afterHtml),
      "guard_error",
      input.env,
    );
  }

  const htmlSafety = validateG10h4cBandsHtmlSafety(afterHtml);
  const changedFields = computeG10h4cBandsHtmlChangedFields(
    findG10h4cTargetBlock(config)!,
    input.formValues,
  );
  const saveAllowed = getG10h4cAboutBandsHtmlStaticJsonWriteConfig(input.env).saveEnabled;

  if (changedFields.length === 0) {
    return {
      ok: true,
      dryRun: true,
      phase: G10H4C_PHASE,
      approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
      siteSlug: G10H4C_SITE_SLUG,
      blockId: G10H4C_TARGET_BLOCK_ID,
      targetPath: G10H4C_ABOUT_CONTENT_CONFIG_REL,
      changedFields: [],
      oldLength: beforeHtml.length,
      newLength: afterHtml.length,
      lengthDelta: afterHtml.length - beforeHtml.length,
      blocksAffected: 1,
      htmlSafety,
      guardErrors: [],
      saveReadiness: "no_changes",
      saveAllowed,
      safety: {
        jsonFileWriteCalled: false,
        supabaseWriteCalled: false,
        serviceRoleUsed: false,
        actualWrite: false,
        wouldWrite: false,
      },
    };
  }

  if (!htmlSafety.ok) {
    guardErrors.push(...htmlSafety.errors);
    return emptyDryRunResult(
      beforeHtml,
      afterHtml,
      guardErrors,
      htmlSafety,
      "guard_error",
      input.env,
    );
  }

  try {
    assertG10h4cChangedFieldsOnly(changedFields);
    assertG10h4cBandsHtmlLength(afterHtml);
    assertG10h4cTotalHtmlLength(config!, afterHtml);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      beforeHtml,
      afterHtml,
      guardErrors,
      htmlSafety,
      "guard_error",
      input.env,
    );
  }

  const saveReadiness: G10h4cBandsHtmlDryRunSaveReadiness = saveAllowed
    ? "ready_to_save"
    : "ready_but_save_disabled";

  return {
    ok: true,
    dryRun: true,
    phase: G10H4C_PHASE,
    approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10H4C_SITE_SLUG,
    blockId: G10H4C_TARGET_BLOCK_ID,
    targetPath: G10H4C_ABOUT_CONTENT_CONFIG_REL,
    changedFields,
    oldLength: beforeHtml.length,
    newLength: afterHtml.length,
    lengthDelta: afterHtml.length - beforeHtml.length,
    blocksAffected: 1,
    htmlSafety,
    guardErrors: [],
    saveReadiness,
    saveAllowed,
    safety: {
      jsonFileWriteCalled: false,
      supabaseWriteCalled: false,
      serviceRoleUsed: false,
      actualWrite: false,
      wouldWrite: false,
    },
  };
}
