/**
 * Storage DB update executor (G-4c).
 * Applies cover_image_url updates from storage-db-update-plan.json (staging only).
 * Does NOT upload to Storage or touch schedules table.
 */

import fs from "node:fs";
import path from "node:path";
import { assertSupabaseJsAvailable } from "./supabase-seed-inserter.mjs";
import { assertStagingHost, loadStagingSupabaseEnv } from "./storage-upload-executor.mjs";

export const EXPECTED_STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
export const ALLOWED_LEGACY_IDS = [
  "discography-001",
  "discography-002",
  "discography-003",
  "discography-004",
];

const ALLOWED_TABLE = "discography";
const ALLOWED_COLUMN = "cover_image_url";
const STAGING_PUBLIC_PREFIX = `https://${EXPECTED_STAGING_HOST}/storage/v1/object/public/site-assets/`;

/**
 * @param {string} planPath
 */
export function loadDbUpdatePlan(planPath) {
  const abs = path.resolve(planPath);
  const plan = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(plan.entries)) {
    throw new Error("DB update plan must contain entries array");
  }
  return { abs, plan };
}

/**
 * @param {object} plan
 * @param {{ siteSlug?: string, table?: string }} opts
 */
export function filterPlanEntries(plan, opts = {}) {
  const table = opts.table ?? ALLOWED_TABLE;
  let entries = plan.entries.filter(
    (e) => e.targetTable === table && e.targetColumn === ALLOWED_COLUMN,
  );
  if (opts.siteSlug && plan.siteSlug && plan.siteSlug !== opts.siteSlug) {
    throw new Error(`Plan siteSlug=${plan.siteSlug} does not match --site-slug=${opts.siteSlug}`);
  }
  return entries;
}

/**
 * @param {object[]} entries
 * @param {string} stagingHost
 */
