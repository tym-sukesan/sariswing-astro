/**
 * Mio Kisaragi Jazz — Discography page render from injected discographyBundle.
 *
 * Does not import Gosaki discography markup. Does not read fixture paths implicitly.
 * Used via adapter patchDiscographyPageMainHtml (Core page-write hook).
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  groupDiscographyTracksByLegacyId,
  normalizeDiscographyRecord,
  normalizeDiscographyTrackRecord,
} from "./supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../package.json"));
const cheerio = require("cheerio");

/**
 * @param {string} text
 */
export function escapeMioDiscographyHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {unknown} bundle
 */
export function readMioDiscographyReleasesFromBundle(bundle) {
  if (!bundle || typeof bundle !== "object") return [];
  const obj = /** @type {Record<string, unknown>} */ (bundle);
  if (Array.isArray(obj.releases)) return /** @type {Array<Record<string, unknown>>} */ (obj.releases);
  return [];
}

/**
 * @param {unknown} bundle
 */
export function readMioDiscographyTracksByLegacyId(bundle) {
  if (!bundle || typeof bundle !== "object") return {};
  const obj = /** @type {Record<string, unknown>} */ (bundle);
  if (obj.tracksByLegacyId && typeof obj.tracksByLegacyId === "object") {
    return /** @type {Record<string, Array<Record<string, unknown>>>} */ (obj.tracksByLegacyId);
  }
  if (Array.isArray(obj.tracks)) {
    return groupDiscographyTracksByLegacyId(
      obj.tracks.map((row) => normalizeDiscographyTrackRecord(/** @type {Record<string, unknown>} */ (row))),
    );
  }
  return {};
}

/**
 * Build inject-ready discographyBundle from discography.json document.
 * published=true only; keeps extensions for Mio display.
 *
 * @param {{ releases?: unknown[], tracks?: unknown[], siteSlug?: string }} doc
 */
