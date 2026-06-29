/**
 * G-18f — Shared parse/diff helpers for verifier (mirrors staging-write TS modules).
 */

export function parseDiscographyTracklistTextarea(raw) {
  const normalized = String(raw ?? "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const parsed = [];

  for (const line of lines) {
    const title = line.trim();
    if (!title) continue;
    const trackNumber = parsed.length + 1;
    parsed.push({
      track_number: trackNumber,
      title,
      sort_order: trackNumber,
    });
  }

  return parsed;
}

function orderedTitles(tracks) {
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((track) => track.title);
}

export function diffDiscographyTracklists(beforeTracks, afterTracks) {
  const beforeTitles = orderedTitles(beforeTracks);
  const afterTitles = orderedTitles(afterTracks);

  const unchanged = [];
  const changed = [];
  const added = [];
  const deleted = [];
  const reordered = [];

  const minLen = Math.min(beforeTitles.length, afterTitles.length);
  const beforeUsed = new Set();
  const afterUsed = new Set();

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
