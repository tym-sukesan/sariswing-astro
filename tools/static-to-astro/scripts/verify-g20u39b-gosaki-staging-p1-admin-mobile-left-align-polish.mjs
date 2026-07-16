/**
 * G-20u39b Gosaki staging P1 admin mobile left-align polish verifier.
 * CSS + local Playwright fixture layout checks — no package / FTP / STG upload.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-admin-mobile-left-align-polish.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-staging-p1-contact-hubspot-submit-e2e-result.md";
const READ_ONLY_CSS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css";
const ADMIN_CSS_REL = "tools/static-to-astro/templates/admin-cms/styles/admin.css";
const PHASE = "G-20u39b-gosaki-staging-p1-admin-mobile-left-align-polish";
const GATE = "gosakiStagingP1AdminMobileLeftAlignPolishImplemented: true";
const RECOMMENDED_NEXT =
  "G-20u39b1-gosaki-staging-p1-admin-mobile-left-align-package-and-manual-upload-prep";
const VIEWPORTS = [
  { label: "320px", width: 320, height: 568 },
  { label: "375px", width: 375, height: 667 },
  { label: "desktop", width: 1280, height: 800 },
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

function latestSection(aiText, marker) {
  const idx = aiText.indexOf(marker);
  return idx >= 0 ? aiText.slice(idx, idx + 3500) : "";
}

function symmetryDelta(rect, viewportWidth) {
  const left = rect.left;
  const right = viewportWidth - rect.right;
  return Math.abs(left - right);
}

function writeFixtureHtml(cssAbsPath, bodyClass, bodyHtml) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b-admin-fixture-"));
  const cssName = "admin-fixture.css";
  fs.copyFileSync(cssAbsPath, path.join(dir, cssName));
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${cssName}" />
</head>
<body class="${bodyClass}">
${bodyHtml}
</body>
</html>`;
  const htmlPath = path.join(dir, "index.html");
  fs.writeFileSync(htmlPath, html, "utf8");
  return `file://${htmlPath}`;
}

async function verifyFixtureLayout(page, fixtureUrl, selectors, viewportWidth) {
  await page.goto(fixtureUrl, { waitUntil: "load", timeout: 30000 });
  const metrics = await page.evaluate((sels) => {
    const doc = document.documentElement;
    const result = {
      canScrollX: doc.scrollWidth > window.innerWidth + 1,
      scrollWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      boxes: {},
    };
    for (const [key, sel] of Object.entries(sels)) {
      const el = document.querySelector(sel);
      if (!el) {
        result.boxes[key] = null;
        continue;
      }
      const r = el.getBoundingClientRect();
      result.boxes[key] = { left: r.left, right: r.right, width: r.width };
    }
    return result;
  }, selectors);

  return metrics;
}

assert("polish doc exists", exists(DOC_REL));
assert("prior G-20u39a2 result doc exists", exists(PRIOR_DOC_REL));
assert("read-only admin css exists", exists(READ_ONLY_CSS_REL));
assert("admin css exists", exists(ADMIN_CSS_REL));

const doc = read(DOC_REL);
const priorDoc = read(PRIOR_DOC_REL);
const readOnlyCss = read(READ_ONLY_CSS_REL);
const adminCss = read(ADMIN_CSS_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const csG39b = latestSection(currentState, "G-20u39b");
const naG39b = latestSection(nextActions, "G-20u39b");
const hoG39b = latestSection(handoff, "G-20u39b");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("P1-ADM-MOB1 locally_resolved", /P1-ADM-MOB1:\s*locally_resolved/i.test(doc));
assert(
  "ADMIN_MOBILE_LEFT_ALIGN_POLISH_IMPLEMENTED true",
  /ADMIN_MOBILE_LEFT_ALIGN_POLISH_IMPLEMENTED:\s*true/i.test(doc),
);
assert(
  "ADMIN_MOBILE_LOCAL_VERIFY_PASSED true",
  /ADMIN_MOBILE_LOCAL_VERIFY_PASSED:\s*true/i.test(doc),
);
assert(
  "STG_BROWSER_RECHECK_REQUIRED true",
  /STG_BROWSER_RECHECK_REQUIRED:\s*true/i.test(doc),
);
assert("root cause documented", /Root cause|margin-left: auto/i.test(doc));
assert("read-only css path", doc.includes("gosaki-staging-read-only-admin.css"));
assert("admin css path", doc.includes("templates/admin-cms/styles/admin.css"));
assert("no package generation", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP", /ftpUploadExecuted:\s*false/i.test(doc));
assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));

assert(
  "G-20u39b read-only css marker",
  /G-20u39b[\s\S]{0,120}overflow-x:\s*clip/i.test(readOnlyCss),
);
assert(
  "read-only mobile badges reset",
  /@media \(max-width: 640px\)[\s\S]{0,500}gosaki-read-only-admin__badges[\s\S]{0,120}margin-left:\s*0/i.test(
    readOnlyCss,
  ),
);
assert(
  "read-only dashboard minmax zero",
  /gosaki-read-only-admin__dashboard-grid[\s\S]{0,80}minmax\(0,\s*1fr\)/i.test(readOnlyCss),
);
assert(
  "admin gosaki pages margin inline auto",
  /\.admin-gosaki-admin-pages[\s\S]{0,120}margin-inline:\s*auto/i.test(adminCss),
);
assert(
  "admin gosaki mobile grid minmax zero",
  /@media \(max-width: 640px\)[\s\S]{0,800}admin-gosaki-menu--primary[\s\S]{0,80}minmax\(0,\s*1fr\)/i.test(
    adminCss,
  ),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u39b-gosaki-staging-p1-admin-mobile-left-align-polish"),
);
assert(
  "package.json verifier file",
  packageJson.includes("verify-g20u39b-gosaki-staging-p1-admin-mobile-left-align-polish.mjs"),
);

assert("prior P1-CON1 resolved", /P1-CON1:\s*resolved/i.test(priorDoc));

function assertAiG39b(label, section) {
  assert(`${label} mentions G-20u39b`, section.includes("G-20u39b"));
  assert(
    `${label} gate`,
    /gosakiStagingP1AdminMobileLeftAlignPolishImplemented:\s*true/i.test(section),
  );
  assert(
    `${label} P1-ADM-MOB1 locally_resolved`,
    /P1-ADM-MOB1.*locally_resolved|P1-ADM-MOB1:\s*locally_resolved/i.test(section),
  );
  assert(
    `${label} STG_BROWSER_RECHECK_REQUIRED`,
    /STG_BROWSER_RECHECK_REQUIRED:\s*true/i.test(section),
  );
  assert(`${label} next G-20u39b1`, section.includes(RECOMMENDED_NEXT));
}

assertAiG39b("00-current-state", csG39b);
assertAiG39b("03-next-actions", naG39b);
assertAiG39b("handoff", hoG39b);

assert(
  "handoff current phase G-20u39b",
  /Current phase:.*G-20u39b/i.test(handoff),
);

const readOnlyCssAbs = path.join(REPO_ROOT, READ_ONLY_CSS_REL);
const adminCssAbs = path.join(REPO_ROOT, ADMIN_CSS_REL);

const readOnlyFixture = writeFixtureHtml(
  readOnlyCssAbs,
  "gosaki-read-only-admin",
  `<div class="gosaki-read-only-admin__shell">
  <header class="gosaki-read-only-admin__header">
    <a class="gosaki-read-only-admin__brand" href="#">Gosaki Piano CMS</a>
    <div class="gosaki-read-only-admin__badges">
      <span class="gosaki-read-only-admin__badge">READ-ONLY</span>
      <span class="gosaki-read-only-admin__badge gosaki-read-only-admin__badge--staging">STAGING ONLY</span>
    </div>
  </header>
  <main class="gosaki-read-only-admin__main">
    <div class="gosaki-read-only-admin__banner"><strong>staging</strong></div>
    <section class="gosaki-read-only-admin__section">
      <div class="gosaki-read-only-admin__dashboard-grid">
        <article class="gosaki-read-only-admin__dashboard-card"><h3>Schedule</h3><p>Card</p></article>
        <article class="gosaki-read-only-admin__dashboard-card"><h3>Discography</h3><p>Card</p></article>
      </div>
    </section>
  </main>
</div>`,
);

const operatorFixture = writeFixtureHtml(
  adminCssAbs,
  "admin-body",
  `<div class="admin-shell">
  <div class="admin-main">
    <div class="admin-gosaki-admin-pages">
      <section class="admin-gosaki-operator-home admin-prototype-section">
        <section class="admin-card admin-gosaki-card">Operator card</section>
        <div class="admin-gosaki-operator-grid admin-gosaki-operator-grid--compact">
          <section class="admin-card admin-gosaki-card admin-gosaki-card--flat">Grid A</section>
          <section class="admin-card admin-gosaki-card admin-gosaki-card--flat">Grid B</section>
        </div>
        <ul class="admin-gosaki-menu admin-gosaki-menu--primary">
          <li><a class="admin-button admin-button--menu admin-button--menu-primary" href="#">Schedule</a></li>
          <li><a class="admin-button admin-button--menu admin-button--menu-primary" href="#">YouTube</a></li>
        </ul>
      </section>
    </div>
  </div>
</div>`,
);

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

  const ro = await verifyFixtureLayout(
    page,
    readOnlyFixture,
    { main: ".gosaki-read-only-admin__main", card: ".gosaki-read-only-admin__dashboard-card" },
    vp.width,
  );
  assert(
    `read-only no horizontal scroll ${vp.label}`,
    !ro.canScrollX,
    `scrollWidth=${ro.scrollWidth} inner=${ro.innerWidth}`,
  );
  if (ro.boxes.main) {
    assert(
      `read-only main symmetric ${vp.label}`,
      symmetryDelta(ro.boxes.main, vp.width) <= 2,
      `delta=${symmetryDelta(ro.boxes.main, vp.width).toFixed(2)}`,
    );
  } else {
    assert(`read-only main present ${vp.label}`, false);
  }
  if (vp.width <= 375 && ro.boxes.card) {
    assert(
      `read-only card symmetric ${vp.label}`,
      symmetryDelta(ro.boxes.card, vp.width) <= 2,
      `delta=${symmetryDelta(ro.boxes.card, vp.width).toFixed(2)}`,
    );
  }

  const op = await verifyFixtureLayout(
    page,
    operatorFixture,
    { main: ".admin-main", card: ".admin-gosaki-card" },
    vp.width,
  );
  assert(
    `operator no horizontal scroll ${vp.label}`,
    !op.canScrollX,
    `scrollWidth=${op.scrollWidth} inner=${op.innerWidth}`,
  );
  if (op.boxes.main) {
    assert(
      `operator main symmetric ${vp.label}`,
      symmetryDelta(op.boxes.main, vp.width) <= 2,
      `delta=${symmetryDelta(op.boxes.main, vp.width).toFixed(2)}`,
    );
  } else {
    assert(`operator main present ${vp.label}`, false);
  }

  await page.close();
}

await browser.close();

const dryRun = spawnSync(
  "npm",
  ["run", "build:gosaki:staging:dry-run"],
  { cwd: TOOL_ROOT, encoding: "utf8" },
);
assert(
  "build gosaki staging dry-run exit 0",
  dryRun.status === 0,
  dryRun.stderr?.slice(0, 200) || dryRun.stdout?.slice(-200),
);

console.log(
  `\nverify-g20u39b-gosaki-staging-p1-admin-mobile-left-align-polish: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
