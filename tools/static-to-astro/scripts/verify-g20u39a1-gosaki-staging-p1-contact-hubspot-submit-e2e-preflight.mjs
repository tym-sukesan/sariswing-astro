/**
 * G-20u39a1 Gosaki staging P1 Contact HubSpot submit E2E preflight verifier.
 * Read-only — no network / browser / submit / HubSpot API.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-contact-hubspot-submit-e2e-preflight.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-contact-hubspot-submit-e2e-planning.md";
const HIST_DOC_REL = "tools/static-to-astro/docs/gosaki-contact-hubspot-e2e-execution-closure.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-contact-hubspot.json";
const PHASE = "G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight";
const GATE = "gosakiStagingP1ContactHubspotSubmitE2ePreflightPrepared: true";
const PRIOR_PHASE = "G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning";
const PREFLIGHT_HEAD = "27be4f6";
const PORTAL_ID = "21392032";
const FORM_ID = "57909d0c-9b9f-470a-8a18-e176d1d1a459";
const REGION = "na1";
const STG_PATH = "/cms-kit-staging/gosaki-piano/contact/";
const STG_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/";
const WIX_URL = "https://www.gosaki-piano.com/";
const RECOMMENDED_NEXT =
  "G-20u39a1b-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight-gap-resolution";
const ALT_NEXT = "G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish";
const EMAIL_PLACEHOLDER = "OPERATOR_CONTROLLED_TEST_EMAIL";

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
  return idx >= 0 ? aiText.slice(idx, idx + 3000) : "";
}

assert("preflight doc exists", exists(DOC_REL));
assert("prior G-20u39a doc exists", exists(PRIOR_DOC_REL));
assert("historical G-20s2b doc exists", exists(HIST_DOC_REL));
assert("hubspot config exists", exists(CONFIG_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const histDoc = read(HIST_DOC_REL);
const config = read(CONFIG_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const csG39a1 = latestSection(currentState, "G-20u39a1");
const naG39a1 = latestSection(nextActions, "G-20u39a1");
const hoG39a1 = latestSection(handoff, "G-20u39a1");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "status read-only preflight",
  /read-only preflight/i.test(doc),
);
assert(`prior ${PRIOR_PHASE}`, doc.includes(PRIOR_PHASE));
assert("preflight HEAD 27be4f6", doc.includes(PREFLIGHT_HEAD));

assert(
  "historical G-20s2b vs current package distinction",
  /Historical G-20s2b|G-20s2b[\s\S]{0,200}older/i.test(doc) &&
    /Current STG package E2E[\s\S]{0,80}not executed/i.test(doc),
);
assert(
  "historical does not prove current",
  /does not prove/i.test(doc),
);

assert("target environment staging", /Target environment.*Staging|staging/i.test(doc));
assert("Wix production not target", /NOT a test target|not.*Wix|Wix production Contact/i.test(doc));
assert("expected STG path", doc.includes(STG_PATH));
assert("target STG URL", doc.includes(STG_URL));
assert("portalId", doc.includes(PORTAL_ID));
assert("formId", doc.includes(FORM_ID));
assert("region na1", doc.includes(REGION));
assert("container gosaki-contact-hubspot-embed", doc.includes("gosaki-contact-hubspot-embed"));
assert("hs-form-frame", doc.includes("hs-form-frame"));

assert("field inventory table", /Field inventory|Form field inventory/i.test(doc));
assert(
  "required optional unknown",
  /required/i.test(doc) && /optional/i.test(doc) && /unknown/i.test(doc),
);

assert("consent CAPTCHA privacy", /Consent|CAPTCHA|privacy/i.test(doc));
assert("locked payload", /Locked test payload|locked payload/i.test(doc));
assert("operator email placeholder", doc.includes(EMAIL_PLACEHOLDER));
assert(
  "no third-party personal data",
  /third-party|後藤沙紀/i.test(doc),
);

assert("browser success criteria", /Browser success/i.test(doc));
assert("HubSpot success criteria", /HubSpot-side success|HubSpot success/i.test(doc));
assert(
  "exactly one submission",
  /Exactly one submission|exactly one/i.test(doc),
);
assert("duplicate prevention", /Duplicate submission/i.test(doc));
assert("one manual click", /exactly once|1回だけ|one.*click/i.test(doc));
assert(
  "no retry ambiguity",
  /ambiguous/i.test(doc) && /no retry|Do not submit again|再送/i.test(doc),
);

assert("operator input lock", /Operator input lock/i.test(doc));
assert("execution checklist", /execution checklist|G-20u39a2 execution/i.test(doc));
assert("STOP conditions", /STOP conditions|Stop immediately/i.test(doc));

assert(
  "CONTACT_HUBSPOT_SUBMIT_E2E_PREFLIGHT_PREPARED true",
  /CONTACT_HUBSPOT_SUBMIT_E2E_PREFLIGHT_PREPARED:\s*true/i.test(doc),
);
assert(
  "CONTACT_SUBMISSION_EXECUTED false",
  /CONTACT_SUBMISSION_EXECUTED:\s*false/i.test(doc),
);
assert(
  "CONTACT_E2E_STATUS PREFLIGHT_ONLY",
  /CONTACT_E2E_STATUS:\s*PREFLIGHT_ONLY_NOT_EXECUTED|PREFLIGHT_ONLY_NOT_EXECUTED/i.test(
    doc,
  ),
);
assert(
  "CONTACT_E2E_EXECUTION_READY false",
  /CONTACT_E2E_EXECUTION_READY:\s*false/i.test(doc),
);
assert(
  "execution readiness blockers documented",
  /EXECUTION_READY:\s*false|Unresolved blockers/i.test(doc) &&
    /CAPTCHA/i.test(doc) &&
    /HubSpot確認/i.test(doc),
);
assert(
  "browser form interaction false",
  /browserFormInteractionExecuted:\s*false|Form input.*no|formInputExecuted:\s*false/i.test(
    doc,
  ),
);

assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert(`alternate ${ALT_NEXT}`, doc.includes(ALT_NEXT));

assert("no form input", /formInputExecuted:\s*false|Form input.*no/i.test(doc));
assert("no submission", /contactSubmissionExecuted:\s*false|Contact submission.*no/i.test(doc));
assert("no HTTP POST", /httpPostExecuted:\s*false|HTTP POST.*no/i.test(doc));
assert("no HubSpot API", /hubspotApiExecuted:\s*false|HubSpot API.*no/i.test(doc));
assert("no implementation", /implementationExecuted:\s*false/i.test(doc));
assert("no build", /buildExecuted:\s*false/i.test(doc));
assert("no package", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP", /ftpUploadExecuted:\s*false/i.test(doc));
assert(
  "no SQL DB Save Edge",
  doc.includes("sqlExecuted: false") &&
    doc.includes("dbWriteExecuted: false") &&
    doc.includes("saveExecuted: false") &&
    doc.includes("edgeDeployExecuted: false"),
);
assert(
  "service_role unused",
  /serviceRoleUsed:\s*false|service_role.*not used/i.test(doc),
);

assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL/i.test(doc),
);
assert("HOSTING_READY false", /HOSTING_READY:\s*false/i.test(doc));
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false/i.test(doc),
);
assert("GO_LIVE_READY false", /GO_LIVE_READY:\s*false/i.test(doc));

assert("config portalId match", config.includes(`"portalId": "${PORTAL_ID}"`));
assert("config formId match", config.includes(`"formId": "${FORM_ID}"`));
assert("config region match", config.includes(`"region": "${REGION}"`));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight",
  ),
);
assert(
  "package.json verifier file",
  packageJson.includes(
    "verify-g20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight.mjs",
  ),
);

function assertAiG39a1(label, section) {
  assert(`${label} mentions G-20u39a1`, section.includes("G-20u39a1"));
  assert(
    `${label} gate`,
    /gosakiStagingP1ContactHubspotSubmitE2ePreflightPrepared:\s*true/i.test(section),
  );
  assert(
    `${label} CONTACT_SUBMISSION_EXECUTED false`,
    /CONTACT_SUBMISSION_EXECUTED:\s*false/i.test(section),
  );
  assert(
    `${label} CONTACT_E2E_STATUS`,
    /CONTACT_E2E_STATUS:\s*PREFLIGHT_ONLY_NOT_EXECUTED|PREFLIGHT_ONLY_NOT_EXECUTED/i.test(
      section,
    ),
  );
  assert(
    `${label} CONTACT_E2E_EXECUTION_READY false`,
    /CONTACT_E2E_EXECUTION_READY:\s*false/i.test(section),
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

assertAiG39a1("00-current-state", csG39a1);
assertAiG39a1("03-next-actions", naG39a1);
assertAiG39a1("handoff", hoG39a1);

assert(
  "00-current-state G-20u39a1 before G-20u39a planning",
  currentState.indexOf("G-20u39a1") < currentState.indexOf("G-20u39a-gosaki-staging-p1-contact"),
);

assert(
  "handoff current phase G-20u39a1",
  /Current phase:.*G-20u39a1/i.test(handoff),
);

assert("prior G-20u39a gate", priorDoc.includes("gosakiStagingP1ContactHubspotSubmitE2ePlanned: true"));
assert("historical G-20s2b phase", histDoc.includes("G-20s2b-gosaki-contact-hubspot-e2e-execution-closure"));

assert(
  "doc does not claim current E2E passed",
  !/CONTACT_E2E_PASSED:\s*true/i.test(
    doc.slice(doc.indexOf("## Gates"), doc.indexOf("## 1. Historical") + 1),
  ),
);

assert("Wix URL documented", doc.includes(WIX_URL));

console.log(
  `\nverify-g20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
