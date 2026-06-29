/**
 * G-18f — Album-level tracklist textarea diff dry-run (no DB write).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  diffDiscographyTracklists,
  discographyTracklistDiffHasChanges,
} from "./discography-tracklist-diff";
import { parseDiscographyTracklistTextarea } from "./discography-tracklist-textarea-parse";
import { getGosakiDiscographyG18fTracklistDryRunConfig } from "./gosaki-discography-g18f-tracklist-dry-run-config";
import {
  G18F_PHASE,
  G18F_TARGET_LEGACY_ID,
  G18F_TRACKLIST_DRY_RUN_APPROVAL_ID,
  type G18fTracklistTextareaDryRunResult,
} from "./gosaki-discography-g18f-tracklist-types";

export type { G18fTracklistTextareaDryRunResult } from "./gosaki-discography-g18f-tracklist-types";

export {
  G18F_PHASE,
  G18F_TARGET_LEGACY_ID,
  G18F_TRACKLIST_DRY_RUN_APPROVAL_ID,
} from "./gosaki-discography-g18f-tracklist-types";

function buildSafety(wouldWrite: boolean): G18fTracklistTextareaDryRunResult["safety"] {
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

export function executeG18fTracklistTextareaDryRun(input: {
  beforeSnapshot: GosakiDiscographyRecord;
  tracksTextarea: string;
  env?: ImportMetaEnv;
}): G18fTracklistTextareaDryRunResult {
  const config = getGosakiDiscographyG18fTracklistDryRunConfig(input.env);
  const guardErrors: string[] = [];

  if (!config.dryRun) {
    guardErrors.push(
      "PUBLIC_ADMIN_WRITE_DRY_RUN=true required for G-18f tracklist diff Preview.",
    );
  }

  if (!config.hostGatePassed) {
    guardErrors.push(config.hostGateWarning ?? "Staging host gate failed.");
  }

  if (!config.projectAllowlistPassed) {
    guardErrors.push("Staging project allowlist failed.");
  }

  if (input.beforeSnapshot.legacy_id !== G18F_TARGET_LEGACY_ID) {
    guardErrors.push(
      `G-18f tracklist diff is scoped to ${G18F_TARGET_LEGACY_ID} only.`,
    );
  }

  const beforeTracks = input.beforeSnapshot.tracks ?? [];
  const parsedAfter = parseDiscographyTracklistTextarea(input.tracksTextarea);
  const diff = diffDiscographyTracklists(beforeTracks, parsedAfter);
  const hasChanges = discographyTracklistDiffHasChanges(diff);

  const base = {
    dryRun: true as const,
    phase: G18F_PHASE,
    approvalId: G18F_TRACKLIST_DRY_RUN_APPROVAL_ID,
    albumLegacyId: input.beforeSnapshot.legacy_id,
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
