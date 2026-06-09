/**
 * Admin scaffold dry-runner (G-5s).
 * Builds admin scaffold dry-run package from site config + registries.
 * Does NOT write runtime admin files, connect Supabase, DB, Storage, or deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteConfig, resolveSiteConfigPath } from "./site-config-loader.mjs";
import { loadTemplateRegistry, getTemplateById } from "./template-registry-loader.mjs";
import { loadSchemaAdapters, getSchemaAdapterById } from "./schema-adapter-loader.mjs";
import { loadAdminUiComponentsRegistry } from "./admin-ui-components-registry-loader.mjs";
import { loadAdminPreviewHarnessManifest } from "./admin-preview-harness-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

export const PACKAGE_SAFETY = {
  supabaseAuthConnected: false,
  supabaseQueryPerformed: false,
  dbUpdatePerformed: false,
  storageUploadPerformed: false,
  githubDispatchPerformed: false,
  ftpDeployPerformed: false,
  productionTouched: false,
};

/** @type {Record<string, { label: string; module: string; href: string; requiredRole: string; contentModel?: string; components: string[] }>} */
export const SECTION_CATALOG = {
  dashboard: {
    label: "Dashboard",
    module: "dashboard",
    href: "/admin/",
    requiredRole: "viewer",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-status-message",
      "admin-permission-badge",
    ],
  },
  profile: {
    label: "Profile",
    module: "profile",
    href: "/admin/profile/",
    requiredRole: "editor",
    contentModel: "profile",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-edit-form",
      "admin-form-field",
      "admin-publish-toggle",
      "admin-status-message",
      "profile-admin-ui",
    ],
  },
  schedule: {
    label: "Schedule",
    module: "schedules",
    href: "/admin/schedule/",
    requiredRole: "editor",
    contentModel: "schedules",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-data-table",
      "admin-edit-form",
      "admin-form-field",
      "admin-publish-toggle",
      "admin-duplicate-button",
      "admin-logical-delete-restore",
      "admin-sort-order-control",
      "schedule-admin-ui",
      "admin-image-uploader",
      "admin-media-preview",
    ],
  },
  discography: {
    label: "Discography",
    module: "discography",
    href: "/admin/discography/",
    requiredRole: "editor",
    contentModel: "discography",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-data-table",
      "admin-edit-form",
      "admin-form-field",
      "admin-publish-toggle",
      "admin-sort-order-control",
      "discography-admin-ui",
      "admin-image-uploader",
      "admin-media-preview",
    ],
  },
  links: {
    label: "Links",
    module: "links",
    href: "/admin/links/",
    requiredRole: "editor",
    contentModel: "links",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-data-table",
      "admin-edit-form",
      "admin-form-field",
      "admin-publish-toggle",
      "admin-sort-order-control",
      "links-admin-ui",
    ],
  },
  news: {
    label: "News",
    module: "news",
    href: "/admin/news/",
    requiredRole: "editor",
    contentModel: "news",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-data-table",
      "admin-edit-form",
      "admin-form-field",
      "admin-publish-toggle",
      "admin-logical-delete-restore",
      "news-admin-ui",
    ],
  },
  media: {
    label: "Media",
    module: "media",
    href: "/admin/media/",
    requiredRole: "admin",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-image-uploader",
      "admin-media-library",
      "admin-media-preview",
      "admin-media-rights-notice",
      "admin-storage-mapping-badge",
    ],
  },
  publish: {
    label: "Publish",
    module: "publish",
    href: "/admin/publish/",
    requiredRole: "admin",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-publish-button",
      "admin-deploy-status",
      "admin-publish-approval-gate",
      "admin-publish-history",
      "admin-publish-environment-badge",
      "admin-permission-badge",
    ],
  },
  settings: {
    label: "Settings",
    module: "settings",
    href: "/admin/settings/",
    requiredRole: "admin",
    components: [
      "admin-layout",
      "admin-nav",
      "admin-page-header",
      "admin-card",
      "admin-auth-status",
      "admin-permission-badge",
      "admin-status-message",
    ],
  },
};

