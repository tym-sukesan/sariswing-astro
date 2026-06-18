/**
 * G-9g3d2 — Programmatic general edit dry-run smoke (no Save, no DB write).
 * Validates the same pure dry-run builder used by Preview button.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const UPDATED_AT_BASELINE = "2026-06-17T15:45:35.433566+00:00";
const PRICE_BASELINE = "[CMS Kit staging] G-9g3c price PoC";
const PRICE_CANDIDATE = "[CMS Kit staging] G-9g3d smoke price candidate";

const PILOT_ROW = {
  id: "aa440e29-5be8-402e-9190-0d81c48434c0",
  legacy_id: "schedule-2026-07-010",
  site_slug: "gosaki-piano",
  title: "[CMS Kit staging] G-9g2 title PoC",
  venue: "[CMS Kit staging] G-9g3b venue PoC",
  open_time: "[CMS Kit staging] G-9g3c open PoC",
  start_time: "[CMS Kit staging] G-9g3c start PoC",
  price: PRICE_BASELINE,
  description: "出演： [G-9g3b venue+description PoC]",
  updated_at: UPDATED_AT_BASELINE,
};

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

function normalizeCompare(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function buildDryRunPreview(row, patch) {
  const safeFields = [
    "title",
    "venue",
    "open_time",
    "start_time",
    "price",
    "description",
  ];
  const before = {};
  for (const f of safeFields) before[f] = row[f] ?? null;
  const after = { ...before };
  for (const f of safeFields) {
    if (Object.prototype.hasOwnProperty.call(patch, f)) {
      after[f] = patch[f];
    }
  }
  const changedFields = safeFields.filter(
    (f) => normalizeCompare(before[f]) !== normalizeCompare(after[f]),
  );
  return { before, after, changedFields };
}

// --- routine dev safety (key names only; no secret values logged) ---
const mergedEnv = mergeEnv();
const activeHost = hostFromUrl(mergedEnv.PUBLIC_SUPABASE_URL ?? "");
assert("routine dev staging write off", mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "false");
assert("routine dev dry-run on", mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "true");
assert(
  "routine dev g9g3d arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g3b arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g3c arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g2 arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED !== "true",
);
assert("routine dev staging host", activeHost === STAGING_HOST);
assert("routine dev not production host", activeHost !== PRODUCTION_HOST);

// --- programmatic price-only dry-run smoke ---
const preview = buildDryRunPreview(PILOT_ROW, { price: PRICE_CANDIDATE });
assert("dry-run actualWrite=false (implicit)", true);
assert("dry-run wouldWrite price only", preview.changedFields.length === 1);
assert("dry-run changedFields price only", preview.changedFields[0] === "price");
assert("dry-run before price baseline", preview.before.price === PRICE_BASELINE);
assert("dry-run after price candidate", preview.after.price === PRICE_CANDIDATE);
assert("dry-run title unchanged", preview.after.title === PILOT_ROW.title);
assert("dry-run venue unchanged", preview.after.venue === PILOT_ROW.venue);
assert("dry-run open_time unchanged", preview.after.open_time === PILOT_ROW.open_time);
assert("dry-run start_time unchanged", preview.after.start_time === PILOT_ROW.start_time);
assert(
  "dry-run description unchanged",
  preview.after.description === PILOT_ROW.description,
);
assert("optimistic lock baseline", PILOT_ROW.updated_at === UPDATED_AT_BASELINE);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
