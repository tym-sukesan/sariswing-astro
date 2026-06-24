/**
 * Gosaki-piano site-specific Wix static export CSS overrides (G-8c … G-8g8).
 * Brand colors, home hero comp, About / Discography / Contact mobile parity — not for other Wix pilots.
 */

export const GOSAKI_PIANO_SITE_SLUG = "gosaki-piano";

/**
 * @param {{ siteSlug?: string }} [options]
 */
export function buildGosakiPianoSiteOverridesCss(options = {}) {
  const slug = options.siteSlug ?? GOSAKI_PIANO_SITE_SLUG;
  if (slug !== GOSAKI_PIANO_SITE_SLUG) return "";

  const svgMaskUri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  const snsIconMask = {
    facebook: svgMaskUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M9.197 24V14.477H6.196V9.956h3.001V6.559c0-3.004 1.798-4.664 4.532-4.664 1.311 0 2.637.235 2.637.235v2.948h-2.487c-2.459 0-3.224 1.526-3.224 3.093v3.715h5.491l-.877 4.521H9.197V24z"/></svg>',
    ),
    x: svgMaskUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    ),
    instagram: svgMaskUri(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000" d="M12 7.2a4.8 4.8 0 100 9.6 4.8 4.8 0 000-9.6zm0-2.4c3.2 0 3.6.012 4.85.07 1.7.078 2.57.372 3.17.786.602.414 1.076.888 1.49 1.49.414.6.708 1.47.786 3.17.058 1.25.07 1.65.07 4.85s-.012 3.6-.07 4.85c-.078 1.7-.372 2.57-.786 3.17a5.8 5.8 0 01-1.49 1.49c-.6.414-1.47.708-3.17.786-1.25.058-1.65.07-4.85.07s-3.6-.012-4.85-.07c-1.7-.078-2.57-.372-3.17-.786a5.8 5.8 0 01-1.49-1.49c-.414-.6-.708-1.47-.786-3.17C3.612 15.6 3.6 15.2 3.6 12s.012-3.6.07-4.85c.078-1.7.372-2.57.786-3.17.414-.602.888-1.076 1.49-1.49.6-.414 1.47-.708 3.17-.786C8.4 3.612 8.8 3.6 12 3.6zm0 1.44c-3.15 0-3.52.012-4.75.068-1.15.052-1.78.248-2.2.412-.55.214-.94.47-1.35.88-.41.41-.666.8-.88 1.35-.164.42-.36 1.05-.412 2.2-.056 1.23-.068 1.6-.068 4.75s.012 3.52.068 4.75c.052 1.15.248 1.78.412 2.2.214.55.47.94.88 1.35.41.41.8.666 1.35.88.42.164 1.05.36 2.2.412 1.23.056 1.6.068 4.75.068s3.52-.012 4.75-.068c1.15-.052 1.78-.248 2.2-.412a3.6 3.6 0 001.35-.88 3.6 3.6 0 00.88-1.35c.164-.42.36-1.05.412-2.2.056-1.23.068-1.6.068-4.75s-.012-3.52-.068-4.75c-.052-1.15-.248-1.78-.412-2.2a3.6 3.6 0 00-.88-1.35 3.6 3.6 0 00-1.35-.88c-.42-.164-1.05-.36-2.2-.412C15.52 5.052 15.15 5.04 12 5.04zm0 2.784a4.176 4.176 0 110 8.352 4.176 4.176 0 010-8.352zm6.624-1.584a.96.96 0 110 1.92.96.96 0 010-1.92z"/></svg>',
    ),
  };

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
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
}

body.wix-static-export #SITE_HEADER .nav-toggle__bar {
  background: #9e3b1b;
}

body.wix-static-export #SITE_HEADER .global-nav {
  background: transparent;
}

