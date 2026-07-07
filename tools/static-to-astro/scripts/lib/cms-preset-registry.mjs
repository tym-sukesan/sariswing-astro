/**
 * G-23f — CMS preset registry for Static-to-Astro onboarding.
 * Read-only metadata — no DB / network / FTP.
 */

/** @typedef {"low" | "medium" | "high"} RiskLevel */

/**
 * @typedef {object} CmsPresetModule
 * @property {string} id
 * @property {string} label
 * @property {boolean} enabledByDefault
 * @property {string | null} table
 * @property {string} publishField
 * @property {string} sourceExtractionStrategy
 * @property {string} seedPolicy
 * @property {boolean} adminUiEnabled
 * @property {string} publicRoute
 * @property {string[]} [publicRouteAliases]
 * @property {RiskLevel} riskLevel
 * @property {string} [notes]
 */

/**
 * @typedef {object} CmsPreset
 * @property {string} id
 * @property {string} label
 * @property {string} description
 * @property {string} siteType
 * @property {string[]} defaultModules
 * @property {Record<string, CmsPresetModule>} modules
 * @property {string[]} recommendedRoutes
 * @property {string[]} requiredSafetyGates
 * @property {string[]} unsupportedFeatures
 */

const STANDARD_SAFETY_GATES = [
  "stagingOnly",
  "requireHumanReview",
  "allowDbWrite",
  "allowPackageBuild",
  "allowFtpUpload",
  "allowProductionDeploy",
  "forbidMirrorDelete",
  "forbidServiceRole",
  "requireOutputDiffReview",
  "requireUploadFileList",
  "requireRollbackPlanForDbWrite",
  "manualCommitPush",
];

const STANDARD_UNSUPPORTED = [
  "production-deploy",
  "ftp-mirror-delete",
  "service_role",
  "physical-delete-default",
  "auto-commit-push",
];

/**
 * @param {CmsPresetModule} def
 * @returns {CmsPresetModule}
 */
function mod(def) {
  return def;
}

