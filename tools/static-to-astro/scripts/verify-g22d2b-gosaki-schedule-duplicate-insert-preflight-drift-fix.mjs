/**
 * G-22d2b — Gosaki Schedule duplicate INSERT preflight drift fix verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d2b-gosaki-schedule-duplicate-insert-preflight-drift-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BASE_COMMIT = "428ed61";

const CONFIG = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts";
const GUARDS = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const DOCS = [
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-final-preflight.md",
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-beforeverification.md",
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-implementation.md",
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-planning.md",
];

const SLICE_DOCS = DOCS;

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 428ed61", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

const config = read(CONFIG);
const guards = read(GUARDS);
const writeAdapter = read(WRITE_ADAPTER);
const g9kSave = read(G9K_SAVE);

assert("config sort_order 70", config.includes("G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER = 70"));
assert("config no stale sort_order 140", !config.includes("G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER = 140"));
assert("guards use planned sort_order constant", guards.includes("G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER"));
assert("write adapter UPDATE-only", !writeAdapter.includes(".insert("));
assert("g9k save no insert adapter", !g9kSave.includes("insertScheduleWrite"));

for (const rel of SLICE_DOCS) {
  const text = read(rel);
  const base = path.basename(rel);
  assert(`${base} insert sort_order 70`, text.includes("`70`") || text.includes("sort_order=70"));
  assert(`${base} no slice sort_order 140`, !text.match(/\| `sort_order` \| `140`/));
  assert(`${base} source_file schedule-2026-03.html`, text.includes("schedule-2026-03.html"));
  assert(`${base} no wrong slice source_file 2026-03.html`, !text.includes("| `source_file` | `2026-03.html` |"));
  assert(`${base} planned legacy unchanged`, text.includes("schedule-2026-03-014"));
  assert(`${base} source id unchanged`, text.includes("eb1f1898-5107-4deb-a6d5-a792e0ec3f69"));
}

const beforeVerif = read("tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-beforeverification.md");
assert("beforeVerif check 07 max 60", beforeVerif.includes("07_march_max_sort_order_60"));
assert("beforeVerif expected max 60", beforeVerif.includes("max_sort_order = 60"));
assert("beforeVerif SELECT only", beforeVerif.includes("SELECT only"));
assert("beforeVerif no SQL mutations", !beforeVerif.match(/^\s*(insert|update|delete|upsert)\s+/im));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { getG22dDuplicateInsertConfig } from './src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts';

const env = {
  DEV: true,
  ENABLE_ADMIN_STAGING_SHELL: 'true',
  ENABLE_ADMIN_STAGING_WRITE: 'false',
  PUBLIC_ADMIN_WRITE_DRY_RUN: 'true',
  PUBLIC_SUPABASE_URL: 'https://kmjqppxjdnwwrtaeqjta.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'test',
} as unknown as ImportMetaEnv;

const config = getG22dDuplicateInsertConfig(env);
if (config.saveEnabled) process.exit(1);
console.log('default-disabled-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "default env save disabled",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("default-disabled-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

console.log(
  `\nG-22d2b Gosaki Schedule duplicate INSERT preflight drift fix verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
