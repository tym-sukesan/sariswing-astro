/**
 * Wix static export baseline CSS overrides (G-8c).
 * Applies to any Wix live-crawl → Astro conversion when inline head styles are ingested.
 */

/**
 * Layer isolation, static-export fixes, responsive mesh fallback, nav shell layout.
 */
export function buildWixStaticExportBaselineOverridesCss() {
  return `/* --- Wix static export baseline overrides (G-8c) --- */

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
body.wix-static-export #SITE_PAGES {
  position: relative;
  z-index: 1;
}

/* Section content above Wix absolute bg fill layers */
body.wix-static-export .Le88gL > [data-testid="inline-content"],
body.wix-static-export .Le88gL > [data-mesh-id$="inlineContent"] {
  position: relative;
  z-index: 1;
}

/* Page background overlay layer — static export has no hydrated bg media */
body.wix-static-export #mainPage > .pTvOx2.wixui-page[data-testid="page-bg"],
body.wix-static-export .i0StQr > .pTvOx2.wixui-page[data-testid="page-bg"] {
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
body.wix-static-export .XWeqiF,
body.wix-static-export .sAGPNe,
body.wix-static-export .cCFKrw,
body.wix-static-export .gG6uhp {
  opacity: 1 !important;
}

/* Nav fallback shell (header-transform injects .global-nav / .nav-toggle) */
body.wix-static-export #SITE_HEADER [id^="comp-"]:has(.global-nav) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 42px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

body.wix-static-export #SITE_HEADER .nav-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 2px;
  background: #fff;
  color: inherit;
  font-size: 14px;
  letter-spacing: 0.05em;
  cursor: pointer;
}

body.wix-static-export #SITE_HEADER .nav-toggle__icon {
  display: inline-flex;
  flex-direction: column;
  gap: 3px;
}

body.wix-static-export #SITE_HEADER .nav-toggle__bar {
  display: block;
  width: 16px;
  height: 2px;
  background: currentColor;
}

body.wix-static-export #SITE_HEADER .global-nav {
  display: block;
}

body.wix-static-export #SITE_HEADER .global-nav ul {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

body.wix-static-export #SITE_HEADER .global-nav a {
  display: inline-block;
  padding: 10px;
  font-size: 16px;
  letter-spacing: 0.05em;
  text-decoration: none;
  white-space: nowrap;
}

/* Mobile responsive baseline (no Thunderbolt device-mobile switch) */
html,
body.wix-static-export {
  overflow-x: clip;
  max-width: 100%;
}

body.wix-static-export main,
body.wix-static-export #SITE_PAGES,
body.wix-static-export #SITE_PAGES > *,
body.wix-static-export .i0StQr,
body.wix-static-export .wH18kY,
body.wix-static-export [id^="Container"] {
  max-width: 100%;
  min-width: 0;
}

body.wix-static-export img {
  max-width: 100%;
  height: auto;
}

body.wix-static-export input,
body.wix-static-export textarea,
body.wix-static-export select,
body.wix-static-export form {
  max-width: 100%;
  box-sizing: border-box;
}

@media (max-width: 767px) {
  body.wix-static-export #SITE_HEADER [id^="comp-"]:has(.global-nav) {
    flex-direction: column;
    align-items: stretch;
  }

  body.wix-static-export #SITE_HEADER .nav-toggle {
    display: inline-flex;
    align-self: flex-end;
  }

  body.wix-static-export #SITE_HEADER .global-nav {
    display: none;
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem 0;
  }

  body.wix-static-export #SITE_HEADER.is-nav-open .global-nav {
    display: block;
  }

  body.wix-static-export #SITE_HEADER .global-nav ul {
    flex-direction: column;
    align-items: stretch;
  }

  body.wix-static-export #SITE_HEADER .global-nav a {
    padding: 10px 16px;
  }
}

@media (max-width: 768px) {
  body.wix-static-export #SITE_HEADER .XKFSfx,
  body.wix-static-export #SITE_HEADER [data-testid="inline-content"],
  body.wix-static-export #SITE_HEADER [data-testid="mesh-container-content"] {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  body.wix-static-export .Le88gL,
  body.wix-static-export .Le88gL[id^="comp-"],
  body.wix-static-export [id^="comp-"].wixui-section {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  body.wix-static-export [data-mesh-id$="inlineContent"],
  body.wix-static-export [data-mesh-id$="inlineContent-gridContainer"] {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
  }

  body.wix-static-export [data-mesh-id$="inlineContent-gridContainer"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 1rem;
    grid-template-columns: 100% !important;
    grid-template-rows: auto !important;
  }

  body.wix-static-export [data-mesh-id$="inlineContent-gridContainer"] > *,
  body.wix-static-export [data-mesh-id$="inlineContent-gridContainer"] > interact-element > * {
    position: relative !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    grid-area: auto !important;
    justify-self: stretch !important;
    align-self: stretch !important;
  }

  body.wix-static-export [data-testid="richTextElement"],
  body.wix-static-export .wixui-rich-text {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  body.wix-static-export .wixui-image,
  body.wix-static-export .ih2JY1 {
    max-width: 100% !important;
    width: auto !important;
    margin-left: auto;
    margin-right: auto;
  }

  body.wix-static-export .wixui-image img,
  body.wix-static-export .ih2JY1 img {
    width: min(85vw, 320px) !important;
    max-width: 90% !important;
    height: auto !important;
    margin-left: auto !important;
    margin-right: auto !important;
    display: block;
  }

  body.wix-static-export form[data-hook="form"] {
    width: 100% !important;
    padding: 0 0.75rem;
    box-sizing: border-box;
  }

  body.wix-static-export .wixui-text-box input,
  body.wix-static-export .wixui-text-box textarea,
  body.wix-static-export [data-field-type] input,
  body.wix-static-export [data-field-type] textarea {
    width: 100% !important;
    max-width: 100% !important;
  }
}

@media (max-width: 480px) {
  body.wix-static-export #SITE_HEADER .global-nav a {
    font-size: 15px;
  }
}
`;
}
