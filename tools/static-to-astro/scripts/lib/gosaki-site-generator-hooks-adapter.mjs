/**
 * Gosaki site adapter — createGosakiPianoHookMethods for site-generator-hooks Core.
 *
 * Owns Gosaki presentation / CMS inject hooks so Core stays free of gosaki-* imports.
 * HTML generation logic is unchanged (moved as-is from site-generator-hooks.mjs).
 *
 * Dependency direction: this adapter → Core register API + gosaki-* presentation modules.
 * Loaded lazily via registry `generatorHooksAdapter` (ensureSiteGeneratorHookAdapter) or explicit import.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyBaseUrlToSeo } from "./base-url.mjs";
import { applyGosakiAboutBandProfiles } from "./gosaki-about-band-profiles.mjs";
import { applyGosakiAboutContent } from "./gosaki-about-content.mjs";
import { applyGosakiContactHubspotEmbed } from "./gosaki-contact-hubspot-embed.mjs";
import { generateGosakiFooterAstro } from "./gosaki-footer-social.mjs";
import { applyGosakiHomeYouTubeEmbed } from "./gosaki-home-youtube-embed.mjs";
import { applyGosakiHomeStaleThisWeekHide } from "./gosaki-home-stale-this-week-hide.mjs";
import { applyGosakiScheduleDataPages } from "./gosaki-schedule-data-pages.mjs";
import { applyGosakiStagingReadOnlyAdmin } from "./gosaki-staging-read-only-admin.mjs";
import { applyGosakiWixLocalAssets } from "./gosaki-wix-local-assets.mjs";
import {
  cmsKitScheduleMonthRoute,
  LIVE_CRAWL_MONTH_FILENAME,
  parseScheduleMonthSourcePath,
} from "./schedule-pages.mjs";
import { isCmsFeatureEnabled } from "./site-cms-features.mjs";
import { matchRegistryFixtureDir } from "./site-fixture-match.mjs";
import { GOSAKI_SITE_KEY } from "./site-registry.mjs";
import {
  injectDiscographyDataSourceMarker,
  patchGosakiDiscographySupabaseFields,
} from "./supabase-discography-read.mjs";
import { registerSiteGeneratorHookFactory } from "./site-generator-hooks.mjs";

/**
 * Idempotent Gosaki factory registration (safe under double ensure / re-import).
 * @returns {{ registered: boolean, reason: string }}
 */
