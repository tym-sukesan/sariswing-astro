/**
 * Site-agnostic package-build preflight orchestration (Node).
 *
 * Order (must not weaken):
 * 1. optional resolveBuildEnv (staging/production STOP · env merge)
 * 2. git clean / read-only check
 * 3. optional beforeFirstFilesystemWrite (e.g. Save UI mutex)
 * 4. caller performs first filesystem write
 *
 * No site-specific env names · no gosaki-* imports.
 */

/**
 * @typedef {{
 *   buildEnv: NodeJS.ProcessEnv | Record<string, string | undefined>,
 * }} ResolveBuildEnvResult
 */

/**
 * @typedef {{
 *   mutexChecked?: boolean,
 *   mutexReason?: string,
 *   armedCount?: number,
 *   armedFeatureIds?: string[],
 * }} MutexEvidence
 */

/**
 * @param {{
 *   siteKey: string,
 *   processEnv?: NodeJS.ProcessEnv | Record<string, string | undefined>,
 *   resolveBuildEnv?: (ctx: {
 *     env: NodeJS.ProcessEnv | Record<string, string | undefined>,
 *     siteKey: string,
 *   }) => ResolveBuildEnvResult | void | null | undefined,
 *   beforeFirstFilesystemWrite?: (ctx: {
 *     env: NodeJS.ProcessEnv | Record<string, string | undefined>,
 *     siteKey: string,
 *   }) => { mutex?: MutexEvidence | null } | void | null | undefined,
 *   assertGitWorkingTreeClean: () => void,
 * }} opts
 * @returns {{
 *   buildEnv: NodeJS.ProcessEnv | Record<string, string | undefined>,
 *   mutexEvidence: MutexEvidence | null,
 *   resolveBuildEnvCalls: number,
 *   beforeFirstFilesystemWriteCalls: number,
 * }}
 */
export function executeSitePackageBuildPrefights(opts) {
  const siteKey = String(opts.siteKey ?? "");
  const processEnv = opts.processEnv ?? process.env;
  /** @type {NodeJS.ProcessEnv | Record<string, string | undefined>} */
  let buildEnv = { ...processEnv };
  let resolveBuildEnvCalls = 0;
  let beforeFirstFilesystemWriteCalls = 0;
  /** @type {MutexEvidence | null} */
  let mutexEvidence = null;

  if (typeof opts.resolveBuildEnv === "function") {
    resolveBuildEnvCalls += 1;
    const out = opts.resolveBuildEnv({ env: { ...buildEnv }, siteKey });
    if (out == null) {
      // Explicit no-op from adapter (rare) — keep prior env.
    } else if (typeof out !== "object" || out.buildEnv == null || typeof out.buildEnv !== "object") {
      throw new Error(
        "resolveBuildEnv must return { buildEnv: object } or null/undefined",
      );
    } else {
      buildEnv = { ...out.buildEnv };
    }
  }

  opts.assertGitWorkingTreeClean();

  if (typeof opts.beforeFirstFilesystemWrite === "function") {
    beforeFirstFilesystemWriteCalls += 1;
    const preflightOut = opts.beforeFirstFilesystemWrite({ env: buildEnv, siteKey });
    if (preflightOut && typeof preflightOut === "object" && preflightOut.mutex) {
      mutexEvidence = preflightOut.mutex;
    }
  }

  return {
    buildEnv,
    mutexEvidence,
    resolveBuildEnvCalls,
    beforeFirstFilesystemWriteCalls,
  };
}
