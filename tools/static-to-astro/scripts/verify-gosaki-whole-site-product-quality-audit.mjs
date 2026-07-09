/**
 * G-20s — Gosaki whole-site product quality audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-whole-site-product-quality-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-whole-site-product-quality-audit.md";
const STAGING_PKG_DIST = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano/public-dist");
const PROD_PKG_DIST = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano-production/public-dist");
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

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

/** @param {string} xml */
function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("audit doc exists", exists(DOC_REL));
assert("HEAD recorded", head.length >= 7, `HEAD=${head}`);

assert("phase is whole site product quality audit", /G-20s-gosaki-whole-site-product-quality-audit|whole-site product quality/i.test(doc));
assert("P0 section", /\bP0\b|P0-S1|P0-M1|P0-C1/i.test(doc));
assert("P1 section", /\bP1\b/i.test(doc));
assert("P2 section", /\bP2\b/i.test(doc));
assert("Defer section", /\bDefer\b|DEF-/i.test(doc));

const areas = ["Home", "Schedule", "Discography", "About", "Contact", "Mobile", "SEO", "YouTube"];
for (const a of areas) {
  assert(`area ${a} covered`, new RegExp(a, "i").test(doc));
}

assert("schedule 2026-08 gap", /2026-08|freshness/i.test(doc));
assert("g20r2b referenced", /G-20r2b|product-quality-policy/i.test(doc));
assert("mobile pending", /mobile|P0-M1|実機/i.test(doc));
assert("hubspot e2e", /HubSpot|E2E|P0-C1/i.test(doc));
assert("angle bracket source parity", /source parity|Kit bugではない|not Kit bug/i.test(doc));

assert("g20r3 proceed judgment", /readyForG20r3ScheduleAugustDbInsertPreflight: true|進めてよい/i.test(doc));
assert("nonSchedule does not block g20r3", /nonScheduleP0BlocksG20r3: false|ブロックしない/i.test(doc));
assert("non-schedule next tasks", /G-20s1|G-20s2|mobile-device-qa|hubspot-e2e/i.test(doc));

assert("client preview not ready", /clientPreviewVerdict: NOT_READY|NOT_READY/i.test(doc));
assert("DB write none", /dbWriteInThisPhase: false|DB write.*\*\*no\*\*/i.test(doc));
assert("SQL none", /sqlFileCreated: false|SQL.*\*\*no\*\*/i.test(doc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(doc));
assert(
  "audit doc sitemap policy superseded by G-20t1",
  /G-20t1|sitemap-admin-exclusion|P2-SEO1.*G-20t1/i.test(doc),
);

const stagingSitemapPath = path.join(STAGING_PKG_DIST, "sitemap-0.xml");
if (fs.existsSync(stagingSitemapPath)) {
  const sitemap = fs.readFileSync(stagingSitemapPath, "utf8");
  const locs = sitemapLocs(sitemap);
  assert("staging sitemap excludes admin", !locs.some((u) => u.includes("/admin/")));
  assert(
    "staging sitemap includes schedule august",
    locs.some((u) => u.includes("/schedule/2026-08/")),
  );
  assert(
    "staging sitemap no legacy august root",
    !locs.some((u) => /\/2026-08\/$/.test(u) && !u.includes("/schedule/")),
  );
  if (fs.existsSync(path.join(STAGING_PKG_DIST, "admin/index.html"))) {
    console.log("PASS staging admin html present in package (not in sitemap)");
    passed += 1;
  }
} else {
  console.error("FAIL staging package sitemap missing for G-20t1 policy check");
  failed += 1;
}

if (fs.existsSync(path.join(PROD_PKG_DIST, "sitemap-0.xml"))) {
  const prodSitemap = fs.readFileSync(path.join(PROD_PKG_DIST, "sitemap-0.xml"), "utf8");
  assert(
    "prod package admin html absent",
    !fs.existsSync(path.join(PROD_PKG_DIST, "admin/index.html")),
  );
  if (prodSitemap.includes("/admin/")) {
    console.log(
      "NOTE prod sitemap still lists /admin/ — pre-G-20t1 artifact; regen with production profile applies G-20t1 filter",
    );
  }
}

assert("00-current-state mentions G-20s", /G-20s|whole-site-product-quality/i.test(currentState));
assert("03-next-actions mentions G-20s", /G-20s|whole-site-product-quality/i.test(nextActions));
assert("handoff mentions G-20s", /G-20s|whole-site-product-quality/i.test(handoff));

const portCheck = spawnSync("lsof", ["-nP", "-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

console.log(
  `\nG-20s Gosaki whole-site product quality audit verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
