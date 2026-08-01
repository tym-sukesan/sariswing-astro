/**
 * CMS Core v2 — Mio Supabase live SELECT-only preflight (offline docs contract).
 *
 * Branch B recorded: no Mio staging data → seed planning required.
 * Live pilot NOT COMPLETE. No network / DB / SQL execution in this verifier.
 *
 * npm: verify:cms-core-v2-mio-supabase-live-select-only-preflight
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
} from "./lib/supabase-staging-ref-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMP_OUT_REL = "output/_cms-core-v2-mio-live-select-preflight-tmp";

const PREFLIGHT_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-mio-supabase-live-select-only-preflight.md",
);
const SEED_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-mio-supabase-live-select-only-seed-write-planning.md",
);
const SEED_SQL = path.join(
  TOOL_ROOT,
  "scripts/supabase/cms-core-v2-mio-kisaragi-jazz-live-select-seed.template.sql",
);
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const REGISTRY = path.join(TOOL_ROOT, "config/sites/registry.json");
const MIO_ADAPTER = path.join(__dirname, "lib/mio-site-generator-hooks-adapter.mjs");
const GOSAKI_ADAPTER = path.join(__dirname, "lib/gosaki-site-generator-hooks-adapter.mjs");
const HUBSPOT_EMBED = path.join(__dirname, "lib/gosaki-contact-hubspot-embed.mjs");

let passed = 0;
let failed = 0;
/** @type {string | null} */
let tempOut = null;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function cleanupTemp() {
  if (tempOut && fs.existsSync(tempOut)) {
    removeGeneratedOutputDir(tempOut, TOOL_ROOT);
  }
  tempOut = null;
}

process.on("exit", () => {
  try {
    cleanupTemp();
  } catch {
    /* ignore */
  }
});

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
fs.mkdirSync(tempOut, { recursive: true });
fs.writeFileSync(path.join(tempOut, ".keep"), "mio-live-select-preflight-tmp\n", "utf8");

assert("preflight doc exists", fs.existsSync(PREFLIGHT_DOC));
assert("seed planning doc exists", fs.existsSync(SEED_DOC));
assert("seed SQL template exists", fs.existsSync(SEED_SQL));

const preflight = fs.readFileSync(PREFLIGHT_DOC, "utf8");
const seed = fs.readFileSync(SEED_DOC, "utf8");
const sql = fs.readFileSync(SEED_SQL, "utf8");
const suiteSrc = fs.readFileSync(SUITE, "utf8");
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));

assert(
  "preflight phase id",
  /cms-core-v2-mio-supabase-live-select-only-preflight/.test(preflight),
);
assert("preflight records attempted pilot phase", /cms-core-v2-mio-supabase-live-select-only-pilot/.test(preflight));
assert("preflight BRANCH B", /BRANCH:\s*B|BRANCH B|Branch B/i.test(preflight));
assert(
  "preflight live pilot NOT COMPLETE",
  /LIVE_PILOT_COMPLETE:\s*false|live pilot \*\*NOT COMPLETE\*\*|PILOT_COMPLETE:\s*false/i.test(
    preflight,
  ),
);
assert("preflight staging ref exact", preflight.includes(STAGING_PROJECT_REF));
assert("preflight production STOP", preflight.includes(PRODUCTION_REF_STOP));
assert("preflight anon only", /anon/i.test(preflight) && /service_role/i.test(preflight));
assert("preflight SELECT-only / no write", /DB write executed:\s*\*\*false\*\*|DB_WRITE_EXECUTED:\s*false/i.test(preflight));
assert("preflight site_slug required", /site_slug.*required|site_slug\*\* required/i.test(preflight));
assert("preflight Mio counts zero", /schedules.*\*\*0\*\*|`schedules` \(all\) \| \*\*0\*\*/i.test(preflight));
assert(
  "preflight empty SELECT ≠ COMPLETE",
  /Empty-data SELECT success does \*\*not\*\* equal|does \*\*not\*\* equal live pilot COMPLETE/i.test(
    preflight,
  ),
);
assert("preflight Schedule/Discography/Videos/About covered", /Schedule/.test(preflight) && /Discography/.test(preflight) && /Videos/.test(preflight) && /About/.test(preflight));
assert("preflight published filtering documented", /published\s*=\s*true/i.test(preflight));
assert("preflight sort documented", /sort_order/i.test(preflight));
assert("preflight Gosaki sanity counts", /gosaki-piano/i.test(preflight) && /74/.test(preflight));
assert("preflight Contact unchanged", /CONTACT_PROVIDER_UNCHANGED:\s*true/i.test(preflight));
assert("preflight Gosaki unchanged", /GOSAKI_UNCHANGED:\s*true/i.test(preflight));
assert("preflight RUNTIME_CHANGED false", /RUNTIME_CHANGED:\s*false/i.test(preflight));
assert(
  "preflight no trailing spaces",
  preflight.split("\n").every((l) => l === l.replace(/\s+$/u, "")),
);

