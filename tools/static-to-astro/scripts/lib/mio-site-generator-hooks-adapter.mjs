/**
 * Mio Kisaragi Jazz site adapter — thin generator hooks (Videos + footer SNS only).
 *
 * Does not implement Schedule / Discography / About / Contact / Admin / Save.
 * Loaded lazily via registry `generatorHooksAdapter` (ensureSiteGeneratorHookAdapter).
 * Videos data must be injected via embedsBundle / siteEmbedsBundle (no implicit fixture path).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateMioFooterAstro } from "./mio-footer-social.mjs";
import { applyMioVideosPageEmbeds } from "./mio-videos-page-embed.mjs";
import { matchRegistryFixtureDir } from "./site-fixture-match.mjs";
import { MIO_KISARAGI_JAZZ_SITE_KEY } from "./site-registry.mjs";
import { registerSiteGeneratorHookFactory } from "./site-generator-hooks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");

/**
 * Idempotent Mio factory registration (safe under double ensure / re-import).
 * @returns {{ registered: boolean, reason: string }}
 */
export function ensureMioSiteGeneratorHooksRegistered() {
  return registerSiteGeneratorHookFactory(MIO_KISARAGI_JAZZ_SITE_KEY, createMioKisaragiJazzHookMethods);
}

/**
 * Thin Mio hook methods — Videos page + footer SNS only.
 * @returns {Omit<import('./site-generator-hooks.mjs').SiteGeneratorHooks, 'siteKey' | 'active'>}
 */
export function createMioKisaragiJazzHookMethods() {
  return {
    scheduleClassPrefix: "schedule",
    matchFixture(siteDir) {
      return matchRegistryFixtureDir(siteDir, MIO_KISARAGI_JAZZ_SITE_KEY);
    },
    resolveVisualOverrideSiteSlug() {
      return null;
    },
    transformAnalysisPages(pages) {
      return pages;
    },
    generateFooter(footerHtml, ctx) {
      return generateMioFooterAstro(footerHtml, ctx?.linkTransformContext ?? {});
    },
    resolveScheduleDataUsage() {
      return { useScheduleData: false, monthRoutes: null };
    },
    shouldSkipScheduleMonthPage() {
      return false;
    },
    patchDiscographyPageMainHtml() {
      return null;
    },
    applyScheduleDataPages() {
      return null;
    },
    applyLegacyMonthStubs() {
      return { count: 0, paths: [] };
    },
    applyPostGenerate(outDir, ctx) {
      const toolRoot = ctx?.toolRoot ?? TOOL_ROOT;
      void toolRoot;

      const embedsBundle = ctx?.siteEmbedsBundle ?? ctx?.embedsBundle ?? null;
      const mioVideosEmbedSummary = applyMioVideosPageEmbeds(outDir, embedsBundle);
      const writtenPaths = [...(mioVideosEmbedSummary.paths ?? [])];

      return {
        gosakiBandProfilesSummary: { applied: false, reason: "mio_thin_adapter_skip" },
        gosakiAboutContentSummary: { applied: false, reason: "mio_thin_adapter_skip" },
        gosakiYoutubeEmbedSummary: { applied: false, reason: "mio_thin_adapter_skip_home_youtube" },
        gosakiContactHubspotSummary: { applied: false, reason: "mio_thin_adapter_skip" },
        gosakiReadOnlyAdminSummary: { applied: false, reason: "mio_thin_adapter_skip" },
        mioVideosEmbedSummary,
        writtenPaths,
      };
    },
  };
}

/** Register on load when this adapter module is imported (lazy path or explicit). */
ensureMioSiteGeneratorHooksRegistered();
