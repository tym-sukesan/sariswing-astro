/**
 * Staging generation planner (G-5f).
 * Combines site config + template registry + schema adapter into a read-only plan.
 * Does NOT run Astro generation, DB create/update, Storage upload, or FTP deploy.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteConfig, resolveSiteConfigPath } from "./site-config-loader.mjs";
import {
  loadTemplateRegistry,
  validateSiteConfigTemplate,
} from "./template-registry-loader.mjs";
import {
  loadSchemaAdapters,
  resolveSchemaAdapterForSiteConfig,
  validateTemplateSchemaAdapter,
} from "./schema-adapter-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

export const PLAN_SAFETY = {
  uploadPerformed: false,
  dbCreatePerformed: false,
  dbUpdatePerformed: false,
  ftpDeployPerformed: false,
  astroGenerationPerformed: false,
  productionEnabled: false,
};

/** @type {readonly { step: number, phase: string, cli: string | null, operation: string, requiresHumanReview: boolean, safetyGate: string | null, description: string }[]} */
export const STANDARD_WORKFLOW_STEPS = [
  {
    step: 1,
    phase: "crawl-static-export",
    cli: null,
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: null,
    description: "Crawl / static export (manual or external tool)",
  },
  {
    step: 2,
    phase: "analyze-static-site",
    cli: "analyze-static-site.mjs",
    operation: "read/write-local",
    requiresHumanReview: false,
    safetyGate: "fixture-dir exists",
    description: "Analyze static HTML structure",
  },
  {
    step: 3,
    phase: "convert-static-to-astro",
    cli: "convert-static-to-astro.mjs",
    operation: "read/write-local",
    requiresHumanReview: false,
    safetyGate: "site profile / template alignment",
    description: "Convert static HTML to Astro scaffold",
  },
  {
    step: 4,
    phase: "inspect-template",
    cli: "inspect-cms-template.mjs",
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: null,
    description: "Inspect template registry metadata",
  },
  {
    step: 5,
    phase: "inspect-schema-adapter",
    cli: "inspect-schema-adapter.mjs",
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: null,
    description: "Inspect schema adapter metadata",
  },
  {
    step: 6,
    phase: "plan-staging-generation",
    cli: "plan-staging-generation.mjs",
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: null,
    description: "Generate staging generation plan (this CLI)",
  },
  {
    step: 7,
    phase: "export-seed-supabase",
    cli: "generate-supabase-seed.mjs",
    operation: "read/write-local",
    requiresHumanReview: false,
    safetyGate: "schema adapter tables defined",
    description: "Export / seed Supabase JSON",
  },
  {
    step: 8,
    phase: "review-storage-assets",
    cli: "review-storage-assets.mjs",
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: "staging host only",
    description: "Review storage asset candidates",
  },
  {
    step: 9,
    phase: "prepare-upload-allowlist",
    cli: "prepare-storage-upload-allowlist.mjs",
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: "review manifest complete",
    description: "Prepare upload allowlist",
  },
  {
    step: 10,
    phase: "human-review-schedule-images",
    cli: "review-schedule-storage-assets.mjs",
    operation: "read-only",
    requiresHumanReview: true,
    safetyGate: "human review decisions recorded",
    description: "Human review for ambiguous schedule images",
  },
  {
    step: 11,
    phase: "promote-allowlist",
    cli: "promote-schedule-storage-allowlist.mjs",
    operation: "read/write-local",
    requiresHumanReview: true,
    safetyGate: "promote only approved assets",
    description: "Promote human-reviewed allowlist entries",
  },
  {
    step: 12,
    phase: "storage-upload",
    cli: "upload-storage-assets.mjs",
    operation: "upload",
    requiresHumanReview: false,
    safetyGate: "allowlist + staging host preflight",
    description: "Storage upload (staging only)",
  },
  {
    step: 13,
    phase: "db-update",
    cli: "apply-storage-db-updates.mjs",
    operation: "db-update",
    requiresHumanReview: false,
    safetyGate: "upload manifest + legacy_id allowlist",
    description: "Apply Storage URL DB updates",
  },
  {
    step: 14,
    phase: "build",
    cli: "npm run build",
    operation: "read/write-local",
    requiresHumanReview: false,
    safetyGate: "export JSON fresh",
    description: "Build static site",
  },
  {
    step: 15,
    phase: "verify-public-artifact",
    cli: "verify-static-public-artifact.mjs",
    operation: "read-only",
    requiresHumanReview: false,
    safetyGate: "no admin/api in public-dist",
    description: "Verify public artifact safety",
  },
  {
    step: 16,
    phase: "staging-ftp-deploy",
    cli: "deploy-public-dist-ftp.mjs",
    operation: "deploy",
    requiresHumanReview: false,
    safetyGate: "staging base path + noindex",
    description: "Staging FTP deploy",
  },
  {
    step: 17,
    phase: "staging-qa",
    cli: null,
    operation: "read-only",
    requiresHumanReview: true,
    safetyGate: "HTTP 200 + visual QA",
    description: "Staging QA (manual)",
  },
  {
    step: 18,
    phase: "production-readiness-gate",
    cli: "plan-staging-generation.mjs",
    operation: "read-only",
    requiresHumanReview: true,
    safetyGate: "production.enabled + owner sign-off",
    description: "Production readiness gate",
  },
];

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {string | null} reportArg
 * @param {string | null} manifestArg
 * @param {string} toolRoot
 * @param {string} repoRoot
 */
