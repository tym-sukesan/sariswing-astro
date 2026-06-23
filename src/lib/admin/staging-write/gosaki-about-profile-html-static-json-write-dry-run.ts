/**
 * G-10h4a — Gosaki About profile HTML static JSON write dry-run (no file write).
 */

import fs from "node:fs";
import path from "node:path";
import {
  assertG10h4aChangedFieldsOnly,
  assertG10h4aConfigPathAllowlisted,
  assertG10h4aConfigSiteSlug,
  assertG10h4aProfileHtmlLength,
  assertG10h4aTotalHtmlLength,
  buildG10h4aProfileHtmlPayload,
  computeG10h4aProfileHtmlChangedFields,
  findG10h4aTargetBlock,
  validateG10h4aProfileHtmlSafety,
} from "./gosaki-about-profile-html-static-json-write-guards";
import { getG10h4aAboutProfileHtmlStaticJsonWriteConfig } from "./gosaki-about-profile-html-static-json-write-config";
import {
  G10H4A_ABOUT_CONTENT_CONFIG_REL,
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_PHASE,
  G10H4A_SITE_SLUG,
  G10H4A_TARGET_BLOCK_ID,
  type G10h4aAboutContentConfigSnapshot,
  type G10h4aHtmlSafetyResult,
  type G10h4aProfileHtmlFormValues,
} from "./gosaki-about-profile-html-static-json-write-types";

export type G10h4aProfileHtmlDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G10h4aProfileHtmlDryRunSafety = {
  jsonFileWriteCalled: false;
  supabaseWriteCalled: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: false;
};

export type G10h4aProfileHtmlDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G10H4A_PHASE;
  approvalId: typeof G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  siteSlug: typeof G10H4A_SITE_SLUG;
  blockId: typeof G10H4A_TARGET_BLOCK_ID;
  targetPath: typeof G10H4A_ABOUT_CONTENT_CONFIG_REL;
  changedFields: string[];
  oldLength: number;
  newLength: number;
  lengthDelta: number;
  blocksAffected: 1;
  htmlSafety: G10h4aHtmlSafetyResult;
  guardErrors: string[];
  saveReadiness: G10h4aProfileHtmlDryRunSaveReadiness;
  saveAllowed: boolean;
  safety: G10h4aProfileHtmlDryRunSafety;
};

function resolveAllowedConfigAbsolutePath(cwd: string): string {
  const abs = path.resolve(cwd, G10H4A_ABOUT_CONTENT_CONFIG_REL);
  const normalized = path.normalize(abs);
  const expected = path.resolve(cwd, G10H4A_ABOUT_CONTENT_CONFIG_REL);
  if (normalized !== expected) {
    throw new Error("config path escape blocked");
  }
  assertG10h4aConfigPathAllowlisted(G10H4A_ABOUT_CONTENT_CONFIG_REL);
  return normalized;
}

export function loadG10h4aAboutContentConfigFromDisk(
  cwd: string,
): G10h4aAboutContentConfigSnapshot {
  const absPath = resolveAllowedConfigAbsolutePath(cwd);
  if (!fs.existsSync(absPath)) {
    throw new Error(`config file not found: ${G10H4A_ABOUT_CONTENT_CONFIG_REL}`);
  }
  return JSON.parse(fs.readFileSync(absPath, "utf8")) as G10h4aAboutContentConfigSnapshot;
}

