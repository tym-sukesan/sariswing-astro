/**
 * Storage upload executor (G-4b).
 * Uploads approvedForStagingUpload entries from allowlist to staging Supabase Storage.
 * DB update is NOT performed — G-4c handles that separately.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSupabaseJsAvailable,
  preflightApplyEnv,
} from "./supabase-seed-inserter.mjs";
import { supabaseHostFromUrl } from "./supabase-json-exporter.mjs";
import { APPROVAL_SCOPE } from "./storage-upload-allowlist-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");

const PRODUCTION_HOST_PATTERNS = [
  /prod/i,
  /production/i,
  /sariswing\.com/i,
  /gosaki-piano\.com/i,
];

const EXT_BY_CONTENT_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * @param {string | null | undefined} envFile
 */
export function loadStagingSupabaseEnv(envFile = null) {
  const envPath = envFile ? path.resolve(envFile) : path.join(TOOL_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `.env.local not found: ${envPath}\n` +
        "Set staging SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in tools/static-to-astro/.env.local",
    );
  }

  /** @type {Record<string, string>} */
  const raw = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    raw[key] = value;
  }

  return {
    ...preflightApplyEnv(raw),
    envPath,
    host: supabaseHostFromUrl(raw.SUPABASE_URL ?? ""),
  };
}

/**
 * @param {string} host
 */
