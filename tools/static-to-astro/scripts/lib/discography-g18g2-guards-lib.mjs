/**
 * G-18g2 — Shared guard helpers for verifier (mirrors staging-write TS modules).
 */

import {
  diffDiscographyTracklists,
  parseDiscographyTracklistTextarea,
} from "./discography-tracklist-textarea-lib.mjs";

export const G18G2_TARGET_LEGACY_ID = "discography-002";
export const G18G2_TARGET_TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
export const G18G2_TARGET_TRACK_NUMBER = 7;
export const G18G2_BEFORE_TITLE = "Like a Lover";
export const G18G2_AFTER_TITLE = "Like a Lover（テスト）";
export const G18G2_EXPECTED_TRACK_COUNT = 8;
export const G18G2_EXPECTED_BEFORE_FINGERPRINT =
  "On a Clear Day|My Blue Heaven|How Deep Is The Ocean|Skylark|Set Sail|What a Wonderful World|Like a Lover|The Water Is Wide";
export const G18G2_APPROVAL_ID =
  "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";

export const SKYLARK_TRACKS = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  "Like a Lover",
  "The Water Is Wide",
];

export function buildOrderedTitleFingerprint(tracks) {
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((track) => track.title)
    .join("|");
}

export function validateG18g2AllowedDiff(input) {
  const errors = [];
  if (input.albumLegacyId !== G18G2_TARGET_LEGACY_ID) {
    errors.push("albumLegacyId mismatch");
  }
  if (input.beforeCount !== G18G2_EXPECTED_TRACK_COUNT) {
    errors.push("beforeCount mismatch");
  }
  if (input.afterCount !== G18G2_EXPECTED_TRACK_COUNT) {
    errors.push("afterCount mismatch");
  }
  if (input.orderedTitleFingerprintBefore !== G18G2_EXPECTED_BEFORE_FINGERPRINT) {
    errors.push("fingerprint mismatch");
  }
  if (input.diff.changed.length !== 1) errors.push("changed.length !== 1");
  if (input.diff.added.length !== 0) errors.push("added not empty");
  if (input.diff.deleted.length !== 0) errors.push("deleted not empty");
  if (input.diff.reordered.length !== 0) errors.push("reordered not empty");
  const change = input.diff.changed[0];
  if (change) {
    if (change.track_number !== G18G2_TARGET_TRACK_NUMBER) errors.push("track_number mismatch");
    if (change.before !== G18G2_BEFORE_TITLE) errors.push("before title mismatch");
    if (change.after !== G18G2_AFTER_TITLE) errors.push("after title mismatch");
  }
  return errors;
}

export function simulateG18g2PocDiff() {
  const beforeTracks = SKYLARK_TRACKS.map((title, index) => ({
    track_number: index + 1,
    title,
    sort_order: index + 1,
  }));
  const afterLines = [...SKYLARK_TRACKS];
  afterLines[6] = G18G2_AFTER_TITLE;
  const parsedAfter = parseDiscographyTracklistTextarea(afterLines.join("\n"));
  const diff = diffDiscographyTracklists(beforeTracks, parsedAfter);
  const fingerprintBefore = buildOrderedTitleFingerprint(beforeTracks);
  const guardErrors = validateG18g2AllowedDiff({
    albumLegacyId: G18G2_TARGET_LEGACY_ID,
    beforeCount: beforeTracks.length,
    afterCount: parsedAfter.length,
    diff,
    orderedTitleFingerprintBefore: fingerprintBefore,
  });
  return { diff, guardErrors, fingerprintBefore, parsedAfter };
}

export { parseDiscographyTracklistTextarea, diffDiscographyTracklists };
