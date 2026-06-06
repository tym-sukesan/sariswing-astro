/**
 * Admin discography tracks UI save verification (Phase 3-P-G).
 */

import fs from "node:fs";
import path from "node:path";
import {
  runAstroBuild,
  scanDirForSecrets,
  signInAdminUser,
  startAstroDev,
  waitForDevServer,
} from "./admin-api-auth-verifier.mjs";
import { EXPECTED_BASELINE_COUNTS } from "./anon-rls-verifier.mjs";
import {
  ADMIN_DISCOGRAPHY_PAGE,
  countDiscography,
  countDiscographyTracks,
  discographyRecordsEqual,
  fetchDiscographyRow,
  fetchDiscographyTracks,
  supabaseStorageKey,
  tracksEqual,
} from "./admin-discography-ui-save-verifier.mjs";

export const DISCOGRAPHY_TRACKS_UPDATE_ENDPOINT = "/api/admin/discography/tracks/update.json";

export const TRACK_SAVE_FIELDS = ["title", "sort_order"];

export const TRACK_UPDATE_FORBIDDEN = [
  "id",
  "created_at",
  "discography_legacy_id",
  "track_number change",
  "insert",
  "delete",
  "upsert",
];

/**
 * @param {string} baseUrl
 */
export async function fetchAdminDiscographyPage(baseUrl) {
  const res = await fetch(new URL(ADMIN_DISCOGRAPHY_PAGE, baseUrl));
  const html = await res.text();
  return { status: res.status, html };
}

/**
 * @param {string} baseUrl
 * @param {{ discography_legacy_id: string, tracks: object[] }} body
 * @param {string | null} token
 */
