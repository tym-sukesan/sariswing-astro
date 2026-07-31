/**
 * CMS Core v2 — External form provider contract validator (offline).
 *
 * Run: node scripts/verify-cms-core-v2-external-form-provider-contract-validator.mjs
 * npm: verify:cms-core-v2-external-form-provider-contract-validator
 *
 * No network / DB / Contact render / registry / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXTERNAL_FORM_REASON,
  getExternalFormProviderResult,
  normalizeExternalFormProviderConfig,
  validateExternalFormProviderConfig,
  deriveHubspotLoaderScriptSrc,
  HUBSPOT_LOADER_HOST,
} from "./lib/external-form-provider-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/external-form-provider-contract.mjs");
const PLANNING = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-external-form-provider-contract-planning.md",
);

const SITE = "fixture-site-alpha";
const ENV = "staging";
const OPTS = { expectedSiteSlug: SITE, expectedEnvironment: ENV };

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/**
 * @param {string} name
 * @param {unknown} raw
 * @param {object} [options]
 * @param {string} reasonCode
 */
function assertFail(name, raw, reasonCode, options = OPTS) {
  const r = getExternalFormProviderResult(raw, options);
  assert(
    name,
    r.ok === false &&
      r.provider === "disabled" &&
      r.config === null &&
      r.reasonCode === reasonCode,
    `got ok=${r.ok} provider=${r.provider} reason=${r.reasonCode}`,
  );
}

/**
 * @param {string} name
 * @param {unknown} raw
 * @param {string} provider
 * @param {(config: Record<string, unknown>) => boolean} [check]
 */
function assertOk(name, raw, provider, check, options = OPTS) {
  const r = getExternalFormProviderResult(raw, options);
  const okShape =
    r.ok === true &&
    r.provider === provider &&
    r.reasonCode === null &&
    r.config != null &&
    r.config.provider === provider;
  const extra = check && r.ok ? check(/** @type {Record<string, unknown>} */ (r.config)) : true;
  assert(name, okShape && extra, r.ok ? "config check failed" : `reason=${r.reasonCode}`);
}

assert("core exists", fs.existsSync(CORE));
assert("planning doc exists", fs.existsSync(PLANNING));

const coreSrc = fs.readFileSync(CORE, "utf8");
assert("core has no /gosaki/i", !/gosaki/i.test(coreSrc));
assert("core has no Contact HTML builders", !/<iframe|<script|hs-form-frame/i.test(coreSrc));
assert("core exports getExternalFormProviderResult", /export function getExternalFormProviderResult/.test(coreSrc));
assert("core exports validateExternalFormProviderConfig", /export function validateExternalFormProviderConfig/.test(coreSrc));
assert("core exports normalizeExternalFormProviderConfig", /export function normalizeExternalFormProviderConfig/.test(coreSrc));

// --- happy paths (synthetic IDs / example.invalid only) ---

assertOk("disabled ok", {
  provider: "disabled",
  siteSlug: SITE,
  environment: ENV,
  message: "フォームは公開していません",
}, "disabled", (c) => c.message === "フォームは公開していません");

assertOk("disabled ok without message", {
  provider: "disabled",
  siteSlug: SITE,
  environment: ENV,
}, "disabled", (c) => !("message" in c));

assertOk("external-link ok", {
  provider: "external-link",
  siteSlug: SITE,
  environment: ENV,
  url: "https://forms.example.invalid/booking#section",
  label: "予約フォームを開く",
  allowedHosts: ["forms.example.invalid"],
}, "external-link", (c) =>
  c.url === "https://forms.example.invalid/booking#section" &&
  c.label === "予約フォームを開く" &&
  c.openInNewTab === true &&
  Array.isArray(c.allowedHosts) &&
  c.allowedHosts[0] === "forms.example.invalid");

assertOk(
  "google-forms ok",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform?embedded=true",
    title: "お問い合わせ",
  },
  "google-forms",
  (c) =>
    c.formUrl ===
      "https://docs.google.com/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform?embedded=true" &&
    c.title === "お問い合わせ",
);

