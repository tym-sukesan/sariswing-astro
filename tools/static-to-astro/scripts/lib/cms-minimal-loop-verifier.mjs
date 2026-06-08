/**
 * CMS minimal loop integration verification (Phase 3-Q).
 * Admin update → Supabase → JSON export → Astro build → HTML check → cleanup → re-export/rebuild.
 */

import fs from "node:fs";
import path from "node:path";
import {
  killProcessesOnPort,
  runAstroBuild,
  scanDirForSecrets,
  signInAdminUser,
  startAstroDev,
  stopDevServer,
  waitForDevServer,
} from "./admin-api-auth-verifier.mjs";
import {
  fetchScheduleRow,
  postScheduleUpdate,
  scheduleRecordsEqual,
  countSchedules,
} from "./admin-schedule-update-verifier.mjs";
import {
  buildDiscographyRestoreUpdates,
  countDiscography,
  countDiscographyTracks,
  discographyRecordsEqual,
  fetchDiscographyRow,
  fetchDiscographyTracks,
  postDiscographyUpdate,
  tracksEqual,
} from "./admin-discography-ui-save-verifier.mjs";
import {
  buildTracksRestorePayload,
  postDiscographyTracksUpdate,
} from "./admin-discography-tracks-ui-save-verifier.mjs";
import { EXPECTED_BASELINE_COUNTS } from "./anon-rls-verifier.mjs";
import {
  analyzeExportIntegrity,
  fetchSupabaseCmsData,
  loadExportEnv,
  supabaseHostFromUrl,
  transformDiscography,
  transformScheduleMonths,
  transformSchedules,
  writeAstroDataJson,
} from "./supabase-json-exporter.mjs";

export const CMS_LOOP_MARKER = "[CMS LOOP TEST]";
export const UPDATE_METHOD = "Admin API route";
export const EXPECTED_COUNTS = EXPECTED_BASELINE_COUNTS;

const SCHEDULE_BASELINE_SELECT =
  "legacy_id,title,venue,open_time,start_time,price,description,show_on_home,home_order,published,month";

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 * @param {string} legacyId
 */
export async function fetchScheduleBaseline(service, legacyId) {
  const { data, error } = await service
    .from("schedules")
    .select(SCHEDULE_BASELINE_SELECT)
    .eq("legacy_id", legacyId)
    .maybeSingle();
  if (error) throw new Error(`fetch schedule baseline: ${error.message}`);
  return data;
}

/**
 * @param {object} original
 */
export function buildScheduleTempUpdates(original) {
  return {
    title: `${original.title ?? ""} ${CMS_LOOP_MARKER}`.trim(),
    venue: `${original.venue ?? ""} ${CMS_LOOP_MARKER}`.trim(),
    description: "CMS loop test description",
  };
}

/**
 * @param {object} original
 */
export function buildDiscographyTempUpdates(original) {
  return {
    title: `${original.title ?? ""} ${CMS_LOOP_MARKER}`.trim(),
    artist: `${original.artist ?? ""} ${CMS_LOOP_MARKER}`.trim(),
    description: "CMS loop test discography description",
  };
}

/**
 * @param {Array<object>} tracks
 * @param {number} trackNumber
 */
export function buildTrackTempPayload(tracks, trackNumber) {
  return tracks.map((track) => ({
    track_number: track.track_number,
    title:
      Number(track.track_number) === Number(trackNumber)
        ? `${track.title ?? ""} ${CMS_LOOP_MARKER}`.trim()
        : track.title,
    sort_order: track.sort_order,
  }));
}

/**
 * Resolve built HTML path (Astro node adapter uses dist/client/).
 * @param {string} astroDir
 * @param {string} routePath e.g. "schedule-2026-03/index.html"
 */
