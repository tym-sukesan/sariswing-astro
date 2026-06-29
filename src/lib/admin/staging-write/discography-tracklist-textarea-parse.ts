/**
 * G-18f — Parse album-level tracklist textarea (1 line = 1 track).
 */

export const G18F_TRACKLIST_PARSE_RULES = {
  splitBy: "newline",
  trimEachLine: true,
  skipEmptyLines: true,
  regenerateTrackNumberFromLineIndex: true,
} as const;

export type ParsedDiscographyTracklistLine = {
  track_number: number;
  title: string;
  sort_order: number;
};

/**
 * Parse textarea content into ordered track lines.
 * - Split on `\n` (normalize `\r\n`)
 * - Trim each line; skip empty lines
 * - track_number / sort_order = 1..N from line order
 */
export function parseDiscographyTracklistTextarea(raw: string): ParsedDiscographyTracklistLine[] {
  const normalized = String(raw ?? "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const parsed: ParsedDiscographyTracklistLine[] = [];

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

export function discographyTracklistTextareaFromDbTracks(
  tracks: ReadonlyArray<{ track_number: number; title: string }>,
): string {
  return [...tracks]
    .sort((a, b) => a.track_number - b.track_number)
    .map((track) => track.title)
    .join("\n");
}
