#!/usr/bin/env node
/**
 * Local proof that Gosaki public /discography/ track HTML follows a valid
 * Supabase track list, including a count change, and keeps the static block
 * when the list is empty or unsafe.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  discographySupabaseReadSuccess,
  discographyWixReadFallback,
  findDiscographyRepeaterItemBounds,
  loadDiscographyDataForBuild,
  patchDiscographyItemTracks,
} from "./lib/supabase-discography-read.mjs";
import {
  applyGosakiDiscographyPublicList,
  renderGosakiDiscographyAlbumItem,
} from "./lib/gosaki-discography-public-list-render.mjs";
import { createGosakiPianoHookMethods } from "./lib/gosaki-site-generator-hooks-adapter.mjs";

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(toolRoot, "../..");
const fixturePath = path.join(toolRoot, "fixtures/gosaki-piano-ci/discography.html");
const readSource = fs.readFileSync(
  path.join(toolRoot, "scripts/lib/supabase-discography-read.mjs"),
  "utf8",
);
const hookSource = fs.readFileSync(
  path.join(toolRoot, "scripts/lib/gosaki-site-generator-hooks-adapter.mjs"),
  "utf8",
);
const renderSource = fs.readFileSync(
  path.join(toolRoot, "scripts/lib/gosaki-discography-public-list-render.mjs"),
  "utf8",
);
const adminSource = fs.readFileSync(
  path.join(toolRoot, "templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts"),
  "utf8",
);
const edgeSource = fs.readFileSync(
  path.join(repoRoot, "supabase/functions/gosaki-discography-save-dry-run/handler.ts"),
  "utf8",
);
const workflowSource = fs.readFileSync(
  path.join(repoRoot, ".github/workflows/gosaki-piano-production-public-dist.yml"),
  "utf8",
);
const registry = JSON.parse(fs.readFileSync(path.join(toolRoot, "config/sites/registry.json"), "utf8"));

const TRACK_PARAGRAPH_RE = /<p class="font_8[^"]*"[^>]*>[\s\S]*?<\/p>/g;

/** @type {string[]} */
const failures = [];
let passed = 0;

function check(name, ok) {
  if (ok) {
    passed += 1;
    return;
  }
  failures.push(name);
}

