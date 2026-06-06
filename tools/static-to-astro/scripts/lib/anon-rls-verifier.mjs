/**
 * Anon / publishable key RLS verification (Phase 3-N continued).
 * Staging only — test rows use rls-test-* prefix exclusively.
 */

import fs from "node:fs";
import path from "node:path";
import { preflightApplyEnv } from "./supabase-seed-inserter.mjs";
import { supabaseHostFromUrl } from "./supabase-json-exporter.mjs";

export const EXPECTED_BASELINE_COUNTS = {
  schedule_months: 5,
  schedules: 60,
  discography: 4,
  discography_tracks: 16,
};

export const TEST_ROWS = {
  scheduleLegacyId: "rls-test-unpublished-schedule",
  scheduleMonth: "2099-01",
  discographyLegacyId: "rls-test-unpublished-discography",
  trackTitle: "RLS Test Hidden Track",
  sourceFile: "rls-test",
};

export const TEST_SCHEDULE_MONTH = {
  month: TEST_ROWS.scheduleMonth,
  label: "2099.01",
  route: "/schedule-2099-01/",
  count: 1,
  sort_order: 999999,
  published: false,
};

export const TEST_SCHEDULE = {
  legacy_id: TEST_ROWS.scheduleLegacyId,
  date: "2099-01-01",
  year: 2099,
  month: TEST_ROWS.scheduleMonth,
  title: "RLS Test Unpublished Schedule",
  venue: "RLS Test Venue",
  published: false,
  show_on_home: false,
  sort_order: 999999,
  source_file: TEST_ROWS.sourceFile,
  source_route: "/rls-test/",
};

export const TEST_DISCOGRAPHY = {
  legacy_id: TEST_ROWS.discographyLegacyId,
  title: "RLS Test Unpublished Discography",
  artist: "RLS Test",
  release_date: "2099-01-01",
  year: 2099,
  published: false,
  sort_order: 999999,
  source_file: TEST_ROWS.sourceFile,
  source_route: "/rls-test/",
};

export const TEST_TRACK = {
  discography_legacy_id: TEST_ROWS.discographyLegacyId,
  track_number: 1,
  title: TEST_ROWS.trackTitle,
  sort_order: 1,
};

/**
 * @param {string} toolRoot
 * @param {{ requireAnonKey?: boolean }} opts
 */
export function loadAnonRlsEnv(toolRoot, { requireAnonKey = false } = {}) {
  const envPath = path.join(path.resolve(toolRoot), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `.env.local not found: ${envPath}\n` +
        "Copy .env.example and set staging credentials.",
    );
  }

  const raw = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    raw[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }

  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  if (requireAnonKey) {
    required.push("SUPABASE_ANON_KEY");
  }

  const missing = required.filter((key) => !(key in raw) || !String(raw[key]).trim());
  if (missing.length > 0) {
    throw new Error(
      `.env.local is missing required keys:\n${missing.map((key) => `  - ${key}`).join("\n")}`,
    );
  }

  const { supabaseUrl, serviceRoleKey } = preflightApplyEnv(raw);
  const anonKey = (raw.SUPABASE_ANON_KEY ?? "").trim();

  if (requireAnonKey && !anonKey) {
    throw new Error("SUPABASE_ANON_KEY is empty (anon or publishable key required for --apply).");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    anonKey: anonKey || null,
    host: supabaseHostFromUrl(supabaseUrl),
  };
}

