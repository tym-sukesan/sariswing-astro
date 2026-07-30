/**
 * CMS Core v2 — package public-env site-adapter decoupling verifier.
 * Tempdir / mock callbacks only · no real package generate / FTP / network.
 *
 * Run: node scripts/verify-cms-core-v2-package-public-env-site-adapter.mjs
 * npm: verify:cms-core-v2-package-public-env-adapter
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executeSitePackageBuildPrefights } from "./lib/site-package-build-preflight.mjs";
import { buildPackageRunMarker } from "./lib/package-run-marker.mjs";
import {
  createGosakiResolveBuildEnv,
  shouldApplyGosakiPackageBuildEnvPreflight,
} from "./lib/gosaki-package-build-env-preflight.mjs";
import { GOSAKI_SITE_KEY } from "./lib/site-registry.mjs";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
  STAGING_SUPABASE_URL,
} from "./lib/supabase-staging-ref-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/build-site-package-core.mjs");
const PREFLIGHT = path.join(__dirname, "lib/site-package-build-preflight.mjs");
const ADAPTER = path.join(__dirname, "lib/gosaki-package-build-env-preflight.mjs");
const MANUAL = path.join(__dirname, "lib/manual-upload-package.mjs");
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-package-public-env-site-adapter-decoupling.md",
);

const ENTRYPOINTS = [
  "build-site-package.mjs",
  "build-gosaki-staging-admin-package.mjs",
  "build-gosaki-production-package.mjs",
];

let passed = 0;
let failed = 0;

function assert(name, cond, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function deepEqual(name, actual, expected) {
  try {
    assertNode.deepStrictEqual(actual, expected);
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(err instanceof Error ? err.message : String(err));
  }
}

assert("core exists", fs.existsSync(CORE));
assert("preflight helper exists", fs.existsSync(PREFLIGHT));
assert("gosaki adapter exists", fs.existsSync(ADAPTER));
assert("doc exists", fs.existsSync(DOC));

const coreSrc = fs.readFileSync(CORE, "utf8");
const preflightSrc = fs.readFileSync(PREFLIGHT, "utf8");
const adapterSrc = fs.readFileSync(ADAPTER, "utf8");
const manualSrc = fs.readFileSync(MANUAL, "utf8");

assert(
  "Core has no gosaki-* import",
  !/from ["']\.\/gosaki-/.test(coreSrc) && !/gosaki-staging-admin-public-env/.test(coreSrc),
);
assert(
  "Core has no GOSAKI_SITE_KEY import",
  !/GOSAKI_SITE_KEY/.test(coreSrc),
);
assert("Core accepts resolveBuildEnv", /resolveBuildEnv/.test(coreSrc));
assert(
  "Core uses executeSitePackageBuildPrefights",
  /executeSitePackageBuildPrefights/.test(coreSrc),
);
assert(
  "preflight order resolveBuildEnv before git clean before mutex",
  /resolveBuildEnv[\s\S]*assertGitWorkingTreeClean[\s\S]*beforeFirstFilesystemWrite/.test(
    preflightSrc,
  ),
);
assert(
  "preflight has no gosaki-* import",
  !/from ["'].*gosaki-/i.test(preflightSrc),
);
assert(
  "manual-upload-package has no gosaki-* module import",
  !/from ["']\.\/gosaki-/.test(manualSrc),
);
assert(
  "adapter createGosakiResolveBuildEnv",
  /export function createGosakiResolveBuildEnv/.test(adapterSrc),
);

for (const base of ENTRYPOINTS) {
  const src = fs.readFileSync(path.join(__dirname, base), "utf8");
  assert(
    `${base} injects createGosakiResolveBuildEnv`,
    /createGosakiResolveBuildEnv/.test(src),
  );
  assert(
    `${base} injects createGosakiBeforeFirstFilesystemWrite`,
    /createGosakiBeforeFirstFilesystemWrite/.test(src),
  );
}

assert(
  "shouldApply gosaki only",
  shouldApplyGosakiPackageBuildEnvPreflight(GOSAKI_SITE_KEY) === true &&
    shouldApplyGosakiPackageBuildEnvPreflight("pilot-sample-static") === false,
);
assert(
  "non-gosaki create returns undefined",
  createGosakiResolveBuildEnv("pilot-sample-static") === undefined,
);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cms-core-pkg-env-"));
const packageDir = path.join(tmp, "pkg");
const staleProbe = path.join(tmp, "stale-probe.txt");
const markerProbe = path.join(tmp, "marker-probe.txt");
fs.mkdirSync(packageDir, { recursive: true });
fs.writeFileSync(staleProbe, "unchanged", "utf8");
fs.writeFileSync(markerProbe, "unchanged", "utf8");
const beforeListing = fs.readdirSync(tmp).sort().join(",");

/** @type {string[]} */
const order = [];
let resolveCalls = 0;
let mutexCalls = 0;
let gitCalls = 0;

const stagingEnv = {
  PUBLIC_SUPABASE_URL: STAGING_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fixture-anon",
  PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: `${STAGING_SUPABASE_URL}/functions/v1/gosaki-youtube-url-dry-run`,
  KEEP: "1",
};

