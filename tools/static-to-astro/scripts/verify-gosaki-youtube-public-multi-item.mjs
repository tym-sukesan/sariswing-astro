#!/usr/bin/env node
/**
 * Gosaki YouTube public multi-item capability (network-free).
 * - Resolves 1 / 2 / 3 published fixtures
 * - Renders public-section HTML smoke (mirrors YouTubeEmbedSection.astro)
 * - Asserts Astro component CSS supports stacked multi-item layout
 * - Asserts DB mapper accepts multi rows; live SoT remains 1 item (unchanged)
 *
 * Does not: remote DB, Save, package, FTP, mutate config/sites SoT.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  mapSiteEmbedRowsToYoutubeConfig,
  parseYoutubeVideoId,
} from "./lib/cms-core-v2-youtube-supabase-contract.mjs";
import {
  renderGosakiYoutubePublicSectionHtml,
  resolvePublishedGosakiYoutubeItems,
} from "./lib/gosaki-youtube-embed-utils.mjs";
import { buildGosakiPianoSiteOverridesCss } from "./lib/site-specific-overrides/gosaki-piano-overrides.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const FIXTURE_DIR = path.join(TOOL_ROOT, "fixtures/gosaki-youtube-public-multi");
const ASTRO = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro",
);
const LIVE_SOT = path.join(TOOL_ROOT, "config/sites/gosaki-piano-youtube-embed.json");
const ADMIN_MULTI = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-youtube-multi-operational-edit.ts",
);

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${msg}`);
  } else {
    failed += 1;
    console.error(`FAIL ${msg}`);
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, rel), "utf8"));
}

function countClass(html, className) {
  return (html.match(new RegExp(`class="${className}"`, "g")) || []).length;
}

// --- fixtures present ---
assert(fs.existsSync(path.join(FIXTURE_DIR, "1-item.json")), "fixture 1-item.json");
assert(fs.existsSync(path.join(FIXTURE_DIR, "2-items.json")), "fixture 2-items.json");
assert(fs.existsSync(path.join(FIXTURE_DIR, "3-items.json")), "fixture 3-items.json");

// --- 1 item (current live shape) ---
const one = resolvePublishedGosakiYoutubeItems(readJson("1-item.json"));
assert(one.length === 1, "1-item resolves to 1 published");
assert(one[0].videoId === "I-eY9YMq9GI", "1-item videoId");
const html1 = renderGosakiYoutubePublicSectionHtml(one);
assert(countClass(html1, "gosaki-youtube-embed__item") === 1, "1-item HTML has 1 article");
assert((html1.match(/youtube-nocookie\.com\/embed\//g) || []).length === 1, "1-item one iframe src");

// --- 2 items ---
const two = resolvePublishedGosakiYoutubeItems(readJson("2-items.json"));
assert(two.length === 2, "2-items resolves to 2 published");
assert(two[0].sortOrder <= two[1].sortOrder, "2-items sorted by sortOrder");
const html2 = renderGosakiYoutubePublicSectionHtml(two);
assert(countClass(html2, "gosaki-youtube-embed__item") === 2, "2-items HTML has 2 articles");
assert((html2.match(/youtube-nocookie\.com\/embed\//g) || []).length === 2, "2-items two iframe srcs");
assert(html2.includes('data-yt-id="yt-fixture-01"') && html2.includes('data-yt-id="yt-fixture-02"'), "2-items retains item ids");

// --- 3 items (+ unpublished filtered) ---
const threeCfg = readJson("3-items.json");
assert(threeCfg.items.length === 4, "3-items fixture has 4 rows including draft");
const three = resolvePublishedGosakiYoutubeItems(threeCfg);
assert(three.length === 3, "3-items resolves to 3 published (draft filtered)");
assert(
  three.map((i) => i.id).join(",") === "yt-fixture-02,yt-fixture-03,yt-fixture-01",
  "3-items sortOrder order (10,20,30)",
);
assert(!three.some((i) => i.id === "yt-fixture-draft"), "unpublished draft excluded");
const html3 = renderGosakiYoutubePublicSectionHtml(three);
assert(countClass(html3, "gosaki-youtube-embed__item") === 3, "3-items HTML has 3 articles");
assert((html3.match(/youtube-nocookie\.com\/embed\//g) || []).length === 3, "3-items three iframe srcs");

// --- public Astro CSS layout contract (desktop + mobile) ---
const astro = fs.readFileSync(ASTRO, "utf8");
assert(astro.includes("items.map("), "Astro maps items[] (multi-capable)");
assert(astro.includes("aspect-ratio: 16 / 9"), "iframe media aspect-ratio 16/9");
assert(astro.includes(".gosaki-youtube-embed__list") && astro.includes("display: grid"), "list is CSS grid");
assert(astro.includes("gap: 1.5rem"), "list gap between items");
assert(astro.includes("@media (max-width: 768px)"), "mobile media query present");
assert(astro.includes("overflow-x: clip"), "mobile overflow-x clip (no horizontal scroll)");
assert(astro.includes("max-width: 720px"), "desktop max-width retained for 1-item look");

// --- DB mapper multi-row ---
const mapped = mapSiteEmbedRowsToYoutubeConfig([
  {
    provider: "youtube",
    legacy_item_id: "a",
    published: true,
    sort_order: 20,
    source_url: "https://youtu.be/aaaaaaaaaaa",
  },
  {
    provider: "youtube",
    legacy_item_id: "b",
    published: true,
    sort_order: 10,
    source_url: "https://youtu.be/bbbbbbbbbbb",
  },
]);
assert(mapped.items.length === 2, "mapSiteEmbedRowsToYoutubeConfig multi rows");
assert(mapped.items[0].id === "b" && mapped.items[1].id === "a", "mapper sorts by sort_order");
assert(parseYoutubeVideoId(mapped.items[0].embedCode) === "bbbbbbbbbbb", "mapper preserves embed");

// --- Admin multi UI source present (add / reorder / published) ---
const adminSrc = fs.readFileSync(ADMIN_MULTI, "utf8");
assert(adminSrc.includes("newYoutubeItemId") || adminSrc.includes("動画を追加") || adminSrc.includes("data-gosaki-youtube-add"), "Admin multi add affordance in source");
assert(/published|sortOrder|sort_order/.test(adminSrc), "Admin multi published/sort fields");

// --- live SoT unchanged (still 1 item) ---
const live = JSON.parse(fs.readFileSync(LIVE_SOT, "utf8"));
assert(Array.isArray(live.items) && live.items.length === 1, "live SoT still 1 item (fixture-only multi)");
assert(live.items[0].id === "yt-placeholder-01", "live SoT id unchanged");

// --- About mobile order gate (same change set) ---
const aboutCss = buildGosakiPianoSiteOverridesCss();
assert(
  /#comp-lol1i5l0 #comp-jrtenw0n[\s\S]*?order:\s*2\s*!important/.test(aboutCss),
  "About mobile photo order: 2",
);
assert(
  /#comp-lol1i5l0 #comp-jrqh3smr[\s\S]*?order:\s*3\s*!important/.test(aboutCss),
  "About mobile text order: 3",
);
assert(
  /#comp-lol1i5l0 #WRchTxt16[\s\S]*?order:\s*1\s*!important/.test(aboutCss),
  "About mobile title order: 1",
);

console.log(`\nverify-gosaki-youtube-public-multi-item: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
