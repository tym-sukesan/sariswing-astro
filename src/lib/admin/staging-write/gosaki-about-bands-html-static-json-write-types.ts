/**
 * G-10h4c — Gosaki About bands HTML static JSON write dry-run types.
 */

export const G10H4C_PHASE =
  "G-10h4c-gosaki-about-bands-html-static-json-write-dry-run" as const;

export const G10H4D_PHASE =
  "G-10h4d-gosaki-about-bands-html-static-json-write-execution" as const;

export const G10H4D_1_PHASE =
  "G-10h4d-1-gosaki-about-bands-html-static-json-write-execution-prep" as const;

export const G10H4D_BANDS_SAVE_TEST_COMMENT =
  "<!-- G-10h4d bands save test -->" as const;

export const G10H4C_BANDS_DRY_RUN_TEST_COMMENT =
  "<!-- G-10h4c bands dry-run test -->" as const;

export const G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID =
  "G-10h4c-about-bands-html-static-json-write-dry-run" as const;

export const G10H4C_ABOUT_CONTENT_CONFIG_REL =
  "tools/static-to-astro/config/sites/gosaki-piano-about-content.json" as const;

export const G10H4C_SITE_SLUG = "gosaki-piano" as const;

export const G10H4C_TARGET_BLOCK_ID = "about-bands-html" as const;

export const G10H4C_WRITE_MODULE = "about-html-content" as const;

export const G10H4C_WRITE_PROVIDER = "static-json" as const;

export const G10H4C_BANDS_HTML_MAX_LENGTH = 100_000;

export const G10H4C_TOTAL_HTML_MAX_LENGTH = 200_000;

export const G10H4C_ALLOWED_FIELDS = ["html"] as const;

export type G10h4cAllowedField = (typeof G10H4C_ALLOWED_FIELDS)[number];

export type G10h4cAboutContentBlockSnapshot = {
  id: string;
  label?: string;
  enabled?: boolean;
  html?: string;
};

export type G10h4cAboutContentConfigSnapshot = {
  siteSlug?: string;
  page?: string;
  version?: number;
  previewPath?: string;
  blocks?: G10h4cAboutContentBlockSnapshot[];
};

export type G10h4cBandsHtmlFormValues = {
  html: string;
};

export type G10h4cHtmlSafetyResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};
