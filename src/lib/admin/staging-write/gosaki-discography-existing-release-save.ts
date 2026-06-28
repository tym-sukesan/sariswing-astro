/**
 * G-15b — Gosaki Discography existing release purchase_url non-dry-run Save (staging shell).
 *
 * Cursor must not call this in implementation / preflight phases.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { isSignedInStagingAuth } from "./schedule-non-dry-run-poc-auth";
import { updateDiscographyWrite } from "./discography-write-adapter";
import {
  assertG15bDiscographyChangedFieldsOnly,
  assertG15bDiscographyUpdatePayloadAllowed,
  assertG15bDiscographyWriteApproval,
  assertG15bOptimisticLockBaseline,
  assertG15bRowsAffectedExactlyOne,
} from "./discography-write-guards";
import type { DiscographyUpdateWritePayload } from "./discography-write-types";
import { G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  G15A2_TARGET_LEGACY_ID,
  G15A2_TARGET_PURCHASE_URL_AFTER,
} from "./gosaki-discography-dry-run-types";
import { getG15bDiscographyPurchaseUrlSaveConfig } from "./gosaki-discography-purchase-url-save-config";
import type { DiscographyWriteAdapterResult } from "./discography-write-types";

export type G15bDiscographySaveBinding = {
  changedFields: string[];
  payloadKeys: string[];
  expectedBeforeUpdatedAt: string | null;
  dryRunOk: boolean;
};

export type G15bDiscographySaveOutcome = DiscographyWriteAdapterResult | {
  module: "discography";
  operation: "update";
  dryRun: false;
  actualWrite: false;
  errorCode: "save_disabled" | "guard_failed" | "binding_failed";
  errorMessage: string;
};

export function isG15bDiscographySaveOutcomeSuccess(
  outcome: G15bDiscographySaveOutcome,
): outcome is Extract<DiscographyWriteAdapterResult, { actualWrite: true }> {
  return "actualWrite" in outcome && outcome.actualWrite === true && outcome.rowsAffected === 1;
}

function buildSaveDisabledOutcome(reason: string): G15bDiscographySaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "save_disabled",
    errorMessage: reason,
  };
}

function buildBindingFailure(message: string): G15bDiscographySaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "binding_failed",
    errorMessage: message,
  };
}

export async function executeG15bDiscographyPurchaseUrlSave(input: {
  url: string;
  anonKey: string;
  beforeSnapshot: GosakiDiscographyRecord;
  saveBinding: G15bDiscographySaveBinding;
}): Promise<G15bDiscographySaveOutcome> {
  const config = getG15bDiscographyPurchaseUrlSaveConfig();
  if (!config.saveEnabled) {
    return buildSaveDisabledOutcome(
      config.armFailureReason ?? config.defaultDisabledReason,
    );
  }

  if (!input.saveBinding.dryRunOk) {
    return buildBindingFailure("Dry-run preview must succeed before Save.");
  }

  const { beforeSnapshot, saveBinding } = input;

  if (beforeSnapshot.legacy_id !== G15A2_TARGET_LEGACY_ID) {
    return buildBindingFailure(`Target legacy_id must be ${G15A2_TARGET_LEGACY_ID}.`);
  }

  try {
    assertG15bDiscographyWriteApproval(G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID);
    assertG15bDiscographyChangedFieldsOnly(saveBinding.changedFields);
    assertG15bOptimisticLockBaseline(saveBinding.expectedBeforeUpdatedAt);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      module: "discography",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "guard_failed",
      errorMessage: message,
    };
  }

  const payload: DiscographyUpdateWritePayload = {
    purchase_url: G15A2_TARGET_PURCHASE_URL_AFTER,
  };

  try {
    assertG15bDiscographyUpdatePayloadAllowed(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      module: "discography",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "guard_failed",
      errorMessage: message,
    };
  }

  const client = getStagingSupabaseClient(input.url, input.anonKey);

  try {
    assertStaticToAstroCmsStagingSupabaseProject(input.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      module: "discography",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "guard_failed",
      errorMessage: message,
    };
  }

  const auth = await getStagingAuthSessionDetails(input.url, input.anonKey);
  if (!isSignedInStagingAuth(auth)) {
    return {
      module: "discography",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "auth_session_missing",
      errorMessage: "Sign in as staging admin before Save.",
    };
  }

  const outcome = await updateDiscographyWrite({
    client: client as unknown as Parameters<typeof updateDiscographyWrite>[0]["client"],
    approvalId: G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
    targetId: beforeSnapshot.id,
    beforeSnapshot,
    payload,
    expectedBeforeUpdatedAt: saveBinding.expectedBeforeUpdatedAt ?? undefined,
    writeScope: { legacyId: G15A2_TARGET_LEGACY_ID },
  });

  if ("rowsAffected" in outcome && outcome.actualWrite) {
    try {
      assertG15bRowsAffectedExactlyOne(outcome.rowsAffected);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        module: "discography",
        operation: "update",
        dryRun: false,
        actualWrite: false,
        errorCode: "guard_failed",
        errorMessage: message,
      };
    }
  }

  return outcome;
}
