/**
 * Deep-equality fixtures for CMS Core build-read envelopes.
 * Literals match pre-extraction public return shapes (YouTube embeds / About page_fields).
 * No network.
 */

/** @type {const} */
export const YT_DS = "embedDataSource";
/** @type {const} */
export const YT_ROWS = "embeds";
/** @type {const} */
export const ABOUT_DS = "pageFieldDataSource";
/** @type {const} */
export const ABOUT_ROWS = "fields";

export const YT_SITE = "gosaki-piano";
export const ABOUT_SITE = "gosaki-piano";

/** Synthetic embed row (identity-stable for deepEqual). */
export const YT_EMBED_ROW = Object.freeze({
  id: "embed-1",
  site_slug: YT_SITE,
  provider: "youtube",
  published: true,
  sort_order: 10,
});

/** Synthetic page_fields row. */
export const ABOUT_FIELD_ROW = Object.freeze({
  id: "field-1",
  site_slug: ABOUT_SITE,
  page_key: "about",
  field_key: "profile.lede",
  value_text: "fixture lede",
  published: true,
});

export const ABOUT_PROFILE_LEDE = Object.freeze({
  valueText: "fixture lede",
});

/** YouTube public return snapshots (pre-extraction). */
export const YOUTUBE_ENVELOPE_FIXTURES = Object.freeze({
  success: Object.freeze({
    embedDataSource: "supabase",
    fallbackReason: null,
    embeds: [YT_EMBED_ROW],
    siteSlug: YT_SITE,
    rowCount: 1,
  }),
  empty: Object.freeze({
    embedDataSource: "supabase-empty",
    fallbackReason: "no_published_site_embeds_rows",
    embeds: [],
    siteSlug: YT_SITE,
    rowCount: 0,
  }),
  notConfigured: Object.freeze({
    embedDataSource: "not-configured",
    fallbackReason: "site_embeds_table_migration_pending_G-9f",
    embeds: [],
    siteSlug: YT_SITE,
    rowCount: 0,
  }),
  blocked: Object.freeze({
    embedDataSource: "blocked",
    fallbackReason: "production_ref_stop",
    embeds: [],
    siteSlug: YT_SITE,
    rowCount: 0,
  }),
  error: Object.freeze({
    embedDataSource: "error",
    fallbackReason: "fetch failed",
    embeds: [],
    siteSlug: YT_SITE,
    rowCount: 0,
  }),
});

/** About public return snapshots (pre-extraction). */
export const ABOUT_ENVELOPE_FIXTURES = Object.freeze({
  success: Object.freeze({
    pageFieldDataSource: "supabase",
    fallbackReason: null,
    fields: [ABOUT_FIELD_ROW],
    profileLede: ABOUT_PROFILE_LEDE,
    siteSlug: ABOUT_SITE,
    rowCount: 1,
    fieldCount: 1,
  }),
  empty: Object.freeze({
    pageFieldDataSource: "supabase-empty",
    fallbackReason: "no_published_site_page_fields_rows",
    fields: [],
    profileLede: null,
    siteSlug: ABOUT_SITE,
    rowCount: 0,
    fieldCount: 0,
  }),
  notConfigured: Object.freeze({
    pageFieldDataSource: "not-configured",
    fallbackReason: "supabase_anon_read_env_missing",
    fields: [],
    profileLede: null,
    siteSlug: ABOUT_SITE,
    rowCount: 0,
    fieldCount: 0,
  }),
  blocked: Object.freeze({
    pageFieldDataSource: "blocked",
    fallbackReason: "production_ref_stop",
    fields: [],
    profileLede: null,
    siteSlug: ABOUT_SITE,
    rowCount: 0,
    fieldCount: 0,
  }),
  error: Object.freeze({
    pageFieldDataSource: "error",
    fallbackReason: "fetch failed",
    fields: [],
    profileLede: null,
    siteSlug: ABOUT_SITE,
    rowCount: 0,
    fieldCount: 0,
  }),
  emptyValueText: Object.freeze({
    pageFieldDataSource: "supabase-empty",
    fallbackReason: "empty_profile_lede_value_text",
    fields: [ABOUT_FIELD_ROW],
    profileLede: null,
    siteSlug: ABOUT_SITE,
    rowCount: 1,
    fieldCount: 1,
  }),
  multipleRows: Object.freeze({
    pageFieldDataSource: "error",
    fallbackReason: "multiple_profile_lede_rows",
    fields: [ABOUT_FIELD_ROW, { ...ABOUT_FIELD_ROW, id: "field-2" }],
    profileLede: null,
    siteSlug: ABOUT_SITE,
    rowCount: 2,
    fieldCount: 2,
  }),
});

/** Extra metadata must survive shallow merge (unknown keys preserved). */
export const EXTRA_METADATA_FIXTURE = Object.freeze({
  customMeta: "keep-me",
  nested: Object.freeze({ a: 1 }),
});
