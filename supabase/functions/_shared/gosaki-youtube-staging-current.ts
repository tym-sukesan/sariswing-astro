/**
 * G-11c1 — Staging YouTube embed current snapshot (build-time config mirror).
 * Update when gosaki-piano-youtube-embed.json changes; no DB read in dry-run PoC.
 */

export const GOSAKI_YOUTUBE_STAGING_CURRENT = {
  itemId: "yt-placeholder-01",
  embedCode: "https://www.youtube.com/watch?v=Ke4F8JAQz-I",
  videoId: "Ke4F8JAQz-I",
} as const;
