#!/usr/bin/env node
/**
 * G-11c4b — Build Gosaki staging admin package with public Supabase env wired.
 * G-20u3 — delegates to generic build-site-package core (backward-compatible wrapper).
 *
 * Run: node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
 */

import { runSitePackageBuild } from "./lib/build-site-package-core.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";
import { createGosakiBeforeFirstFilesystemWrite } from "./lib/gosaki-operational-save-ui-arm-mutex-gate.mjs";
import { createGosakiResolveBuildEnv } from "./lib/gosaki-package-build-env-preflight.mjs";

runSitePackageBuild({
  siteKey: GOSAKI_SITE_KEY,
  profileName: "staging",
  label: "G-11c4b Gosaki staging admin package build",
  resolveBuildEnv: createGosakiResolveBuildEnv(GOSAKI_SITE_KEY),
  beforeFirstFilesystemWrite: createGosakiBeforeFirstFilesystemWrite(GOSAKI_SITE_KEY),
});
