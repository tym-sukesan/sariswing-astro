#!/usr/bin/env node
/**
 * G-6-f10 — Verify schedule optimistic lock utilities (no DB, no network).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-schedule-optimistic-lock-utils.mjs
 */

import {
  evaluateScheduleStaleState,
  normalizeScheduleUpdatedAt,
  resolveExpectedBeforeUpdatedAt,
  scheduleUpdatedAtEquals,
} from "../../../src/lib/admin/staging-write/schedule-write-utils.ts";

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

const iso = "2026-06-14T06:49:42.240919+00:00";
const pg = "2026-06-14 06:49:42.240919+00";

assert("normalize ISO to PG-style", normalizeScheduleUpdatedAt(iso) === normalizeScheduleUpdatedAt(pg));
assert("scheduleUpdatedAtEquals ISO vs PG", scheduleUpdatedAtEquals(iso, pg));
assert(
  "scheduleUpdatedAtEquals rejects mismatch",
  !scheduleUpdatedAtEquals(pg, "2026-06-05 17:39:44.140168+00"),
);
assert(
  "resolveExpectedBeforeUpdatedAt returns token",
  resolveExpectedBeforeUpdatedAt({ updated_at: pg }) === pg,
);
assert(
  "resolveExpectedBeforeUpdatedAt empty when missing",
  resolveExpectedBeforeUpdatedAt({ updated_at: null }) === null,
);

const stale = evaluateScheduleStaleState({
  baselineUpdatedAt: pg,
  currentUpdatedAt: "2026-06-05 17:39:44.140168+00",
});
assert("evaluateScheduleStaleState detects stale", stale.staleDetected === true);
assert("evaluateScheduleStaleState message set", Boolean(stale.message));

const fresh = evaluateScheduleStaleState({
  baselineUpdatedAt: pg,
  currentUpdatedAt: iso,
});
assert("evaluateScheduleStaleState fresh row", fresh.staleDetected === false);

const lockToken = resolveExpectedBeforeUpdatedAt({ updated_at: pg });
assert(
  "product path lock token from beforeSnapshot",
  lockToken === pg && scheduleUpdatedAtEquals(lockToken, pg),
);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
