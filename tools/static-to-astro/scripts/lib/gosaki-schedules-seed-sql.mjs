/**
 * G-9c / G-9c0c — Generate Gosaki schedule seed SQL from Wix fixture extractor (no DB).
 */

import { extractAllGosakiScheduleSeeds } from "./gosaki-wix-schedule-extractor.mjs";

/** Canonical CMS Kit month route prefix for seed source_route validation. */
export const GOSAKI_CANONICAL_SOURCE_ROUTE_PREFIX = "/schedule/";

/** Legacy Wix root month route — must not appear in seed source_route. */
export const GOSAKI_LEGACY_SOURCE_ROUTE_RE = /'\/\d{4}-\d{2}\/'/;

/** Staging G-6 PoC rows — global UNIQUE(legacy_id) collision risk with Gosaki seed. */
export const GOSAKI_SEED_LEGACY_ID_COLLISIONS = [
  {
    legacy_id: "schedule-2026-07-010",
    poc_note: "G-6 staging write PoC row id aa440e29-5be8-402e-9190-0d81c48434c0",
  },
];

/**
 * @param {string | null | undefined} value
 */
export function sqlStringLiteral(value) {
  if (value == null || value === "") return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * @param {boolean | null | undefined} value
 */
export function sqlBooleanLiteral(value) {
  if (value == null) return "null";
  return value ? "true" : "false";
}

/**
 * @param {number | null | undefined} value
 */
export function sqlNumberLiteral(value) {
  if (value == null || Number.isNaN(value)) return "null";
  return String(value);
}

/**
 * @param {ReturnType<typeof extractAllGosakiScheduleSeeds>["schedules"][number]} row
 */
export function buildScheduleInsertRow(row) {
  const columns = [
    "legacy_id",
    "site_slug",
    "date",
    "year",
    "month",
    "title",
    "venue",
    "open_time",
    "start_time",
    "price",
    "description",
    "image_url",
    "source_file",
    "source_route",
    "show_on_home",
    "home_order",
    "published",
    "sort_order",
  ];

  const values = [
    sqlStringLiteral(row.legacy_id),
    sqlStringLiteral(row.site_slug),
    sqlStringLiteral(row.date),
    sqlNumberLiteral(row.year),
    sqlStringLiteral(row.month),
    sqlStringLiteral(row.title),
    sqlStringLiteral(row.venue),
    sqlStringLiteral(row.open_time),
    sqlStringLiteral(row.start_time),
    sqlStringLiteral(row.price),
    sqlStringLiteral(row.description),
    sqlStringLiteral(row.image_url),
    sqlStringLiteral(row.source_file),
    sqlStringLiteral(row.source_route),
    sqlBooleanLiteral(false),
    "null",
    sqlBooleanLiteral(row.published ?? true),
    sqlNumberLiteral(row.sort_order),
  ];

  return `insert into public.schedules (${columns.join(", ")}) values (${values.join(", ")});`;
}

/**
 * @param {string} inputDir
 * @param {{ headerComment?: string }} [options]
 */
export function generateGosakiSchedulesSeedSql(inputDir, options = {}) {
  const result = extractAllGosakiScheduleSeeds(inputDir);
  const header =
    options.headerComment ??
    `-- G-9c0c Gosaki schedule seed SQL template (canonical source_route)
-- TEMPLATE ONLY — DO NOT EXECUTE from Cursor / CI
-- Project: static-to-astro-cms-staging (operator manual SQL Editor only)
-- Generated from fixtures via extractAllGosakiScheduleSeeds — ${result.schedules.length} rows
-- site_slug: ${result.site_slug}
-- source_route: /schedule/YYYY-MM/ (canonical — not legacy /YYYY-MM/)
`;

  const body = result.schedules
    .slice()
    .sort((a, b) => {
      const byDate = String(a.date).localeCompare(String(b.date));
      if (byDate !== 0) return byDate;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((row) => {
      const collision = GOSAKI_SEED_LEGACY_ID_COLLISIONS.find((c) => c.legacy_id === row.legacy_id);
      const warning = collision
        ? `-- COLLISION WARNING: legacy_id ${row.legacy_id} conflicts with existing G-6 PoC row (${collision.poc_note}).\n-- Resolve before execution: rename PoC legacy_id to schedule-2026-07-010-poc (operator approval).\n-- See gosaki-schedule-seed-sql-planning.md §8.\n`
        : "";
      return `${warning}-- ${row.legacy_id} ${row.date ?? "?"} ${row.source_route}\n${buildScheduleInsertRow(row)}`;
    })
    .join("\n\n");

  return {
    sql: `${header}\nbegin;\n\n${body}\n\ncommit;\n`,
    result,
  };
}
