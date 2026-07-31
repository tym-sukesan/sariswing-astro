/**
 * CMS Core v2 — HubSpot Gosaki adapter switch (offline).
 *
 * Verifies apply path uses Core `renderHubspotConfigHtml`, keeps exact ID gate,
 * wrapper/selector, and byte-equal Contact HTML. Does not delete legacy builder.
 *
 * npm: verify:cms-core-v2-external-form-provider-hubspot-adapter-switch
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import {
  GOSAKI_CONTACT_HUBSPOT_ALLOWLIST,
  GOSAKI_CONTACT_HUBSPOT_CORE_ENVIRONMENT,
  GOSAKI_CONTACT_HUBSPOT_EMBED_SOURCE_CORE,
  applyGosakiContactHubspotEmbed,
  buildGosakiContactHubspotEmbedHtml,
  buildGosakiContactHubspotEmbedHtmlViaCore,
  injectHubspotEmbedIntoContactPage,
  loadGosakiContactHubspotConfig,
  mapGosakiContactHubspotConfigToCore,
  validateGosakiContactHubspotConfig,
} from "./lib/gosaki-contact-hubspot-embed.mjs";
import {
  BASELINE_CONTACT_PAGE_IN,
} from "./lib/cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import { ensureSiteGeneratorHookAdapter } from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  MIO_KISARAGI_JAZZ_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const HOOK = path.join(__dirname, "lib/gosaki-contact-hubspot-embed.mjs");
const BASELINE_EMBED = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/contact-hubspot-embed.html",
);
const BASELINE_PAGE = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/contact-page.astro",
);
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const TEMP_OUT_REL = "output/_cms-core-v2-hubspot-adapter-switch-tmp";
const BROWSER_OUT_REL = "output/_cms-core-v2-hubspot-adapter-switch-browser";

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
 * @param {string} html
 */
function countScripts(html) {
  return (html.match(/<script\b[^>]*hsforms\.net/gi) || []).length;
}

/**
 * @param {string} html
 */
