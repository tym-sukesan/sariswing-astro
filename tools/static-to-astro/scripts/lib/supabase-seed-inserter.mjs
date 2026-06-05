/**
 * supabase-seed-inserter.mjs
 *
 * Staging Supabase への seed 投入ライブラリ（Phase 3-J）。
 * dry-run では Supabase に接続しない。--apply 時のみ upsert する。
 *
 * カラム設計は schema-draft.sql および seed JSON に合わせる。
 */

import fs from "node:fs";
import path from "node:path";

/** @typedef {{ valid: boolean, errors: string[], warnings: string[] }} ValidationResult */

/** @typedef {{ table: string, total: number, inserted: number, deleted?: number, errors: string[] }} InsertResult */

const SEED_FILES = {
  scheduleMonths: "seed-schedule-months.json",
  schedules: "seed-schedules.json",
  discography: "seed-discography.json",
  discographyTracks: "seed-discography-tracks.json",
};

const UPSERT_CONFLICT = {
  schedule_months: "month",
  schedules: "legacy_id",
  discography: "legacy_id",
};

/** Post-apply verification SQL (staging SQL Editor). Column names match current seed/schema. */
export const POST_APPLY_VERIFICATION_SQL = `-- Row counts
SELECT 'schedule_months' AS tbl, COUNT(*) FROM schedule_months
UNION ALL
SELECT 'schedules', COUNT(*) FROM schedules
UNION ALL
SELECT 'discography', COUNT(*) FROM discography
UNION ALL
SELECT 'discography_tracks', COUNT(*) FROM discography_tracks;

-- Home display
SELECT legacy_id, title, show_on_home, home_order
FROM schedules
WHERE show_on_home = true
ORDER BY home_order;

-- Orphan schedules (month not in schedule_months)
SELECT s.legacy_id, s.title, s.month
FROM schedules s
LEFT JOIN schedule_months m ON s.month = m.month
WHERE m.month IS NULL;

-- Orphan tracks (discography_legacy_id not in discography)
SELECT t.discography_legacy_id, t.track_number, t.title
FROM discography_tracks t
LEFT JOIN discography d ON t.discography_legacy_id = d.legacy_id
WHERE d.legacy_id IS NULL;

-- Published flags
SELECT published, COUNT(*) FROM schedules GROUP BY published;
SELECT published, COUNT(*) FROM discography GROUP BY published;`;

/**
 * Normalize and validate staging credentials (--apply preflight).
 * @param {{ SUPABASE_URL?: string, SUPABASE_SERVICE_ROLE_KEY?: string }} raw
 * @returns {{ supabaseUrl: string, serviceRoleKey: string }}
 */
