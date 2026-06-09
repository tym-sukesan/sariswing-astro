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
export const DISCOGRAPHY_LEGACY_IDS = [
  "discography-001",
  "discography-002",
  "discography-003",
  "discography-004",
];
export const SCHEDULE_HOME_LEGACY_IDS = ["schedule-2026-03-012"];

/** @deprecated use DISCOGRAPHY_LEGACY_IDS */
export const ALLOWED_LEGACY_IDS = DISCOGRAPHY_LEGACY_IDS;

const STAGING_PUBLIC_PREFIX = `https://${EXPECTED_STAGING_HOST}/storage/v1/object/public/site-assets/`;

/** @type {Record<string, { table: string, column: string, legacyIds: string[], expectedCount: number, phase: string, forbiddenColumns?: string[], forbiddenLegacyIds?: string[] }>} */
export const DB_UPDATE_PROFILES = {
  discography: {
    table: "discography",
    column: "cover_image_url",
    legacyIds: DISCOGRAPHY_LEGACY_IDS,
    expectedCount: 4,
    phase: "G-4c",
  },
  schedules: {
    table: "schedules",
    column: "home_image_url",
    legacyIds: SCHEDULE_HOME_LEGACY_IDS,
    expectedCount: 1,
    phase: "G-4g",
    forbiddenColumns: ["image_url"],
    forbiddenLegacyIds: ["schedule-2026-03-011"],
  },
};

/**
 * @param {string} table
 */
