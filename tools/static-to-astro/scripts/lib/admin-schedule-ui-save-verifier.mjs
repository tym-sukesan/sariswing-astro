/**
 * Admin schedule UI save verification (Phase 3-P-C).
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
import {
  EXPECTED_SCHEDULE_COUNT,
  fetchScheduleRow,
  countSchedules,
  postScheduleUpdate,
} from "./admin-schedule-update-verifier.mjs";

export const ADMIN_SCHEDULES_PAGE = "/admin/schedules/";

/**
 * @param {string} supabaseUrl
 */
export function supabaseStorageKey(supabaseUrl) {
  const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1];
  if (!ref) throw new Error("Cannot derive Supabase project ref from URL");
  return `sb-${ref}-auth-token`;
}

function recordsEqual(a, b) {
  if (!a || !b) return false;
  return a.title === b.title && a.venue === b.venue && a.published === b.published;
}

/**
 * @param {string} baseUrl
 */
export async function fetchAdminSchedulesPage(baseUrl) {
  const res = await fetch(new URL(ADMIN_SCHEDULES_PAGE, baseUrl));
  const html = await res.text();
  return { status: res.status, html };
}

/**
 * @param {{ baseUrl: string, env: object, email: string, legacyId: string, session: object, storageKey: string }} opts
 */
export async function runPlaywrightUiSave({
  baseUrl,
  env,
  email,
  legacyId,
  session,
  storageKey,
}) {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("dialog", (dialog) => dialog.accept());

  try {
    const pageUrl = new URL(ADMIN_SCHEDULES_PAGE, baseUrl).href;
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: storageKey, value: JSON.stringify(session) },
    );

    await page.reload({ waitUntil: "networkidle" });

    const saveBtn = page.locator("#save-schedule-btn");
    const saveStatus = page.locator("#save-status-text");

    await page.locator(`#schedule-table tbody tr[data-id="${legacyId}"]`).click();

    const original = await page.evaluate(() => ({
      title: document.querySelector('input[name="title"]')?.value ?? "",
      venue: document.querySelector('input[name="venue"]')?.value ?? "",
    }));

    const testTitle = `${original.title} [UI SAVE TEST]`;
    const testVenue = `${original.venue} [TEST]`;

    await page.locator('input[name="title"]').fill(testTitle);
    await page.locator('input[name="venue"]').fill(testVenue);

    await saveBtn.click();
    await page.waitForFunction(
      () => document.getElementById("save-status-text")?.textContent === "Saved",
      { timeout: 15000 },
    );

    const statusText = await saveStatus.textContent();

    return {
      ok: statusText === "Saved",
      statusText,
      testTitle,
      testVenue,
    };
  } finally {
    await browser.close();
  }
}

/**
 * @param {{ astroDir: string, env: object, email: string, legacyId: string, port?: number, skipBuild?: boolean, useBrowser?: boolean }} opts
 */
export async function runAdminScheduleUiSaveVerification({
  astroDir,
  env,
  email,
  legacyId,
  port = 4326,
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
  let baselineCount;

  try {
    original = await fetchScheduleRow(service, legacyId);
    if (!original) throw new Error(`Target schedule not found: ${legacyId}`);
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

    const pageRes = await fetchAdminSchedulesPage(baseUrl);
    result.pageCheck = {
      status: pageRes.status,
      ok: pageRes.status === 200,
    };
    result.saveButtonExists = pageRes.html.includes('id="save-schedule-btn"');
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

    if (useBrowser) {
      result.uiClickE2e = true;
      const uiResult = await runPlaywrightUiSave({
        baseUrl,
        env,
        email,
        legacyId,
        session,
        storageKey,
      });

      result.uiSave = {
        ok: uiResult.ok,
        statusText: uiResult.statusText,
        selectedLegacyId: legacyId,
      };

      const afterUiSave = await fetchScheduleRow(service, legacyId);
      if (
        !afterUiSave ||
        afterUiSave.title !== uiResult.testTitle ||
        afterUiSave.venue !== uiResult.testVenue
      ) {
        result.errors.push("Supabase record does not match UI save values");
        result.uiSave.ok = false;
      }
    } else {
      result.uiClickE2e = false;
      const testTitle = `${original.title ?? ""} [UI SAVE TEST]`;
      const testVenue = `${original.venue ?? ""} [TEST]`;
      const apiSave = await postScheduleUpdate(
        baseUrl,
        { legacy_id: legacyId, updates: { title: testTitle, venue: testVenue } },
        accessToken,
      );
      result.uiSave = {
        ok: apiSave.status === 200 && apiSave.json.ok === true,
        mode: "api-fallback (--no-browser)",
        status: apiSave.status,
      };
    }

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
      ok: restore.status === 200 && restore.json.ok === true && recordsEqual(afterRestore, original),
      status: restore.status,
    };

    result.finalRecordEqualsOriginal = recordsEqual(afterRestore, original);
    result.finalCounts = { schedules: await countSchedules(service) };
    result.countsUnchanged = result.finalCounts.schedules === baselineCount;

    const secrets = [env.serviceRoleKey, env.adminPassword, accessToken, refreshToken].filter(
      Boolean,
    );
    const hits = scanDirForSecrets(path.join(astroDir, "dist"), secrets);
    result.keyLeakScan = { ok: hits.length === 0, hitCount: hits.length };

    if (!result.cleanupRestore.ok || !result.finalRecordEqualsOriginal) {
      result.errors.push("Cleanup restore failed — schedule not restored");
    }

    result.passed =
      result.build.ok &&
      result.pageCheck.ok &&
      result.uiSaveAvailability &&
      result.uiSave?.ok &&
      result.cleanupRestore.ok &&
      result.finalRecordEqualsOriginal === true &&
      result.countsUnchanged === true &&
      result.keyLeakScan.ok;

    return result;
  } catch (err) {
    result.errors.push(err.message);
    try {
      await postScheduleUpdate(
        baseUrl,
        {
          legacy_id: legacyId,
          updates: {
            title: original.title,
            venue: original.venue,
            published: original.published,
          },
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
export function formatAdminScheduleUiSaveReport({ reportPath, result, elapsedMs }) {
  const lines = [
    "# ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "Mode: **verify**",
    `Supabase host: \`${result.host}\``,
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
      "",
    );
  }

  if (result.pageCheck) {
    lines.push(
      "## Admin schedule page",
      "",
      `- \`${ADMIN_SCHEDULES_PAGE}\` HTTP status: ${result.pageCheck.status}`,
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
      "",
    );
  }

  if (result.finalCounts) {
    lines.push(
      "## Final counts",
      "",
      `- schedules: ${result.finalCounts.schedules} (expected ${EXPECTED_SCHEDULE_COUNT})`,
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
    "- UI save fields: title, venue, published only",
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
    "- Phase 3-P-D: Discography update API + UI save",
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
export function appendPhase3PCToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin schedule UI save (Phase 3-P-C)",
    "",
    `- **Target:** \`${summary.legacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Scope:** selected row only; title/venue/published`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin schedule UI save (Phase 3-P-C)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
