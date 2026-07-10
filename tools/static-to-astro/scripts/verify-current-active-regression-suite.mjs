#!/usr/bin/env node
/**
 * G-20u15 — Current active regression suite.
 *
 * Runs G-20u2–u14 + G-20u17–u18 site-aware active verifiers in sequence.
 * No FTP / deploy / DB write / package regen.
 *
 * Usage:
 *   node scripts/verify-current-active-regression-suite.mjs
 *   node scripts/verify-current-active-regression-suite.mjs --list
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const PHASE = "G-20u15-current-active-regression-suite";
const BASE_COMMIT = "3ae56b1";

/** @type {ReadonlyArray<{ id: string; label: string; script: string; area: string }>} */
export const CURRENT_ACTIVE_VERIFIERS = [
  { id: "G-20u2", label: "Site registry & build profile", script: "verify-g20u2-site-registry-build-profile-foundation.mjs", area: "registry" },
  { id: "G-20u3", label: "Build site package generic CLI", script: "verify-g20u3-build-site-package-generic-cli.mjs", area: "build" },
  { id: "G-20u4", label: "Verify site package generic CLI", script: "verify-g20u4-verify-site-package-generic-cli.mjs", area: "verify" },
  { id: "G-20u5", label: "Site package npm convenience & freshness flow", script: "verify-g20u5-site-package-npm-convenience-and-freshness-flow.mjs", area: "npm-flow" },
  { id: "G-20u6", label: "Astro generator hook registry", script: "verify-g20u6-astro-generator-hook-registry.mjs", area: "hooks" },
  { id: "G-20u7", label: "Convert pipeline siteKey propagation", script: "verify-g20u7-convert-pipeline-sitekey-propagation.mjs", area: "convert" },
  { id: "G-20u8", label: "Pilot noop hooks dry-run", script: "verify-g20u8-second-site-noop-hooks-pilot-dry-run.mjs", area: "pilot-noop" },
  { id: "G-20u9", label: "Pilot full package build + verify", script: "verify-g20u9-pilot-sample-static-full-package-build-verify.mjs", area: "pilot-full" },
  { id: "G-20u10", label: "Site-aware package freshness CLI", script: "verify-g20u10-site-aware-package-freshness-cli.mjs", area: "freshness" },
  { id: "G-20u11", label: "Site-aware preflight scripts", script: "verify-g20u11-site-aware-preflight-scripts.mjs", area: "preflight" },
  { id: "G-20u12a", label: "Manual-upload README/CHECKLIST preflight", script: "verify-g20u12-manual-upload-readme-checklist-preflight-integration.mjs", area: "readme-preflight" },
  { id: "G-20u12b", label: "Pilot build ENOTEMPTY fix", script: "verify-g20u12-pilot-build-enotempty-fix.mjs", area: "build-safety" },
  { id: "G-20u13", label: "Site-aware Supabase loaders", script: "verify-g20u13-site-aware-supabase-loaders.mjs", area: "supabase-read" },
  { id: "G-20u14", label: "URL-to-staging pipeline site-aware", script: "verify-g20u14-url-to-staging-pipeline-site-aware.mjs", area: "url-staging" },
  { id: "G-20u17", label: "Post-build verifier registry", script: "verify-g20u17-post-build-verifier-registry.mjs", area: "post-build-verify" },
  { id: "G-20u18", label: "package.json / CLI default decoupling", script: "verify-g20u18-package-json-cli-default-decoupling.mjs", area: "cli-defaults" },
];

/**
 * Historical / phase-specific verifiers — not part of current active gate.
 * Run individually when investigating legacy behavior or old HEAD snapshots.
 */
export const HISTORICAL_VERIFIERS = [
  { id: "G-20u1", label: "Hardcode generalization audit (planning doc)", script: "verify-g20u1-gosaki-hardcode-generalization-audit.mjs" },
  { id: "G-7b+", label: "URL-to-staging legacy mega-suite (G-7–G-9 markers)", script: "verify-url-to-staging-pipeline.mjs" },
  { id: "G-20t3", label: "Package upload safety hardening (HEAD-pinned regen)", script: "verify-g20t3-staging-prod-package-upload-safety-hardening.mjs" },
  { id: "G-20t4", label: "Production profile full regen dry-run (HEAD-pinned)", script: "verify-g20t4-gosaki-production-profile-full-regen-dry-run.mjs" },
  { id: "G-20t5", label: "Staging profile current-head regen (HEAD-pinned)", script: "verify-g20t5-gosaki-staging-profile-current-head-regen-dry-run.mjs" },
  { id: "G-20t6", label: "Package freshness gate (phase snapshot)", script: "verify-g20t6-package-freshness-gate.mjs" },
];

