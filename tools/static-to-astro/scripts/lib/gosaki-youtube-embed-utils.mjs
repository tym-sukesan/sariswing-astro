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
 * @param {{ published?: boolean; videoId?: string; sourceUrl?: string; embedCode?: string; id?: string; sortOrder?: number }} item
 */
export function resolveGosakiYoutubeItem(item) {
  if (!item || item.published !== true) return null;

  const videoId =
    parseYoutubeVideoId(item.videoId) ??
    parseYoutubeVideoId(item.sourceUrl) ??
    parseYoutubeVideoId(item.embedCode);
  if (!videoId) return null;

  return {
    id: String(item.id ?? "").trim() || videoId,
    videoId,
    embedUrl: buildYoutubeNocookieEmbedUrl(videoId),
    sortOrder: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : 0,
  };
}

/**
 * Mirror of templates/.../gosaki-youtube-embed.ts resolvePublishedGosakiYoutubeItems (Node).
 * @param {{ sectionTitle?: string; items?: Array<Record<string, unknown>>; published?: boolean; videoId?: string; sourceUrl?: string }} config
 */
export function resolvePublishedGosakiYoutubeItems(config) {
  let items = Array.isArray(config?.items) ? config.items : [];
  if (items.length === 0 && (config?.published !== undefined || config?.videoId || config?.sourceUrl)) {
    items = [
      {
        id: "legacy-single",
        published: config.published,
        sortOrder: 10,
        videoId: config.videoId,
        sourceUrl: config.sourceUrl,
      },
    ];
  }
  return items
    .map((item) => resolveGosakiYoutubeItem(item))
    .filter((item) => item != null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id, "ja"));
}

/**
 * Minimal public-section HTML mirroring YouTubeEmbedSection.astro (layout smoke only).
 * @param {ReturnType<typeof resolvePublishedGosakiYoutubeItems>} items
 * @param {{ sectionTitle?: string }} [meta]
 */
export function renderGosakiYoutubePublicSectionHtml(items, meta = {}) {
  const title = String(meta.sectionTitle ?? "YouTube").trim() || "YouTube";
  if (!items?.length) return "";
  const articles = items
    .map(
      (item) => `<article class="gosaki-youtube-embed__item" data-yt-id="${item.id}">
  <div class="gosaki-youtube-embed__media">
    <iframe class="gosaki-youtube-embed__iframe" src="${item.embedUrl}" title="Gosaki Piano YouTube video" loading="lazy" allowfullscreen></iframe>
  </div>
  <p class="gosaki-youtube-embed__watch"><a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank" rel="noopener noreferrer">YouTubeで見る</a></p>
</article>`,
    )
    .join("\n");
  return `<section class="gosaki-youtube-embed" aria-labelledby="gosaki-youtube-heading">
  <div class="gosaki-youtube-embed__inner">
    <h2 id="gosaki-youtube-heading" class="gosaki-youtube-embed__title">${title}</h2>
    <div class="gosaki-youtube-embed__list">
${articles}
    </div>
  </div>
</section>`;
}
