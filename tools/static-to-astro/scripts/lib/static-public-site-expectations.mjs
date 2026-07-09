/**
 * G-20u9 — Per-site static public HTML / nav expectations for artifact verification.
 */

import fs from "node:fs";
import path from "node:path";
import {
  CORE_PUBLIC_HTML,
  listPublicFiles,
} from "./static-public-artifact-verifier.mjs";
import { GOSAKI_SITE_KEY, PILOT_SAMPLE_STATIC_SITE_KEY } from "./site-registry.mjs";

/** @typedef {{ corePublicHtml: string[], useGosakiScheduleFallback: boolean, navSampleSegment: string }} StaticPublicVerifyOptions */

/** Pilot sample fixture routes (pre-build fallback). */
export const PILOT_SAMPLE_STATIC_CORE_HTML = [
  "index.html",
  "about/index.html",
  "contact/index.html",
  "service/index.html",
];

/**
 * @param {string | null | undefined} siteKey
 * @param {string | null} [publicDir]
 * @returns {StaticPublicVerifyOptions}
 */
export function resolveStaticPublicVerifyOptions(siteKey, publicDir = null) {
  if (siteKey === GOSAKI_SITE_KEY) {
    return {
      corePublicHtml: CORE_PUBLIC_HTML,
      useGosakiScheduleFallback: true,
      navSampleSegment: "discography",
    };
  }

  if (publicDir && fs.existsSync(publicDir)) {
    const pages = listPublicFiles(publicDir)
      .filter((f) => f.rel.endsWith("/index.html"))
      .map((f) => f.rel)
      .sort();
    if (pages.length > 0) {
      return {
        corePublicHtml: pages,
        useGosakiScheduleFallback: false,
        navSampleSegment: pages.some((p) => p.startsWith("about/")) ? "about" : "contact",
      };
    }
  }

  if (siteKey === PILOT_SAMPLE_STATIC_SITE_KEY) {
    return {
      corePublicHtml: PILOT_SAMPLE_STATIC_CORE_HTML,
      useGosakiScheduleFallback: false,
      navSampleSegment: "about",
    };
  }

  return {
    corePublicHtml: ["index.html"],
    useGosakiScheduleFallback: false,
    navSampleSegment: "about",
  };
}
