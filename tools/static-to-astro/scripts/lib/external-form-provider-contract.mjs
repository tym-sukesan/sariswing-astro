/**
 * CMS Core v2 — External form provider contract (site-neutral pure validator).
 *
 * Normalize + validate Contact provider config. No HTML/JS generation, no I/O,
 * no network, no site-specific imports.
 *
 * Phase: cms-core-v2-external-form-provider-contract-validator
 */

/** @typedef {"disabled" | "external-link" | "google-forms" | "hubspot"} ExternalFormProvider */

/** @typedef {"staging" | "production"} ExternalFormEnvironment */

/**
 * @typedef {object} ExternalFormValidateOptions
 * @property {string} [expectedSiteSlug]
 * @property {ExternalFormEnvironment} [expectedEnvironment]
 */

/**
 * @typedef {object} ExternalFormOkResult
 * @property {true} ok
 * @property {ExternalFormProvider} provider
 * @property {Record<string, unknown>} config
 * @property {null} reasonCode
 */

/**
 * @typedef {object} ExternalFormFailResult
 * @property {false} ok
 * @property {"disabled"} provider
 * @property {null} config
 * @property {string} reasonCode
 */

/** @typedef {ExternalFormOkResult | ExternalFormFailResult} ExternalFormProviderResult */

export const EXTERNAL_FORM_PROVIDERS = Object.freeze([
  "disabled",
  "external-link",
  "google-forms",
  "hubspot",
]);

export const EXTERNAL_FORM_ENVIRONMENTS = Object.freeze(["staging", "production"]);

export const HUBSPOT_REGIONS = Object.freeze(["na1", "eu1", "ap1"]);

export const HUBSPOT_LOADER_HOST = "js.hsforms.net";

export const GOOGLE_FORMS_EMBED_HOST = "docs.google.com";

/** Stable fail-closed reason codes (offline verifiers lock these strings). */
export const EXTERNAL_FORM_REASON = Object.freeze({
  CONFIG_NOT_OBJECT: "CONFIG_NOT_OBJECT",
  FORBIDDEN_KEY: "FORBIDDEN_KEY",
  PROVIDER_MISSING: "PROVIDER_MISSING",
  PROVIDER_UNKNOWN: "PROVIDER_UNKNOWN",
  SITE_SLUG_MISSING: "SITE_SLUG_MISSING",
  SITE_SLUG_INVALID: "SITE_SLUG_INVALID",
  SITE_SLUG_MISMATCH: "SITE_SLUG_MISMATCH",
  ENVIRONMENT_MISSING: "ENVIRONMENT_MISSING",
  ENVIRONMENT_INVALID: "ENVIRONMENT_INVALID",
  ENVIRONMENT_MISMATCH: "ENVIRONMENT_MISMATCH",
  UNKNOWN_FIELD: "UNKNOWN_FIELD",
  MESSAGE_INVALID: "MESSAGE_INVALID",
  URL_MISSING: "URL_MISSING",
  URL_INVALID: "URL_INVALID",
  URL_PROTOCOL: "URL_PROTOCOL",
  URL_CREDENTIALS: "URL_CREDENTIALS",
  URL_PORT: "URL_PORT",
  URL_HOST: "URL_HOST",
  URL_CHARS: "URL_CHARS",
  LABEL_MISSING: "LABEL_MISSING",
  LABEL_INVALID: "LABEL_INVALID",
  ALLOWED_HOSTS_INVALID: "ALLOWED_HOSTS_INVALID",
  HOST_NOT_ALLOWED: "HOST_NOT_ALLOWED",
  OPEN_IN_NEW_TAB_INVALID: "OPEN_IN_NEW_TAB_INVALID",
  FORM_URL_MISSING: "FORM_URL_MISSING",
  FORM_URL_INVALID: "FORM_URL_INVALID",
  FORM_URL_PROTOCOL: "FORM_URL_PROTOCOL",
  FORM_URL_CREDENTIALS: "FORM_URL_CREDENTIALS",
  FORM_URL_PORT: "FORM_URL_PORT",
  FORM_URL_HOST: "FORM_URL_HOST",
  FORM_URL_PATH: "FORM_URL_PATH",
  FORM_URL_SHORTLINK: "FORM_URL_SHORTLINK",
  FORM_URL_QUERY: "FORM_URL_QUERY",
  FORM_URL_FRAGMENT: "FORM_URL_FRAGMENT",
  FORM_URL_CHARS: "FORM_URL_CHARS",
  TITLE_MISSING: "TITLE_MISSING",
  TITLE_INVALID: "TITLE_INVALID",
  PORTAL_ID_MISSING: "PORTAL_ID_MISSING",
  PORTAL_ID_INVALID: "PORTAL_ID_INVALID",
  FORM_ID_MISSING: "FORM_ID_MISSING",
  FORM_ID_INVALID: "FORM_ID_INVALID",
  REGION_MISSING: "REGION_MISSING",
  REGION_INVALID: "REGION_INVALID",
  SCRIPT_SRC_FORBIDDEN: "SCRIPT_SRC_FORBIDDEN",
});

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const PROVIDER_SET = new Set(EXTERNAL_FORM_PROVIDERS);
const ENV_SET = new Set(EXTERNAL_FORM_ENVIRONMENTS);
const REGION_SET = new Set(HUBSPOT_REGIONS);

