/**
 * G-15d — Gosaki Discography existing release artist non-dry-run Save (staging shell).
 *
 * Cursor must not call this in implementation / preflight phases.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { isSignedInStagingAuth } from "./schedule-non-dry-run-poc-auth";
import { updateDiscographyWrite } from "./discography-write-adapter";
import {
  assertG15dDiscographyChangedFieldsOnly,
  assertG15dDiscographyUpdatePayloadAllowed,
  assertG15dDiscographyWriteApproval,
  assertG15dOptimisticLockBaseline,
  assertG15dRowsAffectedExactlyOne,
} from "./discography-write-guards";
import type { DiscographyUpdateWritePayload } from "./discography-write-types";
import { G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  G15D_TARGET_ARTIST_AFTER,
  G15D_TARGET_LEGACY_ID,
} from "./gosaki-discography-next-field-types";
import { getG15dDiscographyArtistSaveConfig } from "./gosaki-discography-artist-save-config";
import type { DiscographyWriteAdapterResult } from "./discography-write-types";

export type G15dDiscographySaveBinding = {
  changedFields: string[];
  payloadKeys: string[];
  expectedBeforeUpdatedAt: string | null;
  dryRunOk: boolean;
};

export type G15dDiscographySaveOutcome = DiscographyWriteAdapterResult | {
  module: "discography";
  operation: "update";
  dryRun: false;
  actualWrite: false;
  errorCode: "save_disabled" | "guard_failed" | "binding_failed" | "auth_session_missing";
  errorMessage: string;
};

export function isG15dDiscographySaveOutcomeSuccess(
  outcome: G15dDiscographySaveOutcome,
): outcome is Extract<DiscographyWriteAdapterResult, { actualWrite: true }> {
  return "actualWrite" in outcome && outcome.actualWrite === true && outcome.rowsAffected === 1;
}

function buildSaveDisabledOutcome(reason: string): G15dDiscographySaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "save_disabled",
    errorMessage: reason,
  };
}

function buildBindingFailure(message: string): G15dDiscographySaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "binding_failed",
    errorMessage: message,
  };
}

export async function executeG15dDiscographyArtistSave(input: {
  url: string;
  anonKey: string;
  beforeSnapshot: GosakiDiscographyRecord;
  saveBinding: G15dDiscographySaveBinding;
}): Promise<G15dDiscographySaveOutcome> {
  const config = getG15dDiscographyArtistSaveConfig();
  if (!config.saveEnabled) {
    return buildSaveDisabledOutcome(
      config.armFailureReason ?? config.defaultDisabledReason,
    );
  }

  if (!input.saveBinding.dryRunOk) {
    return buildBindingFailure("Dry-run preview must succeed before Save.");
  }

  const { beforeSnapshot, saveBinding } = input;

  if (beforeSnapshot.legacy_id !== G15D_TARGET_LEGACY_ID) {
    return buildBindingFailure(`Target legacy_id must be ${G15D_TARGET_LEGACY_ID}.`);
  }

  try {
    assertG15dDiscographyWriteApproval(G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID);
    assertG15dDiscographyChangedFieldsOnly(saveBinding.changedFields);
    assertG15dOptimisticLockBaseline(saveBinding.expectedBeforeUpdatedAt);
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
    artist: G15D_TARGET_ARTIST_AFTER,
  };

  try {
    assertG15dDiscographyUpdatePayloadAllowed(payload);
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
    approvalId: G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
    targetId: beforeSnapshot.id,
    beforeSnapshot,
    payload,
    expectedBeforeUpdatedAt: saveBinding.expectedBeforeUpdatedAt ?? undefined,
    writeScope: { legacyId: G15D_TARGET_LEGACY_ID },
  });

  if ("rowsAffected" in outcome && outcome.actualWrite) {
    try {
      assertG15dRowsAffectedExactlyOne(outcome.rowsAffected);
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
