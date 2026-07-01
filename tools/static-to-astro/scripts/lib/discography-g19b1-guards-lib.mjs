/**
 * G-19b1 — Shared guard helpers for implementation verifier (mirrors staging-write TS modules).
 */

import {
  diffDiscographyTracklists,
  parseDiscographyTracklistTextarea,
} from "./discography-tracklist-textarea-lib.mjs";

export const G19B1_TARGET_LEGACY_ID = "discography-004";
export const G19B1_TARGET_ALBUM_TITLE = "Ja-Jaaaaan!";
export const G19B1_TARGET_TRACK_ROW_ID = "04e987a9-e251-4b0b-b860-21a61e711f8e";
export const G19B1_TARGET_TRACK_NUMBER = 1;
export const G19B1_BEFORE_TITLE = "Mary Ann";
export const G19B1_AFTER_TITLE = "Mary Ann（テスト）";
export const G19B1_EXPECTED_TRACK_COUNT = 8;
export const G19B1_EXPECTED_BEFORE_FINGERPRINT =
  "Mary Ann|Nearer My God To Thee|Shreveport Stomp|A Fool Such As I|Si Tu Vois Ma Mere|St. Phillip Street Break Down|Girl Of My Dream|Bourbon Street Parade";
export const G19B1_APPROVAL_ID =
  "G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice";
export const G19B1_ARMED_ENV =
  "PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED";
export const G18G2_ARMED_ENV = "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED";

export const JA_JAAAAAN_TRACKS = [
  "Mary Ann",
  "Nearer My God To Thee",
  "Shreveport Stomp",
  "A Fool Such As I",
  "Si Tu Vois Ma Mere",
  "St. Phillip Street Break Down",
  "Girl Of My Dream",
  "Bourbon Street Parade",
];

export function buildOrderedTitleFingerprint(tracks) {
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((track) => track.title)
    .join("|");
}

export function validateG19b1AllowedDiff(input) {
  const errors = [];
  if (input.albumLegacyId !== G19B1_TARGET_LEGACY_ID) {
    errors.push("albumLegacyId mismatch");
  }
  if (input.beforeCount !== G19B1_EXPECTED_TRACK_COUNT) {
    errors.push("beforeCount mismatch");
  }
  if (input.afterCount !== G19B1_EXPECTED_TRACK_COUNT) {
    errors.push("afterCount mismatch");
  }
  if (input.orderedTitleFingerprintBefore !== G19B1_EXPECTED_BEFORE_FINGERPRINT) {
    errors.push("fingerprint mismatch");
  }
  if (input.diff.changed.length !== 1) errors.push("changed.length !== 1");
  if (input.diff.added.length !== 0) errors.push("added not empty");
  if (input.diff.deleted.length !== 0) errors.push("deleted not empty");
  if (input.diff.reordered.length !== 0) errors.push("reordered not empty");
  const change = input.diff.changed[0];
  if (change) {
    if (change.track_number !== G19B1_TARGET_TRACK_NUMBER) errors.push("track_number mismatch");
    if (change.before !== G19B1_BEFORE_TITLE) errors.push("before title mismatch");
    if (change.after !== G19B1_AFTER_TITLE) errors.push("after title mismatch");
  }
  return errors;
}

export function simulateG19b1PocDiff() {
  const beforeTracks = JA_JAAAAAN_TRACKS.map((title, index) => ({
    track_number: index + 1,
    title,
    sort_order: index + 1,
  }));
  const afterLines = [...JA_JAAAAAN_TRACKS];
  afterLines[0] = G19B1_AFTER_TITLE;
  const parsedAfter = parseDiscographyTracklistTextarea(afterLines.join("\n"));
  const diff = diffDiscographyTracklists(beforeTracks, parsedAfter);
  const fingerprintBefore = buildOrderedTitleFingerprint(beforeTracks);
  const guardErrors = validateG19b1AllowedDiff({
    albumLegacyId: G19B1_TARGET_LEGACY_ID,
    beforeCount: beforeTracks.length,
    afterCount: parsedAfter.length,
    diff,
    orderedTitleFingerprintBefore: fingerprintBefore,
  });
  return { diff, guardErrors, fingerprintBefore, parsedAfter };
}

export { parseDiscographyTracklistTextarea, diffDiscographyTracklists };
