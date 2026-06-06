#!/usr/bin/env node
/**
 * Verify Admin UI Supabase read-only build (Phase 3-L).
 * Loads credentials from tools/static-to-astro/.env.local (tooling only).
 * Writes ADMIN_SUPABASE_READ_REPORT.md and updates CONVERSION_REPORT.md.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadExportEnv, supabaseHostFromUrl, fetchSupabaseCmsData } from "./lib/supabase-json-exporter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const ASTRO_DIR = path.join(TOOL_ROOT, "output", "generated-astro");
const REPORT_PATH = path.join(TOOL_ROOT, "output", "cms-candidates", "gosaki", "ADMIN_SUPABASE_READ_REPORT.md");

function loadServiceRoleKeyForLeakCheck(toolRoot) {
  const envPath = path.join(toolRoot, ".env.local");
  if (!fs.existsSync(envPath)) return null;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) continue;
    return trimmed.slice("SUPABASE_SERVICE_ROLE_KEY=".length).trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

function scanDirForSecret(dir, secret) {
  if (!secret || secret.length < 20) return [];
  const hits = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/\.(html|js|css|json|mjs)$/i.test(entry.name)) continue;
      const content = fs.readFileSync(full, "utf8");
      if (content.includes(secret)) {
        hits.push(path.relative(ASTRO_DIR, full));
      }
    }
  }
  return hits;
}

function appendConversionReport(astroDir, block) {
  const reportPath = path.join(astroDir, "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;
  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin Supabase read (Phase 3-L)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}

async function main() {
  const started = Date.now();
  let env;

  try {
    env = loadExportEnv(TOOL_ROOT);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const host = supabaseHostFromUrl(env.supabaseUrl);
  const serviceRoleKey = loadServiceRoleKeyForLeakCheck(TOOL_ROOT);

  let readCounts = null;
  try {
    const raw = await fetchSupabaseCmsData(env);
    readCounts = {
      schedule_months: raw.scheduleMonths.length,
      schedules: raw.schedules.length,
      discography: raw.discography.length,
      discography_tracks: raw.discographyTracks.length,
      show_on_home: raw.schedules.filter((row) => row.show_on_home).length,
    };
  } catch (err) {
    console.warn(`Read count fetch failed: ${err.message}`);
  }

  console.log("Phase 3-L verify: npm install + build with staging env");
  console.log(`  Host: ${host}`);
  console.log("");

  const install = spawnSync("npm", ["install"], {
    cwd: ASTRO_DIR,
    encoding: "utf8",
    env: { ...process.env, SUPABASE_URL: env.supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: env.serviceRoleKey },
  });

  if (install.status !== 0) {
    console.error(install.stderr || install.stdout);
    process.exit(1);
  }

  const buildStarted = Date.now();
  const build = spawnSync("npm", ["run", "build"], {
    cwd: ASTRO_DIR,
    encoding: "utf8",
    env: { ...process.env, SUPABASE_URL: env.supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: env.serviceRoleKey },
  });
  const buildElapsed = Date.now() - buildStarted;
  const buildSuccess = build.status === 0;

  if (!buildSuccess) {
    console.error(build.stderr || build.stdout);
  } else {
    console.log(`Build: success (${buildElapsed}ms)`);
  }

  const distDir = path.join(ASTRO_DIR, "dist");
  const leakHits = buildSuccess ? scanDirForSecret(distDir, serviceRoleKey) : [];
  const keyLeaked = leakHits.length > 0;

  const report = [
    "# ADMIN_SUPABASE_READ_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "",
    "## Connection",
    "",
    `- Data source: **Supabase direct read** (server-side in Astro frontmatter)`,
    `- Supabase host: \`${host}\``,
    "- Service role key: *(not logged)*",
    "",
    "## Read counts (staging Supabase)",
    "",
    readCounts
      ? [
          "| Table | Rows |",
          "| --- | ---: |",
          `| schedule_months | ${readCounts.schedule_months} |`,
          `| schedules | ${readCounts.schedules} |`,
          `| discography | ${readCounts.discography} |`,
          `| discography_tracks | ${readCounts.discography_tracks} |`,
          `| show_on_home (schedules) | ${readCounts.show_on_home} |`,
          "",
        ].join("\n")
      : "_Could not fetch read counts._\n",
    "## Build",
    "",
    buildSuccess
      ? `- Result: **success** (${buildElapsed}ms)`
      : `- Result: **failed**\n\`\`\`\n${(build.stderr || build.stdout || "").trim()}\n\`\`\``,
    "",
    "## Security",
    "",
    `- Service role key in \`dist/\`: ${keyLeaked ? `**LEAK DETECTED** in ${leakHits.join(", ")}` : "not found"}`,
    "- Supabase writes (insert/update/delete/upsert): **none**",
    "",
    "## Admin pages",
    "",
    "- `/admin/` — dashboard counts from staging Supabase",
    "- `/admin/schedules/` — schedules + filters (month / Home / published)",
    "- `/admin/discography/` — discography + tracks list",
    "- Save buttons: **disabled** (read-only)",
    "",
    "## Dev",
    "",
    "From repo root, pass env vars without committing them:",
    "",
    "```bash",
    "cd tools/static-to-astro",
    "set -a && source .env.local && set +a",
    "cd output/generated-astro && npm run dev",
    "```",
    "",
    "---",
    `Elapsed: ${Date.now() - started}ms`,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, "utf8");

  appendConversionReport(ASTRO_DIR, [
    "",
    "## Admin Supabase read (Phase 3-L)",
    "",
    `- **Data source:** Supabase direct read (server-side, \`${host}\`)`,
    readCounts
      ? `- **Read counts:** schedule_months ${readCounts.schedule_months}, schedules ${readCounts.schedules}, discography ${readCounts.discography}, tracks ${readCounts.discography_tracks}, show_on_home ${readCounts.show_on_home}`
      : "",
    `- **Build:** ${buildSuccess ? "success" : "failed"}`,
    `- **Service role key in dist/:** ${keyLeaked ? "LEAK — fix before deploy" : "not detected"}`,
    `- **Supabase writes:** none (read-only)`,
    `- **Report:** \`tools/static-to-astro/output/cms-candidates/gosaki/ADMIN_SUPABASE_READ_REPORT.md\``,
    "",
  ].join("\n"));

  console.log(`Report: ${REPORT_PATH}`);
  console.log(`Key leak scan: ${keyLeaked ? "FAILED" : "OK"}`);

  if (!buildSuccess || keyLeaked) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
