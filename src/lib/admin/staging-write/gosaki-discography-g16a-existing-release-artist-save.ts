/**
 * G-16a — Gosaki Discography existing release artist non-dry-run Save (staging shell).
 *
 * Cursor must not call this in implementation / preflight phases.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { isSignedInStagingAuth } from "./schedule-non-dry-run-poc-auth";
import { updateDiscographyWrite } from "./discography-write-adapter";
import {
  assertG16aDiscographyChangedFieldsOnly,
  assertG16aDiscographyUpdatePayloadAllowed,
  assertG16aDiscographyWriteApproval,
  assertG16aOptimisticLockBaseline,
  assertG16aRowsAffectedExactlyOne,
} from "./discography-write-guards";
import type { DiscographyUpdateWritePayload } from "./discography-write-types";
import { G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  G16A_TARGET_ARTIST_AFTER,
  G16A_TARGET_LEGACY_ID,
} from "./gosaki-discography-g16a-next-field-types";
import { getG16aDiscographyArtistSaveConfig } from "./gosaki-discography-g16a-artist-save-config";
import type { DiscographyWriteAdapterResult } from "./discography-write-types";

export type G16aDiscographySaveBinding = {
  changedFields: string[];
  payloadKeys: string[];
  expectedBeforeUpdatedAt: string | null;
  dryRunOk: boolean;
};

export type G16aDiscographySaveOutcome = DiscographyWriteAdapterResult | {
  module: "discography";
  operation: "update";
  dryRun: false;
  actualWrite: false;
  errorCode: "save_disabled" | "guard_failed" | "binding_failed" | "auth_session_missing";
  errorMessage: string;
};

export function isG16aDiscographySaveOutcomeSuccess(
  outcome: G16aDiscographySaveOutcome,
): outcome is Extract<DiscographyWriteAdapterResult, { actualWrite: true }> {
  return "actualWrite" in outcome && outcome.actualWrite === true && outcome.rowsAffected === 1;
}

function buildSaveDisabledOutcome(reason: string): G16aDiscographySaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "save_disabled",
    errorMessage: reason,
  };
}

function buildBindingFailure(message: string): G16aDiscographySaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "binding_failed",
    errorMessage: message,
  };
}

export async function executeG16aDiscographyArtistSave(input: {
  url: string;
  anonKey: string;
  beforeSnapshot: GosakiDiscographyRecord;
  saveBinding: G16aDiscographySaveBinding;
}): Promise<G16aDiscographySaveOutcome> {
  const config = getG16aDiscographyArtistSaveConfig();
  if (!config.saveEnabled) {
    return buildSaveDisabledOutcome(
      config.armFailureReason ?? config.defaultDisabledReason,
    );
  }

  if (!input.saveBinding.dryRunOk) {
    return buildBindingFailure("Dry-run preview must succeed before Save.");
  }

  const { beforeSnapshot, saveBinding } = input;

  if (beforeSnapshot.legacy_id !== G16A_TARGET_LEGACY_ID) {
    return buildBindingFailure(`Target legacy_id must be ${G16A_TARGET_LEGACY_ID}.`);
  }

  try {
    assertG16aDiscographyWriteApproval(G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID);
    assertG16aDiscographyChangedFieldsOnly(saveBinding.changedFields);
    assertG16aOptimisticLockBaseline(saveBinding.expectedBeforeUpdatedAt);
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
    artist: G16A_TARGET_ARTIST_AFTER,
  };

  try {
    assertG16aDiscographyUpdatePayloadAllowed(payload);
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
    approvalId: G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
    targetId: beforeSnapshot.id,
    beforeSnapshot,
    payload,
    expectedBeforeUpdatedAt: saveBinding.expectedBeforeUpdatedAt ?? undefined,
    writeScope: { legacyId: G16A_TARGET_LEGACY_ID },
  });

  if ("rowsAffected" in outcome && outcome.actualWrite) {
    try {
      assertG16aRowsAffectedExactlyOne(outcome.rowsAffected);
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
