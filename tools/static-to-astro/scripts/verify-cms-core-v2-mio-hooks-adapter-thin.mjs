/**
 * CMS Core v2 — Mio thin hooks adapter verifier (Videos + footer SNS).
 *
 * npm: verify:cms-core-v2-mio-hooks-adapter-thin
 * Offline · injects read-only videos fixture as embedsBundle · no package / FTP / DB.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  SITE_GENERATOR_HOOK_FACTORIES,
  ensureSiteGeneratorHookAdapter,
  resolveSiteGeneratorHooksAsync,
} from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  MIO_KISARAGI_JAZZ_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  getSiteRegistryEntry,
} from "./lib/site-registry.mjs";
import {
  selectMioPublicVideoEmbeds,
  readMioVideoItemsFromBundle,
} from "./lib/mio-videos-page-embed.mjs";
import { extractMioFooterSocialLinks } from "./lib/mio-footer-social.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const MIO_DATA = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data");
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const MIO_ADAPTER_REL = "scripts/lib/mio-site-generator-hooks-adapter.mjs";
const GOSAKI_ADAPTER_REL = "scripts/lib/gosaki-site-generator-hooks-adapter.mjs";
const TEMP_OUT_REL = "output/_cms-core-v2-mio-hooks-adapter-thin-tmp";

const EXPECTED_PUBLIC_VIDEO_IDS = ["mioWatch001", "mioYtBe0001", "mioEmbed001"];
const FORBIDDEN_VIDEO_TOKENS = [
  "mioShort001",
  "mioHidden01",
  "not-a-youtube-url",
  "/shorts/",
  "mioFxShorts004",
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

function snapshotProtectedTrees() {
  const roots = [
    path.join(TOOL_ROOT, "output/manual-upload"),
    path.join(TOOL_ROOT, "output/static-public"),
    path.join(TOOL_ROOT, "public-dist"),
  ];
  /** @type {Record<string, string[]>} */
  const snap = {};
  for (const root of roots) {
    const key = path.relative(TOOL_ROOT, root).replace(/\\/g, "/");
    snap[key] = fs.existsSync(root) ? walkFiles(root).sort() : [];
  }
  return snap;
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

const beforeProtected = snapshotProtectedTrees();
const beforeHtmlFp = fixtureFingerprint(MIO_FIXTURE);
const beforeDataFp = fixtureFingerprint(MIO_DATA);

const registry = JSON.parse(
  fs.readFileSync(path.join(TOOL_ROOT, "config/sites/registry.json"), "utf8"),
);
const mioEntry = getSiteRegistryEntry(MIO_KISARAGI_JAZZ_SITE_KEY, TOOL_ROOT);

assert(
  "registry mio generatorHooksAdapter set",
  mioEntry.generatorHooksAdapter === MIO_ADAPTER_REL,
);
assert(
  "registry JSON has mio adapter path",
  registry.sites[MIO_KISARAGI_JAZZ_SITE_KEY].generatorHooksAdapter === MIO_ADAPTER_REL,
);
assert(
  "mio adapter file exists",
  fs.existsSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL)),
);
assert(
  "gosaki adapter file still exists",
  fs.existsSync(path.join(TOOL_ROOT, GOSAKI_ADAPTER_REL)),
);

assert(
  "factories empty before ensure",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 0,
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).join(","),
);

const ensure1 = await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, {
  toolRoot: TOOL_ROOT,
});
assert("ensure1 loaded", ensure1.loaded === true);
assert("ensure1 registered", ensure1.registered === true);
assert(
  "factory count after ensure1 is 1",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1,
);
assert(
  "mio factory registered",
  Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, MIO_KISARAGI_JAZZ_SITE_KEY),
);
assert(
  "gosaki factory not loaded by mio ensure",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);

const ensure2 = await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, {
  toolRoot: TOOL_ROOT,
});
assert("ensure2 already", ensure2.already === true || ensure2.registered === true);
assert(
  "factory count still 1 after double ensure",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1,
);

const mioHooks = await resolveSiteGeneratorHooksAsync(MIO_FIXTURE, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("mio hooks active", mioHooks.active === true);
assert("mio hooks siteKey", mioHooks.siteKey === MIO_KISARAGI_JAZZ_SITE_KEY);
assert("mio scheduleClassPrefix neutral", mioHooks.scheduleClassPrefix === "schedule");

const sampleFooter = `<footer><ul class="sns-row" aria-label="Social">
  <li><a href="https://www.instagram.com/mio.kisaragi.fixture/">Instagram</a></li>
  <li><a href="https://www.youtube.com/@mio-kisaragi-fixture">YouTube</a></li>
  <li><a href="https://x.com/should-not-appear">X</a></li>
</ul></footer>`;
const footerAstro = mioHooks.generateFooter(sampleFooter, { linkTransformContext: {} });
assert("mio footer returns string", typeof footerAstro === "string" && footerAstro.length > 0);
assert("mio footer has mio class", /mio-footer-social-links/.test(footerAstro));
assert("mio footer has Instagram", /instagram\.com\/mio\.kisaragi\.fixture/.test(footerAstro));
assert("mio footer has YouTube", /youtube\.com\/@mio-kisaragi-fixture/.test(footerAstro));
assert("mio footer omits X href", !/x\.com\/should-not-appear/.test(footerAstro));
assert("mio footer omits gosaki class", !/gosaki-footer/i.test(footerAstro));

const extracted = extractMioFooterSocialLinks(sampleFooter);
assert("extract ignores X", extracted.every((l) => l.label !== "X") && extracted.length === 2);

const videosJson = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "videos.json"), "utf8"));
const publicEmbeds = selectMioPublicVideoEmbeds(readMioVideoItemsFromBundle(videosJson));
assert("public embeds count 3", publicEmbeds.length === 3, `count=${publicEmbeds.length}`);
assert(
  "public embed ids",
  JSON.stringify(publicEmbeds.map((e) => e.videoId)) === JSON.stringify(EXPECTED_PUBLIC_VIDEO_IDS),
);

