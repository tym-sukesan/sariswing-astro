/**
 * CMS Core v2 — HubSpot legacy cleanup audit (read-only / offline).
 *
 * Confirms legacy builder is unused at runtime, still present as test oracle,
 * and that apply uses Core ViaCore only. Does not delete or edit runtime logic
 * beyond this verifier / docs.
 *
 * npm: verify:cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildGosakiContactHubspotEmbedHtml,
  buildGosakiContactHubspotEmbedHtmlViaCore,
  loadGosakiContactHubspotConfig,
} from "./lib/gosaki-contact-hubspot-embed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const HOOK = path.join(__dirname, "lib/gosaki-contact-hubspot-embed.mjs");
const ADAPTER = path.join(__dirname, "lib/gosaki-site-generator-hooks-adapter.mjs");
const AUDIT_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit.md",
);
const BASELINE_EMBED = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/contact-hubspot-embed.html",
);

const SCRIPT_ROOT = __dirname;

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

/**
 * @param {string} dir
 * @param {(abs: string, rel: string) => void} visit
 */
function walkJs(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "output") continue;
      walkJs(abs, visit);
    } else if (/\.(mjs|js|cjs|ts)$/.test(entry.name)) {
      visit(abs, path.relative(TOOL_ROOT, abs).replace(/\\/g, "/"));
    }
  }
}

assert("audit doc exists", fs.existsSync(AUDIT_DOC));
const auditDoc = fs.readFileSync(AUDIT_DOC, "utf8");
assert(
  "audit doc phase",
  /cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit/.test(auditDoc),
);
assert("audit KEEP_AS_TEST_ORACLE", /KEEP_AS_TEST_ORACLE/.test(auditDoc));
assert("audit LEGACY_BUILDER_DELETE_NOW false", /LEGACY_BUILDER_DELETE_NOW: false/.test(auditDoc));
assert(
  "audit next completion-audit",
  /cms-core-v2-external-form-provider-hubspot-completion-audit/.test(auditDoc),
);
assert("audit runtime unchanged claim", /RUNTIME_CHANGED: false/.test(auditDoc));

const hookSrc = fs.readFileSync(HOOK, "utf8");
const adapterSrc = fs.readFileSync(ADAPTER, "utf8");

