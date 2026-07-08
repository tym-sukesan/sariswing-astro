/**
 * G-23n — Onboarding crawl allowlist validator.
 * Static validation only — no DNS / HTTP / network / DB.
 */

import fs from "node:fs";

export const PROD_REF = "vsbvndwuajjhnzpohghh";

export const ALLOWLIST_VERSION = "1.0";

export const LIMITS = {
  maxPages: 20,
  maxConcurrency: 2,
  maxRequestTimeoutMs: 15000,
};

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/i,
  /^::1$/i,
  /example\.com$/i,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/,
];

const REQUIRED_DENY_FLAGS = [
  "denyPrivateIp",
  "denyLocalhost",
  "denyLoginPages",
  "denyCredentials",
  "denyDbWrite",
  "denyFtp",
];

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string} raw
 */
function parseUrlHostname(raw) {
  try {
    const u = new URL(raw);
    return { hostname: u.hostname, protocol: u.protocol, origin: u.origin };
  } catch {
    return null;
  }
}

/**
 * @param {string} hostname
 */
function isBlockedHostname(hostname) {
  if (!hostname) return true;
  if (hostname.includes("localhost")) return true;
  return BLOCKED_HOST_PATTERNS.some((re) => re.test(hostname));
}

/**
 * @param {string} haystack
 */
function containsForbiddenRef(haystack) {
  return typeof haystack === "string" && haystack.includes(PROD_REF);
}

/**
 * @param {string} haystack
 */
function containsServiceRole(haystack) {
  return typeof haystack === "string" && /service_role/i.test(haystack);
}

/**
 * @param {object} config
 */
function activeSurfaceSerialized(config) {
  return JSON.stringify({
    explicitCrawlApprovalId: config.explicitCrawlApprovalId,
    approvedBy: config.approvedBy,
    approvedAt: config.approvedAt,
    allowedTargets: config.allowedTargets ?? [],
    sourceUrl: config.sourceUrl,
  });
}

/**
 * @param {object} config
 */
function containsForbiddenRefInActiveSurface(config) {
  return containsForbiddenRef(activeSurfaceSerialized(config));
}

/**
 * @param {object} config
 */
function containsServiceRoleInActiveSurface(config) {
  return containsServiceRole(activeSurfaceSerialized(config));
}

/**
 * @param {object} target
 * @param {string} prefix
 * @param {string[]} errors
 * @param {string[]} warnings
 */
function validateAllowedTarget(target, prefix, errors, warnings) {
  if (!isPlainObject(target)) {
    errors.push(`${prefix}: must be an object`);
    return;
  }

  const sourceUrl = typeof target.sourceUrl === "string" ? target.sourceUrl : "";
  if (!sourceUrl) {
    errors.push(`${prefix}.sourceUrl is required when readyForLiveCrawl=true`);
    return;
  }

  if (containsForbiddenRef(sourceUrl) || containsForbiddenRef(JSON.stringify(target))) {
    errors.push(`${prefix}: forbidden production ref ${PROD_REF} in target`);
  }

  if (containsServiceRole(sourceUrl) || containsServiceRole(JSON.stringify(target))) {
    errors.push(`${prefix}: service_role must not appear in crawl allowlist target`);
  }

  const parsed = parseUrlHostname(sourceUrl);
  if (!parsed) {
    errors.push(`${prefix}.sourceUrl is not a valid URL: ${sourceUrl}`);
    return;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    errors.push(`${prefix}.sourceUrl must use http or https`);
  } else if (parsed.protocol === "http:") {
    warnings.push(`${prefix}.sourceUrl uses http — https recommended`);
  }

  if (isBlockedHostname(parsed.hostname)) {
    errors.push(`${prefix}.sourceUrl hostname blocked: ${parsed.hostname}`);
  }

  if (target.sameOriginOnly !== true) {
    errors.push(`${prefix}.sameOriginOnly must be true`);
  }

  const maxPages = Number(target.maxPages);
  if (!Number.isFinite(maxPages) || maxPages < 1) {
    errors.push(`${prefix}.maxPages must be a positive number`);
  } else if (maxPages > LIMITS.maxPages) {
    errors.push(`${prefix}.maxPages must be <= ${LIMITS.maxPages}`);
  }

  const concurrency = Number(target.concurrency);
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    errors.push(`${prefix}.concurrency must be a positive number`);
  } else if (concurrency > LIMITS.maxConcurrency) {
    errors.push(`${prefix}.concurrency must be <= ${LIMITS.maxConcurrency}`);
  }

  const timeout = Number(target.requestTimeoutMs);
  if (!Number.isFinite(timeout) || timeout < 1) {
    errors.push(`${prefix}.requestTimeoutMs must be a positive number`);
  } else if (timeout > LIMITS.maxRequestTimeoutMs) {
    errors.push(`${prefix}.requestTimeoutMs must be <= ${LIMITS.maxRequestTimeoutMs}`);
  }

  if (target.respectRobotsTxt !== true) {
    errors.push(`${prefix}.respectRobotsTxt must be true`);
  }

  for (const flag of REQUIRED_DENY_FLAGS) {
    if (target[flag] !== true) {
      errors.push(`${prefix}.${flag} must be true`);
    }
  }

  if (target.denyServiceRole !== true) {
    errors.push(`${prefix}.denyServiceRole must be true`);
  }

  if (target.denyCookies !== true) {
    errors.push(`${prefix}.denyCookies must be true`);
  }

  const allowedOrigin = typeof target.allowedOrigin === "string" ? target.allowedOrigin : "";
  if (allowedOrigin && allowedOrigin !== parsed.origin) {
    warnings.push(`${prefix}.allowedOrigin differs from sourceUrl origin`);
  }
}

