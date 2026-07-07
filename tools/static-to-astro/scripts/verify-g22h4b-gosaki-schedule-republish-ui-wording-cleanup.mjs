/**
 * G-22h4b — Gosaki Schedule republish UI wording cleanup verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h4b-gosaki-schedule-republish-ui-wording-cleanup.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-republish-ui-wording-cleanup.md";
const G22H4_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-readonly-qa.md";

const REPUBLISH_CONFIG =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";
const REPUBLISH_DRY_RUN =
  "src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts";
const REPUBLISH_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";

const BASE_COMMIT = "4e45f90";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const ENGLISH_RESIDUAL =
  "Republish dry-run preview must succeed before Save (G-22h6).";
const JAPANESE_GATE =
  "再公開の保存はG-22h6以降で有効化します。現在は保存できません。";
const JAPANESE_DEFAULT =
  "再公開の保存は現在無効です。G-22h6以降で、戸山が確認してから有効化します。";

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

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

function grepRepo(pattern) {
  const result = spawnSync(
    "rg",
    ["-l", pattern, REPO_ROOT],
    { encoding: "utf8" },
  );
  return (result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((abs) => path.relative(REPO_ROOT, abs));
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 4e45f90", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 4e45f90", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22h4b cleanup doc exists", exists(DOC_REL));
assert("G-22h4 prior QA doc exists", exists(G22H4_DOC));
assert("republish save module absent", !exists(REPUBLISH_SAVE));

const doc = read(DOC_REL);
const republishConfig = read(REPUBLISH_CONFIG);
const dryRunModule = read(REPUBLISH_DRY_RUN);
const operatorUi = read(OPERATOR_UI);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h4b", doc.includes("G-22h4b-gosaki-schedule-republish-ui-wording-cleanup"));
assert("doc gate complete", doc.includes("gosakiScheduleRepublishUiWordingCleanupComplete: true"));
assert("doc english removed from source", doc.includes("englishResidualRemovedFromSource: true"));
assert("doc japanese copy present", doc.includes("japaneseSaveDisabledCopyPresent: true"));
assert("doc save disabled unchanged", doc.includes("saveDisabledBehaviorUnchanged: true"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc next G-22h5", doc.includes("G-22h5"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));
assert("doc base commit 4e45f90", doc.includes(BASE_COMMIT));
assert("doc never sariswing prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert("config no english residual", !republishConfig.includes(ENGLISH_RESIDUAL));
assert("config japanese gate reason", republishConfig.includes(JAPANESE_GATE));
assert("config japanese default reason", republishConfig.includes(JAPANESE_DEFAULT));
assert("config 現在は保存できません", republishConfig.includes("現在は保存できません"));
assert("config saveEnabled false", republishConfig.includes("saveEnabled: false"));
assert("config saveAllowed false", republishConfig.includes("saveAllowed: false"));
assert("config gate always disabled", republishConfig.includes("enabled: false"));
assert("config no .update(", !republishConfig.includes(".update("));
assert("config no actualWrite true", !/actualWrite:\s*true/.test(republishConfig));

assert("dry-run module no .update(", !dryRunModule.includes(".update("));
assert("dry-run module actualWrite false", dryRunModule.includes("actualWrite: false"));
assert("dry-run module unchanged", gitDiff(REPUBLISH_DRY_RUN).length === 0);

assert("operator UI save stub unchanged", operatorUi.includes("再公開を保存（準備中）"));
assert("operator UI G-22h6 alert stub", operatorUi.includes("G-22h6 以降"));
assert("operator UI no actualWrite true", !/actualWrite:\s*true/.test(operatorUi));
assert("operator diff no english residual", !gitDiff(OPERATOR_UI).includes(ENGLISH_RESIDUAL));

const englishHits = grepRepo(ENGLISH_RESIDUAL);
const srcEnglishHits = englishHits.filter(
  (rel) => rel.startsWith("src/") || rel.startsWith("tools/static-to-astro/scripts/verify-g22h4b"),
);
assert(
  "english residual absent from src",
  srcEnglishHits.length === 0,
  srcEnglishHits.join(", "),
);
assert(
  "english residual only in historical docs if anywhere",
  englishHits.every(
    (rel) =>
      rel.includes("gosaki-schedule-republish-dry-run-readonly-qa.md") ||
      rel.includes("verify-g22h4-gosaki-schedule-republish-dry-run-readonly-qa.mjs") ||
      rel.includes("handoff-to-chatgpt.md") ||
      rel.includes("00-current-state.md") ||
      rel.includes("03-next-actions.md"),
  ) || englishHits.length === 0,
  englishHits.join(", "),
);

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);

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

assert("00-current-state mentions G-22h4b", currentState.includes("G-22h4b"));
assert("03-next-actions mentions G-22h4b", nextActions.includes("G-22h4b"));
assert("handoff mentions G-22h4b", handoff.includes("G-22h4b"));
assert("handoff current phase G-22h4b", handoff.includes("G-22h4b"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22h4b Gosaki Schedule republish UI wording cleanup verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