const okPref = executeSitePackageBuildPrefights({
  siteKey: GOSAKI_SITE_KEY,
  processEnv: stagingEnv,
  resolveBuildEnv: (ctx) => {
    resolveCalls += 1;
    order.push("resolveBuildEnv");
    return {
      buildEnv: {
        ...ctx.env,
        PUBLIC_SUPABASE_URL: stagingEnv.PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_ANON_KEY: stagingEnv.PUBLIC_SUPABASE_ANON_KEY,
        PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT:
          stagingEnv.PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT,
        INJECTED: "yes",
      },
    };
  },
  assertGitWorkingTreeClean: () => {
    gitCalls += 1;
    order.push("gitClean");
  },
  beforeFirstFilesystemWrite: () => {
    mutexCalls += 1;
    order.push("mutex");
    return {
      mutex: {
        mutexChecked: true,
        mutexReason: "ok",
        armedCount: 0,
        armedFeatureIds: [],
      },
    };
  },
});

assert("staging pref PASS", okPref.buildEnv.INJECTED === "yes");
assert("staging KEEP preserved", okPref.buildEnv.KEEP === "1");
assert("resolveBuildEnv once", resolveCalls === 1 && okPref.resolveBuildEnvCalls === 1);
assert("mutex once", mutexCalls === 1 && okPref.beforeFirstFilesystemWriteCalls === 1);
assert("git once", gitCalls === 1);
deepEqual("order resolve→git→mutex", order, ["resolveBuildEnv", "gitClean", "mutex"]);
assert("mutex evidence recorded", okPref.mutexEvidence?.mutexChecked === true);

// production ref fail-closed before git/mutex/FS
resolveCalls = 0;
mutexCalls = 0;
gitCalls = 0;
let prodThrew = false;
try {
  executeSitePackageBuildPrefights({
    siteKey: GOSAKI_SITE_KEY,
    processEnv: {},
    resolveBuildEnv: () => {
      resolveCalls += 1;
      throw Object.assign(new Error("production_ref_stop"), {
        validation: { ok: false, missing: [], errors: ["production"] },
      });
    },
    assertGitWorkingTreeClean: () => {
      gitCalls += 1;
    },
    beforeFirstFilesystemWrite: () => {
      mutexCalls += 1;
    },
  });
} catch (err) {
  prodThrew = /production_ref_stop/.test(String(err?.message ?? err));
}
assert("production STOP throws", prodThrew);
assert("production STOP before git", gitCalls === 0);
assert("production STOP before mutex", mutexCalls === 0);
assert("production resolve attempted once", resolveCalls === 1);

// unknown / invalid callback result
let badThrew = false;
try {
  executeSitePackageBuildPrefights({
    siteKey: "x",
    processEnv: {},
    resolveBuildEnv: () => ({ notBuildEnv: true }),
    assertGitWorkingTreeClean: () => {},
  });
} catch (err) {
  badThrew = /must return \{ buildEnv/.test(String(err?.message ?? err));
}
assert("invalid callback fail-closed", badThrew);

// non-Gosaki: no resolveBuildEnv → processEnv passthrough
const nonGosaki = executeSitePackageBuildPrefights({
  siteKey: "pilot-sample-static",
  processEnv: { A: "1" },
  assertGitWorkingTreeClean: () => {},
});
assert("non-Gosaki no resolve calls", nonGosaki.resolveBuildEnvCalls === 0);
assert("non-Gosaki env passthrough", nonGosaki.buildEnv.A === "1");
assert("non-Gosaki no mutex", nonGosaki.beforeFirstFilesystemWriteCalls === 0);

// FS probes unchanged
assert(
  "tempdir listing unchanged",
  fs.readdirSync(tmp).sort().join(",") === beforeListing,
);
assert("stale probe unchanged", fs.readFileSync(staleProbe, "utf8") === "unchanged");
assert("marker probe unchanged", fs.readFileSync(markerProbe, "utf8") === "unchanged");
assert("packageDir empty still", fs.readdirSync(packageDir).length === 0);

// marker legacy bake shape still builds
const marker = buildPackageRunMarker({
  runId: "fixture-run",
  generatedAt: "2026-07-30T00:00:00.000Z",
  sourceCommit: "deadbeef",
  siteKey: GOSAKI_SITE_KEY,
  profile: "staging",
  bake: {
    aboutWriteBackend: "supabase",
    aboutSaveUiArmed: false,
    publicAboutBuildRead: false,
  },
  buildReadEvidence: null,
  sourceTreeClean: true,
  mutex: okPref.mutexEvidence,
});
assert("marker has aboutWriteBackend", marker.aboutWriteBackend === "supabase");
assert("marker mutexChecked", marker.mutexChecked === true);
assert("marker no secret fields", !("PUBLIC_SUPABASE_ANON_KEY" in marker));

// document note refs
const docSrc = fs.readFileSync(DOC, "utf8");
assert("doc names resolveBuildEnv", docSrc.includes("resolveBuildEnv"));
assert("doc names preflight order", /production|staging-ref/i.test(docSrc));

// cleanup
fs.rmSync(tmp, { recursive: true, force: true });

// silence unused staging ref constants (kept for fixture clarity / future)
assert("staging ref known", STAGING_PROJECT_REF.length > 0);
assert("production ref known", PRODUCTION_REF_STOP.length > 0);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("OK cms-core-v2-package-public-env-site-adapter");
