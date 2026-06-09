/**
 * Sariswing admin CMS inventory scanner (G-5j).
 * Read-only — does not modify source code or touch production.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

export const INVENTORY_SAFETY = {
  codeModified: false,
  dbUpdatePerformed: false,
  storageUploadPerformed: false,
  ftpDeployPerformed: false,
  githubDispatchPerformed: false,
  productionTouched: false,
};

/** @type {readonly string[]} */
export const ADMIN_SCAN_REL_DIRS = [
  "src/pages/admin",
  "src/components/admin",
  "src/lib/admin",
  "src/scripts/admin",
  "src/lib/supabase-admin.ts",
  "src/layouts/BaseLayout.astro",
  "supabase/functions",
  ".github/workflows",
];

/** @type {Record<string, string>} */
const ROUTE_MAP = {
  "src/pages/admin/index.astro": "/admin",
  "src/pages/admin/login/index.astro": "/admin/login",
  "src/pages/admin/forgot-password/index.astro": "/admin/forgot-password",
  "src/pages/admin/reset-password/index.astro": "/admin/reset-password",
  "src/pages/admin/news/index.astro": "/admin/news",
  "src/pages/admin/schedule/index.astro": "/admin/schedule",
  "src/pages/admin/instagram/index.astro": "/admin/instagram",
  "src/pages/admin/about/index.astro": "/admin/about",
};

/**
 * @param {string} relPath
 * @param {string} content
 */
export function classifyAdminFile(relPath, content) {
  const p = relPath.replace(/\\/g, "/");

  if (p.includes("trigger-deploy") || p.includes("deploy-status") || p.includes("_shared/github")) {
    return { classification: "risky", module: "publish", notes: "GitHub workflow_dispatch + deploy status" };
  }
  if (p.includes("admin-auth") || p.includes("supabase-service")) {
    return { classification: "risky", module: "auth", notes: "ADMIN_EMAILS / service role on Edge Function" };
  }
  if (p.includes("deploy-api") || p.includes("deploy-trigger") || p.includes("AdminDeployBar")) {
    return { classification: "risky", module: "publish", notes: "Production publish trigger from admin UI" };
  }
  if (p.includes("image-upload") || p.includes("mount-image-upload")) {
    return { classification: "risky", module: "media", notes: "Client-side Storage upload + resize" };
  }
  if (p.includes("instagram")) {
    return { classification: "site-specific", module: "instagram", notes: "Sariswing Instagram embed admin" };
  }
  if (p.includes("schedule-image-fields") || p.includes("schedule-constants")) {
    return {
      classification: "site-specific",
      module: "schedule",
      notes: "Sariswing schedule schema (venues, time_type, image_urls)",
    };
  }
  if (p.includes("admin/login") || p.includes("forgot-password") || p.includes("reset-password")) {
    return { classification: "reusable", module: "auth", notes: "Supabase Auth login / reset flow" };
  }
  if (p.includes("require-admin-session") || p.includes("auth-paths")) {
    return { classification: "reusable", module: "auth", notes: "Client session guard" };
  }
  if (p.includes("admin-news") || (p.includes("/news") && p.includes("admin"))) {
    return { classification: "reusable", module: "news", notes: "News CRUD + logical delete pattern" };
  }
  if (p.includes("admin-schedule") || (p.includes("/schedule") && p.includes("admin"))) {
    return { classification: "reusable", module: "schedule", notes: "Schedule CRUD + duplicate/restore" };
  }
  if (
    p.includes("admin-site-page") ||
    p.includes("site-page") ||
    p.includes("/about/") ||
    p.includes("scripts/admin/about")
  ) {
    return { classification: "reusable", module: "about", notes: "About / site page revisions" };
  }
  if (p === "src/pages/admin/index.astro" || p.includes("scripts/admin/index")) {
    return { classification: "reusable", module: "dashboard", notes: "Admin dashboard menu" };
  }
  if (p.includes("_shared/schedules")) {
    return { classification: "site-specific", module: "schedule", notes: "Sariswing schedule schema types" };
  }
  if (p.includes("_shared/news")) {
    return { classification: "reusable", module: "news", notes: "News schema types + select columns" };
  }
  if (p.includes("_shared/instagram")) {
    return { classification: "site-specific", module: "instagram", notes: "Instagram post schema" };
  }
  if (p.includes("_shared/site-pages")) {
    return { classification: "reusable", module: "about", notes: "Site page revision logic" };
  }
  if (p.includes("invoke-admin-edge")) {
    return { classification: "reusable", module: "core", notes: "Edge Function invoke wrapper" };
  }
  if (p.includes("paginated-list") || p.includes("strip-html") || p.includes("format-deleted-at")) {
    return { classification: "reusable", module: "core", notes: "Generic admin UI helper" };
  }
  if (
    p.includes("create-news-list-item") ||
    p.includes("create-schedule-list-item") ||
    p.includes("NewsAdminItem") ||
    p.includes("ScheduleAdminItem")
  ) {
    return { classification: "reusable", module: "core", notes: "List item DOM builder (module-specific data)" };
  }
  if (p.includes("deploy.yml")) {
    return { classification: "risky", module: "publish", notes: "Production FTP workflow (workflow_dispatch)" };
  }
  if (p.includes("supabase-admin.ts")) {
    return { classification: "risky", module: "auth", notes: "Anon key client with persisted session" };
  }
  if (p.includes("BaseLayout.astro") && content.includes("admin")) {
    return { classification: "reusable", module: "layout", notes: "Admin layout shell" };
  }

  return { classification: "unknown", module: "unknown", notes: "Manual review recommended" };
}

