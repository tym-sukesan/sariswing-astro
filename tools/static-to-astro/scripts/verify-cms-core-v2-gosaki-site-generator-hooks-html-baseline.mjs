/**
 * CMS Core v2 — Gosaki site-generator-hooks HTML baseline (pre-adapter move).
 * Offline: synthetic fixtures · no package · no FTP · no factory move.
 *
 * Run: node scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs
 * npm: verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE_ABOUT_CONFIG,
  BASELINE_ABOUT_IN,
  BASELINE_ABOUT_OUT,
  BASELINE_BASE_URL,
  BASELINE_CONTACT_PAGE_IN,
  BASELINE_DEPLOY_BASE,
  BASELINE_DISCO_HTML_IN,
  BASELINE_DISCO_OUT,
  BASELINE_FOOTER_IN,
  BASELINE_FOOTER_OUT,
  BASELINE_HOME_IN,
  BASELINE_HOME_YT_OUT,
  BASELINE_HOOK_METHOD_NAMES,
  BASELINE_LEGACY_STUB_HTML,
  BASELINE_POST_GENERATE_EMPTY_PROJECT,
  BASELINE_POST_GENERATE_KEYS,
  BASELINE_SCHEDULE_APPLY_KEYS,
  BASELINE_SCHEDULE_BUNDLE,
  BASELINE_TRANSFORM_PAGE_IN,
  BASELINE_TRANSFORM_PAGE_OUT,
} from "./lib/cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs";
import { applyAboutContentToPage } from "./lib/gosaki-about-content.mjs";
import {
  buildGosakiContactHubspotEmbedHtml,
  injectHubspotEmbedIntoContactPage,
  loadGosakiContactHubspotConfig,
} from "./lib/gosaki-contact-hubspot-embed.mjs";
import { injectYouTubeEmbedIntoHomePage } from "./lib/gosaki-home-youtube-embed.mjs";
import { GOSAKI_READ_ONLY_ADMIN_DATA_ATTR } from "./lib/gosaki-staging-read-only-admin.mjs";
import { resolveSiteGeneratorHooks } from "./lib/site-generator-hooks.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const HOOKS = path.join(__dirname, "lib/site-generator-hooks.mjs");
const FIXTURES_MOD = path.join(
  __dirname,
  "lib/cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs",
);
const FIXTURE_DIR = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline",
);
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-gosaki-site-generator-hooks-html-baseline.md",
);

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

function deepEqual(name, actual, expected) {
  try {
    assertNode.deepStrictEqual(actual, expected);
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(err instanceof Error ? err.message : String(err));
  }
}

function assertExact(name, actual, expected) {
  if (actual === expected) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
    let i = 0;
    const a = String(actual);
    const b = String(expected);
    while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
    console.error(
      `  len actual=${a.length} expected=${b.length} firstDiff@${i}`,
    );
    console.error(`  actual: ${JSON.stringify(a.slice(Math.max(0, i - 24), i + 48))}`);
    console.error(`  expect: ${JSON.stringify(b.slice(Math.max(0, i - 24), i + 48))}`);
  }
}

function readFix(name) {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), "utf8");
}

assert("hooks module exists", fs.existsSync(HOOKS));
assert("fixtures module exists", fs.existsSync(FIXTURES_MOD));
assert("fixture dir exists", fs.existsSync(FIXTURE_DIR));
assert("doc exists", fs.existsSync(DOC));

const hooksSrc = fs.readFileSync(HOOKS, "utf8");
assert(
  "factory still in site-generator-hooks (not moved)",
  /function createGosakiPianoHookMethods\(/.test(hooksSrc),
);
assert(
  "factory still registered on SITE_GENERATOR_HOOK_FACTORIES",
  /\[GOSAKI_SITE_KEY\]:\s*createGosakiPianoHookMethods/.test(hooksSrc),
);
assert(
  "no gosaki-site-generator-hooks-adapter import yet",
  !/gosaki-site-generator-hooks-adapter/.test(hooksSrc),
);

const hooks = resolveSiteGeneratorHooks(TOOL_ROOT, {
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("hooks siteKey gosaki-piano", hooks.siteKey === GOSAKI_SITE_KEY);
assert("hooks active", hooks.active === true);

const methodNames = BASELINE_HOOK_METHOD_NAMES.filter((name) => typeof hooks[name] === "function");
deepEqual("hook method names present", methodNames, [...BASELINE_HOOK_METHOD_NAMES]);

// --- Schedule route transform ---
{
  const out = hooks.transformAnalysisPages(
    [{ ...BASELINE_TRANSFORM_PAGE_IN, seo: { ...BASELINE_TRANSFORM_PAGE_IN.seo } }],
    { baseUrl: BASELINE_BASE_URL, deployBase: BASELINE_DEPLOY_BASE },
  );
  deepEqual("transformAnalysisPages deep-equal", out[0], {
    ...BASELINE_TRANSFORM_PAGE_OUT,
    seo: { ...BASELINE_TRANSFORM_PAGE_OUT.seo },
  });
}

// --- Footer SNS ---
assertExact(
  "generateFooter HTML exact",
  hooks.generateFooter(BASELINE_FOOTER_IN, { linkTransformContext: {} }),
  BASELINE_FOOTER_OUT,
);
assert(
  "footer keeps #LnkBr2 and injects .gosaki-footer-social-links",
  BASELINE_FOOTER_OUT.includes('id="LnkBr2"') &&
    BASELINE_FOOTER_OUT.includes('class="gosaki-footer-social-links"') &&
    BASELINE_FOOTER_OUT.includes('aria-label="Social links"'),
);

// --- Schedule usage / skip ---
{
  const usage = hooks.resolveScheduleDataUsage({
    scheduleBundle: BASELINE_SCHEDULE_BUNDLE,
  });
  assert("resolveScheduleDataUsage.useScheduleData", usage.useScheduleData === true);
  deepEqual("resolveScheduleDataUsage.monthRoutes", [...(usage.monthRoutes ?? [])].sort(), [
    "/schedule/2026-08/",
  ]);
  assert(
    "shouldSkipScheduleMonthPage true for hub month",
    hooks.shouldSkipScheduleMonthPage(
      { route: "/schedule/2026-08/" },
      { useScheduleData: true, monthRoutes: usage.monthRoutes },
    ) === true,
  );
  assert(
    "shouldSkipScheduleMonthPage false for other route",
    hooks.shouldSkipScheduleMonthPage(
      { route: "/about/" },
      { useScheduleData: true, monthRoutes: usage.monthRoutes },
    ) === false,
  );
}

// --- Schedule index / month HTML ---
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-hooks-sched-"));
  fs.mkdirSync(path.join(tmp, "src/pages"), { recursive: true });
  const result = hooks.applyScheduleDataPages({
    outDir: tmp,
    scheduleBundle: BASELINE_SCHEDULE_BUNDLE,
    baseUrl: BASELINE_BASE_URL,
    deployBase: BASELINE_DEPLOY_BASE,
  });
  deepEqual(
    "applyScheduleDataPages return keys",
    Object.keys(result).sort(),
    [...BASELINE_SCHEDULE_APPLY_KEYS].sort(),
  );
  assert("scheduleDataSource supabase", result.scheduleDataSource === "supabase");
  assert("eventCount 1", result.eventCount === 1);
  assertExact(
    "schedule index.astro exact",
    fs.readFileSync(path.join(tmp, "src/pages/schedule/index.astro"), "utf8"),
    readFix("schedule-index.astro"),
  );
  assertExact(
    "schedule month 2026-08 exact",
    fs.readFileSync(path.join(tmp, "src/pages/schedule/2026-08/index.astro"), "utf8"),
    readFix("schedule-month-2026-08.astro"),
  );
  assert(
    "schedule hub classes + supabase marker",
    readFix("schedule-index.astro").includes('class="gosaki-schedule-hub"') &&
      readFix("schedule-index.astro").includes(
        "scheduleDataSource=supabase",
      ) &&
      readFix("schedule-index.astro").includes("withBase('/schedule/2026-08/')"),
  );
  assert(
    "schedule month classes + supabase marker",
    readFix("schedule-month-2026-08.astro").includes('class="gosaki-schedule-month"') &&
      readFix("schedule-month-2026-08.astro").includes(
        "scheduleDataSource=supabase",
      ),
  );
}

// --- Home YouTube (hook path via gosaki-home-youtube-embed inject) ---
assertExact(
  "injectYouTubeEmbedIntoHomePage exact",
  injectYouTubeEmbedIntoHomePage(BASELINE_HOME_IN),
  BASELINE_HOME_YT_OUT,
);
assert(
  "YouTube after #comp-m8y53dj5 + import",
  BASELINE_HOME_YT_OUT.includes('id="comp-m8y53dj5"') &&
    BASELINE_HOME_YT_OUT.includes("<YouTubeEmbedSection />") &&
    BASELINE_HOME_YT_OUT.includes('import YouTubeEmbedSection from "../components/YouTubeEmbedSection.astro";'),
);

// --- About content ---
{
  const about = applyAboutContentToPage(BASELINE_ABOUT_IN, BASELINE_ABOUT_CONFIG);
  deepEqual("applyAboutContentToPage return shape", {
    profileApplied: about.profileApplied,
    bandsApplied: about.bandsApplied,
    bandsImportRemoved: about.bandsImportRemoved,
  }, {
    profileApplied: BASELINE_ABOUT_OUT.profileApplied,
    bandsApplied: BASELINE_ABOUT_OUT.bandsApplied,
    bandsImportRemoved: BASELINE_ABOUT_OUT.bandsImportRemoved,
  });
  assertExact("applyAboutContentToPage content exact", about.content, BASELINE_ABOUT_OUT.content);
  assert(
    "About locks cheerio lowercase bandprofilessection + lede",
    BASELINE_ABOUT_OUT.content.includes("<bandprofilessection>") &&
      BASELINE_ABOUT_OUT.content.includes('class="lede">BASELINE_LEDE</p>'),
  );
}

// --- Contact HubSpot ---
{
  const loaded = loadGosakiContactHubspotConfig(TOOL_ROOT);
  assert("contact hubspot config loads", loaded.ok === true);
  const embed = buildGosakiContactHubspotEmbedHtml(loaded.config);
  assertExact("contact hubspot embed exact", embed, readFix("contact-hubspot-embed.html"));
  const page = injectHubspotEmbedIntoContactPage(BASELINE_CONTACT_PAGE_IN, embed);
  assertExact("contact page inject exact", page, readFix("contact-page.astro"));
  assert(
    "contact id/class/data attrs",
    page.includes('id="gosaki-contact-hubspot-embed"') &&
      page.includes('class="gosaki-contact-hubspot-embed"') &&
      page.includes('data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459"') &&
      page.includes('data-portal-id="21392032"'),
  );
}

// --- Discography ---
{
  const disco = hooks.patchDiscographyPageMainHtml(
    BASELINE_DISCO_HTML_IN,
    { route: "/discography/" },
    {
      discographyBundle: {
        discographyDataSource: "supabase",
        releases: [
          {
            legacy_id: "r1",
            title: "Baseline Album",
            purchase_url: "https://new.base.shop/",
          },
        ],
        tracksByLegacyId: {},
        trackRowCount: 0,
      },
    },
  );
  deepEqual("patchDiscographyPageMainHtml deep-equal", disco, {
    html: BASELINE_DISCO_OUT.html,
    summary: { ...BASELINE_DISCO_OUT.summary },
  });
  assert(
    "discography keeps repeater id/class + purchase href",
    disco.html.includes('id="comp-llexymga__item-1"') &&
      disco.html.includes('class="wixui-repeater__item"') &&
      disco.html.includes('href="https://new.base.shop/"') &&
      disco.html.includes("discographyDataSource=supabase"),
  );
  assert(
    "discography null when wrong route",
    hooks.patchDiscographyPageMainHtml(BASELINE_DISCO_HTML_IN, { route: "/about/" }, {
      discographyBundle: {
        discographyDataSource: "supabase",
        releases: [{ legacy_id: "r1", title: "Baseline Album", purchase_url: "https://x/" }],
      },
    }) === null,
  );
}

// --- Legacy month stubs (orchestration + injected generator) ---
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-hooks-leg-"));
  /** @type {{ path: string, content: string }[]} */
  const written = [];
  const result = hooks.applyLegacyMonthStubs({
    outDir: tmp,
    scheduleBundle: BASELINE_SCHEDULE_BUNDLE,
    useScheduleData: true,
    baseUrl: BASELINE_BASE_URL,
    deployBase: BASELINE_DEPLOY_BASE,
    writeFile(filePath, content) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, "utf8");
      written.push({ path: filePath, content });
    },
    generateScheduleLegacyMonthStubPage: () => BASELINE_LEGACY_STUB_HTML,
  });
  assert("legacy stub count 1", result.count === 1);
  assert("legacy stub paths length 1", result.paths.length === 1);
  assertExact("legacy stub HTML exact", written[0]?.content ?? "", BASELINE_LEGACY_STUB_HTML);
  assert(
    "legacy stub path 2026-08/index.astro",
    result.paths[0].endsWith(`${path.sep}2026-08${path.sep}index.astro`) ||
      result.paths[0].endsWith("/2026-08/index.astro"),
  );
  assert(
    "legacy stub noindex safety attrs in fixture",
    BASELINE_LEGACY_STUB_HTML.includes('data-robots="noindex,follow"') &&
      BASELINE_LEGACY_STUB_HTML.includes('class="gosaki-schedule-legacy-stub"'),
  );
  const noInject = hooks.applyLegacyMonthStubs({
    outDir: tmp,
    scheduleBundle: BASELINE_SCHEDULE_BUNDLE,
    useScheduleData: true,
  });
  deepEqual("legacy stubs noop without writeFile", noInject, { count: 0, paths: [] });
}

