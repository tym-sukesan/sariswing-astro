#!/usr/bin/env node
/**
 * G-20h1 — Build Gosaki production static package (deployBase=/, www.gosaki-piano.com).
 * G-20u3 — delegates to generic build-site-package core (backward-compatible wrapper).
 *
 * Run: node tools/static-to-astro/scripts/build-gosaki-production-package.mjs
 * Or:  npm run build:gosaki-production-package
 */

import { runSitePackageBuild } from "./lib/build-site-package-core.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";
import { createGosakiBeforeFirstFilesystemWrite } from "./lib/gosaki-operational-save-ui-arm-mutex-gate.mjs";
import { createGosakiResolveBuildEnv } from "./lib/gosaki-package-build-env-preflight.mjs";

runSitePackageBuild({
  siteKey: GOSAKI_SITE_KEY,
  profileName: "production",
  label: "G-20i3 Gosaki production package build",
  resolveBuildEnv: createGosakiResolveBuildEnv(GOSAKI_SITE_KEY),
  beforeFirstFilesystemWrite: createGosakiBeforeFirstFilesystemWrite(GOSAKI_SITE_KEY),
});
