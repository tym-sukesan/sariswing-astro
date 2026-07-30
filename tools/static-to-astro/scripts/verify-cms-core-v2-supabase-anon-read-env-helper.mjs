/**
 * CMS Core v2 — supabase anon read env helper verifier.
 * Offline only — no network / DB / package / FTP.
 *
 * Run: node scripts/verify-cms-core-v2-supabase-anon-read-env-helper.mjs
 * npm: verify:cms-core-v2-supabase-anon-read-env
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANON_ENV_ALIAS,
  ANON_ENV_BLANK,
  ANON_ENV_SERVICE_ROLE,
  ANON_ENV_VALID,
  ANON_ENV_WHITESPACE,
} from "./lib/cms-core-v2-supabase-anon-read-env-fixtures.mjs";
import {
  DEFAULT_SUPABASE_ANON_READ_TOOL_ROOT,
  loadDotEnvLocal,
  resolveSupabaseAnonReadEnv,
} from "./lib/supabase-anon-read-env-utils.mjs";
import { resolveSupabaseAnonReadEnv as resolveFromScheduleRead } from "./lib/supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/supabase-anon-read-env-utils.mjs");
const SCHEDULE = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const FEATURES = path.join(__dirname, "lib/site-cms-features.mjs");
const DISCO = path.join(__dirname, "lib/supabase-discography-read.mjs");
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-supabase-anon-read-env-helper.md",
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

assert("core module exists", fs.existsSync(CORE));
assert("doc exists", fs.existsSync(DOC));

const coreSrc = fs.readFileSync(CORE, "utf8");
const scheduleSrc = fs.readFileSync(SCHEDULE, "utf8");
const featuresSrc = fs.readFileSync(FEATURES, "utf8");
const discoSrc = fs.readFileSync(DISCO, "utf8");

assert("core has no gosaki import", !/gosaki-/i.test(coreSrc));
assert("core rejects service_role", /service\[_-\]\?role/i.test(coreSrc));
assert(
  "schedule re-exports Core",
  scheduleSrc.includes('from "./supabase-anon-read-env-utils.mjs"') &&
    scheduleSrc.includes("resolveSupabaseAnonReadEnv"),
);
assert(
  "schedule no local loadDotEnvLocal body",
  !/function loadDotEnvLocal/.test(scheduleSrc),
);
assert(
  "features import Core anon env",
  featuresSrc.includes("supabase-anon-read-env-utils.mjs") &&
    !featuresSrc.includes("supabase-schedule-read.mjs"),
);
assert(
  "discography import Core anon env",
  discoSrc.includes('from "./supabase-anon-read-env-utils.mjs"'),
);
assert(
  "doc names SoT",
  fs.readFileSync(DOC, "utf8").includes("supabase-anon-read-env-utils.mjs"),
);

assert(
  "blank env → null (toolRoot null skips .env.local)",
  resolveSupabaseAnonReadEnv(ANON_ENV_BLANK, null) === null,
);
assert(
  "whitespace env → null",
  resolveSupabaseAnonReadEnv(ANON_ENV_WHITESPACE, null) === null,
);
assert(
  "service_role key → null",
  resolveSupabaseAnonReadEnv(ANON_ENV_SERVICE_ROLE, null) === null,
);

const valid = resolveSupabaseAnonReadEnv(ANON_ENV_VALID, null);
assert("valid PUBLIC_ pair", valid?.supabaseUrl === ANON_ENV_VALID.PUBLIC_SUPABASE_URL);
assert("valid PUBLIC_ anonKey", valid?.anonKey === ANON_ENV_VALID.PUBLIC_SUPABASE_ANON_KEY);

const alias = resolveSupabaseAnonReadEnv(ANON_ENV_ALIAS, null);
assert("alias SUPABASE_ pair", alias?.supabaseUrl === ANON_ENV_ALIAS.SUPABASE_URL);
assert("alias anonKey", alias?.anonKey === ANON_ENV_ALIAS.SUPABASE_ANON_KEY);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cms-core-anon-env-"));
try {
  fs.writeFileSync(
    path.join(tmp, ".env.local"),
    [
      "PUBLIC_SUPABASE_URL=https://from-dotenv.example",
      "PUBLIC_SUPABASE_ANON_KEY=from-dotenv-key",
      "",
    ].join("\n"),
    "utf8",
  );
  const localOnly = loadDotEnvLocal(tmp);
  assert("loadDotEnvLocal url", localOnly.PUBLIC_SUPABASE_URL === "https://from-dotenv.example");
  assert("loadDotEnvLocal key", localOnly.PUBLIC_SUPABASE_ANON_KEY === "from-dotenv-key");

  const mergedOverride = resolveSupabaseAnonReadEnv(
    {
      PUBLIC_SUPABASE_URL: "https://from-process.example",
      PUBLIC_SUPABASE_ANON_KEY: "from-process-key",
    },
    tmp,
  );
  assert(
    "processEnv overrides .env.local url",
    mergedOverride?.supabaseUrl === "https://from-process.example",
  );
  assert(
    "processEnv overrides .env.local key",
    mergedOverride?.anonKey === "from-process-key",
  );

  // Blank strings in processEnv override local (merge {...local, ...processEnv}).
  assert(
    "explicit blank processEnv overrides .env.local → null",
    resolveSupabaseAnonReadEnv(ANON_ENV_BLANK, tmp) === null,
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const viaSchedule = resolveFromScheduleRead(ANON_ENV_VALID, null);
assert(
  "schedule re-export identical",
  viaSchedule?.supabaseUrl === valid?.supabaseUrl &&
    viaSchedule?.anonKey === valid?.anonKey,
);

assert(
  "default tool root points at tools/static-to-astro",
  path.basename(DEFAULT_SUPABASE_ANON_READ_TOOL_ROOT) === "static-to-astro" ||
    DEFAULT_SUPABASE_ANON_READ_TOOL_ROOT.endsWith(`${path.sep}static-to-astro`),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-supabase-anon-read-env-helper");