body.wix-static-export #SITE_HEADER .global-nav a {
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
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

  body.wix-static-export #comp-jqbwo704,
  body.wix-static-export .gosaki-contact-hubspot-embed {
    width: 100% !important;
    padding: 0 0.5rem !important;
    box-sizing: border-box;
  }

  body.wix-static-export #comp-jqbwo704 form,
  body.wix-static-export #comp-jqbwo704 [data-hook="form"],
  body.wix-static-export .gosaki-contact-hubspot-embed .hs-form-frame {
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
  body.wix-static-export #comp-jqbwo704,
  body.wix-static-export .gosaki-contact-hubspot-embed {
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
  body.wix-static-export #comp-jqbwo704 fieldset,
  body.wix-static-export .gosaki-contact-hubspot-embed .hs-form-frame {
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

/* --- G-8g gosaki header/footer mobile regression fix (site-specific) --- */

/* Footer: reset desktop mesh offsets + modern SNS icons (all widths) */
body.wix-static-export #SITE_FOOTER #LnkBr2,
body.wix-static-export #SITE_FOOTER #WRchTxtx {
  position: relative !important;
  left: 0 !important;
  right: auto !important;
  margin-left: auto !important;
  margin-right: auto !important;
  transform: none !important;
  width: 100% !important;
  max-width: 100% !important;
  text-align: center !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 {
  display: flex !important;
  justify-content: center !important;
  height: auto !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .tN_ggS {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 0.75rem !important;
  width: auto !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  padding: 0 !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .re13Ik {
  margin: 0 !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .twXk19 {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 44px !important;
  height: 44px !important;
  position: relative !important;
  border-radius: 50%;
  transition: opacity 0.15s ease;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .twXk19:hover {
  opacity: 0.75;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .twXk19 img {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Facebook"]::before,
body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label^="X"]::before,
body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Instagram"]::before {
  content: "";
  display: block;
  width: 22px;
  height: 22px;
  background-color: #7a6f65;
  -webkit-mask: center / contain no-repeat;
  mask: center / contain no-repeat;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Facebook"]::before {
  -webkit-mask-image: ${snsIconMask.facebook};
  mask-image: ${snsIconMask.facebook};
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label^="X"]::before {
  -webkit-mask-image: ${snsIconMask.x};
  mask-image: ${snsIconMask.x};
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Instagram"]::before {
  -webkit-mask-image: ${snsIconMask.instagram};
  mask-image: ${snsIconMask.instagram};
}

body.wix-static-export #SITE_FOOTER #WRchTxtx p {
  text-align: center !important;
}

/* PC header: restore horizontal nav, hide hamburger */
@media (min-width: 769px) {
  body.wix-static-export #SITE_HEADER {
    --bg-overlay-color: rgb(255, 252, 204) !important;
    background-color: #fffccc !important;
  }

  body.wix-static-export #SITE_HEADER .LNYVZi,
  body.wix-static-export #SITE_HEADER [data-testid="colorUnderlay"] {
    opacity: 1 !important;
    background-color: #fffccc !important;
  }

  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 1rem !important;
    padding: 0.75rem calc((100% - 980px) * 0.5) !important;
    min-height: 5.5rem;
    box-sizing: border-box;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc,
  body.wix-static-export #SITE_HEADER #comp-mbdw7xid {
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    margin: 0 !important;
    width: auto !important;
    max-width: none !important;
    grid-area: auto !important;
    justify-self: auto !important;
    align-self: center !important;
    flex: 0 0 auto;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw7xid,
  body.wix-static-export #SITE_HEADER [id^="comp-"]:has(.global-nav) {
    flex: 1 1 auto !important;
    width: auto !important;
    max-width: none !important;
    justify-content: flex-end !important;
  }

  body.wix-static-export #SITE_HEADER .nav-toggle {
    display: none !important;
  }

  body.wix-static-export #SITE_HEADER .global-nav {
    display: block !important;
    width: auto !important;
    margin-top: 0 !important;
    padding: 0 !important;
  }

  body.wix-static-export #SITE_HEADER .global-nav ul {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    justify-content: flex-end !important;
    align-items: center !important;
    gap: 0.25rem 0.5rem !important;
  }

  body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    padding: 1.5rem calc((100% - 980px) * 0.5) !important;
    gap: 0.75rem !important;
  }
}

