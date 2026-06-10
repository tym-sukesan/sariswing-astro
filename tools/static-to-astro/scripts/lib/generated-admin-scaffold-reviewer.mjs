/**
 * Generated admin scaffold reviewer (G-5w-d).
 * Read-only review of sandbox output under admin-writer-sandbox/.
 * Writes review reports to output/admin-scaffold-reviews/ only.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONFIG_COPIES,
  SANDBOX_APPLY_PREFIX,
  SCAFFOLD_PAGES,
} from "./admin-scaffold-writer-applier.mjs";
import { resolveWriterPath } from "./admin-scaffold-writer-dry-runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");
export const REVIEW_PHASE = "G-5w-d";

/** @type {readonly string[]} */
export const PAGE_SAFETY_MARKERS = [
  'content="noindex,nofollow,noarchive"',
  "scaffold only",
  "generated sandbox only",
  "not connected to runtime",
  "no supabase auth",
  "no db query or update",
  "no storage upload",
  "no github dispatch",
  "no ftp deploy",
  "production disabled",
];

/** @type {readonly RegExp[]} */
export const PAGE_FORBIDDEN_PATTERNS = [
  /@supabase\/\w+/i,
  /from\s+['"]@supabase/i,
  /createClient\s*\(/i,
  /supabase\.from\s*\(/i,
  /import\.meta\.env\.(SUPABASE|SERVICE_ROLE|FTP|GITHUB|SECRET|TOKEN|PASSWORD)/i,
  /\bfetch\s*\(/i,
  /octokit|github\.actions|workflow_dispatch/i,
  /basic-ftp|ftp\.deploy|deployFtp/i,
];

/** @type {readonly string[]} */
export const EXPECTED_SECTION_IDS = [
  "dashboard",
  "profile",
  "schedule",
  "discography",
  "links",
  "news",
  "media",
  "publish",
  "settings",
];

/** @type {readonly string[]} */
export const EXPECTED_STORAGE_ASSET_TYPES = [
  "discography_cover",
  "schedule_home",
  "schedule_flyer",
];

/** @type {readonly string[]} */
export const EXPECTED_ROLES = ["viewer", "editor", "admin"];

/**
 * @returns {string[]}
 */
export function buildExpectedRelativeFiles() {
  const files = ["admin/README.md"];
  for (const page of SCAFFOLD_PAGES) {
    files.push(`admin/pages/${page.file}`);
  }
  for (const copy of CONFIG_COPIES) {
    files.push(copy.dest);
  }
  files.push(
    "admin/manifests/generated-files-manifest.json",
    "admin/manifests/rollback-manifest.json",
    "admin/manifests/writer-report.md",
  );
  return files;
}

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
 * @param {string} targetAbs
 * @param {string} rel
 */
function readJsonFileFromTarget(targetAbs, rel) {
  const abs = path.join(targetAbs, rel);
  if (!fs.existsSync(abs)) {
    return { ok: false, error: `missing: ${rel}`, data: null };
  }
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(abs, "utf8")), error: null };
  } catch (err) {
    return {
      ok: false,
      error: `invalid JSON ${rel}: ${err instanceof Error ? err.message : String(err)}`,
      data: null,
    };
  }
}

/**
 * @param {string[]} blockers
 * @param {string[]} warnings
 * @param {string} message
 * @param {"blocker"|"warning"} severity
 */
function record(blockers, warnings, message, severity) {
  if (severity === "blocker") {
    blockers.push(message);
  } else {
    warnings.push(message);
  }
}

/**
 * @param {object} opts
 */
export function reviewGeneratedAdminScaffold(opts) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(opts.repoRoot ?? path.resolve(toolRoot, "../.."));
  const targetAbs = resolveWriterPath(opts.targetDir, toolRoot, repoRoot);
  const outAbs = resolveWriterPath(
    opts.outDir ?? `output/admin-scaffold-reviews/${path.basename(targetAbs)}`,
    toolRoot,
    repoRoot,
  );

  const targetRel = toRel(targetAbs, repoRoot);
  const outRel = toRel(outAbs, repoRoot);
  const generatedAt = new Date().toISOString();

  /** @type {string[]} */
  const blockers = [];
  /** @type {string[]} */
  const warnings = [];

  if (!fs.existsSync(targetAbs)) {
    blockers.push(`target-dir not found: ${targetRel}`);
    return buildReviewResult({
      targetRel,
      outRel,
      outAbs,
      generatedAt,
      blockers,
      warnings,
      readyForG5x: false,
      checks: {},
    });
  }

  if (!targetRel.startsWith(SANDBOX_APPLY_PREFIX.replace(/\/$/, ""))) {
    blockers.push(`target-dir must be under ${SANDBOX_APPLY_PREFIX}`);
  }

  const expectedFiles = buildExpectedRelativeFiles();
  const actualAbsFiles = listAllFilesRecursive(targetAbs);
  const actualRelFiles = actualAbsFiles
    .map((f) => toRel(f, repoRoot))
    .map((f) => f.replace(`${targetRel}/`, "").replace(`${targetRel}`, ""))
    .filter(Boolean)
    .sort();

  const expectedSet = new Set(expectedFiles);
  const actualSet = new Set(actualRelFiles);

  /** @type {string[]} */
  const missingFiles = expectedFiles.filter((f) => !actualSet.has(f));
  /** @type {string[]} */
  const extraFiles = actualRelFiles.filter((f) => !expectedSet.has(f));

  for (const missing of missingFiles) {
    record(blockers, warnings, `Missing expected file: ${missing}`, "blocker");
  }
  for (const extra of extraFiles) {
    record(blockers, warnings, `Unexpected extra file: ${extra}`, "warning");
  }

  /** @type {Record<string, { ok: boolean; missingMarkers: string[]; forbiddenMatches: string[] }>} */
  const pageChecks = {};

  for (const page of SCAFFOLD_PAGES) {
    const rel = `admin/pages/${page.file}`;
    const abs = path.join(targetAbs, rel);
    const check = { ok: true, missingMarkers: [], forbiddenMatches: [] };

    if (!fs.existsSync(abs)) {
      check.ok = false;
      pageChecks[rel] = check;
      continue;
    }

    const content = fs.readFileSync(abs, "utf8");
    const lower = content.toLowerCase();

    for (const marker of PAGE_SAFETY_MARKERS) {
      if (!lower.includes(marker.toLowerCase())) {
        check.missingMarkers.push(marker);
        check.ok = false;
      }
    }

    for (const pattern of PAGE_FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) {
        check.forbiddenMatches.push(String(pattern));
        check.ok = false;
      }
    }

    pageChecks[rel] = check;

    if (check.missingMarkers.length) {
      record(
        blockers,
        warnings,
        `${rel}: missing safety markers: ${check.missingMarkers.join(", ")}`,
        "blocker",
      );
    }
    if (check.forbiddenMatches.length) {
      record(
        blockers,
        warnings,
        `${rel}: forbidden pattern detected`,
        "blocker",
      );
    }
  }

  const sections = readJsonFileFromTarget(targetAbs, "admin/config/admin-sections.generated.json");
  if (!sections.ok) {
    record(blockers, warnings, sections.error ?? "sections load failed", "blocker");
  } else {
    const ids = (sections.data?.sections ?? []).map((s) => s.id);
    for (const id of EXPECTED_SECTION_IDS) {
      if (!ids.includes(id)) {
        record(blockers, warnings, `admin-sections missing section id: ${id}`, "blocker");
      }
    }
    if (sections.data?.connectedToRuntime === true) {
      record(blockers, warnings, "admin-sections connectedToRuntime is true", "blocker");
    }
  }

  const components = readJsonFileFromTarget(targetAbs, "admin/config/admin-components.required.json");
  if (!components.ok) {
    record(blockers, warnings, components.error ?? "components load failed", "blocker");
  } else {
    const missing =
      components.data?.summary?.missingComponents ??
      components.data?.missingComponents ??
      [];
    if (Array.isArray(missing) && missing.length > 0) {
      record(
        blockers,
        warnings,
        `admin-components missingComponents: ${missing.join(", ")}`,
        "warning",
      );
    }
  }

  const permissions = readJsonFileFromTarget(targetAbs, "admin/config/admin-permissions.generated.json");
  if (!permissions.ok) {
    record(blockers, warnings, permissions.error ?? "permissions load failed", "blocker");
  } else {
    for (const role of EXPECTED_ROLES) {
      if (!(permissions.data?.roles ?? []).includes(role)) {
        record(blockers, warnings, `admin-permissions missing role: ${role}`, "blocker");
      }
    }
  }

  const storage = readJsonFileFromTarget(targetAbs, "admin/config/admin-storage-mappings.generated.json");
  if (!storage.ok) {
    record(blockers, warnings, storage.error ?? "storage mappings load failed", "blocker");
  } else {
    const assetTypes = (storage.data?.mappings ?? []).map((m) => m.assetType);
    for (const assetType of EXPECTED_STORAGE_ASSET_TYPES) {
      if (!assetTypes.includes(assetType)) {
        record(blockers, warnings, `admin-storage-mappings missing assetType: ${assetType}`, "blocker");
      }
    }
  }

  const publish = readJsonFileFromTarget(targetAbs, "admin/config/admin-publish-policy.generated.json");
  if (!publish.ok) {
    record(blockers, warnings, publish.error ?? "publish policy load failed", "blocker");
  } else {
    if (publish.data?.stagingEnabled !== true) {
      record(blockers, warnings, "admin-publish-policy stagingEnabled is not true", "blocker");
    }
    if (publish.data?.productionEnabled === true) {
      record(blockers, warnings, "admin-publish-policy productionEnabled is true", "blocker");
    }
  }

  const preview = readJsonFileFromTarget(targetAbs, "admin/config/admin-preview-plan.generated.json");
  if (!preview.ok) {
    record(blockers, warnings, preview.error ?? "preview plan load failed", "blocker");
  } else {
    if (preview.data?.customerDemoReady === true) {
      record(blockers, warnings, "admin-preview-plan customerDemoReady is true", "warning");
    }
    if (preview.data?.productionReady === true) {
      record(blockers, warnings, "admin-preview-plan productionReady is true", "blocker");
    }
    if (preview.data?.connectedToRuntime === true) {
      record(blockers, warnings, "admin-preview-plan connectedToRuntime is true", "blocker");
    }
  }

  const genManifest = readJsonFileFromTarget(targetAbs, "admin/manifests/generated-files-manifest.json");
  if (!genManifest.ok) {
    record(blockers, warnings, genManifest.error ?? "generated-files-manifest missing", "blocker");
  } else {
    const m = genManifest.data;
    if (m?.mode !== "apply-to-sandbox") {
      record(blockers, warnings, `generated-files-manifest mode is not apply-to-sandbox`, "blocker");
    }
    if (!m?.approvalId) {
      record(blockers, warnings, "generated-files-manifest missing approvalId", "blocker");
    }
    const created = m?.filesCreated ?? [];
    if (created.length < expectedFiles.length) {
      record(
        blockers,
        warnings,
        `generated-files-manifest filesCreated count ${created.length} < expected ${expectedFiles.length}`,
        "warning",
      );
    }
    if ((m?.overwrittenFiles ?? []).length > 0) {
      record(blockers, warnings, "generated-files-manifest overwrittenFiles is not empty", "blocker");
    }
    const safety = m?.safety ?? {};
    for (const [key, expected] of Object.entries({
      runtimeFilesWritten: false,
      connectedToRuntime: false,
      productionTouched: false,
      srcPagesAdminTouched: false,
      sariswingAdminTouched: false,
    })) {
      if (safety[key] !== expected) {
        record(blockers, warnings, `generated-files-manifest safety.${key} is ${safety[key]}`, "blocker");
      }
    }
  }

  const rollback = readJsonFileFromTarget(targetAbs, "admin/manifests/rollback-manifest.json");
  if (!rollback.ok) {
    record(blockers, warnings, rollback.error ?? "rollback-manifest missing", "blocker");
  } else {
    const r = rollback.data;
    if (r?.rollbackMode !== "delete-generated-sandbox-directory") {
      record(blockers, warnings, "rollback-manifest rollbackMode invalid", "blocker");
    }
    if ((r?.overwrittenFiles ?? []).length > 0) {
      record(blockers, warnings, "rollback-manifest overwrittenFiles is not empty", "blocker");
    }
    if (r?.safeToDeleteTargetDir !== true) {
      record(blockers, warnings, "rollback-manifest safeToDeleteTargetDir is not true", "blocker");
    }
    if (r?.requiresManualReviewBeforeDelete !== true) {
      record(
        blockers,
        warnings,
        "rollback-manifest requiresManualReviewBeforeDelete is not true",
        "warning",
      );
    }
  }

  const writerReportPath = path.join(targetAbs, "admin/manifests/writer-report.md");
  if (!fs.existsSync(writerReportPath)) {
    record(blockers, warnings, "writer-report.md missing", "blocker");
  } else {
    const report = fs.readFileSync(writerReportPath, "utf8");
    const reportNorm = report.toLowerCase().replace(/`/g, "");
    const reportMarkers = [
      "apply-to-sandbox only",
      "no runtime connection",
      "no src/pages/admin",
      "no supabase auth",
      "no db query/update",
      "no storage upload",
      "no github dispatch",
      "no ftp deploy",
      "no production touched",
    ];
    for (const marker of reportMarkers) {
      if (!reportNorm.includes(marker)) {
        record(blockers, warnings, `writer-report.md missing: ${marker}`, "warning");
      }
    }
  }

  const readyForG5x = blockers.length === 0;

  return buildReviewResult({
    targetRel,
    outRel,
    outAbs,
    generatedAt,
    blockers,
    warnings,
    readyForG5x,
    checks: {
      expectedFileCount: expectedFiles.length,
      actualFileCount: actualRelFiles.length,
      missingFiles,
      extraFiles,
      pageChecks,
      fileStructureOk: missingFiles.length === 0,
      pageSafetyOk: Object.values(pageChecks).every((p) => p.ok),
    },
  });
}

/**
 * @param {object} p
 */
function buildReviewResult(p) {
  const report = buildReviewMarkdown(p);
  const json = {
    version: "0.1.0",
    phase: REVIEW_PHASE,
    mode: "read-only-review",
    generatedAt: p.generatedAt,
    targetDir: p.targetRel,
    reportDir: p.outRel,
    readyForG5x: p.readyForG5x,
    blockers: p.blockers,
    warnings: p.warnings,
    checks: p.checks,
    safety: {
      reviewOnly: true,
      runtimeFilesMoved: false,
      srcPagesAdminTouched: false,
      sariswingAdminTouched: false,
      productionTouched: false,
      supabaseAuthConnected: false,
      dbUpdatePerformed: false,
      storageUploadPerformed: false,
      githubDispatchPerformed: false,
      ftpDeployPerformed: false,
    },
    recommendation: p.readyForG5x
      ? "Proceed to G-5x staging runtime shell integration planning (shell-only, staging-only)."
      : "Resolve blockers before G-5x. Do not move sandbox files to src/pages/admin.",
  };

  return {
    ...p,
    report,
    json,
  };
}

/**
 * @param {object} p
 */
function buildReviewMarkdown(p) {
  const lines = [
    "# Generated Admin Scaffold Review Report",
    "",
    `**Phase:** ${REVIEW_PHASE} · **Generated:** ${p.generatedAt}`,
    "",
    "## Summary",
    "",
    "| Item | Value |",
    "| --- | --- |",
    `| target | \`${p.targetRel}\` |`,
    `| readyForG5x | **${p.readyForG5x}** |`,
    `| blockers | ${p.blockers.length} |`,
    `| warnings | ${p.warnings.length} |`,
    "",
    "## Target",
    "",
    `\`${p.targetRel}\` (sandbox output only — not runtime admin)`,
    "",
    "## File structure check",
    "",
    `| Check | Result |`,
    "| --- | --- |",
    `| expected files | ${p.checks.expectedFileCount ?? "n/a"} |`,
    `| actual files | ${p.checks.actualFileCount ?? "n/a"} |`,
    `| structure OK | ${p.checks.fileStructureOk ? "**Yes**" : "**No**"} |`,
    "",
  ];

  if (p.checks.missingFiles?.length) {
    lines.push("Missing:", ...p.checks.missingFiles.map((f) => `- \`${f}\``), "");
  }
  if (p.checks.extraFiles?.length) {
    lines.push("Extra:", ...p.checks.extraFiles.map((f) => `- \`${f}\``), "");
  }

  lines.push("## Page safety check", "", `| Page | OK |`, "| --- | --- |");
  for (const [rel, check] of Object.entries(p.checks.pageChecks ?? {})) {
    lines.push(`| \`${rel}\` | ${check.ok ? "Yes" : "No"} |`);
  }

  lines.push(
    "",
    "## Config consistency check",
    "",
    "- admin-sections: expected section ids",
    "- admin-components: missingComponents recorded as warnings if present",
    "- admin-permissions: viewer / editor / admin",
    "- admin-storage-mappings: discography_cover / schedule_home / schedule_flyer",
    "- admin-publish-policy: staging enabled, production disabled",
    "- admin-preview-plan: customerDemoReady false, productionReady false, connectedToRuntime false",
    "",
    "## Manifest consistency check",
    "",
    "- generated-files-manifest: apply-to-sandbox, safety flags, overwrittenFiles []",
    "- rollback-manifest: delete-generated-sandbox-directory, safeToDeleteTargetDir true",
    "- writer-report.md: apply-to-sandbox safety statements",
    "",
    "## Forbidden operations check",
    "",
    "- no Supabase imports in pages",
    "- no fetch / runtime env secrets in pages",
    "- no src/pages/admin deployment",
    "- review only — no runtime files moved",
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

  lines.push("", "## Blockers", "");
  if (p.blockers.length === 0) {
    lines.push("- none");
  } else {
    for (const b of p.blockers) {
      lines.push(`- ${b}`);
    }
  }

  lines.push(
    "",
    "## Recommendation",
    "",
    p.readyForG5x
      ? "Sandbox scaffold passes review. G-5x may proceed with **staging runtime shell integration** (shell-only, staging-only, separate approval)."
      : "Do not proceed to G-5x until blockers are resolved.",
    "",
    "## Next phase readiness",
    "",
    `| readyForG5x | **${p.readyForG5x}** |`,
    "",
    "## Safety statement",
    "",
    "- review only",
    "- no runtime files moved",
    "- no src/pages/admin changes",
    "- no Auth / DB / Storage / Publish / FTP connection",
    "- output review report only",
    "",
    "---",
    "",
    `*${REVIEW_PHASE}: read-only sandbox scaffold review.*`,
  );

  return lines.join("\n");
}

/**
 * @param {ReturnType<typeof reviewGeneratedAdminScaffold>} result
 */
export function writeGeneratedAdminScaffoldReview(result) {
  fs.mkdirSync(result.outAbs, { recursive: true });
  fs.writeFileSync(
    path.join(result.outAbs, "GENERATED_ADMIN_SCAFFOLD_REVIEW_REPORT.md"),
    result.report,
    "utf8",
  );
  fs.writeFileSync(
    path.join(result.outAbs, "generated-admin-scaffold-review.json"),
    `${JSON.stringify(result.json, null, 2)}\n`,
    "utf8",
  );
  return result.outAbs;
}