const ALWAYS_SECTIONS = ["dashboard", "media", "publish", "settings"];

/** @type {Record<string, Record<string, string[]>>} */
const MODULE_PERMISSIONS = {
  dashboard: {
    viewer: ["read"],
    editor: ["read"],
    admin: ["read"],
  },
  profile: {
    viewer: ["read"],
    editor: ["read", "update"],
    admin: ["read", "create", "update"],
  },
  schedules: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore", "duplicate"],
  },
  discography: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  links: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  news: {
    viewer: ["read"],
    editor: ["read", "create", "update"],
    admin: ["read", "create", "update", "delete", "restore"],
  },
  media: {
    viewer: ["read"],
    editor: ["read"],
    admin: ["read", "upload", "replace", "remove"],
  },
  publish: {
    viewer: [],
    editor: ["request-staging-publish"],
    admin: ["trigger-staging-publish", "trigger-production-publish"],
  },
  settings: {
    viewer: ["read"],
    editor: ["read"],
    admin: ["read", "update"],
  },
};

/**
 * @param {object} template
 */
function resolveSectionIds(template) {
  const models = new Set(
    (template.contentModels ?? []).map((m) => String(m.model ?? "")),
  );

  /** @type {string[]} */
  const ids = [...ALWAYS_SECTIONS];

  for (const [sectionId, def] of Object.entries(SECTION_CATALOG)) {
    if (ALWAYS_SECTIONS.includes(sectionId)) continue;
    if (def.contentModel && models.has(def.contentModel)) {
      ids.push(sectionId);
    }
  }

  const order = [
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
  return order.filter((id) => ids.includes(id));
}

/**
 * @param {string[]} sectionIds
 */
function buildSections(sectionIds) {
  return {
    mode: "dry-run-generated",
    connectedToRuntime: false,
    sections: sectionIds.map((id) => {
      const def = SECTION_CATALOG[id];
      return {
        id,
        label: def.label,
        module: def.module,
        href: def.href,
        requiredRole: def.requiredRole,
        source: "template-and-schema-adapter",
        runtimeConnected: false,
      };
    }),
  };
}

/**
 * @param {string[]} sectionIds
 * @param {object[]} registryComponents
 */
function buildRequiredComponents(sectionIds, registryComponents) {
  /** @type {Record<string, object>} */
  const byId = {};
  for (const c of registryComponents) {
    byId[c.componentId] = c;
  }

  /** @type {object[]} */
  const sections = [];
  /** @type {string[]} */
  const allMissing = [];

  for (const sectionId of sectionIds) {
    const def = SECTION_CATALOG[sectionId];
    const requiredComponents = [...def.components];
    /** @type {string[]} */
    const missingComponents = [];
    /** @type {object[]} */
    const componentDetails = [];

    for (const componentId of requiredComponents) {
      const reg = byId[componentId];
      if (!reg) {
        missingComponents.push(componentId);
        allMissing.push(`${sectionId}:${componentId}`);
        componentDetails.push({
          componentId,
          foundInRegistry: false,
          scaffoldStatus: null,
          productionReady: null,
          connectedToRuntime: null,
        });
      } else {
        componentDetails.push({
          componentId,
          foundInRegistry: true,
          scaffoldStatus: reg.scaffoldStatus ?? reg.status ?? null,
          productionReady: reg.productionReady ?? false,
          connectedToRuntime: reg.connectedToRuntime ?? false,
        });
      }
    }

    sections.push({
      section: sectionId,
      module: def.module,
      requiredComponents,
      componentDetails,
      missingComponents,
      allComponentsAvailableAsScaffold: missingComponents.length === 0,
      runtimeConnected: false,
    });
  }

  return {
    mode: "dry-run-generated",
    connectedToRuntime: false,
    sections,
    summary: {
      totalSections: sections.length,
      sectionsWithMissingComponents: sections.filter((s) => s.missingComponents.length > 0)
        .length,
      missingComponents: [...new Set(allMissing)],
    },
  };
}

/**
 * @param {string[]} sectionIds
 */
function buildPermissions(sectionIds) {
  const modules = sectionIds.map((id) => SECTION_CATALOG[id].module);
  const uniqueModules = [...new Set(modules)];

  return {
    mode: "dry-run-generated",
    connectedToRuntime: false,
    productionReady: false,
    roles: ["viewer", "editor", "admin"],
    modules: uniqueModules.map((module) => ({
      module,
      permissions: MODULE_PERMISSIONS[module] ?? {
        viewer: ["read"],
        editor: ["read"],
        admin: ["read"],
      },
    })),
    productionPublish: {
      enabledByDefault: false,
      requiredRole: "admin",
      requiresExplicitApproval: true,
      requiresCustomerApproval: true,
      requiresRightsConfirmation: true,
      requiresRollbackPlan: true,
    },
  };
}

/**
 * @param {object} schemaAdapter
 * @param {string} siteSlug
 */
function buildStorageMappings(schemaAdapter, siteSlug) {
  const mappings = (schemaAdapter.storageMappings ?? []).map((m) => ({
    assetType: m.assetType,
    model: m.model,
    targetTable: m.targetTable,
    targetColumn: m.targetColumn,
    pathPattern: String(m.pathPattern ?? "").replace(/\{siteSlug\}/g, siteSlug),
    humanReviewRequired: Boolean(m.humanReviewRequired),
    rightsConfirmationRequired: Boolean(m.humanReviewRequired),
    stagingOnlyDefault: true,
    uploadConnected: false,
    dbUpdateConnected: false,
    provenWith: m.provenWith ?? [],
  }));

  return {
    mode: "dry-run-generated",
    connectedToRuntime: false,
    siteSlug,
    schemaAdapterId: schemaAdapter.adapterId,
    mappings,
  };
}

/**
 * @param {Record<string, unknown>} siteConfig
 */
function buildPublishPolicy(siteConfig) {
  const deploy =
    siteConfig.deploy && typeof siteConfig.deploy === "object"
      ? /** @type {Record<string, unknown>} */ (siteConfig.deploy)
      : {};
  const production =
    deploy.production && typeof deploy.production === "object"
      ? /** @type {Record<string, unknown>} */ (deploy.production)
      : {};

  return {
    mode: "dry-run-generated",
    connectedToRuntime: false,
    productionReady: false,
    stagingEnabled: true,
    productionEnabled: production.enabled === true,
    productionEnabledByDefault: false,
    explicitApprovalRequired: true,
    customerApprovalRequiredForProduction: true,
    rightsConfirmationRequiredForProduction: true,
    rollbackPlanRequiredForProduction: true,
    requiredRoleForStagingPublish: "admin",
    requiredRoleForProductionPublish: "admin",
    dispatchConnected: false,
    ftpDeployConnected: false,
    edgeFunctionConnected: false,
    githubDispatchPerformed: false,
    ftpDeployPerformed: false,
  };
}

/**
 * @param {object} previewManifest
 * @param {string} templateId
 * @param {string} siteSlug
 */
function buildPreviewPlan(previewManifest, templateId, siteSlug) {
  const prototypes = previewManifest.prototypes ?? [];
  const match =
    prototypes.find((p) => p.templateId === templateId) ??
    prototypes.find((p) => p.prototypeId?.includes(templateId.replace(/-/g, ""))) ??
    prototypes[0] ??
    null;

  if (!match) {
    return {
      mode: "dry-run-generated",
      siteSlug,
      templateId,
      matched: false,
      productionReady: false,
      connectedToRuntime: false,
      customerDemoReady: false,
      warnings: ["No matching prototype in preview manifest"],
    };
  }

  return {
    mode: "dry-run-generated",
    siteSlug,
    templateId,
    matched: true,
    prototypeId: match.prototypeId,
    previewStatus: match.previewStatus,
    customerDemoReady: match.customerDemoReady,
    requiresLocalHarness: match.requiresLocalHarness,
    prototypePath: match.prototypePath,
    propsExamplePath: match.propsExamplePath ?? null,
    sectionsExamplePath: match.sectionsExamplePath ?? null,
    manualPath: match.manualPath ?? null,
    quickChecklistPath: match.quickChecklistPath ?? null,
    productionReady: false,
    connectedToRuntime: false,
    recommendedNextStep: match.recommendedNextStep ?? null,
  };
}

/**
 * @param {object} inputs
 * @param {object} artifacts
 * @param {string[]} warnings
 */
function buildSafetyChecklistMarkdown(inputs, artifacts, warnings) {
  const lines = [
    "# Admin Scaffold Safety Checklist (Generated)",
    "",
    `**Site:** ${inputs.siteSlug} (${inputs.siteName})`,
    `**Template:** ${inputs.templateId}`,
    `**Generated:** ${artifacts.generatedAt}`,
    "",
    "## Dry-run package only",
    "",
    "- [x] This is a **dry-run package** under `output/admin-scaffold-packages/`",
    "- [x] **Not committed** to git",
    "- [x] **Runtime files written:** false",
    "- [x] **Admin scaffold generated to runtime:** false",
    "",
    "## Backend / deploy (must remain off)",
    "",
    "- [x] Runtime **not connected**",
    "- [x] Supabase Auth **not connected**",
    "- [x] Supabase query **not performed**",
    "- [x] DB create / DB update **not performed**",
    "- [x] Storage upload **not performed**",
    "- [x] GitHub dispatch **not performed**",
    "- [x] FTP deploy **not performed**",
    "- [x] Production **disabled** / not touched",
    "",
    "## Demo readiness",
    "",
    `- [ ] customerDemoReady: **${artifacts.previewPlan.customerDemoReady === true ? "true" : "false"}**`,
    "- [ ] Complete [preview-safety-checklist.md](../../templates/admin-cms/preview/preview-safety-checklist.md) before customer demo",
    "- [ ] Review [customer-admin-manual-musician-basic.md](../../docs/customer-admin-manual-musician-basic.md)",
    "- [ ] Review [customer-admin-quick-checklist-musician-basic.md](../../docs/customer-admin-quick-checklist-musician-basic.md)",
    "",
    "## Flags",
    "",
    `- productionReady: **false**`,
    `- connectedToRuntime: **false**`,
    "",
  ];

  if (warnings.length) {
    lines.push("## Warnings", "");
    for (const w of warnings) {
      lines.push(`- ${w}`);
    }
    lines.push("");
  }

  lines.push("*G-5s dry-run generated. No runtime connection.*");
  return lines.join("\n");
}

/**
 * @param {object} pkg
 * @param {object} inputs
 * @param {object} artifacts
 * @param {string[]} warnings
 * @param {string} outDirRelative
 */
function buildReportMarkdown(pkg, inputs, artifacts, warnings, outDirRelative) {
  const compSummary = artifacts.requiredComponents.summary;
  return `# Admin Scaffold Generation Report

**Mode:** dry-run only  
**Site:** ${inputs.siteSlug} (${inputs.siteName})  
**Template:** ${inputs.templateId}  
**Schema adapter:** ${inputs.schemaAdapterId}  
**Output:** \`${outDirRelative}/\`

---

## Summary

| Field | Value |
| --- | --- |
| mode | dry-run |
| runtime files written | **false** |
| adminScaffoldGenerated | **false** |
| productionReady | **false** |
| connectedToRuntime | **false** |
| DB / Storage / GitHub / FTP operations | **none** |

---

## Inputs

| Input | Path |
| --- | --- |
| Site config | \`${inputs.siteConfigPath}\` |
| Template registry | \`${inputs.templateRegistryPath}\` |
| Schema adapters | \`${inputs.schemaAdaptersPath}\` |
| Admin components registry | \`${inputs.adminComponentsRegistryPath}\` |
| Preview manifest | \`${inputs.previewManifestPath}\` |

---

## Generated package

| File | Description |
| --- | --- |
| admin-scaffold-generation-package.json | Package manifest |
| admin-sections.generated.json | Admin nav sections |
| admin-components.required.json | Required components per section |
| admin-permissions.generated.json | Module permissions |
| admin-storage-mappings.generated.json | Storage mappings from schema adapter |
| admin-publish-policy.generated.json | Publish policy |
| admin-preview-plan.generated.json | Preview plan from manifest |
| admin-safety-checklist.generated.md | Safety checklist |
| recommended-next-commands.md | Read-only next commands |

---

## Sections

${artifacts.sections.sections.map((s) => `- **${s.label}** (\`${s.id}\`) — module: \`${s.module}\`, role: \`${s.requiredRole}\``).join("\n")}

---

## Required components

- Sections: ${compSummary.totalSections}
- Sections with missing components: ${compSummary.sectionsWithMissingComponents}
${compSummary.missingComponents.length ? `- Missing: ${compSummary.missingComponents.join(", ")}` : "- All required components found in registry"}

---

## Permissions

- Roles: viewer, editor, admin
- Production publish: **disabled by default**
- connectedToRuntime: **false**

---

## Storage mappings

${artifacts.storageMappings.mappings.map((m) => `- \`${m.assetType}\` → \`${m.targetTable}.${m.targetColumn}\` (humanReview: ${m.humanReviewRequired})`).join("\n") || "- (none)"}

---

## Publish policy

- stagingEnabled: ${artifacts.publishPolicy.stagingEnabled}
- productionEnabled: ${artifacts.publishPolicy.productionEnabled}
- dispatchConnected: **false**
- ftpDeployConnected: **false**

---

## Preview plan

- prototypeId: ${artifacts.previewPlan.prototypeId ?? "(none)"}
- previewStatus: ${artifacts.previewPlan.previewStatus ?? "(n/a)"}
- customerDemoReady: **${artifacts.previewPlan.customerDemoReady === true ? "true" : "false"}**

---

## Safety status

| Flag | Value |
| --- | --- |
| supabaseAuthConnected | false |
| supabaseQueryPerformed | false |
| dbUpdatePerformed | false |
| storageUploadPerformed | false |
| githubDispatchPerformed | false |
| ftpDeployPerformed | false |
| productionTouched | false |

---

## Missing / warnings

${warnings.length ? warnings.map((w) => `- ${w}`).join("\n") : "- None"}

---

## Recommended next steps

1. Review \`admin-components.required.json\` for missing scaffolds
2. Run \`inspect-admin-preview-harness.mjs\`
3. Share customer manual only with scaffold disclaimer
4. **Do not** connect runtime without explicit approval (G-5t+)

---

*G-5s dry-run only. No DB / Storage / GitHub / FTP operations.*
`;
}

