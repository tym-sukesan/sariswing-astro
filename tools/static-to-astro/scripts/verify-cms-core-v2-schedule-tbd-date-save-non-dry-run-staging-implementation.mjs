/**
 * CMS Core v2 — Schedule TBD CREATE oneshot implementation + boundary hardening (offline).
 *
 * npm: verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation
 *
 * No network / env mutation / DB write. Behavioral tests via esbuild bundle + mocks.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import * as esbuild from "esbuild";
import { isSaveArmExactTrue } from "./lib/save-arm-utils.mjs";
import {
  buildScheduleTbdSavePayload,
  SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
} from "./lib/schedule-tbd-save-payload.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md",
);
const PLAN = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-planning.md",
);
const CONFIG = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-config.ts",
);
const GUARDS = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-guards.ts",
);
const SAVE = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-save.ts",
);
const INSERT = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/schedule-insert-write-adapter.ts",
);
const TYPES = path.join(REPO_ROOT, "src/lib/admin/staging-write/schedule-write-types.ts");
const OPERATOR = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts",
);
const ADMIN_UI = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/schedule-tbd-admin-ui.ts",
);
const DRY_RUN = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-data/schedule-tbd-save-dry-run.ts",
);
const ASTRO = path.join(
  TOOL_ROOT,
  "templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const EDGE = path.join(
  TOOL_ROOT,
  "scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
);
const G22E_CONFIG = path.join(
  REPO_ROOT,
  "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-config.ts",
);
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const BUNDLE = path.join(TOOL_ROOT, "output/_tbd-create-oneshot-save-offline-bundle.mjs");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const STAGING_URL = `https://${STAGING_REF}.supabase.co`;
const PRODUCTION_URL = `https://${PRODUCTION_REF}.supabase.co`;
const APPROVAL = "cms-core-v2-schedule-tbd-create-non-dry-run-oneshot";
const CLIENT_ARM = "PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED";
const SERVER_ARM = "ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED";
const LEGACY_ID = "schedule-2026-11-001";
const TITLE = "【CMS Kit staging】TBD create oneshot PoC";

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

function read(p) {
  return fs.readFileSync(p, "utf8");
}

assert("implementation doc exists", fs.existsSync(DOC));
const doc = read(DOC);
assert("phase id", /cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation/.test(doc));
assert("IMPLEMENTATION_READY true", /IMPLEMENTATION_READY:\s*true/.test(doc));
assert("ACTUAL_WRITE_READY false", /ACTUAL_WRITE_READY:\s*false/.test(doc));
assert("arms OFF", /arms?\s*OFF|ARMS_OFF:\s*true/i.test(doc));
assert("env unchanged", /ENV_CHANGED:\s*false|env unchanged/i.test(doc));
assert("DB write 0", /DB_WRITE_EXECUTED:\s*false|DB write 0/i.test(doc));
assert("Edge unchanged", /EDGE_CHANGED:\s*false|Edge unchanged/i.test(doc));
assert("cleanup未実装", /cleanup.*未実装|CLEANUP_IMPLEMENTED:\s*false/i.test(doc));
assert("boundary hardening noted", /boundary-hardening|INSERT境界|low-level/i.test(doc));

assert("config exists", fs.existsSync(CONFIG));
assert("guards exist", fs.existsSync(GUARDS));
assert("save exists", fs.existsSync(SAVE));

const config = read(CONFIG);
const guards = read(GUARDS);
const save = read(SAVE);
const insert = read(INSERT);
const types = read(TYPES);
const operator = read(OPERATOR);
const adminUi = read(ADMIN_UI);
const dryRun = read(DRY_RUN);
const astro = read(ASTRO);
const edge = fs.existsSync(EDGE) ? read(EDGE) : "";
const g22e = read(G22E_CONFIG);
const plan = read(PLAN);

assert("approval in types", types.includes(APPROVAL));
assert(
  "approval in SCHEDULE_WRITE_APPROVAL_IDS",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID/.test(types),
);
assert("TBD insert payload type separate", /ScheduleTbdCreateOneshotInsertPayload/.test(types));
assert(
  "confirmed ScheduleInsertWritePayload date string retained",
  /date:\s*string/.test(types),
);

assert("client arm env", config.includes(CLIENT_ARM));
assert("server arm env", config.includes(SERVER_ARM));
assert("exact true via isSaveArmExactTrue", /isSaveArmExactTrue/.test(config));
assert("no trim for TBD arms", !/String\(.*TBD_CREATE.*\)\.trim\(\)\s*===\s*"true"/.test(config));
assert("server arm not PUBLIC_", /ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED/.test(config));
assert("SSR boolean only helper", /resolveTbdCreateOneshotPageServerConfig/.test(config));
assert("dry-run exact false", /PUBLIC_ADMIN_WRITE_DRY_RUN\s*===\s*"false"/.test(config));
assert(
  "production ref STOP",
  /SARISWING_PRODUCTION_PROJECT_REF|vsbvndwuajjhnzpohghh/.test(config),
);
assert(
  "staging ref",
  /STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF|kmjqppxjdnwwrtaeqjta/.test(config),
);
assert("peer mutex G-22e", /G22E_NEW_EVENT_INSERT|G22E.*ARM/.test(config));
assert("Edge arm mutex", /GOSAKI_SCHEDULE_SAVE_ARMED/.test(config));

assert("fixed legacy_id", guards.includes(LEGACY_ID));
assert("fixed title", guards.includes(TITLE));
assert("fixed month 2026-11", guards.includes("2026-11"));
assert("published false fixed", /published:\s*false/.test(guards));
assert("buildScheduleTbdSavePayload used", /buildScheduleTbdSavePayload/.test(guards));
assert("mode tbd-v1", /SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1|tbd-v1/.test(guards));
assert("allowlist keys", /TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS/.test(guards));
assert("fingerprint helper", /fingerprintTbdCreateOneshotPayload/.test(guards));
assert("preflight baseline 79", /totalSchedules:\s*79/.test(guards));
assert(
  "no optimistic lock field",
  /must not include optimistic-lock|expectedBeforeUpdatedAt/.test(guards),
);

assert("executeTbdCreateOneshotSave", /export async function executeTbdCreateOneshotSave/.test(save));
assert(
  "low-level INSERT is module-private",
  /async function insertTbdCreateOneshotScheduleWriteInternal/.test(save) &&
    !/export async function insertTbdCreateOneshotScheduleWriteInternal/.test(save) &&
    !/export \{[^}]*insertTbdCreateOneshotScheduleWriteInternal/.test(save),
);
assert(
  "low-level INSERT not exported from adapter",
  !/export async function insertTbdCreateOneshotScheduleWrite/.test(insert) &&
    !/insertTbdCreateOneshotScheduleWrite/.test(insert),
);
assert(
  "confirmed insertNewEventScheduleWrite retained",
  /export async function insertNewEventScheduleWrite/.test(insert),
);
assert("no updateScheduleWrite in save", !/updateScheduleWrite|buildScheduleLockedWriteRequest/.test(save));
assert("terminal succeeded/failed/ambiguous", /ambiguous|oneshotTerminalState/.test(save));
assert("double-click guard", /oneshot_already_consumed|terminal state/.test(save));
assert("schema probe required", /probeDateStatusColumn/.test(save));
assert(
  "runtime preflight skip flag absent",
  !/offline\s*\?|deps\.offline|skipPreflight|preflightSkip/i.test(save),
);
assert("INSERT boundary staging assert", /assertStaticToAstroCmsStagingSupabaseProject/.test(save));
assert("INSERT boundary production reject", /production project ref rejected/.test(save));
assert("INSERT boundary client arm", /client arm must be exact true at INSERT boundary/.test(save));
assert(
  "INSERT boundary serverArmOk",
  /serverArmOkFromSsr must be true at INSERT boundary/.test(save),
);
assert("network call counter", /oneshotNetworkCalls/.test(save));

assert("operator wires oneshot save", /executeTbdCreateOneshotSave/.test(operator));
assert(
  "operator button Staging one-shot CREATE",
  /Staging one-shot CREATE|tbd-create-oneshot-btn/.test(operator),
);
assert(
  "confirmed TBD Save still blocked message",
  /TBD保存はまだ有効化されていません/.test(operator),
);
assert("operator keeps dry-run", /runScheduleTbdSavePayloadDryRun/.test(operator));
assert("no DELETE UI", !/executeTbdCreateOneshotDelete|tbd-create-oneshot-delete/.test(operator));
assert(
  "fingerprint gate",
  /previewFingerprint|fingerprintTbdCreateOneshotPayload/.test(operator),
);
assert(
  "operator does not import low-level INSERT",
  !/insertTbdCreateOneshotScheduleWrite/.test(operator),
);

assert(
  "astro oneshot page config",
  /TBD_CREATE_ONESHOT_PAGE_CONFIG_ELEMENT_ID|tbd-create-oneshot-config/.test(astro),
);
assert(
  "astro no raw server arm string in attrs",
  !new RegExp(`data-[^=]*=\\{[^}]*${SERVER_ARM}`).test(astro),
);
assert("astro data-server-arm-ok boolean", /data-server-arm-ok/.test(astro));
assert("astro oneshot button", /gosaki-add-tbd-create-oneshot-btn/.test(astro));
assert(
  "astro wrap hidden when disarmed",
  /tbdCreateOneshotUiVisible|hidden=\{!tbdCreateOneshotUiVisible\}/.test(astro),
);

assert(
  "admin ui tbdWriteEnabled from oneshot SSR",
  /resolveTbdCreateOneshotPageServerConfig/.test(adminUi),
);
assert(
  "dry-run still forces write false in dry-run path",
  /tbdWriteEnabled:\s*false/.test(dryRun),
);

assert("Edge no oneshot approval", !edge.includes(APPROVAL));
assert("Edge no tbdWriteEnabled", !/tbdWriteEnabled/.test(edge));
assert("G-22e mutex includes TBD create arm", /collectTbdCreateOneshotArmOffFailures/.test(g22e));
assert("planning notes implementation", /implementation|IMPLEMENTATION/i.test(plan));

assert("exact true only", isSaveArmExactTrue("true") === true);
assert("TRUE fail-closed", isSaveArmExactTrue("TRUE") === false);
assert("1 fail-closed", isSaveArmExactTrue("1") === false);
assert("trim true fail-closed", isSaveArmExactTrue(" true") === false);
assert("boolean true fail-closed", isSaveArmExactTrue(true) === false);
assert("unset fail-closed", isSaveArmExactTrue(undefined) === false);

const built = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  date: null,
  month: "2026-11",
  tbdMonthMode: "month-known",
  schemaSupportsTbd: true,
  tbdWriteEnabled: true,
  title: TITLE,
  venue: "[CMS Kit staging] TBD create PoC venue",
  description: "[CMS Kit staging] TBD create oneshot — unpublished",
  published: false,
  show_on_home: false,
  home_order: null,
  sort_order: 0,
});
assert("payload build ok with tbdWriteEnabled", built.ok === true, JSON.stringify(built.errors));
assert("payload date null", built.ok && built.value.payload.date === null);
assert("payload date_status tbd", built.ok && built.value.payload.date_status === "tbd");
assert("payload month", built.ok && built.value.payload.month === "2026-11");
assert("payload published false", built.ok && built.value.payload.published === false);

const blockedWrite = buildScheduleTbdSavePayload({
  mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  operation: "create",
  dateStatus: "tbd",
  date: null,
  month: "2026-11",
  tbdMonthMode: "month-known",
  schemaSupportsTbd: true,
  tbdWriteEnabled: false,
  title: TITLE,
  published: false,
  show_on_home: false,
  home_order: null,
  sort_order: 0,
});
assert(
  "tbdWriteEnabled false blocks real write path",
  blockedWrite.ok === false &&
    (blockedWrite.codes.includes("tbd_flags_required") ||
      blockedWrite.codes.includes("tbd_write_blocked")),
  JSON.stringify(blockedWrite.codes),
);

assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation/.test(read(PKG)),
);
assert(
  "Safety Suite registers implementation",
  /schedule-tbd-date-save-non-dry-run-staging-implementation/.test(read(SUITE)),
);

assert(
  "no DELETE in oneshot modules",
  !/deleteScheduleWrite/.test(config + guards + save) &&
    !/UPDATE FROM public\.schedules/.test(save),
);
assert("UPDATE / DELETEなし source", !/updateScheduleWrite/.test(save));
assert(
  "confirmed Save契約不変 marker",
  /insertNewEventScheduleWrite/.test(insert) && /date:\s*string/.test(types),
);

// --- Behavioral: bundle executeTbdCreateOneshotSave ---
fs.mkdirSync(path.dirname(BUNDLE), { recursive: true });
let buildError = "";
try {
  esbuild.buildSync({
    entryPoints: [SAVE],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: BUNDLE,
    packages: "external",
  });
} catch (err) {
  buildError = err instanceof Error ? err.message : String(err);
}
assert("esbuild bundle ok", !buildError, buildError);

const mod = await import(`${pathToFileURL(BUNDLE).href}?t=${Date.now()}`);
const {
  executeTbdCreateOneshotSave,
  resetTbdCreateOneshotTerminalStateForTests,
  getTbdCreateOneshotNetworkCallCountForTests,
  getTbdCreateOneshotTerminalState,
} = mod;

function armedEnv(overrides = {}) {
  return {
    PUBLIC_SUPABASE_URL: STAGING_URL,
    PUBLIC_SUPABASE_ANON_KEY: "anon-test",
    [CLIENT_ARM]: "true",
    [SERVER_ARM]: "true",
    PUBLIC_ADMIN_WRITE_DRY_RUN: "false",
    ENABLE_ADMIN_STAGING_SHELL: "true",
    ENABLE_ADMIN_STAGING_WRITE: "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: "supabase",
    PUBLIC_ADMIN_WRITE_MODULE: "schedule",
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: APPROVAL,
    DEV: true,
    ...overrides,
  };
}

const guardsBundle = path.join(TOOL_ROOT, "output/_tbd-create-oneshot-guards-offline-bundle.mjs");
let guardsBuildError = "";
try {
  esbuild.buildSync({
    entryPoints: [GUARDS],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: guardsBundle,
    packages: "external",
  });
} catch (err) {
  guardsBuildError = err instanceof Error ? err.message : String(err);
}
assert("esbuild guards bundle ok", !guardsBuildError, guardsBuildError);
const guardsMod = await import(`${pathToFileURL(guardsBundle).href}?t=${Date.now()}`);
const fixedPayload = guardsMod.buildTbdCreateOneshotFixedInsertPayload();
const previewFp = guardsMod.fingerprintTbdCreateOneshotPayload(fixedPayload);

function makeAuth(signedIn) {
  return async () => ({
    session: {
      status: signedIn ? "signed-in" : "signed-out",
      role: signedIn ? "admin" : "denied",
    },
    rawEmail: signedIn ? "admin@example.com" : null,
    user: signedIn ? { id: "u1" } : null,
    mockRole: null,
  });
}

function makePreflight(opts = {}) {
  return {
    countTotal: async () => opts.total ?? 79,
    countMio: async () => opts.mio ?? 0,
    countTbd: async () => opts.tbd ?? 0,
    countTargetLegacyId: async () => opts.legacy ?? 0,
    probeDateStatusColumn: async () =>
      opts.schemaOk === false
        ? { ok: false, errorMessage: "date_status missing" }
        : { ok: true },
  };
}

function makeInsertClient(tracker) {
  return {
    from() {
      return {
        insert(payload) {
          tracker.calls += 1;
          tracker.lastPayload = payload;
          return {
            select() {
              return {
                async single() {
                  if (tracker.mode === "timeout") {
                    throw new Error("network timeout");
                  }
                  if (tracker.mode === "zero") {
                    return { data: null, error: null };
                  }
                  return {
                    data: { id: "row-ok", ...payload },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

async function runCase(label, setup) {
  resetTbdCreateOneshotTerminalStateForTests();
  const tracker = { calls: 0, mode: "ok", lastPayload: null };
  const outcome = await executeTbdCreateOneshotSave({
    url: setup.url ?? STAGING_URL,
    anonKey: "anon-test",
    dryRunPreviewOk: setup.dryRunPreviewOk !== false,
    previewFingerprint: setup.previewFingerprint ?? previewFp,
    currentFingerprint: setup.currentFingerprint ?? previewFp,
    env: setup.env ?? armedEnv(),
    configOptions: { serverArmOkFromSsr: setup.serverArmOkFromSsr !== false },
    deps: {
      preflightClient: setup.preflight ?? makePreflight(),
      insertClient: setup.insertClient ?? makeInsertClient(tracker),
      getAuth: setup.getAuth ?? makeAuth(setup.signedIn !== false),
    },
  });
  return { outcome, tracker, calls: getTbdCreateOneshotNetworkCallCountForTests() };
}

{
  const { outcome, tracker } = await runCase("happy", {});
  assert(
    "successful execution write call max 1",
    outcome.ok === true && tracker.calls === 1 && outcome.networkCalls === 1,
    JSON.stringify({ ok: outcome.ok, calls: tracker.calls, network: outcome.networkCalls, err: outcome.errorMessage }),
  );
}

{
  const { outcome, tracker } = await runCase("prod", { url: PRODUCTION_URL });
  assert(
    "production rejected before INSERT",
    outcome.ok === false && tracker.calls === 0,
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("staging typo", {
    url: "https://kmjqppxjdnwwrtaeqjtX.supabase.co",
  });
  assert(
    "staging ref mismatch rejected before INSERT",
    outcome.ok === false && tracker.calls === 0,
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("client only", {
    env: armedEnv({ [SERVER_ARM]: "false" }),
    serverArmOkFromSsr: false,
  });
  assert(
    "server arm side-only rejected (client alone)",
    outcome.ok === false && tracker.calls === 0,
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("server only", {
    env: armedEnv({ [CLIENT_ARM]: undefined }),
    serverArmOkFromSsr: true,
  });
  assert(
    "client arm side-only rejected (server alone)",
    outcome.ok === false && tracker.calls === 0,
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("schema fail", {
    preflight: makePreflight({ schemaOk: false }),
  });
  assert(
    "schema probe failure → INSERT 0",
    outcome.ok === false &&
      tracker.calls === 0 &&
      outcome.errorCode === "schema_probe_failed",
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("total drift", {
    preflight: makePreflight({ total: 80 }),
  });
  assert(
    "total drift → INSERT 0",
    outcome.ok === false && tracker.calls === 0 && /total/.test(outcome.errorMessage || ""),
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("mio drift", {
    preflight: makePreflight({ mio: 1 }),
  });
  assert(
    "Mio drift → INSERT 0",
    outcome.ok === false && tracker.calls === 0 && /mio/i.test(outcome.errorMessage || ""),
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("tbd drift", {
    preflight: makePreflight({ tbd: 1 }),
  });
  assert(
    "existing TBD drift → INSERT 0",
    outcome.ok === false && tracker.calls === 0 && /tbd/i.test(outcome.errorMessage || ""),
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("legacy exists", {
    preflight: makePreflight({ legacy: 1 }),
  });
  assert(
    "legacy target exists → INSERT 0",
    outcome.ok === false && tracker.calls === 0 && /legacy/i.test(outcome.errorMessage || ""),
    outcome.errorMessage,
  );
}

{
  const { outcome, tracker } = await runCase("unsigned", { signedIn: false });
  assert(
    "unsigned actor → INSERT 0",
    outcome.ok === false &&
      tracker.calls === 0 &&
      outcome.errorCode === "auth_session_missing",
    outcome.errorMessage,
  );
}

{
  resetTbdCreateOneshotTerminalStateForTests();
  // Prove deps cannot skip preflight: omit preflightClient but provide insert — default would need network;
  // instead inject failing schema only already covered. Assert source has no offline skip.
  assert(
    "runtime preflight skip不可",
    !/offline\s*\?:/.test(save) && /probeDateStatusColumn/.test(save),
  );
}

{
  resetTbdCreateOneshotTerminalStateForTests();
  const tracker = { calls: 0, mode: "timeout", lastPayload: null };
  const first = await executeTbdCreateOneshotSave({
    url: STAGING_URL,
    anonKey: "anon",
    dryRunPreviewOk: true,
    previewFingerprint: previewFp,
    currentFingerprint: previewFp,
    env: armedEnv(),
    configOptions: { serverArmOkFromSsr: true },
    deps: {
      preflightClient: makePreflight(),
      insertClient: makeInsertClient(tracker),
      getAuth: makeAuth(true),
    },
  });
  assert(
    "timeout/ambiguous keeps terminal",
    first.ok === false &&
      (first.ambiguous === true || getTbdCreateOneshotTerminalState() === "ambiguous") &&
      tracker.calls === 1,
    JSON.stringify({ code: first.errorCode, terminal: getTbdCreateOneshotTerminalState() }),
  );
  const second = await executeTbdCreateOneshotSave({
    url: STAGING_URL,
    anonKey: "anon",
    dryRunPreviewOk: true,
    previewFingerprint: previewFp,
    currentFingerprint: previewFp,
    env: armedEnv(),
    configOptions: { serverArmOkFromSsr: true },
    deps: {
      preflightClient: makePreflight(),
      insertClient: makeInsertClient(tracker),
      getAuth: makeAuth(true),
    },
  });
  assert(
    "ambiguous result blocks retry",
    second.ok === false &&
      second.errorCode === "oneshot_already_consumed" &&
      tracker.calls === 1,
    JSON.stringify({ code: second.errorCode, calls: tracker.calls }),
  );
}

assert(
  "direct bypass不可 — public API is execute only",
  /export async function executeTbdCreateOneshotSave/.test(save) &&
    !/export async function insertTbdCreate/.test(save) &&
    !/export async function insertTbdCreate/.test(insert),
);

assert(
  "arms-OFF browser writeRequests=[] documented",
  /writeRequests:\s*\[\]|writeRequests `\[\]`/.test(doc),
);

const check = spawnSync("git", ["diff", "--check"], { cwd: REPO_ROOT, encoding: "utf8" });
assert("git diff --check clean", check.status === 0 && !check.stdout.trim(), check.stdout);

const cachedCheck = spawnSync("git", ["diff", "--cached", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "git diff --cached --check clean",
  cachedCheck.status === 0 && !cachedCheck.stdout.trim(),
  cachedCheck.stdout,
);

const baseline = spawnSync(
  "node",
  ["scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert("Gosaki HTML baseline exit 0", baseline.status === 0, baseline.stderr || baseline.stdout);

console.log(`\nRESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
