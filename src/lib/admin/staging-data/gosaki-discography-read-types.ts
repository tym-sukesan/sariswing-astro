/**
 * G-15a — Gosaki discography admin read models (staging Supabase SELECT only).
 */

export const G15A_PHASE = "G-15a-gosaki-discography-admin-supabase-read-binding";

export const GOSAKI_DISCOGRAPHY_EXPECTED_LEGACY_IDS = [
  "discography-001",
  "discography-002",
  "discography-003",
  "discography-004",
] as const;

export const GOSAKI_DISCOGRAPHY_PREVIEW_PATH = "discography/";

export const GOSAKI_DISCOGRAPHY_SITE_SLUG = "gosaki-piano";

export interface GosakiDiscographyTrackRecord {
  track_number: number;
  title: string;
  sort_order: number | null;
}

export interface GosakiDiscographyRecord {
  id: string;
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
  sort_order: number | null;
  published: boolean | null;
  updated_at: string | null;
  tracks: GosakiDiscographyTrackRecord[];
}

export type GosakiDiscographyReadSource = "supabase" | "unavailable";
