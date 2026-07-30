/**
 * CMS Core v2 — schedule-read ↔ Gosaki Wix extractor decoupling verifier.
 * Offline: synthetic fixtures · no Supabase · no package · no FTP.
 *
 * Run: node scripts/verify-cms-core-v2-schedule-read-extractor-decoupling.mjs
 * npm: verify:cms-core-v2-schedule-read-extractor-decoupling
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SEED_ROW_NORMALIZED,
  SEED_ROW_RAW,
  STATIC_FALLBACK_ENVELOPE_KEYS,
} from "./lib/cms-core-v2-schedule-read-extractor-decoupling-fixtures.mjs";
import {
  gosakiScheduleStaticFallback,
  loadGosakiScheduleDataForBuild,
} from "./lib/gosaki-schedule-read-adapter.mjs";
import {
  GOSAKI_SCHEDULE_SITE_CONFIG,
  loadScheduleDataForBuild,
  normalizeScheduleRecord,
} from "./lib/supabase-schedule-read.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const ADAPTER = path.join(__dirname, "lib/gosaki-schedule-read-adapter.mjs");
const FIXTURES = path.join(
  __dirname,
  "lib/cms-core-v2-schedule-read-extractor-decoupling-fixtures.mjs",
);
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-read-extractor-decoupling.md",
);

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function deepEqual(name, actual, expected) {
  try {
    assertNode.deepStrictEqual(actual, expected);
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(err instanceof Error ? err.message : String(err));
  }
}

assert("core exists", fs.existsSync(CORE));
assert("adapter exists", fs.existsSync(ADAPTER));
assert("fixtures exist", fs.existsSync(FIXTURES));
assert("doc exists", fs.existsSync(DOC));

const coreSrc = fs.readFileSync(CORE, "utf8");
const adapterSrc = fs.readFileSync(ADAPTER, "utf8");

assert(
  "Core has no gosaki-wix-schedule-extractor import",
  !/from ["']\.\/gosaki-wix-schedule-extractor/.test(coreSrc),
);
assert(
  "Core has no extractAllGosakiScheduleSeeds",
  !/\bextractAllGosakiScheduleSeeds\b/.test(coreSrc),
);
assert(
  "Core has no loadGosakiScheduleDataForBuild export",
  !/export async function loadGosakiScheduleDataForBuild/.test(coreSrc),
);
assert(
  "Core uses site-registry GOSAKI_SITE_KEY",
  /from ["']\.\/site-registry\.mjs["']/.test(coreSrc) && /GOSAKI_SITE_KEY/.test(coreSrc),
);
assert(
  "Adapter imports extractor",
  /from ["']\.\/gosaki-wix-schedule-extractor\.mjs["']/.test(adapterSrc),
);
assert(
  "Adapter exports loadGosakiScheduleDataForBuild",
  /export async function loadGosakiScheduleDataForBuild/.test(adapterSrc),
);

deepEqual(
  "normalizeScheduleRecord deep-equal fixture",
  normalizeScheduleRecord({ ...SEED_ROW_RAW }),
  { ...SEED_ROW_NORMALIZED },
);

deepEqual(
  "GOSAKI_SCHEDULE_SITE_CONFIG.siteSlug === GOSAKI_SITE_KEY",
  GOSAKI_SCHEDULE_SITE_CONFIG.siteSlug,
  GOSAKI_SITE_KEY,
);

const emptyEnv = {
  PUBLIC_SUPABASE_URL: "",
  PUBLIC_SUPABASE_ANON_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
};

const emptyInputDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "cms-core-v2-schedule-read-empty-"),
);

const coreInjected = await loadScheduleDataForBuild({
  siteSlug: GOSAKI_SITE_KEY,
  inputDir: emptyInputDir,
  env: emptyEnv,
  toolRoot: TOOL_ROOT,
  staticFallback: async () => [normalizeScheduleRecord({ ...SEED_ROW_RAW })],
  logPrefix: "decoupling-fixture",
});

assert(
  "injected fallback scheduleDataSource",
  coreInjected.scheduleDataSource === "static-fallback",
);
assert(
  "injected fallbackReason supabase_env_missing",
  coreInjected.fallbackReason === "supabase_env_missing",
);
deepEqual("injected schedules[0] deep-equal", coreInjected.schedules[0], {
  ...SEED_ROW_NORMALIZED,
});
assert("injected rowCount 1", coreInjected.rowCount === 1);
assert("injected siteSlug", coreInjected.siteSlug === GOSAKI_SITE_KEY);
for (const key of STATIC_FALLBACK_ENVELOPE_KEYS) {
  assert(`envelope has ${key}`, Object.prototype.hasOwnProperty.call(coreInjected, key));
}

const adapterBundle = await loadGosakiScheduleDataForBuild({
  inputDir: emptyInputDir,
  siteSlug: GOSAKI_SITE_KEY,
  env: emptyEnv,
  toolRoot: TOOL_ROOT,
});

assert("adapter empty-dir dataSource wix-html", adapterBundle.scheduleDataSource === "wix-html");
assert("adapter siteSlug", adapterBundle.siteSlug === GOSAKI_SITE_KEY);
assert(
  "adapter empty fallbackReason extractor_empty",
  adapterBundle.fallbackReason === "extractor_empty",
);
deepEqual("adapter empty schedules", adapterBundle.schedules, []);
assert("adapter empty rowCount 0", adapterBundle.rowCount === 0);

const mapped = gosakiScheduleStaticFallback(emptyInputDir);
deepEqual("adapter staticFallback empty maps to []", mapped, []);
assert(
  "gosakiScheduleStaticFallback is function",
  typeof gosakiScheduleStaticFallback === "function",
);

try {
  fs.rmSync(emptyInputDir, { recursive: true, force: true });
} catch {
  /* ignore */
}

if (failed > 0) {
  console.error(`\nFAIL schedule-read-extractor-decoupling: ${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\nOK schedule-read-extractor-decoupling: ${passed} passed`);
process.exit(0);