/**
 * @param {string} siteConfigPath
 * @param {string} outDirRelative
 */
function buildRecommendedCommands(siteConfigPath, outDirRelative) {
  return `# Recommended Next Commands (Read-only)

**Dry-run package:** \`${outDirRelative}/\`

Do **not** run deploy, DB update, Storage upload, or production publish commands.

## Regenerate admin scaffold package

\`\`\`bash
node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \\
  --site-config ${siteConfigPath}
\`\`\`

## Inspect preview harness

\`\`\`bash
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs --prototype musician-basic-admin-prototype
\`\`\`

## Inspect admin UI components

\`\`\`bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5p
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category prototype
\`\`\`

## Inspect site / template / schema (read-only)

\`\`\`bash
node tools/static-to-astro/scripts/inspect-cms-template.mjs --site-config ${siteConfigPath}
node tools/static-to-astro/scripts/inspect-schema-adapter.mjs --site-config ${siteConfigPath}
\`\`\`

---

*G-5s: read-only inspection only. No deploy or DB operations.*
`;
}

/**
 * @param {string | null} outDir
 * @param {string} siteSlug
 * @param {string} toolRoot
 * @param {string} [repoRoot]
 */
export function resolveAdminScaffoldPackageOutDir(
  outDir,
  siteSlug,
  toolRoot = DEFAULT_TOOL_ROOT,
  repoRoot = null,
) {
  const root = repoRoot ?? path.resolve(toolRoot, "../..");
  const rel = outDir && String(outDir).trim()
    ? String(outDir).trim()
    : `output/admin-scaffold-packages/${siteSlug}`;
  const abs = resolveSiteConfigPath(rel, toolRoot, root);
  return {
    outDirAbs: abs,
    outDirRelative: path.relative(root, abs).split(path.sep).join("/"),
  };
}