/** @type {Readonly<Record<ExternalFormProvider, ReadonlySet<string>>>} */
const ALLOWED_KEYS_BY_PROVIDER = Object.freeze({
  disabled: Object.freeze(new Set(["provider", "siteSlug", "environment", "message"])),
  "external-link": Object.freeze(
    new Set(["provider", "siteSlug", "environment", "url", "label", "allowedHosts", "openInNewTab"]),
  ),
  "google-forms": Object.freeze(
    new Set(["provider", "siteSlug", "environment", "formUrl", "title"]),
  ),
  hubspot: Object.freeze(
    new Set(["provider", "siteSlug", "environment", "portalId", "formId", "region"]),
  ),
});

const SITE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PORTAL_ID_RE = /^[0-9]{1,12}$/;
const FORM_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const GOOGLE_FORMS_PATH_RE = /^\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/;
const HOSTNAME_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const PLAIN_TEXT_UNSAFE_RE = /[<>"'`\u0000-\u001f\u007f]/;

/**
 * @param {string} reasonCode
 * @returns {ExternalFormFailResult}
 */
function fail(reasonCode) {
  return {
    ok: false,
    provider: "disabled",
    config: null,
    reasonCode,
  };
}

/**
 * @param {ExternalFormProvider} provider
 * @param {Record<string, unknown>} config
 * @returns {ExternalFormOkResult}
 */
function ok(provider, config) {
  return {
    ok: true,
    provider,
    config,
    reasonCode: null,
  };
}

/**
 * @param {unknown} value
 */
function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * @param {unknown} value
 * @param {{ max: number, allowEmpty?: boolean }} opts
 */
function validatePlainText(value, opts) {
  if (typeof value !== "string") return false;
  if (value !== value.trim()) return false;
  if (!opts.allowEmpty && value.length === 0) return false;
  if (value.length > opts.max) return false;
  if (PLAIN_TEXT_UNSAFE_RE.test(value)) return false;
  return true;
}

/**
 * @param {string} raw
 * @returns {{ ok: true, url: URL } | { ok: false, reasonCode: string }}
 */
function parseHttpsUrl(raw, reasonPrefix) {
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false, reasonCode: `${reasonPrefix}_MISSING` };
  }
  if (raw !== raw.trim()) {
    return { ok: false, reasonCode: `${reasonPrefix}_CHARS` };
  }
  if (PLAIN_TEXT_UNSAFE_RE.test(raw) || /["'<>`]/.test(raw)) {
    return { ok: false, reasonCode: `${reasonPrefix}_CHARS` };
  }
  if (/^(javascript|data|file|blob|about):/i.test(raw)) {
    return { ok: false, reasonCode: `${reasonPrefix}_PROTOCOL` };
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reasonCode: `${reasonPrefix}_INVALID` };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reasonCode: `${reasonPrefix}_PROTOCOL` };
  }
  if (url.username !== "" || url.password !== "") {
    return { ok: false, reasonCode: `${reasonPrefix}_CREDENTIALS` };
  }
  if (url.port !== "") {
    return { ok: false, reasonCode: `${reasonPrefix}_PORT` };
  }

  const host = url.hostname;
  if (!host || host.endsWith(".") || host.includes(":") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { ok: false, reasonCode: `${reasonPrefix}_HOST` };
  }
  // Exact hostname must already be lowercase from WHATWG; reject unexpected case/forms.
  if (host !== host.toLowerCase() || !HOSTNAME_RE.test(host)) {
    return { ok: false, reasonCode: `${reasonPrefix}_HOST` };
  }

  return { ok: true, url };
}

