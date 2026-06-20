/**
 * G-9j4.5 — Gosaki Supabase project identity safety preflight (static only).
 * Run: node tools/static-to-astro/scripts/verify-g9j45-gosaki-supabase-project-identity-safety-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = "gosaki-supabase-project-identity-safety-preflight.md";
const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const EXPECTED_UPDATED_AT = "2026-06-16T16:03:41.551792+00:00";

const G9J_PATHS = [
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-config.ts",
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-dry-run.ts",
  "src/lib/admin/staging-write/schedule-write-guards.ts",
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
  "src/lib/admin/staging-data/staging-schedule-site-slug-host-gate.ts",
];

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

const docPath = path.join(TOOL_ROOT, `docs/${DOC}`);
assert("safety preflight doc exists", fs.existsSync(docPath));
const doc = fs.readFileSync(docPath, "utf8");

assert("phase G-9j4.5", doc.includes("G-9j4.5-gosaki-supabase-project-identity-safety-preflight"));
assert(
  "targetSupabaseProjectName static-to-astro-cms-staging",
  doc.includes("targetSupabaseProjectName: static-to-astro-cms-staging"),
);
assert("targetProjectRef staging", doc.includes(`targetProjectRef: ${STAGING_REF}`));
assert("sari-site blocked", doc.includes("sari-site"));
assert("liberta-site-platform blocked", doc.includes("liberta-site-platform"));
assert("serviceRoleUsed false", doc.includes("serviceRoleUsed: false"));
assert("manualSqlUpdateAllowed false", doc.includes("manualSqlUpdateAllowed: false"));
assert("sqlEditorUpdateAllowed false", doc.includes("sqlEditorUpdateAllowed: false"));
assert("dbWriteExecuted false", doc.includes("dbWriteExecuted: false"));
assert("saveEnabled false", doc.includes("saveEnabled: false"));
assert("readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("one-row UPDATE only", doc.includes("one-row UPDATE"));
assert("target id recorded", doc.includes(TARGET_ID));
assert("site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("target field description only", doc.includes('changedFields: ["description"]'));
assert("expectedBeforeUpdatedAt recorded", doc.includes(EXPECTED_UPDATED_AT));
assert("production ref blocked in doc", doc.includes(PRODUCTION_REF));
assert("live row reconfirmation", doc.includes("Live row reconfirmation"));

const hostGateSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-host-gate.ts");
const configSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-config.ts",
);
const dryRunSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-dry-run.ts",
);
const uiSrc = readRepo("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");

assert(
  "assertStaticToAstroCmsStagingSupabaseProject defined",
  hostGateSrc.includes("assertStaticToAstroCmsStagingSupabaseProject"),
);
assert(
  "staging project ref allowlisted",
  hostGateSrc.includes(STAGING_REF) && hostGateSrc.includes("STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF"),
);
assert(
  "sari-site production ref blocked in guard",
  hostGateSrc.includes(PRODUCTION_REF) && hostGateSrc.includes("sari-site"),
);
assert("config uses project allowlist", configSrc.includes("evaluateStagingProjectAllowlist"));
assert("dry-run uses project assert", dryRunSrc.includes("assertStaticToAstroCmsStagingSupabaseProject"));
assert("UI passes supabaseUrl to dry-run", uiSrc.includes("supabaseUrl:"));

const g9jCombined = G9J_PATHS.map(readRepo).join("\n");
assert(
  "no service_role in G-9j path modules",
  !/\bservice_role\b/i.test(g9jCombined) &&
    !/\bSERVICE_ROLE\b/.test(g9jCombined) &&
    !/\bsupabaseServiceRole\b/.test(g9jCombined),
);

const gosakiTemplateDir = path.join(
  REPO_ROOT,
  "tools/static-to-astro/templates/admin-cms/gosaki",
);
if (fs.existsSync(gosakiTemplateDir)) {
  const templateFiles = fs
    .readdirSync(gosakiTemplateDir, { recursive: true })
    .filter((f) => String(f).endsWith(".astro") || String(f).endsWith(".ts"))
    .map((f) => path.join(gosakiTemplateDir, String(f)));
  const templateSrc = templateFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");
  assert(
    "no service_role in gosaki templates",
    !/\bservice_role\b/i.test(templateSrc) && !/\bSERVICE_ROLE\b/.test(templateSrc),
  );
}

const pagesAdmin = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !pagesAdmin.stdout.trim());

for (const script of [
  "verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs",
  "verify-g9j1-gosaki-schedule-existing-event-update-guards-and-dry-run.mjs",
  "verify-g9j2-gosaki-schedule-existing-event-update-dry-run-ui-wiring.mjs",
  "verify-g9j4-gosaki-schedule-existing-event-update-one-row-preflight.mjs",
]) {
  const result = spawnSync("node", [`tools/static-to-astro/scripts/${script}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${script} passes`, result.status === 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