export function resolvePlanOutputPaths(siteConfig, reportArg, manifestArg, toolRoot, repoRoot) {
  const siteSlug = String(siteConfig.siteSlug ?? "unknown").trim();
  const defaultDir = `output/plans/${siteSlug}`;
  const reportRel = reportArg ?? `${defaultDir}/STAGING_GENERATION_PLAN.md`;
  const manifestRel = manifestArg ?? `${defaultDir}/staging-generation-plan.json`;

  const reportAbs = resolveSiteConfigPath(reportRel, toolRoot, repoRoot);
  const manifestAbs = resolveSiteConfigPath(manifestRel, toolRoot, repoRoot);

  return {
    reportAbs,
    manifestAbs,
    reportRelative: path.relative(repoRoot, reportAbs).split(path.sep).join("/"),
    manifestRelative: path.relative(repoRoot, manifestAbs).split(path.sep).join("/"),
  };
}

/**
 * @param {object[]} columns
 */
function extractStorageColumns(columns) {
  return (columns ?? [])
    .map((c) => c.name)
    .filter((name) => typeof name === "string" && /_url$|image_url$|photo_url$|thumbnail_url$/.test(name));
}

/**
 * @param {object} adapter
 * @param {string} tableName
 */
function storageColumnsForTable(adapter, tableName) {
  const fromMappings = (adapter.storageMappings ?? [])
    .filter((m) => m.targetTable === tableName)
    .map((m) => m.targetColumn);
  return [...new Set(fromMappings)];
}

/**
 * @param {object} mapping
 */
function recommendedPhaseForAsset(mapping) {
  return mapping.humanReviewRequired ? "human-review-before-upload" : "storage-review-and-allowlist";
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} template
 * @param {object} adapter
 */
function buildStagingContext(siteConfig, template, adapter) {
  const deploy =
    siteConfig.deploy && typeof siteConfig.deploy === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.deploy)
      : {};
  const staging =
    deploy.staging && typeof deploy.staging === "object"
      ? /** @type {Record<string, unknown>} */ (deploy.staging)
      : {};
  const production =
    deploy.production && typeof deploy.production === "object"
      ? /** @type {Record<string, unknown>} */ (deploy.production)
      : {};
  const cms =
    siteConfig.cms && typeof siteConfig.cms === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.cms)
      : {};
  const storage =
    siteConfig.storage && typeof siteConfig.storage === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.storage)
      : {};
  const seo =
    siteConfig.seo && typeof siteConfig.seo === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.seo)
      : {};

  return {
    base: typeof staging.base === "string" ? staging.base : null,
    publicUrl: typeof staging.publicUrl === "string" ? staging.publicUrl : null,
    noindex: seo.stagingNoindex !== false,
    robotsDisallowAll: seo.robotsDisallowAll === true,
    storageBucket: typeof storage.bucket === "string" ? storage.bucket : null,
    storagePathPrefix: typeof storage.pathPrefix === "string" ? storage.pathPrefix : siteConfig.siteSlug,
    supabaseHost: typeof cms.stagingHost === "string" ? cms.stagingHost : null,
    productionEnabled: production.enabled === true,
    productionBaseUrl:
      typeof production.baseUrl === "string"
        ? production.baseUrl
        : typeof seo.productionBaseUrl === "string"
          ? seo.productionBaseUrl
          : null,
  };
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} template
 * @param {object} adapter
 * @param {object} stagingCtx
 */
