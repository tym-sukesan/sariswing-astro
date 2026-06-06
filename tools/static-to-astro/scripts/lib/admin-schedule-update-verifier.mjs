/**
 * Admin schedule update API verification (Phase 3-P-B).
 */

import fs from "node:fs";
import path from "node:path";
import {
  loadAdminApiEnv,
  resolveAdminEmailForVerify,
  runAstroBuild,
  scanDirForSecrets,
  signInAdminUser,
  startAstroDev,
  waitForDevServer,
} from "./admin-api-auth-verifier.mjs";

export const SCHEDULE_UPDATE_ENDPOINT = "/api/admin/schedules/update.json";
export const EXPECTED_SCHEDULE_COUNT = 60;

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function fetchScheduleRow(service, legacyId) {
  const { data, error } = await service
    .from("schedules")
    .select("legacy_id,title,venue,published")
    .eq("legacy_id", legacyId)
    .maybeSingle();
  if (error) throw new Error(`fetch schedule: ${error.message}`);
  return data;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function countSchedules(service) {
  const { count, error } = await service.from("schedules").select("*", { count: "exact", head: true });
  if (error) throw new Error(`count schedules: ${error.message}`);
  return count ?? 0;
}

/**
 * @param {string} baseUrl
 * @param {{ legacy_id: string, updates: object }} body
 * @param {string | null} token
 */
export async function postScheduleUpdate(baseUrl, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(new URL(SCHEDULE_UPDATE_ENDPOINT, baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${SCHEDULE_UPDATE_ENDPOINT}: ${text.slice(0, 160)}`);
  }

  return { status: res.status, json };
}

function recordsEqual(a, b) {
  if (!a || !b) return false;
  return a.title === b.title && a.venue === b.venue && a.published === b.published;
}

/**
 * @param {{ astroDir: string, env: object, email: string, legacyId: string, port?: number, skipBuild?: boolean }} opts
 */
export async function runAdminScheduleUpdateVerification({
  astroDir,
  env,
  email,
  legacyId,
  port = 4325,
  skipBuild = false,
}) {
  const result = {
    host: env.host,
    endpoint: SCHEDULE_UPDATE_ENDPOINT,
    legacyId,
    email,
    build: null,
    unauthenticated: null,
    invalidToken: null,
    adminUpdate: null,
    cleanupRestore: null,
    finalRecordEqualsOriginal: null,
    finalCounts: null,
    countsUnchanged: null,
    keyLeakScan: null,
    insertDeleteUpsert: false,
    singleRowUpdateOnly: true,
    errors: [],
    passed: false,
  };

  if (!env.adminPassword) {
    throw new Error("SUPABASE_ADMIN_PASSWORD required in .env.local");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const service = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let original;
  let baselineCount;

  try {
    original = await fetchScheduleRow(service, legacyId);
    if (!original) {
      throw new Error(`Target schedule not found: ${legacyId}`);
    }
    baselineCount = await countSchedules(service);
  } catch (err) {
    result.errors.push(err.message);
    return result;
  }

  if (!skipBuild) {
    result.build = runAstroBuild(astroDir, env);
    if (!result.build.ok) {
      result.errors.push(result.build.error ?? "build failed");
      return result;
    }
  } else {
    result.build = { ok: true, skipped: true, elapsedMs: 0 };
  }

  const child = startAstroDev(astroDir, env, port);
  const baseUrl = `http://127.0.0.1:${port}/`;

  try {
    await waitForDevServer(child, 90000);

    const unauth = await postScheduleUpdate(
      baseUrl,
      { legacy_id: legacyId, updates: { title: "should fail" } },
      null,
    );
    result.unauthenticated = {
      status: unauth.status,
      ok: unauth.json.ok,
      error: unauth.json.error,
      pass: unauth.status === 401 && unauth.json.ok === false && unauth.json.error === "unauthenticated",
    };

    const invalid = await postScheduleUpdate(
      baseUrl,
      { legacy_id: legacyId, updates: { title: "should fail" } },
      "invalidtoken123456789",
    );
    result.invalidToken = {
      status: invalid.status,
      ok: invalid.json.ok,
      error: invalid.json.error,
      pass: invalid.status === 401 && invalid.json.ok === false && invalid.json.error === "unauthenticated",
    };

    const { accessToken, refreshToken } = await signInAdminUser({
      supabaseUrl: env.supabaseUrl,
      anonKey: env.anonKey,
      email,
      password: env.adminPassword,
    });

    const testTitle = `${original.title ?? ""} [RLS UPDATE TEST]`;
    const testVenue = `${original.venue ?? ""} [TEST]`;

    const adminUpdate = await postScheduleUpdate(
      baseUrl,
      {
        legacy_id: legacyId,
        updates: { title: testTitle, venue: testVenue },
      },
      accessToken,
    );

    const afterUpdate = await fetchScheduleRow(service, legacyId);
    result.adminUpdate = {
      status: adminUpdate.status,
      ok: adminUpdate.json.ok,
      updated: adminUpdate.json.updated,
      legacyId: adminUpdate.json.legacy_id,
      recordTitle: adminUpdate.json.record?.title,
      pass:
        adminUpdate.status === 200 &&
        adminUpdate.json.ok === true &&
        adminUpdate.json.updated === true &&
        adminUpdate.json.legacy_id === legacyId &&
        afterUpdate?.title === testTitle &&
        afterUpdate?.venue === testVenue,
    };

    const restore = await postScheduleUpdate(
      baseUrl,
      {
        legacy_id: legacyId,
        updates: {
          title: original.title,
          venue: original.venue,
          published: original.published,
        },
      },
      accessToken,
    );

    const afterRestore = await fetchScheduleRow(service, legacyId);
    result.cleanupRestore = {
      status: restore.status,
      ok: restore.json.ok,
      pass: restore.status === 200 && restore.json.ok === true && recordsEqual(afterRestore, original),
    };

    result.finalRecordEqualsOriginal = recordsEqual(afterRestore, original);
    result.finalCounts = {
      schedules: await countSchedules(service),
    };
    result.countsUnchanged = result.finalCounts.schedules === baselineCount;

    const secrets = [env.serviceRoleKey, env.adminPassword, accessToken, refreshToken].filter(Boolean);
    const hits = scanDirForSecrets(path.join(astroDir, "dist"), secrets);
    result.keyLeakScan = {
      ok: hits.length === 0,
      hitCount: hits.length,
      files: hits.map((hit) => path.relative(astroDir, hit.file)),
    };

    if (!result.cleanupRestore.pass || !result.finalRecordEqualsOriginal) {
      result.errors.push("Cleanup restore failed — schedule record not restored to original");
    }

    result.passed =
      result.build.ok &&
      result.unauthenticated.pass &&
      result.invalidToken.pass &&
      result.adminUpdate.pass &&
      result.cleanupRestore.pass &&
      result.finalRecordEqualsOriginal === true &&
      result.countsUnchanged === true &&
      result.keyLeakScan.ok;

    return result;
  } catch (err) {
    result.errors.push(err.message);

    try {
      const current = await fetchScheduleRow(service, legacyId);
      if (!recordsEqual(current, original)) {
        await service
          .from("schedules")
          .update({
            title: original.title,
            venue: original.venue,
            published: original.published,
          })
          .eq("legacy_id", legacyId);
        result.errors.push("Emergency service-role restore attempted after failure");
      }
    } catch (restoreErr) {
      result.errors.push(`Emergency restore failed: ${restoreErr.message}`);
    }

    result.passed = false;
    return result;
  } finally {
    if (child.pid) child.kill("SIGTERM");
  }
}

/**
 * @param {{ reportPath: string, result: object, elapsedMs: number }} opts
 */
export function formatAdminScheduleUpdateReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ADMIN_SCHEDULE_UPDATE_VERIFY_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "Mode: **verify**",
    `Supabase host: \`${result.host}\``,
    `Endpoint: \`${result.endpoint}\``,
    `Target legacy_id: \`${result.legacyId}\``,
    `Admin email: \`${result.email}\``,
    "Secrets: *(not logged)*",
    "",
  ];

  if (result.build) {
    lines.push(
      "## Build",
      "",
      `- Success: ${result.build.ok ? "yes" : "no"}`,
      `- Skipped: ${result.build.skipped ? "yes" : "no"}`,
      result.build.elapsedMs != null ? `- Elapsed: ${result.build.elapsedMs}ms` : "",
      "",
    );
  }

  if (result.unauthenticated) {
    lines.push(
      "## Unauthenticated update",
      "",
      `- HTTP status: ${result.unauthenticated.status}`,
      `- ok: ${result.unauthenticated.ok}`,
      `- error: ${result.unauthenticated.error}`,
      `- OK: ${result.unauthenticated.pass ? "yes" : "no"}`,
      "",
    );
  }

  if (result.invalidToken) {
    lines.push(
      "## Invalid token update",
      "",
      `- HTTP status: ${result.invalidToken.status}`,
      `- error: ${result.invalidToken.error}`,
      `- OK: ${result.invalidToken.pass ? "yes" : "no"}`,
      "",
    );
  }

  if (result.adminUpdate) {
    lines.push(
      "## Admin update",
      "",
      `- HTTP status: ${result.adminUpdate.status}`,
      `- ok: ${result.adminUpdate.ok}`,
      `- updated: ${result.adminUpdate.updated}`,
      `- legacy_id: \`${result.adminUpdate.legacyId ?? "—"}\``,
      `- OK: ${result.adminUpdate.pass ? "yes" : "no"}`,
      "",
    );
  }

  if (result.cleanupRestore) {
    lines.push(
      "## Cleanup restore",
      "",
      `- HTTP status: ${result.cleanupRestore.status}`,
      `- OK: ${result.cleanupRestore.pass ? "yes" : "no"}`,
      `- Final record equals original: ${result.finalRecordEqualsOriginal ? "yes" : "no"}`,
      "",
    );
  }

  if (result.finalCounts) {
    lines.push(
      "## Final counts",
      "",
      `- schedules: ${result.finalCounts.schedules} (expected unchanged: ${EXPECTED_SCHEDULE_COUNT})`,
      `- Counts unchanged: ${result.countsUnchanged ? "yes" : "no"}`,
      "",
    );
  }

  if (result.keyLeakScan) {
    lines.push(
      "## Key leak scan (dist/)",
      "",
      `- OK: ${result.keyLeakScan.ok ? "yes" : "no"}`,
      `- Hits: ${result.keyLeakScan.hitCount}`,
      "",
    );
  }

  lines.push(
    "## Safety",
    "",
    "- insert / delete / upsert: **none**",
    "- update scope: **single row by legacy_id only**",
    "- service role key / anon key / password / tokens: **not logged**",
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
    "- Phase 3-P-C: Admin UI save wiring for schedule row",
    "- Phase 3-P-D: Discography update API",
    "- Production deploy review",
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
 * @param {{ passed: boolean, host: string, endpoint: string, legacyId: string }} summary
 */
export function appendPhase3PBToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin schedule update API (Phase 3-P-B)",
    "",
    `- **Endpoint:** \`${summary.endpoint}\``,
    `- **Target:** \`${summary.legacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Scope:** single-row update only; insert/delete/upsert none`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UPDATE_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin schedule update API (Phase 3-P-B)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
