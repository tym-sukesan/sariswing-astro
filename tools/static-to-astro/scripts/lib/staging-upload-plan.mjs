/**
 * Staging FTP upload plan (dry-run only — no credentials in output).
 */

import fs from "node:fs";
import path from "node:path";
import { listPublicFiles } from "./static-public-artifact-verifier.mjs";
import { normalizeDeployBase } from "./deploy-base.mjs";

/**
 * @param {{
 *   publicDistDir: string,
 *   siteSlug: string,
 *   deployBase: string,
 *   stagingHost?: string,
 *   stagingUrl?: string,
 * }} opts
 */
export function buildStagingUploadPlan({
  publicDistDir,
  siteSlug,
  deployBase,
  stagingHost = "yskcreate.weblike.jp",
  stagingUrl = null,
}) {
  const publicDir = path.resolve(publicDistDir);
  const base = normalizeDeployBase(deployBase);
  const remotePath = base === "/" ? "/" : base;
  const files = listPublicFiles(publicDir);
  const topLevel = [...new Set(files.map((f) => f.rel.split("/")[0]))].sort();

  const resolvedStagingUrl =
    stagingUrl ??
    (base === "/"
      ? `https://${stagingHost}/`
      : `https://${stagingHost}${base.slice(0, -1)}/`);

  return {
    phase: "G-7e-staging-upload-plan",
    siteSlug,
    localSource: publicDir,
    localSourceKind: "static-public/public-dist",
    remoteHost: stagingHost,
    remotePath,
    stagingPublicUrl: resolvedStagingUrl,
    fileCount: files.length,
    topLevelEntries: topLevel,
    uploadListSample: files.slice(0, 20).map((f) => f.rel),
    rollbackPlan: [
      "Before --apply: note current staging directory contents or take host backup if available.",
      "On failure: re-upload prior public-dist snapshot from local backup (output/ is gitignored).",
      "Do not delete production paths — staging path only.",
    ],
    seoChecklist: [
      "Confirm noindex meta on HTML pages",
      "Confirm robots.txt Disallow: /",
      "Confirm canonical / og:url use staging host (no www.gosaki-piano.com in head)",
      "Confirm no duplicate deployBase segment in canonical",
      "Browser QA: nav Home → staging root, internal links under deployBase",
    ],
    operatorApprovalChecklist: [
      "prepare-public PASS and safeForStaticFtp true",
      "stagingPreview verifier PASS",
      "FTP dry-run report reviewed",
      "GOSAKI_STAGING_FTP_* env present locally (not committed)",
      "Explicit approval for G-7f --apply upload",
      "No workflow_dispatch / production deploy",
    ],
    safety: {
      ftpApplyExecuted: false,
      credentialsInPlan: false,
      productionTouched: false,
    },
  };
}

/**
 * @param {ReturnType<typeof buildStagingUploadPlan>} plan
 * @param {string} outPath
 */
export function writeStagingUploadPlanArtifacts(plan, outPath) {
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  const mdPath = outPath.replace(/\.json$/i, ".md");
  const lines = [
    "# Staging FTP Upload Plan (G-7e dry-run)",
    "",
    `- **Site:** ${plan.siteSlug}`,
    `- **Local source:** \`${plan.localSource}\``,
    `- **Remote:** \`${plan.remoteHost}\` → \`${plan.remotePath}\``,
    `- **Staging URL:** ${plan.stagingPublicUrl}`,
    `- **Files:** ${plan.fileCount}`,
    "",
    "## Top-level entries",
    "",
    ...plan.topLevelEntries.map((e) => `- \`${e}/\``),
    "",
    "## Sample upload list (first 20)",
    "",
    ...plan.uploadListSample.map((f) => `- \`${f}\``),
    "",
    "## Rollback plan",
    "",
    ...plan.rollbackPlan.map((s) => `- ${s}`),
    "",
    "## SEO / noindex checklist",
    "",
    ...plan.seoChecklist.map((s) => `- [ ] ${s}`),
    "",
    "## Operator approval (required before G-7f --apply)",
    "",
    ...plan.operatorApprovalChecklist.map((s) => `- [ ] ${s}`),
    "",
    "## Safety",
    "",
    "- FTP apply: **not executed**",
    "- Credentials: **not included in this document**",
    "",
  ];
  fs.writeFileSync(mdPath, lines.join("\n"), "utf8");
  return { jsonPath: outPath, mdPath };
}
