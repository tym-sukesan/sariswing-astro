/**
 * CMS Core v2 — External form provider google-forms (Mio Contact) verifier.
 *
 * npm: verify:cms-core-v2-external-form-provider-google-forms
 * Offline · injects google-forms formConfigBundle · no package / FTP / DB / network.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import { getExternalFormProviderResult } from "./lib/external-form-provider-contract.mjs";
import {
  GOOGLE_FORMS_IFRAME_HEIGHT_PX,
  GOOGLE_FORMS_IFRAME_REFERRER_POLICY,
  GOOGLE_FORMS_IFRAME_SANDBOX,
  escapeExternalFormHtml,
  renderExternalFormProviderHtml,
  renderExternalLinkConfigHtml,
  renderGoogleFormsConfigHtml,
} from "./lib/external-form-provider-renderer.mjs";
import {
  MIO_CONTACT_EXTERNAL_LINK_FIXTURE_CONFIG,
  MIO_CONTACT_GOOGLE_FORMS_FIXTURE_CONFIG,
  applyMioContactFormPage,
  buildMioInjectFormConfigBundle,
} from "./lib/mio-contact-form-page.mjs";
import { buildMioInjectAboutBundle } from "./lib/mio-about-data-page.mjs";
import { buildMioInjectDiscographyBundle } from "./lib/mio-discography-data-page.mjs";
import { buildMioInjectScheduleBundle } from "./lib/mio-schedule-data-pages.mjs";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  SITE_GENERATOR_HOOK_FACTORIES,
  ensureSiteGeneratorHookAdapter,
} from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  MIO_KISARAGI_JAZZ_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const MIO_DATA = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const TEMP_OUT_REL = "output/_cms-core-v2-external-form-google-forms-tmp";
const BROWSER_OUT_REL = "output/_cms-core-v2-mio-contact-google-forms-browser";

const EXPECTED_PUBLIC_VIDEO_IDS = ["mioWatch001", "mioYtBe0001", "mioEmbed001"];
const EXPECTED_DISCO_IDS = [
  "mio-disco-album-01",
  "mio-disco-album-02",
  "mio-disco-single-01",
  "mio-disco-album-03",
];

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

function walkFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(path.relative(base, abs).replace(/\\/g, "/"));
  }
  return out;
}

function fixtureFingerprint(root) {
  const files = walkFiles(root).sort();
  return files
    .map((rel) => {
      const buf = fs.readFileSync(path.join(root, rel));
      return `${rel}:${buf.length}:${buf.subarray(0, 32).toString("hex")}`;
    })
    .join("|");
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

const beforeHtmlFp = fixtureFingerprint(MIO_FIXTURE);
const beforeDataFp = fixtureFingerprint(MIO_DATA);

assert(
  "renderer exports google-forms helpers",
  typeof renderGoogleFormsConfigHtml === "function" &&
    typeof GOOGLE_FORMS_IFRAME_SANDBOX === "string",
);

const rendererSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/external-form-provider-renderer.mjs"),
  "utf8",
);
assert("renderer has no /mio-/i selectors", !/mio-contact|mio-kisaragi|#mio-/i.test(rendererSrc));
assert("renderer has no /gosaki/i", !/gosaki/i.test(rendererSrc));
assert("sandbox has no top-navigation", !/allow-top-navigation/.test(GOOGLE_FORMS_IFRAME_SANDBOX));

const goodRaw = buildMioInjectFormConfigBundle(MIO_CONTACT_GOOGLE_FORMS_FIXTURE_CONFIG);
const goodResult = getExternalFormProviderResult(goodRaw, {
  expectedSiteSlug: "mio-kisaragi-jazz",
  expectedEnvironment: "staging",
});
assert("fixture google-forms validates", goodResult.ok && goodResult.provider === "google-forms");
assert(
  "normalized has embedded=true",
  String(goodResult.config?.formUrl).includes("embedded=true"),
);

const rendered = renderExternalFormProviderHtml(goodResult);
assert("render google-forms ok", rendered.ok && rendered.rendered === "google-forms");
assert("iframe count 1", (rendered.html.match(/<iframe\b/gi) || []).length === 1);
assert("iframe marker", /data-external-form-iframe=["']1["']/.test(rendered.html));
assert(
  "src normalized",
  rendered.html.includes(
    `src="${escapeExternalFormHtml(String(goodResult.config.formUrl))}"`,
  ),
);
assert(
  "title escaped",
  rendered.html.includes(`title="${escapeExternalFormHtml(String(goodResult.config.title))}"`),
);
assert("loading lazy", /loading="lazy"/.test(rendered.html));
assert(
  "referrerpolicy fixed",
  rendered.html.includes(`referrerpolicy="${GOOGLE_FORMS_IFRAME_REFERRER_POLICY}"`),
);
assert(
  "sandbox fixed",
  rendered.html.includes(`sandbox="${GOOGLE_FORMS_IFRAME_SANDBOX}"`),
);
assert("width 100%", /width="100%"/.test(rendered.html));
assert(`height ${GOOGLE_FORMS_IFRAME_HEIGHT_PX}`, rendered.html.includes(`height="${GOOGLE_FORMS_IFRAME_HEIGHT_PX}"`));
assert("no style attr", !/\sstyle\s*=/.test(rendered.html));
assert("no srcdoc", !/srcdoc=/i.test(rendered.html));
assert("no script", !/<script\b/i.test(rendered.html));
assert("no form tag", !/<form\b/i.test(rendered.html));
assert("no external-link marker", !/data-external-form-link=/.test(rendered.html));
assert("no allow= free attr", !/\sallow="/.test(rendered.html));

/** external-link regression */
const linkResult = getExternalFormProviderResult(
  buildMioInjectFormConfigBundle(MIO_CONTACT_EXTERNAL_LINK_FIXTURE_CONFIG),
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
const linkHtml = renderExternalFormProviderHtml(linkResult);
assert("external-link still renders", linkHtml.rendered === "external-link");
assert("external-link no iframe", !/<iframe\b/i.test(linkHtml.html));
const linkOnly = renderExternalLinkConfigHtml(
  /** @type {Record<string, unknown>} */ (linkResult.config),
);
assert("external-link helper ok", linkOnly.ok);

function assertReject(name, raw, reasonCode) {
  const r = getExternalFormProviderResult(raw, {
    expectedSiteSlug: "mio-kisaragi-jazz",
    expectedEnvironment: "staging",
  });
  const html = renderExternalFormProviderHtml(r);
  assert(
    name,
    r.ok === false &&
      r.reasonCode === reasonCode &&
      html.rendered === "notice" &&
      !/<iframe\b/i.test(html.html) &&
      !/data-external-form-iframe=/.test(html.html),
    `reason=${r.reasonCode} rendered=${html.rendered}`,
  );
}

assertReject(
  "forms.gle rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl: "https://forms.gle/OfflineOnlyFake",
    title: "Form",
  },
  "FORM_URL_SHORTLINK",
);
assertReject(
  "host spoof rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl:
      "https://docs.google.com.example.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "FORM_URL_HOST",
);
assertReject(
  "http rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl:
      "http://docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "FORM_URL_PROTOCOL",
);
assertReject(
  "credentials rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl:
      "https://u:p@docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "FORM_URL_CREDENTIALS",
);
assertReject(
  "port rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl:
      "https://docs.google.com:8443/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "FORM_URL_PORT",
);
assertReject(
  "invalid path rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl: "https://docs.google.com/forms/d/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "FORM_URL_PATH",
);
assertReject(
  "fragment rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform#bad",
    title: "Form",
  },
  "FORM_URL_FRAGMENT",
);
assertReject(
  "field mix rejected",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
    url: "https://forms.example.invalid/x",
  },
  "UNKNOWN_FIELD",
);
assertReject(
  "siteSlug mismatch",
  {
    provider: "google-forms",
    siteSlug: "other-site",
    environment: "staging",
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "SITE_SLUG_MISMATCH",
);
assertReject(
  "environment mismatch",
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "production",
    formUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform",
    title: "Form",
  },
  "ENVIRONMENT_MISMATCH",
);

