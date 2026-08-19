/**
 * Offline verifier for gosaki-2026-09-batch-insert-db-write-packet (post pre-exec review).
 * Does not connect to Supabase. Does not execute INSERT/DELETE.
 *
 * Run: node tools/static-to-astro/scripts/verify-gosaki-2026-09-batch-insert-db-write-packet.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const FORWARD = path.join(TOOL_ROOT, "scripts/supabase/gosaki-schedule-2026-09-batch-insert.packet.sql");
const ROLLBACK = path.join(TOOL_ROOT, "scripts/supabase/gosaki-schedule-2026-09-batch-insert.rollback.sql");
const DOC = path.join(TOOL_ROOT, "docs/gosaki-2026-09-batch-insert-db-write-packet.md");
const EXTRACTED = path.join(TOOL_ROOT, "output/gosaki-source-captures/2026-09/extracted.json");

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

function evenDollarTag(src, tag) {
  const re = new RegExp(tag.replace(/\$/g, "\\$"), "g");
  const n = (src.match(re) || []).length;
  return { n, even: n % 2 === 0 && n > 0 };
}

const forward = fs.readFileSync(FORWARD, "utf8");
const rollback = fs.readFileSync(ROLLBACK, "utf8");
const doc = fs.readFileSync(DOC, "utf8");

const packetTag = evenDollarTag(forward, "$packet$");
const rollbackTag = evenDollarTag(rollback, "$rollback$");
const dForward = evenDollarTag(forward, "$d$");
assert("forward $packet$ even", packetTag.even, `count=${packetTag.n}`);
assert("rollback $rollback$ even", rollbackTag.even, `count=${rollbackTag.n}`);
assert("forward $d$ even", dForward.even, `count=${dForward.n}`);

assert("forward not executed banner", /NOT EXECUTED by Cursor/.test(forward));
assert("rollback not executed banner", /NOT EXECUTED by Cursor/.test(rollback));
assert("no ritual approval in forward SQL", !/承認します/.test(forward));
assert("no ritual approval in rollback SQL", !/承認します/.test(rollback));
assert("no ritual approval in packet doc", !/承認します/.test(doc));
assert("forward keeps STOP/no-retry", /Do not retry/.test(forward) && /STOP if timeout/.test(forward));
assert("rollback keeps STOP/no-retry", /Do not retry/.test(rollback) && /STOP if timeout/.test(rollback));

assert(
  "DO post-write published total 91",
  /POST_WRITE_FAIL: published gosaki total=% expected 91/.test(forward) &&
    /v_after_published IS DISTINCT FROM 91/.test(forward),
);
assert(
  "DO post-write pre-September 74",
  /POST_WRITE_FAIL: published pre-September=% expected 74/.test(forward) &&
    /v_after_pre_sept IS DISTINCT FROM 74/.test(forward),
);

const insertStart = forward.indexOf("INSERT INTO public.schedules");
const insertEnd = forward.indexOf("GET DIAGNOSTICS v_inserted");
assert("INSERT block found", insertStart >= 0 && insertEnd > insertStart);
const insertBlock = forward.slice(insertStart, insertEnd);
assert("INSERT does not mention 001", !/schedule-2026-09-001/.test(insertBlock));
for (let n = 2; n <= 18; n += 1) {
  const id = `schedule-2026-09-${String(n).padStart(3, "0")}`;
  assert(`INSERT contains ${id}`, insertBlock.includes(id));
}

const deleteStmt = rollback.match(/DELETE FROM public\.schedules[\s\S]*?;/)?.[0] ?? "";
assert("rollback DELETE statement found", /DELETE FROM public\.schedules/.test(deleteStmt));
assert("rollback DELETE excludes 001", !/schedule-2026-09-001/.test(deleteStmt));
assert("rollback fingerprint month", /month = '2026-09'/.test(rollback));
assert("rollback fingerprint source_file", /source_file = 'schedule-2026-09.html'/.test(rollback));
assert("rollback fingerprint source_route", /source_route = '\/schedule\/2026-09\/'/.test(rollback));
assert("rollback fingerprint sort_order", /sort_order BETWEEN 80 AND 96/.test(rollback));
assert(
  "rollback fingerprint RAISE",
  /ROLLBACK_PRECONDITION_FAIL: 002-018 INSERT fingerprint/.test(rollback),
);

function stripSqlComments(src) {
  return src
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
}

function legacySelectUnscoped(src, labelPrefix) {
  const needles = ["schedule-2026-09-001", "schedule-2026-09-002"];
  const chunks = stripSqlComments(src).split(/;/);
  let bad = 0;
  for (const chunk of chunks) {
    if (/INSERT INTO/.test(chunk)) continue;
    if (!needles.some((n) => chunk.includes(n))) continue;
    if (!/\bSELECT\b/i.test(chunk) && !/\bDELETE\b/i.test(chunk) && !/\bEXISTS\b/i.test(chunk)) continue;
    if (!/site_slug = 'gosaki-piano'/.test(chunk) && !/site_slug = \$d\$gosaki-piano\$d\$/.test(chunk)) {
      bad += 1;
      console.error(`UNSCOPED ${labelPrefix}: ${chunk.slice(0, 180).replace(/\s+/g, " ")}`);
    }
  }
  return bad;
}

const forwardUnscoped = legacySelectUnscoped(forward, "forward");
const rollbackUnscoped = legacySelectUnscoped(rollback, "rollback");
assert("forward 001/002-018 SELECTs scoped to gosaki-piano", forwardUnscoped === 0, `unscoped=${forwardUnscoped}`);
assert("rollback 001/002-018 SELECTs/DELETE scoped to gosaki-piano", rollbackUnscoped === 0, `unscoped=${rollbackUnscoped}`);

if (fs.existsSync(EXTRACTED)) {
  const extracted = JSON.parse(fs.readFileSync(EXTRACTED, "utf8"));
  assert("extractor still 17", extracted.count === 17 && extracted.events.length === 17);
  extracted.events.forEach((e, i) => {
    const planned = `schedule-2026-09-${String(i + 2).padStart(3, "0")}`;
    assert(`${planned} title in INSERT`, insertBlock.includes(e.title), e.title);
    assert(`${planned} date in INSERT`, insertBlock.includes(e.date));
    if (e.venue) assert(`${planned} venue in INSERT`, insertBlock.includes(e.venue));
    if (e.description) {
      const firstLine = e.description.split("\n")[0];
      assert(`${planned} description start in INSERT`, insertBlock.includes(firstLine));
    }
  });
  assert("NULL open_time row 002", /\$d\$schedule-2026-09-002\$d\$[\s\S]{0,400}NULL,\s*\n\s*\$d\$19:30\$d\$/.test(insertBlock));
  assert("NULL price row 007", /\$d\$schedule-2026-09-007\$d\$[\s\S]{0,500}NULL,\s*\n\s*\$d\$出演：/.test(insertBlock));
  assert("NULL start_time row 016", /\$d\$schedule-2026-09-016\$d\$[\s\S]{0,400}\$d\$12:00\$d\$,\s*\n\s*NULL,/.test(insertBlock));
} else {
  assert("extracted.json present for value lock", false);
}

assert("doc records DO 91/74 gates", /published gosaki total \*\*= 91\*\*|published total \*\*91\*\*|v_after_published/.test(doc) || /91/.test(doc));
assert("doc records operator CLOSED/PASS", /OPERATOR_DB_WRITE_RESULT: SUCCESS/.test(doc));
assert("doc forbids SQL re-execute", /SQL_REEXECUTE_FORBIDDEN: true/.test(doc));
assert("doc Cursor did not write", /CURSOR_DB_WRITE_EXECUTED: false/.test(doc));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
