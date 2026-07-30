/**
 * CMS Core v2 — Mio registry convert pilot verifier (historical name: noop-pilot).
 * After thin-adapter phase: Mio loads its own generatorHooksAdapter; Gosaki stays unloaded.
 * Without embedsBundle inject, Videos page stays scaffold placeholders (inject covered by thin verifier).
 *
 * npm: verify:cms-core-v2-mio-registry-noop-pilot
 * Run: node tools/static-to-astro/scripts/verify-cms-core-v2-mio-registry-noop-pilot.mjs
 *
 * Offline · no package generate · no FTP · no DB · temp convert under output/ cleaned up.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { generateAstroProject } from "./lib/astro-generator.mjs";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  DEFAULT_SITE_GENERATOR_HOOKS,
  SITE_GENERATOR_HOOK_FACTORIES,
  resolveSiteGeneratorHooksAsync,
} from "./lib/site-generator-hooks.mjs";
import {
  GOSAKI_SITE_KEY,
  MIO_KISARAGI_JAZZ_SITE_KEY,
  PILOT_SAMPLE_STATIC_SITE_KEY,
  getSiteRegistryEntry,
  listSiteKeys,
  resolveSiteKeyFromFixtureDir,
  resolveSitePackageBuildProfile,
} from "./lib/site-registry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const MIO_FIXTURE = path.join(TOOL_ROOT, "fixtures/mio-kisaragi-jazz");
const GOSAKI_FIXTURE = path.join(TOOL_ROOT, "fixtures/gosaki-piano");
const PILOT_FIXTURE = path.join(TOOL_ROOT, "fixtures/sample-static-site");
const GOSAKI_ADAPTER_REL = "scripts/lib/gosaki-site-generator-hooks-adapter.mjs";
const MIO_ADAPTER_REL = "scripts/lib/mio-site-generator-hooks-adapter.mjs";
const TEMP_OUT_REL = "output/_cms-core-v2-mio-registry-noop-pilot-tmp";

const EXPECTED_HTML = [
  "index.html",
  "about.html",
  "schedule.html",
  "schedule-2026-08.html",
  "schedule-2026-09.html",
  "discography.html",
  "videos.html",
  "contact.html",
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

function snapshotProtectedTrees() {
  const roots = [
    path.join(TOOL_ROOT, "output/manual-upload"),
    path.join(TOOL_ROOT, "output/static-public"),
    path.join(TOOL_ROOT, "public-dist"),
  ];
  /** @type {Record<string, string[]>} */
  const snap = {};
  for (const root of roots) {
    const key = path.relative(TOOL_ROOT, root).replace(/\\/g, "/");
    snap[key] = fs.existsSync(root) ? walkFiles(root).sort() : [];
  }
  return snap;
}