// --- Admin / postGenerate return shape ---
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gosaki-hooks-pg-"));
  fs.mkdirSync(path.join(tmp, "src/pages"), { recursive: true });
  const result = hooks.applyPostGenerate(tmp, {
    toolRoot: TOOL_ROOT,
    siteKey: GOSAKI_SITE_KEY,
  });
  deepEqual(
    "applyPostGenerate return keys",
    Object.keys(result).sort(),
    [...BASELINE_POST_GENERATE_KEYS].sort(),
  );
  assert(
    "postGenerate band/about/yt/contact not applied (empty pages)",
    result.gosakiBandProfilesSummary.applied ===
      BASELINE_POST_GENERATE_EMPTY_PROJECT.bandApplied &&
      result.gosakiAboutContentSummary.applied ===
        BASELINE_POST_GENERATE_EMPTY_PROJECT.aboutApplied &&
      result.gosakiYoutubeEmbedSummary.applied ===
        BASELINE_POST_GENERATE_EMPTY_PROJECT.ytApplied &&
      result.gosakiContactHubspotSummary.applied ===
        BASELINE_POST_GENERATE_EMPTY_PROJECT.contactApplied,
  );
  assert(
    "postGenerate admin applied",
    result.gosakiReadOnlyAdminSummary.applied ===
      BASELINE_POST_GENERATE_EMPTY_PROJECT.adminApplied,
  );
  const writtenRel = result.writtenPaths
    .map((p) => path.relative(tmp, p).split(path.sep).join("/"))
    .sort();
  deepEqual(
    "postGenerate writtenPath basenames",
    writtenRel,
    [...BASELINE_POST_GENERATE_EMPTY_PROJECT.writtenPathBasenames].sort(),
  );
  assertExact(
    "admin portal page stub exact",
    fs.readFileSync(path.join(tmp, "src/pages/admin/index.astro"), "utf8"),
    BASELINE_POST_GENERATE_EMPTY_PROJECT.adminPortalPage,
  );
  const summary = result.gosakiReadOnlyAdminSummary;
  for (const [key, value] of Object.entries(
    BASELINE_POST_GENERATE_EMPTY_PROJECT.adminSummaryShape,
  )) {
    assert(`admin summary.${key}`, summary[key] === value);
  }
  const dash = summary.dashboardSnapshot;
  for (const [key, value] of Object.entries(
    BASELINE_POST_GENERATE_EMPTY_PROJECT.adminDashboardSafety,
  )) {
    assert(`admin dashboardSnapshot.${key}`, dash?.[key] === value);
  }
  assert(
    "admin template retains data-gosaki-read-only-admin SoT constant",
    GOSAKI_READ_ONLY_ADMIN_DATA_ATTR.includes("data-gosaki-read-only-admin"),
  );
  const adminTemplate = path.join(
    TOOL_ROOT,
    "templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
  );
  if (fs.existsSync(adminTemplate)) {
    const tpl = fs.readFileSync(adminTemplate, "utf8");
    assert(
      "admin template contains data-gosaki-read-only-admin",
      tpl.includes("data-gosaki-read-only-admin"),
    );
  } else {
    assert(
      "admin template path alternate OK via written lib",
      fs.existsSync(path.join(tmp, "src/lib/gosaki-staging-read-only-admin.ts")),
    );
  }
}