export function preflightApplyEnv(raw) {
  const errors = [];

  const supabaseUrl = (raw.SUPABASE_URL ?? "").trim();
  const serviceRoleKey = (raw.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl) {
    errors.push("SUPABASE_URL is empty");
  } else if (!supabaseUrl.startsWith("https://")) {
    errors.push('SUPABASE_URL must start with "https://"');
  }

  if (!serviceRoleKey) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is empty");
  }

  if (supabaseUrl && /prod|production/i.test(supabaseUrl)) {
    errors.push(
      'SUPABASE_URL contains "prod" or "production". Use a staging-only project URL.',
    );
  }

  if (errors.length > 0) {
    throw new Error(`Apply preflight failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

/**
 * @param {string} schemaDraftPath
 */
export function analyzeSchemaDraft(schemaDraftPath) {
  if (!fs.existsSync(schemaDraftPath)) {
    return {
      found: false,
      hasDropTable: false,
      uniqueConstraints: {
        schedule_months_month: false,
        schedules_legacy_id: false,
        discography_legacy_id: false,
        discography_tracks_composite: false,
      },
      warnings: ["schema-draft.sql not found"],
    };
  }

  const sql = fs.readFileSync(schemaDraftPath, "utf8");
  const hasDropTable = /\bdrop\s+table\b/i.test(sql);

  const tracksTableMatch = sql.match(
    /create\s+table\s+if\s+not\s+exists\s+discography_tracks\s*\(([\s\S]*?)\);/i,
  );
  const tracksTableBody = tracksTableMatch?.[1] ?? "";

  const uniqueConstraints = {
    schedule_months_month: /\bmonth\s+text\s+unique\b/i.test(sql),
    schedules_legacy_id: /create\s+table\s+if\s+not\s+exists\s+schedules[\s\S]*?\blegacy_id\s+text\s+unique\b/i.test(
      sql,
    ),
    discography_legacy_id:
      /create\s+table\s+if\s+not\s+exists\s+discography[\s\S]*?\blegacy_id\s+text\s+unique\b/i.test(sql),
    discography_tracks_composite:
      /\bunique\b/i.test(tracksTableBody) &&
      /discography_legacy_id/i.test(tracksTableBody) &&
      /track_number/i.test(tracksTableBody),
  };

  const warnings = [];
  if (hasDropTable) {
    warnings.push('schema-draft.sql contains "DROP TABLE" — review before applying');
  }
  if (!uniqueConstraints.schedule_months_month) {
    warnings.push("schedule_months.month UNIQUE not detected — upsert on month may fail");
  }
  if (!uniqueConstraints.schedules_legacy_id) {
    warnings.push("schedules.legacy_id UNIQUE not detected — upsert may fail");
  }
  if (!uniqueConstraints.discography_legacy_id) {
    warnings.push("discography.legacy_id UNIQUE not detected — upsert may fail");
  }

  return { found: true, hasDropTable, uniqueConstraints, warnings };
}

/** Throws if @supabase/supabase-js is not installed (--apply preflight). */
export async function assertSupabaseJsAvailable() {
  try {
    await import("@supabase/supabase-js");
  } catch {
    throw new Error(
      "@supabase/supabase-js is not installed.\n" +
        "From tools/static-to-astro/ run:\n" +
        "  npm install @supabase/supabase-js",
    );
  }
}

/**
 * @param {string} seedDir
 */
export function loadSeedFiles(seedDir) {
  const abs = path.resolve(seedDir);
  const missing = Object.values(SEED_FILES).filter(
    (file) => !fs.existsSync(path.join(abs, file)),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing seed files in ${abs}:\n${missing.map((f) => `  - ${f}`).join("\n")}\n` +
        "Run generate-supabase-seed.mjs first.",
    );
  }

  return {
    seedDir: abs,
    scheduleMonths: JSON.parse(
      fs.readFileSync(path.join(abs, SEED_FILES.scheduleMonths), "utf8"),
    ),
    schedules: JSON.parse(fs.readFileSync(path.join(abs, SEED_FILES.schedules), "utf8")),
    discography: JSON.parse(fs.readFileSync(path.join(abs, SEED_FILES.discography), "utf8")),
    discographyTracks: JSON.parse(
      fs.readFileSync(path.join(abs, SEED_FILES.discographyTracks), "utf8"),
    ),
  };
}

/**
 * @param {string} seedDir
 */
export function resolveSchemaDraftPath(seedDir) {
  return path.join(path.resolve(seedDir), "schema-draft.sql");
}

function validateScheduleMonths(records) {
  const errors = [];
  const seenMonths = new Set();

  records.forEach((row, index) => {
    const prefix = `schedule_months[${index}]`;
    if (!row.month) errors.push(`${prefix}: month is required`);
    if (!row.label) errors.push(`${prefix}: label is required`);
    if (!row.route) errors.push(`${prefix}: route is required`);

    if (row.month) {
      if (seenMonths.has(row.month)) {
        errors.push(`${prefix}: duplicate month "${row.month}"`);
      }
      seenMonths.add(row.month);
    }
  });

  return errors;
}

function validateSchedules(records) {
  const errors = [];
  const seenLegacyIds = new Set();

  records.forEach((row, index) => {
    const prefix = `schedules[${index}]`;
    if (!row.legacy_id) errors.push(`${prefix}: legacy_id is required`);
    if (!row.date) errors.push(`${prefix}: date is required (NOT NULL in schema)`);
    if (!row.month) errors.push(`${prefix}: month is required (references schedule_months.month)`);

    if (row.legacy_id) {
      if (seenLegacyIds.has(row.legacy_id)) {
        errors.push(`${prefix}: duplicate legacy_id "${row.legacy_id}"`);
      }
      seenLegacyIds.add(row.legacy_id);
    }
  });

  return errors;
}

