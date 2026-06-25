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
export const G11C4A_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const G11C4A_STAGING_SUPABASE_URL = `https://${G11C4A_STAGING_PROJECT_REF}.supabase.co`;
export const G11C4A_STAGING_DRY_RUN_ENDPOINT = `${G11C4A_STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-dry-run`;

export function resolveG11c4aDryRunEndpoint(env: ImportMetaEnv): string {
  const fromEnv = String(env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT ?? "").trim();
  if (fromEnv) return fromEnv;
  return G11C4A_STAGING_DRY_RUN_ENDPOINT;
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
      status: "read-only placeholder",
      note: "Schedule CMS は Supabase 連携予定（G-11c 以降）。今回は DB 読み込みなし。",
    },
  };
}