const fakePortal = "10000001";
const fakeFormId = "00000000-0000-4000-8000-000000000001";
assertOk(
  "hubspot ok",
  {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: fakePortal,
    formId: fakeFormId,
    region: "na1",
  },
  "hubspot",
  (c) => {
    const loader = /** @type {Record<string, string>} */ (c.loader);
    return (
      c.portalId === fakePortal &&
      c.formId === fakeFormId &&
      c.region === "na1" &&
      loader.host === HUBSPOT_LOADER_HOST &&
      loader.scriptSrc === deriveHubspotLoaderScriptSrc(fakePortal) &&
      !("scriptSrc" in c)
    );
  },
);

// API aliases
{
  const raw = { provider: "disabled", siteSlug: SITE, environment: ENV };
  const a = getExternalFormProviderResult(raw, OPTS);
  const b = validateExternalFormProviderConfig(raw, OPTS);
  const c = normalizeExternalFormProviderConfig(raw, OPTS);
  assert(
    "validate/normalize alias deep-eq",
    JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c),
  );
}

// --- type / missing config ---
assertFail("null config", null, EXTERNAL_FORM_REASON.CONFIG_NOT_OBJECT);
assertFail("undefined config", undefined, EXTERNAL_FORM_REASON.CONFIG_NOT_OBJECT);
assertFail("array config", [], EXTERNAL_FORM_REASON.CONFIG_NOT_OBJECT);
assertFail("string config", "hubspot", EXTERNAL_FORM_REASON.CONFIG_NOT_OBJECT);

assertFail(
  "provider missing",
  { siteSlug: SITE, environment: ENV },
  EXTERNAL_FORM_REASON.PROVIDER_MISSING,
);
assertFail(
  "unknown provider",
  { provider: "typeform", siteSlug: SITE, environment: ENV },
  EXTERNAL_FORM_REASON.PROVIDER_UNKNOWN,
);

assertFail(
  "siteSlug mismatch",
  { provider: "disabled", siteSlug: "other-site", environment: ENV },
  EXTERNAL_FORM_REASON.SITE_SLUG_MISMATCH,
);
assertFail(
  "environment mismatch production-as-staging",
  { provider: "disabled", siteSlug: SITE, environment: "production" },
  EXTERNAL_FORM_REASON.ENVIRONMENT_MISMATCH,
);
assertFail(
  "environment invalid",
  { provider: "disabled", siteSlug: SITE, environment: "dev" },
  EXTERNAL_FORM_REASON.ENVIRONMENT_INVALID,
);

assertFail(
  "constructor key forbidden",
  {
    provider: "disabled",
    siteSlug: SITE,
    environment: ENV,
    constructor: "x",
  },
  EXTERNAL_FORM_REASON.FORBIDDEN_KEY,
);

// --- field mix / unknown ---
assertFail(
  "external-link fields on disabled",
  {
    provider: "disabled",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/x",
  },
  EXTERNAL_FORM_REASON.UNKNOWN_FIELD,
);
assertFail(
  "hubspot fields on external-link",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/x",
    label: "Open",
    portalId: fakePortal,
  },
  EXTERNAL_FORM_REASON.UNKNOWN_FIELD,
);
assertFail(
  "scriptSrc on hubspot",
  {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: fakePortal,
    formId: fakeFormId,
    region: "na1",
    scriptSrc: "https://evil.example/x.js",
  },
  EXTERNAL_FORM_REASON.SCRIPT_SRC_FORBIDDEN,
);

