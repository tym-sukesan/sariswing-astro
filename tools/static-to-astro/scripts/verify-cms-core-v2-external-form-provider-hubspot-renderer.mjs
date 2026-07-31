/**
 * CMS Core v2 — External form provider HubSpot pure renderer (offline).
 *
 * npm: verify:cms-core-v2-external-form-provider-hubspot-renderer
 * No network · no Gosaki adapter switch · no Contact HTML / config mutation · no package / FTP / DB.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveHubspotLoaderScriptSrc,
  getExternalFormProviderResult,
  HUBSPOT_LOADER_HOST,
} from "./lib/external-form-provider-contract.mjs";
import {
  renderExternalFormFailClosedNoticeHtml,
  renderExternalFormProviderHtml,
  renderExternalLinkConfigHtml,
  renderGoogleFormsConfigHtml,
  renderHubspotConfigHtml,
} from "./lib/external-form-provider-renderer.mjs";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const RENDERER = path.join(__dirname, "lib/external-form-provider-renderer.mjs");
const TEMP_OUT_REL = "output/_cms-core-v2-external-form-hubspot-renderer-tmp";

const SITE = "fixture-site-hubspot-alpha";
const ENV = "staging";
const OPTS = { expectedSiteSlug: SITE, expectedEnvironment: ENV };

/** Synthetic non-customer IDs only (never Gosaki live portal/form). */
const SYN_PORTAL = "10000001";
const SYN_FORM = "00000000-0000-4000-8000-000000000001";
const SYN_REGION = "na1";

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
 * @param {Partial<{ portalId: string, formId: string, region: string }> & Record<string, unknown>} [extra]
 */
function hubspotRaw(extra = {}) {
  return {
    provider: "hubspot",
    siteSlug: SITE,
    environment: ENV,
    portalId: SYN_PORTAL,
    formId: SYN_FORM,
    region: SYN_REGION,
    ...extra,
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
  return countScripts(html) > 0 || countFrames(html) > 0 || /hsforms\.net/i.test(html);
}

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
fs.mkdirSync(tempOut, { recursive: true });
fs.writeFileSync(path.join(tempOut, ".keep"), "hubspot-renderer-tmp\n", "utf8");

assert("renderer module exists", fs.existsSync(RENDERER));
const rendererSrc = fs.readFileSync(RENDERER, "utf8");
assert("renderer exports renderHubspotConfigHtml", /export function renderHubspotConfigHtml/.test(rendererSrc));
assert("renderer has no /gosaki/i", !/gosaki/i.test(rendererSrc));
assert("renderer has no #comp-jqbwo704", !/#comp-jqbwo704/.test(rendererSrc));
assert(
  "renderer has no gosaki-contact-hubspot-embed id",
  !/gosaki-contact-hubspot-embed/.test(rendererSrc),
);
assert("renderer has no customer portal 21392032", !/21392032/.test(rendererSrc));

const good = getExternalFormProviderResult(hubspotRaw(), OPTS);
assert("validator hubspot ok", good.ok === true && good.provider === "hubspot");
const rendered = renderHubspotConfigHtml(good);
assert("hubspot render ok", rendered.ok === true);
assert("hubspot script count 1", countScripts(rendered.html) === 1);
assert("hubspot frame count 1", countFrames(rendered.html) === 1);
assert("hubspot no iframe", !/<iframe\b/i.test(rendered.html));

const expectedSrc = deriveHubspotLoaderScriptSrc(SYN_PORTAL);
assert(
  "hubspot loader src derived",
  rendered.html.includes(`src="${expectedSrc}"`) && expectedSrc.includes(HUBSPOT_LOADER_HOST),
);
assert("hubspot portalId attr", rendered.html.includes(`data-portal-id="${SYN_PORTAL}"`));
assert("hubspot formId attr", rendered.html.includes(`data-form-id="${SYN_FORM}"`));
assert("hubspot region attr", rendered.html.includes(`data-region="${SYN_REGION}"`));
assert(
  "hubspot attribute order",
  /class="hs-form-frame" data-region="[^"]+" data-form-id="[^"]+" data-portal-id="[^"]+"/.test(
    rendered.html,
  ),
);
assert(
  "hubspot script attrs",
  /<script is:inline src="[^"]+" defer><\/script>/.test(rendered.html),
);
assert("hubspot newline between tags", rendered.html.includes("</script>\n<div"));

