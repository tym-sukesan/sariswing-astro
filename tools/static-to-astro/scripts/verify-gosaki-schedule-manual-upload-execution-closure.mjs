/**
 * G-20r4e — Gosaki schedule August manual upload execution closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-manual-upload-execution-closure.mjs
 *
 * Performs read-only HTTP GET against staging public URLs (allowed in G-20r4e).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-manual-upload-execution-closure.md";
const PREFLIGHT_REL = "tools/static-to-astro/docs/gosaki-schedule-upload-preflight.md";

const BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const BASE_COMMIT = "3bd165f";

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

async function get(pathSuffix) {
  const url = `${BASE}${pathSuffix}`;
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  return { url, status: res.status, text };
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

assert("HEAD is 3bd165f", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is 3bd165f", origin === BASE_COMMIT, `origin=${origin}`);

assert("closure doc exists", exists(DOC_REL));
assert("G-20r4d preflight doc exists", exists(PREFLIGHT_REL));

assert("phase G-20r4e", /G-20r4e-gosaki-schedule-manual-upload-execution-closure/i.test(doc));
assert(
  "closure gate complete",
  /gosakiScheduleAugustManualUploadExecutionClosureComplete: true/i.test(doc),
);
assert("operator upload executed", /operatorManualUploadExecuted: true/i.test(doc));
assert("cursor ftp not executed", /cursorFtpUploadExecuted: false/i.test(doc));
assert("live http verify pass", /liveStagingHttpVerifyPass: true/i.test(doc));
assert("august 14 cards live", /augustCardCountLive: 14/i.test(doc));
assert("ftp re-execution forbidden", /ftpReExecutionForbidden: true/i.test(doc));
assert("no mirror delete", /mirrorDeleteUsed: false/i.test(doc));

assert("remote path documented", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("staging url documented", doc.includes(BASE));

// Live HTTP verify
const paths = [
  "",
  "/schedule/",
  "/schedule/2026-08/",
  "/2026-08/",
  "/schedule/2026-07/",
  "/sitemap-0.xml",
];

for (const p of paths) {
  const { status, text } = await get(p);
  assert(`HTTP 200 ${p || "/"}`, status === 200, `status=${status}`);

  if (p === "/schedule/") {
    assert(
      "hub 2026-08 link",
      /2026-08/.test(text) && /href=["'][^"']*schedule\/2026-08/.test(text),
    );
  }

  if (p === "/schedule/2026-08/") {
    const cards = text.match(/gosaki-schedule-event-card/g) ?? [];
    assert("august 14 event cards", cards.length === 14, `count=${cards.length}`);
    assert("august scheduleDataSource supabase", text.includes("scheduleDataSource=supabase"));
    for (const id of EXCLUDE) {
      assert(`august excludes ${id}`, !text.includes(id));
    }
  }

  if (p === "/2026-08/") {
    assert("legacy noindex", /noindex/i.test(text));
    assert(
      "legacy canonical to schedule/2026-08",
      /rel=["']canonical["'][^>]+schedule\/2026-08/i.test(text),
    );
    const legacyCards = text.match(/gosaki-schedule-event-card/g) ?? [];
    assert("legacy no event cards", legacyCards.length === 0);
  }

  if (p === "/schedule/2026-07/") {
    const julyDates = text.match(/2026\.07\.\d{2}/g) ?? [];
    assert("july regression 14 dates", julyDates.length === 14, `count=${julyDates.length}`);
  }

  if (p === "/sitemap-0.xml") {
    assert("sitemap has schedule/2026-08", text.includes("/schedule/2026-08/"));
    const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const legacyRoot = locs.filter((u) => u.endsWith("/2026-08/") && !u.includes("/schedule/"));
    assert("sitemap no legacy /2026-08/ root", legacyRoot.length === 0);
  }
}

assert("00-current-state mentions G-20r4e", /G-20r4e|manual-upload-execution-closure/i.test(currentState));
assert("03-next-actions mentions G-20r4e", /G-20r4e|manual-upload-execution-closure/i.test(nextActions));
assert("handoff mentions G-20r4e", /G-20r4e|manual-upload-execution-closure/i.test(handoff));

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
  `\nG-20r4e Gosaki schedule August manual upload execution closure verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