const unknown = getExternalFormProviderResult(
  { provider: "typeform", siteSlug: "mio-kisaragi-jazz", environment: "staging" },
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
assert("unknown provider fail", unknown.ok === false && unknown.reasonCode === "PROVIDER_UNKNOWN");

const hs = getExternalFormProviderResult(
  {
    provider: "hubspot",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    portalId: "10000001",
    formId: "00000000-0000-4000-8000-000000000001",
    region: "na1",
  },
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
const hsHtml = renderExternalFormProviderHtml(hs);
assert("hubspot still notice not iframe", hs.ok && hsHtml.rendered === "notice");
assert("hubspot no iframe", !/<iframe\b/i.test(hsHtml.html));

// --- convert ---
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: TOOL_ROOT });
assert("gosaki not loaded", !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY));

const schedulesDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "schedules.json"), "utf8"));
const discographyDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "discography.json"), "utf8"));
const videosDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "videos.json"), "utf8"));
const aboutDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "about.json"), "utf8"));
const scheduleBundle = buildMioInjectScheduleBundle(schedulesDoc);
const discographyBundle = buildMioInjectDiscographyBundle(discographyDoc);
const embedsBundle = {
  embedDataSource: "mio-fixture-inject",
  siteSlug: MIO_KISARAGI_JAZZ_SITE_KEY,
  items: videosDoc.items,
};
const aboutBundle = buildMioInjectAboutBundle(aboutDoc);
const formConfigBundle = buildMioInjectFormConfigBundle(MIO_CONTACT_GOOGLE_FORMS_FIXTURE_CONFIG);

