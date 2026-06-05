import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const IMAGE_FIELDS = [
  "image",
  "image_url",
  "home_image",
  "flyer_image_url",
  "cover_image",
  "cover_image_url",
  "home_image_url",
  "og_image",
];

export const DEFAULT_BUCKET = "site-assets";

const INPUT_SPECS = [
  { file: "schedules.json", dir: "data", table: "schedules", idField: "id" },
  { file: "discography.json", dir: "data", table: "discography", idField: "id" },
  { file: "seed-schedules.json", dir: "seed", table: "schedules", idField: "legacy_id" },
  { file: "seed-discography.json", dir: "seed", table: "discography", idField: "legacy_id" },
];

/**
 * @param {string | null | undefined} url
 */
export function classifyImageUrl(url) {
  if (url == null || url === "") return "null";
  const trimmed = String(url).trim();
  if (!trimmed) return "null";
  if (/^https?:\/\/(static\.)?wixstatic\.com/i.test(trimmed)) return "wix_url";
  if (/^https?:\/\/static\.parastorage\.com/i.test(trimmed)) return "wix_url";
  if (/^https?:\/\//i.test(trimmed)) return "external_url";
  if (trimmed.startsWith("/") || !trimmed.includes("://")) return "local_path";
  return "unknown";
}

/**
 * @param {string} url
 */
export function guessExtension(url) {
  try {
    const u = new URL(url, "https://example.invalid");
    const base = path.basename(u.pathname).split("?")[0];
    const m = base.match(/(\.[a-zA-Z0-9]{2,5})$/);
    if (m) return { ext: m[1].toLowerCase(), guessed: false };
  } catch {
    /* relative path */
    const m = url.match(/(\.[a-zA-Z0-9]{2,5})(?:\?|$)/);
    if (m) return { ext: m[1].toLowerCase(), guessed: false };
  }
  return { ext: ".jpg", guessed: true };
}

/**
 * @param {object} params
 */
export function buildStorageTargetPath({ field, legacyId, month, url }) {
  const { ext, guessed } = guessExtension(url ?? "");
  const notes = guessed ? ["extension guessed"] : [];
  const id = legacyId ?? "unknown";

  if (field === "home_image" || field === "home_image_url") {
    return {
      target_bucket: DEFAULT_BUCKET,
      target_path: `gosaki/home/${id}${ext}`,
      notes,
    };
  }
  if (field === "cover_image" || field === "cover_image_url") {
    return {
      target_bucket: DEFAULT_BUCKET,
      target_path: `gosaki/discography/${id}${ext}`,
      notes,
    };
  }
  const monthSlug = month ?? "unknown-month";
  return {
    target_bucket: DEFAULT_BUCKET,
    target_path: `gosaki/schedules/${monthSlug}/${id}${ext}`,
    notes,
  };
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return { present: false, path: filePath, data: null };
  }
  return { present: true, path: filePath, data: JSON.parse(fs.readFileSync(filePath, "utf8")) };
}

/**
 * @param {object} row
 * @param {string} idField
 */
function rowLegacyId(row, idField) {
  return row[idField] ?? row.id ?? row.legacy_id ?? null;
}

/**
 * @param {object} params
 */
export function collectImageEntries({ dataDir, seedDir }) {
  const entries = [];
  const missingFiles = [];

  for (const spec of INPUT_SPECS) {
    const baseDir = spec.dir === "data" ? dataDir : seedDir;
    const filePath = path.join(baseDir, spec.file);
    const file = readJsonIfExists(filePath);
    if (!file.present) {
      missingFiles.push(filePath);
      continue;
    }
    const rows = Array.isArray(file.data) ? file.data : [];

    for (const row of rows) {
      const legacyId = rowLegacyId(row, spec.idField);
      const month = row.month ?? null;

      for (const field of IMAGE_FIELDS) {
        if (!(field in row)) continue;
        const value = row[field];
        const sourceType = classifyImageUrl(value);

        const { target_bucket, target_path, notes } =
          value && sourceType !== "null"
            ? buildStorageTargetPath({ field, legacyId, month, url: value })
            : { target_bucket: DEFAULT_BUCKET, target_path: null, notes: [] };

        entries.push({
          source_url: value ?? null,
          source_type: sourceType,
          source_file: spec.file,
          source_field: field,
          related_table: spec.table,
          legacy_id: legacyId,
          month,
          target_bucket,
          target_path,
          target_public_url: null,
          downloaded: false,
          local_file: null,
          notes: [...notes],
        });
      }
    }
  }

  return { entries, missingFiles };
}

/**
 * @param {Array<object>} entries with actual URLs
 */
