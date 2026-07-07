/**
 * G-23g — Onboarding seed extractor (standardized module).
 * Reads fixture/crawl result + onboarding config — no DB / network / FTP.
 */

import {
  getPresetModule,
  validateCmsPresetConfig,
} from "./cms-preset-registry.mjs";

/** @typedef {"candidate" | "skipped" | "warn" | "fail"} SeedCandidateStatus */

/** @typedef {"high" | "medium" | "low"} ConfidenceLevel */

/**
 * @typedef {object} SeedCandidate
 * @property {string} moduleId
 * @property {string} siteSlug
 * @property {string} sourcePath
 * @property {string} sourceRoute
 * @property {string} [title]
 * @property {string} [label]
 * @property {boolean} published
 * @property {SeedCandidateStatus} status
 * @property {ConfidenceLevel} confidence
 * @property {unknown} raw
 * @property {Record<string, unknown>} normalized
 * @property {string[]} warnings
 */

/**
 * @typedef {object} ModuleExtractionResult
 * @property {string} moduleId
 * @property {boolean} enabled
 * @property {"PASS" | "WARN" | "FAIL" | "SKIP"} status
 * @property {SeedCandidate[]} candidates
 * @property {string[]} errors
 * @property {string[]} warnings
 */

const SUPPORTED_SEED_MODULES = [
  "schedule",
  "news",
  "profile",
  "discography",
  "video",
  "contact",
];

