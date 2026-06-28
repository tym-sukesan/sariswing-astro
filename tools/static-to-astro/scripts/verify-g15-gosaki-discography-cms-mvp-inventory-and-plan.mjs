/**
 * G-15 — Gosaki Discography CMS MVP inventory and plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15-gosaki-discography-cms-mvp-inventory-and-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-cms-mvp-inventory-and-plan.md";
const SEED_JSON_REL = "tools/static-to-astro/data/gosaki/discography.seed.json";
const SCHEMA_TEMPLATE_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-schema.template.sql";
const SEED_TEMPLATE_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-seed.template.sql";
const ADMIN_JSON_REL = "tools/static-to-astro/config/sites/gosaki-piano-discography.json";
const ADMIN_BINDING_REL = "src/lib/admin/staging-data/gosaki-discography-admin-binding.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const SUPABASE_ADAPTER_REL = "src/lib/admin/staging-data/supabase-read-only-data-adapter.ts";
const UPDATE_TEMPLATE_REL =
  "tools/static-to-astro/templates/admin-cms/src/lib/admin-discography-update.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

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

const doc = read(DOC_REL);

assert("plan doc exists", exists(DOC_REL));
assert("doc phase G-15", doc.includes("G-15-gosaki-discography-cms-mvp-inventory-and-plan"));
assert("doc inventory gate", doc.includes("gosakiDiscographyCmsMvpInventoryAndPlanComplete: true"));
assert("doc ready G-15a", doc.includes("readyForG15aDiscographyAdminSupabaseReadBinding: true"));
assert("doc 4 releases", doc.includes("| Admin JSON `releases[]` | **4** |"));
assert("doc supabase 4 rows", doc.includes("| Staging Supabase `discography` | **4** |"));
assert("doc no site_slug on discography", doc.includes("`site_slug` column"));
assert("doc Wix public SoT", doc.includes("Wix HTML"));
assert("doc recommends Supabase path", doc.includes("staging Supabase `discography` table"));
assert("doc defers image upload", doc.includes("no image upload"));
assert("doc defers INSERT DELETE", doc.includes("New album INSERT"));
assert("doc ID mapping continuous", doc.includes("`continuous` | `discography-001`"));
assert("doc track gap", doc.includes("discography_tracks` | **16**"));
assert("doc mirror schedule", doc.includes("Schedule CMS"));
assert("doc not youtube json write", doc.includes("do not use") && doc.includes("YouTube"));
assert("doc commit 8313349", doc.includes("8313349"));

assert("seed JSON exists", exists(SEED_JSON_REL));
const seed = JSON.parse(read(SEED_JSON_REL));
assert("seed releaseCount 4", seed.releaseCount === 4);
assert("seed releases array 4", seed.releases?.length === 4);
assert("seed legacy ids", seed.releases.every((r) => /^discography-\d{3}$/.test(r.legacyId)));

assert("schema template exists", exists(SCHEMA_TEMPLATE_REL));
assert("schema template DO NOT RUN", read(SCHEMA_TEMPLATE_REL).includes("DO NOT RUN"));
assert("schema template lists discography columns", read(SCHEMA_TEMPLATE_REL).includes("cover_image_url"));

assert("seed template exists", exists(SEED_TEMPLATE_REL));
assert("seed template DO NOT RUN", read(SEED_TEMPLATE_REL).includes("DO NOT RUN"));
assert("seed template already applied note", read(SEED_TEMPLATE_REL).includes("ALREADY APPLIED"));

assert("admin JSON exists", exists(ADMIN_JSON_REL));
const adminJson = JSON.parse(read(ADMIN_JSON_REL));
assert("admin JSON 4 releases", adminJson.releases?.length === 4);

assert("admin binding reads JSON", read(ADMIN_BINDING_REL).includes("gosaki-piano-discography.json"));
assert("admin page save disabled", read(ADMIN_PAGE_REL).includes("data-gosaki-disc-action-disabled"));
assert("supabase adapter listDiscography", read(SUPABASE_ADAPTER_REL).includes("listDiscography"));
assert("update template allowed fields", read(UPDATE_TEMPLATE_REL).includes("DISCOGRAPHY_UPDATE_ALLOWED_FIELDS"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

// Optional live read-only Supabase check
const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const host = new URL(url).hostname;
    assert("staging project host", host.includes(STAGING_REF), host);
    const sb = createClient(url, key);
    const disc = await sb
      .from("discography")
      .select("legacy_id,title", { count: "exact" })
      .limit(5);
    assert("live discography read", !disc.error, disc.error?.message);
    assert("live discography count 4", disc.count === 4, String(disc.count));
    const siteSlugProbe = await sb.from("discography").select("site_slug").limit(1);
    assert(
      "live discography no site_slug column",
      !!siteSlugProbe.error?.message?.includes("site_slug"),
      siteSlugProbe.error?.message ?? "unexpected success",
    );
  } catch (e) {
    assert("live supabase probe", false, String(e));
  }
} else {
  console.log("SKIP live Supabase probe (no anon env in CI/sandbox)");
}

console.log(`\nG-15 inventory verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
