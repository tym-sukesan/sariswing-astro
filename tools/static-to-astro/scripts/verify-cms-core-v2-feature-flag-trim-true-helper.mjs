/**
 * CMS Core v2 — feature-flag trim-true helper verifier.
 * Offline · no network / DB / package / FTP.
 *
 * Run: node scripts/verify-cms-core-v2-feature-flag-trim-true-helper.mjs
 * npm: verify:cms-core-v2-feature-flag-trim-true
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABOUT_PATH_BAKE_ENV_CASES,
  FEATURE_FLAG_TRIM_TRUE_CASES,
  legacyFeatureFlagTrimTrue,
} from "./lib/cms-core-v2-feature-flag-trim-true-fixtures.mjs";
import { isFeatureFlagTrimTrue } from "./lib/feature-flag-trim-true-utils.mjs";
import { isSaveArmExactTrue } from "./lib/save-arm-utils.mjs";
import { isExactTrue } from "./lib/cms-core-v2-youtube-supabase-contract.mjs";
import { resolveAboutAdminPathBakeFromEnv } from "./lib/package-run-marker.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/feature-flag-trim-true-utils.mjs");
const SAVE_ARM = path.join(__dirname, "lib/save-arm-utils.mjs");
const FEATURES = path.join(__dirname, "lib/site-cms-features.mjs");
const MARKER = path.join(__dirname, "lib/package-run-marker.mjs");
const YT_CONTRACT = path.join(__dirname, "lib/cms-core-v2-youtube-supabase-contract.mjs");
const DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-feature-flag-trim-true-helper.md");

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
assert("doc exists", fs.existsSync(DOC));
assert("save-arm helper distinct file", fs.existsSync(SAVE_ARM));

const coreSrc = fs.readFileSync(CORE, "utf8");
const featuresSrc = fs.readFileSync(FEATURES, "utf8");
const markerSrc = fs.readFileSync(MARKER, "utf8");
const ytSrc = fs.readFileSync(YT_CONTRACT, "utf8");
const docSrc = fs.readFileSync(DOC, "utf8");

assert("core exports isFeatureFlagTrimTrue", /export function isFeatureFlagTrimTrue/.test(coreSrc));
assert("core uses trim === true", /\.trim\(\)\s*===\s*"true"/.test(coreSrc));
assert("core has no gosaki", !/gosaki-/i.test(coreSrc));
assert("core ≠ save-arm-utils import", !/save-arm-utils/.test(coreSrc));
assert("core does not export isSaveArmExactTrue", !/export function isSaveArmExactTrue/.test(coreSrc));
assert(
  "features uses isFeatureFlagTrimTrue for BUILD_READ",
  featuresSrc.includes("isFeatureFlagTrimTrue") &&
    featuresSrc.includes("CMS_KIT_SITE_EMBEDS_BUILD_READ") &&
    featuresSrc.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ") &&
    !/SITE_EMBEDS_BUILD_READ[^\n]*\.trim\(\)/.test(featuresSrc) &&
    !/SITE_PAGE_FIELDS_BUILD_READ[^\n]*\.trim\(\)/.test(featuresSrc),
);
assert(
  "marker uses trim-true for PATH/BUILD_READ",
  markerSrc.includes("isFeatureFlagTrimTrue") &&
    markerSrc.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED") &&
    markerSrc.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ"),
);
assert(
  "marker Save UI arm stays exact-true",
  markerSrc.includes("isSaveArmExactTrue") &&
    /aboutSaveUiArmed:\s*isSaveArmExactTrue/.test(markerSrc),
);
assert(
  "youtube isExactTrue delegates to Core",
  /function isExactTrue[\s\S]*?isFeatureFlagTrimTrue/.test(ytSrc),
);
assert("doc names SoT", docSrc.includes("feature-flag-trim-true-utils.mjs"));
assert("doc separates Save arm", /isSaveArmExactTrue/.test(docSrc));

for (const c of FEATURE_FLAG_TRIM_TRUE_CASES) {
  assert(
    `helper ${c.label}`,
    isFeatureFlagTrimTrue(c.raw) === c.trimTrue,
  );
  assert(
    `legacy deep-eq ${c.label}`,
    isFeatureFlagTrimTrue(c.raw) === legacyFeatureFlagTrimTrue(c.raw),
  );
  assert(
    `youtube isExactTrue deep-eq ${c.label}`,
    isExactTrue(c.raw) === isFeatureFlagTrimTrue(c.raw),
  );
  assert(
    `Save arm boundary ${c.label}`,
    isSaveArmExactTrue(c.raw) === c.exactTrue,
  );
}

// Critical divergence: padded true
assert(
  "padded true: trim-true yes · Save arm no",
  isFeatureFlagTrimTrue(" true ") === true && isSaveArmExactTrue(" true ") === false,
);

let threw = false;
try {
  isFeatureFlagTrimTrue({ evil: true });
  isFeatureFlagTrimTrue(Symbol("x"));
} catch {
  threw = true;
}
assert("never throws on junk objects", !threw);

for (const c of ABOUT_PATH_BAKE_ENV_CASES) {
  deepEqual(
    `bake ${c.label}`,
    resolveAboutAdminPathBakeFromEnv(c.env),
    c.expected,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-feature-flag-trim-true-helper");
