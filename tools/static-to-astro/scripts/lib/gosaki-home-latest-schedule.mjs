/**
 * Gosaki Home — latest published schedule list.
 * Fills GOSAKI_HOME_SCHEDULE_SLOT. Does not change month/hub generators.
 * Read-only. Uses existing gosaki-schedules.json (Supabase published=true or static-fallback).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOSAKI_HOME_SCHEDULE_SLOT } from "./gosaki-home-stale-this-week-hide.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GOSAKI_HOME_LATEST_SCHEDULE_LIMIT = 4;
export const GOSAKI_HOME_LATEST_SCHEDULE_TEMPLATE_REL =
  "templates/site-extensions/gosaki-piano/GosakiHomeLatestSchedule.astro";
export const GOSAKI_HOME_LATEST_SCHEDULE_LIB_REL =
  "templates/site-extensions/gosaki-piano/gosaki-home-latest-schedule.ts";

/**
 * @param {string} date
 */
function isIsoDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
}

/**
 * Month hub path for a published ISO date. Null when not YYYY-MM-DD.
 * @param {unknown} date
 * @returns {string | null}
 */
export function gosakiHomeScheduleMonthPath(date) {
  const raw = String(date || "");
  if (!isIsoDate(raw)) return null;
  return `/schedule/${raw.slice(0, 7)}/`;
}

/** Stable fragment id. legacy_id first; DB id only when legacy_id is absent. */
export function gosakiScheduleEventAnchorId(row) {
  const legacy = String(row?.legacy_id || row?.legacyId || "").trim();
  if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(legacy)) return legacy;
  const id = String(row?.id || "").trim();
  if (/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) return `event-${id}`;
  return null;
}

/** Month path plus the event fragment. Date is never the anchor. */
export function gosakiHomeScheduleItemPath(row) {
  const month = gosakiHomeScheduleMonthPath(row?.date);
  if (!month) return null;
  const anchor = gosakiScheduleEventAnchorId(row);
  return anchor ? `${month}#${anchor}` : month;
}

/** http(s) flyer only. Empty and other schemes render nothing. */
export function gosakiScheduleImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * Calendar date in Asia/Tokyo (JST), YYYY-MM-DD.
 * @param {Date} [now]
 */
export function gosakiHomeScheduleTodayJst(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Upcoming published events first (date >= today). If none, most recent past.
 * Skips unpublished, hub-only, TBD, and rows without ISO date.
 *
 * @param {unknown[]} schedules
 * @param {{ limit?: number, today?: string }} [options]
 */
export function selectGosakiHomeLatestSchedules(schedules, options = {}) {
  const limit = options.limit ?? GOSAKI_HOME_LATEST_SCHEDULE_LIMIT;
  const today = options.today ?? gosakiHomeScheduleTodayJst();
  const rows = (Array.isArray(schedules) ? schedules : []).filter((row) => {
    const s = /** @type {Record<string, unknown>} */ (row ?? {});
    if (s.published !== true) return false;
    const membership = /** @type {{ kind?: string } | null} */ (s.monthMembership ?? null);
    if (membership?.kind === "hub-only") return false;
    const status = s.dateStatus ?? s.date_status;
    if (status === "tbd") return false;
    return isIsoDate(s.date);
  });

  const byDateAsc = (a, b) => {
    const d = String(a.date || "").localeCompare(String(b.date || ""));
    if (d !== 0) return d;
    return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
  };

  const upcoming = rows.filter((s) => String(s.date) >= today).sort(byDateAsc);
  if (upcoming.length > 0) return upcoming.slice(0, limit);
  return rows.sort((a, b) => byDateAsc(b, a)).slice(0, limit);
}

const ASTRO_ISLAND_OPEN = "<!--$-->";
const ASTRO_ISLAND_CLOSE = "<!--/$-->";
const HOME_SCHEDULE_SECTION_OPEN = '<section id="comp-m8y3dzb6"';

/**
 * Leftover Wix conversion markers `<!--$-->` / `<!--/$-->` are Astro island
 * boundaries. Components placed between them do not render. Strip those
 * markers inside the Home schedule section only.
 *
 * @param {string} html
 */
export function unwrapHomeScheduleSectionAstroIslands(html) {
  const start = html.indexOf(HOME_SCHEDULE_SECTION_OPEN);
  if (start < 0) {
    return html
      .replace(new RegExp(`${escapeRegExp(ASTRO_ISLAND_OPEN)}\\s*(${escapeRegExp(GOSAKI_HOME_SCHEDULE_SLOT)})`, "g"), "$1")
      .replace(new RegExp(`(${escapeRegExp(GOSAKI_HOME_SCHEDULE_SLOT)})\\s*${escapeRegExp(ASTRO_ISLAND_CLOSE)}`, "g"), "$1");
  }
  const sectionStart = html.lastIndexOf("<section", start);
  const sectionEnd = html.indexOf("</section>", start);
  if (sectionStart < 0 || sectionEnd < 0) return html;
  const end = sectionEnd + "</section>".length;
  const section = html.slice(sectionStart, end);
  const cleaned = section.split(ASTRO_ISLAND_OPEN).join("").split(ASTRO_ISLAND_CLOSE).join("");
  let next = html.slice(0, sectionStart) + cleaned + html.slice(end);
  next = next.replace(
    new RegExp(
      `${escapeRegExp(ASTRO_ISLAND_OPEN)}\\s*(<section id="comp-m8y3dzb6"[\\s\\S]*?<\\/section>)\\s*${escapeRegExp(ASTRO_ISLAND_CLOSE)}`,
    ),
    "$1",
  );
  const splitBefore = `${ASTRO_ISLAND_CLOSE}\n<section id="comp-m8y3dzb6"`;
  if (!next.includes(splitBefore)) {
    next = next.replace(
      /(<section id="comp-m8y3dzb6")/,
      `${ASTRO_ISLAND_CLOSE}\n$1`,
    );
    next = next.replace(
      /(<section id="comp-m8y3dzb6"[\s\S]*?<\/section>)/,
      `$1\n${ASTRO_ISLAND_OPEN}`,
    );
  }
  return next;
}

/**
 * @param {string} value
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} pageContent
 */
export function injectGosakiHomeLatestScheduleIntoHomePage(pageContent) {
  const importLine =
    'import GosakiHomeLatestSchedule from "../components/GosakiHomeLatestSchedule.astro";\n';
  let updated = unwrapHomeScheduleSectionAstroIslands(pageContent);
  if (!updated.includes("GosakiHomeLatestSchedule")) {
    updated = updated.replace(/^---\n/m, `---\n${importLine}`);
  }

  const componentTag = "<GosakiHomeLatestSchedule />";
  if (updated.includes(componentTag)) return updated;

  const injected = `\n  ${componentTag}\n${GOSAKI_HOME_SCHEDULE_SLOT}`;
  if (updated.includes(GOSAKI_HOME_SCHEDULE_SLOT)) {
    return updated.replace(GOSAKI_HOME_SCHEDULE_SLOT, injected);
  }
  if (updated.includes("<YouTubeEmbedSection />")) {
    return updated.replace("<YouTubeEmbedSection />", `${componentTag}\n\n  <YouTubeEmbedSection />`);
  }
  return updated;
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ homePagePath?: string }} [options]
 */