// --- Visual slug / fixture match (light) ---
assert(
  "resolveVisualOverrideSiteSlug gosaki-static-site",
  hooks.resolveVisualOverrideSiteSlug("/x", "gosaki-static-site") === "gosaki-static-site",
);
assert(
  "resolveVisualOverrideSiteSlug passthrough",
  hooks.resolveVisualOverrideSiteSlug("/x", "other-slug") === "other-slug",
);

const aiCurrent = fs.readFileSync(
  path.join(REPO_ROOT, "tools/static-to-astro/docs/ai/00-current-state.md"),
  "utf8",
);
const aiNext = fs.readFileSync(
  path.join(REPO_ROOT, "tools/static-to-astro/docs/ai/03-next-actions.md"),
  "utf8",
);
const aiHandoff = fs.readFileSync(
  path.join(REPO_ROOT, "tools/static-to-astro/docs/ai/handoff-to-chatgpt.md"),
  "utf8",
);
assert(
  "AI current-state mentions html-baseline phase",
  /cms-core-v2-gosaki-site-generator-hooks-html-baseline/.test(aiCurrent),
);
assert(
  "AI next-actions mentions html-baseline phase",
  /cms-core-v2-gosaki-site-generator-hooks-html-baseline/.test(aiNext),
);
assert(
  "AI handoff mentions html-baseline phase",
  /cms-core-v2-gosaki-site-generator-hooks-html-baseline/.test(aiHandoff),
);

const packageJson = fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8");
assert(
  "npm script registered",
  packageJson.includes("verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline"),
);
const suiteSrc = fs.readFileSync(
  path.join(__dirname, "run-cms-core-v2-safety-suite.mjs"),
  "utf8",
);
assert(
  "safety suite includes html-baseline verifier",
  suiteSrc.includes("verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
