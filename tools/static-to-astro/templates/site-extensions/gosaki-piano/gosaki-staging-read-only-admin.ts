/**
 * Gosaki staging read-only admin — build-time view model (G-11b).
 * No runtime writes; no Supabase; no secrets.
 */

import type { GosakiYoutubeEmbedConfig } from "./gosaki-youtube-embed";
import { parseYoutubeVideoId, resolvePublishedGosakiYoutubeItems } from "./gosaki-youtube-embed";

export const GOSAKI_READ_ONLY_ADMIN_MARKER = "gosaki-read-only-admin";
export const GOSAKI_STAGING_SITE_SLUG = "gosaki-piano";
export const GOSAKI_STAGING_PREVIEW_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";

/** G-11c4a — staging-only dry-run endpoint wiring (public URLs; no secrets). */
export const G11C4A_PHASE = "G-11c4a-gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep";
/** G-11c4b — staging public env wiring for Supabase Auth in static admin package. */
export const G11C4B_PHASE = "G-11c4b-gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep";
/** G-11c4b-fix — auth configured login button + status message fix. */
export const G11C4B_FIX_PHASE = "G-11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable";
/** G-11c6a — YouTube URL save path local implementation (Save UI disabled). */
export const G11C6A_PHASE = "G-11c6a-gosaki-youtube-url-web-save-non-dry-run-slice-implementation-local-only";
export const G11C4A_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const G11C4A_STAGING_SUPABASE_URL = `https://${G11C4A_STAGING_PROJECT_REF}.supabase.co`;
export const G11C4A_STAGING_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-dry-run`;
export const G11C6A_STAGING_SAVE_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-save`;
export const G11C6_OPERATION_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_APPROVAL_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_SAVE_ENABLED_DEFAULT = false as const;
export const G11C6_SAVE_DISABLED_REASON =
  "G-11c6a: Save は無効です。dry-run 成功後も env arm / operator approval / Edge deploy が必要です。";

/** G-20u28 — staging read-only admin dashboard foundation polish. */
export const G20U28_ADMIN_UI_PHASE = "G-20u28-gosaki-admin-ui-foundation-polish";

/** G-20u29 — Discography editor prototype (read-only / Save disabled). */
export const G20U29_DISCOGRAPHY_EDITOR_PHASE = "G-20u29-gosaki-discography-edit-ui-prototype";
export const G20U29_DISCOGRAPHY_EDITOR_SAVE_DISABLED_REASON =
  "G-20u29: Discography Editor はプロトタイプです。Save は無効 — dry-run 検証と Save 設計は別フェーズです。";

/** G-20u30 — Discography track list dry-run validation (browser-only · no network write). */
export const G20U30_DISCOGRAPHY_DRY_RUN_PHASE = "G-20u30-gosaki-discography-dry-run-validation";
export const G20U30_DISCOGRAPHY_DRY_RUN_NOTE =
  "G-20u30: ローカル Dry-run validation — ブラウザ内差分表示。Save / DB write なし。Endpoint dry-run POST は G-20u36c。";

/** G-20u36c — Discography dry-run fetch POST wiring (staging Edge Function · Save disabled). */
export const G20U36C_DISCOGRAPHY_DRY_RUN_FETCH_POST_PHASE =
  "G-20u36c-admin-discography-dry-run-fetch-post-wiring";
