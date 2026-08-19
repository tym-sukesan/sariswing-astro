/**
 * G-20u6 — Site generator hook registry (Core).
 * Resolves per-site hooks for astro-generator.mjs. Unregistered sites use safe default/noop hooks.
 *
 * Site adapters register factories via registerSiteGeneratorHookFactory.
 * Adapter modules are loaded lazily from registry `generatorHooksAdapter` when siteKey/fixture matches.
 * Core must not import gosaki-* modules.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getSiteRegistryEntry, loadSiteRegistry } from "./site-registry.mjs";

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
 * @property {unknown} [scheduleBundle]
 * @property {unknown} [discographyBundle]
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
 * @property {string} [scheduleClassPrefix] CSS class prefix for schedule markup (default: "schedule"; Gosaki: "gosaki-schedule")
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

/** @type {SiteGeneratorHooks} */
export const DEFAULT_SITE_GENERATOR_HOOKS = {
  siteKey: null,
  active: false,
  /** Site-neutral schedule class prefix — never "gosaki-*". */
  scheduleClassPrefix: "schedule",
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
      gosakiHomeStaleThisWeekSummary: { applied: false },
      gosakiYoutubeEmbedSummary: { applied: false },
      gosakiContactHubspotSummary: { applied: false },
      gosakiReadOnlyAdminSummary: { applied: false },
      writtenPaths: [],
    };
  },
};

/**
 * Mutable factory registry. Adapters call registerSiteGeneratorHookFactory.
 * @type {Record<string, () => Omit<SiteGeneratorHooks, 'siteKey' | 'active'>>}
 */
export const SITE_GENERATOR_HOOK_FACTORIES = {};

/** @type {Map<string, Promise<void>>} */
const adapterImportPromises = new Map();

/**
 * Idempotent factory registration. Same siteKey re-register is a no-op
 * (does not replace; import-order safe).
 *
 * @param {string} siteKey
 * @param {() => Omit<SiteGeneratorHooks, 'siteKey' | 'active'>} factory
 * @returns {{ registered: boolean, reason: 'new' | 'already-registered' }}
 */
export function registerSiteGeneratorHookFactory(siteKey, factory) {
  if (!siteKey || typeof factory !== "function") {
    throw new Error("registerSiteGeneratorHookFactory requires siteKey and factory");
  }
  if (Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, siteKey)) {
    return { registered: false, reason: "already-registered" };
  }
  SITE_GENERATOR_HOOK_FACTORIES[siteKey] = factory;
  return { registered: true, reason: "new" };
}

/**
 * Lazy-load registry `generatorHooksAdapter` for one siteKey (same-process import).
 * Concurrent callers share one import promise; module cache + idempotent register.
 *
 * @param {string | null | undefined} siteKey
 * @param {{ toolRoot?: string }} [options]
 * @returns {Promise<{ loaded: boolean, registered: boolean, already?: boolean }>}
 */
export async function ensureSiteGeneratorHookAdapter(siteKey, options = {}) {
  if (!siteKey) return { loaded: false, registered: false };
  if (Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, siteKey)) {
    return { loaded: true, registered: true, already: true };
  }

  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  let entry;
  try {
    entry = getSiteRegistryEntry(siteKey, toolRoot);
  } catch {
    return { loaded: false, registered: false };
  }
  const rel = entry?.generatorHooksAdapter;
  if (!rel) return { loaded: false, registered: false };

  const href = pathToFileURL(path.resolve(toolRoot, String(rel))).href;
  let pending = adapterImportPromises.get(siteKey);
  if (!pending) {
    pending = import(href).then(() => undefined);
    adapterImportPromises.set(siteKey, pending);
  }
  await pending;

  return {
    loaded: true,
    registered: Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, siteKey),
  };
}

/**
 * Ensure adapters needed for a resolve/generate call.
 * - explicit siteKey → that adapter only
 * - else fixtureDir basename match → that site's adapter only
 * - never eager-loads all adapters (generic/pilot stay unload)
 *
 * @param {string} siteDir
 * @param {{ siteKey?: string | null, toolRoot?: string }} [options]
 */
export async function ensureSiteGeneratorHookAdaptersForResolve(siteDir, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  if (options.siteKey) {
    return ensureSiteGeneratorHookAdapter(options.siteKey, { toolRoot });
  }

  const basename = path.basename(path.resolve(siteDir));
  try {
    const registry = loadSiteRegistry(toolRoot);
    for (const [siteKey, entry] of Object.entries(registry.sites ?? {})) {
      const fixtureBase = path.basename(String(entry.fixtureDir ?? ""));
      if (!fixtureBase || basename !== fixtureBase) continue;
      if (!entry.generatorHooksAdapter) {
        return { loaded: false, registered: false };
      }
      return ensureSiteGeneratorHookAdapter(siteKey, { toolRoot });
    }
  } catch {
    /* registry unavailable */
  }
  return { loaded: false, registered: false };
}

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
 * Resolve per-site generator hooks (sync).
 * Call ensureSiteGeneratorHookAdaptersForResolve first when adapters may be needed.
 *
 * Resolution order:
 * 1. options.siteKey when a hook factory is registered (explicit — preferred)
 * 2. registry fixtureDir basename match
 * 3. per-site matchFixture() fallback (only already-loaded factories)
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

  if (options.siteKey) {
    const factory = SITE_GENERATOR_HOOK_FACTORIES[options.siteKey];
    if (factory) {
      return mergeSiteGeneratorHooks(options.siteKey, factory());
    }
    return {
      ...DEFAULT_SITE_GENERATOR_HOOKS,
      siteKey: options.siteKey,
      active: false,
    };
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
 * Ensure adapters then resolve (preferred for Gosaki / registry fixture paths).
 *
 * @param {string} siteDir
 * @param {{ siteKey?: string | null, toolRoot?: string }} [options]
 * @returns {Promise<SiteGeneratorHooks>}
 */
export async function resolveSiteGeneratorHooksAsync(siteDir, options = {}) {
  await ensureSiteGeneratorHookAdaptersForResolve(siteDir, options);
  return resolveSiteGeneratorHooks(siteDir, options);
}

/**
 * @param {string} siteKey
 */
export function isRegisteredSiteGeneratorHook(siteKey) {
  return Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, siteKey);
}
