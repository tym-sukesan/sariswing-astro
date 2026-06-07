/**
 * Site profile verification (Phase 3-W).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { scanDirForSecrets } from "./admin-api-auth-verifier.mjs";
import { loadExportEnv } from "./supabase-json-exporter.mjs";
import {
  DEFAULT_TOOL_ROOT,
  listSiteProfiles,
  loadSiteProfile,
  validateSiteProfile,
} from "./site-profile-loader.mjs";

export const EXPECTED_PROFILE_IDS = ["musician", "dance-school", "generic"];

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;
const SECRET_ASSIGNMENT =
  /(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY|FTP_PASSWORD)\s*=\s*['"]?[A-Za-z0-9_\-]{20,}/;

/**
 * @param {string} repoRoot
 * @param {string[]} args
 */
export function runConvertCli(repoRoot, args) {
  const script = path.join(repoRoot, "tools/static-to-astro/scripts/convert-static-to-astro.mjs");
  const result = spawnSync("node", [script, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, CI: "1" },
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    args,
  };
}

/**
 * @param {string} toolRoot
 */
export function verifyProfileDefinitions(toolRoot = DEFAULT_TOOL_ROOT) {
  const found = listSiteProfiles(toolRoot);
  const missing = EXPECTED_PROFILE_IDS.filter((id) => !found.includes(id));
  const validations = found.map((id) => {
    try {
      const profile = loadSiteProfile(id, toolRoot);
      const result = validateSiteProfile(profile);
      return { id, ok: result.ok, errors: result.ok ? [] : result.errors };
    } catch (err) {
      return { id, ok: false, errors: [err.message] };
    }
  });

  return {
    ok: missing.length === 0 && validations.every((v) => v.ok),
    found,
    missing,
    validations,
  };
}

/**
 * @param {string} reportContent
 */
