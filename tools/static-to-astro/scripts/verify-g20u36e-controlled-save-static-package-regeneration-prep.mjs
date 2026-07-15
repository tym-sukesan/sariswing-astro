/**
 * G-20u36e static package regeneration prep verifier.
 * No package generate / FTP / Save / SQL / Edge.
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-static-package-regeneration-prep.md";
const PHASE = "G-20u36e-controlled-save-static-package-regeneration-prep";
const GATE =
  "gosakiDiscographyControlledSaveStaticPackageRegenerationPrepared: true";
const NEXT = "G-20u36e-controlled-save-static-package-regeneration-execution";
const TITLE_MARKER = "On a Clear Day [CMS Kit staging G-20u36e]";
const TRACK_7 = "Like a Lover";
const REMOTE = "/cms-kit-staging/gosaki-piano/";

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

assert("static package regeneration prep doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "package生成未実行",
  /Package generation.*\*\*no\*\*|packageGenerated:\s*false|package生成未実行/i.test(
    doc,
  ),
);
assert(
  "output/manual-upload変更なし",
  /output\/manual-upload.*not updated|outputManualUploadUpdated:\s*false|変更なし/i.test(
    doc,
  ),
);
assert(
  "FTP/upload未実行",
  /FTP.*not executed|ftpUploadExecuted:\s*false|FTP \/ upload.*未実行/i.test(
    doc,
  ),
);
assert(
  "Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert(
  "SQL未実行",
  /SQL.*not executed|sqlExecuted:\s*false|SQL未実行/i.test(doc),
);
assert(
  "Edge deployなし",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false|Edge deployなし/i.test(
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
assert(
  "sourceCommit = HEAD condition",
  /sourceCommit.*HEAD|MANIFEST\.sourceCommit/i.test(doc),
);
assert(
  "generatedAt freshness condition",
  /generatedAt/i.test(doc) && /freshness/i.test(doc),
);
assert(
  "marker title check condition",
  doc.includes(TITLE_MARKER) &&
    /marker|Primary title marker|full marker string/i.test(doc),
);
assert(
  "Like a Lover check condition",
  doc.includes(TRACK_7) && /Like a Lover/i.test(doc),
);
assert(
  "public-dist upload target",
  /public-dist.*contents|public-dist\/.*中身/i.test(doc),
);
assert("remote target recorded", doc.includes(REMOTE));
assert(
  "CLI FTP / mirror / delete / sync forbidden",
  /mirror.*delete|CLI FTP|Forbidden.*FTP|禁止/i.test(doc),
);
assert(
  "build:gosaki:staging command",
  doc.includes("build:gosaki:staging") && doc.includes("cd ~/sariswing-astro"),
);
assert(`next phase ${NEXT}`, doc.includes(NEXT));
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-static-package-regeneration-prep",
  ),
);
assert(
  "AI current-state static package prep",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveStaticPackageRegenerationPrepared",
    ),
);
assert(
  "AI next-actions regeneration execution or prep",
  nextActions.includes(NEXT) || nextActions.includes(PHASE),
);
assert(
  "AI handoff static package prep",
  handoff.includes(PHASE) ||
    handoff.includes(NEXT) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveStaticPackageRegenerationPrepared",
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
  `\nverify-g20u36e-controlled-save-static-package-regeneration-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
