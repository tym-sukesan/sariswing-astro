/**
 * Admin scaffold writer dry-runner (G-5w-b).
 * Plans future writer output from G-5s package — no runtime file writes, no --apply.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSiteConfigPath, toRepoRelativePath } from "./site-config-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const WRITER_PHASE = "G-5w-b";
export const APPLY_NOT_IMPLEMENTED_MSG =
  "--apply is not implemented in G-5w-b. This CLI is dry-run only.";

/** @type {readonly string[]} */
export const PACKAGE_FILES = [
  "admin-scaffold-generation-package.json",
  "admin-sections.generated.json",
  "admin-components.required.json",
  "admin-permissions.generated.json",
  "admin-storage-mappings.generated.json",
  "admin-publish-policy.generated.json",
  "admin-preview-plan.generated.json",
  "admin-safety-checklist.generated.md",
];

/** @type {readonly { path: string; type: string; source: string }[]} */
export const BASE_PLANNED_FILES = [
  { path: "admin/README.md", type: "documentation", source: "writer-template" },
  { path: "admin/pages/index.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/profile.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/schedule.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/discography.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/links.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/news.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/media.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/publish.astro", type: "page", source: "admin-sections.generated.json" },
  { path: "admin/pages/settings.astro", type: "page", source: "admin-sections.generated.json" },
  {
    path: "admin/config/admin-sections.generated.json",
    type: "config",
    source: "admin-sections.generated.json",
  },
  {
    path: "admin/config/admin-permissions.generated.json",
    type: "config",
    source: "admin-permissions.generated.json",
  },
  {
    path: "admin/config/admin-storage-mappings.generated.json",
    type: "config",
    source: "admin-storage-mappings.generated.json",
  },
  {
    path: "admin/config/admin-publish-policy.generated.json",
    type: "config",
    source: "admin-publish-policy.generated.json",
  },
  {
    path: "admin/manifests/generated-files-manifest.json",
    type: "manifest",
    source: "writer-template",
  },
  { path: "admin/manifests/rollback-manifest.json", type: "manifest", source: "writer-template" },
  { path: "admin/manifests/writer-report.md", type: "manifest", source: "writer-template" },
];

/**
 * Resolve writer CLI paths. Repo-root paths (src/, sandbox/) must not resolve under toolRoot only.
 * @param {string} relOrAbs
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function resolveWriterPath(relOrAbs, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const raw = String(relOrAbs ?? "").trim();
  if (!raw) {
    throw new Error("Path is empty");
  }
  if (path.isAbsolute(raw)) {
    return raw;
  }
  const root = path.resolve(repoRoot ?? path.resolve(toolRoot, "../.."));
  if (
    raw.startsWith("tools/static-to-astro/") ||
    raw.startsWith("src/") ||
    raw.startsWith("sandbox/")
  ) {
    return path.resolve(root, raw);
  }
  return resolveSiteConfigPath(raw, toolRoot, root);
}

/**
 * @param {string} p
 */
function normalizePosix(p) {
  return path.normalize(p).split(path.sep).join("/").replace(/\/+$/, "") || ".";
}

/**
 * @param {string} absPath
 * @param {string} repoRoot
 */
function toRel(absPath, repoRoot) {
  return normalizePosix(path.relative(repoRoot, absPath));
}

