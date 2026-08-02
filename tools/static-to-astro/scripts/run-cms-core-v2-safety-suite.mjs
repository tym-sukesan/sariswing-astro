#!/usr/bin/env node
/**
 * CMS Core v2 offline safety suite — fail-fast runner.
 *
 * npm: verify:cms-core-v2-safety-suite
 *
 * Offline-only: never arms LIVE_SOFT / live-verify / package generate.
 * Does not mutate verifier contracts; orchestrates existing scripts only.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

/** Child env: inherit process env but force soft-live off. */
function offlineChildEnv() {
  const env = { ...process.env };
  env.CMS_CORE_V2_VERIFIER_LIVE_SOFT = "false";
  delete env.CMS_CORE_V2_VERIFIER_LIVE_SOFT_FORCE;
  return env;
}

/**
 * @typedef {{ id: string, kind: "node" | "git-diff-check" | "import-cycle", script?: string, cwd?: string }} SuiteStep
 */

/** @type {SuiteStep[]} */
const STEPS = [
  {
    id: "supabase-anon-read-env",
    kind: "node",
    script: "verify-cms-core-v2-supabase-anon-read-env-helper.mjs",
  },
  {
    id: "build-read-envelope",
    kind: "node",
    script: "verify-cms-core-v2-build-read-envelope-helper.mjs",
  },
  {
    id: "feature-flag-trim-true",
    kind: "node",
    script: "verify-cms-core-v2-feature-flag-trim-true-helper.mjs",
  },
  {
    id: "package-public-env-adapter",
    kind: "node",
    script: "verify-cms-core-v2-package-public-env-site-adapter.mjs",
  },
  {
    id: "schedule-read-extractor-decoupling",
    kind: "node",
    script: "verify-cms-core-v2-schedule-read-extractor-decoupling.mjs",
  },
  {
    id: "static-public-artifact-verifier-adapter",
    kind: "node",
    script: "verify-cms-core-v2-static-public-artifact-verifier-site-adapter.mjs",
  },
  {
    id: "site-package-verifier-extension-decoupling",
    kind: "node",
    script: "verify-cms-core-v2-site-package-verifier-extension-decoupling.mjs",
  },
  {
    id: "gosaki-site-generator-hooks-html-baseline",
    kind: "node",
    script: "verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs",
  },
  {
    id: "mio-registry-noop-pilot",
    kind: "node",
    script: "verify-cms-core-v2-mio-registry-noop-pilot.mjs",
  },
  {
    id: "mio-data-fixtures",
    kind: "node",
    script: "verify-cms-core-v2-mio-data-fixtures.mjs",
  },
  {
    id: "mio-hooks-adapter-thin",
    kind: "node",
    script: "verify-cms-core-v2-mio-hooks-adapter-thin.mjs",
  },
  {
    id: "mio-schedule-read-render",
    kind: "node",
    script: "verify-cms-core-v2-mio-schedule-read-render.mjs",
  },
  {
    id: "mio-discography-read-render",
    kind: "node",
    script: "verify-cms-core-v2-mio-discography-read-render.mjs",
  },
  {
    id: "mio-about-read-render",
    kind: "node",
    script: "verify-cms-core-v2-mio-about-read-render.mjs",
  },
  {
    id: "mio-supabase-live-select-only-preflight",
    kind: "node",
    script: "verify-cms-core-v2-mio-supabase-live-select-only-preflight.mjs",
  },
  {
    id: "mio-supabase-live-select-only-seed-write-gate",
    kind: "node",
    script: "verify-cms-core-v2-mio-supabase-live-select-only-seed-write-gate.mjs",
  },
  {
    id: "schedule-tbd-date-contract-helpers",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-contract-helpers.mjs",
  },
  {
    id: "schedule-tbd-date-gosaki-read-compat",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-gosaki-read-compat.mjs",
  },
  {
    id: "schedule-tbd-date-status-read-wiring",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-status-read-wiring.mjs",
  },
  {
    id: "schedule-tbd-admin-ui-connect",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-admin-ui-connect.mjs",
  },
  {
    id: "schedule-tbd-date-save-dry-run",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-save-dry-run.mjs",
  },
  {
    id: "schedule-tbd-date-save-non-dry-run-staging-planning",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.mjs",
  },
  {
    id: "schedule-tbd-date-save-non-dry-run-staging-implementation",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.mjs",
  },
  {
    id: "schedule-tbd-date-save-non-dry-run-staging-final-preflight",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.mjs",
  },
  {
    id: "schedule-tbd-admin-state-save-payload-helpers",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-admin-state-save-payload-helpers.mjs",
  },
  {
    id: "schedule-tbd-staging-migration-gate",
    kind: "node",
    script: "verify-cms-core-v2-schedule-tbd-staging-migration-gate.mjs",
  },
  {
    id: "external-form-provider-contract-validator",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-contract-validator.mjs",
  },
  {
    id: "external-form-provider-external-link",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-external-link.mjs",
  },
  {
    id: "external-form-provider-google-forms",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-google-forms.mjs",
  },
  {
    id: "external-form-provider-hubspot-renderer",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-hubspot-renderer.mjs",
  },
  {
    id: "external-form-provider-hubspot-shadow-compare",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-hubspot-shadow-compare.mjs",
  },
  {
    id: "external-form-provider-hubspot-adapter-switch",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-hubspot-adapter-switch.mjs",
  },
  {
    id: "external-form-provider-hubspot-legacy-cleanup-audit",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit.mjs",
  },
  {
    id: "external-form-provider-hubspot-completion-audit",
    kind: "node",
    script: "verify-cms-core-v2-external-form-provider-hubspot-completion-audit.mjs",
  },
  {
    id: "youtube-offline-vertical",
    kind: "node",
    script: "verify-cms-core-v2-youtube-supabase-vertical-slice.mjs",
  },
  {
    id: "about-apply-readiness",
    kind: "node",
    script: "verify-cms-core-v2-about-supabase-vertical-slice-apply-readiness.mjs",
  },
  {
    id: "save-arm-exact-true",
    kind: "node",
    script: "verify-cms-core-v2-save-arm-exact-true-helper.mjs",
  },
  {
    id: "save-arm-parse-policy",
    kind: "node",
    script: "verify-cms-core-v2-save-arm-parse-policy.mjs",
  },
  {
    id: "mutex-helper",
    kind: "node",
    script: "verify-cms-core-v2-global-save-arm-mutex-helper.mjs",
  },
  {
    id: "mutex-inventory",
    kind: "node",
    script: "verify-cms-core-v2-global-save-arm-mutex-inventory.mjs",
  },
  {
    id: "mutex-package-gate",
    kind: "node",
    script: "verify-cms-core-v2-global-save-arm-mutex-package-gate.mjs",
  },
  {
    id: "url-staging",
    kind: "node",
    script: "verify-url-to-staging-pipeline.mjs",
  },
  { id: "import-cycle", kind: "import-cycle" },
  { id: "git-diff-check", kind: "git-diff-check" },
];

