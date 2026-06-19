/**
 * Gosaki YouTube embed — URL / embed-code parsing (Node tests + convert tooling).
 */

/**
 * @param {string} input
 * @returns {string | null}
 */
export function parseYoutubeVideoId(input) {
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

/**
 * @param {string} videoId
 */
export function buildYoutubeNocookieEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * @param {{ published?: boolean; videoId?: string; sourceUrl?: string; embedCode?: string }} item
 */
export function resolveGosakiYoutubeItem(item) {
  if (!item || item.published !== true) return null;

  const videoId =
    parseYoutubeVideoId(item.videoId) ??
    parseYoutubeVideoId(item.sourceUrl) ??
    parseYoutubeVideoId(item.embedCode);
  if (!videoId) return null;

  return {
    videoId,
    embedUrl: buildYoutubeNocookieEmbedUrl(videoId),
  };
}
