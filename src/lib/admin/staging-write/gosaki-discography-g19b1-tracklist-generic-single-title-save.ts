/**
 * G-19b1 — Generic album-level tracklist textarea → single-row title Save adapter.
 * Dry-run Preview + gated non-dry-run path (operator Save only).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { isSignedInStagingAuth } from "./schedule-non-dry-run-poc-auth";
import {
  diffDiscographyTracklists,
  discographyTracklistDiffHasChanges,
} from "./discography-tracklist-diff";
import { parseDiscographyTracklistTextarea } from "./discography-tracklist-textarea-parse";
import {
  G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
  getDiscographyTracksWriteSafety,
} from "./discography-tracks-write-types";
import {
  assertG19b1DiscographyTracksWriteApproval,
  buildG19b1RollbackHint,
  buildG19b1WhereGuard,
  buildOrderedTitleFingerprint,
  validateG19b1AllowedDiff,
} from "./gosaki-discography-g19b1-tracklist-generic-title-guards";
import { getGosakiDiscographyG19b1TracklistTitleSaveConfig } from "./gosaki-discography-g19b1-tracklist-generic-single-title-save-config";
import {
  G19B1_AFTER_TITLE,
  G19B1_BEFORE_TITLE,
  G19B1_PHASE,
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
  type G19b1TracklistTitleDryRunResult,
} from "./gosaki-discography-g19b1-tracklist-generic-single-title-types";
import { readDiscographyTracklistTextareaFromForm } from "./gosaki-discography-g19a-tracklist-generic-dry-run";

export type { G19b1TracklistTitleDryRunResult } from "./gosaki-discography-g19b1-tracklist-generic-single-title-types";

export {
  G19B1_PHASE,
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
  G19B1_BEFORE_TITLE,
  G19B1_AFTER_TITLE,
  isG19b1TracklistAlbumLegacyId,
} from "./gosaki-discography-g19b1-tracklist-generic-single-title-types";

export { G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";

export { readDiscographyTracklistTextareaFromForm };

export type G19b1TracklistTitleSaveBinding = {
  dryRunOk: boolean;
  saveReadiness: string;
  targetTrackRowId: string;
  beforeTitle: string;
  afterTitle: string;
};

export type G19b1TracklistTitleSaveOutcome =
  | {
      module: "discography_tracks";
      operation: "update";
      targetTable: "discography_tracks";
      targetId: typeof G19B1_TARGET_TRACK_ROW_ID;
      dryRun: false;
      actualWrite: true;
      approvalId: typeof G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID;
      rowsAffected: number;
      beforeTitle: typeof G19B1_BEFORE_TITLE;
      afterTitle: typeof G19B1_AFTER_TITLE;
      rollbackHint: string;
      safety: ReturnType<typeof getDiscographyTracksWriteSafety>;
    }
  | {
      module: "discography_tracks";
      operation: "update";
      dryRun: false;
      actualWrite: false;
      errorCode:
        | "save_disabled"
        | "guard_failed"
        | "binding_failed"
        | "auth_session_missing"
        | "write_failed";
      errorMessage: string;
    };

export function isG19b1TracklistTitleSaveOutcomeSuccess(
  outcome: G19b1TracklistTitleSaveOutcome,
): outcome is Extract<G19b1TracklistTitleSaveOutcome, { actualWrite: true }> {
  return "actualWrite" in outcome && outcome.actualWrite === true && outcome.rowsAffected === 1;
}

function buildSafety(wouldWrite: boolean): G19b1TracklistTitleDryRunResult["safety"] {
  return {
    supabaseWriteCalled: false,
    writeAdapterUsed: false,
    discographyTracksTouched: false,
    serviceRoleUsed: false,
    actualWrite: false,
    wouldWrite,
  };
}

function resolveSaveReadiness(input: {
  guardErrors: string[];
  hasChanges: boolean;
  diffAllowed: boolean;
  saveConfig: ReturnType<typeof getGosakiDiscographyG19b1TracklistTitleSaveConfig>;
}): G19b1TracklistTitleDryRunResult["saveReadiness"] {
  if (input.guardErrors.length > 0) {
    return "guard_error";
  }
  if (!input.hasChanges) {
    return "no_changes";
  }
  if (!input.diffAllowed) {
    return "guard_error";
  }
  if (input.saveConfig.saveEnabled) {
    return "ready_to_save";
  }
  if (input.saveConfig.envArmArmed && !input.saveConfig.g18g2ArmConflict && input.saveConfig.dryRun) {
    return "ready_but_save_disabled";
  }
  return "ready_but_not_armed";
}

export function executeG19b1TracklistTitleDryRun(input: {
  beforeSnapshot: GosakiDiscographyRecord;
  tracksTextarea: string;
  env?: ImportMetaEnv;
}): G19b1TracklistTitleDryRunResult {
  const saveConfig = getGosakiDiscographyG19b1TracklistTitleSaveConfig(input.env);
  const guardErrors: string[] = [];

  if (!saveConfig.dryRun && !saveConfig.saveEnabled) {
    guardErrors.push(
      "PUBLIC_ADMIN_WRITE_DRY_RUN=false requires G-19b1 env arm for tracklist Save.",
    );
  }

  if (!saveConfig.hostGatePassed) {
    guardErrors.push(saveConfig.hostGateWarning ?? "Staging host gate failed.");
  }

  if (!saveConfig.projectAllowlistPassed) {
    guardErrors.push("Staging project allowlist failed.");
  }

  if (saveConfig.g18g2ArmConflict) {
    guardErrors.push("G-18g2 and G-19b1 tracklist Save arms cannot both be enabled.");
  }

  if (input.beforeSnapshot.legacy_id !== G19B1_TARGET_LEGACY_ID) {
    guardErrors.push(
      `G-19b1 tracklist Save is scoped to ${G19B1_TARGET_LEGACY_ID} only.`,
    );
  }

  const beforeTracks = input.beforeSnapshot.tracks ?? [];
  const parsedAfter = parseDiscographyTracklistTextarea(input.tracksTextarea);
  const diff = diffDiscographyTracklists(beforeTracks, parsedAfter);
  const hasChanges = discographyTracklistDiffHasChanges(diff);
  const fingerprintBefore = buildOrderedTitleFingerprint(beforeTracks);
  const fingerprintAfter = buildOrderedTitleFingerprint(parsedAfter);

  const diffGuardErrors =
    guardErrors.length === 0 && hasChanges
      ? validateG19b1AllowedDiff({
          albumLegacyId: input.beforeSnapshot.legacy_id,
          beforeCount: beforeTracks.length,
          afterCount: parsedAfter.length,
          diff,
          orderedTitleFingerprintBefore: fingerprintBefore,
        })
      : [];

  const allGuardErrors = [...guardErrors, ...diffGuardErrors];
  const diffAllowed = hasChanges && diffGuardErrors.length === 0 && guardErrors.length === 0;

  const whereGuard = diffAllowed ? buildG19b1WhereGuard() : null;
  const updatePayload = diffAllowed ? { title: G19B1_AFTER_TITLE } : null;
  const rollbackHint = diffAllowed ? buildG19b1RollbackHint() : null;

  const saveReadiness = resolveSaveReadiness({
    guardErrors: allGuardErrors,
    hasChanges,
    diffAllowed,
    saveConfig,
  });

  const ok =
    allGuardErrors.length === 0 && (saveReadiness === "no_changes" || diffAllowed);

  const wouldWrite = diffAllowed && saveReadiness !== "no_changes";

  return {
    ok,
    dryRun: true,
    phase: G19B1_PHASE,
    approvalId: G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    albumLegacyId: G19B1_TARGET_LEGACY_ID,
    albumTitle: input.beforeSnapshot.title,
    beforeCount: beforeTracks.length,
    afterCount: parsedAfter.length,
    target: {
      id: input.beforeSnapshot.id,
      legacy_id: input.beforeSnapshot.legacy_id,
      title: input.beforeSnapshot.title,
      site_slug: "gosaki-piano",
    },
    targetTrackRowId: G19B1_TARGET_TRACK_ROW_ID,
    beforeTitle: G19B1_BEFORE_TITLE,
    afterTitle: G19B1_AFTER_TITLE,
    orderedTitleFingerprintBefore: fingerprintBefore,
    orderedTitleFingerprintAfter: fingerprintAfter,
    diff,
    unchanged: diff.unchanged,
    changed: diff.changed,
    added: diff.added,
    deleted: diff.deleted,
    reordered: diff.reordered,
    updatePayload,
    whereGuard,
    rowsAffectedRequired: 1,
    rollbackHint,
    guardErrors: allGuardErrors,
    saveReadiness,
    saveAllowed: false,
    safety: buildSafety(wouldWrite),
  };
}

function buildSaveDisabledOutcome(reason: string): G19b1TracklistTitleSaveOutcome {
  return {
    module: "discography_tracks",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "save_disabled",
    errorMessage: reason,
  };
}

function buildBindingFailure(message: string): G19b1TracklistTitleSaveOutcome {
  return {
    module: "discography_tracks",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "binding_failed",
    errorMessage: message,
  };
}

function buildGuardFailure(message: string): G19b1TracklistTitleSaveOutcome {
  return {
    module: "discography_tracks",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "guard_failed",
    errorMessage: message,
  };
}

/**
 * Gated non-dry-run Save — operator only. Cursor must not call in G-19b1 implementation phase.
 */
