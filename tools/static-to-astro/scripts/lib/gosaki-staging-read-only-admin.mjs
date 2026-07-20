/**
 * G-11b — Inject Gosaki staging read-only admin page into generated Astro output.
 */

import fs from "node:fs";
import path from "node:path";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";
import { loadGosakiAboutContentConfig } from "./gosaki-about-content.mjs";
import { groupDiscographyTracksByLegacyId } from "./supabase-discography-read.mjs";
import { loadGosakiYoutubeEmbedConfig } from "./gosaki-home-youtube-embed.mjs";

export const GOSAKI_READ_ONLY_ADMIN_MARKER = "gosaki-read-only-admin";
export const GOSAKI_READ_ONLY_ADMIN_DATA_ATTR = 'data-gosaki-read-only-admin="true"';
export const GOSAKI_READ_ONLY_ADMIN_MULTI_ROUTE_ATTR = 'data-gosaki-admin-multi-route="true"';
export const GOSAKI_READ_ONLY_ADMIN_PAGE_REL = "src/pages/admin/index.astro";
export const GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL =
  "src/components/GosakiStagingReadOnlyAdminPage.astro";
export const GOSAKI_READ_ONLY_ADMIN_LIB_REL = "src/lib/gosaki-staging-read-only-admin.ts";
export const GOSAKI_PACKAGE_ADMIN_PATHS_REL = "src/lib/gosaki-package-admin-paths.ts";
export const GOSAKI_READ_ONLY_ADMIN_CSS_REL = "src/styles/gosaki-staging-read-only-admin.css";
export const GOSAKI_ADMIN_SHELL_CHROME_CSS_REL = "src/styles/gosaki-admin-shell-chrome.css";
export const GOSAKI_ADMIN_CHROME_COMPONENT_DIR_REL = "src/components/gosaki-admin";
export const GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL = "src/data/gosaki-read-only-admin-dashboard.json";
export const GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL =
  "src/data/gosaki-read-only-admin-discography-editor.json";
export const GOSAKI_READ_ONLY_ADMIN_SCHEDULE_EVENTS_DATA_REL =
  "src/data/gosaki-read-only-admin-schedule-events.json";

/** Shared content / auth panels copied into package gosaki-admin/ */
export const GOSAKI_ADMIN_CONTENT_PANEL_COMPONENTS = [
  "AdminGosakiStagingScheduleContentPanel.astro",
  "AdminGosakiStagingAboutContentPanel.astro",
  "AdminGosakiStagingDiscographyContentPanel.astro",
  "AdminGosakiStagingYoutubeContentPanel.astro",
  "AdminGosakiStagingEditToolbar.astro",
  "AdminGosakiStagingSaveDisabledStatus.astro",
  "AdminGosakiStagingCompactAuthBar.astro",
];

/** @type {ReadonlyArray<{ page: string, rel: string }>} */
export const GOSAKI_ADMIN_MULTI_ROUTE_PAGES = [
  { page: "portal", rel: "src/pages/admin/index.astro" },
  { page: "schedule", rel: "src/pages/admin/schedule/index.astro" },
  { page: "discography", rel: "src/pages/admin/discography/index.astro" },
  { page: "youtube", rel: "src/pages/admin/youtube/index.astro" },
  { page: "about", rel: "src/pages/admin/about/index.astro" },
];
export const GOSAKI_CONTACT_HUBSPOT_CONFIG_REL = "config/sites/gosaki-piano-contact-hubspot.json";
export const G20U28_ADMIN_UI_PHASE = "G-20u28-gosaki-admin-ui-foundation-polish";
export const G20U29_DISCOGRAPHY_EDITOR_PHASE = "G-20u29-gosaki-discography-edit-ui-prototype";
export const G20U30_DISCOGRAPHY_DRY_RUN_PHASE = "G-20u30-gosaki-discography-dry-run-validation";

export const EXPECTED_BAND_IMAGE_FILES = [
  "gosakirikako_trio.jpg",
  "onomatopoeia.jpg",
  "careless_hornets.jpg",
  "kikioto.jpg",
  "caribbean_function.jpg",
];

export { isGosakiPianoFixture };

/**
 * @param {string} toolRoot
 */
