/**
 * G-20u14 — URL-to-staging pipeline site-aware verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u14-url-to-staging-pipeline-site-aware.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  TOOL_ROOT,
} from "./lib/site-registry.mjs";
import {
  buildUrlToStagingConfigFromSite,
  isKnownUrlToStagingSiteKey,
  resolveEffectiveUrlToStagingSiteKey,
} from "./lib/url-to-staging-site-registry.mjs";
import { buildUrlToStagingStepPlan } from "./lib/url-to-staging-pipeline-plan.mjs";
import { loadSiteSupabaseDataForBuild } from "./lib/site-aware-supabase-loaders.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/url-to-staging-pipeline-site-aware.md";
const BASE_COMMIT = "861ea4d";

const WRITE_PATTERNS = [
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /service_role/i,
  /deploy-ftp.*apply/i,
  /mirror\s+--delete/i,
];

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

function runPipeline(args, { expectOk = true } = {}) {
  const result = spawnSync("node", ["scripts/url-to-staging-pipeline.mjs", ...args], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env },
  });
  const ok = result.status === (expectOk ? 0 : 1);
  return { ok, stdout: result.stdout ?? "", stderr: result.stderr ?? "", status: result.status };
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
    `NOTE HEAD is ${head.stdout.trim().slice(0, 12)} (G-20u14 base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u14", doc.includes("G-20u14-url-to-staging-pipeline-site-aware"));
assert("doc --site CLI", doc.includes("--site gosaki-piano"));
assert("doc pilot", doc.includes("pilot-sample-static"));

assert("registry helper exists", exists("tools/static-to-astro/scripts/lib/url-to-staging-site-registry.mjs"));
assert("pilot url-to-staging config exists", exists("tools/static-to-astro/config/sites/pilot-sample-static.url-to-staging.json"));

const pipelineSrc = read("tools/static-to-astro/scripts/lib/url-to-staging-pipeline.mjs");
const cliSrc = read("tools/static-to-astro/scripts/url-to-staging-pipeline.mjs");
const planSrc = read("tools/static-to-astro/scripts/lib/url-to-staging-pipeline-plan.mjs");
const registrySrc = read("tools/static-to-astro/scripts/lib/url-to-staging-site-registry.mjs");

assert("pipeline no isGosakiPianoFixture", !pipelineSrc.includes("isGosakiPianoFixture"));
assert("pipeline uses loadSiteSupabaseDataForBuild", pipelineSrc.includes("loadSiteSupabaseDataForBuild"));
assert("pipeline passes siteKey to generateAstroProject", pipelineSrc.includes("siteKey,"));
assert("pipeline passes siteKey to static-public verify", pipelineSrc.includes("siteKey: config.siteKey"));
assert("CLI --site flag", cliSrc.includes('arg === "--site"'));
assert("CLI buildUrlToStagingConfigFromSite", cliSrc.includes("buildUrlToStagingConfigFromSite"));
assert("plan convert includes --site", planSrc.includes("`--site ${config.siteKey}`"));
assert("buildNextManualSteps includes --site", planSrc.includes(" --site ${config.siteKey}"));

for (const pattern of WRITE_PATTERNS) {
  assert(`pipeline no write pattern ${pattern}`, !pattern.test(pipelineSrc));
}

assert("known gosaki site", isKnownUrlToStagingSiteKey(GOSAKI_SITE_KEY));
assert("known pilot site", isKnownUrlToStagingSiteKey(PILOT_SAMPLE_STATIC_SITE_KEY));
assert("unknown site fails", !isKnownUrlToStagingSiteKey("not-a-real-site-key"));

let unknownThrew = false;
try {
  buildUrlToStagingConfigFromSite("not-a-real-site-key", TOOL_ROOT);
} catch {
  unknownThrew = true;
}
assert("buildUrlToStagingConfigFromSite unknown throws", unknownThrew);

const gosakiConfig = buildUrlToStagingConfigFromSite(GOSAKI_SITE_KEY, TOOL_ROOT);
assert("gosaki siteKey", gosakiConfig.siteKey === GOSAKI_SITE_KEY);
assert("gosaki deployBase", gosakiConfig.deployBase === "/cms-kit-staging/gosaki-piano/");
assert("gosaki fixtureOut ends gosaki-piano", gosakiConfig.fixtureOut.endsWith("fixtures/gosaki-piano"));
assert("gosaki stagingBaseUrl", Boolean(gosakiConfig.stagingBaseUrl?.includes("gosaki-piano")));

const pilotConfig = buildUrlToStagingConfigFromSite(PILOT_SAMPLE_STATIC_SITE_KEY, TOOL_ROOT);
assert("pilot siteKey", pilotConfig.siteKey === PILOT_SAMPLE_STATIC_SITE_KEY);
assert("pilot deployBase", pilotConfig.deployBase === "/cms-kit-staging/pilot-sample-static/");
assert("pilot siteProfile generic", pilotConfig.siteProfile === "generic");
assert("pilot fixture sample-static-site", pilotConfig.fixtureOut.endsWith("fixtures/sample-static-site"));

const gosakiPlan = buildUrlToStagingStepPlan(gosakiConfig, { runCrawl: false, runConvert: true, runBuild: false, preparePublic: false, deployFtp: false }, true);
const convertStep = gosakiPlan.find((s) => s.id === "convert-static-to-astro");
assert("gosaki plan convert step", Boolean(convertStep));
assert("gosaki plan convert --site", convertStep?.command?.includes("--site gosaki-piano"));
assert("gosaki plan convert --deploy-base", convertStep?.command?.includes("--deploy-base /cms-kit-staging/gosaki-piano/"));

const pilotPlan = buildUrlToStagingStepPlan(pilotConfig, { runCrawl: false, runConvert: true, runBuild: false, preparePublic: false, deployFtp: false }, true);
const pilotConvert = pilotPlan.find((s) => s.id === "convert-static-to-astro");
assert("pilot plan convert --site", pilotConvert?.command?.includes("--site pilot-sample-static"));

assert("resolveEffectiveUrlToStagingSiteKey", resolveEffectiveUrlToStagingSiteKey(gosakiConfig) === GOSAKI_SITE_KEY);

const pilotSupabase = await loadSiteSupabaseDataForBuild({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  inputDir: pilotConfig.fixtureOut,
  toolRoot: TOOL_ROOT,
});
assert("pilot supabase schedule null", pilotSupabase.schedule === null);
assert("pilot supabase discography null", pilotSupabase.discography === null);

const gosakiDry = runPipeline(["--site", GOSAKI_SITE_KEY, "--dry-run"]);
assert("gosaki dry-run exit 0", gosakiDry.ok, `status=${gosakiDry.status} stderr=${gosakiDry.stderr.slice(0, 200)}`);
assert("gosaki dry-run manifest siteKey", gosakiDry.stdout.includes("siteKey") || gosakiDry.stdout.includes("gosaki-piano"));

const pilotDry = runPipeline(["--site", PILOT_SAMPLE_STATIC_SITE_KEY, "--dry-run"]);
assert("pilot dry-run exit 0", pilotDry.ok, `status=${pilotDry.status} stderr=${pilotDry.stderr.slice(0, 200)}`);

const legacyDry = runPipeline([
  "--config",
  "config/sites/gosaki-piano.url-to-staging.json",
  "--dry-run",
]);
assert("legacy config dry-run exit 0", legacyDry.ok, `status=${legacyDry.status}`);

const unknownDry = runPipeline(["--site", "not-a-real-site-key", "--dry-run"], { expectOk: false });
assert("unknown site dry-run fails", unknownDry.ok, `expected fail got status=${unknownDry.status}`);

const gosakiConfigJson = read("tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json");
assert("gosaki config has siteKey field", gosakiConfigJson.includes('"siteKey": "gosaki-piano"'));

assert("package.json verify:g20u14", read("tools/static-to-astro/package.json").includes("verify:g20u14-url-staging"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u14", currentState.includes("G-20u14"));
assert("AI next-actions G-20u14", nextActions.includes("G-20u14"));
assert("handoff G-20u14", handoff.includes("G-20u14"));

console.log(`G-20u14 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
