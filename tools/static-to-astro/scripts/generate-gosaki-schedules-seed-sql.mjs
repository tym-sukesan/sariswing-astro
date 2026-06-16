#!/usr/bin/env node
/**
 * G-9c0c — Emit Gosaki schedule seed SQL template from Wix fixtures (no DB).
 *
 * Usage:
 *   node scripts/generate-gosaki-schedules-seed-sql.mjs
 *   node scripts/generate-gosaki-schedules-seed-sql.mjs --out scripts/supabase/gosaki-schedules-seed.template.sql
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateGosakiSchedulesSeedSql } from "./lib/gosaki-schedules-seed-sql.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const opts = { inputDir: "fixtures/gosaki-piano", out: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--input-dir") {
      opts.inputDir = argv[++i];
      continue;
    }
    if (arg === "--out") {
      opts.out = argv[++i];
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log(`Usage: node scripts/generate-gosaki-schedules-seed-sql.mjs [--input-dir PATH] [--out FILE]`);
    process.exit(0);
  }

  const inputAbs = path.resolve(TOOL_ROOT, opts.inputDir);
  const { sql, result } = generateGosakiSchedulesSeedSql(inputAbs);

  if (opts.out) {
    const outPath = path.resolve(TOOL_ROOT, opts.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, sql, "utf8");
    console.log(`Wrote ${result.schedules.length} INSERT statements to ${outPath}`);
  } else {
    process.stdout.write(sql);
  }
}

main();