/**
 * @param {unknown} config
 * @param {object} [options]
 * @param {string} [options.label]
 */
export function validateOnboardingCrawlAllowlist(config, options = {}) {
  const { label = "crawl-allowlist" } = options;
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!isPlainObject(config)) {
    return {
      ok: false,
      status: "FAIL",
      label,
      errors: ["config root must be a JSON object"],
      warnings,
      readyForLiveCrawl: false,
      networkAccess: false,
      dnsLookupAttempted: false,
    };
  }

  if (containsForbiddenRefInActiveSurface(config)) {
    errors.push(`forbidden production ref ${PROD_REF} must not appear as active crawl target`);
  }
  if (containsServiceRoleInActiveSurface(config)) {
    errors.push("service_role must not appear in crawl allowlist active surface");
  }

  if (config.version !== ALLOWLIST_VERSION) {
    warnings.push(`version expected ${ALLOWLIST_VERSION}, got ${JSON.stringify(config.version)}`);
  }

  const readyForLiveCrawl = config.readyForLiveCrawl === true;

  if (!Array.isArray(config.deniedTargets)) {
    errors.push("deniedTargets must be an array");
  } else {
    const deniedPatterns = config.deniedTargets.map((d) =>
      isPlainObject(d) ? String(d.pattern ?? d.label ?? "") : String(d),
    );
    const requiredDenied = ["localhost", "127.0.0.1", "example.com", PROD_REF];
    for (const req of requiredDenied) {
      if (!deniedPatterns.some((p) => p.includes(req))) {
        warnings.push(`deniedTargets should include ${req}`);
      }
    }
  }

  if (!readyForLiveCrawl) {
    const status = errors.length > 0 ? "FAIL" : "PASS_WITH_NOT_READY";
    return {
      ok: errors.length === 0,
      status,
      label,
      errors,
      warnings,
      readyForLiveCrawl: false,
      allowedTargetCount: Array.isArray(config.allowedTargets) ? config.allowedTargets.length : 0,
      message: "readyForLiveCrawl=false — allowlist structure valid but live crawl not armed",
      networkAccess: false,
      dnsLookupAttempted: false,
      liveCrawlExecuted: false,
    };
  }

  const approvalId =
    typeof config.explicitCrawlApprovalId === "string" ? config.explicitCrawlApprovalId.trim() : "";
  if (!approvalId) {
    errors.push("explicitCrawlApprovalId is required when readyForLiveCrawl=true");
  }

  const approvedBy = typeof config.approvedBy === "string" ? config.approvedBy.trim() : "";
  if (!approvedBy) {
    errors.push("approvedBy is required when readyForLiveCrawl=true");
  }

  const approvedAt = typeof config.approvedAt === "string" ? config.approvedAt.trim() : "";
  if (!approvedAt) {
    errors.push("approvedAt is required when readyForLiveCrawl=true");
  }

  if (!Array.isArray(config.allowedTargets) || config.allowedTargets.length === 0) {
    errors.push("allowedTargets must contain at least one target when readyForLiveCrawl=true");
  } else {
    config.allowedTargets.forEach((target, i) => {
      validateAllowedTarget(target, `allowedTargets[${i}]`, errors, warnings);
    });
  }

  const status = errors.length > 0 ? "FAIL" : warnings.length > 0 ? "WARN" : "PASS";
  return {
    ok: errors.length === 0,
    status,
    label,
    errors,
    warnings,
    readyForLiveCrawl: true,
    allowedTargetCount: config.allowedTargets?.length ?? 0,
    explicitCrawlApprovalId: approvalId || null,
    networkAccess: false,
    dnsLookupAttempted: false,
    liveCrawlExecuted: false,
  };
}

/**
 * @param {string} filePath
 */
export function loadAndValidateCrawlAllowlist(filePath) {
  let config;
  try {
    config = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return {
      ok: false,
      status: "FAIL",
      label: filePath,
      errors: [`read/parse error: ${err.message}`],
      warnings: [],
      readyForLiveCrawl: false,
      networkAccess: false,
      dnsLookupAttempted: false,
    };
  }
  return validateOnboardingCrawlAllowlist(config, { label: filePath });
}