@media (max-width: 768px) {
  /* SP header: opaque sticky bar */
  body.wix-static-export #SITE_HEADER {
    --bg-overlay-color: rgb(255, 252, 204) !important;
    background-color: #fffccc !important;
  }

  body.wix-static-export #SITE_HEADER .uZIV9d,
  body.wix-static-export #SITE_HEADER .LNYVZi,
  body.wix-static-export #SITE_HEADER [data-testid="colorUnderlay"] {
    opacity: 1 !important;
    background-color: #fffccc !important;
  }

  /* SP nav: hamburger visible, panel hidden until open */
  body.wix-static-export #SITE_HEADER .nav-toggle {
    display: inline-flex !important;
  }

  body.wix-static-export #SITE_HEADER .global-nav {
    display: none !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav {
    display: block !important;
  }

  /* SP nav open: keep logo + toggle vertically centered on row 1 */
  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    align-items: center !important;
    flex-wrap: nowrap !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw7xid {
    align-self: center !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    flex-wrap: wrap !important;
    align-items: center !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open #comp-mbdw9tzc {
    order: 1 !important;
    flex: 1 1 auto !important;
    width: auto !important;
    max-width: calc(100% - 5.5rem) !important;
    align-self: center !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open #comp-mbdw7xid {
    order: 2 !important;
    flex: 0 0 auto !important;
    width: auto !important;
    align-self: center !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav {
    order: 3 !important;
    flex: 1 1 100% !important;
    width: 100% !important;
    margin-top: 0.5rem !important;
  }

  /* Discography: tighter vertical rhythm (supersedes G-8d/G-8f) */
  body.wix-static-export #comp-jqy0szge {
    margin: 0.75rem 0 0.375rem !important;
  }

  body.wix-static-export #comp-llexymel {
    padding: 0 1rem 0.75rem !important;
  }

  body.wix-static-export [id^="comp-llexymga__"]:not([id$="inlineContent"]):not([id$="gridContainer"]) {
    margin-bottom: 0.875rem !important;
    padding: 0.5rem 0.75rem !important;
  }

  body.wix-static-export [data-mesh-id^="comp-llexymga__"][data-mesh-id$="inlineContent-gridContainer"] {
    gap: 0.375rem !important;
    padding: 0.5rem !important;
  }

  body.wix-static-export [id^="comp-jshobkm1__"] {
    margin-bottom: 0.25rem !important;
  }

  body.wix-static-export [id^="comp-lley9r5x__"] {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    margin-bottom: 0.25rem !important;
  }

  body.wix-static-export [id^="comp-lley4qy2__"] {
    margin-top: 0.25rem !important;
    padding-top: 0 !important;
  }
}

/* --- G-8g1 gosaki mobile header and footer social regression fix (site-specific) --- */
/* Supersedes G-8g yellow (#fffccc) header, nav-open layout, and broken SNS mask icons. */

/* Site header beige — Wix color_42 is rgb(224,190,154); use natural opaque beige */
body.wix-static-export #SITE_HEADER {
  --bg-overlay-color: rgb(234, 215, 189) !important;
  background-color: #ead7bd !important;
}

body.wix-static-export #SITE_HEADER .uZIV9d,
body.wix-static-export #SITE_HEADER .LNYVZi,
body.wix-static-export #SITE_HEADER [data-testid="colorUnderlay"] {
  opacity: 1 !important;
  background-color: #ead7bd !important;
}

body.wix-static-export #SITE_HEADER .global-nav {
  background: #fff !important;
  border: 0 solid #9e3b1b;
}

/* Footer SNS: text links instead of broken CSS mask icons */
body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Facebook"]::before,
body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label^="X"]::before,
body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Instagram"]::before {
  content: none !important;
  display: none !important;
  mask: none !important;
  -webkit-mask: none !important;
  mask-image: none !important;
  -webkit-mask-image: none !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .twXk19 {
  display: inline !important;
  width: auto !important;
  height: auto !important;
  min-width: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  position: static !important;
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  text-decoration: none;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .twXk19 img {
  display: none !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a::after {
  color: #6b5a50;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  text-decoration: none;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Facebook"]::after {
  content: "Facebook";
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label^="X"]::after {
  content: "X";
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a[aria-label="Instagram"]::after {
  content: "Instagram";
}

body.wix-static-export #SITE_FOOTER #LnkBr2 a:hover::after {
  opacity: 0.75;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .tN_ggS {
  gap: 1.25rem !important;
  margin-bottom: 0.25rem !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 {
  height: auto !important;
  min-height: 0 !important;
  margin-bottom: 0.25rem !important;
}

body.wix-static-export #SITE_FOOTER #WRchTxtx {
  height: auto !important;
  min-height: 0 !important;
  margin-top: 0.5rem !important;
  padding-top: 0.25rem !important;
}

body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.75rem !important;
  height: auto !important;
  min-height: 0 !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2,
body.wix-static-export #SITE_FOOTER #WRchTxtx {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  grid-area: auto !important;
  flex: 0 0 auto !important;
}

@media (max-width: 768px) {
  /* SP header row 1: logo left / hamburger right; nav drops as row 2 overlay */
  body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
    position: relative !important;
    box-sizing: border-box;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc {
    flex: 1 1 auto !important;
    order: 1 !important;
    align-self: center !important;
    max-width: calc(100% - 5.5rem) !important;
    width: auto !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw7xid {
    flex: 0 0 auto !important;
    width: auto !important;
    max-width: none !important;
    order: 2 !important;
    align-self: center !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
  }

  /* Override G-8d nav-open full-width nav comp shift */
  body.wix-static-export #SITE_HEADER.is-nav-open #comp-mbdw7xid {
    flex: 0 0 auto !important;
    width: auto !important;
    order: 2 !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
    flex-wrap: nowrap !important;
    align-items: center !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open #comp-mbdw9tzc {
    order: 1 !important;
    flex: 1 1 auto !important;
    align-self: center !important;
    max-width: calc(100% - 5.5rem) !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    flex: none !important;
    order: unset !important;
    margin-top: 0 !important;
    padding: 0.35rem 0 0.75rem !important;
    background: #fff !important;
    box-sizing: border-box;
    z-index: 2;
    box-shadow: 0 2px 6px rgba(91, 77, 67, 0.08);
  }

  body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
    padding: 1.25rem 1rem 1.5rem !important;
    gap: 1rem !important;
  }
}

/* --- G-8g2 gosaki header nav functionality fix (site-specific) --- */
/* SP nav toggle: ensure is-nav-open reveals panel; header overflow visible for dropdown. */

body.wix-static-export #SITE_HEADER {
  overflow: visible !important;
}