function validateDiscography(records) {
  const errors = [];
  const seenLegacyIds = new Set();

  records.forEach((row, index) => {
    const prefix = `discography[${index}]`;
    if (!row.legacy_id) errors.push(`${prefix}: legacy_id is required`);
    if (!row.title) errors.push(`${prefix}: title is required`);

    if (row.legacy_id) {
      if (seenLegacyIds.has(row.legacy_id)) {
        errors.push(`${prefix}: duplicate legacy_id "${row.legacy_id}"`);
      }
      seenLegacyIds.add(row.legacy_id);
    }
  });

  return errors;
}

function validateDiscographyTracks(records) {
  const errors = [];
  const seenKeys = new Set();

  records.forEach((row, index) => {
    const prefix = `discography_tracks[${index}]`;
    if (!row.discography_legacy_id) {
      errors.push(`${prefix}: discography_legacy_id is required`);
    }
    if (row.track_number == null || row.track_number === "") {
      errors.push(`${prefix}: track_number is required`);
    }
    if (!row.title) errors.push(`${prefix}: title is required`);

    if (row.discography_legacy_id && row.track_number != null) {
      const key = `${row.discography_legacy_id}#${row.track_number}`;
      if (seenKeys.has(key)) {
        errors.push(`${prefix}: duplicate discography_legacy_id + track_number "${key}"`);
      }
      seenKeys.add(key);
    }
  });

  return errors;
}

/**
 * @param {{ scheduleMonths: object[], schedules: object[], discography: object[], discographyTracks: object[] }} seedData
 * @returns {ValidationResult}
 */
export function validateSeedData(seedData) {
  const errors = [
    ...validateScheduleMonths(seedData.scheduleMonths),
    ...validateSchedules(seedData.schedules),
    ...validateDiscography(seedData.discography),
    ...validateDiscographyTracks(seedData.discographyTracks),
  ];

  const warnings = [];
  if (!fs.existsSync(resolveSchemaDraftPath(seedData.seedDir ?? "."))) {
    warnings.push("schema-draft.sql not found in seed directory");
  }

  return { valid: errors.length === 0, errors, warnings };
}

function classifyImageUrl(url) {
  if (!url) return null;
  if (/wixstatic\.com|wix\.com/i.test(url)) return "wix";
  if (/supabase/i.test(url)) return "supabase";
  return "other";
}

/**
 * @param {{ scheduleMonths: object[], schedules: object[], discography: object[], discographyTracks: object[] }} seedData
 */
export function buildDryRunSummary(seedData) {
  const { scheduleMonths, schedules, discography, discographyTracks } = seedData;

  const monthKeys = new Set(scheduleMonths.map((row) => row.month));
  const orphanSchedules = schedules.filter((row) => !monthKeys.has(row.month));

  const albumKeys = new Set(discography.map((row) => row.legacy_id));
  const orphanTracks = discographyTracks.filter(
    (row) => !albumKeys.has(row.discography_legacy_id),
  );

  const homeSchedules = schedules.filter((row) => row.show_on_home);

  const imageCounts = { total: 0, wix: 0, supabase: 0, other: 0, null: 0 };
  const imageFields = [];

  for (const row of schedules) {
    if (row.image_url) imageFields.push({ field: "image_url", url: row.image_url });
    else imageCounts.null += 1;
    if (row.home_image_url) imageFields.push({ field: "home_image_url", url: row.home_image_url });
  }
  for (const row of discography) {
    if (row.cover_image_url) {
      imageFields.push({ field: "cover_image_url", url: row.cover_image_url });
    }
  }

  for (const item of imageFields) {
    imageCounts.total += 1;
    const kind = classifyImageUrl(item.url);
    if (kind) imageCounts[kind] += 1;
  }

  return {
    tables: [
      { name: "schedule_months", count: scheduleMonths.length },
      { name: "schedules", count: schedules.length },
      { name: "discography", count: discography.length },
      { name: "discography_tracks", count: discographyTracks.length },
    ],
    totalRecords:
      scheduleMonths.length +
      schedules.length +
      discography.length +
      discographyTracks.length,
    orphanSchedules: orphanSchedules.length,
    orphanTracks: orphanTracks.length,
    homeSchedules: homeSchedules.length,
    schedulesMissingDate: schedules.filter((row) => !row.date).length,
    imageUrls: imageCounts,
    upsertKeys: {
      schedule_months: UPSERT_CONFLICT.schedule_months,
      schedules: UPSERT_CONFLICT.schedules,
      discography: UPSERT_CONFLICT.discography,
      discography_tracks:
        "delete-by-discography_legacy_id + insert (no unique constraint in schema-draft.sql)",
    },
  };
}

