/**
 * Site generation dry-runner (G-5g).
 * Builds a dry-run generation package from staging-generation-plan.json.
 * Does NOT generate Astro files, create DB tables, upload Storage, or FTP deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSiteConfigPath } from "./site-config-loader.mjs";
import {
  getSchemaAdapterById,
  loadSchemaAdapters,
} from "./schema-adapter-loader.mjs";
import { planStagingGeneration } from "./staging-generation-planner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

export const PACKAGE_SAFETY = {
  astroGenerationPerformed: false,
  dbCreatePerformed: false,
  dbUpdatePerformed: false,
  storageUploadPerformed: false,
  ftpDeployPerformed: false,
  productionTouched: false,
};

/** @type {Record<string, string>} */
const PAGE_PATH_MAP = {
  home: "src/pages/index.astro",
  about: "src/pages/about.astro",
  schedule: "src/pages/schedule/index.astro",
  "schedule-month": "src/pages/schedule/[year]-[month].astro",
  discography: "src/pages/discography/index.astro",
  contact: "src/pages/contact.astro",
  links: "src/pages/links.astro",
  courses: "src/pages/courses/index.astro",
  instructors: "src/pages/instructors/index.astro",
  pricing: "src/pages/pricing/index.astro",
  faq: "src/pages/faq/index.astro",
  testimonials: "src/pages/testimonials/index.astro",
  classes: "src/pages/classes/index.astro",
  events: "src/pages/events/index.astro",
  news: "src/pages/news/index.astro",
  services: "src/pages/services/index.astro",
  works: "src/pages/works/index.astro",
  staff: "src/pages/staff/index.astro",
  "company-profile": "src/pages/company/index.astro",
};

/** @type {Record<string, string[]>} */
const TEMPLATE_COMPONENTS = {
  "musician-basic": [
    "src/components/ScheduleList.astro",
    "src/components/ScheduleMonthNav.astro",
    "src/components/DiscographyGrid.astro",
    "src/components/DiscographyCard.astro",
    "src/components/ProfileHeader.astro",
    "src/components/LinksList.astro",
    "src/components/ContactSection.astro",
    "src/components/SeoHead.astro",
  ],
  "music-school": [
    "src/components/CourseList.astro",
    "src/components/InstructorCard.astro",
    "src/components/PricingTable.astro",
    "src/components/SeoHead.astro",
  ],
  "dance-school": [
    "src/components/ClassList.astro",
    "src/components/EventCard.astro",
    "src/components/InstructorCard.astro",
    "src/components/SeoHead.astro",
  ],
  "small-business": [
    "src/components/ServiceList.astro",
    "src/components/WorkGallery.astro",
    "src/components/StaffCard.astro",
    "src/components/SeoHead.astro",
  ],
};

const COMMON_LAYOUTS = [
  "src/layouts/BaseLayout.astro",
  "src/layouts/PageLayout.astro",
];

const COMMON_CONFIG_FILES = [
  "astro.config.mjs",
  "src/config/site.json",
  "src/config/deploy.ts",
];

const COMMON_SEO_FILES = [
  "public/robots.txt",
  "src/pages/sitemap.xml.ts",
];

const FUTURE_ADMIN_FILES = [
  "src/pages/admin/index.astro",
  "src/pages/admin/schedules.astro",
  "src/pages/admin/discography.astro",
];

/**
 * @param {string} pageSlug
 */
function pagePathForSlug(pageSlug) {
  if (PAGE_PATH_MAP[pageSlug]) return PAGE_PATH_MAP[pageSlug];
  if (pageSlug.includes("/")) return `src/pages/${pageSlug}.astro`;
  return `src/pages/${pageSlug}/index.astro`;
}

/**
 * @param {unknown} plan
 */
