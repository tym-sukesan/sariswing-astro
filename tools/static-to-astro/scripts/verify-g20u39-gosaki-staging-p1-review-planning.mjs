/**
 * G-20u39 Gosaki staging P1 review planning verifier.
 * Planning / review only — no build / FTP / browser / submit.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-p1-review-planning.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-hosting-not-ready-and-return-to-staging-p1-record.md";
const PHASE = "G-20u39-gosaki-staging-p1-review-planning";
const GATE = "gosakiStagingP1ReviewPlanned: true";
const PLANNING_HEAD = "5957d8d";
const RECOMMENDED_NEXT =
  "G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning";
const ALT_NEXT = "G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish";
const WIX_URL = "https://www.gosaki-piano.com/";
const OLD_G38C_NEXT =
  "G-20u38d-gosaki-production-ftp-remote-path-confirmation-and-upload-checklist";

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

/** Latest G-20u39 section in AI file (before older phases). */
function latestG39Section(aiText) {
  const idx = aiText.indexOf("G-20u39");
  return idx >= 0 ? aiText.slice(idx, idx + 2500) : "";
}

assert("planning doc exists", exists(DOC_REL));
assert("prior G-20u38d doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const csG39 = latestG39Section(currentState);
const naG39 = latestG39Section(nextActions);
const hoG39 = latestG39Section(handoff);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "status planning review only",
  /planning\s*\/\s*review only|planning \/ review only/i.test(doc),
);
assert("planning HEAD 5957d8d", doc.includes(PLANNING_HEAD));
assert("origin/main 5957d8d", /origin\/main.*5957d8d|5957d8d.*origin\/main/i.test(doc));

assert(
  "current live production Wix",
  /current live production.*Wix|current live production:\s*wix/i.test(doc),
);
assert("production URL", doc.includes(WIX_URL));
assert(
  "replacement hosting not contracted",
  /replacement hosting.*not contracted|not_contracted/i.test(doc),
);
assert(
  "production FTP remote path not available",
  /remote path.*not available|not_available/i.test(doc),
);
assert(
  "FTP prep paused",
  /FTP preparation.*paused|productionFtpPreparation:\s*paused/i.test(doc),
);
assert(
  "staging P0 blockers false",
  /staging P0 blockers.*false|stagingP0Blockers:\s*false/i.test(doc),
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
assert(
  "STAGING_P1_REVIEW_PLANNED true",
  /STAGING_P1_REVIEW_PLANNED:\s*true/i.test(doc),
);

assert("P1-CON1 exists", doc.includes("P1-CON1"));
assert("P1-CON1 priority high", /P1-CON1[\s\S]{0,400}high/i.test(doc));
assert("P1-ADM-MOB1 exists", doc.includes("P1-ADM-MOB1"));

assert(
  "confirmed active P1 classified",
  /Confirmed active P1/i.test(doc) && doc.includes("P1-CON1") && doc.includes("P1-ADM-MOB1"),
);
assert(
  "review candidate classified",
  /Review candidate/i.test(doc),
);
assert(
  "supporting readiness work classified",
  /Supporting readiness work/i.test(doc),
);
assert(
  "hosting checklist not staging defect",
  /not a staging defect|Not a staging defect/i.test(doc),
);

assert(
  "Contact submission forbidden this phase",
  /Contact form actual submission.*no|no submission|実送信しない|no submit/i.test(doc),
);
assert(
  "CSS modification forbidden",
  /CSS.*no|no CSS|CSS modification.*no/i.test(doc),
);
assert(
  "package generation forbidden",
  /Package generation.*no|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "FTP upload forbidden",
  /FTP.*no|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "SQL DB write Save Edge forbidden",
  doc.includes("sqlExecuted: false") &&
    doc.includes("dbWriteExecuted: false") &&
    doc.includes("saveExecuted: false") &&
    doc.includes("edgeDeployExecuted: false"),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);

assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert(`alternate next ${ALT_NEXT}`, doc.includes(ALT_NEXT));

assert(
  "backlog table columns",
  doc.includes("Exit criteria") &&
    doc.includes("Allowed in next slice") &&
    doc.includes("Forbidden in next slice"),
);

assert(
  "G-20u38d historical TBD note without current path",
  doc.includes("TBD_G-20i") && /not available|supersedes/i.test(doc),
);
assert(
  "current remote path not TBD_G-20i in gates",
  !/productionFtpRemotePath:\s*TBD_G-20i/i.test(doc),
);
assert(
  "stale package not uploadable",
  /stale|not upload-ready|do not use/i.test(doc),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u39-gosaki-staging-p1-review-planning"),
);
assert(
  "package.json points to verifier file",
  packageJson.includes("verify-g20u39-gosaki-staging-p1-review-planning.mjs"),
);

function assertAiG39(label, section, fullText) {
  assert(`${label} mentions G-20u39`, section.includes("G-20u39"));
  assert(
    `${label} gate gosakiStagingP1ReviewPlanned`,
    /gosakiStagingP1ReviewPlanned:\s*true/i.test(section),
  );
  assert(
    `${label} recommended G-20u39a`,
    /G-20u39a-gosaki-staging-p1-contact-hubspot-submit-e2e-planning/i.test(section),
  );
  assert(
    `${label} FTP prep paused`,
    /FTP prep.*paused|production FTP.*paused|FTP preparation.*paused/i.test(section),
  );
  assert(
    `${label} hosting not contracted`,
    /not contracted/i.test(section),
  );
  assert(
    `${label} PRODUCTION_UPLOAD_READY false`,
    /PRODUCTION_UPLOAD_READY:\s*false/i.test(section),
  );
  assert(
    `${label} HOSTING_READY false`,
    /HOSTING_READY:\s*false/i.test(section),
  );
  assert(
    `${label} GO_LIVE_READY false`,
    /GO_LIVE_READY:\s*false/i.test(section),
  );
  assert(
    `${label} PUBLIC_READY CONDITIONAL`,
    /PUBLIC_READY:\s*CONDITIONAL/i.test(section),
  );
  assert(
    `${label} current remote not TBD as active`,
    !/production FTP remote path.*TBD_G-20i/i.test(section),
  );
}

assertAiG39("00-current-state", csG39, currentState);
assertAiG39("03-next-actions", naG39, nextActions);
assertAiG39("handoff", hoG39, handoff);

assert(
  "00-current-state G-20u39 before G-20u38d at top",
  currentState.indexOf("G-20u39") < currentState.indexOf("G-20u38d-gosaki-production-hosting"),
);

assert(
  "handoff current phase G-20u39",
  /Current phase:.*G-20u39/i.test(handoff),
);

assert(
  "03-next-actions does not revive G-20u38c FTP next as current",
  !naG39.includes(OLD_G38C_NEXT),
);

assert(
  "handoff does not revive G-20u38c FTP next as current",
  !hoG39.includes(OLD_G38C_NEXT),
);

assert(
  "no hosting contracted in doc gates",
  !/HOSTING_READY:\s*true/i.test(doc) && !/hostingReady:\s*true/i.test(doc),
);
assert(
  "no go live ready true",
  !/GO_LIVE_READY:\s*true/i.test(doc),
);
assert(
  "no production upload ready true in gates block",
  !/PRODUCTION_UPLOAD_READY:\s*true/i.test(
    doc.slice(doc.indexOf("## Gates"), doc.indexOf("## 1. Current state") + 1),
  ),
);

assert("prior G-20u38d gate preserved", priorDoc.includes("gosakiProductionHostingNotReadyAndReturnToStagingP1Recorded: true"));

console.log(
  `\nverify-g20u39-gosaki-staging-p1-review-planning: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
