/**
 * Gosaki home YouTube embed — static config resolver (converted Astro project).
 */

export interface GosakiYoutubeEmbedConfig {
  siteSlug?: string;
  published?: boolean;
  title?: string;
  caption?: string;
  sourceUrl?: string;
  videoId?: string;
}

export interface ResolvedGosakiYoutubeEmbed {
  videoId: string;
  title: string;
  caption: string;
  iframeTitle: string;
  embedUrl: string;
  watchUrl: string;
  sourceUrl: string;
}

export function parseYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

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

export function resolveGosakiYoutubeEmbedFromConfig(
  config: GosakiYoutubeEmbedConfig | null | undefined,
): ResolvedGosakiYoutubeEmbed | null {
  if (!config || config.published !== true) return null;

  const videoId =
    parseYoutubeVideoId(config.videoId) ?? parseYoutubeVideoId(config.sourceUrl);
  if (!videoId) return null;

  const title = String(config.title ?? "").trim() || "YouTube video";
  const caption = String(config.caption ?? "").trim();

  return {
    videoId,
    title,
    caption,
    iframeTitle: title,
    embedUrl: buildYoutubeNocookieEmbedUrl(videoId),
    watchUrl: buildYoutubeWatchUrl(videoId),
    sourceUrl: String(config.sourceUrl ?? "").trim() || buildYoutubeWatchUrl(videoId),
  };
}
