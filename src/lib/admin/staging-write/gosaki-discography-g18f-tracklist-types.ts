/**
 * G-18f — Gosaki Discography tracklist textarea diff dry-run types.
 */

import type { DiscographyTracklistDiffResult } from "./discography-tracklist-diff";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export const G18F_PHASE = "G-18f-gosaki-discography-tracklist-textarea-diff-dry-run" as const;

export const G18F_TRACKLIST_DRY_RUN_APPROVAL_ID =
  "G-18f-gosaki-discography-tracklist-textarea-diff-dry-run" as const;

export const G18F_TARGET_LEGACY_ID = "discography-002" as const;

export const G18F_TARGET_ALBUM_TITLE = "SKYLARK" as const;

export const G18F_TARGET_TRACK_COUNT = 8 as const;

export type G18fTracklistDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G18fTracklistDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G18fTracklistTextareaDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G18F_PHASE;
  approvalId: typeof G18F_TRACKLIST_DRY_RUN_APPROVAL_ID;
  albumLegacyId: typeof G18F_TARGET_LEGACY_ID | string;
  albumTitle: string;
  beforeCount: number;
  afterCount: number;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  diff: DiscographyTracklistDiffResult;
  unchanged: DiscographyTracklistDiffResult["unchanged"];
  changed: DiscographyTracklistDiffResult["changed"];
  added: DiscographyTracklistDiffResult["added"];
  deleted: DiscographyTracklistDiffResult["deleted"];
  reordered: DiscographyTracklistDiffResult["reordered"];
  guardErrors: string[];
  saveReadiness: G18fTracklistDryRunSaveReadiness;
  saveAllowed: false;
  safety: G18fTracklistDryRunSafety;
};
