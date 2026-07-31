/**
 * CMS Core v2 — External form provider external-link (Mio Contact) verifier.
 *
 * npm: verify:cms-core-v2-external-form-provider-external-link
 * Offline · injects formConfigBundle · no package / FTP / DB / network.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import { getExternalFormProviderResult } from "./lib/external-form-provider-contract.mjs";
import {
  escapeExternalFormHtml,
  renderExternalFormProviderHtml,
  renderExternalLinkConfigHtml,
} from "./lib/external-form-provider-renderer.mjs";
import {
  MIO_CONTACT_EXTERNAL_LINK_FIXTURE_CONFIG,
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
const TEMP_OUT_REL = "output/_cms-core-v2-external-form-external-link-tmp";
const BROWSER_OUT_REL = "output/_cms-core-v2-mio-contact-external-link-browser";

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
  "renderer exists",
  fs.existsSync(path.join(TOOL_ROOT, "scripts/lib/external-form-provider-renderer.mjs")),
);
assert(
  "mio contact helper exists",
  fs.existsSync(path.join(TOOL_ROOT, "scripts/lib/mio-contact-form-page.mjs")),
);

const rendererSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/external-form-provider-renderer.mjs"),
  "utf8",
);
const mioContactSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/mio-contact-form-page.mjs"),
  "utf8",
);
const coreAstro = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/lib/astro-generator.mjs"),
  "utf8",
);
assert("renderer has no /mio-/i selectors", !/mio-contact|mio-kisaragi|#mio-/i.test(rendererSrc));
assert("renderer has no /gosaki/i", !/gosaki/i.test(rendererSrc));
assert("Core has formConfigBundle forward", /formConfigBundle/.test(coreAstro));
assert("adapter uses applyMioContactFormPage", /applyMioContactFormPage/.test(
  fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/mio-site-generator-hooks-adapter.mjs"), "utf8"),
));
assert("mio helper uses validator", /getExternalFormProviderResult/.test(mioContactSrc));

// --- unit: renderer ---
const goodRaw = buildMioInjectFormConfigBundle();
const goodResult = getExternalFormProviderResult(goodRaw, {
  expectedSiteSlug: "mio-kisaragi-jazz",
  expectedEnvironment: "staging",
});
assert("fixture config validates", goodResult.ok === true && goodResult.provider === "external-link");

const rendered = renderExternalFormProviderHtml(goodResult);
assert("render external-link ok", rendered.ok && rendered.rendered === "external-link");
assert("rel noopener", /rel="noopener noreferrer"/.test(rendered.html));
assert("target blank when openInNewTab", /target="_blank"/.test(rendered.html));
assert(
  "href escaped url",
  rendered.html.includes(`href="${escapeExternalFormHtml(String(goodResult.config.url))}"`),
);
assert(
  "label escaped",
  rendered.html.includes(escapeExternalFormHtml(String(goodResult.config.label))),
);
assert("single data-external-form-link", (rendered.html.match(/data-external-form-link="1"/g) || []).length === 1);
assert("no script", !/<script\b/i.test(rendered.html));
assert("no iframe", !/<iframe\b/i.test(rendered.html));
assert("no form", !/<form\b/i.test(rendered.html));

const noBlank = getExternalFormProviderResult(
  {
    ...MIO_CONTACT_EXTERNAL_LINK_FIXTURE_CONFIG,
    openInNewTab: false,
    allowedHosts: ["forms.example.invalid"],
  },
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
const noBlankHtml = renderExternalFormProviderHtml(noBlank);
assert("openInNewTab false no target", noBlankHtml.ok && !/target="_blank"/.test(noBlankHtml.html));
assert("openInNewTab false still has rel", /rel="noopener noreferrer"/.test(noBlankHtml.html));

const xssLabel = getExternalFormProviderResult(
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "https://forms.example.invalid/x",
    label: `Click <script>alert(1)</script>`,
  },
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
assert("xss label rejected by validator", xssLabel.ok === false);

// Escape path: force render path with already-valid chars that need entity encode
const ampConfig = {
  provider: "external-link",
  siteSlug: "mio-kisaragi-jazz",
  environment: "staging",
  url: "https://forms.example.invalid/booking?a=1&b=2",
  label: "Open & Book",
  allowedHosts: ["forms.example.invalid"],
};
const ampResult = getExternalFormProviderResult(ampConfig, {
  expectedSiteSlug: "mio-kisaragi-jazz",
  expectedEnvironment: "staging",
});
assert("amp url validates", ampResult.ok);
const ampHtml = renderExternalLinkConfigHtml(/** @type {Record<string, unknown>} */ (ampResult.config));
assert("amp in href escaped", ampHtml.ok && ampHtml.html.includes("&amp;"));
assert("amp in label escaped", ampHtml.html.includes("Open &amp; Book"));