/**
 * @param {string} content
 */
export function extractFileSignals(content) {
  const lower = content.toLowerCase();
  return {
    supabaseAuth: /supabase.*auth|getsession|signin|signout|resetpassword/.test(lower),
    supabaseTable: /\.from\(["'`]/.test(content) || /from\("/.test(content),
    storageUpload: /storage\.from|\.upload\(/.test(content),
    edgeInvoke: /functions\.invoke|invokeAdminEdgeFunction/.test(content),
    workflowDispatch: /workflow_dispatch|trigger-deploy|triggerDeploy/.test(content),
    githubApi: /api\.github\.com/.test(content),
    deletedAt: /deleted_at/.test(content),
    duplicate: /duplicate/.test(content),
    restore: /restore/.test(content),
    isPublished: /is_published|published/.test(content),
    adminEmails: /ADMIN_EMAILS/.test(content),
    serviceRole: /SERVICE_ROLE|serviceRole|createServiceClient/.test(content),
  };
}

/**
 * @param {string} relPath
 */
export function inferFileKind(relPath) {
  const p = relPath.replace(/\\/g, "/");
  if (p.startsWith("src/pages/admin/")) return "admin-page";
  if (p.startsWith("src/components/admin/")) return "admin-component";
  if (p.startsWith("src/lib/admin/")) return "admin-lib";
  if (p.startsWith("src/scripts/admin/")) return "admin-script";
  if (p.startsWith("supabase/functions/")) return "edge-function";
  if (p.includes(".github/workflows/")) return "github-workflow";
  if (p === "src/lib/supabase-admin.ts") return "admin-lib";
  if (p.startsWith("src/layouts/")) return "layout";
  return "other";
}

/**
 * @param {string} absPath
 * @param {string} repoRoot
 */
function collectAdminFiles(absPath, repoRoot) {
  /** @type {string[]} */
  const files = [];

  function walk(current) {
    if (!fs.existsSync(current)) return;
    const stat = fs.statSync(current);
    if (stat.isFile()) {
      files.push(current);
      return;
    }
    for (const entry of fs.readdirSync(current)) {
      if (entry.startsWith(".")) continue;
      walk(path.join(current, entry));
    }
  }

  walk(absPath);
  return files
    .map((f) => path.relative(repoRoot, f).split(path.sep).join("/"))
    .filter((rel) => /\.(astro|ts|tsx|js|mjs|yml|yaml|toml)$/.test(rel))
    .sort();
}

/**
 * @param {string} repoRoot
 */
export function scanAdminCmsInventory(repoRoot) {
  /** @type {string[]} */
  const allRelPaths = [];

  for (const rel of ADMIN_SCAN_REL_DIRS) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isFile()) {
      allRelPaths.push(rel);
    } else {
      allRelPaths.push(...collectAdminFiles(abs, repoRoot));
    }
  }

  const unique = [...new Set(allRelPaths)];

  /** @type {Array<Record<string, unknown>>} */
  const fileEntries = [];
  /** @type {Set<string>} */
  const modules = new Set();
  let supabaseCalls = 0;
  let storageCalls = 0;
  let publishRefs = 0;

  for (const relPath of unique) {
    const abs = path.join(repoRoot, relPath);
    let content = "";
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      content = "";
    }

    const { classification, module, notes } = classifyAdminFile(relPath, content);
    const signals = extractFileSignals(content);
    modules.add(module);

    if (signals.supabaseTable || signals.supabaseAuth || signals.edgeInvoke) supabaseCalls += 1;
    if (signals.storageUpload) storageCalls += 1;
    if (signals.workflowDispatch || signals.githubApi) publishRefs += 1;

    /** @type {string[]} */
    const features = [];
    if (signals.deletedAt) features.push("logical-delete");
    if (signals.duplicate) features.push("duplicate");
    if (signals.restore) features.push("restore");
    if (signals.isPublished) features.push("publish-toggle");
    if (signals.storageUpload) features.push("storage-upload");
    if (signals.workflowDispatch) features.push("workflow-dispatch");

    fileEntries.push({
      path: relPath,
      kind: inferFileKind(relPath),
      route: ROUTE_MAP[relPath] ?? null,
      module,
      classification,
      features,
      signals: {
        supabaseAuth: signals.supabaseAuth,
        supabaseTable: signals.supabaseTable,
        storage: signals.storageUpload,
        edgeInvoke: signals.edgeInvoke,
        publishWorkflow: signals.workflowDispatch || signals.githubApi,
      },
      storage: signals.storageUpload,
      publishWorkflow: signals.workflowDispatch || signals.githubApi,
      notes,
    });
  }

  const counts = {
    reusable: fileEntries.filter((f) => f.classification === "reusable").length,
    siteSpecific: fileEntries.filter((f) => f.classification === "site-specific").length,
    risky: fileEntries.filter((f) => f.classification === "risky").length,
    unknown: fileEntries.filter((f) => f.classification === "unknown").length,
    deprecated: fileEntries.filter((f) => f.classification === "deprecated").length,
  };

  const adminPages = fileEntries.filter((f) => f.kind === "admin-page").length;
  const components = fileEntries.filter((f) => f.kind === "admin-component").length;
  const libs = fileEntries.filter(
    (f) => f.kind === "admin-lib" || f.kind === "admin-script",
  ).length;

  return {
    site: "sariswing",
    mode: "read-only-inventory",
    generatedAt: new Date().toISOString(),
    scanRoot: repoRoot,
    safety: { ...INVENTORY_SAFETY },
    summary: {
      adminFiles: fileEntries.length,
      adminPages,
      adminComponents: components,
      adminLibAndScripts: libs,
      edgeFunctions: fileEntries.filter((f) => f.kind === "edge-function").length,
      modules: modules.size,
      supabaseCalls,
      storageCalls,
      publishWorkflowReferences: publishRefs,
      reusableCandidates: counts.reusable,
      siteSpecificItems: counts.siteSpecific,
      riskyItems: counts.risky,
      unknownItems: counts.unknown,
    },
    files: fileEntries,
    modules: buildModuleSummaries(fileEntries),
    risks: buildRiskList(),
    recommendations: buildRecommendations(),
    readinessMatrix: READINESS_MATRIX,
    routes: buildRouteInventory(fileEntries),
  };
}