function buildProductionReadiness(siteConfig, template, adapter, stagingCtx) {
  /** @type {string[]} */
  const blockingItems = [];

  if (!stagingCtx.productionEnabled) {
    blockingItems.push("production deploy disabled in site config");
  }
  blockingItems.push("owner confirmation required for image rights");
  blockingItems.push("staging QA required before production");

  if (template.status === "draft") {
    blockingItems.push(`template "${template.templateId}" is draft`);
  }
  if (adapter.status === "draft") {
    blockingItems.push(`schema adapter "${adapter.adapterId}" is draft`);
  }
  if (!stagingCtx.noindex) {
    blockingItems.push("staging noindex is not enabled");
  }

  const humanReviewAssets = (adapter.storageMappings ?? []).filter((m) => m.humanReviewRequired);
  if (humanReviewAssets.length) {
    blockingItems.push(
      `human review required for storage assets: ${humanReviewAssets.map((m) => m.assetType).join(", ")}`,
    );
  }

  const slug = typeof siteConfig.siteSlug === "string" ? siteConfig.siteSlug : "";
  if (slug === "gosaki") {
    blockingItems.push("schedule flyer migration not fully proven — human review still required");
  }

  return {
    ready: false,
    blockingItems,
  };
}

/**
 * @param {object} template
 * @param {object} adapter
 */
function buildHumanReviewRequired(template, adapter) {
  const assetTypes = (adapter.storageMappings ?? [])
    .filter((m) => m.humanReviewRequired)
    .map((m) => m.assetType);

  /** @type {Array<{ scope: string, assetTypes: string[], reason: string }>} */
  const items = [];

  if (assetTypes.length) {
    items.push({
      scope: "storage-assets",
      assetTypes,
      reason: "schedule image matching can be ambiguous",
    });
  }

  const modelReview = (template.contentModels ?? []).filter((m) => m.humanReviewRequired);
  if (modelReview.length) {
    items.push({
      scope: "content-models",
      assetTypes: modelReview.flatMap((m) => m.storageAssets ?? []),
      reason: "content model flagged humanReviewRequired in template registry",
    });
  }

  return items;
}

/**
 * @param {object} adapter
 */
function buildHumanReviewGates(adapter) {
  const rules = adapter.humanReviewRules ?? [];
  /** @type {Array<Record<string, unknown>>} */
  const gates = [];

  for (const rule of rules) {
    gates.push({
      gateId: rule.ruleId,
      appliesTo: rule.appliesTo ?? [],
      condition: rule.condition,
      defaultAction: rule.defaultAction,
      reasonRequired: Boolean(rule.reasonRequired),
    });
  }

  gates.push({
    gateId: "rights-confirmation-before-production",
    appliesTo: (adapter.storageMappings ?? []).map((m) => m.assetType),
    condition: "owner confirms image rights before production deploy",
    defaultAction: "defer",
    reasonRequired: true,
  });

  return gates;
}

/**
 * @param {string} siteSlug
 * @param {object} template
 * @param {object} adapter
 */
