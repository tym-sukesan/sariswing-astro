/**
 * G-19a — Generic album-level tracklist textarea diff dry-run (all 4 albums; no DB write).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  diffDiscographyTracklists,
  discographyTracklistDiffHasChanges,
} from "./discography-tracklist-diff";
import { parseDiscographyTracklistTextarea } from "./discography-tracklist-textarea-parse";
import { getGosakiDiscographyG19aTracklistDryRunConfig } from "./gosaki-discography-g19a-tracklist-generic-dry-run-config";
import {
  G19A_PHASE,
  G19A_TRACKLIST_DRY_RUN_APPROVAL_ID,
  isG19aTracklistAlbumLegacyId,
  type G19aTracklistTextareaDryRunResult,
} from "./gosaki-discography-g19a-tracklist-generic-types";

export type { G19aTracklistTextareaDryRunResult } from "./gosaki-discography-g19a-tracklist-generic-types";

export {
  G19A_PHASE,
  G19A_TRACKLIST_DRY_RUN_APPROVAL_ID,
  G19A_TRACKLIST_ALBUM_LEGACY_IDS,
  G19A_ALBUM_TRACK_COUNTS,
  G19A_TOTAL_TRACK_COUNT,
  G19A_SKYLARK_TRACK_7_CURRENT,
  G18G2_TRACKLIST_SAVE_CHAIN_CLOSED,
  isG19aTracklistAlbumLegacyId,
} from "./gosaki-discography-g19a-tracklist-generic-types";

function buildSafety(wouldWrite: boolean): G19aTracklistTextareaDryRunResult["safety"] {
  return {
    supabaseWriteCalled: false,
    writeAdapterUsed: false,
    discographyTracksTouched: false,
    serviceRoleUsed: false,
    actualWrite: false,
    wouldWrite,
  };
}

export function readDiscographyTracklistTextareaFromForm(form: HTMLFormElement): string {
  const el = form.querySelector<HTMLTextAreaElement>('textarea[name="tracks"]');
  return el?.value ?? "";
}

export function executeG19aTracklistTextareaDryRun(input: {
  beforeSnapshot: GosakiDiscographyRecord;
  tracksTextarea: string;
  env?: ImportMetaEnv;
}): G19aTracklistTextareaDryRunResult {
  const config = getGosakiDiscographyG19aTracklistDryRunConfig(input.env);
  const guardErrors: string[] = [];
  const legacyId = input.beforeSnapshot.legacy_id;

  if (!config.dryRun) {
    guardErrors.push(
      "PUBLIC_ADMIN_WRITE_DRY_RUN=true required for G-19a tracklist diff Preview.",
    );
  }

  if (!config.hostGatePassed) {
    guardErrors.push(config.hostGateWarning ?? "Staging host gate failed.");
  }

  if (!config.projectAllowlistPassed) {
    guardErrors.push("Staging project allowlist failed.");
  }

  if (!isG19aTracklistAlbumLegacyId(legacyId)) {
    guardErrors.push(
      `G-19a tracklist diff is scoped to published albums only (${legacyId} not supported).`,
    );
  }

  const beforeTracks = input.beforeSnapshot.tracks ?? [];
  const parsedAfter = parseDiscographyTracklistTextarea(input.tracksTextarea);
  const diff = diffDiscographyTracklists(beforeTracks, parsedAfter);
  const hasChanges = discographyTracklistDiffHasChanges(diff);

  const albumLegacyId = isG19aTracklistAlbumLegacyId(legacyId)
    ? legacyId
    : ("discography-002" as const);

  const base = {
    dryRun: true as const,
    phase: G19A_PHASE,
    approvalId: G19A_TRACKLIST_DRY_RUN_APPROVAL_ID,
    albumLegacyId,
    albumTitle: input.beforeSnapshot.title,
    beforeCount: beforeTracks.length,
    afterCount: parsedAfter.length,
    target: {
      id: input.beforeSnapshot.id,
      legacy_id: input.beforeSnapshot.legacy_id,
      title: input.beforeSnapshot.title,
      site_slug: "gosaki-piano" as const,
    },
    diff,
    unchanged: diff.unchanged,
    changed: diff.changed,
    added: diff.added,
    deleted: diff.deleted,
    reordered: diff.reordered,
    saveAllowed: false as const,
  };

  if (guardErrors.length > 0) {
    return {
      ...base,
      ok: false,
      guardErrors,
      saveReadiness: "guard_error",
      safety: buildSafety(false),
    };
  }

  return {
    ...base,
    ok: true,
    guardErrors: [],
    saveReadiness: hasChanges ? "ready_but_save_disabled" : "no_changes",
    safety: buildSafety(hasChanges),
  };
}
