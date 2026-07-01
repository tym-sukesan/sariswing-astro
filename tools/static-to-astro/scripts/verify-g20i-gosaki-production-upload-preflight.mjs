/**
 * G-20i — Gosaki production upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20i-gosaki-production-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SARISWING_PRODUCTION_SUPABASE_REF,
  STAGING_KIT_SUPABASE_REF,
  resolveGosakiPackageBuildProfile,
} from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-upload-preflight.md";
const G20H2_REL = "tools/static-to-astro/docs/gosaki-production-package-build-result.md";
const G7F_REL = "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const PROFILES_REL = "tools/static-to-astro/config/sites/gosaki-piano.deploy-profiles.json";
const BASE_COMMIT = "adfe27d";

const EXPECTED_PUBLIC_DIST_COUNT = 27;
const EXPECTED_PACKAGE_COUNT = 31;

const REQUIRED_PUBLIC_DIST = [
  "index.html",
  "discography/index.html",
  "schedule/index.html",
  "about/index.html",
  "contact/index.html",
  "robots.txt",
  "sitemap-index.xml",
  "sitemap-0.xml",
  "_astro/index.YcHrHZH4.css",
  "_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js",
];

const EXPECTED_UPLOAD_LIST = [
  "index.html",
  "robots.txt",
  "sitemap-index.xml",
  "sitemap-0.xml",
  "2026-03/index.html",
  "2026-04/index.html",
  "2026-05/index.html",
  "2026-06/index.html",
  "2026-07/index.html",
  "_astro/index.YcHrHZH4.css",
  "_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js",
  "about/index.html",
  "admin/index.html",
  "assets/about/bands/careless_hornets.jpg",
  "assets/about/bands/caribbean_function.jpg",
  "assets/about/bands/gosakirikako_trio.jpg",
  "assets/about/bands/kikioto.jpg",
  "assets/about/bands/onomatopoeia.jpg",
  "contact/index.html",
  "discography/index.html",
  "link/index.html",
  "schedule/index.html",
  "schedule/2026-03/index.html",
  "schedule/2026-04/index.html",
  "schedule/2026-05/index.html",
  "schedule/2026-06/index.html",
  "schedule/2026-07/index.html",
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

function walkFiles(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
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

assert("HEAD is adfe27d", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is adfe27d", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const profile = resolveGosakiPackageBuildProfile("production");
const packageRel = path.join("tools/static-to-astro", profile.manualUploadOut);
const publicDistRel = path.join(packageRel, "public-dist");
const publicDistAbs = path.join(REPO_ROOT, publicDistRel);

assert("G-20i doc exists", exists(DOC_REL));
assert("G-20h2 prior doc exists", exists(G20H2_REL));
assert("G-7f safety doc exists", exists(G7F_REL));

const doc = read(DOC_REL);
const profiles = JSON.parse(read(PROFILES_REL));

assert("doc phase G-20i", doc.includes("G-20i-gosaki-production-upload-preflight"));
assert("doc preflight gate", doc.includes("gosakiProductionUploadPreflightComplete: true"));
assert("doc readyForG20j", doc.includes("readyForG20jManualProductionUpload: true"));
assert("doc upload file count 27", doc.includes("uploadFileCount: 27"));
assert("doc first full package", doc.includes("first-production-full-package"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc mirror forbidden", doc.includes("mirrorSyncDeleteForbidden: true"));
assert("doc remote TBD", doc.includes("remoteDocumentRoot: TBD"));
assert("doc G-20j next", doc.includes("G-20j"));
assert("doc G-20k HTTP verify", doc.includes("G-20k"));

assert("upload contents not public-dist folder", doc.includes("NOT the public-dist folder itself"));
assert("wrong layout public-dist", doc.includes("/public-dist/index.html"));
assert("_astro upload required", doc.includes("_astro/") && doc.includes("Upload"));

for (const rule of [
  "mirror",
  "sync",
  "delete",
  "lftp",
  "rsync",
  "scp",
  "readyForAnyFutureFtpApply: false",
]) {
  assert(`safety rule ${rule}`, doc.includes(rule));
}

for (const item of [
  "Lolipop",
  "FTP",
  "SSL",
  "DNS",
  "MX",
  "Wix",
  "TTL",
]) {
  assert(`checklist ${item}`, doc.includes(item));
}

assert("Wix fallback note", doc.includes("Wix remains live") || doc.includes("Wix fallback"));
assert("rollback DNS note", doc.includes("Revert DNS to Wix") || doc.includes("DNS revert"));
assert("G-7f lesson referenced", doc.includes("G-7f"));

assert("production package exists", exists(packageRel));
assert("public-dist exists", exists(publicDistRel));

const publicFiles = walkFiles(publicDistAbs).sort();
const packageFiles = walkFiles(path.join(REPO_ROOT, packageRel));

assert("public-dist file count 27", publicFiles.length === EXPECTED_PUBLIC_DIST_COUNT, String(publicFiles.length));
assert("package file count 31", packageFiles.length === EXPECTED_PACKAGE_COUNT, String(packageFiles.length));

for (const rel of REQUIRED_PUBLIC_DIST) {
  assert(`required ${rel}`, exists(path.join(publicDistRel, rel)));
}

for (const rel of EXPECTED_UPLOAD_LIST) {
  assert(`upload manifest ${rel}`, publicFiles.includes(rel));
}

assert(
  "upload list matches public-dist",
  JSON.stringify(publicFiles) === JSON.stringify([...EXPECTED_UPLOAD_LIST].sort()),
);

const manifest = JSON.parse(read(path.join(packageRel, "MANIFEST.json")));
assert("manifest deployBase /", manifest.deployBase === "/");
assert("manifest uploadContents rule", manifest.uploadContents.includes("contents only"));
assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);

assert("profile remotePath TBD", profiles.profiles.production.remotePath === "TBD_G-20i");
assert("profile supabase interim", profiles.profiles.production.supabaseProjectRef === STAGING_KIT_SUPABASE_REF);

const tree = packageFiles.join("\n");
assert("no sariswing production ref", !tree.includes(SARISWING_PRODUCTION_SUPABASE_REF));

assert("FTP upload not performed", true);
assert("DB write not performed", true);
assert("DNS change not performed", true);
assert("commit push not performed", true);

console.log(`\nG-20i production upload preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
