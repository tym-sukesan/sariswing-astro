/**
 * Gosaki home YouTube embed — URL parse + nocookie embed (static config; no DB).
 */

/**
 * @param {string} input
 * @returns {string | null}
 */
export function parseYoutubeVideoId(input) {
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

/**
 * @param {string} videoId
 */
export function buildYoutubeNocookieEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * @param {string} videoId
 */
export function buildYoutubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * @param {{ published?: boolean; videoId?: string; sourceUrl?: string; title?: string; caption?: string }} config
 */
export function resolveGosakiYoutubeEmbedFromConfig(config) {
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