function assertRejectRender(name, raw, reasonCode) {
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
      !/data-external-form-link=/.test(html.html) &&
      !/<iframe\b/i.test(html.html) &&
      !/<script\b/i.test(html.html),
    `reason=${r.reasonCode} rendered=${html.rendered}`,
  );
}

assertRejectRender(
  "http rejected",
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "http://forms.example.invalid/x",
    label: "Open",
  },
  "URL_PROTOCOL",
);
assertRejectRender(
  "credentials rejected",
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "https://u:p@forms.example.invalid/x",
    label: "Open",
  },
  "URL_CREDENTIALS",
);
assertRejectRender(
  "port rejected",
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "https://forms.example.invalid:8443/x",
    label: "Open",
  },
  "URL_PORT",
);
assertRejectRender(
  "host spoof rejected",
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "https://forms.example.invalid.evil.example/x",
    label: "Open",
    allowedHosts: ["forms.example.invalid"],
  },
  "HOST_NOT_ALLOWED",
);
assertRejectRender(
  "siteSlug mismatch",
  {
    provider: "external-link",
    siteSlug: "other-site",
    environment: "staging",
    url: "https://forms.example.invalid/x",
    label: "Open",
  },
  "SITE_SLUG_MISMATCH",
);
assertRejectRender(
  "environment mismatch",
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "production",
    url: "https://forms.example.invalid/x",
    label: "Open",
  },
  "ENVIRONMENT_MISMATCH",
);
assertRejectRender(
  "unknown field",
  {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "https://forms.example.invalid/x",
    label: "Open",
    portalId: "1",
  },
  "UNKNOWN_FIELD",
);

