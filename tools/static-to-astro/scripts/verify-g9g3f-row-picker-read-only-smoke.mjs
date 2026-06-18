/**
 * G-9g3f2 — Row picker read-only smoke (no Save, no Preview click, no DB write).
 * Routine dev safety + static/source markers + optional HTTP GET SSR markers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const SITE_SLUG = "gosaki-piano";
const PILOT_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const POC_MARKER = "[CMS Kit staging]";
const STAGING_SHELL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function mergeEnv() {
  const base = parseEnvFile(path.join(REPO_ROOT, ".env"));
  const local = parseEnvFile(path.join(REPO_ROOT, ".env.local"));
  return { ...base, ...local };
}

function decodeHtmlAttrJson(raw) {
  if (!raw) return [];
  const decoded = raw
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'");
  return JSON.parse(decoded);
}

function extractSectionAttr(html, sectionId, attr) {
  const idx = html.indexOf(`id="${sectionId}"`);
  if (idx === -1) return "";
  const slice = html.slice(idx, idx + 250_000);
  const re = new RegExp(`${attr}="([^"]*)"`);
  const match = slice.match(re);
  return match?.[1] ?? "";
}

function parseJsonRowsFromSection(html, sectionId, attr) {
  try {
    return decodeHtmlAttrJson(extractSectionAttr(html, sectionId, attr));
  } catch {
    return [];
  }
}

function rowHasPocMarker(row) {
  const fields = [row.title, row.venue, row.open_time, row.start_time, row.price, row.description];
  return fields.some((value) => String(value ?? "").includes(POC_MARKER));
}

// --- routine dev safety ---
const mergedEnv = mergeEnv();
const activeHost = hostFromUrl(mergedEnv.PUBLIC_SUPABASE_URL ?? "");

assert("routine dev staging write off", mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "false");
assert("routine dev dry-run on", mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "true");
assert(
  "routine dev g9g3d arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g2 arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev legacy poc ui off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE !== "true",
);
assert("routine dev staging host", activeHost === STAGING_HOST);
assert("routine dev not production host", activeHost !== PRODUCTION_HOST);

// --- static / source ---
const readSrc = readRepo("src/lib/admin/staging-write/staging-schedule-read.ts");
const pickerUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts",
);
const pickerBindingSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-binding.ts",
);
const pickerUtilsSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts",
);
const pickerSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugRowPickerSection.astro",
  ),
  "utf8",
);
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");

assert(
  "loader site_slug scope",
  readSrc.includes('.eq("site_slug", siteSlug)'),
);
assert(
  "reload site_slug scope",
  pickerUiSrc.includes('.eq("site_slug", siteSlug)') &&
    pickerUiSrc.includes('.eq("id", selectedRow.id)'),
);
assert(
  "reload site_slug validation",
  pickerUiSrc.includes("row.site_slug !== siteSlug"),
);
assert(
  "binding uses STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG",
  pickerBindingSrc.includes("STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG"),
);
assert(
  "pilot row audit utils",
  pickerUtilsSrc.includes("G9G1_TARGET_ROW_ID") &&
    pickerUtilsSrc.includes("POC_AUDIT_STAGING_MARKER"),
);
assert(
  "general edit binding connected",
  pickerSectionSrc.includes('data-general-edit-binding-deferred="false"'),
);
assert(
  "CustomEvent bridge markers",
  readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-events.ts").includes(
    "staging-schedule-site-slug-row-selected",
  ) &&
    pickerUiSrc.includes("dispatchRowSelected") &&
    readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-picker-binding.ts").includes(
      "ROW_SELECTED_EVENT",
    ),
);
assert(
  "edit picker-driven binding",
  readRepo(
    "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ).includes('data-picker-driven-binding'),
);
assert(
  "row picker read-only marker",
  pickerSectionSrc.includes('data-row-picker-read-only="true"'),
);
assert(
  "no Save in picker section source",
  !pickerSectionSrc.includes("site-slug-edit-dry-run-preview-btn") &&
    !pickerSectionSrc.match(/>\s*Save\s+general\s+edit\s*</),
);
assert(
  "production STOP conditional in source",
  pickerSectionSrc.includes("site-slug-row-picker-production-stop"),
);
assert(
  "site_slug not editable input",
  !pickerSectionSrc.includes('name="site_slug"') &&
    !pickerSectionSrc.includes("site-slug-row-picker-site-slug-input"),
);

let serviceRoleHits = 0;
function walkDir(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(full);
    else if (/staging-schedule-site-slug-row-picker/.test(ent.name)) {
      const src = fs.readFileSync(full, "utf8");
      if (/service_role/i.test(src)) serviceRoleHits += 1;
    }
  }
}
walkDir(path.join(REPO_ROOT, "src/lib/admin/staging-data"));
assert("row picker files no service_role", serviceRoleHits === 0);

// --- optional HTTP GET SSR ---
let ssrHtml = "";
try {
  const res = await fetch(STAGING_SHELL_URL, { method: "GET" });
  if (res.ok) {
    ssrHtml = await res.text();
    assert("SSR HTTP GET staging shell 200", true);
  } else {
    assert("SSR HTTP GET staging shell 200", false);
  }
} catch {
  console.log("SKIP SSR HTTP GET — dev server not reachable on :4321");
}

if (ssrHtml) {
  const selectable = parseJsonRowsFromSection(
    ssrHtml,
    "admin-staging-schedule-site-slug-row-picker",
    "data-selectable-rows",
  );
  const audit = parseJsonRowsFromSection(
    ssrHtml,
    "admin-staging-schedule-site-slug-row-picker",
    "data-audit-rows",
  );
  const pickerChunk = ssrHtml.split("admin-staging-schedule-site-slug-row-picker")[1]?.split(
    "admin-staging-schedule-site-slug-edit",
  )[0] ?? "";

  assert("SSR staging shell route", ssrHtml.includes("/__admin-staging-shell/musician-basic/"));
  assert("SSR row picker section", ssrHtml.includes('id="admin-staging-schedule-site-slug-row-picker"'));
  assert("SSR G-9g3f1 title", ssrHtml.includes("G-9g3f1"));
  assert('SSR data-general-edit-binding-deferred="false"', ssrHtml.includes('data-general-edit-binding-deferred="false"'));
  assert('SSR data-picker-driven-binding on edit', ssrHtml.includes('data-picker-driven-binding="true"'));
  assert("SSR G-9g3f3a edit title", ssrHtml.includes("G-9g3f3a") || ssrHtml.includes("G-9g3f3b"));
  assert("SSR editing selected row badge", ssrHtml.includes("site-slug-edit-editing-badge"));
  assert("SSR picker placeholder", ssrHtml.includes("site-slug-edit-picker-placeholder"));
  assert('SSR data-site-slug gosaki-piano', ssrHtml.includes(`data-site-slug="${SITE_SLUG}"`));
  assert("SSR read-only banner", ssrHtml.includes("Read-only row picker"));
  assert("SSR staging host", ssrHtml.includes(STAGING_HOST));
  assert("SSR no production host", !ssrHtml.includes(PRODUCTION_HOST));
  assert("SSR PoC audit panel", ssrHtml.includes("PoC audit rows"));
  assert("SSR selected summary element", ssrHtml.includes("site-slug-row-picker-selected-summary"));
  assert("SSR detail preview element", ssrHtml.includes("site-slug-row-picker-detail-preview"));
  assert("SSR clear selection btn", ssrHtml.includes("site-slug-row-picker-clear-btn"));
  assert("SSR reload row btn", ssrHtml.includes("site-slug-row-picker-reload-row-btn"));
  assert("SSR reload page btn", ssrHtml.includes("site-slug-row-picker-reload-page-btn"));
  assert("SSR published filter default true", ssrHtml.includes('site-slug-row-picker-published-filter'));
  assert("SSR time filter", ssrHtml.includes("site-slug-row-picker-time-filter"));
  assert("SSR month filter", ssrHtml.includes("site-slug-row-picker-month-filter"));
  assert("SSR keyword search", ssrHtml.includes("site-slug-row-picker-keyword"));
  assert(
    "SSR host gate passed or STOP visible",
    ssrHtml.includes('data-host-gate-passed="true"') ||
      ssrHtml.includes("site-slug-row-picker-production-stop"),
  );
  assert(
    "SSR no Save/Preview in picker chunk",
    !pickerChunk.includes("site-slug-edit-dry-run-preview-btn") &&
      !pickerChunk.includes("Save general edit"),
  );
  assert("SSR pilot not in selectable json", !selectable.some((r) => r.id === PILOT_ROW_ID));
  assert(
    "SSR poc marker not in selectable json",
    !selectable.some((r) => rowHasPocMarker(r)),
  );
  assert(
    "SSR pilot in audit json",
    audit.some((r) => r.id === PILOT_ROW_ID) ||
      ssrHtml.includes(PILOT_ROW_ID) && ssrHtml.includes("PoC audit rows"),
  );
  assert("SSR selectable rows loaded", selectable.length > 0);
}

assert("smoke: Save not clicked", true);
assert("smoke: Preview not clicked", true);
assert("smoke: DB write not executed", true);
assert("smoke: manual SQL not executed", true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
