/**
 * Gosaki public /discography/ list renderer.
 * Replaces the Wix repeater items when a Supabase read succeeded.
 * Page chrome stays. Album fields come only from the read rows.
 */

const LEGACY_ID_RE = /^discography-[0-9]{3}$/;
const RELEASE_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const MARKER_RE = /<!-- CMS_TARGET: DISCOGRAPHY_INDEX [^]*?-->/;

/**
 * @param {unknown} value
 */
export function escapeDiscographyHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {unknown} value
 */
export function discographyHttpUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw || raw.length > 2000) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "";
  return raw;
}

/**
 * @param {unknown} value
 */
function sortValue(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Array<Record<string, unknown>>} releases
 */
export function sortDiscographyPublicReleases(releases) {
  return [...releases].sort((a, b) => {
    const sortDelta = sortValue(a.sort_order) - sortValue(b.sort_order);
    if (sortDelta !== 0) return sortDelta;
    return String(a.legacy_id).localeCompare(String(b.legacy_id));
  });
}

/**
 * @param {unknown} releases
 * @param {Record<string, Array<Record<string, unknown>>> | null | undefined} tracksByLegacyId
 */
export function assessDiscographyPublicList(releases, tracksByLegacyId = {}) {
  if (!Array.isArray(releases)) {
    return { ok: false, reason: "rows_not_renderable", empty: false };
  }
  if (releases.length === 0) {
    return { ok: true, reason: null, empty: true };
  }
  const seen = new Set();
  for (const row of releases) {
    if (!row || typeof row !== "object") {
      return { ok: false, reason: "rows_not_renderable", empty: false };
    }
    const legacyId = String(row.legacy_id ?? "").trim();
    const title = String(row.title ?? "").trim();
    if (!LEGACY_ID_RE.test(legacyId) || !title || seen.has(legacyId)) {
      return { ok: false, reason: "rows_not_renderable", empty: false };
    }
    seen.add(legacyId);
    const tracks = tracksByLegacyId?.[legacyId];
    if (tracks == null) continue;
    if (!Array.isArray(tracks)) {
      return { ok: false, reason: "rows_not_renderable", empty: false };
    }
    for (const track of tracks) {
      if (!String(track?.title ?? "").trim()) {
        return { ok: false, reason: "rows_not_renderable", empty: false };
      }
    }
  }
  return { ok: true, reason: null, empty: false };
}

/**
 * @param {string} text
 * @param {string} [size]
 */
function richParagraph(text, size = "14px") {
  return (
    `<p class="font_8 wixui-rich-text__text" style="font-size:${size}; line-height:1.5em;">` +
    `<span class="wixui-rich-text__text">${escapeDiscographyHtml(text)}</span></p>`
  );
}

/**
 * @param {unknown} description
 */
