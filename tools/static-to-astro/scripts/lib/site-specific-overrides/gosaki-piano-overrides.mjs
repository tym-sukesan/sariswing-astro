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

/* --- G-8e gosaki mobile UI final polish (site-specific) --- */

@media (max-width: 768px) {
  /* SP header: sticky, compact, square hamburger */
  body.wix-static-export #SITE_HEADER {
    position: sticky;
    top: 0;
    z-index: 1000;
    min-height: auto;
  }

  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    padding: 0.625rem 1.25rem !important;
    min-height: auto;
    align-items: center !important;
    gap: 0.5rem !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc h1,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc .wixui-rich-text__text,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc span[style*="font-size"] {
    font-size: clamp(17px, 4.5vw, 22px) !important;
    line-height: 1.3 !important;
  }

  body.wix-static-export #SITE_HEADER .site-logo-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  body.wix-static-export #SITE_HEADER .site-logo-link:hover,
  body.wix-static-export #SITE_HEADER .site-logo-link:focus {
    color: inherit;
    opacity: 0.85;
  }

  body.wix-static-export #SITE_HEADER .nav-toggle {
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
    padding: 0;
    margin-left: auto;
    justify-content: center;
    gap: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  body.wix-static-export #SITE_HEADER .nav-toggle__label {
    display: none !important;
  }

  body.wix-static-export #SITE_HEADER .nav-toggle__icon {
    margin: 0;
  }

  /* Unified SP content gutter (~20px) */
  body.wix-static-export #comp-lol1i5l0 [data-mesh-id$="inlineContent-gridContainer"],
  body.wix-static-export #comp-lol1i5gq [data-mesh-id$="inlineContent-gridContainer"],
  body.wix-static-export #comp-lol1i5ga [data-mesh-id$="inlineContent-gridContainer"],
  body.wix-static-export #comp-lol1i5hv [data-mesh-id$="inlineContent-gridContainer"],
  body.wix-static-export #comp-m8y3dzb6 [data-mesh-id$="inlineContent-gridContainer"] {
    padding-inline: 1.25rem !important;
    box-sizing: border-box;
  }

  /* Home: THIS WEEK'S LIVE SCHEDULE */
  body.wix-static-export #comp-m8y5bex0 {
    width: 100% !important;
    max-width: 100% !important;
    margin: 1.5rem 0 0.75rem !important;
    padding: 0 !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-m8y5bex0 h1,
  body.wix-static-export #comp-m8y5bex0 .font_0 {
    font-size: clamp(22px, 6vw, 32px) !important;
    line-height: 1.25 !important;
    white-space: normal !important;
    text-align: center !important;
  }

  body.wix-static-export #comp-m8y5l5fs {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto 1rem !important;
  }

  body.wix-static-export #comp-m8y53dj5 {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 0 2rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export [id^="comp-m8y53djd__"]:not([id$="inlineContent"]):not([id$="gridContainer"]) {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 0 1.25rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export [data-mesh-id^="comp-m8y53djd__"][data-mesh-id$="inlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 0.75rem !important;
    padding: 1rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export [id^="comp-m8y5ctyk__"] {
    order: 1 !important;
    width: 100% !important;
    max-width: 100% !important;
    left: auto !important;
    margin: 0 auto !important;
    text-align: center;
  }

  body.wix-static-export [id^="comp-m8y53djg1__"] {
    order: 2 !important;
    width: 100% !important;
    max-width: 100% !important;
    left: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  body.wix-static-export [id^="comp-m8y53djn1__"] {
    order: 3 !important;
    width: 100% !important;
    max-width: 100% !important;
    left: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  body.wix-static-export [id^="comp-m8y53djg1__"] p,
  body.wix-static-export [id^="comp-m8y53djn1__"] p,
  body.wix-static-export [id^="comp-m8y53djg1__"] .wixui-rich-text__text,
  body.wix-static-export [id^="comp-m8y53djn1__"] .wixui-rich-text__text {
    font-size: 14px !important;
    line-height: 1.6 !important;
    white-space: normal !important;
  }

  body.wix-static-export [id^="comp-m8y5ctyk__"] img {
    width: min(70vw, 220px) !important;
    max-width: 100% !important;
    height: auto !important;
    margin: 0 auto !important;
    display: block;
  }

  /* About: even horizontal padding */
  body.wix-static-export #WRchTxt16,
  body.wix-static-export #comp-jrqh3smr,
  body.wix-static-export #comp-jrtenw0n {
    padding-inline: 0 !important;
    margin-inline: 0 !important;
    width: 100% !important;
  }

  body.wix-static-export #comp-jrqh3smr {
    padding: 0 !important;
  }

  /* Link page */
  body.wix-static-export #comp-juctbpem {
    width: 100% !important;
    max-width: 100% !important;
    left: auto !important;
    margin: 1.5rem 0 2rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export [data-mesh-id="comp-juctbpeminlineContent"],
  body.wix-static-export [data-mesh-id="comp-juctbpeminlineContent-gridContainer"] {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Contact: center form block */
  body.wix-static-export #comp-jqbwo704 {
    margin-left: auto !important;
    margin-right: auto !important;
    left: auto !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-jqbwo704 form,
  body.wix-static-export #comp-jqbwo704 [data-hook="form"],
  body.wix-static-export #comp-jqbwo704 .wixui-form,
  body.wix-static-export #comp-jqbwo704 fieldset {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-jqbwo704 input,
  body.wix-static-export #comp-jqbwo704 textarea,
  body.wix-static-export #comp-jqbwo704 select,
  body.wix-static-export #comp-jqbwo704 button[type="submit"] {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-j8pza50e,
  body.wix-static-export #comp-jsh29kfc {
    padding-inline: 0 !important;
  }
}