const MODULE_DEFAULT_ROUTES = {
  schedule: "/schedule/",
  news: "/news/",
  profile: "/profile/",
  discography: "/discography/",
  video: "/videos/",
  contact: "/contact/",
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @returns {string[]}
 */
export function listSupportedSeedModules() {
  return [...SUPPORTED_SEED_MODULES];
}

/**
 * @param {object} config
 * @param {string} moduleId
 */
function resolveModuleRoute(config, moduleId) {
  const configMod = (config.cms?.modules ?? []).find((m) => m.id === moduleId);
  if (configMod?.publicRoute) {
    return configMod.publicRoute.endsWith("/")
      ? configMod.publicRoute
      : `${configMod.publicRoute}/`;
  }
  const presetMod = getPresetModule(config.cmsPreset, moduleId);
  if (presetMod?.publicRoute) {
    return presetMod.publicRoute.endsWith("/")
      ? presetMod.publicRoute
      : `${presetMod.publicRoute}/`;
  }
  return MODULE_DEFAULT_ROUTES[moduleId] ?? `/${moduleId}/`;
}

/**
 * @param {object} crawlResult
 * @param {string} moduleId
 */
function resolveSourcePath(crawlResult, moduleId) {
  const route = MODULE_DEFAULT_ROUTES[moduleId];
  const pages = crawlResult.pages ?? [];
  const match = pages.find((p) => {
    const pPath = p.path?.endsWith("/") ? p.path : `${p.path}/`;
    return pPath === route || p.pageType === moduleId;
  });
  if (match?.path) {
    return match.path.endsWith("/") ? match.path : `${match.path}/`;
  }
  return route ?? `/${moduleId}/`;
}

/**
 * @param {Record<string, unknown>} normalized
 * @param {string[]} requiredKeys
 */
function scoreConfidence(normalized, requiredKeys) {
  const present = requiredKeys.filter((k) => {
    const v = normalized[k];
    return v != null && v !== "";
  });
  const ratio = present.length / requiredKeys.length;
  if (ratio >= 0.85) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

/**
 * @param {string} moduleId
 * @param {unknown} rawItem
 * @param {{ siteSlug: string, sourceRoute: string, sourcePath: string, index?: number }} context
 * @returns {SeedCandidate}
 */
export function normalizeSeedCandidate(moduleId, rawItem, context) {
  const { siteSlug, sourceRoute, sourcePath, index = 0 } = context;
  /** @type {string[]} */
  const warnings = [];
  /** @type {Record<string, unknown>} */
  let normalized = {};
  let title;
  let label;
  let published = true;
  let confidence = "medium";

  const raw = isPlainObject(rawItem) ? rawItem : { value: rawItem };

  switch (moduleId) {
    case "schedule": {
      normalized = {
        title: raw.title ?? null,
        date: raw.date ?? null,
        open_time: raw.open_time ?? raw.openTime ?? null,
        start_time: raw.start_time ?? raw.startTime ?? null,
        venue: raw.venue ?? null,
        price: raw.price ?? null,
        description: raw.description ?? null,
        source_route: sourceRoute,
        published: raw.published !== false,
      };
      title = typeof raw.title === "string" ? raw.title : undefined;
      published = raw.published !== false;
      if (!normalized.date) warnings.push("schedule candidate missing date");
      if (!normalized.title) warnings.push("schedule candidate missing title");
      confidence = scoreConfidence(normalized, ["title", "date", "venue"]);
      break;
    }
    case "news": {
      normalized = {
        title: raw.title ?? null,
        date: raw.date ?? null,
        body: raw.body ?? raw.summary ?? null,
        source_route: sourceRoute,
        published: raw.published !== false,
      };
      title = typeof raw.title === "string" ? raw.title : undefined;
      published = raw.published !== false;
      if (!normalized.title) warnings.push("news candidate missing title");
      confidence = scoreConfidence(normalized, ["title", "date"]);
      break;
    }
    case "profile": {
      normalized = {
        name: raw.headline ?? raw.name ?? raw.title ?? null,
        body: raw.bio ?? raw.body ?? null,
        source_route: sourceRoute,
        published: raw.published !== false,
      };
      label = typeof normalized.name === "string" ? normalized.name : "Profile";
      title = label;
      published = raw.published !== false;
      if (!normalized.name) warnings.push("profile candidate missing name");
      if (!normalized.body) warnings.push("profile candidate missing body");
      confidence = scoreConfidence(normalized, ["name", "body"]);
      break;
    }
    case "discography": {
      normalized = {
        title: raw.title ?? null,
        artist: raw.artist ?? null,
        year: raw.year ?? null,
        description: raw.description ?? null,
        tracks: raw.tracks ?? null,
        source_route: sourceRoute,
        published: raw.published !== false,
      };
      title = typeof raw.title === "string" ? raw.title : undefined;
      published = raw.published !== false;
      if (!normalized.title) warnings.push("discography candidate missing title");
      confidence = scoreConfidence(normalized, ["title", "year"]);
      break;
    }
    case "video": {
      const embedUrl = raw.embedUrl ?? raw.embed_url ?? raw.url ?? null;
      normalized = {
        title: raw.title ?? null,
        url: raw.url ?? embedUrl,
        embed_url: embedUrl,
        description: raw.description ?? null,
        source_route: sourceRoute,
        published: raw.published !== false,
      };
      title = typeof raw.title === "string" ? raw.title : undefined;
      published = raw.published !== false;
      if (!normalized.embed_url && !normalized.url) {
        warnings.push("video candidate missing url/embed_url");
      }
      confidence = scoreConfidence(normalized, ["title", "embed_url"]);
      break;
    }
    case "contact": {
      const email = raw.email ?? raw.emailLabel ?? null;
      /** @type {string[]} */
      const links = [];
      if (typeof email === "string") links.push(`mailto:${email}`);
      if (Array.isArray(raw.links)) {
        for (const link of raw.links) {
          if (typeof link === "string") links.push(link);
        }
      }
      normalized = {
        body: raw.note ?? raw.body ?? null,
        email,
        links,
        source_route: sourceRoute,
        published: raw.published !== false,
      };
      label = "Contact";
      published = raw.published !== false;
      if (!normalized.email && !normalized.body) {
        warnings.push("contact candidate missing email and body");
      }
      confidence = scoreConfidence(normalized, ["email", "body"]);
      break;
    }
    default:
      normalized = { source_route: sourceRoute };
      warnings.push(`unsupported moduleId for normalization: ${moduleId}`);
      confidence = "low";
  }

  const legacyId = isPlainObject(raw) && typeof raw.legacyId === "string" ? raw.legacyId : null;
  const itemSourcePath = legacyId ? `${sourcePath}#${legacyId}` : `${sourcePath}#${index}`;

  /** @type {SeedCandidateStatus} */
  const status = warnings.length > 0 ? "warn" : "candidate";

  return {
    moduleId,
    siteSlug,
    sourcePath: itemSourcePath,
    sourceRoute,
    title,
    label,
    published,
    status,
    confidence,
    raw,
    normalized,
    warnings,
  };
}

/**
 * @param {string} moduleId
 * @param {object} config
 * @param {object} crawlResult
 * @param {object} [options]
 * @returns {ModuleExtractionResult}
 */
export function extractModuleSeedCandidates(moduleId, config, crawlResult, options = {}) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!SUPPORTED_SEED_MODULES.includes(moduleId)) {
    return {
      moduleId,
      enabled: false,
      status: "FAIL",
      candidates: [],
      errors: [`unknown or unsupported module for seed extraction: ${moduleId}`],
      warnings,
    };
  }

  const presetMod = getPresetModule(config.cmsPreset, moduleId);
  if (!presetMod) {
    return {
      moduleId,
      enabled: false,
      status: "FAIL",
      candidates: [],
      errors: [`module ${moduleId} not defined in preset ${config.cmsPreset}`],
      warnings,
    };
  }

  const configMod = (config.cms?.modules ?? []).find((m) => m.id === moduleId);
  const enabled = configMod?.enabled === true;

  if (!enabled) {
    return {
      moduleId,
      enabled: false,
      status: "SKIP",
      candidates: [
        {
          moduleId,
          siteSlug: config.siteSlug ?? crawlResult.siteSlug ?? "",
          sourcePath: resolveSourcePath(crawlResult, moduleId),
          sourceRoute: resolveModuleRoute(config, moduleId),
          published: false,
          status: "skipped",
          confidence: "low",
          raw: null,
          normalized: { source_route: resolveModuleRoute(config, moduleId) },
          warnings: ["module disabled in config — skipped"],
        },
      ],
      errors,
      warnings: ["module disabled — seed extraction skipped"],
    };
  }

  const siteSlug = config.siteSlug ?? crawlResult.siteSlug ?? "";
  const sourceRoute = resolveModuleRoute(config, moduleId);
  const sourcePath = resolveSourcePath(crawlResult, moduleId);
  const seeds = crawlResult.seedCandidates ?? {};
  const rawData = seeds[moduleId];

  /** @type {SeedCandidate[]} */
  const candidates = [];

  if (rawData == null) {
    const seedPolicy = configMod?.seedPolicy ?? presetMod.seedPolicy;
    if (seedPolicy === "skip") {
      warnings.push("no seed data in crawl result — seedPolicy=skip");
      return { moduleId, enabled: true, status: "PASS", candidates: [], errors, warnings };
    }
    warnings.push("enabled module has no seed candidates in crawl result");
    return { moduleId, enabled: true, status: "WARN", candidates: [], errors, warnings };
  }

  if (Array.isArray(rawData)) {
    if (rawData.length === 0) {
      warnings.push("enabled module has empty seed array in crawl result");
      return { moduleId, enabled: true, status: "WARN", candidates: [], errors, warnings };
    }
    rawData.forEach((item, index) => {
      candidates.push(
        normalizeSeedCandidate(moduleId, item, { siteSlug, sourceRoute, sourcePath, index }),
      );
    });
  } else if (isPlainObject(rawData)) {
    candidates.push(
      normalizeSeedCandidate(moduleId, rawData, { siteSlug, sourceRoute, sourcePath, index: 0 }),
    );
  } else {
    errors.push(`invalid seed data type for module ${moduleId}`);
    return { moduleId, enabled: true, status: "FAIL", candidates: [], errors, warnings };
  }

  const moduleStatus = errors.length > 0 ? "FAIL" : candidates.some((c) => c.status === "warn") ? "WARN" : "PASS";

  return {
    moduleId,
    enabled: true,
    status: moduleStatus,
    candidates: candidates.filter((c) => c.status !== "skipped"),
    errors,
    warnings,
  };
}

