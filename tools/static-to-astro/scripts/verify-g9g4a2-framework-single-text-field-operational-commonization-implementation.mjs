/**
 * G-9g4a2 — framework single-text-field operational commonization implementation (static only).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2-framework-single-text-field-operational-commonization-implementation";
const DOC_NAME = "staging-shell-schedule-single-text-field-operational-commonization-implementation.md";
const C1_COMMIT = "1e643e7";
const C2_COMMIT = "9c3714c";
const C3_COMMIT = "1c1fb32";
const PLANNING_COMMIT = "e267da3";
const OPEN_TIME_UI_PREFIX = "site-slug-edit-g9g4a2a-open-time-only";
const START_TIME_UI_PREFIX = "site-slug-edit-g9g4a2b-start-time-only";
const PRICE_UI_PREFIX = "site-slug-edit-g9g4a2c-price-only";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function readTool(relPath) {
  return fs.readFileSync(path.join(TOOL_ROOT, relPath), "utf8");
}

const docPath = path.join(TOOL_ROOT, `docs/${DOC_NAME}`);
assert("implementation doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

const registrySrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-registry.ts",
);
const genericConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-config.ts",
);
const genericSaveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-single-text-field-operational-save.ts",
);
const genericEditUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-edit-ui.ts",
);
const openTimeSaveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-open-time-only-operational-save.ts",
);
const openTimeEditUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-edit-ui.ts",
);
const astroSrc = readTool(
  "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
);
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("phase in doc", docSrc.includes(PHASE));
assert("status complete in doc", docSrc.includes("**complete**"));
assert("C1 commit in doc", docSrc.includes(C1_COMMIT));
assert("C2 commit in doc", docSrc.includes(C2_COMMIT));
assert("C3 commit in doc", docSrc.includes(C3_COMMIT));
assert("planning commit in doc", docSrc.includes(PLANNING_COMMIT));
assert("C1 summary in doc", docSrc.includes("registry") && docSrc.includes("generic config"));
assert("C2 summary in doc", docSrc.includes("generic Save") && docSrc.includes("save delegate"));
assert("C3 summary in doc", docSrc.includes("generic edit UI") && docSrc.includes("Astro"));
assert(
  "target fields in doc",
  docSrc.includes("open_time") && docSrc.includes("start_time") && docSrc.includes("price"),
);
assert(
  "excluded fields in doc",
  docSrc.includes("description") && docSrc.includes("title") && docSrc.includes("venue"),
);
assert("open_time parity in doc", docSrc.includes(OPEN_TIME_UI_PREFIX));
assert(
  "manual round-trip reduction policy in doc",
  docSrc.includes("manual round-trip") &&
    docSrc.includes("start_time") &&
    docSrc.includes("price"),
);
assert(
  "next not start_time-only manual execution",
  docSrc.includes("not") &&
    (docSrc.includes("start_time-only manual") || docSrc.includes("start_time`-only manual")),
);
assert("readyForAnyDbWrite false in doc", docSrc.includes("readyForAnyDbWrite: false"));
assert("no Save click marker in doc", docSrc.includes("Save clicked (this phase) | **no**"));
assert("no Preview click marker in doc", docSrc.includes("Preview clicked (Cursor/AI) | **no**"));
assert("no DB write marker in doc", docSrc.includes("DB write executed (this phase) | **no**"));
assert("service_role not used in doc", docSrc.includes("service_role") && docSrc.includes("not used"));

assert(
  "registry open_time start_time price",
  registrySrc.includes('"open_time"') &&
    registrySrc.includes('"start_time"') &&
    registrySrc.includes('"price"'),
);
assert("generic config exists", genericConfigSrc.includes("getSingleTextFieldOperationalConfig"));
assert(
  "generic Save exists",
  genericSaveSrc.includes("executeSingleTextFieldOperationalNonDryRunSave"),
);
assert(
  "generic edit UI exists",
  genericEditUiSrc.includes("initAllSingleTextFieldOperationalEditUi"),
);
assert(
  "open_time save delegate preserved",
  openTimeSaveSrc.includes("executeG9G4a2aOpenTimeOnlyNonDryRunSave") &&
    openTimeSaveSrc.includes("executeSingleTextFieldOperationalNonDryRunSave"),
);
assert(
  "open_time edit-ui delegate preserved",
  openTimeEditUiSrc.includes("initG9g4a2aOpenTimeOnlyOperationalEditUi") &&
    openTimeEditUiSrc.includes("staging-schedule-single-text-field-operational-edit-ui"),
);

assert("open_time DOM id in astro", astroSrc.includes(`id="${OPEN_TIME_UI_PREFIX}-save-btn"`));
assert(
  "start_time panel in astro",
  astroSrc.includes(`id="${START_TIME_UI_PREFIX}-dry-run-preview-btn"`),
);
assert(
  "price panel in astro",
  astroSrc.includes(`id="${PRICE_UI_PREFIX}-dry-run-preview-btn"`),
);

assert("generic Save no service_role", !genericSaveSrc.includes("service_role"));
assert("generic edit UI no service_role", !genericEditUiSrc.includes("service_role"));
assert(
  "generic Save schedule_months safety only",
  genericSaveSrc.includes("schedule_months") && !genericSaveSrc.match(/schedule_months.*insert/i),
);
assert("implementation verifier no /admin changes", !docSrc.includes("src/pages/admin"));

assert(
  "manual round-trip policy in 00-current-state",
  currentStateSrc.includes("manual round-trip") || currentStateSrc.includes("Manual round-trip"),
);
assert(
  "manual round-trip policy in 03-next-actions",
  nextActionsSrc.includes("manual round-trip") || nextActionsSrc.includes("Manual round-trip"),
);
assert(
  "manual round-trip policy in handoff",
  handoffSrc.includes("manual round-trip") || handoffSrc.includes("Manual round-trip"),
);
assert(
  "C4 complete uncommitted in AI context",
  currentStateSrc.includes("1c1fb32") &&
    (currentStateSrc.includes("C4") || currentStateSrc.includes("implementation complete")),
);
assert(
  "next not start_time-only in 03-next-actions",
  nextActionsSrc.includes("not") && nextActionsSrc.includes("start_time"),
);
assert(
  "readyForAnyDbWrite false in handoff",
  handoffSrc.includes("readyForAnyDbWrite: false"),
);

assert(
  "C1 verifier script exists",
  fs.existsSync(
    path.join(
      TOOL_ROOT,
      "scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c1.mjs",
    ),
  ),
);
assert(
  "C2 verifier script exists",
  fs.existsSync(
    path.join(
      TOOL_ROOT,
      "scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c2.mjs",
    ),
  ),
);
assert(
  "C3 verifier script exists",
  fs.existsSync(
    path.join(
      TOOL_ROOT,
      "scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c3.mjs",
    ),
  ),
);
assert(
  "verifier results recorded in doc",
  docSrc.includes("69 passed") && docSrc.includes("34 passed") && docSrc.includes("47 passed"),
);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
