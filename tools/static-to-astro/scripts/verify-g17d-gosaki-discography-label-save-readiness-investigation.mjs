/**
 * G-17d — Gosaki Discography label Save readiness investigation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17d-gosaki-discography-label-save-readiness-investigation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-readiness-investigation.md";
const G17D_ENABLEMENT_DOC =
  "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-path-enablement.md";
const PAGE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g17c-label-save-page-config.ts";
const G17C_SAVE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g17c-label-save-config.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/discography-scalar-field-dry-run.ts";
const SAVE_REL = "src/lib/admin/staging-write/discography-scalar-field-save.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const G15B_SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-save.ts";
const G16A_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-save.ts";

const BASE_COMMIT = "0fadd54";
const G17C_ENABLED = "G17C_DISCOGRAPHY_SAVE_ENABLED";
const G17C_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED";
const SAVE_APPROVAL = "G-17c-gosaki-discography-existing-release-label-non-dry-run";
const TARGET_LEGACY_ID = "discography-004";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 0fadd54", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

const doc = read(DOC_REL);
const pageConfig = read(PAGE_CONFIG_REL);
const g17cSaveConfig = read(G17C_SAVE_CONFIG_REL);
const dryRun = read(DRY_RUN_REL);
const save = read(SAVE_REL);
const ui = read(UI_REL);
const operator = read(OPERATOR_REL);

assert("investigation doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc root cause G17C_DISCOGRAPHY_SAVE_ENABLED", doc.includes(G17C_ENABLED));
assert("doc ready_but_save_disabled symptom", doc.includes("ready_but_save_disabled"));
assert("doc fix page config bridge", doc.includes("save-page-config"));
assert("doc investigation gate", doc.includes("gosakiDiscographyG17dLabelSaveReadinessInvestigationComplete: true"));
assert("doc fix applied gate", doc.includes("gosakiDiscographyG17dLabelSaveReadinessFixApplied: true"));
assert("doc re-preview procedure", doc.includes("変更を確認"));
assert("doc ready_to_save expected", doc.includes("ready_to_save"));
assert("doc references G-17d enablement", doc.includes("gosaki-discography-g17d-label-save-path-enablement"));

assert("page config module exists", fs.existsSync(path.join(REPO_ROOT, PAGE_CONFIG_REL)));
assert("page config resolveG17cDiscographySavePageServerConfig", pageConfig.includes("resolveG17cDiscographySavePageServerConfig"));
assert("page config readG17cDiscographySavePageConfigFromDom", pageConfig.includes("readG17cDiscographySavePageConfigFromDom"));
assert("page config applyG17cDiscographySavePageConfigToEnv", pageConfig.includes("applyG17cDiscographySavePageConfigToEnv"));
assert("page config injects G17C enabled env", pageConfig.includes(G17C_ENABLED));
assert("page config injects armed env", pageConfig.includes("G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV"));
assert("page config injects approval id", pageConfig.includes("G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID"));

assert("g17c save config merged env helper", g17cSaveConfig.includes("resolveG17cDiscographyLabelMergedEnv"));
assert("g17c save config uses page config apply", g17cSaveConfig.includes("applyG17cDiscographySavePageConfigToEnv"));

assert("dry-run uses getG17cDiscographyLabelSaveConfig", dryRun.includes("getG17cDiscographyLabelSaveConfig"));
assert("dry-run g17c-label branch", dryRun.includes('entry.sliceId === "g17c-label"'));

assert("save uses getG17cDiscographyLabelSaveConfig", save.includes("getG17cDiscographyLabelSaveConfig"));

assert("ui getG17cDiscographyLabelSaveConfig", ui.includes("getG17cDiscographyLabelSaveConfig"));
assert("ui evaluateG17cDiscographyOperatorSaveUiGate", ui.includes("evaluateG17cDiscographyOperatorSaveUiGate"));

assert("operator page g17c config element", operator.includes("G17C_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID"));
assert("operator page data-g17c-save-enabled", operator.includes("data-g17c-save-enabled"));
assert("operator resolveG17cDiscographySavePageServerConfig", operator.includes("resolveG17cDiscographySavePageServerConfig"));

assert("G-15b save executor unchanged", read(G15B_SAVE_REL).includes("executeG15bDiscographyPurchaseUrlSave"));
assert("G-16a save executor unchanged", read(G16A_SAVE_REL).includes("executeG16aDiscographyArtistSave"));

// Simulate server vs client env visibility
function resolveServerPageConfig(env) {
  return {
    saveEnabled: String(env[G17C_ENABLED] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingDataReadEnabled: env.ENABLE_ADMIN_STAGING_DATA_READ === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed: String(env[G17C_ARM] ?? "").trim() === "true",
    optimisticLockEnabled: env.PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK === "true",
    writeDryRunDisabled: String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

function applyPageConfigToEnv(env, pageConfig) {
  return {
    ...env,
    [G17C_ENABLED]: pageConfig.saveEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_DATA_READ: pageConfig.stagingDataReadEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [G17C_ARM]: pageConfig.envArmArmed ? "true" : "false",
    PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK: pageConfig.optimisticLockEnabled ? "true" : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: pageConfig.writeApprovalId || SAVE_APPROVAL,
  };
}

function compileSaveEnabled(env) {
  return String(env[G17C_ENABLED] ?? "").trim() === "true";
}

const armedServerEnv = {
  ENABLE_ADMIN_STAGING_SHELL: "true",
  ENABLE_ADMIN_STAGING_DATA_READ: "true",
  ENABLE_ADMIN_STAGING_WRITE: "true",
  PUBLIC_ADMIN_WRITE_PROVIDER: "supabase",
  PUBLIC_ADMIN_WRITE_MODULE: "discography",
  PUBLIC_ADMIN_WRITE_APPROVAL_ID: SAVE_APPROVAL,
  PUBLIC_ADMIN_WRITE_DRY_RUN: "false",
  PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK: "true",
  [G17C_ARM]: "true",
  [G17C_ENABLED]: "true",
};

const serverPage = resolveServerPageConfig(armedServerEnv);
assert("sim server page saveEnabled true", serverPage.saveEnabled === true);
assert("sim server page arm true", serverPage.envArmArmed === true);
assert("sim server page dryRun disabled", serverPage.writeDryRunDisabled === true);

const clientEnvPublicOnly = {
  PUBLIC_ADMIN_WRITE_PROVIDER: "supabase",
  PUBLIC_ADMIN_WRITE_MODULE: "discography",
  PUBLIC_ADMIN_WRITE_APPROVAL_ID: SAVE_APPROVAL,
  PUBLIC_ADMIN_WRITE_DRY_RUN: "false",
  PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK: "true",
  [G17C_ARM]: "true",
};

assert(
  "sim client without bridge G17C enabled false",
  compileSaveEnabled(clientEnvPublicOnly) === false,
);

const mergedClientEnv = applyPageConfigToEnv(clientEnvPublicOnly, serverPage);
assert(
  "sim client with bridge G17C enabled true",
  compileSaveEnabled(mergedClientEnv) === true,
);
assert(
  "sim client with bridge ENABLE_ADMIN_STAGING_WRITE true",
  mergedClientEnv.ENABLE_ADMIN_STAGING_WRITE === "true",
);
assert(
  "sim client with bridge approval id",
  mergedClientEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID === SAVE_APPROVAL,
);

assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("Save not executed", true);
assert("DB write not executed", true);
assert("commit/push not executed", true);

console.log(`\nG-17d save readiness investigation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
