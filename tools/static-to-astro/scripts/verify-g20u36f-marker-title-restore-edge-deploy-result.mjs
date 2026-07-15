/**
 * G-20u36f marker title restore Edge deploy result-record verifier.
 * Result record only — no additional deploy / Save / SQL / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-edge-deploy-result.md";
const PREP_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-edge-deploy-prep.md";
const PHASE = "G-20u36f-discography-marker-title-restore-edge-deploy-result-record";
const GATE = "gosakiDiscographyMarkerTitleRestoreEdgeDeployed: true";
const NEXT = "G-20u36f-discography-marker-title-restore-preflight-select";
const FUNCTION = "gosaki-discography-save-dry-run";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const DEPLOY_CMD =
  "supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta";
const G20U36F_APPROVAL = "G-20u36f-gosaki-discography-marker-title-restore";
const G20U36F_SLICE = "G-20u36f-discography-002-track-1-title-restore";

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

assert("edge deploy result doc exists", exists(DOC_REL));
assert("edge deploy prep doc exists", exists(PREP_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "Edge deploy PASS",
  /Deploy.*\*\*PASS\*\*|deployPass:\s*true|Judgment.*PASS/i.test(doc),
);
assert(
  "OPTIONS smoke PASS",
  /OPTIONS smoke.*\*\*PASS\*\*|optionsSmokePass:\s*true/i.test(doc),
);
assert(
  "dryRun restore-shaped safe FAIL",
  /safe FAIL|dryRunRestoreShapedSmokeSafeFail:\s*true|contract mismatch/i.test(
    doc,
  ),
);
assert(
  "dryRun no DB write",
  /dbWrite.*\*\*false\*\*|dbWriteExecuted:\s*false|no DB write/i.test(doc),
);
assert(
  "dryRun didWrite false",
  /didWrite.*\*\*false\*\*|didWrite:\s*false/i.test(doc),
);
assert(
  "dryRun wouldWrite false",
  /wouldWrite.*\*\*false\*\*|wouldWrite:\s*false/i.test(doc),
);
assert(
  "dryRun readBack trackCount 8",
  /trackCount.*\*\*8\*\*|trackCount:\s*8/i.test(doc),
);
assert(
  "dryRun does not prove restore Save failure",
  /does not prove restore Save failure|allowlist path/i.test(doc),
);
assert(
  "do not retry dryRun with operation=save",
  /Do not.*operation=save|not retry dryRun with operation=save/i.test(doc),
);
assert(
  "proceed to pre-restore SELECT",
  /pre-restore SELECT|preflight-select/i.test(doc),
);
assert(
  "Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Restore Save.*not sent/i.test(
    doc,
  ),
);
assert(
  "operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false/i.test(doc),
);
assert(
  "SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "permission open未実行",
  /Permission open.*\*\*no\*\*|permissionOpenExecuted:\s*false/i.test(doc),
);
assert(
  "package生成なし",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(
    doc,
  ),
);
assert(
  "FTP/uploadなし",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|unchanged/i.test(
    doc,
  ),
);
assert("doc deploy command recorded", doc.includes(DEPLOY_CMD));
assert("doc staging ref", doc.includes(STAGING));
assert("doc production STOP ref", doc.includes(PRODUCTION));
assert("doc function name", doc.includes(FUNCTION));
assert(
  "doc Docker warning deploy still success",
  /Docker is not running/i.test(doc) &&
    /deploy still.*success|dockerWarningBlockedDeploy:\s*false/i.test(doc),
);
assert(
  "doc deployed result line",
  /Deployed Functions on project kmjqppxjdnwwrtaeqjta/i.test(doc),
);
assert(
  "doc uploaded handler files",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/handler.ts") &&
    doc.includes("supabase/functions/gosaki-discography-save-dry-run/index.ts"),
);
assert(
  "doc pre-deploy handler markers",
  doc.includes(G20U36F_APPROVAL) && doc.includes(G20U36F_SLICE),
);
assert(
  "doc OPTIONS HTTP 200",
  /HTTP\/2 200|HTTP.*200/i.test(doc) && /access-control-allow-origin/i.test(doc),
);
assert(
  "doc dryRun validation errors listed",
  doc.includes("release.title must be a non-empty string") &&
    doc.includes("tracksText must be a string"),
);
assert(
  "additional deploy not executed",
  /Additional deploy.*\*\*no\*\*|additionalDeployExecuted:\s*false/i.test(doc),
);
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36f-marker-title-restore-edge-deploy-result"),
);
assert(
  "AI current-state edge deploy result",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyMarkerTitleRestoreEdgeDeployed"),
);
assert(
  "AI next-actions preflight select or result",
  nextActions.includes(NEXT) ||
    nextActions.includes(PHASE) ||
    nextActions.includes("gosakiDiscographyMarkerTitleRestoreEdgeDeployed"),
);
assert(
  "AI handoff edge deploy result",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes("gosakiDiscographyMarkerTitleRestoreEdgeDeployed"),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36f-marker-title-restore-edge-deploy-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
