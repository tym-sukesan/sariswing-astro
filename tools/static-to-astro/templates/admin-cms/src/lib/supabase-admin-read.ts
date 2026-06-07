/**
 * Server-side read-only Supabase access for Admin UI (Phase 3-L).
 * Import only from Astro frontmatter — never from client scripts.
 * Credentials: process.env.SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY only.
 */

import { createClient } from "@supabase/supabase-js";

export type AdminDataSource = "supabase-direct-read" | "unavailable";

export interface AdminReadMeta {
  dataSource: AdminDataSource;
  host: string | null;
  error: string | null;
  fetchedAt: string | null;
}

export interface AdminScheduleMonth {
  month: string;
  label: string;
  route: string;
  count: number;
  sort_order: number | null;
  published: boolean;
}

export interface AdminScheduleRow {
  legacy_id: string;
  date: string | null;
  month: string | null;
  title: string | null;
  venue: string | null;
  open_time: string | null;
  start_time: string | null;
  price: string | null;
  description: string | null;
  show_on_home: boolean;
  home_order: number | null;
  image_url: string | null;
  home_image_url: string | null;
  published: boolean;
}

export interface AdminDiscographyTrack {
  number: number;
  title: string;
  sort_order: number | null;
}

export interface AdminDiscographyRow {
  legacy_id: string;
  title: string;
  artist: string | null;
  release_date: string | null;
  year: number | null;
  catalog_number: string | null;
  label: string | null;
  description: string | null;
  cover_image_url: string | null;
  purchase_url: string | null;
  streaming_url: string | null;
  published: boolean;
  sort_order: number | null;
  tracks: AdminDiscographyTrack[];
}

export interface AdminCmsBundle {
  meta: AdminReadMeta;
  scheduleMonths: AdminScheduleMonth[];
  schedules: AdminScheduleRow[];
  discography: AdminDiscographyRow[];
  counts: {
    schedule_months: number;
    schedules: number;
    discography: number;
    discography_tracks: number;
    show_on_home: number;
  };
}

const TABLE_SELECTS = {
  schedule_months: "month,label,route,count,sort_order,published",
  schedules:
    "legacy_id,date,month,title,venue,open_time,start_time,price,description,image_url,home_image_url,show_on_home,home_order,published,sort_order",
  discography:
    "legacy_id,title,artist,release_date,year,catalog_number,label,description,cover_image_url,purchase_url,streaming_url,sort_order,published",
  discography_tracks: "discography_legacy_id,track_number,title,sort_order",
} as const;

function hostFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function resolveEnv():
  | { ok: true; supabaseUrl: string; serviceRoleKey: string; host: string }
  | { ok: false; error: string } {
  const supabaseUrl = (process.env.SUPABASE_URL ?? "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      error:
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (set via environment — not read from .env.local in this project).",
    };
  }

  if (!supabaseUrl.startsWith("https://")) {
    return { ok: false, error: 'SUPABASE_URL must start with "https://"' };
  }

  if (/prod|production/i.test(supabaseUrl)) {
    return {
      ok: false,
      error: 'SUPABASE_URL contains "prod" or "production" — staging only.',
    };
  }

  const host = hostFromUrl(supabaseUrl);
  if (!host) {
    return { ok: false, error: "SUPABASE_URL is invalid." };
  }

  return {
    ok: true,
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
    host,
  };
}

function emptyBundle(error: string): AdminCmsBundle {
  return {
    meta: {
      dataSource: "unavailable",
      host: null,
      error,
      fetchedAt: null,
    },
    scheduleMonths: [],
    schedules: [],
    discography: [],
    counts: {
      schedule_months: 0,
      schedules: 0,
      discography: 0,
      discography_tracks: 0,
      show_on_home: 0,
    },
  };
}

function mapScheduleMonths(rows: Record<string, unknown>[]): AdminScheduleMonth[] {
  return [...rows]
    .sort((a, b) => {
      const orderDiff = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(b.month ?? "").localeCompare(String(a.month ?? ""));
    })
    .map((row) => ({
      month: String(row.month),
      label: String(row.label),
      route: String(row.route),
      count: Number(row.count ?? 0),
      sort_order: row.sort_order != null ? Number(row.sort_order) : null,
      published: row.published !== false,
    }));
}

