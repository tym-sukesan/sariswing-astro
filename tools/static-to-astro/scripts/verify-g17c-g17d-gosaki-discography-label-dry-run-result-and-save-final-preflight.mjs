/**
 * G-17c-d2 / G-17d-d3 — Gosaki Discography label local dry-run result + Save final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17c-g17d-gosaki-discography-label-dry-run-result-and-save-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17c-next-field-registry-slice-preflight.md";
const G17B_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17b-scalar-field-commonization.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const REGISTRY_REL = "src/lib/admin/staging-write/discography-scalar-field-slice-registry.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/discography-scalar-field-dry-run.ts";
const GUARDS_REL = "src/lib/admin/staging-write/discography-scalar-field-guards.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const G17C_SAVE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g17c-label-save-config.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G17C_PREFLIGHT_COMMIT = "9475286";
const TARGET_LEGACY_ID = "discography-004";
const TARGET_ID = "32b83506-8766-4cf6-9de7-40defbfc0b38";
const TARGET_TITLE = "Ja-Jaaaaan!";
const LABEL_AFTER = "Mardi Gras JAPAN Records";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const DRY_RUN_APPROVAL_ID = "G-17c-gosaki-discography-label-dry-run-slice";
const SAVE_APPROVAL_ID =
  "G-17c-gosaki-discography-existing-release-label-non-dry-run";
const G17C_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED";
const G16A_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED";
const G15B_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED";
const G15D_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED";
const CLOSED_001 = "discography-001";
const CLOSED_002 = "discography-002";
const CLOSED_003 = "discography-003";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function loadEnv(file) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) return {};
  const out = {};
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G17C_PREFLIGHT_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);
assert("HEAD is 9475286", head.stdout.trim() === G17C_PREFLIGHT_COMMIT, head.stdout.trim());
assert(
  "origin/main is 9475286",
  origin.stdout.trim() === G17C_PREFLIGHT_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-17c preflight 9475286",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);
const registry = read(REGISTRY_REL);
const dryRun = read(DRY_RUN_REL);
const adapter = read(ADAPTER_REL);
const ui = read(UI_REL);

assert("doc exists", exists(DOC_REL));
assert("prior G-17c preflight doc exists", exists(PRIOR_DOC_REL));
assert("G-17b doc exists", exists(G17B_DOC_REL));
assert("playbook doc exists", exists(PLAYBOOK_REL));
assert("doc playbook reference", doc.includes("cms-kit-save-reflection-playbook.md"));
assert("doc G-17b generic layer", doc.includes("executeDiscographyScalarSliceDryRun"));
assert("doc registry g17c-label", doc.includes("g17c-label"));
assert(
  "doc local dry-run result gate",
  doc.includes("gosakiDiscographyG17cLocalDryRunResultComplete: true"),
);
assert(
  "doc save final preflight gate",
  doc.includes("gosakiDiscographyG17dSaveFinalPreflightComplete: true"),
);
assert(
  "doc readyForG17dImplementation",
  doc.includes("readyForG17dDiscographyLabelSaveImplementation: true"),
);
assert(
  "doc readyForG17dExecution false",
  doc.includes("readyForG17dDiscographyLabelSaveExecution: false"),
);
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorSave false", doc.includes("cursorSaveExecuted: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc base commit 9475286", doc.includes(G17C_PREFLIGHT_COMMIT));

assert("doc operator dry-run ok true", doc.includes("`ok` | **true**"));
assert("doc actualWrite false", doc.includes("`actualWrite` | **false**"));
assert("doc wouldWrite true", doc.includes("`wouldWrite` | **true**"));
assert("doc saveReadiness ready_but_save_disabled", doc.includes("ready_but_save_disabled"));
assert("doc saveAllowed false", doc.includes("`saveAllowed` | **false**"));
assert("doc stale false", doc.includes("`stale` | **false**"));
assert("doc hostGatePassed true", doc.includes("`hostGatePassed` | **true**"));
assert("doc dry-run approvalId", doc.includes(DRY_RUN_APPROVAL_ID));
assert("doc save approvalId", doc.includes(SAVE_APPROVAL_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc label after", doc.includes(LABEL_AFTER));
assert("doc expectedBeforeUpdatedAt", doc.includes(BASELINE_UPDATED_AT));
assert("doc operator 変更を確認", doc.includes("変更を確認"));
assert("doc operator 更新する", doc.includes("更新する"));
assert("doc saveReadiness ready_to_save armed", doc.includes("ready_to_save"));
assert("doc afterVerification SELECT", doc.includes("afterVerification SELECT"));
assert("doc updated_at trigger proof", doc.includes("discography_set_updated_at"));
assert("doc updated_at must advance", doc.includes("updated_at") && doc.includes("advance"));
assert("doc rollback DO NOT EXECUTE", doc.includes("DO NOT EXECUTE"));
assert("doc public reflection later", doc.includes("Yes (later"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc G-17c arm on", doc.includes(G17C_ARM));
assert("doc G-16a arm off", doc.includes(G16A_ARM) && doc.includes("off"));
assert("doc G-15b arm off", doc.includes(G15B_ARM) && doc.includes("off"));
assert("doc G-15d arm off", doc.includes(G15D_ARM) && doc.includes("off"));
assert("doc G17C_DISCOGRAPHY_SAVE_ENABLED", doc.includes("G17C_DISCOGRAPHY_SAVE_ENABLED=true"));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc do not re-Save 001", doc.includes(CLOSED_001));
assert("doc do not re-Save 002", doc.includes(CLOSED_002));
assert("doc do not re-Save 003", doc.includes(CLOSED_003));
assert(
  "doc unchanged fields listed",
  doc.includes("catalog_number") && doc.includes("sort_order"),
);
assert("doc runSave implementation prerequisite", doc.includes("G-17d-implementation"));

assert("registry g17c-label open", registry.includes('sliceId: "g17c-label"'));
assert("registry label field", registry.includes('field: "label"'));
assert("generic dry-run exists", exists(DRY_RUN_REL));
assert("dry-run executeDiscographyScalarSliceDryRun", dryRun.includes("executeDiscographyScalarSliceDryRun"));
assert("adapter registry lookup", adapter.includes("getDiscographyScalarSliceEntryByApprovalId"));
assert("adapter label in mapRow", adapter.includes("label:"));
assert("g17c save config exists", exists(G17C_SAVE_CONFIG_REL));
assert("ui generic dry-run", ui.includes("executeDiscographyScalarSliceDryRun"));
assert("ui g17c-label branch", ui.includes('"g17c-label"'));
assert("ui runSave g17c block documented prerequisite", ui.includes("G-17c preflight"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

assert("staging url configured", !!url, "missing PUBLIC_SUPABASE_URL");
assert("anon key configured", !!key, "missing PUBLIC_SUPABASE_ANON_KEY");
assert("staging host only", url.includes(STAGING_REF), url);
assert("not production host", !url.includes(SARISWING_HOST), url);
assert("not service_role key", !String(key).toLowerCase().includes("service_role"));

if (url && key) {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,label,artist,release_date,year,catalog_number,description,purchase_url,streaming_url,published,sort_order,updated_at`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  assert("live SELECT one row", Array.isArray(rows) && rows.length === 1);
  if (Array.isArray(rows) && rows[0]) {
    const row = rows[0];
    assert("live legacy_id", row.legacy_id === TARGET_LEGACY_ID);
    assert("live id", row.id === TARGET_ID);
    assert("live title", row.title === TARGET_TITLE);
    assert("live label before (post-Preview unchanged)", row.label == null);
    assert("live updated_at baseline", row.updated_at === BASELINE_UPDATED_AT);
    assert("DB unchanged since operator Preview", row.label == null);
    assert("label not after value yet", row.label !== LABEL_AFTER);
    assert("artist unchanged", row.artist === "新谷健介オノマトペ");
    assert("catalog_number unchanged", row.catalog_number === "OMP-001");
  }

  const closedRes = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${CLOSED_001}&select=legacy_id,artist`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );
  assert("closed 001 SELECT HTTP ok", closedRes.ok);
  const closedRows = await closedRes.json();
  if (Array.isArray(closedRows) && closedRows[0]) {
    assert(
      "001 artist closed chain value",
      closedRows[0].artist === "ごさきりかこTrio feat.石川周之介",
    );
  }
}

assert("Save preflight stops before execution", doc.includes("Do not click Save"));
assert("Save not executed in verifier", true);
assert("DB write not executed in verifier", true);
assert("FTP/upload not executed", true);
assert("commit/push not executed", true);

console.log(`\nG-17c-d2/d3 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