/**
 * @param {URL} url
 */
function serializeHttpsUrl(url, { allowFragment }) {
  if (!allowFragment && url.hash) {
    return null;
  }
  const out = new URL(url.toString());
  if (!allowFragment) out.hash = "";
  // Default https port omitted by URL serializer.
  return out.toString();
}

/**
 * @param {Record<string, unknown>} raw
 * @param {ExternalFormProvider} provider
 */
function rejectUnknownFields(raw, provider) {
  const allowed = ALLOWED_KEYS_BY_PROVIDER[provider];
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return EXTERNAL_FORM_REASON.FORBIDDEN_KEY;
    }
    if (key === "scriptSrc") {
      return EXTERNAL_FORM_REASON.SCRIPT_SRC_FORBIDDEN;
    }
    if (!allowed.has(key)) {
      return EXTERNAL_FORM_REASON.UNKNOWN_FIELD;
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {ExternalFormValidateOptions} options
 */
function validateEnvelope(raw, options) {
  if (!("provider" in raw) || raw.provider === undefined || raw.provider === null) {
    return { error: EXTERNAL_FORM_REASON.PROVIDER_MISSING };
  }
  if (typeof raw.provider !== "string" || !PROVIDER_SET.has(raw.provider)) {
    return { error: EXTERNAL_FORM_REASON.PROVIDER_UNKNOWN };
  }
  /** @type {ExternalFormProvider} */
  const provider = /** @type {ExternalFormProvider} */ (raw.provider);

  const unknown = rejectUnknownFields(raw, provider);
  if (unknown) return { error: unknown };

  if (!("siteSlug" in raw) || raw.siteSlug === undefined || raw.siteSlug === null) {
    return { error: EXTERNAL_FORM_REASON.SITE_SLUG_MISSING };
  }
  if (typeof raw.siteSlug !== "string" || !SITE_SLUG_RE.test(raw.siteSlug)) {
    return { error: EXTERNAL_FORM_REASON.SITE_SLUG_INVALID };
  }
  if (
    typeof options.expectedSiteSlug === "string" &&
    options.expectedSiteSlug.length > 0 &&
    raw.siteSlug !== options.expectedSiteSlug
  ) {
    return { error: EXTERNAL_FORM_REASON.SITE_SLUG_MISMATCH };
  }

  if (!("environment" in raw) || raw.environment === undefined || raw.environment === null) {
    return { error: EXTERNAL_FORM_REASON.ENVIRONMENT_MISSING };
  }
  if (typeof raw.environment !== "string" || !ENV_SET.has(raw.environment)) {
    return { error: EXTERNAL_FORM_REASON.ENVIRONMENT_INVALID };
  }
  if (
    typeof options.expectedEnvironment === "string" &&
    options.expectedEnvironment.length > 0
  ) {
    if (!ENV_SET.has(options.expectedEnvironment)) {
      return { error: EXTERNAL_FORM_REASON.ENVIRONMENT_INVALID };
    }
    if (raw.environment !== options.expectedEnvironment) {
      return { error: EXTERNAL_FORM_REASON.ENVIRONMENT_MISMATCH };
    }
  }

  return {
    error: null,
    provider,
    siteSlug: raw.siteSlug,
    environment: /** @type {ExternalFormEnvironment} */ (raw.environment),
  };
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} siteSlug
 * @param {ExternalFormEnvironment} environment
 */
function normalizeDisabled(raw, siteSlug, environment) {
  /** @type {Record<string, unknown>} */
  const config = {
    provider: "disabled",
    siteSlug,
    environment,
  };
  if ("message" in raw) {
    if (!validatePlainText(raw.message, { max: 200 })) {
      return fail(EXTERNAL_FORM_REASON.MESSAGE_INVALID);
    }
    config.message = raw.message;
  }
  return ok("disabled", config);
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} siteSlug
 * @param {ExternalFormEnvironment} environment
 */
function normalizeExternalLink(raw, siteSlug, environment) {
  if (!("url" in raw)) return fail(EXTERNAL_FORM_REASON.URL_MISSING);
  if (!("label" in raw)) return fail(EXTERNAL_FORM_REASON.LABEL_MISSING);

  const parsed = parseHttpsUrl(raw.url, "URL");
  if (!parsed.ok) {
    return fail(
      EXTERNAL_FORM_REASON[parsed.reasonCode] ?? parsed.reasonCode,
    );
  }

  // Fragment allowed for external-link (fixed policy).
  const normalizedUrl = serializeHttpsUrl(parsed.url, { allowFragment: true });
  if (!normalizedUrl) return fail(EXTERNAL_FORM_REASON.URL_INVALID);

  if (!validatePlainText(raw.label, { max: 80 })) {
    return fail(EXTERNAL_FORM_REASON.LABEL_INVALID);
  }

  /** @type {Record<string, unknown>} */
  const config = {
    provider: "external-link",
    siteSlug,
    environment,
    url: normalizedUrl,
    label: raw.label,
    openInNewTab: true,
  };

  if ("openInNewTab" in raw) {
    if (typeof raw.openInNewTab !== "boolean") {
      return fail(EXTERNAL_FORM_REASON.OPEN_IN_NEW_TAB_INVALID);
    }
    config.openInNewTab = raw.openInNewTab;
  }

  if ("allowedHosts" in raw) {
    if (!Array.isArray(raw.allowedHosts) || raw.allowedHosts.length === 0) {
      return fail(EXTERNAL_FORM_REASON.ALLOWED_HOSTS_INVALID);
    }
    /** @type {string[]} */
    const hosts = [];
    for (const h of raw.allowedHosts) {
      if (typeof h !== "string" || h !== h.toLowerCase() || !HOSTNAME_RE.test(h) || h.endsWith(".")) {
        return fail(EXTERNAL_FORM_REASON.ALLOWED_HOSTS_INVALID);
      }
      hosts.push(h);
    }
    if (!hosts.includes(parsed.url.hostname)) {
      return fail(EXTERNAL_FORM_REASON.HOST_NOT_ALLOWED);
    }
    config.allowedHosts = hosts;
  }

  return ok("external-link", config);
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} siteSlug
 * @param {ExternalFormEnvironment} environment
 */
function normalizeGoogleForms(raw, siteSlug, environment) {
  if (!("formUrl" in raw)) return fail(EXTERNAL_FORM_REASON.FORM_URL_MISSING);
  if (!("title" in raw)) return fail(EXTERNAL_FORM_REASON.TITLE_MISSING);

  if (typeof raw.formUrl === "string" && /forms\.gle/i.test(raw.formUrl)) {
    return fail(EXTERNAL_FORM_REASON.FORM_URL_SHORTLINK);
  }

  const parsed = parseHttpsUrl(raw.formUrl, "FORM_URL");
  if (!parsed.ok) {
    return fail(
      EXTERNAL_FORM_REASON[parsed.reasonCode] ?? parsed.reasonCode,
    );
  }

  if (parsed.url.hostname !== GOOGLE_FORMS_EMBED_HOST) {
    return fail(EXTERNAL_FORM_REASON.FORM_URL_HOST);
  }
  if (parsed.url.hash) {
    return fail(EXTERNAL_FORM_REASON.FORM_URL_FRAGMENT);
  }
  if (!GOOGLE_FORMS_PATH_RE.test(parsed.url.pathname)) {
    return fail(EXTERNAL_FORM_REASON.FORM_URL_PATH);
  }

  // Query: allow only embedded=true (optional). Drop nothing silently — reject unknowns.
  const keys = [...parsed.url.searchParams.keys()];
  for (const key of keys) {
    if (key !== "embedded") {
      return fail(EXTERNAL_FORM_REASON.FORM_URL_QUERY);
    }
    if (parsed.url.searchParams.get(key) !== "true") {
      return fail(EXTERNAL_FORM_REASON.FORM_URL_QUERY);
    }
  }

  if (!validatePlainText(raw.title, { max: 120 })) {
    return fail(EXTERNAL_FORM_REASON.TITLE_INVALID);
  }

  const normalized = new URL(parsed.url.toString());
  normalized.hash = "";
  normalized.search = "";
  // Always emit embed-ready query (iframe contract).
  normalized.searchParams.set("embedded", "true");

  return ok("google-forms", {
    provider: "google-forms",
    siteSlug,
    environment,
    formUrl: normalized.toString(),
    title: raw.title,
  });
}

/**
 * @param {string} portalId
 */
export function deriveHubspotLoaderScriptSrc(portalId) {
  return `https://${HUBSPOT_LOADER_HOST}/forms/embed/${portalId}.js`;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} siteSlug
 * @param {ExternalFormEnvironment} environment
 */
function normalizeHubspot(raw, siteSlug, environment) {
  if ("scriptSrc" in raw) {
    return fail(EXTERNAL_FORM_REASON.SCRIPT_SRC_FORBIDDEN);
  }
  if (!("portalId" in raw)) return fail(EXTERNAL_FORM_REASON.PORTAL_ID_MISSING);
  if (!("formId" in raw)) return fail(EXTERNAL_FORM_REASON.FORM_ID_MISSING);
  if (!("region" in raw)) return fail(EXTERNAL_FORM_REASON.REGION_MISSING);

  if (typeof raw.portalId !== "string" || !PORTAL_ID_RE.test(raw.portalId)) {
    return fail(EXTERNAL_FORM_REASON.PORTAL_ID_INVALID);
  }
  if (typeof raw.formId !== "string" || !FORM_ID_RE.test(raw.formId)) {
    return fail(EXTERNAL_FORM_REASON.FORM_ID_INVALID);
  }
  if (typeof raw.region !== "string" || !REGION_SET.has(raw.region)) {
    return fail(EXTERNAL_FORM_REASON.REGION_INVALID);
  }

  const scriptSrc = deriveHubspotLoaderScriptSrc(raw.portalId);

  return ok("hubspot", {
    provider: "hubspot",
    siteSlug,
    environment,
    portalId: raw.portalId,
    formId: raw.formId,
    region: raw.region,
    loader: {
      host: HUBSPOT_LOADER_HOST,
      path: `/forms/embed/${raw.portalId}.js`,
      scriptSrc,
    },
  });
}

/**
 * Validate + normalize External Form provider config (fail-closed).
 * Does not mutate `rawConfig`. Never throws for invalid input.
 *
 * @param {unknown} rawConfig
 * @param {ExternalFormValidateOptions} [options]
 * @returns {ExternalFormProviderResult}
 */
export function getExternalFormProviderResult(rawConfig, options = {}) {
  if (!isPlainObject(rawConfig)) {
    return fail(EXTERNAL_FORM_REASON.CONFIG_NOT_OBJECT);
  }

  for (const key of Object.keys(rawConfig)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return fail(EXTERNAL_FORM_REASON.FORBIDDEN_KEY);
    }
  }

  const envelope = validateEnvelope(/** @type {Record<string, unknown>} */ (rawConfig), options);
  if (envelope.error) {
    return fail(envelope.error);
  }

  const { provider, siteSlug, environment } = envelope;
  const raw = /** @type {Record<string, unknown>} */ (rawConfig);

  switch (provider) {
    case "disabled":
      return normalizeDisabled(raw, siteSlug, environment);
    case "external-link":
      return normalizeExternalLink(raw, siteSlug, environment);
    case "google-forms":
      return normalizeGoogleForms(raw, siteSlug, environment);
    case "hubspot":
      return normalizeHubspot(raw, siteSlug, environment);
    default:
      return fail(EXTERNAL_FORM_REASON.PROVIDER_UNKNOWN);
  }
}

/**
 * @param {unknown} rawConfig
 * @param {ExternalFormValidateOptions} [options]
 * @returns {ExternalFormProviderResult}
 */
export function validateExternalFormProviderConfig(rawConfig, options = {}) {
  return getExternalFormProviderResult(rawConfig, options);
}

/**
 * Normalize when valid; otherwise fail-closed result (config null).
 *
 * @param {unknown} rawConfig
 * @param {ExternalFormValidateOptions} [options]
 * @returns {ExternalFormProviderResult}
 */
export function normalizeExternalFormProviderConfig(rawConfig, options = {}) {
  return getExternalFormProviderResult(rawConfig, options);
}