function buildSiteNotes(siteSlug, template, adapter) {
  if (siteSlug !== "gosaki") return [];

  return [
    "musician-basic is proven with gosaki",
    "discography cover migration has been proven (G-4b)",
    "schedule home image migration has been proven (G-4f/g)",
    "schedule flyer remains human-review dependent",
    "production is disabled in site config",
    `schema adapter ${adapter.adapterId} status: ${adapter.status}`,
    `template ${template.templateId} status: ${template.status}`,
  ];
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} template
 * @param {object} adapter
 * @param {string[]} warnings
 */
function collectPlanWarnings(siteConfig, template, adapter, warnings) {
  const merged = [...warnings];

  if (template.status === "draft") {
    merged.push(`template "${template.templateId}" is draft — not production-ready`);
  }
  if (adapter.status === "draft") {
    merged.push(`schema adapter "${adapter.adapterId}" is draft — Supabase tables may not exist`);
  }

  const deploy =
    siteConfig.deploy && typeof siteConfig.deploy === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.deploy)
      : {};
  const production =
    deploy.production && typeof deploy.production === "object"
      ? /** @type {Record<string, unknown>} */ (deploy.production)
      : {};
  if (production.enabled === true) {
    merged.unshift(
      "WARNING: production.enabled is true in site config — verify staging QA before any production deploy",
    );
  }

  const seo =
    siteConfig.seo && typeof siteConfig.seo === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.seo)
      : {};
  if (seo.stagingNoindex === false) {
    merged.push("seo.stagingNoindex is false — staging may be indexed by search engines");
  }

  return [...new Set(merged)];
}

/**
 * @param {Record<string, unknown>} siteConfig
 * @param {object} template
 * @param {object} adapter
 * @param {string[]} warnings
 * @param {string | null} siteConfigPathRelative
 */
export function buildStagingGenerationPlan(siteConfig, template, adapter, warnings, siteConfigPathRelative) {
  const siteSlug = String(siteConfig.siteSlug ?? "").trim();
  const stagingCtx = buildStagingContext(siteConfig, template, adapter);

  const schemaTables = (adapter.tables ?? []).map((t) => ({
    table: t.table,
    model: t.model,
    required: Boolean(t.required),
    legacyIdPattern: t.legacyId?.pattern ?? null,
    legacyIdStrategy: t.legacyId?.strategy ?? null,
    legacyIdExample: t.legacyId?.example ?? null,
    storageColumns: [
      ...new Set([
        ...extractStorageColumns(t.columns),
        ...storageColumnsForTable(adapter, t.table),
      ]),
    ],
  }));

  const storageMigrationPlan = (adapter.storageMappings ?? []).map((m) => ({
    assetType: m.assetType,
    targetTable: m.targetTable,
    targetColumn: m.targetColumn,
    pathPattern: m.pathPattern ?? null,
    legacyIdPattern: m.legacyIdPattern ?? null,
    humanReviewRequired: Boolean(m.humanReviewRequired),
    provenWith: m.provenWith ?? [],
    recommendedPhase: recommendedPhaseForAsset(m),
  }));

  const productionReadiness = buildProductionReadiness(siteConfig, template, adapter, stagingCtx);

  const plan = {
    phase: "G-5f",
    siteConfigPath: siteConfigPathRelative,
    siteSlug,
    siteName: typeof siteConfig.siteName === "string" ? siteConfig.siteName : null,
    siteType: typeof siteConfig.siteType === "string" ? siteConfig.siteType : null,
    templateId: template.templateId,
    schemaAdapterId: adapter.adapterId,
    mode: "read-only-plan",
    generatedAt: new Date().toISOString(),
    staging: {
      base: stagingCtx.base,
      publicUrl: stagingCtx.publicUrl,
      noindex: stagingCtx.noindex,
      robotsDisallowAll: stagingCtx.robotsDisallowAll,
      storageBucket: stagingCtx.storageBucket,
      storagePathPrefix: stagingCtx.storagePathPrefix,
      supabaseHost: stagingCtx.supabaseHost,
    },
    safety: {
      ...PLAN_SAFETY,
      productionEnabled: stagingCtx.productionEnabled,
    },
    template: {
      status: template.status,
      pages: template.pages ?? [],
      contentModels: (template.contentModels ?? []).map((m) => m.model),
      storageAssetTypes: (template.storageAssetTypes ?? []).map((a) => a.assetType),
    },
    schema: {
      provider: adapter.provider,
      status: adapter.status,
      tables: schemaTables,
    },
    storageMigrationPlan,
    recommendedWorkflow: STANDARD_WORKFLOW_STEPS.map((s) => ({
      step: s.step,
      phase: s.phase,
      cli: s.cli,
      operation: s.operation,
      requiresHumanReview: s.requiresHumanReview,
      safetyGate: s.safetyGate,
      description: s.description,
    })),
    humanReviewRequired: buildHumanReviewRequired(template, adapter),
    humanReviewGates: buildHumanReviewGates(adapter),
    productionReadiness,
    siteNotes: buildSiteNotes(siteSlug, template, adapter),
    nextPhaseSuggestions: [
      "G-5g: connect plan to dry-run site generation from site config",
      "G-5h: product onboarding runbook and customer checklist",
      "Later: write CLI site-config support (upload / DB update / FTP)",
    ],
    warnings: warnings,
    validationOk: true,
  };

  return plan;
}

