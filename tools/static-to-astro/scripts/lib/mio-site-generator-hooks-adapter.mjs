/**
 * Mio Kisaragi Jazz site adapter — generator hooks
 * (Videos + footer SNS + Schedule read-render + Discography read-render).
 *
 * Does not implement About / Contact / Admin / Save.
 * Loaded lazily via registry `generatorHooksAdapter` (ensureSiteGeneratorHookAdapter).
 * Bundles must be injected (no implicit fixture path).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { patchMioDiscographyMainHtml } from "./mio-discography-data-page.mjs";
import { generateMioFooterAstro } from "./mio-footer-social.mjs";
import {
  applyMioScheduleDataPages,
  resolveMioScheduleDataUsage,
} from "./mio-schedule-data-pages.mjs";
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
 * Mio hook methods — Videos + footer + Schedule + Discography read-render.
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
    resolveScheduleDataUsage(ctx) {
      const bundle = ctx?.scheduleBundle ?? ctx?.gosakiScheduleBundle ?? null;
      return resolveMioScheduleDataUsage(bundle);
    },
    shouldSkipScheduleMonthPage(page, ctx) {
      return Boolean(ctx?.useScheduleData && ctx?.monthRoutes?.has(page.route));
    },
    patchDiscographyPageMainHtml(mainHtml, page, ctx) {
      const bundle = ctx?.discographyBundle ?? ctx?.gosakiDiscographyBundle ?? null;
      if (!bundle) return null;
      return patchMioDiscographyMainHtml(mainHtml, bundle, page);
    },
    applyScheduleDataPages(ctx) {
      const bundle = ctx?.scheduleBundle ?? ctx?.gosakiScheduleBundle ?? null;
      return applyMioScheduleDataPages(ctx.outDir, bundle, {
        baseUrl: ctx.baseUrl ?? null,
        deployBase: ctx.deployBase ?? "/",
      });
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
        gosakiBandProfilesSummary: { applied: false, reason: "mio_adapter_skip" },
        gosakiAboutContentSummary: { applied: false, reason: "mio_adapter_skip" },
        gosakiYoutubeEmbedSummary: { applied: false, reason: "mio_adapter_skip_home_youtube" },
        gosakiContactHubspotSummary: { applied: false, reason: "mio_adapter_skip" },
        gosakiReadOnlyAdminSummary: { applied: false, reason: "mio_adapter_skip" },
        mioVideosEmbedSummary,
        writtenPaths,
      };
    },
  };
}

/** Register on load when this adapter module is imported (lazy path or explicit). */
ensureMioSiteGeneratorHooksRegistered();