body.wix-static-export #SITE_HEADER .XKFSfx,
body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent"],
body.wix-static-export #SITE_HEADER [data-mesh-id="SITE_HEADERinlineContent-gridContainer"] {
  overflow: visible !important;
}

body.wix-static-export #SITE_HEADER .nav-toggle {
  position: relative;
  z-index: 5;
  pointer-events: auto;
  cursor: pointer;
}

@media (max-width: 768px) {
  body.wix-static-export #SITE_HEADER .global-nav {
    display: none !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0.35rem 0 0.75rem !important;
    background: #fff !important;
    box-sizing: border-box;
    z-index: 4;
    box-shadow: 0 2px 6px rgba(91, 77, 67, 0.08);
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav ul {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100% !important;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open #comp-mbdw7xid {
    position: static !important;
  }
}

/* --- G-8g3 gosaki schedule hub design and link fix (site-specific) --- */

body.wix-static-export .gosaki-schedule-hub {
  max-width: 860px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 3rem;
  text-align: center;
  box-sizing: border-box;
}

body.wix-static-export .gosaki-schedule-hub__title {
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  font-size: clamp(28px, 7vw, 45px);
  font-weight: normal;
  color: #5b4d43;
  letter-spacing: 0.05em;
  margin: 0 0 2rem;
  line-height: 1.25;
}

