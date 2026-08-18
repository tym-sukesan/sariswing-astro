#!/usr/bin/env node
/**
 * gosaki-production-publication-data-live-readonly-check
 *
 * SELECT-only live audit of staging Kit publication-visible rows.
 * Target: kmjqppxjdnwwrtaeqjta only. Never vsbvndwuajjhnzpohghh.
 * Never uses supabase CLI / linked-project.json / service_role.
 * Never logs secret values. Does not write .env.local.
 *
 * Run:
 *   node tools/static-to-astro/scripts/gosaki-production-publication-data-live-readonly-check.mjs
 */

import { createClient } from "@supabase/supabase-js";
import {
  loadGosakiStagingAdminPublicEnv,
  validateGosakiStagingAdminPublicEnv,
  STAGING_PROJECT_REF,
  PRODUCTION_PROJECT_REF,
} from "./lib/gosaki-staging-admin-public-env.mjs";
import {
  evaluateStagingOnlySupabaseTarget,
  isExactStagingSupabaseHostname,
  stringContainsProductionRef,
} from "./lib/supabase-staging-ref-utils.mjs";
import {
  GOSAKI_SITE_KEY,
  resolveSiteCmsFeaturePlan,
  TOOL_ROOT,
} from "./lib/site-registry.mjs";
import { loadSiteEmbedsDataForBuild } from "./lib/site-cms-features.mjs";
import { isFeatureFlagTrimTrue } from "./lib/feature-flag-trim-true-utils.mjs";
import { loadGosakiYoutubeEmbedConfig } from "./lib/gosaki-home-youtube-embed.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const EVENT_B_LEGACY = "schedule-2026-07-010";
const SENTINEL_LEGACY_IDS = ["schedule-2026-09-001", "schedule-2026-03-014"];
const TBD_LEGACY_ID = "schedule-2026-11-001";
const SITE_SLUG = "gosaki-piano";

const SCHEDULE_SELECT =
  "id,legacy_id,site_slug,published,show_on_home,title,venue,open_time,start_time,price,description,date,date_status,updated_at";
const DISCOGRAPHY_SELECT =
  "legacy_id,title,artist,label,description,published,sort_order";
const TRACKS_SELECT = "discography_legacy_id,track_number,title";

const EXPECTED_EVENT_B = {
  title: "<>",
  venue: null,
  open_time: null,
  start_time: null,
  price: null,
  description: "出演：",
  published: true,
  show_on_home: false,
};

let queryCount = 0;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadMergedEnvForAuthKeys() {
  return {
    ...parseEnvFile(path.join(REPO_ROOT, ".env")),
    ...parseEnvFile(path.join(REPO_ROOT, ".env.local")),
    ...parseEnvFile(path.join(TOOL_ROOT, ".env.local")),
    ...process.env,
  };
}

function scanMarkers(value) {
  const text = value == null ? "" : String(value);
  if (!text) return [];
  /** @type {string[]} */
  const hits = [];
  if (/CMS Kit staging/i.test(text)) hits.push("CMS Kit staging");
  if (/PoC/i.test(text)) hits.push("PoC");
  if (/テスト/.test(text)) hits.push("テスト");
  if (/Slice B/i.test(text)) hits.push("Slice B");
  if (/temporary marker/i.test(text)) hits.push("temporary marker");
  if (/G-\d/.test(text)) hits.push("G-{digit}");
  else if (/(^|[^A-Za-z])G-/.test(text)) hits.push("G-");
  return [...new Set(hits)];
}

function scanRowFields(row, fields) {
  /** @type {{ field: string, hits: string[], value: string }[]} */
  const found = [];
  for (const field of fields) {
    const hits = scanMarkers(row[field]);
    if (hits.length) {
      found.push({
        field,
        hits,
        value: String(row[field] ?? ""),
      });
    }
  }
  return found;
}

async function select(label, builder) {
  queryCount += 1;
  const { data, error } = await builder;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return data ?? [];
}

function eventBMatch(row) {
  const checks = {
    title: row.title === EXPECTED_EVENT_B.title,
    venue: row.venue == null,
    open_time: row.open_time == null,
    start_time: row.start_time == null,
    price: row.price == null,
    description: row.description === EXPECTED_EVENT_B.description,
    published: row.published === true,
    show_on_home: row.show_on_home === false,
    site_slug: row.site_slug === SITE_SLUG,
    legacy_id: row.legacy_id === EVENT_B_LEGACY,
  };
  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    mismatches: Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([k]) => k),
  };
}

