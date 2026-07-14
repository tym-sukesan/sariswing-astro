/**
 * G-20u36e UI-visible verification result-record verifier.
 * No Save / SQL / package / FTP / Edge.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-ui-visible-verification-result.md";
const PHASE =
  "G-20u36e-controlled-save-ui-visible-verification-result-record";
const GATE =
  "gosakiDiscographyControlledSaveUiVisibleVerificationResultRecorded: true";
const TITLE_NEW = "On a Clear Day [CMS Kit staging G-20u36e]";
const TITLE_OLD = "On a Clear Day";
const TRACK_7 = "Like a Lover";
const NEXT = "G-20u36e-controlled-save-static-package-regeneration-prep";
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

assert("UI-visible result doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "Admin new title not visible",
  /Admin new title visible.*\*\*no\*\*|adminNewTitleVisible:\s*false|見えない/i.test(
    doc,
  ) && doc.includes(ADMIN_URL),
);
assert(
  "Public new title not visible",
  /Public new title visible.*\*\*no\*\*|publicNewTitleVisible:\s*false/i.test(
    doc,
  ) && doc.includes(PUBLIC_URL),
);
assert(
  "Like a Lover visible",
  /Like a Lover.*\*\*yes\*\*|likeALoverVisible:\s*true|Like a Lover.*見える/i.test(
    doc,
  ) && doc.includes(TRACK_7),
);
assert(
  "old title visible",
  /Old title.*\*\*yes\*\*|oldTitleVisible:\s*true|On a Clear Day.*見える/i.test(
    doc,
  ) && doc.includes(TITLE_OLD),
);
assert("new title string recorded", doc.includes(TITLE_NEW));
assert(
  "DB Save remains PASS",
  /DB Save.*PASS|dbSaveRemainsPass:\s*true/i.test(doc),
);
assert(
  "permission close remains PASS",
  /Permission close.*PASS|permissionCloseRemainsPass:\s*true/i.test(doc),
);
assert(
  "likely static snapshot lag",
  /static snapshot lag|likelyStaticSnapshotLag:\s*true|static package lag/i.test(
    doc,
  ),
);
assert(
  "package regeneration not executed",
  /Package regeneration.*not executed|packageRegenerationExecuted:\s*false|package.*なし/i.test(
    doc,
  ),
);
assert(
  "FTP/upload not executed",
  /FTP.*not executed|ftpUploadExecuted:\s*false|FTP \/ uploadなし/i.test(doc),
);
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-ui-visible-verification-result",
  ),
);
assert(
  "AI current-state ui-visible result",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveUiVisibleVerificationResultRecorded",
    ),
);
assert(
  "AI next-actions package regeneration or result",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff ui-visible result",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveUiVisibleVerificationResultRecorded",
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
  `\nverify-g20u36e-controlled-save-ui-visible-verification-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