body.wix-static-export .gosaki-schedule-months {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

body.wix-static-export .gosaki-schedule-month-link {
  display: block;
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  font-size: 1.125rem;
  letter-spacing: 0.08em;
  color: #5b4d43;
  text-decoration: none;
  background: #fff;
  border: 1px solid #e0be9a;
  border-radius: 4px;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease;
}

body.wix-static-export .gosaki-schedule-month-link:hover {
  background: #ead7bd;
  color: #993500;
}

@media (max-width: 768px) {
  body.wix-static-export .gosaki-schedule-hub {
    padding: 1.75rem 1.25rem 2.5rem;
  }

  body.wix-static-export .gosaki-schedule-months {
    max-width: 100%;
  }
}

/* --- G-8g4 gosaki schedule month content fix (site-specific) --- */

body.wix-static-export .gosaki-schedule-month {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Wix fluid-columns-repeater SSR: visibility:hidden until Thunderbolt JS — show in static export */
body.wix-static-export fluid-columns-repeater,
body.wix-static-export .gosaki-schedule-month-repeater {
  visibility: visible !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 1.5rem !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  pointer-events: auto !important;
}

body.wix-static-export .gosaki-schedule-event-card {
  display: block !important;
  position: relative !important;
  width: 100% !important;
  max-width: 720px !important;
  margin: 0 auto !important;
  padding: 1.25rem 1.5rem !important;
  background: #fff;
  border: 1px solid #e0be9a;
  border-radius: 6px;
  box-sizing: border-box;
  overflow: hidden;
}

body.wix-static-export .gosaki-schedule-event-card [data-mesh-id],
body.wix-static-export .gosaki-schedule-event-card [data-mesh-id] > * {
  position: static !important;
  left: auto !important;
  right: auto !important;
  top: auto !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: auto !important;
  max-width: 100% !important;
  grid-area: auto !important;
  justify-self: stretch !important;
  align-self: stretch !important;
}

body.wix-static-export .gosaki-schedule-event-date,
body.wix-static-export .gosaki-schedule-event-card .gosaki-schedule-event-date {
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif !important;
  font-size: clamp(1.125rem, 4vw, 1.625rem) !important;
  font-weight: normal !important;
  color: #993500 !important;
  letter-spacing: 0.04em;
  margin: 0 0 0.625rem !important;
  line-height: 1.3 !important;
}

body.wix-static-export .gosaki-schedule-event-body,
body.wix-static-export .gosaki-schedule-event-card .gosaki-schedule-event-body {
  font-family: "ｍｓ ゴシック", "ms gothic", "ヒラギノ角ゴ pro w3", "hiragino kaku gothic pro",
    osaka, sans-serif !important;
  font-size: 0.95rem !important;
  line-height: 1.65 !important;
  color: #5b4d43 !important;
  margin: 0 0 0.35rem !important;
  word-break: break-word;
  overflow-wrap: anywhere;
}

body.wix-static-export .gosaki-schedule-event-body a {
  color: #993500;
  text-decoration: underline;
}

body.wix-static-export .gosaki-schedule-month .wixui-rich-text h2,
body.wix-static-export .gosaki-schedule-month h2.font_2 {
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  font-size: clamp(28px, 7vw, 45px);
  font-weight: normal;
  color: #5b4d43;
  text-align: center;
  letter-spacing: 0.05em;
  margin: 0 0 2rem;
  line-height: 1.25;
}

@media (max-width: 768px) {
  body.wix-static-export .gosaki-schedule-month {
    padding: 1.25rem 1rem 2.5rem;
  }

  body.wix-static-export .gosaki-schedule-event-card {
    padding: 1rem 1.125rem !important;
    max-width: 100% !important;
  }
}

/* --- G-8g5 gosaki discography spacing and footer social alignment fix (site-specific) --- */

/* Footer SNS text links: true center + even gap (supersedes G-8g/G-8g1 width constraints) */
body.wix-static-export #SITE_FOOTER #LnkBr2 {
  width: fit-content !important;
  max-width: 100% !important;
  margin-left: auto !important;
  margin-right: auto !important;
  left: 0 !important;
  right: auto !important;
  height: auto !important;
  min-height: 0 !important;
  --item-margin-inline: 0 !important;
  --item-display: flex !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .tN_ggS,
body.wix-static-export #SITE_FOOTER #LnkBr2 .gosaki-footer-social-text {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 1.4rem !important;
  width: fit-content !important;
  max-width: 100% !important;
  margin-inline: auto !important;
  padding: 0 !important;
  list-style: none !important;
  text-align: center !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .re13Ik {
  margin: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
  display: flex !important;
  justify-content: center !important;
}

body.wix-static-export #SITE_FOOTER #LnkBr2 .twXk19 {
  margin: 0 !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap !important;
}

body.wix-static-export #SITE_FOOTER #WRchTxtx {
  width: 100% !important;
  max-width: 100% !important;
  margin-left: auto !important;
  margin-right: auto !important;
  left: 0 !important;
  text-align: center !important;
}

@media (max-width: 768px) {
  /* Discography SP: collapse Wix desktop grid margins / fixed image height */
  body.wix-static-export #comp-llexymel [id^="comp-llexymga__"]:not([id$="inlineContent"]):not(
      [id$="gridContainer"]
    ) {
    min-height: auto !important;
    height: auto !important;
  }

  body.wix-static-export
    #comp-llexymel
    [data-mesh-id^="comp-llexymga__"][data-mesh-id$="inlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: column !important;
    grid-template-rows: none !important;
    min-height: auto !important;
    height: auto !important;
    gap: 0.5rem !important;
    align-items: stretch !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-jshobkm1__"] {
    order: 1 !important;
    margin: 0 auto 0.5rem !important;
    padding: 0 !important;
    left: auto !important;
    top: auto !important;
    --height: auto !important;
    --width: auto !important;
    min-height: 0 !important;
    height: auto !important;
    max-height: none !important;
    align-self: center !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-jshobkm1__"] .wixui-image,
  body.wix-static-export #comp-llexymel [id^="comp-jshobkm1__"] img {
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    margin-bottom: 0 !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-lley9r5x__"] {
    order: 2 !important;
    margin: 0.375rem 0 0.5rem !important;
    padding: 0 !important;
    left: auto !important;
    top: auto !important;
    align-self: center !important;
    text-align: center !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-lley4qy2__"] {
    order: 3 !important;
    margin: 0.25rem 0 !important;
    left: auto !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-lley693e__"] {
    order: 4 !important;
    margin: 0.25rem 0 !important;
    left: auto !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-llez4vdq__"] {
    order: 5 !important;
    margin: 0.25rem 0 !important;
    left: auto !important;
  }

  body.wix-static-export #comp-llexymel [data-mesh-id^="comp-llexymga__"] > * {
    position: relative !important;
    grid-area: auto !important;
    justify-self: stretch !important;
    align-self: stretch !important;
  }
}