const viaDispatcher = renderExternalFormProviderHtml(good);
assert(
  "dispatcher rendered hubspot",
  viaDispatcher.ok && viaDispatcher.rendered === "hubspot" && viaDispatcher.html === rendered.html,
);

for (const region of ["na1", "eu1", "ap1"]) {
  const r = getExternalFormProviderResult(hubspotRaw({ region }), OPTS);
  const html = renderHubspotConfigHtml(r);
  assert(
    `region ${region} loader host`,
    html.ok &&
      html.html.includes(deriveHubspotLoaderScriptSrc(SYN_PORTAL)) &&
      html.html.includes(`data-region="${region}"`) &&
      !/unknown|evil|http:\/\//i.test(html.html),
  );
}

const mutatedInput = hubspotRaw({
  scriptSrc: "https://evil.example/forms/embed/999.js",
});
const scriptSrcResult = getExternalFormProviderResult(mutatedInput, OPTS);
assert(
  "user scriptSrc rejected by validator",
  scriptSrcResult.ok === false && scriptSrcResult.reasonCode === "SCRIPT_SRC_FORBIDDEN",
);
const scriptSrcHtml = renderHubspotConfigHtml(scriptSrcResult);
assert("user scriptSrc no markup", scriptSrcHtml.ok === false && !hasHubspotMarkup(scriptSrcHtml.html));