/** @type {Record<string, CmsPreset>} */
export const CMS_PRESET_REGISTRY = {
  "musician-basic": {
    id: "musician-basic",
    label: "Musician Basic",
    description:
      "Musician / band personal site — Schedule CMS P0 proven on Gosaki; news/profile/discography/video/contact planned.",
    siteType: "musician-basic",
    defaultModules: ["schedule"],
    modules: {
      schedule: mod({
        id: "schedule",
        label: "Schedule",
        enabledByDefault: true,
        table: "public.schedules",
        publishField: "published",
        sourceExtractionStrategy: "wix-html",
        seedPolicy: "extract-and-review",
        adminUiEnabled: true,
        publicRoute: "/schedule/",
        riskLevel: "medium",
        notes: "P0 complete on Gosaki — site_slug filtered rows; optimistic lock on UPDATE.",
      }),
      news: mod({
        id: "news",
        label: "News",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "skip",
        seedPolicy: "skip",
        adminUiEnabled: false,
        publicRoute: "/news/",
        riskLevel: "low",
        notes: "Planned — static JSON or future Supabase table.",
      }),
      profile: mod({
        id: "profile",
        label: "Profile / About",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/about/",
        publicRouteAliases: ["/profile/"],
        riskLevel: "low",
        notes: "About page HTML or static JSON blocks (Gosaki /about/; fixtures may use /profile/).",
      }),
      discography: mod({
        id: "discography",
        label: "Discography",
        enabledByDefault: false,
        table: "public.discography",
        publishField: "published",
        sourceExtractionStrategy: "wix-html",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/discography/",
        riskLevel: "medium",
        notes: "Read + partial write proven on Gosaki staging.",
      }),
      video: mod({
        id: "video",
        label: "Video / YouTube",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "import-existing",
        adminUiEnabled: false,
        publicRoute: "/",
        publicRouteAliases: ["/videos/"],
        riskLevel: "low",
        notes: "Home embed via static JSON (G-10c pattern); fixtures may use /videos/ hub.",
      }),
      contact: mod({
        id: "contact",
        label: "Contact",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "skip",
        adminUiEnabled: false,
        publicRoute: "/contact/",
        riskLevel: "low",
        notes: "Static or HubSpot embed — no DB write in v1.",
      }),
    },
    recommendedRoutes: ["/", "/schedule/", "/about/", "/discography/", "/contact/", "/news/"],
    requiredSafetyGates: STANDARD_SAFETY_GATES,
    unsupportedFeatures: STANDARD_UNSUPPORTED,
  },

  "lesson-studio-basic": {
    id: "lesson-studio-basic",
    label: "Lesson Studio Basic",
    description: "Dance / music school site — schedule, classes, instructors, news, pricing, contact.",
    siteType: "lesson-studio-basic",
    defaultModules: ["schedule", "contact"],
    modules: {
      schedule: mod({
        id: "schedule",
        label: "Schedule / Events",
        enabledByDefault: true,
        table: "public.schedules",
        publishField: "published",
        sourceExtractionStrategy: "wix-html",
        seedPolicy: "extract-and-review",
        adminUiEnabled: true,
        publicRoute: "/schedule/",
        riskLevel: "medium",
        notes: "Lessons and recital dates — reuse Schedule CMS pattern.",
      }),
      classes: mod({
        id: "classes",
        label: "Classes / Courses",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/classes/",
        riskLevel: "low",
        notes: "Course listing — static JSON v1.",
      }),
      instructors: mod({
        id: "instructors",
        label: "Instructors",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/instructors/",
        riskLevel: "low",
        notes: "Teacher profiles — static JSON v1.",
      }),
      news: mod({
        id: "news",
        label: "News",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/news/",
        riskLevel: "low",
        notes: "Announcements and studio updates.",
      }),
      pricing: mod({
        id: "pricing",
        label: "Pricing",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "skip",
        adminUiEnabled: false,
        publicRoute: "/pricing/",
        riskLevel: "low",
        notes: "Fee tables — static content v1.",
      }),
      contact: mod({
        id: "contact",
        label: "Contact",
        enabledByDefault: true,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "skip",
        adminUiEnabled: false,
        publicRoute: "/contact/",
        riskLevel: "low",
        notes: "Inquiry form or static contact block.",
      }),
    },
    recommendedRoutes: [
      "/",
      "/schedule/",
      "/classes/",
      "/instructors/",
      "/news/",
      "/pricing/",
      "/contact/",
    ],
    requiredSafetyGates: STANDARD_SAFETY_GATES,
    unsupportedFeatures: STANDARD_UNSUPPORTED,
  },

  "shop-basic": {
    id: "shop-basic",
    label: "Shop Basic",
    description: "Small shop / salon site — news, menu/services, access, gallery, contact.",
    siteType: "shop-basic",
    defaultModules: ["news", "contact"],
    modules: {
      news: mod({
        id: "news",
        label: "News",
        enabledByDefault: true,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/news/",
        riskLevel: "low",
        notes: "Shop announcements and hours updates.",
      }),
      menu: mod({
        id: "menu",
        label: "Menu / Services",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/menu/",
        riskLevel: "low",
        notes: "Menu and services listing combined (G-23a Menu / Service).",
      }),
      access: mod({
        id: "access",
        label: "Access / Location",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "skip",
        adminUiEnabled: false,
        publicRoute: "/access/",
        riskLevel: "low",
        notes: "Map, address, transit — static v1.",
      }),
      gallery: mod({
        id: "gallery",
        label: "Gallery",
        enabledByDefault: false,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "extract-and-review",
        adminUiEnabled: false,
        publicRoute: "/gallery/",
        riskLevel: "low",
        notes: "Photo gallery — static images v1.",
      }),
      contact: mod({
        id: "contact",
        label: "Contact",
        enabledByDefault: true,
        table: null,
        publishField: "published",
        sourceExtractionStrategy: "static-json",
        seedPolicy: "skip",
        adminUiEnabled: false,
        publicRoute: "/contact/",
        riskLevel: "low",
        notes: "Contact form or phone/email block.",
      }),
    },
    recommendedRoutes: ["/", "/news/", "/menu/", "/access/", "/gallery/", "/contact/"],
    requiredSafetyGates: STANDARD_SAFETY_GATES,
    unsupportedFeatures: [...STANDARD_UNSUPPORTED, "e-commerce-cart"],
  },
};

/**
 * @param {string} id
 * @returns {CmsPreset | null}
 */