/**
 * @param {ReturnType<typeof buildStagingGenerationPlan>} plan
 */
export function formatStagingGenerationReport(plan) {
  const lines = [
    "# Staging Generation Plan (G-5f)",
    "",
    "> Read-only plan. No Astro generation, DB create/update, Storage upload, or FTP deploy.",
    "",
    "## Header",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| siteSlug | ${plan.siteSlug} |`,
    `| siteName | ${plan.siteName ?? "(n/a)"} |`,
    `| siteType | ${plan.siteType ?? "(n/a)"} |`,
    `| templateId | ${plan.templateId} |`,
    `| schemaAdapterId | ${plan.schemaAdapterId} |`,
    `| mode | ${plan.mode} |`,
    `| generatedAt | ${plan.generatedAt} |`,
    "",
  ];

  if (plan.siteConfigPath) {
    lines.push(`**Site config:** \`${plan.siteConfigPath}\``, "");
  }

  lines.push(
    "## Safety",
    "",
    "Upload performed: **no**",
    "DB create performed: **no**",
    "DB update performed: **no**",
    "FTP deploy performed: **no**",
    "Astro generation performed: **no**",
    `Production enabled: **${plan.safety.productionEnabled ? "true" : "false"}**`,
    "",
    "## Template summary",
    "",
    `**Status:** ${plan.template.status}`,
    "",
    "### Pages",
    "",
    ...(plan.template.pages.length ? plan.template.pages.map((p) => `- ${p}`) : ["(none)"]),
    "",
    "### Content models",
    "",
    ...(plan.template.contentModels.length
      ? plan.template.contentModels.map((m) => `- ${m}`)
      : ["(none)"]),
    "",
    "### Storage asset types",
    "",
    ...(plan.template.storageAssetTypes.length
      ? plan.template.storageAssetTypes.map((a) => `- ${a}`)
      : ["(none)"]),
    "",
    "## Schema summary",
    "",
    `**Provider:** ${plan.schema.provider}`,
    `**Adapter status:** ${plan.schema.status}`,
    "",
    "| table | model | required | legacyId pattern | storage columns |",
    "| --- | --- | --- | --- | --- |",
  );

  for (const t of plan.schema.tables) {
    lines.push(
      `| ${t.table} | ${t.model} | ${t.required ? "yes" : "no"} | ${t.legacyIdPattern ?? "—"} | ${t.storageColumns.join(", ") || "—"} |`,
    );
  }

  lines.push("", "## Storage migration plan", "");

  if (plan.storageMigrationPlan.length) {
    lines.push(
      "| assetType | target | human review | pathPattern | phase |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const m of plan.storageMigrationPlan) {
      lines.push(
        `| ${m.assetType} | ${m.targetTable}.${m.targetColumn} | ${m.humanReviewRequired ? "yes" : "no"} | ${m.pathPattern ?? "—"} | ${m.recommendedPhase} |`,
      );
    }
  } else {
    lines.push("(no storage mappings)");
  }

  lines.push("", "## Human review gates", "");

  for (const gate of plan.humanReviewGates) {
    lines.push(
      `- **${gate.gateId}** (${(gate.appliesTo ?? []).join(", ") || "all"}): ${gate.condition} → ${gate.defaultAction}`,
    );
  }

  lines.push(
    "",
    "- Schedule image ambiguity — date / event matching may be wrong",
    "- Alt-date-conflict — filename date does not match schedule.date",
    "- Cross-page inferred — image from different page or month",
    "- NO PHOTO / placeholder — reject placeholder sources",
    "- Rights confirmation — required before production",
    "",
    "## Recommended workflow",
    "",
    "| Step | Phase | CLI | Operation | Human review | Safety gate |",
    "| --- | --- | --- | --- | --- | --- |",
  );

  for (const w of plan.recommendedWorkflow) {
    lines.push(
      `| ${w.step} | ${w.phase} | ${w.cli ?? "—"} | ${w.operation} | ${w.requiresHumanReview ? "yes" : "no"} | ${w.safetyGate ?? "—"} |`,
    );
  }

  if (plan.siteNotes.length) {
    lines.push("", "## Current site notes", "");
    for (const note of plan.siteNotes) lines.push(`- ${note}`);
  }

  lines.push(
    "",
    "## Production readiness",
    "",
    `**Ready:** ${plan.productionReadiness.ready ? "yes" : "no"}`,
    "",
    "### Blocking items",
    "",
  );
  for (const item of plan.productionReadiness.blockingItems) {
    lines.push(`- ${item}`);
  }

  if (plan.warnings.length) {
    lines.push("", "## Warnings", "");
    for (const w of plan.warnings) lines.push(`- ${w}`);
  }

  lines.push("", "## Next phase suggestions", "");
  for (const s of plan.nextPhaseSuggestions) lines.push(`- ${s}`);

  return `${lines.join("\n")}\n`;
}