assert("seed planning phase id", /cms-core-v2-mio-supabase-live-select-only-seed-write-planning/.test(seed));
assert("seed SQL not executed", /SQL NOT EXECUTED|MIO_SEED_SQL_EXECUTED:\s*false/i.test(seed));
assert("seed DB write not executed", /DB_WRITE_EXECUTED:\s*false/i.test(seed));
assert("seed READY_FOR_MIO_SEED_APPLY false", /READY_FOR_MIO_SEED_APPLY:\s*false/i.test(seed));
assert("seed rollback DELETE scoped", /site_slug = 'mio-kisaragi-jazz'/.test(seed));
assert("seed approval form required", /承認します/.test(seed));
assert("seed staging only", seed.includes(STAGING_PROJECT_REF));
assert("seed production STOP", seed.includes(PRODUCTION_REF_STOP));
assert(
  "seed no trailing spaces",
  seed.split("\n").every((l) => l === l.replace(/\s+$/u, "")),
);

assert("SQL template DO NOT EXECUTE", /DO NOT EXECUTE/i.test(sql));
assert("SQL template staging ref", sql.includes(STAGING_PROJECT_REF));
assert("SQL template production STOP", sql.includes(PRODUCTION_REF_STOP));
assert("SQL template mio site_slug", /mio-kisaragi-jazz/.test(sql));
assert("SQL READY_FOR_MIO_SEED_APPLY false", /READY_FOR_MIO_SEED_APPLY:\s*false/i.test(sql));
assert("SQL no ON CONFLICT upsert", !/on\s+conflict/i.test(sql));
assert("SQL collision guard present", /STOP collision/i.test(sql));

const mioEntry =
  registry?.sites?.["mio-kisaragi-jazz"] ||
  (Array.isArray(registry?.sites)
    ? registry.sites.find((s) => s.siteKey === "mio-kisaragi-jazz")
    : null);
assert("registry has mio-kisaragi-jazz", Boolean(mioEntry), "site missing");
if (mioEntry) {
  const feats = mioEntry.supabaseFeatures || {};
  assert(
    "Mio supabaseFeatures remain false (no silent live enable)",
    feats.schedule === false &&
      feats.discography === false &&
      feats.siteEmbeds === false &&
      feats.sitePageFields === false,
  );
}

assert("Mio adapter file unchanged path exists", fs.existsSync(MIO_ADAPTER));
assert("Gosaki adapter file exists (isolation)", fs.existsSync(GOSAKI_ADAPTER));
assert("HubSpot embed helper exists (Contact isolation)", fs.existsSync(HUBSPOT_EMBED));

const npmScript = "verify:cms-core-v2-mio-supabase-live-select-only-preflight";
assert("npm script registered", Boolean(pkg.scripts?.[npmScript]));
assert(
  "Safety Suite registers mio-live-select-preflight",
  /mio-supabase-live-select-only-preflight/.test(suiteSrc),
);
assert(
  "Safety Suite does not register live network Mio pilot step",
  !/verify-cms-core-v2-mio-supabase-live-select-only-pilot\.mjs/.test(suiteSrc),
);

assert("temp cleanup path created", fs.existsSync(tempOut));
cleanupTemp();
assert("temp cleanup removed", !fs.existsSync(tempOut));

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
