/**
 * G-20u36e-controlled-save-edge-deploy-prep verifier.
 * Deploy prep only — no Edge deploy / Save / SQL / DB write.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-edge-deploy-prep.md";
const LOCAL_VERIFY_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-handler-permission-aware-local-verification.md";
const PHASE = "G-20u36e-controlled-save-edge-deploy-prep";
const GATE = "gosakiDiscographyControlledSaveEdgeDeployPrepared: true";
const NEXT = "G-20u36e-controlled-save-edge-deploy-execution";
const FUNCTION = "gosaki-discography-save-dry-run";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const DEPLOY_CMD =
  "supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta";

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

assert("deploy prep doc exists", exists(DOC_REL));
assert("local verification doc exists", exists(LOCAL_VERIFY_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc deploy prep only",
  /Deploy prep only|deployPrepOnly:\s*true/i.test(doc),
);
assert(
  "doc Edge deploy未実行",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false|Edge deploy未実行/i.test(
    doc,
  ),
);
assert(
  "doc operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert("doc DB writeなし", /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc));
assert(
  "doc Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    doc,
  ),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false|service_role不使用/i.test(
    doc,
  ),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|production未変更/i.test(
    doc,
  ),
);
assert("doc target function名", doc.includes(FUNCTION));
assert("doc staging project ref", doc.includes(STAGING));
assert("doc production STOP ref", doc.includes(PRODUCTION));
assert(
  "doc deploy対象ファイル",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/handler.ts") &&
    doc.includes("supabase/functions/gosaki-discography-save-dry-run/index.ts"),
);
assert("doc deploy command", doc.includes(DEPLOY_CMD));
assert(
  "doc deploy command uses staging ref",
  /--project-ref\s+kmjqppxjdnwwrtaeqjta/.test(doc) &&
    doc.includes(DEPLOY_CMD),
);
assert(
  "doc deploy command does not use production ref",
  !new RegExp(
    `functions deploy[\\s\\S]{0,120}--project-ref\\s+${PRODUCTION}`,
  ).test(doc),
);
assert(
  "doc deploy後すぐSaveしない方針",
  /Do not.*Save immediately|いきなり Save|not.*first post-deploy/i.test(doc),
);
assert(
  "doc pre-save SELECT-only verification方針",
  /Pre-save SELECT-only|pre-save SELECT/i.test(doc),
);
assert("doc STOP conditions", /STOP conditions/i.test(doc));
assert("doc next deploy execution", doc.includes(NEXT));

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-edge-deploy-prep"),
);
assert(
  "AI current-state edge deploy prep",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveEdgeDeployPrepared"),
);
assert(
  "AI next-actions deploy execution or prep",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff edge deploy prep",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveEdgeDeployPrepared"),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36e-controlled-save-edge-deploy-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