export async function postDiscographyTracksUpdate(baseUrl, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(new URL(DISCOGRAPHY_TRACKS_UPDATE_ENDPOINT, baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${DISCOGRAPHY_TRACKS_UPDATE_ENDPOINT}: ${text.slice(0, 160)}`);
  }

  return { status: res.status, json };
}

/**
 * @param {Array<object>} originalTracks
 * @param {number} [count]
 */
export function buildTracksTestUpdates(originalTracks, count = 2) {
  return originalTracks.slice(0, count).map((track) => {
    const baseSort = track.sort_order == null ? track.track_number : Number(track.sort_order);
    return {
      track_number: track.track_number,
      title: `${track.title} [TRACK UI TEST]`,
      sort_order: baseSort + 1000,
    };
  });
}

/**
 * @param {Array<object>} originalTracks
 */
export function buildTracksRestorePayload(originalTracks) {
  return originalTracks.map((track) => ({
    track_number: track.track_number,
    title: track.title,
    sort_order: track.sort_order,
  }));
}

/**
 * @param {Array<object>} originalTracks
 * @param {Array<object>} testUpdates
 */
export function expectedTracksAfterUpdate(originalTracks, testUpdates) {
  const byNumber = new Map(testUpdates.map((t) => [Number(t.track_number), t]));
  return originalTracks.map((track) => {
    const update = byNumber.get(Number(track.track_number));
    if (!update) return { ...track };
    return {
      ...track,
      title: update.title,
      sort_order: update.sort_order,
    };
  });
}

/**
 * Build full tracks payload for UI save (all existing tracks with test updates merged).
 * @param {Array<object>} originalTracks
 * @param {Array<object>} testUpdates
 */
export function buildFullTracksPayload(originalTracks, testUpdates) {
  const expected = expectedTracksAfterUpdate(originalTracks, testUpdates);
  return expected.map((track) => ({
    track_number: track.track_number,
    title: track.title,
    sort_order: track.sort_order,
  }));
}

/**
 * @param {{ baseUrl: string, legacyId: string, session: object, storageKey: string, testUpdates: object[] }} opts
 */
export async function runPlaywrightTracksUiSave({
  baseUrl,
  legacyId,
  session,
  storageKey,
  testUpdates,
}) {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("dialog", (dialog) => dialog.accept());

  try {
    const pageUrl = new URL(ADMIN_DISCOGRAPHY_PAGE, baseUrl).href;
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: storageKey, value: JSON.stringify(session) },
    );

    await page.reload({ waitUntil: "networkidle" });

    await page.locator(`.admin-disc-item[data-id="${legacyId}"]`).click();

    await page.waitForFunction(
      () => !document.getElementById("save-tracks-btn")?.disabled,
      { timeout: 10000 },
    );

    for (const update of testUpdates) {
      const row = page.locator(
        `.admin-track-row[data-track-number="${update.track_number}"]`,
      );
      await row.locator(".track-title-input").fill(String(update.title ?? ""));
      await row.locator(".track-sort-input").fill(String(update.sort_order ?? ""));
    }

    await page.locator("#save-tracks-btn").click();
    await page.waitForFunction(
      () => {
        const text = document.getElementById("tracks-save-status-text")?.textContent ?? "";
        return text === "Saved" || text.startsWith("Error:");
      },
      { timeout: 15000 },
    );

    const statusText = await page.locator("#tracks-save-status-text").textContent();

    return {
      ok: statusText === "Saved",
      statusText,
      testUpdates,
    };
  } finally {
    await browser.close();
  }
}

/**
 * @param {{ astroDir: string, env: object, email: string, legacyId: string, port?: number, skipBuild?: boolean, useBrowser?: boolean }} opts
 */
export async function runAdminDiscographyTracksUiSaveVerification({
  astroDir,
  env,
  email,
  legacyId,
  port = 4328,
  skipBuild = false,
  useBrowser = true,
}) {
  const result = {
    host: env.host,
    legacyId,
    email,
    build: null,
    pageCheck: null,
    tracksSaveAvailability: null,
    tracksSaveButtonExists: false,
    tracksSaveStatusUiExists: false,
    tracksUiSave: null,
    uiClickE2e: false,
    cleanupRestore: null,
    finalTracksEqualOriginal: null,
    discographyUnchanged: null,
    finalCounts: null,
    countsUnchanged: null,
    keyLeakScan: null,
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

  let originalDiscography;
  let originalTracks;
  let baselineDiscographyCount;
  let baselineTracksCount;
  let testUpdates;

  try {
    originalDiscography = await fetchDiscographyRow(service, legacyId);
    if (!originalDiscography) throw new Error(`Target discography not found: ${legacyId}`);
    originalTracks = await fetchDiscographyTracks(service, legacyId);
    if (!originalTracks.length) throw new Error(`No tracks found for: ${legacyId}`);
    baselineDiscographyCount = await countDiscography(service);
    baselineTracksCount = await countDiscographyTracks(service);
    testUpdates = buildTracksTestUpdates(originalTracks, 2);
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

    const pageRes = await fetchAdminDiscographyPage(baseUrl);
    result.pageCheck = {
      status: pageRes.status,
      ok: pageRes.status === 200,
    };
    result.tracksSaveButtonExists = pageRes.html.includes('id="save-tracks-btn"');
    result.tracksSaveStatusUiExists =
      pageRes.html.includes('id="tracks-save-status"') &&
      pageRes.html.includes('id="tracks-save-status-text"');
    result.tracksSaveAvailability =
      result.tracksSaveButtonExists && result.tracksSaveStatusUiExists;

    const { accessToken, refreshToken, client } = await signInAdminUser({
      supabaseUrl: env.supabaseUrl,
      anonKey: env.anonKey,
      email,
      password: env.adminPassword,
    });

    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData.session;
    if (!session?.access_token) {
      throw new Error("signInWithPassword: no session for UI test");
    }

    const storageKey = supabaseStorageKey(env.supabaseUrl);
    const expectedAfterSave = expectedTracksAfterUpdate(originalTracks, testUpdates);
    const fullPayload = buildFullTracksPayload(originalTracks, testUpdates);

    if (useBrowser) {
      result.uiClickE2e = true;
      const uiResult = await runPlaywrightTracksUiSave({
        baseUrl,
        legacyId,
        session,
        storageKey,
        testUpdates,
      });

      result.tracksUiSave = {
        ok: uiResult.ok,
        statusText: uiResult.statusText,
        selectedLegacyId: legacyId,
        updatedTrackNumbers: testUpdates.map((t) => t.track_number),
      };

      const afterUiSaveTracks = await fetchDiscographyTracks(service, legacyId);
      const afterUiSaveDiscography = await fetchDiscographyRow(service, legacyId);

      if (!tracksEqual(afterUiSaveTracks, expectedAfterSave)) {
        result.errors.push("Supabase tracks do not match UI save values");
        result.tracksUiSave.ok = false;
      }
      if (!discographyRecordsEqual(afterUiSaveDiscography, originalDiscography)) {
        result.errors.push("Discography record changed during tracks UI save");
        result.tracksUiSave.ok = false;
      }
    } else {
      result.uiClickE2e = false;
      const apiSave = await postDiscographyTracksUpdate(
        baseUrl,
        { discography_legacy_id: legacyId, tracks: fullPayload },
        accessToken,
      );
      const afterApiSaveTracks = await fetchDiscographyTracks(service, legacyId);
      const afterApiSaveDiscography = await fetchDiscographyRow(service, legacyId);
      const saveOk =
        apiSave.status === 200 &&
        apiSave.json.ok === true &&
        tracksEqual(afterApiSaveTracks, expectedAfterSave) &&
        discographyRecordsEqual(afterApiSaveDiscography, originalDiscography);

      result.tracksUiSave = {
        ok: saveOk,
        mode: "api-fallback (--no-browser)",
        status: apiSave.status,
        updatedTrackNumbers: testUpdates.map((t) => t.track_number),
      };
    }

    const restore = await postDiscographyTracksUpdate(
      baseUrl,
      {
        discography_legacy_id: legacyId,
        tracks: buildTracksRestorePayload(originalTracks),
      },
      accessToken,
    );

    const afterRestoreTracks = await fetchDiscographyTracks(service, legacyId);
    const afterRestoreDiscography = await fetchDiscographyRow(service, legacyId);

    result.cleanupRestore = {
      ok: restore.status === 200 && restore.json.ok === true && tracksEqual(afterRestoreTracks, originalTracks),
      status: restore.status,
    };

    result.finalTracksEqualOriginal = tracksEqual(afterRestoreTracks, originalTracks);
    result.discographyUnchanged = discographyRecordsEqual(afterRestoreDiscography, originalDiscography);
    result.finalCounts = {
      discography: await countDiscography(service),
      discography_tracks: await countDiscographyTracks(service),
    };
    result.countsUnchanged =
      result.finalCounts.discography === baselineDiscographyCount &&
      result.finalCounts.discography_tracks === baselineTracksCount;

    const secrets = [env.serviceRoleKey, env.adminPassword, accessToken, refreshToken].filter(
      Boolean,
    );
    const hits = scanDirForSecrets(path.join(astroDir, "dist"), secrets);
    result.keyLeakScan = { ok: hits.length === 0, hitCount: hits.length };

    if (!result.cleanupRestore.ok || !result.finalTracksEqualOriginal) {
      result.errors.push("Cleanup restore failed — tracks not restored");
    }
    if (!result.discographyUnchanged) {
      result.errors.push("Discography record changed after verification");
    }

    result.passed =
      result.build.ok &&
      result.pageCheck.ok &&
      result.tracksSaveAvailability &&
      result.tracksUiSave?.ok &&
      result.cleanupRestore.ok &&
      result.finalTracksEqualOriginal === true &&
      result.discographyUnchanged === true &&
      result.countsUnchanged === true &&
      result.keyLeakScan.ok;

    return result;
  } catch (err) {
    result.errors.push(err.message);
    try {
      await postDiscographyTracksUpdate(
        baseUrl,
        {
          discography_legacy_id: legacyId,
          tracks: buildTracksRestorePayload(originalTracks),
        },
        (
          await signInAdminUser({
            supabaseUrl: env.supabaseUrl,
            anonKey: env.anonKey,
            email,
            password: env.adminPassword,
          })
        ).accessToken,
      );
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
export function formatAdminDiscographyTracksUiSaveReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ADMIN_DISCOGRAPHY_TRACKS_UI_SAVE_VERIFY_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "Mode: **verify (Phase 3-P-G)**",
    `Supabase host: \`${result.host}\``,
    `Target discography_legacy_id: \`${result.legacyId}\``,
    `Admin email: \`${result.email}\``,
    "Secrets: *(not logged)*",
    "",
    "## Phase",
    "",
    "Phase **3-P-G**: Discography tracks update API + Admin UI save (existing tracks only).",
    "",
    "## Allowed track update fields",
    "",
    ...TRACK_SAVE_FIELDS.map((field) => `- \`${field}\``),
    "",
    "## Forbidden",
    "",
    ...TRACK_UPDATE_FORBIDDEN.map((item) => `- ${item}`),
    "",
  ];

  if (result.build) {
    lines.push(
      "## Build",
      "",
      `- Success: ${result.build.ok ? "yes" : "no"}`,
      `- Skipped: ${result.build.skipped ? "yes" : "no"}`,
      "",
    );
  }

  if (result.pageCheck) {
    lines.push(
      "## Admin discography page",
      "",
      `- \`${ADMIN_DISCOGRAPHY_PAGE}\` HTTP status: ${result.pageCheck.status}`,
      `- Tracks save button exists: ${result.tracksSaveButtonExists ? "yes" : "no"}`,
      `- Tracks save status UI exists: ${result.tracksSaveStatusUiExists ? "yes" : "no"}`,
      `- UI save availability: ${result.tracksSaveAvailability ? "yes" : "no"}`,
      "",
    );
  }

  if (result.tracksUiSave) {
    lines.push(
      "## Tracks UI save",
      "",
      `- UI click E2E: ${result.uiClickE2e ? "yes (Playwright)" : "no (--no-browser / API fallback)"}`,
      `- Selected discography_legacy_id: \`${result.legacyId}\``,
      `- Updated track_numbers: ${(result.tracksUiSave.updatedTrackNumbers ?? []).join(", ") || "n/a"}`,
      `- Result: ${result.tracksUiSave.ok ? "success" : "failed"}`,
    );
    if (result.tracksUiSave.statusText) {
      lines.push(`- Save status text: \`${result.tracksUiSave.statusText}\``);
    }
    if (result.tracksUiSave.mode) {
      lines.push(`- Mode: ${result.tracksUiSave.mode}`);
    }
    lines.push("");
  }

  if (result.cleanupRestore) {
    lines.push(
      "## Cleanup restore",
      "",
      `- OK: ${result.cleanupRestore.ok ? "yes" : "no"}`,
      `- Final tracks equal original: ${result.finalTracksEqualOriginal ? "yes" : "no"}`,
      `- Discography record unchanged: ${result.discographyUnchanged ? "yes" : "no"}`,
      "",
    );
  }

  if (result.finalCounts) {
    lines.push(
      "## Final counts",
      "",
      `- discography: ${result.finalCounts.discography} (expected ${EXPECTED_BASELINE_COUNTS.discography})`,
      `- discography_tracks: ${result.finalCounts.discography_tracks} (expected ${EXPECTED_BASELINE_COUNTS.discography_tracks})`,
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
    "- track add / delete: **none**",
    "- track_number change: **none**",
    "- discography body update: **none** (during tracks test)",
    "- update scope: **existing tracks by discography_legacy_id + track_number only**",
    "- tokens / keys / passwords: **not logged or displayed**",
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
    "- Phase 3-P-H: cover image / Storage upload",
    "- Phase 3-P-I: track add / delete (future)",
    "- Phase 3-Q: Production deploy review",
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
 * @param {{ passed: boolean, host: string, legacyId: string }} summary
 */
export function appendPhase3PGToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin discography tracks UI save (Phase 3-P-G)",
    "",
    `- **Target:** \`${summary.legacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Scope:** existing tracks only; title/sort_order; no add/delete`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_DISCOGRAPHY_TRACKS_UI_SAVE_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin discography tracks UI save (Phase 3-P-G)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