function fixtureFingerprint() {
  const files = walkFiles(MIO_FIXTURE).sort();
  return files
    .map((rel) => {
      const buf = fs.readFileSync(path.join(MIO_FIXTURE, rel));
      return `${rel}:${buf.length}:${buf.subarray(0, 32).toString("hex")}`;
    })
    .join("|");
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

const beforeProtected = snapshotProtectedTrees();
const beforeFixtureFp = fixtureFingerprint();

const registryRaw = fs.readFileSync(path.join(TOOL_ROOT, "config/sites/registry.json"), "utf8");
const registry = JSON.parse(registryRaw);
const keys = listSiteKeys(TOOL_ROOT);

assert("registry lists mio-kisaragi-jazz", keys.includes(MIO_KISARAGI_JAZZ_SITE_KEY));
assert(
  "registry mio appears once",
  keys.filter((k) => k === MIO_KISARAGI_JAZZ_SITE_KEY).length === 1,
);
assert("registry still lists gosaki", keys.includes(GOSAKI_SITE_KEY));
assert("registry still lists pilot", keys.includes(PILOT_SAMPLE_STATIC_SITE_KEY));

const mioEntry = getSiteRegistryEntry(MIO_KISARAGI_JAZZ_SITE_KEY, TOOL_ROOT);
assert("mio fixtureDir", mioEntry.fixtureDir === "fixtures/mio-kisaragi-jazz");
assert(
  "mio generatorHooksAdapter is thin mio adapter",
  mioEntry.generatorHooksAdapter === MIO_ADAPTER_REL,
);
assert(
  "mio registry JSON lists generatorHooksAdapter",
  registry.sites[MIO_KISARAGI_JAZZ_SITE_KEY].generatorHooksAdapter === MIO_ADAPTER_REL,
);
assert("mio no production packageProfile", !mioEntry.packageProfiles?.production);
assert("mio staging packageProfile exists", Boolean(mioEntry.packageProfiles?.staging));
assert(
  "mio staging deployBase",
  mioEntry.packageProfiles.staging.deployBase === "/cms-kit-staging/mio-kisaragi-jazz/",
);
assert("mio includesAdmin false", mioEntry.packageProfiles.staging.includesAdmin === false);
assert("mio no gosaki alias", !(mioEntry.slugSemantics?.legacyAliases ?? []).includes("gosaki"));
assert(
  "mio fixture basename resolves",
  resolveSiteKeyFromFixtureDir(MIO_FIXTURE, TOOL_ROOT) === MIO_KISARAGI_JAZZ_SITE_KEY,
);
assert(
  "mio deploy profiles file exists",
  fs.existsSync(path.join(TOOL_ROOT, "config/sites/mio-kisaragi-jazz.deploy-profiles.json")),
);

const mioProfile = resolveSitePackageBuildProfile(MIO_KISARAGI_JAZZ_SITE_KEY, "staging", {
  toolRoot: TOOL_ROOT,
});
assert("mio profile siteKey", mioProfile.siteKey === MIO_KISARAGI_JAZZ_SITE_KEY);
assert("mio profile fixtureDir", mioProfile.fixtureDir === "fixtures/mio-kisaragi-jazz");
assert("mio profile deployBase", mioProfile.deployBase === "/cms-kit-staging/mio-kisaragi-jazz/");
assert("mio profile includeGosakiReadOnlyAdmin false", mioProfile.includeGosakiReadOnlyAdmin === false);

assert(
  "factories empty before mio resolve",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 0,
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).join(","),
);

const mioHooks = await resolveSiteGeneratorHooksAsync(MIO_FIXTURE, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("mio hooks siteKey", mioHooks.siteKey === MIO_KISARAGI_JAZZ_SITE_KEY);
assert("mio hooks active true (thin adapter)", mioHooks.active === true);
assert(
  "mio footer is mio markup (not null)",
  typeof mioHooks.generateFooter(
    `<footer><ul class="sns-row"><li><a href="https://www.instagram.com/mio.kisaragi.fixture/">Instagram</a></li></ul></footer>`,
    { linkTransformContext: {} },
  ) === "string" &&
    /mio-footer-social-links/.test(
      mioHooks.generateFooter(
        `<footer><ul class="sns-row"><li><a href="https://www.instagram.com/mio.kisaragi.fixture/">Instagram</a></li></ul></footer>`,
        { linkTransformContext: {} },
      ),
    ),
);
assert(
  "mio hooks skip gosaki band profiles",
  mioHooks.applyPostGenerate("/tmp", {}).gosakiBandProfilesSummary?.applied === false,
);
assert(
  "mio in hook factories",
  Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, MIO_KISARAGI_JAZZ_SITE_KEY),
);
assert(
  "gosaki factory not loaded after mio resolve",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);
assert(
  "factories only mio after mio resolve",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1,
);

for (const name of EXPECTED_HTML) {
  assert(`fixture has ${name}`, fs.existsSync(path.join(MIO_FIXTURE, name)));
}

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
if (fs.existsSync(tempOut)) {
  removeGeneratedOutputDir(tempOut, TOOL_ROOT);
}

const convertResult = await generateAstroProject(MIO_FIXTURE, tempOut, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/mio-kisaragi-jazz",
  deployBase: "/cms-kit-staging/mio-kisaragi-jazz/",
  toolRoot: TOOL_ROOT,
});

assert("temp convert wrote pages", (convertResult?.writtenPages?.length ?? 0) >= 8);
assert(
  "gosaki factory not loaded after mio convert",
  !Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);
assert(
  "factories only mio after mio convert",
  Object.keys(SITE_GENERATOR_HOOK_FACTORIES).length === 1 &&
    Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, MIO_KISARAGI_JAZZ_SITE_KEY),
);

