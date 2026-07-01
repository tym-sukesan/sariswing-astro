/**
 * G-19a — Gosaki Discography generic tracklist textarea dry-run types (all albums).
 */

import type { DiscographyTracklistDiffResult } from "./discography-tracklist-diff";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export const G19A_PHASE =
  "G-19a-gosaki-discography-tracklist-generic-textarea-dry-run" as const;

export const G19A_TRACKLIST_DRY_RUN_APPROVAL_ID =
  "G-19a-gosaki-discography-tracklist-generic-textarea-dry-run" as const;

export const G19A_TRACKLIST_ALBUM_LEGACY_IDS = [
  "discography-001",
  "discography-002",
  "discography-003",
  "discography-004",
] as const;

export type G19aTracklistAlbumLegacyId = (typeof G19A_TRACKLIST_ALBUM_LEGACY_IDS)[number];

export const G19A_ALBUM_TRACK_COUNTS: Record<G19aTracklistAlbumLegacyId, number> = {
  "discography-001": 9,
  "discography-002": 8,
  "discography-003": 9,
  "discography-004": 8,
};

export const G19A_TOTAL_TRACK_COUNT = 34 as const;

export const G19A_SKYLARK_TRACK_7_CURRENT = "Like a Lover（テスト）" as const;

/** G-18g2 single-title Save chain is closed — do not re-arm without new approval. */
export const G18G2_TRACKLIST_SAVE_CHAIN_CLOSED = true as const;

export type G19aTracklistDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G19aTracklistDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled";

export type G19aTracklistTextareaDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G19A_PHASE;
  approvalId: typeof G19A_TRACKLIST_DRY_RUN_APPROVAL_ID;
  albumLegacyId: G19aTracklistAlbumLegacyId;
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
  saveReadiness: G19aTracklistDryRunSaveReadiness;
  saveAllowed: false;
  safety: G19aTracklistDryRunSafety;
};

export function isG19aTracklistAlbumLegacyId(
  legacyId: string,
): legacyId is G19aTracklistAlbumLegacyId {
  return (G19A_TRACKLIST_ALBUM_LEGACY_IDS as readonly string[]).includes(legacyId);
}
