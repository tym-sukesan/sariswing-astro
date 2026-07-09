/**
 * G-20u8 — Second-site noop hooks pilot dry-run verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u8-second-site-noop-hooks-pilot-dry-run.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildConvertCliArgs,
  buildPostBuildVerifierArgs,
  planSitePackageBuild,
} from "./lib/build-site-package-core.mjs";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import {
  DEFAULT_SITE_GENERATOR_HOOKS,
  SITE_GENERATOR_HOOK_FACTORIES,
  resolveSiteGeneratorHooks,
} from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  getSiteRegistryEntry,
  listSiteKeys,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/second-site-noop-hooks-pilot-dry-run.md";
/** Documented at G-20u8 completion; verifier HEAD pin is non-blocking after later commits. */
const BASE_COMMIT = "d3e8ff7";

const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const PILOT_ASTRO_OUT = path.join(TOOL_ROOT, "output/_g20u8-pilot-sample-astro");

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

function walkFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(path.relative(base, abs).replace(/\\/g, "/"));
  }
  return out;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT} (G-20u8 original)`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${head.stdout.trim()} (G-20u8 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT} (G-20u8 original)`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u8 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("pilot deploy profiles exists", exists("tools/static-to-astro/config/sites/pilot-sample-static.deploy-profiles.json"));

const doc = read(DOC_REL);
const registry = read("tools/static-to-astro/config/sites/registry.json");
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u8", doc.includes("G-20u8-second-site-noop-hooks-pilot-dry-run"));
assert("doc gate complete", doc.includes("secondSiteNoopHooksPilotDryRunComplete: true"));
assert("doc pilot siteKey", doc.includes("pilot-sample-static"));
assert("doc noop hooks", /noop|default hooks/i.test(doc));

const keys = listSiteKeys(TOOL_ROOT);
assert("registry lists pilot", keys.includes(PILOT_SAMPLE_STATIC_SITE_KEY));
assert("registry lists gosaki", keys.includes(GOSAKI_SITE_KEY));
assert("registry json pilot entry", registry.includes('"pilot-sample-static"'));

const pilotEntry = getSiteRegistryEntry(PILOT_SAMPLE_STATIC_SITE_KEY, TOOL_ROOT);
assert("pilot fixtureDir sample-static-site", pilotEntry.fixtureDir === "fixtures/sample-static-site");
assert("pilot staging only packageProfiles", Boolean(pilotEntry.packageProfiles?.staging));
assert("pilot no production profile", !pilotEntry.packageProfiles?.production);
assert("pilot includesAdmin false", pilotEntry.packageProfiles.staging.includesAdmin === false);

const pilotProfile = resolveSitePackageBuildProfile(PILOT_SAMPLE_STATIC_SITE_KEY, "staging", {
  toolRoot: TOOL_ROOT,
});
assert("pilot profile siteKey", pilotProfile.siteKey === PILOT_SAMPLE_STATIC_SITE_KEY);
assert("pilot includeGosakiReadOnlyAdmin false", pilotProfile.includeGosakiReadOnlyAdmin === false);
assert("pilot includesAdmin false", pilotProfile.includesAdmin === false);

const pilotPlan = planSitePackageBuild(PILOT_SAMPLE_STATIC_SITE_KEY, "staging", { toolRoot: TOOL_ROOT });
assert("pilot plan step --site", pilotPlan.steps[0].includes("--site pilot-sample-static"));

const convertArgs = buildConvertCliArgs(PILOT_SAMPLE_STATIC_SITE_KEY, "staging", { toolRoot: TOOL_ROOT });
assert("convert args --site pilot", convertArgs.includes("--site"));
assert(
  "convert args site value",
  convertArgs[convertArgs.indexOf("--site") + 1] === PILOT_SAMPLE_STATIC_SITE_KEY,
);

const verifierArgs = buildPostBuildVerifierArgs(PILOT_SAMPLE_STATIC_SITE_KEY, "staging", pilotProfile);
assert("pilot verifier verify-site-package", verifierArgs[0].endsWith("verify-site-package.mjs"));
assert("pilot verifier --site", verifierArgs.includes("--site"));