/**
 * @param {string} policyPath
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function loadWriterPolicy(policyPath, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const root = path.resolve(repoRoot ?? path.resolve(toolRoot, "../.."));
  const abs = resolveSiteConfigPath(policyPath, toolRoot, root);
  if (!fs.existsSync(abs)) {
    throw new Error(`Writer policy not found: ${policyPath}`);
  }
  const policy = JSON.parse(fs.readFileSync(abs, "utf8"));
  return { policy, policyAbs: abs, policyRelative: toRel(abs, root) };
}

/**
 * @param {string} packageDir
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function loadAdminScaffoldPackage(packageDir, toolRoot = DEFAULT_TOOL_ROOT, repoRoot = null) {
  const root = path.resolve(repoRoot ?? path.resolve(toolRoot, "../.."));
  const packageAbs = resolveSiteConfigPath(packageDir, toolRoot, root);
  if (!fs.existsSync(packageAbs)) {
    throw new Error(`Package directory not found: ${packageDir}`);
  }

  const missing = [];
  const warnings = [];
  /** @type {Record<string, unknown>} */
  const loaded = {};

  for (const name of PACKAGE_FILES) {
    const fileAbs = path.join(packageAbs, name);
    if (!fs.existsSync(fileAbs)) {
      missing.push(name);
      continue;
    }
    if (name.endsWith(".json")) {
      try {
        loaded[name] = JSON.parse(fs.readFileSync(fileAbs, "utf8"));
      } catch (err) {
        warnings.push(`Failed to parse ${name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      loaded[name] = fs.readFileSync(fileAbs, "utf8");
    }
  }

  const generationPackage = /** @type {Record<string, unknown>} */ (
    loaded["admin-scaffold-generation-package.json"] ?? {}
  );

  if (generationPackage.productionReady === true) {
    warnings.push("Package reports productionReady: true — writer dry-run expects false");
  }
  if (generationPackage.connectedToRuntime === true) {
    warnings.push("Package reports connectedToRuntime: true — writer dry-run expects false");
  }

  const siteSlug =
    typeof generationPackage.siteSlug === "string" ? generationPackage.siteSlug : null;

  return {
    packageAbs,
    packageRelative: toRel(packageAbs, root),
    siteSlug,
    generationPackage,
    sections: loaded["admin-sections.generated.json"] ?? null,
    components: loaded["admin-components.required.json"] ?? null,
    permissions: loaded["admin-permissions.generated.json"] ?? null,
    storageMappings: loaded["admin-storage-mappings.generated.json"] ?? null,
    publishPolicy: loaded["admin-publish-policy.generated.json"] ?? null,
    previewPlan: loaded["admin-preview-plan.generated.json"] ?? null,
    safetyChecklist: loaded["admin-safety-checklist.generated.md"] ?? null,
    missing,
    warnings,
  };
}

/**
 * @param {string} targetRel
 * @param {string} pattern
 */
function matchesAllowedPattern(targetRel, pattern) {
  const normTarget = normalizePosix(targetRel);
  const normPattern = normalizePosix(pattern.replace(/\{siteSlug\}/g, ""));
  if (normPattern.endsWith("/")) {
    return normTarget.startsWith(normPattern) || normTarget === normPattern.slice(0, -1);
  }
  return normTarget === normPattern || normTarget.startsWith(`${normPattern}/`);
}

/**
 * @param {object} opts
 * @param {string} opts.targetDirAbs
 * @param {string} opts.repoRoot
 * @param {object} opts.policy
 * @param {string | null} [opts.siteSlug]
 */
export function validateTargetDirectory({ targetDirAbs, repoRoot, policy, siteSlug = null }) {
  const targetRel = toRel(targetDirAbs, repoRoot);
  const rootRel = ".";
  /** @type {{ code: string; message: string; severity: "error" | "warning" }[]} */
  const issues = [];

  if (!targetDirAbs || !targetRel || targetRel === "") {
    issues.push({ code: "TARGET_MISSING", message: "target-dir is required", severity: "error" });
    return { ok: false, targetRel, issues, checks: {} };
  }

  const normalizedTarget = normalizePosix(targetRel);

  if (normalizedTarget === rootRel || path.resolve(targetDirAbs) === path.resolve(repoRoot)) {
    issues.push({
      code: "PROJECT_ROOT",
      message: "target-dir must not be the project root",
      severity: "error",
    });
  }

  const blockedPrefixes = policy.sariswingAdminExclusion?.blockedPathPrefixes ?? ["src/pages/admin"];
  for (const prefix of blockedPrefixes) {
    const normPrefix = normalizePosix(prefix);
    if (
      normalizedTarget === normPrefix ||
      normalizedTarget.startsWith(`${normPrefix}/`) ||
      normalizedTarget === `${normPrefix}/`
    ) {
      issues.push({
        code: "SRC_PAGES_ADMIN",
        message: `target-dir is forbidden: ${normPrefix} (Sariswing existing admin)`,
        severity: "error",
      });
    }
  }

  const localPreviewPrefix = "src/pages/__admin-preview";
  if (
    normalizedTarget === localPreviewPrefix ||
    normalizedTarget.startsWith(`${localPreviewPrefix}/`)
  ) {
    issues.push({
      code: "LOCAL_PREVIEW_ROUTE",
      message: `target-dir must not be the local preview route (${localPreviewPrefix})`,
      severity: "error",
    });
  }

  const hardBlocked = ["dist", "public-dist", "src/pages/admin", "src/pages/admin/"];
  for (const blocked of hardBlocked) {
    const norm = normalizePosix(blocked);
    if (normalizedTarget === norm || normalizedTarget.startsWith(`${norm}/`)) {
      issues.push({
        code: "HARD_BLOCKED",
        message: `target-dir is forbidden: ${blocked}`,
        severity: "error",
      });
    }
  }

  for (const disallowed of policy.disallowedTargets ?? []) {
    if (disallowed === "project-root") continue;
    if (disallowed === "existing-sariswing-admin-files") continue;
    if (disallowed === "production-project-admin-route") {
      if (normalizedTarget.includes("/admin") && !normalizedTarget.includes("admin-writer")) {
        const inSrcPagesAdmin =
          normalizedTarget.startsWith("src/pages/admin") ||
          normalizedTarget === "src/pages/admin";
        if (inSrcPagesAdmin) {
          issues.push({
            code: "PRODUCTION_ADMIN_ROUTE",
            message: "target-dir matches production admin route pattern",
            severity: "error",
          });
        }
      }
      continue;
    }
    const norm = normalizePosix(disallowed.replace(/\/$/, ""));
    if (
      normalizedTarget === norm ||
      normalizedTarget.startsWith(`${norm}/`) ||
      normalizedTarget.endsWith(`/${norm}`)
    ) {
      issues.push({
        code: "POLICY_DISALLOWED",
        message: `target-dir matches disallowed target: ${disallowed}`,
        severity: "error",
      });
    }
  }

  let sandboxMatch = false;
  for (const allowed of policy.allowedTargets ?? []) {
    const pattern = siteSlug ? allowed.replace("{siteSlug}", siteSlug) : allowed;
    if (matchesAllowedPattern(normalizedTarget, pattern)) {
      sandboxMatch = true;
      break;
    }
  }

  let targetExists = false;
  let targetEmpty = true;
  let existingFileCount = 0;
  if (fs.existsSync(targetDirAbs)) {
    targetExists = true;
    const entries = fs.readdirSync(targetDirAbs);
    existingFileCount = entries.length;
    targetEmpty = entries.length === 0;
  }

  const errors = issues.filter((i) => i.severity === "error");
  const ok = errors.length === 0;

  return {
    ok,
    targetRel: normalizedTarget,
    issues,
    checks: {
      targetExists,
      targetEmpty,
      existingFileCount,
      sandboxMatch,
      srcPagesAdminTouched: errors.some((e) => e.code === "SRC_PAGES_ADMIN"),
      sariswingAdminTouched: errors.some(
        (e) => e.code === "SRC_PAGES_ADMIN" || e.code === "PRODUCTION_ADMIN_ROUTE",
      ),
    },
  };
}

/**
 * @param {string} targetDirAbs
 * @param {readonly { path: string; type: string; source: string }[]} baseFiles
 */
function buildPlannedFiles(targetDirAbs, baseFiles) {
  return baseFiles.map((file) => {
    const abs = path.join(targetDirAbs, file.path);
    const existsBeforeWrite = fs.existsSync(abs);
    return {
      path: file.path,
      type: file.type,
      source: file.source,
      existsBeforeWrite,
      willWrite: false,
      willOverwrite: false,
      reason: "dry-run only",
    };
  });
}

/**
 * @param {object} opts
 */
export function runAdminScaffoldWriterDryRun(opts) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(opts.repoRoot ?? path.resolve(toolRoot, "../.."));
  const mode = opts.mode ?? "dry-run";

  if (mode !== "dry-run" && mode !== "plan-only") {
    throw new Error(
      `Mode "${mode}" is not supported in G-5w-b. Use --mode dry-run or plan-only.`,
    );
  }

  const { policy } = loadWriterPolicy(
    opts.policyPath ?? "config/admin/admin-scaffold-writer-policy.json",
    toolRoot,
    repoRoot,
  );

  const pkg = loadAdminScaffoldPackage(opts.packageDir, toolRoot, repoRoot);
  const siteSlug = opts.siteSlug ?? pkg.siteSlug ?? "unknown";

  const packageAbs = pkg.packageAbs;
  const targetAbs = resolveWriterPath(opts.targetDir, toolRoot, repoRoot);
  const reportAbs = resolveWriterPath(
    opts.reportDir ?? `output/admin-writer-dry-runs/${siteSlug}`,
    toolRoot,
    repoRoot,
  );

  const targetValidation = validateTargetDirectory({
    targetDirAbs: targetAbs,
    repoRoot,
    policy,
    siteSlug,
  });

  const generatedAt = new Date().toISOString();
  const plannedFiles = buildPlannedFiles(targetAbs, BASE_PLANNED_FILES);

  const safety = {
    targetAllowed: targetValidation.ok,
    applyRequested: Boolean(opts.applyRequested),
    runtimeFilesWritten: false,
    overwroteExistingFiles: false,
    productionTouched: false,
    srcPagesAdminTouched: targetValidation.checks.srcPagesAdminTouched ?? false,
    sariswingAdminTouched: targetValidation.checks.sariswingAdminTouched ?? false,
  };

  const plannedFilesManifest = {
    mode: "dry-run",
    siteSlug,
    sourcePackageDir: pkg.packageRelative,
    targetDir: targetValidation.targetRel,
    generatedAt,
    writerImplementedPhase: WRITER_PHASE,
    applyImplemented: false,
    runtimeFilesWritten: false,
    plannedFiles,
    safety,
  };

  const rollbackManifestDraft = {
    version: "0.1.0",
    mode: "dry-run",
    phase: WRITER_PHASE,
    siteSlug,
    targetDir: targetValidation.targetRel,
    rollbackRequired: false,
    futureRollbackRequired: true,
    generatedFilesWouldBeDeleted: plannedFiles.map((f) => f.path),
    overwrittenFiles: [],
    rollbackInstructions: [
      "G-5w-b dry-run only — no files were written to target-dir.",
      "Future G-5w-c apply: rollback is delete generated sandbox directory.",
      "Early writer must not overwrite existing files; overwrittenFiles must stay empty.",
      "Maintainer should git commit or stash before any future --apply.",
    ],
    earlyWriterMustNotOverwrite: true,
  };

  const warnings = [...pkg.warnings];
  if (pkg.missing.length) {
    warnings.push(`Missing package files: ${pkg.missing.join(", ")}`);
  }
  if (!targetValidation.ok) {
    warnings.push(...targetValidation.issues.map((i) => i.message));
  }
  if (opts.applyRequested) {
    warnings.push(APPLY_NOT_IMPLEMENTED_MSG);
  }

  const forbiddenOperations = policy.forbiddenOperations ?? [];

  const report = buildDryRunReport({
    siteSlug,
    mode,
    packageRelative: pkg.packageRelative,
    targetRel: targetValidation.targetRel,
    reportRelative: toRel(reportAbs, repoRoot),
    policyRelative: opts.policyRelative ?? "tools/static-to-astro/config/admin/admin-scaffold-writer-policy.json",
    generatedAt,
    targetValidation,
    plannedFiles,
    pkg,
    rollbackManifestDraft,
    forbiddenOperations,
    warnings,
    safety,
    applyRequested: Boolean(opts.applyRequested),
  });

  const recommendedCommands = buildRecommendedCommands({
    packageRelative: pkg.packageRelative,
    targetRel: targetValidation.targetRel,
    reportRelative: toRel(reportAbs, repoRoot),
    siteSlug,
  });

  return {
    siteSlug,
    mode,
    packageAbs,
    packageRelative: pkg.packageRelative,
    targetAbs,
    targetRelative: targetValidation.targetRel,
    reportAbs,
    reportRelative: toRel(reportAbs, repoRoot),
    targetValidation,
    plannedFilesManifest,
    rollbackManifestDraft,
    report,
    recommendedCommands,
    warnings,
    missingPackageFiles: pkg.missing,
    applyRequested: Boolean(opts.applyRequested),
    ok: targetValidation.ok && pkg.missing.length === 0 && !opts.applyRequested,
  };
}

/**
 * @param {ReturnType<typeof runAdminScaffoldWriterDryRun>} result
 */
export function writeAdminScaffoldWriterDryRunReports(result) {
  fs.mkdirSync(result.reportAbs, { recursive: true });

  const writeJson = (name, data) => {
    fs.writeFileSync(path.join(result.reportAbs, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  };
  const writeText = (name, text) => {
    fs.writeFileSync(path.join(result.reportAbs, name), text, "utf8");
  };

  writeJson("planned-files-manifest.json", result.plannedFilesManifest);
  writeJson("rollback-manifest.draft.json", result.rollbackManifestDraft);
  writeText("ADMIN_SCAFFOLD_WRITER_DRY_RUN_REPORT.md", result.report);
  writeText("recommended-next-commands.md", result.recommendedCommands);

  return result.reportAbs;
}

/**
 * @param {object} p
 */
function buildDryRunReport(p) {
  const lines = [
    "# Admin Scaffold Writer Dry-run Report",
    "",
    `**Phase:** ${WRITER_PHASE} · **Generated:** ${p.generatedAt}`,
    "",
    "## Summary",
    "",
    "| Item | Value |",
    "| --- | --- |",
    `| mode | ${p.mode} |`,
    `| siteSlug | ${p.siteSlug} |`,
    `| dry-run only | **Yes** |`,
    `| apply implemented | **false** |`,
    `| runtime files written | **false** |`,
    `| no files written to target-dir | **Yes** |`,
    `| target allowed | ${p.targetValidation.ok ? "**Yes**" : "**No**"} |`,
    "",
    "## Inputs",
    "",
    "| Input | Path |",
    "| --- | --- |",
    `| package-dir | \`${p.packageRelative}\` |`,
    `| target-dir | \`${p.targetRel}\` |`,
    `| report-dir | \`${p.reportRelative}\` |`,
    `| policy | \`${p.policyRelative}\` |`,
    "",
    "## Target directory safety check",
    "",
  ];

  if (p.targetValidation.issues.length === 0) {
    lines.push("- All checks passed.");
  } else {
    for (const issue of p.targetValidation.issues) {
      lines.push(`- **${issue.severity}** [${issue.code}]: ${issue.message}`);
    }
  }

  lines.push(
    "",
    `| Check | Value |`,
    `| --- | --- |`,
    `| target exists | ${p.targetValidation.checks.targetExists} |`,
    `| target empty | ${p.targetValidation.checks.targetEmpty} |`,
    `| sandbox match | ${p.targetValidation.checks.sandboxMatch} |`,
    `| srcPagesAdminTouched | ${p.safety.srcPagesAdminTouched} |`,
    `| sariswingAdminTouched | ${p.safety.sariswingAdminTouched} |`,
    "",
    "## Planned files",
    "",
    `Total planned: ${p.plannedFiles.length} (willWrite: false — dry-run only)`,
    "",
    "| Path | Type | existsBeforeWrite | willOverwrite |",
    "| --- | --- | --- | --- |",
  );

  for (const file of p.plannedFiles) {
    lines.push(
      `| \`${file.path}\` | ${file.type} | ${file.existsBeforeWrite} | ${file.willOverwrite} |`,
    );
  }

  lines.push(
    "",
    "## Sections",
    "",
    p.pkg.sections
      ? "```json\n" + JSON.stringify(p.pkg.sections, null, 2).slice(0, 2000) + "\n```"
      : "_admin-sections.generated.json not loaded_",
    "",
    "## Components",
    "",
    p.pkg.components
      ? "```json\n" + JSON.stringify(p.pkg.components, null, 2).slice(0, 2000) + "\n```"
      : "_admin-components.required.json not loaded_",
    "",
    "## Permissions",
    "",
    p.pkg.permissions
      ? "```json\n" + JSON.stringify(p.pkg.permissions, null, 2).slice(0, 1500) + "\n```"
      : "_admin-permissions.generated.json not loaded_",
    "",
    "## Storage mappings",
    "",
    p.pkg.storageMappings
      ? "```json\n" + JSON.stringify(p.pkg.storageMappings, null, 2).slice(0, 1500) + "\n```"
      : "_admin-storage-mappings.generated.json not loaded_",
    "",
    "## Publish policy",
    "",
    p.pkg.publishPolicy
      ? "```json\n" + JSON.stringify(p.pkg.publishPolicy, null, 2).slice(0, 1500) + "\n```"
      : "_admin-publish-policy.generated.json not loaded_",
    "",
    "## Preview plan",
    "",
    p.pkg.previewPlan
      ? "```json\n" + JSON.stringify(p.pkg.previewPlan, null, 2).slice(0, 1500) + "\n```"
      : "_admin-preview-plan.generated.json not loaded_",
    "",
    "## Rollback draft",
    "",
    "See `rollback-manifest.draft.json` in this report directory.",
    "",
    `- rollbackRequired (dry-run): **false**`,
    `- futureRollbackRequired (apply): **true**`,
    `- overwrittenFiles: **[]**`,
    "",
    "## Forbidden operations confirmed",
    "",
  );

  for (const op of p.forbiddenOperations) {
    lines.push(`- ${op}`);
  }

  lines.push(
    "",
    "## Safety statement",
    "",
    "- dry-run only",
    "- apply implemented: **false**",
    "- runtime files written: **false**",
    "- no files written to target-dir",
    "- no `src/pages/admin`",
    "- no Sariswing admin modification",
    "- no Supabase Auth",
    "- no DB query/update",
    "- no Storage upload",
    "- no GitHub dispatch",
    "- no FTP deploy",
    "- no production touched",
    "",
    "## Warnings",
    "",
  );

  if (p.warnings.length === 0) {
    lines.push("- none");
  } else {
    for (const w of p.warnings) {
      lines.push(`- ${w}`);
    }
  }

  if (p.applyRequested) {
    lines.push("", `**--apply rejected:** ${APPLY_NOT_IMPLEMENTED_MSG}`);
  }

  lines.push(
    "",
    "## Recommended next commands",
    "",
    "See `recommended-next-commands.md` in this report directory.",
    "",
    "---",
    "",
    `*${WRITER_PHASE}: dry-run only. No runtime admin files written.*`,
  );

  return lines.join("\n");
}

/**
 * @param {object} p
 */
function buildRecommendedCommands(p) {
  return `# Recommended Next Commands — Admin Scaffold Writer

**Phase:** ${WRITER_PHASE} · dry-run only

## Re-run dry-run

\`\`\`bash
node tools/static-to-astro/scripts/write-admin-scaffold.mjs \\
  --package-dir ${p.packageRelative} \\
  --target-dir ${p.targetRel} \\
  --mode dry-run
\`\`\`

## Review reports

\`\`\`bash
ls -la ${p.reportRelative}
cat ${p.reportRelative}/ADMIN_SCAFFOLD_WRITER_DRY_RUN_REPORT.md
cat ${p.reportRelative}/planned-files-manifest.json
cat ${p.reportRelative}/rollback-manifest.draft.json
\`\`\`

## Future apply (G-5w-c — NOT available in G-5w-b)

\`\`\`bash
# NOT IMPLEMENTED — for planning only
node tools/static-to-astro/scripts/write-admin-scaffold.mjs \\
  --package-dir ${p.packageRelative} \\
  --target-dir ${p.targetRel} \\
  --mode apply-to-sandbox \\
  --apply \\
  --approval-id G-5w-c-local-sandbox
\`\`\`

**Important:**

- \`--apply\` is **not implemented** in G-5w-b
- Apply is planned for **G-5w-c** onward
- Sandbox output directory only: \`tools/static-to-astro/output/admin-writer-sandbox/${p.siteSlug}/\`
- Explicit approval required before any future apply
- Sariswing \`src/pages/admin/\` must never be targeted

## Next phases

| Phase | Focus |
| --- | --- |
| **G-5w-c** | Apply to sandbox output directory only |
| **G-5w-d** | Generated scaffold review |
| **G-5x** | Staging runtime shell integration |
`;
}
