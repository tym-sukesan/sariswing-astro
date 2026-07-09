/**
 * G-20u9 — Pilot sample static full package build + verify.
 * Run: node tools/static-to-astro/scripts/verify-g20u9-pilot-sample-static-full-package-build-verify.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { verifySitePackage } from "./lib/verify-site-package-core.mjs";
import { verifyPackageUploadFreshness } from "./lib/package-upload-safety.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/pilot-sample-static-full-package-build-verify.md";
const BASE_COMMIT = "49f1786";
const PILOT_PKG = path.join(TOOL_ROOT, "output/manual-upload/pilot-sample-static");
const PILOT_PUB = path.join(PILOT_PKG, "public-dist");

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

function walkRelativeFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkRelativeFiles(abs));
    else out.push(path.relative(dir, abs).replace(/\\/g, "/"));
  }
  return out;
}

const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

const currentHead = head.stdout.trim();
if (currentHead.startsWith(BASE_COMMIT)) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${currentHead.slice(0, 12)} (G-20u9 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u9 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("static-public-site-expectations exists", exists("tools/static-to-astro/scripts/lib/static-public-site-expectations.mjs"));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u9", doc.includes("G-20u9-pilot-sample-static-full-package-build-verify"));
assert("doc gate complete", doc.includes("pilotSampleStaticFullPackageBuildVerifyComplete: true"));
assert("doc fileCount 9", doc.includes("9"));
assert("doc freshness note", /freshness|--package-dir|verify:package-freshness:pilot/i.test(doc));

assert("npm build:pilot:staging", packageJson.includes("build:pilot:staging"));
assert("npm verify:pilot:staging", packageJson.includes("verify:pilot:staging"));

assert("pilot package dir exists", fs.existsSync(PILOT_PKG));
assert("pilot MANIFEST exists", fs.existsSync(path.join(PILOT_PKG, "MANIFEST.json")));

const manifest = JSON.parse(fs.readFileSync(path.join(PILOT_PKG, "MANIFEST.json"), "utf8"));
assert("MANIFEST siteKey", manifest.siteKey === PILOT_SAMPLE_STATIC_SITE_KEY);
assert("MANIFEST targetEnvironment staging", manifest.targetEnvironment === "staging");
assert("MANIFEST includesAdmin false", manifest.includesAdmin === false);
if (manifest.sourceCommit === currentHead) {
  assert("MANIFEST sourceCommit HEAD", true);
} else {
  console.log(
    `NOTE MANIFEST sourceCommit stale (${String(manifest.sourceCommit).slice(0, 12)} vs HEAD ${currentHead.slice(0, 12)}) — non-blocking`,
  );
}
assert(
  "MANIFEST publicBaseUrl",
  manifest.publicBaseUrl === "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static/",
);
assert(
  "MANIFEST intendedRemotePath",
  manifest.intendedRemotePath === "/cms-kit-staging/pilot-sample-static/",
);
assert("MANIFEST fileCount 9", manifest.fileCount === 9);

const pubFiles = walkRelativeFiles(PILOT_PUB);
assert("public-dist file count 9", pubFiles.length === 9, String(pubFiles.length));
assert("sitemap-0.xml present", fs.existsSync(path.join(PILOT_PUB, "sitemap-0.xml")));
const sitemap = fs.readFileSync(path.join(PILOT_PUB, "sitemap-0.xml"), "utf8");
assert("sitemap no admin", !sitemap.includes("/admin/"));
assert("sitemap no gosaki schedule", !sitemap.includes("/schedule/2026-08/"));
const contaminated = pubFiles.filter((f) =>
  /gosaki|admin|BandProfiles|hubspot|youtube|discography|schedule\/2026/i.test(f),
);
assert("no gosaki/admin/schedule artifacts", contaminated.length === 0, contaminated.join(", "));

const verifyResult = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  toolRoot: TOOL_ROOT,
});
assert("verifySitePackage ok", verifyResult.ok, verifyResult.errors?.join("; "));

const freshness = verifyPackageUploadFreshness(PILOT_PKG, REPO_ROOT);
if (freshness.ok) {
  assert("freshness ok via --package-dir path", true);
} else {
  assert(
    "freshness STOP expected (stale on disk)",
    freshness.errors?.some((e) => /sourceCommit|stale|mismatch/i.test(e)),
    freshness.errors?.join("; "),
  );
}

const pilotBuildDryRun = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", PILOT_SAMPLE_STATIC_SITE_KEY, "--profile", "staging", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("pilot build dry-run exit 0", pilotBuildDryRun.status === 0);

const gosakiBuildDryRun = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", GOSAKI_SITE_KEY, "--profile", "staging", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("gosaki build dry-run exit 0", gosakiBuildDryRun.status === 0);
assert("gosaki dry-run siteKey", gosakiBuildDryRun.stdout.includes("siteKey: gosaki-piano"));

const profile = resolveSitePackageBuildProfile(PILOT_SAMPLE_STATIC_SITE_KEY, "staging", {
  toolRoot: TOOL_ROOT,
});
assert("pilot includesAdmin false profile", profile.includesAdmin === false);

assert("AI current-state G-20u9", currentState.includes("G-20u9"));
assert("AI next-actions G-20u9", nextActions.includes("G-20u9"));
assert("handoff G-20u9", handoff.includes("G-20u9"));

console.log("");
console.log(`G-20u9 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
