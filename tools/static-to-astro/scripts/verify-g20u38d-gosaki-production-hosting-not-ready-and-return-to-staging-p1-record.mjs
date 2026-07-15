/**
 * G-20u38d Gosaki production hosting not ready and return to staging P1 record verifier.
 * Status correction only — no package build / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-hosting-not-ready-and-return-to-staging-p1-record.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-package-verification-review.md";
const PHASE =
  "G-20u38d-gosaki-production-hosting-not-ready-and-return-to-staging-p1-record";
const GATE = "gosakiProductionHostingNotReadyAndReturnToStagingP1Recorded: true";
const RECORD_HEAD = "76b1d94";
const RECOMMENDED_NEXT = "G-20u39-gosaki-staging-p1-review-planning";
const ALT_NEXT = "G-20u39-gosaki-staging-p1-contact-hubspot-submit-e2e";
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

assert("status correction doc exists", exists(DOC_REL));
assert("prior G-20u38c doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("record HEAD 76b1d94", doc.includes(RECORD_HEAD));
assert(
  "current operational production Wix",
  /currentOperationalProduction:\s*wix|current operational production.*Wix/i.test(doc),
);
assert("Wix URL documented", doc.includes(WIX_URL));
assert(
  "replacement hosting not contracted",
  /not_contracted|not contracted|Not contracted/i.test(doc),
);
assert(
  "production FTP remote path not available",
  /not_available|not available|Not available/i.test(doc),
);
assert(
  "remote path confirmation blocked",
  /remotePathConfirmation:\s*blocked|Remote path confirmation.*blocked/i.test(doc),
);
assert(
  "FTP upload blocked",
  /ftpUpload:\s*blocked|FTP upload.*blocked/i.test(doc),
);
assert(
  "production FTP preparation paused",
  /productionFtpPreparation:\s*paused|Production FTP preparation.*paused/i.test(doc),
);
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false|productionUploadReady:\s*false/i.test(doc),
);
assert(
  "HOSTING_READY false",
  /HOSTING_READY:\s*false|hostingReady:\s*false/i.test(doc),
);
assert(
  "GO_LIVE_READY false",
  /GO_LIVE_READY:\s*false|goLiveReady:\s*false/i.test(doc),
);
assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL|publicReady:\s*conditional/i.test(doc),
);
assert(
  "three meanings of production",
  /three meanings|Production profile.*future|Actual live production|Future replacement hosting/i.test(
    doc,
  ),
);
assert(
  "G-20u38b2 local validity not upload permission",
  /not upload-ready|not upload permission|Permission to upload.*no/i.test(doc),
);
assert(
  "stale package do not use",
  /stale|do not use/i.test(doc),
);
assert(
  "remote path must not be requested yet",
  /must not be requested|do not request|must not guess/i.test(doc),
);
assert(
  "FileZilla paused",
  /FileZilla.*paused|do not proceed/i.test(doc),
);
assert(
  "return to staging P1",
  /return to staging P1|staging P1/i.test(doc),
);
assert("Contact HubSpot E2E candidate", /Contact HubSpot|HubSpot submit E2E/i.test(doc));
assert("Admin mobile P1 candidate", /Admin mobile|P1-ADM-MOB1/i.test(doc));
assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert(`alternate next ${ALT_NEXT}`, doc.includes(ALT_NEXT));
assert(
  "G-20u38e-g paused",
  doc.includes("G-20u38e") && doc.includes("G-20u38f") && /paused/i.test(doc),
);
assert(
  "STOP hosting not contracted",
  /hosting not contracted|Replacement hosting not contracted/i.test(doc),
);
assert(
  "STOP Wix change",
  /Wix|wix production change/i.test(doc) && /STOP/i.test(doc),
);
assert(
  "no package generation",
  /Package regeneration.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);

assert(
  "prior G-20u38c gate",
  priorDoc.includes("gosakiProductionPackageVerificationReviewed: true"),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u38d-gosaki-production-hosting-not-ready-and-return-to-staging-p1-record",
  ),
);
assert(
  "00-current-state Wix production",
  /Wix|wix/i.test(currentState) &&
    (currentState.includes("G-20u38d") || currentState.includes(PHASE)),
);
assert(
  "00-current-state hosting not contracted",
  /not contracted|hosting not/i.test(currentState),
);
assert(
  "00-current-state production upload blocked",
  /PRODUCTION_UPLOAD_READY:\s*false|upload.*blocked|upload is blocked/i.test(currentState),
);
assert(
  "00-current-state staging P1 next",
  /staging P1|G-20u39/i.test(currentState),
);
assert(
  "03-next-actions mentions G-20u38d",
  nextActions.includes("G-20u38d") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u38d",
  handoff.includes("G-20u38d") || handoff.includes(PHASE),
);
assert(
  "handoff Wix and hosting blocked",
  /Wix/i.test(handoff) && /not contracted|hosting/i.test(handoff),
);

console.log(
  `\nverify-g20u38d-gosaki-production-hosting-not-ready-and-return-to-staging-p1-record: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
