/**
 * G-18g2 — Album-level tracklist textarea → single-row title Save adapter.
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
import { G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";
import { getDiscographyTracksWriteSafety } from "./discography-tracks-write-types";
import {
  buildG18g2RollbackHint,
  buildG18g2WhereGuard,
  buildOrderedTitleFingerprint,
  assertG18g2DiscographyTracksWriteApproval,
  validateG18g2AllowedDiff,
} from "./gosaki-discography-g18g2-tracklist-title-guards";
import { getGosakiDiscographyG18g2TracklistTitleSaveConfig } from "./gosaki-discography-g18g2-tracklist-title-save-config";
import {
  G18G2_AFTER_TITLE,
  G18G2_BEFORE_TITLE,
  G18G2_PHASE,
  G18G2_TARGET_LEGACY_ID,
  G18G2_TARGET_TRACK_ROW_ID,
  type G18g2TracklistTitleDryRunResult,
} from "./gosaki-discography-g18g2-tracklist-title-types";
import { readDiscographyTracklistTextareaFromForm } from "./gosaki-discography-g18f-tracklist-textarea-dry-run";

export type { G18g2TracklistTitleDryRunResult } from "./gosaki-discography-g18g2-tracklist-title-types";

export {
  G18G2_PHASE,
  G18G2_TARGET_LEGACY_ID,
  G18G2_TARGET_TRACK_ROW_ID,
  G18G2_BEFORE_TITLE,
  G18G2_AFTER_TITLE,
} from "./gosaki-discography-g18g2-tracklist-title-types";

export { G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";

export { readDiscographyTracklistTextareaFromForm };

export type G18g2TracklistTitleSaveBinding = {
  dryRunOk: boolean;
  saveReadiness: string;
  targetTrackRowId: string;
  beforeTitle: string;
  afterTitle: string;
};

export type G18g2TracklistTitleSaveOutcome =
  | {
      module: "discography_tracks";
      operation: "update";
      targetTable: "discography_tracks";
      targetId: typeof G18G2_TARGET_TRACK_ROW_ID;
      dryRun: false;
      actualWrite: true;
      approvalId: typeof G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID;
      rowsAffected: number;
      beforeTitle: typeof G18G2_BEFORE_TITLE;
      afterTitle: typeof G18G2_AFTER_TITLE;
      rollbackHint: string;
      safety: ReturnType<typeof getDiscographyTracksWriteSafety>;
    }
  | {
      module: "discography_tracks";
      operation: "update";
      dryRun: false;
      actualWrite: false;
      errorCode: "save_disabled" | "guard_failed" | "binding_failed" | "auth_session_missing" | "write_failed";
      errorMessage: string;
    };

export function isG18g2TracklistTitleSaveOutcomeSuccess(
  outcome: G18g2TracklistTitleSaveOutcome,
): outcome is Extract<G18g2TracklistTitleSaveOutcome, { actualWrite: true }> {
  return "actualWrite" in outcome && outcome.actualWrite === true && outcome.rowsAffected === 1;
}

function buildSafety(wouldWrite: boolean): G18g2TracklistTitleDryRunResult["safety"] {
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
  saveConfig: ReturnType<typeof getGosakiDiscographyG18g2TracklistTitleSaveConfig>;
}): G18g2TracklistTitleDryRunResult["saveReadiness"] {
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
  if (input.saveConfig.envArmArmed && input.saveConfig.dryRun) {
    return "ready_but_save_disabled";
  }
  return "ready_but_not_armed";
}

export function executeG18g2TracklistTitleDryRun(input: {
  beforeSnapshot: GosakiDiscographyRecord;
  tracksTextarea: string;
  env?: ImportMetaEnv;
}): G18g2TracklistTitleDryRunResult {
  const saveConfig = getGosakiDiscographyG18g2TracklistTitleSaveConfig(input.env);
  const guardErrors: string[] = [];

  if (!saveConfig.dryRun && !saveConfig.saveEnabled) {
    guardErrors.push(
      "PUBLIC_ADMIN_WRITE_DRY_RUN=false requires G-18g2 env arm for tracklist Save.",
    );
  }

  if (!saveConfig.hostGatePassed) {
    guardErrors.push(saveConfig.hostGateWarning ?? "Staging host gate failed.");
  }

  if (!saveConfig.projectAllowlistPassed) {
    guardErrors.push("Staging project allowlist failed.");
  }

  if (input.beforeSnapshot.legacy_id !== G18G2_TARGET_LEGACY_ID) {
    guardErrors.push(
      `G-18g2 tracklist Save is scoped to ${G18G2_TARGET_LEGACY_ID} only.`,
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
      ? validateG18g2AllowedDiff({
          albumLegacyId: input.beforeSnapshot.legacy_id,
          beforeCount: beforeTracks.length,
          afterCount: parsedAfter.length,
          diff,
          orderedTitleFingerprintBefore: fingerprintBefore,
        })
      : [];

  const allGuardErrors = [...guardErrors, ...diffGuardErrors];
  const diffAllowed = hasChanges && diffGuardErrors.length === 0 && guardErrors.length === 0;

  const whereGuard = diffAllowed ? buildG18g2WhereGuard() : null;
  const updatePayload = diffAllowed ? { title: G18G2_AFTER_TITLE } : null;
  const rollbackHint = diffAllowed ? buildG18g2RollbackHint() : null;

  const saveReadiness = resolveSaveReadiness({
    guardErrors: allGuardErrors,
    hasChanges,
    diffAllowed,
    saveConfig,
  });

  const ok =
    allGuardErrors.length === 0 &&
    (saveReadiness === "no_changes" || diffAllowed);

  const wouldWrite = diffAllowed && saveReadiness !== "no_changes";

  return {
    ok,
    dryRun: true,
    phase: G18G2_PHASE,
    approvalId: G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    albumLegacyId: input.beforeSnapshot.legacy_id,
    albumTitle: input.beforeSnapshot.title,
    beforeCount: beforeTracks.length,
    afterCount: parsedAfter.length,
    target: {
      id: input.beforeSnapshot.id,
      legacy_id: input.beforeSnapshot.legacy_id,
      title: input.beforeSnapshot.title,
      site_slug: "gosaki-piano",
    },
    targetTrackRowId: G18G2_TARGET_TRACK_ROW_ID,
    beforeTitle: G18G2_BEFORE_TITLE,
    afterTitle: G18G2_AFTER_TITLE,
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

function buildSaveDisabledOutcome(reason: string): G18g2TracklistTitleSaveOutcome {
  return {
    module: "discography_tracks",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "save_disabled",
    errorMessage: reason,
  };
}

function buildBindingFailure(message: string): G18g2TracklistTitleSaveOutcome {
  return {
    module: "discography_tracks",
    operation: "update",
    dryRun: false,
    actualWrite: false,
    errorCode: "binding_failed",
    errorMessage: message,
  };
}

function buildGuardFailure(message: string): G18g2TracklistTitleSaveOutcome {
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
 * Gated non-dry-run Save — operator only. Cursor must not call in G-18g2 implementation phase.
 */