/**
 * @param {object} opts
 * @param {string} opts.siteConfigPath
 * @param {string} [opts.outDir]
 * @param {string} [opts.templateRegistryPath]
 * @param {string} [opts.schemaAdaptersPath]
 * @param {string} [opts.adminComponentsRegistryPath]
 * @param {string} [opts.previewManifestPath]
 * @param {string} [opts.siteSlug]
 * @param {string} [opts.toolRoot]
 */
export function generateAdminScaffoldDryRunPackage(opts) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = path.resolve(toolRoot, "../..");

  const loaded = loadSiteConfig(opts.siteConfigPath, { toolRoot, repoRoot });
  const config = loaded.config;
  const siteSlug = opts.siteSlug?.trim() || String(config.siteSlug);
  const templateId = String(config.templateId ?? "musician-basic");
  const schemaAdapterId = String(config.schemaAdapterId ?? `${templateId}-supabase-v1`);
  const siteName = String(config.siteName ?? siteSlug);

  const { registry: templateRegistry, registryPathRelative: templateRegistryPath } =
    loadTemplateRegistry(opts.templateRegistryPath, { toolRoot });
  const template = getTemplateById(templateRegistry, templateId);

  const { registry: schemaRegistry, adaptersPathRelative: schemaAdaptersPath } =
    loadSchemaAdapters(opts.schemaAdaptersPath ?? null, { toolRoot });
  const schemaAdapter = getSchemaAdapterById(schemaRegistry, schemaAdapterId);

  const { registryPath: adminRegAbs, registry: adminRegistry } = loadAdminUiComponentsRegistry(
    opts.adminComponentsRegistryPath,
  );
  const adminComponentsRegistryPath = path.relative(repoRoot, adminRegAbs).split(path.sep).join("/");

  const previewManifestAbs = opts.previewManifestPath
    ? resolveSiteConfigPath(opts.previewManifestPath, toolRoot, repoRoot)
    : path.join(toolRoot, "templates/admin-cms/preview/preview-manifest.json");
  const previewManifest = loadAdminPreviewHarnessManifest(previewManifestAbs);
  const previewManifestPath = path.relative(repoRoot, previewManifestAbs).split(path.sep).join("/");

  const sectionIds = resolveSectionIds(template);
  const generatedAt = new Date().toISOString();

  const sections = buildSections(sectionIds);
  const requiredComponents = buildRequiredComponents(sectionIds, adminRegistry.components);
  const permissions = buildPermissions(sectionIds);
  const storageMappings = buildStorageMappings(schemaAdapter, siteSlug);
  const publishPolicy = buildPublishPolicy(config);
  const previewPlan = buildPreviewPlan(previewManifest, templateId, siteSlug);

  /** @type {string[]} */
  const warnings = [];
  if (requiredComponents.summary.missingComponents.length) {
    warnings.push(
      `Missing components in registry: ${requiredComponents.summary.missingComponents.join(", ")}`,
    );
  }
  if (!previewPlan.matched) {
    warnings.push("No matching prototype in preview manifest");
  }
  if (previewPlan.customerDemoReady !== true) {
    warnings.push("customerDemoReady is false — not ready for customer demo");
  }

  const inputs = {
    siteSlug,
    siteName,
    siteType: String(config.siteType ?? template.siteTypes?.[0] ?? "musician"),
    templateId,
    schemaAdapterId,
    siteConfigPath: loaded.configPathRelative,
    templateRegistryPath,
    schemaAdaptersPath,
    adminComponentsRegistryPath,
    previewManifestPath,
  };

  const generationPackage = {
    mode: "dry-run",
    siteSlug,
    siteName,
    siteType: inputs.siteType,
    templateId,
    schemaAdapterId,
    generatedAt,
    productionReady: false,
    connectedToRuntime: false,
    adminScaffoldGenerated: false,
    runtimeFilesWritten: false,
    previewBuildPerformed: false,
    deployPerformed: false,
    safety: { ...PACKAGE_SAFETY },
    inputs,
    warnings,
    outputs: {
      sections: "admin-sections.generated.json",
      components: "admin-components.required.json",
      permissions: "admin-permissions.generated.json",
      storageMappings: "admin-storage-mappings.generated.json",
      publishPolicy: "admin-publish-policy.generated.json",
      previewPlan: "admin-preview-plan.generated.json",
      safetyChecklist: "admin-safety-checklist.generated.md",
      report: "ADMIN_SCAFFOLD_GENERATION_REPORT.md",
      recommendedCommands: "recommended-next-commands.md",
    },
  };

  const artifacts = {
    generatedAt,
    generationPackage,
    sections,
    requiredComponents,
    permissions,
    storageMappings,
    publishPolicy,
    previewPlan,
    safetyChecklist: buildSafetyChecklistMarkdown(
      inputs,
      { generatedAt, previewPlan },
      warnings,
    ),
    warnings,
  };

  const { outDirAbs, outDirRelative } = resolveAdminScaffoldPackageOutDir(
    opts.outDir ?? null,
    siteSlug,
    toolRoot,
    repoRoot,
  );

  artifacts.report = buildReportMarkdown(
    generationPackage,
    inputs,
    artifacts,
    warnings,
    outDirRelative,
  );
  artifacts.recommendedCommands = buildRecommendedCommands(
    loaded.configPathRelative,
    outDirRelative,
  );

  return {
    inputs,
    artifacts,
    outDirAbs,
    outDirRelative,
    validation: { ok: warnings.length === 0 || requiredComponents.summary.missingComponents.length === 0 },
  };
}

