/**
 * G-14a — Gosaki CMS completion roadmap gap inventory verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14a-gosaki-cms-completion-roadmap-gap-inventory.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-cms-completion-roadmap-gap-inventory.md";
const G13E_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-public-reflection-closure.md";
const G12D_REL =
  "tools/static-to-astro/docs/gosaki-schedule-cms-phase-boundary-planning.md";
const G10A_REL =
  "tools/static-to-astro/docs/gosaki-completion-inventory-and-next-module-selection.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const PHASE_CANDIDATES = [
  "G-14b",
  "G-13c2",
  "G-14c",
  "G-14d",
  "G-14e",
  "G-14f",
];

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

const doc = read(DOC_REL);

assert("G-14a doc exists", exists(DOC_REL));
assert(
  "doc phase G-14a",
  doc.includes("G-14a-gosaki-cms-completion-roadmap-gap-inventory"),
);
assert("doc inventory complete gate", doc.includes("gosakiCmsCompletionRoadmapGapInventoryComplete: true"));
assert("doc completion criteria section", doc.includes("Practical CMS completion criteria"));
assert("doc gap inventory", doc.includes("Gap inventory"));
assert("doc high low risk split", doc.includes("High-risk vs low-risk"));
assert("doc G-13 chain reference", doc.includes("G-13d1") && doc.includes("G-13e"));
assert("doc Event B deferred", doc.includes("G-13c2") || doc.includes("Event B"));
assert("doc YouTube section", doc.includes("YouTube"));
assert("doc shell vs online admin", doc.includes("staging shell") && doc.includes("online admin"));
assert("doc public reflection gaps", doc.includes("public reflection"));
assert("doc kit generalization", doc.includes("Kit") || doc.includes("generalization"));
assert("doc production safety", doc.includes("G-14f") || doc.includes("Production"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc FTP apply false", doc.includes("readyForAnyFutureFtpApply: false"));
assert("doc no cursor write this phase", doc.includes("cursorDbWriteExecuted: false"));
assert("doc recommended sequence", doc.includes("Recommended implementation sequence"));
assert("doc G-14b next", doc.includes("readyForG14bScheduleCmsPracticalEditingFlowDefinition: true"));

for (const phase of PHASE_CANDIDATES) {
  assert(`doc evaluates ${phase}`, doc.includes(phase));
}

assert(
  "doc excludes client preview from dev tasks",
  doc.includes("clientPreviewExcludedFromDevTasks: true") ||
    doc.includes("開発タスクに含めない"),
);
assert(
  "doc client preview not blocking",
  doc.includes("Excluded") || doc.includes("外す"),
);

assert("G-13e closure doc exists", exists(G13E_CLOSURE_REL));
assert("G-12d boundary doc exists", exists(G12D_REL));
assert("G-10a inventory doc exists", exists(G10A_REL));
assert(
  "G-13e chain complete gate",
  read(G13E_CLOSURE_REL).includes("gosakiScheduleEventAPocCleanupEventAChainComplete: true"),
);

assert(
  "gosaki admin templates exist",
  exists("tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro"),
);
assert(
  "schedule operator ui exists",
  exists("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts"),
);
assert(
  "build package script exists",
  exists("tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs"),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

console.log(
  `\nG-14a roadmap gap inventory verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