export function buildRewritePlan(entries) {
  /** @type {Record<string, Array<object>>} */
  const plan = {};

  for (const e of entries) {
    if (!e.source_url || e.source_type === "null") continue;
    if (!e.source_file.startsWith("seed-")) continue;

    const field =
      e.source_field === "cover_image"
        ? "cover_image_url"
        : e.source_field === "image"
          ? "image_url"
          : e.source_field === "home_image"
            ? "home_image_url"
            : e.source_field;

    if (!plan[e.source_file]) plan[e.source_file] = [];
    plan[e.source_file].push({
      legacy_id: e.legacy_id,
      field,
      from: e.source_url,
      to_storage_path: e.target_path,
    });
  }

  return plan;
}

function urlDedupeKey(url) {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

/**
 * @param {Array<object>} entries
 * @param {string} downloadsDir
 */
export async function downloadAssets(entries, downloadsDir) {
  fs.mkdirSync(downloadsDir, { recursive: true });
  const fetched = new Map();
  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    if (!entry.source_url || entry.source_type === "null" || entry.source_type === "local_path") {
      continue;
    }

    const key = entry.source_url;
    if (fetched.has(key)) {
      entry.downloaded = true;
      entry.local_file = fetched.get(key).local_file;
      entry.notes.push("deduplicated download");
      continue;
    }

    const relPath = entry.target_path ?? `gosaki/misc/${urlDedupeKey(entry.source_url)}.jpg`;
    const localFile = path.join(downloadsDir, relPath);
    fs.mkdirSync(path.dirname(localFile), { recursive: true });

    try {
      const res = await fetch(entry.source_url, {
        headers: { "User-Agent": "static-to-astro/Phase-3-F" },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(localFile, buf);
      entry.downloaded = true;
      entry.local_file = path.relative(path.dirname(downloadsDir), localFile);
      fetched.set(key, { local_file: entry.local_file });
      success += 1;
    } catch (err) {
      entry.downloaded = false;
      entry.notes.push(`download failed: ${err.message}`);
      failed += 1;
    }
  }

  return { success, failed };
}

export function summarizeEntries(entries) {
  const counts = {
    wix_url: 0,
    external_url: 0,
    local_path: 0,
    null: 0,
    missing: 0,
    unknown: 0,
  };
  let withUrl = 0;
  for (const e of entries) {
    counts[e.source_type] = (counts[e.source_type] ?? 0) + 1;
    if (e.source_url && e.source_type !== "null") withUrl += 1;
  }

  const urlMap = new Map();
  for (const e of entries) {
    if (!e.source_url) continue;
    urlMap.set(e.source_url, (urlMap.get(e.source_url) ?? 0) + 1);
  }
  const duplicateUrlCount = [...urlMap.values()].filter((n) => n > 1).reduce((a, n) => a + n, 0);
  const uniqueUrls = urlMap.size;

  const migrationCandidates = entries.filter(
    (e) => e.source_url && ["wix_url", "external_url"].includes(e.source_type),
  );

  return { counts, withUrl, duplicateUrlCount, uniqueUrls, migrationCandidates };
}

export function formatStorageAssetsReport({
  dataDir,
  seedDir,
  outDir,
  missingFiles,
  entries,
  summary,
  rewritePlan,
  downloadRan,
  downloadResult,
}) {
  const migration = summary.migrationCandidates;

  return [
    "# Storage Assets Report",
    "",
    "Generated by static-to-astro (Phase 3-F).",
    "",
    "> **No upload to production Supabase Storage.** Manifest and optional local downloads only.",
    "",
    "## Metadata",
    "",
    `- **Data directory:** \`${dataDir}\``,
    `- **Seed directory:** \`${seedDir}\``,
    `- **Output directory:** \`${outDir}\``,
    `- **Generated at:** ${new Date().toISOString()}`,
    `- **Download executed:** ${downloadRan ? "yes (`--download`)" : "no"}`,
    downloadRan
      ? `- **Download results:** success ${downloadResult.success}, failed ${downloadResult.failed}`
      : "",
    "",
    "## Input files",
    "",
    ...INPUT_SPECS.map((s) => {
      const p = path.join(s.dir === "data" ? dataDir : seedDir, s.file);
      const ok = !missingFiles.includes(p);
      return `- \`${s.file}\`: ${ok ? "loaded" : "**not found**"} (\`${p}\`)`;
    }),
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Image field entries scanned | ${entries.length} |`,
    `| Entries with URL | ${summary.withUrl} |`,
    `| Unique URLs | ${summary.uniqueUrls} |`,
    `| Duplicate URL references | ${summary.duplicateUrlCount} |`,
    `| Storage migration candidates | ${migration.length} |`,
    "",
    "### URL classification (all field scans)",
    "",
    "| Type | Count |",
    "| --- | ---: |",
    ...Object.entries(summary.counts).map(([k, n]) => `| ${k} | ${n} |`),
    "",
    "## Storage target paths (candidates with URL)",
    "",
    "| legacy_id | field | source_type | target_path |",
    "| --- | --- | --- | --- |",
    ...migration.map(
      (e) =>
        `| ${e.legacy_id ?? "—"} | ${e.source_field} | ${e.source_type} | \`${e.target_path}\` |`,
    ),
    "",
    "## URL rewrite plan (seed JSON — not applied automatically)",
    "",
    "See `storage-url-rewrite-plan.json`. After Storage upload, set public URLs to:",
    "`https://{project}.supabase.co/storage/v1/object/public/site-assets/{target_path}`",
    "",
    ...Object.entries(rewritePlan).flatMap(([file, rows]) => [
      `### ${file}`,
      "",
      ...rows.map(
        (r) =>
          `- \`${r.legacy_id}\` \`${r.field}\`: ${r.from.slice(0, 60)}… → \`${r.to_storage_path}\``,
      ),
      "",
    ]),
    "",
    "## Copyright / licensing (manual)",
    "",
    "- [ ] Confirm rights to host Wix-exported images on your own Storage",
    "- [ ] Verify artist/label approval for jacket scans and flyers",
    "- [ ] Do not upload to production until legal review complete",
    "",
    "## Next steps for Supabase Storage upload (Phase 3-G+)",
    "",
    "1. Create bucket `site-assets` (private or public per policy)",
    "2. Upload `downloads/` tree preserving `gosaki/...` paths",
    "3. Apply rewrite plan to seed JSON (manual or scripted)",
    "4. Regenerate Astro data seeds from updated Supabase seeds",
    "",
    "## Phase 3-G suggestions",
    "",
    "- `upload-storage-assets.mjs` with service role (tooling env only)",
    "- Apply rewrite plan to seed JSON with dry-run",
    "- Image optimization / WebP (optional)",
    "- Wire Astro components to Storage public URLs",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function appendStorageAssetsToConversionReport(astroDir, summary) {
  const conversionPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const block = [
    "",
    "## Storage assets (Phase 3-F)",
    "",
    `- **Report:** \`${summary.reportRel}\``,
    `- **Manifest:** \`${summary.manifestRel}\``,
    `- **Image field entries:** ${summary.entriesTotal}`,
    `- **With URL:** ${summary.withUrl}`,
    `- **Wix URL:** ${summary.counts.wix_url ?? 0} | **External:** ${summary.counts.external_url ?? 0} | **Local:** ${summary.counts.local_path ?? 0} | **Null:** ${summary.counts.null ?? 0}`,
    `- **Migration candidates:** ${summary.migrationCount}`,
    `- **Download:** ${summary.downloadRan ? `yes (ok ${summary.downloadSuccess}, fail ${summary.downloadFailed})` : "no"}`,
    `- **Production Storage upload:** not performed`,
    "",
    "### Phase 3-G (planned)",
    "",
    "- Storage upload script (tooling credentials only)",
    "- Apply URL rewrite plan to seed JSON",
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Storage assets (Phase 3-F)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

/**
 * @param {object} params
 */
export async function runStorageAssetsPipeline({
  dataDir,
  seedDir,
  outDir,
  reportPath,
  astroDir,
  download = false,
}) {
  const dataAbs = path.resolve(dataDir);
  const seedAbs = path.resolve(seedDir);
  const outAbs = path.resolve(outDir);
  fs.mkdirSync(outAbs, { recursive: true });

  const { entries, missingFiles } = collectImageEntries({
    dataDir: dataAbs,
    seedDir: seedAbs,
  });

  const summary = summarizeEntries(entries);
  const rewritePlan = buildRewritePlan(entries);

  const manifestPath = path.join(outAbs, "storage-assets-manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  const rewritePath = path.join(outAbs, "storage-url-rewrite-plan.json");
  fs.writeFileSync(rewritePath, `${JSON.stringify(rewritePlan, null, 2)}\n`, "utf8");

  let downloadResult = { success: 0, failed: 0 };
  if (download) {
    downloadResult = await downloadAssets(entries, path.join(outAbs, "downloads"));
    fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
  }

  const reportContent = formatStorageAssetsReport({
    dataDir: dataAbs,
    seedDir: seedAbs,
    outDir: outAbs,
    missingFiles,
    entries,
    summary,
    rewritePlan,
    downloadRan: download,
    downloadResult,
  });

  const reportAbs = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
  fs.writeFileSync(reportAbs, reportContent, "utf8");

  if (astroDir) {
    appendStorageAssetsToConversionReport(path.resolve(astroDir), {
      reportRel: path.relative(path.resolve(astroDir), reportAbs),
      manifestRel: path.relative(path.resolve(astroDir), manifestPath),
      entriesTotal: entries.length,
      withUrl: summary.withUrl,
      counts: summary.counts,
      migrationCount: summary.migrationCandidates.length,
      downloadRan: download,
      downloadSuccess: downloadResult.success,
      downloadFailed: downloadResult.failed,
    });
  }

  return {
    entries,
    summary,
    rewritePlan,
    manifestPath,
    rewritePath,
    reportPath: reportAbs,
    downloadResult,
    downloadRan: download,
  };
}
