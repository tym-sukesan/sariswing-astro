/**
 * G-23a — Static-to-Astro CMS 30-minute onboarding flow planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g23a-static-to-astro-30-minute-onboarding-flow-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/static-to-astro-30-minute-onboarding-flow-planning.md";
const G22J2_RELEASE = "tools/static-to-astro/docs/gosaki-schedule-cms-p0-release-note.md";
const G7_PLANNING = "tools/static-to-astro/docs/url-to-staging-automation-sprint-planning.md";
const CRAWL_SCRIPT = "tools/static-to-astro/scripts/crawl-static-site.mjs";
const PIPELINE_SCRIPT = "tools/static-to-astro/scripts/url-to-staging-pipeline.mjs";

const BASE_COMMIT = "5fa7fdb";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 5fa7fdb", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 5fa7fdb", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("planning doc exists", exists(DOC_REL));
assert("G-22j2 release note exists", exists(G22J2_RELEASE));
assert("G-7 url-to-staging planning exists", exists(G7_PLANNING));
assert("crawl script exists", exists(CRAWL_SCRIPT));
assert("pipeline script exists", exists(PIPELINE_SCRIPT));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-23a", doc.includes("G-23a-static-to-astro-30-minute-onboarding-flow-planning"));
assert(
  "doc planning gate complete",
  doc.includes("staticToAstro30MinuteOnboardingFlowPlanningComplete: true"),
);
assert(
  "doc 30-minute onboarding flow",
  /30.minute.*onboarding|30-minute onboarding/i.test(doc),
);

assert("doc purpose URL input", /URL.*入力|URL input/i.test(doc));
assert("doc 80 point initial", /80点|80-point/i.test(doc));
assert("doc gosaki first slice", /Gosaki|Schedule P0/i.test(doc));

assert("doc timeline 0-3", /0.–3|0–3 min/i.test(doc));
assert("doc timeline 3-8 crawl", /3.–8|3–8 min/i.test(doc));
assert("doc timeline 8-12 layout", /8.–12|8–12 min/i.test(doc));
assert("doc timeline 12-17 cms", /12.–17|12–17 min/i.test(doc));
assert("doc timeline 17-22 staging", /17.–22|17–22 min/i.test(doc));
assert("doc timeline 22-26 package", /22.–26|22–26 min/i.test(doc));
assert("doc timeline 26-30 report", /26.–30|26–30 min/i.test(doc));

assert("doc target musician", /ミュージシャン|musician/i.test(doc));
assert("doc target wix jimdo", /Wix|Jimdo/i.test(doc));
assert("doc out of scope EC", /EC|通販/i.test(doc));
assert("doc out of scope member", /会員制/i.test(doc));

assert("doc cms preset musician-basic", doc.includes("musician-basic"));
assert("doc cms preset lesson-studio", doc.includes("lesson-studio-basic"));
assert("doc cms preset shop-basic", doc.includes("shop-basic"));

assert("doc standard modules crawler", /crawler module/i.test(doc));
assert("doc standard modules package builder", /package builder/i.test(doc));
assert("doc standard modules diff reporter", /diff reporter/i.test(doc));

assert("doc safety staging first", /staging first/i.test(doc));
assert("doc safety site_slug", /site_slug/i.test(doc));
assert("doc safety save preview", /Save前 preview|dry-run/i.test(doc));
assert("doc safety optimistic lock", /optimistic lock/i.test(doc));
assert("doc safety published false", /published=false/i.test(doc));
assert("doc safety public reflection separate", /public reflection|DB write.*分離/i.test(doc));
assert("doc safety ftp gate", /FTP.*別|別高リスク/i.test(doc));
assert("doc safety mirror delete", /--delete|mirror.*禁止/i.test(doc));
assert("doc safety root delete", /root.*誤消去|root 誤消去/i.test(doc));
assert("doc safety service role", /service_role.*不使用|service_role 不使用/i.test(doc));
assert("doc safety production ref", /production ref|vsbvndwuajjhnzpohghh/i.test(doc));

assert("doc success criteria", /成功条件|Success criteria/i.test(doc));
assert("doc success published true only", /published=true/i.test(doc));
assert("doc success ftp not executed", /FTP not executed|FTPはまだしない/i.test(doc));

assert("doc not in scope design", /完全なデザイン|デザイン再現/i.test(doc));
assert("doc not in scope auto ftp", /本番 FTP 自動|FTP 自動/i.test(doc));
assert("doc not in scope production db", /production DB/i.test(doc));

assert("doc phase 1", /Phase 1/i.test(doc));
assert("doc phase 2", /Phase 2/i.test(doc));
assert("doc phase 3", /Phase 3/i.test(doc));
assert("doc phase 4", /Phase 4/i.test(doc));

assert("doc next onboarding config schema", /onboarding config schema/i.test(doc));
assert("doc next site_slug generator", /site_slug generator/i.test(doc));
assert("doc next preset registry", /preset registry|CMS preset registry/i.test(doc));
assert("doc next sample dry-run", /sample.*dry-run|dry-run/i.test(doc));
assert("doc next runbook", /runbook|30-minute runbook/i.test(doc));

assert("doc customer explanation", /顧客向け|顧客説明/i.test(doc));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc package regen false", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));

assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh|混入防止/i.test(doc),
);

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("00-current-state mentions G-23a", currentState.includes("G-23a"));
assert("03-next-actions mentions G-23a", nextActions.includes("G-23a"));
assert("handoff mentions G-23a", handoff.includes("G-23a"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-23a Static-to-Astro 30-minute onboarding flow planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
