/**
 * G-23c — Onboarding config local validator.
 * Validates onboarding config JSON without DB / network / FTP.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/validate-onboarding-config.mjs <config.json> [--json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

export const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
export const PROD_REF = "vsbvndwuajjhnzpohghh";

const SOURCE_PLATFORMS = new Set([
  "wix",
  "studio",
  "jimdo",
  "wordpress",
  "static",
  "unknown",
]);

const SITE_TYPES = new Set([
  "musician-basic",
  "lesson-studio-basic",
  "shop-basic",
  "custom",
]);

const MODULE_IDS = new Set([
  "schedule",
  "news",
  "profile",
  "discography",
  "video",
  "contact",
  "classes",
  "instructors",
  "pricing",
  "menu",
  "access",
  "gallery",
]);

const EXTRACTION_STRATEGIES = new Set([
  "wix-html",
  "supabase-existing",
  "static-json",
  "manual",
  "skip",
]);

const SEED_POLICIES = new Set(["extract-and-review", "skip", "import-existing"]);

const FTP_METHODS = new Set(["manual-filezilla", "lftp-script", "disabled"]);

const TOP_LEVEL_REQUIRED = [
  "schemaVersion",
  "phase",
  "projectName",
  "siteSlug",
  "sourceUrl",
  "sourcePlatform",
  "siteType",
  "cmsPreset",
  "stagingDomain",
  "crawl",
  "cms",
  "supabase",
  "output",
  "ftp",
  "safetyGates",
  "approvals",
];

const CRAWL_REQUIRED = ["maxPages", "sameOriginOnly", "respectRobots"];

const SUPABASE_REQUIRED = [
  "environment",
  "projectLabel",
  "projectRef",
  "forbiddenProjectRefs",
  "siteSlugColumn",
];

const OUTPUT_REQUIRED = [
  "workspaceRoot",
  "fixtureOut",
  "astroOut",
  "staticPublicOut",
  "manualUploadOut",
  "reportsOut",
  "docsOut",
  "deployBase",
];

const FTP_REQUIRED = ["enabled", "method", "autoApply"];

const MODULE_REQUIRED = [
  "id",
  "enabled",
  "extractionStrategy",
  "seedPolicy",
  "adminUiEnabled",
];

const SAFETY_GATES_REQUIRED = [
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

const SAFETY_GATES_SAFE_DEFAULTS = {
  allowDbWrite: false,
  allowPackageBuild: false,
  allowFtpUpload: false,
  allowProductionDeploy: false,
  forbidMirrorDelete: true,
  forbidServiceRole: true,
  manualCommitPush: true,
};

const OUTPUT_UNDER_OUTPUT_DIR = [
  "astroOut",
  "staticPublicOut",
  "manualUploadOut",
  "reportsOut",
];

const SECRET_KEY_PATTERN =
  /^(.*password.*|.*secret.*|.*token.*|.*api[_-]?key.*|.*anon[_-]?key.*|.*service[_-]?role.*|.*private[_-]?key.*|.*credential.*)$/i;

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

const SITE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string} label
 * @param {unknown} value
 * @param {string[]} errors
 */
function requireObject(label, value, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  return true;
}

/**
 * @param {string} label
 * @param {unknown} value
 * @param {string[]} errors
 */