export function loadGosakiContactHubspotConfig(toolRoot) {
  const configPath = path.join(toolRoot, GOSAKI_CONTACT_HUBSPOT_CONFIG_REL);
  if (!fs.existsSync(configPath)) {
    return { ok: false, configPath, config: null, error: "config not found" };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { ok: true, configPath, config, error: null };
  } catch (err) {
    return { ok: false, configPath, config: null, error: `parse error: ${err.message}` };
  }
}

/**
 * @param {string} html
 */
export function isGosakiReadOnlyAdminHtml(html) {
  return String(html).includes(GOSAKI_READ_ONLY_ADMIN_DATA_ATTR);
}

/**
 * @param {string} publicDir
 */
export function detectGosakiReadOnlyAdminInPublicDir(publicDir) {
  const adminIndex = path.join(publicDir, "admin/index.html");
  if (!fs.existsSync(adminIndex)) return false;
  return isGosakiReadOnlyAdminHtml(fs.readFileSync(adminIndex, "utf8"));
}

/**
 * @param {string} bandsHtml
 */
export function extractBandImageFileNamesFromHtml(bandsHtml) {
  const matches = String(bandsHtml ?? "").matchAll(
    /assets\/about\/bands\/([a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp))/gi,
  );
  const seen = new Set();
  const files = [];
  for (const match of matches) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      files.push(name);
    }
  }
  return files;
}

/**
 * Count published schedule rows for August 2026 from a build-time bundle.
 *
 * @param {unknown[]} schedules
 */
export function countAugust2026ScheduleEvents(schedules) {
  if (!Array.isArray(schedules)) return 0;
  return schedules.filter((row) => {
    const year = Number(row?.year);
    const month = Number(row?.month);
    if (year === 2026 && month === 8) return true;
    const date = String(row?.date ?? "");
    return /^2026-08/.test(date);
  }).length;
}

/**
 * Build schedule events snapshot for STG admin schedule content panel.
 *
 * @param {{
 *   scheduleDataSource?: string,
 *   schedules?: unknown[],
 *   months?: unknown[],
 * } | null | undefined} scheduleBundle
 */
export function buildScheduleAdminEventsSnapshot(scheduleBundle = null) {
  const schedules = Array.isArray(scheduleBundle?.schedules) ? scheduleBundle.schedules : [];
  /** @type {Array<Record<string, unknown>>} */
  const events = schedules
    .map((row) => {
      const r = /** @type {Record<string, unknown>} */ (row ?? {});
      const date = String(r.date ?? "").trim();
      const yearMonth =
        date.match(/^(\d{4}-\d{2})/)?.[1] ??
        (r.year != null && r.month != null
          ? `${String(r.year).padStart(4, "0")}-${String(r.month).padStart(2, "0")}`
          : "");
      return {
        id: r.id ?? null,
        legacyId: r.legacy_id ?? null,
        date: date || null,
        yearMonth: yearMonth || null,
        title: r.title ?? "",
        venue: r.venue ?? "",
        openTime: r.open_time ?? "",
        startTime: r.start_time ?? "",
        price: r.price ?? "",
        description: r.description ?? "",
        published: r.published !== false,
        updatedAt: r.updated_at ?? null,
      };
    })
    .sort((a, b) => {
      const da = String(a.date ?? "");
      const db = String(b.date ?? "");
      if (da !== db) return db.localeCompare(da);
      return String(a.legacyId ?? "").localeCompare(String(b.legacyId ?? ""));
    });

  const months = [
    ...new Set(events.map((e) => String(e.yearMonth || "").trim()).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a));

  return {
    phase: "G-20u39b5-gosaki-admin-multi-route-content-ui-restore",
    dataSource: scheduleBundle?.scheduleDataSource ?? "unknown",
    totalEvents: events.length,
    monthCount: months.length,
    months,
    events,
    saveEnabled: false,
  };
}

/**
 * Format track rows as multiline textarea content (1 line = 1 track title).
 *
 * @param {unknown[]} tracks
 */
