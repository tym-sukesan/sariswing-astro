/**
 * Admin scaffold writer sandbox applier (G-5w-c).
 * Writes scaffold files only under output/admin-writer-sandbox/{siteSlug}/.
 * No runtime connection, no src/pages/admin, no overwrite.
 */

import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_TOOL_ROOT,
  loadAdminScaffoldPackage,
  loadWriterPolicy,
  resolveWriterPath,
  validateTargetDirectory,
} from "./admin-scaffold-writer-dry-runner.mjs";

export const APPLY_PHASE = "G-5w-c";
export const SANDBOX_APPLY_PREFIX = "tools/static-to-astro/output/admin-writer-sandbox/";
export const APPROVAL_ID_REQUIRED_MSG = "--approval-id is required when using --apply";

/** @type {readonly { src: string; dest: string }[]} */
export const CONFIG_COPIES = [
  { src: "admin-sections.generated.json", dest: "admin/config/admin-sections.generated.json" },
  { src: "admin-components.required.json", dest: "admin/config/admin-components.required.json" },
  { src: "admin-permissions.generated.json", dest: "admin/config/admin-permissions.generated.json" },
  {
    src: "admin-storage-mappings.generated.json",
    dest: "admin/config/admin-storage-mappings.generated.json",
  },
  { src: "admin-publish-policy.generated.json", dest: "admin/config/admin-publish-policy.generated.json" },
  { src: "admin-preview-plan.generated.json", dest: "admin/config/admin-preview-plan.generated.json" },
];

/** @type {readonly { file: string; title: string; section: string }[]} */
export const SCAFFOLD_PAGES = [
  { file: "index.astro", title: "Dashboard Admin Scaffold", section: "Dashboard" },
  { file: "profile.astro", title: "Profile Admin Scaffold", section: "Profile" },
  { file: "schedule.astro", title: "Schedule Admin Scaffold", section: "Schedule" },
  { file: "discography.astro", title: "Discography Admin Scaffold", section: "Discography" },
  { file: "links.astro", title: "Links Admin Scaffold", section: "Links" },
  { file: "news.astro", title: "News Admin Scaffold", section: "News" },
  { file: "media.astro", title: "Media Admin Scaffold", section: "Media" },
  { file: "publish.astro", title: "Publish Admin Scaffold", section: "Publish" },
  { file: "settings.astro", title: "Settings Admin Scaffold", section: "Settings" },
];

/**
 * @param {string} dirAbs
 * @returns {string[]}
 */
function listAllFilesRecursive(dirAbs) {
  if (!fs.existsSync(dirAbs)) {
    return [];
  }
  /** @type {string[]} */
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  };
  walk(dirAbs);
  return files;
}

/**
 * @param {string} absPath
 * @param {string} repoRoot
 */
function toRel(absPath, repoRoot) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

/**
 * @param {string} section
 * @param {string} title
 * @param {string} siteSlug
 */
export function buildScaffoldPageAstro(section, title, siteSlug) {
  return `---
// G-5w-c sandbox scaffold only — not runtime admin
const section = ${JSON.stringify(section)};
const siteSlug = ${JSON.stringify(siteSlug)};
---
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow,noarchive" />
    <title>${title}</title>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>Site: <code>{siteSlug}</code> · Section: <code>{section}</code></p>
      <p>This file was generated into the sandbox output directory only.</p>
      <ul>
        <li>Scaffold only</li>
        <li>Generated sandbox only</li>
        <li>Not connected to runtime</li>
        <li>No Supabase Auth</li>
        <li>No DB query or update</li>
        <li>No Storage upload</li>
        <li>No GitHub dispatch</li>
        <li>No FTP deploy</li>
        <li>Production disabled</li>
      </ul>
    </main>
  </body>
</html>
`;
}

/**
 * @param {string} siteSlug
 * @param {string} targetRel
 */
export function buildAdminReadme(siteSlug, targetRel) {
  return `# Admin Scaffold Sandbox — ${siteSlug}

**Phase:** G-5w-c · apply-to-sandbox only

This directory contains **generated sandbox scaffold files**. It is **not** the production admin at \`src/pages/admin/\`.

## Safety

| Item | Status |
| --- | --- |
| Scaffold only | Yes |
| Generated sandbox only | Yes |
| Connected to runtime | **No** |
| Supabase Auth | not connected |
| DB query / update | not performed |
| Storage upload | not performed |
| GitHub dispatch | not performed |
| FTP deploy | not performed |
| Production touched | **No** |

## Target

\`${targetRel}\`

## Rollback

Delete this sandbox directory to rollback. See \`manifests/rollback-manifest.json\`.
`;
}

