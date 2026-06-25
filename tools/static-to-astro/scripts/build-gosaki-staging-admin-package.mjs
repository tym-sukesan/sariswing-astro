#!/usr/bin/env node
/**
 * G-11c4b — Build Gosaki staging admin package with public Supabase env wired.
 * Reads repo .env / .env.local (does not modify). Never prints secret values.
 *
 * Run: node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TOOL_ROOT,
  loadGosakiStagingAdminPublicEnv,
  reportGosakiStagingAdminPublicEnvPresence,
  validateGosakiStagingAdminPublicEnv,
} from "./lib/gosaki-staging-admin-public-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, args, env) {
  const out = spawnSync(cmd, args, {
    cwd: TOOL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: "inherit",
  });
  if (out.status !== 0) process.exit(out.status ?? 1);
}

const report = reportGosakiStagingAdminPublicEnvPresence();
const env = loadGosakiStagingAdminPublicEnv();
const validation = validateGosakiStagingAdminPublicEnv(env);

console.log("G-11c4b Gosaki staging admin package build");
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

const astroOut = "output/gosaki-piano-astro";
const fixtureIn = "fixtures/gosaki-piano";

run("node", ["scripts/convert-static-to-astro.mjs", fixtureIn, astroOut, "--base-url", "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano", "--deploy-base", "/cms-kit-staging/gosaki-piano/", "--site-profile", "musician", "--verify-build"], buildEnv);

run(
  "node",
  [
    "scripts/verify-static-public-artifact.mjs",
    "--astro-dir",
    path.join("tools/static-to-astro", astroOut),
    "--report",
    "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md",
  ],
  buildEnv,
);

run("npm", ["run", "manual-upload:package"], buildEnv);
run("npm", ["run", "verify:manual-upload"], buildEnv);

console.log("");
console.log("G-11c4b package build: PASS");
console.log("Output: tools/static-to-astro/output/manual-upload/gosaki-piano/");