export async function executeG19b1TracklistTitleSave(input: {
  url: string;
  anonKey: string;
  beforeSnapshot: GosakiDiscographyRecord;
  tracksTextarea: string;
  saveBinding: G19b1TracklistTitleSaveBinding;
}): Promise<G19b1TracklistTitleSaveOutcome> {
  const config = getGosakiDiscographyG19b1TracklistTitleSaveConfig();
  if (!config.saveEnabled) {
    return buildSaveDisabledOutcome(
      config.armFailureReason ?? config.defaultDisabledReason,
    );
  }

  if (config.dryRun) {
    return buildSaveDisabledOutcome(
      "PUBLIC_ADMIN_WRITE_DRY_RUN=true blocks actual write.",
    );
  }

  if (!input.saveBinding.dryRunOk) {
    return buildBindingFailure("Dry-run preview must succeed before Save.");
  }

  if (input.saveBinding.targetTrackRowId !== G19B1_TARGET_TRACK_ROW_ID) {
    return buildBindingFailure(`Target track row id must be ${G19B1_TARGET_TRACK_ROW_ID}.`);
  }

  const dryRun = executeG19b1TracklistTitleDryRun({
    beforeSnapshot: input.beforeSnapshot,
    tracksTextarea: input.tracksTextarea,
  });

  if (!dryRun.ok || dryRun.guardErrors.length > 0) {
    return buildGuardFailure(dryRun.guardErrors.join(" ") || "G-19b1 guards failed.");
  }

  try {
    assertG19b1DiscographyTracksWriteApproval(
      G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    );
  } catch (err) {
    return buildGuardFailure(err instanceof Error ? err.message : String(err));
  }

  const auth = await getStagingAuthSessionDetails(input.url, input.anonKey);
  if (!isSignedInStagingAuth(auth)) {
    return {
      module: "discography_tracks",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "auth_session_missing",
      errorMessage: "Staging auth session required for Save.",
    };
  }

  try {
    assertStaticToAstroCmsStagingSupabaseProject(input.url);
  } catch (err) {
    return buildGuardFailure(err instanceof Error ? err.message : String(err));
  }

  const client = getStagingSupabaseClient(input.url, input.anonKey);
  const where = buildG19b1WhereGuard();

  const { data, error } = await client
    .from("discography_tracks")
    .update({ title: G19B1_AFTER_TITLE })
    .eq("id", where.id)
    .eq("discography_legacy_id", where.discography_legacy_id)
    .eq("track_number", where.track_number)
    .eq("title", where.title)
    .select("id,title");

  if (error) {
    return {
      module: "discography_tracks",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "write_failed",
      errorMessage: error.message,
    };
  }

  const rowsAffected = Array.isArray(data) ? data.length : 0;
  if (rowsAffected !== 1) {
    return {
      module: "discography_tracks",
      operation: "update",
      dryRun: false,
      actualWrite: false,
      errorCode: "write_failed",
      errorMessage: `rowsAffected must be 1 (got ${rowsAffected}).`,
    };
  }

  return {
    module: "discography_tracks",
    operation: "update",
    targetTable: "discography_tracks",
    targetId: G19B1_TARGET_TRACK_ROW_ID,
    dryRun: false,
    actualWrite: true,
    approvalId: G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    rowsAffected,
    beforeTitle: G19B1_BEFORE_TITLE,
    afterTitle: G19B1_AFTER_TITLE,
    rollbackHint: buildG19b1RollbackHint(),
    safety: getDiscographyTracksWriteSafety(true),
  };
}
