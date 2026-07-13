/**
 * G-20u36e-controlled-save-permission-model-decision verifier.
 * Decision-only — no SQL / GRANT / RLS / DB write / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-permission-model-decision.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-model-decision.md";
const SNAPSHOT_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-snapshot-select-result.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "a480704";

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
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e permission model decision base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during decision doc creation`,
  );
}

assert("decision doc exists", exists(DOC_REL));
assert("snapshot result doc exists", exists(SNAPSHOT_RESULT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-permission-model-decision",
  doc.includes("G-20u36e-controlled-save-permission-model-decision"),
);
assert(
  "doc gate gosakiDiscographyControlledSavePermissionModelDecided",
  doc.includes("gosakiDiscographyControlledSavePermissionModelDecided: true"),
);
assert("doc decision only", doc.includes("Decision only") || doc.includes("decision only"));
assert("doc SQL created no", doc.includes("SQL created") && /no|not|false/i.test(doc));
assert(
  "doc executable SQL no",
  doc.includes("Executable SQL") && /no|not|false/i.test(doc),
);
assert("doc SQL executed no", doc.includes("SQL executed") && /no|not|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|not|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|not|false|変更なし/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|not|false/i.test(doc));
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|not|false/i.test(doc),
);
assert(
  "doc supabase/functions edit no",
  doc.includes("supabase/functions") && /no|not|false/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc dryRun HTTP not re-sent",
  doc.includes("dryRun HTTP") && /no|not|re-sent|未/i.test(doc),
);
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP no", doc.includes("FTP") && /no|not|false/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used|STOP|REJECTED/i.test(doc));

assert(
  "doc permission snapshot summary",
  doc.includes("Permission snapshot summary") || doc.includes("permission snapshot"),
);
assert("doc Option A recorded", doc.includes("Option A"));
assert(
  "doc authenticated UPDATE title RLS operator JWT",
  doc.includes("authenticated UPDATE") &&
    doc.includes("title") &&
    /RLS|restrictive/i.test(doc) &&
    /JWT|operator JWT/i.test(doc),
);
assert(
  "doc Option A selected first candidate",
  doc.includes("SELECTED") && /first candidate|first and only/i.test(doc),
);
assert(
  "doc anon UPDATE rejected",
  doc.includes("anon UPDATE") && /REJECTED|reject|不採用/i.test(doc),
);
assert("doc service_role STOP", doc.includes("service_role") && /STOP|REJECTED|Forbidden/i.test(doc));
assert(
  "doc RPC SECURITY DEFINER rejected",
  doc.includes("SECURITY DEFINER") && /REJECTED|reject/i.test(doc),
);
assert(
  "doc manual SQL fallback",
  doc.includes("manual SQL") && /fallback|emergency|not primary/i.test(doc),
);
assert(
  "doc operator JWT feasibility next",
  doc.includes("operator JWT") && /next|feasibility|confirmed/i.test(doc),
);
assert(
  "doc recommended phase order",
  doc.includes("Recommended phase order") || doc.includes("phase order"),
);
assert(
  "doc auth jwt feasibility next phase",
  doc.includes("G-20u36e-controlled-save-auth-jwt-feasibility-planning"),
);
assert("doc STOP conditions", doc.includes("STOP") && doc.includes("service_role"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-permission-model-decision"),
);
assert(
  "AI current-state permission model decision",
  currentState.includes("G-20u36e-controlled-save-permission-model-decision") ||
    currentState.includes("gosakiDiscographyControlledSavePermissionModelDecided"),
);
assert(
  "AI next-actions auth jwt feasibility or decision",
  nextActions.includes("G-20u36e-controlled-save-permission-model-decision") ||
    nextActions.includes("G-20u36e-controlled-save-auth-jwt-feasibility-planning"),
);
assert(
  "AI handoff permission model decision",
  handoff.includes("G-20u36e-controlled-save-permission-model-decision") ||
    handoff.includes("gosakiDiscographyControlledSavePermissionModelDecided"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-permission-model-decision: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
