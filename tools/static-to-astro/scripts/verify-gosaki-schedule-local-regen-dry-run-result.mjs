/**
 * G-20r4b — Gosaki schedule local regen dry-run result verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-local-regen-dry-run-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-local-regen-dry-run-result.md";
const G20R4A_REL =
  "tools/static-to-astro/docs/gosaki-schedule-august-generation-path-enablement.md";
const PACKAGE_DIST = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist";
const SCHEDULES_JSON =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const AUG_HTML = `${PACKAGE_DIST}/schedule/2026-08/index.html`;
const HUB_HTML = `${PACKAGE_DIST}/schedule/index.html`;
const LEGACY_AUG = `${PACKAGE_DIST}/2026-08/index.html`;
const SITEMAP = `${PACKAGE_DIST}/sitemap-0.xml`;

const BASE_COMMIT = "8475a00";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const EXCLUDE = [
  "schedule-2026-08-007",
  "schedule-2026-08-009",
  "schedule-2026-08-013",
  "schedule-2026-08-008",
  "schedule-2026-08-018",
  "schedule-2026-03-014",
  "schedule-2026-09-001",
];

const AUG_INCLUDE_COUNT = 14;

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

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("HEAD is 8475a00", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is 8475a00", origin === BASE_COMMIT, `origin=${origin}`);

assert("result doc exists", exists(DOC_REL));
assert("G-20r4a doc exists", exists(G20R4A_REL));

assert("phase G-20r4b", /G-20r4b-gosaki-schedule-local-regen-dry-run/i.test(doc));
assert("gate complete", /gosakiScheduleLocalRegenDryRunComplete: true/i.test(doc));
assert("regen PASS", /regen.*PASS|package build: PASS/i.test(doc));
assert("json 74 rows", /jsonRowCount: 74|74 rows/i.test(doc));
assert("august 14 json", /augustJsonRows: 14|August.*14/i.test(doc));
assert("ready G-20r4c", /readyForG20r4cPublicOutputReview: true/i.test(doc));
assert("ftp not executed", /ftpUploadExecuted: false/i.test(doc));
assert("staging ref", doc.includes(STAGING_REF));

for (const id of EXCLUDE) {
  assert(`doc excludes ${id}`, doc.includes(id));
}

if (exists(SCHEDULES_JSON)) {
  const json = JSON.parse(read(SCHEDULES_JSON));
  const aug = json.filter((r) => r.month === "2026-08");
  assert("on-disk json total 74", json.length === 74, `got ${json.length}`);
  assert("on-disk august json 14", aug.length === AUG_INCLUDE_COUNT, `got ${aug.length}`);
  for (const id of EXCLUDE) {
    assert(`json absent ${id}`, !json.some((r) => r.legacy_id === id));
  }
} else {
  assert("gosaki-schedules.json exists", false, "missing — run regen first");
}

if (exists(HUB_HTML)) {
  const hub = read(HUB_HTML);
  assert("hub has 2026-08 link", hub.includes("2026-08"));
}

if (exists(AUG_HTML)) {
  const html = read(AUG_HTML);
  const cards = (html.match(/gosaki-schedule-event-card/g) || []).length;
  assert("august html 14 cards", cards === AUG_INCLUDE_COUNT, `got ${cards}`);
  assert("august supabase marker", html.includes("scheduleDataSource=supabase"));
  assert("august html no 007", !html.includes("schedule-2026-08-007"));
}

if (exists(LEGACY_AUG)) {
  const legacy = read(LEGACY_AUG);
  assert("legacy noindex", /noindex/i.test(legacy));
  assert("legacy canonical schedule/2026-08", legacy.includes("/schedule/2026-08/"));
  assert("legacy no event cards", !legacy.includes("gosaki-schedule-event-card"));
}

if (exists(SITEMAP)) {
  const sm = read(SITEMAP);
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const canonical = locs.filter((u) => u.includes("/schedule/2026-08/"));
  const legacyRoot = locs.filter((u) => /\/gosaki-piano\/2026-08\/?$/.test(u));
  assert("sitemap canonical august", canonical.length === 1, `got ${canonical.length}`);
  assert("sitemap no legacy august root", legacyRoot.length === 0);
}

assert("00-current-state mentions G-20r4b", /G-20r4b|local-regen-dry-run/i.test(currentState));
assert("03-next-actions mentions G-20r4b", /G-20r4b|local-regen-dry-run/i.test(nextActions));
assert("handoff mentions G-20r4b", /G-20r4b|local-regen-dry-run/i.test(handoff));

const deniedOk = new RegExp(
  `Never.*${FORBIDDEN_PROD_REF}|forbiddenProject.*${FORBIDDEN_PROD_REF}`,
  "i",
);
assert("forbidden prod ref not active", deniedOk.test(doc));

const portCheck = spawnSync("lsof", ["-nP", "-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error("FAIL port 4321 LISTEN none");
  failed += 1;
}

console.log(
  `\nG-20r4b Gosaki schedule local regen dry-run result verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
