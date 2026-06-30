/**
 * G-18g2 — Tracklist single-title Save guards (textarea diff → one row UPDATE).
 */

import type { DiscographyTracklistDiffResult } from "./discography-tracklist-diff";
import { DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS } from "./discography-tracks-write-types";
import {
  G18G2_AFTER_TITLE,
  G18G2_BEFORE_TITLE,
  G18G2_EXPECTED_BEFORE_FINGERPRINT,
  G18G2_EXPECTED_TRACK_COUNT,
  G18G2_TARGET_LEGACY_ID,
  G18G2_TARGET_TRACK_NUMBER,
  G18G2_TARGET_TRACK_ROW_ID,
} from "./gosaki-discography-g18g2-tracklist-title-types";

export function buildOrderedTitleFingerprint(
  tracks: ReadonlyArray<{ track_number: number; title: string }>,
): string {
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((track) => track.title)
    .join("|");
}

export function assertG18g2DiscographyTracksWriteApproval(approvalId: string): void {
  if (!(DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS as readonly string[]).includes(approvalId)) {
    throw new Error(
      `Approval ID mismatch. Expected one of ${DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS.join(", ")}, got ${approvalId || "(empty)"}.`,
    );
  }
}

export function validateG18g2AllowedDiff(input: {
  albumLegacyId: string;
  beforeCount: number;
  afterCount: number;
  diff: DiscographyTracklistDiffResult;
  orderedTitleFingerprintBefore: string;
}): string[] {
  const errors: string[] = [];

  if (input.albumLegacyId !== G18G2_TARGET_LEGACY_ID) {
    errors.push(`albumLegacyId must be ${G18G2_TARGET_LEGACY_ID}.`);
  }

  if (input.beforeCount !== G18G2_EXPECTED_TRACK_COUNT) {
    errors.push(`beforeCount must be ${G18G2_EXPECTED_TRACK_COUNT}.`);
  }

  if (input.afterCount !== G18G2_EXPECTED_TRACK_COUNT) {
    errors.push(`afterCount must be ${G18G2_EXPECTED_TRACK_COUNT}.`);
  }

  if (input.orderedTitleFingerprintBefore !== G18G2_EXPECTED_BEFORE_FINGERPRINT) {
    errors.push("orderedTitleFingerprintBefore does not match expected baseline.");
  }

  if (input.diff.changed.length !== 1) {
    errors.push(`changed.length must be 1 (got ${input.diff.changed.length}).`);
  }

  if (input.diff.added.length !== 0) {
    errors.push(`added.length must be 0 (got ${input.diff.added.length}).`);
  }

  if (input.diff.deleted.length !== 0) {
    errors.push(`deleted.length must be 0 (got ${input.diff.deleted.length}).`);
  }

  if (input.diff.reordered.length !== 0) {
    errors.push(`reordered.length must be 0 (got ${input.diff.reordered.length}).`);
  }

  const change = input.diff.changed[0];
  if (!change) {
    return errors;
  }

  if (change.track_number !== G18G2_TARGET_TRACK_NUMBER) {
    errors.push(`changed[0].track_number must be ${G18G2_TARGET_TRACK_NUMBER}.`);
  }

  if (change.before !== G18G2_BEFORE_TITLE) {
    errors.push(`changed[0].before must be ${G18G2_BEFORE_TITLE}.`);
  }

  if (change.after !== G18G2_AFTER_TITLE) {
    errors.push(`changed[0].after must be ${G18G2_AFTER_TITLE}.`);
  }

  return errors;
}

export function buildG18g2WhereGuard(): {
  id: typeof G18G2_TARGET_TRACK_ROW_ID;
  discography_legacy_id: typeof G18G2_TARGET_LEGACY_ID;
  track_number: typeof G18G2_TARGET_TRACK_NUMBER;
  title: typeof G18G2_BEFORE_TITLE;
} {
  return {
    id: G18G2_TARGET_TRACK_ROW_ID,
    discography_legacy_id: G18G2_TARGET_LEGACY_ID,
    track_number: G18G2_TARGET_TRACK_NUMBER,
    title: G18G2_BEFORE_TITLE,
  };
}

export function buildG18g2RollbackHint(): string {
  return `${G18G2_AFTER_TITLE} -> ${G18G2_BEFORE_TITLE}`;
}