/**
 * @param {object} config
 * @param {object} crawlResult
 * @param {object} [options]
 */
export function extractOnboardingSeedCandidates(config, crawlResult, options = {}) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!config || !isPlainObject(config)) {
    return {
      ok: false,
      status: "FAIL",
      phase: "G-23g-onboarding-seed-extraction",
      errors: ["config must be an object"],
      warnings,
      modules: {},
      candidates: [],
      summary: summarizeSeedExtraction({ modules: {}, candidates: [] }),
    };
  }

  if (!crawlResult || !isPlainObject(crawlResult)) {
    return {
      ok: false,
      status: "FAIL",
      phase: "G-23g-onboarding-seed-extraction",
      errors: ["crawlResult must be an object"],
      warnings,
      modules: {},
      candidates: [],
      summary: summarizeSeedExtraction({ modules: {}, candidates: [] }),
    };
  }

  const registryValidation = validateCmsPresetConfig(config);
  if (!registryValidation.ok) {
    errors.push(...registryValidation.errors.map((e) => `registry: ${e}`));
  }

  if (config.siteSlug && crawlResult.siteSlug && config.siteSlug !== crawlResult.siteSlug) {
    warnings.push(
      `siteSlug mismatch: config=${config.siteSlug} crawlResult=${crawlResult.siteSlug}`,
    );
  }

  /** @type {Record<string, ModuleExtractionResult>} */
  const modules = {};
  /** @type {SeedCandidate[]} */
  const allCandidates = [];

  const configModules = config.cms?.modules ?? [];
  const seen = new Set();

  for (const configMod of configModules) {
    const moduleId = configMod.id;
    if (!moduleId || seen.has(moduleId)) continue;
    seen.add(moduleId);

    const presetMod = getPresetModule(config.cmsPreset, moduleId);
    if (!presetMod) {
      errors.push(`unknown module id ${moduleId} for preset ${config.cmsPreset}`);
      modules[moduleId] = {
        moduleId,
        enabled: !!configMod.enabled,
        status: "FAIL",
        candidates: [],
        errors: [`unknown module id ${moduleId}`],
        warnings: [],
      };
      continue;
    }

    if (!SUPPORTED_SEED_MODULES.includes(moduleId)) {
      if (configMod.enabled) {
        warnings.push(`module ${moduleId} enabled but not supported by G-23g seed extractor`);
      }
      modules[moduleId] = {
        moduleId,
        enabled: !!configMod.enabled,
        status: configMod.enabled ? "WARN" : "SKIP",
        candidates: [],
        errors: [],
        warnings: [`module ${moduleId} not in supported seed extractor list`],
      };
      continue;
    }

    const result = extractModuleSeedCandidates(moduleId, config, crawlResult, options);
    modules[moduleId] = result;
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    for (const c of result.candidates) {
      if (c.status === "candidate" || c.status === "warn") {
        allCandidates.push(c);
      }
    }
  }

  /** @type {"PASS" | "WARN" | "FAIL"} */
  let status = "PASS";
  if (errors.length > 0 || !registryValidation.ok) {
    status = "FAIL";
  } else if (
    warnings.length > 0 ||
    Object.values(modules).some((m) => m.status === "WARN")
  ) {
    status = "WARN";
  }

  const result = {
    ok: status !== "FAIL",
    status,
    phase: "G-23g-onboarding-seed-extraction",
    siteSlug: config.siteSlug ?? crawlResult.siteSlug ?? null,
    presetId: config.cmsPreset ?? null,
    registryValidation,
    modules,
    candidates: allCandidates,
    errors,
    warnings,
    summary: null,
    fixtureOnly: crawlResult.fixtureOnly === true,
    liveCrawl: crawlResult.source?.liveCrawl === true,
    dbConnectionAttempted: false,
    dbWriteExecuted: false,
    networkAccess: false,
  };

  result.summary = summarizeSeedExtraction(result);
  return result;
}

/**
 * @param {object} result
 */
export function summarizeSeedExtraction(result) {
  /** @type {Record<string, { enabled: boolean, status: string, candidateCount: number, warnCount: number, skipped: boolean }>} */
  const byModule = {};

  for (const [moduleId, mod] of Object.entries(result.modules ?? {})) {
    const active = (mod.candidates ?? []).filter(
      (c) => c.status === "candidate" || c.status === "warn",
    );
    byModule[moduleId] = {
      enabled: mod.enabled,
      status: mod.status,
      candidateCount: active.length,
      warnCount: active.filter((c) => c.status === "warn").length,
      skipped: mod.status === "SKIP",
    };
  }

  const totalCandidates = (result.candidates ?? []).filter(
    (c) => c.status === "candidate" || c.status === "warn",
  ).length;

  return {
    totalCandidates,
    byModule,
    moduleCount: Object.keys(byModule).length,
    status: result.status ?? "PASS",
  };
}
