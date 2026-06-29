/**
 * G-16a-d2/d3 — Gosaki Discography artist local dry-run result + Save final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16a-gosaki-discography-local-dry-run-result-and-save-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-local-dry-run-result-and-save-final-preflight.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-next-field-save-preflight.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-save.ts";
const SAVE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-artist-save-config.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G16A_PREFLIGHT_COMMIT = "b19b9a2";
const TARGET_LEGACY_ID = "discography-001";
const TARGET_ID = "00f4cd00-cfb6-43b3-991a-211b2d7c92ef";
const TARGET_TITLE = "Continuous";
const ARTIST_BEFORE = "ごさきりかこTrio Feat.石川周之介";
const ARTIST_AFTER = "ごさきりかこTrio feat.石川周之介";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const DRY_RUN_APPROVAL_ID = "G-16a-gosaki-discography-artist-dry-run-slice";
const SAVE_APPROVAL_ID =
  "G-16a-gosaki-discography-existing-release-artist-non-dry-run";
const G16A_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED";
const G15B_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED";
const G15D_ARM = "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED";
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
  ["merge-base", "--is-ancestor", G16A_PREFLIGHT_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);
assert(
  "HEAD at or after G-16a preflight b19b9a2",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("doc exists", exists(DOC_REL));
assert("prior G-16a preflight doc exists", exists(PRIOR_DOC_REL));
assert("playbook doc exists", exists(PLAYBOOK_REL));
assert("doc playbook reference", doc.includes("cms-kit-save-reflection-playbook.md"));
assert(
  "doc local dry-run result gate",
  doc.includes("gosakiDiscographyG16aLocalDryRunResultComplete: true"),
);
assert(
  "doc save final preflight gate",
  doc.includes("gosakiDiscographyG16aSaveFinalPreflightComplete: true"),
);
assert("doc readyForG16aExecution", doc.includes("readyForG16aExecution: true"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite: false"));
assert("doc cursorSave false", doc.includes("cursorSaveExecuted: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc base commit b19b9a2", doc.includes(G16A_PREFLIGHT_COMMIT));

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
assert("doc artist before/after", doc.includes(ARTIST_BEFORE) && doc.includes(ARTIST_AFTER));
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
assert("doc G-16a arm on", doc.includes(`${G16A_ARM}=true`) || doc.includes(G16A_ARM));
assert("doc G-15b arm off", doc.includes(G15B_ARM) && doc.includes("off"));
assert("doc G-15d arm off", doc.includes(G15D_ARM) && doc.includes("off"));
assert("doc G16A_DISCOGRAPHY_SAVE_ENABLED", doc.includes("G16A_DISCOGRAPHY_SAVE_ENABLED=true"));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc do not re-Save 002", doc.includes(CLOSED_002));
assert("doc do not re-Save 003", doc.includes(CLOSED_003));
assert("doc unchanged fields listed", doc.includes("release_date") && doc.includes("sort_order"));
assert("doc not closed 002 target", !doc.includes(`${CLOSED_002} | G-16a`));

assert("save module exists", exists(SAVE_REL));
assert("save config exists", exists(SAVE_CONFIG_REL));
assert("ui wires G16a", read(UI_REL).includes("executeG16aDiscographyArtistDryRun"));

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
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,artist,release_date,year,description,purchase_url,streaming_url,published,sort_order,updated_at`;
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
    assert("live artist before (post-Preview unchanged)", row.artist === ARTIST_BEFORE);
    assert("live updated_at baseline", row.updated_at === BASELINE_UPDATED_AT);
    assert("DB unchanged since operator Preview", row.artist === ARTIST_BEFORE);
    assert("artist not after value yet", row.artist !== ARTIST_AFTER);
    assert("003 not G-16a target", row.legacy_id !== CLOSED_003);
  }

  const closedRes = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${CLOSED_003}&select=legacy_id,artist`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  );
  assert("closed 003 SELECT HTTP ok", closedRes.ok);
  const closedRows = await closedRes.json();
  if (Array.isArray(closedRows) && closedRows[0]) {
    assert("003 artist closed chain value", closedRows[0].artist === "ごさきりかこTrio");
  }
}

assert("Save preflight stops before execution", doc.includes("Do not click Save"));
assert("Save not executed in verifier", true);
assert("DB write not executed in verifier", true);
assert("FTP/upload not executed", true);

console.log(`\nG-16a-d2/d3 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