export const G20U36C_DISCOGRAPHY_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-discography-save-dry-run`;
export const G20U36C_DISCOGRAPHY_DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
export const G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION = "dryRun" as const;
export const G20U36C_DISCOGRAPHY_DRY_RUN_NOTE =
  "G-20u36c: Dry-run only — POST to staging Edge Function. No DB write. Save is still disabled. This checks the request and endpoint response only.";
export const G20U36C_PRODUCTION_PROJECT_REF_STOP = "vsbvndwuajjhnzpohghh";

export interface DiscographyDryRunEndpointReleaseInput {
  title: string;
  artist?: string | null;
  release_date?: string | null;
  label?: string | null;
  catalog_number?: string | null;
  published?: boolean;
  cover_image_url?: string | null;
  purchase_url?: string | null;
  streaming_url?: string | null;
  description?: string | null;
}

export interface DiscographyDryRunEndpointRequestInput {
  legacyId: string;
  tracksText: string;
  release: DiscographyDryRunEndpointReleaseInput;
}

export interface DiscographyDryRunEndpointDisplay {
  httpStatus?: number;
  ok?: boolean;
  operation?: string;
  wouldWrite?: boolean;
  changedCounts?: Record<string, unknown>;
  diffSummary?: {
    tracksAdded?: number;
    tracksRemoved?: number;
    tracksReordered?: boolean;
    releaseFields?: string[];
    added?: string[];
    removed?: string[];
  };
  errors?: string[];
  warnings?: string[];
  didWrite: false;
  dbWrite: false;
  networkWrite: false;
  saveEnabled: false;
  authIssue?: boolean;
  authCategory?: string;
  sensitiveResponseBlocked?: boolean;
  fetchError?: string;
}

const DISCOGRAPHY_DRY_RUN_FORBIDDEN_RESPONSE_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
];

export function resolveG20u36cDiscographyDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G20U36C_DISCOGRAPHY_DRY_RUN_ENDPOINT;
}

export function assertG20u36cDiscographyDryRunEndpointSafe(endpoint: string): boolean {
  const trimmed = String(endpoint ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.includes(G20U36C_PRODUCTION_PROJECT_REF_STOP)) return false;
  return trimmed.includes(G11C4A_STAGING_PROJECT_REF);
}

/**
 * Build dry-run endpoint POST payload — operation=dryRun only · never save.
 */
export function buildDiscographyDryRunEndpointRequest(
  input: DiscographyDryRunEndpointRequestInput,
): Record<string, unknown> {
  const release = input.release;
  return {
    operation: G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION,
    siteSlug: GOSAKI_STAGING_SITE_SLUG,
    legacyId: input.legacyId,
    approvalId: G20U36C_DISCOGRAPHY_DRY_RUN_APPROVAL_ID,
    expectedBeforeUpdatedAt: null,
    release: {
      title: release.title,
      artist: release.artist ?? null,
      release_date: release.release_date ?? null,
      label: release.label ?? null,
      catalog_number: release.catalog_number ?? null,
      published: release.published === true,
      cover_image_url: release.cover_image_url ?? null,
      purchase_url: release.purchase_url ?? null,
      streaming_url: release.streaming_url ?? null,
      description: release.description ?? null,
    },
    tracksText: input.tracksText,
    trackPolicy: {
      oneLineOneTrack: true,
      blankLinesIgnored: true,
      allowDuplicateTitles: true,
      allowEmptyTrackList: false,
    },
  };
}

function responseTextLooksSensitive(text: string): boolean {
  return DISCOGRAPHY_DRY_RUN_FORBIDDEN_RESPONSE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Sanitize endpoint response for admin UI display — strip secrets · block sensitive bodies.
 */
export function sanitizeDiscographyDryRunEndpointDisplay(
  body: unknown,
  httpStatus?: number,
): DiscographyDryRunEndpointDisplay {
  const rawText = JSON.stringify(body ?? {});
  if (responseTextLooksSensitive(rawText)) {
    return {
      httpStatus,
      ok: false,
      didWrite: false,
      dbWrite: false,
      networkWrite: false,
      saveEnabled: false,
      sensitiveResponseBlocked: true,
      errors: ["Response contained forbidden content — not displayed"],
    };
  }

  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const diff = (data.diff && typeof data.diff === "object" ? data.diff : {}) as Record<string, unknown>;
  const changedCounts =
    data.changedCounts && typeof data.changedCounts === "object"
      ? (data.changedCounts as Record<string, unknown>)
      : undefined;

  const authIssue = httpStatus === 401 || httpStatus === 403;

  return {
    httpStatus,
    ok: typeof data.ok === "boolean" ? data.ok : undefined,
    operation: typeof data.operation === "string" ? data.operation : undefined,
    wouldWrite: typeof data.wouldWrite === "boolean" ? data.wouldWrite : undefined,
    changedCounts,
    diffSummary: {
      tracksAdded: typeof changedCounts?.tracksAdded === "number" ? changedCounts.tracksAdded : undefined,
      tracksRemoved:
        typeof changedCounts?.tracksRemoved === "number" ? changedCounts.tracksRemoved : undefined,
      tracksReordered:
        typeof changedCounts?.tracksReordered === "boolean" ? changedCounts.tracksReordered : undefined,
      releaseFields: Array.isArray(changedCounts?.releaseFields)
        ? (changedCounts.releaseFields as string[])
        : undefined,
      added: Array.isArray(diff.added) ? (diff.added as string[]) : undefined,
      removed: Array.isArray(diff.removed) ? (diff.removed as string[]) : undefined,
    },
    errors: Array.isArray(data.errors) ? (data.errors as string[]) : undefined,
    warnings: Array.isArray(data.warnings) ? (data.warnings as string[]) : undefined,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    saveEnabled: false,
    authIssue,
    authCategory: authIssue ? "auth_required_bearer_anon" : undefined,
  };
}

export interface DiscographyTrackListChangedLine {
  line: number;
  before: string | null;
  after: string | null;
  kind: "added" | "removed" | "changed";
}

export interface DiscographyTrackListDryRunResult {
  ok: true;
  dryRun: true;
  wouldWrite: false;
  saveEnabled: false;
  networkWrite: false;
  blankLinesIgnored: true;
  legacyId?: string;
  title?: string;
  totalBefore: number;
  totalAfter: number;
  added: string[];
  removed: string[];
  unchanged: number;
  changedLines: DiscographyTrackListChangedLine[];
  reordered: boolean;
}

export interface DiscographyTrackListDryRunBatchResult {
  ok: true;
  dryRun: true;
  wouldWrite: false;
  saveEnabled: false;
  networkWrite: false;
  blankLinesIgnored: true;
  albumCount: number;
  albums: DiscographyTrackListDryRunResult[];
}

/**
 * Parse multiline track list textarea: trim lines, ignore blank lines.
 */
export function parseDiscographyTrackListLines(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Compare original vs edited track list (1 line = 1 track). Browser-only dry-run — no DB write.
 */
export function validateDiscographyTrackListDryRun(
  originalText: string,
  nextText: string,
  meta: { legacyId?: string; title?: string } = {},
): DiscographyTrackListDryRunResult {
  const before = parseDiscographyTrackListLines(originalText);
  const after = parseDiscographyTrackListLines(nextText);

  const beforeRemain = [...before];
  const afterRemain = [...after];
  const removed: string[] = [];
  const added: string[] = [];

  for (let i = beforeRemain.length - 1; i >= 0; i -= 1) {
    const title = beforeRemain[i];
    const matchIdx = afterRemain.indexOf(title);
    if (matchIdx >= 0) {
      beforeRemain.splice(i, 1);
      afterRemain.splice(matchIdx, 1);
    }
  }
  removed.push(...beforeRemain);
  added.push(...afterRemain);

  const unchanged = before.length - removed.length;
  const maxLen = Math.max(before.length, after.length);
  /** @type {DiscographyTrackListChangedLine[]} */
  const changedLines: DiscographyTrackListChangedLine[] = [];
  for (let i = 0; i < maxLen; i += 1) {
    const b = before[i] ?? null;
    const a = after[i] ?? null;
    if (b === a) continue;
    if (b && a) changedLines.push({ line: i + 1, before: b, after: a, kind: "changed" });
    else if (!b && a) changedLines.push({ line: i + 1, before: null, after: a, kind: "added" });
    else if (b && !a) changedLines.push({ line: i + 1, before: b, after: null, kind: "removed" });
  }

  const reordered =
    before.join("\n") !== after.join("\n") && added.length === 0 && removed.length === 0;

  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    saveEnabled: false,
    networkWrite: false,
    blankLinesIgnored: true,
    legacyId: meta.legacyId,
    title: meta.title,
    totalBefore: before.length,
    totalAfter: after.length,
    added,
    removed,
    unchanged,
    changedLines,
    reordered,
  };
}

/**
 * Dry-run all album track lists in one batch (still no network / DB write).
 */
export function validateDiscographyTrackListDryRunBatch(
  albums: Array<{ legacyId: string; title: string; originalText: string; nextText: string }>,
): DiscographyTrackListDryRunBatchResult {
  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    saveEnabled: false,
    networkWrite: false,
    blankLinesIgnored: true,
    albumCount: albums.length,
    albums: albums.map((album) =>
      validateDiscographyTrackListDryRun(album.originalText, album.nextText, {
        legacyId: album.legacyId,
        title: album.title,
      }),
    ),
  };
}

export interface GosakiDiscographyEditorAlbumSnapshot {
  legacyId: string;
  title: string;
  artist: string | null;
  releaseDate: string | null;
  label: string | null;
  catalogNumber: string | null;
  published: boolean;
  coverImageUrl: string | null;
  purchaseUrl: string | null;
  streamingUrl: string | null;
  description: string;
  trackListText: string;
  trackCount: number;
}

export interface GosakiDiscographyEditorSnapshot {
  phase: string;
  readOnly: boolean;
  saveEnabled: boolean;
  productionUploadStop: boolean;
  siteSlug: string;
  filteredRead: boolean;
  dataSource: string;
  releaseCount: number;
  trackCount: number;
  albums: GosakiDiscographyEditorAlbumSnapshot[];
}

export function resolveG11c4aDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C4A_STAGING_DRY_RUN_ENDPOINT;
}

export function resolveG11c6aSaveEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_YOUTUBE_URL_SAVE_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C6A_STAGING_SAVE_ENDPOINT;
}

export function isG11c6aSaveEnabled(env: ImportMetaEnv): boolean {
  return String(env.PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED ?? "").trim() === "true";
}

export function resolveG11c4aSupabaseUrl(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C4A_STAGING_SUPABASE_URL;
}

export function resolveG11c4aSupabaseAnonKey(env: ImportMetaEnv): string {
  return String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
}

export function isG11c4aSupabaseAuthConfigured(env: ImportMetaEnv): boolean {
  return Boolean(resolveG11c4aSupabaseUrl(env) && resolveG11c4aSupabaseAnonKey(env));
}

export interface GosakiAboutContentBlock {
  id?: string;
  label?: string;
  enabled?: boolean;
  html?: string;
}

export interface GosakiAboutContentConfig {
  siteSlug?: string;
  blocks?: GosakiAboutContentBlock[];
}

export interface GosakiContactHubspotConfig {
  siteSlug?: string;
  provider?: string;
  region?: string;
  portalId?: string;
  formId?: string;
  enabled?: boolean;
}

export interface GosakiReadOnlyAdminBandImage {
  fileName: string;
  bandName: string | null;
}

export interface GosakiReadOnlyAdminViewModel {
  siteSlug: string;
  stagingUrl: string;
  noindex: boolean;
  packageNote: string;
  youtube: {
    sourceUrl: string;
    videoId: string | null;
    published: boolean;
  };
  about: {
    profileLabel: string;
    profileSummary: string;
    profileCharCount: number;
    bandsLabel: string;
    bandsSummary: string;
    bandsCharCount: number;
    bandImages: GosakiReadOnlyAdminBandImage[];
  };
  contact: {
    provider: string;
    portalId: string;
    formId: string;
    region: string;
    enabled: boolean;
  };
  schedule: {
    status: string;
    note: string;
  };
}

/**
 * Strip HTML to a short plain-text preview.
 */
export function htmlToPlainSummary(html: string, maxLen = 240): string {
  const text = String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

/**
 * Extract band image file names from about-bands-html block.
 */
export function extractBandImageFileNames(bandsHtml: string): string[] {
  const matches = String(bandsHtml ?? "").matchAll(
    /assets\/about\/bands\/([a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp))/gi,
  );
  const seen = new Set<string>();
  const files: string[] = [];
  for (const match of matches) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      files.push(name);
    }
  }
  return files;
}

/**
 * Map image file to band name from adjacent alt text when possible.
 */
export function extractBandImagesWithNames(bandsHtml: string): GosakiReadOnlyAdminBandImage[] {
  const fileNames = extractBandImageFileNames(bandsHtml);
  return fileNames.map((fileName) => {
    const altMatch = bandsHtml.match(
      new RegExp(
        `assets/about/bands/${fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*alt="([^"]*)"`,
        "i",
      ),
    );
    return { fileName, bandName: altMatch?.[1]?.trim() || null };
  });
}