/** Explicit injection — adapter must not read fixtures path itself. */
const embedsBundle = {
  embedDataSource: "mio-fixture-inject",
  siteSlug: MIO_KISARAGI_JAZZ_SITE_KEY,
  items: videosJson.items,
};

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
if (fs.existsSync(tempOut)) {
  removeGeneratedOutputDir(tempOut, TOOL_ROOT);
}

const convertResult = await generateAstroProject(MIO_FIXTURE, tempOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
  embedsBundle,
});

assert("temp convert wrote pages", (convertResult?.writtenPages?.length ?? 0) >= 8);
assert(
  "gosaki factory still unloaded after mio convert",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);
assert(
  "only mio factory after convert",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1 &&
    Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, MIO_KISARAGI_JAZZ_SITE_KEY),
);

const writtenRel = walkFiles(tempOut);
const videosPageRel =
  writtenRel.find((f) => f === "src/pages/videos/index.astro") ||
  writtenRel.find((f) => /videos\.astro$/.test(f));
assert("videos page present", Boolean(videosPageRel));

const videosHtml = fs.readFileSync(path.join(tempOut, videosPageRel), "utf8");
assert("videos applied mio list", /data-mio-videos="public"/.test(videosHtml));
assert(
  "videos iframe count 3",
  (videosHtml.match(/data-mio-nocookie-embed="true"/g) || []).length === 3,
);
for (const id of EXPECTED_PUBLIC_VIDEO_IDS) {
  assert(
    `videos has nocookie ${id}`,
    videosHtml.includes(`https://www.youtube-nocookie.com/embed/${id}`),
  );
}
for (const tok of FORBIDDEN_VIDEO_TOKENS) {
  assert(`videos omits ${tok}`, !videosHtml.includes(tok), `found ${tok}`);
}
assert("videos omits placeholder cards", !/embed-placeholder/.test(videosHtml));
assert("home featured video untouched", (() => {
  const home =
    writtenRel.find((f) => f === "src/pages/index.astro") ||
    writtenRel.find((f) => /pages\/index\.astro$/.test(f));
  if (!home) return false;
  const h = fs.readFileSync(path.join(tempOut, home), "utf8");
  return /data-mio-slot="featured-video"/.test(h) && /mioFxWatch001/.test(h);
})());

const footerHtml = fs.readFileSync(path.join(tempOut, "src/components/Footer.astro"), "utf8");
assert("footer mio class", /mio-footer-social-links/.test(footerHtml));
assert("footer Instagram", /instagram\.com\/mio\.kisaragi\.fixture/.test(footerHtml));
assert("footer YouTube", /youtube\.com\/@mio-kisaragi-fixture/.test(footerHtml));
assert("footer no X.com", !/x\.com\//i.test(footerHtml) && !/>\s*X\s*</.test(footerHtml));
assert("footer no gosaki", !/gosaki/i.test(footerHtml));

const textBlob = writtenRel
  .filter((f) => /\.(astro|html|css|svg)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(tempOut, f), "utf8"))
  .join("\n");
assert("mio generated has zero gosaki tokens", !/gosaki/i.test(textBlob));

const layoutRel = writtenRel.find((f) => /BaseLayout\.astro$/.test(f));
assert("BaseLayout generated", Boolean(layoutRel));
if (layoutRel) {
  assert(
    "noindex retained",
    /noindex/i.test(fs.readFileSync(path.join(tempOut, layoutRel), "utf8")),
  );
}

const contactRel =
  writtenRel.find((f) => /contact\.astro$/.test(f)) ||
  writtenRel.find((f) => /contact\/index\.astro$/.test(f));
