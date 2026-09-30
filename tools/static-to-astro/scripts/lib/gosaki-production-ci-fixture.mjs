/**
 * Tracked sanitized Gosaki production convert snapshot.
 * Raw crawl remains gitignored under fixtures/gosaki-piano/.
 * CI must not crawl; checkout of this directory is sufficient.
 */

export const GOSAKI_RAW_CRAWL_FIXTURE_DIR = "fixtures/gosaki-piano";
export const GOSAKI_PRODUCTION_CI_FIXTURE_DIR = "fixtures/gosaki-piano-ci";

export const GOSAKI_PRODUCTION_CI_EXPECTED_HTML = Object.freeze([
  "index.html",
  "about.html",
  "discography.html",
  "contact.html",
  "link.html",
  "2026-03.html",
  "2026-04.html",
  "2026-05.html",
  "2026-06.html",
  "2026-07.html",
]);

/** Basenames treated as Gosaki convert fixtures (raw crawl + sanitized CI). */
export const GOSAKI_FIXTURE_BASENAMES = Object.freeze(["gosaki-piano", "gosaki-piano-ci"]);
