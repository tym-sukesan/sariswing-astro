/**
 * G-20u37 Gosaki public-readiness QA planning verifier.
 * Planning only — no implementation / Save / SQL / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-public-readiness-qa-planning.md";
const SLICE_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-slice-complete.md";
const PHASE = "G-20u37-gosaki-public-readiness-qa-planning";
const GATE = "gosakiPublicReadinessQaPlanned: true";
const NEXT_A = "G-20u37a-gosaki-public-readiness-static-inspection";
const NEXT_B = "G-20u37b-gosaki-public-readiness-manual-browser-qa";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const STG_BASE = "/cms-kit-staging/gosaki-piano";
const MARKER_TITLE = "On a Clear Day [CMS Kit staging G-20u36e]";
const SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const LATEST_COMMIT = "d1e6652";

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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

assert("planning doc exists", exists(DOC_REL));
assert("G-20u36f slice complete doc exists", exists(SLICE_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "PUBLIC_READY NO",
  /PUBLIC_READY:\s*NO|publicReady:\s*false/i.test(doc),
);
assert(
  "STAGING_QA_READY YES",
  /STAGING_QA_READY:\s*YES|stagingQaReady:\s*true/i.test(doc),
);
assert(
  "no implementation",
  /Implementation.*\*\*no\*\*|implementationExecuted:\s*false/i.test(doc),
);
assert(
  "no Save",
  /Save.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "no SQL",
  /SQL.*\*\*no\*\*|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "no DB write",
  /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "no Edge deploy",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "no package generation",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP upload",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "production unchanged",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|unchanged/i.test(
    doc,
  ),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert("P0 section", /P0.*Must fix|P0 — Must fix/i.test(doc));
assert("P1 section", /P1.*Should fix|P1 — Should fix/i.test(doc));
assert("P2 section", /P2.*post-launch|P2 — Acceptable post-launch/i.test(doc));
assert(
  "P0 production misconnection",
  /production misconnection|vsbvndwuajjhnzpohghh/i.test(doc),
);
assert(
  "P0 marker absent",
  doc.includes(MARKER_TITLE) && /Marker string absent|marker absent/i.test(doc),
);
assert(
  "P0 Schedule major pages",
  /Schedule.*2026-03.*2026-08|2026-03〜2026-08/i.test(doc),
);
assert(
  "P0 Contact HubSpot",
  /Contact.*HubSpot|HubSpot.*form/i.test(doc),
);
assert(
  "P0 mobile major collapse",
  /mobile.*layout collapse|≤767px/i.test(doc),
);
assert(
  "P0 sitemap robots",
  /sitemap.*robots|robots.*sitemap/i.test(doc),
);
assert(
  "P0 secrets leak",
  /service_role|secrets.*leak/i.test(doc),
);
assert(
  "P0 FTP public-dist clarity",
  /public-dist.*contents|FTP upload target/i.test(doc),
);
assert(
  "known status Discography controlled Save",
  /G-20u36e controlled Save.*COMPLETE/i.test(doc),
);
assert(
  "known status marker restore",
  /G-20u36f marker title restore.*COMPLETE/i.test(doc),
);
assert(
  "known status build pages 17",
  /Build pages.*\*\*17\*\*|Build pages \| \*\*17\*\*/i.test(doc),
);
assert(
  "known status schedule events 74",
  /Schedule events.*\*\*74\*\*|Schedule events \| \*\*74\*\*/i.test(doc),
);
assert(
  "known status discography 4 34",
  /Discography releases.*\*\*4\*\*|releases \| \*\*4\*\*/i.test(doc) &&
    /Discography tracks.*\*\*34\*\*|tracks \| \*\*34\*\*/i.test(doc),
);
assert(
  "known status fileCount 31",
  /fileCount.*\*\*31\*\*|fileCount \| \*\*31\*\*/i.test(doc),
);
assert(
  "known status safeForStaticFtp",
  /safeForStaticFtp.*\*\*true\*\*/i.test(doc),
);
assert(
  "known status external JS warnings",
  /External JS warnings.*\*\*present\*\*|external JS warnings/i.test(doc),
);
assert(
  "static inspection plan section",
  /Static artifact inspection plan|G-20u37a/i.test(doc),
);
assert(
  "static grep marker command",
  doc.includes("rg -n") && doc.includes(MARKER_TITLE),
);
assert(
  "static grep service_role command",
  /rg -n "service_role/i.test(doc),
);
assert(
  "static grep production ref",
  doc.includes(PRODUCTION),
);
assert(
  "static grep staging ref",
  doc.includes(STAGING),
);
assert(
  "static grep deploy base",
  doc.includes(STG_BASE),
);
assert(
  "static list public-dist files",
  /find output\/manual-upload\/gosaki-piano\/public-dist/i.test(doc),
);
assert(
  "static sitemap robots local",
  /sitemap-0\.xml/i.test(doc) && /robots\.txt/i.test(doc),
);
assert(
  "static admin Save path check",
  /admin\/index\.html|Save UI strings/i.test(doc),
);
assert(
  "manual browser QA checklist",
  /Manual browser QA checklist|G-20u37b/i.test(doc),
);
assert(
  "checklist Home",
  doc.includes("yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/") &&
    /7\.1 Home|### 7\.1 Home/i.test(doc),
);
assert(
  "checklist About Schedule Discography Contact",
  /7\.2 About/i.test(doc) &&
    /7\.3 Schedule hub/i.test(doc) &&
    /7\.5 Discography/i.test(doc) &&
    /7\.7 Contact/i.test(doc),
);
assert(
  "checklist Admin Footer sitemap",
  /7\.9 Admin/i.test(doc) &&
    /7\.10 Footer/i.test(doc) &&
    /7\.11 sitemap/i.test(doc),
);
assert(
  "checklist viewport desktop mobile",
  /desktop.*mobile|desktop · mobile/i.test(doc),
);
assert(
  "checklist PASS FAIL memo",
  /PASS if|FAIL memo/i.test(doc),
);
assert(
  "STG URLs table",
  doc.includes("sitemap-0.xml") && doc.includes("robots.txt"),
);
assert("latest commit d1e6652", doc.includes(LATEST_COMMIT));
assert(
  "uploaded sourceCommit e3616a3",
  doc.includes(SOURCE_COMMIT) || doc.includes("e3616a3"),
);
assert(
  "re-upload requires regen note",
  /re-upload.*package regeneration|reUploadRequiresPackageRegeneration/i.test(
    doc,
  ),
);
assert(
  "regression 23/23",
  /23\/23 PASS|currentActiveRegression:\s*23\/23 PASS/i.test(doc),
);
assert(`next phase ${NEXT_A}`, doc.includes(NEXT_A));
assert(`alternate next ${NEXT_B}`, doc.includes(NEXT_B));
assert(
  "next candidate Gosaki public-readiness in doc or next actions",
  /Gosaki public-readiness|public-readiness QA/i.test(doc),
);
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u37-gosaki-public-readiness-qa-planning"),
);
assert(
  "AI current-state G-20u37 planning",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiPublicReadinessQaPlanned"),
);
assert(
  "AI next-actions static inspection or planning",
  nextActions.includes(NEXT_A) ||
    nextActions.includes(PHASE) ||
    nextActions.includes("gosakiPublicReadinessQaPlanned"),
);
assert(
  "AI handoff G-20u37 planning",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT_A) ||
    handoff.includes("gosakiPublicReadinessQaPlanned"),
);
assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u37-gosaki-public-readiness-qa-planning: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
