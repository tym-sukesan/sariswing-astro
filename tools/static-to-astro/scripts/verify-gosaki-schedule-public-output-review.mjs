/**
 * G-20r4c — Gosaki schedule public output review verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-public-output-review.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-public-output-review.md";
const G20R4B_REL = "tools/static-to-astro/docs/gosaki-schedule-local-regen-dry-run-result.md";
const PACKAGE_DIST = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist";
const SCHEDULES_JSON =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const AUG_HTML = `${PACKAGE_DIST}/schedule/2026-08/index.html`;
const HUB_HTML = `${PACKAGE_DIST}/schedule/index.html`;
const LEGACY_AUG = `${PACKAGE_DIST}/2026-08/index.html`;
const SITEMAP = `${PACKAGE_DIST}/sitemap-0.xml`;

const BASE_COMMIT = "f1a68c8";
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

assert("HEAD is f1a68c8", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is f1a68c8", origin === BASE_COMMIT, `origin=${origin}`);

assert("review doc exists", exists(DOC_REL));
assert("G-20r4b result doc exists", exists(G20R4B_REL));

assert("phase G-20r4c", /G-20r4c-gosaki-schedule-public-output-review/i.test(doc));
assert("review gate complete", /gosakiSchedulePublicOutputReviewComplete: true/i.test(doc));
assert("local review pass", /localOutputReviewPass: true/i.test(doc));
assert("p0 blockers zero", /p0Blockers: 0|P0.*none/i.test(doc));
assert("ready G-20r4d", /readyForG20r4dUploadPreflight: true/i.test(doc));
assert("upload needed conclusion", /upload-needed|upload needed/i.test(doc));
assert("ftp not executed", /ftpUploadExecuted: false/i.test(doc));
assert("regen not in phase", /packageRegenExecuted: false/i.test(doc));
assert("no live http", /liveStagingHttpReview: not-executed|not executed/i.test(doc));

assert("P0 P1 P2 sections", /P0|P1|P2/.test(doc));
assert("august 14 cards", /14.*card|august.*14/i.test(doc));

for (const id of EXCLUDE) {
  assert(`doc excludes ${id}`, doc.includes(id));
}

if (exists(SCHEDULES_JSON) && exists(AUG_HTML)) {
  const json = JSON.parse(read(SCHEDULES_JSON));
  const augHtml = read(AUG_HTML);
  const aug = json.filter((r) => r.month === "2026-08");
  assert("json august 14", aug.length === 14, `got ${aug.length}`);
  const cards = (augHtml.match(/gosaki-schedule-event-card/g) || []).length;
  assert("html august 14 cards", cards === 14, `got ${cards}`);
  for (const id of EXCLUDE) {
    assert(`json absent ${id}`, !json.some((r) => r.legacy_id === id));
    assert(`html absent ${id}`, !augHtml.includes(id));
  }
}

if (exists(HUB_HTML)) {
  assert("hub 2026-08", read(HUB_HTML).includes("2026-08"));
}

if (exists(LEGACY_AUG)) {
  const legacy = read(LEGACY_AUG);
  assert("legacy noindex", /noindex/i.test(legacy));
  assert("legacy no cards", !legacy.includes("gosaki-schedule-event-card"));
}

if (exists(SITEMAP)) {
  const sm = read(SITEMAP);
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert(
    "sitemap canonical august",
    locs.some((u) => u.includes("/schedule/2026-08/")),
  );
  assert(
    "sitemap no legacy august root",
    !locs.some((u) => /\/gosaki-piano\/2026-08\/?$/.test(u)),
  );
}

assert("00-current-state mentions G-20r4c", /G-20r4c|public-output-review/i.test(currentState));
assert("03-next-actions mentions G-20r4c", /G-20r4c|public-output-review/i.test(nextActions));
assert("handoff mentions G-20r4c", /G-20r4c|public-output-review/i.test(handoff));
assert("03-next-actions next G-20r4d", /G-20r4d/i.test(nextActions));

const deniedOk = new RegExp(
  `Never.*${FORBIDDEN_PROD_REF}|forbiddenProject.*${FORBIDDEN_PROD_REF}`,
  "i",
);
assert("forbidden prod ref not active", deniedOk.test(doc) || !doc.includes(FORBIDDEN_PROD_REF));

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
  `\nG-20r4c Gosaki schedule public output review verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