export function validateStagingPlan(plan) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (!plan || typeof plan !== "object") {
    return { ok: false, errors: ["Plan must be a JSON object"], warnings };
  }

  const p = /** @type {Record<string, unknown>} */ (plan);
  const required = ["siteSlug", "templateId", "schemaAdapterId", "template", "schema"];
  for (const key of required) {
    if (p[key] == null) errors.push(`Missing required plan field: ${key}`);
  }

  if (p.mode && p.mode !== "read-only-plan") {
    warnings.push(`Unexpected plan mode "${p.mode}" — expected read-only-plan`);
  }

  if (!Array.isArray(p.warnings)) {
    warnings.push("Plan has no warnings array — continuing");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {string | null} outDirArg
 * @param {string} siteSlug
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function resolveGenerationPackageOutDir(outDirArg, siteSlug, toolRoot, repoRoot) {
  const rel = outDirArg ?? `output/generation-packages/${siteSlug}`;
  const abs = resolveSiteConfigPath(rel, toolRoot, repoRoot);
  return {
    outDirAbs: abs,
    outDirRelative: path.relative(repoRoot, abs).split(path.sep).join("/"),
  };
}

/**
 * @param {object} plan
 * @param {object} adapter
 */
export function buildPlannedFiles(plan, adapter) {
  const templateId = plan.templateId;
  const source = `template:${templateId}`;
  /** @type {Array<Record<string, unknown>>} */
  const files = [];

  const add = (filePath, kind, status = "planned-only") => {
    files.push({
      path: filePath,
      kind,
      source,
      status,
      willGenerateNow: false,
    });
  };

  for (const page of plan.template?.pages ?? []) {
    add(pagePathForSlug(page), "page");
  }

  for (const layout of COMMON_LAYOUTS) {
    add(layout, "layout");
  }

  const components = TEMPLATE_COMPONENTS[templateId] ?? ["src/components/SeoHead.astro"];
  for (const component of components) {
    add(component, "component");
  }

  const models = plan.template?.contentModels ?? [];
  for (const model of models) {
    const dataFile = model === "schedule" ? "src/data/schedule.json" : `src/data/${model}.json`;
    add(dataFile, "data");
  }

  for (const table of adapter?.tables ?? plan.schema?.tables ?? []) {
    const model = table.model ?? table.table;
    if (model && !models.includes(model)) {
      add(`src/data/${model}.json`, "data");
    }
  }

  for (const configFile of COMMON_CONFIG_FILES) {
    add(configFile, "config");
  }

  for (const seoFile of COMMON_SEO_FILES) {
    add(seoFile, "seo", seoFile.includes("sitemap") ? "future-planned" : "planned-only");
  }

  for (const adminFile of FUTURE_ADMIN_FILES) {
    add(adminFile, "admin", "future-planned");
  }

  return {
    siteSlug: plan.siteSlug,
    templateId,
    mode: "dry-run",
    astroGenerationPerformed: false,
    files,
  };
}

/**
 * @param {object} column
 * @param {object[]} storageMappings
 * @param {string} tableName
 */
function columnWithStorageFlag(column, storageMappings, tableName) {
  const isStorage = (storageMappings ?? []).some(
    (m) => m.targetTable === tableName && m.targetColumn === column.name,
  );
  return {
    name: column.name,
    type: column.type,
    required: Boolean(column.required),
    unique: Boolean(column.unique),
    ...(isStorage ? { storageTarget: true } : {}),
  };
}

/**
 * @param {object} plan
 * @param {object} adapter
 */
export function buildSupabaseSchemaSkeleton(plan, adapter) {
  const storageMappings = adapter?.storageMappings ?? plan.storageMigrationPlan ?? [];

  const tables = (adapter?.tables ?? []).map((t) => ({
    table: t.table,
    model: t.model,
    required: Boolean(t.required),
    willCreateNow: false,
    legacyId: t.legacyId ?? {
      strategy: plan.schema?.tables?.find((st) => st.table === t.table)?.legacyIdStrategy ?? null,
      pattern: plan.schema?.tables?.find((st) => st.table === t.table)?.legacyIdPattern ?? null,
    },
    columns: (t.columns ?? []).map((c) => columnWithStorageFlag(c, storageMappings, t.table)),
  }));

  return {
    provider: plan.schema?.provider ?? adapter?.provider ?? "supabase",
    schemaAdapterId: plan.schemaAdapterId,
    mode: "dry-run",
    dbCreatePerformed: false,
    note: "Schema skeleton only — no DDL applied. willCreateNow is false for all tables.",
    tables,
  };
}

/**
 * @param {object} col
 */
function seedPlaceholder(col) {
  if (col.name === "legacy_id") return "LEGACY_ID_PLACEHOLDER";
  if (col.name === "id") return null;
  if (col.type === "boolean") return false;
  if (col.type === "integer") return 0;
  if (col.type === "date") return "YYYY-MM-DD";
  if (col.type === "timestamp") return "YYYY-MM-DDTHH:mm:ssZ";
  if (/_url$/.test(col.name)) return null;
  if (col.name === "published") return true;
  return "";
}

/**
 * @param {object} plan
 * @param {object} adapter
 */
export function buildSeedSkeleton(plan, adapter) {
  const tables = (adapter?.tables ?? []).map((t) => {
    const seedCols = (t.columns ?? []).filter((c) => c.name !== "id");
    const exampleRow = {};
    for (const col of seedCols) {
      exampleRow[col.name] = seedPlaceholder(col);
    }
    if (exampleRow.legacy_id === "LEGACY_ID_PLACEHOLDER") {
      exampleRow.legacy_id = t.legacyId?.example ?? `${t.table}-001`;
    }

    return {
      table: t.table,
      model: t.model,
      legacyIdPattern: t.legacyId?.pattern ?? null,
      legacyIdStrategy: t.legacyId?.strategy ?? null,
      exampleRows: [exampleRow],
    };
  });

  return {
    mode: "dry-run",
    seedGeneratedNow: false,
    siteSlug: plan.siteSlug,
    tables,
  };
}

/**
 * @param {object} plan
 */
export function buildStorageTasks(plan) {
  const mappings = plan.storageMigrationPlan ?? [];
  return {
    mode: "dry-run",
    storageUploadPerformed: false,
    siteSlug: plan.siteSlug,
    storageBucket: plan.staging?.storageBucket ?? null,
    storagePathPrefix: plan.staging?.storagePathPrefix ?? plan.siteSlug,
    tasks: mappings.map((m) => ({
      assetType: m.assetType,
      targetTable: m.targetTable,
      targetColumn: m.targetColumn,
      pathPattern: m.pathPattern ?? null,
      legacyIdPattern: m.legacyIdPattern ?? null,
      humanReviewRequired: Boolean(m.humanReviewRequired),
      provenWith: m.provenWith ?? [],
      recommendedPhase: m.recommendedPhase ?? null,
      recommendedCli: m.humanReviewRequired
        ? "review-schedule-storage-assets.mjs"
        : "review-storage-assets.mjs",
      uploadPerformed: false,
    })),
  };
}

/**
 * @param {object} plan
 */
export function buildHumanReviewTasks(plan) {
  const humanAssets = (plan.storageMigrationPlan ?? [])
    .filter((m) => m.humanReviewRequired)
    .map((m) => m.assetType);

  const gateRules = (plan.humanReviewGates ?? [])
    .filter((g) => g.gateId !== "rights-confirmation-before-production")
    .map((g) => g.gateId);

  /** @type {Array<Record<string, unknown>>} */
  const tasks = [];

  if (humanAssets.length) {
    tasks.push({
      taskId: "review-schedule-images",
      assetTypes: humanAssets,
      reason: "Schedule image matching can be ambiguous.",
      rules: gateRules.length ? gateRules : [
        "schedule-date-conflict",
        "cross-page-inferred-schedule-image",
        "no-photo-placeholder",
      ],
      decisionValues: [
        "approve_home_only",
        "approve_flyer_only",
        "approve_both",
        "reject",
        "defer",
      ],
      recommendedCli: "review-schedule-storage-assets.mjs",
      promoteCli: "promote-schedule-storage-allowlist.mjs",
    });
  }

  const rightsGate = (plan.humanReviewGates ?? []).find(
    (g) => g.gateId === "rights-confirmation-before-production",
  );
  tasks.push({
    taskId: "confirm-image-rights-before-production",
    assetTypes: (plan.storageMigrationPlan ?? []).map((m) => m.assetType),
    reason:
      rightsGate?.condition ??
      "Production migration requires owner / rights confirmation.",
    requiredBefore: "production",
    decisionValues: ["confirmed", "defer"],
  });

  if ((plan.humanReviewRequired ?? []).length) {
    for (const item of plan.humanReviewRequired) {
      if (item.scope !== "storage-assets") {
        tasks.push({
          taskId: `review-${item.scope}`,
          assetTypes: item.assetTypes ?? [],
          reason: item.reason,
          requiredBefore: "staging-upload",
        });
      }
    }
  }

  return {
    mode: "dry-run",
    humanReviewRequired: tasks.length > 0,
    siteSlug: plan.siteSlug,
    tasks,
  };
}

/**
 * @param {object} plan
 */
export function buildQaChecklistMarkdown(plan) {
  const stagingUrl = plan.staging?.publicUrl ?? "(configure deploy.staging.publicUrl)";
  const lines = [
    `# Staging QA Checklist — ${plan.siteSlug}`,
    "",
    "> Dry-run checklist (G-5g). Verify manually after staging deploy.",
    "",
    `**Site:** ${plan.siteName ?? plan.siteSlug}`,
    `**Template:** ${plan.templateId}`,
    `**Staging URL:** ${stagingUrl}`,
    "",
    "## Pre-deploy",
    "",
    "- [ ] `production.enabled` is **false** in site config",
    "- [ ] Staging Supabase host is staging-only (not production)",
    "- [ ] No secrets in committed manifests / reports",
    "",
    "## SEO / staging safety",
    "",
    `- [ ] Staging noindex enabled (${plan.staging?.noindex !== false ? "expected: yes" : "WARNING: noindex off"})`,
    `- [ ] robots.txt Disallow all on staging (${plan.staging?.robotsDisallowAll ? "expected" : "verify"})`,
    "- [ ] Canonical URLs point to staging base (not production)",
    "- [ ] og:url uses staging public URL",
    "- [ ] sitemap excludes admin paths",
    "",
    "## Layout / assets",
    "",
    "- [ ] CSS loads correctly under deploy base path",
    "- [ ] Hamburger / mobile nav works",
    "- [ ] Base path (`deploy.staging.base`) resolves assets",
    "",
    "## Content / images",
    "",
    "- [ ] Discography cover images display (Storage URL HTTP 200)",
    "- [ ] Schedule home images display where migrated",
    "- [ ] Pending / deferred images do not break layout",
    "- [ ] No `example.supabase.co` placeholder URLs remain",
    "- [ ] Public Storage URLs return HTTP 200",
    "",
    "## Human review follow-up",
    "",
  ];

  const pending = (plan.storageMigrationPlan ?? []).filter((m) => m.humanReviewRequired);
  if (pending.length) {
    for (const m of pending) {
      lines.push(`- [ ] ${m.assetType} → ${m.targetTable}.${m.targetColumn} — human review complete or deferred`);
    }
  } else {
    lines.push("- [ ] (no human-review storage assets for this template)");
  }

  lines.push(
    "",
    "## Production gate",
    "",
    "- [ ] Production deploy remains **disabled** until owner sign-off",
    "- [ ] Image rights confirmed",
    "- [ ] Staging QA sign-off recorded",
    "",
    "---",
    "",
    "*Generated by generate-site-dry-run.mjs (read-only package — no deploy performed).*",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * @param {object} plan
 */
export function buildRecommendedCommandsMarkdown(plan) {
  const siteConfigPath =
    plan.siteConfigPath ??
    `tools/static-to-astro/config/sites/${plan.siteSlug}.site-config.example.json`;

  const lines = [
    "# Recommended Commands",
    "",
    `Site: **${plan.siteSlug}** | Template: **${plan.templateId}** | Adapter: **${plan.schemaAdapterId}**`,
    "",
    "> Write operations require explicit approval. This package does not execute them.",
    "",
    "## Read-only planning",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/plan-staging-generation.mjs \\`,
    `  --site-config ${siteConfigPath}`,
    "```",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/generate-site-dry-run.mjs \\`,
    `  --plan tools/static-to-astro/output/plans/${plan.siteSlug}/staging-generation-plan.json`,
    "```",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/inspect-cms-template.mjs \\`,
    `  --site-config ${siteConfigPath}`,
    "```",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/inspect-schema-adapter.mjs \\`,
    `  --site-config ${siteConfigPath}`,
    "```",
    "",
    "## Read-only storage review",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/review-storage-assets.mjs \\`,
    `  --site-config ${siteConfigPath}`,
    "```",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/prepare-storage-upload-allowlist.mjs \\`,
    `  --site-config ${siteConfigPath}`,
    "```",
    "",
    "```bash",
    `node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \\`,
    `  --site-config ${siteConfigPath}`,
    "```",
    "",
    "## Write operations — requires explicit approval",
    "",
    "Storage upload, DB update, FTP deploy, and Astro generation are **not** performed by this package.",
    "",
    "| Step | CLI | Operation | Status |",
    "| --- | --- | --- | --- |",
  ];

  for (const step of plan.recommendedWorkflow ?? []) {
    const status =
      step.operation === "read-only"
        ? "safe (read-only)"
        : "manual / future / requires-approval";
    lines.push(
      `| ${step.step} | ${step.cli ?? "—"} | ${step.operation} | ${status} |`,
    );
  }

  lines.push(
    "",
    "### Example write commands (do not run without approval)",
    "",
    "```bash",
    "# convert-static-to-astro.mjs — write-local, requires fixture review",
    `node tools/static-to-astro/scripts/convert-static-to-astro.mjs --site-profile musician ...`,
    "```",
    "",
    "```bash",
    "# upload-storage-assets.mjs — upload, staging only, allowlist required",
    `node tools/static-to-astro/scripts/upload-storage-assets.mjs --apply ...`,
    "```",
    "",
    "```bash",
    "# apply-storage-db-updates.mjs — db-update, staging only",
    `node tools/static-to-astro/scripts/apply-storage-db-updates.mjs --apply ...`,
    "```",
    "",
    "```bash",
    "# deploy-public-dist-ftp.mjs — deploy, staging only",
    `node tools/static-to-astro/scripts/deploy-public-dist-ftp.mjs --apply ...`,
    "```",
    "",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * @param {object} plan
 * @param {object} artifacts
 */
export function buildGenerationPackageManifest(plan, artifacts) {
  const plannedFiles = artifacts.plannedFiles;
  const humanReview = artifacts.humanReviewTasks;

  return {
    phase: "G-5g",
    siteSlug: plan.siteSlug,
    siteName: plan.siteName ?? null,
    siteType: plan.siteType ?? null,
    templateId: plan.templateId,
    schemaAdapterId: plan.schemaAdapterId,
    mode: "dry-run-generation-package",
    generatedAt: new Date().toISOString(),
    planGeneratedAt: plan.generatedAt ?? null,
    safety: { ...PACKAGE_SAFETY },
    summary: {
      plannedPages: (plan.template?.pages ?? []).length,
      plannedComponents: plannedFiles.files.filter((f) => f.kind === "component").length,
      plannedSupabaseTables: artifacts.supabaseSchemaSkeleton.tables.length,
      plannedStorageAssetTypes: artifacts.storageTasks.tasks.length,
      humanReviewTasks: humanReview.tasks.length,
      qaChecks: 12,
      totalPlannedFiles: plannedFiles.files.length,
    },
    outputs: {
      plannedFiles: "planned-files.json",
      supabaseSchemaSkeleton: "supabase-schema-skeleton.json",
      seedSkeleton: "seed-skeleton.json",
      storageTasks: "storage-tasks.json",
      humanReviewTasks: "human-review-tasks.json",
      qaChecklist: "qa-checklist.md",
      recommendedCommands: "recommended-commands.md",
      report: "GENERATION_PACKAGE_REPORT.md",
    },
    productionReadiness: plan.productionReadiness ?? { ready: false, blockingItems: [] },
    warnings: [...(plan.warnings ?? []), ...(artifacts.planValidationWarnings ?? [])],
    nextPhaseSuggestions: [
      "G-5h: product onboarding runbook and customer checklist",
      "G-5i: Admin CMS template extraction from generation package",
      "Later: optional Astro scaffold generation from planned-files.json (explicit opt-in)",
    ],
  };
}

/**
 * @param {object} plan
 * @param {object} pkg
 * @param {object} artifacts
 * @param {string} outDirRelative
 */
export function formatGenerationPackageReport(plan, pkg, artifacts, outDirRelative) {
  const lines = [
    "# Generation Package Report (G-5g)",
    "",
    "> Dry-run generation package. No Astro files, DB, Storage, or FTP operations performed.",
    "",
    "## Site summary",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| siteSlug | ${plan.siteSlug} |`,
    `| siteName | ${plan.siteName ?? "(n/a)"} |`,
    `| siteType | ${plan.siteType ?? "(n/a)"} |`,
    `| templateId | ${plan.templateId} |`,
    `| schemaAdapterId | ${plan.schemaAdapterId} |`,
    `| mode | ${pkg.mode} |`,
    `| generatedAt | ${pkg.generatedAt} |`,
    `| output dir | \`${outDirRelative}\` |`,
    "",
    "## Safety",
    "",
    "Astro generation performed: **no**",
    "DB create performed: **no**",
    "DB update performed: **no**",
    "Storage upload performed: **no**",
    "FTP deploy performed: **no**",
    "Production touched: **no**",
    "",
    "## Template summary",
    "",
    `**Status:** ${plan.template?.status ?? "(n/a)"}`,
    "",
    `**Pages (${pkg.summary.plannedPages}):** ${(plan.template?.pages ?? []).join(", ") || "(none)"}`,
    "",
    `**Content models:** ${(plan.template?.contentModels ?? []).join(", ") || "(none)"}`,
    "",
    `**Storage asset types:** ${(plan.template?.storageAssetTypes ?? []).join(", ") || "(none)"}`,
    "",
    "## Schema summary",
    "",
    `**Provider:** ${plan.schema?.provider ?? "(n/a)"}`,
    `**Tables:** ${pkg.summary.plannedSupabaseTables}`,
    "",
    "| table | required | legacyId pattern |",
    "| --- | --- | --- |",
  ];

  for (const t of artifacts.supabaseSchemaSkeleton.tables) {
    lines.push(
      `| ${t.table} | ${t.required ? "yes" : "no"} | ${t.legacyId?.pattern ?? "—"} |`,
    );
  }

  lines.push(
    "",
    "## Files planned",
    "",
    `Total planned files: **${pkg.summary.totalPlannedFiles}** (components: ${pkg.summary.plannedComponents})`,
    "",
    "See `planned-files.json` for full list. All entries have `willGenerateNow: false`.",
    "",
    "## Storage tasks",
    "",
    `Count: ${pkg.summary.plannedStorageAssetTypes}`,
    "",
  );

  for (const task of artifacts.storageTasks.tasks) {
    lines.push(
      `- **${task.assetType}** → ${task.targetTable}.${task.targetColumn} (humanReview=${task.humanReviewRequired ? "yes" : "no"})`,
    );
  }

  lines.push("", "## Human review tasks", "", `Count: ${pkg.summary.humanReviewTasks}`, "");
  for (const task of artifacts.humanReviewTasks.tasks) {
    lines.push(`- **${task.taskId}**: ${task.reason}`);
  }

  lines.push(
    "",
    "## Artifacts",
    "",
    `- QA checklist: \`qa-checklist.md\``,
    `- Recommended commands: \`recommended-commands.md\``,
    `- Seed skeleton: \`seed-skeleton.json\` (seedGeneratedNow: false)`,
    "",
    "## Production readiness",
    "",
    `**Ready:** ${pkg.productionReadiness.ready ? "yes" : "no"}`,
    "",
  );

  for (const item of pkg.productionReadiness.blockingItems ?? []) {
    lines.push(`- ${item}`);
  }

  if (pkg.warnings.length) {
    lines.push("", "## Warnings", "");
    for (const w of pkg.warnings) lines.push(`- ${w}`);
  }

  if (plan.siteNotes?.length) {
    lines.push("", "## Site notes", "");
    for (const n of plan.siteNotes) lines.push(`- ${n}`);
  }

  lines.push("", "## Next phase suggestions", "");
  for (const s of pkg.nextPhaseSuggestions) lines.push(`- ${s}`);

  return `${lines.join("\n")}\n`;
}

/**
 * @param {object} plan
 * @param {{ toolRoot?: string, adaptersPath?: string | null }} [opts]
 */
export function loadAdapterForPlan(plan, opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const { registry } = loadSchemaAdapters(opts.adaptersPath ?? null, { toolRoot });
  return getSchemaAdapterById(registry, plan.schemaAdapterId);
}

/**
 * @param {object} plan
 * @param {object} adapter
 */
export function buildDryRunArtifacts(plan, adapter) {
  const plannedFiles = buildPlannedFiles(plan, adapter);
  const supabaseSchemaSkeleton = buildSupabaseSchemaSkeleton(plan, adapter);
  const seedSkeleton = buildSeedSkeleton(plan, adapter);
  const storageTasks = buildStorageTasks(plan);
  const humanReviewTasks = buildHumanReviewTasks(plan);
  const qaChecklist = buildQaChecklistMarkdown(plan);
  const recommendedCommands = buildRecommendedCommandsMarkdown(plan);

  const pkg = buildGenerationPackageManifest(plan, {
    plannedFiles,
    supabaseSchemaSkeleton,
    seedSkeleton,
    storageTasks,
    humanReviewTasks,
    planValidationWarnings: [],
  });

  return {
    generationPackage: pkg,
    plannedFiles,
    supabaseSchemaSkeleton,
    seedSkeleton,
    storageTasks,
    humanReviewTasks,
    qaChecklist,
    recommendedCommands,
    report: null,
  };
}

/**
 * @param {{
 *   planPath?: string | null,
 *   siteConfigPath?: string | null,
 *   outDir?: string | null,
 *   adaptersPath?: string | null,
 *   toolRoot?: string,
 * }} opts
 */
export function generateSiteDryRunPackage(opts) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(toolRoot, "../..");

  if (!opts.planPath && !opts.siteConfigPath) {
    throw new Error("Provide --plan or --site-config");
  }

  /** @type {object} */
  let plan;
  if (opts.siteConfigPath) {
    const result = planStagingGeneration({
      siteConfigPath: opts.siteConfigPath,
      adaptersPath: opts.adaptersPath ?? null,
      toolRoot,
    });
    plan = result.plan;
  } else {
    const planAbs = resolveSiteConfigPath(opts.planPath, toolRoot, repoRoot);
    if (!fs.existsSync(planAbs)) {
      throw new Error(`Plan file not found: ${planAbs}`);
    }
    plan = JSON.parse(fs.readFileSync(planAbs, "utf8"));
  }

  const validation = validateStagingPlan(plan);
  if (!validation.ok) {
    throw new Error(`Invalid staging plan:\n- ${validation.errors.join("\n- ")}`);
  }

  const adapter = loadAdapterForPlan(plan, { toolRoot, adaptersPath: opts.adaptersPath });
  const artifacts = buildDryRunArtifacts(plan, adapter);
  artifacts.planValidationWarnings = validation.warnings;

  artifacts.generationPackage.warnings = [
    ...(plan.warnings ?? []),
    ...validation.warnings,
  ];

  const { outDirAbs, outDirRelative } = resolveGenerationPackageOutDir(
    opts.outDir ?? null,
    plan.siteSlug,
    toolRoot,
    repoRoot,
  );

  artifacts.report = formatGenerationPackageReport(
    plan,
    artifacts.generationPackage,
    artifacts,
    outDirRelative,
  );

  return {
    plan,
    artifacts,
    outDirAbs,
    outDirRelative,
    validation,
  };
}

/**
 * @param {ReturnType<typeof generateSiteDryRunPackage>} result
 */
export function writeGenerationPackage(result) {
  const { artifacts, outDirAbs } = result;
  fs.mkdirSync(outDirAbs, { recursive: true });

  const writeJson = (name, data) => {
    fs.writeFileSync(path.join(outDirAbs, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  };
  const writeText = (name, text) => {
    fs.writeFileSync(path.join(outDirAbs, name), text, "utf8");
  };

  writeJson("generation-package.json", artifacts.generationPackage);
  writeJson("planned-files.json", artifacts.plannedFiles);
  writeJson("supabase-schema-skeleton.json", artifacts.supabaseSchemaSkeleton);
  writeJson("seed-skeleton.json", artifacts.seedSkeleton);
  writeJson("storage-tasks.json", artifacts.storageTasks);
  writeJson("human-review-tasks.json", artifacts.humanReviewTasks);
  writeText("qa-checklist.md", artifacts.qaChecklist);
  writeText("recommended-commands.md", artifacts.recommendedCommands);
  writeText("GENERATION_PACKAGE_REPORT.md", artifacts.report);

  return outDirAbs;
}
