/**
 * G-20u3 — Shared site package build pipeline (convert → static-public → manual-upload).
 * Registry-driven · no FTP · no DB writes.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createManualUploadPackage } from "./manual-upload-package.mjs";
import {
  TOOL_ROOT,
  GOSAKI_SITE_KEY,
  getSiteRegistryEntry,
  resolvePackageManifestMetaFromRegistry,
  resolveSitePackageBuildProfile,
} from "./site-registry.mjs";
import {
  loadGosakiStagingAdminPublicEnv,
  reportGosakiStagingAdminPublicEnvPresence,
  validateGosakiStagingAdminPublicEnv,
} from "./gosaki-staging-admin-public-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

/** @type {Record<string, Record<string, string>>} */
const POST_BUILD_VERIFIERS = {
  "gosaki-piano": {
    staging: "scripts/verify-manual-upload-package.mjs",
    production: "scripts/verify-g20i3-gosaki-production-package-admin-exclusion.mjs",
  },
  "pilot-sample-static": {
    staging: "scripts/verify-site-package.mjs",
  },
};

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {NodeJS.ProcessEnv} [env]
 */
function run(cmd, args, env = process.env) {
  const out = spawnSync(cmd, args, {
    cwd: TOOL_ROOT,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: "inherit",
  });
  if (out.status !== 0) {
    process.exit(out.status ?? 1);
  }
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 */
export function resolvePostBuildVerifier(siteKey, profileName) {
  const rel = POST_BUILD_VERIFIERS[siteKey]?.[profileName];
  if (!rel) {
    throw new Error(
      `No post-build verifier configured for site="${siteKey}" profile="${profileName}"`,
    );
  }
  return rel;
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ manualUploadOut: string }} profile
 * @returns {string[]}
 */
export function buildPostBuildVerifierArgs(siteKey, profileName, profile) {
  const rel = resolvePostBuildVerifier(siteKey, profileName);
  const args = [rel];
  if (rel.endsWith("verify-site-package.mjs")) {
    args.push("--site", siteKey, "--profile", profileName, "--package-dir", profile.manualUploadOut);
  } else if (profileName === "staging" && siteKey === GOSAKI_SITE_KEY) {
    args.push("--package-dir", profile.manualUploadOut);
  }
  return args;
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ toolRoot?: string }} [options]
 */
export function planSitePackageBuild(siteKey, profileName, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  const profile = resolveSitePackageBuildProfile(siteKey, profileName, { toolRoot });
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const manifestMeta = resolvePackageManifestMetaFromRegistry(siteKey, profileName, { toolRoot });
  const convertSiteProfile = String(entry.convertSiteProfile ?? "musician");
  const publicDistDir = path.join(toolRoot, profile.staticPublicOut, "public-dist");
  const packageDir = path.join(toolRoot, profile.manualUploadOut);
  const verifierRel = resolvePostBuildVerifier(siteKey, profileName);

  return {
    siteKey,
    profileName,
    profile,
    manifestMeta,
    convertSiteProfile,
    publicDistDir,
    packageDir,
    verifierRel,
    steps: [
      `convert ${profile.fixtureDir} → ${profile.astroOut} (--site ${siteKey})`,
      `verify-static-public-artifact ${profile.staticPublicOut}`,
      `manual-upload package → ${profile.manualUploadOut}`,
      `verifier ${verifierRel}`,
    ],
  };
}

/**
 * Build argv for convert-static-to-astro.mjs from a registry siteKey + profile.
 *
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ toolRoot?: string }} [options]
 * @returns {string[]}
 */
export function buildConvertCliArgs(siteKey, profileName, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  const plan = planSitePackageBuild(siteKey, profileName, { toolRoot });
  const { profile, convertSiteProfile } = plan;
  return [
    "scripts/convert-static-to-astro.mjs",
    profile.fixtureDir,
    profile.astroOut,
    "--site",
    siteKey,
    "--base-url",
    profile.baseUrl,
    "--deploy-base",
    profile.deployBase,
    "--site-profile",
    convertSiteProfile,
    "--verify-build",
  ];
}

/**
 * @param {{
 *   siteKey: string,
 *   profileName: string,
 *   dryRun?: boolean,
 *   label?: string,
 *   toolRoot?: string,
 * }} options
 */
