/**
 * G-20u12 — Manual-upload README/CHECKLIST preflight integration verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u12-manual-upload-readme-checklist-preflight-integration.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  formatReadmeUpload,
  formatUploadChecklist,
  resolveBuildNpmCommand,
  resolvePreflightNpmCommand,
} from "./lib/manual-upload-package.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/manual-upload-readme-checklist-preflight-integration.md";
const MANUAL_LIB_REL = "tools/static-to-astro/scripts/lib/manual-upload-package.mjs";
const BASE_COMMIT = "e6f2531";

const GOSAKI_STAGING_PKG = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const GOSAKI_PRODUCTION_PKG = "tools/static-to-astro/output/manual-upload/gosaki-piano-production";
const PILOT_STAGING_PKG = "tools/static-to-astro/output/manual-upload/pilot-sample-static";

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

function assertDocSafety(readme, checklist, label) {
  assert(`${label} README preflight section`, readme.includes("Preflight before upload (G-20u11)"));
  assert(`${label} README preflight:gosaki:staging`, readme.includes("preflight:gosaki:staging"));
  assert(`${label} README preflight:gosaki:production`, readme.includes("preflight:gosaki:production"));
  assert(`${label} README preflight:pilot:staging`, readme.includes("preflight:pilot:staging"));
  assert(`${label} README generic preflight`, readme.includes("npm run preflight -- --site"));
  assert(`${label} README stale STOP`, /upload forbidden|STOP.*stale|stale.*upload forbidden/i.test(readme));
  assert(`${label} README rebuild at HEAD`, /rebuild.*HEAD|current HEAD/i.test(readme));
  assert(`${label} README public-dist contents`, /not.*`public-dist` folder itself/i.test(readme));
  assert(`${label} README mirror prohibition`, readme.includes("mirror"));
  assert(`${label} README CLI FTP prohibition`, /CLI FTP|command-line FTP/i.test(readme));

  assert(`${label} CHECKLIST preflight command`, checklist.includes("preflight"));
  assert(`${label} CHECKLIST stale STOP`, /STOP.*stale|stale.*upload forbidden|upload forbidden/i.test(checklist));
  assert(`${label} CHECKLIST no mirror`, checklist.includes("mirror") || checklist.includes("sync"));
  assert(`${label} CHECKLIST no CLI FTP`, checklist.includes("CLI FTP"));
  assert(`${label} CHECKLIST public-dist contents`, checklist.includes("not the `public-dist` folder itself"));
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
    `NOTE HEAD is ${head.stdout.trim().slice(0, 12)} (G-20u12 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u12 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("manual-upload lib exists", exists(MANUAL_LIB_REL));

const doc = read(DOC_REL);
const manualLib = read(MANUAL_LIB_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u12", doc.includes("G-20u12-manual-upload-readme-checklist-preflight-integration"));
assert("doc gate complete", doc.includes("manualUploadReadmeChecklistPreflightIntegrationComplete: true"));
assert("doc operator flow", doc.includes("preflight:gosaki:staging"));
assert("doc stale note", /stale|commit.*regen/i.test(doc));

assert("lib resolvePreflightNpmCommand", manualLib.includes("resolvePreflightNpmCommand"));
assert("lib resolveBuildNpmCommand", manualLib.includes("resolveBuildNpmCommand"));
assert("lib G-20u11 README section", manualLib.includes("Preflight before upload (G-20u11)"));
assert("lib G-20j production STOP", manualLib.includes("G-20j"));

assert(
  "gosaki staging preflight command",
  resolvePreflightNpmCommand(GOSAKI_SITE_KEY, "staging") === "npm run preflight:gosaki:staging",
);
assert(
  "gosaki production preflight command",
  resolvePreflightNpmCommand(GOSAKI_SITE_KEY, "production") === "npm run preflight:gosaki:production",
);
assert(
  "pilot staging preflight command",
  resolvePreflightNpmCommand(PILOT_SAMPLE_STATIC_SITE_KEY, "staging") ===
    "npm run preflight:pilot:staging",
);
assert(
  "generic preflight command",
  resolvePreflightNpmCommand("future-site", "staging") ===
    "npm run preflight -- --site future-site --profile staging",
);

const gosakiStagingReadme = formatReadmeUpload({
  deployBase: "/cms-kit-staging/gosaki-piano/",
  stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
  siteSlug: "gosaki-piano",
  siteKey: GOSAKI_SITE_KEY,
  targetEnvironment: "staging",
  packageProfileName: "staging",
  includesAdmin: true,
  sourceCommit: head.stdout.trim(),
  generatedAt: new Date().toISOString(),
});
const gosakiStagingChecklist = formatUploadChecklist({
  deployBase: "/cms-kit-staging/gosaki-piano/",
  stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
  siteKey: GOSAKI_SITE_KEY,
  targetEnvironment: "staging",
  packageProfileName: "staging",
  includesAdmin: true,
  sourceCommit: head.stdout.trim(),
  generatedAt: new Date().toISOString(),
});
assertDocSafety(gosakiStagingReadme, gosakiStagingChecklist, "gosaki-staging-generated");

const gosakiProductionReadme = formatReadmeUpload({
  deployBase: "/",
  publicBaseUrl: "https://www.gosaki-piano.com",
  siteSlug: "gosaki-piano",
  siteKey: GOSAKI_SITE_KEY,
  targetEnvironment: "production",
  packageProfileName: "production",
  intendedRemotePath: "TBD_G-20i",
  includesAdmin: false,
  sourceCommit: head.stdout.trim(),
  generatedAt: new Date().toISOString(),
});
const gosakiProductionChecklist = formatUploadChecklist({
  deployBase: "/",
  publicBaseUrl: "https://www.gosaki-piano.com",
  siteKey: GOSAKI_SITE_KEY,
  targetEnvironment: "production",
  packageProfileName: "production",
  intendedRemotePath: "TBD_G-20i",
  includesAdmin: false,
  sourceCommit: head.stdout.trim(),
  generatedAt: new Date().toISOString(),
});
assertDocSafety(gosakiProductionReadme, gosakiProductionChecklist, "gosaki-production-generated");
assert(
  "gosaki production README G-20j STOP",
  gosakiProductionReadme.includes("G-20j") && /STOP|blocked/i.test(gosakiProductionReadme),
);
assert(
  "gosaki production CHECKLIST G-20j STOP",
  gosakiProductionChecklist.includes("G-20j"),
);

const pilotReadme = formatReadmeUpload({
  deployBase: "/cms-kit-staging/pilot-sample-static/",
  stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static",
  siteSlug: "pilot-sample-static",
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  targetEnvironment: "staging",
  packageProfileName: "staging",
  includesAdmin: false,
  sourceCommit: head.stdout.trim(),
  generatedAt: new Date().toISOString(),
});
const pilotChecklist = formatUploadChecklist({
  deployBase: "/cms-kit-staging/pilot-sample-static/",
  stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static",
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  targetEnvironment: "staging",
  packageProfileName: "staging",
  includesAdmin: false,
  sourceCommit: head.stdout.trim(),
  generatedAt: new Date().toISOString(),
});
assertDocSafety(pilotReadme, pilotChecklist, "pilot-staging-generated");
assert(
  "pilot README uses preflight:pilot:staging",
  pilotReadme.includes("npm run preflight:pilot:staging"),
);
assert(
  "pilot build command",
  pilotReadme.includes(resolveBuildNpmCommand(PILOT_SAMPLE_STATIC_SITE_KEY, "staging")),
);

if (exists(`${GOSAKI_STAGING_PKG}/README-UPLOAD.md`)) {
  const onDiskReadme = read(`${GOSAKI_STAGING_PKG}/README-UPLOAD.md`);
  const onDiskChecklist = read(`${GOSAKI_STAGING_PKG}/CHECKLIST.md`);
  if (onDiskReadme.includes("Preflight before upload (G-20u11)")) {
    assertDocSafety(onDiskReadme, onDiskChecklist, "gosaki-staging-on-disk");
  } else {
    console.log(
      "NOTE gosaki staging on-disk README not yet regen with G-20u12 — run build:gosaki:staging to refresh",
    );
  }
}

const DEPLOY_INVOCATION_PATTERNS = [
  "scripts/deploy-public-dist",
  "scripts/deploy-ftp",
  "spawnSync.*ftp",
  "workflow_dispatch",
  "lftp ",
];
assert(
  "manual lib no deploy script invocations",
  DEPLOY_INVOCATION_PATTERNS.every((pattern) => !new RegExp(pattern).test(manualLib)),
);

assert("AI current-state G-20u12", currentState.includes("G-20u12"));
assert("AI next-actions G-20u12", nextActions.includes("G-20u12"));
assert("handoff G-20u12", handoff.includes("G-20u12"));

console.log("");
console.log(`G-20u12 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
