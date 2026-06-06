/**
 * Admin discography UI save verification (Phase 3-P-F).
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

export const DISCOGRAPHY_UPDATE_ENDPOINT = "/api/admin/discography/update.json";
export const ADMIN_DISCOGRAPHY_PAGE = "/admin/discography/";

export const DISCOGRAPHY_SAVE_FIELDS = [
  "title",
  "artist",
  "release_date",
  "year",
  "label",
  "catalog_number",
  "description",
  "purchase_url",
  "streaming_url",
  "published",
  "sort_order",
];

export const DISCOGRAPHY_SAVE_ALLOWED_FIELDS = [...DISCOGRAPHY_SAVE_FIELDS];

export const DISCOGRAPHY_SAVE_FORBIDDEN_FIELDS = [
  "id",
  "legacy_id",
  "created_at",
  "updated_at",
  "source_file",
  "source_route",
  "cover_image_url",
  "tracks",
];

const RECORD_SELECT =
  "legacy_id,title,artist,release_date,year,label,catalog_number,description,purchase_url,streaming_url,sort_order,published";

const TRACKS_SELECT = "discography_legacy_id,track_number,title,sort_order";

/**
 * @param {string} supabaseUrl
 */
export function supabaseStorageKey(supabaseUrl) {
  const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1];
  if (!ref) throw new Error("Cannot derive Supabase project ref from URL");
  return `sb-${ref}-auth-token`;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function fetchDiscographyRow(service, legacyId) {
  const { data, error } = await service
    .from("discography")
    .select(RECORD_SELECT)
    .eq("legacy_id", legacyId)
    .maybeSingle();
  if (error) throw new Error(`fetch discography: ${error.message}`);
  return data;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function fetchDiscographyTracks(service, legacyId) {
  const { data, error } = await service
    .from("discography_tracks")
    .select(TRACKS_SELECT)
    .eq("discography_legacy_id", legacyId)
    .order("track_number", { ascending: true });
  if (error) throw new Error(`fetch discography_tracks: ${error.message}`);
  return data ?? [];
}

export function discographyRecordsEqual(a, b) {
  if (!a || !b) return false;
  for (const field of DISCOGRAPHY_SAVE_FIELDS) {
    const left = a[field];
    const right = b[field];
    if (field === "published") {
      if (Boolean(left) !== Boolean(right)) return false;
      continue;
    }
    if (field === "year" || field === "sort_order") {
      const ln = left == null || left === "" ? null : Number(left);
      const rn = right == null || right === "" ? null : Number(right);
      if (ln !== rn) return false;
      continue;
    }
    if ((left ?? null) !== (right ?? null)) return false;
  }
  return true;
}

export function tracksEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.discography_legacy_id !== right.discography_legacy_id ||
      Number(left.track_number) !== Number(right.track_number) ||
      (left.title ?? null) !== (right.title ?? null) ||
      Number(left.sort_order ?? 0) !== Number(right.sort_order ?? 0)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function countDiscography(service) {
  const { count, error } = await service.from("discography").select("*", { count: "exact", head: true });
  if (error) throw new Error(`count discography: ${error.message}`);
  return count ?? 0;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} service
 */
export async function countDiscographyTracks(service) {
  const { count, error } = await service
    .from("discography_tracks")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count discography_tracks: ${error.message}`);
  return count ?? 0;
}

/**
 * @param {string} baseUrl
 * @param {{ legacy_id: string, updates: object }} body
 * @param {string | null} token
 */
export async function postDiscographyUpdate(baseUrl, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(new URL(DISCOGRAPHY_UPDATE_ENDPOINT, baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${DISCOGRAPHY_UPDATE_ENDPOINT}: ${text.slice(0, 160)}`);
  }

  return { status: res.status, json };
}

export function buildDiscographyTestUpdates(original) {
  const baseSort = original.sort_order == null ? 0 : Number(original.sort_order);
  return {
    title: `${original.title ?? ""} [UI SAVE TEST]`,
    artist: `${original.artist ?? ""} [TEST]`,
    description: "Discography UI save test description",
    purchase_url: original.purchase_url || "https://example.com/test",
    streaming_url: original.streaming_url || "https://example.com/streaming-test",
    published: original.published,
    sort_order: baseSort + 1000,
    release_date: original.release_date,
    year: original.year,
    label: original.label,
    catalog_number: original.catalog_number,
  };
}

