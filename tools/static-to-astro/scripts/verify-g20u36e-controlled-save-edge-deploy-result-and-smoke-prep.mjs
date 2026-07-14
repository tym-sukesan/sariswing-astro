/**
 * G-20u36e edge-deploy-result + smoke-readonly-check-prep verifier.
 * No HTTP / Save / SQL / Rollback execution.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DEPLOY_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-edge-deploy-result.md";
const SMOKE_PREP_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-smoke-readonly-check-prep.md";
const DEPLOY_PHASE = "G-20u36e-controlled-save-edge-deploy-result-record";
const DEPLOY_GATE = "gosakiDiscographyControlledSaveEdgeDeployedToStaging: true";
const SMOKE_PHASE = "G-20u36e-controlled-save-smoke-readonly-check-prep";
const SMOKE_GATE =
  "gosakiDiscographyControlledSaveSmokeReadonlyCheckPrepared: true";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const FUNCTION = "gosaki-discography-save-dry-run";
const NEXT = "G-20u36e-controlled-save-smoke-readonly-check-execution";
const NEXT_AFTER_SMOKE = "G-20u36e-controlled-save-pre-save-select-prep";
const SMOKE_RESULT_PHASE =
  "G-20u36e-controlled-save-smoke-readonly-check-result-record";

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

assert("deploy result doc exists", exists(DEPLOY_RESULT_REL));
assert("smoke/read-only prep doc exists", exists(SMOKE_PREP_REL));

const deployDoc = read(DEPLOY_RESULT_REL);
const smokeDoc = read(SMOKE_PREP_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`deploy doc phase ${DEPLOY_PHASE}`, deployDoc.includes(DEPLOY_PHASE));
assert(`deploy doc gate ${DEPLOY_GATE}`, deployDoc.includes(DEPLOY_GATE));
assert(`smoke doc phase ${SMOKE_PHASE}`, smokeDoc.includes(SMOKE_PHASE));
assert(`smoke doc gate ${SMOKE_GATE}`, smokeDoc.includes(SMOKE_GATE));
assert(
  "deploy PASS recorded",
  /Deploy judged.*\*\*PASS\*\*|deployPass:\s*true/i.test(deployDoc),
);
assert("staging ref recorded", deployDoc.includes(STAGING) && smokeDoc.includes(STAGING));
assert(
  "production STOP recorded",
  deployDoc.includes(PRODUCTION) && smokeDoc.includes(PRODUCTION),
);
assert(
  "Docker warning but deploy success",
  /Docker is not running/i.test(deployDoc) &&
    /deploy still \*\*success\*\*|dockerWarningBlockedDeploy:\s*false/i.test(deployDoc),
);
assert(
  "uploaded files recorded",
  deployDoc.includes("gosaki-discography-save-dry-run/index.ts") &&
    deployDoc.includes("gosaki-discography-save-dry-run/handler.ts"),
);
assert("function name recorded", deployDoc.includes(FUNCTION));
assert(
  "operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    deployDoc,
  ) && /operation=save.*未送信|operationSaveForbidden/i.test(smokeDoc),
);
assert(
  "Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(deployDoc) &&
    /Save executed.*\*\*no\*\*|saveExecuted:\s*false/i.test(smokeDoc),
);
assert(
  "DB writeなし",
  /DB data write.*\*\*no\*\*|dbDataWriteExecuted:\s*false|DB write.*\*\*no\*\*/i.test(
    deployDoc,
  ) && /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(smokeDoc),
);
assert(
  "Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false/i.test(deployDoc),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(deployDoc) &&
    /service_role.*not used/i.test(smokeDoc),
);
assert(
  "smoke/read-only prep",
  /Smoke \/ read-only prep only|smokeReadonlyPrepOnly:\s*true/i.test(smokeDoc),
);
assert(
  "HTTP未送信",
  /HTTP sent.*\*\*no\*\*|httpNotSent:\s*true|HTTP未送信/i.test(smokeDoc),
);
assert(
  "safe check sequence",
  /Recommended sequence|OPTIONS.*dryRun|Pre-save SELECT/i.test(smokeDoc),
);
assert(
  "operation=save checks forbidden",
  /operation=save.*forbidden|Forbidden in smoke|DO NOT RUN.*operation=save/i.test(
    smokeDoc,
  ),
);
assert(
  "JWT placeholder方針",
  smokeDoc.includes("<OPERATOR_JWT>") &&
    /JWT placeholder|jwtPlaceholderOnly:\s*true|placeholder only/i.test(smokeDoc),
);
assert("dryRun candidate prepared", /"operation": "dryRun"/i.test(smokeDoc));
assert(
  "smoke prep has no live save operation body",
  !/"operation"\s*:\s*"save"/i.test(smokeDoc),
);
assert("next smoke execution", smokeDoc.includes(NEXT) || deployDoc.includes(NEXT));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-edge-deploy-result-and-smoke-prep",
  ),
);
assert(
  "AI current-state deploy result or smoke prep",
  currentState.includes(DEPLOY_PHASE) ||
    currentState.includes(SMOKE_PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveEdgeDeployedToStaging") ||
    currentState.includes(
      "gosakiDiscographyControlledSaveSmokeReadonlyCheckPrepared",
    ),
);
assert(
  "AI next-actions smoke execution or result",
  nextActions.includes(NEXT) ||
    nextActions.includes(NEXT_AFTER_SMOKE) ||
    nextActions.includes(SMOKE_RESULT_PHASE) ||
    nextActions.includes(DEPLOY_PHASE) ||
    nextActions.includes(SMOKE_PHASE),
);
assert(
  "AI handoff deploy result or smoke prep",
  handoff.includes(DEPLOY_PHASE) ||
    handoff.includes(SMOKE_PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveEdgeDeployedToStaging"),
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
  `\nverify-g20u36e-controlled-save-edge-deploy-result-and-smoke-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