export function getCmsPreset(id) {
  return CMS_PRESET_REGISTRY[id] ?? null;
}

/**
 * @returns {CmsPreset[]}
 */
export function listCmsPresets() {
  return Object.values(CMS_PRESET_REGISTRY);
}

/**
 * @param {string} presetId
 * @returns {CmsPresetModule[]}
 */
export function listPresetModules(presetId) {
  const preset = getCmsPreset(presetId);
  if (!preset) return [];
  return Object.values(preset.modules);
}

/**
 * @param {string} presetId
 * @param {string} moduleId
 * @returns {CmsPresetModule | null}
 */
export function getPresetModule(presetId, moduleId) {
  const preset = getCmsPreset(presetId);
  if (!preset) return null;
  return preset.modules[moduleId] ?? null;
}

/**
 * @param {unknown} a
 * @param {unknown} b
 */
function valuesMatch(a, b) {
  if (a == null && b == null) return true;
  return a === b;
}

/**
 * @param {CmsPresetModule} registryModule
 * @param {string} configRoute
 */
function publicRouteMatches(registryModule, configRoute) {
  if (configRoute === registryModule.publicRoute) return true;
  const aliases = registryModule.publicRouteAliases ?? [];
  return aliases.includes(configRoute);
}

/**
 * @param {unknown} config
 * @returns {{ ok: boolean, status: "PASS" | "FAIL", errors: string[], warnings: string[], presetId: string | null }}
 */
export function validateCmsPresetConfig(config) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!config || typeof config !== "object") {
    return {
      ok: false,
      status: "FAIL",
      errors: ["config must be an object"],
      warnings,
      presetId: null,
    };
  }

  const presetId = config.cmsPreset;
  if (typeof presetId !== "string" || !presetId) {
    errors.push("cmsPreset is required");
    return { ok: false, status: "FAIL", errors, warnings, presetId: null };
  }

  const preset = getCmsPreset(presetId);
  if (!preset) {
    errors.push(`unknown cmsPreset: ${presetId}`);
    return { ok: false, status: "FAIL", errors, warnings, presetId };
  }

  if (config.siteType !== preset.siteType) {
    if (config.siteType === "custom" && presetId !== "custom") {
      errors.push(`siteType custom is not allowed for preset ${presetId}`);
    } else if (config.siteType !== preset.siteType) {
      errors.push(
        `siteType ${JSON.stringify(config.siteType)} does not match preset siteType ${preset.siteType}`,
      );
    }
  }

  if (!config.cms || !Array.isArray(config.cms.modules)) {
    errors.push("cms.modules must be an array");
    return { ok: false, status: "FAIL", errors, warnings, presetId };
  }

  const seen = new Set();
  for (const [index, entry] of config.cms.modules.entries()) {
    const prefix = `cms.modules[${index}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix} must be an object`);
      continue;
    }

    const moduleId = entry.id;
    if (typeof moduleId !== "string" || !moduleId) {
      errors.push(`${prefix}.id is required`);
      continue;
    }

    if (seen.has(moduleId)) {
      errors.push(`duplicate module id: ${moduleId}`);
    }
    seen.add(moduleId);

    const registryModule = getPresetModule(presetId, moduleId);
    if (!registryModule) {
      errors.push(`unknown module id ${moduleId} for preset ${presetId}`);
      continue;
    }

    if (entry.enabled === true) {
      if (!valuesMatch(entry.table, registryModule.table)) {
        errors.push(
          `${prefix}.table ${JSON.stringify(entry.table)} conflicts with registry ${JSON.stringify(registryModule.table)}`,
        );
      }
      if (entry.publishField !== registryModule.publishField) {
        errors.push(
          `${prefix}.publishField ${JSON.stringify(entry.publishField)} conflicts with registry ${JSON.stringify(registryModule.publishField)}`,
        );
      }
      if (!publicRouteMatches(registryModule, entry.publicRoute)) {
        errors.push(
          `${prefix}.publicRoute ${JSON.stringify(entry.publicRoute)} conflicts with registry ${JSON.stringify(registryModule.publicRoute)}`,
        );
      }
    }
  }

  const ok = errors.length === 0;
  return {
    ok,
    status: ok ? "PASS" : "FAIL",
    errors,
    warnings,
    presetId,
  };
}
