#!/usr/bin/env node
/**
 * scripts/wp-schedules-2026.json → Supabase schedules テーブル
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_KEY=... node scripts/import-schedules-to-supabase.mjs --dry-run
 *   SUPABASE_URL=... SUPABASE_KEY=... node scripts/import-schedules-to-supabase.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.join(__dirname, "wp-schedules-2026.json");

/**
 * @param {Record<string, unknown>} record
 */
function toInsertPayload(record) {
  const wpPostId = record.wp_post_id;

  return {
    date: record.date,
    time_type: record.time_type ?? null,
    venue_id: null,
    venue_name: record.venue_name ?? null,
    title: record.title ?? null,
    genre: record.genre ?? null,
    open_time: record.open_time ?? null,
    start_time: record.start_time ?? null,
    price: record.price ?? null,
    members: record.members ?? null,
    reservation_url: record.reservation_url ?? null,
    note: record.note ?? null,
    image_url: record.image_url ?? null,
    is_published: record.is_published ?? true,
    is_special: record.is_special ?? false,
    wp_post_id: wpPostId === null || wpPostId === undefined || wpPostId === "" ? null : Number(wpPostId),
    wp_source_url: record.wp_source_url ?? null,
    import_key: record.import_key,
  };
}

/**
 * @param {string} inputPath
 */
function loadSchedules(inputPath) {
  const raw = fs.readFileSync(inputPath, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error(`Expected JSON array in ${inputPath}`);
  }

  return data;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 */
async function fetchExistingImportKeys(supabase) {
  const { data, error } = await supabase.from("schedules").select("import_key");

  if (error) {
    throw new Error(`Failed to fetch existing import_key values: ${error.message}`);
  }

  return new Set(
    (data ?? [])
      .map((row) => row.import_key)
      .filter((value) => value !== null && value !== undefined && value !== "")
  );
}

/**
 * @param {Array<Record<string, unknown>>} records
 * @param {Set<string>} existingKeys
 */
function partitionRecords(records, existingKeys) {
  /** @type {Array<Record<string, unknown>>} */
  const toInsert = [];
  /** @type {Array<Record<string, unknown>>} */
  const toSkip = [];

  for (const record of records) {
    const importKey = String(record.import_key ?? "");

    if (!importKey) {
      toInsert.push(record);
      continue;
    }

    if (existingKeys.has(importKey)) {
      toSkip.push(record);
      continue;
    }

    toInsert.push(record);
  }

  return { toInsert, toSkip };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {Array<Record<string, unknown>>} payloads
 */
async function insertSchedules(supabase, payloads) {
  if (payloads.length === 0) {
    return { insertCount: 0, errorCount: 0, errors: [] };
  }

  const { error } = await supabase.from("schedules").insert(payloads);

  if (!error) {
    return { insertCount: payloads.length, errorCount: 0, errors: [] };
  }

  console.error(`Batch insert failed: ${error.message}`);
  console.error("Retrying one record at a time to identify failures...\n");

  let insertCount = 0;
  let errorCount = 0;
  /** @type {Array<{ import_key: string, message: string }>} */
  const errors = [];

  for (const payload of payloads) {
    const { error: rowError } = await supabase.from("schedules").insert([payload]);

    if (rowError) {
      errorCount += 1;
      errors.push({
        import_key: String(payload.import_key ?? ""),
        message: rowError.message,
      });
      console.error(`[ERROR] import_key=${payload.import_key}`);
      console.error(`        ${rowError.message}`);
      continue;
    }

    insertCount += 1;
  }

  return { insertCount, errorCount, errors };
}

function printDryRunSummary(totalCount, toInsert, toSkip) {
  console.log("=== Dry Run ===");
  console.log(`総件数: ${totalCount}`);
  console.log(`insert予定件数: ${toInsert.length}`);
  console.log(`skip件数: ${toSkip.length}`);
  console.log("\n先頭3件の insert 予定データ:");

  for (const record of toInsert.slice(0, 3)) {
    console.log(JSON.stringify(toInsertPayload(record), null, 2));
    console.log("---");
  }
}

function printFinalSummary({ totalCount, insertCount, skipCount, errorCount }) {
  console.log("\n=== Import Summary ===");
  console.log(`総件数: ${totalCount}`);
  console.log(`insert件数: ${insertCount}`);
  console.log(`skip件数: ${skipCount}`);
  console.log(`error件数: ${errorCount}`);
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const inputArg = process.argv.find((arg) => arg.endsWith(".json"));
  const inputPath = inputArg ? path.resolve(inputArg) : DEFAULT_INPUT;

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL and SUPABASE_KEY environment variables are required.");
    console.error("\nExample:");
    console.error('  SUPABASE_URL="https://xxxx.supabase.co" SUPABASE_KEY="your-key" node scripts/import-schedules-to-supabase.mjs --dry-run');
    process.exit(1);
  }

  const records = loadSchedules(inputPath);
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Loaded ${records.length} record(s) from ${inputPath}`);
  console.log("Fetching existing import_key values from Supabase...");

  const existingKeys = await fetchExistingImportKeys(supabase);
  console.log(`Found ${existingKeys.size} existing import_key value(s) in schedules.\n`);

  const { toInsert, toSkip } = partitionRecords(records, existingKeys);

  if (isDryRun) {
    printDryRunSummary(records.length, toInsert, toSkip);
    return;
  }

  const payloads = toInsert.map(toInsertPayload);
  console.log(`Inserting ${payloads.length} new record(s)...`);

  const { insertCount, errorCount } = await insertSchedules(supabase, payloads);

  printFinalSummary({
    totalCount: records.length,
    insertCount,
    skipCount: toSkip.length,
    errorCount,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