export async function preflightDbUpdatePlan(entries, stagingHost) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (stagingHost !== EXPECTED_STAGING_HOST) {
    errors.push(
      `Supabase host "${stagingHost}" is not expected staging host ${EXPECTED_STAGING_HOST}`,
    );
  }

  assertStagingHost(stagingHost);

  if (entries.length !== 4) {
    errors.push(`Expected 4 plan entries, got ${entries.length}`);
  }

  const legacyIds = entries.map((e) => e.legacyId);
  for (const id of ALLOWED_LEGACY_IDS) {
    if (!legacyIds.includes(id)) {
      errors.push(`Missing legacy_id in plan: ${id}`);
    }
  }

  for (const entry of entries) {
    if (entry.targetTable !== ALLOWED_TABLE) {
      errors.push(`${entry.legacyId}: targetTable must be discography`);
    }
    if (entry.targetColumn !== ALLOWED_COLUMN) {
      errors.push(`${entry.legacyId}: targetColumn must be cover_image_url`);
    }
    if (entry.targetTable === "schedules") {
      errors.push(`${entry.legacyId}: schedules table must not be in plan`);
    }
    if (!entry.newValue || !String(entry.newValue).startsWith(STAGING_PUBLIC_PREFIX)) {
      errors.push(
        `${entry.legacyId}: newValue must start with ${STAGING_PUBLIC_PREFIX}`,
      );
    }
    if (!entry.legacyId || !ALLOWED_LEGACY_IDS.includes(entry.legacyId)) {
      errors.push(`${entry.legacyId}: legacy_id not in allowed list`);
    }

    const current = entry.currentValue ?? null;
    if (current && !/example\.supabase\.co/i.test(current) && !current.startsWith(STAGING_PUBLIC_PREFIX)) {
      warnings.push(
        `${entry.legacyId}: currentValue is neither example placeholder nor staging Storage URL`,
      );
    }
  }

  for (const entry of entries) {
    try {
      const head = await fetch(entry.newValue, { method: "HEAD", redirect: "follow" });
      if (!head.ok) {
        errors.push(`${entry.legacyId}: newValue not reachable (HTTP ${head.status})`);
      }
    } catch (err) {
      errors.push(`${entry.legacyId}: newValue fetch failed: ${err.message}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string[]} legacyIds
 */
export async function fetchDiscographyBackup(supabase, legacyIds) {
  const { data, error } = await supabase
    .from("discography")
    .select("legacy_id,title,cover_image_url,updated_at")
    .in("legacy_id", legacyIds)
    .order("legacy_id");

  if (error) {
    throw new Error(`Failed to read discography backup: ${error.message}`);
  }

  const rows = data ?? [];
  const found = new Set(rows.map((r) => r.legacy_id));
  for (const id of legacyIds) {
    if (!found.has(id)) {
      throw new Error(`Backup read missing legacy_id: ${id}`);
    }
  }

  return {
    table: ALLOWED_TABLE,
    column: ALLOWED_COLUMN,
    capturedAt: new Date().toISOString(),
    rows,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} entry
 */
async function updateDiscographyCoverUrl(supabase, entry) {
  const { data, error } = await supabase
    .from("discography")
    .update({ cover_image_url: entry.newValue })
    .eq("legacy_id", entry.legacyId)
    .select("legacy_id,cover_image_url")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * @param {string | null | undefined} actual
 * @param {string} expected
 */
export function valuesMatch(actual, expected) {
  return String(actual ?? "").trim() === String(expected ?? "").trim();
}

/**
 * @param {{
 *   planPath: string,
 *   siteSlug: string,
 *   table?: string,
 *   apply?: boolean,
 *   envFile?: string | null,
 *   backupPath?: string | null,
 * }} opts
 */
export async function runStorageDbUpdate(opts) {
  const apply = Boolean(opts.apply);
  const table = opts.table ?? ALLOWED_TABLE;
  const { plan } = loadDbUpdatePlan(opts.planPath);
  const entries = filterPlanEntries(plan, { siteSlug: opts.siteSlug, table });

  /** @type {object} */
  const result = {
    siteSlug: opts.siteSlug,
    mode: apply ? "apply" : "dry-run",
    dbUpdatePerformed: false,
    storageUploadPerformed: false,
    schedulesTableTouched: false,
    stagingHost: null,
    planPath: path.resolve(opts.planPath),
    backupPath: opts.backupPath ? path.resolve(opts.backupPath) : null,
    generatedAt: new Date().toISOString(),
    preflight: { ok: false, errors: [], warnings: [] },
    summary: {
      planned: entries.length,
      updated: 0,
      failed: 0,
      verified: 0,
    },
    backup: null,
    updated: [],
    failed: [],
    dryRunPlanned: [],
  };

  const env = loadStagingSupabaseEnv(opts.envFile ?? null);
  result.stagingHost = env.host;
  result.preflight = await preflightDbUpdatePlan(entries, result.stagingHost);

  if (!result.preflight.ok) {
    throw new Error(
      `Preflight failed:\n${result.preflight.errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  if (!apply) {
    for (const entry of entries) {
      result.dryRunPlanned.push({
        legacyId: entry.legacyId,
        targetTable: entry.targetTable,
        targetColumn: entry.targetColumn,
        oldValue: entry.currentValue ?? null,
        newValue: entry.newValue,
        status: "planned",
      });
    }
    result.message = `Dry-run: ${entries.length} discography.cover_image_url updates planned`;
    return result;
  }

  await assertSupabaseJsAvailable();
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const legacyIds = entries.map((e) => e.legacyId);
  const backup = await fetchDiscographyBackup(supabase, legacyIds);
  result.backup = backup;

  if (opts.backupPath) {
    fs.mkdirSync(path.dirname(path.resolve(opts.backupPath)), { recursive: true });
    fs.writeFileSync(
      path.resolve(opts.backupPath),
      `${JSON.stringify(backup, null, 2)}\n`,
      "utf8",
    );
  }

  for (const entry of entries) {
    try {
      const before = backup.rows.find((r) => r.legacy_id === entry.legacyId);
      await updateDiscographyCoverUrl(supabase, entry);

      const { data: afterRows, error: readError } = await supabase
        .from("discography")
        .select("legacy_id,cover_image_url")
        .eq("legacy_id", entry.legacyId)
        .single();

      if (readError) {
        throw new Error(`Post-update read failed: ${readError.message}`);
      }

      const verified = valuesMatch(afterRows.cover_image_url, entry.newValue);
      if (!verified) {
        throw new Error(
          `Verification failed: expected ${entry.newValue}, got ${afterRows.cover_image_url}`,
        );
      }

      result.updated.push({
        legacyId: entry.legacyId,
        targetTable: ALLOWED_TABLE,
        targetColumn: ALLOWED_COLUMN,
        oldValue: before?.cover_image_url ?? entry.currentValue ?? null,
        newValue: entry.newValue,
        verified: true,
        approvalScope: entry.approvalScope ?? "staging-only",
      });
      result.summary.updated += 1;
      result.summary.verified += 1;
    } catch (err) {
      result.failed.push({
        legacyId: entry.legacyId,
        targetTable: ALLOWED_TABLE,
        targetColumn: ALLOWED_COLUMN,
        oldValue: entry.currentValue ?? null,
        newValue: entry.newValue,
        error: err.message,
        verified: false,
      });
      result.summary.failed += 1;
    }
  }

  result.dbUpdatePerformed = result.summary.updated > 0 && result.summary.failed === 0;
  result.message =
    result.summary.failed > 0
      ? `DB update finished with failures: updated=${result.summary.updated}, failed=${result.summary.failed}`
      : `DB update finished: updated=${result.summary.updated}, verified=${result.summary.verified}`;

  return result;
}

/**
 * @param {ReturnType<typeof runStorageDbUpdate>} result
 * @param {{ reportPath?: string, manifestPath?: string, backupPath?: string }} [opts]
 */
export function formatStorageDbUpdateReport(result, opts = {}) {
  const lines = [
    "# Storage DB Update Report (G-4c)",
    "",
    `**Mode:** ${result.mode}`,
    `**Staging host:** ${result.stagingHost ?? "(unknown)"}`,
    `**Table:** discography`,
    `**Column:** cover_image_url`,
    `**Generated:** ${result.generatedAt}`,
    "",
    "> **Storage upload not performed** in G-4c.",
    "> **Schedule table not touched.**",
    "> Production / Sariswing production: **not touched**.",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Planned | ${result.summary.planned} |`,
    `| Updated | ${result.summary.updated} |`,
    `| Verified | ${result.summary.verified} |`,
    `| Failed | ${result.summary.failed} |`,
    `| DB update performed | **${result.dbUpdatePerformed ? "yes" : "no"}** |`,
    "",
    "## Preflight",
    "",
    `| Check | Result |`,
    `| --- | --- |`,
    `| Preflight OK | ${result.preflight.ok ? "yes" : "no"} |`,
  ];

  if (result.preflight.warnings?.length) {
    lines.push("", "### Warnings", "");
    for (const w of result.preflight.warnings) lines.push(`- ${w}`);
  }

  if (opts.backupPath) {
    lines.push("", `**Backup path:** \`${opts.backupPath}\``, "");
  }

  if (result.updated.length) {
    lines.push("## Updated entries", "", "| legacyId | verified | oldValue | newValue |", "| --- | --- | --- | --- |");
    for (const e of result.updated) {
      const oldShort = String(e.oldValue ?? "").replace(/example\.supabase\.co[^"]*/, "example.supabase.co/...");
      lines.push(`| ${e.legacyId} | ${e.verified} | ${oldShort.slice(0, 60)}… | ${e.newValue} |`);
    }
    lines.push("");
  }

  if (result.dryRunPlanned.length) {
    lines.push("## Dry-run planned", "", "| legacyId | newValue |", "| --- | --- |");
    for (const e of result.dryRunPlanned) {
      lines.push(`| ${e.legacyId} | ${e.newValue} |`);
    }
    lines.push("");
  }

  if (result.failed.length) {
    lines.push("## Failed", "", "| legacyId | error |", "| --- | --- |");
    for (const e of result.failed) {
      lines.push(`| ${e.legacyId} | ${e.error} |`);
    }
    lines.push("", "### Restore", "", "Use backup JSON to restore `cover_image_url` values if needed.", "");
  }

  lines.push(
    "## G-4d QA checklist",
    "",
    "1. `export-supabase-json` → `discography.json` has Storage public URLs",
    "2. `npm run build` with `--deploy-base /cms-kit-staging/gosaki/`",
    "3. `verify-static-public-artifact` → PASS",
    "4. `deploy-public-dist-ftp.mjs --apply --env staging` → `applied: true`",
    "5. Open https://yskcreate.weblike.jp/cms-kit-staging/gosaki/discography/",
    "6. Confirm 4 cover images visible; no `example.supabase.co` in HTML",
    "7. Schedule images may still be pending (expected)",
    "",
    "## Safety",
    "",
    "- Storage upload: **not performed**",
    "- Schedules table: **not touched**",
    "- Secrets: **not included** in this report",
    "",
    "---",
    "",
    result.message ?? "",
    "",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * @param {ReturnType<typeof runStorageDbUpdate>} result
 */
export function buildDbUpdateResultManifest(result) {
  return {
    siteSlug: result.siteSlug,
    mode: result.mode,
    dbUpdatePerformed: result.dbUpdatePerformed,
    storageUploadPerformed: false,
    schedulesTableTouched: false,
    stagingHost: result.stagingHost,
    generatedAt: result.generatedAt,
    backupPath: result.backupPath,
    summary: result.summary,
    updated: result.updated,
    failed: result.failed,
    dryRunPlanned: result.dryRunPlanned,
  };
}