function plainFromParagraph(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u200b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trackTitles(segment) {
  const tlIdx = segment.search(/Track List/i);
  const after = segment.slice(tlIdx);
  const endRel = after.search(/Personnel|Release/);
  const block = after.slice(0, endRel);
  return [...block.matchAll(TRACK_PARAGRAPH_RE)]
    .map((match) => plainFromParagraph(match[0]))
    .filter((title) => title && !/Track List/i.test(title));
}

const html = fs.readFileSync(fixturePath, "utf8");
const albumTitles = [...new Set([...html.matchAll(/「([^」]+)」/g)].map((match) => match[1]))];
const albums = [];
for (const title of albumTitles) {
  const bounds = findDiscographyRepeaterItemBounds(html, title);
  if (!bounds) continue;
  const segment = html.slice(bounds.start, bounds.end);
  const titles = trackTitles(segment);
  if (!titles.length) continue;
  albums.push({ title, segment, titles });
}

check("fixture has 4 albums", albums.length === 4);
check(
  "fixture has 34 tracks",
  albums.reduce((sum, album) => sum + album.titles.length, 0) === 34,
);

const gosaki = registry.sites["gosaki-piano"];
check("registry discography build-read is on", gosaki?.supabaseFeatures?.discography === true);
check(
  "production workflow already supplies anon read env",
  workflowSource.includes("PUBLIC_SUPABASE_URL:") && workflowSource.includes("PUBLIC_SUPABASE_ANON_KEY:"),
);
check("no invented discography build-read env", !workflowSource.includes("CMS_KIT_DISCOGRAPHY_BUILD_READ"));
check(
  "read failure stays on wix-html",
  readSource.includes('discographyDataSource: "wix-html"') &&
    readSource.includes("Supabase read failed") &&
    readSource.includes("supabase_read_failed") &&
    readSource.includes("supabase_env_missing") &&
    readSource.includes("supabase_response_invalid"),
);
check(
  "published zero is a successful read",
  readSource.includes("0 published discography rows") &&
    !readSource.includes("supabase_empty_or_error"),
);
check(
  "hook renders a successful supabase read",
  hookSource.includes("applyGosakiDiscographyPublicList") &&
    !hookSource.includes("findDiscographyRepeaterItemBounds") &&
    !hookSource.includes("patchGosakiDiscographySupabaseFields"),
);
check(
  "renderer does not place albums by title",
  !renderSource.includes("findDiscographyRepeaterItemBounds"),
);
check(
  "admin save and edge are outside this renderer",
  !adminSource.includes("applyGosakiDiscographyPublicList") &&
    !edgeSource.includes("gosaki-discography-public-list-render"),
);

for (const album of albums) {
  const same = patchDiscographyItemTracks(
    album.segment,
    album.titles.map((title) => ({ title })),
  );
  check(`${album.title} equal titles keep HTML`, !same.patched && same.segment === album.segment);

  const renamed = album.titles.map((title, index) =>
    index === album.titles.length - 1 ? `${title}X` : title,
  );
  const renamedPatch = patchDiscographyItemTracks(
    album.segment,
    renamed.map((title) => ({ title })),
  );
  check(
    `${album.title} same-count title edit`,
    renamedPatch.patched && trackTitles(renamedPatch.segment).join("\n") === renamed.join("\n"),
  );

  const withPeriod = [...album.titles, "。"];
  const added = patchDiscographyItemTracks(
    album.segment,
    withPeriod.map((title) => ({ title })),
  );
  check(
    `${album.title} extra track line is written`,
    added.patched && trackTitles(added.segment).join("\n") === withPeriod.join("\n"),
  );

  const empty = album.titles.map((title, index) => (index === 0 ? "" : title));
  const emptyPatch = patchDiscographyItemTracks(
    album.segment,
    empty.map((title) => ({ title })),
  );
  check(`${album.title} empty title keeps static HTML`, !emptyPatch.patched && emptyPatch.segment === album.segment);

  const unsafe = patchDiscographyItemTracks(album.segment, [{ title: "<script>" }]);
  check(`${album.title} html title keeps static HTML`, !unsafe.patched && unsafe.segment === album.segment);

  const none = patchDiscographyItemTracks(album.segment, []);
  check(`${album.title} zero tracks keep static HTML`, !none.patched && none.segment === album.segment);
}

const sample = albums[0];
const duplicated = [...sample.titles, sample.titles.at(-1)];
const duplicatePatch = patchDiscographyItemTracks(
  sample.segment,
  duplicated.map((title) => ({ title })),
);
check(
  "duplicate last title is appended",
  duplicatePatch.patched && trackTitles(duplicatePatch.segment).join("\n") === duplicated.join("\n"),
);
const removed = patchDiscographyItemTracks(
  sample.segment,
  sample.titles.slice(0, -1).map((title) => ({ title })),
);
check(
  "shorter list drops only the last track",
  removed.patched &&
    trackTitles(removed.segment).join("\n") === sample.titles.slice(0, -1).join("\n") &&
    !trackTitles(removed.segment).includes(sample.titles.at(-1)),
);

const FIXTURE_ALBUMS = [
  {
    title: "Continuous",
    legacy_id: "discography-001",
    artist: "ごさきりかこTrio Feat.石川周之介",
    sort_order: 1,
    catalog_number: "GSRT-0002",
  },
  { title: "SKYLARK", legacy_id: "discography-002", artist: "後藤沙紀", sort_order: 2, catalog_number: "STU-001" },
  {
    title: "About Us!!",
    legacy_id: "discography-003",
    artist: "ごさきりかこtrio",
    sort_order: 3,
    catalog_number: "GSRT-0001",
  },
  {
    title: "Ja-Jaaaaan!",
    legacy_id: "discography-004",
    artist: "新谷健介オノマトペ",
    sort_order: 4,
    label: "Mardi Gras JAPAN Records",
    catalog_number: "OMP-001",
  },
];
const tracksByTitle = new Map(albums.map((album) => [album.title, album.titles]));
const parityReleases = FIXTURE_ALBUMS.map((row) => ({
  ...row,
  description: "後藤沙紀 / piano",
  purchase_url: "https://gosakirikako.base.shop/",
  streaming_url: "javascript:alert(1)",
  cover_image_url: "https://example.test/cover.png",
  release_date: "2023-07-26",
}));
const tracksByLegacyId = Object.fromEntries(
  FIXTURE_ALBUMS.map((row) => [
    row.legacy_id,
    tracksByTitle.get(row.title).map((title, index) => ({
      title,
      sort_order: index + 1,
      track_number: index + 1,
    })),
  ]),
);
const parityBundle = {
  discographyDataSource: "supabase",
  readStatus: "ok",
  releases: [parityReleases[2], parityReleases[0], parityReleases[3], parityReleases[1]],
  tracksByLegacyId,
  trackRowCount: 34,
};
const rendered = applyGosakiDiscographyPublicList(html, parityBundle);
const renderedIds = [...rendered.html.matchAll(/data-gosaki-discography-legacy-id="([^"]+)"/g)].map(
  (match) => match[1],
);

