#!/usr/bin/env node
/**
 * Local regenerator: gitignored raw crawl → tracked sanitized CI snapshot.
 * Never crawls. Not invoked by GitHub Actions production deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_PRODUCTION_CI_EXPECTED_ASSETS,
  GOSAKI_PRODUCTION_CI_EXPECTED_HTML,
  GOSAKI_PRODUCTION_CI_FIXTURE_DIR,
  GOSAKI_RAW_CRAWL_FIXTURE_DIR,
} from "./lib/gosaki-production-ci-fixture.mjs";
import { sanitizeGosakiWixCrawlHtml } from "./lib/sanitize-gosaki-wix-crawl-html.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const fromRel = GOSAKI_RAW_CRAWL_FIXTURE_DIR;
const toRel = GOSAKI_PRODUCTION_CI_FIXTURE_DIR;
const fromDir = path.join(TOOL_ROOT, fromRel);
const toDir = path.join(TOOL_ROOT, toRel);

if (path.basename(toDir) === "gosaki-piano") {
  console.error("refusing to write sanitized HTML into the raw crawl directory");
  process.exit(1);
}
if (path.basename(fromDir) === "gosaki-piano-ci") {
  console.error("refusing to read sanitized CI dir as raw crawl input");
  process.exit(1);
}
if (!fs.existsSync(fromDir)) {
  console.error("raw crawl fixture missing (local-only, gitignored):", fromRel);
  process.exit(1);
}

fs.mkdirSync(toDir, { recursive: true });

const rawHtml = fs
  .readdirSync(fromDir)
  .filter((n) => n.endsWith(".html") && fs.statSync(path.join(fromDir, n)).isFile())
  .sort();

const expected = new Set(GOSAKI_PRODUCTION_CI_EXPECTED_HTML);
const missing = GOSAKI_PRODUCTION_CI_EXPECTED_HTML.filter((n) => !rawHtml.includes(n));
if (missing.length) {
  console.error("raw crawl missing expected HTML:", missing.join(","));
  process.exit(1);
}

for (const name of GOSAKI_PRODUCTION_CI_EXPECTED_HTML) {
  const raw = fs.readFileSync(path.join(fromDir, name), "utf8");
  const sanitized = sanitizeGosakiWixCrawlHtml(raw);
  fs.writeFileSync(path.join(toDir, name), sanitized);
}

for (const rel of GOSAKI_PRODUCTION_CI_EXPECTED_ASSETS) {
  const src = path.join(fromDir, rel);
  if (!fs.existsSync(src)) {
    console.error("raw fixture missing tracked asset:", rel);
    process.exit(1);
  }
  const dest = path.join(toDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const extras = rawHtml.filter((n) => !expected.has(n));
console.log("sanitized_html_count", GOSAKI_PRODUCTION_CI_EXPECTED_HTML.length);
console.log("copied_asset_count", GOSAKI_PRODUCTION_CI_EXPECTED_ASSETS.length);
console.log("raw_extra_html_ignored_count", extras.length);
console.log("wrote", toRel);