async function main() {
  const publicEnv = loadGosakiStagingAdminPublicEnv();
  const validation = validateGosakiStagingAdminPublicEnv(publicEnv);
  if (!validation.ok) {
    console.error(
      JSON.stringify(
        {
          STOP: true,
          reason: "staging_anon_env_invalid",
          missing: validation.missing,
          errors: validation.errors,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const host = new URL(url).hostname;
  const targetEval = evaluateStagingOnlySupabaseTarget(url);

  if (stringContainsProductionRef(url) || host.includes(PRODUCTION_PROJECT_REF)) {
    console.error(
      JSON.stringify({
        STOP: true,
        reason: "production_ref_stop",
        host,
      }),
    );
    process.exit(1);
  }
  if (!isExactStagingSupabaseHostname(host) || !targetEval.ok) {
    console.error(
      JSON.stringify({
        STOP: true,
        reason: "staging_ref_required",
        host,
        evalKind: targetEval.kind,
        evalCode: targetEval.code,
        expectedHost: `${STAGING_PROJECT_REF}.supabase.co`,
      }),
    );
    process.exit(1);
  }
  if (/service[_-]?role/i.test(publicEnv.PUBLIC_SUPABASE_ANON_KEY)) {
    console.error(JSON.stringify({ STOP: true, reason: "service_role_key_blocked" }));
    process.exit(1);
  }

  const featurePlan = resolveSiteCmsFeaturePlan(GOSAKI_SITE_KEY, TOOL_ROOT);
  const aboutDbBuildRead =
    featurePlan.supabaseFeatures.sitePageFields === true ||
    isFeatureFlagTrimTrue(process.env.CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ);

  const anonClient = createClient(url, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let scheduleSelect = SCHEDULE_SELECT;
  let eventBRows;
  try {
    eventBRows = await select(
      "event-b",
      anonClient
        .from("schedules")
        .select(scheduleSelect)
        .eq("id", EVENT_B_ID)
        .eq("legacy_id", EVENT_B_LEGACY)
        .eq("site_slug", SITE_SLUG),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/date_status/i.test(msg)) throw err;
    scheduleSelect = SCHEDULE_SELECT.replace(",date_status", "");
    eventBRows = await select(
      "event-b-legacy-select",
      anonClient
        .from("schedules")
        .select(scheduleSelect)
        .eq("id", EVENT_B_ID)
        .eq("legacy_id", EVENT_B_LEGACY)
        .eq("site_slug", SITE_SLUG),
    );
  }

  const publishedScheduleRows = await select(
    "published-schedules",
    anonClient
      .from("schedules")
      .select(scheduleSelect)
      .eq("site_slug", SITE_SLUG)
      .eq("published", true)
      .order("date", { ascending: true }),
  );

  const sentinelAnonRows = await select(
    "sentinel-legacy-ids",
    anonClient
      .from("schedules")
      .select("id,legacy_id,site_slug,published,title,venue,description")
      .eq("site_slug", SITE_SLUG)
      .in("legacy_id", [...SENTINEL_LEGACY_IDS, TBD_LEGACY_ID]),
  );

  const discographyRows = await select(
    "published-discography",
    anonClient
      .from("discography")
      .select(DISCOGRAPHY_SELECT)
      .eq("site_slug", SITE_SLUG)
      .eq("published", true)
      .order("sort_order", { ascending: true }),
  );

  const publishedReleaseIds = discographyRows.map((r) => r.legacy_id).filter(Boolean);
  const trackRows =
    publishedReleaseIds.length === 0
      ? []
      : await select(
          "published-discography-tracks",
          anonClient
            .from("discography_tracks")
            .select(TRACKS_SELECT)
            .eq("site_slug", SITE_SLUG)
            .in("discography_legacy_id", publishedReleaseIds)
            .order("discography_legacy_id", { ascending: true })
            .order("track_number", { ascending: true }),
        );

  const youtubeBundle = await loadSiteEmbedsDataForBuild({
    siteKey: GOSAKI_SITE_KEY,
    toolRoot: TOOL_ROOT,
    env: {
      ...process.env,
      PUBLIC_SUPABASE_URL: url,
      PUBLIC_SUPABASE_ANON_KEY: publicEnv.PUBLIC_SUPABASE_ANON_KEY,
    },
  });
  queryCount += 1;

  const youtubeJson = loadGosakiYoutubeEmbedConfig(TOOL_ROOT);

  const mergedAuth = loadMergedEnvForAuthKeys();
  const adminEmail = String(
    mergedAuth.G9J5_STAGING_ADMIN_EMAIL || mergedAuth.SUPABASE_ADMIN_EMAIL || "",
  ).trim();
  const adminPassword = String(
    mergedAuth.SUPABASE_ADMIN_PASSWORD || mergedAuth.G9J5_STAGING_ADMIN_PASSWORD || "",
  ).trim();
  const authKeysPresent = Boolean(adminEmail && adminPassword);

  /** @type {Record<string, unknown>[] | null} */
  let sentinelAuthRows = null;
  /** @type {string | null} */
  let authReadPath = null;
  /** @type {string | null} */
  let authReadError = null;

  if (authKeysPresent) {
    const authClient = createClient(url, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: session, error: signInError } = await authClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (signInError || !session?.user) {
      authReadError = signInError?.message ?? "signInWithPassword failed";
      authReadPath = "authenticated_sign_in_failed";
    } else {
      authReadPath = "anon_key_plus_signInWithPassword_select";
      sentinelAuthRows = await select(
        "sentinel-authenticated",
        authClient
          .from("schedules")
          .select("id,legacy_id,site_slug,published,title,venue,description")
          .eq("site_slug", SITE_SLUG)
          .in("legacy_id", [...SENTINEL_LEGACY_IDS, TBD_LEGACY_ID]),
      );
      await authClient.auth.signOut();
    }
  } else {
    authReadPath = "skipped_no_staging_admin_credentials";
  }

  const eventB = eventBRows[0] ?? null;
  const eventBRestored = eventB ? eventBMatch(eventB) : { ok: false, checks: {}, mismatches: ["row_missing"] };

  const scheduleFields = ["title", "venue", "open_time", "start_time", "price", "description"];
  const publishedScheduleHits = publishedScheduleRows.flatMap((row) => {
    const hits = scanRowFields(row, scheduleFields);
    return hits.map((h) => ({
      legacy_id: row.legacy_id,
      published: row.published,
      ...h,
    }));
  });

  const discographyHits = [
    ...discographyRows.flatMap((row) =>
      scanRowFields(row, ["title", "artist", "label", "description"]).map((h) => ({
        kind: "release",
        legacy_id: row.legacy_id,
        ...h,
      })),
    ),
    ...trackRows.flatMap((row) =>
      scanRowFields(row, ["title"]).map((h) => ({
        kind: "track",
        legacy_id: row.discography_legacy_id,
        track_number: row.track_number,
        ...h,
      })),
    ),
  ];

  const youtubeRows = Array.isArray(youtubeBundle?.embeds) ? youtubeBundle.embeds : [];
  const youtubeHits = youtubeRows.flatMap((row) =>
    scanRowFields(row, ["title", "source_url", "embed_url"]).map((h) => ({
      kind: "site_embeds",
      id: row.id,
      ...h,
    })),
  );
  const youtubeJsonHits = (youtubeJson.config?.items ?? []).flatMap((item) =>
    scanRowFields(item, ["embedCode", "id"]).map((h) => ({
      kind: "youtube-json",
      id: item.id,
      ...h,
    })),
  );

  const sentinelByLegacy = Object.fromEntries(
    (sentinelAuthRows ?? sentinelAnonRows).map((r) => [r.legacy_id, r]),
  );
  const unpublishedSafe = SENTINEL_LEGACY_IDS.every((id) => {
    if (publishedScheduleRows.some((r) => r.legacy_id === id)) return false;
    const row = sentinelByLegacy[id];
    if (!row) return true;
    return row.published === false;
  });

  const tbdAbsent =
    !publishedScheduleRows.some((r) => r.legacy_id === TBD_LEGACY_ID) &&
    !(sentinelAnonRows ?? []).some((r) => r.legacy_id === TBD_LEGACY_ID) &&
    (sentinelAuthRows == null || !sentinelAuthRows.some((r) => r.legacy_id === TBD_LEGACY_ID));

  const publishedScheduleMarkerCount = publishedScheduleHits.length;
  const discographyMarkerCount = discographyHits.length;

  const passConditions = {
    schedule_2026_07_010_restored: eventBRestored.ok,
    published_schedule_markers_absent: publishedScheduleMarkerCount === 0,
    unpublished_test_rows_safe: unpublishedSafe,
    deleted_tbd_absent: tbdAbsent,
    discography_markers_absent: discographyMarkerCount === 0,
    about_youtube_no_blocker:
      aboutDbBuildRead === false && youtubeHits.length === 0 && youtubeJsonHits.length === 0,
  };

  const blockedByPublishedTestData =
    !passConditions.schedule_2026_07_010_restored ||
    !passConditions.published_schedule_markers_absent ||
    !passConditions.discography_markers_absent ||
    youtubeHits.length > 0;

  let liveCheck;
  if (blockedByPublishedTestData) liveCheck = "BLOCKED_BY_PUBLISHED_TEST_DATA";
  else if (authReadError) liveCheck = "AMBIGUOUS";
  else if (Object.values(passConditions).every(Boolean)) liveCheck = "PASS";
  else liveCheck = "AMBIGUOUS";

  const cleanupRequired = liveCheck === "BLOCKED_BY_PUBLISHED_TEST_DATA";

  const report = {
    phase: "gosaki-production-publication-data-live-readonly-check",
    PUBLICATION_DATA_LIVE_CHECK: liveCheck,
    schedule_2026_07_010_restored: eventBRestored.ok,
    published_schedule_marker_count: publishedScheduleMarkerCount,
    unpublished_test_rows_safe: unpublishedSafe,
    deleted_tbd_absent: tbdAbsent,
    discography_marker_count: discographyMarkerCount,
    PUBLICATION_DATA_CLEANUP_REQUIRED: cleanupRequired,
    passConditions,
    readPath: {
      client: "supabase-js createClient",
      key: "PUBLIC_SUPABASE_ANON_KEY",
      linkedProjectJsonUsed: false,
      serviceRoleUsed: false,
      supabaseCliUsed: false,
      envFilesWritten: false,
      host,
      projectRef: STAGING_PROJECT_REF,
      productionRefTouched: false,
      stagingRefConfirm: `URL hostname exact ${STAGING_PROJECT_REF}.supabase.co via evaluateStagingOnlySupabaseTarget`,
      authReadPath,
      authReadError,
      authKeysPresent,
      queryCount,
    },
    about: {
      registrySitePageFields: featurePlan.supabaseFeatures.sitePageFields,
      envCmsKitSitePageFieldsBuildRead: Boolean(
        process.env.CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ,
      ),
      liveQueryExecuted: aboutDbBuildRead,
      note: aboutDbBuildRead
        ? "About DB build-read is ON — unexpected for this HEAD"
        : "About DB build-read OFF (registry.sitePageFields=false, env flag unset) — JSON SoT; no About live query",
    },
    youtube: {
      registrySiteEmbeds: featurePlan.supabaseFeatures.siteEmbeds,
      bundleDataSource: youtubeBundle?.embedDataSource ?? null,
      bundleFallbackReason: youtubeBundle?.fallbackReason ?? null,
      supabasePublishedRowCount: youtubeRows.length,
      supabaseMarkerHits: youtubeHits,
      jsonMarkerHits: youtubeJsonHits,
      jsonItemCount: youtubeJson.config?.items?.length ?? 0,
    },
    eventB: eventB
      ? {
          ...eventB,
          restored: eventBRestored,
        }
      : { missing: true, restored: eventBRestored },
    publishedScheduleCount: publishedScheduleRows.length,
    publishedScheduleHits,
    sentinelAnonRows,
    sentinelAuthRows,
    discographyPublishedCount: discographyRows.length,
    discographyTrackCount: trackRows.length,
    discographyHits,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(
    JSON.stringify(
      {
        STOP: true,
        reason: "script_error",
        message: err instanceof Error ? err.message : String(err),
        queryCount,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
