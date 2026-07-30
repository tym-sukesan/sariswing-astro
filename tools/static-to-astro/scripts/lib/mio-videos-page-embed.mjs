/**
 * Mio Kisaragi Jazz — Videos page embed inject (dedicated /videos/ only).
 * Uses Core youtube-url-utils; does not touch Home featured video.
 * Bundle must be injected explicitly (no implicit fixture-path read).
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildYoutubeNocookieEmbedUrl,
  parseYoutubeVideoId,
} from "./youtube-url-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../package.json"));
const cheerio = require("cheerio");

/**
 * @typedef {object} MioVideoItem
 * @property {string} id
 * @property {boolean} published
 * @property {number} [sortOrder]
 * @property {string} [urlKind]
 * @property {string} [title]
 * @property {string} embedCode
 */

/**
 * @typedef {object} MioResolvedVideoEmbed
 * @property {string} id
 * @property {string} title
 * @property {string} urlKind
 * @property {string} videoId
 * @property {string} nocookieEmbedUrl
 * @property {number} sortOrder
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Normalize injected bundle shapes from verifier / convert options.
 * @param {unknown} bundle
 * @returns {MioVideoItem[]}
 */
export function readMioVideoItemsFromBundle(bundle) {
  if (!bundle || typeof bundle !== "object") return [];
  const obj = /** @type {Record<string, unknown>} */ (bundle);
  if (Array.isArray(obj.items)) return /** @type {MioVideoItem[]} */ (obj.items);
  if (Array.isArray(obj.embeds)) return /** @type {MioVideoItem[]} */ (obj.embeds);
  if (Array.isArray(obj.videos)) return /** @type {MioVideoItem[]} */ (obj.videos);
  return [];
}

/**
 * published=true + Core-parseable only (shorts / invalid fail-closed → omitted).
 * @param {MioVideoItem[]} items
 * @returns {MioResolvedVideoEmbed[]}
 */
export function selectMioPublicVideoEmbeds(items) {
  return (items ?? [])
    .filter((item) => item && item.published === true)
    .map((item) => {
      const videoId = parseYoutubeVideoId(item.embedCode);
      if (!videoId) return null;
      return {
        id: String(item.id ?? ""),
        title: String(item.title ?? item.id ?? "Video"),
        urlKind: String(item.urlKind ?? "watch"),
        videoId,
        nocookieEmbedUrl: buildYoutubeNocookieEmbedUrl(videoId),
        sortOrder: Number(item.sortOrder ?? 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/**
 * @param {MioResolvedVideoEmbed[]} embeds
 */
function buildMioVideoListMarkup(embeds) {
  const cards = embeds
    .map((embed) => {
      const kindAttr = escapeHtml(embed.urlKind);
      return `      <li class="video-card mio-video-card" data-mio-video-kind="${kindAttr}" data-mio-video-id="${escapeHtml(embed.videoId)}" data-mio-video-item="${escapeHtml(embed.id)}">
        <p class="video-kind">${kindAttr}</p>
        <h3>${escapeHtml(embed.title)}</h3>
        <div class="mio-video-embed">
          <iframe
            title="${escapeHtml(embed.title)}"
            src="${escapeHtml(embed.nocookieEmbedUrl)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            data-mio-nocookie-embed="true"
          ></iframe>
        </div>
      </li>`;
    })
    .join("\n");

  return `<ul class="video-list mio-video-list" data-mio-videos="public">\n${cards}\n    </ul>`;
}

/**
 * @param {string} outDir
 * @returns {string | null}
 */
export function resolveMioVideosPagePath(outDir) {
  const candidates = [
    path.join(outDir, "src/pages/videos/index.astro"),
    path.join(outDir, "src/pages/videos.astro"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/**
 * Replace Videos page list with public embeds only.
 * @param {string} outDir
 * @param {unknown} embedsBundle
 * @returns {{ applied: boolean, reason?: string, publishedCount: number, paths: string[], videoIds: string[] }}
 */
export function applyMioVideosPageEmbeds(outDir, embedsBundle) {
  const items = readMioVideoItemsFromBundle(embedsBundle);
  if (!items.length) {
    return {
      applied: false,
      reason: "mio_videos_bundle_missing",
      publishedCount: 0,
      paths: [],
      videoIds: [],
    };
  }

  const embeds = selectMioPublicVideoEmbeds(items);
  const pagePath = resolveMioVideosPagePath(outDir);
  if (!pagePath) {
    return {
      applied: false,
      reason: "videos_page_not_found",
      publishedCount: embeds.length,
      paths: [],
      videoIds: embeds.map((e) => e.videoId),
    };
  }

  const original = fs.readFileSync(pagePath, "utf8");
  const fmMatch = original.match(/^---\n[\s\S]*?\n---\n?/);
  const frontmatter = fmMatch ? fmMatch[0] : "";
  const body = fmMatch ? original.slice(fmMatch[0].length) : original;

  const $ = cheerio.load(`<div id="__mio_videos_root">${body}</div>`, {
    decodeEntities: false,
    xml: false,
  });
  const root = $("#__mio_videos_root");
  const list = root.find(".video-list").first();
  if (!list.length) {
    return {
      applied: false,
      reason: "video_list_selector_missing",
      publishedCount: embeds.length,
      paths: [],
      videoIds: embeds.map((e) => e.videoId),
    };
  }

  list.replaceWith(buildMioVideoListMarkup(embeds));
  root.find("p.lede").each((_, el) => {
    const text = $(el).text();
    if (/埋め込み変換しません|想定 URL 種別/.test(text)) {
      $(el).text(
        "公開動画のみ youtube-nocookie embed で表示します（未対応URL・非公開は非表示）。",
      );
    }
  });

  const nextBody = root.html() ?? body;
  fs.writeFileSync(pagePath, `${frontmatter}${nextBody}`, "utf8");

  return {
    applied: true,
    publishedCount: embeds.length,
    paths: [pagePath],
    videoIds: embeds.map((e) => e.videoId),
  };
}
