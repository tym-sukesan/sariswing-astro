#!/usr/bin/env node
/**
 * Promote human-approved schedule images to schedule-upload-allowlist.json (G-4e).
 * Default: dry-run read-only. No Storage upload, no DB update.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/promote-schedule-storage-allowlist.mjs \
 *     --decision-template tools/static-to-astro/output/storage/gosaki/schedule-image-human-decision-template.json \
 *     --site-slug gosaki \
 *     --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_UPLOAD_ALLOWLIST_REPORT.md \
 *     --allowlist tools/static-to-astro/output/storage/gosaki/schedule-upload-allowlist.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyGosakiG4eGoldenPodsDecisions,
  buildScheduleUploadAllowlist,
  formatScheduleUploadAllowlistReport,
  loadDecisionTemplate,
} from "./lib/storage-schedule-allowlist-promoter.mjs";
import {
  applySiteConfigToCli,
  attachSiteConfigMeta,
  formatSiteConfigReportFooter,
} from "./lib/site-config-loader.mjs";

const CLI_NAME = "promote-schedule-storage-allowlist";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/promote-schedule-storage-allowlist.mjs [options]

Promote human-approved schedule_home entries to schedule upload allowlist (read-only).

Options:
  --site-config PATH        Site config JSON (G-5c — resolves slug/paths; explicit args win)
  --decision-template PATH  schedule-image-human-decision-template.json (required without --site-config)
  --site-slug SLUG          Site slug (required without --site-config)
  --report PATH             SCHEDULE_UPLOAD_ALLOWLIST_REPORT.md (required without --site-config)
  --allowlist PATH          schedule-upload-allowlist.json (required without --site-config)
  --apply-gosaki-g4e        Apply Golden PODs approve + defer others (G-4e default)
  --write-template          Save updated decisions back to template file
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    decisionTemplate: null,
    siteSlug: null,
    report: null,
    allowlist: null,
    applyGosakiG4e: false,
    writeTemplate: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--site-config") {
      opts.siteConfig = argv[++i];
      continue;
    }
    if (arg === "--decision-template") {
      opts.decisionTemplate = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--allowlist") {
      opts.allowlist = argv[++i];
      continue;
    }
    if (arg === "--apply-gosaki-g4e") {
      opts.applyGosakiG4e = true;
      continue;
    }
    if (arg === "--write-template") {
      opts.writeTemplate = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(allowlist, configMeta = null) {
  const s = allowlist.summary;
  console.log("");
  console.log("=== Schedule Upload Allowlist Promotion (G-4e) ===");
  console.log(`mode: ${allowlist.mode}`);
  if (configMeta?.configDriven) {
    console.log(`site config: ${configMeta.siteConfigPath}`);
    console.log(`config driven: yes`);
  }
  console.log(`siteSlug: ${allowlist.siteSlug}`);
  console.log(`approvedForStagingUpload: ${s.approvedForStagingUpload}`);
  console.log(`deferred: ${s.deferred}`);
  console.log(`rejected: ${s.rejected}`);
  console.log(`uploadAllowed: ${allowlist.uploadAllowed}`);
  console.log(`dbUpdateAllowed: ${allowlist.dbUpdateAllowed}`);
  console.log(`upload performed: no`);
  console.log(`db update performed: no`);
  console.log(`secret leak: none`);
}

function main() {
  let opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const { opts: resolved, meta: configMeta } = applySiteConfigToCli(CLI_NAME, opts, {
    toolRoot: TOOL_ROOT,
    repoRoot: REPO_ROOT,
  });
  opts = /** @type {ReturnType<typeof parseArgs>} */ (resolved);

  if (!opts.decisionTemplate || !opts.siteSlug || !opts.report || !opts.allowlist) {
    printHelp();
    process.exit(1);
  }

  const templatePath = path.resolve(REPO_ROOT, opts.decisionTemplate);
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const allowlistPath = path.resolve(REPO_ROOT, opts.allowlist);

  if (!fs.existsSync(templatePath)) {
    console.error(`Decision template not found: ${templatePath}`);
    process.exit(1);
  }

  console.log("Schedule allowlist promotion (G-4e read-only)");
  console.log(`Decision template: ${opts.decisionTemplate}`);
  console.log(`Site: ${opts.siteSlug}`);
  console.log(`Apply gosaki G-4e defaults: ${opts.applyGosakiG4e ? "yes" : "no"}`);
  console.log("");

  const { data: template } = loadDecisionTemplate(templatePath);

  if (opts.applyGosakiG4e) {
    applyGosakiG4eGoldenPodsDecisions(template);
    fs.writeFileSync(templatePath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
    console.log(`Updated decision template: ${opts.decisionTemplate}`);
  } else if (opts.writeTemplate) {
    fs.writeFileSync(templatePath, `${JSON.stringify(template, null, 2)}\n`, "utf8");
    console.log(`Wrote decision template: ${opts.decisionTemplate}`);
  }

  const allowlist = buildScheduleUploadAllowlist({
    decisionTemplatePath: templatePath,
    siteSlug: opts.siteSlug,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(allowlistPath), { recursive: true });

  const allowlistOut = attachSiteConfigMeta(allowlist, configMeta);
  fs.writeFileSync(allowlistPath, `${JSON.stringify(allowlistOut, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    formatScheduleUploadAllowlistReport(allowlist, {
      reportPath: opts.report,
      allowlistPath: opts.allowlist,
      decisionTemplatePath: opts.decisionTemplate,
    }) + formatSiteConfigReportFooter(configMeta),
    "utf8",
  );

  printSummary(allowlist, configMeta);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Allowlist: ${opts.allowlist}`);
}

main();
