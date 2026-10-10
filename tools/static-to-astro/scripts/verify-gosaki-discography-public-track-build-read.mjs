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
  findDiscographyRepeaterItemBounds,
  patchDiscographyItemTracks,
} from "./lib/supabase-discography-read.mjs";

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
    readSource.includes("supabase_empty_or_error"),
);
check(
  "hook patches only a supabase bundle",
  hookSource.includes('discographyDataSource === "supabase"'),
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

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const name of failures) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`PASS ${passed}`);
