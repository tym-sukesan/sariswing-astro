/**
 * CMS Core v2 — HubSpot shadow compare (Gosaki legacy inner HTML vs Core renderer).
 *
 * Offline only. Does not switch Gosaki adapter / Contact HTML / HubSpot config.
 *
 * npm: verify:cms-core-v2-external-form-provider-hubspot-shadow-compare
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveHubspotLoaderScriptSrc,
  getExternalFormProviderResult,
} from "./lib/external-form-provider-contract.mjs";
import { renderHubspotConfigHtml } from "./lib/external-form-provider-renderer.mjs";
import {
  GOSAKI_CONTACT_HUBSPOT_ALLOWLIST,
  buildGosakiContactHubspotEmbedHtml,
  loadGosakiContactHubspotConfig,
  validateGosakiContactHubspotConfig,
} from "./lib/gosaki-contact-hubspot-embed.mjs";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const RENDERER = path.join(__dirname, "lib/external-form-provider-renderer.mjs");
const CONTRACT = path.join(__dirname, "lib/external-form-provider-contract.mjs");
const BASELINE_EMBED = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/contact-hubspot-embed.html",
);
const TEMP_OUT_REL = "output/_cms-core-v2-external-form-hubspot-shadow-compare-tmp";

const SITE = "gosaki-piano";
const ENV = "staging";
const OPTS = { expectedSiteSlug: SITE, expectedEnvironment: ENV };

let passed = 0;
let failed = 0;
/** @type {string | null} */
let tempOut = null;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function cleanupTemp() {
  if (tempOut && fs.existsSync(tempOut)) {
    removeGeneratedOutputDir(tempOut, TOOL_ROOT);
  }
  tempOut = null;
}

process.on("exit", () => {
  try {
    cleanupTemp();
  } catch {
    /* ignore */
  }
});

/**
 * Map Gosaki Contact HubSpot JSON → Core flat hubspot config.
 * Strips enabled/page/version/scriptSrc (Core forbids scriptSrc + unknown fields).
 * Does not live in Core — verifier-only mapping for shadow compare.
 *
 * @param {Record<string, unknown>} gosakiConfig
 * @param {{ environment?: "staging" | "production" }} [opts]
 */
function mapGosakiHubspotConfigToCore(gosakiConfig, opts = {}) {
  return {
    provider: "hubspot",
    siteSlug: String(gosakiConfig.siteSlug ?? ""),
    environment: opts.environment === "production" ? "production" : "staging",
    portalId: String(gosakiConfig.portalId ?? ""),
    formId: String(gosakiConfig.formId ?? ""),
    region: String(gosakiConfig.region ?? ""),
  };
}

/**
 * Shadow path: Gosaki exact gate → Core validate → renderHubspotConfigHtml.
 * Returns null html when Gosaki gate fails (do not feed Core) or Core fails.
 *
 * @param {Record<string, unknown>} gosakiConfig
 * @param {{ environment?: "staging" | "production", forceCore?: boolean }} [opts]
 */
function shadowRenderFromGosakiConfig(gosakiConfig, opts = {}) {
  const gate = validateGosakiContactHubspotConfig(gosakiConfig);
  if (!gate.ok && opts.forceCore !== true) {
    return {
      gateOk: false,
      gateErrors: gate.errors,
      coreOk: false,
      html: null,
      reasonCode: "GOSAKI_EXACT_ID_GATE",
    };
  }

  const coreRaw = mapGosakiHubspotConfigToCore(gosakiConfig, {
    environment: opts.environment,
  });
  const validated = getExternalFormProviderResult(coreRaw, {
    expectedSiteSlug: SITE,
    expectedEnvironment: opts.environment === "production" ? "production" : ENV,
  });
  if (!validated.ok) {
    return {
      gateOk: gate.ok,
      gateErrors: gate.errors,
      coreOk: false,
      html: null,
      reasonCode: validated.reasonCode,
      validated,
    };
  }

  const rendered = renderHubspotConfigHtml(validated);
  if (!rendered.ok) {
    return {
      gateOk: gate.ok,
      gateErrors: gate.errors,
      coreOk: false,
      html: null,
      reasonCode: rendered.reasonCode,
      validated,
    };
  }

  return {
    gateOk: gate.ok,
    gateErrors: gate.errors,
    coreOk: true,
    html: rendered.html,
    reasonCode: null,
    validated,
  };
}

/**
 * @param {string} html
 */
function countScripts(html) {
  return (html.match(/<script\b/gi) || []).length;
}

/**
 * @param {string} html
 */
