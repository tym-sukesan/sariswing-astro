/**
 * G-18f — Diff DB tracklist vs parsed textarea titles.
 */

export type DiscographyTracklistDiffChanged = {
  track_number: number;
  before: string;
  after: string;
};

export type DiscographyTracklistDiffAdded = {
  track_number: number;
  title: string;
};

export type DiscographyTracklistDiffDeleted = {
  track_number: number;
  title: string;
};

export type DiscographyTracklistDiffReordered = {
  title: string;
  from: number;
  to: number;
};

export type DiscographyTracklistDiffUnchanged = {
  track_number: number;
  title: string;
};

export type DiscographyTracklistDiffResult = {
  unchanged: DiscographyTracklistDiffUnchanged[];
  changed: DiscographyTracklistDiffChanged[];
  added: DiscographyTracklistDiffAdded[];
  deleted: DiscographyTracklistDiffDeleted[];
  reordered: DiscographyTracklistDiffReordered[];
};

function orderedTitles(
  tracks: ReadonlyArray<{ track_number: number; title: string }>,
): string[] {
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((track) => track.title);
}

/**
 * Compare before (DB) vs after (parsed textarea) title arrays.
 */
export function diffDiscographyTracklists(
  beforeTracks: ReadonlyArray<{ track_number: number; title: string }>,
  afterTracks: ReadonlyArray<{ track_number: number; title: string }>,
): DiscographyTracklistDiffResult {
  const beforeTitles = orderedTitles(beforeTracks);
  const afterTitles = orderedTitles(afterTracks);

  const unchanged: DiscographyTracklistDiffUnchanged[] = [];
  const changed: DiscographyTracklistDiffChanged[] = [];
  const added: DiscographyTracklistDiffAdded[] = [];
  const deleted: DiscographyTracklistDiffDeleted[] = [];
  const reordered: DiscographyTracklistDiffReordered[] = [];

  const minLen = Math.min(beforeTitles.length, afterTitles.length);
  const beforeUsed = new Set<number>();
  const afterUsed = new Set<number>();

  for (let i = 0; i < minLen; i++) {
    const beforeTitle = beforeTitles[i];
    const afterTitle = afterTitles[i];

    if (beforeTitle === afterTitle) {
      unchanged.push({ track_number: i + 1, title: beforeTitle });
      beforeUsed.add(i);
      afterUsed.add(i);
      continue;
    }

    const beforeIdxElsewhere = afterTitles.findIndex(
      (title, j) => j !== i && title === beforeTitle && !afterUsed.has(j),
    );
    const afterIdxElsewhere = beforeTitles.findIndex(
      (title, j) => j !== i && title === afterTitle && !beforeUsed.has(j),
    );

    if (
      afterIdxElsewhere >= 0 &&
      afterIdxElsewhere !== i &&
      beforeTitles[afterIdxElsewhere] !== afterTitle
    ) {
      reordered.push({
        title: afterTitle,
        from: afterIdxElsewhere + 1,
        to: i + 1,
      });
      beforeUsed.add(afterIdxElsewhere);
      afterUsed.add(i);
      continue;
    }

    if (
      beforeIdxElsewhere >= 0 &&
      beforeIdxElsewhere !== i &&
      afterTitles[beforeIdxElsewhere] !== beforeTitle
    ) {
      reordered.push({
        title: beforeTitle,
        from: i + 1,
        to: beforeIdxElsewhere + 1,
      });
      beforeUsed.add(i);
      afterUsed.add(beforeIdxElsewhere);
      continue;
    }

    changed.push({
      track_number: i + 1,
      before: beforeTitle,
      after: afterTitle,
    });
    beforeUsed.add(i);
    afterUsed.add(i);
  }

  for (let i = minLen; i < afterTitles.length; i++) {
    added.push({ track_number: i + 1, title: afterTitles[i] });
  }

  for (let i = minLen; i < beforeTitles.length; i++) {
    deleted.push({ track_number: i + 1, title: beforeTitles[i] });
  }

  return { unchanged, changed, added, deleted, reordered };
}

export function discographyTracklistDiffHasChanges(diff: DiscographyTracklistDiffResult): boolean {
  return (
    diff.changed.length > 0 ||
    diff.added.length > 0 ||
    diff.deleted.length > 0 ||
    diff.reordered.length > 0
  );
}
