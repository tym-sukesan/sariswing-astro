/**
 * CMS Core v2 — site-package verifier extension decoupling.
 * Tempdir / synthetic only · no package generate · no FTP · no live package mutate.
 *
 * Run: node scripts/verify-cms-core-v2-site-package-verifier-extension-decoupling.mjs
 * npm: verify:cms-core-v2-site-package-verifier-extension-decoupling
 */

import assertNode from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  makeTempDir,
  writeGosakiStagingExtensionHappyPublicDist,
  writeMinimalGenericPackage,
} from "./lib/cms-core-v2-site-package-verifier-extension-decoupling-fixtures.mjs";
import {
  createGosakiSitePackageExtensionVerifier,
  resolveSitePackageExtensionVerifierForSite,
  verifyGosakiSitePackageExtensions,
} from "./lib/gosaki-site-package-verifier-adapter.mjs";
import {
  normalizeSiteExtensionVerifierResult,
  verifySitePackage,
} from "./lib/verify-site-package-core.mjs";
import {
  GOSAKI_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  resolvePackageManifestMetaFromRegistry,
} from "./lib/site-registry.mjs";
import { verifyGosakiStagingContentExtensions } from "./lib/verify-site-package-gosaki-extensions.mjs";
import { resolvePackageZipName } from "./lib/manual-upload-package.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const CORE = path.join(__dirname, "lib/verify-site-package-core.mjs");
const ADAPTER = path.join(__dirname, "lib/gosaki-site-package-verifier-adapter.mjs");
const EXT = path.join(__dirname, "lib/verify-site-package-gosaki-extensions.mjs");
const FIXTURES = path.join(
  __dirname,
  "lib/cms-core-v2-site-package-verifier-extension-decoupling-fixtures.mjs",
);
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-site-package-verifier-extension-decoupling.md",
);
const CLI = path.join(__dirname, "verify-site-package.mjs");
const MANUAL = path.join(__dirname, "verify-manual-upload-package.mjs");

/** Pre-decoupling public return keys (no siteExtensionVerifierCallCount). */
const EXPECTED_RETURN_KEYS = Object.freeze([
  "ok",
  "errors",
  "manifest",
  "meta",
  "profile",
  "packageDir",
  "publicDist",
  "zipName",
  "expectAboutSaveUiArmed",
  "expectPublicAboutBuildRead",
].sort());

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

function assertReturnShape(name, result) {
  deepEqual(name, Object.keys(result).sort(), [...EXPECTED_RETURN_KEYS]);
  assert(
    `${name} has no siteExtensionVerifierCallCount`,
    !Object.prototype.hasOwnProperty.call(result, "siteExtensionVerifierCallCount"),
  );
}

assert("core exists", fs.existsSync(CORE));
assert("adapter exists", fs.existsSync(ADAPTER));
assert("extensions exist", fs.existsSync(EXT));
assert("fixtures exist", fs.existsSync(FIXTURES));
assert("doc exists", fs.existsSync(DOC));

const coreSrc = fs.readFileSync(CORE, "utf8");
const adapterSrc = fs.readFileSync(ADAPTER, "utf8");
const cliSrc = fs.readFileSync(CLI, "utf8");
const manualSrc = fs.readFileSync(MANUAL, "utf8");
const docSrc = fs.readFileSync(DOC, "utf8");

