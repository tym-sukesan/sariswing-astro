/**
 * G-20u39b2 Gosaki admin operational UI IA planning verifier.
 * Planning only — no network / build / FTP / implementation checks beyond docs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-admin-operational-ui-information-architecture-planning.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-admin-mobile-left-align-polish.md";
const PHASE =
  "G-20u39b2-gosaki-admin-operational-ui-information-architecture-planning";
const GATE = "gosakiAdminOperationalUiInformationArchitecturePlanned: true";
const PLANNING_HEAD = "0c27c16";
const RECOMMENDED_NEXT =
  "G-20u39b3-gosaki-admin-portal-and-content-routes-local-implementation";
const ALT_NEXT = "G-20u39c-gosaki-staging-public-mobile-visual-p1-review";

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

assert("planning doc exists", exists(DOC_REL));
assert("prior G-20u39b polish doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const cs = latestSection(currentState, "G-20u39b2");
const na = latestSection(nextActions, "G-20u39b2");
const ho = latestSection(handoff, "G-20u39b2");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("planning HEAD 0c27c16", doc.includes(PLANNING_HEAD));
assert(
  "ADMIN_OPERATIONAL_UI_IA_PLANNED true",
  /ADMIN_OPERATIONAL_UI_IA_PLANNED:\s*true/i.test(doc),
);
assert(
  "ADMIN_PORTAL_ROUTE_PLANNED true",
  /ADMIN_PORTAL_ROUTE_PLANNED:\s*true/i.test(doc),
);
assert(
  "INDIVIDUAL_CONTENT_ADMIN_ROUTES_PLANNED true",
  /INDIVIDUAL_CONTENT_ADMIN_ROUTES_PLANNED:\s*true/i.test(doc),
);
assert(
  "IMPLEMENTATION_EXECUTED false",
  /IMPLEMENTATION_EXECUTED:\s*false/i.test(doc),
);

assert("current admin structure", /Current admin structure|as-is/i.test(doc));
assert("STG monolith noted", /単一ページ|monolith|read-only admin/i.test(doc));
assert("local shell routes", /schedule\/|discography\/|youtube\/|about\//i.test(doc));
assert("contact missing on shell", /contact\/.*no|Contact.*no|Contact.*Missing/i.test(doc));

assert("feature maturity", /Feature maturity|Ready for individual/i.test(doc));
assert("route map", /Target route map|\/admin\/schedule\//i.test(doc));
assert("portal role", /Portal.*\/admin\/|portal \/ dashboard/i.test(doc));
assert("common navigation", /Common navigation|管理トップへ/i.test(doc));
assert("A B C classification", /Developer-facing|classify A \/ B \/ C|### A\./i.test(doc));
assert("retain safety chips", /テスト環境|閲覧のみ/i.test(doc));
assert("move to developer details", /開発者情報|siteSlug|phase ID/i.test(doc));
assert("remove FTP banner noise", /FTP手順|Remove from normal UI/i.test(doc));
assert("migration approach", /Migration approach|do not break/i.test(doc));
assert("implementation order", /Implementation order|G-20u39b3/i.test(doc));

assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert(`alternate ${ALT_NEXT}`, doc.includes(ALT_NEXT));

assert("no implementation", /implementationExecuted:\s*false/i.test(doc));
assert("no Save enable", /saveEnabled:\s*false/i.test(doc));
assert("no package", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP", /ftpUploadExecuted:\s*false/i.test(doc));
assert("no SQL DB Edge", /sqlExecuted:\s*false/i.test(doc) && /dbWriteExecuted:\s*false/i.test(doc));
assert("no src/pages/admin modify", /srcPagesAdminModified:\s*false/i.test(doc));
assert("service_role unused", /serviceRoleUsed:\s*false/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u39b2-gosaki-admin-operational-ui-information-architecture-planning",
  ),
);
assert(
  "package.json verifier file",
  packageJson.includes(
    "verify-g20u39b2-gosaki-admin-operational-ui-information-architecture-planning.mjs",
  ),
);

assert("prior P1-ADM-MOB1 resolved", /P1-ADM-MOB1:\s*resolved/i.test(priorDoc));

function assertAi(label, section) {
  assert(`${label} mentions G-20u39b2`, section.includes("G-20u39b2"));
  assert(
    `${label} gate`,
    /gosakiAdminOperationalUiInformationArchitecturePlanned:\s*true/i.test(section),
  );
  assert(
    `${label} ADMIN_OPERATIONAL_UI_IA_PLANNED`,
    /ADMIN_OPERATIONAL_UI_IA_PLANNED:\s*true/i.test(section),
  );
  assert(
    `${label} IMPLEMENTATION_EXECUTED false`,
    /IMPLEMENTATION_EXECUTED:\s*false/i.test(section),
  );
  assert(`${label} next G-20u39b3`, section.includes(RECOMMENDED_NEXT));
}

assertAi("00-current-state", cs);
assertAi("03-next-actions", na);
assertAi("handoff", ho);

assert(
  "handoff current phase G-20u39b2",
  /Current phase:.*G-20u39b2/i.test(handoff),
);

console.log(
  `\nverify-g20u39b2-gosaki-admin-operational-ui-information-architecture-planning: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
