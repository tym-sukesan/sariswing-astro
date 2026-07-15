/**
 * G-20u36f marker title restore Edge deploy prep verifier.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-edge-deploy-prep.md";
const IMPL_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36f-marker-title-restore-handler-implementation.md";
const PHASE = "G-20u36f-discography-marker-title-restore-edge-deploy-prep";
const GATE = "gosakiDiscographyMarkerTitleRestoreEdgeDeployPrepared: true";
const NEXT = "G-20u36f-discography-marker-title-restore-edge-deploy-execution";
const FUNCTION = "gosaki-discography-save-dry-run";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const DEPLOY_CMD =
  "supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta";
const ENDPOINT =
  "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run";
const G20U36F_APPROVAL = "G-20u36f-gosaki-discography-marker-title-restore";

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

assert("edge deploy prep doc exists", exists(DOC_REL));
assert("handler implementation doc exists", exists(IMPL_DOC_REL));

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
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false|Edge deploy NOT executed/i.test(
    doc,
  ),
);
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Restore Save.*not sent/i.test(
    doc,
  ),
);
assert(
  "doc SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "doc DB writeなし",
  /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "doc package生成なし",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(
    doc,
  ),
);
assert(
  "doc FTP/uploadなし",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(doc),
);
assert("doc target function", doc.includes(FUNCTION));
assert("doc staging project ref", doc.includes(STAGING));
assert("doc production STOP ref", doc.includes(PRODUCTION));
assert(
  "doc deploy source files",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/handler.ts") &&
    doc.includes("supabase/functions/gosaki-discography-save-dry-run/index.ts"),
);
assert("doc deploy command", doc.includes(DEPLOY_CMD));
assert(
  "doc deploy uses staging ref only",
  /--project-ref\s+kmjqppxjdnwwrtaeqjta/.test(doc) &&
    !new RegExp(
      `functions deploy[\\s\\S]{0,120}--project-ref\\s+${PRODUCTION}`,
    ).test(doc),
);
assert("doc OPTIONS smoke command", /curl -i -X OPTIONS/i.test(doc));
assert("doc dryRun smoke command", /"operation":\s*"dryRun"/i.test(doc));
assert("doc staging endpoint URL", doc.includes(ENDPOINT));
assert(
  "doc no operation=save in smoke",
  /Do not.*operation=save|DO NOT RUN.*operation=save|operation=save is out of scope/i.test(
    doc,
  ),
);
assert(
  "doc restore Save blocked until later phases",
  /restore Save.*blocked|blocked until.*pre-restore|permission open/i.test(doc),
);
assert("doc G-20u36f restore approval reference", doc.includes(G20U36F_APPROVAL));
assert(
  "doc allowlist handler noted",
  /allowlist|G-20u36e forward|G-20u36f restore/i.test(doc),
);
assert(`doc next ${NEXT}`, doc.includes(NEXT));
assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36f-marker-title-restore-edge-deploy-prep"),
);
assert(
  "AI current-state edge deploy prep",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyMarkerTitleRestoreEdgeDeployPrepared"),
);
assert(
  "AI next-actions deploy execution or prep",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff edge deploy prep",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyMarkerTitleRestoreEdgeDeployPrepared"),
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
);

console.log(
  `\nverify-g20u36f-marker-title-restore-edge-deploy-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