assert(
  "Core has no gosaki-* module import",
  !/from ["']\.\/gosaki-/.test(coreSrc),
);
assert(
  "Core has no verify-site-package-gosaki-extensions import",
  !/verify-site-package-gosaki-extensions/.test(coreSrc),
);
assert(
  "Core has no GOSAKI_SITE_KEY",
  !/\bGOSAKI_SITE_KEY\b/.test(coreSrc),
);
assert(
  "Core accepts siteExtensionVerifier",
  /siteExtensionVerifier/.test(coreSrc),
);
assert(
  "Core return has no siteExtensionVerifierCallCount",
  !/\bsiteExtensionVerifierCallCount\b/.test(coreSrc),
);
assert(
  "doc has no siteExtensionVerifierCallCount return field",
  !/\bsiteExtensionVerifierCallCount\b/.test(docSrc),
);
assert(
  "Adapter imports gosaki extensions",
  /verify-site-package-gosaki-extensions/.test(adapterSrc),
);
assert(
  "Adapter owns schedule/2026-08",
  adapterSrc.includes("schedule/2026-08"),
);
assert(
  "CLI injects resolveSitePackageExtensionVerifierForSite",
  /resolveSitePackageExtensionVerifierForSite/.test(cliSrc),
);
assert(
  "manual-upload injects createGosakiSitePackageExtensionVerifier",
  /createGosakiSitePackageExtensionVerifier/.test(manualSrc),
);

deepEqual(
  "normalize string[]",
  normalizeSiteExtensionVerifierResult(["a", "b"]),
  { errors: ["a", "b"], invalid: false },
);
deepEqual(
  "normalize { errors }",
  normalizeSiteExtensionVerifierResult({ errors: ["x"] }),
  { errors: ["x"], invalid: false },
);
deepEqual(
  "normalize null",
  normalizeSiteExtensionVerifierResult(null),
  { errors: [], invalid: false },
);
deepEqual(
  "normalize invalid → fail-closed",
  normalizeSiteExtensionVerifierResult({ ok: true }),
  {
    errors: ["siteExtensionVerifier must return string[] or { errors: string[] }"],
    invalid: true,
  },
);

const missingDir = path.join(TOOL_ROOT, "output", "__cms-core-v2-no-such-package__");

// --- generic: callback unset ---
const noCb = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: missingDir,
  toolRoot: TOOL_ROOT,
});
assertReturnShape("return shape: generic no callback", noCb);
assert(
  "callback unset has package dir missing",
  noCb.errors.includes("package dir missing"),
);
assert(
  "callback unset does not invent gosaki schedule class error",
  !noCb.errors.some((e) => /gosaki-schedule-month/.test(e)),
);

// --- Gosaki extension PASS (stub returns []) ---
let passCallCount = 0;
const passCb = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: missingDir,
  toolRoot: TOOL_ROOT,
  siteExtensionVerifier: () => {
    passCallCount += 1;
    return [];
  },
});
assert("Gosaki extension PASS callCount === 1", passCallCount === 1);
assertReturnShape("return shape: extension PASS", passCb);
assert(
  "extension PASS does not add extension errors",
  !passCb.errors.includes("extension-marker-error"),
);

// --- Gosaki extension errors ---
let errCallCount = 0;
const withCb = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: missingDir,
  toolRoot: TOOL_ROOT,
  siteExtensionVerifier: (ctx) => {
    errCallCount += 1;
    assert("ctx has packageDir", typeof ctx.packageDir === "string");
    return ["extension-marker-error"];
  },
});
assert("extension errors callCount === 1", errCallCount === 1);
assertReturnShape("return shape: extension errors", withCb);
assert(
  "extension errors merged",
  withCb.errors.includes("extension-marker-error"),
);
assert("extension errors → ok false", withCb.ok === false);

// --- callback invalid return ---
let invalidCallCount = 0;
const invalidCb = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: missingDir,
  toolRoot: TOOL_ROOT,
  siteExtensionVerifier: () => {
    invalidCallCount += 1;
    return { notErrors: true };
  },
});
assert("invalid callback callCount === 1", invalidCallCount === 1);
assertReturnShape("return shape: invalid callback", invalidCb);
assert(
  "invalid callback fail-closed",
  invalidCb.errors.includes(
    "siteExtensionVerifier must return string[] or { errors: string[] }",
  ),
);
assert("invalid callback → ok false", invalidCb.ok === false);

// --- callback throw ---
let throwCallCount = 0;
const throwCb = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: missingDir,
  toolRoot: TOOL_ROOT,
  siteExtensionVerifier: () => {
    throwCallCount += 1;
    throw new Error("boom-extension");
  },
});
assert("throwing callback callCount === 1", throwCallCount === 1);
assertReturnShape("return shape: throwing callback", throwCb);
assert(
  "throwing callback fail-closed",
  throwCb.errors.some((e) => /siteExtensionVerifier threw: boom-extension/.test(e)),
);
assert("throwing callback → ok false", throwCb.ok === false);

