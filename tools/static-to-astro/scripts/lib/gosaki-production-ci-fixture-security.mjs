/**
 * Security scan for tracked sanitized Gosaki production HTML.
 * Does not log file contents or credential-shaped values.
 */

import fs from "node:fs";
import path from "node:path";
import {
  GOSAKI_PRODUCTION_CI_EXPECTED_HTML,
  GOSAKI_PRODUCTION_CI_FIXTURE_DIR,
} from "./gosaki-production-ci-fixture.mjs";

const JWT_SHAPED = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * @param {string} joined
 */
export function scanSanitizedGosakiHtmlBlob(joined) {
  const emails = [...new Set(joined.match(EMAIL_RE) ?? [])];
  const operationalEmails = emails.filter(
    (e) =>
      /sentry/i.test(e) ||
      /wixpress\.com$/i.test(e) ||
      /@wix\.com$/i.test(e),
  );
  return {
    ghp_: /ghp_[A-Za-z0-9]{20,}/.test(joined),
    github_pat_: /github_pat_/.test(joined),
    sbp_: /sbp_/.test(joined),
    service_role: /service_role/i.test(joined),
    sk_live: /\bsk_live_/.test(joined),
    jwt_shaped: JWT_SHAPED.test(joined),
    viewerModel: /wix-essential-viewer-model/.test(joined),
    sentry_runtime: /browser\.sentry-cdn\.com|@sentry(?:-next)?\.wixpress\.com/i.test(joined),
    script_tags: /<script[\s>]/i.test(joined),
    operationalEmails,
    publicEmailCount: emails.length,
  };
}

/**
 * @param {string} toolRoot
 */
export function loadTrackedGosakiCiHtmlJoined(toolRoot) {
  const dir = path.join(toolRoot, GOSAKI_PRODUCTION_CI_FIXTURE_DIR);
  return GOSAKI_PRODUCTION_CI_EXPECTED_HTML.map((name) =>
    fs.readFileSync(path.join(dir, name), "utf8"),
  ).join("\n");
}

/**
 * @param {ReturnType<typeof scanSanitizedGosakiHtmlBlob>} scan
 * @returns {string[]}
 */
export function listSanitizedGosakiHtmlSecurityFailures(scan) {
  /** @type {string[]} */
  const failures = [];
  if (scan.ghp_) failures.push("ghp_ token shape");
  if (scan.github_pat_) failures.push("github_pat_ token shape");
  if (scan.sbp_) failures.push("sbp_ token shape");
  if (scan.service_role) failures.push("service_role");
  if (scan.sk_live) failures.push("sk_live key shape");
  if (scan.jwt_shaped) failures.push("JWT-shaped blob");
  if (scan.viewerModel) failures.push("viewerModel");
  if (scan.sentry_runtime) failures.push("Sentry runtime payload");
  if (scan.script_tags) failures.push("script tags");
  if (scan.operationalEmails.length) failures.push("operational emails");
  return failures;
}