export function runSitePackageBuild(options) {
  const { siteKey, profileName, dryRun = false, label, toolRoot = TOOL_ROOT } = options;
  const plan = planSitePackageBuild(siteKey, profileName, { toolRoot });
  const { profile, manifestMeta, convertSiteProfile, publicDistDir, packageDir, verifierRel } =
    plan;

  const phaseLabel =
    label ??
    `G-20u3 site package build (${siteKey} / ${profileName})`;

  console.log(phaseLabel);
  console.log("siteKey:", siteKey);
  console.log("profile:", profileName);
  console.log("baseUrl:", profile.baseUrl);
  console.log("deployBase:", profile.deployBase);
  console.log("output:", profile.manualUploadOut);
  console.log("includeGosakiReadOnlyAdmin:", profile.includeGosakiReadOnlyAdmin);
  console.log("supabaseProjectRef:", profile.supabaseProjectRef);
  console.log("intendedRemotePath:", profile.intendedRemotePath);
  console.log("dryRun:", dryRun);

  if (dryRun) {
    console.log("");
    console.log("=== Dry-run plan (no convert / package / FTP) ===");
    for (const step of plan.steps) console.log(`- ${step}`);
    console.log("");
    console.log("manifestMeta:", JSON.stringify(manifestMeta, null, 2));
    console.log("");
    console.log(`${phaseLabel}: DRY-RUN PASS`);
    return { ok: true, dryRun: true, plan, manifestMeta };
  }

  const isGosakiSite = siteKey === GOSAKI_SITE_KEY;
  /** @type {NodeJS.ProcessEnv} */
  let buildEnv = { ...process.env };

  if (isGosakiSite) {
    const report = reportGosakiStagingAdminPublicEnvPresence();
    const env = loadGosakiStagingAdminPublicEnv();
    const validation = validateGosakiStagingAdminPublicEnv(env);

    console.log("PUBLIC_SUPABASE_URL:", report.presence.PUBLIC_SUPABASE_URL ? "SET" : "UNSET");
    console.log(
      "PUBLIC_SUPABASE_ANON_KEY:",
      report.presence.PUBLIC_SUPABASE_ANON_KEY ? "SET" : "UNSET",
    );
    console.log(
      "PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT:",
      report.presence.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT
        ? "SET"
        : "UNSET (using staging default)",
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

    buildEnv = {
      ...process.env,
      PUBLIC_SUPABASE_URL: env.PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_ANON_KEY: env.PUBLIC_SUPABASE_ANON_KEY,
      PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: env.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT,
    };
  } else {
    console.log("Gosaki staging admin env: skipped (non-gosaki site)");
  }

  run(
    "node",
    buildConvertCliArgs(siteKey, profileName, { toolRoot }),
    buildEnv,
  );

  const verifyArgs = [
    "scripts/verify-static-public-artifact.mjs",
    "--astro-dir",
    profile.astroOutRepoRel,
    "--report",
    path.join("tools/static-to-astro", profile.staticPublicReportRel),
  ];
  if (profile.includeGosakiReadOnlyAdmin === false) {
    verifyArgs.push("--include-gosaki-read-only-admin", "false");
  }
  run("node", verifyArgs, buildEnv);

  const packageResult = createManualUploadPackage({
    publicDistDir,
    outDir: packageDir,
    siteSlug: manifestMeta.siteSlug,
    siteKey: manifestMeta.siteKey,
    cmsSiteSlug: manifestMeta.cmsSiteSlug,
    supabaseSiteSlug: manifestMeta.supabaseSiteSlug,
    packageKey: manifestMeta.packageKey,
    deployBase: manifestMeta.deployBase,
    stagingUrl: manifestMeta.stagingBaseUrl ?? manifestMeta.publicBaseUrl.replace(/\/$/, ""),
    publicBaseUrl: manifestMeta.publicBaseUrl.replace(/\/$/, ""),
    targetEnvironment: manifestMeta.targetEnvironment,
    packageProfileName: manifestMeta.packageProfileName,
    intendedRemotePath: manifestMeta.intendedRemotePath,
    toolRoot,
    repoRoot: REPO_ROOT,
    includeGosakiReadOnlyAdmin: manifestMeta.includeGosakiReadOnlyAdmin,
  });

  if (!packageResult.ok) {
    for (const err of packageResult.errors) console.error(`ERROR: ${err}`);
    process.exit(1);
  }

  const verifierArgs = buildPostBuildVerifierArgs(siteKey, profileName, profile);
  run("node", verifierArgs, buildEnv);

  console.log("");
  console.log(`${phaseLabel}: PASS`);
  console.log(`Output: tools/static-to-astro/${profile.manualUploadOut}/`);
  if (packageResult.manifest) {
    console.log(`sourceCommit: ${packageResult.manifest.sourceCommit}`);
    console.log(`includesAdmin: ${packageResult.manifest.includesAdmin}`);
    console.log(`publicBaseUrl: ${packageResult.manifest.publicBaseUrl}`);
    console.log(`intendedRemotePath: ${packageResult.manifest.intendedRemotePath}`);
  }

  return {
    ok: true,
    dryRun: false,
    plan,
    packageDir,
    manifest: packageResult.manifest,
  };
}