/**
 * @param {ReturnType<typeof generateAdminScaffoldDryRunPackage>} result
 */
export function writeAdminScaffoldPackage(result) {
  const { artifacts, outDirAbs } = result;
  fs.mkdirSync(outDirAbs, { recursive: true });

  const writeJson = (name, data) => {
    fs.writeFileSync(path.join(outDirAbs, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  };
  const writeText = (name, text) => {
    fs.writeFileSync(path.join(outDirAbs, name), text, "utf8");
  };

  writeJson("admin-scaffold-generation-package.json", artifacts.generationPackage);
  writeJson("admin-sections.generated.json", artifacts.sections);
  writeJson("admin-components.required.json", artifacts.requiredComponents);
  writeJson("admin-permissions.generated.json", artifacts.permissions);
  writeJson("admin-storage-mappings.generated.json", artifacts.storageMappings);
  writeJson("admin-publish-policy.generated.json", artifacts.publishPolicy);
  writeJson("admin-preview-plan.generated.json", artifacts.previewPlan);
  writeText("admin-safety-checklist.generated.md", artifacts.safetyChecklist);
  writeText("ADMIN_SCAFFOLD_GENERATION_REPORT.md", artifacts.report);
  writeText("recommended-next-commands.md", artifacts.recommendedCommands);

  return outDirAbs;
}