export function buildMioInjectDiscographyBundle(doc) {
  const rawReleases = Array.isArray(doc?.releases) ? doc.releases : [];
  const rawTracks = Array.isArray(doc?.tracks) ? doc.tracks : [];

  const publicRaw = rawReleases.filter(
    (row) => row && /** @type {any} */ (row).published !== false,
  );
  const releases = publicRaw
    .map((row) => {
      const r = /** @type {Record<string, unknown>} */ (row);
      return {
        ...normalizeDiscographyRecord(r),
        extensions: r.extensions && typeof r.extensions === "object" ? r.extensions : {},
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.legacy_id.localeCompare(b.legacy_id));

  const publicLegacy = new Set(releases.map((r) => r.legacy_id));
  const tracks = rawTracks
    .map((row) => normalizeDiscographyTrackRecord(/** @type {Record<string, unknown>} */ (row)))
    .filter((t) => publicLegacy.has(t.discography_legacy_id));
  const tracksByLegacyId = groupDiscographyTracksByLegacyId(tracks);

  return {
    discographyDataSource: "static-fallback",
    siteSlug: doc?.siteSlug ?? "mio-kisaragi-jazz",
    releases,
    tracks,
    tracksByLegacyId,
    releaseCount: releases.length,
  };
}

/**
 * @param {unknown} bundle
 */
export function selectMioPublicDiscographyReleases(bundle) {
  return readMioDiscographyReleasesFromBundle(bundle)
    .filter((row) => /** @type {any} */ (row).published !== false)
    .sort(
      (a, b) =>
        Number(/** @type {any} */ (a).sort_order ?? 0) -
          Number(/** @type {any} */ (b).sort_order ?? 0) ||
        String(/** @type {any} */ (a).legacy_id ?? "").localeCompare(
          String(/** @type {any} */ (b).legacy_id ?? ""),
        ),
    );
}

/**
 * @param {Record<string, unknown>} release
 * @param {Array<Record<string, unknown>>} tracks
 */
export function renderMioDiscographyReleaseCardHtml(release, tracks = []) {
  const ext =
    release.extensions && typeof release.extensions === "object"
      ? /** @type {Record<string, unknown>} */ (release.extensions)
      : {};
  const legacyId = String(release.legacy_id ?? "");
  const title = String(release.title ?? "");
  const dateUnknown =
    ext.releaseDateUnknown === true || release.release_date == null || release.release_date === "";
  const dateLabel = dateUnknown ? "発売日不明" : String(release.release_date);
  const cover = release.cover_image_url ? String(release.cover_image_url).trim() : "";
  const hasArtwork = Boolean(cover);
  const streaming = release.streaming_url ? String(release.streaming_url).trim() : "";
  const purchase = release.purchase_url ? String(release.purchase_url).trim() : "";
  const hasStreaming = Boolean(streaming);
  const longCredit =
    ext.longCredit === true || String(release.description ?? "").length > 120;
  const trackList = Array.isArray(tracks) ? tracks : [];
  const trackEmpty = ext.trackListEmpty === true || trackList.length === 0;

  const imgHtml = hasArtwork
    ? `\n      <img class="mio-discography-release__artwork" src="${escapeMioDiscographyHtml(cover)}" width="180" height="180" alt="" data-mio-has-artwork="true" />`
    : `\n      <div class="mio-discography-release__artwork mio-discography-release__artwork--none" data-mio-has-artwork="false" aria-hidden="true"></div>`;

  const streamingHtml = hasStreaming
    ? `\n      <p class="mio-discography-release__streaming">配信: <a href="${escapeMioDiscographyHtml(streaming)}" rel="noopener noreferrer">${escapeMioDiscographyHtml(streaming)}</a></p>`
    : `\n      <p class="mio-discography-release__streaming" data-mio-streaming="none">配信なし</p>`;

  const purchaseHtml = purchase
    ? `\n      <p class="mio-discography-release__purchase">購入: <a href="${escapeMioDiscographyHtml(purchase)}" rel="noopener noreferrer">${escapeMioDiscographyHtml(purchase)}</a></p>`
    : "";

  const trackHtml = trackEmpty
    ? `\n      <p class="mio-discography-release__tracks mio-discography-release__tracks--empty" data-mio-track-count="0">トラック情報なし</p>`
    : `\n      <ol class="mio-discography-track-list" data-mio-track-count="${trackList.length}">\n${trackList
        .map(
          (t) =>
            `        <li data-mio-track-id="${escapeMioDiscographyHtml(String(t.id ?? ""))}">${escapeMioDiscographyHtml(String(t.title ?? ""))}</li>`,
        )
        .join("\n")}\n      </ol>`;

  const desc = release.description ? String(release.description) : "";
  const creditHtml = desc
    ? `\n      <p class="mio-discography-release__credit${longCredit ? " mio-discography-release__credit--long" : ""}">${escapeMioDiscographyHtml(desc)}</p>`
    : "";

  return `<li class="mio-discography-release${hasArtwork ? " mio-discography-release--has-artwork" : ""}${longCredit ? " mio-discography-release--long-credit" : ""}" data-mio-release-id="${escapeMioDiscographyHtml(legacyId)}" data-mio-has-artwork="${hasArtwork ? "true" : "false"}" data-mio-has-streaming="${hasStreaming ? "true" : "false"}" data-mio-release-date-unknown="${dateUnknown ? "true" : "false"}" data-mio-track-count="${trackList.length}"${longCredit ? ' data-mio-long-credit="true"' : ""}>
      ${imgHtml}
      <h3 class="mio-discography-release__title">${escapeMioDiscographyHtml(title)}</h3>
      <p class="mio-discography-release__meta"><span class="mio-discography-release__date">${escapeMioDiscographyHtml(dateLabel)}</span> · <span class="mio-discography-badge" data-mio-streaming-badge="${hasStreaming ? "yes" : "no"}">${hasStreaming ? "配信あり" : "配信なし"}</span></p>${streamingHtml}${purchaseHtml}${trackHtml}${creditHtml}
    </li>`;
}

/**
 * @param {unknown} bundle
 */
export function renderMioDiscographyListHtml(bundle) {
  const releases = selectMioPublicDiscographyReleases(bundle);
  const tracksByLegacyId = readMioDiscographyTracksByLegacyId(bundle);
  const cards = releases
    .map((release) => {
      const legacyId = String(/** @type {any} */ (release).legacy_id ?? "");
      const tracks = tracksByLegacyId[legacyId] ?? [];
      return renderMioDiscographyReleaseCardHtml(
        /** @type {Record<string, unknown>} */ (release),
        tracks,
      );
    })
    .join("\n    ");
  return `<ul class="release-list mio-discography-list" data-mio-discography="public" data-mio-release-count="${releases.length}">\n    ${cards}\n  </ul>`;
}

/**
 * Replace Discography main HTML release list with public releases from bundle.
 *
 * @param {string} mainHtml
 * @param {unknown} bundle
 * @param {{ route?: string }} [page]
 * @returns {{ html: string, summary: object } | null}
 */
export function patchMioDiscographyMainHtml(mainHtml, bundle, page = {}) {
  const route = page.route ?? "";
  if (route && route !== "/discography/" && route !== "/discography") {
    return null;
  }

  const releases = selectMioPublicDiscographyReleases(bundle);
  if (!releases.length) {
    return {
      html: mainHtml,
      summary: {
        applied: false,
        reason: "mio_discography_bundle_missing",
        releaseCount: 0,
        discographyDataSource: "none",
      },
    };
  }

  const $ = cheerio.load(`<div id="__mio_disco_root">${mainHtml}</div>`, {
    decodeEntities: false,
    xml: false,
  });
  const root = $("#__mio_disco_root");
  const list = root.find(".release-list").first();
  if (!list.length) {
    return {
      html: mainHtml,
      summary: {
        applied: false,
        reason: "release_list_selector_missing",
        releaseCount: releases.length,
        discographyDataSource: "static-fallback",
      },
    };
  }

  list.replaceWith(renderMioDiscographyListHtml(bundle));
  root.find("p.lede").each((_, el) => {
    const text = $(el).text();
    if (/公開作品のみ|fixture-meta/.test(text)) {
      $(el).text("公開作品のみ表示。unpublished は非表示です。");
    }
  });

  let html = root.html() ?? mainHtml;
  // Drop scaffold UNRELEASED comments that named unpublished titles.
  html = html.replace(/<!--[\s\S]*?UNRELEASED[\s\S]*?-->/gi, "");

  return {
    html,
    summary: {
      applied: true,
      discographyDataSource: "static-fallback",
      releaseCount: releases.length,
      legacyIds: releases.map((r) => String(/** @type {any} */ (r).legacy_id ?? "")),
      trackCounts: Object.fromEntries(
        releases.map((r) => {
          const id = String(/** @type {any} */ (r).legacy_id ?? "");
          const tracks = readMioDiscographyTracksByLegacyId(bundle)[id] ?? [];
          return [id, tracks.length];
        }),
      ),
    },
  };
}
