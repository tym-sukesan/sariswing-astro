/**
 * CMS Core v2 — Mio live SELECT-only seed write gate (offline).
 *
 * Static SQL safety + docs contract. No network / DB / SQL execution.
 * npm: verify:cms-core-v2-mio-supabase-live-select-only-seed-write-gate
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
const TEMP_OUT_REL = "output/_cms-core-v2-mio-seed-write-gate-tmp";

const GATE_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-mio-supabase-live-select-only-seed-write-gate.md",
);
const SQL = path.join(
  TOOL_ROOT,
  "scripts/supabase/cms-core-v2-mio-kisaragi-jazz-live-select-seed.template.sql",
);
const GEN = path.join(__dirname, "generate-mio-kisaragi-jazz-live-select-seed-sql.mjs");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const REGISTRY = path.join(TOOL_ROOT, "config/sites/registry.json");

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
fs.writeFileSync(path.join(tempOut, ".keep"), "mio-seed-write-gate-tmp\n", "utf8");

assert("gate doc exists", fs.existsSync(GATE_DOC));
assert("SQL template exists", fs.existsSync(SQL));
assert("generator exists", fs.existsSync(GEN));

const doc = fs.readFileSync(GATE_DOC, "utf8");
const sql = fs.readFileSync(SQL, "utf8");
const suiteSrc = fs.readFileSync(SUITE, "utf8");
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));

assert("gate phase id", /cms-core-v2-mio-supabase-live-select-only-seed-write-gate/.test(doc));
assert("gate NOT READY TO APPLY", /NOT READY TO APPLY|READY_FOR_MIO_SEED_APPLY:\s*false/i.test(doc));
assert("gate SQL not executed", /SQL executed:\s*\*\*false\*\*|MIO_SEED_SQL_EXECUTED:\s*false/i.test(doc));
assert("gate DB write false", /DB_WRITE_EXECUTED:\s*false/i.test(doc));
assert("gate tracks 14 vs 13 explained", /14/.test(doc) && /13/.test(doc) && /tracks/i.test(doc));
assert("gate TBD blocker documented", /mio-sched-2026-09-01/.test(doc) && /NOT NULL/i.test(doc));
assert("gate collision guard documented", /Collision guard|collision/i.test(doc));
assert("gate transaction documented", /single transaction|one.*BEGIN/i.test(doc));
assert("gate rollback scoped", /mio-sched-%|site_slug/.test(doc));
assert("gate staging ref", doc.includes(STAGING_PROJECT_REF));
assert("gate production STOP", doc.includes(PRODUCTION_REF_STOP));
assert("gate RUNTIME_CHANGED false", /RUNTIME_CHANGED:\s*false/i.test(doc));
assert(
  "gate no trailing spaces",
  doc.split("\n").every((l) => l === l.replace(/\s+$/u, "")),
);

assert("SQL DO NOT EXECUTE", /DO NOT EXECUTE/i.test(sql));
assert("SQL staging ref", sql.includes(STAGING_PROJECT_REF));
assert("SQL production STOP", sql.includes(PRODUCTION_REF_STOP));
assert("SQL READY_FOR_MIO_SEED_APPLY false", /READY_FOR_MIO_SEED_APPLY:\s*false/i.test(sql));
assert("SQL has block A preflight", /A\) WRITE/i.test(sql) || /WRITE直前 SELECT-only preflight/i.test(sql));
assert("SQL has block B begin", /^\s*begin;/im.test(sql));
assert("SQL has block C post-check", /C\) post-write/i.test(sql));
assert("SQL has block D rollback", /D\) 限定 rollback/i.test(sql));
assert("SQL has block E post-rollback", /E\) rollback後/i.test(sql));
assert("SQL collision STOP", /STOP collision/i.test(sql));
assert("SQL Option A assert", /STOP Option A mismatch/i.test(sql));
assert("SQL no ON CONFLICT", !/on\s+conflict/i.test(sql));
assert("SQL no TRUNCATE statement", !/(^|\s)truncate\s/im.test(sql));
assert("SQL no service_role token", !/(^|\s)service_role(\s|$)/m.test(sql.toLowerCase()));
const dStart = sql.indexOf("-- D)");
const eStart = sql.indexOf("-- E)");
const deleteBlock =
  dStart >= 0 ? sql.slice(dStart, eStart >= 0 ? eStart : undefined) : "";
const deleteStatements = [...deleteBlock.matchAll(/^delete from[\s\S]*?;/gim)].map(
  (m) => m[0],
);
assert(
  "SQL deletes scoped to mio-kisaragi-jazz",
  deleteStatements.length >= 5 &&
    deleteStatements.every((chunk) => /site_slug = 'mio-kisaragi-jazz'/.test(chunk)) &&
    !deleteStatements.some((chunk) => /gosaki-piano/.test(chunk)),
);
assert("SQL rollback uses mio prefixes", /mio-sched-%/.test(sql) && /mio-disco-%/.test(sql) && /mio-yt-%/.test(sql));
assert("SQL TBD blocker comment", /mio-sched-2026-09-01/.test(sql) && /TBD/i.test(sql));
assert("SQL expect schedules 16/14", /v_sched <> 16/.test(sql) && /v_sched_pub <> 14/.test(sql));
assert("SQL expect tracks 14 and 13", /v_tracks <> 14/.test(sql) && /v_tracks_pub_parent <> 13/.test(sql));
assert(
  "SQL no trailing spaces",
  sql.split("\n").every((l) => l === l.replace(/\s+$/u, "")),
);

const mio = registry?.sites?.["mio-kisaragi-jazz"];
assert("registry mio present", Boolean(mio));
if (mio) {
  const f = mio.supabaseFeatures || {};
  assert(
    "registry supabaseFeatures unchanged false",
    f.schedule === false &&
      f.discography === false &&
      f.siteEmbeds === false &&
      f.sitePageFields === false,
  );
}

const npm = "verify:cms-core-v2-mio-supabase-live-select-only-seed-write-gate";
assert("npm script registered", Boolean(pkg.scripts?.[npm]));
assert(
  "Safety Suite registers seed-write-gate",
  /mio-supabase-live-select-only-seed-write-gate/.test(suiteSrc),
);
assert(
  "Safety Suite still has no live pilot network verifier",
  !/verify-cms-core-v2-mio-supabase-live-select-only-pilot\.mjs/.test(suiteSrc),
);

assert("temp cleanup path created", fs.existsSync(tempOut));
cleanupTemp();
assert("temp cleanup removed", !fs.existsSync(tempOut));

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
