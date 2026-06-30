/**
 * G-18g2 — Gosaki Discography tracklist single-title Save types.
 */

import type { DiscographyTracklistDiffResult } from "./discography-tracklist-diff";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";
import { G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";

export const G18G2_PHASE =
  "G-18g2-gosaki-discography-tracklist-single-title-save-dry-run" as const;

export const G18G2_TARGET_LEGACY_ID = "discography-002" as const;

export const G18G2_TARGET_ALBUM_TITLE = "SKYLARK" as const;

export const G18G2_TARGET_TRACK_ROW_ID =
  "fd58cd6e-2fff-4ff2-96af-3087c469450b" as const;

export const G18G2_TARGET_TRACK_NUMBER = 7 as const;

export const G18G2_BEFORE_TITLE = "Like a Lover" as const;

export const G18G2_AFTER_TITLE = "Like a Lover（テスト）" as const;

export const G18G2_EXPECTED_TRACK_COUNT = 8 as const;

export const G18G2_EXPECTED_BEFORE_FINGERPRINT =
  "On a Clear Day|My Blue Heaven|How Deep Is The Ocean|Skylark|Set Sail|What a Wonderful World|Like a Lover|The Water Is Wide" as const;

export type G18g2TracklistTitleWhereGuard = {
  id: typeof G18G2_TARGET_TRACK_ROW_ID;
  discography_legacy_id: typeof G18G2_TARGET_LEGACY_ID;
  track_number: typeof G18G2_TARGET_TRACK_NUMBER;
  title: typeof G18G2_BEFORE_TITLE;
};

export type G18g2TracklistTitleDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G18g2TracklistTitleDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_but_not_armed"
  | "ready_to_save";

export type G18g2TracklistTitleDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G18G2_PHASE;
  approvalId: typeof G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID;
  albumLegacyId: typeof G18G2_TARGET_LEGACY_ID | string;
  albumTitle: string;
  beforeCount: number;
  afterCount: number;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  targetTrackRowId: typeof G18G2_TARGET_TRACK_ROW_ID;
  beforeTitle: typeof G18G2_BEFORE_TITLE;
  afterTitle: typeof G18G2_AFTER_TITLE;
  orderedTitleFingerprintBefore: string;
  orderedTitleFingerprintAfter: string;
  diff: DiscographyTracklistDiffResult;
  unchanged: DiscographyTracklistDiffResult["unchanged"];
  changed: DiscographyTracklistDiffResult["changed"];
  added: DiscographyTracklistDiffResult["added"];
  deleted: DiscographyTracklistDiffResult["deleted"];
  reordered: DiscographyTracklistDiffResult["reordered"];
  updatePayload: { title: typeof G18G2_AFTER_TITLE } | null;
  whereGuard: G18g2TracklistTitleWhereGuard | null;
  rowsAffectedRequired: 1;
  rollbackHint: string | null;
  guardErrors: string[];
  saveReadiness: G18g2TracklistTitleDryRunSaveReadiness;
  saveAllowed: false;
  safety: G18g2TracklistTitleDryRunSafety;
};