export function conversionReportHasProfileSection(reportContent) {
  if (!reportContent) return false;
  if (!/## Site profile/i.test(reportContent)) return false;
  if (!/^Profile:\s*musician/m.test(reportContent)) return false;
  if (!/Enabled modules:/i.test(reportContent)) return false;
  return true;
}

/**
 * @param {string} content
 */
export function scanTextForSecretLiterals(content) {
  /** @type {string[]} */
  const hits = [];
  if (JWT_LIKE.test(content)) hits.push("jwt-like token");
  if (SECRET_ASSIGNMENT.test(content)) hits.push("secret assignment literal");
  return hits;
}

/**
 * @param {string} dir
 * @param {string[]} secretValues
 */
export function scanOutputForSecrets(dir, secretValues) {
  if (!fs.existsSync(dir)) {
    return { ok: true, hits: [] };
  }
  const hits = scanDirForSecrets(dir, secretValues);
  return { ok: hits.length === 0, hits };
}

/**
 * @param {string} text
 * @param {string[]} secretValues
 */
export function scanTextForEnvSecrets(text, secretValues) {
  /** @type {Array<{ kind: string }>} */
  const hits = [];
  for (const secret of secretValues) {
    if (secret && secret.length >= 12 && text.includes(secret)) {
      hits.push({ kind: "env secret value" });
    }
  }
  return { ok: hits.length === 0, hits };
}

/**
 * @param {object} opts
 */
export function runSiteProfileVerification(opts) {
  const {
    repoRoot,
    toolRoot = DEFAULT_TOOL_ROOT,
    reportPath,
    fixtureRel = "tools/static-to-astro/fixtures/gosaki-static-site",
    baseUrl = "https://www.gosaki-piano.com",
  } = opts;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const notes = [];

  const profileDefs = verifyProfileDefinitions(toolRoot);
  if (profileDefs.missing.length) {
    errors.push(`missing profiles: ${profileDefs.missing.join(", ")}`);
  }
  for (const v of profileDefs.validations) {
    if (!v.ok) {
      errors.push(`profile validation failed (${v.id}): ${v.errors.join("; ")}`);
    }
  }

  let envSecrets = [];
  try {
    const env = loadExportEnv(toolRoot);
    envSecrets = [
      env.supabaseServiceRoleKey,
      env.supabaseAnonKey,
      env.supabaseAdminPassword,
    ].filter(Boolean);
  } catch {
    notes.push("loadExportEnv skipped (no .env.local — OK for dry-run)");
  }

  const outNoAdminRel = "tools/static-to-astro/output/site-profiles/verify-no-admin";
  const outAdminRel = "tools/static-to-astro/output/site-profiles/verify-with-admin-musician";
  const outNoAdmin = path.join(repoRoot, outNoAdminRel);
  const outAdmin = path.join(repoRoot, outAdminRel);

  const convertNoAdmin = runConvertCli(repoRoot, [
    fixtureRel,
    outNoAdminRel,
    "--base-url",
    baseUrl,
    "--verify-build",
  ]);

  if (!convertNoAdmin.ok) {
    errors.push(`convert no-admin failed (exit ${convertNoAdmin.status})`);
    if (convertNoAdmin.stderr) notes.push(convertNoAdmin.stderr.trim().slice(0, 500));
  }

  const convertAdmin = runConvertCli(repoRoot, [
    fixtureRel,
    outAdminRel,
    "--base-url",
    baseUrl,
    "--verify-build",
    "--with-admin-cms",
    "--site-profile",
    "musician",
  ]);

  if (!convertAdmin.ok) {
    errors.push(`convert with admin + musician failed (exit ${convertAdmin.status})`);
    if (convertAdmin.stderr) notes.push(convertAdmin.stderr.trim().slice(0, 500));
  }

  let buildSuccess = false;
  let profileSectionFound = false;
  const reportFile = path.join(outAdmin, "CONVERSION_REPORT.md");
  let reportContent = "";

  if (fs.existsSync(reportFile)) {
    reportContent = fs.readFileSync(reportFile, "utf8");
    profileSectionFound = conversionReportHasProfileSection(reportContent);
    if (!profileSectionFound) {
      errors.push("CONVERSION_REPORT missing Site profile section for musician");
    }
  } else if (convertAdmin.ok) {
    errors.push("CONVERSION_REPORT not found after admin convert");
  }

  const noAdminReport = path.join(outNoAdmin, "CONVERSION_REPORT.md");
  if (fs.existsSync(noAdminReport)) {
    const noAdminContent = fs.readFileSync(noAdminReport, "utf8");
    if (/## Site profile/i.test(noAdminContent) && /Profile:\s*musician/i.test(noAdminContent)) {
      errors.push("no-admin convert should not emit active musician profile section");
    }
  }

  if (convertAdmin.ok && reportContent.includes("Build verification")) {
    buildSuccess = /buildSuccess:\s*true/i.test(reportContent) || /Build:\s*success/i.test(reportContent);
  }
  if (convertAdmin.ok && !buildSuccess) {
    const distIndex = path.join(outAdmin, "dist", "index.html");
    const distClientIndex = path.join(outAdmin, "dist", "client", "index.html");
    buildSuccess = fs.existsSync(distIndex) || fs.existsSync(distClientIndex);
  }
  if (convertAdmin.ok && !buildSuccess) {
    errors.push("build verification not successful for admin convert");
  }

  const reportLiteralScan = scanTextForSecretLiterals(reportContent);
  const reportEnvScan = scanTextForEnvSecrets(reportContent, envSecrets);
  const outputSecretScan = scanOutputForSecrets(outAdmin, envSecrets);

  if (reportLiteralScan.length) {
    errors.push(`secret literal in report: ${reportLiteralScan.join(", ")}`);
  }
  if (!reportEnvScan.ok) {
    errors.push("env secret value leaked into verification report content");
  }
  if (!outputSecretScan.ok) {
    errors.push(`secret leak in generated astro output (${outputSecretScan.hits.length} hit(s))`);
  }

  const result = {
    ok: errors.length === 0,
    errors,
    notes,
    profilesFound: profileDefs.found,
    profileValidationPass: profileDefs.ok,
    convertNoAdminPass: convertNoAdmin.ok,
    convertAdminMusicianPass: convertAdmin.ok,
    buildSuccess,
    profileSectionFound,
    secretLeakScanOk: reportLiteralScan.length === 0 && reportEnvScan.ok && outputSecretScan.ok,
    paths: {
      outNoAdmin: outNoAdminRel,
      outAdmin: outAdminRel,
      reportFile: path.relative(repoRoot, reportFile),
    },
  };

  if (reportPath) {
    writeSiteProfileVerifyReport(result, reportPath, repoRoot);
  }

  return result;
}

/**
 * @param {object} result
 * @param {string} reportPath
 * @param {string} repoRoot
 */
export function writeSiteProfileVerifyReport(result, reportPath, repoRoot) {
  const abs = path.isAbsolute(reportPath) ? reportPath : path.join(repoRoot, reportPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const lines = [
    "# Site Profile Verification Report (Phase 3-W)",
    "",
    `- **Status:** ${result.ok ? "PASS" : "FAIL"}`,
    `- **Mode:** dry-run / local verification only`,
    "",
    "## Profiles",
    "",
    `- profiles found: ${result.profilesFound.join(", ") || "—"}`,
    `- profile validation: ${result.profileValidationPass ? "PASS" : "FAIL"}`,
    "",
    "## Convert checks",
    "",
    `- convert no-admin: ${result.convertNoAdminPass ? "PASS" : "FAIL"}`,
    `- convert with admin + musician: ${result.convertAdminMusicianPass ? "PASS" : "FAIL"}`,
    `- build: ${result.buildSuccess ? "success" : "failed"}`,
    `- CONVERSION_REPORT profile section: ${result.profileSectionFound ? "found" : "missing"}`,
    "",
    "## Security",
    "",
    `- secret leak scan: ${result.secretLeakScanOk ? "OK" : "FAIL"}`,
    "",
    "## Output paths",
    "",
    `- no-admin: \`${result.paths.outNoAdmin}\``,
    `- admin+musician: \`${result.paths.outAdmin}\``,
    "",
    "## Notes",
    "",
    "- dance-school / generic profiles are design-only in Phase 3-W (no CMS implementation yet).",
    "- No production Supabase / Storage / FTP connections were made.",
    "",
  ];

  if (result.errors.length) {
    lines.push("## Errors", "");
    for (const err of result.errors) {
      lines.push(`- ${err}`);
    }
    lines.push("");
  }

  if (result.notes.length) {
    lines.push("## Additional notes", "");
    for (const note of result.notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  lines.push("---", `Report: \`${path.relative(repoRoot, abs)}\``, "");
  fs.writeFileSync(abs, lines.join("\n"), "utf8");
}

/**
 * @param {object} result
 */
export function formatSiteProfileVerifySummary(result) {
  return [
    "",
    "=== Site Profile Verification Summary ===",
    `profiles found: ${result.profilesFound.join(", ")}`,
    `profile validation: ${result.profileValidationPass ? "PASS" : "FAIL"}`,
    `convert no-admin: ${result.convertNoAdminPass ? "PASS" : "FAIL"}`,
    `convert with admin + musician: ${result.convertAdminMusicianPass ? "PASS" : "FAIL"}`,
    `build: ${result.buildSuccess ? "success" : "failed"}`,
    `CONVERSION_REPORT profile section: ${result.profileSectionFound ? "found" : "missing"}`,
    `secret leak scan: ${result.secretLeakScanOk ? "OK" : "FAIL"}`,
    `overall: ${result.ok ? "PASS" : "FAIL"}`,
  ].join("\n");
}
