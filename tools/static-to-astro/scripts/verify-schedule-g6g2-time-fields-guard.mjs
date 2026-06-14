#!/usr/bin/env node
/**
 * G-6-g2 — Verify assertG6G2TimeFieldsPayloadOnly (no DB, no network).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-g6g2-time-fields-guard.mjs
 */

import {
  G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID,
  SCHEDULE_WRITE_APPROVAL_IDS,
} from "../../../src/lib/admin/staging-write/schedule-write-types.ts";

/** Mirror of schedule-write-guards.ts assertG6G2TimeFieldsPayloadOnly for standalone verify. */
function assertG6G2TimeFieldsPayloadOnly(payload) {
  const allowedKeys = new Set(["open_time", "start_time"]);
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    throw new Error("G-6-g2 payload must include open_time and start_time.");
  }
  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new Error(`G-6-g2 payload field not allowed: ${key}`);
    }
  }
  if (!keys.includes("open_time") || !keys.includes("start_time")) {
    throw new Error("G-6-g2 payload must include both open_time and start_time.");
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
  "G6G2 approval ID in SCHEDULE_WRITE_APPROVAL_IDS",
  SCHEDULE_WRITE_APPROVAL_IDS.includes(G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID),
);

assertThrows(
  "empty payload rejected",
  () => assertG6G2TimeFieldsPayloadOnly({}),
  "open_time and start_time",
);

assertThrows(
  "title forbidden",
  () =>
    assertG6G2TimeFieldsPayloadOnly({
      open_time: "a",
      start_time: "b",
      title: "x",
    }),
  "not allowed: title",
);

assertThrows(
  "open_time only rejected",
  () => assertG6G2TimeFieldsPayloadOnly({ open_time: "a" }),
  "both open_time and start_time",
);

assertThrows(
  "updated_at forbidden",
  () =>
    assertG6G2TimeFieldsPayloadOnly({
      open_time: "a",
      start_time: "b",
      updated_at: "2026-01-01",
    }),
  "not allowed: updated_at",
);

let timeFieldsOk = false;
try {
  assertG6G2TimeFieldsPayloadOnly({
    open_time: "[CMS Kit staging] G-6-g2 open PoC",
    start_time: "[CMS Kit staging] G-6-g2 start PoC",
  });
  timeFieldsOk = true;
} catch {
  timeFieldsOk = false;
}
assert("time-fields-only payload accepted", timeFieldsOk);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