function descriptionLines(description) {
  return String(description ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * @param {unknown} value
 */
function releaseLine(value) {
  const match = String(value ?? "").trim().match(RELEASE_DATE_RE);
  if (!match) return "";
  return `Release ${Number(match[1])}.${Number(match[2])}.${Number(match[3])}`;
}

/**
 * Stored display text wins. An empty value falls back to release_date.
 * @param {Record<string, unknown>} row
 */
function releaseDisplay(row) {
  const custom = String(row.release_display ?? "").trim();
  if (custom) return custom;
  return releaseLine(row.release_date);
}

/**
 * @param {string} prefix
 * @param {string} legacyId
 */
function cmsId(prefix, legacyId) {
  return `${prefix}__cms-${legacyId}`;
}

/**
 * @param {Record<string, unknown>} row
 * @param {Array<Record<string, unknown>>} tracks
 */
export function renderGosakiDiscographyAlbumItem(row, tracks = []) {
  const legacyId = String(row.legacy_id).trim();
  const title = String(row.title ?? "").trim();
  const artist = String(row.artist ?? "").trim();
  const safeLegacy = escapeDiscographyHtml(legacyId);
  const titleHtml = escapeDiscographyHtml(title);
  const heading = artist ? `「${titleHtml}」/${escapeDiscographyHtml(artist)}` : `「${titleHtml}」`;
  const itemId = cmsId("comp-llexymga", legacyId);
  const titleId = cmsId("comp-lley9r5x", legacyId);
  const imageId = cmsId("comp-jshobkm1", legacyId);
  const trackId = cmsId("comp-lley4qy2", legacyId);
  const personnelId = cmsId("comp-lley693e", legacyId);
  const releaseId = cmsId("comp-llez4vdq", legacyId);
  const cover = discographyHttpUrl(row.cover_image_url);
  const image = cover
    ? `<img class="gosaki-discography-album__img" id="img_${imageId}" loading="lazy" alt="${titleHtml}" src="${escapeDiscographyHtml(cover)}" />`
    : "";
  const trackParagraphs = [richParagraph("Track List"), ...tracks.map((track) => richParagraph(String(track.title).trim()))].join("");
  const purchaseLines = new Set(descriptionLines(row.purchase_note));
  const personnelParagraphs = [
    richParagraph("Personnel"),
    ...descriptionLines(row.description)
      .filter((line) => !purchaseLines.has(line))
      .map((line) => richParagraph(line)),
  ].join("");
  /** @type {string[]} */
  const releaseParts = [];
  const release = releaseDisplay(row);
  if (release) releaseParts.push(richParagraph(release, "13px"));
  const label = String(row.label ?? "").trim();
  if (label) releaseParts.push(richParagraph(label, "13px"));
  const catalog = String(row.catalog_number ?? "").trim();
  const price = String(row.price ?? "").trim();
  if (catalog && price) releaseParts.push(richParagraph(`${catalog} ${price}`, "13px"));
  else if (catalog) releaseParts.push(richParagraph(catalog, "13px"));
  else if (price) releaseParts.push(richParagraph(price, "13px"));
  for (const line of descriptionLines(row.purchase_note)) {
    releaseParts.push(richParagraph(line, "13px"));
  }
  for (const field of [row.purchase_url, row.streaming_url]) {
    const href = discographyHttpUrl(field);
    if (!href) continue;
    const safeHref = escapeDiscographyHtml(href);
    releaseParts.push(
      `<p class="font_8 wixui-rich-text__text" style="font-size:13px; line-height:1.5em;"><span class="wixui-rich-text__text"><a href="${safeHref}" rel="noopener noreferrer">${safeHref}</a></span></p>`,
    );
  }

  return (
    `<div role="listitem" class="_FiCX gosaki-discography-album-item" data-gosaki-discography-legacy-id="${safeLegacy}">` +
    `<div id="${itemId}" class="${itemId} FDI5TK wixui-repeater__item gosaki-discography-album">` +
    `<div id="bgLayers_${itemId}" data-hook="bgLayers" class="QG9w8P">` +
    `<div data-testid="colorUnderlay" class="LNYVZi ayCf9D"></div>` +
    `<div id="bgMedia_${itemId}" class="ROWgFb"></div></div>` +
    `<div data-mesh-id="${itemId}inlineContent" data-testid="inline-content" class="gosaki-discography-album__frame">` +
    `<div data-mesh-id="${itemId}inlineContent-gridContainer" data-testid="mesh-container-content" class="gosaki-discography-album__grid">` +
    `<div id="${imageId}" class="W4V2qg ${imageId} wixui-image gosaki-discography-album__cover"><div data-testid="linkElement" class="apPOZK">${image}</div></div>` +
    `<div class="gosaki-discography-album__body">` +
    `<div id="${titleId}" class="N8MGzv _v6ohL ZS_qLz PO9MfV ${titleId} wixui-rich-text gosaki-discography-album__title" data-testid="richTextElement">` +
    `<h2 class="font_2 wixui-rich-text__text" style="font-size:20px; line-height:normal;"><span class="wixui-rich-text__text">${heading}</span></h2></div>` +
    `<div class="gosaki-discography-album__details">` +
    `<div id="${trackId}" class="N8MGzv _v6ohL ZS_qLz PO9MfV ${trackId} wixui-rich-text gosaki-discography-album__tracks" data-testid="richTextElement">${trackParagraphs}</div>` +
    `<div id="${personnelId}" class="N8MGzv _v6ohL ZS_qLz PO9MfV ${personnelId} wixui-rich-text gosaki-discography-album__personnel" data-testid="richTextElement">${personnelParagraphs}</div>` +
    `</div>` +
    `<div id="${releaseId}" class="N8MGzv _v6ohL ZS_qLz PO9MfV ${releaseId} wixui-rich-text gosaki-discography-album__meta" data-testid="richTextElement">${releaseParts.join("")}</div>` +
    `</div></div></div></div></div>`
  );
}

/**
 * @param {string} html
 * @param {number} openIndex
 */
function findDivInnerBounds(html, openIndex) {
  const openEnd = html.indexOf(">", openIndex);
  if (openEnd < 0) return null;
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = openEnd + 1;
  let depth = 1;
  let match;
  while ((match = re.exec(html))) {
    if (match[0].startsWith("</")) depth -= 1;
    else if (!match[0].endsWith("/>")) depth += 1;
    if (depth === 0) {
      return { innerStart: openEnd + 1, innerEnd: match.index };
    }
  }
  return null;
}

/**
 * @param {string} html
 */
function findDiscographyListInner(html) {
  const repeater = html.indexOf('id="comp-llexymel"');
  if (repeater < 0) return null;
  const classAt = html.indexOf('class="TmK0x"', repeater);
  if (classAt < 0) return null;
  const open = html.lastIndexOf("<div", classAt);
  if (open < 0) return null;
  const bounds = findDivInnerBounds(html, open);
  if (!bounds) return null;
  return bounds;
}

/**
 * @param {string} html
 * @param {string} attrs
 */
function upsertDiscographyMarker(html, attrs) {
  const marker = `<!-- CMS_TARGET: DISCOGRAPHY_INDEX ${attrs} -->`;
  if (MARKER_RE.test(html)) return html.replace(MARKER_RE, marker);
  const anchor = '<div id="comp-llexymel"';
  const idx = html.indexOf(anchor);
  if (idx >= 0) return `${html.slice(0, idx)}${marker}${html.slice(idx)}`;
  return `${marker}${html}`;
}

/**
 * @param {string} html
 */
function markDataDrivenRepeater(html) {
  if (html.includes('<div id="comp-llexymel" data-gosaki-discography-render="data-driven"')) return html;
  return html.replace(
    /<div\b[^>]*\bid="comp-llexymel"/,
    (tag) => tag.replace('id="comp-llexymel"', 'id="comp-llexymel" data-gosaki-discography-render="data-driven"'),
  );
}

/**
 * @param {string} rendered
 * @param {string} outside
 */
function generatedIdsCollide(rendered, outside) {
  const ids = [...rendered.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  if (new Set(ids).size !== ids.length) return true;
  return ids.some((id) => outside.includes(`id="${id}"`));
}

/**
 * @param {Record<string, unknown>} summary
 * @param {string} html
 * @param {boolean} replaced
 */
function renderResult(summary, html, replaced) {
  return { summary, html, replaced };
}

/**
 * Replace the discography repeater items from a successful Supabase read.
 * Read failure is not handled here; the hook leaves the Wix list untouched.
 *
 * @param {string} html
 * @param {{
 *   discographyDataSource?: string,
 *   readStatus?: string,
 *   releases?: unknown,
 *   tracksByLegacyId?: Record<string, Array<Record<string, unknown>>>,
 *   trackRowCount?: number,
 * }} bundle
 */
export function applyGosakiDiscographyPublicList(html, bundle) {
  const sourceHtml = String(html ?? "");
  const readOk = bundle?.discographyDataSource === "supabase" && bundle?.readStatus !== "failed";
  if (!readOk) {
    return renderResult(null, sourceHtml, false);
  }

  const releases = bundle.releases;
  const tracksByLegacyId = bundle.tracksByLegacyId ?? {};
  const assessment = assessDiscographyPublicList(releases, tracksByLegacyId);
  const trackRowCount = Number(bundle.trackRowCount ?? 0);
  if (!assessment.ok) {
    return renderResult(
      {
        discographyDataSource: "supabase",
        readStatus: "ok",
        renderMode: "wix-fallback",
        fallbackReason: assessment.reason,
        rowCount: Array.isArray(releases) ? releases.length : 0,
        publishedCount: Array.isArray(releases) ? releases.length : 0,
        trackRowCount,
      },
      upsertDiscographyMarker(
        sourceHtml,
        `discographyDataSource=supabase discographyRender=wix-fallback readStatus=ok fallbackReason=${assessment.reason}`,
      ),
      false,
    );
  }

  const sorted = assessment.empty ? [] : sortDiscographyPublicReleases(/** @type {Array<Record<string, unknown>>} */ (releases));
  const rendered = sorted
    .map((row) => renderGosakiDiscographyAlbumItem(row, tracksByLegacyId[String(row.legacy_id)] ?? []))
    .join("");
  const list = findDiscographyListInner(sourceHtml);
  if (!list) {
    return renderResult(
      {
        discographyDataSource: "supabase",
        readStatus: "ok",
        renderMode: "wix-fallback",
        fallbackReason: "repeater_container_missing",
        rowCount: sorted.length,
        publishedCount: sorted.length,
        trackRowCount,
      },
      upsertDiscographyMarker(
        sourceHtml,
        "discographyDataSource=supabase discographyRender=wix-fallback readStatus=ok fallbackReason=repeater_container_missing",
      ),
      false,
    );
  }

  const outside = sourceHtml.slice(0, list.innerStart) + sourceHtml.slice(list.innerEnd);
  if (generatedIdsCollide(rendered, outside)) {
    return renderResult(
      {
        discographyDataSource: "supabase",
        readStatus: "ok",
        renderMode: "wix-fallback",
        fallbackReason: "duplicate_generated_id",
        rowCount: sorted.length,
        publishedCount: sorted.length,
        trackRowCount,
      },
      upsertDiscographyMarker(
        sourceHtml,
        "discographyDataSource=supabase discographyRender=wix-fallback readStatus=ok fallbackReason=duplicate_generated_id",
      ),
      false,
    );
  }

  let next = sourceHtml.slice(0, list.innerStart) + rendered + sourceHtml.slice(list.innerEnd);
  next = markDataDrivenRepeater(next);
  const publishedCount = sorted.length;
  const renderedTrackCount = sorted.reduce(
    (sum, row) => sum + (tracksByLegacyId[String(row.legacy_id)]?.length ?? 0),
    0,
  );
  next = upsertDiscographyMarker(
    next,
    `discographyDataSource=supabase discographyRender=data-driven readStatus=ok publishedCount=${publishedCount}`,
  );
  return renderResult(
    {
      discographyDataSource: "supabase",
      readStatus: "ok",
      renderMode: publishedCount === 0 ? "data-driven-empty" : "data-driven",
      fallbackReason: null,
      rowCount: publishedCount,
      publishedCount,
      trackRowCount: renderedTrackCount,
    },
    next,
    true,
  );
}
