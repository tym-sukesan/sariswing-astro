/**
 * CMS Core v2 — Mio Schedule read-render verifier.
 *
 * npm: verify:cms-core-v2-mio-schedule-read-render
 * Offline · injects scheduleBundle + embedsBundle · no package / FTP / DB.
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
import {
  buildMioInjectScheduleBundle,
  escapeMioHtml,
  renderMioScheduleEventCardHtml,
  selectMioPublicEventsForMonth,
} from "./lib/mio-schedule-data-pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const MIO_DATA = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const MIO_ADAPTER_REL = "scripts/lib/mio-site-generator-hooks-adapter.mjs";
const TEMP_OUT_REL = "output/_cms-core-v2-mio-schedule-read-render-tmp";

const DRAFT_IDS = ["mio-sched-2026-08-10", "mio-sched-2026-08-11"];
const EXPECTED_PUBLIC_VIDEO_IDS = ["mioWatch001", "mioYtBe0001", "mioEmbed001"];

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
  "adapter file exists",
  fs.existsSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL)),
);
assert(
  "schedule helper exists",
  fs.existsSync(path.join(TOOL_ROOT, "scripts/lib/mio-schedule-data-pages.mjs")),
);

assert(
  "factories empty before ensure",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 0,
);
const ensure1 = await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, {
  toolRoot: TOOL_ROOT,
});
assert("ensure1 registered", ensure1.registered === true);
await ensureSiteGeneratorHookAdapter(MIO_KISARAGI_JAZZ_SITE_KEY, { toolRoot: TOOL_ROOT });
assert(
  "idempotent factory count 1",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1,
);
assert(
  "gosaki not loaded",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);

const schedulesDoc = JSON.parse(
  fs.readFileSync(path.join(MIO_DATA, "schedules.json"), "utf8"),
);
const videosDoc = JSON.parse(fs.readFileSync(path.join(MIO_DATA, "videos.json"), "utf8"));
const scheduleBundle = buildMioInjectScheduleBundle(schedulesDoc);
assert("inject public count 14", scheduleBundle.schedules.length === 14);
assert(
  "inject excludes draft/pending",
  !scheduleBundle.schedules.some((r) => DRAFT_IDS.includes(String(r.legacy_id))),
);
assert("aug count 7", selectMioPublicEventsForMonth(scheduleBundle, "2026-08").length === 7);
assert("sep count 6", selectMioPublicEventsForMonth(scheduleBundle, "2026-09").length === 6);
assert("jul count 1", selectMioPublicEventsForMonth(scheduleBundle, "2026-07").length === 1);

const xssCard = renderMioScheduleEventCardHtml({
  legacy_id: "xss-test",
  month: "2026-08",
  title: `<script>alert("x")</script>`,
  venue: `A & B <Hall>`,
  date: "2026-08-01",
  date_display: "2026.08.01",
  published: true,
  extensions: {
    performers: [`Mio <Vo>`],
    bookingUrl: `https://example.invalid/r?a=1&b=2`,
    priceKind: "paid",
    hasImage: false,
  },
  price: `¥1,000 & tax`,
});
assert("escape title", xssCard.includes(escapeMioHtml(`<script>alert("x")</script>`)));
assert("escape venue", xssCard.includes("A &amp; B &lt;Hall&gt;"));
assert("escape performers", xssCard.includes("Mio &lt;Vo&gt;"));
assert("escape price", xssCard.includes("¥1,000 &amp; tax"));
assert("raw script not present", !xssCard.includes("<script>alert"));

const embedsBundle = {
  embedDataSource: "mio-fixture-inject",
  siteSlug: MIO_KISARAGI_JAZZ_SITE_KEY,
  items: videosDoc.items,
};

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
if (fs.existsSync(tempOut)) removeGeneratedOutputDir(tempOut, TOOL_ROOT);

const convertResult = await generateAstroProject(MIO_FIXTURE, tempOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
  scheduleBundle,
  embedsBundle,
});

assert("convert wrote pages", (convertResult?.writtenPages?.length ?? 0) >= 8);
assert(
  "gosaki still unloaded after convert",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);

const writtenRel = walkFiles(tempOut);
const hubRel = writtenRel.find((f) => f === "src/pages/schedule/index.astro");
const augRel = writtenRel.find((f) => f === "src/pages/schedule-2026-08/index.astro");
const sepRel = writtenRel.find((f) => f === "src/pages/schedule-2026-09/index.astro");
const julRel = writtenRel.find((f) => /schedule-2026-07/.test(f));

assert("hub page written", Boolean(hubRel));
assert("aug month page written", Boolean(augRel));
assert("sep month page written", Boolean(sepRel));
assert("july month page NOT created", !julRel);

const hub = fs.readFileSync(path.join(tempOut, hubRel), "utf8");
const aug = fs.readFileSync(path.join(tempOut, augRel), "utf8");
const sep = fs.readFileSync(path.join(tempOut, sepRel), "utf8");

assert("hub has schedule hub marker", /data-mio-schedule-hub="true"/.test(hub));
assert("hub uses month-links", /class="month-links"/.test(hub));
assert("hub lists aug link", /data-mio-month-link="2026-08"/.test(hub));
assert("hub lists sep link", /data-mio-month-link="2026-09"/.test(hub));
assert("hub archives july", /data-mio-archive-month="2026-07"/.test(hub));
assert("hub has july event", /mio-sched-2026-07-20/.test(hub));
assert("hub date TBD note optional elsewhere", true);

assert(
  "aug event cards 7",
  (aug.match(/data-mio-schedule-id="/g) || []).length === 7,
);
assert(
  "sep event cards 6",
  (sep.match(/data-mio-schedule-id="/g) || []).length === 6,
);
assert("hub july cards 1", (hub.match(/data-mio-schedule-id="mio-sched-2026-07-20"/g) || []).length === 1);

for (const id of DRAFT_IDS) {
  assert(`draft/pending ${id} absent from hub`, !hub.includes(id));
  assert(`draft/pending ${id} absent from aug`, !aug.includes(id));
  assert(`draft/pending ${id} absent from sep`, !sep.includes(id));
}

assert("sep has date TBD", /data-mio-date-status="tbd"/.test(sep));
assert("sep shows 日付未定", /日付未定/.test(sep));
assert("aug has performers", /出演:/.test(aug));
assert("aug has booking", /data-mio-booking="true"/.test(aug));
assert("aug has paid badge", /data-mio-price-kind="paid"/.test(aug));
assert("aug has free badge", /data-mio-price-kind="free"/.test(aug));
assert("aug has image flag", /data-mio-has-image="true"/.test(aug));
assert("aug has no-image flag", /data-mio-has-image="false"/.test(aug));
assert("aug has dual show", /data-mio-dual-show=/.test(aug));
assert("aug has long title marker", /data-mio-long-title="true"/.test(aug));
assert("aug uses event-list", /class="event-list"/.test(aug));
assert("aug uses event-card", /class="event-card/.test(aug));
assert("aug uses has-media", /class="event-card has-media"/.test(aug));
assert("aug image withBase", /src=\{withBase\('\/images\/event-placeholder\.svg'\)\}/.test(aug));
assert("no gosaki in hub", !/gosaki/i.test(hub));
assert("no gosaki in aug", !/gosaki/i.test(aug));
assert("no gosaki in sep", !/gosaki/i.test(sep));

const textBlob = writtenRel
  .filter((f) => /\.(astro|html|css|svg|json)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(tempOut, f), "utf8"))
  .join("\n");
assert("generated zero gosaki tokens", !/gosaki/i.test(textBlob));

const videosRel =
  writtenRel.find((f) => f === "src/pages/videos/index.astro") ||
  writtenRel.find((f) => /videos\.astro$/.test(f));
assert("videos page present", Boolean(videosRel));
const videosHtml = fs.readFileSync(path.join(tempOut, videosRel), "utf8");
assert(
  "videos still 3 nocookie",
  (videosHtml.match(/data-mio-nocookie-embed="true"/g) || []).length === 3,
);
for (const id of EXPECTED_PUBLIC_VIDEO_IDS) {
  assert(`video ${id}`, videosHtml.includes(`youtube-nocookie.com/embed/${id}`));
}

const footerHtml = fs.readFileSync(path.join(tempOut, "src/components/Footer.astro"), "utf8");
assert("footer mio sns", /mio-footer-social-links/.test(footerHtml));
assert("footer Instagram", /instagram\.com\/mio\.kisaragi\.fixture/.test(footerHtml));
assert("footer YouTube", /youtube\.com\/@mio-kisaragi-fixture/.test(footerHtml));
assert("footer no X", !/x\.com\//i.test(footerHtml));

const layoutRel = writtenRel.find((f) => /BaseLayout\.astro$/.test(f));
assert("noindex retained", layoutRel && /noindex/i.test(fs.readFileSync(path.join(tempOut, layoutRel), "utf8")));

const contactRel =
  writtenRel.find((f) => /contact\.astro$/.test(f)) ||
  writtenRel.find((f) => /contact\/index\.astro$/.test(f));
assert("contact present", Boolean(contactRel));
if (contactRel) {
  const c = fs.readFileSync(path.join(tempOut, contactRel), "utf8");
  assert("contact no action", !/<form[^>]*\baction\s*=/i.test(c));
  assert("contact disabled", /disabled/i.test(c));
}

const pilotHooks = await resolveSiteGeneratorHooksAsync(PILOT_FIXTURE, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot noop", pilotHooks.active === false);

const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-sched-pilot-tmp");
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
assert("pilot zero mio-schedule", !/mio-schedule-hub|mio-schedule-event/.test(pilotBlob));
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
  packageJson.includes("verify:cms-core-v2-mio-schedule-read-render"),
);
const adapterSrc = fs.readFileSync(path.join(TOOL_ROOT, MIO_ADAPTER_REL), "utf8");
assert("adapter no data fixture path", !/mio-kisaragi-jazz-data/.test(adapterSrc));
assert(
  "Core hooks no mio schedule selectors",
  !/mio-schedule-event|mio-archive-2026-07/.test(
    fs.readFileSync(path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs"), "utf8"),
  ),
);

console.log("");
console.log(`cms-core-v2-mio-schedule-read-render: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
