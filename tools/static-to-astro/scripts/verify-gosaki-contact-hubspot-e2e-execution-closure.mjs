/**
 * G-20s2b — Gosaki Contact HubSpot E2E execution closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-contact-hubspot-e2e-execution-closure.mjs
 *
 * Doc + optional GET only. Does NOT submit forms.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-contact-hubspot-e2e-execution-closure.md";
const PRIOR_REL = "tools/static-to-astro/docs/gosaki-contact-hubspot-e2e-verify.md";
const CONTACT_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/";
const BASE_COMMIT = "eff47a5";
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
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("HEAD is eff47a5", head === BASE_COMMIT, `HEAD=${head}`);
assert("origin/main is eff47a5", origin === BASE_COMMIT, `origin=${origin}`);

assert("closure doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("G-20s2 prior doc exists", fs.existsSync(path.join(REPO_ROOT, PRIOR_REL)));

assert("phase G-20s2b", /G-20s2b-gosaki-contact-hubspot-e2e-execution-closure/i.test(doc));
assert(
  "closure gate complete",
  /gosakiContactHubspotE2eExecutionClosureComplete: true/i.test(doc),
);
assert("operator submit executed", /operatorManualSubmitExecuted: true/i.test(doc));
assert("cursor submit not executed", /cursorFormSubmitExecuted: false/i.test(doc));
assert("on-page success confirmed", /onPageSuccessConfirmed: true/i.test(doc));
assert("notification received", /hubspotNotificationReceived: true/i.test(doc));
assert("P0-C1 resolved", /p0C1ContactHubspotE2e: RESOLVED/i.test(doc));
assert("client preview ready with notes", /clientPreviewVerdict: READY_WITH_NOTES/i.test(doc));
assert("p0 blockers zero", /p0ClientPreviewBlockers: 0/i.test(doc));
assert("ready for client preview share", /readyForGosakiStagingClientPreviewShare: true/i.test(doc));
assert("spam note documented", /hubspotSpamClassificationObserved: true/i.test(doc));
assert("branding note documented", /hubspotFreeFormBrandingVisible: true/i.test(doc));
assert("spam not p0 blocker", /spamOrBrandingBlocksClientPreview: false/i.test(doc));
assert("success message JP", /ありがとうございました/.test(doc));
assert("no personal email in doc", !/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(doc));

assert("00-current-state mentions G-20s2b", /G-20s2b|execution-closure/i.test(currentState));
assert("03-next-actions mentions G-20s2b", /G-20s2b|READY_WITH_NOTES|client preview/i.test(nextActions));
assert("handoff mentions G-20s2b", /G-20s2b|READY_WITH_NOTES/i.test(handoff));

const res = await fetch(CONTACT_URL);
const html = await res.text();
assert("contact GET 200", res.status === 200, `status=${res.status}`);
assert("contact hubspot embed", html.includes("hs-form-frame") && /hubspot|hsforms/i.test(html));
assert("contact portal id", html.includes(PORTAL_ID));

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
  `\nG-20s2b Gosaki Contact HubSpot E2E execution closure verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
