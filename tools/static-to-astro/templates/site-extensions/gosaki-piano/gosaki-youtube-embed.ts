/**
 * Gosaki home YouTube embed — static config resolver (converted Astro project).
 */

export interface GosakiYoutubeEmbedItem {
  id: string;
  published?: boolean;
  sortOrder?: number;
  title?: string;
  caption?: string;
  sourceUrl?: string;
  videoId?: string;
  embedCode?: string;
}

export interface GosakiYoutubeEmbedConfig {
  siteSlug?: string;
  sectionTitle?: string;
  items?: GosakiYoutubeEmbedItem[];
  /** @deprecated legacy single-item config */
  published?: boolean;
  title?: string;
  caption?: string;
  sourceUrl?: string;
  videoId?: string;
}

export interface ResolvedGosakiYoutubeEmbed {
  id: string;
  videoId: string;
  title: string;
  caption: string;
  iframeTitle: string;
  embedUrl: string;
  watchUrl: string;
  sourceUrl: string;
  sortOrder: number;
}

export function parseYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  const embedSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (embedSrc) {
    const fromEmbed = parseYoutubeVideoId(embedSrc);
    if (fromEmbed) return fromEmbed;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildYoutubeNocookieEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function buildYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function normalizeGosakiYoutubeConfig(
  config: GosakiYoutubeEmbedConfig | null | undefined,
): { sectionTitle: string; items: GosakiYoutubeEmbedItem[] } {
  if (!config) return { sectionTitle: "YouTube", items: [] };

  if (Array.isArray(config.items) && config.items.length > 0) {
    return {
      sectionTitle: String(config.sectionTitle ?? "YouTube").trim() || "YouTube",
      items: config.items,
    };
  }

  if (config.published !== undefined || config.videoId || config.sourceUrl) {
    return {
      sectionTitle: String(config.sectionTitle ?? config.title ?? "YouTube").trim() || "YouTube",
      items: [
        {
          id: "legacy-single",
          published: config.published,
          sortOrder: 10,
          title: config.title,
          caption: config.caption,
          sourceUrl: config.sourceUrl,
          videoId: config.videoId,
        },
      ],
    };
  }

  return {
    sectionTitle: String(config.sectionTitle ?? "YouTube").trim() || "YouTube",
    items: [],
  };
}

export function resolveGosakiYoutubeItem(
  item: GosakiYoutubeEmbedItem,
): ResolvedGosakiYoutubeEmbed | null {
  if (!item || item.published !== true) return null;

  const videoId =
    parseYoutubeVideoId(item.videoId) ??
    parseYoutubeVideoId(item.sourceUrl) ??
    parseYoutubeVideoId(item.embedCode);
  if (!videoId) return null;

  const title = String(item.title ?? "").trim() || "YouTube video";
  const caption = String(item.caption ?? "").trim();

  return {
    id: item.id,
    videoId,
    title,
    caption,
    iframeTitle: title,
    embedUrl: buildYoutubeNocookieEmbedUrl(videoId),
    watchUrl: buildYoutubeWatchUrl(videoId),
    sourceUrl: String(item.sourceUrl ?? "").trim() || buildYoutubeWatchUrl(videoId),
    sortOrder: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : 0,
  };
}

export function resolvePublishedGosakiYoutubeItems(
  config: GosakiYoutubeEmbedConfig | null | undefined,
): ResolvedGosakiYoutubeEmbed[] {
  const { items } = normalizeGosakiYoutubeConfig(config);
  return items
    .map((item) => resolveGosakiYoutubeItem(item))
    .filter((item): item is ResolvedGosakiYoutubeEmbed => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ja"));
}

/** @deprecated use resolvePublishedGosakiYoutubeItems */
export function resolveGosakiYoutubeEmbedFromConfig(
  config: GosakiYoutubeEmbedConfig | null | undefined,
): ResolvedGosakiYoutubeEmbed | null {
  const items = resolvePublishedGosakiYoutubeItems(config);
  return items[0] ?? null;
}
