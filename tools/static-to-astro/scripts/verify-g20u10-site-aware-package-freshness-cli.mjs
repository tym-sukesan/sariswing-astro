/**
 * G-20u10 — Site-aware package freshness CLI verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u10-site-aware-package-freshness-cli.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolvePackageFreshnessTarget } from "./lib/package-freshness-target.mjs";
import {
  validatePackageFreshness,
  verifyPackageUploadFreshness,
} from "./lib/package-upload-safety.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/site-aware-package-freshness-cli.md";
const CLI_REL = "tools/static-to-astro/scripts/verify-package-upload-freshness.mjs";
const MOCK_REL = "tools/static-to-astro/fixtures/package-freshness/stale-manifest.mock.json";
const BASE_COMMIT = "8db175d";

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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function runCli(args, { expectExit = 0 } = {}) {
  return spawnSync("node", ["scripts/verify-package-upload-freshness.mjs", ...args], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    timeout: 60_000,
  });
}

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (head.stdout.trim().startsWith(BASE_COMMIT)) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${head.stdout.trim().slice(0, 12)} (G-20u10 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u10 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("CLI exists", exists(CLI_REL));
assert("package-freshness-target exists", exists("tools/static-to-astro/scripts/lib/package-freshness-target.mjs"));

const doc = read(DOC_REL);
const cliSrc = read(CLI_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u10", doc.includes("G-20u10-site-aware-package-freshness-cli"));
assert("doc gate complete", doc.includes("siteAwarePackageFreshnessCliComplete: true"));
assert("doc --site --profile", doc.includes("--site") && doc.includes("--profile"));
assert("doc legacy profile", /legacy.*profile|profile only/i.test(doc));

assert("CLI --site flag", cliSrc.includes('arg === "--site"'));
assert("CLI resolvePackageFreshnessTarget", cliSrc.includes("resolvePackageFreshnessTarget"));
assert("npm verify:package-freshness generic", packageJson.includes('"verify:package-freshness"'));
assert("npm verify:package-freshness:staging retained", packageJson.includes("verify:package-freshness:staging"));
assert("npm verify:package-freshness:production retained", packageJson.includes("verify:package-freshness:production"));
assert(
  "npm pilot uses --site",
  packageJson.includes("--site pilot-sample-static --profile staging"),
);

const gosakiStaging = resolvePackageFreshnessTarget({
  siteKey: GOSAKI_SITE_KEY,
  profileName: "staging",
  toolRoot: TOOL_ROOT,
});
assert("gosaki staging registry path", gosakiStaging.manualUploadOut === "output/manual-upload/gosaki-piano");
assert("gosaki staging resolution registry", gosakiStaging.resolution === "registry");

const gosakiProduction = resolvePackageFreshnessTarget({
  siteKey: GOSAKI_SITE_KEY,
  profileName: "production",
  toolRoot: TOOL_ROOT,
});
assert(
  "gosaki production path",
  gosakiProduction.manualUploadOut === "output/manual-upload/gosaki-piano-production",
);

const pilotStaging = resolvePackageFreshnessTarget({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  toolRoot: TOOL_ROOT,
});
assert(
  "pilot staging path",
  pilotStaging.manualUploadOut === "output/manual-upload/pilot-sample-static",
);

const legacyStaging = resolvePackageFreshnessTarget({ profileName: "staging", toolRoot: TOOL_ROOT });
assert("legacy staging gosaki path", legacyStaging.manualUploadOut === "output/manual-upload/gosaki-piano");
assert("legacy resolution", legacyStaging.resolution === "legacy-gosaki-profile");

const packageDirTarget = resolvePackageFreshnessTarget({
  packageDir: "output/manual-upload/pilot-sample-static",
  toolRoot: TOOL_ROOT,
});
assert("package-dir resolution", packageDirTarget.resolution === "package-dir");

let unknownSiteThrew = false;
try {
  resolvePackageFreshnessTarget({ siteKey: "not-a-site", profileName: "staging", toolRoot: TOOL_ROOT });
} catch (err) {
  unknownSiteThrew = /Unknown siteKey/i.test(err.message);
}
assert("unknown siteKey throws", unknownSiteThrew);

let pilotProductionThrew = false;
try {
  resolvePackageFreshnessTarget({
    siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
    profileName: "production",
    toolRoot: TOOL_ROOT,
  });
} catch (err) {
  pilotProductionThrew = /missing packageProfiles\.production|Deploy profile "production" missing/i.test(
    err.message,
  );
}
assert("pilot production profile throws", pilotProductionThrew);

const mockManifest = JSON.parse(read(MOCK_REL));
const staleUnit = validatePackageFreshness(mockManifest, head.stdout.trim());
assert("mock manifest stale", staleUnit.fresh === false);

const freshUnit = validatePackageFreshness(
  { ...mockManifest, sourceCommit: head.stdout.trim() },
  head.stdout.trim(),
);
assert("mock manifest fresh at HEAD", freshUnit.fresh === true);

const tmpFresh = fs.mkdtempSync(path.join(os.tmpdir(), "g20u10-fresh-"));
const tmpStale = fs.mkdtempSync(path.join(os.tmpdir(), "g20u10-stale-"));
try {
  fs.writeFileSync(
    path.join(tmpFresh, "MANIFEST.json"),
    `${JSON.stringify({ ...mockManifest, sourceCommit: head.stdout.trim() }, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(tmpStale, "MANIFEST.json"), `${JSON.stringify(mockManifest, null, 2)}\n`);

  assert("tmp fresh verify PASS", verifyPackageUploadFreshness(tmpFresh, REPO_ROOT).ok === true);
  assert("tmp stale verify STOP", verifyPackageUploadFreshness(tmpStale, REPO_ROOT).ok === false);
} finally {
  fs.rmSync(tmpFresh, { recursive: true, force: true });
  fs.rmSync(tmpStale, { recursive: true, force: true });
}

const unknownCli = runCli(["--site", "not-a-site", "--profile", "staging"]);
assert("unknown site CLI exit 1", unknownCli.status === 1);

const pilotProdCli = runCli(["--site", PILOT_SAMPLE_STATIC_SITE_KEY, "--profile", "production"]);
assert("pilot production CLI exit 1", pilotProdCli.status === 1);

const registryCli = runCli(["--site", PILOT_SAMPLE_STATIC_SITE_KEY, "--profile", "staging"]);
assert("pilot registry CLI runs", registryCli.status === 0 || registryCli.status === 1);
assert("registry CLI shows siteKey", registryCli.stdout.includes("siteKey: pilot-sample-static"));
assert("registry CLI shows resolution registry", registryCli.stdout.includes("resolution: registry"));

const packageDirCli = runCli([
  "--package-dir",
  "output/manual-upload/pilot-sample-static",
]);
assert("package-dir CLI runs", packageDirCli.status === 0 || packageDirCli.status === 1);
assert("package-dir CLI shows resolution", packageDirCli.stdout.includes("resolution: package-dir"));

const legacyCli = runCli(["--profile", "staging"]);
assert("legacy profile CLI runs", legacyCli.status === 0 || legacyCli.status === 1);
assert(
  "legacy CLI resolution",
  legacyCli.stdout.includes("resolution: legacy-gosaki-profile"),
);

assert("AI current-state G-20u10", currentState.includes("G-20u10"));
assert("AI next-actions G-20u10", nextActions.includes("G-20u10"));
assert("handoff G-20u10", handoff.includes("G-20u10"));

console.log("");
console.log(`G-20u10 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