/* --- G-8g6 gosaki footer social final alignment fix (site-specific) --- */
/* Injected .gosaki-footer-social-links in Footer.astro; hide legacy Wix #LnkBr2 bar. */

body.wix-static-export #SITE_FOOTER #LnkBr2 {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}

body.wix-static-export #SITE_FOOTER .gosaki-footer-social-links {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 1.5rem !important;
  flex-wrap: wrap !important;
  width: fit-content !important;
  max-width: calc(100% - 2rem) !important;
  margin: 0.5rem auto 1rem !important;
  padding: 0 !important;
  text-align: center !important;
  position: relative !important;
  left: auto !important;
  grid-area: auto !important;
}

body.wix-static-export #SITE_FOOTER .gosaki-footer-social-links a {
  color: #6b5a50 !important;
  text-decoration: none !important;
  font-family: "Avenir Next", "Helvetica Neue", Arial, sans-serif;
  font-size: 0.95rem !important;
  letter-spacing: 0.04em;
  white-space: nowrap !important;
  line-height: 1.4 !important;
}

body.wix-static-export #SITE_FOOTER .gosaki-footer-social-links a:hover {
  opacity: 0.75;
}

body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  height: auto !important;
  min-height: 0 !important;
}

body.wix-static-export #SITE_FOOTER #WRchTxtx {
  position: relative !important;
  left: auto !important;
  top: auto !important;
  grid-area: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  padding: 0.25rem 1rem 0.75rem !important;
  text-align: center !important;
  height: auto !important;
  min-height: 0 !important;
}

body.wix-static-export #SITE_FOOTER #WRchTxtx p {
  text-align: inherit !important;
  margin: 0 !important;
}

@media (min-width: 769px) {
  body.wix-static-export #SITE_FOOTER #WRchTxtx {
    text-align: right !important;
    max-width: 980px !important;
    padding-right: 1.5rem !important;
  }
}

/* --- G-8g7 gosaki footer grid container alignment fix (site-specific) --- */
/* Reset Wix mesh left:415px / left:766px on footer children; center SNS + copyright (PC/SP). */

body.wix-static-export #SITE_FOOTER {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  left: auto !important;
  right: auto !important;
  overflow: visible !important;
}

body.wix-static-export #SITE_FOOTER .XKFSfx,
body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent"],
body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 auto !important;
  left: auto !important;
  right: auto !important;
  transform: none !important;
  position: relative !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  box-sizing: border-box !important;
  grid-template-columns: none !important;
  grid-template-rows: none !important;
  padding-left: 1rem !important;
  padding-right: 1rem !important;
}

body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
  gap: 0.75rem !important;
  height: auto !important;
  min-height: 0 !important;
  padding-top: 1rem !important;
  padding-bottom: 1rem !important;
}

body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] > *,
body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] > interact-element > * {
  position: relative !important;
  left: auto !important;
  right: auto !important;
  top: auto !important;
  margin: 0 auto !important;
  grid-area: auto !important;
  justify-self: center !important;
  align-self: center !important;
  transform: none !important;
}

body.wix-static-export #SITE_FOOTER .gosaki-footer-social-links {
  margin: 0 auto 0.75rem !important;
}

body.wix-static-export #SITE_FOOTER #WRchTxtx {
  width: 100% !important;
  max-width: 100% !important;
  left: auto !important;
  right: auto !important;
  margin: 0 auto !important;
  padding: 0.25rem 1rem 0.75rem !important;
  text-align: center !important;
}

body.wix-static-export #SITE_FOOTER #WRchTxtx p {
  text-align: center !important;
  margin: 0 !important;
}

@media (min-width: 769px) {
  body.wix-static-export #SITE_FOOTER [data-mesh-id="SITE_FOOTERinlineContent-gridContainer"] {
    padding-left: 1.5rem !important;
    padding-right: 1.5rem !important;
  }

  body.wix-static-export #SITE_FOOTER #WRchTxtx {
    text-align: center !important;
    max-width: 100% !important;
    padding-right: 1rem !important;
  }
}

