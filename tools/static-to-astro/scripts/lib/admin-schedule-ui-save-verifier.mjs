/**
 * Admin schedule UI save verification (Phase 3-P-C / 3-P-D / 3-P-E).
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
  HOME_FEATURED_LIMIT,
  SCHEDULE_SAVE_FIELDS,
  countHomeFeaturedSchedules,
  fetchScheduleRow,
  findNonHomeFeaturedLegacyId,
  countSchedules,
  postScheduleUpdate,
  scheduleRecordsEqual,
} from "./admin-schedule-update-verifier.mjs";

export const ADMIN_SCHEDULES_PAGE = "/admin/schedules/";

export const SCHEDULE_SAVE_ALLOWED_FIELDS = [...SCHEDULE_SAVE_FIELDS];

export const SCHEDULE_SAVE_FORBIDDEN_FIELDS = [
  "id",
  "legacy_id",
  "date",
  "year",
  "month",
  "created_at",
  "updated_at",
  "source_file",
  "source_route",
  "image_url",
  "home_image_url",
];

/**
 * @param {string} supabaseUrl
 */
export function supabaseStorageKey(supabaseUrl) {
  const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1];
  if (!ref) throw new Error("Cannot derive Supabase project ref from URL");
  return `sb-${ref}-auth-token`;
}

export function buildExpandedTestUpdates(original) {
  return {
    title: `${original.title ?? ""} [UI SAVE TEST]`,
    venue: `${original.venue ?? ""} [TEST]`,
    open_time: "18:00",
    start_time: "19:00",
    price: "Test Charge 9999",
    description: "UI save test description",
    show_on_home: false,
    home_order: 99,
    published: original.published,
  };
}

export function buildExpandedRestoreUpdates(original) {
  return {
    title: original.title,
    venue: original.venue,
    open_time: original.open_time,
    start_time: original.start_time,
    price: original.price,
    description: original.description,
    show_on_home: original.show_on_home,
    home_order: original.home_order,
    published: original.published,
  };
}

/**
 * Attempt to feature a 4th schedule on home; expect API rejection.
 * @param {{ baseUrl: string, service: import('@supabase/supabase-js').SupabaseClient, accessToken: string, excludeLegacyId: string }} opts
 */
