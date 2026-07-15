/**
 * G-20u39a Gosaki staging P1 Contact HubSpot submit E2E planning verifier.
 * Planning / read-only only — no browser / HTTP / submit / HubSpot API.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-contact-hubspot-submit-e2e-planning.md";
const PRIOR_DOC_REL = "tools/static-to-astro/docs/gosaki-staging-p1-review-planning.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-contact-hubspot.json";
const PHASE = "G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning";
const GATE = "gosakiStagingP1ContactHubspotSubmitE2ePlanned: true";
const PRIOR_PHASE = "G-20u39-gosaki-staging-p1-review-planning";
const PLANNING_HEAD = "619f1ed";
const RECOMMENDED_NEXT =
  "G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight";
const EXEC_NEXT =
  "G-20u39a2-gosaki-staging-p1-contact-hubspot-submit-e2e-manual-execution";
const RESULT_NEXT =
  "G-20u39a3-gosaki-staging-p1-contact-hubspot-submit-e2e-result-record";
const ALT_NEXT = "G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish";
const WIX_URL = "https://www.gosaki-piano.com/";

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

function latestSection(aiText, marker) {
  const idx = aiText.indexOf(marker);
  return idx >= 0 ? aiText.slice(idx, idx + 2800) : "";
}

assert("planning doc exists", exists(DOC_REL));
assert("prior G-20u39 doc exists", exists(PRIOR_DOC_REL));
assert("hubspot config exists", exists(CONFIG_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const config = read(CONFIG_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const csG39a = latestSection(currentState, "G-20u39a");
const naG39a = latestSection(nextActions, "G-20u39a");
const hoG39a = latestSection(handoff, "G-20u39a");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "status planning read-only",
  /planning\s*\/\s*read-only|planning \/ read-only review only/i.test(doc),
);
assert(`prior ${PRIOR_PHASE}`, doc.includes(PRIOR_PHASE));
assert("planning HEAD 619f1ed", doc.includes(PLANNING_HEAD));
assert("origin/main 619f1ed", /origin\/main.*619f1ed|619f1ed.*origin\/main/i.test(doc));

assert("P1-CON1", doc.includes("P1-CON1"));
assert("P1 priority high", /P1-CON1[\s\S]{0,500}high/i.test(doc));

assert(
  "confirmed evidence separated",
  /Confirmed|confirmed/i.test(doc) && /Not yet verified|not verified/i.test(doc),
);
assert("form display PASS", /display.*PASS|PASS.*display/i.test(doc));
assert("submit not executed", /submit.*not executed|not executed|CONTACT_SUBMISSION_EXECUTED: false/i.test(doc));

assert(
  "CONTACT_HUBSPOT_SUBMIT_E2E_PLANNED true",
  /CONTACT_HUBSPOT_SUBMIT_E2E_PLANNED:\s*true/i.test(doc),
);
assert(
  "CONTACT_SUBMISSION_EXECUTED false",
  /CONTACT_SUBMISSION_EXECUTED:\s*false/i.test(doc),
);
assert(
  "CONTACT_E2E_STATUS PLANNED_NOT_EXECUTED",
  /CONTACT_E2E_STATUS:\s*PLANNED_NOT_EXECUTED|PLANNED_NOT_EXECUTED/i.test(doc),
);
assert(
  "CONTACT_E2E_PASSED false not failure",
  /CONTACT_E2E_PASSED:\s*false/i.test(doc) && /PLANNED_NOT_EXECUTED/i.test(doc),
);

assert("test data policy", /operator-controlled|Operator-controlled|no real client|個人情報/i.test(doc));
assert(
  "operator test email TBD",
  /TBD before execution|operator-controlled test address/i.test(doc),
);
assert("no third-party personal data", /third-party|第三者|後藤沙紀/i.test(doc));
assert("one-time manual submission", /one-time|1回|exactly once/i.test(doc));
assert("exact one click", /exactly once|1回だけ|click exactly once/i.test(doc));
assert("no automation", /No Playwright|no automation|自動クリック禁止/i.test(doc));
assert(
  "ambiguity no retry",
  /ambiguous|曖昧/i.test(doc) && /no retry|Do not submit again|再送/i.test(doc),
);

assert("browser success criteria", /Browser success|browser success/i.test(doc));
assert(
  "browser success TBD or preflight",
  /TBD in G-20u39a1|preflight/i.test(doc),
);
assert("HubSpot success criteria", /HubSpot success/i.test(doc));
assert(
  "exactly one submission",
  /Exactly one submission|exactly one/i.test(doc),
);
assert("duplicate prevention section", /Duplicate submission|duplicate/i.test(doc));
assert("cleanup options", /Option A|Option B|Retain record|Delete test/i.test(doc));
assert("operator input required", /Operator input required/i.test(doc));
assert("STOP conditions", /STOP conditions|Stop immediately/i.test(doc));

assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert(`execution candidate ${EXEC_NEXT}`, doc.includes(EXEC_NEXT));
assert(`result record candidate ${RESULT_NEXT}`, doc.includes(RESULT_NEXT));
assert(`alternate ${ALT_NEXT}`, doc.includes(ALT_NEXT));

assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL/i.test(doc),
);
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false/i.test(doc),
);
assert("HOSTING_READY false", /HOSTING_READY:\s*false/i.test(doc));
assert("GO_LIVE_READY false", /GO_LIVE_READY:\s*false/i.test(doc));
assert(
  "production FTP paused",
  /productionFtpPreparation:\s*paused|FTP preparation.*paused/i.test(doc),
);
assert(
  "hosting not contracted",
  /not_contracted|not contracted/i.test(doc),
);

assert("no implementation", /Implementation changes.*no|implementationExecuted:\s*false/i.test(doc));
assert("no browser", /browserExecuted:\s*false|Browser launch.*no/i.test(doc));
assert("no form input", /formInputExecuted:\s*false|Form input.*no/i.test(doc));
assert(
  "no submission",
  /contactSubmissionExecuted:\s*false|Contact submission.*no/i.test(doc),
);
assert("no HTTP", /httpSubmissionExecuted:\s*false|HTTP request.*no/i.test(doc));
assert(
  "no package",
  /packageGenerationExecuted:\s*false|Package generation.*no/i.test(doc),
);
assert("no FTP", /ftpUploadExecuted:\s*false|FTP.*no/i.test(doc));
assert(
  "no SQL DB Save Edge",
  doc.includes("sqlExecuted: false") &&
    doc.includes("dbWriteExecuted: false") &&
    doc.includes("saveExecuted: false") &&
    doc.includes("edgeDeployExecuted: false"),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);

assert("Wix production URL documented", doc.includes(WIX_URL));
assert(
  "staging not Wix submit rule",
  /not.*Wix|Wix production form/i.test(doc),
);

assert("config portalId", config.includes('"portalId": "21392032"'));
assert("config formId", config.includes('"formId": "57909d0c-9b9f-470a-8a18-e176d1d1a459"'));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning",
  ),
);
assert(
  "package.json verifier file",
  packageJson.includes(
    "verify-g20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning.mjs",
  ),
);

function assertAiG39a(label, section) {
  assert(`${label} mentions G-20u39a`, section.includes("G-20u39a"));
  assert(
    `${label} gate`,
    /gosakiStagingP1ContactHubspotSubmitE2ePlanned:\s*true/i.test(section),
  );
  assert(
    `${label} CONTACT_HUBSPOT_SUBMIT_E2E_PLANNED`,
    /CONTACT_HUBSPOT_SUBMIT_E2E_PLANNED:\s*true/i.test(section),
  );
  assert(
    `${label} CONTACT_SUBMISSION_EXECUTED false`,
    /CONTACT_SUBMISSION_EXECUTED:\s*false/i.test(section),
  );
  assert(
    `${label} CONTACT_E2E_STATUS`,
    /CONTACT_E2E_STATUS:\s*PLANNED_NOT_EXECUTED|PLANNED_NOT_EXECUTED/i.test(section),
  );
  assert(
    `${label} recommended G-20u39a1`,
    /G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight/i.test(section),
  );
  assert(
    `${label} PUBLIC_READY CONDITIONAL`,
    /PUBLIC_READY:\s*CONDITIONAL/i.test(section),
  );
  assert(
    `${label} PRODUCTION_UPLOAD_READY false`,
    /PRODUCTION_UPLOAD_READY:\s*false/i.test(section),
  );
  assert(`${label} HOSTING_READY false`, /HOSTING_READY:\s*false/i.test(section));
  assert(`${label} GO_LIVE_READY false`, /GO_LIVE_READY:\s*false/i.test(section));
}

assertAiG39a("00-current-state", csG39a);
assertAiG39a("03-next-actions", naG39a);
assertAiG39a("handoff", hoG39a);

assert(
  "00-current-state G-20u39a before G-20u39",
  currentState.indexOf("G-20u39a") < currentState.indexOf("G-20u39-gosaki-staging-p1-review"),
);

assert(
  "handoff current phase G-20u39a",
  /Current phase:.*G-20u39a/i.test(handoff),
);

assert("prior G-20u39 gate", priorDoc.includes("gosakiStagingP1ReviewPlanned: true"));

assert(
  "no CONTACT_E2E_PASSED true in gates",
  !/CONTACT_E2E_PASSED:\s*true/i.test(
    doc.slice(doc.indexOf("## Gates"), doc.indexOf("## 1. Current evidence") + 1),
  ),
);

console.log(
  `\nverify-g20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
