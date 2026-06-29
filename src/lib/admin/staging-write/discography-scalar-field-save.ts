/**
 * G-17b/G-17d — Generic Discography scalar field slice non-dry-run Save (staging shell).
 *
 * Cursor must not call this in implementation / preflight phases.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { isSignedInStagingAuth } from "./schedule-non-dry-run-poc-auth";
import { updateDiscographyWrite } from "./discography-write-adapter";
import {
  assertDiscographyScalarSliceGuards,
  assertDiscographyScalarSliceNotClosedForReSave,
} from "./discography-scalar-field-guards";
import { getDiscographyScalarSliceSaveConfig } from "./discography-scalar-field-save-config";
import type { DiscographyScalarFieldSliceEntry } from "./discography-scalar-field-slice-registry";
import type { DiscographyUpdateWritePayload } from "./discography-write-types";
import type { DiscographyWriteAdapterResult } from "./discography-write-types";
import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";

export type DiscographyScalarSliceSaveBinding = {
  changedFields: string[];
  payloadKeys: string[];
  expectedBeforeUpdatedAt: string | null;
  dryRunOk: boolean;
};

export type DiscographyScalarSliceSaveOutcome =
  | DiscographyWriteAdapterResult
  | {
      module: "discography";
      operation: "update";
      dryRun: false;
      actualWrite: false;
      errorCode:
        | "save_disabled"
        | "guard_failed"
        | "binding_failed"
        | "auth_session_missing";
      errorMessage: string;
    };

export function isDiscographyScalarSliceSaveOutcomeSuccess(
  outcome: DiscographyScalarSliceSaveOutcome,
): outcome is Extract<DiscographyWriteAdapterResult, { actualWrite: true }> {
  return "actualWrite" in outcome && outcome.actualWrite === true && outcome.rowsAffected === 1;
}

function buildSaveDisabledOutcome(reason: string): DiscographyScalarSliceSaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "save_disabled",
    errorMessage: reason,
  };
}

function buildBindingFailure(message: string): DiscographyScalarSliceSaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "binding_failed",
    errorMessage: message,
  };
}

function buildGuardFailure(message: string): DiscographyScalarSliceSaveOutcome {
  return {
    module: "discography",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "guard_failed",
    errorMessage: message,
  };
}

export async function executeDiscographyScalarSliceSave(input: {
  entry: DiscographyScalarFieldSliceEntry;
  url: string;
  anonKey: string;
  beforeSnapshot: GosakiDiscographyRecord;
  saveBinding: DiscographyScalarSliceSaveBinding;
  payload: DiscographyUpdateWritePayload;
}): Promise<DiscographyScalarSliceSaveOutcome> {
  const { entry, beforeSnapshot, saveBinding, payload } = input;
  const config = getDiscographyScalarSliceSaveConfig(entry);
  if (!config.saveEnabled) {
    return buildSaveDisabledOutcome(
      config.armFailureReason ?? config.defaultDisabledReason,
    );
  }

  if (!saveBinding.dryRunOk) {
    return buildBindingFailure("Dry-run preview must succeed before Save.");
  }

  if (beforeSnapshot.legacy_id !== entry.legacyId) {
    return buildBindingFailure(`Target legacy_id must be ${entry.legacyId}.`);
  }

  try {
    assertDiscographyScalarSliceNotClosedForReSave(entry);
    assertDiscographyScalarSliceGuards(entry, {
      approvalId: entry.approvalId,
      payload,
      row: beforeSnapshot,
      changedFields: saveBinding.changedFields,
      expectedBeforeUpdatedAt: saveBinding.expectedBeforeUpdatedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildGuardFailure(message);
  }

  try {
    assertStaticToAstroCmsStagingSupabaseProject(input.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildGuardFailure(message);
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

  const client = getStagingSupabaseClient(input.url, input.anonKey);

  const outcome = await updateDiscographyWrite({
    client: client as unknown as Parameters<typeof updateDiscographyWrite>[0]["client"],
    approvalId: entry.approvalId,
    targetId: beforeSnapshot.id,
    beforeSnapshot,
    payload,
    expectedBeforeUpdatedAt: saveBinding.expectedBeforeUpdatedAt ?? undefined,
    writeScope: { legacyId: entry.legacyId },
  });

  if ("rowsAffected" in outcome && outcome.actualWrite) {
    try {
      assertDiscographyScalarSliceGuards(entry, {
        approvalId: entry.approvalId,
        payload,
        row: beforeSnapshot,
        changedFields: saveBinding.changedFields,
        rowsAffected: outcome.rowsAffected,
        expectedBeforeUpdatedAt: saveBinding.expectedBeforeUpdatedAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return buildGuardFailure(message);
    }
  }

  return outcome;
}