export function buildDiscographyRestoreUpdates(original) {
  return {
    title: original.title,
    artist: original.artist,
    release_date: original.release_date,
    year: original.year,
    label: original.label,
    catalog_number: original.catalog_number,
    description: original.description,
    purchase_url: original.purchase_url,
    streaming_url: original.streaming_url,
    published: original.published,
    sort_order: original.sort_order,
  };
}

/**
 * @param {string} baseUrl
 */
export async function fetchAdminDiscographyPage(baseUrl) {
  const res = await fetch(new URL(ADMIN_DISCOGRAPHY_PAGE, baseUrl));
  const html = await res.text();
  return { status: res.status, html };
}

/**
 * @param {{ baseUrl: string, legacyId: string, session: object, storageKey: string, testUpdates: object }} opts
 */
export async function runPlaywrightDiscographyUiSave({
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

    const saveBtn = page.locator("#save-disc-btn");
    const saveStatus = page.locator("#save-status-text");

    await page.locator(`.admin-disc-item[data-id="${legacyId}"]`).click();

    await page.locator('input[name="title"]').fill(String(testUpdates.title ?? ""));
    await page.locator('input[name="artist"]').fill(String(testUpdates.artist ?? ""));
    await page.locator('textarea[name="description"]').fill(String(testUpdates.description ?? ""));
    await page.locator('input[name="purchase_url"]').fill(String(testUpdates.purchase_url ?? ""));
    await page.locator('input[name="streaming_url"]').fill(String(testUpdates.streaming_url ?? ""));
    await page.locator('input[name="published"]').setChecked(Boolean(testUpdates.published));

    if (testUpdates.sort_order == null || testUpdates.sort_order === "") {
      await page.locator('input[name="sort_order"]').fill("");
    } else {
      await page.locator('input[name="sort_order"]').fill(String(testUpdates.sort_order));
    }

    await saveBtn.click();
    await page.waitForFunction(
      () => document.getElementById("save-status-text")?.textContent === "Saved",
      { timeout: 15000 },
    );

    const statusText = await saveStatus.textContent();

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
export async function runAdminDiscographyUiSaveVerification({
  astroDir,
  env,
  email,
  legacyId,
  port = 4327,
  skipBuild = false,
  useBrowser = true,
}) {
  const result = {
    host: env.host,
    legacyId,
    email,
    build: null,
    pageCheck: null,
    uiSaveAvailability: null,
    saveButtonExists: false,
    saveStatusUiExists: false,
    uiSave: null,
    uiClickE2e: false,
    cleanupRestore: null,
    finalRecordEqualsOriginal: null,
    finalCounts: null,
    countsUnchanged: null,
    tracksUnchanged: null,
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

  let original;
  let baselineTracks;
  let baselineDiscographyCount;
  let baselineTracksCount;
  const testUpdates = {};

  try {
    original = await fetchDiscographyRow(service, legacyId);
    if (!original) throw new Error(`Target discography not found: ${legacyId}`);
    baselineTracks = await fetchDiscographyTracks(service, legacyId);
    baselineDiscographyCount = await countDiscography(service);
    baselineTracksCount = await countDiscographyTracks(service);
    Object.assign(testUpdates, buildDiscographyTestUpdates(original));
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
    result.saveButtonExists = pageRes.html.includes('id="save-disc-btn"');
    result.saveStatusUiExists =
      pageRes.html.includes('id="save-status"') &&
      pageRes.html.includes('id="save-status-text"');
    result.uiSaveAvailability = result.saveButtonExists && result.saveStatusUiExists;

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
    const expectedAfterSave = { ...original, ...testUpdates };

    if (useBrowser) {
      result.uiClickE2e = true;
      const uiResult = await runPlaywrightDiscographyUiSave({
        baseUrl,
        legacyId,
        session,
        storageKey,
        testUpdates,
      });

      result.uiSave = {
        ok: uiResult.ok,
        statusText: uiResult.statusText,
        selectedLegacyId: legacyId,
      };

      const afterUiSave = await fetchDiscographyRow(service, legacyId);
      if (!afterUiSave || !discographyRecordsEqual(afterUiSave, expectedAfterSave)) {
        result.errors.push("Supabase record does not match UI save values");
        result.uiSave.ok = false;
      }
    } else {
      result.uiClickE2e = false;
      const apiSave = await postDiscographyUpdate(
        baseUrl,
        { legacy_id: legacyId, updates: testUpdates },
        accessToken,
      );
      const afterApiSave = await fetchDiscographyRow(service, legacyId);
      const saveOk =
        apiSave.status === 200 &&
        apiSave.json.ok === true &&
        discographyRecordsEqual(afterApiSave, expectedAfterSave);

      result.uiSave = {
        ok: saveOk,
        mode: "api-fallback (--no-browser)",
        status: apiSave.status,
      };
    }

    const restore = await postDiscographyUpdate(
      baseUrl,
      {
        legacy_id: legacyId,
        updates: buildDiscographyRestoreUpdates(original),
      },
      accessToken,
    );

    const afterRestore = await fetchDiscographyRow(service, legacyId);
    const afterRestoreTracks = await fetchDiscographyTracks(service, legacyId);

    result.cleanupRestore = {
      ok:
        restore.status === 200 &&
        restore.json.ok === true &&
        discographyRecordsEqual(afterRestore, original),
      status: restore.status,
    };

    result.finalRecordEqualsOriginal = discographyRecordsEqual(afterRestore, original);
    result.tracksUnchanged = tracksEqual(afterRestoreTracks, baselineTracks);
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

    if (!result.cleanupRestore.ok || !result.finalRecordEqualsOriginal) {
      result.errors.push("Cleanup restore failed — discography not restored");
    }
    if (!result.tracksUnchanged) {
      result.errors.push("discography_tracks changed during verification");
    }

    result.passed =
      result.build.ok &&
      result.pageCheck.ok &&
      result.uiSaveAvailability &&
      result.uiSave?.ok &&
      result.cleanupRestore.ok &&
      result.finalRecordEqualsOriginal === true &&
      result.countsUnchanged === true &&
      result.tracksUnchanged === true &&
      result.keyLeakScan.ok;

    return result;
  } catch (err) {
    result.errors.push(err.message);
    try {
      await postDiscographyUpdate(
        baseUrl,
        {
          legacy_id: legacyId,
          updates: buildDiscographyRestoreUpdates(original),
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
export function formatAdminDiscographyUiSaveReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ADMIN_DISCOGRAPHY_UI_SAVE_VERIFY_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "Mode: **verify (Phase 3-P-F)**",
    `Supabase host: \`${result.host}\``,
    `Target legacy_id: \`${result.legacyId}\``,
    `Admin email: \`${result.email}\``,
    "Secrets: *(not logged)*",
    "",
    "## Phase",
    "",
    "Phase **3-P-F**: Discography 1件 update API + Admin UI save.",
    "",
    "## Allowed save fields",
    "",
    ...DISCOGRAPHY_SAVE_ALLOWED_FIELDS.map((field) => `- \`${field}\``),
    "",
    "## Forbidden save fields",
    "",
    ...DISCOGRAPHY_SAVE_FORBIDDEN_FIELDS.map((field) => `- \`${field}\``),
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
      `- Save button exists: ${result.saveButtonExists ? "yes" : "no"}`,
      `- Save status UI exists: ${result.saveStatusUiExists ? "yes" : "no"}`,
      `- UI save availability: ${result.uiSaveAvailability ? "yes" : "no"}`,
      "",
    );
  }

  if (result.uiSave) {
    lines.push(
      "## Admin UI save",
      "",
      `- UI click E2E: ${result.uiClickE2e ? "yes (Playwright)" : "no (--no-browser / API fallback)"}`,
      `- Selected legacy_id: \`${result.legacyId}\``,
      `- Result: ${result.uiSave.ok ? "success" : "failed"}`,
    );
    if (result.uiSave.statusText) {
      lines.push(`- Save status text: \`${result.uiSave.statusText}\``);
    }
    if (result.uiSave.mode) {
      lines.push(`- Mode: ${result.uiSave.mode}`);
    }
    lines.push("");
  }

  if (result.cleanupRestore) {
    lines.push(
      "## Cleanup restore",
      "",
      `- OK: ${result.cleanupRestore.ok ? "yes" : "no"}`,
      `- Final record equals original: ${result.finalRecordEqualsOriginal ? "yes" : "no"}`,
      `- Tracks unchanged: ${result.tracksUnchanged ? "yes" : "no"}`,
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
    "- update scope: **single discography row by legacy_id only**",
    "- discography_tracks: **untouched**",
    "- tracks field in request: **forbidden**",
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
    "- Phase 3-P-G: Discography tracks update API + UI",
    "- Phase 3-P-H: cover image / Storage upload",
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
export function appendPhase3PFToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin discography UI save (Phase 3-P-F)",
    "",
    `- **Target:** \`${summary.legacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Scope:** selected row only; discography body fields (tracks read-only)`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_DISCOGRAPHY_UI_SAVE_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin discography UI save (Phase 3-P-F)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