const IMPORT_CYCLE_MODULES = [
  "cms-core-v2-offline-supabase-env-fixture.mjs",
  "supabase-anon-read-env-utils.mjs",
  "build-read-envelope-utils.mjs",
  "feature-flag-trim-true-utils.mjs",
  "site-package-build-preflight.mjs",
  "cms-core-v2-youtube-supabase-contract.mjs",
  "cms-core-v2-about-supabase-contract.mjs",
  "supabase-staging-ref-utils.mjs",
  "save-arm-mutex-utils.mjs",
  "gosaki-operational-save-ui-arm-mutex-gate.mjs",
  "gosaki-schedule-read-adapter.mjs",
  "gosaki-static-public-anon-key-resolver.mjs",
  "supabase-schedule-read.mjs",
  "static-public-artifact-verifier.mjs",
  "verify-site-package-core.mjs",
  "gosaki-site-package-verifier-adapter.mjs",
  "cms-core-v2-gosaki-site-generator-hooks-html-baseline-fixtures.mjs",
  "site-generator-hooks.mjs",
  "gosaki-site-generator-hooks-adapter.mjs",
  "mio-site-generator-hooks-adapter.mjs",
  "mio-schedule-data-pages.mjs",
  "mio-discography-data-page.mjs",
  "mio-about-data-page.mjs",
  "mio-local-asset-url.mjs",
  "external-form-provider-contract.mjs",
  "external-form-provider-renderer.mjs",
  "mio-contact-form-page.mjs",
  "site-cms-features.mjs",
];

function fail(stepId, detail) {
  console.error(`\nFAIL cms-core-v2-safety-suite at step: ${stepId}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function runNodeScript(step) {
  const scriptPath = path.join(SCRIPT_DIR, step.script);
  console.log(`\n==> [${step.id}] node scripts/${step.script}`);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: TOOL_ROOT,
    env: offlineChildEnv(),
    stdio: "inherit",
  });
  if (result.error) {
    fail(step.id, String(result.error));
  }
  if (result.status !== 0) {
    fail(step.id, `exit code ${result.status ?? "null"}`);
  }
  console.log(`PASS [${step.id}]`);
}

async function runImportCycle(step) {
  console.log(`\n==> [${step.id}] import cycle smoke (${IMPORT_CYCLE_MODULES.length} modules)`);
  try {
    for (const name of IMPORT_CYCLE_MODULES) {
      const href = pathToFileURL(path.join(SCRIPT_DIR, "lib", name)).href;
      await import(href);
    }
  } catch (err) {
    fail(step.id, err instanceof Error ? err.stack || err.message : String(err));
  }
  console.log(`PASS [${step.id}]`);
}

function runGitDiffCheck(step) {
  console.log(`\n==> [${step.id}] git diff --check`);
  const result = spawnSync("git", ["diff", "--check"], {
    cwd: REPO_ROOT,
    env: offlineChildEnv(),
    stdio: "inherit",
  });
  if (result.error) {
    fail(step.id, String(result.error));
  }
  if (result.status !== 0) {
    fail(step.id, `exit code ${result.status ?? "null"}`);
  }
  console.log(`PASS [${step.id}]`);
}

async function main() {
  console.log("CMS Core v2 offline safety suite");
  console.log(`steps: ${STEPS.map((s) => s.id).join(" → ")}`);
  console.log("CMS_CORE_V2_VERIFIER_LIVE_SOFT forced false for child processes");

  for (const step of STEPS) {
    if (step.kind === "node") {
      runNodeScript(step);
    } else if (step.kind === "import-cycle") {
      await runImportCycle(step);
    } else if (step.kind === "git-diff-check") {
      runGitDiffCheck(step);
    } else {
      fail(step.id, `unknown step kind`);
    }
  }

  console.log("\nALL PASS cms-core-v2-safety-suite");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