const pilotHooks = resolveSiteGeneratorHooks(PILOT_FIXTURE, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot hooks siteKey", pilotHooks.siteKey === PILOT_SAMPLE_STATIC_SITE_KEY);
assert("pilot hooks active false", pilotHooks.active === false);
assert("pilot hooks noop footer", pilotHooks.generateFooter("<footer/>", {}) === null);
assert("pilot hooks noop post-generate", pilotHooks.applyPostGenerate("/tmp", {}).gosakiBandProfilesSummary?.applied === false);
assert("pilot not in hook factories", !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, PILOT_SAMPLE_STATIC_SITE_KEY));

const gosakiOnPilotFixture = resolveSiteGeneratorHooks(PILOT_FIXTURE, { toolRoot: TOOL_ROOT });
assert("pilot fixture implicit noop", gosakiOnPilotFixture.siteKey === null);
assert("pilot fixture not gosaki hooks", gosakiOnPilotFixture.active === false);

const gosakiHooks = resolveSiteGeneratorHooks(GOSAKI_FIXTURE, {
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("gosaki hooks still active", gosakiHooks.active === true);
assert("gosaki hooks siteKey", gosakiHooks.siteKey === GOSAKI_SITE_KEY);

assert(
  "default hooks unchanged",
  DEFAULT_SITE_GENERATOR_HOOKS.applyLegacyMonthStubs({}).count === 0,
);

const pilotBuildDryRun = spawnSync(
  "node",
  [
    "scripts/build-site-package.mjs",
    "--site",
    PILOT_SAMPLE_STATIC_SITE_KEY,
    "--profile",
    "staging",
    "--dry-run",
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("pilot build dry-run exit 0", pilotBuildDryRun.status === 0, pilotBuildDryRun.stderr?.slice(0, 300));
assert("pilot build dry-run siteKey", pilotBuildDryRun.stdout.includes("siteKey: pilot-sample-static"));
assert("pilot build dry-run includesAdmin false", pilotBuildDryRun.stdout.includes("includeGosakiReadOnlyAdmin: false"));

const gosakiBuildDryRun = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", GOSAKI_SITE_KEY, "--profile", "staging", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("gosaki build dry-run exit 0", gosakiBuildDryRun.status === 0, gosakiBuildDryRun.stderr?.slice(0, 300));
assert("gosaki build dry-run siteKey", gosakiBuildDryRun.stdout.includes("siteKey: gosaki-piano"));

const convertDryRunCli = spawnSync(
  "node",
  [
    "scripts/convert-static-to-astro.mjs",
    "fixtures/sample-static-site",
    "output/_g20u8-pilot-convert-dry-run",
    "--site",
    PILOT_SAMPLE_STATIC_SITE_KEY,
    "--dry-run",
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("pilot convert dry-run exit 0", convertDryRunCli.status === 0, convertDryRunCli.stderr?.slice(0, 300));
assert("pilot convert dry-run siteKey", convertDryRunCli.stdout.includes("siteKey: pilot-sample-static"));

if (fs.existsSync(PILOT_ASTRO_OUT)) {
  fs.rmSync(PILOT_ASTRO_OUT, { recursive: true, force: true });
}
const pilotConvert = generateAstroProject(PILOT_FIXTURE, PILOT_ASTRO_OUT, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static",
  deployBase: "/cms-kit-staging/pilot-sample-static/",
});
const writtenRel = walkFiles(PILOT_ASTRO_OUT);
const gosakiArtifacts = writtenRel.filter((f) =>
  /gosaki|BandProfiles|YouTubeEmbed|hubspot|admin\/index/i.test(f),
);
assert("pilot local convert pages", (pilotConvert?.writtenPages?.length ?? 0) > 0);
assert("pilot no gosaki artifacts", gosakiArtifacts.length === 0, gosakiArtifacts.join(", "));
assert("pilot no admin page", !writtenRel.some((f) => f === "src/pages/admin/index.astro"));

assert("npm verify:g20u8 script", packageJson.includes("verify:g20u8-pilot-noop"));
assert("AI current-state G-20u8", currentState.includes("G-20u8"));
assert("AI next-actions G-20u8", nextActions.includes("G-20u8"));
assert("handoff G-20u8", handoff.includes("G-20u8"));

console.log("");
console.log(`G-20u8 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
