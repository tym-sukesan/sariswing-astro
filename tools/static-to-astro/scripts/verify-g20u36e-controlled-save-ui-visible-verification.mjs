/**
 * G-20u36e UI-visible verification prep verifier.
 * No Save / SQL / package / FTP / Edge deploy.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-ui-visible-verification.md";
const PHASE = "G-20u36e-controlled-save-ui-visible-verification";
const GATE =
  "gosakiDiscographyControlledSaveUiVisibleVerificationPrepared: true";
const TITLE_NEW = "On a Clear Day [CMS Kit staging G-20u36e]";
const TRACK_7 = "Like a Lover";
const ADMIN_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";
const PUBLIC_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";

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

assert("UI-visible verification doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "verification prep only",
  /Verification prep only|uiVisibleVerificationPrepOnly:\s*true/i.test(doc),
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
  "SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlExecuted:\s*false|SQL未実行/i.test(doc),
);
assert(
  "Edge deployなし",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false|Edge deployなし/i.test(
    doc,
  ),
);
assert(
  "package生成なし",
  /Package.*\*\*no\*\*|packageGenerated:\s*false|package生成なし/i.test(doc),
);
assert(
  "FTP/uploadなし",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false|FTP \/ uploadなし/i.test(doc),
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
assert("admin URL recorded", doc.includes(ADMIN_URL));
assert("public URL recorded", doc.includes(PUBLIC_URL));
assert("target title recorded", doc.includes(TITLE_NEW));
assert("Like a Lover confirmation", doc.includes(TRACK_7));
assert(
  "admin/public reflection delta",
  /reflection delta|admin\/public|Packaged STG.*No|Immediate after DB Save/i.test(
    doc,
  ) && /static package lag|regenerate|manual upload/i.test(doc),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-ui-visible-verification",
  ),
);
assert(
  "AI current-state ui-visible",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveUiVisibleVerificationPrepared",
    ),
);
assert(
  "AI next-actions ui-visible or result",
  nextActions.includes(PHASE) ||
    nextActions.includes(
      "G-20u36e-controlled-save-ui-visible-verification-result-record",
    ) ||
    nextActions.includes("completion handoff"),
);
assert(
  "AI handoff ui-visible",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveUiVisibleVerificationPrepared",
    ),
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
  `\nverify-g20u36e-controlled-save-ui-visible-verification: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