export function applyGosakiHomeLatestSchedule(outDir, toolRoot, options = {}) {
  const templatePath = path.join(toolRoot, GOSAKI_HOME_LATEST_SCHEDULE_TEMPLATE_REL);
  const libPath = path.join(toolRoot, GOSAKI_HOME_LATEST_SCHEDULE_LIB_REL);
  if (!fs.existsSync(templatePath) || !fs.existsSync(libPath)) {
    return { applied: false, reason: "home latest schedule template missing", count: 0 };
  }

  const dataPath = path.join(outDir, "src/data/gosaki-schedules.json");
  if (!fs.existsSync(dataPath)) {
    return { applied: false, reason: "gosaki-schedules.json missing", count: 0 };
  }

  const homeRel = options.homePagePath ?? "src/pages/index.astro";
  const homePath = path.join(outDir, homeRel);
  if (!fs.existsSync(homePath)) {
    return { applied: false, reason: `Home page not found: ${homeRel}`, count: 0 };
  }

  let schedules = [];
  try {
    schedules = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  } catch {
    return { applied: false, reason: "gosaki-schedules.json parse error", count: 0 };
  }

  const selected = selectGosakiHomeLatestSchedules(schedules);
  const componentDest = path.join(outDir, "src/components/GosakiHomeLatestSchedule.astro");
  const libDest = path.join(outDir, "src/lib/gosaki-home-latest-schedule.ts");
  fs.mkdirSync(path.dirname(libDest), { recursive: true });
  fs.copyFileSync(templatePath, componentDest);
  fs.copyFileSync(libPath, libDest);

  const homeContent = fs.readFileSync(homePath, "utf8");
  const next = injectGosakiHomeLatestScheduleIntoHomePage(homeContent);
  if (next !== homeContent) {
    fs.writeFileSync(homePath, next, "utf8");
  }

  return {
    applied: true,
    reason: null,
    count: selected.length,
    limit: GOSAKI_HOME_LATEST_SCHEDULE_LIMIT,
    homePagePath: homeRel,
    componentPath: "src/components/GosakiHomeLatestSchedule.astro",
    libPath: "src/lib/gosaki-home-latest-schedule.ts",
  };
}

export { GOSAKI_HOME_SCHEDULE_SLOT };