const fallbackOut = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-contact-gf-fallback-tmp");
if (fs.existsSync(fallbackOut)) removeGeneratedOutputDir(fallbackOut, TOOL_ROOT);
await generateAstroProject(MIO_FIXTURE, fallbackOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
});
const fallbackContact = walkFiles(fallbackOut).find((f) => f === "src/pages/contact/index.astro");
assert("fallback contact exists", Boolean(fallbackContact));
const fallbackHtml = fs.readFileSync(path.join(fallbackOut, fallbackContact), "utf8");
assert("bundle-less keeps scaffold form", /id=["']mio-contact-form["']/.test(fallbackHtml));
assert("bundle-less no google-forms marker", !/data-mio-contact=["']google-forms["']/.test(fallbackHtml));
assert("apply null not applied", applyMioContactFormPage(fallbackOut, null).applied === false);
removeGeneratedOutputDir(fallbackOut, TOOL_ROOT);

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
if (fs.existsSync(tempOut)) removeGeneratedOutputDir(tempOut, TOOL_ROOT);

const convertResult = await generateAstroProject(MIO_FIXTURE, tempOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
  scheduleBundle,
  discographyBundle,
  embedsBundle,
  aboutBundle,
  formConfigBundle,
});

assert("convert wrote pages", (convertResult?.writtenPages?.length ?? 0) >= 8);

const writtenRel = walkFiles(tempOut);
const contactRel = writtenRel.find((f) => f === "src/pages/contact/index.astro");
assert("contact page present", Boolean(contactRel));
const contactHtml = fs.readFileSync(path.join(tempOut, contactRel), "utf8");

assert("mio google-forms marker", /data-mio-contact=["']google-forms["']/.test(contactHtml));
assert("iframe marker once", (contactHtml.match(/data-external-form-iframe=["']1["']/g) || []).length === 1);
assert("iframe tag once", (contactHtml.match(/<iframe\b/gi) || []).length === 1);
assert("src docs.google.com", /src="https:\/\/docs\.google\.com\/forms\/d\/e\//.test(contactHtml));
assert("embedded=true in src", /embedded=true/.test(contactHtml));
assert("title present", contactHtml.includes('title="お問い合わせ（架空フォーム）"'));
assert("sandbox present", contactHtml.includes(`sandbox="${GOOGLE_FORMS_IFRAME_SANDBOX}"`));
assert("no external-link concurrent", !/data-external-form-link=/.test(contactHtml));
assert("no mio-contact-form", !/id=["']mio-contact-form["']/.test(contactHtml));
assert("no iframe-placeholder", !/data-mio-contact=["']iframe-placeholder["']/.test(contactHtml));
assert("no script", !/<script\b/i.test(contactHtml));
assert("no form", !/<form\b/i.test(contactHtml));
assert("no method post", !/method=["']post["']/i.test(contactHtml));

const layoutRel = writtenRel.find((f) => /BaseLayout\.astro$/.test(f));
assert(
  "noindex in BaseLayout",
  Boolean(layoutRel) && /noindex/i.test(fs.readFileSync(path.join(tempOut, layoutRel), "utf8")),
);

const allMioHtml = writtenRel
  .filter((f) => f.endsWith(".astro") || f.endsWith(".html"))
  .map((f) => fs.readFileSync(path.join(tempOut, f), "utf8"))
  .join("\n");
assert("mio output /gosaki/i 0", !/gosaki/i.test(allMioHtml));

const scheduleHub = writtenRel.find((f) => /schedule\/index\.astro$/.test(f));
const augRel = writtenRel.find((f) => /2026-08\/index\.astro$/.test(f));
const sepRel = writtenRel.find((f) => /2026-09\/index\.astro$/.test(f));
assert("schedule hub", Boolean(scheduleHub));
assert("aug/sep pages", Boolean(augRel) && Boolean(sepRel));
assert(
  "aug cards 7",
  (fs.readFileSync(path.join(tempOut, augRel), "utf8").match(/data-mio-schedule-id="/g) || [])
    .length === 7,
);
assert(
  "sep cards 6",
  (fs.readFileSync(path.join(tempOut, sepRel), "utf8").match(/data-mio-schedule-id="/g) || [])
    .length === 6,
);
assert(
  "hub july 1",
  (fs.readFileSync(path.join(tempOut, scheduleHub), "utf8").match(
    /data-mio-schedule-id="mio-sched-2026-07-20"/g,
  ) || []).length === 1,
);

const discoRel = writtenRel.find((f) => /discography\/index\.astro$/.test(f));
const discoHtml = fs.readFileSync(path.join(tempOut, discoRel), "utf8");
for (const id of EXPECTED_DISCO_IDS) {
  assert(`disco ${id}`, discoHtml.includes(id));
}
const videosRel = writtenRel.find((f) => /videos\/index\.astro$/.test(f));
const videosHtml = fs.readFileSync(path.join(tempOut, videosRel), "utf8");
for (const id of EXPECTED_PUBLIC_VIDEO_IDS) {
  assert(`video ${id}`, videosHtml.includes(id));
}
const aboutRel = writtenRel.find((f) => f === "src/pages/about/index.astro");
assert(
  "about rendered",
  /data-mio-about=["']public["']/.test(fs.readFileSync(path.join(tempOut, aboutRel), "utf8")),
);
assert("footer sns retained", /mio-footer-social|instagram|youtube/i.test(allMioHtml));

/** fail-closed bad bundle */
const badOut = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-contact-gf-bad-tmp");
if (fs.existsSync(badOut)) removeGeneratedOutputDir(badOut, TOOL_ROOT);
await generateAstroProject(MIO_FIXTURE, badOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
  formConfigBundle: {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl: "https://forms.gle/nope",
    title: "Form",
  },
});
const badContact = fs.readFileSync(path.join(badOut, "src/pages/contact/index.astro"), "utf8");
assert("bad shortlink notice", /data-mio-contact=["']notice["']/.test(badContact));
assert("bad shortlink no iframe", !/<iframe\b/i.test(badContact));
removeGeneratedOutputDir(badOut, TOOL_ROOT);

/** Pilot isolation */
const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-google-forms-pilot-tmp");
if (fs.existsSync(pilotTemp)) removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);
await ensureSiteGeneratorHookAdapter(PILOT_SAMPLE_STATIC_SITE_KEY, { toolRoot: TOOL_ROOT });
await generateAstroProject(PILOT_FIXTURE, pilotTemp, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
  formConfigBundle,
});
const pilotBlob = walkFiles(pilotTemp)
  .map((f) => fs.readFileSync(path.join(pilotTemp, f), "utf8"))
  .join("\n");
assert("pilot no google-forms marker", !/data-mio-contact=["']google-forms["']/.test(pilotBlob));
assert("pilot no Mio fake form id", !/1FAIpQLSdMioOfflinePilotFakeFormOnly/.test(pilotBlob));
removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);

/** Gosaki isolation */
if (fs.existsSync(GOSAKI_FIXTURE)) {
  await ensureSiteGeneratorHookAdapter(GOSAKI_SITE_KEY, { toolRoot: TOOL_ROOT });
  const gosakiTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-google-forms-gosaki-tmp");
  if (fs.existsSync(gosakiTemp)) removeGeneratedOutputDir(gosakiTemp, TOOL_ROOT);
  await generateAstroProject(GOSAKI_FIXTURE, gosakiTemp, {
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
    formConfigBundle,
  });
  const gosakiBlob = walkFiles(gosakiTemp)
    .filter((f) => /contact/i.test(f))
    .map((f) => fs.readFileSync(path.join(gosakiTemp, f), "utf8"))
    .join("\n");
  assert("gosaki contact no mio google-forms", !/data-mio-contact=["']google-forms["']/.test(gosakiBlob));
  assert("gosaki contact no Mio fake form id", !/1FAIpQLSdMioOfflinePilotFakeFormOnly/.test(gosakiBlob));
  removeGeneratedOutputDir(gosakiTemp, TOOL_ROOT);
} else {
  assert("gosaki fixture skipped", true);
}

assert("source fixture unchanged", fixtureFingerprint(MIO_FIXTURE) === beforeHtmlFp);
assert("source data unchanged", fixtureFingerprint(MIO_DATA) === beforeDataFp);

const browserOut = path.join(TOOL_ROOT, BROWSER_OUT_REL);
if (fs.existsSync(browserOut)) removeGeneratedOutputDir(browserOut, TOOL_ROOT);
fs.cpSync(tempOut, browserOut, { recursive: true });
assert("browser preview copied", fs.existsSync(path.join(browserOut, "src/pages/contact/index.astro")));

cleanupTemp();

const pkg = JSON.parse(fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8"));
assert(
  "npm script registered",
  Boolean(pkg.scripts?.["verify:cms-core-v2-external-form-provider-google-forms"]),
);
const suiteSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs"),
  "utf8",
);
assert(
  "safety suite includes google-forms verifier",
  suiteSrc.includes("verify-cms-core-v2-external-form-provider-google-forms.mjs"),
);

console.log(`\ncms-core-v2-external-form-provider-google-forms: ${passed} passed, ${failed} failed`);
console.log(`Browser preview: ${BROWSER_OUT_REL}/src/pages/contact/index.astro`);
if (failed > 0) process.exit(1);
console.log("PASS cms-core-v2-external-form-provider-google-forms");
