/**
 * G-11c1 — Gosaki YouTube URL web-save dry-run PoC local prep verification.
 * Run: node tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G11C1_APPROVAL_ID,
  G11C1_OPERATION_ID,
} from "./lib/gosaki-youtube-url-dry-run-constants.mjs";
import {
  assertG11c1NextValueAllowed,
  handleG11c1YoutubeUrlDryRunRequest,
  parseG11c1DryRunRequest,
} from "./lib/gosaki-youtube-url-dry-run-validation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-url-web-save-dry-run-poc-local-prep.md";
const EDGE_FN_REL = "supabase/functions/gosaki-youtube-url-dry-run/index.ts";
const EDGE_SHARED_REL = "supabase/functions/_shared/gosaki-youtube-url-dry-run.ts";
const YOUTUBE_CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
const ADMIN_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/admin/index.html";
const MANUAL_ADMIN_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/admin/index.html";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const CURRENT = {
  embedCode: "https://www.youtube.com/watch?v=Ke4F8JAQz-I",
  videoId: "Ke4F8JAQz-I",
};

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

function buildPayload(nextValue) {
  return {
    siteSlug: "gosaki-piano",
    module: "youtube-embed",
    field: "embedCode",
    nextValue,
    dryRun: true,
    operationId: G11C1_OPERATION_ID,
    approvalId: G11C1_APPROVAL_ID,
  };
}

const configBefore = read(YOUTUBE_CONFIG_REL);
const doc = exists(DOC_REL) ? read(DOC_REL) : "";
const edgeFn = exists(EDGE_FN_REL) ? read(EDGE_FN_REL) : "";
const edgeShared = exists(EDGE_SHARED_REL) ? read(EDGE_SHARED_REL) : "";
const adminHtml = exists(ADMIN_HTML_REL) ? read(ADMIN_HTML_REL) : "";
const manualAdminHtml = exists(MANUAL_ADMIN_REL) ? read(MANUAL_ADMIN_REL) : "";

assert("G-11c1 doc exists", exists(DOC_REL));
assert("G-11c1 doc phase", doc.includes("G-11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep"));
assert("Edge Function source exists", exists(EDGE_FN_REL));
assert("Edge shared logic exists", exists(EDGE_SHARED_REL));
assert("Edge requires admin auth", edgeFn.includes("requireAdminUser"));
assert("Edge dryRun only path", edgeShared.includes('dryRun must be true'));
assert("Edge no workflow_dispatch", !/workflow_dispatch/i.test(edgeFn + edgeShared));
assert("Edge no service_role in shared", !/service_role/i.test(edgeShared));

const validDifferent = handleG11c1YoutubeUrlDryRunRequest(
  buildPayload("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
  CURRENT,
);
assert("valid different URL ok:true", validDifferent.ok === true);
assert("valid different dryRun:true", validDifferent.dryRun === true);
assert("valid different wouldWrite:false", validDifferent.wouldWrite === false);
assert(
  "valid different changedFields",
  validDifferent.changedFields?.includes("embedCode") &&
    validDifferent.changedFields?.includes("videoId"),
);
assert("valid different saveReadiness", validDifferent.saveReadiness === "dry_run_only_ready");

const sameUrl = handleG11c1YoutubeUrlDryRunRequest(buildPayload(CURRENT.embedCode), CURRENT);
assert("same URL ok:true", sameUrl.ok === true);
assert("same URL no_change", sameUrl.saveReadiness === "no_change" || sameUrl.noChange === true);
assert("same URL changedFields empty", (sameUrl.changedFields ?? []).length === 0);

const invalidUrl = handleG11c1YoutubeUrlDryRunRequest(
  buildPayload("https://example.com/not-youtube"),
  CURRENT,
);
assert("invalid URL ok:false", invalidUrl.ok === false);

const scriptInjection = handleG11c1YoutubeUrlDryRunRequest(
  buildPayload('<script>alert(1)</script>'),
  CURRENT,
);
assert("script injection ok:false", scriptInjection.ok === false);

const iframeInjection = assertG11c1NextValueAllowed(
  '<iframe src="https://evil.com"></iframe>',
);
assert("iframe injection rejected", iframeInjection !== null);

const dryRunFalse = parseG11c1DryRunRequest({ ...buildPayload(CURRENT.embedCode), dryRun: false });
assert("dryRun false rejected", dryRunFalse.ok === false);

const wrongSlug = parseG11c1DryRunRequest({ ...buildPayload(CURRENT.embedCode), siteSlug: "other" });
assert("wrong siteSlug rejected", wrongSlug.ok === false);

const configAfter = read(YOUTUBE_CONFIG_REL);
assert("YouTube JSON unchanged", configBefore === configAfter);

assert("public-dist admin exists", exists(ADMIN_HTML_REL));
assert("admin dry-run button label", adminHtml.includes("Dry-run（保存前チェック）"));
assert("admin dry-run input", adminHtml.includes("gra-youtube-next-url"));
assert("admin G-11c1 or G-11c4a phase", adminHtml.includes('data-phase="G-11c1"') || adminHtml.includes("G-11c4a"));
assert(
  "admin dry-run endpoint wiring",
  adminHtml.includes("dry-run endpoint not configured") ||
    adminHtml.includes("gosaki-youtube-url-dry-run"),
);
assert("admin Save disabled", adminHtml.includes("Save（無効）") && /disabled/.test(adminHtml));
assert("admin Publish disabled", adminHtml.includes("Publish（無効）"));
assert("admin Deploy disabled", adminHtml.includes("Deploy（無効）"));
assert("admin no service_role", !/service_role/i.test(adminHtml));
assert("admin no GITHUB_TOKEN", !/GITHUB_TOKEN/i.test(adminHtml));
assert("admin no write API ref", !/youtube-embed-static-json-write/i.test(adminHtml));
assert("manual-upload admin dry-run", manualAdminHtml.includes("Dry-run（保存前チェック）"));
assert("manual-upload package exists", exists(PACKAGE_REL));
assert("zip exists", exists(`${PACKAGE_REL}/gosaki-piano-manual-upload.zip`));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const adminStatus = spawnSync("git", ["status", "--short", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "src/pages/admin unchanged",
  !adminDiff.stdout?.trim() && !adminStatus.stdout?.trim(),
);

console.log("");
console.log(`G-11c1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
