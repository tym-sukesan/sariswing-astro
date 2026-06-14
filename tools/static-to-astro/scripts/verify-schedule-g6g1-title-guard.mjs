#!/usr/bin/env node
/**
 * G-6-g1 — Verify assertG6G1TitlePayloadOnly (no DB, no network).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-g6g1-title-guard.mjs
 */

import { G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID, SCHEDULE_WRITE_APPROVAL_IDS } from "../../../src/lib/admin/staging-write/schedule-write-types.ts";

/** Mirror of schedule-write-guards.ts assertG6G1TitlePayloadOnly for standalone verify. */
function assertG6G1TitlePayloadOnly(payload) {
  const allowedKeys = new Set(["title"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-6-g1 payload must include title.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-6-g1 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("title")) {
    throw new Error("G-6-g1 payload must include title.");
  }
}

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function assertThrows(name, fn, expectedSubstring) {
  try {
    fn();
    failed += 1;
    console.error(`FAIL ${name} — expected throw`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (expectedSubstring && !message.includes(expectedSubstring)) {
      failed += 1;
      console.error(`FAIL ${name} — got "${message}"`);
    } else {
      passed += 1;
      console.log(`PASS ${name}`);
    }
  }
}

assert(
  "G6G1 approval ID in SCHEDULE_WRITE_APPROVAL_IDS",
  SCHEDULE_WRITE_APPROVAL_IDS.includes(G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID),
);

assertThrows("empty payload rejected", () => assertG6G1TitlePayloadOnly({}), "must include title");

assertThrows("venue forbidden", () => assertG6G1TitlePayloadOnly({ title: "x", venue: "y" }), "not allowed: venue");

assertThrows("description forbidden", () => assertG6G1TitlePayloadOnly({ title: "x", description: "y" }), "not allowed: description");

assertThrows("updated_at forbidden", () => assertG6G1TitlePayloadOnly({ title: "x", updated_at: "2026-01-01" }), "not allowed: updated_at");

let titleOnlyOk = false;
try {
  assertG6G1TitlePayloadOnly({ title: "[CMS Kit staging] G-6-g1 title PoC" });
  titleOnlyOk = true;
} catch {
  titleOnlyOk = false;
}
assert("title-only payload accepted", titleOnlyOk);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
