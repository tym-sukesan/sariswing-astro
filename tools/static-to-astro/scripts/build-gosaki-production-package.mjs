#!/usr/bin/env node
/**
 * G-20h1 — Build Gosaki production static package (deployBase=/, www.gosaki-piano.com).
 * Reads deploy profile JSON + repo .env (does not modify). Never prints secret values.
 *
 * Run: node tools/static-to-astro/scripts/build-gosaki-production-package.mjs
 * Or:  npm run build:gosaki-production-package
 *
 * G-20h1: script only — do not execute until G-20h2 without operator intent.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  TOOL_ROOT,
  loadGosakiStagingAdminPublicEnv,
  reportGosakiStagingAdminPublicEnvPresence,
  validateGosakiStagingAdminPublicEnv,
} from "./lib/gosaki-staging-admin-public-env.mjs";
import { resolveGosakiPackageBuildProfile } from "./lib/gosaki-package-build-profile.mjs";

const PROFILE_NAME = "production";

function run(cmd, args, env) {
  const out = spawnSync(cmd, args, {
    cwd: TOOL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: "inherit",
  });
  if (out.status !== 0) process.exit(out.status ?? 1);
}

const profile = resolveGosakiPackageBuildProfile(PROFILE_NAME);

const report = reportGosakiStagingAdminPublicEnvPresence();
const env = loadGosakiStagingAdminPublicEnv();
const validation = validateGosakiStagingAdminPublicEnv(env);

console.log("G-20i3 Gosaki production package build");
console.log("profile:", PROFILE_NAME);
console.log("baseUrl:", profile.baseUrl);
console.log("deployBase:", profile.deployBase);
console.log("output:", profile.manualUploadOut);
console.log("includeGosakiReadOnlyAdmin:", profile.includeGosakiReadOnlyAdmin);
console.log("supabaseProjectRef:", profile.supabaseProjectRef);
console.log("PUBLIC_SUPABASE_URL:", report.presence.PUBLIC_SUPABASE_URL ? "SET" : "UNSET");
console.log("PUBLIC_SUPABASE_ANON_KEY:", report.presence.PUBLIC_SUPABASE_ANON_KEY ? "SET" : "UNSET");
console.log(
  "PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT:",
  report.presence.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT ? "SET" : "UNSET (using staging default)",
);

if (!validation.ok) {
  if (validation.missing.length) {
    console.error("Missing required public env:");
    for (const key of validation.missing) console.error(`  - ${key}`);
  }
  if (validation.errors.length) {
    console.error("Env validation errors:");
    for (const msg of validation.errors) console.error(`  - ${msg}`);
  }
  process.exit(1);
}

const buildEnv = {
  PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT,
};

run(
  "node",
  [
    "scripts/convert-static-to-astro.mjs",
    profile.fixtureDir,
    profile.astroOut,
    "--base-url",
    profile.baseUrl,
    "--deploy-base",
    profile.deployBase,
    "--site-profile",
    "musician",
    "--verify-build",
  ],
  buildEnv,
);

run(
  "node",
  [
    "scripts/verify-static-public-artifact.mjs",
    "--astro-dir",
    profile.astroOutRepoRel,
    "--report",
    path.join("tools/static-to-astro", profile.staticPublicReportRel),
    "--include-gosaki-read-only-admin",
    profile.includeGosakiReadOnlyAdmin ? "true" : "false",
  ],
  buildEnv,
);

run("npm", ["run", "manual-upload:package:gosaki-production"], buildEnv);
run("node", ["scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs"], buildEnv);

console.log("");
console.log("G-20i3 Gosaki production package build: PASS");
console.log(`Output: tools/static-to-astro/${profile.manualUploadOut}/`);