/**
 * @param {object} opts
 */
export function validateSandboxApplyTarget(opts) {
  const { targetDirAbs, repoRoot, siteSlug, policy } = opts;
  const base = validateTargetDirectory({
    targetDirAbs,
    repoRoot,
    policy,
    siteSlug,
  });

  /** @type {{ code: string; message: string; severity: "error" }[]} */
  const applyIssues = [...base.issues.filter((i) => i.severity === "error")];

  const targetRel = base.targetRel;
  const sandboxPrefix = SANDBOX_APPLY_PREFIX.replace(/\/$/, "");

  if (!targetRel.startsWith(sandboxPrefix)) {
    applyIssues.push({
      code: "NOT_SANDBOX",
      message: `--apply is only allowed under ${SANDBOX_APPLY_PREFIX}{siteSlug}/`,
      severity: "error",
    });
  }

  if (siteSlug && siteSlug !== "unknown") {
    const expectedSuffix = `${sandboxPrefix}/${siteSlug}`.replace(/\/+/g, "/");
    const normalizedExpected = expectedSuffix.replace(/\/$/, "");
    const normalizedTarget = targetRel.replace(/\/$/, "");
    if (normalizedTarget !== normalizedExpected && !normalizedTarget.endsWith(`/${siteSlug}`)) {
      applyIssues.push({
        code: "SITE_SLUG_SCOPE",
        message: `target-dir must be scoped to siteSlug "${siteSlug}" under admin-writer-sandbox`,
        severity: "error",
      });
    }
  }

  const existingAbsFiles = listAllFilesRecursive(targetDirAbs);
  const existingRelFiles = existingAbsFiles.map((f) => toRel(f, repoRoot));

  if (existingRelFiles.length > 0) {
    applyIssues.push({
      code: "TARGET_NOT_EMPTY",
      message: `target-dir contains ${existingRelFiles.length} existing file(s). Apply requires an empty directory. No overwrite.`,
      severity: "error",
    });
  }

  const ok = applyIssues.length === 0;

  return {
    ...base,
    ok,
    issues: [...base.issues, ...applyIssues.filter((i) => !base.issues.some((b) => b.code === i.code))],
    applyIssues,
    existingRelFiles,
    sandboxApplyAllowed: ok,
    checks: {
      ...base.checks,
      sandboxApplyPrefix: targetRel.startsWith(sandboxPrefix),
      targetEmptyForApply: existingRelFiles.length === 0,
    },
  };
}

/**
 * @param {object} opts
 */