function requireString(label, value, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be a non-empty string`);
    return false;
  }
  return true;
}

/**
 * @param {string} label
 * @param {unknown} value
 * @param {string[]} errors
 */
function requireBoolean(label, value, errors) {
  if (typeof value !== "boolean") {
    errors.push(`${label} must be a boolean`);
    return false;
  }
  return true;
}

/**
 * @param {string} url
 */
function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * @param {string} workspaceRoot
 * @param {string} relOrAbs
 */
function resolveConfigPath(workspaceRoot, relOrAbs) {
  if (path.isAbsolute(relOrAbs)) {
    return path.normalize(relOrAbs);
  }
  const ws = path.isAbsolute(workspaceRoot)
    ? path.normalize(workspaceRoot)
    : path.normalize(path.join(REPO_ROOT, workspaceRoot));
  return path.normalize(path.join(ws, relOrAbs));
}

/**
 * @param {string} absPath
 */
function isUnderToolOutput(absPath) {
  const outputRoot = path.normalize(path.join(TOOL_ROOT, "output"));
  const normalized = path.normalize(absPath);
  return normalized === outputRoot || normalized.startsWith(`${outputRoot}${path.sep}`);
}

/**
 * @param {unknown} node
 * @param {string} keyPath
 * @param {string[]} errors
 */
function scanDangerousKeys(node, keyPath, errors) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => scanDangerousKeys(item, `${keyPath}[${index}]`, errors));
    return;
  }
  if (!isPlainObject(node)) return;

  for (const [key, value] of Object.entries(node)) {
    const fullPath = keyPath ? `${keyPath}.${key}` : key;

    if (/^service[_-]?role$/i.test(key)) {
      errors.push(`forbidden key at ${fullPath}: service_role usage is not allowed in onboarding config`);
    }

    if (SECRET_KEY_PATTERN.test(key) && typeof value === "string" && value.trim() !== "") {
      errors.push(`suspected secret at ${fullPath}: secret-like keys must not hold values in config`);
    }

    if (typeof value === "string") {
      if (JWT_LIKE.test(value)) {
        errors.push(`suspected token/JWT value at ${fullPath}`);
      }
      if (/^eyJ[A-Za-z0-9_-]{20,}$/.test(value.trim())) {
        errors.push(`suspected API key/token at ${fullPath}`);
      }
    }

    scanDangerousKeys(value, fullPath, errors);
  }
}

/**
 * @param {unknown} config
 * @param {{ label?: string }} [options]
 * @returns {{ ok: boolean, status: "PASS" | "FAIL", errors: string[], warnings: string[], label: string }}
 */
export function validateOnboardingConfig(config, options = {}) {
  const label = options.label ?? "onboarding-config";
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!isPlainObject(config)) {
    errors.push("root must be a JSON object");
    return { ok: false, status: "FAIL", errors, warnings, label };
  }

  for (const field of TOP_LEVEL_REQUIRED) {
    if (!(field in config)) {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (requireString("schemaVersion", config.schemaVersion, errors)) {
    if (config.schemaVersion !== "1.0") {
      errors.push(`schemaVersion must be "1.0" (got ${JSON.stringify(config.schemaVersion)})`);
    }
  }

  if (requireString("siteSlug", config.siteSlug, errors)) {
    if (!SITE_SLUG_PATTERN.test(config.siteSlug)) {
      errors.push(
        `siteSlug must match ${SITE_SLUG_PATTERN} (got ${JSON.stringify(config.siteSlug)})`,
      );
    }
  }

  if (requireString("sourceUrl", config.sourceUrl, errors)) {
    if (!isValidHttpUrl(config.sourceUrl)) {
      errors.push(`sourceUrl must be a valid http(s) URL (got ${JSON.stringify(config.sourceUrl)})`);
    }
  }

  if (requireString("sourcePlatform", config.sourcePlatform, errors)) {
    if (!SOURCE_PLATFORMS.has(config.sourcePlatform)) {
      errors.push(
        `sourcePlatform must be one of: ${[...SOURCE_PLATFORMS].join(", ")} (got ${JSON.stringify(config.sourcePlatform)})`,
      );
    }
  }

  if (requireString("siteType", config.siteType, errors)) {
    if (!SITE_TYPES.has(config.siteType)) {
      errors.push(
        `siteType must be one of: ${[...SITE_TYPES].join(", ")} (got ${JSON.stringify(config.siteType)})`,
      );
    }
  }

  if (requireString("cmsPreset", config.cmsPreset, errors)) {
    if (!SITE_TYPES.has(config.cmsPreset)) {
      errors.push(
        `cmsPreset must be one of: ${[...SITE_TYPES].join(", ")} (got ${JSON.stringify(config.cmsPreset)})`,
      );
    }
  }

  if (requireString("stagingDomain", config.stagingDomain, errors)) {
    if (!isValidHttpUrl(config.stagingDomain)) {
      errors.push(
        `stagingDomain must be a valid http(s) URL (got ${JSON.stringify(config.stagingDomain)})`,
      );
    }
  }

  if (config.publicDomain !== undefined && config.publicDomain !== null) {
    if (typeof config.publicDomain !== "string" || !isValidHttpUrl(config.publicDomain)) {
      errors.push("publicDomain must be a valid http(s) URL when present");
    }
  }

  if (requireObject("crawl", config.crawl, errors)) {
    for (const field of CRAWL_REQUIRED) {
      if (!(field in config.crawl)) {
        errors.push(`missing required field: crawl.${field}`);
      }
    }
    if (typeof config.crawl.maxPages !== "number" || config.crawl.maxPages < 1) {
      errors.push("crawl.maxPages must be a number >= 1");
    }
    requireBoolean("crawl.sameOriginOnly", config.crawl.sameOriginOnly, errors);
    requireBoolean("crawl.respectRobots", config.crawl.respectRobots, errors);
  }

  if (requireObject("cms", config.cms, errors)) {
    if (!Array.isArray(config.cms.modules)) {
      errors.push("cms.modules must be an array");
    } else if (config.cms.modules.length === 0) {
      errors.push("cms.modules must contain at least one module");
    } else {
      const seenIds = new Set();
      config.cms.modules.forEach((mod, index) => {
        const prefix = `cms.modules[${index}]`;
        if (!isPlainObject(mod)) {
          errors.push(`${prefix} must be an object`);
          return;
        }
        for (const field of MODULE_REQUIRED) {
          if (!(field in mod)) {
            errors.push(`missing required field: ${prefix}.${field}`);
          }
        }
        if (typeof mod.id === "string") {
          if (!MODULE_IDS.has(mod.id)) {
            errors.push(`${prefix}.id is not an allowed module id: ${JSON.stringify(mod.id)}`);
          }
          if (seenIds.has(mod.id)) {
            errors.push(`${prefix}.id duplicates earlier module id: ${mod.id}`);
          }
          seenIds.add(mod.id);
        }
        requireBoolean(`${prefix}.enabled`, mod.enabled, errors);
        if (typeof mod.extractionStrategy === "string" && !EXTRACTION_STRATEGIES.has(mod.extractionStrategy)) {
          errors.push(
            `${prefix}.extractionStrategy must be one of: ${[...EXTRACTION_STRATEGIES].join(", ")}`,
          );
        }
        if (typeof mod.seedPolicy === "string" && !SEED_POLICIES.has(mod.seedPolicy)) {
          errors.push(
            `${prefix}.seedPolicy must be one of: ${[...SEED_POLICIES].join(", ")}`,
          );
        }
        requireBoolean(`${prefix}.adminUiEnabled`, mod.adminUiEnabled, errors);
        if (mod.publicRoute !== undefined && typeof mod.publicRoute !== "string") {
          errors.push(`${prefix}.publicRoute must be a string when present`);
        }
        if (mod.table !== undefined && mod.table !== null && typeof mod.table !== "string") {
          errors.push(`${prefix}.table must be a string or null when present`);
        }
      });
    }
  }

  if (requireObject("supabase", config.supabase, errors)) {
    for (const field of SUPABASE_REQUIRED) {
      if (!(field in config.supabase)) {
        errors.push(`missing required field: supabase.${field}`);
      }
    }
    if (config.supabase.environment !== "staging") {
      errors.push('supabase.environment must be "staging" during onboarding');
    }
    if (typeof config.supabase.projectRef === "string") {
      if (config.supabase.projectRef === PROD_REF) {
        errors.push(`supabase.projectRef must not be production ref ${PROD_REF}`);
      }
      if (config.supabase.projectRef !== STAGING_REF) {
        warnings.push(
          `supabase.projectRef is ${config.supabase.projectRef} (expected staging ${STAGING_REF} for Kit development)`,
        );
      }
    }
    if (!Array.isArray(config.supabase.forbiddenProjectRefs)) {
      errors.push("supabase.forbiddenProjectRefs must be an array");
    } else if (!config.supabase.forbiddenProjectRefs.includes(PROD_REF)) {
      errors.push(`supabase.forbiddenProjectRefs must include production ref ${PROD_REF}`);
    }
  }

  if (requireObject("output", config.output, errors)) {
    for (const field of OUTPUT_REQUIRED) {
      if (!(field in config.output)) {
        errors.push(`missing required field: output.${field}`);
      }
    }

    const workspaceRoot =
      typeof config.output.workspaceRoot === "string"
        ? config.output.workspaceRoot
        : "tools/static-to-astro";

    for (const field of OUTPUT_UNDER_OUTPUT_DIR) {
      const value = config.output[field];
      if (typeof value !== "string" || value.trim() === "") continue;
      const abs = resolveConfigPath(workspaceRoot, value);
      if (!isUnderToolOutput(abs)) {
        errors.push(
          `output.${field} must resolve under tools/static-to-astro/output (got ${value} → ${abs})`,
        );
      }
    }
  }

  if (requireObject("ftp", config.ftp, errors)) {
    for (const field of FTP_REQUIRED) {
      if (!(field in config.ftp)) {
        errors.push(`missing required field: ftp.${field}`);
      }
    }
    if (requireBoolean("ftp.enabled", config.ftp.enabled, errors)) {
      if (config.ftp.enabled !== false) {
        errors.push("ftp.enabled must be false during onboarding (safe default)");
      }
    }
    if (typeof config.ftp.method === "string" && !FTP_METHODS.has(config.ftp.method)) {
      errors.push(`ftp.method must be one of: ${[...FTP_METHODS].join(", ")}`);
    }
    if (config.ftp.autoApply === true) {
      errors.push("ftp.autoApply must be false during onboarding");
    }
  }

  if (requireObject("safetyGates", config.safetyGates, errors)) {
    for (const field of SAFETY_GATES_REQUIRED) {
      if (!(field in config.safetyGates)) {
        errors.push(`missing required field: safetyGates.${field}`);
      }
    }
    for (const [gate, expected] of Object.entries(SAFETY_GATES_SAFE_DEFAULTS)) {
      if (gate in config.safetyGates && config.safetyGates[gate] !== expected) {
        errors.push(
          `safetyGates.${gate} must be ${expected} for onboarding safe default (got ${JSON.stringify(config.safetyGates[gate])})`,
        );
      }
    }
    if (config.safetyGates.stagingOnly === false) {
      errors.push("safetyGates.stagingOnly must be true during onboarding");
    }
  }

  if (!isPlainObject(config.approvals)) {
    errors.push("approvals must be an object");
  }

  const serialized = JSON.stringify(config);
  if (serialized.includes(PROD_REF)) {
    const allowedInForbiddenOnly =
      Array.isArray(config.supabase?.forbiddenProjectRefs) &&
      config.supabase.forbiddenProjectRefs.includes(PROD_REF) &&
      config.supabase?.projectRef !== PROD_REF;
    if (config.supabase?.projectRef === PROD_REF) {
      errors.push(`production ref ${PROD_REF} must not be used as supabase.projectRef`);
    } else {
      const occurrences = serialized.split(PROD_REF).length - 1;
      const forbiddenCount = Array.isArray(config.supabase?.forbiddenProjectRefs)
        ? config.supabase.forbiddenProjectRefs.filter((r) => r === PROD_REF).length
        : 0;
      if (!allowedInForbiddenOnly || occurrences > forbiddenCount) {
        errors.push(
          `production ref ${PROD_REF} must only appear in supabase.forbiddenProjectRefs (found elsewhere in config)`,
        );
      }
    }
  }

  scanDangerousKeys(config, "", errors);

  const ok = errors.length === 0;
  return {
    ok,
    status: ok ? "PASS" : "FAIL",
    errors,
    warnings,
    label,
  };
}

/**
 * @param {string} filePath
 * @param {{ label?: string }} [options]
 */
export function validateOnboardingConfigFile(filePath, options = {}) {
  const abs = path.resolve(filePath);
  let raw;
  try {
    raw = fs.readFileSync(abs, "utf8");
  } catch (err) {
    return {
      ok: false,
      status: "FAIL",
      errors: [`cannot read file: ${abs} (${err.message})`],
      warnings: [],
      label: options.label ?? path.basename(abs),
      filePath: abs,
    };
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      status: "FAIL",
      errors: [`JSON parse error: ${err.message}`],
      warnings: [],
      label: options.label ?? path.basename(abs),
      filePath: abs,
    };
  }

  const result = validateOnboardingConfig(config, {
    label: options.label ?? path.basename(abs),
  });
  return { ...result, filePath: abs };
}

function printHumanResult(result) {
  console.log(`\nOnboarding config validation: ${result.status}`);
  console.log(`File: ${result.filePath ?? result.label}`);
  if (result.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const w of result.warnings) {
      console.log(`  - ${w}`);
    }
  }
  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const e of result.errors) {
      console.log(`  - ${e}`);
    }
  } else {
    console.log("\nAll checks passed.");
  }
  console.log("");
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const fileArg = args.find((a) => a !== "--json");

  if (!fileArg) {
    console.error(
      "Usage: node validate-onboarding-config.mjs <config.json> [--json]",
    );
    process.exit(2);
  }

  const result = validateOnboardingConfigFile(fileArg);

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanResult(result);
  }

  process.exit(result.ok ? 0 : 1);
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main();
}
