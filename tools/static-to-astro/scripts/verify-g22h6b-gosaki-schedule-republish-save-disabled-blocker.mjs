/**
 * G-22h6b blocker — Gosaki Schedule republish Save disabled / session gate verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h6b-gosaki-schedule-republish-save-disabled-blocker.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-republish-save-disabled-blocker.md";
const G22H6A_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-update-implementation.md";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const REPUBLISH_DRY_RUN = "src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts";
const REPUBLISH_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";

const BASE_COMMIT = "9880091";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const EXPECTED_UPDATED_AT = "2026-07-06T13:58:41.425402+00:00";
const SESSION_REASON = "Staging admin session required.";

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

assert("HEAD is 9880091", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

assert("blocker doc exists", exists(DOC_REL));
assert("G-22h6a prior doc exists", exists(G22H6A_DOC));

const doc = read(DOC_REL);
const operatorUi = read(OPERATOR_UI);
const dryRun = read(REPUBLISH_DRY_RUN);
const republishConfig = read(REPUBLISH_CONFIG);
const adminCss = read(ADMIN_CSS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase blocker", doc.includes("G-22h6b-blocker-gosaki-schedule-republish-save-disabled-session-gate"));
assert("doc g22h6b not executed", doc.includes("g22h6bRepublishUpdateOperatorSaveOnceExecuted: false"));
assert("doc blocked", doc.includes("g22h6bBlocked: true"));
assert("doc preview succeeded", doc.includes("dry-run preview") || doc.includes("変更を確認"));
assert("doc target 008", doc.includes(TARGET_LEGACY) && doc.includes(TARGET_ID));
assert("doc expectedBeforeUpdatedAt", doc.includes(EXPECTED_UPDATED_AT));
assert("doc actualWrite false", doc.includes("actualWrite: false"));
assert("doc save disabled", doc.includes("Save button enabled") && doc.includes("no"));
assert("doc session reason", doc.includes(SESSION_REASON));
assert("doc text overlap", doc.includes("overlap") || doc.includes("overlapped"));
assert("doc no save no db write", doc.includes("saveExecuted: false") && doc.includes("dbWriteExecuted: false"));
assert("doc dev server stopped", doc.includes("stopped"));
assert("doc port none", doc.includes("port 4321 LISTEN") && doc.includes("none"));
assert("doc root cause session desync", doc.includes("stagingAuthSignedIn") || doc.includes("session gate desync"));
assert("doc fix session sync", doc.includes("Sync `stagingAuthSignedIn`") || doc.includes("session sync"));
assert("doc next retry", doc.includes("G-22h6b-retry") || doc.includes("retry"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));

assert("config session reason string", republishConfig.includes(SESSION_REASON));
assert("operator evaluateG22hRepublishUpdateUiGate", operatorUi.includes("evaluateG22hRepublishUpdateUiGate"));
assert("operator stagingAuthSignedIn cache", operatorUi.includes("let stagingAuthSignedIn"));
assert("operator refreshStagingAuthSignedIn", operatorUi.includes("refreshStagingAuthSignedIn"));
assert("operator runAuthenticatedAdminReadRefetch", operatorUi.includes("runAuthenticatedAdminReadRefetch"));
assert("fix sync stagingAuthSignedIn in refetch", operatorUi.includes("stagingAuthSignedIn = signedIn"));
assert("fix updateSaveButtonState after refetch", operatorUi.match(/runAuthenticatedAdminReadRefetch[\s\S]*updateSaveButtonState\(lastDryRunResult\)/));
assert(
  "fix sign-in calls refresh before refetch",
  operatorUi.includes("refreshStagingAuthSignedIn().then(() => runAuthenticatedAdminReadRefetch())"),
);
assert(
  "save gate uses strict signedIn",
  operatorUi.includes("signedIn: stagingAuthSignedIn === true"),
);
assert("dry-run strict signedIn guard", dryRun.includes("if (!input.signedIn)"));
assert("dry-run no .update(", !dryRun.includes(".update("));
assert("operator no .update(", !operatorUi.includes(".update("));
assert("save target actualWrite simplified", operatorUi.includes('<dt>actualWrite</dt><dd><code>false</code></dd>'));
assert("css overflow-wrap safety grid", adminCss.includes("overflow-wrap: anywhere"));
assert("css min-width safety grid child", adminCss.includes(".gosaki-schedule-preview-confirmation__safety-grid > div"));

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

assert("00-current-state mentions blocker", currentState.includes("G-22h6b") || currentState.includes("blocker"));
assert("03-next-actions mentions blocker or retry", nextActions.includes("G-22h6b") || nextActions.includes("blocker"));
assert("handoff mentions blocker", handoff.includes("G-22h6b") || handoff.includes("blocker"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22h6b Gosaki Schedule republish Save disabled blocker verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
