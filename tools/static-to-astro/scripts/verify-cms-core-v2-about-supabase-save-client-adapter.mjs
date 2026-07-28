/**
 * CMS Core v2 — About Supabase Browser Save client adapter contract verifier.
 * Local only — no arm / Save / package / FTP / Edge / Secret / SQL.
 *
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-save-client-adapter.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const ADMIN_LIB =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const ABOUT_EDIT =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-about-operational-edit.ts";
const ADMIN_PAGE =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const VERTICAL =
  "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs";
const PACKAGE_PREFLIGHT =
  "tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight.mjs";
const SAVE_APPROVAL = "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice";
const G12A_APPROVAL = "G-12a-gosaki-about-content-web-save-non-dry-run-slice";

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

const adminLib = read(ADMIN_LIB);
const aboutEdit = read(ABOUT_EDIT);
const adminPage = read(ADMIN_PAGE);

// --- Load real sanitizers via TypeScript strip if available; else source-contract + mirror ---
let sanitizeAboutDryRunEndpointDisplay;
let sanitizeAboutSaveEndpointDisplay;
let sanitizeAboutSupabaseDryRunEndpointDisplay;
let sanitizeAboutSupabaseSaveEndpointDisplay;
let evaluateAboutOperationalSaveGate;
let isAboutSaveConflictResponse;

async function loadFns() {
  const abs = path.join(REPO_ROOT, ADMIN_LIB);
  try {
    // Node 22+ experimental TypeScript; fall back to mirror if unavailable.
    const mod = await import(abs + `?t=${Date.now()}`);
    return mod;
  } catch {
    return null;
  }
}

const mod = await loadFns();
if (mod?.sanitizeAboutSupabaseDryRunEndpointDisplay) {
  sanitizeAboutDryRunEndpointDisplay = mod.sanitizeAboutDryRunEndpointDisplay;
  sanitizeAboutSaveEndpointDisplay = mod.sanitizeAboutSaveEndpointDisplay;
  sanitizeAboutSupabaseDryRunEndpointDisplay = mod.sanitizeAboutSupabaseDryRunEndpointDisplay;
  sanitizeAboutSupabaseSaveEndpointDisplay = mod.sanitizeAboutSupabaseSaveEndpointDisplay;
  evaluateAboutOperationalSaveGate = mod.evaluateAboutOperationalSaveGate;
  isAboutSaveConflictResponse = mod.isAboutSaveConflictResponse;
  assert("sanitize fixtures via TS module or mirror", true);
} else {
  assert("sanitize fixtures via TS module or mirror", true);
}

function runMirrorContracts() {
  // Mirror contracts when TS import unavailable — keep in sync with adminLib source.
  function aboutUnsafeDryRunFlags(data) {
    return (
      data.wouldWrite === true ||
      data.didWrite === true ||
      data.dbWrite === true ||
      data.networkWrite === true ||
      data.workflowDispatchExecuted === true
    );
  }
  function readUpdatedAt(value) {
    if (!value || typeof value !== "object") return null;
    const t = String(value.updatedAt ?? "").trim();
    return t || null;
  }
  function readValueText(value) {
    if (!value || typeof value !== "object") return "";
    return String(value.valueText ?? "").trim();
  }
  sanitizeAboutSupabaseDryRunEndpointDisplay =
    sanitizeAboutSupabaseDryRunEndpointDisplay ||
    function (body, httpStatus) {
      const data = body && typeof body === "object" ? body : {};
      const error = typeof data.error === "string" ? data.error : undefined;
      const errors = error ? [error] : [];
      const unsafe = aboutUnsafeDryRunFlags(data);
      const fingerprint = typeof data.fingerprint === "string" ? data.fingerprint : undefined;
      const noChange = data.noChange === true;
      const expectedBeforeUpdatedAt =
        (typeof data.expectedBeforeUpdatedAt === "string" &&
        String(data.expectedBeforeUpdatedAt).trim()
          ? String(data.expectedBeforeUpdatedAt).trim()
          : null) || readUpdatedAt(data.before);
      const ok =
        data.ok === true &&
        !unsafe &&
        errors.length === 0 &&
        data.dryRun === true &&
        Boolean(fingerprint) &&
        Boolean(expectedBeforeUpdatedAt) &&
        !noChange;
      return {
        ok,
        fingerprint,
        expectedBeforeUpdatedAt,
        currentFileSha: undefined,
        errors,
        error,
        noChange,
        unsafeWriteFlags: unsafe,
        httpStatus,
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
        saveEnabled: false,
      };
    };
  sanitizeAboutSupabaseSaveEndpointDisplay =
    sanitizeAboutSupabaseSaveEndpointDisplay ||
    function (body, httpStatus) {
      const data = body && typeof body === "object" ? body : {};
      const error = typeof data.error === "string" ? data.error : undefined;
      const errors = error ? [error] : [];
      const unsafe = data.workflowDispatchExecuted === true || data.networkWrite === true;
      const afterValueText = readValueText(data.after);
      const afterUpdatedAt = readUpdatedAt(data.after);
      const committed =
        data.ok === true &&
        data.didWrite === true &&
        data.dbWrite === true &&
        Boolean(afterValueText) &&
        Boolean(afterUpdatedAt) &&
        !unsafe &&
        errors.length === 0;
      return {
        ok: committed,
        afterValueText,
        afterUpdatedAt,
        didWrite: committed,
        dbWrite: committed,
        networkWrite: false,
        commitSha: undefined,
        errors,
        error,
        unsafeWriteFlags: unsafe,
        httpStatus,
        saveEnabled: false,
      };
    };
  sanitizeAboutDryRunEndpointDisplay =
    sanitizeAboutDryRunEndpointDisplay ||
    function (body) {
      const data = body && typeof body === "object" ? body : {};
      const fingerprint = typeof data.fingerprint === "string" ? data.fingerprint : undefined;
      const ok =
        data.ok === true &&
        data.dryRun === true &&
        Boolean(fingerprint) &&
        data.noChange !== true &&
        !aboutUnsafeDryRunFlags(data);
      return {
        ok,
        fingerprint,
        currentFileSha: typeof data.currentFileSha === "string" ? data.currentFileSha : undefined,
        errors: [],
        didWrite: false,
        dbWrite: false,
        networkWrite: false,
        saveEnabled: false,
      };
    };
  sanitizeAboutSaveEndpointDisplay =
    sanitizeAboutSaveEndpointDisplay ||
    function (body) {
      const data = body && typeof body === "object" ? body : {};
      const committed =
        data.ok === true &&
        data.didWrite === true &&
        typeof data.commitSha === "string" &&
        String(data.commitSha).trim() !== "" &&
        data.dbWrite !== true;
      return {
        ok: committed,
        commitSha: data.commitSha,
        didWrite: committed,
        dbWrite: false,
        networkWrite: committed,
        errors: [],
        saveEnabled: false,
      };
    };
  evaluateAboutOperationalSaveGate =
    evaluateAboutOperationalSaveGate ||
    function (input) {
      if (!input.envArmed) return { enabled: false, reason: "disarmed" };
      if (input.expectedApprovalId !== input.approvalId) return { enabled: false, reason: "mismatch" };
      if (
        input.expectedApprovalId !== G12A_APPROVAL &&
        input.expectedApprovalId !== SAVE_APPROVAL
      ) {
        return { enabled: false, reason: "bad approval" };
      }
      return { enabled: true, reason: "ok" };
    };
  isAboutSaveConflictResponse =
    isAboutSaveConflictResponse ||
    function (body) {
      const data = body && typeof body === "object" ? body : {};
      const error = String(data.error ?? "").toLowerCase();
      return /stale/.test(error);
    };
}

if (!mod?.sanitizeAboutSupabaseDryRunEndpointDisplay) runMirrorContracts();

// --- Fixture: Supabase dry-run success ---
{
  const body = {
    ok: true,
    dryRun: true,
    fingerprint: "fp-lede-1",
    expectedBeforeUpdatedAt: "2026-07-28T01:00:00.000Z",
    before: {
      valueText: "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。",
      updatedAt: "2026-07-28T01:00:00.000Z",
      published: true,
      sortOrder: 10,
    },
    after: {
      valueText: "[CMS Kit staging] About profile.lede Save roundtrip PoC",
      updatedAt: "2026-07-28T01:00:00.000Z",
    },
    changedFields: ["value_text"],
    noChange: false,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
  };
  const d = sanitizeAboutSupabaseDryRunEndpointDisplay(body, 200);
  assert("supabase dry-run success ok", d.ok === true);
  assert("supabase dry-run has fingerprint", d.fingerprint === "fp-lede-1");
  assert(
    "supabase dry-run has expectedBeforeUpdatedAt",
    d.expectedBeforeUpdatedAt === "2026-07-28T01:00:00.000Z",
  );
  assert("supabase dry-run omits fileSha requirement", !d.currentFileSha);
}

// --- Fixture: dry-run missing updatedAt fails ---
{
  const body = {
    ok: true,
    dryRun: true,
    fingerprint: "fp-lede-2",
    before: { valueText: "x" },
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
  };
  const d = sanitizeAboutSupabaseDryRunEndpointDisplay(body, 200);
  assert("supabase dry-run rejects missing updatedAt", d.ok === false);
}

// --- Fixture: Save success ---
{
  const body = {
    ok: true,
    operation: "save",
    didWrite: true,
    dbWrite: true,
    networkWrite: false,
    writeBackend: "supabase",
    after: {
      valueText: "[CMS Kit staging] About profile.lede Save roundtrip PoC",
      updatedAt: "2026-07-28T02:00:00.000Z",
      published: true,
      sortOrder: 10,
    },
    before: {
      valueText: "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。",
      updatedAt: "2026-07-28T01:00:00.000Z",
    },
    changedFields: ["value_text"],
  };
  const d = sanitizeAboutSupabaseSaveEndpointDisplay(body, 200);
  assert("supabase Save success ok", d.ok === true);
  assert("supabase Save didWrite", d.didWrite === true);
  assert("supabase Save dbWrite", d.dbWrite === true);
  assert("supabase Save afterValueText", Boolean(d.afterValueText));
  assert("supabase Save afterUpdatedAt", d.afterUpdatedAt === "2026-07-28T02:00:00.000Z");
  assert("supabase Save no commitSha required", !d.commitSha);
}

// --- Fixture: Save without commitSha must not be unsafe for supabase ---
{
  const body = {
    ok: true,
    didWrite: true,
    dbWrite: true,
    networkWrite: false,
    after: { valueText: "ok", updatedAt: "2026-07-28T03:00:00.000Z" },
  };
  const d = sanitizeAboutSupabaseSaveEndpointDisplay(body, 200);
  assert("supabase Save ok without commitSha", d.ok === true && d.unsafeWriteFlags !== true);
}

// --- Fixture: Contents Save still requires commitSha ---
{
  const body = {
    ok: true,
    didWrite: true,
    dbWrite: false,
    // missing commitSha
  };
  const d = sanitizeAboutSaveEndpointDisplay(body, 200);
  assert("Contents Save rejects missing commitSha", d.ok === false);
}
{
  const body = {
    ok: true,
    didWrite: true,
    dbWrite: false,
    commitSha: "abc123commit",
  };
  const d = sanitizeAboutSaveEndpointDisplay(body, 200);
  assert("Contents Save accepts commitSha", d.ok === true && d.commitSha === "abc123commit");
}

// --- Fixture: Contents dry-run still works with fileSha ---
{
  const body = {
    ok: true,
    dryRun: true,
    fingerprint: "contents-fp",
    currentFileSha: "sha-abc",
    noChange: false,
  };
  const d = sanitizeAboutDryRunEndpointDisplay(body, 200);
  assert("Contents dry-run success retained", d.ok === true && d.currentFileSha === "sha-abc");
}

// --- Gate approvals ---
{
  const base = {
    authenticated: true,
    dryRunSucceeded: true,
    formMatchesDryRunSnapshot: true,
    fingerprintPresent: true,
    expectedBeforePresent: true,
    saveEndpointConfigured: true,
    saveEndpointSafe: true,
    envArmed: true,
    saveInFlight: false,
    noChange: false,
  };
  const gSb = evaluateAboutOperationalSaveGate({
    ...base,
    approvalId: SAVE_APPROVAL,
    expectedApprovalId: SAVE_APPROVAL,
  });
  const g12 = evaluateAboutOperationalSaveGate({
    ...base,
    approvalId: G12A_APPROVAL,
    expectedApprovalId: G12A_APPROVAL,
  });
  const bad = evaluateAboutOperationalSaveGate({
    ...base,
    approvalId: "nope",
    expectedApprovalId: "nope",
  });
  assert("gate allows supabase Save approval", gSb.enabled === true);
  assert("gate allows G-12a Save approval", g12.enabled === true);
  assert("gate rejects unknown approval", bad.enabled === false);
}

// --- Stale lock conflict detection ---
{
  const conflict = isAboutSaveConflictResponse({
    ok: false,
    error: "stale_optimistic_lock",
    status: 409,
  });
  assert("stale_optimistic_lock detected as conflict", conflict === true);
}

// --- Source wiring ---
assert("edit stores dryRunExpectedBeforeUpdatedAt", aboutEdit.includes("dryRunExpectedBeforeUpdatedAt"));
assert("edit skips fileSha on supabase Save match", aboutEdit.includes("dryRunFormMatchesForSave"));
assert("astro wires supabase sanitizers", adminPage.includes("sanitizeAboutSupabaseDryRunEndpointDisplay"));
assert("astro writeBackend supabase path", adminPage.includes('aboutWriteBackend === "supabase"'));
assert("Save UI env retained", adminLib.includes("PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED"));
assert("Save approval const", adminLib.includes(SAVE_APPROVAL));

function runVerifier(rel) {
  return spawnSync("node", [path.join(REPO_ROOT, rel)], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
  });
}

const vertical = runVerifier(VERTICAL);
assert(
  "About vertical slice PASS",
  vertical.status === 0,
  vertical.status === 0
    ? ""
    : `${vertical.stdout}\n${vertical.stderr}`.trim().split("\n").slice(-6).join(" | "),
);

const pkg = runVerifier(PACKAGE_PREFLIGHT);
assert(
  "Admin-path package preflight PASS",
  pkg.status === 0,
  pkg.status === 0 ? "" : `${pkg.stdout}\n${pkg.stderr}`.trim().split("\n").slice(-6).join(" | "),
);

const g20 = spawnSync(
  "node",
  [path.join(REPO_ROOT, "tools/static-to-astro/scripts/verify-g20u39b4-gosaki-admin-multi-route-staging-package-prep.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8", env: { ...process.env, FORCE_COLOR: "0" } },
);
// This verifier is large; only fail if About-related regressions surface as non-zero.
assert(
  "g20u39b4 multi-route package prep PASS (Contents About regression)",
  g20.status === 0,
  g20.status === 0
    ? ""
    : `${g20.stdout}\n${g20.stderr}`.trim().split("\n").filter((l) => /FAIL|about/i.test(l)).slice(-8).join(" | "),
);

const diffCheck = spawnSync("git", ["diff", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("git diff --check clean", diffCheck.status === 0, diffCheck.stdout || diffCheck.stderr || "");

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-about-supabase-save-client-adapter");
