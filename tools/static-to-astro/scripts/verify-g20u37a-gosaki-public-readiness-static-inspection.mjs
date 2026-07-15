/**
 * G-20u37a Gosaki public-readiness static inspection verifier.
 * Read-only inspection result record — no implementation / Save / SQL / package / FTP.
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
  "tools/static-to-astro/docs/gosaki-public-readiness-static-inspection-result.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-public-readiness-qa-planning.md";
const PHASE = "G-20u37a-gosaki-public-readiness-static-inspection";
const GATE = "gosakiPublicReadinessStaticInspectionCompleted: true";
const NEXT = "G-20u37b-gosaki-public-readiness-manual-browser-qa";
const SOURCE_COMMIT = "e3616a3ab0fbda280d75278b0a6275205ae74763";
const STG_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const MARKER_TITLE = "On a Clear Day [CMS Kit staging G-20u36e]";
const ORIGINAL_TITLE = "On a Clear Day";
const TRACK_7 = "Like a Lover";

const PUBLIC_DIST = path.join(
  TOOL_ROOT,
  "output/manual-upload/gosaki-piano/public-dist",
);

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

function grepDir(dir, pattern, { excludeAdmin = false } = {}) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
  const hits = [];
  for (const file of walkFiles(dir)) {
    if (excludeAdmin && file.includes(`${path.sep}admin${path.sep}`)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (re.test(text)) hits.push(path.relative(dir, file));
  }
  return hits;
}

assert("result doc exists", exists(DOC_REL));
assert("planning doc exists", exists(PLAN_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "inspection only",
  /inspectionOnly:\s*true|inspection only|read-only static inspection/i.test(doc),
);
assert(
  "no implementation",
  /Implementation.*\*\*no\*\*|implementationExecuted:\s*false/i.test(doc),
);
assert(
  "no Save",
  /Save.*\*\*no\*\*|saveExecuted:\s*false/i.test(doc),
);
assert(
  "no SQL",
  /SQL.*\*\*no\*\*|sqlExecuted:\s*false/i.test(doc),
);
assert(
  "no DB write",
  /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc),
);
assert(
  "no Edge deploy",
  /Edge deploy.*\*\*no\*\*|edgeDeployExecuted:\s*false/i.test(doc),
);
assert(
  "no package generation",
  /Package generation.*\*\*no\*\*|packageGenerationExecuted:\s*false/i.test(doc),
);
assert(
  "no FTP upload",
  /FTP.*\*\*no\*\*|ftpUploadExecuted:\s*false/i.test(doc),
);
assert(
  "service_role unused",
  /service_role.*not used|serviceRoleUsed:\s*false/i.test(doc),
);
assert(
  "production unchanged",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false/i.test(doc),
);
assert(
  "P0_BLOCKERS false",
  /P0_BLOCKERS:\s*false|p0Blockers:\s*false/i.test(doc),
);
assert(
  "PUBLIC_READY NO",
  /PUBLIC_READY:\s*NO|publicReady:\s*false/i.test(doc),
);
assert(
  "STAGING_QA_READY YES",
  /STAGING_QA_READY:\s*YES|stagingQaReady:\s*true/i.test(doc),
);
assert(
  "STAGING_BROWSER_QA_READY YES",
  /STAGING_BROWSER_QA_READY:\s*YES|stagingBrowserQaReady:\s*true/i.test(doc),
);
assert(`next ${NEXT}`, doc.includes(NEXT));
assert("artifact sourceCommit e3616a3", doc.includes(SOURCE_COMMIT));
assert("P0 findings section", /P0 findings/i.test(doc));
assert("P1 findings section", /P1 findings/i.test(doc));
assert("P2 findings section", /P2 findings/i.test(doc));
assert(
  "manual browser QA carryovers",
  /Manual browser QA carryovers|manual browser QA carryovers/i.test(doc),
);
assert(
  "marker absent documented",
  /marker.*absent|0 hits/i.test(doc) && !doc.includes(`present in static`),
);
assert(
  "discography On a Clear Day restored",
  doc.includes(ORIGINAL_TITLE) && doc.includes(TRACK_7),
);
assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u37a-gosaki-public-readiness-static-inspection",
  ),
);
assert(
  "00-current-state mentions G-20u37a",
  currentState.includes(PHASE) || currentState.includes("G-20u37a"),
);
assert(
  "03-next-actions mentions G-20u37a",
  nextActions.includes("G-20u37a") || nextActions.includes(PHASE),
);
assert(
  "handoff mentions G-20u37a",
  handoff.includes("G-20u37a") || handoff.includes(PHASE),
);

// Read-only artifact checks (when package exists locally)
assert("public-dist directory exists", fs.existsSync(PUBLIC_DIST));

if (fs.existsSync(PUBLIC_DIST)) {
  const files = walkFiles(PUBLIC_DIST);
  assert("public-dist file count >= 30", files.length >= 30, `${files.length}`);

  const required = [
    "index.html",
    "about/index.html",
    "contact/index.html",
    "discography/index.html",
    "link/index.html",
    "schedule/index.html",
    "admin/index.html",
    "sitemap-0.xml",
    "robots.txt",
  ];
  for (const rel of required) {
    assert(`public-dist/${rel} exists`, fs.existsSync(path.join(PUBLIC_DIST, rel)));
  }

  for (const month of ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]) {
    assert(
      `schedule/${month}/ exists`,
      fs.existsSync(path.join(PUBLIC_DIST, "schedule", month, "index.html")),
    );
  }

  const markerHits = grepDir(PUBLIC_DIST, MARKER_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  assert("marker absent in public-dist", markerHits.length === 0, markerHits.join(", "));

  const adminHtml = fs.readFileSync(
    path.join(PUBLIC_DIST, "admin/index.html"),
    "utf8",
  );
  const discHtml = fs.readFileSync(
    path.join(PUBLIC_DIST, "discography/index.html"),
    "utf8",
  );
  assert(
    "admin has On a Clear Day",
    adminHtml.includes(ORIGINAL_TITLE) && !adminHtml.includes(MARKER_TITLE),
  );
  assert(
    "discography has On a Clear Day",
    discHtml.includes(ORIGINAL_TITLE) && !discHtml.includes(MARKER_TITLE),
  );
  assert(
    "discography has Like a Lover",
    discHtml.includes(TRACK_7),
  );

  const publicEyJ = grepDir(PUBLIC_DIST, /eyJ[A-Za-z0-9_-]{10,}/, {
    excludeAdmin: true,
  });
  assert(
    "eyJ absent on public pages (admin excluded)",
    publicEyJ.length === 0,
    publicEyJ.join(", "),
  );

  const prodRefPublic = grepDir(PUBLIC_DIST, PRODUCTION_REF, {
    excludeAdmin: false,
  });
  // production ref may appear in admin JS guard — classify, not auto-fail if only in _astro JS
  const prodRefOnlyGuard =
    prodRefPublic.length > 0 &&
    prodRefPublic.every((f) => f.includes("_astro") && f.endsWith(".js"));
  assert(
    "production ref not in public HTML",
    !grepDir(PUBLIC_DIST, PRODUCTION_REF, { excludeAdmin: true }).some((f) =>
      f.endsWith(".html"),
    ),
  );
  if (prodRefPublic.length > 0) {
    assert(
      "production ref guard-only if present",
      prodRefOnlyGuard,
      prodRefPublic.join(", "),
    );
  } else {
    assert("production ref absent entirely", true);
  }

  assert(
    "staging ref present (admin expected)",
    grepDir(PUBLIC_DIST, STAGING_REF).length > 0,
  );

  const wrongBase = grepDir(PUBLIC_DIST, 'href="/gosaki-piano/');
  assert("no wrong /gosaki-piano/ root hrefs", wrongBase.length === 0);

  const sariswing = grepDir(PUBLIC_DIST, /sariswing/i);
  assert("no sariswing references", sariswing.length === 0);

  const prodDomain = grepDir(PUBLIC_DIST, /gosaki-piano\.com/i);
  assert("no gosaki-piano.com in public-dist", prodDomain.length === 0);

  const sitemap = fs.readFileSync(
    path.join(PUBLIC_DIST, "sitemap-0.xml"),
    "utf8",
  );
  assert("sitemap uses STG base", sitemap.includes(STG_BASE));
  assert("sitemap excludes admin", !sitemap.includes("/admin/"));

  const robots = fs.readFileSync(path.join(PUBLIC_DIST, "robots.txt"), "utf8");
  assert("robots Disallow /", /Disallow:\s*\//i.test(robots));

  assert(
    "admin save disabled flag",
    adminHtml.includes('data-g11c6-save-enabled="false"') ||
      adminHtml.includes("Save disabled"),
  );
  assert(
    "admin read-only badge",
    /READ-ONLY|読み取り専用/i.test(adminHtml),
  );

  const contactHtml = fs.readFileSync(
    path.join(PUBLIC_DIST, "contact/index.html"),
    "utf8",
  );
  assert(
    "contact HubSpot embed present",
    contactHtml.includes("js.hsforms.net") ||
      contactHtml.includes("gosaki-contact-hubspot-embed"),
  );
}

console.log(`\nverify-g20u37a-gosaki-public-readiness-static-inspection: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
