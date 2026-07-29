/**
 * CMS Core v2 — Global Save arm mutex inventory verifier (read-only).
 * Phase: cms-core-v2-global-save-arm-mutex-inventory-verifier
 *
 * Locks Gosaki operational client Save UI arm inventory (6 arms).
 * Does NOT implement mutex evaluation / package generate gate / runtime wiring.
 *
 * Run: npm run verify:cms-core-v2-global-save-arm-mutex-inventory
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED as PARSE_FIXTURE_MUTEX_FLAG,
} from "./lib/cms-core-v2-save-arm-parse-policy-fixtures.mjs";
import {
  GOSAKI_DUAL_VARIANT_FAMILIES,
  GOSAKI_LEGACY_OR_NON_OPERATIONAL_ARM_ENVS,
  GOSAKI_MUTEX_INVENTORY_SITE_KEY,
  GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS,
  GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS,
  GOSAKI_UNREGISTERED_OPERATIONAL_ARM_NEGATIVE_FIXTURES,
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED,
  classifyDiscoveredArmEnv,
  getNonMutexEnvSet,
  getOperationalClientEnvSet,
  isLegacyOrNonOperationalArmEnv,
  looksLikePublicSaveArmEnv,
} from "./lib/gosaki-operational-save-ui-arm-inventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const POLICY_DOC = path.join(TOOL_ROOT, "docs/cms-core-v2-global-save-arm-mutex-policy.md");
const ADMIN_TS = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
const ADMIN_ASTRO = path.join(
  TOOL_ROOT,
  "templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
);
const PACKAGE_MARKER = path.join(TOOL_ROOT, "scripts/lib/package-run-marker.mjs");
const INVENTORY_FILE = path.join(
  TOOL_ROOT,
  "scripts/lib/gosaki-operational-save-ui-arm-inventory.mjs",
);

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function exists(p) {
  return fs.existsSync(p);
}

function walkFiles(dir, exts, out = []) {
  if (!exists(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ent.name === "node_modules" ||
      ent.name === "output" ||
      ent.name === ".git" ||
      ent.name === "fixtures"
    ) {
      continue;
    }
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(full, exts, out);
    else if (exts.some((e) => ent.name.endsWith(e))) out.push(full);
  }
  return out;
}

/** Discover Save-arm-like env string literals in source. */
function discoverSaveArmEnvLiterals(files) {
  const found = new Set();
  const re =
    /["'`]((?:PUBLIC_)?[A-Z0-9_]*(?:SAVE_UI_ARMED|SAVE_ARMED|NON_DRY_RUN_ARMED|PATH_ENABLED|BUILD_READ)[A-Z0-9_]*)["'`]/g;
  for (const file of files) {
    const text = read(file);
    let m;
    while ((m = re.exec(text))) found.add(m[1]);
  }
  return found;
}

const arms = GOSAKI_OPERATIONAL_CLIENT_SAVE_UI_ARMS;
const operationalEnvs = getOperationalClientEnvSet();
const nonMutexEnvs = getNonMutexEnvSet();

// --- Inventory shape ---
assert("inventory file exists", exists(INVENTORY_FILE));
assert("site key gosaki-piano", GOSAKI_MUTEX_INVENTORY_SITE_KEY === "gosaki-piano");
assert("exactly 6 operational client arms", arms.length === 6);
assert(
  "GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED false (inventory)",
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === false,
);
assert(
  "parse-policy fixture mutex flag still false",
  PARSE_FIXTURE_MUTEX_FLAG === false,
);

const invSrc = read(INVENTORY_FILE);
assert(
  "inventory is Gosaki adapter (gosaki naming)",
  /Gosaki site adapter|gosaki-piano|GOSAKI_OPERATIONAL/.test(invSrc),
);
assert(
  "inventory does not implement mutex evaluate",
  !/evaluateOperationalClientSaveUiMutex|forbidMultipleSaveUiArms|assertSingleOperationalSaveArm/.test(
    invSrc,
  ),
);
assert(
  "inventory does not import Core mutex helper (none yet)",
  !/save-arm-mutex-utils/.test(invSrc),
);

// --- Required fields + uniqueness ---
const featureIds = new Set();
const clientEnvs = new Set();
const serverArms = new Set();
const families = new Set();

for (const arm of arms) {
  assert(
    `arm ${arm.featureId} has required fields`,
    Boolean(
      arm.featureId &&
        arm.family &&
        arm.featureLabel &&
        arm.clientEnv &&
        arm.htmlDatasetAttr &&
        arm.serverArmEnv &&
        arm.classification === "operational-client-save-ui" &&
        arm.mutexTargetV1 === true &&
        arm.variant != null,
    ),
  );
  assert(
    `arm ${arm.featureId} clientEnv is PUBLIC_`,
    arm.clientEnv.startsWith("PUBLIC_"),
  );
  assert(
    `arm ${arm.featureId} serverArmEnv is non-PUBLIC`,
    !arm.serverArmEnv.startsWith("PUBLIC_") && /SAVE_ARMED/.test(arm.serverArmEnv),
  );
  assert(
    `arm ${arm.featureId} htmlDatasetAttr shape`,
    /^data-gosaki-[a-z]+-save-armed$/.test(arm.htmlDatasetAttr),
  );

  assert(`featureId unique ${arm.featureId}`, !featureIds.has(arm.featureId));
  featureIds.add(arm.featureId);
  assert(`clientEnv unique ${arm.clientEnv}`, !clientEnvs.has(arm.clientEnv));
  clientEnvs.add(arm.clientEnv);
  assert(`serverArmEnv unique ${arm.serverArmEnv}`, !serverArms.has(arm.serverArmEnv));
  serverArms.add(arm.serverArmEnv);
  families.add(arm.family);
}

assert(
  "families cover schedule/discography/youtube/about",
  families.has("schedule") &&
    families.has("discography") &&
    families.has("youtube") &&
    families.has("about"),
);

// HTML attr: unique across families; Contents+Supabase of same family MUST share
const attrByFamily = new Map();
for (const arm of arms) {
  const prev = attrByFamily.get(arm.family);
  if (prev == null) attrByFamily.set(arm.family, arm.htmlDatasetAttr);
  else {
    assert(
      `family ${arm.family} shares one htmlDatasetAttr`,
      prev === arm.htmlDatasetAttr,
      `${prev} vs ${arm.htmlDatasetAttr}`,
    );
  }
}
const familyAttrs = [...attrByFamily.values()];
assert(
  "htmlDatasetAttr unique across families",
  new Set(familyAttrs).size === familyAttrs.length,
);

// Cross-family collision via raw attr list
const attrOwners = new Map();
for (const arm of arms) {
  const owners = attrOwners.get(arm.htmlDatasetAttr) ?? new Set();
  owners.add(arm.family);
  attrOwners.set(arm.htmlDatasetAttr, owners);
}
for (const [attr, owners] of attrOwners) {
  assert(
    `html attr ${attr} not shared across families`,
    owners.size === 1,
    [...owners].join(","),
  );
}

// Contents / Supabase pairs
for (const family of GOSAKI_DUAL_VARIANT_FAMILIES) {
  const rows = arms.filter((a) => a.family === family);
  assert(`${family} has 2 variants`, rows.length === 2);
  assert(
    `${family} has contents`,
    rows.some((a) => a.variant === "contents"),
  );
  assert(
    `${family} has supabase`,
    rows.some((a) => a.variant === "supabase"),
  );
}
assert(
  "schedule/discography are single-variant",
  arms.filter((a) => a.family === "schedule" || a.family === "discography").every(
    (a) => a.variant === "none",
  ),
);

// Non-mutex classification
assert(
  "non-mutex path/build-read count 4",
  GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS.length === 4,
);
for (const row of GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS) {
  assert(
    `non-mutex ${row.env} not in operational inventory`,
    !operationalEnvs.has(row.env),
  );
  assert(
    `non-mutex ${row.env} kind recorded`,
    row.kind === "path-enable" || row.kind === "build-read",
  );
}

// --- Source presence (admin + package marker) ---
assert("admin ts exists", exists(ADMIN_TS));
assert("admin astro exists", exists(ADMIN_ASTRO));
const adminTs = read(ADMIN_TS);
const adminAstro = read(ADMIN_ASTRO);
const marker = read(PACKAGE_MARKER);

for (const arm of arms) {
  assert(`admin ts mentions ${arm.clientEnv}`, adminTs.includes(arm.clientEnv));
  assert(
    `admin astro bakes ${arm.htmlDatasetAttr}`,
    adminAstro.includes(arm.htmlDatasetAttr),
  );
}
assert(
  "package marker mentions About Supabase Save UI arm",
  marker.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED"),
);
assert(
  "package marker mentions path-enable (non-mutex)",
  marker.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED"),
);
assert(
  "package marker mentions build-read (non-mutex)",
  marker.includes("CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ"),
);

// --- Discovery vs inventory ---
const searchRoots = [
  path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano"),
  path.join(TOOL_ROOT, "scripts/lib"),
  path.join(TOOL_ROOT, "scripts/edge-functions"),
  path.join(REPO_ROOT, "src/lib/admin"),
  path.join(REPO_ROOT, "supabase/functions"),
];
const files = searchRoots.flatMap((root) =>
  walkFiles(root, [".ts", ".mjs", ".js", ".astro"]),
);
const discovered = discoverSaveArmEnvLiterals(files);

for (const env of operationalEnvs) {
  assert(`discovered includes operational ${env}`, discovered.has(env));
}

assert(
  "inventory has no broad GOSAKI_SCHEDULE_/DISCOGRAPHY_ prefix legacy heuristic",
  !invSrc.includes("^PUBLIC_ADMIN_GOSAKI_SCHEDULE_") &&
    !invSrc.includes("^PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_") &&
    !invSrc.includes("/^PUBLIC_ADMIN_SCHEDULE_G\\d/") &&
    !invSrc.includes("/^PUBLIC_ADMIN_DISCOGRAPHY_G\\d/"),
);

const unknownOperational = [];
const classificationRows = [];
for (const name of [...discovered].sort()) {
  const cls = classifyDiscoveredArmEnv(name);
  classificationRows.push({ name, ...cls });
  if (cls.kind === "unregistered-operational-candidate") {
    unknownOperational.push(name);
  }
  if (cls.kind === "unregistered-path-or-build-read") {
    unknownOperational.push(name);
  }
}

assert(
  "no unregistered PUBLIC operational Save arm candidates",
  unknownOperational.length === 0,
  unknownOperational.join(", "),
);

// --- Classification fixtures ---
for (const env of operationalEnvs) {
  const cls = classifyDiscoveredArmEnv(env);
  assert(`fixture inventory PASS ${env}`, cls.kind === "inventory");
}
for (const row of GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS) {
  const cls = classifyDiscoveredArmEnv(row.env);
  assert(`fixture non-mutex PASS ${row.env}`, cls.kind === "non-mutex");
}
for (const env of GOSAKI_LEGACY_OR_NON_OPERATIONAL_ARM_ENVS.filter((n) =>
  looksLikePublicSaveArmEnv(n),
)) {
  assert(
    `fixture known legacy PASS ${env}`,
    isLegacyOrNonOperationalArmEnv(env) === true &&
      classifyDiscoveredArmEnv(env).kind === "legacy-allowlist",
  );
}
for (const env of GOSAKI_UNREGISTERED_OPERATIONAL_ARM_NEGATIVE_FIXTURES) {
  assert(
    `fixture unregistered FAIL-as-candidate ${env}`,
    looksLikePublicSaveArmEnv(env) === true &&
      isLegacyOrNonOperationalArmEnv(env) === false &&
      classifyDiscoveredArmEnv(env).kind === "unregistered-operational-candidate",
  );
}
assert(
  "negative fixtures include Schedule/Discography broad-prefix traps",
  GOSAKI_UNREGISTERED_OPERATIONAL_ARM_NEGATIVE_FIXTURES.some((e) =>
    e.includes("GOSAKI_SCHEDULE") && e.endsWith("SAVE_UI_ARMED"),
  ) &&
    GOSAKI_UNREGISTERED_OPERATIONAL_ARM_NEGATIVE_FIXTURES.some((e) =>
      e.includes("GOSAKI_DISCOGRAPHY") && e.endsWith("SAVE_ARMED"),
    ),
);
// Negative fixture names must not appear as discoverable source literals
for (const env of GOSAKI_UNREGISTERED_OPERATIONAL_ARM_NEGATIVE_FIXTURES) {
  assert(
    `negative fixture not present as source literal ${env}`,
    !discovered.has(env),
  );
}

// Non-mutex envs must be discoverable somewhere (or at least listed and present in marker/admin)
for (const row of GOSAKI_NON_MUTEX_PATH_AND_BUILD_READ_ENVS) {
  assert(
    `non-mutex env present in sources ${row.env}`,
    discovered.has(row.env) ||
      adminTs.includes(row.env) ||
      marker.includes(row.env),
  );
}

// Dry-run is out of mutex: ensure we do not classify dry-run endpoint names as Save arms
assert(
  "dry-run env pattern not treated as operational Save UI",
  ![...discovered].some(
    (n) =>
      /DRY_RUN/.test(n) &&
      !/NON_DRY_RUN_ARMED/.test(n) &&
      operationalEnvs.has(n),
  ),
);

// --- Mutex still unimplemented / unwired ---
assert(
  "GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED remains false",
  GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED === false,
);

const runtimeRoots = [
  path.join(TOOL_ROOT, "templates/site-extensions/gosaki-piano"),
  path.join(TOOL_ROOT, "scripts/lib"),
  path.join(TOOL_ROOT, "scripts/edge-functions"),
  path.join(REPO_ROOT, "supabase/functions"),
];
const runtimeFiles = runtimeRoots.flatMap((root) =>
  walkFiles(root, [".ts", ".mjs", ".js", ".astro"]),
);
const mutexWireHits = runtimeFiles.filter((f) => {
  const base = path.basename(f);
  if (base === "gosaki-operational-save-ui-arm-inventory.mjs") return false;
  if (base === "verify-cms-core-v2-global-save-arm-mutex-inventory.mjs") return false;
  const text = read(f);
  return (
    /evaluateOperationalClientSaveUiMutex/.test(text) ||
    /forbidMultipleSaveUiArms/.test(text) ||
    /assertSingleOperationalSaveArm/.test(text) ||
    /save-arm-mutex-utils/.test(text) ||
    /operationalSaveUiArmedCount/.test(text)
  );
});
assert(
  "mutex evaluator/gate unwired from runtime",
  mutexWireHits.length === 0,
  mutexWireHits.map((f) => path.relative(REPO_ROOT, f)).join(", "),
);

// Package generate gate not present
assert(
  "package-run-marker has no mutex gate",
  !/evaluateOperationalClientSaveUiMutex|multi_operational_save_ui_armed|operationalSaveUiArmedCount/.test(
    marker,
  ),
);

// --- Policy doc ---
assert("mutex policy doc exists", exists(POLICY_DOC));
const policyDoc = read(POLICY_DOC);
assert(
  "policy doc mentions inventory verifier phase",
  /cms-core-v2-global-save-arm-mutex-inventory-verifier|inventory verifier/i.test(
    policyDoc,
  ),
);
assert(
  "policy keeps GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED false",
  /GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED:\s*false/.test(policyDoc),
);
assert(
  "policy does not require package regen for inventory",
  /deployedPackageSourceCommitUnchanged|dc1c5b6|regen 不要|no regen/i.test(policyDoc),
);

console.log(`\nGLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: ${GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED}`);
console.log(`operationalClientArms: ${arms.length}`);
console.log(`discoveredArmLikeLiterals: ${discovered.size}`);
console.log(`unknownOperational: ${unknownOperational.length}`);
console.log(`legacyAllowlistSize: ${GOSAKI_LEGACY_OR_NON_OPERATIONAL_ARM_ENVS.length}`);
console.log("\n--- discovered classification ---");
for (const row of classificationRows) {
  console.log(`${row.kind.padEnd(34)} ${row.name}`);
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-global-save-arm-mutex-inventory-verifier");