const writtenRel = walkFiles(tempOut);
const gosakiArtifacts = writtenRel.filter((f) =>
  /gosaki|BandProfiles|YouTubeEmbed|hubspot|admin\/index/i.test(f),
);
assert("mio convert no gosaki path artifacts", gosakiArtifacts.length === 0, gosakiArtifacts.join(", "));

const pageBasenames = (convertResult.writtenPages ?? []).map((p) =>
  path.basename(String(p)).replace(/\.astro$/, ""),
);
for (const stem of [
  "index",
  "about",
  "schedule",
  "schedule-2026-08",
  "schedule-2026-09",
  "discography",
  "videos",
  "contact",
]) {
  assert(
    `converted page stem ${stem}`,
    pageBasenames.includes(stem) ||
      writtenRel.some((f) => f.includes(`${stem}.astro`) || f.includes(`${stem}/index.astro`)),
    `pages=${pageBasenames.join(",")}`,
  );
}

const cssHits = writtenRel.filter((f) => f.endsWith(".css"));
assert("converted css present", cssHits.length > 0, cssHits.join(","));

const svgHits = writtenRel.filter((f) => f.endsWith(".svg"));
assert("converted svg assets present", svgHits.length >= 4, `count=${svgHits.length}`);

const textBlob = writtenRel
  .filter((f) => /\.(astro|html|css|svg)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(tempOut, f), "utf8"))
  .join("\n");

assert("generated pages/assets have zero gosaki tokens", !/gosaki/i.test(textBlob));
assert(
  "fixture source still has zero gosaki",
  !/gosaki/i.test(fs.readFileSync(path.join(MIO_FIXTURE, "index.html"), "utf8")),
);

const layoutRel = writtenRel.find((f) => /BaseLayout\.astro$/.test(f));
assert("BaseLayout generated", Boolean(layoutRel));
if (layoutRel) {
  const layout = fs.readFileSync(path.join(tempOut, layoutRel), "utf8");
  assert(
    "noindex retained via BaseLayout staging robots",
    /noindex/i.test(layout),
  );
}

const contactRel =
  writtenRel.find((f) => /contact\.astro$/.test(f)) ||
  writtenRel.find((f) => /contact\/index\.astro$/.test(f));