function mapSchedules(rows: Record<string, unknown>[]): AdminScheduleRow[] {
  return [...rows]
    .sort((a, b) => {
      if (a.date !== b.date) return String(a.date ?? "").localeCompare(String(b.date ?? ""));
      const orderDiff = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return String(a.legacy_id ?? "").localeCompare(String(b.legacy_id ?? ""));
    })
    .map((row) => ({
      legacy_id: String(row.legacy_id),
      date: row.date != null ? String(row.date) : null,
      month: row.month != null ? String(row.month) : null,
      title: row.title != null ? String(row.title) : null,
      venue: row.venue != null ? String(row.venue) : null,
      open_time: row.open_time != null ? String(row.open_time) : null,
      start_time: row.start_time != null ? String(row.start_time) : null,
      price: row.price != null ? String(row.price) : null,
      description: row.description != null ? String(row.description) : null,
      show_on_home: Boolean(row.show_on_home),
      home_order: row.home_order != null ? Number(row.home_order) : null,
      image_url: row.image_url != null ? String(row.image_url) : null,
      home_image_url: row.home_image_url != null ? String(row.home_image_url) : null,
      published: row.published !== false,
    }));
}

function mapDiscography(
  rows: Record<string, unknown>[],
  trackRows: Record<string, unknown>[],
): AdminDiscographyRow[] {
  const tracksByAlbum = new Map<string, AdminDiscographyTrack[]>();

  for (const track of trackRows) {
    const albumId = String(track.discography_legacy_id);
    if (!tracksByAlbum.has(albumId)) tracksByAlbum.set(albumId, []);
    tracksByAlbum.get(albumId)!.push({
      number: Number(track.track_number),
      title: String(track.title),
      sort_order: typeof track.sort_order === "number" ? track.sort_order : null,
    });
  }

  for (const tracks of tracksByAlbum.values()) {
    tracks.sort((a, b) => a.number - b.number);
  }

  return [...rows]
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((row) => {
      const legacyId = String(row.legacy_id);
      const title = row.title != null ? String(row.title) : "Untitled";
      return {
        legacy_id: legacyId,
        title,
        artist: row.artist != null ? String(row.artist) : null,
        release_date: row.release_date != null ? String(row.release_date) : null,
        year: typeof row.year === "number" ? row.year : null,
        catalog_number: row.catalog_number != null ? String(row.catalog_number) : null,
        label: row.label != null ? String(row.label) : null,
        description: row.description != null ? String(row.description) : null,
        cover_image_url: row.cover_image_url != null ? String(row.cover_image_url) : null,
        purchase_url: row.purchase_url != null ? String(row.purchase_url) : null,
        streaming_url: row.streaming_url != null ? String(row.streaming_url) : null,
        published: row.published !== false,
        sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
        tracks: tracksByAlbum.get(legacyId) ?? [],
      };
    });
}

/**
 * Read CMS tables from staging Supabase (SELECT only).
 * Runs on the server at build/dev time — credentials stay out of the browser bundle.
 */
export async function fetchAdminCmsData(): Promise<AdminCmsBundle> {
  const env = resolveEnv();
  if (!env.ok) {
    return emptyBundle(env.error);
  }

  const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [monthsRes, schedulesRes, discographyRes, tracksRes] = await Promise.all([
    supabase.from("schedule_months").select(TABLE_SELECTS.schedule_months),
    supabase.from("schedules").select(TABLE_SELECTS.schedules),
    supabase.from("discography").select(TABLE_SELECTS.discography),
    supabase.from("discography_tracks").select(TABLE_SELECTS.discography_tracks),
  ]);

  const errors = [
    monthsRes.error && `schedule_months: ${monthsRes.error.message}`,
    schedulesRes.error && `schedules: ${schedulesRes.error.message}`,
    discographyRes.error && `discography: ${discographyRes.error.message}`,
    tracksRes.error && `discography_tracks: ${tracksRes.error.message}`,
  ].filter(Boolean);

  if (errors.length > 0) {
    return emptyBundle(errors.join("; "));
  }

  const scheduleMonths = mapScheduleMonths((monthsRes.data ?? []) as Record<string, unknown>[]);
  const schedules = mapSchedules((schedulesRes.data ?? []) as Record<string, unknown>[]);
  const trackRows = (tracksRes.data ?? []) as Record<string, unknown>[];
  const discography = mapDiscography(
    (discographyRes.data ?? []) as Record<string, unknown>[],
    trackRows,
  );

  return {
    meta: {
      dataSource: "supabase-direct-read",
      host: env.host,
      error: null,
      fetchedAt: new Date().toISOString(),
    },
    scheduleMonths,
    schedules,
    discography,
    counts: {
      schedule_months: scheduleMonths.length,
      schedules: schedules.length,
      discography: discography.length,
      discography_tracks: trackRows.length,
      show_on_home: schedules.filter((row) => row.show_on_home).length,
    },
  };
}
