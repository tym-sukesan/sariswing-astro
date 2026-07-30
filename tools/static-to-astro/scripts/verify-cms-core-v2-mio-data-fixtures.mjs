/**
 * CMS Core v2 — Mio data fixtures offline verifier.
 * Locks Schedule / Discography / Videos / About companion JSON + public expected results.
 *
 * npm: verify:cms-core-v2-mio-data-fixtures
 * Offline · no adapter · no Supabase · no package · no HTML mutation.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeScheduleRecord,
  sortScheduleRecords,
  deriveScheduleMonthsFromSchedules,
  compareScheduleRecords,
} from "./lib/supabase-schedule-read.mjs";
import {
  normalizeDiscographyRecord,
  normalizeDiscographyTrackRecord,
  groupDiscographyTracksByLegacyId,
} from "./lib/supabase-discography-read.mjs";
import { parseYoutubeVideoId, buildYoutubeNocookieEmbedUrl } from "./lib/youtube-url-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const FIXTURE_ROOT = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz-data");
const HTML_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const SITE = "mio-kisaragi-jazz";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, rel), "utf8"));
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function walkText(dir) {
  if (!fs.existsSync(dir)) return "";
  let out = "";
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out += walkText(abs);
    else if (/\.(json|md|txt)$/i.test(entry.name)) {
      out += fs.readFileSync(abs, "utf8");
    }
  }
  return out;
}

assert("fixture root exists", fs.existsSync(FIXTURE_ROOT));
assert("meta.json exists", fs.existsSync(path.join(FIXTURE_ROOT, "meta.json")));
assert("schedules.json exists", fs.existsSync(path.join(FIXTURE_ROOT, "schedules.json")));
assert("discography.json exists", fs.existsSync(path.join(FIXTURE_ROOT, "discography.json")));
assert("videos.json exists", fs.existsSync(path.join(FIXTURE_ROOT, "videos.json")));
assert("about.json exists", fs.existsSync(path.join(FIXTURE_ROOT, "about.json")));
assert("schema-notes.json exists", fs.existsSync(path.join(FIXTURE_ROOT, "schema-notes.json")));

const meta = readJson("meta.json");
const schedulesDoc = readJson("schedules.json");
const discographyDoc = readJson("discography.json");
const videosDoc = readJson("videos.json");
const aboutDoc = readJson("about.json");
const schemaNotes = readJson("schema-notes.json");
const expectedPublicSchedules = readJson("expected/public-schedules.json");
const expectedPublicMonths = readJson("expected/public-months.json");
const expectedPublicDisco = readJson("expected/public-discography.json");
const expectedVideos = readJson("expected/videos-parse-results.json");
const expectedAbout = readJson("expected/about-required.json");

assert("meta siteKey", meta.siteKey === SITE);
assert("schedules siteSlug", schedulesDoc.siteSlug === SITE);
assert("schedule row count 16", schedulesDoc.rows?.length === 16);

const legacyIds = schedulesDoc.rows.map((r) => r.legacy_id);
assert("schedule legacy_id unique", new Set(legacyIds).size === legacyIds.length);
assert(
  "schedule ids unique",
  new Set(schedulesDoc.rows.map((r) => r.id)).size === schedulesDoc.rows.length,
);

for (const row of schedulesDoc.rows) {
  assert(`schedule ${row.legacy_id} site_slug`, row.site_slug === SITE);
  assert(
    `schedule ${row.legacy_id} has core fields`,
    row.legacy_id && row.month != null && typeof row.published === "boolean",
  );
}

const draft = schedulesDoc.rows.find((r) => r.legacy_id === "mio-sched-2026-08-10");
const pending = schedulesDoc.rows.find((r) => r.legacy_id === "mio-sched-2026-08-11");
const tbd = schedulesDoc.rows.find((r) => r.legacy_id === "mio-sched-2026-09-01");
assert("draft published false", draft?.published === false);
assert("pending published false", pending?.published === false);
assert("pending extension editorialStatus", pending?.extensions?.editorialStatus === "pending");
assert("date TBD date null", tbd?.date === null);
assert("date TBD month retained", tbd?.month === "2026-09");
assert("date TBD extension", tbd?.extensions?.dateStatus === "tbd");

const dualA = schedulesDoc.rows.filter((r) => r.date === "2026-08-07" && r.published);
assert("dual show Aug 7 count 2", dualA.length === 2);

const allNormalized = sortScheduleRecords(
  schedulesDoc.rows.map((row) => normalizeScheduleRecord(row)),
);
const publicSchedules = allNormalized.filter((r) => r.published !== false);
assert("public schedule count 14", publicSchedules.length === 14);
assert(
  "public excludes draft/pending",
  !publicSchedules.some((r) =>
    ["mio-sched-2026-08-10", "mio-sched-2026-08-11"].includes(r.legacy_id),
  ),
);

for (let i = 1; i < publicSchedules.length; i += 1) {
  assert(
    `public sort non-decreasing at ${i}`,
    compareScheduleRecords(publicSchedules[i - 1], publicSchedules[i]) <= 0,
  );
}

const months = deriveScheduleMonthsFromSchedules(publicSchedules);
assert("public months count 3", months.length === 3);
assert(
  "month keys",
  months.map((m) => m.month).join(",") === "2026-09,2026-08,2026-07",
);

const aug = months.find((m) => m.month === "2026-08");
const sep = months.find((m) => m.month === "2026-09");
const jul = months.find((m) => m.month === "2026-07");
assert("aug public count", aug?.count === 7, `got ${aug?.count}`);
assert("sep public count", sep?.count === 6, `got ${sep?.count}`);
assert("jul public count", jul?.count === 1, `got ${jul?.count}`);

assert(
  "expected public-schedules deep equal",
  deepEqual(
    { siteSlug: SITE, count: publicSchedules.length, rows: publicSchedules },
    expectedPublicSchedules,
  ),
);
assert(
  "expected public-months deep equal",
  deepEqual({ siteSlug: SITE, months }, expectedPublicMonths),
);

assert("discography releases 5", discographyDoc.releases?.length === 5);
assert("discography tracks present", discographyDoc.tracks?.length >= 13);
const discoLegacy = discographyDoc.releases.map((r) => r.legacy_id);
assert("disco legacy unique", new Set(discoLegacy).size === discoLegacy.length);

const releasesAll = discographyDoc.releases.map((r) => normalizeDiscographyRecord(r));
const tracksAll = discographyDoc.tracks.map((t) => normalizeDiscographyTrackRecord(t));
const publicReleases = releasesAll.filter((r) => r.published !== false);
assert("public releases 4", publicReleases.length === 4);
assert(
  "unpublished live excluded",
  !publicReleases.some((r) => r.legacy_id === "mio-disco-live-01"),
);

const album01Tracks = tracksAll.filter((t) => t.discography_legacy_id === "mio-disco-album-01");
const album02Tracks = tracksAll.filter((t) => t.discography_legacy_id === "mio-disco-album-02");
const album03Tracks = tracksAll.filter((t) => t.discography_legacy_id === "mio-disco-album-03");
assert("album-01 many tracks >=8", album01Tracks.length >= 8);
assert("album-02 few tracks", album02Tracks.length === 2);
assert("album-03 no tracks", album03Tracks.length === 0);

const noDate = publicReleases.find((r) => r.legacy_id === "mio-disco-album-03");
assert("album-03 release_date null", noDate?.release_date == null);
assert("album-03 long description", String(noDate?.description ?? "").length > 120);

const tracksByLegacyId = groupDiscographyTracksByLegacyId(
  tracksAll.filter((t) => publicReleases.some((r) => r.legacy_id === t.discography_legacy_id)),
);
assert(
  "expected public-discography deep equal",
  deepEqual(
    {
      siteSlug: SITE,
      releaseCount: publicReleases.length,
      releases: publicReleases,
      tracksByLegacyId,
    },
    expectedPublicDisco,
  ),
);

assert("videos items 6", videosDoc.items?.length === 6);
const videoIds = videosDoc.items.map((i) => i.id);
assert("video ids unique", new Set(videoIds).size === videoIds.length);

const videoResults = videosDoc.items.map((item) => {
  const videoId = parseYoutubeVideoId(item.embedCode);
  const kind = item.urlKind;
  let outcome = "embed";
  let reason = null;
  if (!item.published) {
    outcome = "hidden";
    reason = "unpublished";
  } else if (kind === "shorts") {
    outcome = "fail-closed";
    reason = "shorts_unsupported_by_parseYoutubeVideoId";
  } else if (!videoId) {
    outcome = "fail-closed";
    reason = "invalid_or_unparsable_youtube_url";
  }
  return {
    id: item.id,
    urlKind: kind,
    published: item.published,
    embedCode: item.embedCode,
    parsedVideoId: videoId,
    outcome,
    reason,
    nocookieEmbedUrl:
      outcome === "embed" && videoId ? buildYoutubeNocookieEmbedUrl(videoId) : null,
  };
});

assert("watch parses", videoResults.find((v) => v.id === "mio-yt-01")?.outcome === "embed");
assert("youtu.be parses", videoResults.find((v) => v.id === "mio-yt-02")?.outcome === "embed");
assert("embed parses", videoResults.find((v) => v.id === "mio-yt-03")?.outcome === "embed");
assert("shorts fail-closed", videoResults.find((v) => v.id === "mio-yt-04")?.outcome === "fail-closed");
assert("unpublished hidden", videoResults.find((v) => v.id === "mio-yt-05")?.outcome === "hidden");
assert("invalid fail-closed", videoResults.find((v) => v.id === "mio-yt-06")?.outcome === "fail-closed");
assert(
  "expected videos-parse-results deep equal",
  deepEqual({ siteSlug: SITE, items: videoResults }, expectedVideos),
);

assert("about jaShort", Boolean(aboutDoc.profile?.jaShort));
assert("about jaLong >=400", String(aboutDoc.profile?.jaLong ?? "").length >= 400);
assert("about en", Boolean(aboutDoc.profile?.en));
assert("about photo", aboutDoc.profile?.photo?.present === true);
assert("about noPhotoBlock", Boolean(aboutDoc.profile?.noPhotoBlock?.text));
assert("about collaborators 3", aboutDoc.collaborators?.length === 3);
assert(
  "about core page field lede",
  aboutDoc.pageFieldsCoreCompatible?.some(
    (f) => f.field_key === "profile.lede" && f.published === true && f.value_text,
  ),
);
assert(
  "expected about-required deep equal",
  deepEqual(
    {
      siteSlug: SITE,
      required: {
        jaShort: true,
        jaLong: true,
        en: true,
        photoPresent: true,
        noPhotoBlock: true,
        collaboratorsCount: true,
        corePageFieldLede: true,
      },
      profileLede: aboutDoc.pageFieldsCoreCompatible.find((f) => f.field_key === "profile.lede")
        .value_text,
      collaboratorIds: aboutDoc.collaborators.map((c) => c.id),
    },
    expectedAbout,
  ),
);

assert("schema-notes has schedule coreFields", Array.isArray(schemaNotes.schedule?.coreFields));
assert(
  "schema-notes lists dateStatus extension",
  schemaNotes.schedule.extensionFields.includes("extensions.dateStatus"),
);

const dataBlob = walkText(FIXTURE_ROOT);
assert("mio data fixtures have zero gosaki tokens", !/gosaki/i.test(dataBlob));

const htmlIndex = fs.readFileSync(path.join(HTML_FIXTURE, "index.html"), "utf8");
assert("source HTML fixture unchanged presence", /Mio Kisaragi/.test(htmlIndex));
assert(
  "HTML still mentions Paper Lanterns",
  fs.readFileSync(path.join(HTML_FIXTURE, "discography.html"), "utf8").includes("Paper Lanterns"),
);

const packageJson = fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8");
assert(
  "npm verify:cms-core-v2-mio-data-fixtures",
  packageJson.includes("verify:cms-core-v2-mio-data-fixtures"),
);

const registry = fs.readFileSync(path.join(TOOL_ROOT, "config/sites/registry.json"), "utf8");
assert("registry still lists mio", registry.includes('"mio-kisaragi-jazz"'));

console.log("");
console.log(`cms-core-v2-mio-data-fixtures: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
