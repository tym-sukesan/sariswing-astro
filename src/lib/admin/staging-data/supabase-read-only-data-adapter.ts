/**
 * G-5z-c — Supabase read-only data adapter (staging shell only).
 * Approved fields only. No writes. No select *. No service role.
 */

import type {
  DiscographyReadModel,
  LinkReadModel,
  NewsReadModel,
  ProfileReadModel,
  ReadOnlyDataAdapter,
  ScheduleReadModel,
} from "./read-only-data-adapter.types";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";

/** Approved column lists — musician-basic-supabase-v1 (no select *). */
const PROFILE_SELECT =
  "id,legacy_id,name,bio,image_url" as const;
const SCHEDULE_SELECT =
  "id,legacy_id,date,title,venue,description,home_image_url,published,sort_order" as const;
const DISCOGRAPHY_SELECT =
  "id,legacy_id,title,artist,release_date,cover_image_url,description,sort_order,published" as const;
const LINKS_SELECT =
  "id,legacy_id,label,url,sort_order,published" as const;
const NEWS_SELECT =
  "id,legacy_id,title,body,published_at,published" as const;

const PROFILE_LIMIT = 1;
const LIST_LIMIT = 20;

function rowId(row: { id?: string; legacy_id?: string }, fallback: string): string {
  return String(row.id ?? row.legacy_id ?? fallback);
}

function mapProfileRow(row: Record<string, unknown>): ProfileReadModel {
  return {
    displayName: String(row.name ?? ""),
    bio: row.bio ? String(row.bio) : undefined,
    heroImageUrl: row.image_url ? String(row.image_url) : undefined,
  };
}

function mapScheduleRow(row: Record<string, unknown>): ScheduleReadModel {
  return {
    id: rowId(row, "schedule"),
    title: String(row.title ?? ""),
    date: row.date ? String(row.date) : undefined,
    venueName: row.venue ? String(row.venue) : undefined,
    description: row.description ? String(row.description) : undefined,
    published: Boolean(row.published),
    homeImageUrl: row.home_image_url ? String(row.home_image_url) : undefined,
    sortOrder:
      typeof row.sort_order === "number" ? row.sort_order : undefined,
  };
}

function mapDiscographyRow(row: Record<string, unknown>): DiscographyReadModel {
  return {
    id: rowId(row, "discography"),
    title: String(row.title ?? ""),
    releaseDate: row.release_date ? String(row.release_date) : undefined,
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : undefined,
    published: Boolean(row.published),
    sortOrder:
      typeof row.sort_order === "number" ? row.sort_order : undefined,
  };
}

function mapLinkRow(row: Record<string, unknown>): LinkReadModel {
  return {
    id: rowId(row, "link"),
    label: String(row.label ?? ""),
    url: String(row.url ?? ""),
    sortOrder:
      typeof row.sort_order === "number" ? row.sort_order : undefined,
    published: Boolean(row.published),
  };
}

function mapNewsRow(row: Record<string, unknown>): NewsReadModel {
  return {
    id: rowId(row, "news"),
    title: String(row.title ?? ""),
    body: row.body ? String(row.body) : undefined,
    published: Boolean(row.published),
    publishedAt: row.published_at ? String(row.published_at) : undefined,
  };
}

export function createSupabaseReadOnlyDataAdapter(
  url: string,
  anonKey: string,
): ReadOnlyDataAdapter {
  const client = getStagingSupabaseClient(url, anonKey);

  return {
    provider: "supabase",
    connectedToRuntime: true,
    productionReady: false,
    canWrite: false,
    async getProfile() {
      const { data, error } = await client
        .from("profile")
        .select(PROFILE_SELECT)
        .limit(PROFILE_LIMIT);
      if (error) throw error;
      const row = (data?.[0] ?? null) as Record<string, unknown> | null;
      return row ? mapProfileRow(row) : null;
    },
    async listSchedules() {
      const { data, error } = await client
        .from("schedules")
        .select(SCHEDULE_SELECT)
        .eq("published", true)
        .order("date", { ascending: true })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapScheduleRow);
    },
    async listDiscography() {
      const { data, error } = await client
        .from("discography")
        .select(DISCOGRAPHY_SELECT)
        .eq("published", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapDiscographyRow);
    },
    async listLinks() {
      const { data, error } = await client
        .from("links")
        .select(LINKS_SELECT)
        .eq("published", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapLinkRow);
    },
    async listNews() {
      const { data, error } = await client
        .from("news")
        .select(NEWS_SELECT)
        .eq("published", true)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(LIST_LIMIT);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapNewsRow);
    },
  };
}
