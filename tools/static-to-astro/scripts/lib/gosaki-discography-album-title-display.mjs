/**
 * Display-only wrap for Gosaki Discography album titles.
 * Does not change DB / CMS values. Idempotent.
 *
 * Wix / public HTML shape: 「Album」/Artist
 * Render: <span class="gosaki-album-name">Album</span>
 *         <span class="gosaki-album-slash">/</span>
 *         <span class="gosaki-album-artist">Artist</span>
 */

const TITLE_H2_RE =
  /(<div id="comp-lley9r5x__[^"]+"[\s\S]*?<h2\b[^>]*>)([\s\S]*?)(<\/h2>)/gi;

const TITLE_ARTIST_RE = /(?:\u200b)?「([^」]+)」\s*\/\s*([^<]+)/;

/**
 * @param {string} inner
 */
export function wrapGosakiDiscographyAlbumTitleInnerHtml(inner) {
  if (inner.includes("gosaki-album-name")) return inner;
  return inner.replace(
    TITLE_ARTIST_RE,
    (_, title, artist) =>
      `<span class="gosaki-album-name">${title}</span>` +
      `<span class="gosaki-album-slash">/</span>` +
      `<span class="gosaki-album-artist">${String(artist).trim()}</span>`,
  );
}

/**
 * @param {string} html
 * @returns {{ html: string, count: number }}
 */
export function wrapGosakiDiscographyAlbumTitleHtml(html) {
  let count = 0;
  const out = String(html ?? "").replace(TITLE_H2_RE, (full, open, inner, close) => {
    const next = wrapGosakiDiscographyAlbumTitleInnerHtml(inner);
    if (next === inner) return full;
    count += 1;
    return open + next + close;
  });
  return { html: out, count };
}
