/**
 * CMS Core v2 — Schedule TBD non-dry-run staging planning (offline).
 *
 * npm: verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning
 *
 * Docs + inventory checks only. No runtime wire / Edge / env / DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.md",
);
const DRY_RUN_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-schedule-tbd-date-save-dry-run.md");
const PAYLOAD = path.join(TOOL_ROOT, "scripts/lib/schedule-tbd-save-payload.mjs");
const DRY_RUN_TS = path.join(REPO_ROOT, "src/lib/admin/staging-data/schedule-tbd-save-dry-run.ts");
const OPERATOR = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
);
const EDGE = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
);
const INSERT_ADAPTER = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/schedule-insert-write-adapter.ts",
);
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const LEGACY_ID = "schedule-2026-11-001";
const APPROVAL_ID = "cms-core-v2-schedule-tbd-create-non-dry-run-oneshot";
const CLIENT_ARM = "PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED";
const SERVER_ARM = "ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED";

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

assert("planning doc exists", fs.existsSync(DOC));
const doc = fs.readFileSync(DOC, "utf8");

assert("phase id", /cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning/.test(doc));
assert("READY_FOR implementation true", /READY_FOR_TBD_NON_DRY_RUN_IMPLEMENTATION:\s*true/.test(doc));
assert("READY_FOR execution false", /READY_FOR_TBD_NON_DRY_RUN_EXECUTION:\s*false/.test(doc));
assert("RUNTIME_CHANGED false", /RUNTIME_CHANGED:\s*false/.test(doc));
assert("EDGE_CHANGED false", /EDGE_CHANGED:\s*false/.test(doc));
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));

assert("production STOP ref", doc.includes(PRODUCTION_REF));
assert("staging exact ref", doc.includes(STAGING_REF));
assert("production STOP wording", /production STOP|Production STOP|vsbvndwuajjhnzpohghh/.test(doc));

assert("dual arm client env", doc.includes(CLIENT_ARM));
assert("dual arm server env", doc.includes(SERVER_ARM));
assert("dry-run false required", /PUBLIC_ADMIN_WRITE_DRY_RUN/.test(doc) && /false/.test(doc));
assert("tbdWriteEnabled mentioned", /tbdWriteEnabled/.test(doc));
assert("create-only", /CREATE-only|create only|create-only/i.test(doc));
assert("update deferred", /UPDATE.*defer|not exposed|CREATE \+ UPDATE same slice.*Rejected/i.test(doc));

assert("test legacy_id fixed", doc.includes(LEGACY_ID));
assert("published false", /published[`\s]*\|[`\s]*\*\*`?false`?\*\*|published.*false/i.test(doc));
assert("title marker", /【CMS Kit staging】TBD create oneshot PoC/.test(doc));
assert("date_status tbd", /date_status[`\s]*\|[`\s]*`?tbd`?/.test(doc) || /date_status.*tbd/.test(doc));
assert("month-known 2026-11", /2026-11/.test(doc));
assert("approval id", doc.includes(APPROVAL_ID));

assert("existing 79", /\b79\b/.test(doc));
assert("mio 0", /mio\s*0|mio.*\*\*0\*\*|Mio 0/i.test(doc));
assert("no broad delete", /Broad DELETE|broad DELETE|forbidden/i.test(doc));
assert("rollback exact id", /inserted_id|exact inserted UUID/.test(doc));
assert("rollback site_slug", /site_slug.*=.*gosaki-piano|site_slug` \| `gosaki-piano`/.test(doc));
assert("rollback legacy_id", doc.includes(LEGACY_ID));
assert("arms OFF priority", /arms OFF|即時 OFF|arms 即時 OFF/i.test(doc));

assert("runbook A", /### A\.|A\. 実行前 SELECT/.test(doc));
assert("runbook B", /### B\.|B\. arms OFF/.test(doc));
assert("runbook C", /### C\.|C\. arms ON/.test(doc));
assert("runbook D", /### D\.|D\. one-shot create/.test(doc));
assert("runbook E", /### E\.|E\. Save/.test(doc));
assert("runbook F", /### F\.|F\. 実行後 SELECT/.test(doc));
assert("runbook G", /### G\.|G\. exact rollback/.test(doc));
assert("runbook H", /### H\.|H\. cleanup/.test(doc));
assert("runbook I", /### I\.|I\. arms/.test(doc));

assert("Path B selected", /Path B|Shell CREATE-only/.test(doc));
assert("Edge not first", /Edge CREATE first|Edge.*Rejected|Edge \*\*not\*\* changed/.test(doc));
assert("next implementation phase", /cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation/.test(doc));

// --- runtime / Edge / adapters unchanged by this planning phase ---
const dryRunTs = fs.readFileSync(DRY_RUN_TS, "utf8");
const operatorSrc = fs.readFileSync(OPERATOR, "utf8");
const edgeSrc = fs.existsSync(EDGE) ? fs.readFileSync(EDGE, "utf8") : "";
const insertSrc = fs.readFileSync(INSERT_ADAPTER, "utf8");
const payloadSrc = fs.readFileSync(PAYLOAD, "utf8");

assert(
  "dry-run still forces tbdWriteEnabled false",
  /tbdWriteEnabled:\s*false/.test(dryRunTs),
);
assert(
  "operator still blocks TBD Save message",
  /TBD保存はまだ有効化されていません/.test(operatorSrc),
);
assert(
  "operator has no TBD create oneshot Save wire yet",
  !/cms-core-v2-schedule-tbd-create-non-dry-run-oneshot/.test(operatorSrc),
);
assert(
  "operator has no new TBD create arm env yet",
  !new RegExp(CLIENT_ARM).test(operatorSrc),
);
assert(
  "Edge handler has no TBD oneshot approval",
  !/cms-core-v2-schedule-tbd-create-non-dry-run-oneshot/.test(edgeSrc),
);
assert(
  "Edge has no tbdWriteEnabled / tbdDryRunEnabled wire",
  !/tbdWriteEnabled|tbdDryRunEnabled/.test(edgeSrc),
);
assert("insert adapter has no TBD oneshot approval yet", !new RegExp(APPROVAL_ID).test(insertSrc));
assert(
  "payload SoT still present (unchanged role)",
  /buildScheduleTbdSavePayload/.test(payloadSrc) && /tbdDryRunEnabled/.test(payloadSrc),
);

assert("dry-run completion doc exists", fs.existsSync(DRY_RUN_DOC));

assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning/.test(
    fs.readFileSync(PKG, "utf8"),
  ),
);
assert(
  "Safety Suite registers planning",
  /schedule-tbd-date-save-non-dry-run-staging-planning/.test(fs.readFileSync(SUITE, "utf8")),
);

const baseline = spawnSync(
  "node",
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baseline.status === 0, baseline.stderr || baseline.stdout);

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
