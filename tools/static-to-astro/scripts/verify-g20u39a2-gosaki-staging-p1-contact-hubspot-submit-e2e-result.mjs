/**
 * G-20u39a2 Gosaki staging P1 Contact HubSpot submit E2E result verifier.
 * Result record only — no network / browser / submit / HubSpot API.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-contact-hubspot-submit-e2e-result.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-contact-hubspot-submit-e2e-preflight.md";
const PHASE = "G-20u39a2-gosaki-staging-p1-contact-hubspot-submit-e2e-result-record";
const GATE = "gosakiStagingP1ContactHubspotSubmitE2ePassed: true";
const PRIOR_PHASE = "G-20u39a1-gosaki-staging-p1-contact-hubspot-submit-e2e-preflight";
const RESULT_HEAD = "3ee1504";
const STG_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/";
const PORTAL_ID = "21392032";
const FORM_ID = "57909d0c-9b9f-470a-8a18-e176d1d1a459";
const RECOMMENDED_NEXT = "G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish";
const SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";

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
  return idx >= 0 ? aiText.slice(idx, idx + 3500) : "";
}

assert("result doc exists", exists(DOC_REL));
assert("prior G-20u39a1 preflight doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const csG39a2 = latestSection(currentState, "G-20u39a2");
const naG39a2 = latestSection(nextActions, "G-20u39a2");
const hoG39a2 = latestSection(handoff, "G-20u39a2");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(`prior ${PRIOR_PHASE}`, doc.includes(PRIOR_PHASE));
assert(`result record HEAD ${RESULT_HEAD}`, doc.includes(RESULT_HEAD));
assert("target STG URL", doc.includes(STG_URL));
assert("portalId", doc.includes(PORTAL_ID));
assert("formId", doc.includes(FORM_ID));
assert("artifact sourceCommit e3616a3", doc.includes(SOURCE_COMMIT));

assert(
  "operator manual submit executed",
  /operatorManualSubmitExecuted:\s*true|Operator manual submit.*executed/i.test(doc),
);
assert(
  "cursor form submit not executed",
  /cursorFormSubmitExecuted:\s*false|Cursor.*did not/i.test(doc),
);
assert(
  "submit count once",
  /submitCount:\s*1|once/i.test(doc),
);

assert(
  "CONTACT_SUBMISSION_EXECUTED true",
  /CONTACT_SUBMISSION_EXECUTED:\s*true/i.test(doc),
);
assert(
  "HUBSPOT_SUBMISSION_RECEIVED true",
  /HUBSPOT_SUBMISSION_RECEIVED:\s*true/i.test(doc),
);
assert(
  "CONTACT_E2E_PASSED true",
  /CONTACT_E2E_PASSED:\s*true/i.test(doc),
);
assert(
  "CONTACT_E2E_STATUS PASS",
  /CONTACT_E2E_STATUS:\s*PASS/i.test(doc),
);
assert(
  "P1-CON1 resolved",
  /P1-CON1:\s*resolved|P1-CON1.*resolved/i.test(doc),
);

assert(
  "test email not recorded",
  /not recorded in repository|repo 非記載|not recorded/i.test(doc),
);
assert(
  "message body not recorded",
  /Message body.*not recorded|payload PII.*not recorded/i.test(doc),
);
assert(
  "no workflow investigation scope",
  /workflow|auto reply|notification/i.test(doc) && /out of scope|not investigated/i.test(doc),
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

assert("no implementation", /implementationExecuted:\s*false/i.test(doc));
assert(
  "no browser investigation",
  /browserInvestigationExecuted:\s*false|Browser investigation.*no/i.test(doc),
);
assert("no HubSpot API", /hubspotApiExecuted:\s*false/i.test(doc));
assert(
  "no HubSpot record deletion",
  /hubspotRecordDeletionExecuted:\s*false|HubSpot record deletion.*no/i.test(doc),
);
assert("no CSS modification", /cssModificationExecuted:\s*false/i.test(doc));
assert("no build", /buildExecuted:\s*false/i.test(doc));
assert("no package", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP", /ftpUploadExecuted:\s*false/i.test(doc));
assert("no production change", /productionChanged:\s*false/i.test(doc));
assert("no Wix change", /wixProductionChanged:\s*false/i.test(doc));
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

assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert(
  "no further preflight required",
  /no further.*preflight|Contact E2E track.*closed/i.test(doc),
);

assert(
  "prior preflight gate",
  priorDoc.includes("gosakiStagingP1ContactHubspotSubmitE2ePreflightPrepared: true"),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u39a2-gosaki-staging-p1-contact-hubspot-submit-e2e-result",
  ),
);
assert(
  "package.json verifier file",
  packageJson.includes(
    "verify-g20u39a2-gosaki-staging-p1-contact-hubspot-submit-e2e-result.mjs",
  ),
);

function assertAiG39a2(label, section) {
  assert(`${label} mentions G-20u39a2`, section.includes("G-20u39a2"));
  assert(
    `${label} gate`,
    /gosakiStagingP1ContactHubspotSubmitE2ePassed:\s*true/i.test(section),
  );
  assert(
    `${label} CONTACT_SUBMISSION_EXECUTED true`,
    /CONTACT_SUBMISSION_EXECUTED:\s*true/i.test(section),
  );
  assert(
    `${label} CONTACT_E2E_PASSED true`,
    /CONTACT_E2E_PASSED:\s*true/i.test(section),
  );
  assert(
    `${label} CONTACT_E2E_STATUS PASS`,
    /CONTACT_E2E_STATUS:\s*PASS/i.test(section),
  );
  assert(
    `${label} P1-CON1 resolved`,
    /P1-CON1.*resolved|P1-CON1:\s*resolved/i.test(section),
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
  assert(`${label} next G-20u39b`, section.includes(RECOMMENDED_NEXT));
}

assertAiG39a2("00-current-state", csG39a2);
assertAiG39a2("03-next-actions", naG39a2);
assertAiG39a2("handoff", hoG39a2);

assert(
  "handoff current phase G-20u39a2",
  /Current phase:.*G-20u39a2/i.test(handoff),
);

console.log(
  `\nverify-g20u39a2-gosaki-staging-p1-contact-hubspot-submit-e2e-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
