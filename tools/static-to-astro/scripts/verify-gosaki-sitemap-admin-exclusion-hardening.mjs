/**
 * G-20t1 — Gosaki sitemap admin exclusion hardening verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-sitemap-admin-exclusion-hardening.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  shouldIncludePageInSitemap,
  isCmsKitSitemapExcludedPath,
} from "./lib/sitemap-exclusions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-sitemap-admin-exclusion-hardening.md";
const PACKAGE_SITEMAP = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/sitemap-0.xml";
const ASTRO_CONFIG = "tools/static-to-astro/output/gosaki-piano-astro/astro.config.mjs";
const BASE_COMMIT = "6a1fdeb"; // historical phase base — not a current gate
const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";

const PUBLIC_ROUTES = [
  "/",
  "/about/",
  "/contact/",
  "/discography/",
  "/link/",
  "/schedule/",
  "/schedule/2026-08/",
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

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function noteHeadPin(label, actual, expected) {
  console.log(`NOTE ${label}: current=${actual}, historical phase base=${expected} (non-blocking)`);
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

const doc = exists(DOC_REL) ? read(DOC_REL) : "";
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

noteHeadPin("HEAD", head, BASE_COMMIT);
noteHeadPin("origin/main", origin, BASE_COMMIT);

assert("hardening doc exists", exists(DOC_REL));
assert("sitemap-exclusions module exists", exists("tools/static-to-astro/scripts/lib/sitemap-exclusions.mjs"));

if (exists(DOC_REL)) {
  assert("phase G-20t1", /G-20t1-gosaki-sitemap-admin-exclusion-hardening/i.test(doc));
  assert("gate complete", /gosakiSitemapAdminExclusionHardeningComplete: true/i.test(doc));
}

// Unit: exclusion rules
assert("exclude admin path", isCmsKitSitemapExcludedPath("/cms-kit-staging/gosaki-piano/admin/"));
assert("exclude staging shell", isCmsKitSitemapExcludedPath("/__admin-staging-shell/musician-basic/"));
assert("exclude api", isCmsKitSitemapExcludedPath("/api/admin/me.json"));
assert(
  "exclude legacy month root",
  shouldIncludePageInSitemap(`${STAGING_BASE}/2026-08/`) === false,
);
assert(
  "include schedule august",
  shouldIncludePageInSitemap(`${STAGING_BASE}/schedule/2026-08/`) === true,
);
assert(
  "include public about",
  shouldIncludePageInSitemap(`${STAGING_BASE}/about/`) === true,
);

// Generated astro config
if (exists(ASTRO_CONFIG)) {
  const cfg = read(ASTRO_CONFIG);
  assert("astro config sitemap filter", cfg.includes("filter: (page)") && cfg.includes("/admin"));
}

// Package sitemap (post-regen)
if (exists(PACKAGE_SITEMAP)) {
  const xml = read(PACKAGE_SITEMAP);
  const locs = sitemapLocs(xml);
  assert("sitemap has schedule august", locs.some((u) => u.includes("/schedule/2026-08/")));
  assert("sitemap no legacy august root", !locs.some((u) => /\/2026-08\/$/.test(u) && !u.includes("/schedule/")));
  assert("sitemap no admin", !locs.some((u) => /\/admin\//.test(u) || u.endsWith("/admin/")));
  for (const route of PUBLIC_ROUTES) {
    if (route === "/") {
      assert("sitemap has home", locs.some((u) => u === `${STAGING_BASE}/`));
    } else {
      assert(`sitemap has ${route}`, locs.some((u) => u.endsWith(route)));
    }
  }
} else {
  console.error("WARN package sitemap missing — run build-gosaki-staging-admin-package.mjs");
}

assert("00-current-state mentions G-20t1", /G-20t1|sitemap-admin-exclusion/i.test(currentState));
assert("03-next-actions mentions G-20t1", /G-20t1|sitemap-admin-exclusion/i.test(nextActions));
assert("handoff mentions G-20t1", /G-20t1|sitemap-admin-exclusion/i.test(handoff));

console.log(
  `\nG-20t1 Gosaki sitemap admin exclusion hardening verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
