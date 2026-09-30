#!/usr/bin/env node
/**
 * Fail before Gosaki production FTP when the tracked sanitized convert fixture is missing.
 * Logs counts and filenames only — never credential values or HTML bodies.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GOSAKI_PRODUCTION_CI_EXPECTED_HTML,
  GOSAKI_PRODUCTION_CI_FIXTURE_DIR,
  GOSAKI_RAW_CRAWL_FIXTURE_DIR,
} from "./lib/gosaki-production-ci-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const fixtureDir = path.join(TOOL_ROOT, GOSAKI_PRODUCTION_CI_FIXTURE_DIR);
const rawDir = path.join(TOOL_ROOT, GOSAKI_RAW_CRAWL_FIXTURE_DIR);

if (!fs.existsSync(fixtureDir) || !fs.statSync(fixtureDir).isDirectory()) {
  console.error("production_fixture_dir_exists false");
  console.error(`production_fixture_rel ${GOSAKI_PRODUCTION_CI_FIXTURE_DIR}`);
  process.exit(1);
}

const htmlFiles = fs
  .readdirSync(fixtureDir)
  .filter((n) => n.endsWith(".html") && fs.statSync(path.join(fixtureDir, n)).isFile())
  .sort();

console.log("production_fixture_rel", GOSAKI_PRODUCTION_CI_FIXTURE_DIR);
console.log("production_fixture_html_count", htmlFiles.length);
console.log("expected_html_count", GOSAKI_PRODUCTION_CI_EXPECTED_HTML.length);
console.log("raw_crawl_dir_must_not_be_required", GOSAKI_RAW_CRAWL_FIXTURE_DIR);

if (htmlFiles.length <= 0) {
  console.error("production_fixture_html_count_ok false");
  process.exit(1);
}

const expected = new Set(GOSAKI_PRODUCTION_CI_EXPECTED_HTML);
const missing = GOSAKI_PRODUCTION_CI_EXPECTED_HTML.filter((n) => !htmlFiles.includes(n));
const extra = htmlFiles.filter((n) => !expected.has(n));

console.log("missing_expected_count", missing.length);
if (missing.length) {
  console.error("missing_expected_names", missing.join(","));
}
console.log("extra_html_count", extra.length);
if (extra.length) {
  console.error("extra_html_names", extra.join(","));
}

if (missing.length > 0 || extra.length > 0) {
  process.exit(1);
}

console.log("production_fixture_preflight_ok true");