assert("contact page generated", Boolean(contactRel));
if (contactRel) {
  const contactHtml = fs.readFileSync(path.join(tempOut, contactRel), "utf8");
  assert("contact no form action", !/<form[^>]*\baction\s*=/i.test(contactHtml));
  assert("contact no method=post", !/<form[^>]*method=["']post["']/i.test(contactHtml));
  assert("contact keeps disabled submit UX", /disabled/i.test(contactHtml));
}

/** Generic / pilot must not load Mio adapter */
const pilotHooks = await resolveSiteGeneratorHooksAsync(PILOT_FIXTURE, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot still noop active=false", pilotHooks.active === false);

const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-thin-pilot-tmp");
if (fs.existsSync(pilotTemp)) removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);
const factoriesBeforePilot = Object.keys(SITE_GENERATOR_HOOK_FACTORIES).slice();
const pilotConvert = await generateAstroProject(PILOT_FIXTURE, pilotTemp, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static",
  deployBase: "/cms-kit-staging/pilot-sample-static/",
  toolRoot: TOOL_ROOT,
});
assert("pilot convert wrote pages", (pilotConvert?.writtenPages?.length ?? 0) > 0);
const pilotBlob = walkFiles(pilotTemp)
  .filter((f) => /\.(astro|html|css|svg)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(pilotTemp, f), "utf8"))
  .join("\n");
assert("pilot has zero gosaki", !/gosaki/i.test(pilotBlob));
assert("pilot has zero mio-footer", !/mio-footer-social/i.test(pilotBlob));
assert("pilot has zero mio-video", !/mio-video-list|data-mio-videos/i.test(pilotBlob));
assert(
  "pilot convert did not register extra factories",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).sort().join(",") ===
    factoriesBeforePilot.sort().join(","),
);
removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);

/** Isolated process: Mio loads alone; Gosaki not imported */
const hooksUrl = pathToFileURL(path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs")).href;
const registryUrl = pathToFileURL(path.join(TOOL_ROOT, "scripts/lib/site-registry.mjs")).href;
const isolated = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
import { SITE_GENERATOR_HOOK_FACTORIES, ensureSiteGeneratorHookAdapter, resolveSiteGeneratorHooksAsync } from ${JSON.stringify(hooksUrl)};
import { MIO_KISARAGI_JAZZ_SITE_KEY, GOSAKI_SITE_KEY, PILOT_SAMPLE_STATIC_SITE_KEY } from ${JSON.stringify(registryUrl)};
const toolRoot = ${JSON.stringify(TOOL_ROOT)};
const mioFixture = ${JSON.stringify(MIO_FIXTURE)};
const pilotFixture = ${JSON.stringify(PILOT_FIXTURE)};
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot });
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot });
const keys = Object.keys(SITE_GENERATOR_HOOK_FACTORIES);
const mio = await resolveSiteGeneratorHooksAsync(mioFixture, { siteKey: MIO_KISARAGI_JAZZ_SITE_KEY, toolRoot });
const pilot = await resolveSiteGeneratorHooksAsync(pilotFixture, { siteKey: PILOT_SAMPLE_STATIC_SITE_KEY, toolRoot });
const ok =
  keys.length === 1 &&
  keys[0] === MIO_KISARAGI_JAZZ_SITE_KEY &&
  !keys.includes(GOSAKI_SITE_KEY) &&
  mio.active === true &&
  pilot.active === false;
console.log(JSON.stringify({ ok, keys, mioActive: mio.active, pilotActive: pilot.active }));
process.exit(ok ? 0 : 1);
`,
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 60_000 },
);
assert(
  "isolated subprocess mio lazy / pilot unloaded",
  isolated.status === 0,
  (isolated.stderr || isolated.stdout || "").slice(0, 500),
);

/** Gosaki still works after Mio (same process) */
const gosakiHooks = await resolveSiteGeneratorHooksAsync(GOSAKI_FIXTURE, {
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("gosaki hooks active after mio", gosakiHooks.active === true);
assert(
  "gosaki factory registered after gosaki resolve",
  Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);

assert("source HTML fixture unchanged", fixtureFingerprint(MIO_FIXTURE) === beforeHtmlFp);
assert("source data fixture unchanged", fixtureFingerprint(MIO_DATA) === beforeDataFp);

const afterProtected = snapshotProtectedTrees();
for (const key of Object.keys(beforeProtected)) {
  assert(
    `protected tree unchanged: ${key}`,
    JSON.stringify(beforeProtected[key]) === JSON.stringify(afterProtected[key]),
  );
}

cleanupTemp();
assert("temp output removed", !tempOut || !fs.existsSync(tempOut));

const packageJson = fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8");
assert(
  "npm verify:cms-core-v2-mio-hooks-adapter-thin",
  packageJson.includes("verify:cms-core-v2-mio-hooks-adapter-thin"),
);

const adapterSrc = fs.readFileSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL), "utf8");
assert("adapter does not hardcode data fixture path", !/mio-kisaragi-jazz-data/.test(adapterSrc));
assert("adapter does not import gosaki footer", !/gosaki-footer/i.test(adapterSrc));
assert("Core hooks still free of mio site selectors", (() => {
  const core = fs.readFileSync(
    path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs"),
    "utf8",
  );
  return !/mio-footer|mio-video|mio-kisaragi-jazz-data/.test(core);
})());

console.log("");
console.log(`cms-core-v2-mio-hooks-adapter-thin: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
