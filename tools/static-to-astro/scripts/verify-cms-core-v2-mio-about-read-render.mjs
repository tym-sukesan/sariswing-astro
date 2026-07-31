/**
 * CMS Core v2 — Mio About read-render verifier.
 *
 * npm: verify:cms-core-v2-mio-about-read-render
 * Offline · injects schedule + discography + embeds + about bundles · no package / FTP / DB.
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
} from "./lib/site-registry.mjs";
import { buildMioInjectScheduleBundle } from "./lib/mio-schedule-data-pages.mjs";
import { buildMioInjectDiscographyBundle } from "./lib/mio-discography-data-page.mjs";
import {
  buildMioInjectAboutBundle,
  escapeMioAboutHtml,
  renderMioAboutCollaboratorCardHtml,
  renderMioAboutMainHtml,
  resolveMioSafeLocalImageSrc,
  applyMioAboutPage,
} from "./lib/mio-about-data-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const MIO_DATA = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const MIO_ADAPTER_REL = "scripts/lib/mio-site-generator-hooks-adapter.mjs";
const TEMP_OUT_REL = "output/_cms-core-v2-mio-about-read-render-tmp";

const EXPECTED_COLLAB_IDS = [
  "mio-collab-ren-aoba",
  "mio-collab-toru-kurose",
  "mio-collab-kozue-minami",
];
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

assert(
  "helper exists",
  fs.existsSync(path.join(TOOL_ROOT, "scripts/lib/mio-about-data-page.mjs")),
);
assert("adapter exists", fs.existsSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL)));

assert(
  "factories empty before ensure",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 0,
);
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: TOOL_ROOT });
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: TOOL_ROOT });
assert(
  "idempotent factory count 1",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1,
);
assert("gosaki not loaded", !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY));

assert(
  "safe local image ok",
  resolveMioSafeLocalImageSrc("images/portrait-placeholder.svg") ===
    "images/portrait-placeholder.svg",
);
assert("reject https image", resolveMioSafeLocalImageSrc("https://evil.example/a.jpg") === null);
assert("reject traversal", resolveMioSafeLocalImageSrc("../secret.png") === null);

const aboutDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "about.json"), "utf8"));
const expectedRequired = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "expected/about-required.json"), "utf8"),
);
const aboutBundle = buildMioInjectAboutBundle(aboutDoc);
assert("jaShort present", Boolean(aboutBundle.profile?.jaShort));
assert("jaLong present", Boolean(aboutBundle.profile?.jaLong));
assert("en present", Boolean(aboutBundle.profile?.en));
assert("collaborators 3", aboutBundle.collaborators.length === 3);
assert(
  "collaborator ids",
  aboutBundle.collaborators.map((c) => c.id).join(",") === EXPECTED_COLLAB_IDS.join(","),
);
assert(
  "expected collaborator ids match",
  expectedRequired.collaboratorIds.join(",") === EXPECTED_COLLAB_IDS.join(","),
);

const xssCard = renderMioAboutCollaboratorCardHtml({
  id: "xss",
  name: `<b>Name</b>`,
  role: `Role & Lead`,
  bio: `Bio <script>alert(1)</script>`,
  hasPhoto: true,
  photoSrc: `https://evil.example/x.jpg`,
});
assert("escape name", xssCard.includes(escapeMioAboutHtml(`<b>Name</b>`)));
assert("escape bio", xssCard.includes("Bio &lt;script&gt;alert(1)&lt;/script&gt;"));
assert("external photo rejected", /data-mio-photo="missing"|data-mio-photo="none"/.test(xssCard));
assert("raw script tag absent", !/<script>/i.test(xssCard));

const mainHtml = renderMioAboutMainHtml(aboutBundle);
assert("main has ja short", /data-mio-about-section="ja-short"/.test(mainHtml));
assert("main has ja long", /data-mio-about-section="ja-long"/.test(mainHtml));
assert("main has en", /data-mio-about-section="en"/.test(mainHtml));
assert("main has no-photo", /data-mio-about-section="no-photo"/.test(mainHtml));
assert("main has collaborators", /data-mio-collaborator-count="3"/.test(mainHtml));
assert("photo alt present", /alt="如月澪のポートレート（プレースホルダー）"/.test(mainHtml));
assert(
  "collab with photo",
  /data-mio-collaborator-id="mio-collab-ren-aoba"[^>]*data-mio-has-photo="true"/.test(mainHtml),
);
assert(
  "collab without photo",
  /data-mio-collaborator-id="mio-collab-toru-kurose"[^>]*data-mio-has-photo="false"/.test(mainHtml),
);

const schedulesDoc = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "schedules.json"), "utf8"),
);
const discographyDoc = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "discography.json"), "utf8"),
);
const videosDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "videos.json"), "utf8"));
const scheduleBundle = buildMioInjectScheduleBundle(schedulesDoc);
const discographyBundle = buildMioInjectDiscographyBundle(discographyDoc);
const embedsBundle = {
  embedDataSource: "mio-fixture-inject",
  siteSlug: MIO_KISARAGI_JAZZ_SITE_KEY,
  items: videosDoc.items,
};

/** Bundle-missing fallback: convert without aboutBundle keeps scaffold lede */
const fallbackOut = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-about-fallback-tmp");
if (fs.existsSync(fallbackOut)) removeGeneratedOutputDir(fallbackOut, TOOL_ROOT);
await generateAstroProject(MIO_FIXTURE, fallbackOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
});
const fallbackAbout =
  walkFiles(fallbackOut).find((f) => f === "src/pages/about/index.astro") ||
  walkFiles(fallbackOut).find((f) => /about\.astro$/.test(f));