/* --- G-8f gosaki mobile visual refinement (site-specific) --- */

/* Link page: flat modern panel (PC + SP) */
body.wix-static-export #comp-juctbpem {
  --rd: 0 !important;
  --shd: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

body.wix-static-export #comp-juctbpem .LNYVZi,
body.wix-static-export #comp-juctbpem [data-testid="colorUnderlay"] {
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* Contact: hide Wix form success message until HubSpot replacement */
body.wix-static-export #comp-kei80gar {
  display: none !important;
}

@media (max-width: 768px) {
  /* Home KV: large cover hero, trim gap below */
  body.wix-static-export #comp-lol1i5k0 {
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;
    overflow: hidden;
  }

  body.wix-static-export #comp-lol1i5k0 [data-mesh-id$="inlineContent-gridContainer"] {
    padding: 0 !important;
    margin: 0 !important;
    gap: 0 !important;
  }

  body.wix-static-export #comp-mbl1cpz3 {
    width: 100vw !important;
    max-width: 100vw !important;
    margin-left: calc(50% - 50vw) !important;
    margin-right: calc(50% - 50vw) !important;
    left: auto !important;
    height: clamp(220px, 55vw, 420px) !important;
    overflow: hidden;
  }

  body.wix-static-export #comp-mbl1cpz3 .apPOZK,
  body.wix-static-export #comp-mbl1cpz3 .wixui-image,
  body.wix-static-export #comp-mbl1cpz3 img {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    object-fit: cover !important;
    object-position: center center;
    display: block;
  }

  body.wix-static-export [data-mesh-id="ContainermainPageinlineContent-gridContainer"] {
    gap: 0 !important;
  }

  body.wix-static-export #comp-m8y3dzb6 {
    margin-top: 0 !important;
    padding-top: 1rem !important;
  }

  /* Header: vertical center logo + menu */
  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    align-items: center !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc,
  body.wix-static-export #SITE_HEADER #comp-mbdw7xid {
    align-self: center !important;
  }

  body.wix-static-export #SITE_HEADER .site-logo-link {
    display: flex !important;
    align-items: center !important;
    align-self: center !important;
  }

  body.wix-static-export #SITE_HEADER .site-logo-link h1 {
    margin: 0 !important;
  }

  /* Footer: center SNS + copyright */
  body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    padding: 1.5rem 1.25rem !important;
    gap: 0.75rem !important;
  }

  body.wix-static-export #SITE_FOOTER #LnkBr2,
  body.wix-static-export #SITE_FOOTER #WRchTxtx {
    width: 100% !important;
    max-width: 100% !important;
    left: auto !important;
    margin: 0 auto !important;
    text-align: center !important;
  }

  body.wix-static-export #SITE_FOOTER #LnkBr2 .tN_ggS {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 0.75rem !important;
    padding: 0 !important;
  }

  body.wix-static-export #SITE_FOOTER #WRchTxtx,
  body.wix-static-export #SITE_FOOTER #WRchTxtx p {
    text-align: center !important;
  }

  /* Discography: tighter vertical rhythm */
  body.wix-static-export #comp-jqy0szge {
    margin: 1.25rem 0 0.75rem !important;
  }

  body.wix-static-export #comp-llexymel {
    padding-bottom: 1.5rem !important;
  }

  body.wix-static-export [id^="comp-llexymga__"]:not([id$="inlineContent"]):not([id$="gridContainer"]) {
    margin-bottom: 1.5rem !important;
    padding: 0.875rem 0.75rem !important;
  }

  body.wix-static-export [data-mesh-id^="comp-llexymga__"][data-mesh-id$="inlineContent-gridContainer"] {
    gap: 0.625rem !important;
    padding: 0.75rem !important;
  }

  body.wix-static-export [id^="comp-lley9r5x__"] {
    padding-bottom: 0.125rem !important;
  }
}
`;
}