export async function executeG18g2TracklistTitleSave(input: {
  url: string;
  anonKey: string;
  beforeSnapshot: GosakiDiscographyRecord;
  tracksTextarea: string;
  saveBinding: G18g2TracklistTitleSaveBinding;
}): Promise<G18g2TracklistTitleSaveOutcome> {
  const config = getGosakiDiscographyG18g2TracklistTitleSaveConfig();
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

  if (input.saveBinding.targetTrackRowId !== G18G2_TARGET_TRACK_ROW_ID) {
    return buildBindingFailure(`Target track row id must be ${G18G2_TARGET_TRACK_ROW_ID}.`);
  }

  const dryRun = executeG18g2TracklistTitleDryRun({
    beforeSnapshot: input.beforeSnapshot,
    tracksTextarea: input.tracksTextarea,
  });

  if (!dryRun.ok || dryRun.guardErrors.length > 0) {
    return buildGuardFailure(dryRun.guardErrors.join(" ") || "G-18g2 guards failed.");
  }

  try {
    assertG18g2DiscographyTracksWriteApproval(
      G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
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
  const where = buildG18g2WhereGuard();

  const { data, error } = await client
    .from("discography_tracks")
    .update({ title: G18G2_AFTER_TITLE })
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
    targetId: G18G2_TARGET_TRACK_ROW_ID,
    dryRun: false,
    actualWrite: true,
    approvalId: G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    rowsAffected,
    beforeTitle: G18G2_BEFORE_TITLE,
    afterTitle: G18G2_AFTER_TITLE,
    rollbackHint: buildG18g2RollbackHint(),
    safety: getDiscographyTracksWriteSafety(true),
  };
}
