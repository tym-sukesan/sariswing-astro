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
export const GOSAKI_READ_ONLY_ADMIN_PAGE_REL = "src/pages/admin/index.astro";
export const GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL =
  "src/components/GosakiStagingReadOnlyAdminPage.astro";
export const GOSAKI_READ_ONLY_ADMIN_LIB_REL = "src/lib/gosaki-staging-read-only-admin.ts";
export const GOSAKI_READ_ONLY_ADMIN_CSS_REL = "src/styles/gosaki-staging-read-only-admin.css";
export const GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL = "src/data/gosaki-read-only-admin-dashboard.json";
export const GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL =
  "src/data/gosaki-read-only-admin-discography-editor.json";
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
  const componentSrc = path.join(templateRoot, "GosakiStagingReadOnlyAdminPage.astro");
  const libSrc = path.join(templateRoot, "gosaki-staging-read-only-admin.ts");
  const cssSrc = path.join(templateRoot, "gosaki-staging-read-only-admin.css");

  for (const src of [componentSrc, libSrc, cssSrc]) {
    if (!fs.existsSync(src)) {
      return { applied: false, reason: `template missing: ${path.basename(src)}` };
    }
  }

  const componentDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL);
  const libDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_LIB_REL);
  const cssDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_CSS_REL);
  const pageDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_PAGE_REL);

  fs.mkdirSync(path.dirname(libDest), { recursive: true });
  fs.mkdirSync(path.dirname(cssDest), { recursive: true });
  fs.mkdirSync(path.dirname(pageDest), { recursive: true });

  fs.copyFileSync(libSrc, libDest);
  fs.copyFileSync(cssSrc, cssDest);

  let pageTemplate = fs.readFileSync(componentSrc, "utf8");
  pageTemplate = pageTemplate
    .replace('import "../styles/gosaki-staging-read-only-admin.css";', 'import "../../styles/gosaki-staging-read-only-admin.css";')
    .replace('import youtubeConfig from "../data/gosaki-youtube-embed.json";', 'import youtubeConfig from "../../data/gosaki-youtube-embed.json";')
    .replace('import aboutConfig from "../data/gosaki-about-content.json";', 'import aboutConfig from "../../data/gosaki-about-content.json";')
    .replace('import contactConfig from "../data/gosaki-contact-hubspot.json";', 'import contactConfig from "../../data/gosaki-contact-hubspot.json";')
    .replaceAll('} from "../lib/gosaki-staging-read-only-admin";', '} from "../../lib/gosaki-staging-read-only-admin";')
    .replace(
      'import dashboardSnapshot from "../data/gosaki-read-only-admin-dashboard.json";',
      'import dashboardSnapshot from "../../data/gosaki-read-only-admin-dashboard.json";',
    )
    .replace(
      'import discographyEditorSnapshot from "../data/gosaki-read-only-admin-discography-editor.json";',
      'import discographyEditorSnapshot from "../../data/gosaki-read-only-admin-discography-editor.json";',
    );
  fs.writeFileSync(pageDest, pageTemplate, "utf8");

  const discographyBundle = /** @type {any} */ (options.discographyBundle);
  const dashboardSnapshot = buildReadOnlyAdminDashboardSnapshot({
    scheduleBundle: /** @type {any} */ (options.scheduleBundle),
    discographyBundle,
  });
  const discographyEditorSnapshot = buildDiscographyEditorPrototypeSnapshot(discographyBundle);
  const dashboardDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL);
  const discographyEditorDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL);
  fs.mkdirSync(path.dirname(dashboardDest), { recursive: true });
  fs.mkdirSync(path.dirname(discographyEditorDest), { recursive: true });
  fs.writeFileSync(dashboardDest, `${JSON.stringify(dashboardSnapshot, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    discographyEditorDest,
    `${JSON.stringify(discographyEditorSnapshot, null, 2)}\n`,
    "utf8",
  );

  const bandsBlock = about.config.blocks?.find((b) => b?.id === "about-bands-html");
  const bandImages = extractBandImageFileNamesFromHtml(bandsBlock?.html ?? "");

  return {
    applied: true,
    reason: null,
    adminRoute: "/admin/",
    pagePath: GOSAKI_READ_ONLY_ADMIN_PAGE_REL,
    componentPath: GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL,
    libPath: GOSAKI_READ_ONLY_ADMIN_LIB_REL,
    dashboardPath: GOSAKI_READ_ONLY_ADMIN_DASHBOARD_DATA_REL,
    discographyEditorPath: GOSAKI_READ_ONLY_ADMIN_DISCOGRAPHY_EDITOR_DATA_REL,
    dashboardSnapshot,
    discographyEditorSnapshot,
    bandImageCount: bandImages.length,
    bandImageFiles: bandImages,
    contactPortalId: contact.config.portalId ?? null,
    contactFormId: contact.config.formId ?? null,
  };
}