export function resolveDbUpdateProfile(table) {
  const profile = DB_UPDATE_PROFILES[table];
  if (!profile) {
    throw new Error(`Unsupported --table ${table}. Use discography or schedules.`);
  }
  return profile;
}

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
  const profile = resolveDbUpdateProfile(opts.table ?? "discography");
  const entries = plan.entries.filter(
    (e) => e.targetTable === profile.table && e.targetColumn === profile.column,
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
export async function preflightDbUpdatePlan(entries, stagingHost, profileKey = "discography") {
  const profile = resolveDbUpdateProfile(profileKey);
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

  if (entries.length !== profile.expectedCount) {
    errors.push(`Expected ${profile.expectedCount} plan entries, got ${entries.length}`);
  }

  const legacyIds = entries.map((e) => e.legacyId);
  for (const id of profile.legacyIds) {
    if (!legacyIds.includes(id)) {
      errors.push(`Missing legacy_id in plan: ${id}`);
    }
  }

  for (const forbiddenId of profile.forbiddenLegacyIds ?? []) {
    if (legacyIds.includes(forbiddenId)) {
      errors.push(`${forbiddenId}: must not be in plan`);
    }
  }

  for (const entry of entries) {
    if (entry.targetTable !== profile.table) {
      errors.push(`${entry.legacyId}: targetTable must be ${profile.table}`);
    }
    if (entry.targetColumn !== profile.column) {
      errors.push(`${entry.legacyId}: targetColumn must be ${profile.column}`);
    }
    for (const forbiddenColumn of profile.forbiddenColumns ?? []) {
      if (entry.targetColumn === forbiddenColumn) {
        errors.push(`${entry.legacyId}: targetColumn ${forbiddenColumn} must not be in plan`);
      }
    }
    if (!entry.newValue || !String(entry.newValue).startsWith(STAGING_PUBLIC_PREFIX)) {
      errors.push(
        `${entry.legacyId}: newValue must start with ${STAGING_PUBLIC_PREFIX}`,
      );
    }
    if (!entry.legacyId || !profile.legacyIds.includes(entry.legacyId)) {
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
    table: "discography",
    column: "cover_image_url",
    capturedAt: new Date().toISOString(),
    rows,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string[]} legacyIds
 */
export async function fetchSchedulesBackup(supabase, legacyIds) {
  const { data, error } = await supabase
    .from("schedules")
    .select("legacy_id,title,home_image_url,image_url,updated_at")
    .in("legacy_id", legacyIds)
    .order("legacy_id");

  if (error) {
    throw new Error(`Failed to read schedules backup: ${error.message}`);
  }

  const rows = data ?? [];
  const found = new Set(rows.map((r) => r.legacy_id));
  for (const id of legacyIds) {
    if (!found.has(id)) {
      throw new Error(`Backup read missing legacy_id: ${id}`);
    }
  }

  return {
    table: "schedules",
    column: "home_image_url",
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
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} entry
 */
async function updateScheduleHomeImageUrl(supabase, entry) {
  const { data, error } = await supabase
    .from("schedules")
    .update({ home_image_url: entry.newValue })
    .eq("legacy_id", entry.legacyId)
    .select("legacy_id,home_image_url,image_url")
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
  const table = opts.table ?? "discography";
  const profile = resolveDbUpdateProfile(table);
  const { plan } = loadDbUpdatePlan(opts.planPath);
  const entries = filterPlanEntries(plan, { siteSlug: opts.siteSlug, table });
  const isSchedule = table === "schedules";

  /** @type {object} */
  const result = {
    siteSlug: opts.siteSlug,
    mode: apply ? "apply" : "dry-run",
    table,
    phase: profile.phase,
    dbUpdatePerformed: false,
    storageUploadPerformed: false,
    schedulesTableTouched: isSchedule,
    imageUrlColumnTouched: false,
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
  result.preflight = await preflightDbUpdatePlan(entries, result.stagingHost, table);

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
    result.message = `Dry-run: ${entries.length} ${profile.table}.${profile.column} updates planned`;
    return result;
  }

  await assertSupabaseJsAvailable();
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const legacyIds = entries.map((e) => e.legacyId);
  const backup = isSchedule
    ? await fetchSchedulesBackup(supabase, legacyIds)
    : await fetchDiscographyBackup(supabase, legacyIds);
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
      if (isSchedule) {
        await updateScheduleHomeImageUrl(supabase, entry);

        const { data: afterRows, error: readError } = await supabase
          .from("schedules")
          .select("legacy_id,home_image_url,image_url")
          .eq("legacy_id", entry.legacyId)
          .single();

        if (readError) {
          throw new Error(`Post-update read failed: ${readError.message}`);
        }

        const verified = valuesMatch(afterRows.home_image_url, entry.newValue);
        if (!verified) {
          throw new Error(
            `Verification failed: expected ${entry.newValue}, got ${afterRows.home_image_url}`,
          );
        }

        result.updated.push({
          legacyId: entry.legacyId,
          targetTable: profile.table,
          targetColumn: profile.column,
          oldValue: before?.home_image_url ?? entry.currentValue ?? null,
          newValue: entry.newValue,
          imageUrlUnchanged: before?.image_url ?? null,
          verified: true,
          approvalScope: entry.approvalScope ?? "staging-only",
        });
      } else {
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
          targetTable: profile.table,
          targetColumn: profile.column,
          oldValue: before?.cover_image_url ?? entry.currentValue ?? null,
          newValue: entry.newValue,
          verified: true,
          approvalScope: entry.approvalScope ?? "staging-only",
        });
      }
      result.summary.updated += 1;
      result.summary.verified += 1;
    } catch (err) {
      result.failed.push({
        legacyId: entry.legacyId,
        targetTable: profile.table,
        targetColumn: profile.column,
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
  const isSchedule = result.table === "schedules";
  const title = isSchedule ? "Schedule DB Update Report (G-4g)" : "Storage DB Update Report (G-4c)";
  const phase = result.phase ?? (isSchedule ? "G-4g" : "G-4c");
  const tableName = isSchedule ? "schedules" : "discography";
  const columnName = isSchedule ? "home_image_url" : "cover_image_url";

  const lines = [
    `# ${title}`,
    "",
    `**Mode:** ${result.mode}`,
    `**Phase:** ${phase}`,
    `**Staging host:** ${result.stagingHost ?? "(unknown)"}`,
    `**Table:** ${tableName}`,
    `**Column:** ${columnName}`,
    `**Generated:** ${result.generatedAt}`,
    "",
    `> **Storage upload not performed** in ${phase}.`,
    isSchedule
      ? "> **schedules.image_url not touched.** schedule-2026-03-011 not touched."
      : "> **Schedule table not touched.**",
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

  if (isSchedule) {
    lines.push(
      "## G-4g QA checklist",
      "",
      "1. `export-supabase-json` → `schedules.json` has `schedule-2026-03-012.home_image_url` Storage URL",
      "2. `npm run build` with `--deploy-base /cms-kit-staging/gosaki/`",
      "3. `verify-static-public-artifact` → PASS",
      "4. `deploy-public-dist-ftp.mjs --apply --env staging` → `applied: true`",
      "5. Open https://yskcreate.weblike.jp/cms-kit-staging/gosaki/",
      "6. Confirm Golden PODs home image visible",
      "7. `schedule-2026-03-012.image_url` unchanged; `schedule-2026-03-011` unchanged",
      "",
      "## Safety",
      "",
      "- Storage upload: **not performed** in G-4g",
      "- `schedules.image_url`: **not touched**",
      "- `schedule-2026-03-011`: **not touched**",
      "- Secrets: **not included** in this report",
      "",
      "---",
      "",
      result.message ?? "",
      "",
    );
  } else {
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
  }

  return `${lines.join("\n")}\n`;
}

/**
 * @param {ReturnType<typeof runStorageDbUpdate>} result
 */
export function buildDbUpdateResultManifest(result) {
  return {
    siteSlug: result.siteSlug,
    mode: result.mode,
    phase: result.phase,
    table: result.table,
    dbUpdatePerformed: result.dbUpdatePerformed,
    storageUploadPerformed: false,
    schedulesTableTouched: result.schedulesTableTouched ?? false,
    imageUrlColumnTouched: result.imageUrlColumnTouched ?? false,
    stagingHost: result.stagingHost,
    generatedAt: result.generatedAt,
    backupPath: result.backupPath,
    summary: result.summary,
    updated: result.updated,
    failed: result.failed,
    dryRunPlanned: result.dryRunPlanned,
  };
}