export async function runHomeFeaturedLimitValidation({
  baseUrl,
  service,
  accessToken,
  excludeLegacyId,
}) {
  const baselineHomeCount = await countHomeFeaturedSchedules(service);
  const atLimit = baselineHomeCount === HOME_FEATURED_LIMIT;

  const candidateLegacyId = await findNonHomeFeaturedLegacyId(service, excludeLegacyId);
  if (!atLimit) {
    return {
      ok: false,
      mode: "api",
      baselineHomeCount,
      expectedHomeCount: HOME_FEATURED_LIMIT,
      atLimit,
      candidateLegacyId,
      rejected: false,
      recordUnchanged: false,
      finalHomeCount: baselineHomeCount,
      error: `Expected ${HOME_FEATURED_LIMIT} home featured schedules, found ${baselineHomeCount}`,
    };
  }
  if (!candidateLegacyId) {
    return {
      ok: false,
      mode: "api",
      baselineHomeCount,
      expectedHomeCount: HOME_FEATURED_LIMIT,
      atLimit,
      candidateLegacyId: null,
      rejected: false,
      recordUnchanged: false,
      finalHomeCount: baselineHomeCount,
      error: "No published schedule with show_on_home=false found for limit test",
    };
  }

  const beforeAttempt = await fetchScheduleRow(service, candidateLegacyId);
  const attempt = await postScheduleUpdate(
    baseUrl,
    { legacy_id: candidateLegacyId, updates: { show_on_home: true } },
    accessToken,
  );
  const afterAttempt = await fetchScheduleRow(service, candidateLegacyId);
  const finalHomeCount = await countHomeFeaturedSchedules(service);

  const rejected =
    attempt.status === 400 &&
    attempt.json?.ok === false &&
    attempt.json?.error === "home_featured_limit_exceeded";
  const recordUnchanged = scheduleRecordsEqual(beforeAttempt, afterAttempt);

  return {
    ok: rejected && recordUnchanged && finalHomeCount === HOME_FEATURED_LIMIT,
    mode: "api",
    baselineHomeCount,
    expectedHomeCount: HOME_FEATURED_LIMIT,
    atLimit,
    candidateLegacyId,
    rejected,
    rejectionStatus: attempt.status,
    rejectionError: attempt.json?.error ?? null,
    recordUnchanged,
    finalHomeCount,
  };
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
 * @param {{ baseUrl: string, legacyId: string, session: object, storageKey: string, testUpdates: object }} opts
 */
export async function runPlaywrightUiSave({
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

    await page.locator('input[name="title"]').fill(String(testUpdates.title ?? ""));
    await page.locator('input[name="venue"]').fill(String(testUpdates.venue ?? ""));
    await page.locator('input[name="open_time"]').fill(String(testUpdates.open_time ?? ""));
    await page.locator('input[name="start_time"]').fill(String(testUpdates.start_time ?? ""));
    await page.locator('input[name="price"]').fill(String(testUpdates.price ?? ""));
    await page.locator('textarea[name="description"]').fill(String(testUpdates.description ?? ""));
    await page.locator('input[name="show_on_home"]').setChecked(Boolean(testUpdates.show_on_home));
    await page.locator('input[name="published"]').setChecked(Boolean(testUpdates.published));

    if (testUpdates.home_order == null || testUpdates.home_order === "") {
      await page.locator('input[name="home_order"]').fill("");
    } else {
      await page.locator('input[name="home_order"]').fill(String(testUpdates.home_order));
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
    expandedFieldsUpdate: null,
    homeFeaturedLimitValidation: null,
    homeFeaturedDisplayExists: false,
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
  const testUpdates = {};

  try {
    original = await fetchScheduleRow(service, legacyId);
    if (!original) throw new Error(`Target schedule not found: ${legacyId}`);
    baselineCount = await countSchedules(service);
    Object.assign(testUpdates, buildExpandedTestUpdates(original));
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
    result.homeFeaturedDisplayExists =
      pageRes.html.includes('id="home-featured-count"') &&
      pageRes.html.includes(` / ${HOME_FEATURED_LIMIT}`);

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
      const uiResult = await runPlaywrightUiSave({
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

      const afterUiSave = await fetchScheduleRow(service, legacyId);
      const expandedOk = Boolean(afterUiSave) && scheduleRecordsEqual(afterUiSave, expectedAfterSave);
      result.expandedFieldsUpdate = {
        ok: expandedOk,
        fields: SCHEDULE_SAVE_FIELDS,
        testUpdates,
      };

      if (!expandedOk) {
        result.errors.push("Supabase record does not match expanded UI save values");
        result.uiSave.ok = false;
      }
    } else {
      result.uiClickE2e = false;
      const apiSave = await postScheduleUpdate(
        baseUrl,
        { legacy_id: legacyId, updates: testUpdates },
        accessToken,
      );
      const afterApiSave = await fetchScheduleRow(service, legacyId);
      const expandedOk =
        apiSave.status === 200 &&
        apiSave.json.ok === true &&
        scheduleRecordsEqual(afterApiSave, expectedAfterSave);

      result.uiSave = {
        ok: expandedOk,
        mode: "api-fallback (--no-browser)",
        status: apiSave.status,
      };
      result.expandedFieldsUpdate = {
        ok: expandedOk,
        fields: SCHEDULE_SAVE_FIELDS,
        testUpdates,
      };
    }

    const restoreUpdates = buildExpandedRestoreUpdates(original);
    const restore = await postScheduleUpdate(
      baseUrl,
      {
        legacy_id: legacyId,
        updates: restoreUpdates,
      },
      accessToken,
    );

    const afterRestore = await fetchScheduleRow(service, legacyId);
    result.cleanupRestore = {
      ok: restore.status === 200 && restore.json.ok === true && scheduleRecordsEqual(afterRestore, original),
      status: restore.status,
    };

    result.finalRecordEqualsOriginal = scheduleRecordsEqual(afterRestore, original);
    result.finalCounts = { schedules: await countSchedules(service) };
    result.countsUnchanged = result.finalCounts.schedules === baselineCount;

    if (!result.cleanupRestore.ok || !result.finalRecordEqualsOriginal) {
      result.errors.push("Cleanup restore failed — schedule not restored");
    }

    result.homeFeaturedLimitValidation = await runHomeFeaturedLimitValidation({
      baseUrl,
      service,
      accessToken,
      excludeLegacyId: legacyId,
    });
    if (result.homeFeaturedLimitValidation.error) {
      result.errors.push(result.homeFeaturedLimitValidation.error);
    }
    if (!result.homeFeaturedLimitValidation.ok) {
      result.errors.push("Home featured limit validation failed");
    }

    result.finalHomeFeaturedCount = result.homeFeaturedLimitValidation.finalHomeCount;

    const secrets = [env.serviceRoleKey, env.adminPassword, accessToken, refreshToken].filter(
      Boolean,
    );
    const hits = scanDirForSecrets(path.join(astroDir, "dist"), secrets);
    result.keyLeakScan = { ok: hits.length === 0, hitCount: hits.length };

    result.passed =
      result.build.ok &&
      result.pageCheck.ok &&
      result.uiSaveAvailability &&
      result.homeFeaturedDisplayExists &&
      result.uiSave?.ok &&
      result.expandedFieldsUpdate?.ok &&
      result.cleanupRestore.ok &&
      result.finalRecordEqualsOriginal === true &&
      result.countsUnchanged === true &&
      result.homeFeaturedLimitValidation?.ok &&
      result.keyLeakScan.ok;

    return result;
  } catch (err) {
    result.errors.push(err.message);
    try {
      await postScheduleUpdate(
        baseUrl,
        {
          legacy_id: legacyId,
          updates: buildExpandedRestoreUpdates(original),
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
    "Mode: **verify (Phase 3-P-E)**",
    `Supabase host: \`${result.host}\``,
    `Target legacy_id: \`${result.legacyId}\``,
    `Admin email: \`${result.email}\``,
    "Secrets: *(not logged)*",
    "",
    "## Phase",
    "",
    "Phase **3-P-E**: Home featured limit check added (`HOME_FEATURED_LIMIT = 3`).",
    "Target field: `schedules.show_on_home`. Concept generalizes to future modules such as `news.featured_on_home`.",
    "",
    "## Allowed save fields",
    "",
    ...SCHEDULE_SAVE_ALLOWED_FIELDS.map((field) => `- \`${field}\``),
    "",
    "## Forbidden save fields",
    "",
    ...SCHEDULE_SAVE_FORBIDDEN_FIELDS.map((field) => `- \`${field}\``),
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
      `- Home featured count display: ${result.homeFeaturedDisplayExists ? "yes" : "no"}`,
      "",
    );
  }

  if (result.uiSave) {
    lines.push(
      "## Normal UI save",
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

  if (result.expandedFieldsUpdate) {
    lines.push(
      "## Expanded fields update",
      "",
      `- Result: ${result.expandedFieldsUpdate.ok ? "success" : "failed"}`,
      "- Temporarily updated fields:",
    );
    for (const [key, value] of Object.entries(result.expandedFieldsUpdate.testUpdates ?? {})) {
      lines.push(`  - \`${key}\`: ${JSON.stringify(value)}`);
    }
    lines.push("");
  }

  if (result.homeFeaturedLimitValidation) {
    const lv = result.homeFeaturedLimitValidation;
    lines.push(
      "## Home featured limit validation",
      "",
      `- HOME_FEATURED_LIMIT: ${HOME_FEATURED_LIMIT}`,
      `- Target field: \`schedules.show_on_home\``,
      `- Mode: ${lv.mode === "api" ? "API (limit rejection test)" : lv.mode}`,
      `- Baseline home featured count: ${lv.baselineHomeCount} / ${HOME_FEATURED_LIMIT}`,
      `- At limit before test: ${lv.atLimit ? "yes" : "no"}`,
      `- Candidate legacy_id: \`${lv.candidateLegacyId ?? "none"}\``,
      `- Attempted 4th home item rejected: ${lv.rejected ? "yes" : "no"}`,
      `- Record unchanged after rejection: ${lv.recordUnchanged ? "yes" : "no"}`,
      `- Result: ${lv.ok ? "PASS" : "FAIL"}`,
      `- Final home featured count: ${lv.finalHomeCount}`,
      "",
    );
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
      `- home featured: ${result.finalHomeFeaturedCount ?? "n/a"} (expected ${HOME_FEATURED_LIMIT})`,
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
    `- Home featured limit: **${HOME_FEATURED_LIMIT}** (\`schedules.show_on_home\`; extensible to other featured-on-home modules)`,
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
    "- Phase 3-P-F: Discography update API + UI save",
    "- Phase 3-P-G: News featured-on-home module (future)",
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

/**
 * @param {string} astroDir
 * @param {{ passed: boolean, host: string, legacyId: string }} summary
 */
export function appendPhase3PDToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin schedule UI save — expanded fields (Phase 3-P-D)",
    "",
    `- **Target:** \`${summary.legacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Scope:** selected row only; title, venue, open_time, start_time, price, description, show_on_home, home_order, published`,
    `- **Home note:** max 3 home items planned; overflow check in Phase 3-P-E`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin schedule UI save — expanded fields (Phase 3-P-D)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}

/**
 * @param {string} astroDir
 * @param {{ passed: boolean, host: string, legacyId: string }} summary
 */
export function appendPhase3PEToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Admin schedule home featured limit (Phase 3-P-E)",
    "",
    `- **Target:** \`${summary.legacyId}\``,
    `- **Host:** \`${summary.host}\``,
    `- **Result:** ${summary.passed ? "PASS" : "FAIL"}`,
    `- **Limit:** HOME_FEATURED_LIMIT = 3 (\`schedules.show_on_home\`)`,
    `- **Concept:** featured-on-home module (extensible to news/events/works)`,
    `- **Report:** \`tools/static-to-astro/output/rls/gosaki/ADMIN_SCHEDULE_UI_SAVE_VERIFY_REPORT.md\``,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Admin schedule home featured limit (Phase 3-P-E)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}