/* --- G-8g8 gosaki discography subheading style fix (site-specific) --- */
/* Track List / Personnel: Wix inline text-decoration:underline on first paragraph only. */

body.wix-static-export #comp-llexymel [id^="comp-lley4qy2__"] > p:first-of-type,
body.wix-static-export #comp-llexymel [id^="comp-lley693e__"] > p:first-of-type {
  margin-bottom: 0.375rem !important;
}

body.wix-static-export #comp-llexymel [id^="comp-lley4qy2__"] > p:first-of-type .wixui-rich-text__text,
body.wix-static-export #comp-llexymel [id^="comp-lley693e__"] > p:first-of-type .wixui-rich-text__text {
  text-decoration: none !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  line-height: 1.45 !important;
}

@media (max-width: 768px) {
  body.wix-static-export #comp-llexymel [id^="comp-lley4qy2__"] > p:first-of-type .wixui-rich-text__text,
  body.wix-static-export #comp-llexymel [id^="comp-lley693e__"] > p:first-of-type .wixui-rich-text__text {
    font-size: calc(14px + 2px) !important;
  }
}

/* --- G-9b3 gosaki avenir-next typography regression fix (site-specific) --- */
/*
 * G-9b2 Avenir Next is wider than the original Wix display face inside fixed-width
 * title boxes (e.g. #comp-jqy0szge { width: 199px }). Relax PC title width + nowrap
 * on page titles only. Wix class cleanup (wixui-rich-text__text etc.) is deferred.
 */

@media (min-width: 769px) {
  body.wix-static-export #comp-jqy0szge,
  body.wix-static-export #WRchTxt16,
  body.wix-static-export #WRchTxt4 {
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    text-align: center !important;
    margin-left: auto !important;
    margin-right: auto !important;
    left: auto !important;
    right: auto !important;
    justify-self: center !important;
  }

  body.wix-static-export #comp-jqy0szge h4,
  body.wix-static-export #comp-jqy0szge .font_4,
  body.wix-static-export #comp-jqy0szge > .wixui-rich-text__text,
  body.wix-static-export #comp-jqy0szge h4 .wixui-rich-text__text,
  body.wix-static-export #WRchTxt16 h4,
  body.wix-static-export #WRchTxt16 .font_4,
  body.wix-static-export #WRchTxt16 > .wixui-rich-text__text,
  body.wix-static-export #WRchTxt16 h4 .wixui-rich-text__text,
  body.wix-static-export #WRchTxt4 h4,
  body.wix-static-export #WRchTxt4 .font_4,
  body.wix-static-export #WRchTxt4 > .wixui-rich-text__text,
  body.wix-static-export #WRchTxt4 h4 .wixui-rich-text__text {
    white-space: nowrap !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc h1,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc h1 .wixui-rich-text__text,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc .site-logo-link {
    white-space: nowrap !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
  }

  body.wix-static-export #SITE_HEADER .global-nav a {
    white-space: nowrap !important;
  }

  body.wix-static-export .gosaki-schedule-hub__title,
  body.wix-static-export .gosaki-schedule-month h2.font_2,
  body.wix-static-export .gosaki-schedule-month .gosaki-schedule-event-date {
    white-space: nowrap !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
  }

  body.wix-static-export #comp-llexymel [id^="comp-lley4qy2__"] > p:first-of-type .wixui-rich-text__text,
  body.wix-static-export #comp-llexymel [id^="comp-lley693e__"] > p:first-of-type .wixui-rich-text__text {
    white-space: nowrap !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
  }
}

@media (max-width: 768px) {
  body.wix-static-export #comp-jqy0szge .wixui-rich-text__text,
  body.wix-static-export #WRchTxt16 .wixui-rich-text__text,
  body.wix-static-export #WRchTxt4 .wixui-rich-text__text,
  body.wix-static-export .gosaki-schedule-hub__title,
  body.wix-static-export .gosaki-schedule-month h2.font_2 {
    overflow-wrap: normal !important;
    word-break: normal !important;
  }

  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc h1,
  body.wix-static-export #SITE_HEADER #comp-mbdw9tzc h1 .wixui-rich-text__text {
    overflow-wrap: normal !important;
    word-break: normal !important;
  }
}