const disabledResult = getExternalFormProviderResult(
  {
    provider: "disabled",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    message: "準備中です",
  },
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
const disabledHtml = renderExternalFormProviderHtml(disabledResult);
assert("disabled renders notice not link", disabledHtml.rendered === "notice");
assert("disabled no link marker", !/data-external-form-link=/.test(disabledHtml.html));

const gfResult = getExternalFormProviderResult(
  {
    provider: "google-forms",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdOfflineOnlyFakeForm/viewform",
    title: "Form",
  },
  { expectedSiteSlug: "mio-kisaragi-jazz", expectedEnvironment: "staging" },
);
const gfHtml = renderExternalFormProviderHtml(gfResult);
assert("google-forms not rendered as link", gfResult.ok && gfHtml.rendered === "notice");
assert("google-forms no iframe from renderer", !/<iframe\b/i.test(gfHtml.html));

const hsResult = getExternalFormProviderResult(
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
const hsHtml = renderExternalFormProviderHtml(hsResult);
assert("hubspot not rendered as link", hsResult.ok && hsHtml.rendered === "notice");
assert("hubspot no script from renderer", !/<script\b/i.test(hsHtml.html));

// --- convert integration ---
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
const formConfigBundle = buildMioInjectFormConfigBundle();

/** Bundle missing → scaffold retained */
const fallbackOut = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-contact-fallback-tmp");
if (fs.existsSync(fallbackOut)) removeGeneratedOutputDir(fallbackOut, TOOL_ROOT);
await generateAstroProject(MIO_FIXTURE, fallbackOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
});
const fallbackContact =
  walkFiles(fallbackOut).find((f) => f === "src/pages/contact/index.astro");
assert("fallback contact exists", Boolean(fallbackContact));
const fallbackHtml = fs.readFileSync(path.join(fallbackOut, fallbackContact), "utf8");
assert("fallback keeps mio-contact-form", /id=["']mio-contact-form["']/.test(fallbackHtml));
assert("fallback no external-link marker", !/data-mio-contact=["']external-link["']/.test(fallbackHtml));
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
assert("gosaki still unloaded", !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY));

const writtenRel = walkFiles(tempOut);
const contactRel = writtenRel.find((f) => f === "src/pages/contact/index.astro");
assert("contact page present", Boolean(contactRel));
const contactHtml = fs.readFileSync(path.join(tempOut, contactRel), "utf8");

assert("mio external-link marker", /data-mio-contact=["']external-link["']/.test(contactHtml));
assert("external-form link marker", /data-external-form-link=["']1["']/.test(contactHtml));
assert(
  "contact link count 1",
  (contactHtml.match(/data-external-form-link=["']1["']/g) || []).length === 1,
);
assert("href forms.example.invalid", /href="https:\/\/forms\.example\.invalid\/mio-kisaragi-jazz-booking"/.test(contactHtml));
assert("label present", contactHtml.includes("予約・お問い合わせフォームを開く"));
assert("rel noopener in page", /rel="noopener noreferrer"/.test(contactHtml));
assert("target blank in page", /target="_blank"/.test(contactHtml));
assert("no mio-contact-form", !/id=["']mio-contact-form["']/.test(contactHtml));
assert("no iframe placeholder", !/data-mio-contact=["']iframe-placeholder["']/.test(contactHtml));
assert("no script tag", !/<script\b/i.test(contactHtml));
assert("no iframe tag", !/<iframe\b/i.test(contactHtml));
assert("no form tag", !/<form\b/i.test(contactHtml));
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

assert(
  "schedule months present",
  writtenRel.some((f) => /2026-08/.test(f)) && writtenRel.some((f) => /2026-09/.test(f)),
);
const scheduleHub = writtenRel.find((f) => /schedule\/index\.astro$/.test(f) || f === "src/pages/schedule.astro");
assert("schedule hub", Boolean(scheduleHub));
const scheduleHtml = fs.readFileSync(path.join(tempOut, scheduleHub), "utf8");
assert("schedule hub marker", /data-mio-schedule-hub="true"/.test(scheduleHtml));
const augRel = writtenRel.find((f) => /2026-08\/index\.astro$/.test(f));
const sepRel = writtenRel.find((f) => /2026-09\/index\.astro$/.test(f));
assert("aug month page", Boolean(augRel));
assert("sep month page", Boolean(sepRel));
const augHtml = fs.readFileSync(path.join(tempOut, augRel), "utf8");
const sepHtml = fs.readFileSync(path.join(tempOut, sepRel), "utf8");
assert("aug cards 7", (augHtml.match(/data-mio-schedule-id="/g) || []).length === 7);
assert("sep cards 6", (sepHtml.match(/data-mio-schedule-id="/g) || []).length === 6);
assert(
  "hub july archive 1",
  (scheduleHtml.match(/data-mio-schedule-id="mio-sched-2026-07-20"/g) || []).length === 1,
);

const discoRel = writtenRel.find((f) => /discography\/index\.astro$/.test(f));
assert("discography page", Boolean(discoRel));
const discoHtml = fs.readFileSync(path.join(tempOut, discoRel), "utf8");
for (const id of EXPECTED_DISCO_IDS) {
  assert(`disco ${id}`, discoHtml.includes(id));
}

const videosRel = writtenRel.find((f) => /videos\/index\.astro$/.test(f));
assert("videos page", Boolean(videosRel));
const videosHtml = fs.readFileSync(path.join(tempOut, videosRel), "utf8");
for (const id of EXPECTED_PUBLIC_VIDEO_IDS) {
  assert(`video ${id}`, videosHtml.includes(id));
}

const aboutRel = writtenRel.find((f) => f === "src/pages/about/index.astro");
assert("about page", Boolean(aboutRel));
assert(
  "about rendered",
  /data-mio-about=["']public["']/.test(fs.readFileSync(path.join(tempOut, aboutRel), "utf8")),
);

const footerFiles = writtenRel.filter((f) => /Footer\.astro$|footer/i.test(f));
const footerBlob = footerFiles.map((f) => fs.readFileSync(path.join(tempOut, f), "utf8")).join("\n");
assert("footer sns retained", /instagram|youtube/i.test(footerBlob) || /mio-footer-social/.test(allMioHtml));

/** Invalid bundle → fail-closed notice on page */
const badOut = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-contact-bad-tmp");
if (fs.existsSync(badOut)) removeGeneratedOutputDir(badOut, TOOL_ROOT);
await generateAstroProject(MIO_FIXTURE, badOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
  formConfigBundle: {
    provider: "external-link",
    siteSlug: "mio-kisaragi-jazz",
    environment: "staging",
    url: "javascript:alert(1)",
    label: "Open",
  },
});
const badContact = fs.readFileSync(path.join(badOut, "src/pages/contact/index.astro"), "utf8");
assert("bad config notice", /data-mio-contact=["']notice["']/.test(badContact));
assert("bad config no link", !/data-external-form-link=/.test(badContact));
assert("bad config no javascript href", !/javascript:/i.test(badContact));
removeGeneratedOutputDir(badOut, TOOL_ROOT);

/** Pilot isolation */
const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-external-link-pilot-tmp");
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
assert("pilot no mio-contact external", !/data-mio-contact=["']external-link["']/.test(pilotBlob));
assert("pilot no forms.example.invalid booking", !/mio-kisaragi-jazz-booking/.test(pilotBlob));
removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);

/** Gosaki Contact unchanged when formConfig injected (HubSpot path separate; no mio markers) */
if (fs.existsSync(GOSAKI_FIXTURE)) {
  await ensureSiteGeneratorHookAdapter(GOSAKI_SITE_KEY, { toolRoot: TOOL_ROOT });
  const gosakiTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-external-link-gosaki-tmp");
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
  assert("gosaki contact no mio-contact", !/data-mio-contact=/.test(gosakiBlob));
  assert("gosaki contact no example.invalid booking", !/mio-kisaragi-jazz-booking/.test(gosakiBlob));
  removeGeneratedOutputDir(gosakiTemp, TOOL_ROOT);
} else {
  assert("gosaki fixture skipped (missing)", true);
}

assert("source fixture html unchanged", fixtureFingerprint(MIO_FIXTURE) === beforeHtmlFp);
assert("source data unchanged", fixtureFingerprint(MIO_DATA) === beforeDataFp);

/** Keep a browser preview tree (gitignored output/) for operator PC/SP check */
const browserOut = path.join(TOOL_ROOT, BROWSER_OUT_REL);
if (fs.existsSync(browserOut)) removeGeneratedOutputDir(browserOut, TOOL_ROOT);
fs.cpSync(tempOut, browserOut, { recursive: true });
assert("browser preview copied", fs.existsSync(path.join(browserOut, "src/pages/contact/index.astro")));

cleanupTemp();

const pkg = JSON.parse(fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8"));
assert(
  "npm script registered",
  Boolean(pkg.scripts?.["verify:cms-core-v2-external-form-provider-external-link"]),
);
const suiteSrc = fs.readFileSync(
  path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs"),
  "utf8",
);
assert(
  "safety suite includes external-link verifier",
  suiteSrc.includes("verify-cms-core-v2-external-form-provider-external-link.mjs"),
);

console.log(`\ncms-core-v2-external-form-provider-external-link: ${passed} passed, ${failed} failed`);
console.log(`Browser preview (Astro source): ${BROWSER_OUT_REL}/src/pages/contact/index.astro`);
if (failed > 0) process.exit(1);
console.log("PASS cms-core-v2-external-form-provider-external-link");