export function runAdminScaffoldWriterApply(opts) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(opts.repoRoot ?? path.resolve(toolRoot, "../.."));

  if (!opts.approvalId || String(opts.approvalId).trim() === "") {
    throw new Error(APPROVAL_ID_REQUIRED_MSG);
  }

  const { policy } = loadWriterPolicy(
    opts.policyPath ?? "config/admin/admin-scaffold-writer-policy.json",
    toolRoot,
    repoRoot,
  );

  const pkg = loadAdminScaffoldPackage(opts.packageDir, toolRoot, repoRoot);
  const siteSlug = opts.siteSlug ?? pkg.siteSlug ?? "unknown";
  const approvalId = String(opts.approvalId).trim();
  const targetAbs = resolveWriterPath(opts.targetDir, toolRoot, repoRoot);
  const generatedAt = new Date().toISOString();

  const targetValidation = validateSandboxApplyTarget({
    targetDirAbs: targetAbs,
    repoRoot,
    siteSlug,
    policy,
  });

  if (pkg.missing.length > 0) {
    return {
      ok: false,
      siteSlug,
      approvalId,
      packageRelative: pkg.packageRelative,
      targetRelative: targetValidation.targetRel,
      targetAbs,
      targetValidation,
      missingPackageFiles: pkg.missing,
      filesCreated: [],
      filesSkipped: [],
      skippedExistingFiles: [],
      overwrittenFiles: [],
      warnings: [`Missing package files: ${pkg.missing.join(", ")}`],
      wroteFiles: false,
    };
  }

  if (!targetValidation.ok) {
    return {
      ok: false,
      siteSlug,
      approvalId,
      packageRelative: pkg.packageRelative,
      targetRelative: targetValidation.targetRel,
      targetAbs,
      targetValidation,
      missingPackageFiles: [],
      filesCreated: [],
      filesSkipped: [],
      skippedExistingFiles: targetValidation.existingRelFiles ?? [],
      overwrittenFiles: [],
      warnings: targetValidation.applyIssues?.map((i) => i.message) ?? [],
      wroteFiles: false,
    };
  }

  /** @type {string[]} */
  const filesCreated = [];
  /** @type {string[]} */
  const filesSkipped = [];
  /** @type {string[]} */
  const skippedExistingFiles = [];
  /** @type {string[]} */
  const overwrittenFiles = [];

  const writeNewFile = (relPath, content) => {
    const abs = path.join(targetAbs, relPath);
    if (fs.existsSync(abs)) {
      skippedExistingFiles.push(relPath);
      filesSkipped.push(relPath);
      throw new Error(`Refusing to overwrite existing file: ${relPath}`);
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
    filesCreated.push(relPath);
  };

  const copyNewFile = (srcName, destRel) => {
    const srcAbs = path.join(pkg.packageAbs, srcName);
    const abs = path.join(targetAbs, destRel);
    if (fs.existsSync(abs)) {
      skippedExistingFiles.push(destRel);
      filesSkipped.push(destRel);
      throw new Error(`Refusing to overwrite existing file: ${destRel}`);
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.copyFileSync(srcAbs, abs);
    filesCreated.push(destRel);
  };

  try {
    writeNewFile(
      "admin/README.md",
      buildAdminReadme(siteSlug, targetValidation.targetRel),
    );

    for (const page of SCAFFOLD_PAGES) {
      const rel = `admin/pages/${page.file}`;
      writeNewFile(rel, buildScaffoldPageAstro(page.section, page.title, siteSlug));
    }

    for (const copy of CONFIG_COPIES) {
      copyNewFile(copy.src, copy.dest);
    }

    const safety = {
      targetAllowed: true,
      sandboxApplyOnly: true,
      applyRequested: true,
      runtimeFilesWritten: false,
      connectedToRuntime: false,
      productionTouched: false,
      overwroteExistingFiles: false,
      srcPagesAdminTouched: false,
      sariswingAdminTouched: false,
    };

    const manifestRelPaths = [
      "admin/manifests/generated-files-manifest.json",
      "admin/manifests/rollback-manifest.json",
      "admin/manifests/writer-report.md",
    ];
    const allPlannedCreated = [...filesCreated, ...manifestRelPaths];

    const generatedFilesManifest = {
      version: "0.1.0",
      mode: "apply-to-sandbox",
      phase: APPLY_PHASE,
      siteSlug,
      approvalId,
      targetDir: targetValidation.targetRel,
      sourcePackageDir: pkg.packageRelative,
      generatedAt,
      filesCreated: allPlannedCreated,
      filesSkipped,
      skippedExistingFiles,
      overwrittenFiles,
      safety,
    };

    const rollbackManifest = {
      version: "0.1.0",
      phase: APPLY_PHASE,
      mode: "apply-to-sandbox",
      rollbackMode: "delete-generated-sandbox-directory",
      siteSlug,
      approvalId,
      targetDir: targetValidation.targetRel,
      generatedFiles: allPlannedCreated,
      overwrittenFiles: [],
      skippedExistingFiles,
      rollbackInstructions: [
        "Early writer never overwrites existing files.",
        `Delete sandbox directory: ${targetValidation.targetRel}`,
        "No production rollback needed because production was not touched.",
        "Review manifests before deleting.",
      ],
      safeToDeleteTargetDir: true,
      requiresManualReviewBeforeDelete: true,
      earlyWriterMustNotOverwrite: true,
    };

    const writerReport = buildWriterApplyReport({
      siteSlug,
      approvalId,
      generatedAt,
      packageRelative: pkg.packageRelative,
      targetRel: targetValidation.targetRel,
      filesCreated: allPlannedCreated,
      filesSkipped,
      skippedExistingFiles,
      overwrittenFiles,
      safety,
      forbiddenOperations: policy.forbiddenOperations ?? [],
    });

    writeNewFile(
      "admin/manifests/generated-files-manifest.json",
      `${JSON.stringify(generatedFilesManifest, null, 2)}\n`,
    );
    writeNewFile(
      "admin/manifests/rollback-manifest.json",
      `${JSON.stringify(rollbackManifest, null, 2)}\n`,
    );
    writeNewFile("admin/manifests/writer-report.md", writerReport);

    return {
      ok: true,
      siteSlug,
      approvalId,
      packageRelative: pkg.packageRelative,
      targetRelative: targetValidation.targetRel,
      targetAbs,
      targetValidation,
      missingPackageFiles: [],
      filesCreated,
      filesSkipped,
      skippedExistingFiles,
      overwrittenFiles,
      generatedFilesManifest,
      rollbackManifest,
      writerReport,
      warnings: pkg.warnings,
      wroteFiles: true,
      safety,
    };
  } catch (err) {
    return {
      ok: false,
      siteSlug,
      approvalId,
      packageRelative: pkg.packageRelative,
      targetRelative: targetValidation.targetRel,
      targetAbs,
      targetValidation,
      missingPackageFiles: [],
      filesCreated,
      filesSkipped,
      skippedExistingFiles,
      overwrittenFiles,
      warnings: [
        err instanceof Error ? err.message : String(err),
        ...(filesCreated.length ? [`Partial write: ${filesCreated.length} file(s) may exist in sandbox`] : []),
      ],
      wroteFiles: filesCreated.length > 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * @param {object} p
 */
function buildWriterApplyReport(p) {
  return `# Admin Scaffold Writer Apply Report

**Phase:** ${APPLY_PHASE} · **Generated:** ${p.generatedAt}

## Summary

| Item | Value |
| --- | --- |
| mode | apply-to-sandbox |
| siteSlug | ${p.siteSlug} |
| approvalId | ${p.approvalId} |
| files created | ${p.filesCreated.length} |
| files skipped | ${p.filesSkipped.length} |
| overwritten files | ${p.overwrittenFiles.length} |

## Approval

- approval-id: \`${p.approvalId}\`
- apply-to-sandbox only
- sandbox prefix: \`${SANDBOX_APPLY_PREFIX}\`

## Source package

\`${p.packageRelative}\`

## Target directory

\`${p.targetRel}\`

## Files created

${p.filesCreated.map((f) => `- \`${f}\``).join("\n")}

## Files skipped

${p.filesSkipped.length ? p.filesSkipped.map((f) => `- \`${f}\``).join("\n") : "- none"}

## Safety status

| Flag | Value |
| --- | --- |
| runtimeFilesWritten | ${p.safety.runtimeFilesWritten} |
| connectedToRuntime | ${p.safety.connectedToRuntime} |
| productionTouched | ${p.safety.productionTouched} |
| srcPagesAdminTouched | ${p.safety.srcPagesAdminTouched} |
| sariswingAdminTouched | ${p.safety.sariswingAdminTouched} |
| overwroteExistingFiles | ${p.safety.overwroteExistingFiles} |

## Rollback

Delete the sandbox target directory: \`${p.targetRel}\`

See \`rollback-manifest.json\` in this directory.

## Forbidden operations confirmed

${p.forbiddenOperations.map((op) => `- ${op}`).join("\n")}

## Safety statement

- apply-to-sandbox only
- no runtime connection
- no \`src/pages/admin\`
- no Sariswing admin modification
- no Supabase Auth
- no DB query/update
- no Storage upload
- no GitHub dispatch
- no FTP deploy
- no production touched

## Next steps

1. Review generated scaffold pages under \`admin/pages/\`
2. Review config copies under \`admin/config/\`
3. G-5w-d: generated scaffold review
4. G-5x: staging runtime shell integration (separate phase)

---

*${APPLY_PHASE}: sandbox apply only. Not runtime admin.*
`;
}

/** Planned file count including config copies and manifests */
export function getExpectedApplyFileCount() {
  return 1 + SCAFFOLD_PAGES.length + CONFIG_COPIES.length + 3;
}