export function formatDiscographyTrackListTextarea(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return "";
  return tracks
    .slice()
    .sort((a, b) => {
      const ao = Number(a?.sort_order ?? a?.track_number ?? 0);
      const bo = Number(b?.sort_order ?? b?.track_number ?? 0);
      if (ao !== bo) return ao - bo;
      return Number(a?.track_number ?? 0) - Number(b?.track_number ?? 0);
    })
    .map((track) => String(track?.title ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Parse multiline track list (trim · ignore blank lines). G-20u30 — keep in sync with .ts
 *
 * @param {string} text
 */
export function parseDiscographyTrackListLines(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Browser-only dry-run diff for track list textarea. G-20u30 — keep in sync with .ts
 *
 * @param {string} originalText
 * @param {string} nextText
 * @param {{ legacyId?: string, title?: string }} [meta]
 */
export function validateDiscographyTrackListDryRun(originalText, nextText, meta = {}) {
  const before = parseDiscographyTrackListLines(originalText);
  const after = parseDiscographyTrackListLines(nextText);
  const beforeRemain = [...before];
  const afterRemain = [...after];
  /** @type {string[]} */
  const removed = [];
  /** @type {string[]} */
  const added = [];

  for (let i = beforeRemain.length - 1; i >= 0; i -= 1) {
    const title = beforeRemain[i];
    const matchIdx = afterRemain.indexOf(title);
    if (matchIdx >= 0) {
      beforeRemain.splice(i, 1);
      afterRemain.splice(matchIdx, 1);
    }
  }
  removed.push(...beforeRemain);
  added.push(...afterRemain);

  const unchanged = before.length - removed.length;
  const maxLen = Math.max(before.length, after.length);
  /** @type {Array<{ line: number, before: string | null, after: string | null, kind: string }>} */
  const changedLines = [];
  for (let i = 0; i < maxLen; i += 1) {
    const b = before[i] ?? null;
    const a = after[i] ?? null;
    if (b === a) continue;
    if (b && a) changedLines.push({ line: i + 1, before: b, after: a, kind: "changed" });
    else if (!b && a) changedLines.push({ line: i + 1, before: null, after: a, kind: "added" });
    else if (b && !a) changedLines.push({ line: i + 1, before: b, after: null, kind: "removed" });
  }

  const reordered =
    before.join("\n") !== after.join("\n") && added.length === 0 && removed.length === 0;

  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    saveEnabled: false,
    networkWrite: false,
    blankLinesIgnored: true,
    legacyId: meta.legacyId,
    title: meta.title,
    totalBefore: before.length,
    totalAfter: after.length,
    added,
    removed,
    unchanged,
    changedLines,
    reordered,
  };
}

/**
 * @param {Array<{ legacyId: string, title: string, originalText: string, nextText: string }>} albums
 */
export function validateDiscographyTrackListDryRunBatch(albums) {
  return {
    ok: true,
    dryRun: true,
    wouldWrite: false,
    saveEnabled: false,
    networkWrite: false,
    blankLinesIgnored: true,
    albumCount: albums.length,
    albums: albums.map((album) =>
      validateDiscographyTrackListDryRun(album.originalText, album.nextText, {
        legacyId: album.legacyId,
        title: album.title,
      }),
    ),
  };
}

/**
 * Build Discography editor prototype snapshot (build-time read-only — no DB writes).
 *
 * @param {unknown} discographyBundle
 */
export function buildDiscographyEditorPrototypeSnapshot(discographyBundle) {
  const bundle = /** @type {any} */ (discographyBundle ?? {});
  const releases = Array.isArray(bundle.releases) ? bundle.releases : [];
  const tracksByLegacyId =
    bundle.tracksByLegacyId && typeof bundle.tracksByLegacyId === "object"
      ? bundle.tracksByLegacyId
      : groupDiscographyTracksByLegacyId(Array.isArray(bundle.tracks) ? bundle.tracks : []);
  const trackRowCount =
    bundle.trackRowCount ?? (Array.isArray(bundle.tracks) ? bundle.tracks.length : 0);

  const albums = releases.map((release) => {
    const legacyId = String(release?.legacy_id ?? "");
    const tracks = tracksByLegacyId[legacyId] ?? [];
    return {
      legacyId,
      title: String(release?.title ?? ""),
      artist: release?.artist ?? null,
      releaseDate: release?.release_date ?? null,
      label: release?.label ?? null,
      catalogNumber: release?.catalog_number ?? null,
      published: release?.published !== false,
      coverImageUrl: release?.cover_image_url ?? null,
      purchaseUrl: release?.purchase_url ?? null,
      streamingUrl: release?.streaming_url ?? null,
      description: release?.description ?? "",
      trackListText: formatDiscographyTrackListTextarea(tracks),
      trackCount: tracks.length,
      updatedAt: release?.updated_at ?? null,
    };
  });

  return {
    phase: G20U29_DISCOGRAPHY_EDITOR_PHASE,
    readOnly: true,
    saveEnabled: false,
    productionUploadStop: true,
    siteSlug: bundle.siteSlug ?? "gosaki-piano",
    filteredRead: bundle.siteSlugFilterApplied === true,
    dataSource: bundle.discographyDataSource ?? "unknown",
    releaseCount: albums.length,
    trackCount: trackRowCount,
    dryRunValidation: true,
    dryRunValidationPhase: G20U30_DISCOGRAPHY_DRY_RUN_PHASE,
    albums,
  };
}

/**
 * Build dashboard snapshot for read-only admin (build-time only — no DB writes).
 *
 * @param {{
 *   scheduleBundle?: { scheduleDataSource?: string, schedules?: unknown[], months?: unknown[], siteSlugFilterApplied?: boolean } | null,
 *   discographyBundle?: { discographyDataSource?: string, releases?: unknown[], rowCount?: number, trackRowCount?: number, siteSlugFilterApplied?: boolean } | null,
 * }} [input]
 */
export function buildReadOnlyAdminDashboardSnapshot(input = {}) {
  const scheduleBundle = input.scheduleBundle ?? null;
  const discographyBundle = input.discographyBundle ?? null;
  const schedules = scheduleBundle?.schedules ?? [];
  const releases =
    discographyBundle?.rowCount ??
    (Array.isArray(discographyBundle?.releases) ? discographyBundle.releases.length : 0);
  const tracks = discographyBundle?.trackRowCount ?? 0;

  return {
    phase: G20U28_ADMIN_UI_PHASE,
    environment: "staging",
    readOnly: true,
    saveEnabled: false,
    productionUploadStop: true,
    schedule: {
      dataSource: scheduleBundle?.scheduleDataSource ?? "unknown",
      totalEvents: Array.isArray(schedules) ? schedules.length : 0,
      august2026Events: countAugust2026ScheduleEvents(schedules),
      monthCount: Array.isArray(scheduleBundle?.months) ? scheduleBundle.months.length : 0,
      status: "read-only",
      editUi: "planned",
    },
    discography: {
      dataSource: discographyBundle?.discographyDataSource ?? "unknown",
      releases,
      tracks,
      filteredRead: discographyBundle?.siteSlugFilterApplied === true,
      status: "read-only",
      editUi: releases > 0 ? "prototype" : "planned",
    },
    youtube: {
      status: "read-only",
      dryRunOnly: true,
      saveEnabled: false,
      editUi: "planned",
    },
    about: {
      status: "read-only",
      editUi: "planned",
    },
    contact: {
      status: "read-only",
      editUi: "planned",
    },
    link: {
      status: "static",
      editUi: "planned",
    },
    uploadSafety: {
      manualFtpOnly: true,
      ftpAutoDeploy: false,
      productionAdminExcluded: true,
      sitemapAdminExcluded: true,
      productionUploadStopReason: "G-20j",
    },
  };
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{
 *   scheduleBundle?: unknown,
 *   discographyBundle?: unknown,
 * }} [options]
 */
export function applyGosakiStagingReadOnlyAdmin(outDir, toolRoot, options = {}) {
  const youtube = loadGosakiYoutubeEmbedConfig(toolRoot);
  const about = loadGosakiAboutContentConfig(toolRoot);
  const contact = loadGosakiContactHubspotConfig(toolRoot);

  if (!youtube.ok || !about.ok || !contact.ok) {
    return {
      applied: false,
      reason: [
        !youtube.ok ? youtube.error : null,
        !about.ok ? about.error : null,
        !contact.ok ? contact.error : null,
      ]
        .filter(Boolean)
        .join("; "),
    };
  }

  const templateRoot = path.join(toolRoot, "templates/site-extensions/gosaki-piano");
  const chromeRoot = path.join(toolRoot, "templates/admin-cms/gosaki/components");
  const chromeCssSrc = path.join(
    toolRoot,
    "templates/admin-cms/gosaki/styles/gosaki-admin-shell-chrome.css",
  );
  const componentSrc = path.join(templateRoot, "GosakiStagingReadOnlyAdminPage.astro");
  const libSrc = path.join(templateRoot, "gosaki-staging-read-only-admin.ts");
  const discographyEditSrc = path.join(
    templateRoot,
    "gosaki-staging-discography-operational-edit.ts",
  );
  const scheduleEditSrc = path.join(
    templateRoot,
    "gosaki-staging-schedule-operational-edit.ts",
  );
  const youtubeEditSrc = path.join(
    templateRoot,
    "gosaki-staging-youtube-operational-edit.ts",
  );
  const youtubeMultiEditSrc = path.join(
    templateRoot,
    "gosaki-staging-youtube-multi-operational-edit.ts",
  );
  const aboutEditSrc = path.join(
    templateRoot,
    "gosaki-staging-about-operational-edit.ts",
  );
  const packagePathsSrc = path.join(templateRoot, "gosaki-package-admin-paths.ts");
  const cssSrc = path.join(templateRoot, "gosaki-staging-read-only-admin.css");
  const chromeComponents = [
    "AdminGosakiStagingNav.astro",
    "AdminGosakiStagingSafetyChips.astro",
    "AdminGosakiStagingOperatorHome.astro",
    ...GOSAKI_ADMIN_CONTENT_PANEL_COMPONENTS,
  ];

  for (const src of [
    componentSrc,
    libSrc,
    discographyEditSrc,
    scheduleEditSrc,
    youtubeEditSrc,
    youtubeMultiEditSrc,
    aboutEditSrc,
    packagePathsSrc,
    cssSrc,
    chromeCssSrc,
  ]) {
    if (!fs.existsSync(src)) {
      return { applied: false, reason: `template missing: ${path.basename(src)}` };
    }
  }
  for (const name of chromeComponents) {
    if (!fs.existsSync(path.join(chromeRoot, name))) {
      return { applied: false, reason: `chrome component missing: ${name}` };
    }
  }

  const componentDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL);
  const libDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_LIB_REL);
  const packagePathsDest = path.join(outDir, GOSAKI_PACKAGE_ADMIN_PATHS_REL);
  const cssDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_CSS_REL);
  const chromeCssDest = path.join(outDir, GOSAKI_ADMIN_SHELL_CHROME_CSS_REL);
  const chromeDirDest = path.join(outDir, GOSAKI_ADMIN_CHROME_COMPONENT_DIR_REL);

  fs.mkdirSync(path.dirname(libDest), { recursive: true });
  fs.mkdirSync(path.dirname(cssDest), { recursive: true });
  fs.mkdirSync(path.dirname(chromeCssDest), { recursive: true });
  fs.mkdirSync(path.dirname(componentDest), { recursive: true });
  fs.mkdirSync(chromeDirDest, { recursive: true });

  fs.copyFileSync(libSrc, libDest);
  fs.copyFileSync(
    discographyEditSrc,
    path.join(path.dirname(libDest), "gosaki-staging-discography-operational-edit.ts"),
  );
  fs.copyFileSync(
    scheduleEditSrc,
    path.join(path.dirname(libDest), "gosaki-staging-schedule-operational-edit.ts"),
  );
  fs.copyFileSync(
    youtubeEditSrc,
    path.join(path.dirname(libDest), "gosaki-staging-youtube-operational-edit.ts"),
  );
  fs.copyFileSync(
    youtubeMultiEditSrc,
    path.join(path.dirname(libDest), "gosaki-staging-youtube-multi-operational-edit.ts"),
  );
  fs.copyFileSync(
    aboutEditSrc,
    path.join(path.dirname(libDest), "gosaki-staging-about-operational-edit.ts"),
  );
  fs.copyFileSync(packagePathsSrc, packagePathsDest);
  fs.copyFileSync(cssSrc, cssDest);
  fs.copyFileSync(chromeCssSrc, chromeCssDest);

  for (const name of chromeComponents) {
    let chrome = fs.readFileSync(path.join(chromeRoot, name), "utf8");
    chrome = chrome
      .replaceAll(
        'from "../gosaki-staging-admin-paths"',
        'from "../../lib/gosaki-package-admin-paths"',
      )
      .replaceAll(
        'from "../gosaki-staging-admin-paths.ts"',
        'from "../../lib/gosaki-package-admin-paths"',
      );
    fs.writeFileSync(path.join(chromeDirDest, name), chrome, "utf8");
  }

  // Component lives at src/components/ — keep ../styles ../lib ../data ./gosaki-admin imports as authored.
  let componentTemplate = fs.readFileSync(componentSrc, "utf8");
  if (!componentTemplate.includes(GOSAKI_READ_ONLY_ADMIN_MULTI_ROUTE_ATTR)) {
    return { applied: false, reason: "multi-route admin template marker missing" };
  }
  fs.writeFileSync(componentDest, componentTemplate, "utf8");

  /** @type {string[]} */
  const pagePaths = [];
  for (const route of GOSAKI_ADMIN_MULTI_ROUTE_PAGES) {
    const pageDest = path.join(outDir, route.rel);
    fs.mkdirSync(path.dirname(pageDest), { recursive: true });
    const ups = route.page === "portal" ? "../../components" : "../../../components";
    const pageSource = `---
import GosakiStagingReadOnlyAdminPage from "${ups}/GosakiStagingReadOnlyAdminPage.astro";
---
<GosakiStagingReadOnlyAdminPage page="${route.page}" />
`;
    fs.writeFileSync(pageDest, pageSource, "utf8");
    pagePaths.push(route.rel);
  }

  const discographyBundle = /** @type {any} */ (options.discographyBundle);
  const scheduleBundle = /** @type {any} */ (options.scheduleBundle);
  const dashboardSnapshot = buildReadOnlyAdminDashboardSnapshot({
    scheduleBundle,
    discographyBundle,
  });
  const discographyEditorSnapshot = buildDiscographyEditorPrototypeSnapshot(discographyBundle);
  const scheduleEventsSnapshot = buildScheduleAdminEventsSnapshot(scheduleBundle);
  const dashboardDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL);
  const discographyEditorDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL);
  const scheduleEventsDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_SCHEDULE_EVENTS_DATA_REL);
  fs.mkdirSync(path.dirname(dashboardDest), { recursive: true });
  fs.mkdirSync(path.dirname(discographyEditorDest), { recursive: true });
  fs.mkdirSync(path.dirname(scheduleEventsDest), { recursive: true });
  fs.writeFileSync(dashboardDest, `${JSON.stringify(dashboardSnapshot, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    discographyEditorDest,
    `${JSON.stringify(discographyEditorSnapshot, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    scheduleEventsDest,
    `${JSON.stringify(scheduleEventsSnapshot, null, 2)}\n`,
    "utf8",
  );

  const bandsBlock = about.config.blocks?.find((b) => b?.id === "about-bands-html");
  const bandImages = extractBandImageFileNamesFromHtml(bandsBlock?.html ?? "");

  return {
    applied: true,
    reason: null,
    adminRoute: "/admin/",
    adminRoutes: GOSAKI_ADMIN_MULTI_ROUTE_PAGES.map((r) =>
      r.page === "portal" ? "/admin/" : `/admin/${r.page}/`,
    ),
    pagePath: GOSAKI_READ_ONLY_ADMIN_PAGE_REL,
    pagePaths,
    componentPath: GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL,
    libPath: GOSAKI_READ_ONLY_ADMIN_LIB_REL,
    packagePathsPath: GOSAKI_PACKAGE_ADMIN_PATHS_REL,
    chromeComponentDir: GOSAKI_ADMIN_CHROME_COMPONENT_DIR_REL,
    dashboardPath: GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL,
    discographyEditorPath: GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL,
    scheduleEventsPath: GOSAKI_READ_ONLY_ADMIN_SCHEDULE_EVENTS_DATA_REL,
    dashboardSnapshot,
    discographyEditorSnapshot,
    scheduleEventsSnapshot,
    bandImageCount: bandImages.length,
    bandImageFiles: bandImages,
    contactPortalId: contact.config.portalId ?? null,
    contactFormId: contact.config.formId ?? null,
    multiRoute: true,
  };
}
