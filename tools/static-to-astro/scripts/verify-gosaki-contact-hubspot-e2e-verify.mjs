/**
 * G-20s2 — Gosaki Contact HubSpot E2E verify (preflight / render only).
 * Run: node tools/static-to-astro/scripts/verify-gosaki-contact-hubspot-e2e-verify.mjs
 *
 * Inspects form render on staging. Does NOT click submit.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-contact-hubspot-e2e-verify.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-contact-hubspot.json";
const CONTACT_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/";
const BASE_COMMIT = "a03fef9";
const FORM_ID = "57909d0c-9b9f-470a-8a18-e176d1d1a459";
const PORTAL_ID = "21392032";

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
const config = JSON.parse(read(CONFIG_REL));
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("HEAD is a03fef9", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is a03fef9", origin === BASE_COMMIT, `origin=${origin}`);

assert("e2e doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("hubspot config exists", fs.existsSync(path.join(REPO_ROOT, CONFIG_REL)));

assert("phase G-20s2", /G-20s2-gosaki-contact-hubspot-e2e-verify/i.test(doc));
assert("preflight gate complete", /gosakiContactHubspotE2eVerifyPreflightComplete: true/i.test(doc));
assert("cursor submit not executed", /cursorFormSubmitExecuted: false/i.test(doc));
assert("operator submit pending", /operatorManualSubmitExecuted: false/i.test(doc));
assert("ready for G-20s2b", /readyForG20s2bOperatorManualSubmitClosure: true/i.test(doc));
assert("test payload documented", /テスト/.test(doc) && /太郎/.test(doc));
assert("email placeholder not personal", /operator-confirmed-test-email|operator-owned test email/i.test(doc));
assert("no personal email in doc", !/ysktoyamax@gmail\.com/i.test(doc));
assert("manual procedure documented", /Operator manual submit/i.test(doc));
assert("post-submit checks", /Post-submit verification/i.test(doc));
assert("hubspot portal id", doc.includes(PORTAL_ID));
assert("hubspot form id", doc.includes(FORM_ID));

assert("config portalId", config.portalId === PORTAL_ID);
assert("config formId", config.formId === FORM_ID);
assert("config provider hubspot", config.provider === "hubspot");

assert("00-current-state mentions G-20s2", /G-20s2|hubspot-e2e/i.test(currentState));
assert("03-next-actions mentions G-20s2b", /G-20s2b|hubspot/i.test(nextActions));
assert("handoff mentions G-20s2", /G-20s2|hubspot-e2e/i.test(handoff));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const res = await page.goto(CONTACT_URL, { waitUntil: "networkidle", timeout: 60000 });
assert("contact HTTP 200", res?.status() === 200, `status=${res?.status()}`);

await page.waitForTimeout(2500);

const pageMeta = await page.evaluate(() => ({
  hsFrame: !!document.querySelector(".hs-form-frame"),
  wrapper: !!document.querySelector("#gosaki-contact-hubspot-embed, .gosaki-contact-hubspot-embed"),
  iframeCount: document.querySelectorAll("iframe").length,
  intro: document.body.innerText.includes("お問い合わせ"),
}));
assert("hs-form-frame present", pageMeta.hsFrame);
assert("hubspot wrapper present", pageMeta.wrapper);
assert("hubspot iframe present", pageMeta.iframeCount >= 1, `count=${pageMeta.iframeCount}`);
assert("contact intro JP", pageMeta.intro);

const iframeSrc = await page.locator("iframe").first().getAttribute("src");
assert("iframe portal id", (iframeSrc || "").includes(PORTAL_ID));
assert("iframe form id", (iframeSrc || "").includes(FORM_ID));

const frame = page.frameLocator("iframe").first();
const labels = await frame.locator("label").allInnerTexts();
assert("label 姓", labels.some((t) => t.includes("姓")));
assert("label 名", labels.some((t) => t.includes("名")));
assert("label email", labels.some((t) => t.includes("メール")));
assert("label message", labels.some((t) => t.includes("お問い合わせ")));

const submitCount = await frame.locator('input[type=submit], button[type=submit], .hs-button').count();
assert("submit button exists", submitCount >= 1, `count=${submitCount}`);
const submitText = await frame
  .locator('input[type=submit], button[type=submit], .hs-button')
  .first()
  .innerText()
  .catch(async () =>
    frame.locator('input[type=submit], button[type=submit], .hs-button').first().getAttribute("value"),
  );
assert("submit text 送信", (submitText || "").includes("送信"), `text=${submitText}`);

// Explicitly do NOT click submit
assert("verifier does not submit", true);

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
  `\nG-20s2 Gosaki Contact HubSpot E2E verify: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
