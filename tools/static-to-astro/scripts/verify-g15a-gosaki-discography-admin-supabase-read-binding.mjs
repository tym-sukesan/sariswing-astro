/**
 * G-15a — Gosaki Discography admin Supabase read binding verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15a-gosaki-discography-admin-supabase-read-binding.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-admin-supabase-read-binding.md";
const PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminDiscographyPage.astro";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const BINDING_REL = "src/lib/admin/staging-data/gosaki-discography-supabase-read-binding.ts";
const READ_REL = "src/lib/admin/staging-write/staging-discography-read.ts";
const SHELL_REL = "src/pages/__admin-staging-shell/musician-basic/admin/discography/index.astro";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const EXPECTED_LEGACY_IDS = [
  "discography-001",
  "discography-002",
  "discography-003",
  "discography-004",
];

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
assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);

const doc = read(DOC_REL);
const page = read(PAGE_REL);
const operator = read(OPERATOR_REL);
const bindingSrc = read(BINDING_REL);
const readSrc = read(READ_REL);

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15a", doc.includes("G-15a-gosaki-discography-admin-supabase-read-binding"));
assert("doc binding complete gate", doc.includes("gosakiDiscographyAdminSupabaseReadBindingComplete: true"));
assert("doc save disabled", doc.includes("saveEnabled: false"));
assert("doc db write disabled", doc.includes("dbWriteEnabled: false"));
assert("doc supabase read source", doc.includes("Supabase SELECT"));
assert("doc 4 legacy ids", EXPECTED_LEGACY_IDS.every((id) => doc.includes(id)));

assert("binding module exists", exists(BINDING_REL));
assert("read loader exists", exists(READ_REL));
assert("binding resolve export", bindingSrc.includes("resolveGosakiDiscographySupabaseReadBinding"));
assert("binding save disabled flag", bindingSrc.includes("saveEnabled: false"));
assert("binding db write disabled", bindingSrc.includes("dbWriteEnabled: false"));
assert("read loader SELECT only", readSrc.includes('.from("discography")'));
assert("read loader no update", !readSrc.includes(".update("));
assert("read loader tracks read", readSrc.includes("discography_tracks"));
assert("read select legacy_id", readSrc.includes("legacy_id"));
assert("read select purchase_url", readSrc.includes("purchase_url"));

assert("page uses supabase binding", page.includes("resolveGosakiDiscographySupabaseReadBinding"));
assert("page no static JSON loader", !page.includes("loadGosakiDiscographyAdminBinding"));

assert("operator status supabase read", operator.includes("Discography Supabase read:"));
assert("operator save disabled label", operator.includes("Save: <strong>disabled</strong>"));
assert("operator db write disabled label", operator.includes("DB write: <strong>disabled</strong>"));
assert("operator legacy_id visible", operator.includes("data-legacy-id"));
assert("operator sort_order visible", operator.includes("sort:"));
assert("operator save buttons disabled", operator.includes("data-gosaki-disc-action-disabled"));
assert("operator SKYLARK default", operator.includes('data-gosaki-disc-default-legacy-id="discography-002"'));
assert("operator purchase_url field", operator.includes('name="purchase_url"'));

assert("shell route exists", exists(SHELL_REL));
assert("shell route discography path", read(SHELL_REL).includes("admin/discography"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  try {
    const host = new URL(url).hostname;
    assert("staging host only", host.includes(STAGING_REF) && !host.includes(SARISWING_HOST), host);
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(url, key);
    const disc = await sb
      .from("discography")
      .select(
        "legacy_id,title,artist,release_date,year,catalog_number,description,purchase_url,streaming_url,sort_order,published,updated_at",
      )
      .order("sort_order", { ascending: true });
    assert("live read no error", !disc.error, disc.error?.message);
    assert("live read 4 rows", (disc.data?.length ?? 0) === 4, String(disc.data?.length));
    const legacyIds = (disc.data ?? []).map((r) => r.legacy_id).sort();
    assert(
      "live legacy_ids match",
      JSON.stringify(legacyIds) === JSON.stringify([...EXPECTED_LEGACY_IDS]),
      legacyIds.join(","),
    );
    const skylark = (disc.data ?? []).find((r) => r.legacy_id === "discography-002");
    assert("SKYLARK title", skylark?.title === "SKYLARK");
    assert("SKYLARK artist", !!skylark?.artist);
    assert("SKYLARK purchase_url readable", skylark?.purchase_url != null);
    assert("SKYLARK published", skylark?.published === true);
    assert("SKYLARK sort_order", typeof skylark?.sort_order === "number");
  } catch (e) {
    assert("live supabase read probe", false, String(e));
  }
} else {
  console.log("SKIP live Supabase probe (no anon env)");
}

console.log(`\nG-15a read binding verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