async function createClients(env) {
  const { createClient } = await import("@supabase/supabase-js");
  const service = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anon = env.anonKey
    ? createClient(env.supabaseUrl, env.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  return { service, anon };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 */
async function countTable(client, table) {
  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 */
async function fetchPublishedSummary(client) {
  const tables = ["schedule_months", "schedules", "discography"];
  const summary = {};

  for (const table of tables) {
    const { data, error } = await client.from(table).select("published");
    if (error) throw new Error(`published summary ${table}: ${error.message}`);
    const rows = data ?? [];
    summary[table] = {
      total: rows.length,
      published_true: rows.filter((row) => row.published === true).length,
      published_false: rows.filter((row) => row.published === false).length,
    };
  }

  return summary;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
async function detectExistingTestRows(service) {
  const checks = {};

  const schedule = await service
    .from("schedules")
    .select("legacy_id")
    .eq("legacy_id", TEST_ROWS.scheduleLegacyId);
  checks.schedule = (schedule.data ?? []).length;

  const month = await service
    .from("schedule_months")
    .select("month")
    .eq("month", TEST_ROWS.scheduleMonth);
  checks.schedule_month = (month.data ?? []).length;

  const disc = await service
    .from("discography")
    .select("legacy_id")
    .eq("legacy_id", TEST_ROWS.discographyLegacyId);
  checks.discography = (disc.data ?? []).length;

  const track = await service
    .from("discography_tracks")
    .select("discography_legacy_id")
    .eq("discography_legacy_id", TEST_ROWS.discographyLegacyId);
  checks.discography_tracks = (track.data ?? []).length;

  return checks;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function cleanupTestRows(service) {
  const steps = [];
  const errors = [];

  const deletes = [
    {
      table: "discography_tracks",
      run: () =>
        service
          .from("discography_tracks")
          .delete()
          .eq("discography_legacy_id", TEST_ROWS.discographyLegacyId),
    },
    {
      table: "discography",
      run: () =>
        service.from("discography").delete().eq("legacy_id", TEST_ROWS.discographyLegacyId),
    },
    {
      table: "schedules",
      run: () => service.from("schedules").delete().eq("legacy_id", TEST_ROWS.scheduleLegacyId),
    },
    {
      table: "schedule_months",
      run: () => service.from("schedule_months").delete().eq("month", TEST_ROWS.scheduleMonth),
    },
  ];

  for (const step of deletes) {
    const { error, count } = await step.run();
    if (error) {
      errors.push(`${step.table}: ${error.message}`);
    } else {
      steps.push({ table: step.table, deleted: count ?? 0 });
    }
  }

  return { steps, errors, ok: errors.length === 0 };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
async function insertTestRows(service) {
  const results = [];

  const month = await service.from("schedule_months").insert(TEST_SCHEDULE_MONTH);
  if (month.error) throw new Error(`insert schedule_months: ${month.error.message}`);
  results.push("schedule_months");

  const schedule = await service.from("schedules").insert(TEST_SCHEDULE);
  if (schedule.error) throw new Error(`insert schedules: ${schedule.error.message}`);
  results.push("schedules");

  const disc = await service.from("discography").insert(TEST_DISCOGRAPHY);
  if (disc.error) throw new Error(`insert discography: ${disc.error.message}`);
  results.push("discography");

  const track = await service.from("discography_tracks").insert(TEST_TRACK);
  if (track.error) throw new Error(`insert discography_tracks: ${track.error.message}`);
  results.push("discography_tracks");

  return results;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
async function serviceSeesTestRows(service) {
  const schedule = await service
    .from("schedules")
    .select("legacy_id")
    .eq("legacy_id", TEST_ROWS.scheduleLegacyId)
    .maybeSingle();
  const disc = await service
    .from("discography")
    .select("legacy_id")
    .eq("legacy_id", TEST_ROWS.discographyLegacyId)
    .maybeSingle();
  const track = await service
    .from("discography_tracks")
    .select("discography_legacy_id")
    .eq("discography_legacy_id", TEST_ROWS.discographyLegacyId)
    .maybeSingle();

  return {
    schedule: Boolean(schedule.data),
    discography: Boolean(disc.data),
    track: Boolean(track.data),
    all: Boolean(schedule.data && disc.data && track.data),
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} anon
 */
async function readAnonVisibility(anon) {
  const [schedulesRes, monthsRes, discRes, tracksRes] = await Promise.all([
    anon.from("schedules").select("legacy_id,title,published"),
    anon.from("schedule_months").select("month,label,published"),
    anon.from("discography").select("legacy_id,title,published"),
    anon.from("discography_tracks").select("discography_legacy_id,title"),
  ]);

  for (const [name, res] of [
    ["schedules", schedulesRes],
    ["schedule_months", monthsRes],
    ["discography", discRes],
    ["discography_tracks", tracksRes],
  ]) {
    if (res.error) throw new Error(`anon read ${name}: ${res.error.message}`);
  }

  const schedules = schedulesRes.data ?? [];
  const months = monthsRes.data ?? [];
  const discography = discRes.data ?? [];
  const tracks = tracksRes.data ?? [];

  return {
    schedules,
    months,
    discography,
    tracks,
    seesPublishedSchedules: schedules.some((row) => row.published === true),
    seesUnpublishedSchedule: schedules.some(
      (row) => row.legacy_id === TEST_ROWS.scheduleLegacyId,
    ),
    seesUnpublishedMonth: months.some((row) => row.month === TEST_ROWS.scheduleMonth),
    seesUnpublishedDiscography: discography.some(
      (row) => row.legacy_id === TEST_ROWS.discographyLegacyId,
    ),
    seesHiddenTrack: tracks.some(
      (row) =>
        row.discography_legacy_id === TEST_ROWS.discographyLegacyId &&
        row.title === TEST_ROWS.trackTitle,
    ),
    publishedScheduleCount: schedules.filter((row) => row.published === true).length,
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
async function fetchAllCounts(service) {
  return {
    schedule_months: await countTable(service, "schedule_months"),
    schedules: await countTable(service, "schedules"),
    discography: await countTable(service, "discography"),
    discography_tracks: await countTable(service, "discography_tracks"),
  };
}

/**
 * @param {{ supabaseUrl: string, serviceRoleKey: string, anonKey?: string | null, host: string }} env
 * @param {{ apply?: boolean, keepTestRows?: boolean }} opts
 */
export async function runAnonRlsVerification(env, { apply = false, keepTestRows = false } = {}) {
  const { service, anon } = await createClients(env);
  const result = {
    mode: apply ? "apply" : "dry-run",
    host: env.host,
    baselineCounts: null,
    publishedSummary: null,
    existingTestRows: null,
    testRowsCreated: false,
    serviceRoleSeesTestRows: null,
    anonVisibility: null,
    cleanup: null,
    finalCounts: null,
    countsMatchBaseline: null,
    errors: [],
    passed: false,
  };

  try {
    result.baselineCounts = await fetchAllCounts(service);
    result.publishedSummary = await fetchPublishedSummary(service);
    result.existingTestRows = await detectExistingTestRows(service);

    if (!apply) {
      result.passed = true;
      return result;
    }

    if (!anon) {
      throw new Error("SUPABASE_ANON_KEY required for --apply");
    }

    const preExisting =
      Object.values(result.existingTestRows).some((count) => count > 0);
    if (preExisting) {
      const preCleanup = await cleanupTestRows(service);
      result.cleanup = { phase: "pre-insert", ...preCleanup };
      if (!preCleanup.ok) {
        throw new Error(`Pre-cleanup failed: ${preCleanup.errors.join("; ")}`);
      }
    }

    await insertTestRows(service);
    result.testRowsCreated = true;

    result.serviceRoleSeesTestRows = await serviceSeesTestRows(service);
    if (!result.serviceRoleSeesTestRows.all) {
      throw new Error("Service role does not see all test rows after insert");
    }

    result.anonVisibility = await readAnonVisibility(anon);

    if (keepTestRows) {
      result.finalCounts = await fetchAllCounts(service);
      result.countsMatchBaseline = null;
    } else {
      const postCleanup = await cleanupTestRows(service);
      result.cleanup = { phase: "post-verify", ...postCleanup };
      if (!postCleanup.ok) {
        throw new Error(`Cleanup failed: ${postCleanup.errors.join("; ")}`);
      }

      const remaining = await detectExistingTestRows(service);
      const anyLeft = Object.values(remaining).some((count) => count > 0);
      if (anyLeft) {
        throw new Error("Cleanup incomplete — rls-test-* rows remain");
      }

      result.finalCounts = await fetchAllCounts(service);
      result.countsMatchBaseline = Object.entries(EXPECTED_BASELINE_COUNTS).every(
        ([table, expected]) => result.finalCounts[table] === expected,
      );
    }

    const v = result.anonVisibility;
    result.passed =
      result.serviceRoleSeesTestRows.all &&
      v.seesPublishedSchedules &&
      !v.seesUnpublishedSchedule &&
      !v.seesUnpublishedDiscography &&
      !v.seesHiddenTrack &&
      !v.seesUnpublishedMonth &&
      (keepTestRows || result.countsMatchBaseline === true);

    return result;
  } catch (err) {
    result.errors.push(err.message);
    result.passed = false;

    if (apply && result.testRowsCreated && !keepTestRows) {
      try {
        const emergency = await cleanupTestRows(service);
        result.cleanup = { phase: "emergency", ...emergency };
      } catch (cleanupErr) {
        result.errors.push(`Emergency cleanup failed: ${cleanupErr.message}`);
      }
    }

    return result;
  }
}

/**
 * @param {{ reportPath: string, result: object, elapsedMs: number }} opts
 */
export function formatAnonRlsReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ANON_RLS_VERIFY_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    `Mode: **${result.mode === "apply" ? "APPLY" : "DRY-RUN"}**`,
    `Supabase host: \`${result.host}\``,
    "Keys: *(not logged)*",
    "",
  ];

  if (result.baselineCounts) {
    lines.push("## Baseline counts (service role)", "", "| Table | Count |", "| --- | ---: |");
    for (const [table, count] of Object.entries(result.baselineCounts)) {
      const expected = EXPECTED_BASELINE_COUNTS[table];
      const note = expected != null && count !== expected ? ` (expected ${expected})` : "";
      lines.push(`| ${table} | ${count}${note} |`);
    }
    lines.push("");
  }

  if (result.publishedSummary) {
    lines.push("## Published summary (service role)", "", "| Table | total | published=true | published=false |", "| --- | ---: | ---: | ---: |");
    for (const [table, stats] of Object.entries(result.publishedSummary)) {
      lines.push(
        `| ${table} | ${stats.total} | ${stats.published_true} | ${stats.published_false} |`,
      );
    }
    lines.push("");
  }

  if (result.existingTestRows) {
    lines.push("## Existing rls-test-* rows (before run)", "");
    for (const [key, count] of Object.entries(result.existingTestRows)) {
      lines.push(`- ${key}: ${count}`);
    }
    lines.push("");
  }

  if (result.mode === "dry-run") {
    lines.push(
      "## Dry-run plan",
      "",
      "No writes performed. With `--apply`, the script will:",
      "",
      "1. Insert test rows (`rls-test-*`, `published=false`) via service role",
      "2. Confirm service role sees test rows",
      "3. Confirm anon client does **not** see unpublished test rows",
      "4. Confirm anon client **does** see existing `published=true` rows",
      "5. Delete **only** `rls-test-*` rows (unless `--keep-test-rows`)",
      "",
    );
  }

  if (result.mode === "apply") {
    lines.push(
      "## Apply results",
      "",
      `- Test rows created: ${result.testRowsCreated ? "yes" : "no"}`,
      `- Service role sees test rows: ${result.serviceRoleSeesTestRows?.all ? "yes" : "no"}`,
      "",
    );

    if (result.anonVisibility) {
      const v = result.anonVisibility;
      lines.push(
        "### Anon visibility",
        "",
        "| Check | Result | Expected |",
        "| --- | --- | --- |",
        `| Sees published schedules | ${v.seesPublishedSchedules ? "yes" : "no"} | yes |`,
        `| Published schedule count (anon) | ${v.publishedScheduleCount} | > 0 |`,
        `| Sees unpublished test schedule | ${v.seesUnpublishedSchedule ? "yes" : "no"} | no |`,
        `| Sees unpublished test month | ${v.seesUnpublishedMonth ? "yes" : "no"} | no |`,
        `| Sees unpublished test discography | ${v.seesUnpublishedDiscography ? "yes" : "no"} | no |`,
        `| Sees hidden track | ${v.seesHiddenTrack ? "yes" : "no"} | no |`,
        "",
      );
    }

    if (result.cleanup) {
      lines.push(
        "## Cleanup",
        "",
        `- Phase: ${result.cleanup.phase ?? "unknown"}`,
        `- OK: ${result.cleanup.ok ? "yes" : "no"}`,
        "",
      );
      if (result.cleanup.steps?.length) {
        for (const step of result.cleanup.steps) {
          lines.push(`- ${step.table}: deleted ${step.deleted}`);
        }
        lines.push("");
      }
      if (result.cleanup.errors?.length) {
        lines.push("Cleanup errors:", "");
        for (const err of result.cleanup.errors) {
          lines.push(`- ${err}`);
        }
        lines.push("");
      }
    }

    if (result.finalCounts) {
      lines.push("## Final counts (service role)", "", "| Table | Count | Expected |", "| --- | ---: | ---: |");
      for (const [table, count] of Object.entries(result.finalCounts)) {
        const expected = EXPECTED_BASELINE_COUNTS[table] ?? "—";
        lines.push(`| ${table} | ${count} | ${expected} |`);
      }
      lines.push(
        "",
        `- Counts match baseline: ${result.countsMatchBaseline === null ? "n/a (--keep-test-rows)" : result.countsMatchBaseline ? "yes" : "no"}`,
        "",
      );
    }
  }

  lines.push(
    "## Safety",
    "",
    "- Supabase writes (if any): **rls-test-* test rows only** (`--apply` mode)",
    "- Existing seed rows: not updated or deleted",
    "- Service role / anon / publishable keys: not written to this report",
    "",
    "## Overall",
    "",
    result.passed ? "**PASS**" : "**FAIL**",
    "",
  );

  if (result.errors.length) {
    lines.push("### Errors", "");
    for (const err of result.errors) {
      lines.push(`- ${err}`);
    }
    lines.push("");
  }

  lines.push(
    "## Next phases",
    "",
    "- Phase 3-O: Admin save via authenticated server routes",
    "- Phase 3-P: Auth user bootstrap + admin_users insert",
    "- Production RLS review before go-live",
    "",
    "---",
    `Elapsed: ${elapsedMs}ms`,
    `Report: \`${reportPath}\``,
    "",
  );

  return lines.join("\n");
}

/**
 * @param {string} astroDir
 * @param {{ passed: boolean, mode: string, host: string }} summary
 */
export function appendPhase3NAnonToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Anon RLS verification (Phase 3-N continued)",
    "",
    `- **Mode:** ${summary.mode}`,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Writes:** rls-test-* only (--apply)`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ANON_RLS_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Anon RLS verification (Phase 3-N continued)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