export function ensureGosakiSiteGeneratorHooksRegistered() {
  return registerSiteGeneratorHookFactory(GOSAKI_SITE_KEY, createGosakiPianoHookMethods);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");

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

/**
 * Gosaki piano hook methods (same API / return shapes as pre-adapter Core factory).
 * @returns {Omit<import('./site-generator-hooks.mjs').SiteGeneratorHooks, 'siteKey' | 'active'>}
 */
export function createGosakiPianoHookMethods() {
  return {
    /** Preserve legacy Gosaki CSS / package verifiers that select gosaki-schedule-*. */
    scheduleClassPrefix: "gosaki-schedule",
    matchFixture(siteDir) {
      return matchRegistryFixtureDir(siteDir, GOSAKI_SITE_KEY);
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
      const bundle = /** @type {any} */ (ctx.scheduleBundle ?? ctx.gosakiScheduleBundle);
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
      const bundle = /** @type {any} */ (ctx.discographyBundle ?? ctx.gosakiDiscographyBundle);
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
      const bundle = /** @type {any} */ (ctx.scheduleBundle ?? ctx.gosakiScheduleBundle);
      return applyGosakiScheduleDataPages(ctx.outDir, bundle, {
        baseUrl: ctx.baseUrl,
        deployBase: ctx.deployBase,
      });
    },
    applyLegacyMonthStubs(ctx) {
      const bundle = /** @type {any} */ (ctx.scheduleBundle ?? ctx.gosakiScheduleBundle);
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
      const siteKey = ctx.siteKey ?? GOSAKI_SITE_KEY;
      const writtenPaths = [];

      const gosakiBandProfilesSummary =
        siteKey && isCmsFeatureEnabled(siteKey, "aboutBandProfiles", toolRoot)
          ? applyGosakiAboutBandProfiles(outDir, toolRoot)
          : { applied: false, reason: "cms_feature_aboutBandProfiles_disabled" };
      if (gosakiBandProfilesSummary.applied) {
        writtenPaths.push(
          path.join(outDir, gosakiBandProfilesSummary.componentPath),
          path.join(outDir, gosakiBandProfilesSummary.dataPath),
        );
      }

      const gosakiAboutContentSummary =
        siteKey && isCmsFeatureEnabled(siteKey, "aboutContent", toolRoot)
          ? applyGosakiAboutContent(outDir, toolRoot, {
              pageFieldsBundle:
                ctx.pageFieldsBundle ?? ctx.sitePageFieldsBundle ?? ctx.gosakiPageFieldsBundle,
            })
          : { applied: false, reason: "cms_feature_aboutContent_disabled" };
      if (gosakiAboutContentSummary.applied) {
        writtenPaths.push(path.join(outDir, gosakiAboutContentSummary.dataPath));
      }

      const gosakiHomeStaleThisWeekSummary = applyGosakiHomeStaleThisWeekHide(outDir);

      const gosakiYoutubeEmbedSummary =
        siteKey && isCmsFeatureEnabled(siteKey, "youtube", toolRoot)
          ? applyGosakiHomeYouTubeEmbed(outDir, toolRoot, {
              siteEmbedsBundle: ctx.siteEmbedsBundle ?? ctx.embedsBundle ?? ctx.gosakiEmbedsBundle,
            })
          : { applied: false, reason: "cms_feature_youtube_disabled" };
      if (gosakiYoutubeEmbedSummary.applied) {
        writtenPaths.push(
          path.join(outDir, gosakiYoutubeEmbedSummary.componentPath),
          path.join(outDir, gosakiYoutubeEmbedSummary.dataPath),
          path.join(outDir, gosakiYoutubeEmbedSummary.libPath),
        );
      }

      const gosakiContactHubspotSummary =
        siteKey && isCmsFeatureEnabled(siteKey, "contact", toolRoot)
          ? applyGosakiContactHubspotEmbed(outDir, toolRoot)
          : { applied: false, reason: "cms_feature_contact_disabled" };
      if (gosakiContactHubspotSummary.applied) {
        writtenPaths.push(path.join(outDir, gosakiContactHubspotSummary.dataPath));
      }

      const gosakiReadOnlyAdminSummary =
        siteKey && isCmsFeatureEnabled(siteKey, "readOnlyAdmin", toolRoot)
          ? applyGosakiStagingReadOnlyAdmin(outDir, toolRoot, {
              scheduleBundle: ctx.scheduleBundle ?? ctx.gosakiScheduleBundle,
              discographyBundle: ctx.discographyBundle ?? ctx.gosakiDiscographyBundle,
            })
          : { applied: false, reason: "cms_feature_readOnlyAdmin_disabled" };
      if (gosakiReadOnlyAdminSummary.applied) {
        writtenPaths.push(
          path.join(outDir, gosakiReadOnlyAdminSummary.pagePath),
          path.join(outDir, gosakiReadOnlyAdminSummary.libPath),
          path.join(outDir, gosakiReadOnlyAdminSummary.dashboardPath),
          path.join(outDir, gosakiReadOnlyAdminSummary.discographyEditorPath),
        );
      }

      // After HTML injects: copy committed Wix media and rewrite CDN URLs.
      applyGosakiWixLocalAssets(outDir, toolRoot);

      return {
        gosakiBandProfilesSummary,
        gosakiAboutContentSummary,
        gosakiHomeStaleThisWeekSummary,
        gosakiYoutubeEmbedSummary,
        gosakiContactHubspotSummary,
        gosakiReadOnlyAdminSummary,
        writtenPaths,
      };
    },
  };
}

/** Register on load when this adapter module is imported (lazy path or explicit). */
ensureGosakiSiteGeneratorHooksRegistered();