function emptyDryRunResult(
  config: G10h4aAboutContentConfigSnapshot | null,
  beforeHtml: string,
  afterHtml: string,
  guardErrors: string[],
  htmlSafety: G10h4aHtmlSafetyResult,
  saveReadiness: G10h4aProfileHtmlDryRunSaveReadiness,
  env?: ImportMetaEnv,
): G10h4aProfileHtmlDryRunResult {
  const saveAllowed = getG10h4aAboutProfileHtmlStaticJsonWriteConfig(env).saveEnabled;
  return {
    ok: false,
    dryRun: true,
    phase: G10H4A_PHASE,
    approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10H4A_SITE_SLUG,
    blockId: G10H4A_TARGET_BLOCK_ID,
    targetPath: G10H4A_ABOUT_CONTENT_CONFIG_REL,
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
 * Pure dry-run for G-10h4a About profile HTML static JSON write. No file mutation.
 */
export function executeG10h4aAboutProfileHtmlStaticJsonWriteDryRun(input: {
  cwd: string;
  siteSlug: string;
  blockId: string;
  approvalId: string;
  formValues: G10h4aProfileHtmlFormValues;
  signedIn?: boolean;
  env?: ImportMetaEnv;
}): G10h4aProfileHtmlDryRunResult {
  const guardErrors: string[] = [];
  const payload = buildG10h4aProfileHtmlPayload(input.formValues);
  const afterHtml = payload.html;
  let beforeHtml = "";
  let config: G10h4aAboutContentConfigSnapshot | null = null;

  if (input.signedIn === false) {
    guardErrors.push("G-10h4a authenticated admin session required.");
    return emptyDryRunResult(
      null,
      "",
      afterHtml,
      guardErrors,
      validateG10h4aProfileHtmlSafety(afterHtml),
      "guard_error",
      input.env,
    );
  }

  try {
    if (input.approvalId !== G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID) {
      throw new Error(
        `approvalId must be ${G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID}`,
      );
    }
    if (input.siteSlug !== G10H4A_SITE_SLUG) {
      throw new Error(`siteSlug must be ${G10H4A_SITE_SLUG}`);
    }
    if (input.blockId !== G10H4A_TARGET_BLOCK_ID) {
      throw new Error(`blockId must be ${G10H4A_TARGET_BLOCK_ID}`);
    }

    config = loadG10h4aAboutContentConfigFromDisk(input.cwd);
    assertG10h4aConfigSiteSlug(config);
    const beforeBlock = findG10h4aTargetBlock(config);
    if (!beforeBlock) {
      throw new Error(`target block ${G10H4A_TARGET_BLOCK_ID} not found`);
    }
    beforeHtml = String(beforeBlock.html ?? "");
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      config,
      beforeHtml,
      afterHtml,
      guardErrors,
      validateG10h4aProfileHtmlSafety(afterHtml),
      "guard_error",
      input.env,
    );
  }

  const htmlSafety = validateG10h4aProfileHtmlSafety(afterHtml);
  const changedFields = computeG10h4aProfileHtmlChangedFields(
    findG10h4aTargetBlock(config)!,
    input.formValues,
  );
  const saveAllowed = getG10h4aAboutProfileHtmlStaticJsonWriteConfig(input.env).saveEnabled;

  if (changedFields.length === 0) {
    return {
      ok: true,
      dryRun: true,
      phase: G10H4A_PHASE,
      approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
      siteSlug: G10H4A_SITE_SLUG,
      blockId: G10H4A_TARGET_BLOCK_ID,
      targetPath: G10H4A_ABOUT_CONTENT_CONFIG_REL,
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
      config,
      beforeHtml,
      afterHtml,
      guardErrors,
      htmlSafety,
      "guard_error",
      input.env,
    );
  }

  try {
    assertG10h4aChangedFieldsOnly(changedFields);
    assertG10h4aProfileHtmlLength(afterHtml);
    assertG10h4aTotalHtmlLength(config!, afterHtml);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      config,
      beforeHtml,
      afterHtml,
      guardErrors,
      htmlSafety,
      "guard_error",
      input.env,
    );
  }

  const saveReadiness: G10h4aProfileHtmlDryRunSaveReadiness = saveAllowed
    ? "ready_to_save"
    : "ready_but_save_disabled";

  return {
    ok: true,
    dryRun: true,
    phase: G10H4A_PHASE,
    approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10H4A_SITE_SLUG,
    blockId: G10H4A_TARGET_BLOCK_ID,
    targetPath: G10H4A_ABOUT_CONTENT_CONFIG_REL,
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
