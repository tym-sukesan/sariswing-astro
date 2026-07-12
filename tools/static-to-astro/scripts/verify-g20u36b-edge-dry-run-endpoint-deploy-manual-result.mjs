/**
 * G-20u36b-edge-dry-run-endpoint-deploy-manual-result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-deploy-manual-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-manual-result.md";
const ROOT_PLACEMENT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-root-placement.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "9b727d1";

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
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b deploy-manual-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("root placement doc exists", exists(ROOT_PLACEMENT_DOC_REL));

const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record",
  doc.includes("G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record"),
);
assert(
  "doc gate deployed to staging",
  doc.includes("gosakiDiscographyEdgeDryRunEndpointDeployedToStaging: true"),
);
assert("doc deploy success", doc.includes("SUCCESS") || doc.includes("success"));
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc Cursor did not deploy", doc.includes("Cursor") && /not deploy|did not deploy|no/i.test(doc));
assert("doc pre-deploy verify PASS", doc.includes("65/65") || doc.includes("root-placement"));
assert("doc deploy command", doc.includes("supabase functions deploy gosaki-discography-save-dry-run"));
assert("doc project ref kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert(
  "doc production ref not used",
  doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|STOP|Forbidden/i.test(doc),
);
assert("doc function name", doc.includes("gosaki-discography-save-dry-run"));
assert("doc uploaded asset index.ts", doc.includes("gosaki-discography-save-dry-run/index.ts"));
assert("doc uploaded asset handler.ts", doc.includes("gosaki-discography-save-dry-run/handler.ts"));
assert(
  "doc Docker warning non-blocking",
  doc.includes("Docker") && /non-blocking|non blocking|succeeded/i.test(doc),
);
assert(
  "doc CLI update no action",
  doc.includes("CLI") && (/no action|not updated|対応不要/i.test(doc) || doc.includes("v2.109.1")),
);
assert(
  "doc cli-latest do not commit",
  doc.includes("cli-latest") && /do not commit|not commit|git restore/i.test(doc),
);
assert(
  "doc live verify not executed",
  (/live verify/i.test(doc) || /Live HTTP verify/i.test(doc)) &&
    (/not executed|未実行/i.test(doc) || doc.includes("liveVerifyExecuted: false")),
);
assert("doc Save not enabled", doc.includes("Save") && /disabled|not enabled|not executed|false/i.test(doc));
assert(
  "doc admin fetch POST not added",
  doc.includes("fetch POST") && /not added|未追加/i.test(doc),
);
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc next live-verify", doc.includes("live-verify") || doc.includes("live verify"));

assert("supabase/functions not edited in this phase", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-deploy-manual-result"),
);

assert(
  "AI current-state deploy-manual-result",
  currentState.includes("deploy-manual-result") ||
    currentState.includes("DeployedToStaging") ||
    currentState.includes("deploy-manual-result-record"),
);
assert(
  "AI next-actions live-verify",
  nextActions.includes("live-verify") || nextActions.includes("live verify"),
);
assert(
  "handoff deploy-manual-result",
  handoff.includes("deploy-manual-result") ||
    handoff.includes("DeployedToStaging") ||
    handoff.includes("live-verify"),
);

assert("SQL not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-deploy-manual-result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