/** @type {readonly { module: string, reusablePotential: string, extractionDifficulty: string, risk: string, suggestedPhase: string }[]} */
export const READINESS_MATRIX = [
  { module: "Auth", reusablePotential: "high", extractionDifficulty: "medium", risk: "high", suggestedPhase: "G-5l" },
  { module: "Dashboard", reusablePotential: "high", extractionDifficulty: "low", risk: "low", suggestedPhase: "G-5k" },
  { module: "News CRUD", reusablePotential: "high", extractionDifficulty: "medium", risk: "medium", suggestedPhase: "G-5k" },
  { module: "Schedule CRUD", reusablePotential: "high", extractionDifficulty: "high", risk: "medium", suggestedPhase: "G-5k/G-5o" },
  { module: "About / Site page", reusablePotential: "high", extractionDifficulty: "medium", risk: "medium", suggestedPhase: "G-5k" },
  { module: "Instagram", reusablePotential: "low", extractionDifficulty: "medium", risk: "low", suggestedPhase: "Later" },
  { module: "Image upload", reusablePotential: "high", extractionDifficulty: "high", risk: "high", suggestedPhase: "G-5m" },
  { module: "Publish workflow", reusablePotential: "high", extractionDifficulty: "high", risk: "high", suggestedPhase: "G-5n" },
  { module: "Media Library UI", reusablePotential: "medium", extractionDifficulty: "medium", risk: "medium", suggestedPhase: "G-5m" },
  { module: "musician-basic prototype", reusablePotential: "high", extractionDifficulty: "high", risk: "medium", suggestedPhase: "G-5o" },
];