function renderedTrackTitles(pageHtml, legacyId) {
  const start = pageHtml.indexOf(`id="comp-lley4qy2__cms-${legacyId}"`);
  const end = pageHtml.indexOf(`id="comp-lley693e__cms-${legacyId}"`);
  const block = pageHtml.slice(start, end);
  return [...block.matchAll(TRACK_PARAGRAPH_RE)]
    .map((match) => plainFromParagraph(match[0]))
    .filter((title) => title && title !== "Track List");
}

check("data-driven render replaces the repeater", rendered.replaced && rendered.summary?.renderMode === "data-driven");
check(
  "data-driven attribute is on the repeater element",
  rendered.html.includes('<div id="comp-llexymel" data-gosaki-discography-render="data-driven"') &&
    rendered.html.includes('[id="comp-llexymel"]'),
);
check(
  "album order follows sort_order rather than input order",
  renderedIds.join() === "discography-001,discography-002,discography-003,discography-004",
);
check(
  "rendered track lists match the current 34 titles",
  FIXTURE_ALBUMS.every(
    (row) => renderedTrackTitles(rendered.html, row.legacy_id).join("\n") === tracksByTitle.get(row.title).join("\n"),
  ) &&
    FIXTURE_ALBUMS.reduce((sum, row) => sum + renderedTrackTitles(rendered.html, row.legacy_id).length, 0) === 34,
);
check(
  "generated ids are unique and are not the wix item ids",
  !rendered.html.includes('id="comp-llexymga__item1"') &&
    !rendered.html.includes('id="comp-llexymga__item-j9r9uz7e"') &&
    new Set([...rendered.html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])).size ===
      [...rendered.html.matchAll(/\sid="([^"]+)"/g)].length,
);
check(
  "page chrome stays",
  rendered.html.includes('id="SITE_HEADER"') &&
    rendered.html.includes('id="SITE_FOOTER"') &&
    rendered.html.includes('id="comp-llexymel"'),
);
check(
  "unsafe urls are omitted and db text is escaped into the list",
  rendered.html.includes("https://gosakirikako.base.shop/") &&
    !rendered.html.includes("javascript:") &&
    rendered.html.includes("Mardi Gras JAPAN Records") &&
    rendered.html.includes("後藤沙紀 / piano"),
);

const longer = renderGosakiDiscographyAlbumItem(parityReleases[0], [
  ...tracksByLegacyId["discography-001"],
  { title: "Extra Line" },
]);
const shorter = renderGosakiDiscographyAlbumItem(
  parityReleases[0],
  tracksByLegacyId["discography-001"].slice(0, -1),
);
check(
  "track count can grow or shrink",
  renderedTrackTitles(longer, "discography-001").length === tracksByLegacyId["discography-001"].length + 1 &&
    renderedTrackTitles(shorter, "discography-001").length === tracksByLegacyId["discography-001"].length - 1 &&
    renderedTrackTitles(longer, "discography-001").at(-1) === "Extra Line",
);

const tied = applyGosakiDiscographyPublicList(html, {
  discographyDataSource: "supabase",
  readStatus: "ok",
  releases: [
    { legacy_id: "discography-002", title: "Second", sort_order: 5 },
    { legacy_id: "discography-001", title: "First", sort_order: 5 },
  ],
  tracksByLegacyId: {},
});
check(
  "legacy_id breaks equal sort_order",
  [...tied.html.matchAll(/data-gosaki-discography-legacy-id="([^"]+)"/g)].map((match) => match[1]).join() ===
    "discography-001,discography-002",
);

const escaped = renderGosakiDiscographyAlbumItem(
  { legacy_id: "discography-009", title: "<script>alert(1)</script>", artist: "A & B" },
  [{ title: "<b>x</b>" }],
);
check(
  "titles are escaped",
  !escaped.includes("<script>") && escaped.includes("&lt;script&gt;") && escaped.includes("A &amp; B"),
);
const blocked = renderGosakiDiscographyAlbumItem(
  {
    legacy_id: "discography-008",
    title: "No Cover",
    cover_image_url: "javascript:alert(1)",
    purchase_url: "javascript:alert(1)",
  },
  [],
);
check("javascript urls are dropped", !blocked.includes("javascript:") && !blocked.includes("<img"));