function countFrames(html) {
  return (html.match(/class=["']hs-form-frame["']/g) || []).length;
}

/**
 * @param {string} html
 */
function hasHubspotMarkup(html) {
  return (
    countScripts(html) > 0 ||
    countFrames(html) > 0 ||
    /hsforms\.net/i.test(html) ||
    /hs-form-frame/i.test(html)
  );
}

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
fs.mkdirSync(tempOut, { recursive: true });
fs.writeFileSync(path.join(tempOut, ".keep"), "hubspot-shadow-compare-tmp\n", "utf8");

assert("baseline embed fixture exists", fs.existsSync(BASELINE_EMBED));
assert("renderer exists", fs.existsSync(RENDERER));
assert("contract exists", fs.existsSync(CONTRACT));

const rendererSrc = fs.readFileSync(RENDERER, "utf8");
const contractSrc = fs.readFileSync(CONTRACT, "utf8");
assert("Core renderer has no /gosaki/i", !/gosaki/i.test(rendererSrc));
assert("Core contract has no /gosaki/i", !/gosaki/i.test(contractSrc));
assert("Core renderer has no #comp-jqbwo704", !/#comp-jqbwo704/.test(rendererSrc));
assert(
  "Core renderer has no gosaki-contact-hubspot-embed",
  !/gosaki-contact-hubspot-embed/.test(rendererSrc),
);

const loaded = loadGosakiContactHubspotConfig(TOOL_ROOT);
assert("Gosaki HubSpot config loads", loaded.ok === true, loaded.error ?? "");
assert("Gosaki config path", typeof loaded.configPath === "string");

const gosakiConfig = /** @type {Record<string, unknown>} */ (
  structuredClone(loaded.config)
);
const allow = GOSAKI_CONTACT_HUBSPOT_ALLOWLIST;

assert("exact portalId", String(gosakiConfig.portalId) === allow.portalId);
assert("exact formId", String(gosakiConfig.formId) === allow.formId);
assert("exact region", String(gosakiConfig.region) === allow.region);
assert("exact legacy scriptSrc", String(gosakiConfig.scriptSrc) === allow.scriptSrc);
assert(
  "legacy scriptSrc equals derived",
  String(gosakiConfig.scriptSrc) === deriveHubspotLoaderScriptSrc(allow.portalId),
);

const legacyHtml = buildGosakiContactHubspotEmbedHtml(gosakiConfig);
const fixtureHtml = fs.readFileSync(BASELINE_EMBED, "utf8");
assert("legacy === baseline fixture (byte)", legacyHtml === fixtureHtml);
assert("legacy script count 1", countScripts(legacyHtml) === 1);
assert("legacy frame count 1", countFrames(legacyHtml) === 1);
assert("legacy no trailing newline", !legacyHtml.endsWith("\n"));
assert("legacy has single newline between tags", legacyHtml.includes("</script>\n<div"));

const shadow = shadowRenderFromGosakiConfig(gosakiConfig, { environment: "staging" });
assert("shadow gate ok", shadow.gateOk === true);
assert("shadow core ok", shadow.coreOk === true && typeof shadow.html === "string");
assert(
  "byte-for-byte legacy === Core",
  shadow.html === legacyHtml,
  shadow.html && legacyHtml
    ? `legacyLen=${legacyHtml.length} coreLen=${shadow.html.length}`
    : "missing html",
);
assert("byte-for-byte Core === fixture", shadow.html === fixtureHtml);
assert("Core script count 1", countScripts(shadow.html ?? "") === 1);
assert("Core frame count 1", countFrames(shadow.html ?? "") === 1);
assert(
  "Core script src exact",
  (shadow.html ?? "").includes(`src="${allow.scriptSrc}"`),
);
assert(
  "Core attrs is:inline + defer",
  /<script is:inline src="[^"]+" defer><\/script>/.test(shadow.html ?? ""),
);
assert(
  "Core data-region / form-id / portal-id order",
  /class="hs-form-frame" data-region="na1" data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459" data-portal-id="21392032"/.test(
    shadow.html ?? "",
  ),
);

const mapped = mapGosakiHubspotConfigToCore(gosakiConfig, { environment: "staging" });
assert("mapped has no scriptSrc", !("scriptSrc" in mapped));
assert("mapped has no enabled/page/version", !("enabled" in mapped) && !("page" in mapped) && !("version" in mapped));
assert("mapped siteSlug", mapped.siteSlug === SITE);
assert("mapped environment staging", mapped.environment === "staging");

const beforeJson = JSON.stringify(gosakiConfig);
const again = shadowRenderFromGosakiConfig(gosakiConfig, { environment: "staging" });
const third = shadowRenderFromGosakiConfig(gosakiConfig, { environment: "staging" });
assert("repeat render stable", again.html === shadow.html && third.html === shadow.html);
assert("input mutation none", JSON.stringify(gosakiConfig) === beforeJson);

/**
 * Mutate one allowlist field → Gosaki gate must fail; shadow must not render.
 * @param {string} label
 * @param {Record<string, unknown>} patch
 */
function assertExactGateBlocks(label, patch) {
  const bad = { ...gosakiConfig, ...patch };
  const gate = validateGosakiContactHubspotConfig(bad);
  assert(`${label} Gosaki gate fails`, gate.ok === false);
  const sh = shadowRenderFromGosakiConfig(bad, { environment: "staging" });
  assert(
    `${label} shadow no Core html`,
    sh.gateOk === false && sh.html === null && sh.coreOk === false,
  );
}

assertExactGateBlocks("portalId change", { portalId: "10000001" });
assertExactGateBlocks("formId change", {
  formId: "00000000-0000-4000-8000-000000000001",
});
assertExactGateBlocks("region change", { region: "eu1" });
assertExactGateBlocks("scriptSrc change", {
  scriptSrc: "https://js.hsforms.net/forms/embed/10000001.js",
});
assertExactGateBlocks("scriptSrc host spoof", {
  scriptSrc: "https://evil.example/forms/embed/21392032.js",
});
assertExactGateBlocks("missing portalId", { portalId: "" });
assertExactGateBlocks("siteSlug mismatch on Gosaki gate", { siteSlug: "other-site" });

// Core-only invalid: forceCore with fields that pass a forged object missing allowlist
// but fail Core — never used for equality path.
const coreMissingRegion = getExternalFormProviderResult(
  {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: allow.portalId,
    formId: allow.formId,
  },
  OPTS,
);
assert(
  "Core missing region fail",
  coreMissingRegion.ok === false && coreMissingRegion.reasonCode === "REGION_MISSING",
);
assert(
  "Core missing region no render",
  renderHubspotConfigHtml(coreMissingRegion).ok === false &&
    !hasHubspotMarkup(renderHubspotConfigHtml(coreMissingRegion).html),
);

const coreUnknown = getExternalFormProviderResult(
  {
    ...mapGosakiHubspotConfigToCore(gosakiConfig),
    targetSelector: "#comp-jqbwo704",
  },
  OPTS,
);
assert(
  "Core unknown field fail",
  coreUnknown.ok === false && coreUnknown.reasonCode === "UNKNOWN_FIELD",
);
assert(
  "Core unknown field no render",
  !hasHubspotMarkup(renderHubspotConfigHtml(coreUnknown).html),
);

const coreEnvMismatch = getExternalFormProviderResult(
  mapGosakiHubspotConfigToCore(gosakiConfig, { environment: "staging" }),
  { expectedSiteSlug: SITE, expectedEnvironment: "production" },
);
assert(
  "Core environment mismatch fail",
  coreEnvMismatch.ok === false && coreEnvMismatch.reasonCode === "ENVIRONMENT_MISMATCH",
);
assert(
  "Core environment mismatch no render",
  !hasHubspotMarkup(renderHubspotConfigHtml(coreEnvMismatch).html),
);

const coreSlugMismatch = getExternalFormProviderResult(
  { ...mapGosakiHubspotConfigToCore(gosakiConfig), siteSlug: "mio-kisaragi-jazz" },
  OPTS,
);
assert(
  "Core siteSlug mismatch fail",
  coreSlugMismatch.ok === false && coreSlugMismatch.reasonCode === "SITE_SLUG_MISMATCH",
);
assert(
  "Core siteSlug mismatch no render",
  !hasHubspotMarkup(renderHubspotConfigHtml(coreSlugMismatch).html),
);

const coreScriptSrc = getExternalFormProviderResult(
  {
    ...mapGosakiHubspotConfigToCore(gosakiConfig),
    scriptSrc: allow.scriptSrc,
  },
  OPTS,
);
assert(
  "Core rejects scriptSrc even if matches derived",
  coreScriptSrc.ok === false && coreScriptSrc.reasonCode === "SCRIPT_SRC_FORBIDDEN",
);
assert(
  "Core scriptSrc forbidden no render",
  !hasHubspotMarkup(renderHubspotConfigHtml(coreScriptSrc).html),
);

cleanupTemp();
assert("temp cleanup", !fs.existsSync(path.join(TOOL_ROOT, TEMP_OUT_REL)));

function runNpm(script) {
  return spawnSync("npm", ["run", script], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env, CMS_CORE_V2_VERIFIER_LIVE_SOFT: "false" },
  });
}

const hsRenderer = runNpm("verify:cms-core-v2-external-form-provider-hubspot-renderer");
assert(
  "HubSpot renderer verifier regression",
  hsRenderer.status === 0,
  hsRenderer.stderr?.slice(0, 400) || hsRenderer.stdout?.slice(-200),
);

const elReg = runNpm("verify:cms-core-v2-external-form-provider-external-link");
assert(
  "external-link verifier regression",
  elReg.status === 0,
  elReg.stderr?.slice(0, 400) || elReg.stdout?.slice(-200),
);

const gfReg = runNpm("verify:cms-core-v2-external-form-provider-google-forms");
assert(
  "google-forms verifier regression",
  gfReg.status === 0,
  gfReg.stderr?.slice(0, 400) || gfReg.stdout?.slice(-200),
);

const gosaki = runNpm("verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline");
assert(
  "Gosaki HTML baseline 80 PASS",
  gosaki.status === 0 && /80 passed/i.test(gosaki.stdout || ""),
  gosaki.stderr?.slice(0, 400) || (gosaki.stdout || "").slice(-300),
);

console.log("");
console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
