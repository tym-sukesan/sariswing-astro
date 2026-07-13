/**
 * G-19a — Shared generic tracklist dry-run helpers for verifier.
 */

import {
  parseDiscographyTracklistTextarea,
  diffDiscographyTracklists,
} from "./discography-tracklist-textarea-lib.mjs";

export const G19A_ALBUMS = [
  { legacyId: "discography-001", title: "Continuous", trackCount: 9 },
  { legacyId: "discography-002", title: "SKYLARK", trackCount: 8 },
  { legacyId: "discography-003", title: "About Us!!", trackCount: 9 },
  { legacyId: "discography-004", title: "Ja-Jaaaaan!", trackCount: 8 },
];

export const SKYLARK_TRACKS_CURRENT = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  "Like a Lover",
  "The Water Is Wide",
];

export function buildDbTracks(titles) {
  return titles.map((title, index) => ({
    track_number: index + 1,
    title,
    sort_order: index + 1,
  }));
}

export function simulateG19aDryRun(beforeTracks, textarea) {
  const parsedAfter = parseDiscographyTracklistTextarea(textarea);
  const diff = diffDiscographyTracklists(beforeTracks, parsedAfter);
  const hasChanges =
    diff.changed.length > 0 ||
    diff.added.length > 0 ||
    diff.deleted.length > 0 ||
    diff.reordered.length > 0;

  return {
    beforeCount: beforeTracks.length,
    afterCount: parsedAfter.length,
    diff,
    hasChanges,
    actualWrite: false,
    saveAllowed: false,
    dryRun: true,
  };
}