/* G-9c0b gosaki schedule legacy month route stub */
body.wix-static-export .gosaki-schedule-legacy-stub {
  max-width: 40rem;
  margin: 3rem auto;
  padding: 0 1.25rem;
  text-align: center;
}

body.wix-static-export .gosaki-schedule-legacy-stub__title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

body.wix-static-export .gosaki-schedule-legacy-stub__message {
  margin-bottom: 1.25rem;
}

body.wix-static-export .gosaki-schedule-legacy-stub__link {
  font-weight: 600;
  text-decoration: underline;
}

/* --- G-10e gosaki YouTube embed section layout improvement (site-specific) --- */
/* Section sits inside Wix schedule mesh; break out to centered 720px card with 16:9 iframe. */
body.wix-static-export .gosaki-youtube-embed {
  width: 100% !important;
  max-width: 720px !important;
  margin: 3rem auto 3.5rem !important;
  padding: 0 1.25rem !important;
  box-sizing: border-box !important;
  display: block !important;
  float: none !important;
  clear: both !important;
  min-width: 0 !important;
  grid-column: 1 / -1 !important;
  justify-self: center !important;
}

body.wix-static-export .gosaki-youtube-embed__inner {
  width: 100% !important;
  max-width: 720px !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
}

body.wix-static-export .gosaki-youtube-embed__media {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  aspect-ratio: 16 / 9 !important;
}

body.wix-static-export .gosaki-youtube-embed__iframe {
  width: 100% !important;
  height: 100% !important;
}

body.wix-static-export [data-mesh-id*="inlineContent-gridContainer"]:has(.gosaki-youtube-embed),
body.wix-static-export [data-mesh-id*="inlineContent"]:has(.gosaki-youtube-embed) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

@media (max-width: 768px) {
  body.wix-static-export .gosaki-youtube-embed {
    max-width: 100% !important;
    margin: 2rem auto 2.5rem !important;
    padding: 0 1rem !important;
    overflow-x: clip !important;
  }

  body.wix-static-export .gosaki-youtube-embed__inner {
    max-width: 100% !important;
  }
}

/* --- G-10g2 gosaki contact HubSpot PC layout fix (site-specific) --- */
/*
 * Original Wix mesh placed photo (#comp-jsh29kfc) and form (#comp-jqbwo704) in the
 * same grid row with left offsets. HubSpot replacement drops those mesh rules, so
 * restore a 2-column grid on desktop: photo left, form right; intro above form column.
 */

@media (min-width: 769px) {
  body.wix-static-export #comp-lol1i5gq [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"] {
    display: grid !important;
    grid-template-columns: minmax(209px, 360px) minmax(320px, 640px) !important;
    grid-template-rows: auto auto minmax(0, 1fr) !important;
    column-gap: 48px !important;
    row-gap: 0 !important;
    max-width: 980px !important;
    width: 100% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding-bottom: 2.5rem !important;
    box-sizing: border-box !important;
  }

  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > #WRchTxt4,
  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > interact-element
    > #WRchTxt4 {
    grid-column: 1 / -1 !important;
    grid-row: 1 !important;
    left: auto !important;
    margin-left: 0 !important;
    justify-self: center !important;
  }

  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > #comp-j8pza50e,
  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > interact-element
    > #comp-j8pza50e {
    grid-column: 2 / 3 !important;
    grid-row: 2 !important;
    left: auto !important;
    margin-left: 0 !important;
    justify-self: start !important;
    max-width: 288px !important;
  }

  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > #comp-jsh29kfc,
  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > interact-element
    > #comp-jsh29kfc {
    grid-column: 1 !important;
    grid-row: 3 !important;
    left: auto !important;
    margin-left: 0 !important;
    margin-top: 0 !important;
    width: auto !important;
    max-width: 360px !important;
    align-self: start !important;
  }

  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > #gosaki-contact-hubspot-embed,
  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > interact-element
    > #gosaki-contact-hubspot-embed,
  body.wix-static-export
    #comp-lol1i5gq
    [data-mesh-id="comp-lol1i5gqinlineContent-gridContainer"]
    > .gosaki-contact-hubspot-embed {
    grid-column: 2 !important;
    grid-row: 3 !important;
    left: auto !important;
    margin-left: 0 !important;
    margin-top: 0 !important;
    width: 100% !important;
    max-width: 640px !important;
    align-self: start !important;
    box-sizing: border-box !important;
  }

  body.wix-static-export .gosaki-contact-hubspot-embed .hs-form-frame {
    width: 100% !important;
    max-width: 100% !important;
  }
}
`;
}
