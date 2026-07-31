/**
 * CMS Core v2 — HubSpot / Contact provider completion audit (read-only / offline).
 *
 * npm: verify:cms-core-v2-external-form-provider-hubspot-completion-audit
 * No runtime edits · no network · no form submit · no package / FTP / DB.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const TEMP_OUT_REL = "output/_cms-core-v2-hubspot-completion-audit-tmp";

const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-external-form-provider-hubspot-completion-audit.md",
);
const HOOK = path.join(__dirname, "lib/gosaki-contact-hubspot-embed.mjs");
const ADAPTER = path.join(__dirname, "lib/gosaki-site-generator-hooks-adapter.mjs");
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");

const HUBSPOT_CONFIG = path.join(
  TOOL_ROOT,
  "config/sites/gosaki-piano-contact-hubspot.json",
);
const FIXTURE_EMBED = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/contact-hubspot-embed.html",
);
const FIXTURE_PAGE = path.join(
  TOOL_ROOT,
  "fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/contact-page.astro",
);

/** Locked fingerprints from completion audit doc (immutable SoT). */
const EXPECTED_SHA256 = {
  [HUBSPOT_CONFIG]:
    "0e952ad169e8ee2aa6c7c422b958e52ab9c9fee4d3e26f992e9a51139ff37c9a",
  [FIXTURE_EMBED]:
    "8fae75c8d447d9380211e159e2840b4bd9ad5759c3f07c2e371fa7a5c69030e9",
  [FIXTURE_PAGE]:
    "d77bc79dc1a20a71db34c62da08913e9a8396f072f66b00a46e0eb7ecb4475f2",
};

const REQUIRED_VERIFIERS = [
  "verify-cms-core-v2-external-form-provider-contract-validator.mjs",
  "verify-cms-core-v2-external-form-provider-external-link.mjs",
  "verify-cms-core-v2-external-form-provider-google-forms.mjs",
  "verify-cms-core-v2-external-form-provider-hubspot-renderer.mjs",
  "verify-cms-core-v2-external-form-provider-hubspot-shadow-compare.mjs",
  "verify-cms-core-v2-external-form-provider-hubspot-adapter-switch.mjs",
  "verify-cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit.mjs",
  "verify-cms-core-v2-external-form-provider-hubspot-completion-audit.mjs",
];

const REQUIRED_SUITE_IDS = [
  "external-form-provider-contract-validator",
  "external-form-provider-external-link",
  "external-form-provider-google-forms",
  "external-form-provider-hubspot-renderer",
  "external-form-provider-hubspot-shadow-compare",
  "external-form-provider-hubspot-adapter-switch",
  "external-form-provider-hubspot-legacy-cleanup-audit",
  "external-form-provider-hubspot-completion-audit",
];

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

