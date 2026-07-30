/**
 * CMS Core v2 — static-public artifact verifier site-adapter decoupling.
 * Offline fixtures · no package generate · no FTP · no network.
 *
 * Run: node scripts/verify-cms-core-v2-static-public-artifact-verifier-site-adapter.mjs
 * npm: verify:cms-core-v2-static-public-artifact-verifier-adapter
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIXTURE_ANON_JWT,
  FIXTURE_ROLELESS_JWT,
  FIXTURE_SERVICE_ROLE_JWT,
} from "./lib/cms-core-v2-static-public-artifact-verifier-site-adapter-fixtures.mjs";
import {
  acceptSupabaseAnonJwtForAllowlist,
  resolveKnownGosakiStagingAnonKeyForScan,
} from "./lib/static-public-artifact-verifier.mjs";
import {
  resolveGosakiEnvAnonKeyForStaticPublicScan,
  resolveKnownGosakiStagingAnonKeyForScanWithEnv,
} from "./lib/gosaki-static-public-anon-key-resolver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/static-public-artifact-verifier.mjs");
const ADAPTER = path.join(__dirname, "lib/gosaki-static-public-anon-key-resolver.mjs");
const FIXTURES = path.join(
  __dirname,
  "lib/cms-core-v2-static-public-artifact-verifier-site-adapter-fixtures.mjs",
);
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-static-public-artifact-verifier-site-adapter-decoupling.md",
);
const VERIFY_CLI = path.join(__dirname, "verify-static-public-artifact.mjs");
const FTP = path.join(__dirname, "lib/public-dist-ftp-deployer.mjs");
const PIPELINE = path.join(__dirname, "lib/url-to-staging-pipeline.mjs");

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
const verifyCliSrc = fs.readFileSync(VERIFY_CLI, "utf8");
const ftpSrc = fs.readFileSync(FTP, "utf8");
const pipelineSrc = fs.readFileSync(PIPELINE, "utf8");

assert(
  "Core has no gosaki-staging-admin-public-env import",
  !/gosaki-staging-admin-public-env/.test(coreSrc),
);
assert(
  "Core has no loadGosakiStagingAdminPublicEnv",
  !/\bloadGosakiStagingAdminPublicEnv\b/.test(coreSrc),
);
assert(
  "Core accepts resolveEnvAnonKey",
  /resolveEnvAnonKey/.test(coreSrc),
);
assert(
  "Adapter imports gosaki-staging-admin-public-env",
  /gosaki-staging-admin-public-env/.test(adapterSrc),
);
assert(
  "Adapter wraps Core resolve",
  /resolveKnownGosakiStagingAnonKeyForScan/.test(adapterSrc),
);
assert(
  "verify CLI injects resolveEnvAnonKey",
  /resolveGosakiEnvAnonKeyForStaticPublicScan/.test(verifyCliSrc) &&
    /resolveEnvAnonKey:/.test(verifyCliSrc),
);
assert(
  "FTP deployer uses adapter WithEnv",
  /resolveKnownGosakiStagingAnonKeyForScanWithEnv/.test(ftpSrc),
);
assert(
  "url-to-staging injects Gosaki resolveEnvAnonKey",
  /resolveGosakiEnvAnonKeyForStaticPublicScan/.test(pipelineSrc),
);

deepEqual(
  "accept anon jwt",
  acceptSupabaseAnonJwtForAllowlist(FIXTURE_ANON_JWT),
  FIXTURE_ANON_JWT,
);
deepEqual(
  "reject service_role jwt",
  acceptSupabaseAnonJwtForAllowlist(FIXTURE_SERVICE_ROLE_JWT),
  null,
);
deepEqual(
  "reject roleless jwt",
  acceptSupabaseAnonJwtForAllowlist(FIXTURE_ROLELESS_JWT),
  null,
);

deepEqual(
  "Core knownAnonKey path",
  resolveKnownGosakiStagingAnonKeyForScan({ knownAnonKey: FIXTURE_ANON_JWT }),
  FIXTURE_ANON_JWT,
);
deepEqual(
  "Core secretsAnonKey path",
  resolveKnownGosakiStagingAnonKeyForScan({ secretsAnonKey: FIXTURE_ANON_JWT }),
  FIXTURE_ANON_JWT,
);
deepEqual(
  "Core rejects service_role known key (no fallthrough)",
  resolveKnownGosakiStagingAnonKeyForScan({
    knownAnonKey: FIXTURE_SERVICE_ROLE_JWT,
    resolveEnvAnonKey: () => FIXTURE_ANON_JWT,
  }),
  null,
);
deepEqual(
  "Core without callback → null (no gosaki env load)",
  resolveKnownGosakiStagingAnonKeyForScan({}),
  null,
);
deepEqual(
  "Core resolveEnvAnonKey callback",
  resolveKnownGosakiStagingAnonKeyForScan({
    resolveEnvAnonKey: () => FIXTURE_ANON_JWT,
  }),
  FIXTURE_ANON_JWT,
);
deepEqual(
  "Core resolveEnvAnonKey rejects service_role",
  resolveKnownGosakiStagingAnonKeyForScan({
    resolveEnvAnonKey: () => FIXTURE_SERVICE_ROLE_JWT,
  }),
  null,
);

deepEqual(
  "Adapter WithEnv knownAnonKey same as Core",
  resolveKnownGosakiStagingAnonKeyForScanWithEnv({ knownAnonKey: FIXTURE_ANON_JWT }),
  resolveKnownGosakiStagingAnonKeyForScan({ knownAnonKey: FIXTURE_ANON_JWT }),
);

assert(
  "resolveGosakiEnvAnonKeyForStaticPublicScan is function",
  typeof resolveGosakiEnvAnonKeyForStaticPublicScan === "function",
);

if (failed > 0) {
  console.error(
    `\nFAIL static-public-artifact-verifier-site-adapter: ${failed} failed, ${passed} passed`,
  );
  process.exit(1);
}
console.log(`\nOK static-public-artifact-verifier-site-adapter: ${passed} passed`);
process.exit(0);