/**
 * @param {Array<Record<string, unknown>>} files
 */
function buildModuleSummaries(files) {
  const moduleIds = ["auth", "news", "schedule", "instagram", "about", "publish", "media", "core"];
  return moduleIds.map((id) => {
    const related = files.filter((f) => f.module === id);
    return {
      module: id,
      fileCount: related.length,
      classifications: {
        reusable: related.filter((f) => f.classification === "reusable").length,
        siteSpecific: related.filter((f) => f.classification === "site-specific").length,
        risky: related.filter((f) => f.classification === "risky").length,
      },
      paths: related.map((f) => f.path),
    };
  });
}

function buildRouteInventory(files) {
  return files
    .filter((f) => f.kind === "admin-page")
    .map((f) => ({
      route: f.route ?? f.path,
      path: f.path,
      module: f.module,
      classification: f.classification,
      notes: f.notes,
    }));
}

function buildRiskList() {
  return [
    "Auth / ADMIN_EMAILS misconfiguration blocks all admin access",
    "Edge Function service role bypasses RLS — must stay server-side only",
    "trigger-deploy dispatches production GitHub workflow — no staging separation in Sariswing",
    "Storage bucket path prefixes (news/schedule) are site conventions",
    "Schedule schema (venues, time_type, image_urls[]) differs from musician-basic adapter",
    "Instagram module is Sariswing-specific — not in musician-basic template",
    "No dedicated /admin/sitemap route found — sitemap may be manual or external",
  ];
}

function buildRecommendations() {
  return [
    "G-5k: Extract AdminLayout pattern, list item builders, paginated-list, strip-html as reusable UI kit",
    "G-5l: Abstract admin-auth.ts + require-admin-session.ts into CMS Kit auth module",
    "G-5m: Map image-upload.ts to schema adapter storageMappings before generalizing",
    "G-5n: Add staging/production workflow separation before porting trigger-deploy",
    "G-5o: musician-basic admin prototype — schedule + news + profile only (skip Instagram)",
    "Keep Sariswing source read-only until inventory review is signed off",
  ];
}