function findAboutBlock(config: GosakiAboutContentConfig, id: string) {
  return config.blocks?.find((block) => block?.id === id) ?? null;
}

/**
 * Build read-only admin view model from static JSON configs.
 */
export function buildGosakiReadOnlyAdminViewModel(input: {
  youtube: GosakiYoutubeEmbedConfig;
  about: GosakiAboutContentConfig;
  contact: GosakiContactHubspotConfig;
}): GosakiReadOnlyAdminViewModel {
  const youtubeItem = input.youtube.items?.[0];
  const publishedItems = resolvePublishedGosakiYoutubeItems(input.youtube);
  const resolved = publishedItems[0] ?? null;
  const embedCode = String(youtubeItem?.embedCode ?? "").trim();
  const videoId =
    resolved?.videoId ??
    parseYoutubeVideoId(youtubeItem?.videoId) ??
    parseYoutubeVideoId(youtubeItem?.sourceUrl) ??
    parseYoutubeVideoId(embedCode);

  const profileBlock = findAboutBlock(input.about, "about-profile-html");
  const bandsBlock = findAboutBlock(input.about, "about-bands-html");
  const profileHtml = String(profileBlock?.html ?? "");
  const bandsHtml = String(bandsBlock?.html ?? "");

  return {
    siteSlug: input.about.siteSlug ?? input.youtube.siteSlug ?? GOSAKI_STAGING_SITE_SLUG,
    stagingUrl: GOSAKI_STAGING_PREVIEW_URL,
    noindex: true,
    packageNote:
      "表示内容はローカル convert / build 時の config JSON に基づきます。staging へ反映するには manual-upload package の再アップロードが必要です。",
    youtube: {
      sourceUrl: embedCode || resolved?.watchUrl || "",
      videoId,
      published: youtubeItem?.published === true && Boolean(videoId),
    },
    about: {
      profileLabel: String(profileBlock?.label ?? "About profile"),
      profileSummary: htmlToPlainSummary(profileHtml),
      profileCharCount: profileHtml.length,
      bandsLabel: String(bandsBlock?.label ?? "Bands / Projects"),
      bandsSummary: htmlToPlainSummary(bandsHtml),
      bandsCharCount: bandsHtml.length,
      bandImages: extractBandImagesWithNames(bandsHtml),
    },
    contact: {
      provider: String(input.contact.provider ?? "hubspot"),
      portalId: String(input.contact.portalId ?? ""),
      formId: String(input.contact.formId ?? ""),
      region: String(input.contact.region ?? ""),
      enabled: input.contact.enabled !== false,
    },
    schedule: {
      status: "read-only",
      note: "スケジュールは build 時の Supabase 読み取り結果を公開ページに反映します。管理画面からの編集 UI は別フェーズで追加予定です。",
    },
  };
}