export function assertStagingHost(host) {
  const errors = [];
  for (const pattern of PRODUCTION_HOST_PATTERNS) {
    if (pattern.test(host)) {
      errors.push(`Supabase host "${host}" matches production-like pattern ${pattern}`);
    }
  }
  if (errors.length) {
    throw new Error(`Staging safety check failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}

/**
 * @param {string} allowlistPath
 */
export function loadUploadAllowlist(allowlistPath) {
  const abs = path.resolve(allowlistPath);
  const data = JSON.parse(fs.readFileSync(abs, "utf8"));
  const approved = Array.isArray(data.approvedForStagingUpload)
    ? data.approvedForStagingUpload
    : [];
  return { abs, data, approved };
}

/**
 * @param {string} targetStoragePath
 * @param {string} bucket
 */
export function objectPathFromTargetStoragePath(targetStoragePath, bucket) {
  const raw = String(targetStoragePath ?? "").trim().replace(/^\/+/, "");
  if (raw.startsWith(`${bucket}/`)) {
    return raw.slice(bucket.length + 1);
  }
  return raw;
}

/**
 * @param {string} objectPath e.g. gosaki/discography/discography-001/cover.webp
 * @param {string} ext without dot
 */
export function replaceObjectPathExtension(objectPath, ext) {
  return objectPath.replace(/\.[a-z0-9]+$/i, `.${ext}`);
}

/**
 * @param {string | null | undefined} contentType
 * @param {string} sourceUrl
 */
export function inferContentType(contentType, sourceUrl) {
  const ct = String(contentType ?? "").split(";")[0].trim().toLowerCase();
  if (ct && ct.startsWith("image/")) return ct;
  const lower = sourceUrl.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".gif")) return "image/gif";
  if (lower.includes(".avif")) return "image/avif";
  return "application/octet-stream";
}

/**
 * @param {string} sourceUrl
 */
export async function downloadSourceImage(sourceUrl) {
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "static-to-astro-storage-upload/1.0" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching source image`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = inferContentType(response.headers.get("content-type"), sourceUrl);
  return { buffer, contentType, bytes: buffer.length };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 */
export async function inspectStorageBucket(supabase, bucket) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    throw new Error(`Failed to list buckets: ${error.message}`);
  }
  const match = (data ?? []).find((b) => b.id === bucket || b.name === bucket);
  return {
    exists: Boolean(match),
    public: Boolean(match?.public),
    bucket: match ?? null,
    allBuckets: (data ?? []).map((b) => b.name),
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 * @param {string} objectPath
 */
export async function storageObjectExists(supabase, bucket, objectPath) {
  const parent = path.posix.dirname(objectPath);
  const name = path.posix.basename(objectPath);
  const listPath = parent === "." ? "" : parent;
  const { data, error } = await supabase.storage.from(bucket).list(listPath, {
    limit: 1000,
    search: name,
  });
  if (error) {
    return { exists: false, error: error.message };
  }
  const exists = (data ?? []).some((item) => item.name === name);
  return { exists, error: null };
}

/**
 * @param {string} supabaseUrl
 * @param {string} bucket
 * @param {string} objectPath
 */
export function buildStoragePublicUrl(supabaseUrl, bucket, objectPath) {
  const base = supabaseUrl.replace(/\/+$/, "");
  const encoded = objectPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
async function createSupabaseClient(supabaseUrl, serviceRoleKey) {
  await assertSupabaseJsAvailable();
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * @param {object} item Allowlist entry
 * @returns {"discography" | "schedule"}
 */
export function validateApprovedUploadEntry(item) {
  if (!item.sourceUrl || !item.targetStoragePath || !item.legacyId) {
    throw new Error("Approved entry missing sourceUrl/targetStoragePath/legacyId");
  }
  if (/example\.supabase\.co/i.test(item.sourceUrl)) {
    throw new Error(`Approved entry ${item.legacyId} has placeholder sourceUrl`);
  }

  if (item.assetType === "discography_cover") {
    if (item.targetTable !== "discography" || item.targetColumn !== "cover_image_url") {
      throw new Error(`Discography entry ${item.legacyId} has invalid target table/column`);
    }
    return "discography";
  }

  if (item.assetType === "schedule_home") {
    if (item.targetTable !== "schedules" || item.targetColumn !== "home_image_url") {
      throw new Error(
        `Schedule entry ${item.legacyId} must target schedules.home_image_url only`,
      );
    }
    if (item.legacyId !== "schedule-2026-03-012") {
      throw new Error(
        `Schedule upload limited to schedule-2026-03-012 in G-4f (got ${item.legacyId})`,
      );
    }
    return "schedule";
  }

  throw new Error(
    `Approved entry ${item.legacyId} has unsupported assetType=${item.assetType}`,
  );
}

/**
 * @param {object[]} approved
 * @returns {"discography" | "schedule"}
 */
export function detectUploadProfile(approved) {
  if (!approved.length) return "discography";
  const profiles = new Set(approved.map((item) => validateApprovedUploadEntry(item)));
  if (profiles.size > 1) {
    throw new Error("Allowlist mixes discography and schedule profiles — split uploads");
  }
  return /** @type {"discography" | "schedule"} */ ([...profiles][0]);
}

/**
 * @param {object} item Allowlist entry
 * @param {string} bucket
 */
export function planUploadEntry(item, bucket) {
  const baseObjectPath = objectPathFromTargetStoragePath(item.targetStoragePath, bucket);
  return {
    legacyId: item.legacyId,
    assetType: item.assetType,
    targetTable: item.targetTable,
    targetColumn: item.targetColumn,
    sourceUrl: item.sourceUrl,
    sourceFile: item.sourceFile ?? null,
    allowlistObjectPath: baseObjectPath,
    approvalScope: item.approvalScope ?? APPROVAL_SCOPE,
    copyrightStatus: item.copyrightStatus ?? "needs-owner-confirmation-before-production",
    notes: item.notes ?? "",
  };
}

/**
 * @param {{
 *   allowlistPath: string,
 *   siteSlug: string,
 *   bucket?: string,
 *   apply?: boolean,
 *   overwrite?: boolean,
 *   envFile?: string | null,
 *   createBucket?: boolean,
 * }} opts
 */
export async function runApprovedStorageUpload(opts) {
  const bucket = opts.bucket ?? "site-assets";
  const apply = Boolean(opts.apply);
  const overwrite = Boolean(opts.overwrite);
  const { data: allowlist, approved } = loadUploadAllowlist(opts.allowlistPath);

  if (allowlist.siteSlug && allowlist.siteSlug !== opts.siteSlug) {
    throw new Error(
      `Allowlist siteSlug=${allowlist.siteSlug} does not match --site-slug=${opts.siteSlug}`,
    );
  }

  const skippedNonApproved = {
    needsHumanReview: allowlist.summary?.needsHumanReview ?? allowlist.needsHumanReview?.length ?? 0,
    rejectedOrDeferred:
      allowlist.summary?.rejectedOrDeferred ?? allowlist.rejectedOrDeferred?.length ?? 0,
  };

  /** @type {object} */
  const result = {
    siteSlug: opts.siteSlug,
    mode: apply ? "apply" : "dry-run",
    bucket,
    uploadPerformed: false,
    dbUpdatePerformed: false,
    overwrite,
    allowlistPath: path.resolve(opts.allowlistPath),
    generatedAt: new Date().toISOString(),
    stagingHost: null,
    bucketCheck: null,
    preflight: {
      approvedInput: approved.length,
      skippedNonApproved,
      envLoaded: false,
      stagingSafety: "not-checked",
    },
    summary: {
      approvedInput: approved.length,
      uploaded: 0,
      skippedExisting: 0,
      failed: 0,
      dryRunPlanned: 0,
    },
    uploaded: [],
    skippedExisting: [],
    failed: [],
    dryRunPlanned: [],
  };

  if (!approved.length) {
    result.message = "No approvedForStagingUpload entries in allowlist";
    return result;
  }

  const uploadProfile = detectUploadProfile(approved);
  result.uploadProfile = uploadProfile;

  for (const item of approved) {
    validateApprovedUploadEntry(item);
  }

  let env = null;
  try {
    env = loadStagingSupabaseEnv(opts.envFile ?? null);
    result.preflight.envLoaded = true;
    result.stagingHost = env.host;
    assertStagingHost(env.host);
    result.preflight.stagingSafety = "pass";
  } catch (err) {
    result.preflight.stagingSafety = "failed";
    result.preflight.error = err.message;
    if (apply) throw err;
    result.message = "Dry-run: staging env not available — source URL checks only";
  }

  let supabase = null;
  if (env) {
    supabase = await createSupabaseClient(env.supabaseUrl, env.serviceRoleKey);
    const bucketInfo = await inspectStorageBucket(supabase, bucket);
    result.bucketCheck = {
      bucket,
      exists: bucketInfo.exists,
      public: bucketInfo.public,
      allBuckets: bucketInfo.allBuckets,
    };

    if (!bucketInfo.exists) {
      const sqlPath = "tools/static-to-astro/docs/sql/staging-site-assets-bucket.sql";
      const hint =
        `Bucket "${bucket}" not found on staging Supabase (${env.host}).\n` +
        `Create it on staging only via SQL Editor:\n` +
        `  ${sqlPath}\n` +
        "Or re-run with --create-bucket --apply (staging service role only).";
      if (apply && opts.createBucket) {
        const { error } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
        });
        if (error) {
          throw new Error(`Failed to create bucket "${bucket}": ${error.message}\n${hint}`);
        }
        result.bucketCheck = { bucket, exists: true, public: true, created: true };
      } else if (apply) {
        throw new Error(hint);
      } else {
        result.message = hint;
      }
    } else if (!bucketInfo.public) {
      result.preflight.bucketPublicRead = "warning-not-public";
    } else {
      result.preflight.bucketPublicRead = "ok";
    }
  }

  for (const item of approved) {
    const plan = planUploadEntry(item, bucket);
    try {
      if (!apply) {
        let sourceReachable = null;
        try {
          const head = await fetch(item.sourceUrl, { method: "HEAD", redirect: "follow" });
          sourceReachable = head.ok;
        } catch {
          sourceReachable = false;
        }
        result.dryRunPlanned.push({
          ...plan,
          sourceReachable,
          status: "planned",
        });
        result.summary.dryRunPlanned += 1;
        continue;
      }

      const download = await downloadSourceImage(item.sourceUrl);
      const ext = EXT_BY_CONTENT_TYPE[download.contentType] ?? "bin";
      const resolvedObjectPath =
        ext === "bin"
          ? plan.allowlistObjectPath
          : replaceObjectPathExtension(plan.allowlistObjectPath, ext);

      if (!overwrite) {
        const existing = await storageObjectExists(supabase, bucket, resolvedObjectPath);
        if (existing.exists) {
          const publicUrl = buildStoragePublicUrl(env.supabaseUrl, bucket, resolvedObjectPath);
          const skipped = {
            ...plan,
            storagePath: resolvedObjectPath,
            resolvedStoragePath: resolvedObjectPath,
            publicUrl,
            contentType: download.contentType,
            bytes: null,
            status: "skipped_existing",
            approvalScope: APPROVAL_SCOPE,
            dbUpdatePending: true,
            notes: "Object already exists — skipped (use --overwrite to replace)",
          };
          result.skippedExisting.push(skipped);
          result.summary.skippedExisting += 1;
          continue;
        }
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(resolvedObjectPath, download.buffer, {
          contentType: download.contentType,
          upsert: overwrite,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const publicUrl = buildStoragePublicUrl(env.supabaseUrl, bucket, resolvedObjectPath);
      result.uploaded.push({
        ...plan,
        storagePath: resolvedObjectPath,
        resolvedStoragePath: resolvedObjectPath,
        publicUrl,
        contentType: download.contentType,
        bytes: download.bytes,
        status: "uploaded",
        approvalScope: APPROVAL_SCOPE,
        dbUpdatePending: true,
      });
      result.summary.uploaded += 1;
    } catch (err) {
      result.failed.push({
        ...plan,
        status: "failed",
        error: err.message,
      });
      result.summary.failed += 1;
    }
  }

  if (apply && (result.summary.uploaded > 0 || result.summary.skippedExisting > 0)) {
    result.uploadPerformed = true;
  }

  result.message =
    apply
      ? `Upload apply finished: uploaded=${result.summary.uploaded}, skipped=${result.summary.skippedExisting}, failed=${result.summary.failed}`
      : `Dry-run planned: ${result.summary.dryRunPlanned} entries`;

  return result;
}

/**
 * @param {ReturnType<typeof runApprovedStorageUpload>} uploadResult
 * @param {import('@supabase/supabase-js').SupabaseClient | null} supabase
 */
export async function buildStorageDbUpdatePlan(uploadResult, supabase = null) {
  const profile = uploadResult.uploadProfile ?? detectUploadProfile([
    ...uploadResult.uploaded,
    ...uploadResult.skippedExisting,
  ]);
  const successEntries = [...uploadResult.uploaded, ...uploadResult.skippedExisting];
  /** @type {Record<string, string | null>} */
  const currentByLegacy = {};

  if (supabase && successEntries.length) {
    const legacyIds = successEntries.map((e) => e.legacyId);
    if (profile === "schedule") {
      const { data, error } = await supabase
        .from("schedules")
        .select("legacy_id,home_image_url,image_url")
        .in("legacy_id", legacyIds);
      if (!error && data) {
        for (const row of data) {
          currentByLegacy[row.legacy_id] = row.home_image_url ?? null;
        }
      }
    } else {
      const { data, error } = await supabase
        .from("discography")
        .select("legacy_id,cover_image_url")
        .in("legacy_id", legacyIds);
      if (!error && data) {
        for (const row of data) {
          currentByLegacy[row.legacy_id] = row.cover_image_url ?? null;
        }
      }
    }
  }

  if (profile === "schedule") {
    return {
      siteSlug: uploadResult.siteSlug,
      phase: "G-4g",
      updateAllowed: false,
      dbUpdatePerformed: false,
      targetTable: "schedules",
      targetColumn: "home_image_url",
      generatedAt: new Date().toISOString(),
      notes:
        "DB update not performed in G-4f. Apply home_image_url only in G-4g (staging only). schedules.image_url not included.",
      entries: successEntries.map((entry) => ({
        legacyId: entry.legacyId,
        targetTable: "schedules",
        targetColumn: "home_image_url",
        currentValue: currentByLegacy[entry.legacyId] ?? null,
        newValue: entry.publicUrl ?? null,
        storagePath: entry.storagePath ?? null,
        updateAllowed: false,
        phase: "G-4g",
        approvalScope: APPROVAL_SCOPE,
      })),
      pendingFailed: uploadResult.failed.map((f) => ({
        legacyId: f.legacyId,
        reason: f.error,
        updateAllowed: false,
      })),
    };
  }

  return {
    siteSlug: uploadResult.siteSlug,
    phase: "G-4c",
    updateAllowed: false,
    dbUpdatePerformed: false,
    targetTable: "discography",
    targetColumn: "cover_image_url",
    generatedAt: new Date().toISOString(),
    notes:
      "DB update not performed in G-4b. Apply these updates in G-4c after human review (staging only).",
    entries: successEntries.map((entry) => ({
      legacyId: entry.legacyId,
      targetTable: "discography",
      targetColumn: "cover_image_url",
      currentValue: currentByLegacy[entry.legacyId] ?? null,
      newValue: entry.publicUrl ?? null,
      storagePath: entry.storagePath ?? null,
      updateAllowed: false,
      phase: "G-4c",
      approvalScope: APPROVAL_SCOPE,
    })),
    pendingFailed: uploadResult.failed.map((f) => ({
      legacyId: f.legacyId,
      reason: f.error,
      updateAllowed: false,
    })),
  };
}

/**
 * @param {ReturnType<typeof runApprovedStorageUpload>} result
 * @param {{ reportPath?: string, manifestPath?: string, dbUpdatePlanPath?: string }} [opts]
 */
export function formatStorageUploadReport(result, opts = {}) {
  const profile = result.uploadProfile ?? "discography";
  const isSchedule = profile === "schedule";
  const title = isSchedule ? "Schedule Storage Upload Report (G-4f)" : "Storage Upload Report (G-4b)";
  const dbNote = isSchedule
    ? "> **DB update not performed.** `dbUpdatePerformed: false` — G-4g will update `schedules.home_image_url` for approved legacy_id only."
    : "> **DB update not performed.** `dbUpdatePerformed: false` — G-4c will update `discography.cover_image_url`.";

  const lines = [
    `# ${title}`,
    "",
    `**Mode:** ${result.mode}`,
    `**Profile:** ${profile}`,
    `**Bucket:** ${result.bucket}`,
    `**Staging host:** ${result.stagingHost ?? "(not connected)"}`,
    `**Generated:** ${result.generatedAt}`,
    "",
    dbNote,
    "> Production use permission is **not confirmed**. All uploads are `staging-only` candidates.",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Approved input | ${result.summary.approvedInput} |`,
    `| Uploaded | ${result.summary.uploaded} |`,
    `| Skipped (existing) | ${result.summary.skippedExisting} |`,
    `| Failed | ${result.summary.failed} |`,
    `| Dry-run planned | ${result.summary.dryRunPlanned} |`,
    "",
    "## Bucket / env preflight",
    "",
    "| Check | Result |",
    "| --- | --- |",
    `| Env loaded | ${result.preflight.envLoaded ? "yes" : "no"} |`,
    `| Staging safety | ${result.preflight.stagingSafety} |`,
    `| Bucket exists | ${result.bucketCheck?.exists ? "yes" : result.bucketCheck ? "no" : "not checked"} |`,
    `| Bucket public | ${result.bucketCheck?.public ? "yes" : result.bucketCheck?.exists ? "no/warn" : "n/a"} |`,
    `| Upload performed | **${result.uploadPerformed ? "yes" : "no"}** |`,
    `| DB update performed | **${result.dbUpdatePerformed ? "yes" : "no"}** |`,
    "",
  ];

  if (result.uploaded.length) {
    lines.push("## Uploaded entries", "", "| legacyId | storagePath | publicUrl | bytes |", "| --- | --- | --- | ---: |");
    for (const e of result.uploaded) {
      lines.push(
        `| ${e.legacyId} | ${e.storagePath} | ${e.publicUrl} | ${e.bytes ?? "—"} |`,
      );
    }
    lines.push("");
  }

  if (result.skippedExisting.length) {
    lines.push("## Skipped (existing)", "", "| legacyId | storagePath | publicUrl |", "| --- | --- | --- |");
    for (const e of result.skippedExisting) {
      lines.push(`| ${e.legacyId} | ${e.storagePath} | ${e.publicUrl} |`);
    }
    lines.push("");
  }

  if (result.failed.length) {
    lines.push("## Failed", "", "| legacyId | error |", "| --- | --- |");
    for (const e of result.failed) {
      lines.push(`| ${e.legacyId} | ${e.error} |`);
    }
    lines.push("");
  }

  if (result.dryRunPlanned.length) {
    lines.push("## Dry-run planned", "", "| legacyId | sourceUrl | sourceReachable |", "| --- | --- | --- |");
    for (const e of result.dryRunPlanned) {
      const url = String(e.sourceUrl ?? "").slice(0, 80);
      lines.push(`| ${e.legacyId} | ${url}… | ${e.sourceReachable} |`);
    }
    lines.push("");
  }

  if (isSchedule) {
    lines.push(
      "## G-4g DB update scope (not performed)",
      "",
      "- Table: `schedules`",
      "- Column: `home_image_url` only",
      "- legacy_id: `schedule-2026-03-012` (Golden PODs)",
      "- `schedules.image_url` — **not included**",
      "- `schedule-2026-03-011` — **not included**",
      "- Plan file: `" + (opts.dbUpdatePlanPath ?? "schedule-db-update-plan.json") + "`",
      "",
      "## Not processed in G-4f",
      "",
      "- Deferred / rejected schedule entries — **not uploaded**",
      "- `schedule_flyer` / `image_url` — **not uploaded**",
      "",
    );
  } else {
    lines.push(
      "## G-4c DB update scope (not performed)",
      "",
      "- Table: `discography`",
      "- Column: `cover_image_url`",
      "- legacy_id: `discography-001` … `discography-004`",
      "- Plan file: `" + (opts.dbUpdatePlanPath ?? "storage-db-update-plan.json") + "`",
      "",
      "## Not processed in G-4b",
      "",
      "- Schedule home / flyer images (`needsHumanReview`) — **not uploaded**",
      "- `rejectedOrDeferred` entries — **not uploaded**",
      "",
    );
  }

  lines.push(
    "",
    "## Safety",
    "",
    "- Production / Sariswing production: **not touched**",
    "- FTP deploy: **not performed**",
    "- Secrets: **not included** in this report",
    "- Copyright / production permission: **not confirmed**",
    "",
    "---",
    "",
    result.message ?? "",
    "",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * @param {ReturnType<typeof runApprovedStorageUpload>} result
 */
export function buildUploadResultManifest(result) {
  return {
    siteSlug: result.siteSlug,
    mode: result.mode,
    bucket: result.bucket,
    uploadPerformed: result.uploadPerformed,
    dbUpdatePerformed: false,
    overwrite: result.overwrite,
    stagingHost: result.stagingHost,
    generatedAt: result.generatedAt,
    summary: result.summary,
    uploaded: result.uploaded,
    skippedExisting: result.skippedExisting,
    failed: result.failed,
    dryRunPlanned: result.dryRunPlanned,
  };
}