function sha256File(abs) {
  return createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
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
fs.writeFileSync(path.join(tempOut, ".keep"), "hubspot-completion-audit-tmp\n", "utf8");

assert("completion audit doc exists", fs.existsSync(DOC));
const doc = fs.readFileSync(DOC, "utf8");
assert(
  "doc phase id",
  /cms-core-v2-external-form-provider-hubspot-completion-audit/.test(doc),
);
assert(
  "doc verdict COMPLETE WITH NON-BLOCKING",
  /COMPLETE WITH NON-BLOCKING ITEMS/.test(doc),
);
assert("doc genuine blocker none", /CONTACT_HUBSPOT_GENUINE_BLOCKER: none/.test(doc));
assert(
  "doc PC/375 browser baseline PASS",
  /PC \/ 375px browser baseline \| \*\*COMPLETE \/ PASS\*\*/.test(doc) &&
    /CONTACT_HUBSPOT_PC375_BROWSER_BASELINE: PASS/.test(doc),
);
assert(
  "doc non-blocking ops is submit E2E recheck only",
  /CONTACT_HUBSPOT_NON_BLOCKING_OPS: submit-e2e-recheck-after-core-switch/.test(doc) &&
    /Core切替後の HubSpot submit E2E 再実施/.test(doc) &&
    !/Formal PC\/375 operator sign-off/.test(doc),
);
assert(
  "doc package/FTP classified as staging deployment task",
  /staging deployment \/ release task/.test(doc),
);
assert(
  "doc next Primary Mio live SELECT",
  /cms-core-v2-mio-supabase-live-select-only-pilot/.test(doc),
);
assert("doc RUNTIME_CHANGED false", /RUNTIME_CHANGED: false/.test(doc));
assert("doc FORM_SUBMIT_EXECUTED false", /FORM_SUBMIT_EXECUTED: false/.test(doc));
assert(
  "doc no trailing spaces on lines",
  doc.split(/\n/).every((line) => line === line.replace(/[ \t]+$/, "")),
);

const hookSrc = fs.readFileSync(HOOK, "utf8");
const adapterSrc = fs.readFileSync(ADAPTER, "utf8");
assert(
  "apply uses ViaCore only",
  /embedHtml\s*=\s*buildGosakiContactHubspotEmbedHtmlViaCore\(/.test(hookSrc) &&
    !/embedHtml\s*=\s*buildGosakiContactHubspotEmbedHtml\(/.test(hookSrc),
);
assert(
  "legacy builder still exported (oracle)",
  /export function buildGosakiContactHubspotEmbedHtml\(/.test(hookSrc),
);
assert(
  "adapter has no legacy builder symbol",
  !/buildGosakiContactHubspotEmbedHtml/.test(adapterSrc),
);

for (const [abs, expected] of Object.entries(EXPECTED_SHA256)) {
  const got = sha256File(abs);
  assert(
    `sha256 ${path.relative(TOOL_ROOT, abs)}`,
    got === expected,
    `got ${got}`,
  );
}

const suiteSrc = fs.readFileSync(SUITE, "utf8");
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
for (const script of REQUIRED_VERIFIERS) {
  const abs = path.join(__dirname, script);
  assert(`verifier exists ${script}`, fs.existsSync(abs));
}
for (const id of REQUIRED_SUITE_IDS) {
  assert(`Safety Suite registers ${id}`, suiteSrc.includes(`id: "${id}"`));
}
assert(
  "npm script hubspot-completion-audit",
  typeof pkg.scripts["verify:cms-core-v2-external-form-provider-hubspot-completion-audit"] ===
    "string",
);

cleanupTemp();
assert("temp cleanup", !fs.existsSync(path.join(TOOL_ROOT, TEMP_OUT_REL)));

function runNpm(script) {
  return spawnSync("npm", ["run", script], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env, CMS_CORE_V2_VERIFIER_LIVE_SOFT: "false" },
  });
}

const el = runNpm("verify:cms-core-v2-external-form-provider-external-link");
assert("external-link regression", el.status === 0, el.stderr?.slice(0, 300));

const gf = runNpm("verify:cms-core-v2-external-form-provider-google-forms");
assert("google-forms regression", gf.status === 0, gf.stderr?.slice(0, 300));

const hs = runNpm("verify:cms-core-v2-external-form-provider-hubspot-renderer");
assert("hubspot-renderer regression", hs.status === 0, hs.stderr?.slice(0, 300));

const shadow = runNpm("verify:cms-core-v2-external-form-provider-hubspot-shadow-compare");
assert("hubspot-shadow-compare regression", shadow.status === 0, shadow.stderr?.slice(0, 300));

const adapt = runNpm("verify:cms-core-v2-external-form-provider-hubspot-adapter-switch");
assert("hubspot-adapter-switch regression", adapt.status === 0, adapt.stderr?.slice(0, 300));

const legacy = runNpm("verify:cms-core-v2-external-form-provider-hubspot-legacy-cleanup-audit");
assert("hubspot-legacy-cleanup-audit regression", legacy.status === 0, legacy.stderr?.slice(0, 300));

const baseline = runNpm("verify:cms-core-v2-gosaki-site-generator-hooks-html-baseline");
assert(
  "Gosaki HTML baseline 81 PASS",
  baseline.status === 0 && /81 passed/i.test(baseline.stdout || ""),
  baseline.stderr?.slice(0, 400) || (baseline.stdout || "").slice(-300),
);

console.log("");
console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