export function resolveBuiltHtmlPath(astroDir, routePath) {
  const candidates = [
    path.join(astroDir, "dist/client", routePath),
    path.join(astroDir, "dist", routePath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * @param {string[]} htmlPaths
 * @param {string} marker
 * @param {boolean} expectPresent
 */
export function verifyHtmlMarker(htmlPaths, marker, expectPresent) {
  const checks = [];
  let allPass = true;

  for (const htmlPath of htmlPaths) {
    if (!htmlPath || !fs.existsSync(htmlPath)) {
      checks.push({
        path: htmlPath,
        exists: false,
        containsMarker: false,
        pass: false,
      });
      allPass = false;
      continue;
    }

    const html = fs.readFileSync(htmlPath, "utf8");
    const containsMarker = html.includes(marker);
    const pass = expectPresent ? containsMarker : !containsMarker;
    checks.push({
      path: htmlPath,
      exists: true,
      containsMarker,
      pass,
    });
    if (!pass) allPass = false;
  }

  return { pass: allPass, checks };
}

/**
 * @param {{ toolRoot: string, astroDir: string }} opts
 */
export async function runSupabaseJsonExport({ toolRoot, astroDir }) {
  const env = loadExportEnv(toolRoot);
  const raw = await fetchSupabaseCmsData(env);
  const exported = {
    scheduleMonths: transformScheduleMonths(raw.scheduleMonths),
    schedules: transformSchedules(raw.schedules),
    discography: transformDiscography(raw.discography, raw.discographyTracks),
  };
  const integrity = analyzeExportIntegrity(raw, exported);
  const outputFiles = writeAstroDataJson(exported, astroDir);

  return {
    ok: true,
    host: supabaseHostFromUrl(env.supabaseUrl),
    integrity,
    outputFiles,
    readCounts: integrity.readCounts,
  };
}

/**
 * Run a short-lived Astro dev server session for Admin API calls.
 * @param {{ astroDir: string, env: object, email: string, port: number }} sessionOpts
 * @param {(ctx: { baseUrl: string, accessToken: string, refreshToken: string }) => Promise<void>} fn
 */
async function runAdminApiSession({ astroDir, env, email, port }, fn) {
  if (!env.adminPassword) {
    throw new Error("SUPABASE_ADMIN_PASSWORD required in .env.local");
  }

  const devChild = startAstroDev(astroDir, env, port);
  try {
    await waitForDevServer(devChild, 90000);
    const baseUrl = `http://127.0.0.1:${port}/`;
    const { accessToken, refreshToken } = await signInAdminUser({
      supabaseUrl: env.supabaseUrl,
      anonKey: env.anonKey,
      email,
      password: env.adminPassword,
    });
    await fn({ baseUrl, accessToken, refreshToken });
    return { accessToken, refreshToken };
  } catch (err) {
    if (err.outputTail) {
      err.message = `${err.message}\n--- astro dev output tail ---\n${err.outputTail}`;
    }
    throw err;
  } finally {
    stopDevServer(devChild);
    killProcessesOnPort(port);
  }
}

/**
 * @param {string} astroDir
 * @param {object} baselineSchedule
 */
function buildHtmlTargetPaths(astroDir, baselineSchedule) {
  const month = baselineSchedule.month ?? "2026-03";
  const paths = [resolveBuiltHtmlPath(astroDir, `schedule-${month}/index.html`)];
  if (baselineSchedule.show_on_home) {
    paths.push(resolveBuiltHtmlPath(astroDir, "index.html"));
  }
  paths.push(resolveBuiltHtmlPath(astroDir, "discography/index.html"));
  return paths.filter(Boolean);
}

/**
 * @param {{ toolRoot: string, astroDir: string, env: object, email: string, scheduleLegacyId: string, discographyLegacyId: string, trackNumber: number, port?: number, skipBuild?: boolean }} opts
 */
export async function runCmsMinimalLoopVerification({
  toolRoot,
  astroDir,
  env,
  email,
  scheduleLegacyId,
  discographyLegacyId,
  trackNumber,
  port = 4329,
  skipBuild = false,
}) {
  const result = {
    mode: "CMS minimal loop integration",
    host: env.host,
    port,
    scheduleLegacyId,
    discographyLegacyId,
    trackNumber,
    updateMethod: UPDATE_METHOD,
    baseline: null,
    temporaryUpdate: null,
    export: null,
    build: null,
    htmlReflectsTemporary: null,
    cleanupRestore: null,
    reExport: null,
    rebuild: null,
    htmlRestored: null,
    finalRecordEqualsOriginal: null,
    finalCounts: null,
    countsUnchanged: null,
    keyLeakScan: null,
    insertDeleteUpsert: false,
    updateScopeThreeOnly: true,
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

  let baselineSchedule;
  let baselineDiscography;
  let baselineTracks;
  let baselineCounts;

  try {
    baselineSchedule = await fetchScheduleBaseline(service, scheduleLegacyId);
    if (!baselineSchedule) {
      throw new Error(`Target schedule not found: ${scheduleLegacyId}`);
    }

    baselineDiscography = await fetchDiscographyRow(service, discographyLegacyId);
    if (!baselineDiscography) {
      throw new Error(`Target discography not found: ${discographyLegacyId}`);
    }

    baselineTracks = await fetchDiscographyTracks(service, discographyLegacyId);
    const targetTrack = baselineTracks.find((t) => Number(t.track_number) === Number(trackNumber));
    if (!targetTrack) {
      throw new Error(`Target track not found: ${discographyLegacyId} track ${trackNumber}`);
    }

    baselineCounts = {
      schedules: await countSchedules(service),
      discography: await countDiscography(service),
      discography_tracks: await countDiscographyTracks(service),
    };

    result.baseline = {
      ok: true,
      scheduleFound: true,
      discographyFound: true,
      trackFound: true,
      counts: baselineCounts,
      expectedCounts: EXPECTED_COUNTS,
      countsMatchExpected:
        baselineCounts.schedules === EXPECTED_COUNTS.schedules &&
        baselineCounts.discography === EXPECTED_COUNTS.discography &&
        baselineCounts.discography_tracks === EXPECTED_COUNTS.discography_tracks,
    };
  } catch (err) {
    result.baseline = { ok: false, error: err.message };
    result.errors.push(`baseline: ${err.message}`);
    return result;
  }

  if (!result.baseline.countsMatchExpected) {
    result.errors.push(
      `baseline counts mismatch: schedules=${baselineCounts.schedules}, discography=${baselineCounts.discography}, discography_tracks=${baselineCounts.discography_tracks}`,
    );
    return result;
  }

  let accessToken = null;
  let refreshToken = null;

  try {
    const scheduleUpdates = buildScheduleTempUpdates(baselineSchedule);
    const discographyUpdates = buildDiscographyTempUpdates(baselineDiscography);
    const trackPayload = buildTrackTempPayload(baselineTracks, trackNumber);

    ({ accessToken, refreshToken } = await runAdminApiSession(
      { astroDir, env, email, port },
      async ({ baseUrl, accessToken: token }) => {
        const scheduleRes = await postScheduleUpdate(
          baseUrl,
          { legacy_id: scheduleLegacyId, updates: scheduleUpdates },
          token,
        );
        const discographyRes = await postDiscographyUpdate(
          baseUrl,
          { legacy_id: discographyLegacyId, updates: discographyUpdates },
          token,
        );
        const tracksRes = await postDiscographyTracksUpdate(
          baseUrl,
          { discography_legacy_id: discographyLegacyId, tracks: trackPayload },
          token,
        );

        const afterSchedule = await fetchScheduleRow(service, scheduleLegacyId);
        const afterDiscography = await fetchDiscographyRow(service, discographyLegacyId);
        const afterTracks = await fetchDiscographyTracks(service, discographyLegacyId);

        const expectedSchedule = { ...baselineSchedule, ...scheduleUpdates };
        const expectedDiscography = { ...baselineDiscography, ...discographyUpdates };
        const expectedTracks = baselineTracks.map((track) => {
          if (Number(track.track_number) !== Number(trackNumber)) return track;
          return {
            ...track,
            title: `${track.title ?? ""} ${CMS_LOOP_MARKER}`.trim(),
          };
        });

        const scheduleOk =
          scheduleRes.status === 200 &&
          scheduleRes.json.ok === true &&
          afterSchedule?.title === expectedSchedule.title &&
          afterSchedule?.venue === expectedSchedule.venue &&
          afterSchedule?.description === expectedSchedule.description;

        const discographyOk =
          discographyRes.status === 200 &&
          discographyRes.json.ok === true &&
          afterDiscography?.title === expectedDiscography.title &&
          afterDiscography?.artist === expectedDiscography.artist &&
          afterDiscography?.description === expectedDiscography.description;

        const trackOk =
          tracksRes.status === 200 &&
          tracksRes.json.ok === true &&
          tracksEqual(afterTracks, expectedTracks);

        result.temporaryUpdate = {
          ok: scheduleOk && discographyOk && trackOk,
          schedule: { status: scheduleRes.status, ok: scheduleRes.json.ok, pass: scheduleOk },
          discography: { status: discographyRes.status, ok: discographyRes.json.ok, pass: discographyOk },
          tracks: { status: tracksRes.status, ok: tracksRes.json.ok, pass: trackOk },
        };
      },
    ));

    if (!result.temporaryUpdate?.ok) {
      result.errors.push("temporary update failed");
      return result;
    }

    result.export = await runSupabaseJsonExport({ toolRoot, astroDir });

    if (skipBuild) {
      result.build = { ok: true, skipped: true, elapsedMs: 0 };
    } else {
      result.build = runAstroBuild(astroDir, env);
      if (!result.build.ok) {
        result.errors.push(result.build.error ?? "build failed");
        return result;
      }
    }

    const htmlCheck = verifyHtmlMarker(
      buildHtmlTargetPaths(astroDir, baselineSchedule),
      CMS_LOOP_MARKER,
      true,
    );
    result.htmlReflectsTemporary = {
      pass: htmlCheck.pass,
      marker: CMS_LOOP_MARKER,
      checks: htmlCheck.checks.map((check) => ({
        path: check.path ? path.relative(astroDir, check.path) : null,
        exists: check.exists,
        containsMarker: check.containsMarker,
        pass: check.pass,
      })),
    };

    if (!result.htmlReflectsTemporary.pass) {
      result.errors.push("HTML does not reflect temporary changes");
    }

    await runAdminApiSession({ astroDir, env, email, port }, async ({ baseUrl, accessToken: token }) => {
      const scheduleRestore = await postScheduleUpdate(
        baseUrl,
        {
          legacy_id: scheduleLegacyId,
          updates: {
            title: baselineSchedule.title,
            venue: baselineSchedule.venue,
            description: baselineSchedule.description,
          },
        },
        token,
      );
      const discographyRestore = await postDiscographyUpdate(
        baseUrl,
        {
          legacy_id: discographyLegacyId,
          updates: buildDiscographyRestoreUpdates(baselineDiscography),
        },
        token,
      );
      const tracksRestore = await postDiscographyTracksUpdate(
        baseUrl,
        {
          discography_legacy_id: discographyLegacyId,
          tracks: buildTracksRestorePayload(baselineTracks),
        },
        token,
      );

      const restoredSchedule = await fetchScheduleRow(service, scheduleLegacyId);
      const restoredDiscography = await fetchDiscographyRow(service, discographyLegacyId);
      const restoredTracks = await fetchDiscographyTracks(service, discographyLegacyId);

      const scheduleRestored =
        scheduleRestore.status === 200 &&
        scheduleRestore.json.ok === true &&
        scheduleRecordsEqual(restoredSchedule, baselineSchedule);
      const discographyRestored =
        discographyRestore.status === 200 &&
        discographyRestore.json.ok === true &&
        discographyRecordsEqual(restoredDiscography, baselineDiscography);
      const tracksRestored =
        tracksRestore.status === 200 &&
        tracksRestore.json.ok === true &&
        tracksEqual(restoredTracks, baselineTracks);

      result.cleanupRestore = {
        ok: scheduleRestored && discographyRestored && tracksRestored,
        schedule: { status: scheduleRestore.status, pass: scheduleRestored },
        discography: { status: discographyRestore.status, pass: discographyRestored },
        tracks: { status: tracksRestore.status, pass: tracksRestored },
      };

      if (!result.cleanupRestore.ok) {
        throw new Error("Cleanup restore failed — records not restored to baseline");
      }
    });
  } catch (err) {
    if (!result.cleanupRestore) {
      result.cleanupRestore = { ok: false, error: err.message };
    }
    if (err.outputTail) {
      result.devServerOutputTail = err.outputTail;
    }
    if (!result.errors.includes(err.message)) {
      result.errors.push(err.message);
    }
    killProcessesOnPort(port);
    return result;
  }

  try {
    result.reExport = await runSupabaseJsonExport({ toolRoot, astroDir });
  } catch (err) {
    result.reExport = { ok: false, error: err.message };
    result.errors.push(`re-export: ${err.message}`);
    return result;
  }

  if (skipBuild) {
    result.rebuild = { ok: true, skipped: true, elapsedMs: 0 };
  } else {
    result.rebuild = runAstroBuild(astroDir, env);
    if (!result.rebuild.ok) {
      result.errors.push(result.rebuild.error ?? "rebuild failed");
      return result;
    }
  }

  const restoredHtmlCheck = verifyHtmlMarker(
    buildHtmlTargetPaths(astroDir, baselineSchedule),
    CMS_LOOP_MARKER,
    false,
  );
  result.htmlRestored = {
    pass: restoredHtmlCheck.pass,
    checks: restoredHtmlCheck.checks.map((check) => ({
      path: check.path ? path.relative(astroDir, check.path) : null,
      exists: check.exists,
      containsMarker: check.containsMarker,
      pass: check.pass,
    })),
  };

  const finalSchedule = await fetchScheduleRow(service, scheduleLegacyId);
  const finalDiscography = await fetchDiscographyRow(service, discographyLegacyId);
  const finalTracks = await fetchDiscographyTracks(service, discographyLegacyId);

  result.finalRecordEqualsOriginal =
    scheduleRecordsEqual(finalSchedule, baselineSchedule) &&
    discographyRecordsEqual(finalDiscography, baselineDiscography) &&
    tracksEqual(finalTracks, baselineTracks);

  result.finalCounts = {
    schedules: await countSchedules(service),
    discography: await countDiscography(service),
    discography_tracks: await countDiscographyTracks(service),
  };

  result.countsUnchanged =
    result.finalCounts.schedules === baselineCounts.schedules &&
    result.finalCounts.discography === baselineCounts.discography &&
    result.finalCounts.discography_tracks === baselineCounts.discography_tracks &&
    result.finalCounts.schedules === EXPECTED_COUNTS.schedules &&
    result.finalCounts.discography === EXPECTED_COUNTS.discography &&
    result.finalCounts.discography_tracks === EXPECTED_COUNTS.discography_tracks;

  const secrets = [
    env.serviceRoleKey,
    env.adminPassword,
    env.anonKey,
    accessToken,
    refreshToken,
  ].filter((value) => value && value.length >= 12);

  const hits = scanDirForSecrets(path.join(astroDir, "dist"), secrets);
  result.keyLeakScan = {
    ok: hits.length === 0,
    hitCount: hits.length,
    files: hits.map((hit) => path.relative(astroDir, hit.file)),
  };

  if (!result.htmlRestored.pass) {
    result.errors.push("HTML not restored after cleanup");
  }
  if (!result.finalRecordEqualsOriginal) {
    result.errors.push("Final records do not equal baseline");
  }
  if (!result.countsUnchanged) {
    result.errors.push("Final counts changed");
  }
  if (!result.keyLeakScan.ok) {
    result.errors.push("Key leak scan failed");
  }

  result.passed =
    result.baseline?.ok === true &&
    result.temporaryUpdate?.ok === true &&
    result.export?.ok === true &&
    result.build?.ok === true &&
    result.htmlReflectsTemporary?.pass === true &&
    result.cleanupRestore?.ok === true &&
    result.reExport?.ok === true &&
    result.rebuild?.ok === true &&
    result.htmlRestored?.pass === true &&
    result.finalRecordEqualsOriginal === true &&
    result.countsUnchanged === true &&
    result.keyLeakScan?.ok === true;

  return result;
}

/**
 * @param {object} result
 * @param {{ reportPath: string, elapsedMs: number }} meta
 */
export function formatCmsMinimalLoopReport(result, { reportPath, elapsedMs }) {
  const lines = [
    "# CMS Minimal Loop Verify Report (Phase 3-Q)",
    "",
    `- **Mode:** ${result.mode}`,
    `- **Host:** \`${result.host}\``,
    `- **Dev port:** ${result.port ?? "—"}`,
    `- **Schedule legacy_id:** \`${result.scheduleLegacyId}\``,
    `- **Discography legacy_id:** \`${result.discographyLegacyId}\``,
    `- **Track number:** ${result.trackNumber}`,
    `- **Update method:** ${result.updateMethod}`,
    `- **Result:** ${result.passed ? "PASS" : "FAIL"}`,
    "",
  ];

  if (result.baseline) {
    lines.push(
      "## Baseline",
      "",
      `- OK: ${result.baseline.ok ? "yes" : "no"}`,
      `- schedules: ${result.baseline.counts?.schedules ?? "—"} (expected ${EXPECTED_COUNTS.schedules})`,
      `- discography: ${result.baseline.counts?.discography ?? "—"} (expected ${EXPECTED_COUNTS.discography})`,
      `- discography_tracks: ${result.baseline.counts?.discography_tracks ?? "—"} (expected ${EXPECTED_COUNTS.discography_tracks})`,
      "",
    );
  }

  if (result.temporaryUpdate) {
    lines.push(
      "## Temporary update (Admin API)",
      "",
      `- OK: ${result.temporaryUpdate.ok ? "yes" : "no"}`,
      `- Schedule: ${result.temporaryUpdate.schedule?.pass ? "OK" : "FAIL"}`,
      `- Discography: ${result.temporaryUpdate.discography?.pass ? "OK" : "FAIL"}`,
      `- Track: ${result.temporaryUpdate.tracks?.pass ? "OK" : "FAIL"}`,
      "",
    );
  }

  if (result.export) {
    lines.push(
      "## Supabase → JSON export",
      "",
      `- OK: ${result.export.ok ? "yes" : "no"}`,
      `- schedules read: ${result.export.readCounts?.schedules ?? "—"}`,
      `- discography read: ${result.export.readCounts?.discography ?? "—"}`,
      `- discography_tracks read: ${result.export.readCounts?.discography_tracks ?? "—"}`,
      "",
    );
  }

  if (result.build) {
    lines.push(
      "## Astro build",
      "",
      `- success: ${result.build.ok ? "yes" : "no"}`,
      `- skipped: ${result.build.skipped ? "yes" : "no"}`,
      `- elapsed: ${result.build.elapsedMs ?? 0}ms`,
      "",
    );
  }

  if (result.htmlReflectsTemporary) {
    lines.push(
      "## HTML reflects temporary changes",
      "",
      `- marker: \`${result.htmlReflectsTemporary.marker}\``,
      `- pass: ${result.htmlReflectsTemporary.pass ? "yes" : "no"}`,
      "",
    );
    for (const check of result.htmlReflectsTemporary.checks ?? []) {
      lines.push(`- \`${check.path ?? "missing"}\`: exists=${check.exists}, marker=${check.containsMarker}, pass=${check.pass}`);
    }
    lines.push("");
  }

  if (result.cleanupRestore) {
    lines.push(
      "## Cleanup restore",
      "",
      `- OK: ${result.cleanupRestore.ok ? "yes" : "no"}`,
      `- Schedule: ${result.cleanupRestore.schedule?.pass ? "OK" : "FAIL"}`,
      `- Discography: ${result.cleanupRestore.discography?.pass ? "OK" : "FAIL"}`,
      `- Track: ${result.cleanupRestore.tracks?.pass ? "OK" : "FAIL"}`,
      "",
    );
  }

  if (result.reExport) {
    lines.push(
      "## Re-export",
      "",
      `- OK: ${result.reExport.ok ? "yes" : "no"}`,
      "",
    );
  }

  if (result.rebuild) {
    lines.push(
      "## Rebuild",
      "",
      `- success: ${result.rebuild.ok ? "yes" : "no"}`,
      `- skipped: ${result.rebuild.skipped ? "yes" : "no"}`,
      `- elapsed: ${result.rebuild.elapsedMs ?? 0}ms`,
      "",
    );
  }

  if (result.htmlRestored) {
    lines.push(
      "## Restored HTML",
      "",
      `- pass: ${result.htmlRestored.pass ? "yes" : "no"}`,
      "",
    );
    for (const check of result.htmlRestored.checks ?? []) {
      lines.push(`- \`${check.path ?? "missing"}\`: marker=${check.containsMarker}, pass=${check.pass}`);
    }
    lines.push("");
  }

  lines.push(
    "## Final verification",
    "",
    `- final record equals original: ${result.finalRecordEqualsOriginal ? "yes" : "no"}`,
    `- final counts unchanged: ${result.countsUnchanged ? "yes" : "no"}`,
    `- schedules: ${result.finalCounts?.schedules ?? "—"}`,
    `- discography: ${result.finalCounts?.discography ?? "—"}`,
    `- discography_tracks: ${result.finalCounts?.discography_tracks ?? "—"}`,
    `- key leak scan: ${result.keyLeakScan?.ok ? "OK" : "FAIL"}`,
    "",
    "## Safety",
    "",
    "- insert / delete / upsert: **none**",
    "- update scope: **Schedule 1件 / Discography 1件 / Track 1件 only**",
    "- Storage upload: **none**",
    "- secrets logged: **none**",
    "",
    "## Next phases",
    "",
    "- Phase 3-P-H: cover image / Storage upload",
    "- Phase 3-R: deploy automation / GitHub Actions",
    "- Production deploy review after full CMS loop verified",
    "",
  );

  if (result.devServerOutputTail) {
    lines.push(
      "## Dev server output tail",
      "",
      "```text",
      result.devServerOutputTail,
      "```",
      "",
    );
  }

  if (result.errors.length > 0) {
    lines.push("## Errors", "", ...result.errors.map((err) => `- ${err}`), "");
  }

  lines.push("---", `Elapsed: ${elapsedMs}ms`, `Report: \`${reportPath}\``, "");

  return lines.join("\n");
}

/**
 * @param {string} astroDir
 * @param {{ passed: boolean, host: string, scheduleLegacyId: string, discographyLegacyId: string }} summary
 */
export function appendPhase3QToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## CMS minimal loop integration (Phase 3-Q)",
    "",
    `- **Schedule:** \`${summary.scheduleLegacyId}\``,
    `- **Discography:** \`${summary.discographyLegacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Flow:** Admin update → export → build → HTML → cleanup → re-export/rebuild`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## CMS minimal loop integration (Phase 3-Q)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