const failedRead = applyGosakiDiscographyPublicList(html, {
  discographyDataSource: "wix-html",
  readStatus: "failed",
  fallbackReason: "supabase_read_failed",
  releases: parityReleases,
  tracksByLegacyId,
});
check(
  "read failure keeps the wix list",
  !failedRead.replaced &&
    failedRead.html === html &&
    failedRead.html.includes('id="comp-llexymga__item1"') &&
    !failedRead.html.includes("discographyRender=data-driven"),
);

const emptyRead = applyGosakiDiscographyPublicList(html, {
  ...discographySupabaseReadSuccess({
    releases: [],
    tracks: [],
    tracksByLegacyId: {},
    siteSlug: "gosaki-piano",
  }),
});
check(
  "zero published rows clear the list without looking like a read failure",
  emptyRead.replaced &&
    emptyRead.summary?.renderMode === "data-driven-empty" &&
    emptyRead.summary?.readStatus === "ok" &&
    emptyRead.html.includes("publishedCount=0") &&
    !emptyRead.html.includes('id="comp-llexymga__item1"') &&
    emptyRead.html.includes('id="SITE_FOOTER"'),
);

const invalidRows = applyGosakiDiscographyPublicList(html, {
  discographyDataSource: "supabase",
  readStatus: "ok",
  releases: [{ legacy_id: "discography-001", title: "" }],
  tracksByLegacyId: {},
});
check(
  "unrenderable rows keep the whole wix list",
  !invalidRows.replaced &&
    invalidRows.summary?.renderMode === "wix-fallback" &&
    invalidRows.summary?.fallbackReason === "rows_not_renderable" &&
    invalidRows.html.includes('id="comp-llexymga__item1"'),
);

const hooks = createGosakiPianoHookMethods();
check(
  "other routes are not rewritten",
  hooks.patchDiscographyPageMainHtml(html, { route: "/about/" }, { discographyBundle: parityBundle }) === null &&
    hooks.patchDiscographyPageMainHtml(html, { route: "/schedule/" }, { discographyBundle: parityBundle }) === null,
);

const envMissing = await loadDiscographyDataForBuild({
  env: { PUBLIC_SUPABASE_URL: "", PUBLIC_SUPABASE_ANON_KEY: "" },
  toolRoot: path.join(toolRoot, "fixtures/gosaki-piano-ci"),
  logPrefix: "discography-parity-test",
});
const failedBundle = discographyWixReadFallback("supabase_read_failed", "gosaki-piano");
check(
  "env miss and read failure stay distinct from an empty success",
  envMissing.discographyDataSource === "wix-html" &&
    envMissing.readStatus === "failed" &&
    envMissing.fallbackReason === "supabase_env_missing" &&
    failedBundle.readStatus === "failed" &&
    failedBundle.fallbackReason === "supabase_read_failed" &&
    emptyRead.summary?.discographyDataSource === "supabase",
);

