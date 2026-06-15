/**
 * Gosaki-piano site-specific Wix static export CSS overrides (G-8c / G-8d).
 * Brand colors, home hero comp, About / Discography / Contact mobile parity — not for other Wix pilots.
 */

export const GOSAKI_PIANO_SITE_SLUG = "gosaki-piano";

/**
 * @param {{ siteSlug?: string }} [options]
 */
export function buildGosakiPianoSiteOverridesCss(options = {}) {
  const slug = options.siteSlug ?? GOSAKI_PIANO_SITE_SLUG;
  if (slug !== GOSAKI_PIANO_SITE_SLUG) return "";

  return `/* --- Gosaki-piano site-specific overrides (G-8c) --- */

/* Home hero KV: section colorUnderlay tints the image without Wix runtime stacking */
body.wix-static-export #comp-lol1i5k0 {
  --bg-overlay-color: transparent !important;
  --section-corvid-background-color: transparent !important;
  position: relative;
  z-index: 1;
}
body.wix-static-export #comp-lol1i5k0 [data-testid="colorUnderlay"] {
  display: none !important;
}

/* Gosaki brand nav colors (header-transform nav fallback) */
body.wix-static-export #SITE_HEADER .nav-toggle {
  border-color: #9e3b1b;
  color: #5b4d43;
  font-family: futura-lt-w01-book, sans-serif;
}

body.wix-static-export #SITE_HEADER .nav-toggle__bar {
  background: #9e3b1b;
}

body.wix-static-export #SITE_HEADER .global-nav {
  background: transparent;
}

body.wix-static-export #SITE_HEADER .global-nav a {
  font-family: futura-lt-w01-book, sans-serif;
  color: #5b4d43;
}

body.wix-static-export #SITE_HEADER .global-nav a:hover,
body.wix-static-export #SITE_HEADER .global-nav a.is-current {
  color: #993500;
}

@media (max-width: 767px) {
  body.wix-static-export #SITE_HEADER .global-nav {
    background: #fffccc;
    border: 0 solid #9e3b1b;
  }
}

/* About page: heading center + bio readability (gosaki comp IDs) */
@media (max-width: 768px) {
  body.wix-static-export #WRchTxt16,
  body.wix-static-export #WRchTxt16 .wixui-rich-text__text {
    text-align: center;
  }

  body.wix-static-export #comp-jrqh3smr {
    padding: 0 1rem;
  }

  body.wix-static-export #comp-jrqh3smr p,
  body.wix-static-export #comp-jrqh3smr .wixui-rich-text__text {
    font-size: 15px !important;
    line-height: 1.75 !important;
  }
}

@media (max-width: 480px) {
  body.wix-static-export #comp-jrqh3smr {
    padding: 0 0.75rem;
  }

  body.wix-static-export #comp-jrtenw0n img {
    width: min(90vw, 300px) !important;
  }
}

/* --- G-8d gosaki mobile visual parity (site-specific; baseline G-8c unchanged) --- */

@media (max-width: 768px) {
  /* Header: beige band, large logo left, MENU right */
  body.wix-static-export #SITE_HEADER {
    min-height: 5.5rem;
  }

  body.wix-static-export #SITE_HEADER .XKFSfx {
    position: relative;
    z-index: 2;
  }

  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 0.5rem 1rem !important;
    padding: 1.25rem 1rem 1.5rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc {
    flex: 1 1 auto;
    width: auto !important;
    max-width: calc(100% - 5.5rem) !important;
    margin: 0 !important;
    order: 1;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc h1,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc .wixui-rich-text__text,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc span[style*="font-size"] {
    font-size: clamp(22px, 6vw, 28px) !important;
    line-height: 1.35 !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw7xid {
    flex: 0 0 auto;
    width: auto !important;
    max-width: none !important;
    margin: 0 0 0 auto !important;
    order: 2;
    align-self: flex-start;
  }

  body.wix-static-export #SITE_HEADER .nav-toggle {
    margin-left: auto;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    padding-bottom: 0.75rem;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open #comp-mbdw7xid {
    flex: 1 1 100%;
    width: 100% !important;
    order: 3;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav {
    width: 100%;
  }

  /* Discography page */
  body.wix-static-export #comp-jqy0szge {
    width: 100% !important;
    max-width: 100% !important;
    text-align: center !important;
    margin: 2rem 0 1.25rem !important;
    padding: 0 1rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-jqy0szge h4,
  body.wix-static-export #comp-jqy0szge .font_4,
  body.wix-static-export #comp-jqy0szge .wixui-rich-text__text {
    font-size: clamp(28px, 7vw, 35px) !important;
    line-height: 1.25 !important;
  }

  body.wix-static-export #comp-llexymel {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 1rem 2.5rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export [id^="comp-llexymga__"]:not([id$="inlineContent"]):not([id$="gridContainer"]) {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 0 2.5rem !important;
    padding: 1.25rem 1rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export [data-mesh-id^="comp-llexymga__"][data-mesh-id$="inlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 1rem !important;
  }

  body.wix-static-export [id^="comp-jshobkm1__"] {
    order: 1 !important;
    width: 100% !important;
    text-align: center;
  }

  body.wix-static-export [id^="comp-lley9r5x__"] {
    order: 2 !important;
    width: 100% !important;
    text-align: center !important;
    padding: 0 0.25rem !important;
  }

  body.wix-static-export [id^="comp-lley9r5x__"] h2,
  body.wix-static-export [id^="comp-lley9r5x__"] .font_2 {
    font-size: clamp(18px, 5vw, 22px) !important;
    line-height: 1.35 !important;
  }

  body.wix-static-export [id^="comp-lley4qy2__"] {
    order: 3 !important;
    width: 100% !important;
    padding: 0 0.25rem !important;
  }

  body.wix-static-export [id^="comp-lley693e__"] {
    order: 4 !important;
    width: 100% !important;
    padding: 0 0.25rem !important;
  }

  body.wix-static-export [id^="comp-llez4vdq__"] {
    order: 5 !important;
    width: 100% !important;
    padding: 0 0.25rem !important;
  }

  body.wix-static-export [id^="comp-lley4qy2__"] p,
  body.wix-static-export [id^="comp-lley693e__"] p,
  body.wix-static-export [id^="comp-llez4vdq__"] p {
    font-size: 14px !important;
    line-height: 1.65 !important;
  }

  body.wix-static-export [id^="comp-jshobkm1__"] img {
    width: min(75vw, 280px) !important;
    max-width: 90% !important;
    height: auto !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  /* About page */
  body.wix-static-export #comp-lol1i5l0 [data-mesh-id$="inlineContent-gridContainer"] {
    padding: 0 1rem 2rem !important;
    gap: 1.25rem !important;
  }

  body.wix-static-export #WRchTxt16 {
    width: 100% !important;
    text-align: center !important;
    margin: 2rem 0 1rem !important;
    padding: 0 0.5rem !important;
  }

  body.wix-static-export #WRchTxt16 h4,
  body.wix-static-export #WRchTxt16 .font_4 {
    font-size: clamp(28px, 7vw, 35px) !important;
  }

  body.wix-static-export #comp-jrqh3smr {
    width: 100% !important;
    order: 2;
  }

  body.wix-static-export #comp-jrtenw0n {
    width: 100% !important;
    order: 3;
    text-align: center;
  }

  body.wix-static-export #comp-jrtenw0n img {
    width: min(85vw, 320px) !important;
    max-width: 90% !important;
    height: auto !important;
    margin: 0 auto !important;
    display: block;
  }

  /* Contact page */
  body.wix-static-export #comp-lol1i5gq [data-mesh-id$="inlineContent-gridContainer"] {
    padding: 0 1rem 2.5rem !important;
    gap: 1.25rem !important;
  }

  body.wix-static-export #WRchTxt4 {
    width: 100% !important;
    text-align: center !important;
    margin: 2rem 0 0.75rem !important;
    padding: 0 0.5rem !important;
  }

  body.wix-static-export #WRchTxt4 h4,
  body.wix-static-export #WRchTxt4 .font_4 {
    font-size: clamp(28px, 7vw, 35px) !important;
  }

  body.wix-static-export #comp-j8pza50e {
    width: 100% !important;
    padding: 0 0.5rem !important;
    text-align: center;
  }

  body.wix-static-export #comp-jsh29kfc {
    width: 100% !important;
    text-align: center;
  }

  body.wix-static-export #comp-jsh29kfc img {
    width: min(75vw, 260px) !important;
    max-width: 90% !important;
    height: auto !important;
    margin: 0 auto !important;
    display: block;
  }

  body.wix-static-export #comp-jqbwo704 {
    width: 100% !important;
    padding: 0 0.5rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-jqbwo704 form,
  body.wix-static-export #comp-jqbwo704 [data-hook="form"] {
    width: 100% !important;
    max-width: 100% !important;
  }
}

@media (max-width: 480px) {
  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    padding: 1rem 0.75rem 1.25rem !important;
  }

  body.wix-static-export #comp-llexymel,
  body.wix-static-export [id^="comp-llexymga__"]:not([id$="inlineContent"]):not([id$="gridContainer"]) {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
`;
}
