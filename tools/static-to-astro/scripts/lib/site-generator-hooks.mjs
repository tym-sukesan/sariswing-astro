/**
 * G-20u6 — Site generator hook registry.
 * Resolves per-site hooks for astro-generator.mjs. Unregistered sites use safe default/noop hooks.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyBaseUrlToSeo } from "./base-url.mjs";
import {
  cmsKitScheduleMonthRoute,
  parseScheduleMonthSourcePath,
  LIVE_CRAWL_MONTH_FILENAME,
} from "./schedule-pages.mjs";
import {
  applyGosakiAboutBandProfiles,
  isGosakiPianoFixture,
} from "./gosaki-about-band-profiles.mjs";
import { applyGosakiAboutContent } from "./gosaki-about-content.mjs";
import { applyGosakiHomeYouTubeEmbed } from "./gosaki-home-youtube-embed.mjs";
import { applyGosakiContactHubspotEmbed } from "./gosaki-contact-hubspot-embed.mjs";
import { applyGosakiScheduleDataPages } from "./gosaki-schedule-data-pages.mjs";
import {
  injectDiscographyDataSourceMarker,
  patchGosakiDiscographySupabaseFields,
} from "./supabase-discography-read.mjs";
import { applyGosakiStagingReadOnlyAdmin } from "./gosaki-staging-read-only-admin.mjs";
import { generateGosakiFooterAstro } from "./gosaki-footer-social.mjs";
import { GOSAKI_SITE_KEY, loadSiteRegistry } from "./site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");

/** @typedef {import('./astro-generator.mjs').generateAstroProject extends (...args: any[]) => infer R ? R : never} GenerationResult */

/**
 * @typedef {object} SiteGeneratorHookContext
 * @property {string} siteDir
 * @property {string | null} siteKey
 * @property {string | null} baseUrl
 * @property {string} deployBase
 * @property {{ productionOrigin: string | null }} linkTransformContext
 * @property {unknown} [gosakiScheduleBundle]
 * @property {unknown} [gosakiDiscographyBundle]
 * @property {boolean} [useScheduleData]
 * @property {Set<string> | null} [monthRoutes]
 * @property {ReturnType<typeof import('./schedule-pages.mjs').detectScheduleMonthPages>} [scheduleMonthPages]
 * @property {string} outDir
 * @property {string} toolRoot
 * @property {(filePath: string, content: string) => void} writeFile
 * @property {(monthEntry: object, baseUrl: string | null, deployBase: string) => string} [generateScheduleLegacyMonthStubPage]
 */

/**
 * @typedef {object} SiteGeneratorHooks
 * @property {string | null} siteKey
 * @property {boolean} active
 * @property {(siteDir: string, basename?: string) => boolean} matchFixture
 * @property {(siteDir: string, basename: string) => string | null} resolveVisualOverrideSiteSlug
 * @property {(pages: object[], ctx: SiteGeneratorHookContext) => object[]} transformAnalysisPages
 * @property {(footerHtml: string, ctx: SiteGeneratorHookContext) => string | null} generateFooter
 * @property {(ctx: SiteGeneratorHookContext) => { useScheduleData: boolean, monthRoutes: Set<string> | null }} resolveScheduleDataUsage
 * @property {(page: { route: string }, ctx: SiteGeneratorHookContext) => boolean} shouldSkipScheduleMonthPage
 * @property {(mainHtml: string, page: { route: string }, ctx: SiteGeneratorHookContext) => { html: string, summary: object } | null} patchDiscographyPageMainHtml
 * @property {(ctx: SiteGeneratorHookContext) => object | null} applyScheduleDataPages
 * @property {(ctx: SiteGeneratorHookContext) => { count: number, paths: string[] }} applyLegacyMonthStubs
 * @property {(outDir: string, ctx: SiteGeneratorHookContext) => object} applyPostGenerate
 */

/**
 * @param {object} page
 * @param {string | null} baseUrl
 * @param {string} deployBase
 */
function toCanonicalScheduleMonthPage(page, baseUrl, deployBase) {
  const parsed = parseScheduleMonthSourcePath(page.sourcePath);
  if (!parsed) return page;
  const route = cmsKitScheduleMonthRoute(parsed.year, parsed.month);
  return {
    ...page,
    route,
    astroRoute: route,
    pagePath: `schedule/${parsed.year}-${parsed.month}/index.astro`,
    seo: applyBaseUrlToSeo(page.seo, route, baseUrl, deployBase),
  };
}