const contentAlbum = renderGosakiDiscographyAlbumItem(
  {
    legacy_id: "discography-003",
    title: "About Us!!",
    artist: "ごさきりかこtrio",
    release_display: "Release 2019.01.11",
    release_date: "2019-01-11",
    catalog_number: "GSRT-0001",
    price: "2,500(tax in)",
    purchase_note: "Thank you SOLD OUT!\n各種サブスクにてお聴きいただけます",
    cover_image_url: "https://example.test/about.jpg",
    streaming_url: "https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja",
  },
  [],
);
check(
  "price purchase note release display and cover url render",
  contentAlbum.includes("GSRT-0001 2,500(tax in)") &&
    contentAlbum.includes("Thank you SOLD OUT!") &&
    contentAlbum.includes("各種サブスクにてお聴きいただけます") &&
    contentAlbum.includes("Release 2019.01.11") &&
    !contentAlbum.includes("Release 2019.1.11") &&
    contentAlbum.includes('src="https://example.test/about.jpg"'),
);
const datedAlbum = renderGosakiDiscographyAlbumItem(
  { legacy_id: "discography-010", title: "Later", release_date: "2024-03-05", release_display: "   " },
  [],
);
check("empty release_display falls back to release_date", datedAlbum.includes("Release 2024.3.5"));
const duplicatedNote = renderGosakiDiscographyAlbumItem(
  {
    legacy_id: "discography-004",
    title: "Ja",
    description: "players\nライブ会場でご購入いただけます",
    purchase_note: "ライブ会場でご購入いただけます",
    catalog_number: "OMP-001",
    price: "2,000 (tax in)",
  },
  [],
);
check(
  "a personnel line that repeats the purchase note is shown once",
  duplicatedNote.includes("players") &&
    duplicatedNote.split("ライブ会場でご購入いただけます").length - 1 === 1,
);
const unsafeContent = renderGosakiDiscographyAlbumItem(
  {
    legacy_id: "discography-011",
    title: "Safe",
    price: "<b>9</b>",
    purchase_note: "<script>note</script>",
    cover_image_url: "javascript:alert(1)",
    purchase_url: "not a url",
  },
  [],
);
check(
  "price and purchase note are escaped and bad urls stay out",
  unsafeContent.includes("&lt;b&gt;9&lt;/b&gt;") &&
    unsafeContent.includes("&lt;script&gt;note&lt;/script&gt;") &&
    !unsafeContent.includes("<script>") &&
    !unsafeContent.includes("<img") &&
    !unsafeContent.includes("not a url"),
);
check(
  "public select includes the content columns so a missing column stays a read failure",
  readSource.includes("price,purchase_note,release_display") &&
    readSource.includes("supabase_read_failed"),
);

const cssSource = fs.readFileSync(
  path.join(toolRoot, "scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs"),
  "utf8",
);
check(
  "data-driven list is centered without a fixed offset",
  cssSource.includes("width: min(825px, 100%) !important") &&
    cssSource.includes("margin-left: auto !important") &&
    cssSource.includes("margin-right: auto !important") &&
    cssSource.includes("justify-self: center !important") &&
    !cssSource.includes("translateX("),
);
check(
  "data-driven list css is scoped and stacks on small screens",
  cssSource.includes('#comp-llexymel[data-gosaki-discography-render="data-driven"]') &&
    cssSource.includes("grid-template-columns: 260px minmax(0, 1fr) !important") &&
    cssSource.includes("grid-template-columns: minmax(0, 1fr) !important") &&
    cssSource.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important") &&
    cssSource.includes("gosaki-discography-album__details") &&
    cssSource.includes("overflow-x: clip !important") &&
    !cssSource.includes("#SITE_HEADER[data-gosaki-discography-render") &&
    !cssSource.includes("#SITE_FOOTER[data-gosaki-discography-render"),
);
const detailsStart = longer.indexOf("gosaki-discography-album__details");
const detailsSlice = longer.slice(detailsStart, longer.indexOf("gosaki-discography-album__meta"));
check(
  "track list and personnel share a details row under the title",
  detailsStart > longer.indexOf("gosaki-discography-album__title") &&
    detailsSlice.includes("gosaki-discography-album__tracks") &&
    detailsSlice.includes("gosaki-discography-album__personnel") &&
    !detailsSlice.includes("gosaki-discography-album__meta") &&
    longer.indexOf("gosaki-discography-album__meta") > detailsStart,
);

const sqlTemplate = fs.readFileSync(
  path.join(toolRoot, "scripts/supabase/gosaki-discography-price-purchase-note-release-display.template.sql"),
  "utf8",
);
const saveRpc = fs.readFileSync(
  path.join(repoRoot, "supabase/migrations/20260721100000_gosaki_discography_operational_save_rpc.sql"),
  "utf8",
);
check(
  "content sql template guards the four albums and does not change the save rpc",
  sqlTemplate.includes("DO NOT EXECUTE") &&
    sqlTemplate.includes("PRECHECK") &&
    sqlTemplate.includes("POSTCHECK") &&
    sqlTemplate.includes("site_slug = 'gosaki-piano'") &&
    sqlTemplate.includes("2,500(tax in)") &&
    sqlTemplate.includes("Release 2019.01.11") &&
    sqlTemplate.includes("REFUSING overwrite") &&
    sqlTemplate.includes("a row outside 001-004 changed") &&
    sqlTemplate.includes("an outside snapshot row is missing") &&
    !sqlTemplate.toLowerCase().includes("disable trigger") &&
    !sqlTemplate.includes("service_role") &&
    !sqlTemplate.includes("GRANT ") &&
    !saveRpc.includes("purchase_note") &&
    !saveRpc.includes("release_display"),
);

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const name of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`PASS ${passed}`);
