/**
 * G-13d1 — Gosaki Event A PoC cleanup execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1-event-a-poc-cleanup-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-execution-result.md";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const FINAL_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-final-preflight.md";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-03-007";
const APPROVAL_ID = "G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

const EXPECTED_AFTER = {
  title: "<Duo>",
  venue: "川崎 ぴあにしも",
  open_time: "15:00",
  start_time: "15:30",
  price: "3,000円",
};

const BEFORE_UPDATED_AT = "2026-06-22T15:01:47.671778+00:00";
const AFTER_UPDATED_AT = "2026-06-27T05:10:58.008982+00:00";

const CHANGED_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
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

const doc = read(DOC_REL);
const configSrc = read(CONFIG_REL);

assert("execution result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13d1 execution result",
  doc.includes("G-13d1-event-a-poc-cleanup-execution-result"),
);
assert("doc operator manual save once", doc.includes("operator manual") && doc.includes("once"));
assert("doc errorCode none", doc.includes("errorCode: (none)"));
assert("doc no cursor save", doc.includes("cursorClickedSave: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc Event B not touched", doc.includes("not touched") && doc.includes("aa440e29"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc approval id", doc.includes(APPROVAL_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc before updated_at", doc.includes(BEFORE_UPDATED_AT));
assert("doc after updated_at", doc.includes(AFTER_UPDATED_AT));
assert("doc G-13e next phase", doc.includes("G-13e-gosaki-schedule-event-a-poc-cleanup-public-reflection"));
assert("doc ready for G-13e gate", doc.includes("readyForG13ePublicReflection: true"));
assert("doc no re-execution", doc.includes("readyForG13d1EventAPocCleanupReExecution: false"));
assert("doc no FTP this phase", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));

for (const [field, value] of Object.entries(EXPECTED_AFTER)) {
  assert(`doc after ${field}`, doc.includes(value));
}

assert(
  "doc description seed",
  doc.includes("出演：長谷川薫vo 後藤沙紀pf") &&
    doc.includes("会場website: http://pubhpp.com/"),
);
assert("doc PoC marker removal noted", doc.includes("G-9k6") && doc.includes("G-9k4"));

assert("config Event A target", configSrc.includes(EVENT_A_ID));
assert("config expected title", configSrc.includes(EXPECTED_AFTER.title));
assert("config expected venue", configSrc.includes(EXPECTED_AFTER.venue));
assert("config 6 changed fields", CHANGED_FIELDS.every((f) => configSrc.includes(`"${f}"`)));
assert("config no Event B id", !configSrc.includes(`= "${EVENT_B_ID}"`));

assert(
  "after updated_at newer than before",
  new Date(AFTER_UPDATED_AT).getTime() > new Date(BEFORE_UPDATED_AT).getTime(),
);

assert(
  "final preflight links exist",
  fs.existsSync(path.join(REPO_ROOT, FINAL_PREFLIGHT_REL)),
);

console.log(`\nG-13d1 Event A cleanup execution result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
