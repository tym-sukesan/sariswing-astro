/**
 * G-10h4a — Gosaki About profile HTML static JSON write dry-run types.
 */

export const G10H4A_PHASE =
  "G-10h4a-gosaki-about-profile-html-static-json-write-dry-run" as const;

export const G10H4B_PHASE =
  "G-10h4b-gosaki-about-profile-html-static-json-write-execution" as const;

export const G10H4B_PROFILE_SAVE_TEST_COMMENT =
  "<!-- G-10h4b profile save test -->" as const;

export const G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID =
  "G-10h4a-about-profile-html-static-json-write-dry-run" as const;

export const G10H4A_ABOUT_CONTENT_CONFIG_REL =
  "tools/static-to-astro/config/sites/gosaki-piano-about-content.json" as const;

export const G10H4A_SITE_SLUG = "gosaki-piano" as const;

export const G10H4A_TARGET_BLOCK_ID = "about-profile-html" as const;

export const G10H4A_WRITE_MODULE = "about-html-content" as const;

export const G10H4A_WRITE_PROVIDER = "static-json" as const;

export const G10H4A_PROFILE_HTML_MAX_LENGTH = 100_000;

export const G10H4A_TOTAL_HTML_MAX_LENGTH = 200_000;

export const G10H4A_ALLOWED_FIELDS = ["html"] as const;

export type G10h4aAllowedField = (typeof G10H4A_ALLOWED_FIELDS)[number];

export type G10h4aAboutContentBlockSnapshot = {
  id: string;
  label?: string;
  enabled?: boolean;
  html?: string;
};

export type G10h4aAboutContentConfigSnapshot = {
  siteSlug?: string;
  page?: string;
  version?: number;
  previewPath?: string;
  blocks?: G10h4aAboutContentBlockSnapshot[];
};

export type G10h4aProfileHtmlFormValues = {
  html: string;
};

export type G10h4aHtmlSafetyResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};
