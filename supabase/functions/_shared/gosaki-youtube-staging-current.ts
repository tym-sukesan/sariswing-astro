/**
 * G-11c1 — Staging YouTube embed current snapshot (build-time config mirror).
 * Update when gosaki-piano-youtube-embed.json changes; no DB read in dry-run PoC.
 */

export const GOSAKI_YOUTUBE_STAGING_CURRENT = {
  itemId: "yt-placeholder-01",
  embedCode: "https://youtu.be/I-eY9YMq9GI",
  videoId: "I-eY9YMq9GI",
} as const;