/** @type {SiteGeneratorHooks} */
export const DEFAULT_SITE_GENERATOR_HOOKS = {
  siteKey: null,
  active: false,
  matchFixture() {
    return false;
  },
  resolveVisualOverrideSiteSlug() {
    return null;
  },
  transformAnalysisPages(pages) {
    return pages;
  },
  generateFooter() {
    return null;
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
  applyPostGenerate() {
    return {
      gosakiBandProfilesSummary: { applied: false },
      gosakiAboutContentSummary: { applied: false },
      gosakiYoutubeEmbedSummary: { applied: false },
      gosakiContactHubspotSummary: { applied: false },
      gosakiReadOnlyAdminSummary: { applied: false },
      writtenPaths: [],
    };
  },
};

/** @returns {Omit<SiteGeneratorHooks, 'siteKey' | 'active'>} */
function createGosakiPianoHookMethods() {
  return {
    matchFixture(siteDir) {
      return isGosakiPianoFixture(siteDir);
    },
    resolveVisualOverrideSiteSlug(_siteDir, basename) {
      if (basename === "gosaki-static-site") return "gosaki-static-site";
      return basename;
    },
    transformAnalysisPages(pages, ctx) {
      return pages.map((page) => toCanonicalScheduleMonthPage(page, ctx.baseUrl, ctx.deployBase));
    },
    generateFooter(footerHtml, ctx) {
      return generateGosakiFooterAstro(footerHtml, ctx.linkTransformContext);
    },
    resolveScheduleDataUsage(ctx) {
      const bundle = /** @type {any} */ (ctx.gosakiScheduleBundle);
      const useScheduleData = Boolean(
        bundle &&
          (bundle.scheduleDataSource === "supabase" || bundle.scheduleDataSource === "static-fallback") &&
          bundle.schedules?.length > 0,
      );
      const monthRoutes = useScheduleData
        ? new Set(bundle.months.map((/** @type {{ route: string }} */ m) => m.route))
        : null;
      return { useScheduleData, monthRoutes };
    },
    shouldSkipScheduleMonthPage(page, ctx) {
      return Boolean(ctx.useScheduleData && ctx.monthRoutes?.has(page.route));
    },
    patchDiscographyPageMainHtml(mainHtml, page, ctx) {
      const bundle = /** @type {any} */ (ctx.gosakiDiscographyBundle);
      if (
        page.route !== "/discography/" ||
        bundle?.discographyDataSource !== "supabase" ||
        !bundle?.releases?.length
      ) {
        return null;
      }
      const patched = patchGosakiDiscographySupabaseFields(
        mainHtml,
        bundle.releases,
        bundle.tracksByLegacyId,
      );
      const html = injectDiscographyDataSourceMarker(patched.html, "supabase");
      return {
        html,
        summary: {
          discographyDataSource: "supabase",
          rowCount: bundle.releases.length,
          patchCount: patched.patches.length,
          purchasePatchCount: patched.purchasePatches.length,
          artistPatchCount: patched.artistPatches.length,
          labelPatchCount: patched.labelPatches?.length ?? 0,
          trackPatchCount: patched.trackPatches?.length ?? 0,
          trackRowCount: bundle.trackRowCount ?? 0,
        },
      };
    },
    applyScheduleDataPages(ctx) {
      const bundle = /** @type {any} */ (ctx.gosakiScheduleBundle);
      return applyGosakiScheduleDataPages(ctx.outDir, bundle, {
        baseUrl: ctx.baseUrl,
        deployBase: ctx.deployBase,
      });
    },
    applyLegacyMonthStubs(ctx) {
      const bundle = /** @type {any} */ (ctx.gosakiScheduleBundle);
      const scheduleMonthPages = ctx.scheduleMonthPages ?? [];
      const writeFile = ctx.writeFile;
      const generateScheduleLegacyMonthStubPage = ctx.generateScheduleLegacyMonthStubPage;
      if (!writeFile || !generateScheduleLegacyMonthStubPage) {
        return { count: 0, paths: [] };
      }

      const paths = [];
      let count = 0;

      if (ctx.useScheduleData && bundle?.months?.length) {
        for (const monthMeta of bundle.months) {
          const [year, month] = String(monthMeta.month ?? "").split("-");
          if (!year || !month) continue;
          const legacyPagePath = `${year}-${month}/index.astro`;
          const legacyFile = path.join(ctx.outDir, "src/pages", legacyPagePath);
          writeFile(
            legacyFile,
            generateScheduleLegacyMonthStubPage(
              {
                route: monthMeta.route,
                year,
                month,
                label: monthMeta.label,
              },
              ctx.baseUrl,
              ctx.deployBase,
            ),
          );
          paths.push(legacyFile);
          count += 1;
        }
        return { count, paths };
      }

      for (const monthEntry of scheduleMonthPages) {
        const parsed = parseScheduleMonthSourcePath(monthEntry.sourcePath);
        if (!parsed || !LIVE_CRAWL_MONTH_FILENAME.test(parsed.basename)) continue;
        const legacyPagePath = `${parsed.year}-${parsed.month}/index.astro`;
        const legacyFile = path.join(ctx.outDir, "src/pages", legacyPagePath);
        writeFile(
          legacyFile,
          generateScheduleLegacyMonthStubPage(monthEntry, ctx.baseUrl, ctx.deployBase),
        );
        paths.push(legacyFile);
        count += 1;
      }
      return { count, paths };
    },
    applyPostGenerate(outDir, ctx) {
      const toolRoot = ctx.toolRoot ?? TOOL_ROOT;
      const writtenPaths = [];

      const gosakiBandProfilesSummary = applyGosakiAboutBandProfiles(outDir, toolRoot);
      if (gosakiBandProfilesSummary.applied) {
        writtenPaths.push(
          path.join(outDir, gosakiBandProfilesSummary.componentPath),
          path.join(outDir, gosakiBandProfilesSummary.dataPath),
        );
      }

      const gosakiAboutContentSummary = applyGosakiAboutContent(outDir, toolRoot);
      if (gosakiAboutContentSummary.applied) {
        writtenPaths.push(path.join(outDir, gosakiAboutContentSummary.dataPath));
      }

      const gosakiYoutubeEmbedSummary = applyGosakiHomeYouTubeEmbed(outDir, toolRoot);
      if (gosakiYoutubeEmbedSummary.applied) {
        writtenPaths.push(
          path.join(outDir, gosakiYoutubeEmbedSummary.componentPath),
          path.join(outDir, gosakiYoutubeEmbedSummary.dataPath),
          path.join(outDir, gosakiYoutubeEmbedSummary.libPath),
        );
      }

      const gosakiContactHubspotSummary = applyGosakiContactHubspotEmbed(outDir, toolRoot);
      if (gosakiContactHubspotSummary.applied) {
        writtenPaths.push(path.join(outDir, gosakiContactHubspotSummary.dataPath));
      }

      const gosakiReadOnlyAdminSummary = applyGosakiStagingReadOnlyAdmin(outDir, toolRoot);
      if (gosakiReadOnlyAdminSummary.applied) {
        writtenPaths.push(
          path.join(outDir, gosakiReadOnlyAdminSummary.pagePath),
          path.join(outDir, gosakiReadOnlyAdminSummary.libPath),
        );
      }

      return {
        gosakiBandProfilesSummary,
        gosakiAboutContentSummary,
        gosakiYoutubeEmbedSummary,
        gosakiContactHubspotSummary,
        gosakiReadOnlyAdminSummary,
        writtenPaths,
      };
    },
  };
}

/** @type {Record<string, () => Omit<SiteGeneratorHooks, 'siteKey' | 'active'>>} */
export const SITE_GENERATOR_HOOK_FACTORIES = {
  [GOSAKI_SITE_KEY]: createGosakiPianoHookMethods,
};

/**
 * @param {string | null} siteKey
 * @param {Omit<SiteGeneratorHooks, 'siteKey' | 'active'>} methods
 * @returns {SiteGeneratorHooks}
 */
export function mergeSiteGeneratorHooks(siteKey, methods) {
  return {
    ...DEFAULT_SITE_GENERATOR_HOOKS,
    ...methods,
    siteKey,
    active: siteKey != null,
  };
}

/**
 * Resolve per-site generator hooks.
 *
 * Resolution order:
 * 1. options.siteKey when a hook factory is registered (explicit — preferred)
 * 2. registry fixtureDir basename match
 * 3. per-site matchFixture() fallback
 * 4. DEFAULT_SITE_GENERATOR_HOOKS (noop)
 *
 * @param {string} siteDir
 * @param {{ siteKey?: string | null, toolRoot?: string }} [options]
 * @returns {SiteGeneratorHooks}
 */
export function resolveSiteGeneratorHooks(siteDir, options = {}) {
  const resolvedSiteDir = path.resolve(siteDir);
  const basename = path.basename(resolvedSiteDir);
  const toolRoot = options.toolRoot ?? TOOL_ROOT;

  if (options.siteKey && SITE_GENERATOR_HOOK_FACTORIES[options.siteKey]) {
    return mergeSiteGeneratorHooks(options.siteKey, SITE_GENERATOR_HOOK_FACTORIES[options.siteKey]());
  }

  try {
    const registry = loadSiteRegistry(toolRoot);
    for (const [siteKey, entry] of Object.entries(registry.sites ?? {})) {
      const fixtureBase = path.basename(String(entry.fixtureDir ?? ""));
      if (!fixtureBase || basename !== fixtureBase) continue;
      const factory = SITE_GENERATOR_HOOK_FACTORIES[siteKey];
      if (factory) {
        return mergeSiteGeneratorHooks(siteKey, factory());
      }
    }
  } catch {
    /* registry unavailable in isolated tests */
  }

  for (const [siteKey, factory] of Object.entries(SITE_GENERATOR_HOOK_FACTORIES)) {
    const methods = factory();
    if (methods.matchFixture(resolvedSiteDir, basename)) {
      return mergeSiteGeneratorHooks(siteKey, methods);
    }
  }

  return { ...DEFAULT_SITE_GENERATOR_HOOKS };
}

/**
 * @param {string} siteKey
 */
export function isRegisteredSiteGeneratorHook(siteKey) {
  return Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, siteKey);
}
