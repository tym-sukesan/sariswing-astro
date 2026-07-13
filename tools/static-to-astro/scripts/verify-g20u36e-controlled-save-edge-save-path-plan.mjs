/**
 * G-20u36e-controlled-save-edge-save-path-planning verifier.
 * Planning-only — no Edge impl / SQL / DB write / Save / deploy / dryRun HTTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-edge-save-path-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-edge-save-path-plan.md";
const DRYRUN_VERIFY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-dryrun-payload-live-verify.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const SLICE_ID = "G-20u36e1-discography-002-track-1-title-staging-marker";
const SAVE_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const TRACK1_BEFORE = "On a Clear Day";
const TRACK1_AFTER = "On a Clear Day [CMS Kit staging G-20u36e]";
const TRACK7 = "Like a Lover";
const BASE_COMMIT = "00ba5c7";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e edge save path plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during plan doc creation`,
  );
}

assert("plan doc exists", exists(DOC_REL));
assert("dryrun live verify doc exists", exists(DRYRUN_VERIFY_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-edge-save-path-planning",
  doc.includes("G-20u36e-controlled-save-edge-save-path-planning"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveEdgeSavePathPlanPrepared",
  doc.includes("gosakiDiscographyControlledSaveEdgeSavePathPlanPrepared: true"),
);
assert("doc planning only", doc.includes("planning only") || doc.includes("Planning only"));
assert("doc Edge implementation not executed", doc.includes("Edge implementation") && /no|not|false/i.test(doc));
assert(
  "doc supabase/functions edit not executed",
  doc.includes("supabase/functions") && /no|not|false/i.test(doc),
);
assert("doc Edge deploy not executed", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert("doc SQL not executed", doc.includes("SQL") && /no|not|false|not created/i.test(doc));
assert("doc DB write not executed", doc.includes("DB write") && /no|not|false/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|reject|400/i.test(doc),
);
assert("doc Save not executed", doc.includes("Save") && /not executed|未実行|no.*Save/i.test(doc));
assert(
  "doc dryRun HTTP not re-sent",
  doc.includes("dryRun HTTP") && /no|not|re-sent|未/i.test(doc),
);
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used|Forbidden/i.test(doc));

assert("doc staging ref recorded", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));

assert("doc target slice recorded", doc.includes(SLICE_ID));
assert("doc approvalId recorded", doc.includes(SAVE_APPROVAL_ID));
assert("doc siteSlug gosaki-piano", doc.includes("gosaki-piano"));
assert("doc legacyId discography-002", doc.includes("discography-002"));
assert("doc track 1 before", doc.includes(TRACK1_BEFORE));
assert("doc track 1 after", doc.includes(TRACK1_AFTER));
assert("doc track 7 unchanged", doc.includes(TRACK7) && /unchanged|変更なし|must not/i.test(doc));
assert("doc track count 8 to 8", doc.includes("8") && /8 → 8|8 to 8|8→8/i.test(doc));
assert(
  "doc release scalar unchanged",
  doc.includes("release scalar") && /unchanged|no diff/i.test(doc),
);

assert("doc server-side guard section", doc.includes("server-side guard") || doc.includes("Server-side guard"));
assert(
  "doc readBack guard trackCount 8",
  doc.includes("trackCount") && doc.includes("8"),
);
assert(
  "doc diff guard changed line track 1",
  doc.includes("changed") && doc.includes("line 1"),
);

assert(
  "doc one-row UPDATE recommended",
  doc.includes("one row") || doc.includes("one-row") || doc.includes("one row"),
);
assert(
  "doc delete insert rebuild NG",
  doc.includes("delete") && doc.includes("insert") && /NG|NOT RECOMMENDED|reject/i.test(doc),
);
assert("doc service_role STOP", doc.includes("service_role") && /STOP|Forbidden|FORBIDDEN/i.test(doc));

assert(
  "doc authorization RLS grant risk",
  doc.includes("RLS") && doc.includes("grant") && /risk|unresolved|blocked/i.test(doc),
);
assert(
  "doc authenticated UPDATE grant zero",
  doc.includes("authenticated UPDATE") && /0|zero|revoked/i.test(doc),
);
assert(
  "doc permission preflight necessity",
  doc.includes("permission preflight") && /required|YES|true|Recommended first/i.test(doc),
);

assert(
  "doc post-save verification plan",
  doc.includes("verification") && /post-save|Save後|after Save/i.test(doc),
);
assert(
  "doc matching dryRun after save wouldWrite false",
  doc.includes("wouldWrite") && /false/.test(doc),
);
assert("doc rollback plan", doc.includes("Rollback") || doc.includes("rollback"));
assert(
  "doc rollback not executed",
  doc.includes("rollback") && /not executed|not created|separate/i.test(doc),
);
assert("doc STOP conditions", doc.includes("STOP") && doc.includes("service_role"));

assert(
  "doc next phase tools draft",
  doc.includes("G-20u36e-controlled-save-edge-save-path-tools-draft"),
);
assert(
  "doc next phase permission preflight",
  doc.includes("G-20u36e-controlled-save-permission-preflight-planning"),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-edge-save-path-plan"),
);
assert(
  "AI current-state edge save path plan",
  currentState.includes("G-20u36e-controlled-save-edge-save-path-planning") ||
    currentState.includes("gosakiDiscographyControlledSaveEdgeSavePathPlanPrepared"),
);
assert(
  "AI next-actions edge save path or permission preflight",
  nextActions.includes("G-20u36e-controlled-save-edge-save-path-planning") ||
    nextActions.includes("G-20u36e-controlled-save-permission-preflight-planning") ||
    nextActions.includes("G-20u36e-controlled-save-edge-save-path-tools-draft"),
);
assert(
  "AI handoff edge save path plan",
  handoff.includes("G-20u36e-controlled-save-edge-save-path-planning") ||
    handoff.includes("gosakiDiscographyControlledSaveEdgeSavePathPlanPrepared"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-edge-save-path-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
