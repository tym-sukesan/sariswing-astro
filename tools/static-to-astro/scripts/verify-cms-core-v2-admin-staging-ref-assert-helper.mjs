/**
 * CMS Core v2 — Admin staging-ref assert helper fixture verifier.
 * No network / DB / package / FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
  STAGING_SUPABASE_HOST,
  STAGING_SUPABASE_URL,
  assertStagingOnlySupabaseTarget,
  evaluateStagingOnlySupabaseTarget,
  isExactStagingSupabaseHostname,
  stringContainsProductionRef,
  stringContainsStagingRef,
} from "./lib/supabase-staging-ref-utils.mjs";
import {
  PRODUCTION_REF_STOP as ABOUT_PROD,
  STAGING_PROJECT_REF as ABOUT_STAGING,
} from "./lib/cms-core-v2-about-supabase-contract.mjs";
import {
  PRODUCTION_REF_STOP as YT_PROD,
  STAGING_PROJECT_REF as YT_STAGING,
} from "./lib/cms-core-v2-youtube-supabase-contract.mjs";
import {
  SCHEDULE_DRY_RUN_PRODUCTION_REF_STOP,
  SCHEDULE_DRY_RUN_STAGING_REF,
  assertScheduleDryRunStagingUrl,
} from "./lib/gosaki-schedule-dry-run-edge-core.mjs";
import {
  PRODUCTION_REF_STOP as DISCO_PROD,
  STAGING_PROJECT_REF as DISCO_STAGING,
  assertStagingSupabaseUrl as assertDiscographyReadbackUrl,
} from "./lib/gosaki-discography-edge-dry-run-readback.mjs";
import {
  GOSAKI_PRODUCTION_SUPABASE_REF_STOP,
  GOSAKI_STAGING_SUPABASE_REF,
} from "./lib/package-run-marker.mjs";
import {
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF as ADMIN_ENV_STAGING,
  validateGosakiStagingAdminPublicEnv,
} from "./lib/gosaki-staging-admin-public-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOC = path.resolve(
  __dirname,
  "../docs/cms-core-v2-admin-staging-ref-assert-helper.md",
);
const CORE = path.resolve(__dirname, "lib/supabase-staging-ref-utils.mjs");

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function expectThrow(name, fn, messageIncludes) {
  try {
    fn();
    failed += 1;
    console.error(`FAIL ${name} (expected throw)`);
  } catch (err) {
    const msg = String(err?.message ?? err);
    const ok = !messageIncludes || msg.includes(messageIncludes);
    if (ok) {
      passed += 1;
      console.log(`PASS ${name}`);
    } else {
      failed += 1;
      console.error(`FAIL ${name} message=${msg}`);
    }
  }
}

const STAGING_URL = `https://${STAGING_PROJECT_REF}.supabase.co`;
const PROD_URL = `https://${PRODUCTION_REF_STOP}.supabase.co`;
const UNKNOWN_URL = "https://abcdefghijklmnop.supabase.co";

assert("constants staging", STAGING_PROJECT_REF === "kmjqppxjdnwwrtaeqjta");
assert("constants production", PRODUCTION_REF_STOP === "vsbvndwuajjhnzpohghh");
assert("staging host", STAGING_SUPABASE_HOST === "kmjqppxjdnwwrtaeqjta.supabase.co");
assert("staging url", STAGING_SUPABASE_URL === STAGING_URL);

assert("eval empty", evaluateStagingOnlySupabaseTarget("").kind === "empty");
assert("eval null empty", evaluateStagingOnlySupabaseTarget(null).kind === "empty");
assert("eval staging url", evaluateStagingOnlySupabaseTarget(STAGING_URL).ok === true);
assert(
  "eval staging bare ref",
  evaluateStagingOnlySupabaseTarget(STAGING_PROJECT_REF).kind === "staging",
);
assert(
  "eval production url",
  evaluateStagingOnlySupabaseTarget(PROD_URL).code === "production_ref_stop",
);
assert(
  "eval production before staging substring",
  evaluateStagingOnlySupabaseTarget(`${PROD_URL}?x=${STAGING_PROJECT_REF}`).kind ===
    "production",
);
assert(
  "eval unknown host + staging query fail-closed",
  evaluateStagingOnlySupabaseTarget(
    `https://evil.example/callback?project=${STAGING_PROJECT_REF}`,
  ).ok === false &&
    evaluateStagingOnlySupabaseTarget(
      `https://evil.example/callback?project=${STAGING_PROJECT_REF}`,
    ).kind === "unknown",
);
assert(
  "eval arbitrary URL with staging path fail-closed",
  evaluateStagingOnlySupabaseTarget(`https://example.com/docs/${STAGING_PROJECT_REF}/x`)
    .ok === false,
);
assert(
  "eval staging host with path/query still ok",
  evaluateStagingOnlySupabaseTarget(
    `${STAGING_URL}/functions/v1/gosaki-schedule-save-dry-run?x=1`,
  ).ok === true,
);
assert(
  "eval bare production ref",
  evaluateStagingOnlySupabaseTarget(PRODUCTION_REF_STOP).kind === "production",
);
assert(
  "eval unknown",
  evaluateStagingOnlySupabaseTarget(UNKNOWN_URL).code === "staging_ref_required",
);
assert(
  "eval whitespace-only is unknown (legacy no-trim)",
  evaluateStagingOnlySupabaseTarget("   ").kind === "unknown",
);

expectThrow(
  "assert unknown host spoof throws nonStaging",
  () =>
    assertStagingOnlySupabaseTarget(
      `https://evil.example/?ref=${STAGING_PROJECT_REF}`,
    ),
  "staging project ref is required",
);

assert("contains production", stringContainsProductionRef(PROD_URL) === true);
assert("contains staging", stringContainsStagingRef(STAGING_URL) === true);
assert(
  "exact host true",
  isExactStagingSupabaseHostname("kmjqppxjdnwwrtaeqjta.supabase.co") === true,
);
assert(
  "exact host false for prod",
  isExactStagingSupabaseHostname("vsbvndwuajjhnzpohghh.supabase.co") === false,
);

assert("assert staging ok", (() => {
  assertStagingOnlySupabaseTarget(STAGING_URL);
  return true;
})());

expectThrow("assert empty", () => assertStagingOnlySupabaseTarget(""), "SUPABASE_URL is required");
expectThrow(
  "assert production",
  () => assertStagingOnlySupabaseTarget(PROD_URL),
  "production Supabase ref is blocked",
);
expectThrow(
  "assert unknown",
  () => assertStagingOnlySupabaseTarget(UNKNOWN_URL),
  "staging project ref is required",
);

assert("about contract re-export staging", ABOUT_STAGING === STAGING_PROJECT_REF);
assert("about contract re-export prod", ABOUT_PROD === PRODUCTION_REF_STOP);
assert("youtube contract re-export staging", YT_STAGING === STAGING_PROJECT_REF);
assert("youtube contract re-export prod", YT_PROD === PRODUCTION_REF_STOP);
assert("schedule alias staging", SCHEDULE_DRY_RUN_STAGING_REF === STAGING_PROJECT_REF);
assert(
  "schedule alias prod",
  SCHEDULE_DRY_RUN_PRODUCTION_REF_STOP === PRODUCTION_REF_STOP,
);
assert("discography re-export staging", DISCO_STAGING === STAGING_PROJECT_REF);
assert("discography re-export prod", DISCO_PROD === PRODUCTION_REF_STOP);
assert("package marker staging", GOSAKI_STAGING_SUPABASE_REF === STAGING_PROJECT_REF);
assert(
  "package marker prod",
  GOSAKI_PRODUCTION_SUPABASE_REF_STOP === PRODUCTION_REF_STOP,
);
assert("admin env staging", ADMIN_ENV_STAGING === STAGING_PROJECT_REF);
assert("admin env prod", PRODUCTION_PROJECT_REF === PRODUCTION_REF_STOP);

assert("schedule wrapper staging ok", (() => {
  assertScheduleDryRunStagingUrl(STAGING_URL);
  return true;
})());
expectThrow(
  "schedule wrapper production message",
  () => assertScheduleDryRunStagingUrl(PROD_URL),
  "production Supabase ref is blocked",
);
expectThrow(
  "schedule wrapper unknown message",
  () => assertScheduleDryRunStagingUrl(UNKNOWN_URL),
  "Schedule dry-run Edge is staging-only",
);

assert("discography wrapper staging ok", (() => {
  assertDiscographyReadbackUrl(STAGING_URL);
  return true;
})());
expectThrow(
  "discography wrapper production message",
  () => assertDiscographyReadbackUrl(PROD_URL),
  "production Supabase ref is blocked for readBack",
);
expectThrow(
  "discography wrapper unknown message",
  () => assertDiscographyReadbackUrl(UNKNOWN_URL),
  "readBack anon SELECT is staging-only",
);

const adminOk = validateGosakiStagingAdminPublicEnv({
  PUBLIC_SUPABASE_URL: STAGING_URL,
  PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOi.test",
  PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: `${STAGING_URL}/functions/v1/gosaki-youtube-url-dry-run`,
});
assert("admin env validate staging ok", adminOk.ok === true);

const adminProd = validateGosakiStagingAdminPublicEnv({
  PUBLIC_SUPABASE_URL: PROD_URL,
  PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOi.test",
  PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: `${STAGING_URL}/functions/v1/gosaki-youtube-url-dry-run`,
});
assert("admin env validate production fail", adminOk.ok === true && adminProd.ok === false);

const coreSrc = fs.readFileSync(CORE, "utf8");
assert("core has no gosaki- import", !/from ["'].*gosaki-/i.test(coreSrc));
assert("core documents Edge not wired", /Edge|Deno/i.test(coreSrc));

assert("phase doc exists", fs.existsSync(DOC));
const doc = fs.readFileSync(DOC, "utf8");
assert("doc phase id", doc.includes("cms-core-v2-admin-staging-ref-assert-helper"));
assert("doc staging ref", doc.includes(STAGING_PROJECT_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF_STOP));
assert("doc Edge not applied", /Edge.*not|not.*Edge|Deno.*not|not.*Deno/i.test(doc));
assert("doc CLIENT_SHARE_READY", /CLIENT_SHARE_READY/i.test(doc));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-admin-staging-ref-assert-helper");
