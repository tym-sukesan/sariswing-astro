/**
 * CMS Core v2 — Mio Discography read-render verifier.
 *
 * npm: verify:cms-core-v2-mio-discography-read-render
 * Offline · injects scheduleBundle + discographyBundle + embedsBundle · no package / FTP / DB.
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
import {
  buildMioInjectDiscographyBundle,
  escapeMioDiscographyHtml,
  renderMioDiscographyReleaseCardHtml,
  selectMioPublicDiscographyReleases,
} from "./lib/mio-discography-data-page.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const MIO_DATA = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const MIO_ADAPTER_REL = "scripts/lib/mio-site-generator-hooks-adapter.mjs";
const TEMP_OUT_REL = "output/_cms-core-v2-mio-discography-read-render-tmp";

const EXPECTED_PUBLIC_IDS = [
  "mio-disco-album-01",
  "mio-disco-album-02",
  "mio-disco-single-01",
  "mio-disco-album-03",
];
const UNPUBLISHED_ID = "mio-disco-live-01";
const EXPECTED_PUBLIC_VIDEO_IDS = ["mioWatch001", "mioYtBe0001", "mioEmbed001"];
const DRAFT_SCHEDULE_IDS = ["mio-sched-2026-08-10", "mio-sched-2026-08-11"];

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
  fs.existsSync(path.join(TOOL_ROOT, "scripts/lib/mio-discography-data-page.mjs")),
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

const schedulesDoc = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "schedules.json"), "utf8"),
);
const discographyDoc = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "discography.json"), "utf8"),
);
const videosDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "videos.json"), "utf8"));
const expectedPublic = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "expected/public-discography.json"), "utf8"),
);

const scheduleBundle = buildMioInjectScheduleBundle(schedulesDoc);
const discographyBundle = buildMioInjectDiscographyBundle(discographyDoc);
const embedsBundle = {
  embedDataSource: "mio-fixture-inject",
  siteSlug: MIO_KISARAGI_JAZZ_SITE_KEY,
  items: videosDoc.items,
};

const publicReleases = selectMioPublicDiscographyReleases(discographyBundle);
assert("public release count 4", publicReleases.length === 4);
assert(
  "public sort order",
  publicReleases.map((r) => r.legacy_id).join(",") === EXPECTED_PUBLIC_IDS.join(","),
);
assert(
  "matches expected legacy ids",
  publicReleases.map((r) => r.legacy_id).join(",") ===
    expectedPublic.releases.map((r) => r.legacy_id).join(","),
);
assert(
  "unpublished excluded",
  !publicReleases.some((r) => r.legacy_id === UNPUBLISHED_ID),
);
assert(
  "album-01 tracks 10",
  (discographyBundle.tracksByLegacyId["mio-disco-album-01"] ?? []).length === 10,
);
assert(
  "album-02 tracks 2",
  (discographyBundle.tracksByLegacyId["mio-disco-album-02"] ?? []).length === 2,
);
assert(
  "single-01 tracks 1",
  (discographyBundle.tracksByLegacyId["mio-disco-single-01"] ?? []).length === 1,
);
assert(
  "album-03 tracks empty",
  (discographyBundle.tracksByLegacyId["mio-disco-album-03"] ?? []).length === 0,
);

const xssCard = renderMioDiscographyReleaseCardHtml(
  {
    legacy_id: "xss-test",
    title: `<img src=x onerror=alert(1)>`,
    release_date: null,
    cover_image_url: null,
    streaming_url: `https://example.invalid/s?a=1&b=2`,
    purchase_url: null,
    description: `A & B <Credits>`,
    published: true,
    sort_order: 1,
    extensions: { longCredit: true, releaseDateUnknown: true, trackListEmpty: false },
  },
  [{ id: "t1", title: `Track <1>`, track_number: 1, sort_order: 1 }],
);
assert("escape title", xssCard.includes(escapeMioDiscographyHtml(`<img src=x onerror=alert(1)>`)));
assert("escape credit", xssCard.includes("A &amp; B &lt;Credits&gt;"));
assert("escape track", xssCard.includes("Track &lt;1&gt;"));
assert("raw img tag absent", !/<img src=x/i.test(xssCard));
assert("date unknown label", /発売日不明/.test(xssCard));

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
});

assert("convert wrote pages", (convertResult?.writtenPages?.length ?? 0) >= 8);
assert(
  "gosaki unloaded after convert",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);

const writtenRel = walkFiles(tempOut);
const discoRel =
  writtenRel.find((f) => f === "src/pages/discography/index.astro") ||
  writtenRel.find((f) => /discography\.astro$/.test(f));
assert("discography page present", Boolean(discoRel));
const discoHtml = fs.readFileSync(path.join(tempOut, discoRel), "utf8");

assert("mio discography list", /data-mio-discography="public"/.test(discoHtml));
assert(
  "release cards 4",
  (discoHtml.match(/data-mio-release-id="/g) || []).length === 4,
);
for (const id of EXPECTED_PUBLIC_IDS) {
  assert(`release ${id} present`, discoHtml.includes(`data-mio-release-id="${id}"`));
}
assert(`unpublished ${UNPUBLISHED_ID} absent`, !discoHtml.includes(UNPUBLISHED_ID));
assert("Basement Tape absent", !/Basement Tape/.test(discoHtml));

assert(
  "album-01 track count attr 10",
  /data-mio-release-id="mio-disco-album-01"[\s\S]*?data-mio-track-count="10"/.test(discoHtml) ||
    /data-mio-release-id="mio-disco-album-01"[^>]*data-mio-track-count="10"/.test(discoHtml),
);
assert(
  "album-02 few tracks",
  /data-mio-release-id="mio-disco-album-02"[^>]*data-mio-track-count="2"/.test(discoHtml),
);
assert(
  "album-03 empty tracks",
  /data-mio-release-id="mio-disco-album-03"[^>]*data-mio-track-count="0"/.test(discoHtml),
);
assert("発売日不明 present", /発売日不明/.test(discoHtml));
assert("release date unknown flag", /data-mio-release-date-unknown="true"/.test(discoHtml));
assert("has artwork true", /data-mio-has-artwork="true"/.test(discoHtml));
assert("has artwork false", /data-mio-has-artwork="false"/.test(discoHtml));
assert("streaming yes", /data-mio-has-streaming="true"/.test(discoHtml));
assert("streaming no", /data-mio-has-streaming="false"/.test(discoHtml));
assert("long credit flag", /data-mio-long-credit="true"/.test(discoHtml));
assert("Opening Curtain track", /Opening Curtain/.test(discoHtml));
assert("no gosaki in disco", !/gosaki/i.test(discoHtml));

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
assert("schedule public 14 cards across pages", (() => {
  const n =
    (hub.match(/data-mio-schedule-id="/g) || []).length +
    (aug.match(/data-mio-schedule-id="/g) || []).length +
    (sep.match(/data-mio-schedule-id="/g) || []).length;
  return n === 14;
})());
for (const id of DRAFT_SCHEDULE_IDS) {
  assert(`schedule draft ${id} absent`, !hub.includes(id) && !aug.includes(id) && !sep.includes(id));
}

/** Videos + footer regression */
const videosRel =
  writtenRel.find((f) => f === "src/pages/videos/index.astro") ||
  writtenRel.find((f) => /videos\.astro$/.test(f));
assert("videos page", Boolean(videosRel));
const videosHtml = fs.readFileSync(path.join(tempOut, videosRel), "utf8");
assert(
  "videos 3 nocookie",
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
const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-disco-pilot-tmp");
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
assert("pilot zero mio-disco", !/mio-discography-list|data-mio-discography/.test(pilotBlob));
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
  packageJson.includes("verify:cms-core-v2-mio-discography-read-render"),
);
const adapterSrc = fs.readFileSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL), "utf8");
assert("adapter no data fixture path", !/mio-kisaragi-jazz-data/.test(adapterSrc));
assert(
  "Core hooks no mio disco selectors",
  !/mio-discography-list|data-mio-discography/.test(
    fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs"), "utf8"),
  ),
);

console.log("");
console.log(`cms-core-v2-mio-discography-read-render: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
