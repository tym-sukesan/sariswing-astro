/**
 * G-20s1 — Gosaki mobile device QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-mobile-device-qa.mjs
 *
 * Doc checks + live staging mobile assertions (Playwright 390px).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-mobile-device-qa.md";
const BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const BASE_COMMIT = "db15e57";
const VIEWPORT = { width: 390, height: 844 };

const ROUTES = [
  "/",
  "/schedule/",
  "/schedule/2026-08/",
  "/about/",
  "/discography/",
  "/contact/",
  "/link/",
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

assert("HEAD is db15e57", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is db15e57", origin === BASE_COMMIT, `origin=${origin}`);

assert("qa doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("phase G-20s1", /G-20s1-gosaki-mobile-device-qa/i.test(doc));
assert("qa gate complete", /gosakiMobileDeviceQaComplete: true/i.test(doc));
assert("no fix implementation", /fixImplementationInPhase: false/i.test(doc));
assert("client preview not ready", /clientPreviewVerdict: NOT_READY/i.test(doc));
assert("P0-C1 contact blocker", /P0-C1|contact-hubspot-e2e/i.test(doc));
assert("ready for G-20s2", /readyForG20s2ContactHubspotE2e: true/i.test(doc));
assert("viewport 390", /390/.test(doc));
assert("menu toggle documented", /MENU|nav-toggle/i.test(doc));
assert("schedule 14 cards", /14/.test(doc));
assert("aug16 same day", /8\/16|8\.16/i.test(doc));
assert("no form submit", /formSubmitExecuted: false/i.test(doc));

assert("00-current-state mentions G-20s1", /G-20s1|mobile-device-qa/i.test(currentState));
assert("03-next-actions mentions G-20s2", /G-20s2|hubspot/i.test(nextActions));
assert("handoff mentions G-20s1", /G-20s1|mobile-device-qa/i.test(handoff));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: VIEWPORT,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

for (const route of ROUTES) {
  const res = await page.goto(`${BASE}${route}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  assert(`HTTP 200 ${route}`, res?.status() === 200, `status=${res?.status()}`);

  const scroll = await page.evaluate(() => ({
    canScrollX: document.documentElement.scrollWidth > window.innerWidth,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute("content"),
  }));
  assert(`no user horizontal scroll ${route}`, !scroll.canScrollX);
  assert(`viewport meta ${route}`, /width=device-width/.test(scroll.viewportMeta || ""));
}

// MENU toggle
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
assert("nav toggle exists", (await page.locator(".nav-toggle").count()) > 0);
await page.locator(".nav-toggle").first().click();
await page.waitForTimeout(400);
const navOpen = await page.evaluate(() => {
  const nav = document.querySelector(".global-nav");
  if (!nav) return false;
  const r = nav.getBoundingClientRect();
  return r.height > 10;
});
assert("menu opens nav", navOpen);
const navLinks = await page.locator(".global-nav a").count();
assert("nav 6 links", navLinks === 6, `count=${navLinks}`);

// Schedule hub + August
await page.goto(`${BASE}/schedule/`, { waitUntil: "networkidle" });
const hub = await page.evaluate(() => !!document.querySelector('a[href*="2026-08"]'));
assert("hub august link", hub);

await page.goto(`${BASE}/schedule/2026-08/`, { waitUntil: "networkidle" });
const aug = await page.evaluate(() => {
  const cards = document.querySelectorAll(".gosaki-schedule-event-card");
  const aug16 = [...cards].filter((c) => /2026\.08\.16/.test(c.textContent));
  return { cardCount: cards.length, aug16Count: aug16.length };
});
assert("august 14 cards", aug.cardCount === 14, `count=${aug.cardCount}`);
assert("aug16 two events", aug.aug16Count === 2, `count=${aug.aug16Count}`);

// Discography headings
await page.goto(`${BASE}/discography/`, { waitUntil: "networkidle" });
const disc = await page.evaluate(() => ({
  trackList: /Track List/i.test(document.body.textContent),
  personnel: /Personnel/i.test(document.body.textContent),
}));
assert("discography track list", disc.trackList);
assert("discography personnel", disc.personnel);

// About bands
await page.goto(`${BASE}/about/`, { waitUntil: "networkidle" });
const about = await page.evaluate(() => ({
  bands: /Bands/i.test(document.body.textContent),
  imgs: [...document.querySelectorAll('img[src*="bands"]')].filter(
    (i) => i.getBoundingClientRect().width > 20,
  ).length,
}));
assert("about bands section", about.bands);
assert("about band images", about.imgs >= 5, `count=${about.imgs}`);

// Contact hubspot iframe (no submit)
await page.goto(`${BASE}/contact/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const contact = await page.evaluate(() => {
  const iframe = document.querySelector('iframe[src*="hsforms"]');
  const r = iframe?.getBoundingClientRect();
  return { hasIframe: !!iframe, width: r?.width ?? 0, height: r?.height ?? 0 };
});
assert("contact hubspot iframe", contact.hasIframe);
assert("contact iframe visible width", contact.width > 200, `w=${contact.width}`);

// Footer SNS on home
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const footer = await page.evaluate(() => {
  const t = document.querySelector("#SITE_FOOTER")?.textContent || "";
  return {
    facebook: /Facebook/i.test(t),
    instagram: /Instagram/i.test(t),
    copyright: /©|Copyright/i.test(t),
  };
});
assert("footer facebook", footer.facebook);
assert("footer instagram", footer.instagram);
assert("footer copyright", footer.copyright);

await browser.close();

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
  `\nG-20s1 Gosaki mobile device QA verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