/**
 * @param {{
 *   siteConfigPath: string,
 *   reportPath?: string | null,
 *   manifestPath?: string | null,
 *   templateRegistryPath?: string | null,
 *   adaptersPath?: string | null,
 *   toolRoot?: string,
 * }} opts
 */
export function planStagingGeneration(opts) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(toolRoot, "../..");

  const loaded = loadSiteConfig(opts.siteConfigPath, { toolRoot, repoRoot });
  const siteConfig = loaded.config;

  const { registry: templateRegistry } = loadTemplateRegistry(opts.templateRegistryPath ?? null, {
    toolRoot,
  });
  const { registry: adaptersRegistry } = loadSchemaAdapters(opts.adaptersPath ?? null, { toolRoot });

  const templateValidation = validateSiteConfigTemplate(siteConfig, templateRegistry);
  if (!templateValidation.ok) {
    throw new Error(
      `Site config / template validation failed:\n- ${templateValidation.errors.join("\n- ")}`,
    );
  }

  const template = templateValidation.template;
  if (!template) {
    throw new Error("templateId is required in site config for staging generation plan");
  }

  const adapter = resolveSchemaAdapterForSiteConfig(siteConfig, adaptersRegistry);
  const adapterValidation = validateTemplateSchemaAdapter(template, adapter, siteConfig);

  if (!adapterValidation.ok) {
    throw new Error(
      `Template / schema adapter validation failed:\n- ${adapterValidation.errors.join("\n- ")}`,
    );
  }

  const warnings = collectPlanWarnings(siteConfig, template, adapter, [
    ...templateValidation.warnings,
    ...adapterValidation.warnings,
  ]);

  const plan = buildStagingGenerationPlan(
    siteConfig,
    template,
    adapter,
    warnings,
    loaded.configPathRelative,
  );

  const paths = resolvePlanOutputPaths(
    siteConfig,
    opts.reportPath ?? null,
    opts.manifestPath ?? null,
    toolRoot,
    repoRoot,
  );

  return { plan, paths, siteConfigPathRelative: loaded.configPathRelative };
}