assert("legacy builder still defined", /export function buildGosakiContactHubspotEmbedHtml\(/.test(hookSrc));
assert(
  "ViaCore still defined",
  /export function buildGosakiContactHubspotEmbedHtmlViaCore\(/.test(hookSrc),
);
assert(
  "apply uses ViaCore",
  /embedHtml\s*=\s*buildGosakiContactHubspotEmbedHtmlViaCore\(/.test(hookSrc),
);
assert(
  "apply does not assign legacy builder",
  !/embedHtml\s*=\s*buildGosakiContactHubspotEmbedHtml\(/.test(hookSrc),
);
assert(
  "adapter imports apply only (no legacy builder import)",
  /import\s*\{[^}]*applyGosakiContactHubspotEmbed[^}]*\}\s*from\s*["'].*gosaki-contact-hubspot-embed\.mjs["']/.test(
    adapterSrc,
  ) && !/buildGosakiContactHubspotEmbedHtml/.test(adapterSrc),
);

/** Runtime / lib call sites of legacy builder (excluding definition). */
const runtimeLegacyCallers = [];
for (const rel of [
  "scripts/lib/gosaki-contact-hubspot-embed.mjs",
  "scripts/lib/gosaki-site-generator-hooks-adapter.mjs",
  "scripts/lib/astro-generator.mjs",
  "scripts/lib/site-generator-hooks.mjs",
]) {
  const abs = path.join(TOOL_ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const src = fs.readFileSync(abs, "utf8");
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    if (/export function buildGosakiContactHubspotEmbedHtml\(/.test(line)) return;
    if (/Generation \/ apply path must use/.test(line)) return;
    if (/Frozen legacy builder/.test(line)) return;
    if (/buildGosakiContactHubspotEmbedHtmlViaCore/.test(line)) return;
    if (/buildGosakiContactHubspotEmbedHtml\s*\(/.test(line)) {
      runtimeLegacyCallers.push(`${rel}:${i + 1}:${line.trim()}`);
    }
  });
}
assert(
  "no runtime lib call to legacy builder",
  runtimeLegacyCallers.length === 0,
  runtimeLegacyCallers.join(" | "),
);

/** Collect script references outside definition. */
const codeRefs = [];
walkJs(SCRIPT_ROOT, (abs, rel) => {
  if (rel.endsWith("lib/gosaki-contact-hubspot-embed.mjs")) return;
  const src = fs.readFileSync(abs, "utf8");
  if (!src.includes("buildGosakiContactHubspotEmbedHtml")) return;
  // Ignore ViaCore-only mentions
  const withoutVia = src.replace(/buildGosakiContactHubspotEmbedHtmlViaCore/g, "");
  if (!withoutVia.includes("buildGosakiContactHubspotEmbedHtml")) return;
  codeRefs.push(rel);
});

const allowedOracleRefs = new Set([
  "scripts/verify-cms-core-v2-external-form-provider-hubspot-shadow-compare.mjs",
  "scripts/verify-cms-core-v2-external-form-provider-hubspot-adapter-switch.mjs",
  "scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs",
  "scripts/verify-cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit.mjs",
]);

const unexpected = codeRefs.filter((r) => !allowedOracleRefs.has(r));
assert(
  "legacy code refs only in oracle verifiers (+ this audit)",
  unexpected.length === 0,
  unexpected.join(", ") || codeRefs.join(", "),
);
assert(
  "shadow-compare still references legacy",
  codeRefs.includes(
    "scripts/verify-cms-core-v2-external-form-provider-hubspot-shadow-compare.mjs",
  ),
);
assert(
  "adapter-switch still references legacy",
  codeRefs.includes(
    "scripts/verify-cms-core-v2-external-form-provider-hubspot-adapter-switch.mjs",
  ),
);
assert(
  "html-baseline still references legacy",
  codeRefs.includes(
    "scripts/verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline.mjs",
  ),
);

/** Oracle still independent: legacy === fixture === ViaCore */
const loaded = loadGosakiContactHubspotConfig(TOOL_ROOT);
assert("config loads", loaded.ok === true);
const legacy = buildGosakiContactHubspotEmbedHtml(loaded.config);
const viaCore = buildGosakiContactHubspotEmbedHtmlViaCore(loaded.config);
const fixture = fs.readFileSync(BASELINE_EMBED, "utf8");
assert("oracle triple equality", legacy === viaCore && viaCore === fixture);
assert(
  "legacy body uses allowlist concat (not Core import in function)",
  /const allow = GOSAKI_CONTACT_HUBSPOT_ALLOWLIST/.test(hookSrc) &&
    /allow\.scriptSrc/.test(hookSrc),
);

assert("exact ID gate symbol present", /export function validateGosakiContactHubspotConfig/.test(hookSrc));
assert("wrapper selector retained", /#comp-jqbwo704/.test(hookSrc));
assert("wrapper id retained", /gosaki-contact-hubspot-embed/.test(hookSrc));

function runNpm(script) {
  return spawnSync("npm", ["run", script], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env, CMS_CORE_V2_VERIFIER_LIVE_SOFT: "false" },
  });
}

const adapterSwitch = runNpm("verify:cms-core-v2-external-form-provider-hubspot-adapter-switch");
assert("adapter-switch PASS", adapterSwitch.status === 0, adapterSwitch.stderr?.slice(0, 300));

const shadow = runNpm("verify:cms-core-v2-external-form-provider-hubspot-shadow-compare");
assert("shadow-compare PASS", shadow.status === 0, shadow.stderr?.slice(0, 300));

const renderer = runNpm("verify:cms-core-v2-external-form-provider-hubspot-renderer");
assert("hubspot-renderer PASS", renderer.status === 0, renderer.stderr?.slice(0, 300));

const baseline = runNpm("verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline");
assert(
  "Gosaki HTML baseline 81 PASS",
  baseline.status === 0 && /81 passed/i.test(baseline.stdout || ""),
  baseline.stderr?.slice(0, 400) || (baseline.stdout || "").slice(-300),
);

console.log("");
console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
