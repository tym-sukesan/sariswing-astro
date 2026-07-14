/**
 * G-20u36e smoke/read-only check result-record verifier.
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

const RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-smoke-readonly-check-result.md";
const PHASE = "G-20u36e-controlled-save-smoke-readonly-check-result-record";
const GATE = "gosakiDiscographyControlledSaveSmokeReadonlyCheckPassed: true";
const NEXT = "G-20u36e-controlled-save-pre-save-select-prep";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";

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

assert("smoke/read-only result doc exists", exists(RESULT_REL));

const doc = read(RESULT_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("OPTIONS PASS", /OPTIONS.*\*\*PASS\*\*|optionsPass:\s*true/i.test(doc));
assert(
  "dryRun/readBack PASS",
  /dryRun \/ readBack.*\*\*PASS\*\*|dryRunReadBackPass:\s*true/i.test(doc),
);
assert("didWrite=false", /didWrite.*\*\*false\*\*|didWrite:\s*false/i.test(doc));
assert("dbWrite=false", /dbWrite.*\*\*false\*\*|dbWrite:\s*false/i.test(doc));
assert(
  "networkWrite=false",
  /networkWrite.*\*\*false\*\*|networkWrite:\s*false/i.test(doc),
);
assert(
  "saveEnabled=false",
  /saveEnabled.*\*\*false\*\*|saveEnabled:\s*false/i.test(doc),
);
assert(
  "readBack trackCount=8",
  /readBack\.trackCount.*`8`|trackCount.*`8`|readBackTrackCount:\s*8/i.test(doc),
);
assert(
  "operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert(
  "DB writeなし",
  /DB write.*\*\*no\*\*|dbDataWriteExecuted:\s*false|DB writeなし/i.test(doc),
);
assert(
  "Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    doc,
  ),
);
assert(
  "service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|production未変更/i.test(
    doc,
  ),
);
assert("staging ref recorded", doc.includes(STAGING));
assert("production STOP recorded", doc.includes(PRODUCTION));
assert(
  "wouldWrite prediction only",
  /wouldWrite.*prediction|wouldWritePredictionOnly:\s*true/i.test(doc),
);
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "no live JWT/token values",
  !/eyJ[A-Za-z0-9_-]{20,}/.test(doc) && !/Bearer [A-Za-z0-9._-]{20,}/.test(doc),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-smoke-readonly-check-result",
  ),
);
assert(
  "AI current-state smoke result",
  currentState.includes(PHASE) ||
    currentState.includes(GATE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveSmokeReadonlyCheckPassed",
    ),
);
assert(
  "AI next-actions pre-save-select-prep or smoke result",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff smoke result",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes("gosakiDiscographyControlledSaveSmokeReadonlyCheckPassed"),
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
  `\nverify-g20u36e-controlled-save-smoke-readonly-check-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