/**
 * @param {ReturnType<typeof scanAdminCmsInventory>} inventory
 */
export function formatAdminInventoryReport(inventory) {
  const s = inventory.summary;
  const lines = [
    "# Sariswing Admin CMS Inventory Report (G-5j)",
    "",
    "> Read-only inventory. No code modified. No production operations.",
    "",
    "## Header",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| mode | ${inventory.mode} |`,
    `| target | Sariswing admin CMS |`,
    `| site | ${inventory.site} |`,
    `| generatedAt | ${inventory.generatedAt} |`,
    `| scan root | \`${inventory.scanRoot}\` |`,
    "",
    "## Safety",
    "",
    "Code modified: **no**",
    "DB update performed: **no**",
    "Storage upload performed: **no**",
    "FTP deploy performed: **no**",
    "GitHub dispatch performed: **no**",
    "Production touched: **no**",
    "",
    "## Summary",
    "",
    `| Metric | Count |`,
    "| --- | --- |",
    `| admin-related files | ${s.adminFiles} |`,
    `| admin pages | ${s.adminPages} |`,
    `| admin components | ${s.adminComponents} |`,
    `| lib + scripts | ${s.adminLibAndScripts} |`,
    `| edge functions (in scan) | ${s.edgeFunctions} |`,
    `| modules detected | ${s.modules} |`,
    `| files with Supabase signals | ${s.supabaseCalls} |`,
    `| files with Storage signals | ${s.storageCalls} |`,
    `| publish workflow references | ${s.publishWorkflowReferences} |`,
    `| reusable | ${s.reusableCandidates} |`,
    `| site-specific | ${s.siteSpecificItems} |`,
    `| risky | ${s.riskyItems} |`,
    `| unknown | ${s.unknownItems} |`,
    "",
    "## Admin routes / pages",
    "",
    "| route | path | module | classification | notes |",
    "| --- | --- | --- | --- | --- |",
  ];

  for (const r of inventory.routes) {
    lines.push(`| ${r.route} | ${r.path} | ${r.module} | ${r.classification} | ${r.notes} |`);
  }

  lines.push("", "## Admin components", "");
  for (const f of inventory.files.filter((x) => x.kind === "admin-component")) {
    lines.push(`- \`${f.path}\` — ${f.module} (${f.classification}): ${f.notes}`);
  }

  lines.push("", "## Supabase usage", "");
  lines.push("- **Auth:** `supabase-admin.ts` (anon + session), Edge `admin-auth.ts` (ADMIN_EMAILS + role)");
  lines.push("- **Tables:** `schedules`, `venues`, `news`, `instagram_posts`, site pages (via Edge Functions)");
  lines.push("- **Storage:** `image-upload.ts` → bucket from `PUBLIC_STORAGE_BUCKET` (default `images`)");
  lines.push("- **Edge Functions:** `admin-schedule`, `admin-news`, `admin-instagram`, `admin-site-page`, `trigger-deploy`, `deploy-status`");
  lines.push("- **Service role:** Edge `_shared/supabase-service.ts` only — not exposed to browser");
  lines.push("- **RLS assumption:** public read published; writes via service role on Edge");
  lines.push("- **Env (names only):** PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, ADMIN_EMAILS, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN, GITHUB_REPO, GITHUB_WORKFLOW_FILE");
  lines.push("", "## CMS modules", "");

  const moduleDocs = [
    ["Auth", "Login / forgot / reset + requireAdminSession + admin-auth Edge", "high", "Sariswing paths / Japanese copy", "medium", "G-5l"],
    ["Dashboard", "/admin index menu", "high", "Sariswing menu labels", "low", "G-5k"],
    ["News", "CRUD + duplicate + logical delete + restore", "high", "news table schema", "medium", "G-5k"],
    ["Schedule", "CRUD + venues + image_urls + duplicate/restore", "high", "venues/time_type schema", "high", "G-5k/G-5o"],
    ["Instagram", "embed CRUD + sort order", "low", "Sariswing-only module", "medium", "Later"],
    ["About", "site page revisions via admin-site-page", "high", "page key conventions", "medium", "G-5k"],
    ["Publish", "AdminDeployBar + trigger-deploy + deploy.yml", "high", "production-only workflow", "high", "G-5n"],
    ["Media", "image-upload resize + mount-image-upload-field", "high", "bucket path prefixes", "high", "G-5m"],
  ];

  lines.push("| module | current | reusable | site-specific | difficulty | next |", "| --- | --- | --- | --- | --- | --- |");
  for (const row of moduleDocs) {
    lines.push(`| ${row[0]} | ${row[1]} | ${row[2]} | ${row[3]} | ${row[4]} | ${row[5]} |`);
  }

  lines.push("", "## Publish workflow inventory", "");
  lines.push("- Admin button: `AdminDeployBar.astro` + `deploy-trigger.ts`");
  lines.push("- Edge: `trigger-deploy` → GitHub `workflow_dispatch` on `deploy.yml`");
  lines.push("- Status: `deploy-status` + polling in `deploy-trigger.ts`");
  lines.push("- FTP: `.github/workflows/deploy.yml` → lftp mirror `dist/` to Lolipop");
  lines.push("- Manual fallback: GitHub Actions UI run documented in ops");
  lines.push("- **Risk:** No staging/production workflow split in current Sariswing setup");
  lines.push("", "## Classification", "");

  for (const label of ["reusable", "site-specific", "risky", "unknown"]) {
    const title = label === "reusable" ? "Reusable candidates" : label === "site-specific" ? "Site-specific" : label === "risky" ? "Risky" : "Unknown / review";
    lines.push(`### ${title}`, "");
    const items = inventory.files.filter((f) => f.classification === label);
    if (!items.length) lines.push("(none)");
    for (const f of items) lines.push(`- \`${f.path}\` — ${f.module}: ${f.notes}`);
    lines.push("");
  }

  lines.push("## Extraction readiness matrix", "");
  lines.push("| Module | Reusable potential | Extraction difficulty | Risk | Suggested phase |", "| --- | --- | --- | --- | --- |");
  for (const row of inventory.readinessMatrix) {
    lines.push(`| ${row.module} | ${row.reusablePotential} | ${row.extractionDifficulty} | ${row.risk} | ${row.suggestedPhase} |`);
  }

  lines.push("", "## Risks", "");
  for (const r of inventory.risks) lines.push(`- ${r}`);

  lines.push("", "## Recommendations", "");
  for (const r of inventory.recommendations) lines.push(`- ${r}`);

  lines.push("", "## Next phase", "", "**G-5k:** Extract reusable admin UI components (no Sariswing file moves).", "");

  return `${lines.join("\n")}\n`;
}

/**
 * @param {{
 *   root?: string,
 *   reportPath?: string | null,
 *   manifestPath?: string | null,
 *   toolRoot?: string,
 * }} opts
 */
export function runAdminCmsInventory(opts = {}) {
  const toolRoot = opts.toolRoot ?? DEFAULT_TOOL_ROOT;
  const repoRoot = opts.root ? path.resolve(opts.root) : path.resolve(toolRoot, "../..");

  const inventory = scanAdminCmsInventory(repoRoot);

  const defaultOut = path.join(toolRoot, "output/admin-inventory/sariswing");
  const reportAbs = opts.reportPath
    ? path.resolve(opts.reportPath)
    : path.join(defaultOut, "ADMIN_CMS_INVENTORY_REPORT.md");
  const manifestAbs = opts.manifestPath
    ? path.resolve(opts.manifestPath)
    : path.join(defaultOut, "admin-cms-inventory.json");

  return { inventory, reportAbs, manifestAbs, repoRoot, toolRoot };
}
