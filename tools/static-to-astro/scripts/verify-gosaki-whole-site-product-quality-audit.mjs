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
const PKG_DIST = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano-production/public-dist");
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

if (fs.existsSync(PKG_DIST)) {
  const sitemap = fs.readFileSync(path.join(PKG_DIST, "sitemap-0.xml"), "utf8");
  assert("local sitemap has no 2026-08", !sitemap.includes("2026-08"));
  assert("local sitemap admin url noted", sitemap.includes("/admin/"));
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