assert("fallback about page exists", Boolean(fallbackAbout));
const fallbackHtml = fs.readFileSync(path.join(fallbackOut, fallbackAbout), "utf8");
assert("fallback no mio-about root", !/data-mio-about="public"/.test(fallbackHtml));
assert("fallback keeps scaffold short bio heading", /短い紹介/.test(fallbackHtml));
const noBundleApply = applyMioAboutPage(fallbackOut, null);
assert("apply without bundle not applied", noBundleApply.applied === false);
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
});

assert("convert wrote pages", (convertResult?.writtenPages?.length ?? 0) >= 8);
assert(
  "gosaki unloaded after convert",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);

const writtenRel = walkFiles(tempOut);
const aboutRel =
  writtenRel.find((f) => f === "src/pages/about/index.astro") ||
  writtenRel.find((f) => /about\.astro$/.test(f));
assert("about page present", Boolean(aboutRel));
const aboutHtml = fs.readFileSync(path.join(tempOut, aboutRel), "utf8");

assert("mio about root", /data-mio-about="public"/.test(aboutHtml));
assert("JA short section", /data-mio-about-section="ja-short"/.test(aboutHtml));
assert("JA long section", /data-mio-about-section="ja-long"/.test(aboutHtml));
assert("EN section", /data-mio-about-section="en"/.test(aboutHtml));
assert("no-photo section", /data-mio-about-section="no-photo"/.test(aboutHtml));
assert("collaborators 3", /data-mio-collaborator-count="3"/.test(aboutHtml));
for (const id of EXPECTED_COLLAB_IDS) {
  assert(`collaborator ${id}`, aboutHtml.includes(`data-mio-collaborator-id="${id}"`));
}
assert("profile photo alt", /alt="如月澪のポートレート（プレースホルダー）"/.test(aboutHtml));
assert(
  "local photo withBase root",
  /src=\{withBase\('\/images\/portrait-placeholder\.svg'\)\}/.test(aboutHtml),
);
assert("withBase import present", /import \{ withBase \}/.test(aboutHtml));
assert("no relative images/ src", !/src="images\//.test(aboutHtml));
assert("no external img https", !/src="https?:\/\//i.test(aboutHtml));
assert("ja short text", aboutHtml.includes(escapeMioAboutHtml(aboutBundle.profile.jaShort)));
assert("en text snippet", /Musician CMS Kit verification/.test(aboutHtml));
assert("no-photo text", /写真スロットを持たない紹介文/.test(aboutHtml));
assert("no gosaki in about", !/gosaki/i.test(aboutHtml));
assert("no BandProfiles", !/BandProfiles|band-profiles/i.test(aboutHtml));

/** Schedule regression */
const hubRel = writtenRel.find((f) => f === "src/pages/schedule/index.astro");
const augRel = writtenRel.find((f) => f === "src/pages/schedule-2026-08/index.astro");
const sepRel = writtenRel.find((f) => f === "src/pages/schedule-2026-09/index.astro");
assert("schedule hub", Boolean(hubRel));
assert("schedule aug", Boolean(augRel));
assert("schedule sep", Boolean(sepRel));
const hub = fs.readFileSync(path.join(tempOut, hubRel), "utf8");
const aug = fs.readFileSync(path.join(tempOut, augRel), "utf8");
const sep = fs.readFileSync(path.join(tempOut, sepRel), "utf8");
assert("schedule 14 cards", (() => {
  const n =
    (hub.match(/data-mio-schedule-id="/g) || []).length +
    (aug.match(/data-mio-schedule-id="/g) || []).length +
    (sep.match(/data-mio-schedule-id="/g) || []).length;
  return n === 14;
})());

/** Discography regression */
const discoRel =
  writtenRel.find((f) => f === "src/pages/discography/index.astro") ||
  writtenRel.find((f) => /discography\.astro$/.test(f));
assert("discography page", Boolean(discoRel));
const discoHtml = fs.readFileSync(path.join(tempOut, discoRel), "utf8");
assert(
  "disco 4 releases",
  (discoHtml.match(/data-mio-release-id="/g) || []).length === 4,
);
for (const id of EXPECTED_DISCO_IDS) {
  assert(`disco ${id}`, discoHtml.includes(`data-mio-release-id="${id}"`));
}

/** Videos + footer */
const videosRel =
  writtenRel.find((f) => f === "src/pages/videos/index.astro") ||
  writtenRel.find((f) => /videos\.astro$/.test(f));
assert("videos page", Boolean(videosRel));
const videosHtml = fs.readFileSync(path.join(tempOut, videosRel), "utf8");
assert(
  "videos 3",
  (videosHtml.match(/data-mio-nocookie-embed="true"/g) || []).length === 3,
);
for (const id of EXPECTED_PUBLIC_VIDEO_IDS) {
  assert(`video ${id}`, videosHtml.includes(`youtube-nocookie.com/embed/${id}`));
}
const footerHtml = fs.readFileSync(path.join(tempOut, "src/components/Footer.astro"), "utf8");
assert("footer mio", /mio-footer-social-links/.test(footerHtml));
assert("footer IG", /instagram\.com\/mio\.kisaragi\.fixture/.test(footerHtml));
assert("footer YT", /youtube\.com\/@mio-kisaragi-fixture/.test(footerHtml));
assert("footer no X", !/x\.com\//i.test(footerHtml));

const layoutRel = writtenRel.find((f) => /BaseLayout\.astro$/.test(f));
assert(
  "noindex",
  layoutRel && /noindex/i.test(fs.readFileSync(path.join(tempOut, layoutRel), "utf8")),
);
const contactRel =
  writtenRel.find((f) => /contact\.astro$/.test(f)) ||
  writtenRel.find((f) => /contact\/index\.astro$/.test(f));
assert("contact", Boolean(contactRel));
if (contactRel) {
  const c = fs.readFileSync(path.join(tempOut, contactRel), "utf8");
  assert("contact no action", !/<form[^>]*\baction\s*=/i.test(c));
  assert("contact disabled", /disabled/i.test(c));
}

const textBlob = writtenRel
  .filter((f) => /\.(astro|html|css|svg|json)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(tempOut, f), "utf8"))
  .join("\n");
assert("generated zero gosaki", !/gosaki/i.test(textBlob));

const pilotHooks = await resolveSiteGeneratorHooksAsync(PILOT_FIXTURE, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot noop", pilotHooks.active === false);
const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-about-pilot-tmp");
if (fs.existsSync(pilotTemp)) removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);
await generateAstroProject(PILOT_FIXTURE, pilotTemp, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static",
  deployBase: "/cms-kit-staging/pilot-sample-static/",
  toolRoot: TOOL_ROOT,
});
const pilotBlob = walkFiles(pilotTemp)
  .filter((f) => /\.(astro|html|css|svg)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(pilotTemp, f), "utf8"))
  .join("\n");
assert("pilot zero gosaki", !/gosaki/i.test(pilotBlob));
assert("pilot zero mio-about", !/data-mio-about|mio-about-collaborator/.test(pilotBlob));
removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);

const hooksUrl = pathToFileURL(path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs")).href;
const registryUrl = pathToFileURL(path.join(TOOL_ROOT, "scripts/lib/site-registry.mjs")).href;
const isolated = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
import { SITE_GENERATOR_HOOK_FACTORIES, ensureSiteGeneratorHookAdapter } from ${JSON.stringify(hooksUrl)};
import { MIO_KISARAGI_JAZZ_SITE_KEY, GOSAKI_SITE_KEY } from ${JSON.stringify(registryUrl)};
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: ${JSON.stringify(TOOL_ROOT)} });
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: ${JSON.stringify(TOOL_ROOT)} });
const keys = Object.keys(SITE_GENERATOR_HOOK_FACTORIES);
const ok = keys.length === 1 && keys[0] === MIO_KISARAGI_JAZZ_SITE_KEY && !keys.includes(GOSAKI_SITE_KEY);
console.log(JSON.stringify({ ok, keys }));
process.exit(ok ? 0 : 1);
`,
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 60_000 },
);
assert("isolated mio lazy", isolated.status === 0, (isolated.stderr || isolated.stdout || "").slice(0, 400));

assert("source HTML unchanged", fixtureFingerprint(MIO_FIXTURE) === beforeHtmlFp);
assert("source data unchanged", fixtureFingerprint(MIO_DATA) === beforeDataFp);
const afterProtected = snapshotProtectedTrees();
for (const key of Object.keys(beforeProtected)) {
  assert(
    `protected ${key}`,
    JSON.stringify(beforeProtected[key]) === JSON.stringify(afterProtected[key]),
  );
}

cleanupTemp();
assert("temp removed", !tempOut || !fs.existsSync(tempOut));

const packageJson = fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8");
assert(
  "npm script registered",
  packageJson.includes("verify:cms-core-v2-mio-about-read-render"),
);
const adapterSrc = fs.readFileSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL), "utf8");
assert("adapter no data fixture path", !/mio-kisaragi-jazz-data/.test(adapterSrc));
assert(
  "Core hooks no mio about selectors",
  !/mio-about-collaborator|data-mio-about/.test(
    fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs"), "utf8"),
  ),
);
assert(
  "Core options has aboutBundle",
  fs
    .readFileSync(path.join(TOOL_ROOT, "scripts/lib/site-generator-options.mjs"), "utf8")
    .includes("aboutBundle"),
);

console.log("");
console.log(`cms-core-v2-mio-about-read-render: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