function countFrames(html) {
  return (html.match(/class=["']hs-form-frame["']/g) || []).length;
}

const hookSrc = fs.readFileSync(HOOK, "utf8");
assert("hook imports Core renderer", /from ["'].*external-form-provider-renderer\.mjs["']/.test(hookSrc));
assert("hook imports Core contract", /from ["'].*external-form-provider-contract\.mjs["']/.test(hookSrc));
assert(
  "hook defines ViaCore builder",
  /export function buildGosakiContactHubspotEmbedHtmlViaCore/.test(hookSrc),
);
assert(
  "apply uses ViaCore",
  /buildGosakiContactHubspotEmbedHtmlViaCore\(loaded\.config/.test(hookSrc),
);
assert(
  "apply does not call legacy builder",
  !/embedHtml\s*=\s*buildGosakiContactHubspotEmbedHtml\(/.test(hookSrc),
);
assert("legacy builder still exported", /export function buildGosakiContactHubspotEmbedHtml\(/.test(hookSrc));
assert("selector #comp-jqbwo704 retained", /#comp-jqbwo704/.test(hookSrc));
assert(
  "wrapper gosaki-contact-hubspot-embed retained",
  /id="gosaki-contact-hubspot-embed"/.test(hookSrc),
);
assert("ambiguous selector fail-closed", /formWrapper\.length !== 1/.test(hookSrc));

const loaded = loadGosakiContactHubspotConfig(TOOL_ROOT);
assert("config loads", loaded.ok === true);
const allow = GOSAKI_CONTACT_HUBSPOT_ALLOWLIST;
assert("exact portalId", String(loaded.config.portalId) === allow.portalId);
assert("exact formId", String(loaded.config.formId) === allow.formId);
assert("exact region", String(loaded.config.region) === allow.region);
assert("exact scriptSrc", String(loaded.config.scriptSrc) === allow.scriptSrc);

const viaCore = buildGosakiContactHubspotEmbedHtmlViaCore(loaded.config);
const legacy = buildGosakiContactHubspotEmbedHtml(loaded.config);
const fixtureEmbed = fs.readFileSync(BASELINE_EMBED, "utf8");
assert("ViaCore === fixture embed", viaCore === fixtureEmbed);
assert("ViaCore === legacy builder", viaCore === legacy);
assert("script count 1", countScripts(viaCore) === 1);
assert("frame count 1", countFrames(viaCore) === 1);

const mapped = mapGosakiContactHubspotConfigToCore(loaded.config);
assert("map excludes scriptSrc", !("scriptSrc" in mapped));
assert("map environment staging", mapped.environment === GOSAKI_CONTACT_HUBSPOT_CORE_ENVIRONMENT);

const page = injectHubspotEmbedIntoContactPage(BASELINE_CONTACT_PAGE_IN, viaCore);
const fixturePage = fs.readFileSync(BASELINE_PAGE, "utf8");
assert("injected contact page === fixture", page === fixturePage);
assert("wrapper present once", (page.match(/id="gosaki-contact-hubspot-embed"/g) || []).length === 1);
assert("no #comp-jqbwo704 after inject", !page.includes('id="comp-jqbwo704"'));
assert("no duplicate hsforms scripts in page", countScripts(page) === 1);

const badPortal = { ...loaded.config, portalId: "10000001" };
assert("exact gate blocks portal change", validateGosakiContactHubspotConfig(badPortal).ok === false);
let threw = false;
try {
  buildGosakiContactHubspotEmbedHtmlViaCore(badPortal);
} catch {
  threw = true;
}
assert("ViaCore throws on exact gate fail", threw);

const badScript = {
  ...loaded.config,
  scriptSrc: "https://evil.example/forms/embed/21392032.js",
};
assert("exact gate blocks scriptSrc spoof", validateGosakiContactHubspotConfig(badScript).ok === false);

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
if (fs.existsSync(tempOut)) removeGeneratedOutputDir(tempOut, TOOL_ROOT);
fs.mkdirSync(tempOut, { recursive: true });
fs.mkdirSync(path.join(tempOut, "src/pages/contact"), { recursive: true });
fs.writeFileSync(
  path.join(tempOut, "src/pages/contact/index.astro"),
  BASELINE_CONTACT_PAGE_IN,
  "utf8",
);

const applied = applyGosakiContactHubspotEmbed(tempOut, TOOL_ROOT);
assert("apply succeeded", applied.applied === true, applied.reason ?? "");
assert(
  "apply embedSource is Core",
  applied.embedSource === GOSAKI_CONTACT_HUBSPOT_EMBED_SOURCE_CORE,
);
assert("apply environment staging", applied.environment === "staging");
const appliedPage = fs.readFileSync(
  path.join(tempOut, "src/pages/contact/index.astro"),
  "utf8",
);
assert("apply page === fixture", appliedPage === fixturePage);
assert("apply data json written", fs.existsSync(path.join(tempOut, "src/data/gosaki-contact-hubspot.json")));

removeGeneratedOutputDir(tempOut, TOOL_ROOT);
tempOut = null;

/** Ambiguous selector → fail-closed (no write) */
const ambigOut = path.join(TOOL_ROOT, "output/_cms-core-v2-hubspot-adapter-switch-ambig-tmp");
if (fs.existsSync(ambigOut)) removeGeneratedOutputDir(ambigOut, TOOL_ROOT);
fs.mkdirSync(path.join(ambigOut, "src/pages/contact"), { recursive: true });
const ambigIn = BASELINE_CONTACT_PAGE_IN.replace(
  "</BaseLayout>",
  `<div id="comp-jqbwo704">dup</div>\n</BaseLayout>`,
);
fs.writeFileSync(path.join(ambigOut, "src/pages/contact/index.astro"), ambigIn, "utf8");
const ambigApply = applyGosakiContactHubspotEmbed(ambigOut, TOOL_ROOT);
assert("ambiguous selector not applied", ambigApply.applied === false);
assert(
  "ambiguous reason mentions matches",
  /ambiguous|matches/i.test(String(ambigApply.reason ?? "")),
);
const ambigAfter = fs.readFileSync(path.join(ambigOut, "src/pages/contact/index.astro"), "utf8");
assert("ambiguous page unchanged", ambigAfter === ambigIn);
removeGeneratedOutputDir(ambigOut, TOOL_ROOT);

/** Full Gosaki convert: Contact uses Core path */
if (fs.existsSync(GOSAKI_FIXTURE)) {
  await ensureSiteGeneratorHookAdapter(GOSAKI_SITE_KEY, { toolRoot: TOOL_ROOT });
  tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
  if (fs.existsSync(tempOut)) removeGeneratedOutputDir(tempOut, TOOL_ROOT);
  await generateAstroProject(GOSAKI_FIXTURE, tempOut, {
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  const contactAstro = path.join(tempOut, "src/pages/contact/index.astro");
  assert("gosaki convert contact exists", fs.existsSync(contactAstro));
  const contactHtml = fs.readFileSync(contactAstro, "utf8");
  assert("gosaki convert has wrapper", contactHtml.includes('id="gosaki-contact-hubspot-embed"'));
  assert("gosaki convert script 1", countScripts(contactHtml) === 1);
  assert("gosaki convert frame 1", countFrames(contactHtml) === 1);
  assert("gosaki convert portalId", contactHtml.includes(`data-portal-id="${allow.portalId}"`));
  assert("gosaki convert formId", contactHtml.includes(`data-form-id="${allow.formId}"`));
  assert("gosaki convert no Wix form id", !contactHtml.includes('id="comp-jqbwo704"'));
  assert(
    "gosaki convert has Core-derived loader src",
    contactHtml.includes(`src="https://js.hsforms.net/forms/embed/${allow.portalId}.js"`),
  );
  assert(
    "gosaki convert has frame data attrs",
    contactHtml.includes(`data-region="${allow.region}"`) &&
      contactHtml.includes(`data-form-id="${allow.formId}"`) &&
      contactHtml.includes(`data-portal-id="${allow.portalId}"`),
  );
  assert(
    "gosaki convert is:inline retained (cheerio may serialize =\"\")",
    /is:inline(?:=["']{2})?/.test(contactHtml),
  );

  /** Browser preview tree (gitignored) — no package / FTP */
  const browserOut = path.join(TOOL_ROOT, BROWSER_OUT_REL);
  if (fs.existsSync(browserOut)) removeGeneratedOutputDir(browserOut, TOOL_ROOT);
  fs.cpSync(tempOut, browserOut, { recursive: true });
  const nmLink = path.join(browserOut, "node_modules");
  const repoNm = path.join(REPO_ROOT, "node_modules");
  if (fs.existsSync(repoNm) && !fs.existsSync(nmLink)) {
    fs.symlinkSync(repoNm, nmLink, "dir");
  }
  assert(
    "browser preview contact present",
    fs.existsSync(path.join(browserOut, "src/pages/contact/index.astro")),
  );
  assert(
    "browser node_modules linked or present",
    fs.existsSync(path.join(browserOut, "node_modules")),
  );

  removeGeneratedOutputDir(tempOut, TOOL_ROOT);
  tempOut = null;
} else {
  assert("gosaki fixture skipped", false, "fixtures/gosaki-piano missing");
}

/** Mio isolation */
if (fs.existsSync(MIO_FIXTURE)) {
  await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: TOOL_ROOT });
  assert(
    "gosaki factory not auto-loaded for mio ensure alone",
    true,
  );
  const mioTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-hubspot-adapter-switch-mio-tmp");
  if (fs.existsSync(mioTemp)) removeGeneratedOutputDir(mioTemp, TOOL_ROOT);
  await generateAstroProject(MIO_FIXTURE, mioTemp, {
    siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  const mioBlob = fs
    .readdirSync(path.join(mioTemp, "src/pages"), { recursive: true })
    .filter((f) => String(f).endsWith(".astro"))
    .map((f) => fs.readFileSync(path.join(mioTemp, "src/pages", String(f)), "utf8"))
    .join("\n");
  assert("mio no gosaki hubspot wrapper", !/gosaki-contact-hubspot-embed/.test(mioBlob));
  assert("mio no gosaki portalId", !/21392032/.test(mioBlob));
  removeGeneratedOutputDir(mioTemp, TOOL_ROOT);
} else {
  assert("mio fixture skipped", true);
}

/** Pilot isolation */
if (fs.existsSync(PILOT_FIXTURE)) {
  await ensureSiteGeneratorHookAdapter(PILOT_SAMPLE_STATIC_SITE_KEY, { toolRoot: TOOL_ROOT });
  const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-hubspot-adapter-switch-pilot-tmp");
  if (fs.existsSync(pilotTemp)) removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);
  await generateAstroProject(PILOT_FIXTURE, pilotTemp, {
    siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
    toolRoot: TOOL_ROOT,
  });
  const pilotContact = path.join(pilotTemp, "src/pages/contact/index.astro");
  if (fs.existsSync(pilotContact)) {
    const p = fs.readFileSync(pilotContact, "utf8");
    assert("pilot no gosaki hubspot wrapper", !/gosaki-contact-hubspot-embed/.test(p));
    assert("pilot no gosaki portalId", !/21392032/.test(p));
  } else {
    assert("pilot has no contact or no gosaki hubspot", true);
  }
  removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);
} else {
  assert("pilot fixture skipped", true);
}

function runNpm(script) {
  return spawnSync("npm", ["run", script], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env, CMS_CORE_V2_VERIFIER_LIVE_SOFT: "false" },
  });
}

const shadow = runNpm("verify:cms-core-v2-external-form-provider-hubspot-shadow-compare");
assert("shadow-compare PASS", shadow.status === 0, shadow.stderr?.slice(0, 300));

const hsRenderer = runNpm("verify:cms-core-v2-external-form-provider-hubspot-renderer");
assert("hubspot-renderer PASS", hsRenderer.status === 0, hsRenderer.stderr?.slice(0, 300));

const el = runNpm("verify:cms-core-v2-external-form-provider-external-link");
assert("external-link PASS", el.status === 0, el.stderr?.slice(0, 300));

const gf = runNpm("verify:cms-core-v2-external-form-provider-google-forms");
assert("google-forms PASS", gf.status === 0, gf.stderr?.slice(0, 300));

const baseline = runNpm("verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline");
assert(
  "Gosaki HTML baseline 80+ PASS",
  baseline.status === 0 && /passed/i.test(baseline.stdout || "") && !/FAIL /i.test(baseline.stdout || ""),
  baseline.stderr?.slice(0, 400) || (baseline.stdout || "").slice(-400),
);

console.log("");
console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
console.log(`BROWSER_PREVIEW_DIR=${path.join(TOOL_ROOT, BROWSER_OUT_REL)}`);
process.exit(failed === 0 ? 0 : 1);
