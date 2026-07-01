/**
 * G-19b1 — Generic single-title Save guards (textarea diff → one row UPDATE).
 */

import type { DiscographyTracklistDiffResult } from "./discography-tracklist-diff";
import { DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS } from "./discography-tracks-write-types";
import { buildOrderedTitleFingerprint } from "./gosaki-discography-g18g2-tracklist-title-guards";
import {
  G19B1_AFTER_TITLE,
  G19B1_BEFORE_TITLE,
  G19B1_EXPECTED_BEFORE_FINGERPRINT,
  G19B1_EXPECTED_TRACK_COUNT,
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_NUMBER,
  G19B1_TARGET_TRACK_ROW_ID,
} from "./gosaki-discography-g19b1-tracklist-generic-single-title-types";

export { buildOrderedTitleFingerprint };

export function assertG19b1DiscographyTracksWriteApproval(approvalId: string): void {
  if (!(DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS as readonly string[]).includes(approvalId)) {
    throw new Error(
      `Approval ID mismatch. Expected one of ${DISCOGRAPHY_TRACKS_WRITE_APPROVAL_IDS.join(", ")}, got ${approvalId || "(empty)"}.`,
    );
  }
}

export function validateG19b1AllowedDiff(input: {
  albumLegacyId: string;
  beforeCount: number;
  afterCount: number;
  diff: DiscographyTracklistDiffResult;
  orderedTitleFingerprintBefore: string;
}): string[] {
  const errors: string[] = [];

  if (input.albumLegacyId !== G19B1_TARGET_LEGACY_ID) {
    errors.push(`albumLegacyId must be ${G19B1_TARGET_LEGACY_ID}.`);
  }

  if (input.beforeCount !== G19B1_EXPECTED_TRACK_COUNT) {
    errors.push(`beforeCount must be ${G19B1_EXPECTED_TRACK_COUNT}.`);
  }

  if (input.afterCount !== G19B1_EXPECTED_TRACK_COUNT) {
    errors.push(`afterCount must be ${G19B1_EXPECTED_TRACK_COUNT}.`);
  }

  if (input.orderedTitleFingerprintBefore !== G19B1_EXPECTED_BEFORE_FINGERPRINT) {
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

  if (change.track_number !== G19B1_TARGET_TRACK_NUMBER) {
    errors.push(`changed[0].track_number must be ${G19B1_TARGET_TRACK_NUMBER}.`);
  }

  if (change.before !== G19B1_BEFORE_TITLE) {
    errors.push(`changed[0].before must be ${G19B1_BEFORE_TITLE}.`);
  }

  if (change.after !== G19B1_AFTER_TITLE) {
    errors.push(`changed[0].after must be ${G19B1_AFTER_TITLE}.`);
  }

  return errors;
}

export function buildG19b1WhereGuard(): {
  id: typeof G19B1_TARGET_TRACK_ROW_ID;
  discography_legacy_id: typeof G19B1_TARGET_LEGACY_ID;
  track_number: typeof G19B1_TARGET_TRACK_NUMBER;
  title: typeof G19B1_BEFORE_TITLE;
} {
  return {
    id: G19B1_TARGET_TRACK_ROW_ID,
    discography_legacy_id: G19B1_TARGET_LEGACY_ID,
    track_number: G19B1_TARGET_TRACK_NUMBER,
    title: G19B1_BEFORE_TITLE,
  };
}

export function buildG19b1RollbackHint(): string {
  return `${G19B1_AFTER_TITLE} -> ${G19B1_BEFORE_TITLE}`;
}
