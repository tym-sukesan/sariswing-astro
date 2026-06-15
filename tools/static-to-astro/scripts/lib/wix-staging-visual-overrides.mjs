/**
 * Wix live-crawl static export visual overrides (G-7i).
 * Appended to global.css when inline head styles are ingested (Wix crawl).
 */

/**
 * @param {{ siteSlug?: string }} [options]
 */
export function buildWixStagingVisualOverridesCss(options = {}) {
  const slug = options.siteSlug ?? "gosaki-piano";
  void slug;

  return `/* --- Wix static export visual overrides (G-7i / G-7i2) --- */

/* Without #masterPage.mesh-layout, header/footer bg wrappers anchor to the viewport */
body.wix-static-export #SITE_HEADER,
body.wix-static-export #SITE_FOOTER {
  position: relative;
  z-index: auto;
  isolation: isolate;
  overflow: hidden;
}

body.wix-static-export #SITE_HEADER .uZIV9d,
body.wix-static-export #SITE_FOOTER .uZIV9d {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-height: 100%;
  pointer-events: none;
  overflow: hidden;
}

body.wix-static-export #SITE_FOOTER [id^="bgLayers_"],
body.wix-static-export #SITE_HEADER [id^="bgLayers_"] {
  pointer-events: none;
}

body.wix-static-export #SITE_FOOTER [data-testid="colorUnderlay"],
body.wix-static-export #SITE_HEADER [data-testid="colorUnderlay"] {
  pointer-events: none;
}

body.wix-static-export #SITE_FOOTER .XKFSfx,
body.wix-static-export #SITE_HEADER .XKFSfx {
  position: relative;
  z-index: 1;
}

body.wix-static-export main,
body.wix-static-export #SITE_PAGES,
body.wix-static-export #comp-lol1i5k0 {
  position: relative;
  z-index: 1;
}

/* Section content above Wix absolute bg fill layers */
.Le88gL > [data-testid="inline-content"],
.Le88gL > [data-mesh-id$="inlineContent"] {
  position: relative;
  z-index: 1;
}

/* Home hero KV: section colorUnderlay tints the image without Wix runtime stacking */
#comp-lol1i5k0 {
  --bg-overlay-color: transparent !important;
  --section-corvid-background-color: transparent !important;
}
#comp-lol1i5k0 [data-testid="colorUnderlay"] {
  display: none !important;
}

/* Page background overlay layer — static export has no hydrated bg media */
#mainPage > .pTvOx2.wixui-page[data-testid="page-bg"],
.i0StQr > .pTvOx2.wixui-page[data-testid="page-bg"] {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* View transitions / page fade states without Thunderbolt JS */
@view-transition {
  navigation: none;
}
::view-transition {
  display: none !important;
}

/* Wix enter/exit opacity helpers default hidden without hydration */
.XWeqiF,
.sAGPNe,
.cCFKrw,
.gG6uhp {
  opacity: 1 !important;
}

/* Header nav fallback (replaces Wix horizontal menu in static export) */
#SITE_HEADER #comp-mbdw7xid {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 42px;
}

#SITE_HEADER .nav-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid #9e3b1b;
  border-radius: 2px;
  background: #fff;
  color: #5b4d43;
  font-family: futura-lt-w01-book, sans-serif;
  font-size: 14px;
  letter-spacing: 0.05em;
  cursor: pointer;
}

#SITE_HEADER .nav-toggle__icon {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
}

#SITE_HEADER .nav-toggle__bar {
  display: block;
  width: 16px;
  height: 2px;
  background: #9e3b1b;
}

#SITE_HEADER .global-nav {
  display: block;
}

#SITE_HEADER .global-nav ul {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

#SITE_HEADER .global-nav a {
  display: inline-block;
  padding: 10px;
  font-family: futura-lt-w01-book, sans-serif;
  font-size: 16px;
  letter-spacing: 0.05em;
  color: #5b4d43;
  text-decoration: none;
  white-space: nowrap;
}

#SITE_HEADER .global-nav a:hover,
#SITE_HEADER .global-nav a.is-current {
  color: #993500;
}

@media (max-width: 767px) {
  #SITE_HEADER #comp-mbdw7xid {
    flex-direction: column;
    align-items: stretch;
  }

  #SITE_HEADER .nav-toggle {
    display: inline-flex;
    align-self: flex-end;
  }

  #SITE_HEADER .global-nav {
    display: none;
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem 0;
    background: #fffccc;
    border: 0 solid #9e3b1b;
  }

  #SITE_HEADER.is-nav-open .global-nav {
    display: block;
  }

  #SITE_HEADER .global-nav ul {
    flex-direction: column;
    align-items: stretch;
  }

  #SITE_HEADER .global-nav a {
    padding: 10px 16px;
  }
}
`;
}

/**
 * @param {string} globalCss
 * @param {{ inlineHeadStyleCount?: number, siteSlug?: string }} [options]
 */
export function appendWixStagingVisualOverrides(globalCss, options = {}) {
  const count = options.inlineHeadStyleCount ?? 0;
  if (count <= 0) return globalCss;
  return `${globalCss.trimEnd()}\n\n${buildWixStagingVisualOverridesCss({ siteSlug: options.siteSlug })}\n`;
}