// --- URL attacks (external-link) ---
assertFail(
  "http protocol",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "http://forms.example.invalid/x",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_PROTOCOL,
);
assertFail(
  "javascript protocol",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "javascript:alert(1)",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_PROTOCOL,
);
assertFail(
  "data protocol",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "data:text/html,hi",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_PROTOCOL,
);
assertFail(
  "file protocol",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "file:///etc/passwd",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_PROTOCOL,
);
assertFail(
  "blob protocol",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "blob:https://forms.example.invalid/1",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_PROTOCOL,
);
assertFail(
  "credentials in url",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://user:pass@forms.example.invalid/x",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_CREDENTIALS,
);
assertFail(
  "nonstandard port",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid:8443/x",
    label: "Open",
  },
  EXTERNAL_FORM_REASON.URL_PORT,
);
assertFail(
  "label html",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/x",
    label: "Click <script>",
  },
  EXTERNAL_FORM_REASON.LABEL_INVALID,
);
assertFail(
  "allowedHosts miss exact",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/x",
    label: "Open",
    allowedHosts: ["other.example.invalid"],
  },
  EXTERNAL_FORM_REASON.HOST_NOT_ALLOWED,
);
assertFail(
  "allowedHosts suffix not accepted as host entry",
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/x",
    label: "Open",
    allowedHosts: ["example.invalid"],
  },
  EXTERNAL_FORM_REASON.HOST_NOT_ALLOWED,
);

// --- Google Forms host spoof / path ---
assertFail(
  "google host spoof suffix",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://docs.google.com.example.com/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform",
    title: "Form",
  },
  EXTERNAL_FORM_REASON.FORM_URL_HOST,
);
assertFail(
  "google host spoof prefix",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://example-docs.google.com/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform",
    title: "Form",
  },
  EXTERNAL_FORM_REASON.FORM_URL_HOST,
);
assertFail(
  "google trailing-dot host",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://docs.google.com./forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform",
    title: "Form",
  },
  EXTERNAL_FORM_REASON.FORM_URL_HOST,
);
assertFail(
  "forms.gle shortlink",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://forms.gle/OfflineOnlyFake",
    title: "Form",
  },
  EXTERNAL_FORM_REASON.FORM_URL_SHORTLINK,
);
assertFail(
  "google bad path",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://docs.google.com/forms/d/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform",
    title: "Form",
  },
  EXTERNAL_FORM_REASON.FORM_URL_PATH,
);
assertFail(
  "google unknown query",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform?embedded=true&usp=sharing",
    title: "Form",
  },
  EXTERNAL_FORM_REASON.FORM_URL_QUERY,
);
assertFail(
  "google title html",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform",
    title: '<img src=x onerror=alert(1)>',
  },
  EXTERNAL_FORM_REASON.TITLE_INVALID,
);

// Uppercase host still ok via WHATWG lowercasing
assertOk(
  "google uppercase host normalized",
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://DOCS.GOOGLE.COM/forms/d/e/1FAIpQLSdOfflineValidatorOnlyFakeForm/viewform",
    title: "Form",
  },
  "google-forms",
  (c) => String(c.formUrl).startsWith("https://docs.google.com/"),
);

// --- HubSpot invalid IDs ---
assertFail(
  "invalid portalId",
  {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: "12ab",
    formId: fakeFormId,
    region: "na1",
  },
  EXTERNAL_FORM_REASON.PORTAL_ID_INVALID,
);
assertFail(
  "invalid formId",
  {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: fakePortal,
    formId: "not-a-uuid",
    region: "na1",
  },
  EXTERNAL_FORM_REASON.FORM_ID_INVALID,
);
assertFail(
  "invalid region",
  {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: fakePortal,
    formId: fakeFormId,
    region: "jp1",
  },
  EXTERNAL_FORM_REASON.REGION_INVALID,
);

// --- no input mutation ---
{
  const raw = {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/x",
    label: "Open",
  };
  const before = JSON.stringify(raw);
  getExternalFormProviderResult(raw, OPTS);
  assert("no input mutation", JSON.stringify(raw) === before);
}

// reasonCode stability spot-check
assert(
  "reasonCode CONFIG_NOT_OBJECT stable",
  EXTERNAL_FORM_REASON.CONFIG_NOT_OBJECT === "CONFIG_NOT_OBJECT",
);
assert(
  "reasonCode FORM_URL_SHORTLINK stable",
  EXTERNAL_FORM_REASON.FORM_URL_SHORTLINK === "FORM_URL_SHORTLINK",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("PASS cms-core-v2-external-form-provider-contract-validator");
