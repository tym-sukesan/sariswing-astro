/**
 * G-20u6 — Astro generator hook registry verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u6-astro-generator-hook-registry.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  DEFAULT_SITE_GENERATOR_HOOKS,
  SITE_GENERATOR_HOOK_FACTORIES,
  isRegisteredSiteGeneratorHook,
  resolveSiteGeneratorHooks,
} from "./lib/site-generator-hooks.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";
import { generateAstroProject } from "./lib/astro-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-astro-generator-hook-registry.md";
const HOOKS_REL = "tools/static-to-astro/scripts/lib/site-generator-hooks.mjs";
const GENERATOR_REL = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const BASE_COMMIT = "3decd7f";

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
    `NOTE HEAD is ${head.stdout.trim()} (G-20u6 original ${BASE_COMMIT}) — non-blocking`,
  );
}
if (origin.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS origin/main is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE origin/main is ${origin.stdout.trim()} (G-20u6 original ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("hook registry module exists", exists(HOOKS_REL));
assert("doc exists", exists(DOC_REL));
assert("astro-generator exists", exists(GENERATOR_REL));

const doc = read(DOC_REL);
const hooksSrc = read(HOOKS_REL);
const generatorSrc = read(GENERATOR_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const packageJson = read("tools/static-to-astro/package.json");

assert("doc phase G-20u6", doc.includes("G-20u6-astro-generator-hook-registry"));
assert("doc gate complete", doc.includes("astroGeneratorHookRegistryComplete: true"));
assert("doc inventory table", doc.includes("applyGosakiAboutBandProfiles"));
assert("doc default noop", doc.includes("DEFAULT_SITE_GENERATOR_HOOKS"));
assert("doc package stale note", doc.includes("package stale") || doc.includes("stale"));

assert("registry exports resolveSiteGeneratorHooks", hooksSrc.includes("export function resolveSiteGeneratorHooks"));
assert("registry exports DEFAULT_SITE_GENERATOR_HOOKS", hooksSrc.includes("export const DEFAULT_SITE_GENERATOR_HOOKS"));
assert("registry gosaki factory", hooksSrc.includes(`[GOSAKI_SITE_KEY]: createGosakiPianoHookMethods`));
assert("gosaki hooks call applyGosakiScheduleDataPages", hooksSrc.includes("applyGosakiScheduleDataPages"));
assert("gosaki hooks call generateGosakiFooterAstro", hooksSrc.includes("generateGosakiFooterAstro"));

assert("generator imports hook registry", generatorSrc.includes('from "./site-generator-hooks.mjs"'));
assert("generator resolves hooks", generatorSrc.includes("resolveSiteGeneratorHooks(siteDir"));
assert("generator no direct gosaki-about import", !generatorSrc.includes('from "./gosaki-about-band-profiles.mjs"'));
assert("generator no direct gosaki-footer import", !generatorSrc.includes('from "./gosaki-footer-social.mjs"'));
assert("generator delegates footer", generatorSrc.includes("siteHooks.generateFooter"));
assert("generator delegates post-generate", generatorSrc.includes("siteHooks.applyPostGenerate"));
assert("generator keeps schedule hub markup", generatorSrc.includes("gosaki-schedule-hub"));

assert("npm verify:g20u6 script", packageJson.includes("verify:g20u6-astro-generator-hooks"));

assert("registered gosaki-piano", isRegisteredSiteGeneratorHook(GOSAKI_SITE_KEY));
assert("gosaki factory present", Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY));

const gosakiHooks = resolveSiteGeneratorHooks(GOSAKI_FIXTURE, { toolRoot: TOOL_ROOT });
assert("gosaki fixture resolves siteKey", gosakiHooks.siteKey === GOSAKI_SITE_KEY);
assert("gosaki fixture active", gosakiHooks.active === true);
assert("gosaki matchFixture true", gosakiHooks.matchFixture(GOSAKI_FIXTURE) === true);

const unknownHooks = resolveSiteGeneratorHooks(UNKNOWN_FIXTURE, { toolRoot: TOOL_ROOT });
assert("unknown fixture inactive", unknownHooks.active === false);
assert("unknown fixture siteKey null", unknownHooks.siteKey === null);
assert("unknown transform noop", unknownHooks.transformAnalysisPages([{ route: "/x/" }]).length === 1);
assert("unknown footer noop", unknownHooks.generateFooter("<footer></footer>", {}) === null);
assert(
  "unknown schedule usage noop",
  unknownHooks.resolveScheduleDataUsage({}).useScheduleData === false,
);
assert(
  "unknown legacy stubs noop",
  unknownHooks.applyLegacyMonthStubs({}).count === 0,
);
assert(
  "unknown post-generate noop",
  unknownHooks.applyPostGenerate("/tmp/out", {}).gosakiBandProfilesSummary?.applied === false,
);

assert(
  "default hooks inactive",
  DEFAULT_SITE_GENERATOR_HOOKS.active === false && DEFAULT_SITE_GENERATOR_HOOKS.siteKey === null,
);

assert("AI current-state G-20u6", currentState.includes("G-20u6"));
assert("AI next-actions G-20u6", nextActions.includes("G-20u6"));
assert("handoff G-20u6", handoff.includes("G-20u6"));

const dryRun = spawnSync(
  "node",
  [
    "scripts/build-site-package.mjs",
    "--site",
    "gosaki-piano",
    "--profile",
    "staging",
    "--dry-run",
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 120_000 },
);
assert("build:gosaki:staging dry-run exit 0", dryRun.status === 0, dryRun.stderr?.slice(0, 400));
assert(
  "dry-run mentions dry-run or plan",
  /dry[- ]run|DRY RUN|plan/i.test(`${dryRun.stdout}\n${dryRun.stderr}`),
);

const convertDryRun = generateAstroProject(GOSAKI_FIXTURE, path.join(TOOL_ROOT, "output/_g20u6-hook-smoke"), {
  dryRun: true,
});
assert("astro-generator dry-run smoke", convertDryRun?.dryRun === true);
assert("astro-generator dry-run pages", (convertDryRun?.analysis?.pages?.length ?? 0) > 0);

console.log("");
console.log(`G-20u6 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
