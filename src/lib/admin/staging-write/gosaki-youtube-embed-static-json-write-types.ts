/**
 * G-10c — Gosaki YouTube embed static JSON write slice types.
 */

export const G10C_PHASE =
  "G-10c-gosaki-youtube-embed-static-json-write-slice-implementation";

export const G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID =
  "G-10c-gosaki-youtube-embed-static-json-write-slice" as const;

export const G10C_YOUTUBE_EMBED_TARGET_ITEM_ID = "yt-placeholder-01" as const;

export const G10C_YOUTUBE_EMBED_CONFIG_REL =
  "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json" as const;

export const G10C_YOUTUBE_EMBED_SITE_SLUG = "gosaki-piano" as const;

export const G10C_YOUTUBE_EMBED_ALLOWED_FIELDS = ["embedCode", "published"] as const;

export type G10cYoutubeEmbedAllowedField = (typeof G10C_YOUTUBE_EMBED_ALLOWED_FIELDS)[number];

export type G10cYoutubeEmbedItemSnapshot = {
  id: string;
  published?: boolean;
  sortOrder?: number;
  embedCode?: string;
  videoId?: string;
  sourceUrl?: string;
};

export type G10cYoutubeEmbedConfigSnapshot = {
  siteSlug?: string;
  sectionTitle?: string;
  items?: G10cYoutubeEmbedItemSnapshot[];
};

export type G10cYoutubeEmbedFormValues = {
  embedCode: string;
  published: boolean;
};

export type G10cYoutubeEmbedWritePayload = {
  embedCode: string;
  published: boolean;
};
