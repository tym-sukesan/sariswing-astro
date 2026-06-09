/**
 * supabase-json-exporter.mjs
 *
 * Read-only export from staging Supabase to Astro src/data JSON (Phase 3-K).
 * No insert / update / delete / upsert.
 */

import fs from "node:fs";
import path from "node:path";
import { preflightApplyEnv } from "./supabase-seed-inserter.mjs";

const TABLE_SELECTS = {
  schedule_months:
    "month,label,route,count,sort_order,published",
  schedules:
    "legacy_id,date,year,month,title,venue,open_time,start_time,price,description,image_url,home_image_url,show_on_home,home_order,published,sort_order,source_file,source_route",
  discography:
    "legacy_id,title,artist,release_date,year,label,catalog_number,description,cover_image_url,purchase_url,streaming_url,sort_order,published,source_file,source_route",
  discography_tracks: "discography_legacy_id,track_number,title,sort_order",
};

/**
 * @param {string} supabaseUrl
 */
export function supabaseHostFromUrl(supabaseUrl) {
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return "(invalid URL)";
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} table
 * @param {string} select
 */
async function fetchTable(supabase, table, select) {
  const { data, error } = await supabase.from(table).select(select);
  if (error) {
    throw new Error(`Failed to read ${table}: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Read-only fetch from staging Supabase.
 * @param {{ supabaseUrl: string, serviceRoleKey: string }} env
 */
export async function fetchSupabaseCmsData(env) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [scheduleMonths, schedules, discography, discographyTracks] = await Promise.all([
    fetchTable(supabase, "schedule_months", TABLE_SELECTS.schedule_months),
    fetchTable(supabase, "schedules", TABLE_SELECTS.schedules),
    fetchTable(supabase, "discography", TABLE_SELECTS.discography),
    fetchTable(supabase, "discography_tracks", TABLE_SELECTS.discography_tracks),
  ]);

  return { scheduleMonths, schedules, discography, discographyTracks };
}

const PLACEHOLDER_IMAGE_HOSTS = new Set(["example.supabase.co"]);

/**
 * @param {string | null | undefined} url
 */
export function sanitizePublicImageUrl(url) {
  if (!url) return null;
  if (String(url).includes("example.supabase.co")) return null;
  try {
    if (PLACEHOLDER_IMAGE_HOSTS.has(new URL(url).hostname)) return null;
  } catch {
    // keep non-URL strings (relative paths)
  }
  return url;
}

/**
 * @param {string | null | undefined} isoDate
 */
export function formatDateDisplay(isoDate) {
  if (!isoDate) return null;
  const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(`${y}-${m}-${d}T12:00:00`).getDay()
  ];
  return `${y}.${m}.${d} (${weekday})`;
}

/**
 * @param {object[]} rows
 */
export function transformScheduleMonths(rows) {
  return [...rows]
    .sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(b.month ?? "").localeCompare(String(a.month ?? ""));
    })
    .map((row) => ({
      month: row.month,
      label: row.label,
      route: row.route,
      count: row.count ?? 0,
      sort_order: row.sort_order ?? null,
      published: row.published !== false,
    }));
}

/**
 * @param {object[]} rows
 */
export function transformSchedules(rows) {
  return [...rows]
    .sort((a, b) => {
      if (a.date !== b.date) return String(a.date ?? "").localeCompare(String(b.date ?? ""));
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(a.legacy_id ?? "").localeCompare(String(b.legacy_id ?? ""));
    })
    .map((row) => ({
      id: row.legacy_id,
      legacy_id: row.legacy_id,
      date: row.date ?? null,
      date_display: formatDateDisplay(row.date),
      year: row.year ?? null,
      month: row.month ?? null,
      title: row.title ?? null,
      venue: row.venue ?? null,
      open_time: row.open_time ?? null,
      start_time: row.start_time ?? null,
      price: row.price ?? null,
      description: row.description ?? null,
      image: sanitizePublicImageUrl(row.image_url),
      image_url: sanitizePublicImageUrl(row.image_url),
      home_image: sanitizePublicImageUrl(row.home_image_url),
      home_image_url: sanitizePublicImageUrl(row.home_image_url),
      show_on_home: Boolean(row.show_on_home),
      home_order: row.home_order ?? null,
      published: row.published !== false,
      sort_order: row.sort_order ?? null,
      source_file: row.source_file ?? null,
      source_route: row.source_route ?? null,
      home_date_display: null,
      home_performers: null,
      home_address: null,
      home_phone: null,
    }));
}

/**
 * @param {object[]} discographyRows
 * @param {object[]} trackRows
 */
export function transformDiscography(discographyRows, trackRows) {
  const tracksByAlbum = new Map();
  for (const track of trackRows) {
    const key = track.discography_legacy_id;
    if (!tracksByAlbum.has(key)) tracksByAlbum.set(key, []);
    tracksByAlbum.get(key).push({
      number: track.track_number,
      title: track.title,
    });
  }

  for (const tracks of tracksByAlbum.values()) {
    tracks.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }

  return [...discographyRows]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row) => {
      const title = row.title ?? null;
      const artist = row.artist ?? null;
      const heading =
        title && artist ? `「${title}」/ ${artist}` : title ?? null;

      return {
        id: row.legacy_id,
        legacy_id: row.legacy_id,
        title,
        artist,
        heading,
        release_date: row.release_date ?? null,
        year: row.year ?? null,
        label: row.label ?? null,
        catalog_number: row.catalog_number ?? null,
        release_display: null,
        description: row.description ?? null,
        cover_image: sanitizePublicImageUrl(row.cover_image_url),
        cover_image_url: sanitizePublicImageUrl(row.cover_image_url),
        cover_alt: title ? `「${title}」ジャケット` : null,
        tracks: tracksByAlbum.get(row.legacy_id) ?? [],
        streaming_url: row.streaming_url ?? null,
        purchase_url: row.purchase_url ?? null,
        sort_order: row.sort_order ?? null,
        published: row.published !== false,
        source_file: row.source_file ?? null,
        source_route: row.source_route ?? null,
      };
    });
}

/**
 * @param {{ scheduleMonths: object[], schedules: object[], discography: object[], discographyTracks: object[] }} raw
 * @param {{ scheduleMonths: object[], schedules: object[], discography: object[] }} exported
 */
export function analyzeExportIntegrity(raw, exported) {
  const monthKeys = new Set(raw.scheduleMonths.map((row) => row.month));
  const albumKeys = new Set(raw.discography.map((row) => row.legacy_id));

  return {
    readCounts: {
      schedule_months: raw.scheduleMonths.length,
      schedules: raw.schedules.length,
      discography: raw.discography.length,
      discography_tracks: raw.discographyTracks.length,
    },
    exportCounts: {
      schedule_months: exported.scheduleMonths.length,
      schedules: exported.schedules.length,
      discography: exported.discography.length,
    },
    orphanSchedules: exported.schedules.filter((row) => !monthKeys.has(row.month)).length,
    orphanTracks: raw.discographyTracks.filter(
      (row) => !albumKeys.has(row.discography_legacy_id),
    ).length,
    showOnHome: exported.schedules.filter((row) => row.show_on_home).length,
  };
}

/**
 * @param {{ scheduleMonths: object[], schedules: object[], discography: object[] }} data
 * @param {string} outAstroDir
 */
export function writeAstroDataJson(data, outAstroDir) {
  const dataDir = path.join(path.resolve(outAstroDir), "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const files = {
    scheduleMonths: path.join(dataDir, "schedule-months.json"),
    schedules: path.join(dataDir, "schedules.json"),
    discography: path.join(dataDir, "discography.json"),
  };

  fs.writeFileSync(files.scheduleMonths, `${JSON.stringify(data.scheduleMonths, null, 2)}\n`, "utf8");
  fs.writeFileSync(files.schedules, `${JSON.stringify(data.schedules, null, 2)}\n`, "utf8");
  fs.writeFileSync(files.discography, `${JSON.stringify(data.discography, null, 2)}\n`, "utf8");

  return files;
}

export function formatSupabaseExportReport({
  host,
  integrity,
  outputFiles,
  compatibilityFields,
  buildResult,
  elapsedMs,
  reportPath,
}) {
  const lines = [
    "# SUPABASE_EXPORT_REPORT",
    "",
    `Generated at: ${new Date().toISOString()}`,
    "Mode: **READ-ONLY export** (no Supabase writes)",
    "",
    "## Connection",
    "",
    `- Supabase host: \`${host}\``,
    "- Service role key: *(not logged)*",
    "",
    "## Read counts (staging Supabase)",
    "",
    "| Table | Rows |",
    "| --- | ---: |",
    `| schedule_months | ${integrity.readCounts.schedule_months} |`,
    `| schedules | ${integrity.readCounts.schedules} |`,
    `| discography | ${integrity.readCounts.discography} |`,
    `| discography_tracks | ${integrity.readCounts.discography_tracks} |`,
    "",
    "## Export files",
    "",
    `- \`${outputFiles.scheduleMonths}\``,
    `- \`${outputFiles.schedules}\``,
    `- \`${outputFiles.discography}\``,
    "",
    "| Export file | Rows |",
    "| --- | ---: |",
    `| schedule-months.json | ${integrity.exportCounts.schedule_months} |`,
    `| schedules.json | ${integrity.exportCounts.schedules} |`,
    `| discography.json | ${integrity.exportCounts.discography} |`,
    "",
    "## JSON compatibility fields",
    "",
    ...compatibilityFields.map((field) => `- ${field}`),
    "",
    "## Integrity (post-export)",
    "",
    `- orphan schedules (month not in schedule_months): ${integrity.orphanSchedules}`,
    `- orphan tracks (discography_legacy_id not in discography): ${integrity.orphanTracks}`,
    `- show_on_home schedules: ${integrity.showOnHome}`,
    "",
    "## Build",
    "",
    buildResult.success
      ? `- **Result:** success (${buildResult.elapsedMs}ms)`
      : `- **Result:** failed\n- **Error:** ${buildResult.error ?? "unknown"}`,
    "",
    "## Safety",
    "",
    "- No insert / update / delete / upsert was performed on Supabase.",
    "- Credentials were read from `.env.local` only; key values were not written to this report.",
    "",
    "---",
    `Elapsed: ${elapsedMs}ms`,
    `Report: \`${reportPath}\``,
    "",
  ];

  return lines.join("\n");
}

/**
 * @param {string} astroDir
 * @param {{ host: string, integrity: ReturnType<typeof analyzeExportIntegrity>, buildSuccess: boolean }} summary
 */
export function appendPhase3KToConversionReport(astroDir, summary) {
  const reportPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(reportPath)) return;

  const block = [
    "",
    "## Supabase JSON export (Phase 3-K)",
    "",
    `- **Mode:** read-only export from staging (\`${summary.host}\`)`,
    `- **Exported:** schedule-months ${summary.integrity.exportCounts.schedule_months}, schedules ${summary.integrity.exportCounts.schedules}, discography ${summary.integrity.exportCounts.discography}`,
    `- **show_on_home:** ${summary.integrity.showOnHome}`,
    `- **Build after export:** ${summary.buildSuccess ? "success" : "failed"}`,
    `- **Supabase writes:** none`,
    "",
  ].join("\n");

  let content = fs.readFileSync(reportPath, "utf8");
  const marker = "## Supabase JSON export (Phase 3-K)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(reportPath, content, "utf8");
}

/**
 * @param {string} toolRoot
 */
export function loadExportEnv(toolRoot) {
  const envPath = path.join(path.resolve(toolRoot), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `.env.local not found: ${envPath}\n` +
        "Copy .env.example and set staging credentials:\n" +
        "  cp tools/static-to-astro/.env.example tools/static-to-astro/.env.local",
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

  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((key) => !(key in raw));
  if (missing.length > 0) {
    throw new Error(
      `.env.local is missing required keys:\n${missing.map((key) => `  - ${key}`).join("\n")}`,
    );
  }

  return preflightApplyEnv(raw);
}