async function createSupabaseClient(supabaseUrl, serviceRoleKey) {
  await assertSupabaseJsAvailable();
  const { createClient } = await import("@supabase/supabase-js");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} table
 * @param {object[]} records
 * @param {string} onConflict
 * @returns {Promise<InsertResult>}
 */
async function upsertTable(supabase, table, records, onConflict) {
  const result = { table, total: records.length, inserted: 0, errors: [] };
  const batchSize = 100;

  for (let offset = 0; offset < records.length; offset += batchSize) {
    const batch = records.slice(offset, offset + batchSize);
    const { error, count } = await supabase
      .from(table)
      .upsert(batch, { onConflict, count: "exact" });

    if (error) {
      result.errors.push(`batch[${offset}..${offset + batch.length - 1}]: ${error.message}`);
    } else {
      result.inserted += count ?? batch.length;
    }
  }

  return result;
}

/**
 * schema-draft.sql には (discography_legacy_id, track_number) の UNIQUE が無いため、
 * 対象アルバムの既存行を削除してから insert する。
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object[]} records
 * @returns {Promise<InsertResult>}
 */
async function replaceDiscographyTracks(supabase, records) {
  const result = { table: "discography_tracks", total: records.length, inserted: 0, deleted: 0, errors: [] };
  const albumIds = [...new Set(records.map((row) => row.discography_legacy_id))];

  if (albumIds.length > 0) {
    const { error: deleteError, count: deleteCount } = await supabase
      .from("discography_tracks")
      .delete({ count: "exact" })
      .in("discography_legacy_id", albumIds);

    if (deleteError) {
      result.errors.push(`delete: ${deleteError.message}`);
      return result;
    }
    result.deleted = deleteCount ?? 0;
  }

  const batchSize = 100;
  for (let offset = 0; offset < records.length; offset += batchSize) {
    const batch = records.slice(offset, offset + batchSize);
    const { error, count } = await supabase.from("discography_tracks").insert(batch, { count: "exact" });

    if (error) {
      result.errors.push(`insert batch[${offset}..${offset + batch.length - 1}]: ${error.message}`);
    } else {
      result.inserted += count ?? batch.length;
    }
  }

  return result;
}

/**
 * @param {{ scheduleMonths: object[], schedules: object[], discography: object[], discographyTracks: object[] }} seedData
 * @param {{ supabaseUrl: string, serviceRoleKey: string }} env
 * @returns {Promise<InsertResult[]>}
 */
export async function insertToSupabase(seedData, env) {
  const supabase = await createSupabaseClient(env.supabaseUrl, env.serviceRoleKey);
  const results = [];

  results.push(
    await upsertTable(
      supabase,
      "schedule_months",
      seedData.scheduleMonths,
      UPSERT_CONFLICT.schedule_months,
    ),
  );
  results.push(
    await upsertTable(supabase, "schedules", seedData.schedules, UPSERT_CONFLICT.schedules),
  );
  results.push(
    await upsertTable(supabase, "discography", seedData.discography, UPSERT_CONFLICT.discography),
  );
  results.push(await replaceDiscographyTracks(supabase, seedData.discographyTracks));

  return results;
}