assert(
  "unknown host never generated",
  !/evil\.example|cdn\.example|hs-scripts\.com/i.test(rendered.html) &&
    rendered.html.includes(`https://${HUBSPOT_LOADER_HOST}/forms/embed/${SYN_PORTAL}.js`) &&
    !/src=["'](?!https:\/\/js\.hsforms\.net\/)/i.test(rendered.html),
);

/**
 * @param {string} label
 * @param {unknown} raw
 * @param {string} reason
 */
function assertFailClosed(label, raw, reason) {
  const v = getExternalFormProviderResult(raw, OPTS);
  assert(`${label} validator fail`, v.ok === false && v.reasonCode === reason);
  const h = renderHubspotConfigHtml(v);
  assert(
    `${label} no hubspot markup`,
    h.ok === false && !hasHubspotMarkup(h.html) && countScripts(h.html) === 0 && countFrames(h.html) === 0,
  );
  const d = renderExternalFormProviderHtml(v);
  assert(
    `${label} dispatcher notice`,
    d.ok === false && d.rendered === "notice" && !hasHubspotMarkup(d.html),
  );
}

assertFailClosed("portalId invalid", hubspotRaw({ portalId: "abc" }), "PORTAL_ID_INVALID");
assertFailClosed(
  "formId invalid",
  hubspotRaw({ formId: "not-a-uuid" }),
  "FORM_ID_INVALID",
);
assertFailClosed("region invalid", hubspotRaw({ region: "us1" }), "REGION_INVALID");
assertFailClosed(
  "siteSlug mismatch",
  hubspotRaw({ siteSlug: "other-site" }),
  "SITE_SLUG_MISMATCH",
);
assertFailClosed(
  "environment mismatch",
  hubspotRaw({ environment: "production" }),
  "ENVIRONMENT_MISMATCH",
);
assertFailClosed(
  "unknown field",
  hubspotRaw({ targetSelector: "#comp-jqbwo704" }),
  "UNKNOWN_FIELD",
);
assertFailClosed(
  "html inject field",
  hubspotRaw({ html: "<script>alert(1)</script>" }),
  "UNKNOWN_FIELD",
);
assertFailClosed(
  "wrapper inject field",
  hubspotRaw({ wrapper: "<div id='x'>" }),
  "UNKNOWN_FIELD",
);
assertFailClosed(
  "selector inject field",
  hubspotRaw({ selector: "#evil" }),
  "UNKNOWN_FIELD",
);

const disabled = getExternalFormProviderResult(
  { provider: "disabled", siteSlug: SITE, environment: ENV },
  OPTS,
);
const disabledHs = renderHubspotConfigHtml(disabled);
assert(
  "disabled not hubspot render",
  disabled.ok &&
    disabledHs.ok === false &&
    disabledHs.reasonCode === "PROVIDER_NOT_HUBSPOT" &&
    !hasHubspotMarkup(disabledHs.html),
);
const disabledDisp = renderExternalFormProviderHtml(disabled);
assert(
  "disabled dispatcher notice",
  disabledDisp.ok && disabledDisp.rendered === "notice" && !hasHubspotMarkup(disabledDisp.html),
);

const link = getExternalFormProviderResult(
  {
    provider: "external-link",
    siteSlug: SITE,
    environment: ENV,
    url: "https://forms.example.invalid/booking",
    label: "Booking",
  },
  OPTS,
);
const linkHs = renderHubspotConfigHtml(link);
assert(
  "external-link not hubspot markup",
  link.ok && linkHs.ok === false && !hasHubspotMarkup(linkHs.html),
);
const linkDisp = renderExternalFormProviderHtml(link);
assert(
  "external-link still anchor",
  linkDisp.ok &&
    linkDisp.rendered === "external-link" &&
    /data-external-form-link=/.test(linkDisp.html) &&
    !hasHubspotMarkup(linkDisp.html),
);
assert(
  "external-link config html retained",
  renderExternalLinkConfigHtml(/** @type {Record<string, unknown>} */ (link.config)).ok === true,
);

const gf = getExternalFormProviderResult(
  {
    provider: "google-forms",
    siteSlug: SITE,
    environment: ENV,
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdOfflineOnlyFakeForm/viewform",
    title: "Form",
  },
  OPTS,
);
const gfHs = renderHubspotConfigHtml(gf);
assert(
  "google-forms not hubspot markup",
  gf.ok && gfHs.ok === false && !hasHubspotMarkup(gfHs.html),
);
const gfDisp = renderExternalFormProviderHtml(gf);
assert(
  "google-forms still iframe",
  gfDisp.ok &&
    gfDisp.rendered === "google-forms" &&
    /data-external-form-iframe=/.test(gfDisp.html) &&
    !hasHubspotMarkup(gfDisp.html),
);
assert(
  "google-forms config html retained",
  renderGoogleFormsConfigHtml(/** @type {Record<string, unknown>} */ (gf.config)).ok === true,
);

const rawCopy = hubspotRaw();
const beforeJson = JSON.stringify(rawCopy);
const validated = getExternalFormProviderResult(rawCopy, OPTS);
renderHubspotConfigHtml(validated);
renderExternalFormProviderHtml(validated);
assert("input mutation none", JSON.stringify(rawCopy) === beforeJson);

const notice = renderExternalFormFailClosedNoticeHtml({ reasonCode: "TEST" });
assert("fail notice has no script/frame", !hasHubspotMarkup(notice));

cleanupTemp();
assert("temp cleanup", !fs.existsSync(path.join(TOOL_ROOT, TEMP_OUT_REL)));

function runNpm(script) {
  const r = spawnSync("npm", ["run", script], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env, CMS_CORE_V2_VERIFIER_LIVE_SOFT: "false" },
  });
  return r;
}

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
  gosaki.status === 0 && /8[01] passed/i.test(gosaki.stdout || ""),
  gosaki.stderr?.slice(0, 400) || (gosaki.stdout || "").slice(-300),
);

console.log("");
console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
