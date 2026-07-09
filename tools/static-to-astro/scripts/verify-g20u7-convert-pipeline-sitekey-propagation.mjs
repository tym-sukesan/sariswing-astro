/**
 * G-20u7 — Convert pipeline siteKey propagation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u7-convert-pipeline-sitekey-propagation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildConvertCliArgs,
  planSitePackageBuild,
} from "./lib/build-site-package-core.mjs";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import {
  DEFAULT_SITE_GENERATOR_HOOKS,
  resolveSiteGeneratorHooks,
} from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  assertRegisteredSiteKey,
  resolveSiteKeyFromFixtureDir,
} from "./lib/site-registry.mjs";
import { resolveEffectiveConvertSiteKey } from "./lib/convert-site-key.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-convert-pipeline-sitekey-propagation.md";
const CORE_REL = "tools/static-to-astro/scripts/lib/build-site-package-core.mjs";
const CONVERT_REL = "tools/static-to-astro/scripts/convert-static-to-astro.mjs";
const GENERATOR_REL = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const HOOKS_REL = "tools/static-to-astro/scripts/lib/site-generator-hooks.mjs";
const BASE_COMMIT = "528b06a";

const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const UNKNOWN_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-static-site");

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${head.stdout.trim()} (G-20u7 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u7 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("build core exists", exists(CORE_REL));
assert("convert cli exists", exists(CONVERT_REL));

const doc = read(DOC_REL);
const coreSrc = read(CORE_REL);
const convertSrc = read(CONVERT_REL);
const generatorSrc = read(GENERATOR_REL);
const hooksSrc = read(HOOKS_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u7", doc.includes("G-20u7-convert-pipeline-sitekey-propagation"));
assert("doc gate complete", doc.includes("convertPipelineSiteKeyPropagationComplete: true"));
assert("doc propagation path", doc.includes("build-site-package") && doc.includes("convert-static-to-astro"));
assert("doc fallback retained", /fallback|matchFixture|fixtureDir/i.test(doc));

assert("core exports buildConvertCliArgs", coreSrc.includes("export function buildConvertCliArgs"));
assert("core convert passes --site", coreSrc.includes('"--site"') && coreSrc.includes("siteKey"));
assert("convert parses --site", convertSrc.includes('arg === "--site"'));
assert("convert uses resolveEffectiveConvertSiteKey", convertSrc.includes("resolveEffectiveConvertSiteKey"));
assert("convert passes siteKey to generator", convertSrc.includes("siteKey: effectiveSiteKey"));
assert("convert no isGosakiPianoFixture", !convertSrc.includes("isGosakiPianoFixture"));
assert("generator passes siteKey to hooks", generatorSrc.includes("siteKey: options.siteKey"));
assert("hooks siteKey priority documented", hooksSrc.includes("options.siteKey when a hook factory is registered"));

assert("npm verify:g20u7 script", packageJson.includes("verify:g20u7-convert-sitekey"));

const convertArgs = buildConvertCliArgs(GOSAKI_SITE_KEY, "staging", { toolRoot: TOOL_ROOT });
assert("buildConvertCliArgs includes --site gosaki-piano", convertArgs.includes("--site"));
assert(
  "buildConvertCliArgs site value",
  convertArgs[convertArgs.indexOf("--site") + 1] === GOSAKI_SITE_KEY,
);

const plan = planSitePackageBuild(GOSAKI_SITE_KEY, "staging", { toolRoot: TOOL_ROOT });
assert("plan step mentions --site", plan.steps[0].includes("--site gosaki-piano"));

assert(
  "fixtureDir resolves gosaki-piano",
  resolveSiteKeyFromFixtureDir(GOSAKI_FIXTURE, TOOL_ROOT) === GOSAKI_SITE_KEY,
);
assert(
  "unknown fixture basename null",
  resolveSiteKeyFromFixtureDir(UNKNOWN_FIXTURE, TOOL_ROOT) === null,
);
assert(
  "explicit siteKey resolves",
  resolveEffectiveConvertSiteKey(GOSAKI_SITE_KEY, UNKNOWN_FIXTURE, TOOL_ROOT) === GOSAKI_SITE_KEY,
);
assert(
  "implicit fixture fallback",
  resolveEffectiveConvertSiteKey(null, GOSAKI_FIXTURE, TOOL_ROOT) === GOSAKI_SITE_KEY,
);

let unknownSiteThrew = false;
try {
  assertRegisteredSiteKey("not-a-real-site", TOOL_ROOT);
} catch (err) {
  unknownSiteThrew = err.message.includes("Unknown siteKey");
}
assert("unknown siteKey throws", unknownSiteThrew);

const explicitHooks = resolveSiteGeneratorHooks(UNKNOWN_FIXTURE, {
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("hooks explicit siteKey on unknown fixture", explicitHooks.siteKey === GOSAKI_SITE_KEY);
assert("hooks explicit siteKey active", explicitHooks.active === true);

const fallbackHooks = resolveSiteGeneratorHooks(GOSAKI_FIXTURE, { toolRoot: TOOL_ROOT });
assert("hooks fixture fallback gosaki", fallbackHooks.siteKey === GOSAKI_SITE_KEY);

const noopHooks = resolveSiteGeneratorHooks(UNKNOWN_FIXTURE, { toolRoot: TOOL_ROOT });
assert("hooks unknown fixture noop", noopHooks.siteKey === null);
assert("hooks unknown fixture inactive", noopHooks.active === false);
assert(
  "default hooks noop",
  DEFAULT_SITE_GENERATOR_HOOKS.generateFooter() === null,
);

const dryRunBuild = spawnSync(
  "node",
  ["scripts/build-site-package.mjs", "--site", "gosaki-piano", "--profile", "staging", "--dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("build staging dry-run exit 0", dryRunBuild.status === 0, dryRunBuild.stderr?.slice(0, 300));
assert("dry-run shows siteKey", dryRunBuild.stdout.includes("siteKey: gosaki-piano"));

const convertDryRunCli = spawnSync(
  "node",
  [
    "scripts/convert-static-to-astro.mjs",
    "fixtures/gosaki-piano",
    "output/_g20u7-convert-dry-run",
    "--site",
    "gosaki-piano",
    "--dry-run",
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("convert dry-run exit 0", convertDryRunCli.status === 0, convertDryRunCli.stderr?.slice(0, 300));
assert("convert dry-run prints siteKey", convertDryRunCli.stdout.includes("siteKey: gosaki-piano"));

const convertDryRun = generateAstroProject(GOSAKI_FIXTURE, path.join(TOOL_ROOT, "output/_g20u7-gen-smoke"), {
  dryRun: true,
  siteKey: GOSAKI_SITE_KEY,
});
assert("generator dry-run with siteKey", convertDryRun?.dryRun === true);

assert("AI current-state G-20u7", currentState.includes("G-20u7"));
assert("AI next-actions G-20u7", nextActions.includes("G-20u7"));
assert("handoff G-20u7", handoff.includes("G-20u7"));

console.log("");
console.log(`G-20u7 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