/**
 * @param {string} script
 */
function runVerifierScript(script) {
  const scriptPath = path.join(TOOL_ROOT, "scripts", script);
  if (!fs.existsSync(scriptPath)) {
    return { ok: false, exitCode: 127, summary: "script missing", stdout: "", stderr: `missing: ${script}` };
  }

  const started = Date.now();
  const result = spawnSync("node", [scriptPath], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env },
  });
  const elapsedMs = Date.now() - started;
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = `${stdout}\n${stderr}`;
  const summaryMatch = combined.match(/(\d+) passed, (\d+) failed/);
  const summary = summaryMatch ? `${summaryMatch[1]} passed, ${summaryMatch[2]} failed` : `exit ${result.status ?? 1}`;

  return {
    ok: result.status === 0,
    exitCode: result.status ?? 1,
    summary,
    elapsedMs,
    stdout,
    stderr,
  };
}

function printList() {
  console.log(`${PHASE} — current active verifiers (${CURRENT_ACTIVE_VERIFIERS.length})`);
  for (const entry of CURRENT_ACTIVE_VERIFIERS) {
    console.log(`  ${entry.id.padEnd(8)} ${entry.area.padEnd(16)} scripts/${entry.script}`);
  }
  console.log(`\nHistorical (excluded — ${HISTORICAL_VERIFIERS.length}):`);
  for (const entry of HISTORICAL_VERIFIERS) {
    console.log(`  ${entry.id.padEnd(8)} scripts/${entry.script}`);
  }
}

function main() {
  if (process.argv.includes("--list")) {
    printList();
    process.exit(0);
  }

  const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
  const headShort = head.stdout?.trim() ?? "(unknown)";
  if (headShort !== BASE_COMMIT) {
    console.log(`NOTE HEAD is ${headShort} (suite base ${BASE_COMMIT}) — non-blocking`);
  } else {
    console.log(`HEAD is ${BASE_COMMIT}`);
  }

  console.log(`\n${PHASE}`);
  console.log("Scope: G-20u2–u14 + G-20u17–u18 active verifiers · dry-run / module tests only");
  console.log("Excluded: FTP · deploy · DB write · package regen · historical HEAD-pinned verifiers\n");

  /** @type {Array<{ entry: typeof CURRENT_ACTIVE_VERIFIERS[number]; ok: boolean; summary: string; elapsedMs: number }>} */
  const results = [];

  for (const entry of CURRENT_ACTIVE_VERIFIERS) {
    process.stdout.write(`RUN  ${entry.id} ${entry.label} ... `);
    const run = runVerifierScript(entry.script);
    results.push({ entry, ok: run.ok, summary: run.summary, elapsedMs: run.elapsedMs });
    console.log(run.ok ? `PASS (${run.summary}, ${run.elapsedMs}ms)` : `FAIL (${run.summary}, ${run.elapsedMs}ms)`);
    if (!run.ok) {
      const tail = `${run.stdout}\n${run.stderr}`.trim().split("\n").slice(-8).join("\n");
      if (tail) console.error(tail);
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log("\n--- Summary ---");
  console.log(`${"ID".padEnd(8)} ${"Area".padEnd(16)} Status  Detail`);
  for (const { entry, ok, summary, elapsedMs } of results) {
    console.log(
      `${entry.id.padEnd(8)} ${entry.area.padEnd(16)} ${(ok ? "PASS" : "FAIL").padEnd(6)}  ${summary} (${elapsedMs}ms)`,
    );
  }

  console.log(`\n${PHASE}: ${passed}/${results.length} verifiers passed, ${failed} failed`);
  console.log(`Stale on-disk packages: expected — freshness/preflight verifiers use NOTE/skip or STOP-expected assertions`);
  console.log(`Historical verifiers: run individually — see docs/current-active-regression-suite.md`);

  process.exit(failed > 0 ? 1 : 0);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main();
}