assert("contact page generated", Boolean(contactRel), writtenRel.filter((f) => /contact/i.test(f)).join(","));
if (contactRel) {
  const contactHtml = fs.readFileSync(path.join(tempOut, contactRel), "utf8");
  assert("contact no form action", !/<form[^>]*\baction\s*=/i.test(contactHtml));
  assert("contact no method=post", !/<form[^>]*method=["']post["']/i.test(contactHtml));
  assert("contact no type=submit", !/<button[^>]*type=["']submit["']/i.test(contactHtml));
  assert("contact keeps disabled submit UX", /disabled/i.test(contactHtml));
}

let brokenLocal = 0;
for (const f of writtenRel.filter((x) => /\.(astro|html|css)$/i.test(x))) {
  const abs = path.join(tempOut, f);
  const t = fs.readFileSync(abs, "utf8");
  for (const m of t.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const href = m[1];
    if (/^(https?:|\/\/|#|mailto:|data:)/i.test(href)) continue;
    if (href.startsWith("/")) continue;
    const target = path.resolve(path.dirname(abs), href.split("?")[0]);
    if (!fs.existsSync(target)) {
      brokenLocal += 1;
      if (brokenLocal <= 5) console.error(`  broken ref in ${f}: ${href}`);
    }
  }
}
assert("no broken relative asset refs in temp out", brokenLocal === 0, `broken=${brokenLocal}`);

assert(
  "default hooks legacy stubs unchanged",
  DEFAULT_SITE_GENERATOR_HOOKS.applyLegacyMonthStubs({}).count === 0,
);

const gosakiHooks = await resolveSiteGeneratorHooksAsync(GOSAKI_FIXTURE, {
  siteKey: GOSAKI_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("gosaki hooks still active after mio", gosakiHooks.active === true);
assert(
  "gosaki factory registered after gosaki resolve",
  Object.hasOwn(SITE_GENERATOR_HOOK_FACTORIES, GOSAKI_SITE_KEY),
);
assert(
  "gosaki adapter file still exists",
  fs.existsSync(path.join(TOOL_ROOT, GOSAKI_ADAPTER_REL)),
);

const pilotHooks = await resolveSiteGeneratorHooksAsync(PILOT_FIXTURE, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  toolRoot: TOOL_ROOT,
});
assert("pilot hooks still noop", pilotHooks.active === false);

/** Generic pilot convert must also stay gosaki-free */
const pilotTemp = path.join(TOOL_ROOT, "output/_cms-core-v2-mio-pilot-gosaki-free-tmp");
if (fs.existsSync(pilotTemp)) {
  removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);
}
const pilotConvert = await generateAstroProject(PILOT_FIXTURE, pilotTemp, {
  siteKey: PILOT_SAMPLE_STATIC_SITE_KEY,
  baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/pilot-sample-static",
  deployBase: "/cms-kit-staging/pilot-sample-static/",
  toolRoot: TOOL_ROOT,
});
assert("pilot convert wrote pages", (pilotConvert?.writtenPages?.length ?? 0) > 0);
const pilotBlob = walkFiles(pilotTemp)
  .filter((f) => /\.(astro|html|css|svg)$/i.test(f))
  .map((f) => fs.readFileSync(path.join(pilotTemp, f), "utf8"))
  .join("\n");
assert("pilot generated pages/assets have zero gosaki tokens", !/gosaki/i.test(pilotBlob));
removeGeneratedOutputDir(pilotTemp, TOOL_ROOT);

assert("source fixture unchanged", fixtureFingerprint() === beforeFixtureFp);

const afterProtected = snapshotProtectedTrees();
for (const key of Object.keys(beforeProtected)) {
  assert(
    `protected tree unchanged: ${key}`,
    JSON.stringify(beforeProtected[key]) === JSON.stringify(afterProtected[key]),
  );
}

const hooksUrl = pathToFileURL(path.join(TOOL_ROOT, "scripts/lib/site-generator-hooks.mjs")).href;
const registryUrl = pathToFileURL(path.join(TOOL_ROOT, "scripts/lib/site-registry.mjs")).href;
const isolated = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    `
import { SITE_GENERATOR_HOOK_FACTORIES, resolveSiteGeneratorHooksAsync } from ${JSON.stringify(hooksUrl)};
import { MIO_KISARAGI_JAZZ_SITE_KEY, GOSAKI_SITE_KEY } from ${JSON.stringify(registryUrl)};
const fixture = ${JSON.stringify(MIO_FIXTURE)};
const hooks = await resolveSiteGeneratorHooksAsync(fixture, {
  siteKey: MIO_KISARAGI_JAZZ_SITE_KEY,
  toolRoot: ${JSON.stringify(TOOL_ROOT)},
});
const factoryKeys = Object.keys(SITE_GENERATOR_HOOK_FACTORIES);
const ok =
  hooks.active === true &&
  hooks.siteKey === MIO_KISARAGI_JAZZ_SITE_KEY &&
  !factoryKeys.includes(GOSAKI_SITE_KEY) &&
  factoryKeys.length === 1 &&
  factoryKeys[0] === MIO_KISARAGI_JAZZ_SITE_KEY;
console.log(JSON.stringify({ ok, active: hooks.active, siteKey: hooks.siteKey, factoryKeys }));
process.exit(ok ? 0 : 1);
`,
  ],
  { cwd: TOOL_ROOT, encoding: "utf8", timeout: 60_000 },
);

assert(
  "isolated subprocess mio thin / no gosaki factory",
  isolated.status === 0,
  (isolated.stderr || isolated.stdout || "").slice(0, 400),
);

cleanupTemp();
assert("temp output removed", !tempOut || !fs.existsSync(tempOut));

const packageJson = fs.readFileSync(path.join(TOOL_ROOT, "package.json"), "utf8");
assert(
  "npm verify:cms-core-v2-mio-registry-noop-pilot",
  packageJson.includes("verify:cms-core-v2-mio-registry-noop-pilot"),
);

console.log("");
console.log(`cms-core-v2-mio-registry-noop-pilot: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
