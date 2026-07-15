/**
 * G-20u38b Gosaki production package generation at HEAD verifier.
 * Validates result doc + on-disk production package artifacts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-package-generation-at-head-result.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-profile-static-preflight-result.md";
const PACKAGE_DIR = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano-production");
const PUBLIC_DIST = path.join(PACKAGE_DIR, "public-dist");
const MANIFEST_PATH = path.join(PACKAGE_DIR, "MANIFEST.json");
const PHASE = "G-20u38b-gosaki-production-package-generation-at-head";
const GATE = "gosakiProductionPackageGeneratedAtHead: true";
const NEXT = "G-20u38c-gosaki-production-package-verification-review";
const GENERATION_HEAD = "4259c8c";
const PROD_PUBLIC_BASE = "https://www.gosaki-piano.com/";
const MARKER = "On a Clear Day [CMS Kit staging G-20u36e]";
const TBD_REMOTE = "TBD_G-20i";
const PRODUCTION_STOP_REF = "vsbvndwuajjhnzpohghh";

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

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function grepDir(dir, pattern, { htmlOnly = false } = {}) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
  const hits = [];
  for (const file of walkFiles(dir)) {
    if (htmlOnly && !file.endsWith(".html")) continue;
    const text = fs.readFileSync(file, "utf8");
    if (re.test(text)) hits.push(path.relative(dir, file));
  }
  return hits;
}

function headFull() {
  return spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).stdout.trim();
}

assert("result doc exists", exists(DOC_REL));
assert("prior G-20u38a doc exists", exists(PRIOR_DOC_REL));
assert("production package dir exists", fs.existsSync(PACKAGE_DIR));
assert("public-dist exists", fs.existsSync(PUBLIC_DIST));
assert("MANIFEST.json exists", fs.existsSync(MANIFEST_PATH));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const head = headFull();

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "production package generated",
  /Production package generated.*yes|productionPackageGenerated:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_PACKAGE_CONTENT_OK true",
  /PRODUCTION_PACKAGE_CONTENT_OK:\s*true|productionPackageContentOk:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_PACKAGE_FRESH true",
  /PRODUCTION_PACKAGE_FRESH:\s*true|productionPackageFresh:\s*true/i.test(doc),
);
assert(
  "PRODUCTION_PACKAGE_VERIFIED_FOR_UPLOAD false",
  /PRODUCTION_PACKAGE_VERIFIED_FOR_UPLOAD:\s*false|productionPackageVerifiedForUpload:\s*false/i.test(
    doc,
  ),
);
assert(
  "not upload-verified wording",
  !/PRODUCTION_PACKAGE_VERIFIED:\s*true|productionPackageVerified:\s*true/i.test(doc),
);
assert(
  "G20I3 drift resolved documented",
  /G20I3_VERIFIER_DRIFT_RESOLVED:\s*true|g20i3VerifierDriftResolved:\s*true/i.test(doc),
);
assert(
  "G20I3 drift at generation documented",
  /G20I3_VERIFIER_DRIFT:\s*true|g20i3VerifierDrift:\s*true/i.test(doc),
);
assert(
  "pipeline exit 1 documented",
  /Pipeline exit.*\*\*1\*\*|pipeline exit.*1/i.test(doc),
);
assert(
  "G-20i3 70/73 documented",
  /70\/73/i.test(doc),
);
assert(
  "PRODUCTION_UPLOAD_READY false",
  /PRODUCTION_UPLOAD_READY:\s*false|productionUploadReady:\s*false/i.test(doc),
);
assert(
  "PUBLIC_READY CONDITIONAL",
  /PUBLIC_READY:\s*CONDITIONAL|publicReady:\s*conditional/i.test(doc),
);
assert(
  "no FTP upload",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert("generation HEAD 4259c8c", doc.includes(GENERATION_HEAD));
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("P0_STOP false", /P0_STOP:\s*false|p0Stop:\s*false/i.test(doc));
assert(
  "freshness PASS documented",
  /verify:package-freshness.*PASS|freshness.*PASS/i.test(doc),
);
assert(
  "preflight PASS documented",
  /preflight:gosaki:production.*PASS|preflight.*PASS/i.test(doc),
);
assert(
  "admin exclusion section",
  /Admin exclusion/i.test(doc),
);
assert(
  "marker absent documented",
  /marker.*absent|0 hits/i.test(doc) && doc.includes("On a Clear Day"),
);
assert(
  "TBD remote path",
  doc.includes(TBD_REMOTE),
);

assert(
  "manifest sourceCommit matches generation HEAD in doc",
  manifest.sourceCommit.startsWith(GENERATION_HEAD),
  `${manifest.sourceCommit} vs doc ${GENERATION_HEAD}`,
);
if (manifest.sourceCommit !== head) {
  console.log(
    `NOTE on-disk prod sourceCommit ${manifest.sourceCommit.slice(0, 7)} stale vs current HEAD ${head.slice(0, 7)} — expected until G-20u38b2 regen`,
  );
}
assert("manifest fileCount 30", manifest.fileCount === 30);
assert("manifest safeForStaticFtp true", manifest.safeForStaticFtp === true);
assert("manifest publicBaseUrl prod", manifest.publicBaseUrl === PROD_PUBLIC_BASE);
assert("manifest includesAdmin false", manifest.includesAdmin === false);
assert("manifest targetEnvironment production", manifest.targetEnvironment === "production");
assert("manifest intendedRemotePath TBD", manifest.intendedRemotePath === TBD_REMOTE);

const publicFiles = walkFiles(PUBLIC_DIST);
assert("public-dist file count 30", publicFiles.length === 30, String(publicFiles.length));
assert(
  "admin index absent",
  !fs.existsSync(path.join(PUBLIC_DIST, "admin/index.html")),
);
assert(
  "admin dir absent",
  !fs.existsSync(path.join(PUBLIC_DIST, "admin")),
);

const markerHits = grepDir(PUBLIC_DIST, MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
assert("marker absent in public-dist", markerHits.length === 0);

const discHtml = fs.readFileSync(
  path.join(PUBLIC_DIST, "discography/index.html"),
  "utf8",
);
assert("discography On a Clear Day", discHtml.includes("On a Clear Day"));
assert("discography Like a Lover", discHtml.includes("Like a Lover"));
assert("discography no marker", !discHtml.includes(MARKER));

const stagingHits = grepDir(PUBLIC_DIST, /yskcreate|cms-kit-staging\/gosaki-piano/, {
  htmlOnly: true,
});
assert("no staging URL in public HTML", stagingHits.length === 0, stagingHits.join(", "));

const robots = fs.readFileSync(path.join(PUBLIC_DIST, "robots.txt"), "utf8");
assert("robots Allow /", /Allow:\s*\//i.test(robots));
assert("robots not Disallow all", !/^Disallow:\s*\/\s*$/m.test(robots));

const sitemap = fs.readFileSync(path.join(PUBLIC_DIST, "sitemap-0.xml"), "utf8");
assert("sitemap prod URLs", sitemap.includes("https://www.gosaki-piano.com/"));
assert("sitemap no admin", !sitemap.includes("/admin/"));

const htmlEyJ = grepDir(PUBLIC_DIST, /eyJ[A-Za-z0-9_-]{10,}/, { htmlOnly: true });
assert("no eyJ in public HTML", htmlEyJ.length === 0);

const htmlServiceRole = grepDir(PUBLIC_DIST, /service_role|SUPABASE_SERVICE_ROLE/i, {
  htmlOnly: true,
});
assert("no service_role in public HTML", htmlServiceRole.length === 0);

const htmlAdminUi = grepDir(PUBLIC_DIST, /READ-ONLY|STAGING ONLY|Save disabled|gra-admin-probe/, {
  htmlOnly: true,
});
assert("no admin UI strings in public HTML", htmlAdminUi.length === 0);

const prodRefHtml = grepDir(PUBLIC_DIST, PRODUCTION_STOP_REF, { htmlOnly: true });
assert("no sariswing prod ref in public HTML", prodRefHtml.length === 0);

assert(
  "prior G-20u38a gate",
  priorDoc.includes("gosakiProductionProfileStaticPreflightCompleted: true"),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u38b-gosaki-production-package-generation-at-head",
  ),
);
assert(
  "00-current-state mentions G-20u38b",
  currentState.includes("G-20u38b") || currentState.includes(PHASE),
);
assert(
  "03-next-actions mentions G-20u38b",
  nextActions.includes("G-20u38b") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u38b",
  handoff.includes("G-20u38b") || handoff.includes(PHASE),
);

console.log(
  `\nverify-g20u38b-gosaki-production-package-generation-at-head: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
