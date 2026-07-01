/**
 * G-19b1 — Gosaki Discography generic single-title Save types (discography-004 track 1).
 */

import type { DiscographyTracklistDiffResult } from "./discography-tracklist-diff";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";
import { G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";

export const G19B1_PHASE =
  "G-19b1-gosaki-discography-tracklist-generic-single-title-save" as const;

export const G19B1_TARGET_LEGACY_ID = "discography-004" as const;

export const G19B1_TARGET_ALBUM_TITLE = "Ja-Jaaaaan!" as const;

export const G19B1_TARGET_TRACK_ROW_ID =
  "04e987a9-e251-4b0b-b860-21a61e711f8e" as const;

export const G19B1_TARGET_TRACK_NUMBER = 1 as const;

export const G19B1_BEFORE_TITLE = "Mary Ann" as const;

export const G19B1_AFTER_TITLE = "Mary Ann（テスト）" as const;

export const G19B1_EXPECTED_TRACK_COUNT = 8 as const;

export const G19B1_EXPECTED_BEFORE_FINGERPRINT =
  "Mary Ann|Nearer My God To Thee|Shreveport Stomp|A Fool Such As I|Si Tu Vois Ma Mere|St. Phillip Street Break Down|Girl Of My Dream|Bourbon Street Parade" as const;

export type G19b1TracklistTitleWhereGuard = {
  id: typeof G19B1_TARGET_TRACK_ROW_ID;
  discography_legacy_id: typeof G19B1_TARGET_LEGACY_ID;
  track_number: typeof G19B1_TARGET_TRACK_NUMBER;
  title: typeof G19B1_BEFORE_TITLE;
};

export type G19b1TracklistTitleDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G19b1TracklistTitleDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_but_not_armed"
  | "ready_to_save";

export type G19b1TracklistTitleDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G19B1_PHASE;
  approvalId: typeof G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID;
  albumLegacyId: typeof G19B1_TARGET_LEGACY_ID;
  albumTitle: string;
  beforeCount: number;
  afterCount: number;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  targetTrackRowId: typeof G19B1_TARGET_TRACK_ROW_ID;
  beforeTitle: typeof G19B1_BEFORE_TITLE;
  afterTitle: typeof G19B1_AFTER_TITLE;
  orderedTitleFingerprintBefore: string;
  orderedTitleFingerprintAfter: string;
  diff: DiscographyTracklistDiffResult;
  unchanged: DiscographyTracklistDiffResult["unchanged"];
  changed: DiscographyTracklistDiffResult["changed"];
  added: DiscographyTracklistDiffResult["added"];
  deleted: DiscographyTracklistDiffResult["deleted"];
  reordered: DiscographyTracklistDiffResult["reordered"];
  updatePayload: { title: typeof G19B1_AFTER_TITLE } | null;
  whereGuard: G19b1TracklistTitleWhereGuard | null;
  rowsAffectedRequired: 1;
  rollbackHint: string | null;
  guardErrors: string[];
  saveReadiness: G19b1TracklistTitleDryRunSaveReadiness;
  saveAllowed: false;
  safety: G19b1TracklistTitleDryRunSafety;
};

export function isG19b1TracklistAlbumLegacyId(
  legacyId: string,
): legacyId is typeof G19B1_TARGET_LEGACY_ID {
  return legacyId === G19B1_TARGET_LEGACY_ID;
}
