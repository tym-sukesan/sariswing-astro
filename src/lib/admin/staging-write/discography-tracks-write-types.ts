/**
 * G-18g2 — Discography tracks table write approval IDs (staging shell).
 */

/** G-18g2 Gosaki Discography tracklist single-title non-dry-run slice. */
export type DiscographyG18g2TracklistSingleTitleNonDryRunApprovalId =
  "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";

export const G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID:
  DiscographyG18g2TracklistSingleTitleNonDryRunApprovalId =
  "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";

export type DiscographyTracksWriteApprovalIdUnion =
  DiscographyG18g2TracklistSingleTitleNonDryRunApprovalId;

export const DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS: readonly DiscographyTracksWriteApprovalIdUnion[] =
  [G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID];

export type DiscographyTrackTitleUpdatePayload = {
  title: string;
};

export type DiscographyTracksWriteSafety = {
  supabaseWriteCalled: boolean;
  writeAdapterUsed: boolean;
  discographyTracksTouched: boolean;
  serviceRoleUsed: false;
};

export function getDiscographyTracksWriteSafety(actualWrite: boolean): DiscographyTracksWriteSafety {
  return {
    supabaseWriteCalled: actualWrite,
    writeAdapterUsed: actualWrite,
    discographyTracksTouched: actualWrite,
    serviceRoleUsed: false,
  };
}
