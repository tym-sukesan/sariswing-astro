/**
 * Gosaki YouTube embed — item resolve + public HTML smoke (Node tests / convert).
 * URL parse SoT: `youtube-url-utils.mjs` (re-exported for existing import paths).
 */

export {
  buildYoutubeNocookieEmbedUrl,
  parseYoutubeVideoId,
} from "./youtube-url-utils.mjs";

import {
  buildYoutubeNocookieEmbedUrl,
  parseYoutubeVideoId,
} from "./youtube-url-utils.mjs";

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