assert(
  "resolveSitePackageExtensionVerifierForSite gosaki",
  typeof resolveSitePackageExtensionVerifierForSite(GOSAKI_SITE_KEY) === "function",
);
assert(
  "resolveSitePackageExtensionVerifierForSite pilot null",
  resolveSitePackageExtensionVerifierForSite(PILOT_SAMPLE_STATIC_SITE_KEY) === null,
);

const emptyPkg = makeTempDir("cms-core-v2-gosaki-ext-empty-");
fs.mkdirSync(path.join(emptyPkg, "public-dist"), { recursive: true });
const missingExt = verifyGosakiSitePackageExtensions({
  siteKey: GOSAKI_SITE_KEY,
  profileName: "staging",
  packageDir: emptyPkg,
  publicDist: path.join(emptyPkg, "public-dist"),
  repoRoot: path.resolve(TOOL_ROOT, "../.."),
  meta: { deployBase: "/cms-kit-staging/gosaki-piano/" },
});
assert(
  "Gosaki extension fails without schedule/2026-08",
  missingExt.some((e) => e.includes("schedule/2026-08")),
);

const happyPkg = makeTempDir("cms-core-v2-gosaki-ext-happy-");
const deployBase = "/cms-kit-staging/gosaki-piano/";
writeGosakiStagingExtensionHappyPublicDist(happyPkg, deployBase);
fs.writeFileSync(
  path.join(happyPkg, "README-UPLOAD.md"),
  `STAGING package\n${deployBase}\npublic-dist\nDo not upload the \`public-dist\` folder itself\nmirror\n`,
);
fs.writeFileSync(
  path.join(happyPkg, "CHECKLIST.md"),
  "targetEnvironment\nsourceCommit\ngeneratedAt\n",
);
const contentErrors = verifyGosakiStagingContentExtensions(happyPkg, deployBase);
deepEqual("Gosaki staging content extensions happy → []", contentErrors, []);

const pilotMeta = resolvePackageManifestMetaFromRegistry(PILOT_SAMPLE_STATIC_SITE_KEY, "staging", {
  toolRoot: TOOL_ROOT,
});
const pilotPkg = makeTempDir("cms-core-v2-pilot-pkg-");
const zipName = resolvePackageZipName(pilotMeta.siteSlug, pilotMeta.packageProfileName);
writeMinimalGenericPackage({
  packageDir: pilotPkg,
  siteKey: pilotMeta.siteKey,
  siteSlug: pilotMeta.siteSlug,
  packageProfileName: pilotMeta.packageProfileName,
  targetEnvironment: pilotMeta.targetEnvironment,
  publicBaseUrl: pilotMeta.publicBaseUrl,
  intendedRemotePath: pilotMeta.intendedRemotePath,
  deployBase: pilotMeta.deployBase,
  includesAdmin: pilotMeta.includesAdmin,
  zipName,
});
const pilotCoreOnly = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: pilotPkg,
  toolRoot: TOOL_ROOT,
});
assertReturnShape("return shape: generic package Core-only", pilotCoreOnly);
assert(
  "generic package Core-only does not require gosaki schedule page",
  !pilotCoreOnly.errors.some((e) => /schedule\/2026-08/.test(e)),
);

let misapplyCallCount = 0;
const misapplied = verifySitePackage({
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  profileName: "staging",
  packageDir: pilotPkg,
  toolRoot: TOOL_ROOT,
  siteExtensionVerifier: (ctx) => {
    misapplyCallCount += 1;
    return createGosakiSitePackageExtensionVerifier()(ctx);
  },
});
assert("mis-apply Gosaki callCount === 1", misapplyCallCount === 1);
assertReturnShape("return shape: mis-applied Gosaki extension", misapplied);
assert(
  "mis-applying Gosaki extension to pilot yields Gosaki errors",
  misapplied.errors.some((e) => /schedule\/2026-08|gosaki-schedule/.test(e)),
);

try {
  fs.rmSync(emptyPkg, { recursive: true, force: true });
  fs.rmSync(happyPkg, { recursive: true, force: true });
  fs.rmSync(pilotPkg, { recursive: true, force: true });
} catch {
  /* ignore */
}

if (failed > 0) {
  console.error(
    `\nFAIL site-package-verifier-extension-decoupling: ${failed} failed, ${passed} passed`,
  );
  process.exit(1);
}
console.log(`\nOK site-package-verifier-extension-decoupling: ${passed} passed`);
process.exit(0);
